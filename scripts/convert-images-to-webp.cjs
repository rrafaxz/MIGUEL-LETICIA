const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

function conversionTargets(folder, max, quality) {
  if (!fs.existsSync(folder)) return [];

  return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(folder, entry.name);

    if (entry.isDirectory()) {
      return conversionTargets(fullPath, max, quality);
    }

    if (!/\.(jpe?g|png)$/i.test(entry.name)) {
      return [];
    }

    return {
      input: fullPath,
      output: fullPath.replace(/\.[^.]+$/, ".webp"),
      max,
      quality,
    };
  });
}

const files = [
  ...conversionTargets("assets/images/miguel-leticia", 2200, 0.82),
  ...conversionTargets("assets/images/gallery", 2200, 0.78),
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
