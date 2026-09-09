// scripts/copy-maplibre-worker.mjs
// MapLibre GL v6 charge son worker via un fichier .mjs qui importe lui-même
// un second fichier "maplibre-gl-shared.mjs" en tant que sibling au runtime.
// Turbopack/webpack ne copient pas ce sibling quand on passe par
// `new URL(..., import.meta.url)`, ce qui casse le worker en prod (404).
// On copie donc les deux fichiers tels quels dans public/, pour qu'ils soient
// servis côte à côte sans passer par le bundler.

import { copyFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, "..", "node_modules", "maplibre-gl", "dist");
const DEST_DIR = join(__dirname, "..", "public", "maplibre");

const FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

if (!existsSync(DEST_DIR)) {
  mkdirSync(DEST_DIR, { recursive: true });
}

for (const file of FILES) {
  const src = join(SRC_DIR, file);
  const dest = join(DEST_DIR, file);
  if (!existsSync(src)) {
    console.error(`❌ Fichier source introuvable: ${src}`);
    process.exit(1);
  }
  copyFileSync(src, dest);
  console.log(`✅ Copié: ${file} -> public/maplibre/${file}`);
}
