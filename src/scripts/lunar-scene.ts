import type { MoonState } from "../lib/astronomy";
import { sceneCell } from "../lib/ascii";
const canvas = document.querySelector<HTMLCanvasElement>("[data-lunar-canvas]");
if (canvas) {
  const ctx = canvas.getContext("2d", { alpha: true });
  const fallbacks = document.querySelectorAll<HTMLElement>(
    "[data-ascii-fallback]",
  );
  const container = canvas.parentElement!;
  let state: MoonState = JSON.parse(canvas.dataset.state!);
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0,
    height = 0,
    cols = 0,
    rows = 0,
    cellHeight = 14,
    cellWidth = 7.84;
  let raf = 0,
    last = 0,
    visualTime = 0,
    quality = 1,
    samples = 0,
    cost = 0;
  let visible = true,
    disposed = false,
    timer: ReturnType<typeof setInterval> | undefined;
  const colors = {
    moon: [246, 237, 231],
    water: [101, 153, 181],
    pink: [233, 167, 196],
    star: [233, 167, 196],
  };
  function draw(time: number) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${cellHeight - 1}px ui-monospace, SFMono-Regular, Consolas, monospace`;
    ctx.textBaseline = "top";
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const cell = sceneCell(
          col,
          row,
          cols,
          rows,
          time,
          state.angle,
          width < 700,
        );
        if (!cell || cell.glyph === " ") continue;
        ctx.fillStyle = `rgba(${colors[cell.tone].join(",")},${cell.alpha})`;
        ctx.fillText(cell.glyph, col * cellWidth, row * cellHeight);
      }
    canvas!.classList.add("is-ready");
    canvas!.dataset.frameTime = time.toFixed(2);
    fallbacks.forEach((fallback) => {
      fallback.hidden = true;
    });
  }
  function resize() {
    width = container.clientWidth;
    height = container.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas!.width = width * dpr;
    canvas!.height = height * dpr;
    canvas!.style.width = `${width}px`;
    canvas!.style.height = `${height}px`;
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    cellHeight = (width < 700 ? 17 : 14) / quality;
    cellWidth = cellHeight * 0.56;
    cols = Math.ceil(width / cellWidth);
    rows = Math.ceil(height / cellHeight);
    draw(visualTime);
  }
  function loop(now: number) {
    if (disposed || !visible || document.hidden || motion.matches) {
      raf = 0;
      return;
    }
    if (now - last >= 1000 / 30) {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      visualTime += dt;
      last = now;
      const before = performance.now();
      draw(visualTime);
      cost += performance.now() - before;
      samples++;
      if (samples === 60) {
        if (cost / samples > 19 && quality > 0.65) {
          quality *= 0.82;
          resize();
        }
        cost = 0;
        samples = 0;
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
    else if (!document.hidden) draw(visualTime);
  }
  async function refresh() {
    if (disposed || document.hidden) return;
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
      draw(visualTime);
    } catch {
      /* The build-time scene remains readable if calculations cannot load. */
    }
  }
  function onVisibility() {
    sync();
    if (!document.hidden) void refresh();
  }
  const resizeObserver = new ResizeObserver(resize);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
    sync();
  });
  if (ctx) {
    resizeObserver.observe(container);
    intersection.observe(container);
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", sync);
    resize();
    sync();
    setTimeout(() => {
      if (!disposed) {
        void refresh();
        timer = setInterval(() => void refresh(), 60_000);
      }
    }, 500);
  }
  document.addEventListener(
    "astro:before-swap",
    () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearInterval(timer);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", sync);
    },
    { once: true },
  );
}
