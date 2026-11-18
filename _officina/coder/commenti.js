#!/usr/bin/env node
// =====================================================================
// RE DELLA LAGUNA — cerca "//" dentro un `${...}` scritto su una riga sola
//   node commenti.js file1.js file2.js ...
// Regola di STATO.md: nei template `${...}` su una riga non usare //
// (il commento si mangia il resto della riga, compresa la } che chiude).
// Legge il file carattere per carattere tenendo conto di stringhe, template,
// espressioni regolari e commenti veri. Esce con 1 se trova qualcosa.
// =====================================================================
const fs = require("fs");
let trovati = 0;
for (const file of process.argv.slice(2)) {
  const t = fs.readFileSync(file, "utf8");
  // pila: "codice" | "template" ; per ogni ${ aperto ricordo la riga e la profondita' delle graffe
  const pila = [{ tipo: "codice", graffe: 0, riga: 1 }];
  let riga = 1, i = 0, ultimo = ""; // ultimo = ultimo carattere "vero" di codice (per capire se / e' una regex)
  const cima = () => pila[pila.length - 1];
  while (i < t.length) {
    const c = t[i], d = t[i + 1];
    if (c === "\n") { riga++; i++; continue; }
    const st = cima();
    if (st.tipo === "template") {
      if (c === "\\") { i += 2; continue; }
      if (c === "`") { pila.pop(); ultimo = "`"; i++; continue; }
      if (c === "$" && d === "{") { pila.push({ tipo: "codice", graffe: 0, riga, inTemplate: true }); ultimo = "{"; i += 2; continue; }
      i++; continue;
    }
    // codice
    if (c === "/" && d === "/") {
      // commento fino a fine riga: se siamo dentro un ${ aperto su QUESTA riga, e' l'errore che cerchiamo
      const dentro = pila.find((x) => x.inTemplate && x.riga === riga);
      if (dentro) { trovati++; const inizio = t.lastIndexOf("\n", i) + 1, fine = t.indexOf("\n", i); console.log(`${file}:${riga}: "//" dentro un \${...} sulla stessa riga -> ${t.slice(Math.max(inizio, i - 60), Math.min(fine < 0 ? t.length : fine, i + 50)).trim()}`); }
      const f = t.indexOf("\n", i); i = f < 0 ? t.length : f; continue;
    }
    if (c === "/" && d === "*") { const f = t.indexOf("*/", i + 2); const pezzo = t.slice(i, f < 0 ? t.length : f + 2); riga += (pezzo.match(/\n/g) || []).length; i += pezzo.length; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < t.length && t[j] !== c && t[j] !== "\n") { if (t[j] === "\\") j++; j++; } i = j + 1; ultimo = c; continue; }
    if (c === "`") { pila.push({ tipo: "template", riga }); i++; continue; }
    if (c === "/") {
      // divisione o espressione regolare? regex se prima c'e' un operatore, una parentesi aperta o una parola chiave
      const prima = t.slice(Math.max(0, i - 12), i).trimEnd();
      const regex = ultimo === "" || "(,=:[!&|?{};+-*%<>~^".includes(ultimo) || /(?:return|typeof|case|in|of|void|delete|throw|new|else|do)$/.test(prima);
      if (regex) { let j = i + 1, classe = false; while (j < t.length && t[j] !== "\n") { if (t[j] === "\\") { j += 2; continue; } if (t[j] === "[") classe = true; else if (t[j] === "]") classe = false; else if (t[j] === "/" && !classe) break; j++; } i = j + 1; while (/[a-z]/.test(t[i] || "")) i++; ultimo = "/"; continue; }
    }
    if (c === "{") st.graffe++;
    if (c === "}") { if (st.inTemplate && st.graffe === 0) { pila.pop(); i++; continue; } st.graffe--; }
    if (!/\s/.test(c)) ultimo = c;
    i++;
  }
  if (pila.length !== 1) console.log(`${file}: avviso, non sono riuscito a leggere tutto il file fino in fondo (resto aperto dalla riga ${cima().riga}): controlla a mano`);
}
process.exit(trovati ? 1 : 0);
