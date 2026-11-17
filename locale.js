// =====================================================================
// RE DELLA LAGUNA — partita locale (senza server)
// Si apre con ?locale nell'indirizzo: tu contro 3 giocatori-computer,
// tutto nel browser. Serve per provare il gioco da soli e per le prove automatiche.
// =====================================================================
const L = window.Laguna;
const B = window.LagunaBot;
const CHIAVE = "laguna_locale";
let stato = null;

const ALTRI_SEGRETI = ["affariOk", "pulitoCiclo", "mosseNotte", "mossePagate", "disturbatore", "copUsata",
  "paradisoCiclo", "ombraCicli", "prestiti", "telefonataUsata", "scontoCarico", "mercatoNero", "emergenza"];
function vistaSicura(s, id) {
  const v = L.vista(s, id);
  for (const p of v.players) {
    if (p.id === id) { delete p.tracce; continue; }
    for (const k of ALTRI_SEGRETI) delete p[k];
  }
  v.log = v.log.filter((r) => !r.chi || r.chi === id || !/prestito|restituisce|investe|vende|ipoteca|riscatta/.test(r.testo));
  return v;
}
function giocaBot(s) {
  for (let i = 0; i < 3000 && !s.fine; i++) {
    const bot = s.players.find((p) => p.bot && B.prossima(s, p));
    if (!bot) return;
    const a = B.prossima(s, bot);
    try { L.applica(s, bot.id, a); }
    catch (_e) {
      try {
        if (s.fase === "notte") L.applica(s, bot.id, { tipo: "pronto" });
        else if (s.pending?.tipo === "asta") L.applica(s, bot.id, { tipo: "offerta", importo: 0 });
        else if (s.pending && s.pending.giocatore === bot.id) L.applica(s, bot.id, { tipo: s.pending.tipo, si: false, importo: 0 });
        else L.applica(s, bot.id, bot.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" });
      } catch (_e2) { return; }
    }
  }
}
function salva() { try { localStorage.setItem(CHIAVE, JSON.stringify(stato)); } catch (e) { } }

export function nuova(nome, seed) {
  stato = L.nuovaPartita({
    giocatori: [{ nome: nome || "Tu" }, { nome: "Rocco", bot: true, strat: "Furbo" }, { nome: "Vera", bot: true, strat: "Legale" }, { nome: "Dario", bot: true, strat: "Costruttore" }],
    seed,
  });
  giocaBot(stato); salva();
}
// Prova veloce: si salta subito alla prima notte, Rocco apre una serata di poker nel suo grattacielo
export function nuovaProva(nome) {
  nuova(nome);
  const s = stato, me = s.players[0];
  for (let i = 0; i < 4000 && s.fase !== "notte" && !s.fine; i++) {
    try {
      if (s.fase === "pacchetti") L.applica(s, "g1", { tipo: "pacchetto", id: L.PACCHETTI[0].id });
      else if (s.pending?.tipo === "asta") L.applica(s, "g1", { tipo: "offerta", importo: 0 });
      else if (s.pending && s.pending.giocatore === "g1") L.applica(s, "g1", { tipo: s.pending.tipo, si: false, importo: 0 });
      else if (L.corrente(s).id === "g1") L.applica(s, "g1", me.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" });
    } catch (e) { }
    giocaBot(s);
  }
  const rocco = s.players[1];
  rocco.piani = 32; rocco.funzioniPiani = Array(32).fill("appartamenti"); rocco.funzioniPiani[7] = "casino_privato"; rocco.cash += 8_000_000;
  me.cash += 2_000_000;
  if (s.notte) {
    if (s.notte.serate) delete s.notte.serate[rocco.id];
    L.apriSerataProva(s, rocco.id, 50_000);
    s.notte.dove[rocco.id] = "palazzo"; delete s.notte.viaggio[rocco.id]; delete s.notteFatti[rocco.id];
  }
  salva();
}
export function carica() {
  if (stato) return true;
  try { const j = localStorage.getItem(CHIAVE); if (j) { stato = JSON.parse(j); return true; } } catch (e) { }
  return false;
}
export function azione(a) {
  try { L.applica(stato, "g1", a); }
  catch (e) { if (e.gioco) return { errore: e.message }; throw e; }
  giocaBot(stato); salva();
  return { ok: true };
}
export function vista() { return stato ? vistaSicura(stato, "g1") : null; }
export function grezzo() { return stato; }
