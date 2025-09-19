#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const GEO_DB_URL =
  'https://github.com/P3TERX/GeoLite.mmdb/releases/download/2024.08.13/GeoLite2-City.mmdb';
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'GeoLite2-City.mmdb');

console.log('📥 Downloading GeoLite2-City database...');

// Create data directory if it doesn't exist
const dataDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const file = fs.createWriteStream(OUTPUT_PATH);

https
  .get(GEO_DB_URL, (response) => {
    if (response.statusCode === 200) {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('✅ GeoLite2-City database downloaded successfully!');
        console.log(`📁 Saved to: ${OUTPUT_PATH}`);

        // Verify file
        const stats = fs.statSync(OUTPUT_PATH);
        console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      });

      file.on('error', (err) => {
        fs.unlink(OUTPUT_PATH, () => {}); // Delete the file on error
        console.error('❌ Error writing file:', err);
      });
    } else {
      console.error('❌ Failed to download database. Status:', response.statusCode);
    }
  })
  .on('error', (err) => {
    console.error('❌ Error downloading database:', err);
  });
