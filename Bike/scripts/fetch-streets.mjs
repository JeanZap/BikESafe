/**
 * Baixa a malha de ruas cicláveis de Vitória - ES do OpenStreetMap (Overpass)
 * e gera `src/data/vitoria-streets.json`, usado pelo mapa de calor de ruas.
 *
 * Uso: node scripts/fetch-streets.mjs
 *
 * Formato de saída (compacto): { bbox, ways: number[][] }, onde cada via é uma
 * lista plana [lng0, lat0, lng1, lat1, ...] com 5 casas decimais (~1 m).
 * Dados © OpenStreetMap contributors (ODbL).
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Ilha de Vitória + parte continental (sul, oeste, norte, leste).
const BBOX = [-20.335, -40.365, -20.225, -40.265];

const HIGHWAYS = [
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'unclassified',
  'residential',
  'living_street',
  'cycleway',
  'trunk_link',
  'primary_link',
  'secondary_link',
  'tertiary_link',
].join('|');

const QUERY = `
[out:json][timeout:90];
way["highway"~"^(${HIGHWAYS})$"](${BBOX.join(',')});
out geom;
`;

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

/** Douglas–Peucker simples em graus (tolerância ~1,5 m). */
function simplify(points, tol = 0.000015) {
  if (points.length <= 2) return points;
  let maxD = 0;
  let index = 0;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (d > maxD) {
      maxD = d;
      index = i;
    }
  }
  if (maxD <= tol) return [points[0], points[points.length - 1]];
  return [...simplify(points.slice(0, index + 1), tol).slice(0, -1), ...simplify(points.slice(index), tol)];
}

async function fetchOverpass() {
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'e-bike-segura-hackathon/1.0 (scripts/fetch-streets.mjs)',
        },
        body: `data=${encodeURIComponent(QUERY)}`,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Falhou em ${url}: ${err.message}`);
    }
  }
  throw new Error('Nenhum servidor Overpass respondeu.');
}

const data = await fetchOverpass();
const round = (n) => Math.round(n * 1e5) / 1e5;

const ways = data.elements
  .filter((e) => e.type === 'way' && Array.isArray(e.geometry) && e.geometry.length >= 2)
  .map((e) => simplify(e.geometry.map((g) => [g.lon, g.lat])).flatMap(([x, y]) => [round(x), round(y)]));

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'vitoria-streets.json');
writeFileSync(out, JSON.stringify({ bbox: [BBOX[1], BBOX[0], BBOX[3], BBOX[2]], ways }));
console.log(`${ways.length} vias salvas em ${out}`);
