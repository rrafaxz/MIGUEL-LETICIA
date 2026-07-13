"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ScrollFrameSequence.module.css";

export interface ScrollFrameSequenceProps {
  frameCount: number;
  framePath: string;
  scrollDistance?: number;
}

type FrameRenderer = {
  destroy: () => void;
  resize: () => void;
  setTargetFrame: (frame: number, force?: boolean) => void;
  setImages: (images: HTMLImageElement[]) => void;
};

gsap.registerPlugin(ScrollTrigger);

export function ScrollFrameSequence({
  frameCount,
  framePath,
  scrollDistance = 5200
}: ScrollFrameSequenceProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctaRef = useRef<HTMLAnchorElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const cta = ctaRef.current;

    if (!section || !canvas || !cta) return;

    let disposed = false;
    let timeline: gsap.core.Timeline | null = null;
    let images: HTMLImageElement[] = [];

    const renderer = createFrameRenderer(canvas);
    const frameState = { frame: 0 };
    const handleResize = () => renderer.resize();
    const handleCtaEnter = () => gsap.to(cta, { scale: 1.025, duration: 0.2, ease: "power2.out" });
    const handleCtaLeave = () => gsap.to(cta, { scale: 1, duration: 0.22, ease: "power2.out" });

    renderer.resize();
    window.addEventListener("resize", handleResize, { passive: true });
    cta.addEventListener("mouseenter", handleCtaEnter);
    cta.addEventListener("mouseleave", handleCtaLeave);

    gsap.set(cta, {
      autoAlpha: 0,
      pointerEvents: "none",
      scale: 0.96,
      xPercent: -50,
      y: 18,
      yPercent: -50
    });

    preloadFrameSequence(frameCount, framePath, (loadedFrames, totalFrames) => {
      if (!disposed) setProgress(Math.round((loadedFrames / totalFrames) * 100));
    }).then((loadedImages) => {
      if (disposed) return;

      images = loadedImages;
      renderer.setImages(images);
      renderer.resize();
      renderer.setTargetFrame(0, true);
      setLoaded(true);

      timeline = gsap.timeline({
        scrollTrigger: {
          anticipatePin: 1,
          end: () => `+=${scrollDistance}`,
          invalidateOnRefresh: true,
          pin: true,
          scrub: 0.92,
          start: "top top",
          trigger: section
        }
      });

      timeline
        .to(frameState, {
          duration: 1,
          ease: "none",
          frame: frameCount - 1,
          onUpdate: () => renderer.setTargetFrame(frameState.frame)
        }, 0)
        .to(cta, {
          autoAlpha: 1,
          duration: 0.15,
          ease: "power2.out",
          pointerEvents: "auto",
          scale: 1,
          y: 0
        }, 0.85);

      ScrollTrigger.refresh();
    });

    return () => {
      disposed = true;
      cta.removeEventListener("mouseenter", handleCtaEnter);
      cta.removeEventListener("mouseleave", handleCtaLeave);
      window.removeEventListener("resize", handleResize);
      timeline?.kill();
      renderer.destroy();
      images = [];
    };
  }, [frameCount, framePath, scrollDistance]);

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      data-loaded={loaded}
      aria-label="Convite animado"
    >
      <div className={styles.loader} aria-live="polite">
        <span>Carregando convite</span>
        <span>{progress}%</span>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="Envelope do convite se abrindo"
      />
      <a ref={ctaRef} className={styles.cta} href="/confirmar-presenca">
        Confirmar Presença
      </a>
    </section>
  );
}

function createFrameRenderer(canvas: HTMLCanvasElement): FrameRenderer {
  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
  let images: HTMLImageElement[] = [];
  let currentFrame = 0;
  let targetFrame = 0;
  let lastRenderedFrame = Number.NaN;
  let rafId = 0;
  const smoothing = 0.28;
  const maxFrameStep = 2.25;
  const settleDistance = 0.0025;

  if (!context) {
    return {
      destroy: () => undefined,
      resize: () => undefined,
      setTargetFrame: () => undefined,
      setImages: () => undefined
    };
  }

  function resize() {
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
  }

  function drawFrame(frameValue: number) {
    if (!images.length) return;

    const clampedFrame = Math.max(0, Math.min(images.length - 1, frameValue));
    const lowerIndex = Math.floor(clampedFrame);
    const upperIndex = Math.min(lowerIndex + 1, images.length - 1);
    const blend = clampedFrame - lowerIndex;
    const lowerImage = images[lowerIndex];
    const upperImage = images[upperIndex];

    if (!lowerImage || !upperImage) return;

    const scale = Math.min(canvas.width / lowerImage.naturalWidth, canvas.height / lowerImage.naturalHeight);
    const width = lowerImage.naturalWidth * scale;
    const height = lowerImage.naturalHeight * scale;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "#fbfff9";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 1;
    context.drawImage(lowerImage, x, y, width, height);

    if (blend > 0.001 && upperIndex !== lowerIndex) {
      context.globalAlpha = blend;
      context.drawImage(upperImage, x, y, width, height);
      context.globalAlpha = 1;
    }

    lastRenderedFrame = clampedFrame;
  }

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
      drawFrame(currentFrame);
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

  function setTargetFrame(frame: number, force = false) {
    targetFrame = Math.max(0, Math.min(images.length - 1, frame));

    if (force) {
      currentFrame = targetFrame;
      drawFrame(currentFrame);
      return;
    }

    schedule();
  }

  return {
    destroy() {
      if (rafId) window.cancelAnimationFrame(rafId);
      images = [];
    },
    resize,
    setTargetFrame,
    setImages(nextImages) {
      images = nextImages;
      currentFrame = 0;
      targetFrame = 0;
      lastRenderedFrame = Number.NaN;
    }
  };
}

function preloadFrameSequence(
  frameCount: number,
  framePath: string,
  onProgress?: (loaded: number, total: number) => void
) {
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

function getFrameSource(framePath: string, index: number) {
  return `${framePath.replace(/\/$/, "")}/${String(index + 1).padStart(3, "0")}.webp`;
}

function loadFrameImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    image.onload = async () => {
      try {
        await image.decode?.();
      } catch {
        // The loaded image is still safe to draw if decode() rejects after onload.
      }
      resolve(image);
    };
    image.onerror = reject;
    image.src = src;
  });
}
