import { interpolate } from "../lib/copy";
const filters = document.querySelector<HTMLElement>(
  "[data-publication-filters]",
);
if (filters) {
  filters.hidden = false;
  const type = document.querySelector<HTMLSelectElement>("#publication-type")!;
  const year = document.querySelector<HTMLSelectElement>("#publication-year")!;
  const items = [
    ...document.querySelectorAll<HTMLElement>("[data-publication]"),
  ];
  const countLabels = {
    one: filters.dataset.countOne!,
    many: filters.dataset.countMany!,
  };
  function apply() {
    let count = 0;
    for (const item of items) {
      item.hidden = !(
        (type.value === "all" || item.dataset.type === type.value) &&
        (year.value === "all" || item.dataset.year === year.value)
      );
      if (!item.hidden) count++;
    }
    document.querySelector("[data-publication-count]")!.textContent =
      interpolate(count === 1 ? countLabels.one : countLabels.many, { count });
    (document.querySelector("[data-publication-empty]") as HTMLElement).hidden =
      count > 0;
  }
  type.addEventListener("change", apply);
  year.addEventListener("change", apply);
  apply();
}
for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-copy]",
)) {
  button.addEventListener("click", async () => {
    const status = button.parentElement!.querySelector('[role="status"]')!;
    try {
      await navigator.clipboard.writeText(button.dataset.copy!);
      status.textContent = document.querySelector<HTMLElement>(
        "[data-citation-messages]",
      )!.dataset.copied!;
    } catch {
      status.textContent = document.querySelector<HTMLElement>(
        "[data-citation-messages]",
      )!.dataset.copyFailed!;
    }
  });
}
for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-download]",
)) {
  button.addEventListener("click", () => {
    const url = URL.createObjectURL(
      new Blob([button.dataset.download!], { type: "application/x-bibtex" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = button.dataset.filename!;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
