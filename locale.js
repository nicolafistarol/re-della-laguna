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
    // una sola domanda al bot: le sue scelte ricordano cosa ha gia' deciso (chiederla due volte la cambia)
    let bot = null, a = null;
    for (const p of s.players) if (p.bot) { const x = B.prossima(s, p); if (x) { bot = p; a = x; break; } }
    if (!bot) return;
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

export function nuova(nome, seed, durata, guidata) {
  stato = L.nuovaPartita({
    giocatori: [{ nome: nome || "Tu" }, { nome: "Rocco", bot: true, strat: "Furbo" }, { nome: "Vera", bot: true, strat: "Legale" }, { nome: "Dario", bot: true, strat: "Costruttore" }],
    seed, durata, principianti: guidata !== false, consigli: guidata !== false,
  });
  giocaBot(stato); salva();
}
// Prova veloce: si salta subito alla prima notte, Rocco apre una serata di poker nel suo grattacielo
export function nuovaProva(nome) {
  nuova(nome);
  const s = stato, me = s.players[0];
  // fino alla prima notte giochi "in automatico" come un giocatore esperto: compri terreni come gli altri
  me.bot = true; me.strat = "Esperto";
  for (let i = 0; i < 6000 && s.fase !== "notte" && !s.fine; i++) {
    let bot = null, mossa = null;
    for (const p of s.players) if (p.bot) { const x = B.prossima(s, p); if (x) { bot = p; mossa = x; break; } }
    if (!bot) break;
    try { L.applica(s, bot.id, mossa); }
    catch (e) {
      try {
        if (s.pending?.tipo === "asta") L.applica(s, bot.id, { tipo: "offerta", importo: 0 });
        else if (s.pending && s.pending.giocatore === bot.id) L.applica(s, bot.id, { tipo: s.pending.tipo, si: false, importo: 0 });
        else L.applica(s, bot.id, bot.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" });
      } catch (e2) { break; }
    }
  }
  me.bot = false; delete me.strat;
  const rocco = s.players[1];
  // Rocco ha un palazzo con il casinò privato (per la serata a poker), ma niente soldi regalati
  if (rocco.piani < 12) { rocco.piani = 12; rocco.funzioniPiani = Array(12).fill("appartamenti"); }
  rocco.stanze = ["casino_privato"];
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
// nella prova da soli il nome si puo' cambiare quando vuoi
export function rinomina(nome) { nome = String(nome || "").trim().slice(0, 24); if (!stato || !nome) return; stato.players[0].nome = nome; salva(); }
export function vista() { return stato ? vistaSicura(stato, "g1") : null; }
export function grezzo() { return stato; }
