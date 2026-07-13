const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const imageExtensionPattern = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
const folderImageCache = new Map();

window.addEventListener("DOMContentLoaded", async () => {
  await hydrateDynamicMedia();
  setupMobileMenu();
  setupDressCodeModal();

  if (!window.gsap || !window.ScrollTrigger || prefersReducedMotion) {
    setupStaticFrameSequences();
    document.documentElement.classList.add("is-static-ready");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "none" });

  setupInitialStates();
  setupHeroScene();
  setupInvitationScene();
  setupCardScene();
  setupDateScene();
  setupFrameSequenceScene();
  setupGalleryScene();
  setupFinalScene();

  ScrollTrigger.refresh();
});

async function hydrateDynamicMedia() {
  await Promise.all([
    hydrateGalleryImages()
  ]);
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

    figure.className = `gallery-item gallery-item-${(index % 6) + 1}`;
    figure.dataset.galleryItem = "";
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

function setupInitialStates() {
  gsap.set("[data-layer='hero-media'], [data-layer='hero-shade'], [data-layer='hero-nav']", { autoAlpha: 1 });
  gsap.set("[data-layer='hero-mark-stage']", {
    xPercent: -50,
    yPercent: -50,
    x: 0,
    y: 0,
    transformOrigin: "center center"
  });
  gsap.set("[data-layer='hero-couple-name']", { autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)" });
  gsap.set("[data-layer='hero-monogram']", { autoAlpha: 0 });
  gsap.set("[data-layer='hero-white-wash']", { autoAlpha: 0 });
  gsap.set("[data-reveal-line]", { autoAlpha: 0, y: 18, filter: "blur(14px)" });
  gsap.set("[data-reveal-title] span", { y: 12, autoAlpha: 0 });
  gsap.set("[data-layer='verse'] p, [data-layer='verse'] cite", { autoAlpha: 0, y: 16, filter: "blur(12px)" });
  gsap.set("[data-layer='verse']", { autoAlpha: 1, y: 0, filter: "blur(0px)" });
  gsap.set("[data-layer='verse'] cite", { borderBottomColor: "rgba(21, 20, 19, 0)" });
  gsap.set("[data-layer='card-photo']", { autoAlpha: 0, scale: 1.08, filter: "blur(22px)" });
  gsap.set("[data-layer='card-photo'] img", { yPercent: -7, scale: 1.06 });
  gsap.set("[data-layer='venue-shade']", { autoAlpha: 0 });
  gsap.set("[data-layer='card-content']", { autoAlpha: 0, y: 28, filter: "blur(16px)" });
  gsap.set("[data-layer='card-link']", { autoAlpha: 0, y: 16, filter: "blur(10px)" });
  gsap.set("[data-layer='date-left']", {
    x: 0,
    y: 18,
    autoAlpha: 0,
    filter: "blur(18px)"
  });
  gsap.set("[data-layer='date-right']", {
    x: 0,
    y: 18,
    autoAlpha: 0,
    filter: "blur(18px)"
  });
  gsap.set("[data-layer='date-note']", { autoAlpha: 0, y: 18, filter: "blur(12px)" });
  gsap.set("[data-final-line='top'], [data-final-line='bottom']", { scaleX: 0, transformOrigin: "center center" });
  gsap.set("[data-final-line='left'], [data-final-line='right']", { scaleY: 0, transformOrigin: "center center" });
  gsap.set("[data-layer='final-text']", { autoAlpha: 0, y: 8, letterSpacing: "0.08em" });
  gsap.set("[data-layer='frame-cta']", {
    xPercent: -50,
    yPercent: -50,
    y: 18,
    scale: 0.96,
    autoAlpha: 0,
    pointerEvents: "none"
  });
}

function setupHeroScene() {
  const scene = document.querySelector("[data-scene='hero']");
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top top",
      end: "+=175%",
      scrub: 0.36,
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
      autoAlpha: 1,
      duration: 0.24,
      ease: "power1.out"
    }, 0.2)
    .to("[data-layer='hero-media']", { scale: 1.07, duration: 0.58, ease: "power1.out" }, 0.26)
    .to("[data-layer='hero-mark-stage']", { width: "10000vmax", duration: 0.58, ease: "power1.inOut" }, 0.28)
    .to("[data-layer='hero-white-wash']", { autoAlpha: 1, duration: 0.1, ease: "power1.inOut" }, 0.9)
    .to("[data-layer='hero-media'], [data-layer='hero-shade']", { autoAlpha: 0, duration: 0.08 }, 0.92)
    .to("[data-layer='hero-monogram']", { autoAlpha: 0, duration: 0.05 }, 0.98);
}

function setupInvitationScene() {
  const scene = document.querySelector("[data-scene='invitation']");
  const copyLines = scene.querySelectorAll(".invitation-copy [data-reveal-line]");
  const verseLine = scene.querySelector(".verse p");
  const citeLine = scene.querySelector(".verse cite");

  const entrance = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top 88%",
      end: "top -48%",
      scrub: 0.68
    }
  });

  entrance
    .fromTo("[data-layer='invitation-copy']", {
      y: 24,
      scale: 1.035,
      filter: "blur(12px)"
    }, {
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      duration: 0.48
    }, 0.02);

  copyLines.forEach((line, index) => {
    entrance.to(line, {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.2,
      ease: "power1.out"
    }, 0.12 + index * 0.32);
  });

  entrance
    .to(verseLine, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.24, ease: "power1.out" }, 1.86)
    .to(citeLine, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.2, ease: "power1.out" }, 2.18)
    .to(citeLine, { borderBottomColor: "rgba(21, 20, 19, 0.86)", duration: 0.1 }, 2.28);

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
    .to("[data-layer='invitation-copy'], [data-layer='verse']", { scale: 0.982, autoAlpha: 0.72, filter: "blur(4px)", duration: 0.34 }, 0.68);
}

function setupCardScene() {
  const scene = document.querySelector("[data-scene='card']");
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top top",
      end: "+=480%",
      scrub: 0.9,
      pin: true,
      anticipatePin: 1
    }
  });

  timeline
    .to("[data-layer='card-photo']", { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.42, ease: "power1.out" }, 0)
    .to("[data-layer='card-photo'] img", { yPercent: 14, scale: 1.2, duration: 4.8, ease: "none" }, 0)
    .to("[data-layer='venue-shade']", { autoAlpha: 1, duration: 0.3 }, 0.14)
    .to("[data-layer='card-content']", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.36, ease: "power1.out" }, 0.46)
    .to("[data-layer='card-link']", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.22 }, 0.72)
    .to("[data-layer='card-content']", { y: -32, autoAlpha: 0, filter: "blur(10px)", duration: 0.34 }, 4.02)
    .to("[data-layer='card-photo']", { autoAlpha: 0.58, filter: "blur(7px)", duration: 0.26 }, 4.22);
}

function setupDateScene() {
  const scene = document.querySelector("[data-scene='date']");

  gsap.to("[data-layer='date-left']", {
    autoAlpha: 1,
    y: 0,
    filter: "blur(0px)",
    letterSpacing: "0.11em",
    ease: "none",
    scrollTrigger: {
      trigger: scene,
      start: "top 72%",
      end: "top 18%",
      scrub: 0.86
    }
  });

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top top",
      end: "+=270%",
      scrub: 0.82,
      pin: true,
      anticipatePin: 1
    }
  });

  timeline
    .to("[data-layer='date-left']", { autoAlpha: 1, y: 0, filter: "blur(0px)", letterSpacing: "0.11em", duration: 0.34 }, 0.06)
    .to("[data-layer='date-left']", { autoAlpha: 0, y: -22, filter: "blur(16px)", duration: 0.3 }, 0.74)
    .to("[data-layer='date-right']", { autoAlpha: 1, y: 0, filter: "blur(0px)", letterSpacing: "0.11em", duration: 0.36 }, 1.02)
    .to("[data-layer='date-right']", { autoAlpha: 0, y: -20, filter: "blur(14px)", duration: 0.28 }, 1.66)
    .to("[data-layer='date-note']", { autoAlpha: 1, y: 0, filter: "blur(0px)", letterSpacing: "0.11em", duration: 0.34 }, 1.94)
    .to("[data-layer='date-note']", { autoAlpha: 0, y: -18, filter: "blur(14px)", duration: 0.28 }, 2.52);
}

function setupFrameSequenceScene() {
  document
    .querySelectorAll("[data-scene='frame-sequence']")
    .forEach((scene) => setupScrollFrameSequence(scene));
}

async function setupScrollFrameSequence(scene) {
  const canvas = scene.querySelector("[data-layer='frame-canvas']");
  const cta = scene.querySelector("[data-layer='frame-cta']");
  const progressText = scene.querySelector("[data-layer='frame-progress']");
  const frameCount = Number(scene.dataset.frameCount || 0);
  const framePath = scene.dataset.framePath || "";
  const scrollDistance = Number(scene.dataset.scrollDistance || 3000);

  if (!canvas || !cta || !frameCount || !framePath) return;

  const renderer = createFrameRenderer(canvas);

  const onResize = () => renderer.resize();
  window.addEventListener("resize", onResize, { passive: true });
  renderer.resize();

  try {
    const images = await preloadFrameSequence(frameCount, framePath, (loaded, total) => {
      if (progressText) {
        progressText.textContent = `${Math.round((loaded / total) * 100)}%`;
      }
    });

    renderer.setImages(images);
    renderer.resize();
    renderer.setTargetFrame(0, true);
    scene.classList.add("is-loaded");

    const frameState = { frame: 0 };
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: "top top",
        end: () => `+=${scrollDistance}`,
        scrub: 0.92,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    timeline
      .to(frameState, {
        frame: frameCount - 1,
        duration: 1,
        ease: "none",
        onUpdate: () => renderer.setTargetFrame(frameState.frame)
      }, 0)
      .to(cta, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        pointerEvents: "auto",
        duration: 0.15,
        ease: "power2.out"
      }, 0.85);

    const enlargeCta = () => gsap.to(cta, { scale: 1.025, duration: 0.2, ease: "power2.out" });
    const restoreCta = () => gsap.to(cta, { scale: 1, duration: 0.22, ease: "power2.out" });

    cta.addEventListener("mouseenter", enlargeCta);
    cta.addEventListener("mouseleave", restoreCta);

    window.addEventListener("pagehide", () => {
      cta.removeEventListener("mouseenter", enlargeCta);
      cta.removeEventListener("mouseleave", restoreCta);
      window.removeEventListener("resize", onResize);
      timeline.kill();
      renderer.destroy();
      images.length = 0;
    }, { once: true });

    ScrollTrigger.refresh();
  } catch (error) {
    scene.classList.add("is-loaded");
    if (progressText) progressText.textContent = "Erro";
    window.removeEventListener("resize", onResize);
    renderer.destroy();
  }
}

function setupStaticFrameSequences() {
  document.querySelectorAll("[data-scene='frame-sequence']").forEach(async (scene) => {
    const canvas = scene.querySelector("[data-layer='frame-canvas']");
    const cta = scene.querySelector("[data-layer='frame-cta']");
    const framePath = scene.dataset.framePath || "";

    if (!canvas || !framePath) return;

    try {
      const image = await loadFrameImage(getFrameSource(framePath, 0));
      const renderer = createFrameRenderer(canvas);

      renderer.setImages([image]);
      renderer.resize();
      renderer.setTargetFrame(0, true);
      scene.classList.add("is-loaded");

      if (cta) {
        cta.style.opacity = "1";
        cta.style.visibility = "visible";
        cta.style.pointerEvents = "auto";
      }

      window.addEventListener("resize", () => renderer.resize(), { passive: true });
    } catch (error) {
      scene.classList.add("is-loaded");
    }
  });
}

function createFrameRenderer(canvas) {
  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
  let images = [];
  let currentFrame = 0;
  let targetFrame = 0;
  let lastRenderedFrame = Number.NaN;
  let rafId = 0;
  const smoothing = 0.28;
  const maxFrameStep = 2.25;
  const settleDistance = 0.0025;

  if (!context) {
    return {
      destroy() {},
      resize() {},
      setTargetFrame() {},
      setImages() {}
    };
  }

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    setTargetFrame(targetFrame, true);
  };

  const getDrawMetrics = (image) => {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const scale = Math.min(canvasWidth / image.naturalWidth, canvasHeight / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;

    return {
      canvasHeight,
      canvasWidth,
      drawHeight,
      drawWidth,
      drawX: (canvasWidth - drawWidth) / 2,
      drawY: (canvasHeight - drawHeight) / 2
    };
  };

  const draw = (frameValue) => {
    if (!images.length) return;

    const clampedFrame = Math.max(0, Math.min(images.length - 1, frameValue));
    const lowerIndex = Math.floor(clampedFrame);
    const upperIndex = Math.min(lowerIndex + 1, images.length - 1);
    const blend = clampedFrame - lowerIndex;
    const lowerImage = images[lowerIndex];
    const upperImage = images[upperIndex];

    if (!lowerImage || !upperImage) return;

    const metrics = getDrawMetrics(lowerImage);

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "#fbfff9";
    context.fillRect(0, 0, metrics.canvasWidth, metrics.canvasHeight);
    context.globalAlpha = 1;
    context.drawImage(lowerImage, metrics.drawX, metrics.drawY, metrics.drawWidth, metrics.drawHeight);

    if (blend > 0.001 && upperIndex !== lowerIndex) {
      context.globalAlpha = blend;
      context.drawImage(upperImage, metrics.drawX, metrics.drawY, metrics.drawWidth, metrics.drawHeight);
      context.globalAlpha = 1;
    }

    lastRenderedFrame = clampedFrame;
  };

  function tick() {
    rafId = 0;

    const delta = targetFrame - currentFrame;

    if (Math.abs(delta) <= settleDistance) {
      currentFrame = targetFrame;
    } else {
      const step = Math.min(Math.abs(delta) * smoothing, maxFrameStep);
      currentFrame += Math.sign(delta) * step;
    }

    if (Math.abs(currentFrame - lastRenderedFrame) > 0.001) {
      draw(currentFrame);
    }

    if (Math.abs(targetFrame - currentFrame) > settleDistance) {
      schedule();
    }
  }

  function schedule() {
    if (!rafId) {
      rafId = window.requestAnimationFrame(tick);
    }
  }

  function setTargetFrame(frameIndex, force = false) {
    targetFrame = Math.max(0, Math.min(images.length - 1, frameIndex));

    if (force) {
      currentFrame = targetFrame;
      draw(currentFrame);
      return;
    }

    schedule();
  }

  return {
    resize,
    setTargetFrame,
    setImages(nextImages) {
      images = nextImages;
      currentFrame = 0;
      targetFrame = 0;
      lastRenderedFrame = Number.NaN;
    },
    destroy() {
      if (rafId) window.cancelAnimationFrame(rafId);
      images = [];
    }
  };
}

function preloadFrameSequence(frameCount, framePath, onProgress) {
  let loaded = 0;

  return Promise.all(
    Array.from({ length: frameCount }, (_, index) =>
      loadFrameImage(getFrameSource(framePath, index)).then((image) => {
        loaded += 1;
        onProgress?.(loaded, frameCount);
        return image;
      })
    )
  );
}

function getFrameSource(framePath, index) {
  return `${framePath.replace(/\/$/, "")}/${String(index + 1).padStart(3, "0")}.webp`;
}

function loadFrameImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    image.onload = async () => {
      try {
        if (image.decode) await image.decode();
      } catch (error) {
        // Some browsers reject decode after load; the image is still drawable.
      }
      resolve(image);
    };
    image.onerror = reject;
    image.src = src;
  });
}

function setupGalleryScene() {
  const scene = document.querySelector("[data-scene='gallery']");

  if (!scene) return;

  const items = gsap.utils.toArray(scene.querySelectorAll("[data-gallery-item]"));
  const images = scene.querySelectorAll(".gallery-item img");

  if (!items.length || !images.length) return;

  const compact = window.matchMedia("(max-width: 980px)").matches;
  const layouts = compact
    ? [
        { x: 0, y: -208, rotate: -2.4, scale: 0.88, z: 3 },
        { x: -92, y: -56, rotate: 3.2, scale: 0.72, z: 2 },
        { x: 94, y: -48, rotate: -3.6, scale: 0.75, z: 4 },
        { x: -105, y: 124, rotate: -4.2, scale: 0.74, z: 1 },
        { x: 16, y: 88, rotate: 1.4, scale: 0.84, z: 5 },
        { x: 8, y: 224, rotate: 2.8, scale: 0.82, z: 2 }
      ]
    : [
        { x: -285, y: -155, rotate: -5.4, scale: 0.96, z: 4 },
        { x: -420, y: 82, rotate: 3.8, scale: 0.92, z: 2 },
        { x: -28, y: -8, rotate: -1.2, scale: 1.06, z: 6 },
        { x: 332, y: -150, rotate: 5.2, scale: 0.88, z: 3 },
        { x: 398, y: 108, rotate: -3.4, scale: 0.96, z: 5 },
        { x: 24, y: 222, rotate: 2.6, scale: 0.94, z: 1 }
      ];

  const drift = compact
    ? [
        { x: 0, y: -236, rotate: -4.6, scale: 0.9 },
        { x: -128, y: -68, rotate: 5.8, scale: 0.68 },
        { x: 126, y: -64, rotate: -6.4, scale: 0.71 },
        { x: -134, y: 144, rotate: -6.2, scale: 0.7 },
        { x: 18, y: 78, rotate: 0.2, scale: 0.88 },
        { x: 8, y: 250, rotate: 4.4, scale: 0.78 }
      ]
    : [
        { x: -360, y: -175, rotate: -8.2, scale: 0.94 },
        { x: -480, y: 66, rotate: 6.4, scale: 0.88 },
        { x: -44, y: -18, rotate: -0.4, scale: 1 },
        { x: 396, y: -184, rotate: 7.6, scale: 0.84 },
        { x: 462, y: 82, rotate: -5.8, scale: 0.92 },
        { x: 48, y: 256, rotate: 4.6, scale: 0.9 }
      ];

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: "top top",
      end: () => `+=${Math.max(window.innerHeight * 3.2, 2200)}`,
      scrub: 0.96,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  items.forEach((item, index) => {
    const target = layouts[index % layouts.length];
    const final = drift[index % drift.length];
    const image = item.querySelector("img");
    const entryDelay = index * 0.075;

    gsap.set(item, {
      xPercent: -50,
      yPercent: -50,
      x: compact ? 0 : (index - 2.5) * 8,
      y: compact ? 42 : 28,
      rotate: (index - 2.5) * 1.8,
      scale: 0.62,
      zIndex: target.z,
      autoAlpha: 0,
      filter: "blur(18px)"
    });

    if (image) {
      gsap.set(image, {
        scale: 1.12,
        xPercent: index % 2 === 0 ? -2 : 2,
        yPercent: index % 3 === 0 ? -2 : 2
      });
    }

    timeline
      .to(item, {
        x: target.x,
        y: target.y,
        rotate: target.rotate,
        scale: target.scale,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.74,
        ease: "power2.out"
      }, 0.08 + entryDelay)
      .to(item, {
        x: final.x,
        y: final.y,
        rotate: final.rotate,
        scale: final.scale,
        duration: 1.25,
        ease: "power1.inOut"
      }, 1.05 + index * 0.025)
      .to(item, {
        y: final.y - (compact ? 42 : 64),
        autoAlpha: 0,
        filter: "blur(12px)",
        duration: 0.42,
        ease: "power1.in"
      }, 2.54 + index * 0.035);

    if (image) {
      timeline.to(image, {
        scale: 1.04,
        xPercent: index % 2 === 0 ? 2.8 : -2.8,
        yPercent: index % 3 === 0 ? 2.2 : -2.2,
        duration: 2.46,
        ease: "none"
      }, 0.1);
    }
  });
}

function setupFinalScene() {
  const scene = document.querySelector("[data-scene='final']");

  if (!scene) return;

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
