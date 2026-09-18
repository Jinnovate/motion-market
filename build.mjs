import { build } from "esbuild";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

const release = "theme-modes-v1";
const html = (await readFile("index.html", "utf8"))
  .replace('href="styles.css"', `href="styles.css?v=${release}"`)
  .replace('src="app.js"', `src="app.js?v=${release}"`);

await Promise.all([
  writeFile("dist/index.html", html),
  copyFile("styles.css", "dist/styles.css"),
  copyFile("_redirects", "dist/_redirects"),
]);

await build({
  entryPoints: ["app.js"],
  bundle: true,
  minify: true,
  outfile: "dist/app.js",
  format: "iife",
  target: "es2020",
});
