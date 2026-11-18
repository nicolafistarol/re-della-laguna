// =====================================================================
// RE DELLA LAGUNA — attrezzi comuni per le prove (sim.js, invarianti.js)
// Carica motore.js e bot.js dal repo indicato in REPO e gioca partite di soli bot.
//   REPO=/percorso/della/copia node sim.js 20 12
// Non scrive mai dentro il repo.
// =====================================================================
const path = require("path");
const fs = require("fs");

const REPO = path.resolve(process.env.REPO || "/home/claude/re-della-laguna");

// Numeri a caso ripetibili: il motore ha il suo seme, ma bot.js usa Math.random.
// Durante le prove lo sostituiamo, cosi' la stessa partita si puo' rigiocare uguale.
function casuale(seed) {
  let t0 = seed >>> 0;
  return function () {
    let t = (t0 = (t0 + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function carica() {
  for (const f of ["motore.js", "bot.js"]) {
    const p = path.join(REPO, f);
    if (!fs.existsSync(p)) { console.error("Non trovo " + p + " (controlla REPO)"); process.exit(2); }
    delete require.cache[require.resolve(p)];
  }
  const L = require(path.join(REPO, "motore.js"));
  const B = require(path.join(REPO, "bot.js"));
  return { L, B };
}

const CARATTERI = ["Legale", "Costruttore", "Investitore", "Furbo", "Spavaldo", "Esperto"];
const NOMI = ["Ada", "Bruno", "Carla", "Dino", "Elsa", "Fausto", "Gina", "Ugo"];

// Gioca una partita intera di soli bot.
//   opz.seed, opz.cicli, opz.giocatori (numero, 2-8), opz.durata (al posto di cicli)
//   opz.dopo(stato, bot, azione, prima) chiamata dopo ogni mossa riuscita (per gli invarianti)
//   opz.stato: una partita gia' iniziata da cui partire · opz.fermaSe(s): ci si ferma quando torna vero
//   opz.storieACaso: i bot prendono una storia a caso (di solito ogni carattere prende sempre la sua)
//   opz.ricaricaOgni: ogni N mosse lo stato passa da JSON (salva e ricarica), come sul server
//   opz.maxPassi: oltre questo numero di mosse la partita e' considerata "non finisce"
// Ritorna { stato, passi, eccezioni[], rifiuti{}, blocchi[], finita }
//   eccezioni = errori veri del codice (NON gli errori di gioco "non puoi farlo")
//   rifiuti   = mosse dei bot rifiutate dal motore (errore di gioco): contate per tipo
//   blocchi   = nessun bot ha una mossa ma la partita non e' finita
function gioca(L, B, opz) {
  const seed = opz.seed >>> 0;
  const vecchioRandom = Math.random;
  Math.random = casuale(seed ^ 0x9e3779b9);
  const vecchioNow = Date.now;
  let orologio = 1_800_000_000_000; // un orologio finto, cosi' la notte non dipende dall'ora vera
  Date.now = () => orologio;
  const esito = { stato: null, passi: 0, eccezioni: [], rifiuti: {}, blocchi: [], finita: false, seed };
  try {
    const n = opz.giocatori || 6;
    const giocatori = [];
    for (let i = 0; i < n; i++) giocatori.push({ nome: NOMI[i], bot: true, strat: (opz.caratteri || CARATTERI)[(i + (opz.giro || 0)) % (opz.caratteri || CARATTERI).length] });
    // opz.stato: si parte da una partita gia' iniziata (per provare le partite vecchie con il motore nuovo)
    let s = opz.stato || L.nuovaPartita({ giocatori, seed, durata: opz.durata || { modo: "cicli", cicli: opz.cicli || 12 }, principianti: false, consigli: false });
    esito.stato = s;
    const max = opz.maxPassi || 400_000;
    const segna = (dove, e, bot, a) => {
      if (esito.eccezioni.length < 50) esito.eccezioni.push({ dove, messaggio: String(e && e.message || e), riga: rigaDi(e), bot: bot ? bot.nome + " (" + bot.strat + ")" : null, azione: a ? JSON.stringify(a).slice(0, 200) : null, ciclo: s.ciclo + 1, fase: s.fase, seed });
      else esito.eccezioniTroppe = true;
    };
    while (!s.fine && esito.passi < max && !(opz.fermaSe && opz.fermaSe(s))) {
      let bot = null, a = null;
      for (const p of s.players) {
        if (!p.bot) continue;
        let x = null;
        try { x = B.prossima(s, p); } catch (e) { segna("bot.prossima", e, p, null); }
        if (x) { bot = p; a = x; break; }
      }
      if (!bot) {
        // nessuno ha una mossa: di notte puo' essere solo l'orologio. Facciamo scadere il tempo una volta.
        if (s.fase === "notte" && s.notte) {
          orologio += (L.TEMPO_ORA + 5) * 1000;
          try { L.applica(s, s.players[0].id, { tipo: "tempo_scaduto" }); esito.passi++; esito.tempiScaduti = (esito.tempiScaduti || 0) + 1; continue; }
          catch (e) { if (!e.gioco) segna("tempo_scaduto", e, null, null); }
        }
        esito.blocchi.push({ ciclo: s.ciclo + 1, fase: s.fase, pending: s.pending ? s.pending.tipo : null, turno: s.fase === "giorno" ? L.corrente(s).nome : null });
        break;
      }
      // storie a caso: senza questo ogni carattere sceglie sempre la stessa storia e non si capisce chi dei due vince
      if (opz.storieACaso && s.fase === "pacchetti" && a.tipo === "pacchetto") a = { tipo: "pacchetto", id: s.pacchettiDisponibili[Math.floor(Math.random() * s.pacchettiDisponibili.length)] };
      const prima = opz.prima ? opz.prima(s, bot, a) : null;
      esito.passi++;
      try {
        L.applica(s, bot.id, a);
      } catch (e) {
        if (e && e.gioco) {
          const k = a.tipo + ": " + e.message;
          esito.rifiuti[k] = (esito.rifiuti[k] || 0) + 1;
        } else segna("applica", e, bot, a);
        // stessa via d'uscita di locale.js e del server
        try {
          if (s.fase === "notte") L.applica(s, bot.id, { tipo: "pronto" });
          else if (s.pending && s.pending.tipo === "asta") L.applica(s, bot.id, { tipo: "offerta", importo: 0 });
          else if (s.pending && s.pending.giocatore === bot.id) L.applica(s, bot.id, { tipo: s.pending.tipo, si: false, importo: 0 });
          else L.applica(s, bot.id, bot.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" });
        } catch (e2) {
          if (e2 && !e2.gioco) segna("via d'uscita", e2, bot, a);
          esito.blocchi.push({ ciclo: s.ciclo + 1, fase: s.fase, pending: s.pending ? s.pending.tipo : null, motivo: "via d'uscita rifiutata: " + (e2 && e2.message), bot: bot.nome, azione: a.tipo });
          break;
        }
      }
      if (opz.dopo) opz.dopo(s, bot, a, prima);
      // come fa il server: la partita viene salvata e riletta (JSON). Non deve cambiare niente.
      if (opz.ricaricaOgni && esito.passi % opz.ricaricaOgni === 0) { s = JSON.parse(JSON.stringify(s)); esito.stato = s; }
    }
    esito.finita = !!s.fine;
    if (!s.fine && !esito.blocchi.length && !(opz.fermaSe && opz.fermaSe(s))) esito.blocchi.push({ ciclo: s.ciclo + 1, fase: s.fase, motivo: "troppe mosse (" + esito.passi + "): la partita non finisce" });
  } catch (e) {
    esito.eccezioni.push({ dove: "partita", messaggio: String(e && e.message || e), riga: rigaDi(e), seed });
  } finally {
    Math.random = vecchioRandom; Date.now = vecchioNow;
  }
  return esito;
}

// "motore.js:1234" dalla traccia dell'errore
function rigaDi(e) {
  const m = String((e && e.stack) || "").match(/(motore|bot)\.js:(\d+)/);
  return m ? m[1] + ".js:" + m[2] : null;
}
function mediana(v) { if (!v.length) return 0; const a = [...v].sort((x, y) => x - y); const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
function milioni(n) { return (n / 1e6).toFixed(1).replace(".", ",") + " M"; }

module.exports = { REPO, carica, gioca, casuale, mediana, milioni, CARATTERI, NOMI };
