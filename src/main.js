import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Matter from "matter-js";
import { inject } from "@vercel/analytics";

gsap.registerPlugin(ScrollTrigger);
inject();

const mobile = globalThis.matchMedia("(max-width: 768px)").matches;

function hasReducedMotion() {
  return globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isPreviewMode() {
  return new URLSearchParams(globalThis.location.search).has("preview");
}

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!isPreviewMode() && globalThis.location.hash) history.replaceState(null, "", globalThis.location.pathname + globalThis.location.search);

let lenis = null;

function resetScrollToTop() {
  if (isPreviewMode()) return;
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  globalThis.scrollTo(0, 0);
  lenis?.scrollTo(0, { immediate: true, force: true });
}

function keepInitialScrollAtTop() {
  if (isPreviewMode()) return;
  let frames = 14;
  const reset = () => {
    resetScrollToTop();
    if (frames > 0) {
      frames -= 1;
      requestAnimationFrame(reset);
      return;
    }
    ScrollTrigger.refresh();
  };
  reset();
}

resetScrollToTop();
globalThis.addEventListener("pageshow", keepInitialScrollAtTop);
globalThis.addEventListener("beforeunload", resetScrollToTop);
globalThis.addEventListener("load", keepInitialScrollAtTop);

let heroChromeReady = false;
let heroChromeVisible = false;

function setHeroChromeVisible(visible, immediate = false) {
  if (heroChromeVisible === visible && !immediate) return;
  heroChromeVisible = visible;
  gsap.set(".hero-bar", { display: "flex" });
  gsap.set(".hero-line", { display: "block" });
  gsap.to(".hero-bar", {
    autoAlpha: visible ? 1 : 0,
    clipPath: visible ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
    duration: immediate ? 0 : 0.45,
    ease: "power3.inOut",
    overwrite: true,
  });
  gsap.to(".hero-line", {
    autoAlpha: visible ? 1 : 0,
    scaleX: visible ? 1 : 0,
    duration: immediate ? 0 : 0.45,
    ease: "power3.inOut",
    overwrite: true,
  });
}

function initLenis() {
  if (hasReducedMotion() || isPreviewMode()) return null;
  const lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { duration: 1.35 });
    });
  });
  return lenis;
}

lenis = initLenis();
resetScrollToTop();

function createGradientCanvas() {
  const canvas = document.querySelector(".hero-gradient");
  const context = canvas.getContext("2d");
  const pointer = { x: 0.5, y: 0.5 };
  const target = { x: 0.5, y: 0.5 };
  let width = 0;
  let height = 0;

  function resize() {
    const dpr = Math.min(globalThis.devicePixelRatio, 1.5);
    width = globalThis.innerWidth;
    height = globalThis.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  globalThis.addEventListener("resize", resize);
  globalThis.addEventListener("pointermove", (event) => {
    target.x = event.clientX / width;
    target.y = event.clientY / height;
  });
  resize();

  function draw(time) {
    pointer.x += (target.x - pointer.x) * 0.035;
    pointer.y += (target.y - pointer.y) * 0.035;
    context.fillStyle = "#2c1838";
    context.fillRect(0, 0, width, height);

    const gradients = [
      [0.78 + Math.sin(time * 0.00018) * 0.06, 0.18, width * 0.78, "#eb9998"],
      [0.25, 0.24 + Math.cos(time * 0.00013) * 0.06, width * 0.68, "#5d549c"],
      [0.54, 0.45 + Math.sin(time * 0.00016) * 0.04, width * 0.56, "#6f70a2"],
      [0.62, 0.74 + Math.sin(time * 0.00016) * 0.04, width * 0.58, "#7e3a63"],
      [pointer.x, pointer.y, width * 0.3, "#a373d3"],
    ];

    context.globalCompositeOperation = "screen";
    gradients.forEach(([x, y, radius, color]) => {
      const gradient = context.createRadialGradient(x * width, y * height, 0, x * width, y * height, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.35, `${color}bb`);
      gradient.addColorStop(1, "#00000000");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    });
    context.globalCompositeOperation = "source-over";
    context.fillStyle = "rgba(44, 24, 56, .18)";
    context.fillRect(0, 0, width, height);
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

function splitElementWords(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) fragment.append(part);
      else {
        const span = document.createElement("span");
        span.className = "word";
        span.textContent = part;
        fragment.append(span);
      }
    });
    node.replaceWith(fragment);
  });
}

function splitIntroChars() {
  document.querySelectorAll(".intro-name__first, .intro-name__first-rest, .intro-name__last").forEach((element) => {
    const chars = [...element.textContent];
    element.textContent = "";
    chars.forEach((char) => {
      const span = document.createElement("span");
      span.className = "intro-char";
      span.textContent = char === " " ? "\u00A0" : char;
      span.style.display = "inline-block";
      element.append(span);
    });
  });
}

function initNameHover() {
  const cursor = document.querySelector(".name-cursor");
  const targets = [
    { element: document.querySelector(".intro-name__first-group"), last: false },
    { element: document.querySelector(".intro-name__last-group"), last: true },
  ].filter(({ element }) => element);

  if (!cursor || !targets.length || mobile) return;

  const isReady = () => document.body.classList.contains("is-name-hover-ready");
  const palettes = ["#f6f6f6", "#0096d6", "#eb9998", "#d9a441", "#a373d3"];
  const letterTweens = new Map();

  const getBaseColor = () => getComputedStyle(document.querySelector(".intro-name")).color;

  const moveCursor = (event) => {
    if (!isReady()) return;
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  };

  const stopLetterTween = (char) => {
    letterTweens.get(char)?.kill();
    letterTweens.delete(char);
  };

  const resetChar = (char) => {
    stopLetterTween(char);
    gsap.killTweensOf(char, "y,rotation,scaleX,scaleY,filter,fontStyle,fontWeight");
    gsap.set(char, { clearProps: "color" });
    gsap.to(char, {
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      filter: "blur(0px)",
      fontStyle: "normal",
      fontWeight: 400,
      duration: 0.36,
      ease: "elastic.out(1, 0.5)",
      overwrite: true,
    });
  };

  const animateChar = (char) => {
    if (!isReady()) return;
    stopLetterTween(char);
    gsap.killTweensOf(char, "y,rotation,scaleX,scaleY,filter,fontStyle,fontWeight");

    const tween = gsap.timeline({ repeat: -1, repeatRefresh: true });
    tween
      .to(char, {
        y: () => gsap.utils.random(-18, 13),
        rotation: () => gsap.utils.random(-11, 11),
        scaleX: () => gsap.utils.random(0.82, 1.2),
        scaleY: () => gsap.utils.random(0.86, 1.18),
        color: () => palettes[gsap.utils.random(0, palettes.length - 1, 1)],
        filter: () => (Math.random() > 0.76 ? "blur(0.65px)" : "blur(0px)"),
        fontStyle: () => (Math.random() > 0.5 ? "italic" : "normal"),
        fontWeight: () => (Math.random() > 0.54 ? 800 : 400),
        duration: 0.2,
        ease: "power3.out",
        overwrite: true,
      })
      .to(char, {
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        color: () => getBaseColor(),
        filter: "blur(0px)",
        fontStyle: "normal",
        fontWeight: 400,
        duration: 0.34,
        ease: "elastic.out(1, 0.5)",
      })
      .to({}, { duration: 0.08 });

    letterTweens.set(char, tween);
  };

  globalThis.addEventListener("pointermove", moveCursor, { passive: true });

  targets.forEach(({ element, last }) => {
    const chars = gsap.utils.toArray(".intro-char", element);

    chars.forEach((char) => {
      char.addEventListener("pointerenter", () => animateChar(char));
      char.addEventListener("pointerleave", () => resetChar(char));
    });

    element.addEventListener("pointerenter", (event) => {
      if (!isReady()) return;
      cursor.classList.toggle("is-last", last);
      moveCursor(event);
      gsap.to(cursor, { opacity: 1, scale: 1, rotation: 0, duration: 0.28, ease: "power3.out", overwrite: true });
    });

    element.addEventListener("pointerleave", () => {
      gsap.to(cursor, { opacity: 0, scale: 0.68, rotation: -5, duration: 0.22, ease: "power3.inOut", overwrite: true });
      chars.forEach((char) => resetChar(char));
    });
  });
}

function initIntro() {
  splitIntroChars();
  initNameHover();
  document.body.classList.remove("is-name-hover-ready");
  const heroBar = document.querySelector(".hero-bar");
  if (heroBar && heroBar.parentElement !== document.body) document.body.append(heroBar);
  const heroLine = document.querySelector(".hero-line");
  if (heroLine && heroLine.parentElement !== document.body) document.body.append(heroLine);
  const chars = gsap.utils.toArray(".intro-char");
  gsap.set(chars, { yPercent: 115 });
  gsap.set(".hero", { opacity: 1 });
  setHeroChromeVisible(false, true);

  if (isPreviewMode() || hasReducedMotion()) {
    gsap.set(chars, { yPercent: 0 });
    gsap.set(".intro-bg, .transition-panels", { display: "none" });
    gsap.set(".hero-tagline", { opacity: 1, clipPath: "inset(0 0 0 0)" });
    heroChromeReady = true;
    document.body.classList.add("is-name-hover-ready");
    setHeroChromeVisible(true, true);
    return;
  }

  const timeline = gsap.timeline({ delay: 0.2 });
  timeline
    .to(chars, { yPercent: 0, duration: 0.45, stagger: { each: 0.018, from: "center" }, ease: "power3.out" })
    .to({}, { duration: 0.3 })
    .to(".transition-panels__dark", { yPercent: -100, duration: 0.45, ease: "power3.inOut" })
    .to(".transition-panels__red", { yPercent: -100, duration: 0.45, ease: "power3.inOut" }, "-=0.3")
    .set(".intro-bg", { display: "none" })
    .to(".transition-panels__red", { yPercent: -200, duration: 0.55, ease: "power3.inOut" }, "+=0.05")
    .to(".transition-panels__dark", { yPercent: -200, duration: 0.55, ease: "power3.inOut" }, "-=0.4")
    .to(".hero-tagline", { opacity: 1, clipPath: "inset(0 0 0% 0)", duration: 1, ease: "power3.inOut" }, "-=0.2")
    .call(() => {
      heroChromeReady = true;
      setHeroChromeVisible(true);
    }, null, "-=0.6")
    .call(() => {
      document.body.classList.add("is-name-hover-ready");
    });
}

function initHeroScroll() {
  const name = document.querySelector(".intro-name");
  const firstGroup = document.querySelector(".intro-name__first-group");
  const lastGroup = document.querySelector(".intro-name__last-group");
  const nameColorTargets = gsap.utils.toArray(".intro-name, .intro-name__first, .intro-name__first-rest, .intro-name__last");
  const viewport = document.querySelector(".world-viewport");
  const media = document.querySelector(".world-media__asset");
  const homeFrameCount = 121;
  const homeFrameSrc = (index) => `/home-frames/intro-${String(index).padStart(3, "0")}.jpg`;
  const homeFrames = Array.from({ length: homeFrameCount }, (_, index) => {
    const image = new Image();
    image.src = homeFrameSrc(index + 1);
    return image;
  });
  const homeFrameStart = 0.34;
  const homeFrameEnd = 0.94;
  let activeHomeFrame = 0;
  const scrubHomeFrames = (progress) => {
    if (!(media instanceof HTMLImageElement)) return;
    const frameProgress = Math.min(1, Math.max(0, (progress - homeFrameStart) / (homeFrameEnd - homeFrameStart)));
    const nextFrame = Math.min(homeFrameCount - 1, Math.max(0, Math.round(frameProgress * (homeFrameCount - 1))));
    if (nextFrame === activeHomeFrame) return;
    activeHomeFrame = nextFrame;
    media.src = homeFrames[nextFrame].src;
  };
  const startWidth = mobile ? 24 : 34;
  const startHeight = () => Math.round(globalThis.innerHeight * (mobile ? 0.22 : 0.24));
  const introAspect = 1244 / 1666;
  const worldCoverWidth = () => `${Math.max(globalThis.innerWidth, globalThis.innerHeight * introAspect)}px`;
  const worldCoverHeight = () => `${Math.max(globalThis.innerHeight, globalThis.innerWidth / introAspect)}px`;
  gsap.set(viewport, {
    "--world-width": `${startWidth}px`,
    "--world-height": `${startHeight()}px`,
    xPercent: -50,
    yPercent: -50,
    x: 0,
    y: 0,
  });
  gsap.set(name, { "--intro-gap": `${startWidth / 2 + (mobile ? 8 : 12)}px`, top: "50%", scale: 1 });
  gsap.set(media, { scale: 1 });

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero-scroll",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.55,
      invalidateOnRefresh: true,
      onUpdate: ({ progress }) => {
        scrubHomeFrames(progress);
        if (!heroChromeReady) return;
        setHeroChromeVisible(progress < 0.88);
      },
      onRefresh: ({ progress }) => {
        scrubHomeFrames(progress);
        if (!heroChromeReady) return;
        setHeroChromeVisible(progress < 0.88, true);
      },
    },
  });

  timeline
    .to(".hero-tagline", { opacity: 0, duration: 0.12, ease: "none" }, 0)
    .to(".hero-gradient", { opacity: 1, duration: 0.22, ease: "none" }, 0.05)
    .to(viewport, { opacity: 1, duration: 0.01 }, 0.18)
    .to(nameColorTargets, { color: "#5d549c", duration: 0.12, ease: "none" }, 0.18)
    .to(nameColorTargets, { color: "#d9a441", duration: 0.18, ease: "none" }, 0.3)
    .to(name, { "--intro-gap": () => `${globalThis.innerWidth * (mobile ? 0.52 : 0.56)}px`, duration: 0.78, ease: "none" }, 0.18)
    .to(viewport, {
      "--world-width": worldCoverWidth,
      "--world-height": worldCoverHeight,
      duration: 0.78,
      ease: "none",
    }, 0.18)
    .to(media, { scale: 1, duration: 0.78, ease: "none" }, 0.18)
    .to([firstGroup, lastGroup], { opacity: 0, duration: 0.18, ease: "none" }, 0.78)
    .to(".world-phrase", { opacity: 1, filter: "blur(0px)", duration: 0.18, ease: "none" }, 0.58);

  gsap.timeline({
    scrollTrigger: {
      trigger: ".dark-content",
      start: "top bottom",
      end: "top top",
      scrub: true,
    },
  })
    .to(".world-phrase", { opacity: 0, duration: 0.25 }, 0)
    .to(viewport, { y: "-50vh", filter: "blur(15px)", opacity: 0, duration: 1, ease: "none" }, 0);
}

function initAboutLetterTheme() {
  const container = document.querySelector(".about-small");
  const paragraph = container?.querySelector("p");
  if (!container || !paragraph || paragraph.dataset.letterThemeReady) return;

  paragraph.dataset.letterThemeReady = "true";
  document.fonts?.load('1em "GTA Art Deco"');

  const hoveredLetters = new Set();
  const letters = [];
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    Array.from(node.textContent).forEach((char) => {
      if (/\s/.test(char)) {
        fragment.append(document.createTextNode(char));
        return;
      }

      const span = document.createElement("span");
      span.className = "about-letter";
      span.textContent = char;
      span.dataset.index = String(letters.length);
      fragment.append(span);
      letters.push(span);
    });
    node.replaceWith(fragment);
  });

  const activateViceCity = () => {
    if (document.body.classList.contains("is-vice-city")) return;
    container.classList.add("is-complete");

    const applyTheme = () => {
      document.body.classList.add("is-vice-city");
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.4, force: true });
      } else {
        window.scrollTo({ top: 0, behavior: hasReducedMotion() ? "auto" : "smooth" });
      }
      ScrollTrigger.refresh();
    };

    applyTheme();

    if (!hasReducedMotion()) {
      gsap.fromTo(
        ".about-letter.is-art-deco",
        { y: -3 },
        { y: 0, duration: 0.45, ease: "elastic.out(1, 0.55)", stagger: { each: 0.006, from: "random" } },
      );
    }

    ScrollTrigger.refresh();
  };

  const markLetter = (letter) => {
    const index = letter.dataset.index;
    if (hoveredLetters.has(index)) return;

    hoveredLetters.add(index);
    letter.classList.add("is-art-deco");

    if (hoveredLetters.size === letters.length) activateViceCity();
  };

  letters.forEach((letter) => {
    letter.addEventListener("pointerenter", () => markLetter(letter));
    letter.addEventListener("focus", () => markLetter(letter));
  });
}

function initAbout() {
  initAboutLetterTheme();
  document.querySelectorAll(".split-words").forEach(splitElementWords);
  document.querySelectorAll(".about-lead .word").forEach((word) => {
    gsap.to(word, {
      opacity: 1,
      filter: "blur(0px)",
      ease: "none",
      scrollTrigger: { trigger: word, start: "top 76%", end: "top 60%", scrub: true },
    });
  });

  gsap.to(".about-small", {
    opacity: 1,
    filter: "blur(0px)",
    scrollTrigger: { trigger: ".about-small", start: "top 82%", end: "top 60%", scrub: true },
  });

  gsap.timeline({
    scrollTrigger: { trigger: ".about-photo", start: "top bottom", end: "bottom top", scrub: true },
  })
    .fromTo(".about-photo", { opacity: 0, filter: "blur(20px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.25 }, 0)
    .fromTo(".about-media__asset", { yPercent: -8 }, { yPercent: 8, ease: "none" }, 0);

  const aboutFrame = document.querySelector(".about-media__asset");
  if (aboutFrame instanceof HTMLImageElement) {
    const frameCount = 97;
    const frameSrc = (index) => `/about-frames/me-${String(index).padStart(3, "0")}.jpg`;
    const frames = Array.from({ length: frameCount }, (_, index) => {
      const image = new Image();
      image.src = frameSrc(index + 1);
      return image;
    });
    let activeFrame = 0;

    const scrubFrames = ({ progress }) => {
      const nextFrame = Math.min(frameCount - 1, Math.max(0, Math.round(progress * (frameCount - 1))));
      if (nextFrame === activeFrame) return;
      activeFrame = nextFrame;
      aboutFrame.src = frames[nextFrame].src;
    };

    const frameTrigger = ScrollTrigger.create({
      trigger: ".about",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: scrubFrames,
      onRefresh: scrubFrames,
    });
    scrubFrames(frameTrigger);
  }

  const path = document.querySelector(".fluid-line path");
  if (!path) return;
  const length = path.getTotalLength();
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 0 });
  gsap.fromTo(
    path,
    { strokeDashoffset: length, opacity: 0 },
    {
      strokeDashoffset: 0,
      opacity: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".about",
        start: "top 72%",
        endTrigger: ".projects",
        end: "bottom 88%",
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    },
  );
}

function createProjectCubePreview(art, initialProject) {
  const fallbackImage = art.querySelector(".project-art__image");
  const grid = art.querySelector(".project-cube-grid");
  const columns = 8;
  const rows = 6;
  const faces = ["front", "back", "left", "right", "top", "bottom"];
  const defaultImage = fallbackImage?.getAttribute("src") || "./udl.jpg";
  let currentImage = initialProject?.image || defaultImage;
  let tileWidth = 0;
  let tileHeight = 0;
  let isBreathing = false;
  let previewActive = false;
  let changePulse = null;
  let queuedProject = null;
  let queuedIndex = 0;
  const tileData = [];
  const breathDelays = [];

  const cssImage = (src) => `url("${new URL(src, globalThis.location.href).href}")`;
  const setVisual = (project) => {
    art.style.setProperty("--project-tint", project?.tint || "rgba(93, 84, 156, 0.24)");
  };
  const setCubeImages = (front, back = front) => {
    art.style.setProperty("--cube-front", cssImage(front));
    art.style.setProperty("--cube-back", cssImage(back));
  };
  const syncTileMetrics = () => {
    const rect = grid.getBoundingClientRect();
    tileWidth = rect.width / columns;
    tileHeight = rect.height / rows;
    const tileSize = Math.min(tileWidth, tileHeight);
    art.style.setProperty("--cube-z", `${Math.max(1, tileSize / 2)}px`);
  };
  const setTileImage = (tile, side, imagePath) => {
    const face = tile.faces[side];
    if (!face || !tileWidth || !tileHeight) return;
    face.style.backgroundImage = cssImage(imagePath);
    face.style.backgroundSize = `${tileWidth * columns}px ${tileHeight * rows}px`;
    face.style.backgroundPosition = `${-(tile.col * tileWidth)}px ${-(tile.row * tileHeight)}px`;
  };
  const setProjectFaces = (imagePath, sides = faces) => {
    syncTileMetrics();
    tileData.forEach((tile) => {
      sides.forEach((side) => setTileImage(tile, side, imagePath));
    });
  };

  if (!grid || hasReducedMotion()) {
    setVisual(initialProject);
    return {
      show(project) {
        currentImage = project?.image || currentImage;
        if (fallbackImage) fallbackImage.src = currentImage;
        setVisual(project);
      },
      pulse() { },
      setActive() { },
    };
  }

  art.style.setProperty("--cube-cols", columns);
  art.style.setProperty("--cube-rows", rows);
  art.style.setProperty("--tile-bg-size-x", `${columns * 100}%`);
  art.style.setProperty("--tile-bg-size-y", `${rows * 100}%`);
  setVisual(initialProject);
  setCubeImages(currentImage);

  const fragment = document.createDocumentFragment();
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const tile = document.createElement("span");
      const cube = document.createElement("span");
      const tileFaces = {};
      tile.className = "project-cube-tile";
      cube.className = "project-cube";
      tile.style.setProperty("--tile-bg-x", `${columns === 1 ? 0 : (x / (columns - 1)) * 100}%`);
      tile.style.setProperty("--tile-bg-y", `${rows === 1 ? 0 : (y / (rows - 1)) * 100}%`);
      faces.forEach((face) => {
        const element = document.createElement("span");
        element.className = `project-cube-face project-cube-face--${face}`;
        tileFaces[face] = element;
        cube.append(element);
      });
      tile.append(cube);
      fragment.append(tile);
      tileData.push({ element: tile, cube, faces: tileFaces, row: y, col: x });
    }
  }
  grid.replaceChildren(fragment);
  setProjectFaces(currentImage);
  globalThis.addEventListener("resize", () => setProjectFaces(currentImage));
  art.classList.add("is-cubes-ready");

  const tiles = tileData.map((tile) => tile.element);
  const cubes = tileData.map((tile) => tile.cube);
  gsap.set(tiles, { transformOrigin: "50% 50%", transformStyle: "preserve-3d", force3D: true });
  gsap.set(cubes, { transformOrigin: "50% 50%", transformStyle: "preserve-3d", force3D: true });

  const breathe = (tileElement) => {
    if (!isBreathing) return;
    gsap.to(tileElement, {
      z: gsap.utils.random(-24, 34, 1),
      duration: gsap.utils.random(0.8, 1.5, 0.05),
      ease: "sine.inOut",
      force3D: true,
      overwrite: false,
      onComplete: () => breathe(tileElement),
    });
  };
  const startBreathing = () => {
    if (isBreathing) return;
    isBreathing = true;
    tileData.forEach((tile, index) => {
      breathDelays.push(gsap.delayedCall(index * 0.015, () => breathe(tile.element)));
    });
  };
  const stopBreathing = () => {
    isBreathing = false;
    breathDelays.splice(0).forEach((delayedCall) => delayedCall.kill());
    gsap.killTweensOf(tiles, "z");
    gsap.to(tiles, {
      z: 0,
      duration: 0.45,
      ease: "sine.out",
      force3D: true,
      overwrite: "auto",
    });
  };
  const revealProjectChange = (project, index = 0) => {
    if (changePulse) {
      queuedProject = project;
      queuedIndex = index;
      return;
    }
    const nextImage = project?.image || currentImage;
    const orderedTiles = [...tileData].sort(() => Math.random() - 0.5);
    gsap.killTweensOf(cubes, "z");
    currentImage = nextImage;
    setCubeImages(currentImage);
    setProjectFaces(currentImage);
    if (fallbackImage) fallbackImage.src = currentImage;

    changePulse = gsap.timeline({
      onComplete: () => {
        changePulse = null;
        if (queuedProject) {
          const nextProject = queuedProject;
          const nextIndex = queuedIndex;
          queuedProject = null;
          revealProjectChange(nextProject, nextIndex);
        }
      },
    });

    orderedTiles.forEach((tile, tileIndex) => {
      const delay = tileIndex * 0.006;
      const wave = Math.sin((tile.row + tile.col + index) * 0.9) * 10;
      changePulse
        .to(tile.cube, {
          z: gsap.utils.random(18, 44, 1) + wave,
          duration: 0.22,
          ease: "power2.out",
          force3D: true,
        }, delay)
        .to(tile.cube, {
          z: 0,
          duration: 0.34,
          ease: "sine.inOut",
          force3D: true,
        }, delay + 0.16);
    });
  };
  const setProjectDirectly = (project) => {
    const nextImage = project?.image || currentImage;
    currentImage = nextImage;
    if (fallbackImage) fallbackImage.src = currentImage;
    setCubeImages(currentImage);
    setProjectFaces(currentImage);
  };
  return {
    show(project, index = 0) {
      const nextImage = project?.image || currentImage;

      setVisual(project);
      if (nextImage === currentImage) return;

      if (!previewActive) {
        setProjectDirectly(project);
        return;
      }

      revealProjectChange(project, index);
    },
    pulse() {
      startBreathing();
    },
    setActive(active) {
      previewActive = active;
      if (active) {
        startBreathing();
        return;
      }
      queuedProject = null;
      changePulse?.kill();
      changePulse = null;
      gsap.killTweensOf(cubes, "z");
      gsap.set(cubes, { z: 0 });
      stopBreathing();
    },
  };
}

function initProjects() {
  if (mobile) return;
  const section = document.querySelector(".projects");
  const items = gsap.utils.toArray(".project-item");
  const preview = document.querySelector(".project-preview");
  const art = preview.querySelector(".project-art");
  const detail = preview.querySelector(".project-detail");
  const date = preview.querySelector(".project-preview__date");
  const projectDetails = [
    {
      title: "Portfolio 2026",
      description: "Création de mon portfolio 2026.",
      stack: "HTML / CSS / JavaScript / GSAP / Lenis / Matter.js",
      image: "/folio.png",
      tint: "rgba(93, 84, 156, 0.26)",
    },
    {
      title: "Rh-recrutement",
      description: "Conception d'un application en interne à l'université de Lyon de suivi demande de recrutement jusq'au suivi de candidature.",
      stack: "Symfony / API / React",
      image: "/recrutement.png",
      tint: "rgba(163, 115, 211, 0.28)",
    },
    {
      title: "Gestion des serveurs",
      description: "Gestion et maintenance des serveurs en interne.",
      stack: "Linux / Unix / Bash / Shell",
      image: "/server.png",
      tint: "rgba(0, 150, 214, 0.24)",
    },
    {
      title: "Tony-VolleyBall",
      description: "Création d'un jeu vidéo en Unity comme Blobby Volley.",
      stack: "Unity",
      image: "/tony.png",
      tint: "rgba(126, 58, 99, 0.28)",
    },
    {
      title: "Carolina - Projet IA",
      description: "Création d'une application d'IA locale dédiée à la génération de texte, au résumé d'audios et de documents, ainsi qu'à l'intégration de fonctionnalités RAG pour la recherche d'informations.",
      stack: "LLM / Vector Store / Embedding / RAG / LangChain / Python",
      image: "/carolina.png",
      tint: "rgba(217, 164, 65, 0.24)",
    },

  ];
  projectDetails.forEach(({ image }) => {
    const preload = new Image();
    preload.src = image;
  });
  const cubePreview = createProjectCubePreview(art, projectDetails[0]);
  let current = -1;
  let visible = false;

  const updateDetail = (index) => {
    const data = projectDetails[index];
    if (!data) return;
    const stack = detail.querySelector(".project-detail__stack");
    detail.querySelector("h3").textContent = data.title;
    detail.querySelector("p").textContent = data.description;
    if (stack) {
      const tags = data.stack.split("/").map((tag) => tag.trim()).filter(Boolean);
      stack.replaceChildren(...tags.map((tag) => {
        const chip = document.createElement("span");
        chip.textContent = tag;
        return chip;
      }));
    }
  };

  const activate = (index) => {
    if (index === current) return;
    items.forEach((item, itemIndex) => {
      const isActive = itemIndex === index;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    date.textContent = items[index].dataset.date;
    updateDetail(index);
    cubePreview.show(projectDetails[index], index);
    gsap.fromTo(art, { scale: 0.985 }, { scale: 1, duration: 0.35, ease: "power2.out" });
    detail.classList.add("is-visible");
    gsap.fromTo(detail, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.28 });
    current = index;
  };

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const getProjectScrollMetrics = () => {
    const sectionTop = section.getBoundingClientRect().top + globalThis.scrollY;
    const scrollRange = Math.max(1, section.offsetHeight - globalThis.innerHeight);
    return { sectionTop, scrollRange };
  };

  const getIndexFromScroll = () => {
    const { sectionTop, scrollRange } = getProjectScrollMetrics();
    const progress = clamp((globalThis.scrollY - sectionTop) / scrollRange);
    return Math.round(progress * (items.length - 1));
  };

  const scrollToProject = (index) => {
    const { sectionTop, scrollRange } = getProjectScrollMetrics();
    const progress = items.length > 1 ? index / (items.length - 1) : 0;
    const targetY = sectionTop + scrollRange * progress;

    if (lenis) {
      lenis.scrollTo(targetY, { duration: 0.9 });
      return;
    }

    globalThis.scrollTo({ top: targetY, behavior: hasReducedMotion() ? "auto" : "smooth" });
  };

  ScrollTrigger.create({
    trigger: section,
    start: "top 30%",
    end: "bottom 65%",
    onToggle: ({ isActive }) => {
      visible = isActive;
      cubePreview.setActive(isActive);
      gsap.to(preview, { opacity: isActive ? 1 : 0, duration: 0.35 });
    },
  });

  const xSetters = items.map((item) => gsap.quickTo(item, "x", { duration: 0.55, ease: "power2.out" }));
  const updateActive = () => {
    if (!visible) return;
    const center = globalThis.innerHeight / 2;
    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const itemDistance = Math.abs(rect.top + rect.height / 2 - center);
      xSetters[index](Math.min(itemDistance / center, 1) * 78);
    });
    activate(getIndexFromScroll());
  };

  items.forEach((item, index) => {
    item.setAttribute("aria-pressed", String(index === 0));
    item.addEventListener("click", () => {
      scrollToProject(index);
    });
  });

  globalThis.addEventListener("scroll", updateActive, { passive: true });
  lenis?.on("scroll", updateActive);
  activate(0);
  updateActive();
}

function initGallery() {
  const section = document.querySelector(".circle-gallery");
  const pin = section?.querySelector(".circle-gallery__pin");
  const phrase = document.querySelector(".gallery-phrase");
  const cards = gsap.utils.toArray(".orbit-card");
  const words = gsap.utils.toArray(".gallery-phrase .word");
  if (!section || !pin || !cards.length) return;

  gsap.set(pin, { autoAlpha: 0 });
  gsap.set(words, { opacity: 0, filter: "blur(8px)", y: 16 });
  gsap.set(phrase, { opacity: 1, y: 0 });

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const ease = (value) => value * value * (3 - 2 * value);
  const mix = (from, to, value) => from + (to - from) * value;

  let rawProgress = 0;
  let galleryVisible = false;
  const galleryLead = 0;
  const phraseLead = 0.06;

  const setGalleryVisible = (visible) => {
    if (galleryVisible === visible) return;
    galleryVisible = visible;
    gsap.set(pin, { autoAlpha: visible ? 1 : 0 });
  };

  const renderGallery = (nextProgress = rawProgress) => {
    rawProgress = clamp(nextProgress);
    const progress = clamp(rawProgress + galleryLead);
    const phraseProgress = clamp(rawProgress + phraseLead);
    const radiusX = Math.min(globalThis.innerWidth * (mobile ? 0.38 : 0.34), mobile ? 235 : 520);
    const radiusY = Math.min(globalThis.innerHeight * (mobile ? 0.16 : 0.18), mobile ? 105 : 155);
    const entryEnd = 0.18;
    const exitStart = 0.92;
    const cardGap = 0.115;
    const pathRange = 1 + cardGap * (cards.length - 1);
    const lowerTrackY = Math.min(globalThis.innerHeight * (mobile ? 0.34 : 0.32), mobile ? 230 : 310);
    const exitTrackY = -Math.min(globalThis.innerHeight * (mobile ? 0.1 : 0.12), mobile ? 80 : 120);
    const exitAngle = Math.PI * 4 - 0.38;

    cards.forEach((card, index) => {
      const cardWidth = card.offsetWidth || 220;
      const local = progress * pathRange - index * cardGap;
      const travel = clamp(local);
      const orbitTravel = clamp((travel - entryEnd) / (exitStart - entryEnd));
      const angle = Math.PI + orbitTravel * (exitAngle - Math.PI);
      const depth = (Math.sin(angle) + 1) / 2;
      const orbitX = Math.cos(angle) * radiusX;
      const orbitY = Math.sin(angle) * radiusY;
      const enter = ease(clamp(travel / entryEnd));
      const exit = ease(clamp((travel - exitStart) / (1 - exitStart)));
      const startX = -globalThis.innerWidth / 2 - cardWidth / 2 - 56;
      const startY = lowerTrackY;
      const endX = globalThis.innerWidth / 2 + cardWidth / 2 + 56;
      const endY = exitTrackY;
      const x = mix(mix(startX, orbitX, enter), endX, exit);
      const y = mix(mix(startY, orbitY, enter), endY, exit);
      const scale = mix(0.72, 0.8 + depth * 0.22, enter) * mix(1, 0.9, exit);
      const visible = local > 0 && local < 1 ? 1 : 0;
      const opacity = visible * enter * (1 - exit) * (0.84 + depth * 0.16);
      const rotation = Math.cos(angle) * -5;

      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = `${Math.round(depth * 40) + 1}`;
      card.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`;
    });

    words.forEach((word, index) => {
      const wordStart = index * 0.028;
      const wordProgress = ease(clamp((phraseProgress - wordStart) / 0.18));
      word.style.opacity = wordProgress.toFixed(3);
      word.style.filter = `blur(${((1 - wordProgress) * 8).toFixed(2)}px)`;
      word.style.transform = `translateY(${((1 - wordProgress) * 16).toFixed(2)}px)`;
    });
  };

  const galleryTrigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    invalidateOnRefresh: true,
    onEnter: () => setGalleryVisible(true),
    onEnterBack: () => setGalleryVisible(true),
    onLeaveBack: () => setGalleryVisible(false),
    onUpdate: (self) => renderGallery(self.progress),
    onRefresh: (self) => {
      setGalleryVisible(globalThis.scrollY >= self.start);
      renderGallery(self.progress);
    },
  });

  globalThis.addEventListener("resize", () => renderGallery(galleryTrigger.progress));
  globalThis.__updateGallery = () => renderGallery(galleryTrigger.progress);
  renderGallery(0);
}

function createSkillPillPhysics(stage) {
  if (!stage) return null;
  const pills = gsap.utils.toArray(".skill-pill", stage);
  if (!pills.length) return null;

  if (hasReducedMotion()) {
    return {
      prepare: () => { },
      drop: () => { },
      stop: () => { },
      resize: () => { },
    };
  }

  const { Engine, Runner, Bodies, Body, Composite, Events } = Matter;
  let engine = null;
  let runner = null;
  let bodies = [];
  let settleTimer = null;
  let resizeTimer = null;
  let hasPlayed = false;

  stage.classList.add("is-physics-ready");

  function stop() {
    if (runner) {
      Runner.stop(runner);
      runner = null;
    }
    globalThis.clearTimeout(settleTimer);
    settleTimer = null;
  }

  function sync() {
    bodies.forEach(({ body, element }) => {
      element.style.transform = `translate(-50%, -50%) translate3d(${body.position.x.toFixed(2)}px, ${body.position.y.toFixed(2)}px, 0) rotate(${body.angle.toFixed(3)}rad)`;
    });
  }

  function clearWorld() {
    stop();
    stage.classList.remove("has-physics-position");
    if (!engine) return;
    Events.off(engine, "afterUpdate", sync);
    Composite.clear(engine.world, false, true);
    Engine.clear(engine);
    engine = null;
    bodies = [];
  }

  function measureStage() {
    const rect = stage.getBoundingClientRect();
    return {
      width: Math.max(rect.width, 260),
      height: Math.max(rect.height, mobile ? 185 : 145),
    };
  }

  function buildWorld() {
    clearWorld();

    const { width, height } = measureStage();
    const wall = 80;
    const floorY = height - 1;
    engine = Engine.create({
      gravity: {
        x: 0,
        y: 1,
        scale: 0.0019,
      },
    });
    engine.positionIterations = 8;
    engine.velocityIterations = 6;

    const boundaries = [
      Bodies.rectangle(width / 2, floorY + wall / 2, width + wall * 2, wall, { isStatic: true }),
      Bodies.rectangle(-wall / 2, height / 2, wall, height * 3, { isStatic: true }),
      Bodies.rectangle(width + wall / 2, height / 2, wall, height * 3, { isStatic: true }),
    ];

    bodies = pills.map((pill, index) => {
      const pillWidth = pill.offsetWidth || 110;
      const pillHeight = pill.offsetHeight || 44;
      const lane = width / (pills.length + 1);
      const stagger = index % 2 === 0 ? -width * 0.035 : width * 0.035;
      const x = Math.max(pillWidth / 2, Math.min(width - pillWidth / 2, lane * (index + 1) + stagger));
      const y = -70 - index * (pillHeight + 14);
      const body = Bodies.rectangle(x, y, pillWidth, pillHeight, {
        chamfer: { radius: pillHeight / 2 },
        restitution: 0.42,
        friction: 0.82,
        frictionStatic: 0.92,
        frictionAir: 0.018,
        density: 0.0015,
      });

      Body.setAngle(body, gsap.utils.random(-0.38, 0.38));
      Body.setAngularVelocity(body, gsap.utils.random(-0.055, 0.055));
      Body.setVelocity(body, {
        x: gsap.utils.random(-1.1, 1.1),
        y: gsap.utils.random(0.25, 1.25),
      });

      return { body, element: pill };
    });

    Composite.add(engine.world, [...boundaries, ...bodies.map(({ body }) => body)]);
    Events.on(engine, "afterUpdate", sync);
    sync();
    stage.classList.add("has-physics-position");
  }

  function prepare() {
    if (!stage.closest(".skill-group")?.classList.contains("is-open")) return;
    buildWorld();
  }

  function drop() {
    if (!stage.closest(".skill-group")?.classList.contains("is-open")) return;
    if (!engine) buildWorld();
    runner = Runner.create();
    Runner.run(runner, engine);
    hasPlayed = true;
    globalThis.clearTimeout(settleTimer);
    settleTimer = globalThis.setTimeout(stop, 5600);
  }

  function resize() {
    if (!hasPlayed) return;
    globalThis.clearTimeout(resizeTimer);
    resizeTimer = globalThis.setTimeout(drop, 140);
  }

  globalThis.addEventListener("resize", resize);

  return { prepare, drop, stop, resize };
}

function initSkills() {
  document.querySelectorAll(".skill-group").forEach((group) => {
    const button = group.querySelector("button");
    const body = group.querySelector(".skill-body");
    const physics = createSkillPillPhysics(group.querySelector("[data-skill-pills]"));
    const setOpen = (open, immediate = false) => {
      group.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
      if (!open) physics?.stop();
      if (open && !immediate) physics?.prepare();
      gsap.to(body, {
        height: open ? "auto" : 0,
        duration: immediate ? 0 : 0.5,
        ease: "power3.inOut",
        onComplete: () => {
          if (open && !immediate) physics?.drop();
          ScrollTrigger.refresh();
        },
      });
    };

    setOpen(group.classList.contains("is-open"), true);

    button.addEventListener("click", () => {
      setOpen(!group.classList.contains("is-open"));
    });

    ScrollTrigger.create({
      trigger: group,
      start: "top 78%",
      once: true,
      onEnter: () => {
        if (group.classList.contains("is-open")) physics?.drop();
      },
    });
  });
}

function setupFooterAscii(footer) {
  const left = footer.querySelector(".ascii--left");
  const right = footer.querySelector(".ascii--right");
  if (!left || !right) return;

  const ASCII_CHARS = " .,:;irsXA253hMHGS#9B&@";
  const FONT_SIZE = 17;
  const CELL_SIZE = 20;
  const ASCII_COLUMNS = mobile ? 76 : 96;
  const DPR = 2;
  const CHAR_COLOR = "#8b3d06";
  const CHAR_SHADOW_COLOR = "rgba(255, 106, 0, 0.16)";
  const HOVER_COLOR = "#ff6a00";
  const HOVER_CHAR_COLOR = "#0f0f0f";
  const HOVER_RADIUS = mobile ? 5 : 8;
  const CLUSTER_SIZE = mobile ? 7 : 10;
  const HIGHLIGHT_LIFETIME = 300;

  const HOVER_CHARS = ["x", "X", "0", "3", "6", "9", "#", "@"];
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const luminance = (red, green, blue) => red * 0.2126 + green * 0.7152 + blue * 0.0722;
  const backgroundCharIndex = ASCII_CHARS.indexOf(".");

  const prepareImage = (image) => {
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const alpha = data[offset + 3];
        const light = luminance(data[offset], data[offset + 1], data[offset + 2]);
        if (alpha < 16 || light < 14) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (minX > maxX || minY > maxY) {
      return { canvas, bounds: { x: 0, y: 0, width, height } };
    }

    const padding = Math.round(Math.min(width, height) * 0.025);
    const x = Math.max(0, minX - padding);
    const y = Math.max(0, minY - padding);
    return {
      canvas,
      bounds: {
        x,
        y,
        width: Math.min(width - x, maxX - minX + 1 + padding * 2),
        height: Math.min(height - y, maxY - minY + 1 + padding * 2),
      },
    };
  };

  let frame = null;
  let controls = [];

  const requestRender = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      let hasActiveHighlights = false;
      controls.forEach((control) => {
        if (drawHand(control)) hasActiveHighlights = true;
      });
      if (hasActiveHighlights) requestRender();
    });
  };

  const drawBaseHand = (control) => {
    control.baseCanvas.width = control.canvas.width;
    control.baseCanvas.height = control.canvas.height;
    control.baseContext.setTransform(DPR, 0, 0, DPR, 0, 0);
    control.baseContext.clearRect(0, 0, control.width, control.height);
    control.baseContext.font = `${FONT_SIZE}px monospace`;
    control.baseContext.textAlign = "center";
    control.baseContext.textBaseline = "alphabetic";
    control.baseContext.fillStyle = CHAR_COLOR;
    control.baseContext.shadowColor = CHAR_SHADOW_COLOR;
    control.baseContext.shadowBlur = 4;

    for (const cell of control.cellList) {
      control.baseContext.globalAlpha = cell.alpha;
      control.baseContext.fillText(
        cell.char,
        cell.col * CELL_SIZE + CELL_SIZE / 2,
        cell.row * CELL_SIZE + control.baselineOffset,
      );
    }

    control.baseContext.globalAlpha = 1;
    control.baseContext.shadowColor = "transparent";
    control.baseContext.shadowBlur = 0;
  };

  const rebuildHand = (control) => {
    if (!control.source) return;

    const columns = ASCII_COLUMNS;
    const rows = Math.max(1, Math.round(columns / (control.source.bounds.width / control.source.bounds.height)));
    const width = columns * CELL_SIZE;
    const height = rows * CELL_SIZE;

    control.canvas.width = width * DPR;
    control.canvas.height = height * DPR;
    control.canvas.style.width = "100%";
    control.canvas.style.height = "100%";
    control.context.setTransform(DPR, 0, 0, DPR, 0, 0);
    control.context.font = `${FONT_SIZE}px monospace`;
    control.context.textAlign = "center";
    control.context.textBaseline = "alphabetic";
    control.element.style.aspectRatio = `${columns} / ${rows}`;
    gsap.set(control.canvas, { scale: control.scale });

    const metrics = control.context.measureText("X");
    const glyphHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    control.baselineOffset = metrics.actualBoundingBoxAscent
      ? CELL_SIZE / 2 + glyphHeight / 2 - metrics.actualBoundingBoxDescent
      : CELL_SIZE * 0.72;

    const sampler = document.createElement("canvas");
    sampler.width = columns;
    sampler.height = rows;
    const samplerContext = sampler.getContext("2d", { willReadFrequently: true });
    samplerContext.imageSmoothingEnabled = true;
    samplerContext.filter = "contrast(1.18) saturate(1.05)";
    const bounds = control.source.bounds;
    samplerContext.drawImage(control.source.canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, columns, rows);
    const data = samplerContext.getImageData(0, 0, columns, rows).data;
    const cells = new Map();
    const cellList = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const offset = (row * columns + col) * 4;
        const alpha = data[offset + 3];
        const red = data[offset];
        const green = data[offset + 1];
        const blue = data[offset + 2];
        const light = luminance(red, green, blue);
        const brightness = light / 255;
        const edgeAlpha = alpha / 255;
        const density = clamp((1 - brightness) * 0.66 + edgeAlpha * 0.5 - 0.08);
        const charIndex = Math.min(
          ASCII_CHARS.length - 1,
          Math.floor(density * ASCII_CHARS.length),
        );

        if (alpha < 30 || light < 20 || charIndex <= backgroundCharIndex) continue;

        const cell = {
          col,
          row,
          char: ASCII_CHARS[charIndex],
          alpha: clamp(edgeAlpha * 0.66 + density * 0.28, 0.12, 0.86),
          highlightEndTime: 0,
          highlightChar: ASCII_CHARS[charIndex],
        };
        cells.set(`${col},${row}`, cell);
        cellList.push(cell);
      }
    }

    control.columns = columns;
    control.rows = rows;
    control.width = width;
    control.height = height;
    control.cells = cells;
    control.cellList = cellList;
    control.activeCells.clear();
    drawBaseHand(control);
    drawHand(control);
  };

  function drawHand(control) {
    if (!control.cellList.length) return false;

    const now = performance.now();
    const context = control.context;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, control.canvas.width, control.canvas.height);
    context.drawImage(control.baseCanvas, 0, 0);
    context.restore();
    context.font = `${FONT_SIZE}px monospace`;
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    context.shadowColor = "transparent";
    context.shadowBlur = 0;

    let hasActiveHighlights = false;

    for (const cell of control.activeCells) {
      const x = cell.col * CELL_SIZE;
      const y = cell.row * CELL_SIZE;
      const isHighlighted = cell.highlightEndTime > now;

      if (!isHighlighted) {
        control.activeCells.delete(cell);
        continue;
      }

      hasActiveHighlights = true;
      context.globalAlpha = 1;
      context.fillStyle = HOVER_COLOR;
      context.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      context.fillStyle = HOVER_CHAR_COLOR;
      context.fillText(
        cell.highlightChar,
        x + CELL_SIZE / 2,
        y + control.baselineOffset,
      );

      if (cell.highlightEndTime <= now + 16) {
        context.globalAlpha = 0.5;
        context.fillStyle = CHAR_COLOR;
        context.fillText(cell.char, x + CELL_SIZE / 2, y + control.baselineOffset);
      }
    }

    context.globalAlpha = 1;
    return hasActiveHighlights;
  }

  const highlightCluster = (control, startCell) => {
    const now = performance.now();
    startCell.highlightEndTime = now + HIGHLIGHT_LIFETIME;
    startCell.highlightChar = HOVER_CHARS[Math.floor(Math.random() * HOVER_CHARS.length)];
    control.activeCells.add(startCell);

    const steps = Math.floor(Math.random() * CLUSTER_SIZE) + 1;
    const litCells = [startCell];
    let current = startCell;

    for (let step = 0; step < steps; step += 1) {
      const neighbours = [];
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const neighbour = control.cells.get(`${current.col + dx},${current.row + dy}`);
          if (neighbour && !litCells.includes(neighbour)) neighbours.push(neighbour);
        }
      }

      if (!neighbours.length) break;

      const next = neighbours[Math.floor(Math.random() * neighbours.length)];
      next.highlightEndTime = now + HIGHLIGHT_LIFETIME + step * 10;
      next.highlightChar = HOVER_CHARS[Math.floor(Math.random() * HOVER_CHARS.length)];
      control.activeCells.add(next);
      litCells.push(next);
      current = next;
    }
  };

  const hoverHand = (control, pointer) => {
    if (!control.cellList.length) return false;
    const rect = control.canvas.getBoundingClientRect();
    const mouseCol = ((pointer.x - rect.left) / rect.width) * control.columns;
    const mouseRow = ((pointer.y - rect.top) / rect.height) * control.rows;
    const centerCol = Math.round(mouseCol);
    const centerRow = Math.round(mouseRow);
    const radius = Math.ceil(HOVER_RADIUS);
    const radiusSq = HOVER_RADIUS * HOVER_RADIUS;

    let closest = null;
    let closestDist = Infinity;

    for (let row = centerRow - radius; row <= centerRow + radius; row += 1) {
      for (let col = centerCol - radius; col <= centerCol + radius; col += 1) {
        const cell = control.cells.get(`${col},${row}`);
        if (!cell) continue;

        const dx = mouseCol - cell.col;
        const dy = mouseRow - cell.row;
        const distSq = dx * dx + dy * dy;
        if (distSq < closestDist) {
          closestDist = distSq;
          closest = cell;
        }
      }
    }

    if (closest && closestDist <= radiusSq) {
      highlightCluster(control, closest);
      return true;
    }

    return false;
  };

  const arms = [
    { element: left, src: "/handLeft.png", drift: -1 },
    { element: right, src: "/handRight.png", drift: 1 },
  ];

  controls = arms.map(({ element, src, drift }) => {
    const image = new Image();
    const canvas = document.createElement("canvas");
    image.className = "ascii-hand";
    image.alt = "";
    image.decoding = "async";
    canvas.className = "ascii-canvas";
    element.replaceChildren(image, canvas);

    const control = {
      element,
      image,
      canvas,
      context: canvas.getContext("2d"),
      drift,
      source: null,
      columns: 0,
      rows: 0,
      width: 0,
      height: 0,
      baselineOffset: CELL_SIZE * 0.72,
      scale: 1.06,
      cells: new Map(),
      cellList: [],
      activeCells: new Set(),
      baseCanvas: document.createElement("canvas"),
      baseContext: null,
      x: gsap.quickTo(canvas, "x", { duration: 0.65, ease: "power3.out" }),
      y: gsap.quickTo(canvas, "y", { duration: 0.65, ease: "power3.out" }),
      rotate: gsap.quickTo(canvas, "rotate", { duration: 0.65, ease: "power3.out" }),
    };
    control.baseContext = control.baseCanvas.getContext("2d");

    image.addEventListener("load", () => {
      try {
        control.source = prepareImage(image);
        rebuildHand(control);
      } catch {
        control.context.clearRect(0, 0, control.canvas.width, control.canvas.height);
      }
    }, { once: true });
    image.src = src;

    return control;
  });

  let resizeFrame = null;
  globalThis.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      controls.forEach((control) => {
        control.cells.clear();
        control.cellList = [];
        control.activeCells.clear();
        rebuildHand(control);
      });
      requestRender();
    });
  });

  if (hasReducedMotion()) return;

  let pointerFrame = null;
  let latestPointer = null;
  const schedulePointerUpdate = (event) => {
    latestPointer = { x: event.clientX, y: event.clientY };
    if (pointerFrame) return;

    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = null;
      if (!latestPointer) return;

      const pointerX = latestPointer.x / globalThis.innerWidth - 0.5;
      const pointerY = latestPointer.y / globalThis.innerHeight - 0.5;
      let active = false;
      controls.forEach((control) => {
        control.x(pointerX * 34 * control.drift);
        control.y(pointerY * 28);
        control.rotate(pointerX * 5 * control.drift + pointerY * 2);
        if (hoverHand(control, latestPointer)) active = true;
      });
      if (active) requestRender();
    });
  };

  footer.addEventListener("pointermove", (event) => {
    schedulePointerUpdate(event);
  }, { passive: true });

  footer.addEventListener("pointerleave", () => {
    if (pointerFrame) {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = null;
    }
    latestPointer = null;
    controls.forEach((control) => {
      control.x(0);
      control.y(0);
      control.rotate(0);
    });
  });
}

function initFooter() {
  const footer = document.querySelector(".footer");
  if (!footer) return;

  setupFooterAscii(footer);

  const revealEase = gsap.parseEase("power2.inOut");
  footer.style.setProperty("--footer-reveal", "0vmax");

  ScrollTrigger.create({
    trigger: ".footer-transition",
    start: "top bottom",
    end: "bottom bottom",
    scrub: true,
    onEnter: () => { footer.style.visibility = "visible"; },
    onEnterBack: () => { footer.style.visibility = "visible"; },
    onLeaveBack: () => {
      footer.style.visibility = "hidden";
      footer.style.setProperty("--footer-reveal", "0vmax");
    },
    onUpdate: ({ progress }) => {
      const radius = Math.max(0, revealEase(progress) * 165);
      footer.style.visibility = progress > 0 ? "visible" : "hidden";
      footer.style.setProperty("--footer-reveal", `${radius}vmax`);
      gsap.set(".footer-name", { y: 120 * (1 - progress) });
      gsap.set(".ascii--left", { xPercent: -125 * (1 - progress), opacity: progress });
      gsap.set(".ascii--right", { xPercent: 125 * (1 - progress), opacity: progress });
    },
  });
}

function initTimeline() {
  const timeline = document.querySelector(".scroll-timeline");
  const pct = document.querySelector(".scroll-pct");
  const label = document.querySelector(".scroll-timeline__label");
  const sections = [
    ["À propos", ".about"],
    ["Projets", ".projects"],
    ["Galerie", ".circle-gallery"],
    ["Compétences", ".skills"],
  ];

  const update = () => {
    const max = document.documentElement.scrollHeight - globalThis.innerHeight;
    const progress = max > 0 ? globalThis.scrollY / max : 0;
    timeline.style.setProperty("--progress", `${progress * 100}%`);
    timeline.style.setProperty("--label-y", `${progress * 100}%`);
    pct.textContent = `(${Math.round(progress * 100)})`;

    let current = "Home";
    sections.forEach(([name, selector]) => {
      const element = document.querySelector(selector);
      const top = element.getBoundingClientRect().top + globalThis.scrollY;
      if (globalThis.scrollY >= top - globalThis.innerHeight * 0.45) current = name;
    });
    label.textContent = current;
    const visible = globalThis.scrollY > globalThis.innerHeight * 3.4 && progress < 0.965;
    gsap.to([timeline, pct], { opacity: visible ? 1 : 0, duration: 0.25, overwrite: true });
  };

  globalThis.addEventListener("scroll", update, { passive: true });
  lenis?.on("scroll", update);
  update();
}

function initPreviewJump() {
  const target = new URLSearchParams(globalThis.location.search).get("preview");
  if (!target || target === "1") return;
  globalThis.addEventListener("load", () => {
    const section = document.querySelector(`#${target}, .${target}`);
    if (!section) return;
    globalThis.scrollTo(0, section.offsetTop + (target === "gallery" ? globalThis.innerHeight * 1.5 : 0));
    globalThis.dispatchEvent(new Event("scroll"));
    globalThis.__updateGallery?.();
    ScrollTrigger.update();
  });
}

createGradientCanvas();
initIntro();
initHeroScroll();
initAbout();
initProjects();
initGallery();
initSkills();
initFooter();
initTimeline();
initPreviewJump();

globalThis.addEventListener("load", () => ScrollTrigger.refresh());
