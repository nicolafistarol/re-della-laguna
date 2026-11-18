// =====================================================================
// RE DELLA LAGUNA — partita locale (senza server)
// Si apre con ?locale nell'indirizzo: tu contro 3 giocatori-computer,
// tutto nel browser. Serve per provare il gioco da soli e per le prove automatiche.
// =====================================================================
const L = window.Laguna;
const B = window.LagunaBot;
const CHIAVE = "laguna_locale";
let stato = null;

// Cosa vede il giocatore (L.vistaSicura) e come giocano i computer (B.gioca) stanno nel motore e in bot.js:
// sono le STESSE funzioni che usa il server, cosi' la prova da soli si comporta come la partita online.
function giocaBot(s, opz) {
  const r = B.gioca(s, opz);
  for (const e of r.errori) console.error("Errore in una mossa dei computer:", e.bot, JSON.stringify(e.azione), e.messaggio);
}
function salva() { try { localStorage.setItem(CHIAVE, JSON.stringify(stato)); } catch (e) { } }

export function nuova(nome, seed, durata, guidata) {
  stato = L.nuovaPartita({
    giocatori: [{ nome: nome || "Tu" }, { nome: "Rocco", bot: true, strat: "Furbo" }, { nome: "Greta", bot: true, strat: "Legale" }, { nome: "Dario", bot: true, strat: "Costruttore" }],
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
  giocaBot(s, { finche: (x) => x.fase === "notte", max: 6000 });
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
  // applicaSicura: se la mossa e' rifiutata (o va in errore) la partita resta esattamente com'era
  try { L.applicaSicura(stato, "g1", a); }
  catch (e) { if (e.gioco) return { errore: e.message }; console.error(e); return { errore: "Errore del gioco: " + e.message }; }
  giocaBot(stato); salva();
  return { ok: true };
}
// nella prova da soli il nome si puo' cambiare quando vuoi
export function rinomina(nome) { nome = String(nome || "").trim().slice(0, 24); if (!stato || !nome) return; stato.players[0].nome = nome; salva(); }
export function vista() { return stato ? L.vistaSicura(stato, "g1") : null; }
export function grezzo() { return stato; }
