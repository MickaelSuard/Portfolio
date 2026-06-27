import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const mobile = window.matchMedia("(max-width: 768px)").matches;
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const previewMode = new URLSearchParams(window.location.search).has("preview");

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!previewMode && window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);

let lenis = null;

function resetScrollToTop() {
  if (previewMode) return;
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo(0, 0);
  lenis?.scrollTo(0, { immediate: true, force: true });
}

function keepInitialScrollAtTop() {
  if (previewMode) return;
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
window.addEventListener("pageshow", keepInitialScrollAtTop);
window.addEventListener("beforeunload", resetScrollToTop);
window.addEventListener("load", keepInitialScrollAtTop);

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
  if (reduced || previewMode) return null;
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
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
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

function initIntro() {
  splitIntroChars();
  const heroBar = document.querySelector(".hero-bar");
  if (heroBar && heroBar.parentElement !== document.body) document.body.append(heroBar);
  const heroLine = document.querySelector(".hero-line");
  if (heroLine && heroLine.parentElement !== document.body) document.body.append(heroLine);
  const chars = gsap.utils.toArray(".intro-char");
  gsap.set(chars, { yPercent: 115 });
  gsap.set(".hero", { opacity: 1 });
  setHeroChromeVisible(false, true);

  if (previewMode || reduced) {
    gsap.set(chars, { yPercent: 0 });
    gsap.set(".intro-bg, .transition-panels", { display: "none" });
    gsap.set(".hero-tagline", { opacity: 1, clipPath: "inset(0 0 0 0)" });
    heroChromeReady = true;
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
    }, null, "-=0.6");
}

function initHeroScroll() {
  const name = document.querySelector(".intro-name");
  const firstGroup = document.querySelector(".intro-name__first-group");
  const lastGroup = document.querySelector(".intro-name__last-group");
  const nameColorTargets = gsap.utils.toArray(".intro-name, .intro-name__first, .intro-name__first-rest, .intro-name__last, .intro-char");
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
  const startHeight = () => Math.round(window.innerHeight * (mobile ? 0.22 : 0.24));
  const introAspect = 1244 / 1666;
  const worldCoverWidth = () => `${Math.max(window.innerWidth, window.innerHeight * introAspect)}px`;
  const worldCoverHeight = () => `${Math.max(window.innerHeight, window.innerWidth / introAspect)}px`;
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
    .to(name, { "--intro-gap": () => `${window.innerWidth * (mobile ? 0.52 : 0.56)}px`, duration: 0.78, ease: "none" }, 0.18)
    .to(viewport, {
      "--world-width": worldCoverWidth,
      "--world-height": worldCoverHeight,
      duration: 0.78,
      ease: "none",
    }, 0.18)
    .to(media, { scale: 1, duration: 0.78, ease: "none" }, 0.18)
    .to([firstGroup, lastGroup], { opacity: 0, duration: 0.18, ease: "none" }, 0.78)
    .to(".world-phrase", { opacity: 1, filter: "blur(0px)", duration: 0.18, ease: "none" }, 0.76);

  gsap.timeline({
    scrollTrigger: {
      trigger: ".dark-content",
      start: "top bottom",
      end: "top top",
      scrub: true,
    },
  })
    .to(".world-phrase", { opacity: 0, duration: 0.25 }, 0)
    .to(viewport, { y: "-50vh", filter: "blur(15px)", opacity: 0.3, duration: 1, ease: "none" }, 0);
}

function initAbout() {
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

function initProjects() {
  if (mobile) return;
  const section = document.querySelector(".projects");
  const items = gsap.utils.toArray(".project-item");
  const preview = document.querySelector(".project-preview");
  const art = preview.querySelector(".project-art");
  const date = preview.querySelector(".project-preview__date");
  const cursor = document.querySelector(".project-cursor");
  let current = -1;
  let visible = false;
  let targetRX = 0;
  let targetRY = 0;
  let rx = 0;
  let ry = 0;

  const activate = (index) => {
    if (index === current) return;
    items.forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === index));
    art.className = `project-art project-art--${index}`;
    art.querySelector("span").textContent = items[index].textContent.trim().charAt(0);
    date.textContent = items[index].dataset.date;
    gsap.fromTo(art, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.35 });
    current = index;
  };

  ScrollTrigger.create({
    trigger: section,
    start: "top 80%",
    end: "bottom 20%",
    onToggle: ({ isActive }) => {
      visible = isActive;
      gsap.to(preview, { opacity: isActive ? 1 : 0, duration: 0.35 });
    },
  });

  const xSetters = items.map((item) => gsap.quickTo(item, "x", { duration: 0.55, ease: "power2.out" }));
  const updateActive = () => {
    if (!visible) return;
    const center = window.innerHeight / 2;
    let closest = 0;
    let distance = Infinity;
    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const itemDistance = Math.abs(rect.top + rect.height / 2 - center);
      xSetters[index](Math.min(itemDistance / center, 1) * 78);
      if (itemDistance < distance) {
        distance = itemDistance;
        closest = index;
      }
    });
    activate(closest);
  };

  window.addEventListener("scroll", updateActive, { passive: true });
  lenis?.on("scroll", updateActive);
  updateActive();

  preview.addEventListener("mouseenter", () => gsap.to(cursor, { opacity: 1, duration: 0.25 }));
  preview.addEventListener("mouseleave", () => gsap.to(cursor, { opacity: 0, duration: 0.25 }));
  window.addEventListener("pointermove", (event) => {
    gsap.to(cursor, { x: event.clientX, y: event.clientY, duration: 0.25 });
    const rect = preview.getBoundingClientRect();
    targetRY = ((event.clientX - rect.left) / rect.width - 0.5) * 11;
    targetRX = -((event.clientY - rect.top) / rect.height - 0.5) * 8;
  });

  gsap.ticker.add(() => {
    if (!visible) return;
    rx += (targetRX - rx) * 0.08;
    ry += (targetRY - ry) * 0.08;
    art.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
}

function initGallery() {
  const section = document.querySelector(".circle-gallery");
  const phrase = document.querySelector(".gallery-phrase");
  const cards = gsap.utils.toArray(".orbit-card");
  const words = gsap.utils.toArray(".gallery-phrase .word");
  if (!section || !cards.length) return;

  gsap.set(words, { opacity: 1, filter: "none" });
  gsap.set(phrase, { opacity: 1, y: 0 });

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const ease = (value) => value * value * (3 - 2 * value);
  const mix = (from, to, value) => from + (to - from) * value;

  let progress = 0;

  const renderGallery = (nextProgress = progress) => {
    progress = clamp(nextProgress);
    const radiusX = Math.min(window.innerWidth * (mobile ? 0.38 : 0.34), mobile ? 235 : 520);
    const radiusY = Math.min(window.innerHeight * (mobile ? 0.16 : 0.18), mobile ? 105 : 155);
    const entryEnd = 0.18;
    const exitStart = 0.92;
    const cardGap = 0.115;
    const pathRange = 1 + cardGap * (cards.length - 1);
    const lowerTrackY = Math.min(window.innerHeight * (mobile ? 0.34 : 0.32), mobile ? 230 : 310);
    const exitTrackY = -Math.min(window.innerHeight * (mobile ? 0.1 : 0.12), mobile ? 80 : 120);
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
      const startX = -window.innerWidth / 2 - cardWidth / 2 - 56;
      const startY = lowerTrackY;
      const endX = window.innerWidth / 2 + cardWidth / 2 + 56;
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

    phrase.style.opacity = "1";
    phrase.style.transform = "translateY(0px)";
  };

  const galleryTrigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => renderGallery(self.progress),
    onRefresh: (self) => renderGallery(self.progress),
  });

  window.addEventListener("resize", () => renderGallery(galleryTrigger.progress));
  window.__updateGallery = () => renderGallery(galleryTrigger.progress);
  renderGallery(0);
}

function initSkills() {
  document.querySelectorAll(".skill-group").forEach((group) => {
    const button = group.querySelector("button");
    const body = group.querySelector(".skill-body");
    if (group.classList.contains("is-open")) gsap.set(body, { height: "auto" });
    button.addEventListener("click", () => {
      const open = group.classList.toggle("is-open");
      gsap.to(body, { height: open ? "auto" : 0, duration: 0.5, ease: "power3.inOut" });
    });
  });
}

function initContact() {
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom bottom", scrub: 1 },
  });
  timeline
    .to(".contact-blob", { scale: 1, duration: 0.33, ease: "power2.inOut" }, 0)
    .fromTo(".contact h2", { x: "-8vw", y: "14vh" }, { x: 0, y: 0, duration: 0.3 }, 0.16)
    .fromTo(".contact-frame--one", { y: "55vh", filter: "blur(12px)" }, { y: 0, filter: "blur(0px)", duration: 0.35 }, 0.17)
    .fromTo(".contact-copy--one", { y: "35vh", opacity: 0 }, { y: 0, opacity: 1, duration: 0.28 }, 0.25)
    .fromTo(".contact-frame--two", { y: "45vh", opacity: 0 }, { y: 0, opacity: 1, duration: 0.28 }, 0.52)
    .fromTo(".contact-copy--two", { y: "30vh", opacity: 0 }, { y: 0, opacity: 1, duration: 0.25 }, 0.62)
    .fromTo(".contact-bottom", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2 }, 0.68);
}

function initFooter() {
  const footer = document.querySelector(".footer");
  ScrollTrigger.create({
    trigger: ".footer-transition",
    start: "top bottom",
    end: "bottom bottom",
    scrub: true,
    onEnter: () => { footer.style.visibility = "visible"; },
    onEnterBack: () => { footer.style.visibility = "visible"; },
    onLeaveBack: () => { footer.style.visibility = "hidden"; },
    onUpdate: ({ progress }) => {
      gsap.set(".contact-pin", { y: -window.innerHeight * progress });
      gsap.set(".footer-name", { y: 160 * (1 - progress) });
      gsap.set(".ascii--left", { x: -180 * (1 - progress) });
      gsap.set(".ascii--right", { x: 180 * (1 - progress) });
    },
  });
}

function initTimeline() {
  const timeline = document.querySelector(".scroll-timeline");
  const pct = document.querySelector(".scroll-pct");
  const label = document.querySelector(".scroll-timeline__label");
  const sections = [
    ["About", ".about"],
    ["Projects", ".projects"],
    ["Gallery", ".circle-gallery"],
    ["Skills", ".skills"],
    ["Contact", ".contact"],
  ];

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    timeline.style.setProperty("--progress", `${progress * 100}%`);
    timeline.style.setProperty("--label-y", `${progress * 100}%`);
    pct.textContent = `(${Math.round(progress * 100)})`;

    let current = "Home";
    sections.forEach(([name, selector]) => {
      const element = document.querySelector(selector);
      const top = element.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY >= top - window.innerHeight * 0.45) current = name;
    });
    label.textContent = current;
    const visible = window.scrollY > window.innerHeight * 3.4 && progress < 0.965;
    gsap.to([timeline, pct], { opacity: visible ? 1 : 0, duration: 0.25, overwrite: true });
  };

  window.addEventListener("scroll", update, { passive: true });
  lenis?.on("scroll", update);
  update();
}

function initPreviewJump() {
  const target = new URLSearchParams(window.location.search).get("preview");
  if (!target || target === "1") return;
  window.addEventListener("load", () => {
    const section = document.querySelector(`#${target}, .${target}`);
    if (!section) return;
    window.scrollTo(0, section.offsetTop + (target === "gallery" ? window.innerHeight * 1.5 : 0));
    window.dispatchEvent(new Event("scroll"));
    window.__updateGallery?.();
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
initContact();
initFooter();
initTimeline();
initPreviewJump();

window.addEventListener("load", () => ScrollTrigger.refresh());
