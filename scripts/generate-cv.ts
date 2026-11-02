import PDFDocument from "pdfkit";
import { createWriteStream, existsSync } from "node:fs";
import { mkdir, readFile, rename, rm } from "node:fs/promises";
import { finished } from "node:stream/promises";
import { academic, profile } from "../src/data/index";

await mkdir("public", { recursive: true });
const temporary = "public/cv.pdf.tmp";
const doc = new PDFDocument({
  size: "A4",
  margins: { top: 55, bottom: 55, left: 58, right: 58 },
  bufferPages: true,
  info: {
    Title: `${profile.name} — Academic CV`,
    Author: profile.name,
    Subject: "Academic curriculum vitae",
  },
});
const stream = createWriteStream(temporary);
doc.pipe(stream);
const completion = finished(stream);
// User-supplied Unicode font supported without changing academic data or templates.
const body =
  process.env.CV_FONT_PATH ||
  (existsSync("public/fonts/cv.ttf") ? "public/fonts/cv.ttf" : "Times-Roman");
const heading =
  process.env.CV_FONT_PATH ||
  (existsSync("public/fonts/cv.ttf") ? "public/fonts/cv.ttf" : "Times-Bold");
const usableWidth = doc.page.width - 116;
function ensure(height: number) {
  if (doc.y + height > doc.page.height - 65) doc.addPage();
}
function paragraph(text: string, size = 11) {
  doc.font(body).fontSize(size);
  ensure(doc.heightOfString(text, { width: usableWidth }) + 10);
  doc.fillColor("#202020").text(text, { width: usableWidth, lineGap: 3 });
  doc.moveDown(0.4);
}
function section(title: string) {
  ensure(65);
  doc
    .moveDown(0.6)
    .font(heading)
    .fontSize(13)
    .fillColor("#15243A")
    .text(title.toUpperCase());
  doc.moveDown(0.3);
  const y = doc.y;
  doc
    .moveTo(58, y)
    .lineTo(doc.page.width - 58, y)
    .strokeColor("#CCCCCC")
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.6);
}
try {
  doc.font(heading).fontSize(26).fillColor("#15243A").text(profile.name);
  doc.moveDown(0.3);
  paragraph(`${profile.role} | ${profile.institution}`);
  paragraph(
    [profile.location, profile.email, ...profile.links.map((l) => l.url)]
      .filter(Boolean)
      .join(" | "),
    10,
  );
  if (profile.nameIsPlaceholder)
    paragraph(
      "DRAFT — Name placeholder. Replace with verified personal details before sharing.",
      10,
    );
  section("Research interests");
  paragraph(
    "Dynamical systems; reservoir computing; machine learning; network topology; synchronization; time-series forecasting.",
  );
  for (const [label, entries] of [
    ["Education", academic.education],
    ["Experience", academic.experience],
  ] as const) {
    if (!entries.length) continue;
    section(label);
    for (const e of entries) {
      ensure(65);
      doc.font(heading).fontSize(11).text(`${e.title} | ${e.institution}`);
      paragraph(`${e.start} — ${e.end}`, 10);
      if (e.description) paragraph(e.description);
    }
  }
  const verified = academic.publications
    .filter((p) => !p.placeholder)
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const [label, records] of [
    [
      "Publications & posters",
      verified.filter((p) => !["talk", "seminar"].includes(p.type)),
    ],
    [
      "Talks & seminars",
      verified.filter((p) => ["talk", "seminar"].includes(p.type)),
    ],
  ] as const) {
    if (!records.length) continue;
    section(label);
    for (const p of records) {
      ensure(80);
      doc.font(heading).fontSize(11).text(p.title, { width: usableWidth });
      paragraph(`${p.authors.join(", ")}. ${p.venue}. ${p.date}. ${p.status}.`);
      const urls = [
        p.doi && `https://doi.org/${p.doi}`,
        p.arxiv && `https://arxiv.org/abs/${p.arxiv}`,
        p.pdf,
        p.code,
        p.slides,
      ].filter((url): url is string => Boolean(url));
      for (const url of urls) {
        ensure(28);
        doc
          .font(body)
          .fontSize(9)
          .fillColor("#264b6e")
          .text(url, {
            link: url.startsWith("/")
              ? `https://simjiahui.github.io${url}`
              : url,
            width: usableWidth,
          });
        doc.moveDown(0.25);
      }
    }
  }
  if (
    !academic.education.length &&
    !academic.experience.length &&
    !verified.length
  ) {
    section("Record status");
    paragraph(
      "Education, experience, publications, and talks have not yet been supplied. No entries have been inferred. Website sample records are excluded.",
    );
  }
  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    doc
      .font(body)
      .fontSize(9)
      .fillColor("#666666")
      .text(
        `${profile.name} · Curriculum vitae · ${i + 1} / ${pages.count}`,
        58,
        doc.page.height - 40,
        { lineBreak: false },
      );
  }
  doc.end();
  await completion;
  const pdf = await readFile(temporary);
  if (
    pdf.length < 1000 ||
    pdf.subarray(0, 5).toString() !== "%PDF-" ||
    !pdf.subarray(-30).toString().includes("%%EOF")
  )
    throw new Error("Generated PDF is incomplete");
  await rename(temporary, "public/cv.pdf");
  console.log(
    `CV generated: ${pages.count} page(s), ${verified.length} verified academic records; samples excluded.`,
  );
} catch (error) {
  doc.destroy();
  stream.destroy();
  await completion.catch(() => {});
  await rm(temporary, { force: true });
  throw error;
}
