import type { MoonState } from "../lib/astronomy";
import {
  GLYPHS,
  SHADES,
  TONES,
  createScene,
  skyCell,
  waterCell,
  waterFrame,
  type Scene,
} from "../lib/ascii";
import type { WaveSample } from "../lib/tides";

const canvas = document.querySelector<HTMLCanvasElement>("[data-lunar-canvas]");
if (canvas) {
  const ctx = canvas.getContext("2d", { alpha: true });
  const fallbacks = document.querySelectorAll<HTMLElement>(
    "[data-ascii-fallback]",
  );
  const container = canvas.parentElement!;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let state: MoonState = JSON.parse(canvas.dataset.state!);
  let scene: Scene, sky: HTMLCanvasElement, atlas: HTMLCanvasElement;
  interface Sprite {
    offsets: Uint32Array;
    colors: Uint32Array;
  }
  let sprites: (Sprite | undefined)[] = [];
  let waterCanvas: HTMLCanvasElement, waterPaint: CanvasRenderingContext2D;
  let waterImage: ImageData,
    pixels: Uint32Array,
    waterTop = 0;
  let tileWidth = 0,
    tileHeight = 0,
    width = 0,
    height = 0,
    dpr = 1;
  let raf = 0,
    resizeRaf = 0,
    last = 0,
    visualTime = 0,
    quality = 1;
  let framesRendered = 0;
  let samples = 0,
    cost = 0,
    cheapWindows = 0;
  let visible = true,
    disposed = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  let initialRefresh: ReturnType<typeof setTimeout> | undefined;
  const sample: WaveSample = { height: 0, slopeX: 0, slopeZ: 0, ripple: 0 };

  function makeAtlas() {
    atlas = document.createElement("canvas");
    tileWidth = Math.ceil(scene.cw * dpr);
    tileHeight = Math.ceil(scene.ch * dpr);
    atlas.width = tileWidth * GLYPHS.length;
    atlas.height = tileHeight * SHADES * TONES;
    const ink = atlas.getContext("2d")!;
    ink.font = `${scene.ch * 0.94 * dpr}px ui-monospace, SFMono-Regular, Consolas, monospace`;
    ink.textBaseline = "top";
    const colors = [
      [101, 153, 181],
      [246, 237, 231],
      [233, 167, 196],
      [178, 199, 220],
    ];
    for (let tone = 0; tone < TONES; tone++)
      for (let shade = 0; shade < SHADES; shade++) {
        const exposure = shade / (SHADES - 1);
        const alpha = tone === 2 ? exposure * 0.62 : exposure * 0.96;
        ink.fillStyle = `rgba(${colors[tone]!.join(",")},${alpha})`;
        const y = (tone * SHADES + shade) * tileHeight;
        for (let glyph = 1; glyph < GLYPHS.length; glyph++)
          ink.fillText(GLYPHS[glyph]!, glyph * tileWidth, y);
      }
  }
  function makeWaterBuffer() {
    waterTop = Math.floor((scene.height * 0.5) / scene.ch);
    waterCanvas = document.createElement("canvas");
    waterCanvas.width = scene.cols * tileWidth;
    waterCanvas.height = (scene.rows - waterTop) * tileHeight;
    waterPaint = waterCanvas.getContext("2d")!;
    waterImage = waterPaint.createImageData(
      waterCanvas.width,
      waterCanvas.height,
    );
    pixels = new Uint32Array(waterImage.data.buffer);
    const source = atlas
      .getContext("2d")!
      .getImageData(0, 0, atlas.width, atlas.height);
    const packed = new Uint32Array(source.data.buffer);
    sprites = new Array(SHADES * TONES * 64);
    for (let palette = 1; palette < SHADES * TONES; palette++)
      for (let glyph = 1; glyph < GLYPHS.length; glyph++) {
        const offsets: number[] = [],
          colors: number[] = [];
        for (let y = 0; y < tileHeight; y++)
          for (let x = 0; x < tileWidth; x++) {
            const index =
              (palette * tileHeight + y) * atlas.width + glyph * tileWidth + x;
            if (source.data[index * 4 + 3]) {
              offsets.push(y * waterCanvas.width + x);
              colors.push(packed[index]!);
            }
          }
        sprites[glyph | (palette << 6)] = {
          offsets: Uint32Array.from(offsets),
          colors: Uint32Array.from(colors),
        };
      }
  }
  function stamp(
    target: CanvasRenderingContext2D,
    code: number,
    col: number,
    row: number,
  ) {
    if (!code) return;
    target.drawImage(
      atlas,
      (code & 63) * tileWidth,
      (code >> 6) * tileHeight,
      tileWidth,
      tileHeight,
      col * scene.cw,
      row * scene.ch,
      scene.cw,
      scene.ch,
    );
  }
  function cacheSky() {
    sky = document.createElement("canvas");
    sky.width = canvas!.width;
    sky.height = canvas!.height;
    const paint = sky.getContext("2d")!;
    paint.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let row = 0; row < scene.rows; row++)
      for (let col = 0; col < scene.cols; col++)
        stamp(paint, skyCell(scene, col, row), col, row);
  }
  function build() {
    const baseHeight = width < 700 ? 9 : Math.max(8.5, width / (350 * 0.58));
    scene = createScene(
      width,
      height,
      baseHeight / quality,
      state.angle,
      state.fraction,
      state.forcing,
    );
    makeAtlas();
    cacheSky();
    makeWaterBuffer();
    canvas!.dataset.columns = String(scene.cols);
    canvas!.dataset.rows = String(scene.rows);
    canvas!.dataset.pixelRatio = String(dpr);
    canvas!.dataset.targetFps = "30";
    draw(visualTime);
  }
  function draw(time: number) {
    if (!ctx || !scene) return;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(sky, 0, 0, sky.width, sky.height, 0, 0, width, height);
    const frame = waterFrame(scene, time);
    pixels.fill(0);
    for (
      let row = Math.max(waterTop, Math.floor(frame.horizon / scene.ch));
      row < scene.rows;
      row++
    ) {
      const rowOffset = (row - waterTop) * tileHeight * waterCanvas.width;
      for (let col = 0; col < scene.cols; col++) {
        const sprite = sprites[waterCell(scene, frame, col, row, sample)];
        if (!sprite) continue;
        const origin = rowOffset + col * tileWidth;
        for (let i = 0; i < sprite.offsets.length; i++)
          pixels[origin + sprite.offsets[i]!] = sprite.colors[i]!;
      }
    }
    // One upload/blit for the entire sea, rather than thousands of Canvas draw calls.
    waterPaint.putImageData(waterImage, 0, 0);
    ctx.drawImage(
      waterCanvas,
      0,
      0,
      waterCanvas.width,
      waterCanvas.height,
      0,
      waterTop * scene.ch,
      scene.cols * scene.cw,
      (scene.rows - waterTop) * scene.ch,
    );
    canvas!.classList.add("is-ready");
    canvas!.dataset.frameTime = time.toFixed(2);
    canvas!.dataset.framesRendered = String(++framesRendered);
    fallbacks.forEach((fallback) => {
      fallback.hidden = true;
    });
  }
  function resize() {
    if (disposed || !ctx) return;
    const nextWidth = container.clientWidth,
      nextHeight = container.clientHeight;
    if (nextWidth <= 0 || nextHeight <= 0) return;
    const nextDpr = Math.min(
      devicePixelRatio || 1,
      nextWidth < 700 ? 1.25 : 1.5,
    );
    if (nextWidth === width && nextHeight === height && nextDpr === dpr) return;
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas!.width = Math.round(width * dpr);
    canvas!.height = Math.round(height * dpr);
    canvas!.style.width = `${width}px`;
    canvas!.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }
  function loop(now: number) {
    if (disposed || !visible || document.hidden || motion.matches) {
      raf = 0;
      return;
    }
    if (now - last >= 1000 / 30 - 0.6) {
      visualTime += last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      const before = performance.now();
      draw(visualTime);
      cost += performance.now() - before;
      samples++;
      if (samples === 90) {
        const average = cost / samples;
        canvas!.dataset.renderMs = average.toFixed(2);
        if (average > 20 && quality > 0.62) {
          quality = Math.max(0.62, quality * 0.85);
          cheapWindows = 0;
          build();
        } else if (average < 8 && quality < 1 && ++cheapWindows >= 3) {
          quality = Math.min(1, quality * 1.08);
          cheapWindows = 0;
          build();
        } else if (average >= 8) cheapWindows = 0;
        samples = 0;
        cost = 0;
      }
    }
    raf = requestAnimationFrame(loop);
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    if (!document.hidden && visible && !motion.matches)
      raf = requestAnimationFrame(loop);
    else if (!document.hidden && visible) draw(visualTime);
  }
  async function refresh() {
    if (disposed || document.hidden || !visible) return;
    try {
      const { moonState } = await import("../lib/astronomy");
      if (disposed) return;
      state = moonState(new Date());
      const set = (selector: string, value: string) => {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
      };
      set("[data-phase]", state.phase);
      set(
        "[data-illumination]",
        `${Math.round(state.fraction * 100)}% illuminated`,
      );
      set("[data-lunar-date]", state.calendar.label);
      set(
        "[data-festival]",
        state.calendar.festival ?? "A quiet moment under the same moon.",
      );
      set(
        "[data-moon-position]",
        `${state.altitude.toFixed(1)}° altitude · ${state.azimuth.toFixed(1)}° azimuth`,
      );
      set(
        "[data-observation-time]",
        new Intl.DateTimeFormat("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Shanghai",
        }).format(new Date()),
      );
      // Keep the visual clock continuous; only the slowly evolving ephemeris changes.
      if (ctx) build();
    } catch {
      /* A complete build-time scene remains available if astronomy cannot load. */
    }
  }
  function onVisibility() {
    sync();
    if (!document.hidden) void refresh();
  }
  const resizeObserver = new ResizeObserver(() => {
    if (!resizeRaf)
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resize();
      });
  });
  const intersection = new IntersectionObserver((entries) => {
    const wasVisible = visible;
    visible = entries[0]?.isIntersecting ?? true;
    sync();
    if (visible && !wasVisible) void refresh();
  });
  function cleanup() {
    disposed = true;
    cancelAnimationFrame(raf);
    cancelAnimationFrame(resizeRaf);
    clearInterval(timer);
    clearTimeout(initialRefresh);
    resizeObserver.disconnect();
    intersection.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    motion.removeEventListener("change", sync);
  }
  if (ctx) {
    resize();
    resizeObserver.observe(container);
    intersection.observe(container);
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", sync);
    sync();
    initialRefresh = setTimeout(() => {
      if (!disposed) {
        void refresh();
        timer = setInterval(() => void refresh(), 60_000);
      }
    }, 500);
  }
  document.addEventListener("astro:before-swap", cleanup, { once: true });
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else cleanup();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      sync();
      void refresh();
    }
  });
}
