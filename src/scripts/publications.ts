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
      `${count} ${count === 1 ? "record" : "records"}`;
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
      status.textContent = "Citation copied.";
    } catch {
      status.textContent =
        "Copy unavailable. Select the citation text above or download the .bib file.";
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
