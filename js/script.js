const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const imageExtensionPattern = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
const folderImageCache = new Map();

window.addEventListener("DOMContentLoaded", async () => {
  await hydrateDynamicMedia();
  setupMobileMenu();
  setupDressCodeModal();

  if (!window.gsap || !window.ScrollTrigger || prefersReducedMotion) {
    document.documentElement.classList.add("is-static-ready");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "none" });

  prepareTypewriter();
  setupInitialStates();
  setupHeroScene();
  setupInvitationScene();
  setupCardScene();
  setupDateScene();
  setupStoryScene();
  setupGalleryScene();
  setupFinalScene();

  ScrollTrigger.refresh();
});

async function hydrateDynamicMedia() {
  await Promise.all([
    hydrateStoryImages(),
    hydrateGalleryImages()
  ]);
}

async function hydrateStoryImages() {
  const miguelImage = document.querySelector("[data-story-role='miguel']");
  const leticiaImage = document.querySelector("[data-story-role='leticia']");
  const compact = window.matchMedia("(max-width: 980px)").matches;

  if (!miguelImage || !leticiaImage) return;

  if (compact && miguelImage.dataset.mobileSrc && leticiaImage.dataset.mobileSrc) {
    miguelImage.src = miguelImage.dataset.mobileSrc;
    leticiaImage.src = leticiaImage.dataset.mobileSrc;
    return;
  }

  const folders = [
    "assets/images/miguel-leticia/"
  ];

  for (const folder of folders) {
    const images = await listImagesFromFolder(folder);

    if (images.length < 2) continue;

    const picked = pickStoryImages(images);

    if (!picked.miguel || !picked.leticia) continue;

    miguelImage.src = picked.miguel;
    leticiaImage.src = picked.leticia;
    break;
  }
}

async function hydrateGalleryImages() {
  const scene = document.querySelector("[data-scene='gallery']");
  const track = scene?.querySelector("[data-layer='gallery-track']");
  const folder = scene?.dataset.galleryFolder;
  const manifest = scene?.dataset.galleryManifest;

  if (!scene || !track || track.children.length || !folder) return;

  const images = await getGalleryImages(folder, manifest);

  if (!images.length) return;

  track.textContent = "";

  images.forEach((src, index) => {
    const figure = document.createElement("figure");
    const image = document.createElement("img");

    figure.className = "gallery-item gallery-item-standard";
    image.src = src;
    image.alt = readableImageName(src);
    image.loading = index > 2 ? "lazy" : "eager";
    image.decoding = "async";
    image.addEventListener("error", () => {
      figure.remove();
      window.ScrollTrigger?.refresh();
    });
    image.addEventListener("load", () => window.ScrollTrigger?.refresh(), { once: true });

    figure.appendChild(image);
    track.appendChild(figure);
  });
}

async function getGalleryImages(folder, manifest) {
  const folderImages = await listImagesFromFolder(folder);

  if (folderImages.length) return folderImages;

  return listImagesFromManifest(manifest, folder);
}

async function listImagesFromFolder(folder) {
  const normalizedFolder = folder.endsWith("/") ? folder : `${folder}/`;

  if (folderImageCache.has(normalizedFolder)) {
    return folderImageCache.get(normalizedFolder);
  }

  try {
    const response = await fetch(normalizedFolder, { cache: "no-store" });

    if (!response.ok) {
      folderImageCache.set(normalizedFolder, []);
      return [];
    }

    const html = await response.text();
    const parser = new DOMParser();
    const documentList = parser.parseFromString(html, "text/html");
    const folderUrl = new URL(normalizedFolder, window.location.href);
    const seen = new Set();
    const images = preferModernImages(Array.from(documentList.querySelectorAll("a"))
      .map((link) => link.getAttribute("href"))
      .filter(Boolean)
      .map((href) => new URL(href, folderUrl))
      .filter((url) => {
        const isSameFolder = url.pathname.startsWith(folderUrl.pathname);
        const isImage = imageExtensionPattern.test(decodeURIComponent(url.pathname));

        if (!isSameFolder || !isImage || seen.has(url.href)) return false;

        seen.add(url.href);
        return true;
      })
      .map((url) => url.pathname)
      .sort((a, b) => decodeURIComponent(a).localeCompare(decodeURIComponent(b), "pt-BR", { numeric: true })));

    folderImageCache.set(normalizedFolder, images);
    return images;
  } catch (error) {
    folderImageCache.set(normalizedFolder, []);
    return [];
  }
}

async function listImagesFromManifest(manifest, folder) {
  if (!manifest) return [];

  try {
    const response = await fetch(manifest, { cache: "no-store" });

    if (!response.ok) return [];

    const filenames = await response.json();
    const folderUrl = new URL(folder.endsWith("/") ? folder : `${folder}/`, window.location.href);
    const seen = new Set();

    return preferModernImages(filenames
      .filter((filename) => typeof filename === "string" && imageExtensionPattern.test(filename))
      .map((filename) => new URL(filename, folderUrl))
      .filter((url) => {
        if (seen.has(url.href)) return false;

        seen.add(url.href);
        return true;
      })
      .map((url) => url.pathname));
  } catch (error) {
    return [];
  }
}

function preferModernImages(images) {
  const byBaseName = new Map();
  const priority = { ".avif": 4, ".webp": 3, ".jpg": 2, ".jpeg": 2, ".png": 1, ".gif": 0 };

  for (const src of images) {
    const decoded = decodeURIComponent(src);
    const extension = (decoded.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
    const baseName = decoded.replace(/\.[^.]+$/, "");
    const current = byBaseName.get(baseName);

    if (!current || (priority[extension] || 0) > (priority[current.extension] || 0)) {
      byBaseName.set(baseName, { src, extension });
    }
  }

  return [...byBaseName.values()]
    .map((image) => image.src)
    .sort((a, b) => decodeURIComponent(a).localeCompare(decodeURIComponent(b), "pt-BR", { numeric: true }));
}

function pickStoryImages(images) {
  const normalized = images.map((src) => ({
    src,
    key: readableImageName(src).toLowerCase()
  }));
  const miguel =
    normalized.find((image) => image.key.includes("miguel") && !image.key.includes("leticia")) ||
    normalized.find((image) => image.key.includes("copiar")) ||
    normalized[0];
  const leticia =
    normalized.find((image) => image.key.includes("leticia") && !image.key.includes("miguel")) ||
    normalized.find((image) => image.src !== miguel.src && !image.key.includes("copiar")) ||
    normalized.find((image) => image.src !== miguel.src) ||
    normalized[1];

  return {
    miguel: miguel?.src,
    leticia: leticia?.src
  };
}

function readableImageName(src) {
  const filename = decodeURIComponent(src.split("/").pop() || "Miguel e Letícia");

  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function setupMobileMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const panel = document.querySelector("[data-mobile-menu]");
  const links = panel?.querySelectorAll("a");

  if (!toggle || !panel) return;

  const setOpen = (isOpen) => {
    document.body.classList.toggle("is-mobile-menu-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  };

  toggle.addEventListener("click", () => {
    setOpen(!document.body.classList.contains("is-mobile-menu-open"));
  });

  links?.forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

function setupDressCodeModal() {
  const modal = document.querySelector("#traje-de-convidado");
  const openButtons = document.querySelectorAll("[data-open-dress-code]");
  const closeButtons = modal?.querySelectorAll("[data-close-dress-code]");

  if (!modal || !openButtons.length) return;

  const setOpen = (isOpen) => {
    modal.classList.toggle("is-visible", isOpen);
    modal.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("is-dress-modal-open", isOpen);
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      setOpen(true);
    });
  });

  closeButtons?.forEach((button) => {
    button.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

function prepareTypewriter() {
  const targets = document.querySelectorAll(".copy-line > span, .verse p, .verse cite, .story-copy p");

  targets.forEach((target) => {
    const text = target.textContent;
    target.textContent = "";

    text.split(/(\s+)/).forEach((token) => {
      if (!token) return;

      if (/^\s+$/.test(token)) {
        target.appendChild(document.createTextNode(token));
        return;
      }

      const word = document.createElement("span");
      word.className = "type-word";

      Array.from(token).forEach((character) => {
        const letter = document.createElement("span");
        letter.className = "type-char";
        letter.textContent = character;
        word.appendChild(letter);
      });

      target.appendChild(word);
    });
  });
}

function setupInitialStates() {
  gsap.set("[data-layer='hero-media'], [data-layer='hero-shade'], [data-layer='hero-nav']", { autoAlpha: 1 });
  gsap.set("[data-layer='hero-mark-stage']", {
    xPercent: -50,
    yPercent: -50,
    x: 0,
    y: 0,
    scale: 1,
    transformOrigin: "center center"
  });
  gsap.set("[data-layer='hero-couple-name']", { autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)" });
  gsap.set("[data-layer='hero-monogram']", { autoAlpha: 0, scale: 0.58, filter: "blur(3px)" });
  gsap.set("[data-layer='hero-white-wash']", { autoAlpha: 0 });
  gsap.set(".type-char", { autoAlpha: 0, y: "0.38em" });
  gsap.set("[data-reveal-title] span", { y: 12, autoAlpha: 0 });
  gsap.set("[data-layer='verse']", { autoAlpha: 1, y: 0 });
  gsap.set("[data-layer='verse'] cite", { borderBottomColor: "rgba(21, 20, 19, 0)" });
  gsap.set("[data-layer='card-frame']", { autoAlpha: 1 });
  gsap.set("[data-layer='card-content']", { autoAlpha: 0 });
  gsap.set("[data-layer='card-photo']", { clipPath: "inset(36% 18% 36% 18%)" });
  gsap.set("[data-card-line='top'], [data-card-line='bottom']", { scaleX: 0 });
  gsap.set("[data-card-line='left'], [data-card-line='right']", { scaleY: 0 });
  gsap.set("[data-layer='card-photo'] img", { yPercent: -5 });
  gsap.set("[data-layer='card-photo'] figcaption", { autoAlpha: 0, y: 12 });
  gsap.set("[data-layer='card-link']", { autoAlpha: 0, y: 18 });
  gsap.set("[data-layer='date-left']", {
    xPercent: -50,
    yPercent: -50,
    x: "8rem",
    autoAlpha: 0,
    clipPath: "inset(0 100% 0 0)"
  });
  gsap.set("[data-layer='date-right']", {
    xPercent: -50,
    yPercent: -50,
    x: "8rem",
    autoAlpha: 0,
    clipPath: "inset(0 0 0 100%)"
  });
  gsap.set("[data-layer='date-divider']", { scaleY: 0, transformOrigin: "center center" });
  gsap.set("[data-layer='story-left']", {
    xPercent: -50,
    yPercent: -50,
    x: 0,
    y: 0,
    scale: 1,
    autoAlpha: 0
  });
  gsap.set("[data-layer='story-right']", {
    xPercent: -50,
    yPercent: -50,
    x: 0,
    y: 0,
    scale: 1,
    autoAlpha: 0
  });
  gsap.set(".story-copy", { autoAlpha: 1, x: 0, y: 0 });
  gsap.set(".story-copy p", { autoAlpha: 1, y: 0 });
  gsap.set("[data-layer='story-photo-left']", { yPercent: 5 });
  gsap.set("[data-layer='story-photo-right']", { yPercent: -5 });
  gsap.set("[data-final-line='top'], [data-final-line='bottom']", { scaleX: 0, transformOrigin: "center center" });
  gsap.set("[data-final-line='left'], [data-final-line='right']", { scaleY: 0, transformOrigin: "center center" });
  gsap.set("[data-layer='final-text']", { autoAlpha: 0, y: 8, letterSpacing: "0.08em" });
}

function setupHeroScene() {
  const scene = document.querySelector("[data-scene='hero']");
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top top",
      end: "+=330%",
      scrub: 0.9,
      pin: true,
      anticipatePin: 1
    }
  });

  timeline
    .to("[data-layer='hero-nav']", { y: -14, autoAlpha: 0, duration: 0.2 }, 0.05)
    .to("[data-layer='hero-couple-name']", {
      autoAlpha: 0,
      scale: 0.94,
      y: -6,
      filter: "blur(4px)",
      duration: 0.24,
      ease: "power1.out"
    }, 0.12)
    .to("[data-layer='hero-monogram']", {
      autoAlpha: 0.96,
      scale: 1.08,
      filter: "blur(0px)",
      duration: 0.3,
      ease: "power1.out"
    }, 0.2)
    .to("[data-layer='hero-media']", { scale: 1.08, autoAlpha: 0.58, duration: 0.52, ease: "power1.out" }, 0.3)
    .to("[data-layer='hero-shade']", { autoAlpha: 0.08, duration: 0.38, ease: "power1.out" }, 0.36)
    .to("[data-layer='hero-mark-stage']", { scale: 46, duration: 0.82, ease: "power1.inOut" }, 0.36)
    .to("[data-layer='hero-white-wash']", { autoAlpha: 1, duration: 0.22, ease: "power1.inOut" }, 0.9)
    .to("[data-layer='hero-media'], [data-layer='hero-shade']", { autoAlpha: 0, duration: 0.18 }, 0.93)
    .to("[data-layer='hero-monogram']", { autoAlpha: 0, duration: 0.12 }, 0.98);
}

function setupInvitationScene() {
  const scene = document.querySelector("[data-scene='invitation']");
  const copyChars = scene.querySelectorAll(".invitation-copy .type-char");
  const verseChars = scene.querySelectorAll(".verse p .type-char");
  const citeChars = scene.querySelectorAll(".verse cite .type-char");

  const entrance = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top 50%",
      end: "top -80%",
      scrub: 0.96
    }
  });

  entrance
    .fromTo("[data-layer='invitation-copy']", { y: 24, scale: 1.035 }, { y: 0, scale: 1, duration: 1.18 }, 0.22)
    .to(copyChars, { autoAlpha: 1, y: 0, stagger: 0.0105, duration: 0.04, ease: "power1.out" }, 0.52)
    .to(verseChars, { autoAlpha: 1, y: 0, stagger: 0.0155, duration: 0.045, ease: "power1.out" }, 2.96)
    .to(citeChars, { autoAlpha: 1, y: 0, stagger: 0.021, duration: 0.045, ease: "power1.out" }, 3.68)
    .to("[data-layer='verse'] cite", { borderBottomColor: "rgba(21, 20, 19, 0.86)", duration: 0.12 }, 3.88);

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top top",
      end: "+=120%",
      scrub: 0.9,
      pin: true,
      anticipatePin: 1
    }
  });

  timeline
    .to("[data-layer='invitation-copy']", { scale: 0.978, autoAlpha: 0.68, duration: 0.34 }, 0.68);
}

function setupCardScene() {
  const scene = document.querySelector("[data-scene='card']");
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top top",
      end: "+=122%",
      scrub: 0.86,
      pin: true,
      anticipatePin: 1
    }
  });

  timeline
    .to("[data-card-line='bottom']", { scaleX: 1, duration: 0.2 }, 0.03)
    .to("[data-card-line='left'], [data-card-line='right']", { scaleY: 1, duration: 0.28 }, 0.2)
    .to("[data-card-line='top']", { scaleX: 1, duration: 0.22 }, 0.46)
    .to("[data-layer='card-content']", { autoAlpha: 1, duration: 0.16 }, 0.18)
    .to("[data-layer='card-photo']", { clipPath: "inset(0% 0% 0% 0%)", duration: 0.46 }, 0.28)
    .to("[data-layer='card-photo'] img", { yPercent: 5, duration: 0.82 }, 0.26)
    .to("[data-layer='card-photo'] figcaption", { y: 0, autoAlpha: 1, duration: 0.28 }, 0.66)
    .to("[data-layer='card-link']", { autoAlpha: 1, y: 0, duration: 0.22 }, 0.82)
    .to("[data-layer='card-frame']", { y: -14, duration: 0.24 }, 1.02);
}

function setupDateScene() {
  const scene = document.querySelector("[data-scene='date']");
  const compact = window.matchMedia("(max-width: 980px)").matches;

  if (compact) {
    gsap.set("[data-layer='date-left'], [data-layer='date-right']", {
      xPercent: 0,
      yPercent: 0,
      x: 0,
      y: 0,
      autoAlpha: 0,
      clipPath: "inset(0 0 100% 0)"
    });
    gsap.set("[data-layer='date-divider']", {
      scaleX: 0,
      scaleY: 1,
      transformOrigin: "center center"
    });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: "top top",
        end: "+=105%",
        scrub: 0.76,
        pin: true,
        anticipatePin: 1
      }
    });

    timeline
      .to("[data-layer='date-left']", { autoAlpha: 1, clipPath: "inset(0 0 0% 0)", duration: 0.3 }, 0.08)
      .to("[data-layer='date-divider']", { scaleX: 1, duration: 0.24 }, 0.48)
      .to("[data-layer='date-right']", { autoAlpha: 1, clipPath: "inset(0 0 0% 0)", duration: 0.3 }, 0.78)
      .to("[data-layer='date-row']", { y: -10, duration: 0.24 }, 1.08);

    return;
  }

  const dateRest = compact ? "-5.6rem" : "-10.4rem";
  const timeStart = compact ? "8rem" : "13.4rem";
  const timeRest = compact ? "5.6rem" : "10.4rem";

  gsap.set("[data-layer='date-left']", { x: compact ? "5.6rem" : "8rem" });
  gsap.set("[data-layer='date-right']", { x: timeStart });

  const entrance = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top 92%",
      end: "top 42%",
      scrub: 0.62
    }
  });

  entrance.to("[data-layer='date-left']", { autoAlpha: 1, clipPath: "inset(0 0% 0 0)", x: 0, duration: 0.36 }, 0);

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top top",
      end: "+=126%",
      scrub: 0.78,
      pin: true,
      anticipatePin: 1
    }
  });

  timeline
    .to("[data-layer='date-left']", { letterSpacing: "0.13em", duration: 0.16 }, 0.08)
    .to("[data-layer='date-left']", { x: dateRest, duration: 0.32 }, 0.44)
    .to("[data-layer='date-divider']", { scaleY: 1, duration: 0.22 }, 0.76)
    .to("[data-layer='date-right']", { autoAlpha: 1, clipPath: "inset(0 0 0 0%)", duration: 0.26 }, 1.02)
    .to("[data-layer='date-right']", { x: timeRest, letterSpacing: "0.11em", duration: 0.24 }, 1.13);
}

function setupStoryScene() {
  const scene = document.querySelector("[data-scene='story']");
  const titles = scene.querySelectorAll("[data-reveal-title] span");
  const compact = window.matchMedia("(max-width: 980px)").matches;
  const pedroChars = scene.querySelectorAll("[data-layer='story-left'] .story-copy p .type-char");
  const maynaraChars = scene.querySelectorAll("[data-layer='story-right'] .story-copy p .type-char");

  if (compact) {
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: "top top",
        end: "+=500%",
        scrub: 0.96,
        pin: true,
        anticipatePin: 1
      }
    });

    timeline
      .to("[data-layer='story-left']", { autoAlpha: 1, x: 0, y: -42, scale: 1, duration: 0.36 }, 0)
      .to("[data-layer='story-photo-left']", { yPercent: 0, duration: 0.76 }, 0)
      .to(titles[0], { y: 0, autoAlpha: 1, duration: 0.2 }, 0.2)
      .to(pedroChars, { autoAlpha: 1, y: 0, stagger: 0.0062, duration: 0.04, ease: "power1.out" }, 0.52)
      .to("[data-layer='story-left']", { autoAlpha: 0, y: -72, duration: 0.32 }, 2.9)
      .to("[data-layer='story-right']", { autoAlpha: 1, x: 0, y: -34, scale: 1, duration: 0.36 }, 3.22)
      .to("[data-layer='story-photo-right']", { yPercent: 0, duration: 0.76 }, 3.22)
      .to(titles[1], { y: 0, autoAlpha: 1, duration: 0.2 }, 3.44)
      .to(maynaraChars, { autoAlpha: 1, y: 0, stagger: 0.0062, duration: 0.04, ease: "power1.out" }, 3.74)
      .to("[data-layer='story-right']", { autoAlpha: 0, y: -66, duration: 0.32 }, 6.14)
      .to(".story-copy", { autoAlpha: 1, x: 0, y: 0, duration: 0.18 }, 6.48)
      .to(titles, { autoAlpha: 1, y: 0, duration: 0.18 }, 6.48)
      .to(".story-copy p", {
        autoAlpha: 0.92,
        y: 0,
        fontSize: "0.76rem",
        lineHeight: 1.5,
        marginBottom: "0.72rem",
        duration: 0.18
      }, 6.5)
      .to("[data-layer='story-left']", {
        x: 0,
        y: -180,
        xPercent: -50,
        yPercent: -50,
        scale: 0.75,
        autoAlpha: 1,
        duration: 0.4
      }, 6.6)
      .to("[data-layer='story-right']", {
        x: 0,
        y: 164,
        xPercent: -50,
        yPercent: -50,
        scale: 0.75,
        autoAlpha: 1,
        duration: 0.4
      }, 6.6)
      .to("[data-layer='story-left'], [data-layer='story-right']", { y: "-=10", duration: 0.24 }, 7.22)
      .to("[data-layer='story-left'], [data-layer='story-right']", { autoAlpha: 0, y: "-=44", duration: 0.28 }, 7.62);

    return;
  }

  const pedroSoloX = compact ? 0 : 72;
  const maynaraSoloX = compact ? 0 : 94;
  const finalShift = compact ? 0 : 62;
  const finalOffset = compact ? 104 : 345;
  const finalScale = compact ? 0.66 : 0.76;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top top",
      end: "+=380%",
      scrub: 0.94,
      pin: true,
      anticipatePin: 1
    }
  });

  timeline
    .to("[data-layer='story-left']", { autoAlpha: 1, x: pedroSoloX, duration: 0.36 }, 0)
    .to("[data-layer='story-photo-left']", { yPercent: -2.5, duration: 1.25 }, 0)
    .to(titles[0], { y: 0, autoAlpha: 1, duration: 0.22 }, 0.18)
    .to(pedroChars, { autoAlpha: 1, y: 0, stagger: 0.0037, duration: 0.04, ease: "power1.out" }, 0.42)
    .to("[data-layer='story-left'] .story-copy", { autoAlpha: 1, duration: 0.45 }, 1.92)
    .to("[data-layer='story-left'] .story-copy", { autoAlpha: 0, x: -24, duration: 0.24 }, 2.24)
    .to("[data-layer='story-left']", { x: pedroSoloX - 130, autoAlpha: 0, duration: 0.3 }, 2.38)
    .to("[data-layer='story-right']", { autoAlpha: 1, x: maynaraSoloX, duration: 0.38 }, 2.68)
    .to("[data-layer='story-photo-right']", { yPercent: 2.5, duration: 1.18 }, 2.68)
    .to(titles[1], { y: 0, autoAlpha: 1, duration: 0.22 }, 2.9)
    .to(maynaraChars, { autoAlpha: 1, y: 0, stagger: 0.0037, duration: 0.04, ease: "power1.out" }, 3.14)
    .to("[data-layer='story-right'] .story-copy", { autoAlpha: 1, duration: 0.45 }, 4.62)
    .to(".story-copy", { autoAlpha: 1, x: 0, y: 0, duration: 0.22 }, 5.02)
    .to(titles, { autoAlpha: 1, y: 0, duration: 0.2 }, 5.02)
    .to(".story-copy p", { autoAlpha: 0.9, y: 0, duration: 0.24 }, 5.06)
    .to("[data-layer='story-left']", {
      x: finalShift - finalOffset,
      y: 0,
      xPercent: -50,
      yPercent: -50,
      scale: finalScale,
      autoAlpha: 1,
      duration: 0.44
    }, 5.1)
    .to("[data-layer='story-right']", {
      x: finalShift + finalOffset,
      y: 0,
      xPercent: -50,
      yPercent: -50,
      scale: finalScale,
      duration: 0.44
    }, 5.1)
    .to("[data-layer='story-left'], [data-layer='story-right']", { y: -10, duration: 0.24 }, 6.0)
    .to("[data-layer='story-left'], [data-layer='story-right']", { autoAlpha: 0, y: -54, duration: 0.28 }, 6.42);
}

function setupGalleryScene() {
  const scene = document.querySelector("[data-scene='gallery']");
  const track = scene.querySelector("[data-layer='gallery-track']");
  const images = scene.querySelectorAll(".gallery-item img");

  if (!track || !images.length) return;

  const getTravel = () => -Math.max(track.scrollWidth - window.innerWidth + window.innerWidth * 0.12, 0);

  gsap.to(track, {
    x: getTravel,
    scrollTrigger: {
      trigger: scene,
      start: "top top",
      end: () => `+=${Math.max(track.scrollWidth * 0.72, window.innerWidth * 1.35)}`,
      scrub: 1.18,
      pin: true,
      invalidateOnRefresh: true,
      anticipatePin: 1
    }
  });

  images.forEach((image, index) => {
    const direction = index % 2 === 0 ? 1 : -1;

    gsap.fromTo(
      image,
      {
        xPercent: direction * -2.4,
        yPercent: index % 3 === 0 ? -1.6 : 1.6,
        scale: 1.04
      },
      {
        xPercent: direction * 2.4,
        yPercent: index % 3 === 0 ? 1.6 : -1.6,
        scale: 1.055,
        scrollTrigger: {
          trigger: scene,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.45
        }
      }
    );
  });
}

function setupFinalScene() {
  const scene = document.querySelector("[data-scene='final']");
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top top",
      end: "+=72%",
      scrub: 0.75,
      pin: true,
      anticipatePin: 1
    }
  });

  timeline
    .fromTo(scene, { backgroundColor: "#fbfff9" }, { backgroundColor: "#a8dcab", duration: 0.3 }, 0)
    .to("[data-final-line='top'], [data-final-line='bottom']", { scaleX: 1, duration: 0.28 }, 0.18)
    .to("[data-final-line='left'], [data-final-line='right']", { scaleY: 1, duration: 0.28 }, 0.34)
    .to("[data-layer='final-text']", { autoAlpha: 1, y: 0, letterSpacing: "0.01em", duration: 0.32 }, 0.54);
}
