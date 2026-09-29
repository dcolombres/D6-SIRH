/**
 * Genera docs/D6-SIRH-Documento-Funcional.pdf a partir del markdown funcional.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jsPDF } from 'jspdf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mdPath = path.join(root, 'docs', 'documento-funcional.md');
const outPath = path.join(root, 'docs', 'D6-SIRH-Documento-Funcional.pdf');

const md = fs.readFileSync(mdPath, 'utf8');

function stripMd(line) {
  return line
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\|/g, ' | ')
    .replace(/^[-*]\s+/, '• ')
    .replace(/^\d+\.\s+/, (m) => m)
    .trim();
}

const rawLines = md.split(/\r?\n/);
const blocks = [];

for (const raw of rawLines) {
  const t = raw.trim();
  if (!t || t === '---') {
    blocks.push({ type: 'gap' });
    continue;
  }
  if (t.startsWith('# ')) {
    blocks.push({ type: 'h1', text: stripMd(t) });
  } else if (t.startsWith('## ')) {
    blocks.push({ type: 'h2', text: stripMd(t) });
  } else if (t.startsWith('### ')) {
    blocks.push({ type: 'h3', text: stripMd(t) });
  } else if (t.startsWith('|') && t.includes('|')) {
    if (/^\|?\s*-+/.test(t.replace(/\|/g, ''))) continue;
    blocks.push({ type: 'table', text: stripMd(t) });
  } else {
    blocks.push({ type: 'p', text: stripMd(t) });
  }
}

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
const pageW = doc.internal.pageSize.getWidth();
const pageH = doc.internal.pageSize.getHeight();
const margin = 18;
const maxW = pageW - margin * 2;
let y = margin;

function newPage() {
  doc.addPage();
  y = margin;
  drawFooter();
}

function drawFooter() {
  const page = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('D6-SIRH · Documento funcional · Uso interno', margin, pageH - 10);
  doc.text(String(page), pageW - margin, pageH - 10, { align: 'right' });
  doc.setTextColor(20);
}

function ensure(space) {
  if (y + space > pageH - 16) newPage();
}

function writeWrapped(text, size, style, leading) {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(text, maxW);
  for (const line of lines) {
    ensure(leading);
    doc.text(line, margin, y);
    y += leading;
  }
}

drawFooter();

for (const b of blocks) {
  if (b.type === 'gap') {
    y += 3;
    continue;
  }
  if (b.type === 'h1') {
    ensure(16);
    y += 2;
    writeWrapped(b.text, 16, 'bold', 7);
    y += 2;
    doc.setDrawColor(20);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
    continue;
  }
  if (b.type === 'h2') {
    ensure(14);
    y += 4;
    writeWrapped(b.text, 12, 'bold', 6);
    y += 2;
    continue;
  }
  if (b.type === 'h3') {
    ensure(12);
    y += 3;
    writeWrapped(b.text, 11, 'bold', 5.5);
    y += 1;
    continue;
  }
  if (b.type === 'table') {
    writeWrapped(b.text, 8.5, 'normal', 4.2);
    continue;
  }
  writeWrapped(b.text, 10, 'normal', 5);
}

doc.save(outPath);
console.log('PDF generado:', outPath);
