import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const vendor = path.join(root, 'vendor');

fs.mkdirSync(vendor, { recursive: true });

const copies = [
  ['node_modules/jspdf/dist/jspdf.umd.min.js', 'jspdf.umd.min.js'],
  ['node_modules/html2canvas/dist/html2canvas.min.js', 'html2canvas.min.js'],
  ['node_modules/chart.js/dist/chart.umd.js', 'chart.umd.js'],
];

for (const [srcRel, destName] of copies) {
  const src = path.join(root, srcRel);
  const dest = path.join(vendor, destName);
  if (!fs.existsSync(src)) {
    console.error('Missing vendor source:', srcRel);
    process.exitCode = 1;
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log('Copied', destName);
}
