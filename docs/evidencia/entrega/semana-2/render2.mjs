import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Uso: node render2.mjs <cuerpo.html> <salida.pdf> "<pie>"
// El cuerpo se ensambla con estilo.css que vive junto a él, para que el PDF se
// pueda rehacer desde la fuente sin depender de un archivo intermedio.
const [entrada, salida, pie] = process.argv.slice(2);
const dir = path.dirname(path.resolve(entrada));
const css = fs.readFileSync(path.join(dir, "estilo.css"), "utf8");
const cuerpo = fs.readFileSync(entrada, "utf8");

const ensamblado = `<!doctype html>
<meta charset="utf-8">
<title>ClosetAI — Week 2 Submission Packet</title>
<style>
${css}
</style>
${cuerpo}
`;
const ruta = path.join(dir, "packet2.html");
fs.writeFileSync(ruta, ensamblado);

const b = await chromium.launch();
const p = await b.newPage();
await p.goto(`file://${ruta}`, { waitUntil: "networkidle" });

// Ninguna imagen puede quedarse sin cargar: en un PDF no se nota hasta que se abre.
const rotas = await p.evaluate(() =>
  [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute("src")),
);
if (rotas.length) throw new Error(`imágenes que no cargaron: ${rotas.join(", ")}`);

await p.pdf({
  path: salida,
  format: "Letter",
  printBackground: true,
  margin: { top: "15mm", right: "15mm", bottom: "16mm", left: "15mm" },
  displayHeaderFooter: true,
  headerTemplate: "<div></div>",
  footerTemplate: `<div style="width:100%;font:8pt 'Helvetica Neue',Helvetica,Arial,sans-serif;color:#7d7466;padding:0 15mm;display:flex;justify-content:space-between">
      <span>${pie ?? ""}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`,
});
await b.close();
console.log("imágenes:", await Promise.resolve((await fs.promises.readFile(ruta, "utf8")).match(/<img/g)?.length ?? 0));
console.log("pdf:", salida, (fs.statSync(salida).size / 1e6).toFixed(2), "MB");
