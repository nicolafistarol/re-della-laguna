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
