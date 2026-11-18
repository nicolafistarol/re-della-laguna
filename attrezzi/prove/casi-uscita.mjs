import { createRequire } from "module";
import { DB, come } from "./mock.mjs";
const require = createRequire(import.meta.url);
globalThis.Laguna = require("/home/user/re-della-laguna/motore.js");
globalThis.LagunaBot = require("/home/user/re-della-laguna/bot.js");
let H; globalThis.Deno = { env: { get: () => "x" }, serve: (h) => { H = h; } };
await import("./index.mts");
const call = async (u, body) => { come(u); const r = await H(new Request("http://x", { method: "POST", headers: { Authorization: "Bearer t" }, body: JSON.stringify(body) })); return { st: r.status, ...(await r.json()) }; };
const ok = (c, m) => { console.log((c ? "OK   " : "FAIL ") + m); if (!c) process.exitCode = 1; };
const G = (pid) => DB.giocatori.find((g) => g.player_id === pid);
const P = () => DB.partite[0];
// sala: Nicola crea con 2 amici + 1 computer
let r = await call("nico", { comando: "crea", giocatori: [{ nome: "fista" }, { nome: "Amico 1" }, { nome: "Amico 2" }, { nome: "Furbo", bot: true, strategia: "Furbo" }] });
const id = r.partita, codice = r.codice;
await call("sabry", { comando: "entra", codice, nome: "Sabry" });
await call("ale", { comando: "entra", codice, nome: "Ale" });
ok(G("g2").user_id === "sabry" && G("g3").user_id === "ale", "Sabry e Ale entrano nella sala");
// Ale esce dalla sala: posto libero
await call("ale", { comando: "esci", partita: id });
ok(G("g3").user_id === null, "Ale esce dalla sala: posto libero");
r = await call("nico", { comando: "inizia", partita: id, durata: { modo: "cicli", cicli: 4 } });
ok(r.st === 400, "con un posto libero non si inizia: " + r.errore);
r = await call("sabry", { comando: "computer", partita: id, player: "g3" });
ok(r.st === 403, "solo chi crea mette il computer");
r = await call("nico", { comando: "computer", partita: id, player: "g3" });
ok(G("g3").bot === true && G("g3").user_id === null, "Nicola mette il computer al posto libero (" + G("g3").nome + ")");
r = await call("nico", { comando: "inizia", partita: id, durata: { modo: "cicli", cicli: 4 } });
ok(r.ok, "partita iniziata");
// presenze
await call("nico", { comando: "presente", partita: id });
r = await call("sabry", { comando: "presente", partita: id });
ok(r.presenze && r.presenze.length === 4 && r.presenze.find((x) => x.id === "g1").secondi === 0, "presenze tornano");
// Sabry sparisce: visto_il di 4 minuti fa
G("g2").visto_il = new Date(Date.now() - 4 * 60000).toISOString();
const v0 = P().versione;
r = await call("nico", { comando: "presente", partita: id });
const s2 = P().stato.players.find((p) => p.id === "g2");
ok(G("g2").assente && s2.bot && s2.assente && P().versione === v0 + 1, "dopo 3 minuti al posto di Sabry gioca il computer");
const vistaN = DB.viste.find((v) => v.player_id === "g1").vista;
ok(vistaN.players.find((p) => p.id === "g2").assente === true, "Nicola vede che Sabry non c'è (campo assente nella sua vista)");
// partita va avanti: Nicola gioca qualche mossa, i bot (anche Sabry) rispondono
let mosse = 0, errori = 0;
for (let k = 0; k < 400 && !P().stato.fine; k++) {
  const S = P().stato;
  const az = globalThis.LagunaBot.prossima(S, S.players[0]);
  if (!az) { // non tocca a Nicola: dovrebbe toccargli sempre se nessun umano attivo oltre lui
    break;
  }
  r = await call("nico", { comando: "azione", partita: id, azione: az });
  if (r.errore) { errori++; const pd = P().stato.pending; await call("nico", { comando: "azione", partita: id, azione: P().stato.fase === "notte" ? { tipo: "pronto" } : pd && pd.tipo === "asta" ? { tipo: "offerta", importo: 0 } : P().stato.players[0].haTirato ? { tipo: "fine_turno" } : { tipo: "tira" } }); }
  mosse++;
  if (P().stato.ciclo >= 2) break;
}
ok(P().stato.ciclo >= 1, `la partita va avanti senza Sabry: ciclo ${P().stato.ciclo + 1}, ${mosse} mosse di Nicola (${errori} rifiutate), fase ${P().stato.fase}`);
// Sabry torna
r = await call("sabry", { comando: "presente", partita: id });
const s3 = P().stato.players.find((p) => p.id === "g2");
ok(!G("g2").assente && !s3.bot && !s3.assente && s3.strat === null, "Sabry torna: riprende lei");
// Sabry esce per sempre
r = await call("sabry", { comando: "esci", partita: id });
const s4 = P().stato.players.find((p) => p.id === "g2");
ok(G("g2").uscito && s4.bot && s4.uscito && !P().finita, "Sabry esce: gioca il computer per sempre, partita continua");
r = await call("sabry", { comando: "azione", partita: id, azione: { tipo: "tira" } });
ok(r.st === 403, "Sabry uscita non può più muovere: " + r.errore);
r = await call("sabry", { comando: "presente", partita: id });
ok(P().stato.players.find((p) => p.id === "g2").bot, "il suo ping non la rimette dentro");
// Nicola fa giocare il computer al posto di un umano non collegato (qui nessuno): e poi esce anche lui
r = await call("nico", { comando: "esci", partita: id });
ok(P().finita === true, "esce anche l'ultima persona: la partita si chiude");
