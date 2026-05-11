const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const files = [
  {
    input: "assets/images/hologram/holograma.png",
    output: "assets/images/hologram/holograma.webp",
    max: 900,
    quality: 0.86,
  },
  {
    input: "assets/images/hologram/holograma-versao-2.png",
    output: "assets/images/hologram/holograma-versao-2.webp",
    max: 700,
    quality: 0.86,
  },
  {
    input: "assets/images/section-1/foto-secao-1.png",
    output: "assets/images/section-1/foto-secao-1.webp",
    max: 2560,
    quality: 0.82,
  },
  {
    input: "assets/images/section-3/oziom-space.png",
    output: "assets/images/section-3/oziom-space.webp",
    max: 1400,
    quality: 0.82,
  },
  {
    input: "assets/images/section-5/Camada 3.png",
    output: "assets/images/section-5/Camada 3.webp",
    max: 1200,
    quality: 0.86,
  },
  {
    input: "assets/images/section-5/Camada 3 copiar.png",
    output: "assets/images/section-5/Camada 3 copiar.webp",
    max: 1200,
    quality: 0.86,
  },
  {
    input: "assets/images/section-5/mobile/Camada 3.png",
    output: "assets/images/section-5/mobile/Camada 3.webp",
    max: 900,
    quality: 0.86,
  },
  {
    input: "assets/images/section-5/mobile/Camada 3 copiar.png",
    output: "assets/images/section-5/mobile/Camada 3 copiar.webp",
    max: 900,
    quality: 0.86,
  },
  ...fs
    .readdirSync("assets/images/gallery")
    .filter((name) => /\.(jpe?g|png)$/i.test(name))
    .map((name) => ({
      input: `assets/images/gallery/${name}`,
      output: `assets/images/gallery/${name.replace(/\.[^.]+$/, ".webp")}`,
      max: 2200,
      quality: 0.78,
    })),
];

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();

  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";

  return "application/octet-stream";
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();
  await page.setContent("<!doctype html><html><body></body></html>");

  for (const item of files) {
    if (!fs.existsSync(item.input)) continue;

    console.log(`Converting ${item.input}`);
    const before = fs.statSync(item.input).size;
    const dataUrl = `data:${mimeFor(item.input)};base64,${fs
      .readFileSync(item.input)
      .toString("base64")}`;

    const webpDataUrl = await page.evaluate(async ({ dataUrl, max, quality }) => {
      const img = new Image();
      const loaded = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Image failed to load"));
      });

      img.decoding = "async";
      img.src = dataUrl;
      await loaded;

      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.max(1, Math.round(img.naturalWidth * scale));
      const height = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: true });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      return canvas.toDataURL("image/webp", quality);
    }, { ...item, dataUrl });

    const base64 = webpDataUrl.replace(/^data:image\/webp;base64,/, "");
    fs.mkdirSync(path.dirname(item.output), { recursive: true });
    fs.writeFileSync(item.output, Buffer.from(base64, "base64"));

    const after = fs.statSync(item.output).size;
    console.log(
      `${item.input} -> ${item.output} ${Math.round(before / 1024)}KB -> ${Math.round(
        after / 1024,
      )}KB`,
    );
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
