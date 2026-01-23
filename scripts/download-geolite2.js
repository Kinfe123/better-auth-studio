#!/usr/bin/env node

const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");

const GEO_DB_URL =
  "https://github.com/P3TERX/GeoLite.mmdb/releases/download/2024.08.13/GeoLite2-City.mmdb";
const OUTPUT_PATH = path.join(__dirname, "..", "data", "GeoLite2-City.mmdb");

const dataDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const file = fs.createWriteStream(OUTPUT_PATH);

https
  .get(GEO_DB_URL, (response) => {
    if (response.statusCode === 200) {
      response.pipe(file);

      file.on("finish", () => {
        file.close();

        const _stats = fs.statSync(OUTPUT_PATH);
      });

      file.on("error", (_err) => {
        fs.unlink(OUTPUT_PATH, () => {}); // Delete the file on error
      });
    } else {
    }
  })
  .on("error", (_err) => {});
