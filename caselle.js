// v117 punto 3: ogni casella del tabellone ha il suo edificio, che cresce con i livelli.
// Piccoli disegni SVG fatti al volo (nessuna immagine da scaricare, nessun calcolo pesante): 60x60, vista 2,5D.
const DX = 7, DY = 5; // profondita' della scatola
const sc = (c, k) => { // schiarisce (k>0) o scurisce (k<0) un colore #rrggbb
  const n = parseInt(c.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map((v) => v.toString(16).padStart(2, "0")).join("");
};
function scatola(x, y, w, h, col, tetto) { // y = base. Facciata, lato e tetto
  const f = `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${col}"/>`;
  const l = `<polygon points="${x + w},${y} ${x + w + DX},${y - DY} ${x + w + DX},${y - h - DY} ${x + w},${y - h}" fill="${sc(col, -0.32)}"/>`;
  const t = `<polygon points="${x},${y - h} ${x + DX},${y - h - DY} ${x + w + DX},${y - h - DY} ${x + w},${y - h}" fill="${tetto || sc(col, 0.25)}"/>`;
  return f + l + t;
}
function finestre(x, y, w, h, col, passoX = 5, passoY = 5, lw = 2.6, lh = 2.4) {
  let s = "";
  for (let yy = y - h + 3; yy + lh <= y - 2; yy += passoY) for (let xx = x + 2.5; xx + lw <= x + w - 1.5; xx += passoX) s += `<rect x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" width="${lw}" height="${lh}" fill="${col}"/>`;
  return s;
}
function tettoAPunta(x, y, w, col) { // y = cima della facciata
  return `<polygon points="${x - 1},${y} ${x + w / 2},${y - 7} ${x + w + 1},${y}" fill="${col}"/><polygon points="${x + w + 1},${y} ${x + w / 2},${y - 7} ${x + w / 2 + DX},${y - 7 - DY} ${x + w + 1 + DX},${y - DY}" fill="${sc(col, -0.3)}"/>`;
}
function tendone(x, y, w, a, b) { // tenda a strisce sopra una vetrina
  let s = ""; const n = Math.max(3, Math.round(w / 4));
  for (let i = 0; i < n; i++) s += `<polygon points="${x + (i * w) / n},${y} ${x + ((i + 1) * w) / n},${y} ${x + ((i + 1) * w) / n + 1},${y + 4} ${x + (i * w) / n + 1},${y + 4}" fill="${i % 2 ? b : a}"/>`;
  return s;
}
function bandiera(x, y, col) { return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 12}" stroke="#2a2f3a" stroke-width="1.2"/><polygon points="${x},${y - 12} ${x + 9},${y - 9.5} ${x},${y - 7}" fill="${col}" stroke="#fff" stroke-width=".6"/>`; }

// lvl 1..5: l'altezza cresce, dal 4 compare un'ala in piu', al 5 una luce sul tetto
const TIPI = {
  residenze: (L, b) => { let s = ""; const n = Math.min(3, 1 + Math.floor(L / 2)); for (let i = 0; i < n; i++) { const x = 10 + i * 13 - (n - 1) * 2, h = 9 + L * 1.6; s += scatola(x, b - i * 1.5, 10, h, ["#f2d6b3", "#e9c9a0", "#f5e1c8"][i]) + tettoAPunta(x, b - i * 1.5 - h, 10, "#c8553d") + `<rect x="${x + 3.5}" y="${b - i * 1.5 - 5}" width="3" height="5" fill="#7a4b2a"/>`; } return s; },
  ristorante: (L, b) => { const h = 11 + L * 2.2; return scatola(12, b, 30, h, "#f4ead8") + finestre(12, b - 6, 30, h - 6, "#ffd98a", 6, 5) + tendone(11, b - 9, 32, "#d62828", "#fff") + `<rect x="24" y="${b - 6}" width="5" height="6" fill="#6b3b1f"/>` + (L >= 4 ? scatola(4, b, 8, h * 0.6, "#ead9bd") : ""); },
  hotel: (L, b) => { const h = 16 + L * 5; return scatola(16, b, 22, h, "#e8eef5", "#c9d6e3") + finestre(16, b, 22, h, "#ffe7a3", 4.5, 4.2, 2.6, 2.2) + `<rect x="21" y="${b - h - DY - 4}" width="12" height="4" rx="1" fill="#c9a24a"/><text x="27" y="${b - h - DY - 1}" font-size="3.6" text-anchor="middle" fill="#1a1206" font-weight="900">HOTEL</text>` + (L >= 4 ? scatola(6, b, 10, h * 0.55, "#dfe7f0") + finestre(6, b, 10, h * 0.55, "#ffe7a3", 4.5, 4.2, 2.4, 2.2) : ""); },
  boutique: (L, b) => { const h = 12 + L * 2.4; return scatola(13, b, 28, h, "#fbe3ec") + `<rect x="15" y="${b - 9}" width="24" height="8" fill="#9fd3ff" opacity=".85"/>` + tendone(12, b - 12, 30, "#e85d9a", "#fff") + finestre(13, b - 13, 28, h - 13, "#ffd1e2", 6, 5) + (L >= 4 ? scatola(5, b, 8, h * 0.7, "#f6d0de") : ""); },
  uffici: (L, b) => { const h = 18 + L * 6; return scatola(17, b, 18, h, "#2d6db3", "#7fb2e8") + finestre(17, b, 18, h, "#bfe3ff", 3.4, 3.4, 2.4, 1.8) + (L >= 3 ? scatola(5, b, 11, h * 0.62, "#3b82c4", "#8cc0f0") + finestre(5, b, 11, h * 0.62, "#bfe3ff", 3.4, 3.4, 2.2, 1.8) : ""); },
  yachtclub: (L, b) => `<rect x="2" y="${b - 7}" width="52" height="9" fill="#2a8fc9"/><rect x="6" y="${b - 9}" width="44" height="2.2" fill="#b98b5c"/>` + scatola(8, b - 9, 16, 6 + L * 1.6, "#f6f1e6", "#1f4e79") + [0, 1, 2].slice(0, 1 + Math.min(2, Math.floor(L / 2))).map((i) => `<polygon points="${30 + i * 8},${b - 3} ${37 + i * 8},${b - 3} ${36 + i * 8},${b - 1} ${31 + i * 8},${b - 1}" fill="#fff"/><line x1="${33.5 + i * 8}" y1="${b - 3}" x2="${33.5 + i * 8}" y2="${b - 14 - L}" stroke="#555" stroke-width=".7"/><polygon points="${33.5 + i * 8},${b - 14 - L} ${33.5 + i * 8},${b - 4} ${38 + i * 8},${b - 4}" fill="#fff"/>`).join(""),
  agenzia: (L, b) => { const h = 12 + L * 2.6; return scatola(14, b, 26, h, "#e6f2ea") + `<rect x="16" y="${b - 9}" width="22" height="7" fill="#1f6b4a"/><text x="27" y="${b - 4}" font-size="4.5" text-anchor="middle" fill="#fff" font-weight="900">AFFITTASI</text>` + finestre(14, b - 10, 26, h - 10, "#ffe9a8", 6, 5) + (L >= 4 ? scatola(5, b, 9, h * 0.7, "#d5e9dc") : ""); },
  legale: (L, b) => { const h = 12 + L * 2.4; let c = ""; for (let i = 0; i < 5; i++) c += `<rect x="${14 + i * 6}" y="${b - h + 4}" width="2.4" height="${h - 5}" fill="#fff"/>`; return scatola(12, b, 32, h, "#d9d2c0") + c + `<polygon points="10,${b - h} 28,${b - h - 8} 46,${b - h}" fill="#efe9da"/><polygon points="46,${b - h} 28,${b - h - 8} ${28 + DX},${b - h - 8 - DY} ${46 + DX},${b - h - DY}" fill="#bdb49f"/>`; },
  lavanderia: (L, b) => { const h = 12 + L * 2.4; return scatola(13, b, 28, h, "#e3f4fb") + `<circle cx="21" cy="${b - 6}" r="3.6" fill="#7cc3e8" stroke="#fff" stroke-width="1.2"/><circle cx="31" cy="${b - 6}" r="3.6" fill="#7cc3e8" stroke="#fff" stroke-width="1.2"/>` + finestre(13, b - 11, 28, h - 11, "#ffe9a8", 6, 5) + `<rect x="13" y="${b - 13}" width="28" height="2.5" fill="#1aa3c8"/>`; },
  galleria: (L, b) => { const h = 12 + L * 2.6; return scatola(12, b, 30, h, "#fafafa", "#e5e5e5") + `<rect x="17" y="${b - h + 4}" width="8" height="6" fill="#e9c46a" stroke="#333" stroke-width=".8"/><rect x="29" y="${b - h + 4}" width="8" height="6" fill="#2a9d8f" stroke="#333" stroke-width=".8"/><rect x="24" y="${b - 7}" width="6" height="7" fill="#333"/>` + (L >= 4 ? scatola(4, b, 8, h * 0.7, "#f0f0f0") : ""); },
  magazzino: (L, b) => { const h = 10 + L * 2; let r = ""; for (let i = 0; i < 7; i++) r += `<line x1="${8 + i * 6}" y1="${b - h}" x2="${8 + i * 6 + DX}" y2="${b - h - DY}" stroke="#7d8a96" stroke-width=".8"/>`; return scatola(6, b, 40, h, "#a7b4c0", "#c5d0da") + r + `<rect x="12" y="${b - 8}" width="9" height="8" fill="#5c6b78"/><rect x="26" y="${b - 8}" width="9" height="8" fill="#5c6b78"/>` + (L >= 3 ? `<rect x="40" y="${b - 5}" width="8" height="5" fill="#d9480f"/><rect x="40" y="${b - 10}" width="8" height="5" fill="#2f6fe0"/>` : ""); },
  discoteca: (L, b) => { const h = 13 + L * 2.6; return scatola(12, b, 30, h, "#241b3a", "#3b2a60") + `<rect x="12" y="${b - h + 3}" width="30" height="2" fill="#ff4fa3"/><rect x="12" y="${b - h + 7}" width="30" height="1.6" fill="#4ff0ff"/><circle cx="27" cy="${b - h - DY - 3}" r="3.4" fill="#d9d9e6" stroke="#fff" stroke-width=".6"/><rect x="23" y="${b - 7}" width="8" height="7" fill="#ff4fa3" opacity=".8"/>` + (L >= 4 ? scatola(4, b, 8, h * 0.6, "#2e2348") : ""); },
  beachclub: (L, b) => { let s = `<ellipse cx="28" cy="${b - 2}" rx="26" ry="5" fill="#f1d99b"/>`; s += scatola(8, b - 2, 18, 7 + L * 1.4, "#fff4dc", "#d9a441"); const n = 1 + Math.min(3, Math.floor(L / 1.5)); for (let i = 0; i < n; i++) s += `<line x1="${32 + i * 6}" y1="${b - 2}" x2="${32 + i * 6}" y2="${b - 10}" stroke="#555" stroke-width=".7"/><path d="M${28 + i * 6} ${b - 9} Q${32 + i * 6} ${b - 15} ${36 + i * 6} ${b - 9}Z" fill="${["#ff6b6b", "#ffd93d", "#4dabf7", "#ff922b"][i]}"/>`; return s + `<line x1="50" y1="${b - 2}" x2="48" y2="${b - 20}" stroke="#7a5230" stroke-width="1.6"/><path d="M48 ${b - 20} q-7 1 -9 5 M48 ${b - 20} q7 1 9 5 M48 ${b - 20} q-2 -6 -7 -6 M48 ${b - 20} q3 -6 8 -5" stroke="#2b9348" stroke-width="2" fill="none"/>`; },
  casino: (L, b) => { const h = 14 + L * 3; return scatola(10, b, 34, h, "#2a1a0e", "#c9a24a") + finestre(10, b - 6, 34, h - 6, "#ffcf5c", 5, 4.5) + `<ellipse cx="${27 + DX / 2}" cy="${b - h - DY / 2}" rx="9" ry="4" fill="#e8c35a"/><path d="M${18 + DX / 2} ${b - h - DY / 2} Q${27 + DX / 2} ${b - h - 14} ${36 + DX / 2} ${b - h - DY / 2}Z" fill="#f2d47a"/><rect x="16" y="${b - 8}" width="22" height="4.5" rx="1" fill="#e11d48"/><text x="27" y="${b - 4.6}" font-size="3.6" text-anchor="middle" fill="#fff" font-weight="900">CASINÒ</text>`; },
  bancaprivata: (L, b) => { const h = 14 + L * 3; let c = ""; for (let i = 0; i < 4; i++) c += `<rect x="${16 + i * 7}" y="${b - h + 3}" width="2.6" height="${h - 4}" fill="#f4e7c3"/>`; return scatola(12, b, 32, h, "#4a5568", "#c9a24a") + c + `<rect x="12" y="${b - h - 1}" width="32" height="2" fill="#c9a24a"/>` + (L >= 4 ? scatola(4, b, 8, h * 0.7, "#5a6578", "#c9a24a") : ""); },
};

// edificio di un terreno con attivita'. col = colore del proprietario (bandierina), serie = colore del gruppo (zoccolo)
export function edificio(tipo, lvl, serie, col, cantiere) {
  const b = 50, L = Math.max(1, Math.min(5, lvl || 1));
  const corpo = cantiere ? cantiereSvg() : (TIPI[tipo] || TIPI.ristorante)(L, b);
  const luce = !cantiere && L >= 5 ? `<circle cx="50" cy="8" r="2.4" fill="#fff6c2"><animate attributeName="opacity" values="1;.35;1" dur="2.4s" repeatCount="indefinite"/></circle>` : "";
  return `<svg viewBox="0 0 60 60" class="edi" aria-hidden="true">${zoccolo(serie)}${corpo}${col ? bandiera(53, b + 1, col) : ""}${luce}</svg>`;
}
function zoccolo(serie) { return `<polygon points="2,${53} 50,${53} 57,${48} 9,${48}" fill="${sc(serie, 0.15)}"/><polygon points="2,53 50,53 50,57 2,57" fill="${serie}"/><polygon points="50,53 57,48 57,52 50,57" fill="${sc(serie, -0.3)}"/>`; }
function cantiereSvg() { return `<rect x="10" y="38" width="30" height="12" fill="#c7c2b8"/><line x1="44" y1="50" x2="44" y2="14" stroke="#f2b705" stroke-width="2"/><line x1="44" y1="15" x2="22" y2="15" stroke="#f2b705" stroke-width="2"/><line x1="26" y1="15" x2="26" y2="28" stroke="#333" stroke-width=".7"/><rect x="23" y="28" width="6" height="4" fill="#8a8a8a"/><polygon points="10,38 40,38 40,36 10,36" fill="#f2b705"/>`; }
// terreno libero in vendita: prato con recinto e cartello col prezzo (il prezzo e' scritto sopra, in HTML, per restare nitido)
export function lottoLibero(serie) {
  let p = ""; for (let i = 0; i < 9; i++) p += `<rect x="${6 + i * 5.2}" y="38" width="1.4" height="9" fill="#fff" opacity=".9"/>`;
  return `<svg viewBox="0 0 60 60" class="edi" aria-hidden="true">${zoccolo(serie)}<polygon points="4,48 50,48 56,43 10,43" fill="#7fb069"/><rect x="5" y="40" width="46" height="1.2" fill="#fff" opacity=".9"/><rect x="5" y="44" width="46" height="1.2" fill="#fff" opacity=".9"/>${p}<line x1="29" y1="47" x2="29" y2="30" stroke="#6b4b2a" stroke-width="1.8"/></svg>`;
}
// terreno comprato ma ancora senza attivita': prato recintato con la bandierina del proprietario
export function lottoComprato(serie, col) {
  let p = ""; for (let i = 0; i < 9; i++) p += `<rect x="${6 + i * 5.2}" y="38" width="1.4" height="9" fill="${col}"/>`;
  return `<svg viewBox="0 0 60 60" class="edi" aria-hidden="true">${zoccolo(serie)}<polygon points="4,48 50,48 56,43 10,43" fill="#8cc26f"/><rect x="5" y="40" width="46" height="1.4" fill="${col}"/><rect x="5" y="44" width="46" height="1.4" fill="${col}"/>${p}${bandiera(30, 46, col)}</svg>`;
}
