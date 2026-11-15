#!/usr/bin/env node
/**
 * Gera public/favicon.ico a partir do PNG 32×32 (entrada PNG no formato ICO).
 * Uso: node scripts/sync-favicon-ico.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const png = readFileSync(join(root, 'public/favicon-32.png'));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);

const entry = Buffer.alloc(16);
entry[0] = 32;
entry[1] = 32;
entry[4] = 1;
entry[5] = 32;
entry.writeUInt32LE(png.length, 8);
entry.writeUInt32LE(22, 12);

writeFileSync(join(root, 'public/favicon.ico'), Buffer.concat([header, entry, png]));
console.log('public/favicon.ico atualizado');