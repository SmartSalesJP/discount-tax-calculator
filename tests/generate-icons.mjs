// Optional development helper; runtime app has no dependencies.
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(process.env.BROWSER_MODULE_DIR ? path.join(process.env.BROWSER_MODULE_DIR, 'package.json') : import.meta.url);
const sharp = require('sharp');
const base = new URL('../assets/', import.meta.url);
const svg = await readFile(new URL('icon.svg', base));
for (const [size, name] of [[192,'icon-192.png'],[512,'icon-512.png'],[180,'apple-touch-icon.png']]) {
  await sharp(svg).resize(size,size).png().toFile(fileURLToPath(new URL(name, base)));
}
await sharp(Buffer.from(svg.toString().replace('rx="112"','rx="0"'))).resize(512,512).png().toFile(fileURLToPath(new URL('icon-maskable-512.png', base)));
console.log('Generated PNG icons: 192, 512, Apple 180, maskable 512.');
