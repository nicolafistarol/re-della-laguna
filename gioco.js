import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const SB_URL = "https://eqnrzboulnzkjuyhqsvu.supabase.co";
const SB_KEY = "sb_publishable_yTidV9j2WvfIA-VWrFVJQA_xUnfWX4_";
const sb = createClient(SB_URL, SB_KEY);
const db = sb.schema("laguna");
import { ico } from "./icone.js?v=34";
const L = window.Laguna;
const euro = L.euro;
const $ = (q) => document.querySelector(q);
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const VELOCE = location.search.includes("veloce");
const VELOCE_2D = location.search.includes("2d");
const LOCALE = location.search.includes("locale");  // ?locale = partita contro il computer, senza server
import * as Tre from "./tre.js?v=34";
import * as Pano from "./panorama.js?v=34";
// il tabellone 3D: acceso di base se il computer lo supporta; si puo' tornare al 2D
let TRE3D = false;
function vuole3D() { try { return localStorage.getItem("laguna_3d") !== "0"; } catch (e) { return true; } }
import * as Loc from "./locale.js?v=34";   // ?veloce = senza animazioni (per le prove)
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const COL_SERIE = { Spezie: "#9b5a2c", Lanterne: "#ff8a3d", Terracotta: "#d9480f", Giungla: "#2b9348", Perla: "#f2a7c3", Diamante: "#e0f7ff", Rame: "#b87333", Sabbia: "#e9c46a", Corallo: "#14b8a6", Neon: "#ff4fa3", Velluto: "#b5179e", Acciaio: "#5c7f99", Vetro: "#2f6fe0", Oro: "#c9a24a", Platino: "#8d99ae", Moli: "#9aa", Salina: "#f4f1de", Mangrovie: "#1b5e3b", Smeraldo: "#10b981", Tramonto: "#f97316", Cobalto: "#1e40af" };
const SCENE = { Ambra: "img/ambra.jpg", Palma: "img/palma.jpg", Flamingo: "img/flamingo.jpg", Sole: "img/sole.jpg", Corona: "img/corona.jpg" };

let utente = null, partita = null, mioId = null, S = null, canale = null;
let telAperto = false, app = null, saldoNascosto = false, attesa = false, principianti = true, timerSala = null, durata = 8;
const visti = new Set();

function toast(t) { let box = $("#toasts"); if (!box) { box = document.createElement("div"); box.id = "toasts"; document.body.appendChild(box); } const d = document.createElement("div"); d.className = "toast"; d.textContent = t; box.appendChild(d); Suono.avviso(); while (box.children.length > 3) box.firstChild.remove(); setTimeout(() => d.remove(), 4500); }
function esciDallaPartita(msg) {
  try { localStorage.removeItem("laguna_online"); } catch (e) { }
  if (canale) { sb.removeChannel(canale); canale = null; }
  clearInterval(timerVista); S = null; partita = null; mioId = null; telAperto = false; app = null;
  document.querySelectorAll(".velo").forEach((x) => x.remove());
  if (LOCALE) { location.href = location.pathname; return; }
  schermataCasa(); if (msg) toast(msg);
}
function salvaLocale() { try { localStorage.setItem("laguna_online", JSON.stringify({ partita, mioId })); } catch (e) { } }
function leggiLocale() { try { return JSON.parse(localStorage.getItem("laguna_online") || "{}"); } catch (e) { return {}; } }
function sfondo(img) { $("#sfondo").style.backgroundImage = `url('${img}')`; }

// ------------------------------------------------------------ suoni e musica (generati dal browser, niente file da scaricare)
const Suono = (() => {
  let ctx = null, master = null, eco = null, acceso = true, modo = null, timer = null, drone = [];
  try { acceso = localStorage.getItem("laguna_audio") !== "0"; } catch (e) { }
  function avvia() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = acceso ? 0.55 : 0; master.connect(ctx.destination);
    // un'eco morbida per dare spazio
    eco = ctx.createDelay(1); eco.delayTime.value = 0.33; const fb = ctx.createGain(); fb.gain.value = 0.32; const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
    eco.connect(lp); lp.connect(fb); fb.connect(eco); lp.connect(master);
    if (modo) ambiente(modo, true);
  }
  function nota(f, t0, dur, vol, tipo = "sine", conEco = true) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipo; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); if (conEco) g.connect(eco); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function rumore(t0, dur, vol, freq) {
    if (!ctx) return;
    const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1.2; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(t0);
  }
  const PENTA = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784];
  function ambiente(m, forza) {
    return; // musica tolta: era brutta. Una colonna sonora vera arrivera' da file registrati.
    if (m === modo && !forza) return; modo = m;
    if (!ctx) return;
    clearInterval(timer); drone.forEach((x) => { try { x.stop(); } catch (e) { } }); drone = [];
    if (m === "notte") {
      for (const f of [55, 82.4, 110]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.value = 0.035; o.connect(g); g.connect(master); o.start(); drone.push(o); }
      timer = setInterval(() => { const t = ctx.currentTime; rumore(t, 2.5, 0.05, 400); if (Math.random() < 0.35) nota([523.3, 622.3, 784, 932.3][Math.floor(Math.random() * 4)], t + 0.5, 3, 0.03, "sine"); }, 3200);
    } else if (m === "giorno") {
      let k = 0;
      timer = setInterval(() => {
        const t = ctx.currentTime, accordi = [[0, 2, 4], [3, 5, 7], [1, 4, 6], [2, 4, 8]], a = accordi[Math.floor(k / 4) % 4];
        nota(PENTA[a[k % 3]] / 2, t, 1.2, 0.05, "triangle"); if (k % 2 === 0) nota(PENTA[a[(k + 1) % 3]], t + 0.25, 0.8, 0.035, "sine");
        if (k % 8 === 0) nota(PENTA[a[0]] / 4, t, 2.5, 0.05, "sine", false);
        k++;
      }, 520);
    }
  }
  return {
    avvia, ambiente,
    acceso: () => acceso,
    cambia() { acceso = !acceso; try { localStorage.setItem("laguna_audio", acceso ? "1" : "0"); } catch (e) { } avvia(); if (master) master.gain.value = acceso ? 0.55 : 0; },
    dado() { if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 9; i++) rumore(t + i * 0.09 + Math.random() * 0.04, 0.07, 0.5 - i * 0.04, 2500 + Math.random() * 1500); },
    passo(mio) { if (!ctx) return; nota(mio ? 880 : 660, ctx.currentTime, 0.08, mio ? 0.06 : 0.03, "square", false); },
    soldi(su) { if (!ctx) return; const t = ctx.currentTime; if (su) { nota(1046.5, t, 0.25, 0.08); nota(1318.5, t + 0.08, 0.4, 0.08); nota(1568, t + 0.16, 0.5, 0.06); } else { nota(392, t, 0.3, 0.07, "triangle"); nota(311.1, t + 0.12, 0.45, 0.07, "triangle"); } },
    avviso() { if (!ctx) return; const t = ctx.currentTime; nota(880, t, 0.25, 0.045); nota(1174.7, t + 0.1, 0.35, 0.045); },
    telefono() { if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 2; i++) { nota(1318.5, t + i * 0.18, 0.12, 0.05, "sine", false); nota(1760, t + i * 0.18 + 0.06, 0.12, 0.05, "sine", false); } },
  };
})();
addEventListener("pointerdown", () => Suono.avvia(), { capture: true });
addEventListener("keydown", () => Suono.avvia(), { capture: true });

// ------------------------------------------------------------ server
async function chiama(corpo) {
  const { data, error } = await sb.functions.invoke("laguna", { body: corpo });
  if (error) {
    let msg = "Errore di collegamento.";
    try { const j = await error.context.json(); msg = j.errore || msg; if (error.context.status === 409) return { conflitto: true, errore: msg }; } catch (e) { }
    return { errore: msg };
  }
  return data;
}
// le mosse si mettono in fila: nessuna si perde se clicchi mentre la precedente sta ancora andando al server
let filaAzioni = Promise.resolve();
function agisci(azione) { filaAzioni = filaAzioni.then(() => inviaAzione(azione)).catch(() => { }); return filaAzioni; }
async function inviaAzione(azione) {
  if (LOCALE) { const r = Loc.azione(azione); if (r.errore) toast(r.errore); return caricaVista(); }
  attesa = true;
  let r = await chiama({ comando: "azione", partita, azione });
  if (r && r.conflitto) r = await chiama({ comando: "azione", partita, azione });
  attesa = false;
  if (r && r.errore) toast(r.errore);
  await caricaVista();
}
async function caricaVista() {
  if (LOCALE) { const v = Loc.vista(); if (v) riceviVista(JSON.parse(JSON.stringify(v))); return; }
  const { data, error } = await db.from("viste").select("vista,versione").eq("partita_id", partita).eq("player_id", mioId).maybeSingle();
  if (error) { toast("Non riesco a leggere la partita: " + error.message); return; }
  if (data) riceviVista(data.vista);
}
let timerVista = null;
function ascolta() {
  if (LOCALE) return;
  if (canale) sb.removeChannel(canale);
  canale = sb.channel("viste-" + partita)
    .on("postgres_changes", { event: "*", schema: "laguna", table: "viste", filter: "partita_id=eq." + partita }, (p) => {
      if (p.new && p.new.player_id === mioId && p.new.vista) riceviVista(p.new.vista);
    }).subscribe();
  clearInterval(timerVista);
  timerVista = setInterval(() => { if (!document.hidden) caricaVista(); }, 8000);
}

// ------------------------------------------------------------ ingresso
async function avvio() {
  if (LOCALE) {
    partita = "locale"; mioId = "g1";
    const m = /seed=(\d+)/.exec(location.search);
    if (location.search.includes("prova")) { Loc.nuovaProva("Tu"); history.replaceState(null, "", location.pathname + "?locale"); }
    else if (location.search.includes("nuova") || !Loc.carica()) Loc.nuova("Tu", m ? +m[1] : undefined);
    return caricaVista();
  }
  const { data: { session } } = await sb.auth.getSession();
  utente = session?.user || null;
  const loc = leggiLocale();
  if (!utente) return schermataNome();
  if (loc.partita && loc.mioId) {
    partita = loc.partita; mioId = loc.mioId;
    const { data } = await db.from("partite_pubbliche").select("*").eq("id", partita).maybeSingle();
    if (data && data.in_corso && !data.finita) {
      await caricaVista();
      // partita della versione vecchia (tabellone piccolo): si torna alla schermata iniziale
      if (S && S.lotti && S.lotti.length !== L.CASELLE) { esciDallaPartita("Quella partita era della versione vecchia del gioco. Creane una nuova."); return; }
      ascolta(); return;
    }
    if (data && !data.finita) return sala();
  }
  schermataCasa();
}
function schermoIngresso(html) { $("#mondo").style.display = "none"; $("#telefonoBox").innerHTML = ""; sfondo("img/laguna.jpg"); $("#sfondo").style.filter = "none"; $("#radice").innerHTML = `<div class="ingresso">${html}</div>`; }
function schermataNome() {
  schermoIngresso(`<div class="cartaI vetro">
    <span class="kick" style="color:var(--oro)">Benvenuto nella Laguna</span>
    <span class="serif" style="font-size:52px;line-height:1">Re della Laguna</span>
    <div class="campo"><label for="nome">Come ti chiami?</label><input id="nome" maxlength="24" placeholder="Il tuo nome"></div>
    <button class="oro grande" id="entra">Entra</button>
    <span style="font-size:12px;color:var(--muted)">Niente email e niente password: ti ricordiamo su questo computer.</span></div>`);
  $("#entra").onclick = async () => {
    const nome = $("#nome").value.trim(); if (!nome) return toast("Scrivi il tuo nome.");
    const { data, error } = await sb.auth.signInAnonymously({ options: { data: { nome } } });
    if (error) return toast("Non riesco a farti entrare: " + error.message);
    utente = data.user; schermataCasa();
  };
}
function nomeMio() { return utente?.user_metadata?.nome || "Giocatore"; }
function schermataCasa() {
  const righe = [{ tipo: "amico" }, { tipo: "amico" }, { tipo: "computer", strat: "Furbo" }];
  const STR = ["Legale", "Costruttore", "Investitore", "Furbo", "Spavaldo", "Esperto"];
  const disegnaCasa = () => {
    schermoIngresso(`<div class="cartaI vetro" style="width:min(560px,94vw)">
      <span class="kick" style="color:var(--oro)">Ciao ${esc(nomeMio())}</span>
      <span class="serif" style="font-size:44px;line-height:1">Re della Laguna</span>
      <div class="vetro" style="padding:14px;border-radius:16px;display:flex;flex-direction:column;gap:8px">
        <b>Crea una partita</b>
        <div class="posto"><div class="pall" style="background:var(--oro)">${esc(nomeMio()[0] || "T")}</div><span style="flex:1">${esc(nomeMio())} (tu)</span></div>
        ${righe.map((r, i) => `<div class="posto"><div class="pall" style="background:${r.tipo === "amico" ? "#4fc3f7" : "#8a8a8a"}">${i + 2}</div>
          <select data-i="${i}" class="tipo" style="flex:1"><option value="amico" ${r.tipo === "amico" ? "selected" : ""}>Posto per un amico</option>${STR.map((s) => `<option value="${s}" ${r.tipo === "computer" && r.strat === s ? "selected" : ""}>Computer: ${s}</option>`).join("")}</select></div>`).join("")}
        <div class="riga"><button class="piccolo" id="piu">+ posto</button><button class="piccolo" id="meno">− posto</button></div>
        <div class="posto"><span style="flex:1">Durata</span><select id="durata" style="flex:2">${[[6, "Breve · 6 cicli (circa 1 ora e mezza)"], [8, "Normale · 8 cicli (circa 2 ore)"], [10, "Lunga · 10 cicli (circa 2 ore e mezza)"]].map(([v, n]) => `<option value="${v}" ${durata === v ? "selected" : ""}>${n}</option>`).join("")}</select></div>
        <label class="check"><input type="checkbox" id="princ" ${principianti ? "checked" : ""}> Partita guidata: le cose si scoprono piano piano (consigliata)</label>
        <button class="oro grande" id="crea">Crea la partita</button>
        <a class="piccolo" href="?locale&nuova" style="align-self:center;color:var(--muted)">Oppure prova da solo contro 3 giocatori-computer (senza internet)</a>
      </div>
      <div class="vetro" style="padding:14px;border-radius:16px;display:flex;flex-direction:column;gap:8px">
        <b>Hai un codice d'invito?</b>
        <div class="riga"><input id="codice" placeholder="es. PALMA-4821" style="flex:1;text-transform:uppercase"><button class="bianco" id="unisciti">Entra</button></div>
      </div></div>`);
    document.querySelectorAll(".tipo").forEach((s) => s.onchange = () => { const r = righe[s.dataset.i]; if (s.value === "amico") { r.tipo = "amico"; r.strat = null; } else { r.tipo = "computer"; r.strat = s.value; } });
    $("#princ").onchange = (e) => principianti = e.target.checked;
    $("#durata").onchange = (e) => { durata = +e.target.value; try { localStorage.setItem("laguna_durata", String(durata)); } catch (er) { } };
    $("#piu").onclick = () => { if (righe.length < 7) { righe.push({ tipo: "amico" }); disegnaCasa(); } };
    $("#meno").onclick = () => { if (righe.length > 1) { righe.pop(); disegnaCasa(); } };
    $("#crea").onclick = async () => {
      const giocatori = [{ nome: nomeMio(), bot: false }, ...righe.map((r, i) => r.tipo === "amico" ? { nome: "Amico " + (i + 1), bot: false } : { nome: r.strat, bot: true, strategia: r.strat })];
      const r = await chiama({ comando: "crea", giocatori, principianti });
      if (r.errore) return toast(r.errore);
      partita = r.partita; mioId = "g1"; salvaLocale(); sala();
    };
    $("#unisciti").onclick = async () => {
      const codice = $("#codice").value.trim().toUpperCase(); if (!codice) return;
      const r = await chiama({ comando: "entra", codice, nome: nomeMio() });
      if (r.errore) return toast(r.errore);
      partita = r.partita; mioId = r.player; salvaLocale(); sala();
    };
  };
  disegnaCasa();
}
async function sala() {
  clearInterval(timerSala);
  const disegnaSala = async () => {
    const { data: p } = await db.from("partite_pubbliche").select("*").eq("id", partita).maybeSingle();
    if (!p) { clearInterval(timerSala); toast("Partita non trovata."); return schermataCasa(); }
    if (p.in_corso) { clearInterval(timerSala); await caricaVista(); ascolta(); return; }
    const { data: g } = await db.from("giocatori").select("*").eq("partita_id", partita).order("player_id");
    const manca = (g || []).filter((x) => !x.bot && !x.user_id).length;
    const creatore = mioId === "g1";
    schermoIngresso(`<div class="cartaI vetro" style="width:min(560px,94vw)">
      <span class="kick" style="color:var(--oro)">Sala d'attesa</span>
      <span class="kick" style="color:var(--muted)">Codice d'invito</span>
      <div class="riga"><span class="serif" style="font-size:44px;letter-spacing:.04em">${esc(p.codice)}</span><button class="piccolo" id="copia">Copia</button></div>
      <span class="sub">Manda il codice agli amici: aprono questa pagina, scrivono il nome e il codice.</span>
      ${(g || []).map((x) => `<div class="posto"><div class="pall" style="background:${x.bot ? "#8a8a8a" : x.user_id ? "#4fc3f7" : "transparent;border:2px dashed rgba(255,255,255,.4)"}">${x.user_id || x.bot ? esc(x.nome[0]) : ""}</div>
        <span style="flex:1"><b>${x.user_id || x.bot ? esc(x.nome) : "Posto libero"}</b>${x.player_id === mioId ? " (tu)" : ""}</span>
        <span style="font-size:12px;color:${x.user_id && !x.bot ? "var(--pulito)" : "var(--muted)"}">${x.bot ? "Computer" : x.user_id ? "Pronto" : "In attesa"}</span></div>`).join("")}
      ${creatore ? `<button class="oro grande" id="inizia" ${manca ? "disabled" : ""}>${manca ? `Mancano ${manca} amici` : "Inizia la partita"}</button>` : `<span class="sub">Aspetta che chi ha creato la partita la faccia iniziare.</span>`}
      <button class="piccolo" id="esci" style="align-self:flex-start">Esci dalla sala</button></div>`);
    $("#copia").onclick = () => { navigator.clipboard?.writeText(p.codice).then(() => toast("Codice copiato."), () => { }); };
    $("#esci").onclick = () => { clearInterval(timerSala); try { localStorage.removeItem("laguna_online"); } catch (e) { } partita = null; schermataCasa(); };
    if ($("#inizia")) $("#inizia").onclick = async () => {
      clearInterval(timerSala);
      let cicli = 8; try { cicli = +(localStorage.getItem("laguna_durata") || 8); } catch (er) { }
      const r = await chiama({ comando: "inizia", partita, principianti, cicli });
      if (r.errore) { toast(r.errore); timerSala = setInterval(disegnaSala, 3000); return; }
      await caricaVista(); ascolta();
    };
  };
  await disegnaSala();
  timerSala = setInterval(disegnaSala, 3000);
}

// ------------------------------------------------------------ chi deve agire
window.__S = () => S; // per le prove automatiche
function io() { return S.players.find((p) => p.id === mioId); }
function mioTurno() { return S && S.fase === "giorno" && L.corrente(S).id === mioId; }
function tocca() {
  if (!S || S.fine) return false;
  if (S.fase === "pacchetti") return S.players[S.sceltaPacchetti[0]].id === mioId;
  if (S.pending && S.pending.tipo === "asta") return S.pending.partecipanti.includes(mioId) && typeof S.pending.offerte[mioId] !== "number";
  if (S.fase === "giorno") return mioTurno();
  return false;
}
function casellaDi(p) { return S.lotti.find((l) => l.giro === "o" && l.idx === p.pos); }

// ------------------------------------------------------------ geografia della mappa (in % dell'immagine)
// il percorso segue le strade e i ponti dell'immagine: 5 tratti (uno per isola), ognuno diviso in 16 caselle
const TRATTI = [[[58,70],[52,70.5],[46,70],[41,69.5],[37,72],[31,74.5],[25,73.5],[19,71.5],[14.5,68],[12.5,63],[15,58.5],[18,56],[15.5,51],[13.5,46]],[[13.5,46],[14,41],[16,37],[12,33.5],[15,30],[20,28.5],[25,27.5],[29,27],[33,26],[36,25.5],[40,24.8],[44,24.5]],[[44,24.5],[44.5,29],[41.5,33],[38.5,38],[37.5,43],[40,47],[45,49.5],[50,50.5],[56,49.5],[61,47],[63,42.5],[62,37],[60,32],[59,28],[60,25],[62,25]],[[62,25],[66,26],[70,27.5],[74,28.5],[78,29],[82,29.5],[85.5,31],[87,34],[84,36],[82,38.5],[84,42],[86.5,44.5]],[[86.5,44.5],[86.5,49],[84.5,53],[88,56],[91.5,58.5],[90,63],[85,65],[80,66.5],[75,64],[72,61],[69,62],[65,64.5],[61,67],[58,70]]];
function lungo(poli, t) { // punto a frazione t (0..1) della lunghezza di una spezzata (le y pesano 9/16)
  const seg = []; let tot = 0;
  for (let i = 1; i < poli.length; i++) { const d = Math.hypot(poli[i][0] - poli[i - 1][0], (poli[i][1] - poli[i - 1][1]) * 0.5625); seg.push(d); tot += d; }
  let r = t * tot;
  for (let i = 0; i < seg.length; i++) { if (r <= seg[i] || i === seg.length - 1) { const f = seg[i] ? Math.min(1, r / seg[i]) : 0; return [poli[i][0] + (poli[i + 1][0] - poli[i][0]) * f, poli[i][1] + (poli[i + 1][1] - poli[i][1]) * f]; } r -= seg[i]; }
  return poli[poli.length - 1];
}
const N_CAS = L.CASELLE, SEZ = L.SEZIONE;
const PUNTI_ESTERNI = Array.from({ length: N_CAS }, (_, i) => lungo(TRATTI[Math.floor(i / SEZ)], (i % SEZ) / SEZ));
function puntoMappa(p) {
  return PUNTI_ESTERNI[((p.pos % N_CAS) + N_CAS) % N_CAS];
}
const POS_LUOGO = { club: [73, 29], marina: [48, 79], mercato: [25, 59], bisca: [19, 68], porto: [81, 62], casino: [45, 33], redazione: [57, 44], villa: [24, 29], faro: [84, 81], aeroporto: [93, 57] };
const POS_CASA = { Ambra: [35, 70], Palma: [26, 30], Flamingo: [82.5, 26], Sole: [86, 52], Corona: [52, 41] };
const ICO_LUOGO = { palazzo: ico("palazzo"), club: ico("club"), marina: ico("marina"), mercato: ico("mercato"), bisca: ico("bisca"), porto: ico("porto"), casino: ico("casino"), redazione: ico("redazione"), villa: ico("villa"), faro: ico("faro"), aeroporto: ico("aereo") };
const ICO_OGG = Object.fromEntries(["maschera", "disturbatore", "telefono", "documenti", "furgone", "motoscafo", "avvocato", "macchina", "fiches", "cassetta"].map((k) => [k, ico(k)]));
function isolaCasa(p) { const l = S.lotti.find((x) => x.owner === p.id && x.isola); return l ? l.isola : "Corona"; }
function posLuogo(l, p) { return l === "palazzo" ? POS_CASA[isolaCasa(p)] : POS_LUOGO[l]; }
function nomeLuogo(l, maiusc) { return l === "palazzo" ? (maiusc ? "Il tuo Palazzo" : "il tuo Palazzo") : L.LUOGHI[l].nome; }

// ------------------------------------------------------------ animazioni (dadi, pedine)
let ultimoFlusso = Infinity, segnoTurno = 0;
let disp = {}, ultimoLog = null, coda = [], animando = false, ultimaVistaJson = "";
const PRIVATI = /prestito|restituisce|investe|vende|ipoteca|riscatta/;
function copiaPos(p) { return { inner: !!p.inner, pos: p.pos, ipos: p.ipos }; }
function nuoviLog(log) {
  if (!ultimoLog) return [];
  const k = JSON.stringify(ultimoLog);
  for (let i = log.length - 1; i >= 0; i--) if (JSON.stringify(log[i]) === k) return log.slice(i + 1);
  return log.slice(-12);
}
function riceviVista(v) {
  const j = JSON.stringify(v); if (j === ultimaVistaJson) return; ultimaVistaJson = j;
  if (!S) { S = v; S.players.forEach((p) => disp[p.id] = copiaPos(p)); ultimoLog = S.log[S.log.length - 1] || null; ultimoFlusso = Math.max(0, ...(S.flussi || []).map((f) => f.n)); segnoTurno = ultimoFlusso; disegna(); return; }
  coda.push(v);
  if (!animando) eseguiCoda();
}
async function eseguiCoda() {
  animando = true;
  while (coda.length) {
    const v = coda.shift();
    const righe = nuoviLog(v.log);
    if (v.log.length) ultimoLog = v.log[v.log.length - 1];
    const cashPrima = io() ? io().cash : 0;
    const tiri = [];
    for (const r of righe) { const m = / tira (\d(?: e \d)+)\.$/.exec(r.testo); if (m && r.chi) tiri.push({ chi: r.chi, d: m[1].split(" e ").map(Number) }); }
    if (tiri.length && S.fase === "giorno") disegna();
    for (let i = 0; i < tiri.length; i++) {
      const t = tiri[i], mio = t.chi === mioId;
      // i dadi degli altri partono solo quando hai chiuso le tue finestre
      if (!mio) { while (document.querySelector(".velo")) await pausa(250); }
      await mostraDadi(t.d, mio, v.players.find((p) => p.id === t.chi));
      const ultimo = !tiri.slice(i + 1).some((x) => x.chi === t.chi);
      await cammina(t.chi, t.d.reduce((a, b) => a + b, 0), ultimo ? v.players.find((p) => p.id === t.chi) : null, mio);
    }
    S = v;
    S.players.forEach((p) => disp[p.id] = copiaPos(p));
    const me = io();
    if (me && me.cash !== cashPrima && cashPrima && !saldoNascosto) mostraDelta(me.cash - cashPrima);
    for (const r of righe) avvisoPerMe(r);
    // i soldi che passano di mano: si vedono volare, con il motivo
    const nuoviF = (v.flussi || []).filter((f) => f.n > ultimoFlusso);
    if (v.flussi && v.flussi.length) ultimoFlusso = Math.max(ultimoFlusso, ...v.flussi.map((f) => f.n));
    for (const f of nuoviF.slice(-6)) await volaSoldi(f, v);
    // il risultato di un'asta lo vedono tutti, grande, e resta finché non premi Ok
    for (const r of righe) if (/^Asta/.test(r.testo)) await annuncioAsta(r.testo);
  }
  animando = false;
  disegna();
}
function avvisoPerMe(r) {
  const me = io(); if (!me || / tira \d( e \d)+\.$/.test(r.testo)) return;
  if (/affitto|Stipendio|compra|Asta|Faro|Gazzetta|Posto di blocco|Casinò|ospite famoso|permesso|cantiere/.test(r.testo) && (r.chi === mioId || r.testo.includes(" a " + me.nome + " ("))) toast(r.testo);
}
function nomeDi(id, v) { if (!id) return "la Banca"; if (id === mioId) return "Tu"; const p = (v || S).players.find((x) => x.id === id); return p ? p.nome : "?"; }
function puntoDi(id) {
  const el = id ? document.querySelector(`.chip[data-gioc="${id}"]`) : document.querySelector(".fase");
  if (id === mioId) { const s = document.querySelector(".saldo"); if (s) { const r = s.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; } }
  if (!el) return [innerWidth / 2, 40];
  const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];
}
async function volaSoldi(f, v) {
  if (VELOCE) return;
  if (f.da !== mioId && f.a !== mioId && f.importo < 50000) return; // le piccole cose degli altri non disturbano
  const [x0, y0] = puntoDi(f.da), [x1, y1] = puntoDi(f.a);
  const mio = f.da === mioId || f.a === mioId;
  const et = document.createElement("div"); et.className = "flusso-etichetta" + (mio ? " mio" : "");
  et.innerHTML = `<b>${esc(nomeDi(f.da, v))} → ${esc(nomeDi(f.a, v))}</b> <span>${euro(f.importo)}</span><i>${esc(f.motivo)}</i>`;
  document.body.appendChild(et);
  const monete = [];
  for (let i = 0; i < (mio ? 6 : 3); i++) {
    const m = document.createElement("div"); m.className = "moneta"; m.style.left = x0 + "px"; m.style.top = y0 + "px";
    document.body.appendChild(m); monete.push(m);
    setTimeout(() => { m.style.transition = "left .8s cubic-bezier(.4,.1,.3,1), top .8s cubic-bezier(.3,.6,.4,1), opacity .3s .7s"; m.style.left = (x1 + (Math.random() * 20 - 10)) + "px"; m.style.top = (y1 + (Math.random() * 14 - 7)) + "px"; m.style.opacity = "0"; }, 30 + i * 70);
  }
  if (mio) Suono.soldi(f.a === mioId);
  await pausa(mio ? 1400 : 900);
  monete.forEach((m) => m.remove());
  setTimeout(() => et.classList.add("via"), mio ? 1600 : 700); setTimeout(() => et.remove(), mio ? 2200 : 1200);
}
function finestraTratta(me, idA) {
  const a = S.players.find((x) => x.id === idA); if (!a) return;
  const suoi = S.lotti.filter((l) => l.owner === a.id && (l.tipoCasella === "lotto" || l.tipoCasella === "molo"));
  const miei = S.lotti.filter((l) => l.owner === mioId && (l.tipoCasella === "lotto" || l.tipoCasella === "molo") && !l.cantiere);
  const opz = (arr) => arr.map((l) => `<option value="${l.id}" data-p="${l.prezzo}">${esc(l.nome)}${l.lvl ? " · " + esc(L.ATTIVITA[l.tipo]?.nome || "") + " liv. " + l.lvl : ""} (vale ${euro(l.prezzo)})</option>`).join("");
  finestra(`<span class="kick" style="color:var(--oro)">${ico("handshake")} Affari con ${esc(a.nome)}</span><h2>Cosa gli proponi?</h2>
    <p class="sub">${esc(a.nome)} riceve la proposta e può accettare o rifiutare. Le compravendite le vedono tutti.</p>
    ${suoi.length ? `<div class="scheda"><h4>Compro un suo terreno</h4><select id="tSuo">${opz(suoi)}</select><div class="riga"><input id="tSuoP" type="number" placeholder="la tua offerta"><button class="oro piccolo" id="tCompra">Proponi</button></div></div>` : `<p class="sub">${esc(a.nome)} non ha terreni.</p>`}
    ${miei.length ? `<div class="scheda"><h4>Gli vendo un mio terreno</h4><select id="tMio">${opz(miei)}</select><div class="riga"><input id="tMioP" type="number" placeholder="il tuo prezzo"><button class="oro piccolo" id="tVendi">Proponi</button></div></div>` : ""}
    <div class="scheda"><h4>Altro</h4><div class="riga"><button class="piccolo" id="tPatto">Un patto con pagamenti</button><button class="piccolo" id="tRegalo">Un regalo</button></div></div>
    <div class="pulsanti"><button id="chiudi">Chiudi</button></div>`, (d, c) => {
    const prezzo = (sel, inp) => { const o = d.querySelector(sel).selectedOptions[0]; if (o && !d.querySelector(inp).value) d.querySelector(inp).value = Math.round(+o.dataset.p * 1.3); };
    if (suoi.length) { prezzo("#tSuo", "#tSuoP"); d.querySelector("#tSuo").onchange = () => { d.querySelector("#tSuoP").value = ""; prezzo("#tSuo", "#tSuoP"); }; d.querySelector("#tCompra").onclick = () => { c(); agisci({ tipo: "proponi_lotto", a: a.id, lotto: d.querySelector("#tSuo").value, prezzo: +d.querySelector("#tSuoP").value, compro: true }); toast("Proposta inviata a " + a.nome + "."); }; }
    if (miei.length) { prezzo("#tMio", "#tMioP"); d.querySelector("#tMio").onchange = () => { d.querySelector("#tMioP").value = ""; prezzo("#tMio", "#tMioP"); }; d.querySelector("#tVendi").onclick = () => { c(); agisci({ tipo: "proponi_lotto", a: a.id, lotto: d.querySelector("#tMio").value, prezzo: +d.querySelector("#tMioP").value, compro: false }); toast("Proposta inviata a " + a.nome + "."); }; }
    d.querySelector("#tPatto").onclick = () => { c(); apriApp("contratti"); };
    d.querySelector("#tRegalo").onclick = () => { c(); apriApp("banca"); };
    d.querySelector("#chiudi").onclick = c;
  });
}
function finestraProposta(pr) {
  const da = S.players.find((x) => x.id === pr.da), l = S.lotti.find((x) => x.id === pr.lotto);
  finestra(`<span class="kick" style="color:var(--oro)">${ico("handshake")} Proposta da ${esc(da.nome)}</span><h2>${pr.compro ? "Vuole comprare " : "Ti vende "}${esc(l.nome)}</h2>
    <p style="font-size:18px">${pr.compro ? "Ti offre" : "Ti chiede"} <b style="color:var(--oro)">${euro(pr.prezzo)}</b>. Il terreno vale ${euro(l.prezzo)}${l.lvl ? ", con " + esc(L.ATTIVITA[l.tipo]?.nome || "") + " di livello " + l.lvl : ""}.</p>
    ${gruppo(l) ? `<p class="sub">${gruppo(l)}</p>` : ""}
    <div class="pulsanti"><button id="no">Rifiuto</button><button class="oro" id="si">Accetto</button></div>`, (d, c) => {
    d.querySelector("#no").onclick = () => { c(); agisci({ tipo: "rispondi_proposta", id: pr.id, si: false }); };
    d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "rispondi_proposta", id: pr.id, si: true }); };
  });
}
function annuncioAsta(testo) {
  if (VELOCE) return;
  return new Promise((ok) => {
    const vinta = testo.includes(" " + (io() || {}).nome + " vince") || testo.startsWith("Asta: " + (io() || {}).nome + " vince");
    finestra(`<span class="kick" style="color:var(--rosa)">${ico("handshake")} Risultato dell'asta</span><h2 style="color:${vinta ? "var(--pulito)" : "inherit"}">${vinta ? "Hai vinto l'asta!" : "Asta chiusa"}</h2><p style="font-size:17px">${esc(testo.replace(/^Asta:? ?/, ""))}</p><div class="pulsanti"><button class="oro" id="ok">Ok</button></div>`, (d, c) => { d.querySelector("#ok").onclick = () => { c(); ok(); }; });
  });
}
function mostraDelta(d) {
  document.querySelectorAll(".delta").forEach((x) => x.remove());
  const el = document.createElement("div"); el.className = "delta"; el.textContent = (d > 0 ? "+ " : "− ") + euro(Math.abs(d));
  el.style.color = d > 0 ? "var(--pulito)" : "var(--sporco)"; Suono.soldi(d > 0);
  document.body.appendChild(el); setTimeout(() => el.remove(), 2600);
}
const FACCE = { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 5: [-90, 0], 2: [90, 0] };
const PUNTI = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
function cubo() { return `<div class="cubo">${[["f", 1], ["b", 6], ["r", 3], ["l", 4], ["t", 5], ["u", 2]].map(([k, n]) => `<div class="faccia ${k}">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<i class="${PUNTI[n].includes(i) ? "pt" : ""}"></i>`).join("")}</div>`).join("")}</div>`; }
async function mostraDadi(d, mio, p) {
  if (VELOCE) return;
  const lento = mio ? 1 : 0.55;
  const box = document.createElement("div"); box.className = "dadi-scena" + (mio ? "" : " piccoli");
  box.innerHTML = `<div class="chi">${mio ? "I tuoi dadi" : esc(p ? p.nome : "") + " tira i dadi"}</div><div class="coppia">${d.map(() => cubo()).join("")}</div><div class="totale">&nbsp;</div>`;
  document.body.appendChild(box);
  const cubi = box.querySelectorAll(".cubo");
  cubi.forEach((c) => { c.style.transition = "none"; c.style.transform = `rotateX(${Math.random() * 360}deg) rotateY(${Math.random() * 360}deg)`; });
  await pausa(30);
  Suono.dado();
  cubi.forEach((c, i) => { const [x, y] = FACCE[d[i]]; c.style.transition = `transform ${1.1 * lento}s cubic-bezier(.2,.75,.25,1)`; c.style.transform = `rotateX(${x + 720 + 360 * (i + 1)}deg) rotateY(${y + 720 + 360 * (2 - i)}deg)`; });
  await pausa(1150 * lento);
  box.querySelector(".totale").innerHTML = `${d.reduce((a, b) => a + b, 0)}${d.every((x) => x === d[0]) ? ' <span>tris! ritiri</span>' : ""}`;
  box.classList.add("fatto");
  await pausa(mio ? 900 : 450);
  box.classList.add("via"); setTimeout(() => box.remove(), 400);
}
async function cammina(id, n, finale, mio) {
  if (VELOCE) return;
  const ped = document.querySelector(`#mappa .ped[data-id="${id}"]`); if (!ped) return;
  const q = { ...(disp[id] || { inner: false, pos: 0, ipos: 0 }) };
  const punti = [puntoMappa(q)];
  for (let k = 0; k < n; k++) {
    q.pos = (q.pos + 1) % N_CAS;
    punti.push(puntoMappa(q));
    disegnaScia(punti, mio);
    const [x, y] = punti[punti.length - 1];
    ped.style.left = x + "%"; ped.style.top = y + "%";
    ped.classList.remove("salto"); void ped.offsetWidth; ped.classList.add("salto"); Suono.passo(mio);
    await pausa(mio ? 190 : 95);
  }
  if (finale) { const [x, y] = puntoMappa(finale); ped.style.left = x + "%"; ped.style.top = y + "%"; disp[id] = copiaPos(finale); }
  else disp[id] = q;
  await pausa(mio ? 500 : 150);
  const sv = document.querySelector("#mappa .scia"); if (sv) sv.classList.add("spegni");
}
function disegnaScia(punti, mio) {
  const sv = document.querySelector("#mappa .scia"); if (!sv) return;
  sv.classList.remove("spegni");
  sv.innerHTML = `<polyline points="${punti.map(([x, y]) => x + "," + (y * 0.5625)).join(" ")}" class="${mio ? "oro" : "altro"}"/>` + punti.map(([x, y]) => `<circle cx="${x}" cy="${y * 0.5625}" r="${mio ? 0.6 : 0.4}" class="${mio ? "oro" : "altro"}"/>`).join("");
}

// ------------------------------------------------------------ disegno
function disegna() {
  if (!S) return;
  const me = io(); if (!me) return;
  const notte = S.fase === "notte" && S.notte;
  $("#mondo").style.display = notte && !S.fine ? "none" : "block";
  $("#mondo").classList.toggle("notte", !!notte);
  document.body.classList.toggle("di-notte", !!notte);
  if (!TRE3D && vuole3D() && !VELOCE_2D) { try { TRE3D = Tre.avvia($("#mondo"), $("#mappa"), "img/mappa-hd.jpg"); } catch (e) { console.error(e); TRE3D = false; } }
  $("#mondo").classList.toggle("tre", TRE3D);
  if (TRE3D) Tre.impostaNotte(!!notte);
  Suono.ambiente(notte ? "notte" : "giorno");
  $("#sfondo").style.filter = "";
  const c = casellaDi(me);
  sfondo(notte ? "img/marina.jpg" : c && c.isola ? SCENE[c.isola] : "img/laguna.jpg");
  disegnaMappa(me, notte);
  const turno = S.fase === "giorno" ? L.corrente(S) : null;
  const faseTesto = S.fine ? "Partita finita" : S.fase === "pacchetti" ? "Si sceglie come iniziare" : notte ? `${ico("luna")} Notte · ${L.ORE[S.notte.ora]}` : `Ciclo ${S.ciclo + 1} di ${S.cicli || L.N.cicli} · Giorno ${S.giorno + 1} di ${L.N.giorni} · ${turno.id === mioId ? '<span style="color:var(--oro)">Tocca a te</span>' : "Turno di " + esc(turno.nome)}`;
  const segn = ["Nessuno parla di te.", "Voci: si parla di te, in giro.", "Osservato: la polizia ti tiene d'occhio.", "Indagato: la Gazzetta fa il tuo nome.", "Processo: convocazione del Giudice all'Alba."][me.stato || 0];
  const cron = S.log.filter((r) => !/ tira \d( e \d)+\.$/.test(r.testo) && !(r.chi && r.chi !== mioId && PRIVATI.test(r.testo))).slice(-4);
  $("#radice").innerHTML = `
  <div class="hud-alto">
    <div class="chips">${S.players.map((p) => `<div class="chip vetro ${turno && turno.id === p.id ? "turno" : ""} ${p.id !== mioId ? "tratta" : ""}" data-gioc="${p.id}" ${p.id !== mioId ? `title="Tocca per fare un affare con ${esc(p.nome)}"` : ""}><div class="pall" style="background:${p.colore}">${esc(p.nome[0])}</div><div><div class="n">${esc(p.nome)}${p.id === mioId ? " (tu)" : ""}</div><div class="s">${p.id === mioId ? esc(L.fascia(S, me)) : esc(p.fascia || "")}${p.faro ? " · al Faro" : ""}${notte ? (S.notteFatti[p.id] ? " · a casa" : S.notte.chiuso[p.id] ? " · ha deciso" : " · decide…") : ""}</div></div></div>`).join("")}</div>
    <div class="fase vetro">${faseTesto}</div>
    <div class="saldo vetro">
      <div class="riga" style="justify-content:space-between"><span class="kick" style="color:var(--muted)">I tuoi soldi</span><button class="piccolo" id="occhio" style="padding:2px 8px">${saldoNascosto ? "Mostra" : "Nascondi"}</button></div>
      <div class="serif tot">${saldoNascosto ? "••••••" : euro(me.cash)}</div>
      ${S.sblocco >= 1 || me.sporchi ? `<div class="ri"><span style="color:var(--sporco)">Sporchi ${saldoNascosto ? "•••" : euro(me.sporchi)}</span><span style="color:var(--oro)">Fama ${Math.round(me.fama)}</span></div>` : `<div class="ri"><span style="color:var(--oro)">Fama ${Math.round(me.fama)}</span></div>`}
      <div style="font-size:12px;margin-top:4px;color:${(me.stato || 0) >= 2 ? "#ffb3b3" : "var(--muted)"}">${segn}</div>
    </div>
  </div>
  ${notte ? scenaNotte(me)
      : `<div class="ticker">${cron.map((r) => `<div class="${r.chi === mioId ? "mia" : ""}">${esc(r.testo)}</div>`).join("")}</div>`}
  ${notte ? "" : comandiVista() + legenda()}
  <button class="vetro audio" id="audio" aria-label="${Suono.acceso() ? "Spegni" : "Accendi"} i suoni">${Suono.acceso() ? "🔊" : "🔇"}</button>
  ${notte ? "" : `<div class="carta vetro">${animando ? `<div class="sub">…</div>` : cartaGiorno(me)}</div>`}`;
  $("#occhio").onclick = () => { saldoNascosto = !saldoNascosto; disegna(); };
  document.querySelectorAll(".chip.tratta").forEach((c) => c.onclick = () => finestraTratta(me, c.dataset.gioc));
  if (!notte) collegaComandiVista(me); applicaVista();
  $("#audio").onclick = () => { Suono.cambia(); $("#audio").textContent = Suono.acceso() ? "🔊" : "🔇"; };
  const rc = document.querySelector(".scena .righe"); if (rc) rc.scrollTop = rc.scrollHeight;
  disegnaTelefono(me);
  if (animando) return;
  if (notte) collegaScena(me); else collegaCarta(me);
  if (notte && panoOra) aggiornaPanorama(me); else Pano.nascondi();
  if (S.fine) return fine();
  finestreAutomatiche(me);
}

function disegnaMappa(me, notte) {
  const m = $("#mappa");
  if (!notte) {
    const caselle = S.lotti.map((l) => casellaHtml(l)).join("");
    const gruppi = {};
    const pedine = S.players.map((p) => {
      const q = disp[p.id] || copiaPos(p); const key = "o" + q.pos; const k = (gruppi[key] = (gruppi[key] || 0) + 1) - 1;
      const [x, y] = puntoMappa(q);
      return `<div class="ped ${p.id === mioId ? "io" : ""}" data-id="${p.id}" title="${esc(p.nome)}" style="left:${x}%;top:${y}%;margin-left:${(p.id === mioId ? -14 : -11) + k * 8}px;background:${p.colore}${p.faro ? ";opacity:.45" : ""}"><b>${esc(p.nome[0])}</b></div>`;
    }).join("");
    const c = casellaDi(me);
    const [mx, my] = puntoMappa(disp[mioId] || me);
    if (TRE3D) aggiorna3D(gruppi);
    m.innerHTML = nomiIsole() + caselle + edifici() + torri() + `<svg class="scia" viewBox="0 0 100 56.25" preserveAspectRatio="none"></svg>` + pedine +
      (c && !animando && S.fase === "giorno" ? `<div class="etichetta" style="left:${mx}%;top:${my}%"><b>${esc(c.nome)}</b>${c.isola ? `<span>${esc(L.NOMI_ISOLE[c.isola])}</span>` : ""}</div>` : "");
    return;
  }
  const N2 = S.notte, dove = N2.dove[mioId], libero = !N2.chiuso[mioId] && !S.notteFatti[mioId] && !me.faro && !N2.viaggio[mioId];
  const chiamate = new Set((N2.chiamate || []).map((x) => x.luogo));
  const luoghi = Object.keys(L.LUOGHI).filter((l) => L.LUOGHI[l].sblocco <= S.sblocco).map((l) => {
    const [x, y] = posLuogo(l, me);
    const qui = dove === l && !N2.viaggio[mioId];
    const ore = !qui && libero ? L.oreViaggio(S, me, dove, l) : null;
    return `<button class="luogo ${qui ? "qui" : ""} ${chiamate.has(l) ? "chiamata" : ""}" data-luogo="${l}" style="left:${x}%;top:${y}%" ${!libero || qui ? "disabled" : ""} aria-label="${esc(nomeLuogo(l))}">
      <span class="pin">${ICO_LUOGO[l]}</span>${(() => { const v = PERSONAGGI.filter((pg) => pg.dove === l && pg.quando !== "raro" && (pg.lv <= S.sblocco || L.luogoAperto(S, l, me))); return v.length ? `<span class="volti">${v.map((pg) => volto(pg)).join("")}</span>` : ""; })()}<span class="nome">${l === "palazzo" ? "Il tuo Palazzo" : esc(L.LUOGHI[l].nome)}</span>${ore ? `<span class="ore">${ore === 1 ? "1 ora" : "2 ore"}</span>` : qui ? `<span class="ore">sei qui</span>` : ""}</button>`;
  }).join("");
  const conta = {};
  const luci = S.players.filter((p) => !p.faro).map((p) => {
    const d = N2.dove[p.id]; let [x, y] = posLuogo(d, p);
    const k = (conta[d + (d === "palazzo" ? p.id : "")] = (conta[d + (d === "palazzo" ? p.id : "")] || 0) + 1) - 1;
    x += 2.2 + k * 1.4; y -= 2.5;
    return `<div class="luce ${N2.viaggio[p.id] ? "viaggio" : ""}" title="${esc(p.nome)}${N2.viaggio[p.id] ? " · in viaggio" : ""}" style="left:${x}%;top:${y}%;background:${p.colore};color:${p.colore};${p.id === mioId ? "width:20px;height:20px;margin:-10px 0 0 -10px" : ""}"></div>`;
  }).join("");
  if (TRE3D) aggiorna3D({});
  m.innerHTML = nomiIsole() + edifici() + torri() + luoghi + luci;
  m.querySelectorAll(".luogo[data-luogo]").forEach((b) => b.onclick = () => chiediViaggio(me, b.dataset.luogo));
}

// le caselle: chiare a colpo d'occhio
//  - terreno libero: tessera chiara con il prezzo scritto e la striscia del colore del gruppo
//  - terreno di qualcuno: tessera piena del colore del proprietario, con la sua iniziale
//  - posto speciale: tondo scuro con icona e il nome scritto sotto, sempre
const ICO_CASELLA = { "Gazzetta": ico("gazzetta"), "Mercato Nero": ico("mercato"), "Bisca del Vicolo": ico("bisca"), "Spiaggia VIP": ico("vip"), "Gala Flamingo": ico("gala"), "Porto Container": ico("porto"), "La Borsa": ico("borsa"), "Il Municipio": ico("municipio"), "Banca Centrale": ico("banca"), "Casinò Reale": ico("casino") };
const NOME_BREVE = { "Gazzetta": "Gazzetta", "Mercato Nero": "Mercato Nero", "Bisca del Vicolo": "Bisca", "Spiaggia VIP": "VIP", "Gala Flamingo": "Gala", "Porto Container": "Porto", "La Borsa": "Borsa", "Il Municipio": "Municipio", "Banca Centrale": "Banca", "Casinò Reale": "Casinò" };
function icoAngolo(l) { return /Partenza/.test(l.nome) ? ico("flag") : /Faro/.test(l.nome) ? ico("faro") : /Posto di blocco/.test(l.nome) ? ico("siren") : ico("stella"); }
function kEuro(v) { return v >= 1e6 ? (v / 1e6).toLocaleString("it-IT", { maximumFractionDigits: 1 }) + " mln" : Math.round(v / 1000) + "k"; }
function casellaHtml(l) {
  const [x, y] = puntoMappa({ pos: l.idx });
  const own = l.owner ? S.players.find((p) => p.id === l.owner) : null;
  const tit = `${l.nome}${l.isola ? " · " + L.NOMI_ISOLE[l.isola] : ""}${own ? " · di " + own.nome + (l.tipo ? " (" + L.ATTIVITA[l.tipo].nome + ", livello " + l.lvl + ")" : "") + (l.cantiere ? " · cantiere in corso" : "") : l.prezzo ? " · libero, " + euro(l.prezzo) : ""}`;
  const nomeCorto = l.nome.replace(/ — .*/, "");
  let cls = "cas", dentro = "", sotto = "", stile = `left:${x}%;top:${y}%;`;
  const terreno = l.tipoCasella === "lotto" || l.tipoCasella === "molo";
  if (terreno) {
    cls += " terreno" + (l.tipoCasella === "molo" ? " molo" : "");
    stile += `--serie:${COL_SERIE[l.serie] || "#888"};`;
    if (own) { cls += " pres"; stile += `--own:${own.colore};`; dentro = `<b>${esc(own.nome[0].toUpperCase())}</b>`; }
    else dentro = l.tipoCasella === "molo" ? ico("molo") : `<em>${kEuro(l.prezzo)}</em>`;
    sotto = nomeCorto;
  } else if (l.tipoCasella === "angolo") { cls += " ang"; dentro = icoAngolo(l); sotto = nomeCorto; }
  else if (l.tipoCasella === "agenzia") { cls += " spec agz"; dentro = ico("chiave"); sotto = "Agenzia"; }
  else if (l.tipoCasella === "libero") { cls += " lib"; dentro = ico("palma"); sotto = nomeCorto; }
  else if (l.tipoCasella === "eliporto") { cls += " spec agz"; dentro = "<b>H</b>"; sotto = "Eliporto"; }
  else if (l.tipoCasella === "aeroporto") { cls += " spec agz"; dentro = ico("aereo"); sotto = "Aeroporto"; }
  else if (l.tipoCasella === "asta") { cls += " spec agz"; dentro = ico("martello"); sotto = "Asta"; }
  else { cls += " spec"; dentro = ICO_CASELLA[l.nome] || ico("stella"); sotto = NOME_BREVE[l.nome] || nomeCorto; }
  return `<div class="${cls}" data-cas="${l.id}" title="${esc(tit)}" style="${stile}"><i>${dentro}</i><span class="cn">${esc(sotto)}</span></div>`;
}
function legenda() {
  return `<div class="legenda vetro"><button class="piccolo" id="legTasto">${ico("mappa")} Legenda</button><div class="leg-dentro">
    <div><span class="lg terreno"><em>60k</em></span> Terreno libero: il numero è il prezzo</div>
    <div><span class="lg terreno pres" style="--own:var(--oro)"><b>T</b></span> Terreno di un giocatore (la sua iniziale)</div>
    <div><span class="lg spec">${ico("chiave")}</span> Agenzia: compri un terreno dell'isola senza sovrapprezzo</div>
    <div><span class="lg spec">${ico("gazzetta")}</span> Posto speciale: il nome è scritto sotto</div>
    <div><span class="lg ang">${ico("flag")}</span> Ponte: Partenza, Faro, Posto di blocco</div>
    <div class="sub">Il colore della striscia indica il gruppo di vie. Tocca una casella per leggere la scheda.</div></div></div>`;
}
function aggiorna3D(gruppi) {
  const conta = {};
  const caselle = S.lotti.map((l) => {
    const [x, y] = puntoMappa({ pos: l.idx }); const own = l.owner ? S.players.find((p) => p.id === l.owner) : null;
    return { x, y, tipo: l.tipoCasella, colore: own ? own.colore : COL_SERIE[l.serie] || (l.tipoCasella === "angolo" ? "#c9a24a" : "#28344a"), proprietario: own ? own.colore : null, livello: l.lvl, cantiere: !!l.cantiere };
  });
  const cc = {};
  const torri3 = S.players.filter((p) => p.piani > 0).map((p) => { const isola = isolaCasa(p); const k = (cc[isola] = (cc[isola] || 0) + 1) - 1; const [x, y] = POS_CASA[isola]; return { x: x + k * 2.2, y, colore: p.colore, piani: p.piani }; });
  const giocatori = S.players.map((p) => { const q = disp[p.id] || copiaPos(p); const key = "o" + q.pos; const k = (conta[key] = (conta[key] || 0) + 1) - 1; const [x, y] = puntoMappa(q); return { id: p.id, colore: p.colore, x, y, offset: k, nascosta: S.fase === "notte" || p.faro > 0 }; });
  Tre.aggiorna({ caselle, torri: torri3, giocatori });
}
// i gruppi di vie: spiegati con parole semplici
function gruppo(l) {
  if (!l.serie || l.serie === "Moli") return "";
  const vie = S.lotti.filter((x) => x.serie === l.serie), mie = vie.filter((x) => x.owner === mioId).length;
  return `Gruppo «${l.serie}»: ${vie.length} vie dello stesso colore a ${L.NOMI_ISOLE[l.isola]}. Tu ne hai ${mie}. Se le hai tutte, gli affitti raddoppiano e puoi costruire fino al livello 5.`;
}

// i nomi delle isole, sempre visibili
const NOMI_POS = { Ambra: [22, 55], Palma: [21, 23], Flamingo: [78, 21.5], Sole: [86, 71.5], Corona: [50, 53] };
function nomiIsole() {
  return Object.entries(NOMI_POS).map(([k, [x, y]]) => `<div class="isola-nome" style="left:${x}%;top:${y}%">${esc(L.NOMI_ISOLE[k])}</div>`).join("") + `<div class="isola-nome piccola" style="left:84%;top:88%">Il Faro</div>`;
}
// toccando una casella si apre la sua scheda
function schedaCasella(id, cx, cy) {
  document.querySelectorAll(".scheda-cas").forEach((x) => x.remove());
  const l = S.lotti.find((x) => x.id === id); if (!l) return;
  const own = l.owner ? S.players.find((p) => p.id === l.owner) : null;
  const righe = [];
  if (l.isola) righe.push(L.NOMI_ISOLE[l.isola]);
  if (gruppo(l)) righe.push(`<span style="color:${COL_SERIE[l.serie]}">■</span> ${gruppo(l)}`);
  if (l.tipoCasella === "lotto" || l.tipoCasella === "molo") {
    if (own) righe.push(`Di <b style="color:${own.colore}">${esc(own.nome)}</b>${own.id === mioId ? " (tua)" : ""}`); else righe.push("Libera · costa " + euro(l.prezzo));
    if (l.cantiere) righe.push("🚧 Cantiere: " + L.ATTIVITA[l.cantiere.tipo].nome + ", apre all'Alba");
    else if (l.tipo) righe.push(L.ATTIVITA[l.tipo].nome + " · livello " + l.lvl);
    if (own && own.id !== mioId) righe.push("Se ci finisci paghi " + euro(L.affitto(S, l)));
  } else {
    const SPIEGA = { "Gazzetta": "Peschi una notizia: può andarti bene o male.", "Mercato Nero": "Di giorno ti danno una dritta. Di notte ci puoi comprare oggetti.", "Spiaggia VIP": "Incontri gente famosa: più fama.", "Gala Flamingo": "Serata di beneficenza: doni e guadagni fama.", "Porto Container": "Di giorno senti delle voci. Di notte arrivano i carichi.", "La Borsa": "Investimenti senza commissioni.", "Il Municipio": "Candidature a Sindaco e licenza del casinò.", "Banca Centrale": "Prestiti.", "Casinò Reale": "Una puntata al tavolo." };
    const ANG = { 0: "Si parte da qui. Ogni volta che ci passi incassi lo Stipendio.", 16: "La prigione. Se ci finisci per una condanna, stai fermo qualche turno.", 32: "L'ingresso di Isola Corona: le vie più care della Laguna.", 64: "Posto di blocco: se sei sotto indagine ti controllano." };
    SPIEGA["Bisca del Vicolo"] = "Di giorno senti qualche voce. Di notte si gioca forte.";
    righe.push(l.tipoCasella === "angolo" ? ANG[l.idx] : l.tipoCasella === "agenzia" ? "Se ti fermi qui, in questo turno l'app Agenzia ti vende un terreno di quest'isola a prezzo pieno, senza il 20% in più." : l.tipoCasella === "libero" ? "Qui non succede niente: ti riposi." : l.tipoCasella === "eliporto" ? "Eliporto: con un elicottero, l'eliporto nel Palazzo o il jet ci arrivi col Viaggio rapido (una volta per Ciclo, al posto dei dadi)." : l.tipoCasella === "aeroporto" ? "Aeroporto della Laguna: col jet ci arrivi col Viaggio rapido. Di notte, dal Livello 2, qui arrivano i voli cargo e partono le spedizioni." : l.tipoCasella === "asta" ? "Asta del Comune. Se ti fermi qui, in questo turno compri un terreno libero di quest'isola a prezzo pieno. I terreni sequestrati dal Giudice vanno all'asta per tutti (tranne l'ex padrone): i soldi vanno alla banca." : SPIEGA[l.nome] || "");
  }
  const d = document.createElement("div"); d.className = "scheda-cas vetro";
  d.innerHTML = `<b>${esc(l.nome)}</b>${righe.map((r) => `<span>${r}</span>`).join("")}`;
  d.style.left = Math.min(innerWidth - 270, cx + 14) + "px"; d.style.top = Math.max(70, Math.min(innerHeight - 180, cy - 20)) + "px";
  document.body.appendChild(d);
  setTimeout(() => addEventListener("pointerdown", function via(e) { if (!e.target.closest(".scheda-cas")) { d.remove(); removeEventListener("pointerdown", via, true); } }, true), 0);
}

// gli edifici crescono: un disegno per ogni lotto costruito, e la torre del Palazzo di ognuno
const ICO_LIV = ["", ico("liv1"), ico("liv2"), ico("liv3"), ico("liv4"), ico("liv5")];
function edifici() {
  return S.lotti.filter((l) => l.owner && (l.lvl > 0 || l.cantiere)).map((l) => {
    const [x, y] = puntoMappa({ pos: l.idx });
    const own = S.players.find((p) => p.id === l.owner);
    const lv = l.cantiere ? 0 : l.lvl, size = 18 + lv * 5;
    return `<div class="edificio ${l.cantiere ? "cant" : ""}" title="${esc(l.nome)}" style="left:${x}%;top:${y}%;--s:${size}px;--col:${own.colore}">${l.cantiere ? ico("cantiere") : ICO_LIV[lv]}</div>`;
  }).join("");
}
function torri() {
  const conta = {};
  return S.players.filter((p) => p.piani > 0).map((p) => {
    const isola = isolaCasa(p); const k = (conta[isola] = (conta[isola] || 0) + 1) - 1;
    const [x, y] = POS_CASA[isola];
    const h = Math.min(150, 14 + p.piani * 3);
    return `<div class="torre" title="Il Palazzo di ${esc(p.nome)}: ${p.piani} piani" style="left:${x + k * 2.2}%;top:${y}%;--col:${p.colore};--h:${h}px"><div class="fusto"></div><span>${p.piani}</span></div>`;
  }).join("");
}

// ------------------------------------------------------------ esplorare la mappa: zoom e spostamento
let vista = { z: 1, x: 0, y: 0 };
function applicaVista() {
  const m = $("#mappa"); if (!m) return;
  if (TRE3D) { m.style.transform = ""; m.style.setProperty("--z", 1); return; }
  const w = m.offsetWidth, h = m.offsetHeight, W = innerWidth, H = innerHeight;
  const maxX = Math.max(0, (w * vista.z - W) / 2), maxY = Math.max(0, (h * vista.z - H) / 2); // la mappa copre sempre tutto lo schermo
  vista.x = Math.max(-maxX, Math.min(maxX, vista.x)); vista.y = Math.max(-maxY, Math.min(maxY, vista.y));
  m.style.transform = `translate(calc(-50% + ${vista.x}px), calc(-50% + ${vista.y}px)) scale(${vista.z})`;
  m.style.setProperty("--z", vista.z);
  $("#mondo").classList.toggle("vicino", vista.z >= 1.6);
}
function zoomA(z, cx = innerWidth / 2, cy = innerHeight / 2) {
  const nz = Math.max(1, Math.min(4, z));
  const k = nz / vista.z;
  vista.x = (vista.x - (cx - innerWidth / 2)) * k + (cx - innerWidth / 2);
  vista.y = (vista.y - (cy - innerHeight / 2)) * k + (cy - innerHeight / 2);
  vista.z = nz; applicaVista();
}
function centraSu(px, py) {
  const m = $("#mappa"); const w = m.offsetWidth, h = m.offsetHeight;
  if (vista.z < 1.8) vista.z = 2;
  vista.x = -(px / 100 - 0.5) * w * vista.z; vista.y = -(py / 100 - 0.5) * h * vista.z; applicaVista();
}
function collegaEsplora() {
  const mondo = $("#mondo");
  mondo.addEventListener("wheel", (e) => {
    if (TRE3D) return;
    e.preventDefault();
    const rotella = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY));
    if (e.ctrlKey) zoomA(vista.z * Math.pow(1.012, -e.deltaY), e.clientX, e.clientY);          // pizzico sul trackpad
    else if (rotella) zoomA(vista.z * Math.pow(1.0018, -e.deltaY * (e.deltaMode === 1 ? 33 : 1)), e.clientX, e.clientY); // rotellina del mouse
    else { vista.x -= e.deltaX; vista.y -= e.deltaY; $("#mondo").classList.add("trascino"); applicaVista(); clearTimeout(vista.t); vista.t = setTimeout(() => $("#mondo").classList.remove("trascino"), 120); } // due dita sul trackpad
  }, { passive: false });
  // Safari: il pizzico arriva come "gesture"
  let gz = 1;
  mondo.addEventListener("gesturestart", (e) => { e.preventDefault(); gz = vista.z; });
  mondo.addEventListener("gesturechange", (e) => { e.preventDefault(); if (TRE3D) return; zoomA(gz * e.scale, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2); });
  addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input,textarea,select")) return;
    const passo = 80;
    if (e.key === "+" || e.key === "=") zoomA(vista.z * 1.3); else if (e.key === "-") zoomA(vista.z / 1.3);
    else if (e.key === "ArrowLeft") { vista.x += passo; applicaVista(); } else if (e.key === "ArrowRight") { vista.x -= passo; applicaVista(); }
    else if (e.key === "ArrowUp") { vista.y += passo; applicaVista(); } else if (e.key === "ArrowDown") { vista.y -= passo; applicaVista(); }
  });
  let trascina = null; const tocchi = new Map();
  mondo.addEventListener("pointerdown", (e) => {
    if (TRE3D) return;
    if (e.target.closest("button")) return;
    tocchi.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (tocchi.size === 1) trascina = { x: e.clientX, y: e.clientY, vx: vista.x, vy: vista.y };
    if (tocchi.size === 2) { const [a, b] = [...tocchi.values()]; trascina = { pinch: Math.hypot(a.x - b.x, a.y - b.y), z: vista.z, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; }
  });
  addEventListener("pointermove", (e) => {
    if (!trascina || !tocchi.has(e.pointerId)) return;
    tocchi.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (trascina.pinch && tocchi.size === 2) { const [a, b] = [...tocchi.values()]; zoomA(trascina.z * Math.hypot(a.x - b.x, a.y - b.y) / trascina.pinch, trascina.cx, trascina.cy); return; }
    if (!trascina.pinch) { vista.x = trascina.vx + e.clientX - trascina.x; vista.y = trascina.vy + e.clientY - trascina.y; mondo.classList.add("trascino"); applicaVista(); }
  });
  let inizio = null;
  mondo.addEventListener("pointerdown", (e) => { inizio = { x: e.clientX, y: e.clientY }; }, true);
  mondo.addEventListener("click", (e) => {
    const c = e.target.closest(".cas"); if (!c || !S) return;
    if (inizio && Math.hypot(e.clientX - inizio.x, e.clientY - inizio.y) > 6) return;
    schedaCasella(c.dataset.cas, e.clientX, e.clientY);
  });
  const fine = (e) => { tocchi.delete(e.pointerId); if (!tocchi.size) { trascina = null; mondo.classList.remove("trascino"); } };
  addEventListener("pointerup", fine); addEventListener("pointercancel", fine);
  addEventListener("resize", applicaVista);
}
function comandiVista() {
  return `<div class="comandi-vista vetro"><button id="zPiu" aria-label="Avvicina">＋</button><button id="zMeno" aria-label="Allontana">−</button>${TRE3D ? `<button id="zSx" aria-label="Ruota a sinistra" title="Ruota">⟲</button><button id="zDx" aria-label="Ruota a destra" title="Ruota">⟳</button>` : ""}<button id="zTutto" aria-label="Vista intera" title="Vista intera">⤢</button><button id="zMio" aria-label="Vai alla tua pedina" title="La tua pedina">◎</button><button id="z3d" title="${TRE3D ? "Passa al tabellone piatto" : "Passa al tabellone 3D"}" style="font-size:12px;font-weight:800">${TRE3D ? "2D" : "3D"}</button></div>`;
}
function notteOra() { return S && S.fase === "notte" && S.notte; }
let legendaAperta = false;
function collegaComandiVista(me) {
  const lt = $("#legTasto"); if (lt) { $(".legenda").classList.toggle("aperta", legendaAperta); lt.onclick = () => { legendaAperta = !legendaAperta; $(".legenda").classList.toggle("aperta", legendaAperta); }; }
  $("#zPiu").onclick = () => TRE3D ? Tre.avvicina(0.7) : zoomA(vista.z * 1.35);
  $("#zMeno").onclick = () => TRE3D ? Tre.avvicina(1.4) : zoomA(vista.z / 1.35);
  if ($("#zSx")) { $("#zSx").onclick = () => Tre.ruota(-35); $("#zDx").onclick = () => Tre.ruota(35); }
  $("#zTutto").onclick = () => { if (TRE3D) return Tre.tutto(); vista = { z: 1, x: 0, y: 0 }; applicaVista(); };
  $("#zMio").onclick = () => { const notte = S.fase === "notte" && S.notte; const [x, y] = notte ? posLuogo(S.notte.dove[mioId], me) : puntoMappa(disp[mioId] || me); TRE3D ? Tre.centraSu(x, y) : centraSu(x, y); };
  $("#z3d").onclick = () => { try { localStorage.setItem("laguna_3d", TRE3D ? "0" : "1"); } catch (e) { } location.reload(); };
}

// ------------------------------------------------------------ la carta principale (in basso)
function cartaGiorno(me) {
  if (S.fine) return `<div class="titolo">La partita è finita</div>`;
  if (S.fase === "pacchetti") return tocca() ? `<div class="titolo">Scegli come iniziare</div><button class="oro grande" data-a="pacchetti">Vedi le storie di partenza</button>` : `<div class="titolo">Gli altri scelgono come iniziare</div><div class="sub">Tocca a ${esc(S.players[S.sceltaPacchetti[0]].nome)}.</div>`;
  if (S.pending && S.pending.tipo === "asta") {
    const l = S.lotti.find((x) => x.id === S.pending.lotto);
    return tocca() ? `<div class="titolo">Asta: ${esc(l.nome)}</div><button class="oro grande" data-a="asta">Fai la tua offerta segreta</button>` : `<div class="titolo">Asta in corso: ${esc(l.nome)}</div><div class="sub">Aspetta le offerte degli altri.</div>`;
  }
  const turno = L.corrente(S);
  if (turno.id !== mioId) return `<div class="titolo">Turno di ${esc(turno.nome)}</div><div class="sub">Guarda dove va. Intanto puoi aprire il telefono.</div>`;
  if (S.pending && S.pending.giocatore === mioId) return `<div class="titolo">${S.pending.tipo === "chiamata" ? ico("sconosciuto") + " Ti stanno chiamando" : "Hai una scelta da fare"}</div><button class="oro grande" data-a="pending">${S.pending.tipo === "chiamata" ? "Rispondi" : "Decidi"}</button>`;
  const c = casellaDi(me);
  if (!me.haTirato) return riepilogoGiro() + rivalita() + `<div class="riga" style="justify-content:space-between;align-items:center"><div><div class="kick" style="color:var(--muted)">Sei a</div><div class="dove">${esc(c ? c.nome : "")}</div></div><div class="riga">${!me.doppi && me.rapidoCiclo !== S.ciclo && L.destinazioniRapide(S, me).length ? `<button data-a="rapido">${ico("aereo")} Viaggio rapido</button>` : ""}<button class="oro grande" data-a="tira">${ico("dado")} Tira i dadi</button></div></div>`;
  if (me.faro) return `<div class="titolo">Sei al Faro</div><div class="sub">Oggi non ti muovi. Hai diritto a una telefonata: puoi usare il telefono una volta.</div><button class="oro" data-a="fine">Fine turno</button>`;
  const dadi = me.dadi ? me.dadi.map((x) => `<span class="dado">${x}</span>`).join("") : "";
  const own = c && c.owner ? S.players.find((p) => p.id === c.owner) : null;
  const cosa = !c ? "" : own && own.id === mioId ? "È tua." : own ? `È di ${esc(own.nome)}.` : c.prezzo ? "È libera." : "";
  const permessi = S.lotti.filter((l) => l.owner === mioId && l.permesso && !l.cantiere).length;
  return `<div class="riga" style="align-items:center">${dadi}<div style="flex:1;min-width:0"><div class="dove">${esc(c ? c.nome : "")}</div><div class="sub">${c && c.isola ? esc(L.NOMI_ISOLE[c.isola]) + " · " : ""}${cosa}</div></div></div>
    <div class="sub">${me.azioneGiornoFatta ? "Hai già fatto la tua mossa di oggi." : permessi ? `Hai ${permessi === 1 ? "un permesso pronto" : permessi + " permessi pronti"}: puoi aprire un cantiere.` : "Oggi puoi fare una mossa: chiedere un permesso, aprire un cantiere, alzare il Palazzo…"}</div>
    <div class="riga">${me.azioneGiornoFatta ? "" : `<button data-a="imprese">${ico("imprese")} Le mie imprese</button>`}${agenziaDisponibile(me) ? `<button data-a="agenzia">${ico("chiave")} Agenzia${me.agenziaSconto ? " (senza sovrapprezzo)" : ""}</button>` : ""}<button class="oro" data-a="fine" style="margin-left:auto">Fine turno</button></div>`;
}
function cartaNotte(me) {
  const N2 = S.notte;
  if (me.faro) return `<div class="titolo">Notte al Faro</div><div class="sub">Sei in cella. La Laguna si muove senza di te.</div>`;
  if (S.notteFatti[mioId]) return `<div class="titolo">Sei a casa</div><div class="sub">Per te la notte è finita. Gli altri girano ancora: all'Alba si scopre tutto.</div>`;
  const v = N2.viaggio[mioId];
  if (v) return `<div class="titolo">In viaggio verso ${esc(nomeLuogo(v.verso))}…</div><div class="sub">Arrivi tra ${v.restano === 1 ? "un'ora" : v.restano + " ore"}.</div>`;
  const altri = S.players.filter((p) => p.id !== mioId && !p.faro && !S.notteFatti[p.id] && !N2.chiuso[p.id]);
  if (N2.chiuso[mioId]) return `<div class="titolo">Hai deciso.</div><div class="sub">${altri.length ? "Aspetti che " + altri.map((p) => esc(p.nome)).join(", ") + (altri.length > 1 ? " decidano" : " decida") + "…" : "L'ora sta per finire…"}</div>`;
  const dove = N2.dove[mioId];
  const ultima = [...N2.racconto].reverse().find((r) => r.includes("Arrivi a")) || "";
  const indizio = ultima.includes(nomeLuogo(dove)) ? ultima.split(". ").slice(1).join(". ") : "";
  const occ = (N2.occasioni || []).map((o) => `<div class="occ ${o.legale ? "legale" : ""}"><h3>${esc(o.nome)}</h3><div class="storia">${esc(o.testo)}</div>
      <div class="riga"><span class="sub">${o.costo ? "Ci metti " + euro(o.costo) : "Non costa niente"}</span><button class="${o.legale ? "oro" : "notte"}" data-occ="${o.n}" style="margin-left:auto">${o.legale ? "Ci sto" : "Accetto"}</button></div></div>`).join("");
  const extra = [];
  const negozio = Object.entries(L.OGGETTI).filter(([k, O]) => O.dove === dove);
  if (negozio.length) extra.push(`<button data-a="negozio">${ico("mercato")} ${dove === "mercato" ? "Il banco del Mercato Nero" : "Compra qui"}</button>`);
  if (dove === "mercato") extra.push(`<button data-a="soffiata">${ico("soffiata")} Una soffiata (50.000 €)</button>`);
  if (dove === "casino" && me.sporchi > 0) extra.push(`<button data-a="ricicla">${ico("ricicla")} Ripulisci i soldi</button>`);
  if (dove === "palazzo" && me.sporchi > 0 && me.veicoli.includes("jet")) extra.push(`<button data-a="paradiso">${ico("ricicla")} Volo nel paradiso fiscale</button>`);
  if ((dove === "club" || dove === "casino") && S.sblocco >= 1) extra.push(`<button data-a="corrompi">${ico("handshake")} ${dove === "club" ? "Parla con la polizia" : "Parla con il banchiere Lenz"}</button>`);
  if (dove === "redazione") extra.push(`<button data-a="articolo">${ico("gazzetta")} Compra un articolo</button>`);
  if (dove === "faro" && S.sette.some((st) => st.gm === mioId)) extra.push(`<button data-a="setta">${ico("setta")} Riunisci la setta</button>`);
  const quiAltri = S.players.filter((p) => p.id !== mioId && N2.dove[p.id] === dove && dove !== "palazzo" && !N2.viaggio[p.id]);
  if (quiAltri.length && (me.valigetta || []).some((o) => o.id === "macchina")) extra.push(...quiAltri.map((p) => `<button data-foto="${p.id}">${ico("macchina")} Fotografa ${esc(p.nome)}</button>`));
  return `<div class="riga" style="justify-content:space-between;align-items:baseline"><div class="dove">${esc(nomeLuogo(dove, true))}</div><span class="kick" style="color:var(--cielo)">ore ${L.ORE[N2.ora]} · ${6 - N2.ora} ${6 - N2.ora === 1 ? "ora" : "ore"} all'alba</span></div>
    ${indizio ? `<div class="storia">${esc(indizio)}</div>` : dove === "palazzo" && N2.ora === 0 ? `<div class="storia">La notte è tua. Tocca un luogo illuminato sulla mappa per andarci.</div>` : ""}
    ${appuntamenti(me, dove)}
    ${occ || (dove !== "palazzo" ? `<div class="sub">${N2.piuTardi ? "Per ora non succede niente. Si dice che più tardi qui arrivi qualcuno: puoi restare ad aspettare." : "Stanotte qui non c'è niente per te. Prova un altro posto."}</div>` : "")}
    ${extra.length ? `<div class="riga">${extra.join("")}</div>` : ""}
    <div class="riga"><span class="sub" style="flex:1">${dove === "palazzo" ? "Tocca un luogo sulla mappa per uscire." : "Tocca un luogo sulla mappa per spostarti."}</span><button data-a="aspetta">${ico("orologio")} Resta qui un'ora</button><button data-a="casa">${ico("casa")} Torna a casa</button></div>`;
}

// ------------------------------------------------------------ la notte: una scena per ogni luogo
const SCENA_NOTTE = { aeroporto: "img/notte-aeroporto.jpg", palazzo: "img/notte-palazzo.jpg", club: "img/notte-club.jpg", marina: "img/notte-marina.jpg", mercato: "img/notte-mercato.jpg", bisca: "img/notte-bisca.jpg", porto: "img/notte-porto.jpg", casino: "img/notte-casino.jpg", redazione: "img/notte-redazione.jpg", villa: "img/notte-villa.jpg", faro: "img/notte-faro.jpg", viaggio: "img/notte-viaggio.jpg" };
// le sale piu' lussuose: si aprono con fama e ricchezza (il Palazzo con i piani)
const NOMI_LIVELLO = { club: ["", "Privé", "Terrazza VIP"], marina: ["", "Molo degli yacht", "Ponte del megayacht"], mercato: ["", "Retrobottega", "Magazzino segreto"], bisca: ["", "Tavolo dei grandi", "Sala del padrino"], porto: ["", "Ufficio del capo porto", "Nave privata"], casino: ["", "Sala privata", "Salone del Re"], redazione: ["", "Ufficio del direttore", "Archivio segreto"], villa: ["", "Giardino", "Dentro la villa"], faro: ["", "La lanterna", "La stanza nascosta"], palazzo: ["", "Attico", "Grattacielo"] };
const FOTO_LIVELLI = new Set(["club-2", "club-3"]);
function fotoLivello(l, lv) { for (let k = lv; k > 0; k--) if (FOTO_LIVELLI.has(l + "-" + (k + 1))) return "img/notte-" + l + "-" + (k + 1) + ".jpg"; return SCENA_NOTTE[l] || SCENA_NOTTE.palazzo; }
// I panorami a 360°: ogni luogo puo' avere piu' punti di vista (si passa dall'uno all'altro senza perdere l'ora)
// fa: "scelta:<k o id>" = una delle scelte dell'ora; "punto:<nome>" = spostati; "altrove" / "negozio" / "casa"
const PANORAMI = {
  club: {
    pista: { img: "img/360/club-pista.jpg", lv: 0, punti: [
      { x: 0.50, y: 0.45, testo: "La consolle del DJ", icona: "club", fa: "scelta:fissa" },
      { x: 0.12, y: 0.58, testo: "Il bancone", icona: "gala", fa: "scelta:occ" },
      { x: 0.64, y: 0.55, testo: "Sali al Privé", icona: "stella", fa: "punto:prive" },
      { x: 0.84, y: 0.55, testo: "Esci sulla spiaggia", icona: "mappa", fa: "altrove" },
    ] },
    prive: { img: "img/360/club-prive.jpg", lv: 1, punti: [
      { x: 0.65, y: 0.72, testo: "Lo champagne con le stelline", icona: "gala", fa: "scelta:fissa" },
      { x: 0.35, y: 0.52, testo: "Il barista del privé", icona: "handshake", fa: "scelta:polizia" },
      { x: 0.50, y: 0.50, testo: "Torna sulla pista", icona: "club", fa: "punto:pista" },
      { x: 0.71, y: 0.48, testo: "La porta d'oro", icona: "stella", fa: "chiuso:Terrazza VIP" },
    ] },
  },
  marina: {
    pontile: { img: "img/360/marina-pontile.jpg", lv: 0, punti: [
      { x: 0.33, y: 0.51, testo: "Gli yacht", icona: "marina", fa: "scelta:fissa" },
      { x: 0.50, y: 0.55, testo: "In fondo al pontile", icona: "maschera", fa: "scelta:occ" },
      { x: 0.86, y: 0.55, testo: "Il chiosco dei motoscafi", icona: "motoscafo", fa: "negozio" },
      { x: 0.63, y: 0.55, testo: "Sali sul megayacht", icona: "stella", fa: "punto:yacht" },
      { x: 0.08, y: 0.49, testo: "Il lungomare", icona: "mappa", fa: "altrove" },
    ] },
    yacht: { img: "img/360/marina-yacht.jpg", lv: 1, punti: [
      { x: 0.50, y: 0.59, testo: "La vasca sul ponte", icona: "marina", fa: "scelta:fissa" },
      { x: 0.78, y: 0.74, testo: "Il bar del ponte", icona: "gala", fa: "scelta:occ" },
      { x: 0.18, y: 0.78, testo: "Scendi sul pontile", icona: "marina", fa: "punto:pontile" },
    ] },
  },
  mercato: {
    vicolo: { img: "img/360/mercato-vicolo.jpg", lv: 0, punti: [
      { x: 0.29, y: 0.68, testo: "Il vecchio al banco", icona: "soffiata", fa: "scelta:fissa" },
      { x: 0.80, y: 0.78, testo: "La merce sul banco", icona: "mercato", fa: "negozio" },
      { x: 0.49, y: 0.51, testo: "In fondo al vicolo", icona: "maschera", fa: "scelta:occ" },
      { x: 0.67, y: 0.43, testo: "La tenda scura", icona: "stella", fa: "punto:retro" },
      { x: 0.05, y: 0.47, testo: "Esci dal mercato", icona: "mappa", fa: "altrove" },
    ] },
    retro: { img: "img/360/mercato-retro.jpg", lv: 1, punti: [
      { x: 0.47, y: 0.74, testo: "Il tavolo dei soldi", icona: "maschera", fa: "scelta:occ" },
      { x: 0.18, y: 0.35, testo: "Gli scaffali", icona: "mercato", fa: "negozio" },
      { x: 0.63, y: 0.64, testo: "La cassaforte (soffiata)", icona: "soffiata", fa: "soffiata" },
      { x: 0.52, y: 0.43, testo: "Torna nel vicolo", icona: "mercato", fa: "punto:vicolo" },
    ] },
  },
  bisca: {
    sala: { img: "img/360/bisca-sala.jpg", lv: 0, punti: [
      { x: 0.47, y: 0.64, testo: "Un tavolo libero", icona: "bisca", fa: "scelta:fissa" },
      { x: 0.71, y: 0.62, testo: "Il tavolo del croupier", icona: "maschera", fa: "scelta:occ" },
      { x: 0.51, y: 0.47, testo: "La porta in fondo", icona: "stella", fa: "punto:grandi" },
      { x: 0.14, y: 0.47, testo: "La scala per uscire", icona: "mappa", fa: "altrove" },
    ] },
    grandi: { img: "img/360/bisca-grandi.jpg", lv: 1, punti: [
      { x: 0.51, y: 0.62, testo: "Il grande tavolo", icona: "bisca", fa: "scelta:fissa" },
      { x: 0.33, y: 0.51, testo: "Il padrone dei sigari", icona: "maschera", fa: "scelta:occ" },
      { x: 0.50, y: 0.37, testo: "Torna nella sala", icona: "bisca", fa: "punto:sala" },
    ] },
  },
  porto: {
    banchina: { img: "img/360/porto-banchina.jpg", lv: 0, punti: [
      { x: 0.12, y: 0.66, testo: "I container", icona: "maschera", fa: "scelta:occ" },
      { x: 0.78, y: 0.74, testo: "La cabina dei gruisti", icona: "porto", fa: "scelta:fissa" },
      { x: 0.62, y: 0.72, testo: "Il furgone", icona: "furgone", fa: "negozio" },
      { x: 0.43, y: 0.57, testo: "L'ufficio del capo porto", icona: "stella", fa: "punto:ufficio" },
      { x: 0.50, y: 0.82, testo: "Il cancello", icona: "mappa", fa: "altrove" },
    ] },
    ufficio: { img: "img/360/porto-ufficio.jpg", lv: 1, punti: [
      { x: 0.53, y: 0.70, testo: "Il registro delle navi", icona: "maschera", fa: "scelta:occ" },
      { x: 0.43, y: 0.64, testo: "La radio", icona: "porto", fa: "scelta:fissa" },
      { x: 0.06, y: 0.60, testo: "Scendi in banchina", icona: "porto", fa: "punto:banchina" },
    ] },
  },
  casino: {
    salone: { img: "img/360/casino-salone.jpg", lv: 0, punti: [
      { x: 0.27, y: 0.72, testo: "La roulette", icona: "casino", fa: "scelta:fissa" },
      { x: 0.52, y: 0.47, testo: "La cassa", icona: "ricicla", fa: "scelta:ricicla" },
      { x: 0.70, y: 0.70, testo: "Il tavolo di Lenz", icona: "handshake", fa: "scelta:banchiere" },
      { x: 0.89, y: 0.43, testo: "Lo scalone", icona: "stella", fa: "punto:privata" },
      { x: 0.06, y: 0.43, testo: "L'uscita", icona: "mappa", fa: "altrove" },
    ] },
    privata: { img: "img/360/casino-privata.jpg", lv: 1, punti: [
      { x: 0.52, y: 0.59, testo: "La roulette privata", icona: "casino", fa: "scelta:fissa" },
      { x: 0.79, y: 0.43, testo: "Il banco privato", icona: "handshake", fa: "scelta:banchiere" },
      { x: 0.16, y: 0.62, testo: "Il cassiere privato", icona: "ricicla", fa: "scelta:ricicla" },
      { x: 0.40, y: 0.42, testo: "Torna nel salone", icona: "casino", fa: "punto:salone" },
    ] },
  },
  redazione: {
    sala: { img: "img/360/redazione-sala.jpg", lv: 0, punti: [
      { x: 0.57, y: 0.72, testo: "Le bozze sul tavolo", icona: "gazzetta", fa: "scelta:fissa" },
      { x: 0.72, y: 0.43, testo: "La bacheca del caporedattore", icona: "gazzetta", fa: "scelta:articolo" },
      { x: 0.21, y: 0.66, testo: "Un avvocato al telefono", icona: "avvocato", fa: "negozio" },
      { x: 0.50, y: 0.43, testo: "L'ufficio del direttore", icona: "stella", fa: "punto:direttore" },
      { x: 0.06, y: 0.58, testo: "Le scale", icona: "mappa", fa: "altrove" },
    ] },
    direttore: { img: "img/360/redazione-direttore.jpg", lv: 1, punti: [
      { x: 0.50, y: 0.72, testo: "La prima pagina di domani", icona: "gazzetta", fa: "scelta:fissa" },
      { x: 0.64, y: 0.62, testo: "Il whisky del direttore", icona: "handshake", fa: "scelta:articolo" },
      { x: 0.07, y: 0.55, testo: "Torna in redazione", icona: "gazzetta", fa: "punto:sala" },
    ] },
  },
  villa: {
    bosco: { img: "img/360/villa-bosco.jpg", lv: 0, punti: [
      { x: 0.70, y: 0.41, testo: "Guarda la villa", icona: "villa", fa: "scelta:fissa" },
      { x: 0.47, y: 0.60, testo: "Il cancello", icona: "maschera", fa: "scelta:occ" },
      { x: 0.60, y: 0.55, testo: "Scavalca il muro", icona: "stella", fa: "punto:giardino" },
      { x: 0.06, y: 0.75, testo: "Torna alla strada", icona: "mappa", fa: "altrove" },
    ] },
    giardino: { img: "img/360/villa-giardino.jpg", lv: 1, punti: [
      { x: 0.16, y: 0.55, testo: "Le porte di vetro", icona: "maschera", fa: "scelta:occ" },
      { x: 0.52, y: 0.74, testo: "La piscina", icona: "villa", fa: "scelta:fissa" },
      { x: 0.90, y: 0.70, testo: "Torna nel bosco", icona: "villa", fa: "punto:bosco" },
    ] },
  },
  faro: {
    scogliera: { img: "img/360/faro-scogliera.jpg", lv: 0, punti: [
      { x: 0.37, y: 0.43, testo: "La porta del Faro", icona: "setta", fa: "scelta:setta" },
      { x: 0.86, y: 0.55, testo: "Il mare", icona: "faro", fa: "scelta:fissa" },
      { x: 0.53, y: 0.66, testo: "Il molo", icona: "maschera", fa: "scelta:occ" },
      { x: 0.37, y: 0.22, testo: "Sali sulla lanterna", icona: "stella", fa: "punto:lanterna" },
      { x: 0.65, y: 0.70, testo: "La barca", icona: "mappa", fa: "altrove" },
    ] },
    lanterna: { img: "img/360/faro-lanterna.jpg", lv: 1, punti: [
      { x: 0.16, y: 0.47, testo: "Guarda chi arriva dal mare", icona: "faro", fa: "scelta:fissa" },
      { x: 0.50, y: 0.47, testo: "La grande lente", icona: "setta", fa: "scelta:setta" },
      { x: 0.50, y: 0.88, testo: "Scendi", icona: "faro", fa: "punto:scogliera" },
    ] },
  },
  palazzo: {
    basso: { img: "img/360/palazzo-basso.jpg", lv: 0, punti: [
      { x: 0.50, y: 0.47, testo: "Esci in strada", icona: "mappa", fa: "altrove" },
      { x: 0.31, y: 0.74, testo: "Il divano", icona: "casa", fa: "aspetta" },
      { x: 0.50, y: 0.66, testo: "Il carrello dei liquori", icona: "ricicla", fa: "scelta:paradiso" },
    ] },
    attico: { img: "img/360/palazzo-attico.jpg", lv: 1, punti: [
      { x: 0.51, y: 0.47, testo: "La vista sulla laguna", icona: "casa", fa: "aspetta" },
      { x: 0.12, y: 0.47, testo: "Il bar", icona: "ricicla", fa: "scelta:paradiso" },
      { x: 0.90, y: 0.51, testo: "Scendi in città", icona: "mappa", fa: "altrove" },
    ] },
    grattacielo: { img: "img/360/palazzo-grattacielo.jpg", lv: 2, punti: [
      { x: 0.45, y: 0.55, testo: "Sopra le nuvole", icona: "casa", fa: "aspetta" },
      { x: 0.16, y: 0.78, testo: "La valigetta del jet", icona: "ricicla", fa: "scelta:paradiso" },
      { x: 0.82, y: 0.55, testo: "L'eliporto", icona: "mappa", fa: "altrove" },
    ] },
  },
};
let panoOra = null;
// alla serata di un altro si vede il SUO palazzo: piu' piani ha, piu' la vista e' alta
function serataOspite() { const N2 = S.notte; return N2 && N2.ospite ? (N2.serate || []).find((x) => x.host === N2.ospite) || { nome: "?", piani: 0, livello: 0 } : null; }
function livelloPalazzoQui() { const so = serataOspite(); return so ? so.livello || 0 : S.livelloPalazzo || 0; }
// il punto di vista: chi ha piu' lustro entra direttamente nella sala migliore (poi puo' spostarsi)
function puntoCorrente(l) {
  const P = PANORAMI[l], nomi = Object.keys(P);
  const max = l === "palazzo" ? livelloPalazzoQui() : S.lustro || 0;
  const permessi = nomi.filter((n) => (P[n].lv || 0) <= max);
  if (l === "palazzo") return permessi.pop();
  const chiave = l + "|" + S.ciclo + "|" + S.notte.ora;
  if (!puntoVista[l] || !permessi.includes(puntoVista[l]) || (puntoVista[l + "#"] !== chiave && !puntoVista[l + "!"])) { puntoVista[l] = permessi[permessi.length - 1]; }
  puntoVista[l + "#"] = chiave;
  return puntoVista[l];
}
const puntoVista = {};
function aggiornaPanorama(me) {
  const P = PANORAMI[panoOra]; if (!P) return Pano.nascondi();
  const quale = puntoCorrente(panoOra);
  const V = P[quale], N2 = S.notte, scelte = N2.scelte || [];
  const libero = !N2.chiuso[mioId] && !N2.viaggio[mioId] && !S.notteFatti[mioId];
  const punti = V.punti.map((pt) => {
    const [tipo, chi] = pt.fa.split(":");
    let azione = null, classe = "", testo = pt.testo;
    if (tipo === "scelta") {
      const i = scelte.findIndex((c) => c.k === chi || c.id === chi);
      if (i < 0 || !libero) classe = "spento";
      else { testo += " · " + scelte[i].titolo; azione = () => { const b = document.querySelector(`.scena [data-scelta="${i}"]`); if (b) b.click(); }; }
    } else if (tipo === "punto") {
      const bloccato = (P[chi].lv || 0) > (S.lustro || 0);
      classe = bloccato ? "chiuso" : "porta";
      azione = bloccato ? () => toast("Il buttafuori ti ferma: qui entra solo chi ha più fama e più soldi.") : () => { puntoVista[panoOra] = chi; puntoVista[panoOra + "!"] = true; Pano.guarda(0); disegna(); };
    } else if (tipo === "altrove") { if (!libero) classe = "spento"; else azione = () => finestraAltrove(me); }
    else if (tipo === "negozio") { if (!Object.values(L.OGGETTI).some((O) => O.dove === N2.dove[mioId])) classe = "spento"; else azione = () => finestraNegozio(me); }
    else if (tipo === "soffiata") azione = () => finestraSoffiata(me);
    else if (tipo === "aspetta") { if (!libero) classe = "spento"; else azione = () => agisci({ tipo: "aspetta" }); }
    else if (tipo === "chiuso") { classe = "chiuso"; azione = () => toast((S.lustro || 0) >= 2 ? chi + ": arriva presto." : "Dietro la porta d'oro c'è la " + chi + ". Si apre solo ai più potenti della Laguna."); }
    return { ...Pano.daFoto(pt.x, pt.y), ...pt, testo: esc(testo), icona: ico(pt.icona), classe, azione };
  });
  if (panoOra === "palazzo") {
    const extra = { serata: "casino", spa: "stella", polizia: "handshake", tavolo: "casino", brinda: "gala" };
    let k = 0;
    scelte.forEach((c, i) => { if (!extra[c.k] || !libero) return; punti.push({ ...Pano.daFoto(0.28 + (k++) * 0.22, 0.70), testo: esc(c.titolo), icona: ico(extra[c.k]), classe: "", azione: () => { const b = document.querySelector(`.scena [data-scelta="${i}"]`); if (b) b.click(); } }); });
  }
  // gli altri giocatori presenti compaiono nella sala
  (N2.qui || []).forEach((id, k) => {
    const q = S.players.find((x) => x.id === id); if (!q) return;
    punti.push({ ...Pano.daFoto(0.38 + k * 0.12, 0.62), testo: esc(q.nome) + " è qui", icona: `<b style="color:${q.colore};font-size:18px">${esc(q.nome[0])}</b>`, classe: "persona", azione: () => finestraIncontro(me, id) });
  });
  Pano.mostra(V.img, punti, { yaw: 0 });
}
const ICO_SCELTA = { doganiere: "handshake", tavolo: "casino", brinda: "gala", serata: "casino", spa: "stella", occ: "sconosciuto", ricicla: "ricicla", banchiere: "handshake", polizia: "handshake", articolo: "gazzetta", setta: "setta", paradiso: "ricicla", foto: "macchina", aspetta: "orologio" };
function righeNotte(lista) { return lista.map((r) => { const [o, ...t] = r.split(" — "); return `<p><b>${esc(o)}</b> ${esc(t.join(" — "))}</p>`; }).join(""); }
function restoOra() { const N2 = S.notte; if (!N2 || !N2.inizio) return null; return Math.max(0, Math.ceil((N2.tempo || 120) - (Date.now() - N2.inizio) / 1000)); }
function scenaNotte(me) {
  const N2 = S.notte, dove = N2.dove[mioId], v = N2.viaggio[mioId];
  const aCasa = S.notteFatti[mioId], scelto = N2.chiuso[mioId], pronto = N2.pronto && N2.pronto[mioId];
  const qualeLuogo = aCasa ? "palazzo" : dove;
  const lv = qualeLuogo === "palazzo" ? livelloPalazzoQui() : S.lustro || 0;
  const img = me.faro ? SCENA_NOTTE.faro : v ? SCENA_NOTTE.viaggio : fotoLivello(qualeLuogo, lv);
  panoOra = !me.faro && !v && PANORAMI[qualeLuogo] ? qualeLuogo : null;
  const lvSala = !me.faro && !v && PANORAMI[qualeLuogo] ? PANORAMI[qualeLuogo][puntoCorrente(qualeLuogo)].lv || 0 : lv;
  const sala = !me.faro && !v && lvSala ? (NOMI_LIVELLO[qualeLuogo] || [])[lvSala] : "";
  const serOsp = serataOspite();
  const nome = me.faro ? "In cella, al Faro" : aCasa ? "Il tuo Palazzo" : v ? "In viaggio verso " + (v.serata ? "il Palazzo di " + (S.players.find((x) => x.id === v.serata) || {}).nome : nomeLuogo(v.verso)) : serOsp ? "Palazzo di " + serOsp.nome + " · piano " + serOsp.piani : nomeLuogo(dove, true);
  const isola = !v && !aCasa && dove !== "palazzo" && L.LUOGHI[dove] ? L.NOMI_ISOLE[L.LUOGHI[dove].isola] || "" : "";
  const quiAltri = v || aCasa || dove === "palazzo" ? [] : S.players.filter((p) => p.id !== mioId && !p.faro && !S.notteFatti[p.id] && !N2.viaggio[p.id] && N2.dove[p.id] === dove);
  const mancano = S.players.filter((p) => p.id !== mioId && !p.faro && !S.notteFatti[p.id] && !(N2.pronto && N2.pronto[p.id]));
  const resto = restoOra();
  const testa = `<div class="scena-testa">
      <div class="kick" style="color:var(--cielo)">${ico("luna")} ore ${L.ORE[N2.ora]} · ${6 - N2.ora} ${6 - N2.ora === 1 ? "ora" : "ore"} all'alba${isola ? " · " + esc(isola) : ""}${N2.pericoloQui && !v && !aCasa ? ` · <span style="color:${COLORE_POLIZIA[N2.pericoloQui]}">polizia ${N2.pericoloQui}</span>` : ""}</div>
      <h1>${esc(nome)}</h1>${sala ? `<div class="sala">${ico("stella")} ${esc(sala)}</div>` : ""}
      ${quiAltri.length ? `<div class="qui-altri">${quiAltri.map((p) => `<button class="persona" data-persona="${p.id}"><span class="pall" style="background:${p.colore}">${esc(p.nome[0])}</span>${esc(p.nome)}</button>`).join(" ")} <span class="sub">${quiAltri.length === 1 ? "è qui con te: toccalo" : "sono qui con te: toccali"}</span></div>` : ""}
      ${resto !== null && !aCasa && !me.faro ? `<div class="tempo"><div class="barra" id="barraTempo" style="width:${(resto / (N2.tempo || 120)) * 100}%"></div></div><div class="sub" id="contoTempo">${resto <= 20 ? testoTempo(resto) : ""}</div>` : ""}
    </div>`;
  let corpo = "";
  const racc = N2.racconto || [];
  if (me.faro) corpo = `<div class="storia">Sei in cella. Fuori la Laguna si muove senza di te.</div>`;
  else if (aCasa) corpo = `<div class="storia">Per te la notte è finita. ${mancano.length ? "Sono ancora in giro: " + mancano.map((p) => esc(p.nome)).join(", ") + "." : ""} All'alba si scopre tutto.</div>`;
  else if (!scelto && !v) {
    const intro = racc.slice(N2.inizioRacc || 0);
    const scelte = N2.scelte || [];
    const negozio = Object.values(L.OGGETTI).some((O) => O.dove === dove);
    corpo = `${intro.length ? `<div class="righe">${righeNotte(intro.slice(-1))}</div>` : ""}
      ${appuntamenti(me, dove)}
      <div class="scelte">${scelte.map((c, i) => `<button class="scelta ${c.k === "occ" && !c.legale ? "losca" : c.k === "occ" ? "legale" : c.k === "aspetta" ? "calma" : ""}" data-scelta="${i}">
        <span class="ic">${ico(c.k === "occ" ? (c.legale ? "stella" : "maschera") : c.k === "fissa" ? ICO_FISSA[c.id] || "stella" : ICO_SCELTA[c.k] || "orologio")}</span><b>${esc(c.titolo)}</b><span class="t">${esc(c.testo)}</span><span class="fai">Tocca ancora per farlo</span>${c.k === "occ" ? `<span class="costo">${c.costo ? "Ci metti " + euro(c.costo) : "Non costa niente"}${c.riservata ? " · è l'appuntamento" : ""}</span>` : c.k === "fissa" ? `<span class="costo">${c.costo ? euro(c.costo) : c.puntata ? "Scegli la puntata" : "Non costa niente"}</span>` : ""}</button>`).join("")}</div>
      <div class="scena-barra">${negozio ? `<button data-a="negozio">${ico("mercato")} Guarda la merce</button>` : ""}${dove === "mercato" ? `<button data-a="soffiata">${ico("soffiata")} Soffiata</button>` : ""}${scelte.some((c) => c.k === "aspetta") ? "" : `<button data-a="aspetta">${ico("orologio")} Resta qui</button>`}<button data-a="altrove">${ico("mappa")} Vai altrove</button><button data-a="casa">${ico("casa")} Torna a casa</button></div>`;
  } else {
    const da = v && N2.daScelta === undefined ? N2.inizioRacc || 0 : N2.daScelta !== undefined ? N2.daScelta : N2.inizioRacc || 0;
    const storia = racc.slice(da);
    corpo = `<div class="righe grandi">${storia.length ? righeNotte(storia) : v ? `<p>Arrivi tra ${v.restano === 1 ? "un'ora" : v.restano + " ore"}.</p>` : ""}</div>
      ${pronto ? `<div class="attesa">${mancano.length ? "Aspetti " + mancano.map((p) => esc(p.nome)).join(", ") + "…" : "L'ora sta finendo…"}</div>` : `<button class="oro grande avanti" data-a="avanti">Avanti</button>`}`;
  }
  // le animazioni non devono ripartire a ogni aggiornamento: ricordo quando e' iniziata questa scena
  const chiave = img + "|" + S.ciclo, nuova = !inizioScena[chiave];
  if (nuova) inizioScena[chiave] = Date.now();
  const da = (Date.now() - inizioScena[chiave]) / 1000;
  if (panoOra) return `<div class="scena con-pano ${nuova ? "entra" : ""}"><div class="scena-velo"></div><div class="scena-dentro">${testa}${corpo}</div></div>`;
  return `<div class="scena ${nuova ? "entra" : ""}"><div class="scena-foto" style="background-image:url('${img}');animation-delay:-${da.toFixed(1)}s"></div><div class="scena-nebbia" style="animation-delay:-${da.toFixed(1)}s"></div><div class="scena-velo"></div><div class="scena-dentro">${testa}${corpo}</div></div>`;
}
const inizioScena = {};
function testoTempo(r) { return r > 0 ? "Restano " + r + " secondi per quest'ora" : "Tempo finito: chi non ha scelto resta dov'è"; }
let orologioNotte = null, scadutoInviato = "";
function collegaScena(me) {
  const on = (a, f) => document.querySelectorAll(`.scena [data-a="${a}"]`).forEach((b) => b.onclick = f);
  document.querySelectorAll(".scena [data-vai]").forEach((b) => b.onclick = () => chiediViaggio(me, b.dataset.vai));
  on("avanti", () => agisci({ tipo: "avanti" }));
  on("negozio", () => finestraNegozio(me));
  on("soffiata", () => finestraSoffiata(me));
  on("altrove", () => finestraAltrove(me));
  on("casa", () => finestra(`<h2>Torni a casa?</h2><p>Per te la notte finisce qui. Non potrai più uscire fino all'alba.</p><div class="pulsanti"><button id="no">Resto fuori</button><button class="notte" id="si">Torno a casa</button></div>`, (d, c) => { d.querySelector("#no").onclick = c; d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "torna_a_casa" }); }; }));
  const scelte = S.notte.scelte || [];
  document.querySelectorAll(".scena [data-scelta]").forEach((b) => b.onclick = () => {
    const c = scelte[+b.dataset.scelta]; if (!c) return;
    const diretta = ["occ", "ricicla", "paradiso", "banchiere", "polizia", "doganiere"].includes(c.k);
    if (!diretta && !b.classList.contains("aperta")) { document.querySelectorAll(".scena .scelta.aperta").forEach((x) => x.classList.remove("aperta")); b.classList.add("aperta"); return; }
    if (c.k === "occ") return finestraOccasione(me, c.n);
    if (c.k === "ricicla") return finestraRicicla(me, false);
    if (c.k === "paradiso") return finestraRicicla(me, true);
    if (c.k === "banchiere" || c.k === "polizia") return finestraCorrompi(me);
    if (c.k === "doganiere") return finestraDoganiere(me);
    if (c.k === "articolo") return finestraArticolo(me);
    if (c.k === "setta") return finestraSetta(me);
    if (c.k === "foto") return agisci({ tipo: "foto", bersaglio: c.bersaglio });
    if (c.k === "aspetta") return agisci({ tipo: "aspetta" });
    if (c.k === "fissa") return c.puntata ? finestraPuntata(me, c) : agisci({ tipo: "attivita" });
    if (c.k === "spa") return agisci({ tipo: "spa" });
    if (c.k === "brinda") return agisci({ tipo: "incontro", a: c.a, cosa: "drink" });
    if (c.k === "tavolo") return finestraPuntata(me, { ...c, id: "tavolo" });
    if (c.k === "serata") return finestra(`<span class="kick" style="color:var(--oro)">${ico("casino")} Il tuo Casinò privato · piano ${me.piani}</span><h2>Apri una serata</h2><p>Tutti ricevono l'invito. Chi viene sale nel tuo Palazzo e vede la Laguna dal piano ${me.piani}. Paga l'ingresso a te, poi gioca al tuo tavolo: il banco sei tu (vince un po' più spesso, ma se un ospite sbanca paghi tu).</p><p class="sub">Quanto fai pagare l'ingresso?</p><div class="riga" style="flex-wrap:wrap">${[0, 50_000, 100_000, 250_000].map((x) => `<button class="oro" data-ing="${x}">${x ? euro(x) : "Gratis"}</button>`).join("")}</div><div class="pulsanti"><button id="no">Non stanotte</button></div>`, (d, chiudi) => { d.querySelector("#no").onclick = chiudi; d.querySelectorAll("[data-ing]").forEach((b) => b.onclick = () => { chiudi(); agisci({ tipo: "serata", ingresso: +b.dataset.ing }); }); });
  });
  on("aspetta", () => agisci({ tipo: "aspetta" }));
  document.querySelectorAll(".scena [data-persona]").forEach((b) => b.onclick = () => finestraIncontro(me, b.dataset.persona));
  // l'orologio dell'ora: scorre ogni secondo; se il tempo finisce e io ho gia' finito, lo dico al server
  clearInterval(orologioNotte);
  orologioNotte = setInterval(() => {
    if (!notteOra()) return clearInterval(orologioNotte);
    const r = restoOra(); if (r === null) return;
    const b = $("#barraTempo"), t = $("#contoTempo");
    if (b) b.style.width = (r / (S.notte.tempo || 120)) * 100 + "%";
    if (t) t.textContent = r <= 20 ? testoTempo(r) : "";
    const io_ = io(), N2 = S.notte;
    const hoFinito = S.notteFatti[mioId] || io_.faro || (N2.pronto && N2.pronto[mioId]);
    const chiave = S.ciclo + "_" + N2.ora;
    if (r <= 0 && hoFinito && scadutoInviato !== chiave && !LOCALE) { scadutoInviato = chiave; chiama({ comando: "azione", partita, azione: { tipo: "tempo_scaduto" } }).then(() => caricaVista()).catch(() => { }); }
  }, 1000);
}
const ICO_FISSA = { giro: "gala", yacht: "marina", chiedi: "soffiata", carte: "bisca", gruisti: "porto", roulette: "casino", bozze: "gazzetta", osserva: "villa", mare: "faro" };
function finestraPuntata(me, c) {
  const puntate = [50_000, 100_000, 250_000, 500_000, 1_000_000].filter((x) => x <= (c.id === "roulette" ? me.cash : me.cash + me.sporchi));
  finestra(`<span class="kick" style="color:var(--cielo)">${ico(ICO_FISSA[c.id])} ${esc(nomeLuogo(S.notte.dove[mioId], true))}</span><h2>${esc(c.titolo)}</h2><p class="storia">${esc(c.testo)}</p>
    <p class="sub">${c.id === "tavolo" ? "Se vinci, il padrone di casa ti paga il doppio. Se perdi, i soldi vanno a lui." : c.id === "carte" ? "Se vinci, ti danno il doppio in contanti sporchi. Lascia qualche Traccia." : "Se vinci, ti danno il doppio, tutto pulito. Qui si gioca solo con soldi puliti."}${c.id === "carte" ? " Si paga prima con i soldi sporchi." : ""}</p>
    ${puntate.length ? `<div class="riga" style="flex-wrap:wrap">${puntate.map((x) => `<button class="oro" data-p="${x}">${euro(x)}</button>`).join("")}</div>` : `<p>Non hai abbastanza soldi per puntare.</p>`}
    <div class="pulsanti"><button id="no">Lascio stare</button></div>`, (d, chiudi) => {
    d.querySelector("#no").onclick = chiudi;
    d.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => { chiudi(); agisci(c.id === "tavolo" ? { tipo: "gioca_serata", importo: +b.dataset.p } : { tipo: "attivita", importo: +b.dataset.p }); });
  });
}
function finestraIncontro(me, id) {
  const q = S.players.find((x) => x.id === id), N2 = S.notte;
  const libero = !N2.chiuso[mioId] && !N2.viaggio[mioId] && !S.notteFatti[mioId];
  const foto = (me.valigetta || []).some((o) => o.id === "macchina");
  const riga = (k, icona, titolo, testo) => `<button class="luogo-riga" data-i="${k}" ${libero ? "" : "disabled"}><span class="ic">${ico(icona)}</span><span style="flex:1;text-align:left"><b>${titolo}</b><br><span class="sub">${testo}</span></span></button>`;
  finestra(`<span class="kick" style="color:var(--cielo)">${esc(nomeLuogo(N2.dove[mioId], true))} · ore ${L.ORE[N2.ora]}</span>
    <h2><span class="pall" style="background:${q.colore};display:inline-flex;width:30px;height:30px;border-radius:50%;align-items:center;justify-content:center;font-size:15px;border:2px solid #fff;vertical-align:middle">${esc(q.nome[0])}</span> ${esc(q.nome)}</h2>
    <p class="sub">${esc(q.fascia || "")}. ${libero ? "Cosa fai? Ogni scelta usa la tua ora." : "Hai già deciso cosa fare in quest'ora."}</p>
    <div class="lista-luoghi">
      ${riga("drink", "gala", "Offrigli da bere", "20.000 €. Se accetta: +2 fama a tutti e due, e capisci quanti soldi sporchi ha.")}
      ${riga("sfida", "bisca", "Sfidalo a carte", "Una mano sola, chi vince prende tutto. Se rifiuta, ti riprendi i soldi.")}
      ${riga("segui", "setta", "Seguilo", "Non se ne accorge. Alla fine dell'ora sai dove è andato.")}
      ${foto ? riga("foto", "macchina", "Fotografalo", "Se fa qualcosa di losco, hai una Prova.") : ""}
    </div>
    <div class="pulsanti"><button id="no">Lascia stare</button></div>`, (d, c) => {
    d.querySelector("#no").onclick = c;
    d.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => {
      const k = b.dataset.i; c();
      if (k === "foto") return agisci({ tipo: "foto", bersaglio: id });
      if (k === "sfida") return finestra(`<h2>Quanto metti sul tavolo?</h2><div class="riga" style="flex-wrap:wrap">${[50_000, 100_000, 250_000, 500_000, 1_000_000].filter((x) => x <= me.cash + me.sporchi).map((x) => `<button class="oro" data-p="${x}">${euro(x)}</button>`).join("")}</div><div class="pulsanti"><button id="no">Lascia stare</button></div>`, (d2, c2) => { d2.querySelector("#no").onclick = c2; d2.querySelectorAll("[data-p]").forEach((x) => x.onclick = () => { c2(); agisci({ tipo: "incontro", a: id, cosa: "sfida", importo: +x.dataset.p }); }); });
      agisci({ tipo: "incontro", a: id, cosa: k });
    });
  });
}
function finestraProposteNotte(me) {
  const pr = (S.notte && S.notte.proposte || []).find((x) => x.a === mioId && x.stato === "attesa" && !visti.has("pn" + S.ciclo + "_" + x.id));
  if (!pr) return false;
  visti.add("pn" + S.ciclo + "_" + pr.id);
  const da = S.players.find((x) => x.id === pr.da);
  finestra(`<span class="kick" style="color:var(--cielo)">${ico("luna")} ${esc(nomeLuogo(S.notte.dove[mioId], true))}</span>
    <h2>${pr.tipo === "drink" ? esc(da.nome) + " ti offre da bere" : esc(da.nome) + " ti sfida a carte"}</h2>
    <p>${pr.tipo === "drink" ? "Un cameriere posa due bicchieri sul tuo tavolo. Se accetti: +2 fama, ma potresti parlare troppo." : "Ha messo <b>" + euro(pr.importo) + "</b> sul tavolo. Per accettare devi metterne altrettanti. Una mano sola: chi vince prende tutto."}</p>
    <p class="sub">Rispondere non usa la tua ora.</p>
    <div class="pulsanti"><button id="no">No, grazie</button><button class="oro" id="si">${pr.tipo === "drink" ? "Brindo" : "Accetto"}</button></div>`, (d, c) => {
    d.querySelector("#no").onclick = () => { c(); agisci({ tipo: "rispondi_incontro", id: pr.id, si: false }); };
    d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "rispondi_incontro", id: pr.id, si: true }); };
  });
  return true;
}
function finestraAltrove(me) {
  const N2 = S.notte, dove = N2.dove[mioId], restano = 6 - N2.ora;
  const luoghi = Object.keys(L.LUOGHI).filter((l) => L.LUOGHI[l].sblocco <= S.sblocco && l !== dove);
  const chiamate = new Set((N2.chiamate || []).filter((c) => !c.scaduta).map((x) => x.luogo));
  finestra(`<span class="kick" style="color:var(--cielo)">Ore ${L.ORE[N2.ora]} · ${restano} ${restano === 1 ? "ora" : "ore"} all'alba</span><h2>Dove vai?</h2>
    <div class="lista-luoghi">${luoghi.map((l) => { const ore = L.oreViaggio(S, me, dove, l); const gente = S.players.filter((p) => p.id !== mioId && !p.faro && !S.notteFatti[p.id] && N2.dove[p.id] === l && l !== "palazzo").length; return `<button class="luogo-riga" data-l="${l}" ${ore > restano ? "disabled" : ""} style="background-image:linear-gradient(90deg,rgba(6,10,24,.92),rgba(6,10,24,.55)),url('${SCENA_NOTTE[l]}')"><span class="ic">${ICO_LUOGO[l]}</span><span style="flex:1;text-align:left"><b>${esc(nomeLuogo(l, true))}</b><br><span class="sub">${l === "palazzo" ? "Casa tua" : esc(L.NOMI_ISOLE[L.LUOGHI[l].isola] || "")}${gente ? " · " + gente + (gente === 1 ? " persona" : " persone") + " ci sono già" : ""}${chiamate.has(l) ? " · appuntamento" : ""}</span></span>${(() => { const v = PERSONAGGI.filter((pg) => pg.dove === l && pg.quando !== "raro"); return v.length ? `<span class="volti-riga" title="${esc(v.map((pg) => pg.nome).join(", "))}">${v.map((pg) => volto(pg)).join("")}</span>` : ""; })()}<span class="ore">${ore === 1 ? "1 ora" : "2 ore"}</span></button>`; }).join("")}</div>
    ${(N2.serate || []).filter((x) => x.host !== mioId && x.host !== N2.ospite).map((x) => `<button class="luogo-riga" data-serata="${x.host}" style="margin-top:8px;border-color:rgba(243,197,107,.6)"><span class="ic">${ico("casino")}</span><span style="flex:1;text-align:left"><b>Serata al Palazzo di ${esc(x.nome)}</b><br><span class="sub">Casinò privato al piano ${x.piani} · ingresso ${x.ingresso ? euro(x.ingresso) : "gratis"} · ${x.ospiti} ${x.ospiti === 1 ? "ospite" : "ospiti"}</span></span><span class="ore">invito</span></button>`).join("")}
    <div class="pulsanti"><button id="no">Resto qui</button></div>`, (d, c) => {
    d.querySelector("#no").onclick = c;
    d.querySelectorAll("[data-l]").forEach((b) => b.onclick = () => { c(); agisci({ tipo: "vai", luogo: b.dataset.l }); });
    d.querySelectorAll("[data-serata]").forEach((b) => b.onclick = () => { c(); agisci({ tipo: "vai_serata", host: b.dataset.serata }); });
  });
}
function avviso(html, ms) {
  let box = $("#avvisi"); if (!box) { box = document.createElement("div"); box.id = "avvisi"; document.body.appendChild(box); }
  const d = document.createElement("div"); d.className = "avviso vetro"; d.innerHTML = html; d.onclick = () => d.remove();
  box.appendChild(d); while (box.children.length > 2) box.firstChild.remove();
  setTimeout(() => { d.classList.add("via"); setTimeout(() => d.remove(), 600); }, ms || 6500);
}
function avvisoRiepilogo(R) {
  const m = R.mio, pezzi = [];
  if (m.soldi) pezzi.push(`<b style="color:${m.soldi > 0 ? "#7bd88f" : "#ff9a9a"}">${m.soldi > 0 ? "+" : "−"}${euro(Math.abs(m.soldi))}</b>${m.sporchi > 0 ? ' <span style="color:var(--sporco)">sporchi</span>' : ""}`);
  if (m.fama) pezzi.push(`fama ${m.fama > 0 ? "+" : ""}${m.fama}`);
  if (m.rischio) pezzi.push(`<span style="color:${["", "#f3c56b", "#ff9a5c", "#ff5c5c"][m.rischio]}">${["", "poco rischio", "rischio alto", "rischio altissimo"][m.rischio]}</span>`);
  if (m.visti.length) pezzi.push("hai visto " + m.visti.map(esc).join(", "));
  avviso(`<span class="kick" style="color:var(--cielo)">${esc(R.da)} → ${esc(R.a)}</span><div>${pezzi.join(" · ")}</div>`, 7000);
}
function finestraRiepilogo(R) {
  const m = R.mio;
  const RISCHIO = ["Nessun rischio", "Poco rischio", "Rischio alto", "Rischio altissimo"];
  const col = ["#7bd88f", "#f3c56b", "#ff9a5c", "#ff5c5c"];
  const segno = (x) => (x > 0 ? "+" : x < 0 ? "−" : "") + euro(Math.abs(x));
  finestra(`<span class="kick" style="color:var(--cielo)">${ico("luna")} Dalle ${esc(R.da)} alle ${esc(R.a)}</span><h2>Com'è andata quest'ora</h2>
    <div class="riep">
      <div><span class="sub">Dov'eri</span><b>${esc(m.dove)}</b></div>
      <div><span class="sub">Chi hai visto</span><b>${m.visti.length ? m.visti.map(esc).join(", ") : "Nessuno"}</b></div>
      <div><span class="sub">Soldi</span><b style="color:${m.soldi > 0 ? "#7bd88f" : m.soldi < 0 ? "#ff9a9a" : "inherit"}">${m.soldi ? segno(m.soldi) : "Niente"}</b>${m.sporchi > 0 ? `<span class="sub" style="color:var(--sporco)">di cui sporchi ${euro(m.sporchi)}</span>` : ""}</div>
      <div><span class="sub">Fama</span><b>${m.fama ? (m.fama > 0 ? "+" : "") + m.fama : "Uguale"}</b></div>
      <div class="largo"><span class="sub">Rischio preso</span><div class="rischio">${[0, 1, 2].map((i) => `<i style="background:${i < m.rischio ? col[m.rischio] : "rgba(255,255,255,.15)"}"></i>`).join("")}</div><b style="color:${col[m.rischio]}">${RISCHIO[m.rischio]}</b></div>
    </div>
    <div class="pulsanti"><button class="oro" id="ok">Continua</button></div>`, (d, c) => { d.querySelector("#ok").onclick = () => { c(); finestreAutomatiche(io()); }; });
}
function appuntamenti(me, dove) {
  const ora = S.notte.ora;
  return (S.notte.chiamate || []).map((c) => {
    const scaduto = ora >= c.alle, qui = c.luogo === dove;
    if (scaduto) return `<div class="appunt scad">${ico("sconosciuto")} <span>L'appuntamento a <b>${esc(L.LUOGHI[c.luogo].nome)}</b> era entro le ${L.ORE[c.alle]}: il contatto se n'è andato.</span></div>`;
    if (qui) return `<div class="appunt ok">${ico("sconosciuto")} <span>Sei all'appuntamento della telefonata. <b>È qui sotto:</b> «${esc(c.nome)}».</span></div>`;
    return `<div class="appunt">${ico("sconosciuto")} <span>Appuntamento: <b>${esc(L.LUOGHI[c.luogo].nome)}</b>, entro le <b>${L.ORE[c.alle]}</b>. Ci vogliono ${L.oreViaggio(S, me, dove, c.luogo) === 1 ? "1 ora" : "2 ore"}.</span><button class="piccolo notte" data-vai="${c.luogo}">Vai</button></div>`;
  }).join("");
}
function collegaCarta(me) {
  document.querySelectorAll(".carta [data-vai]").forEach((b) => b.onclick = () => chiediViaggio(me, b.dataset.vai));
  const on = (a, f) => document.querySelectorAll(`.carta [data-a="${a}"]`).forEach((b) => b.onclick = f);
  on("tira", () => agisci({ tipo: "tira" }));
  on("rapido", () => finestraRapido(me));
  on("fine", () => { segnoTurno = Math.max(segnoTurno, ...(S.flussi || []).map((f) => f.n), 0); agisci({ tipo: "fine_turno" }); });
  on("pacchetti", () => finestraPacchetti());
  on("asta", () => finestraAsta(me));
  on("pending", () => finestraPending(me));
  on("imprese", () => apriApp("imprese"));
  on("agenzia", () => apriApp("agenzia"));
  on("aspetta", () => agisci({ tipo: "aspetta" }));
  on("casa", () => finestra(`<h2>Torni a casa?</h2><p>Per te la notte finisce qui. Non potrai più uscire fino all'Alba.</p><div class="pulsanti"><button id="no">Resto fuori</button><button class="notte" id="si">Torno a casa</button></div>`, (d, c) => { d.querySelector("#no").onclick = c; d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "torna_a_casa" }); }; }));
  on("negozio", () => finestraNegozio(me));
  on("soffiata", () => finestraSoffiata(me));
  on("ricicla", () => finestraRicicla(me, false));
  on("paradiso", () => finestraRicicla(me, true));
  on("corrompi", () => finestraCorrompi(me));
  on("articolo", () => finestraArticolo(me));
  on("setta", () => finestraSetta(me));
  document.querySelectorAll(".carta [data-occ]").forEach((b) => b.onclick = () => finestraOccasione(me, +b.dataset.occ));
  document.querySelectorAll(".carta [data-foto]").forEach((b) => b.onclick = () => agisci({ tipo: "foto", bersaglio: b.dataset.foto }));
}
function chiediViaggio(me, luogo) {
  const ore = L.oreViaggio(S, me, S.notte.dove[mioId], luogo);
  const restano = 6 - S.notte.ora;
  finestra(`<span class="kick" style="color:var(--cielo)">${ICO_LUOGO[luogo]} ${luogo === "palazzo" ? "" : esc(L.NOMI_ISOLE[L.LUOGHI[luogo].isola] || "")}</span><h2>${esc(nomeLuogo(luogo))}</h2>
    <p>Ci vogliono <b>${ore === 1 ? "1 ora" : "2 ore"}</b>${ore === 2 ? ", attraverso i ponti" : ""}. Mancano ${restano} ${restano === 1 ? "ora" : "ore"} all'alba.</p>
    ${ore > restano ? `<p style="color:#ffb3b3">Non arriveresti prima dell'alba.</p>` : ""}
    <div class="pulsanti"><button id="no">Resto qui</button><button class="notte" id="si" ${ore > restano ? "disabled" : ""}>Vado</button></div>`,
    (d, c) => { d.querySelector("#no").onclick = c; d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "vai", luogo }); }; });
}

// ------------------------------------------------------------ il telefono
const APPS = [
  { k: "impero", nome: "Il mio impero", ico: ico("impero"), col: "#b8860b", lv: 0 },
  { k: "imprese", nome: "Imprese", ico: ico("imprese"), col: "#c9a24a", lv: 0 },
  { k: "agenzia", nome: "Agenzia", ico: ico("chiave"), col: "#1f6b4a", lv: 0 },
  { k: "banca", nome: "Banca", ico: ico("banca"), col: "#2f6fe0", lv: 0 },
  { k: "gazzetta", nome: "Gazzetta", ico: ico("gazzetta"), col: "#d9d2c0", lv: 0 },
  { k: "messaggi", nome: "Messaggi", ico: ico("messaggi"), col: "#3fa34d", lv: 0 },
  { k: "valigetta", nome: "Valigetta", ico: ico("valigetta"), col: "#8a5a2c", lv: 0 },
  { k: "palazzo", nome: "Palazzo", ico: ico("palazzo"), col: "#7a5cff", lv: 0 },
  { k: "lusso", nome: "Lusso", ico: ico("lusso"), col: "#14a3a8", lv: 0 },
  { k: "prove", nome: "Prove", ico: ico("prove"), col: "#3a3f4b", lv: 1 },
  { k: "borsa", nome: "Borsa", ico: ico("borsa"), col: "#0f766e", lv: 2 },
  { k: "contratti", nome: "Contratti", ico: ico("contratti"), col: "#b5179e", lv: 2 },
  { k: "rubrica", nome: "Rubrica", ico: ico("rubrica"), col: "#c2410c", lv: 0 },
  { k: "municipio", nome: "Municipio", ico: ico("municipio"), col: "#5c7f99", lv: 0 },
  { k: "sporchi", nome: "Soldi sporchi", ico: ico("maschera"), col: "#7a2c2c", lv: 1 },
  { k: "setta", nome: "Setta", ico: ico("setta"), col: "#3b1d5c", lv: 9 },
];
// ogni messaggio arriva da una persona: stessa persona = stessa conversazione
const MITTENTI = [
  [/^Vera:/, "Vera", ico("vera"), "#ff5fa2"],
  [/numero sconosciuto|Squilla il telefono|Lavoretto fatto|Riattacchi/i, "Numero sconosciuto", ico("sconosciuto"), "#555"],
  [/^Municipio:|ottieni il permesso/i, "Municipio", ico("municipio"), "#5c7f99"],
  [/busta passa di mano/i, "L'assessore", ico("handshake"), "#7a5c2c"],
  [/gruista|Porto Container/i, "Gruista del Porto", ico("porto"), "#c97a2c"],
  [/Mercato Nero|venditore/i, "Venditore del Mercato", ico("mercato"), "#8a5a2c"],
  [/Sentenza|Giudice|convocazione/i, "Tribunale della Laguna", ico("tribunale"), "#8d1f2c"],
  [/boss straniero/i, "Lo straniero", ico("maschera"), "#111"],
  [/foto|Prova/i, "Il fotografo", ico("macchina"), "#3a3f4b"],
  [/setta|Gran Maestro|invito segreto/i, "Messaggio senza firma", ico("setta"), "#3b1d5c"],
  [/Sindaco/i, "Comune della Laguna", ico("municipio"), "#5c7f99"],
  [/polizia|perquisisce|contatto corrotto|pentito|Si parla di te|auto della polizia|Gazzetta fa il tuo nome|tranquillo: nessuno/i, "Un amico fidato", ico("amico"), "#2f6fe0"],
  [/Banca|prestito|interessi/i, "Banca Centrale", ico("banca"), "#2f6fe0"],
];
function mittente(testo) {
  if (S) for (const p of S.players) if (p.id !== mioId && (testo.startsWith(p.nome + " ") || testo.includes(" da " + p.nome))) return [p.nome, esc(p.nome[0]), p.colore];
  for (const [re, nome, ico, col] of MITTENTI) if (re.test(testo)) return [nome, ico, col];
  return ["Notifiche", ico("notizie"), "#444"];
}
function conversazioni(me) {
  const conv = new Map();
  (me.messaggi || []).forEach((m, i) => { const [nome, ico, col] = mittente(m.testo); if (!conv.has(nome)) conv.set(nome, { nome, ico, col, msg: [] }); conv.get(nome).msg.push({ ...m, i, testo: m.testo.replace(/^Vera: /, "").replace(/^Municipio: /, "") }); });
  return [...conv.values()].sort((a, b) => b.msg[b.msg.length - 1].i - a.msg[a.msg.length - 1].i);
}
let chatAperta = null;
function lettiChat(nome) { try { return +(localStorage.getItem("laguna_chat_" + partita + "_" + nome) || 0); } catch (e) { return 0; } }
function segnaChat(nome, n) { try { localStorage.setItem("laguna_chat_" + partita + "_" + nome, String(n)); } catch (e) { } }
function letti() { try { return +(localStorage.getItem("laguna_letti_" + partita) || 0); } catch (e) { return 0; } }
function segnaLetti(n) { try { localStorage.setItem("laguna_letti_" + partita, String(n)); } catch (e) { } }
function appVisibile(me, a) {
  if (a.k === "setta") return S.sette.length > 0 || (S.inviti || []).length > 0 || me.sporchi >= L.N.settaSporchi;
  if (a.k === "sporchi") return S.sblocco >= 1 || me.sporchi > 0;
  return a.lv <= S.sblocco || (a.k === "prove" && (me.prove || []).length);
}
function apriApp(k) { telAperto = true; app = k; chatAperta = null; if (k === "messaggi") segnaLetti((io().messaggi || []).length); disegnaTelefono(io()); }
function disegnaTelefono(me) {
  const box = $("#telefonoBox");
  const nuovi = Math.max(0, (me.messaggi || []).length - letti());
  if (!telAperto) {
    box.innerHTML = `<button class="tel-tasto vetro" id="apriTel" aria-label="Apri il telefono">📱${nuovi ? `<span class="badge">${nuovi}</span>` : ""}</button>`;
    $("#apriTel").onclick = () => { telAperto = true; app = null; disegnaTelefono(me); };
    return;
  }
  const ora = S.fase === "notte" && S.notte ? L.ORE[S.notte.ora] : ["9:00", "13:00", "18:00"][S.giorno] || "9:00";
  let dentro;
  if (!app) {
    dentro = `<div class="home">${APPS.filter((a) => appVisibile(me, a)).map((a) => `<button class="app" data-app="${a.k}"><span class="ico" style="background:${a.col}">${a.ico}${a.k === "messaggi" && nuovi ? `<span class="badge">${nuovi}</span>` : ""}</span>${a.nome}</button>`).join("")}</div><button class="piccolo esci-partita" id="esciPartita">Esci dalla partita</button>`;
  } else {
    const A = APPS.find((a) => a.k === app);
    dentro = `<div class="app-testa"><button id="indietro">‹ Home</button><b>${A.ico} ${A.nome}</b></div><div class="app-corpo">${contenutoApp(me, app)}</div>`;
  }
  box.innerHTML = `<div class="tel"><div class="schermo"><div class="barra"><span>${ora}</span><button class="piccolo" id="chiudiTel2" aria-label="Chiudi il telefono" style="padding:3px 10px">✕ Chiudi</button></div>${dentro}</div><button class="tel-chiudi" id="chiudiTel" aria-label="Chiudi il telefono"></button></div>`;
  $("#chiudiTel").onclick = $("#chiudiTel2").onclick = () => { telAperto = false; disegnaTelefono(me); };
  box.querySelectorAll("[data-app]").forEach((b) => b.onclick = () => apriApp(b.dataset.app));
  if ($("#esciPartita")) $("#esciPartita").onclick = () => finestra(`<h2>Esci dalla partita?</h2><p>Torni alla schermata iniziale, dove puoi crearne una nuova. ${LOCALE ? "La partita di prova si cancella." : "Potrai rientrare solo se qualcuno ti manda di nuovo il codice."}</p><div class="pulsanti"><button id="no">Resto</button><button class="oro" id="si">Esco</button></div>`, (d, c) => { d.querySelector("#no").onclick = c; d.querySelector("#si").onclick = () => { c(); if (LOCALE) { try { localStorage.removeItem("laguna_locale"); } catch (e) { } } esciDallaPartita(); }; });
  if ($("#indietro")) $("#indietro").onclick = () => { app = null; chatAperta = null; disegnaTelefono(me); };
  collegaApp(me);
}
function tappe(l) {
  const passi = ["Terreno", "Permesso", "Cantiere", "Aperta"];
  const ora = l.cantiere ? 2 : l.permesso ? 2 : l.lvl > 0 ? 3 : 1;
  return `<div class="tappe">${passi.map((t, i) => `<span class="${i < ora ? "fatta" : i === ora ? "ora" : ""}">${t}${i === 3 && l.lvl > 0 ? " · liv. " + l.lvl : ""}</span>`).join("")}</div>`;
}
// cosa e' successo ai tuoi soldi dall'ultima volta che hai giocato
function riepilogoGiro() {
  // una riga sola: quanto hai incassato e quanto hai pagato mentre giocavano gli altri
  const fl = (S.flussi || []).filter((f) => f.n > segnoTurno && (f.da === mioId || f.a === mioId));
  if (!fl.length) return "";
  const entra = fl.filter((f) => f.a === mioId).reduce((a, f) => a + f.importo, 0), esce = fl.filter((f) => f.da === mioId).reduce((a, f) => a + f.importo, 0);
  const pezzi = [];
  if (entra) pezzi.push(`<span style="color:#7bd88f">+${euro(entra)}</span>`);
  if (esce) pezzi.push(`<span style="color:#ff9a9a">−${euro(esce)}</span>`);
  return `<div class="riepilogo-giro"><span class="kick" style="color:var(--muted)">Mentre aspettavi</span><div>${pezzi.join(" · ")} <span class="sub">(dettagli nell'app Banca)</span></div></div>`;
}
// un rivale sta per completare un gruppo di vie?
function rivalita() {
  const avvisi = [];
  const serie = [...new Set(S.lotti.filter((l) => l.serie && l.serie !== "Moli").map((l) => l.serie))];
  for (const se of serie) {
    const vie = S.lotti.filter((l) => l.serie === se);
    for (const p of S.players) {
      if (p.id === mioId) continue;
      const sue = vie.filter((l) => l.owner === p.id).length;
      if (sue === vie.length - 1) { const manca = vie.find((l) => l.owner !== p.id); avvisi.push(`${esc(p.nome)} ha ${sue} vie su ${vie.length} del gruppo ${esc(se)}: ${manca.owner === mioId ? "l'ultima è tua, puoi fargliela pagare cara" : manca.owner ? "l'ultima è di " + esc(nomeDi(manca.owner)) : "se compri " + esc(manca.nome) + " lo blocchi"}.`); }
    }
  }
  return avvisi.length ? `<div class="riepilogo-giro"><span class="kick" style="color:var(--rosa)">Rivali</span>${avvisi.slice(0, 1).map((a) => `<div>${a}</div>`).join("")}</div>` : "";
}
function agenziaDisponibile(me) {
  if (me.agenziaUsata || me.faro) return false;
  const c = casellaDi(me), isola = (c && c.isola) || L.isolaDiPos(me.pos);
  return S.lotti.some((l) => l.owner == null && l.isola === isola && (l.tipoCasella === "lotto" || l.tipoCasella === "molo") && me.cash >= L.prezzoAgenzia(S, me, l));
}
function miTurnoApp() { const me = io(); return S.fase === "giorno" && mioTurno() && !S.pending && me.haTirato && !me.faro; }
function contenutoApp(me, k) {
  const miTurno = mioTurno() && !S.pending && me.haTirato && !me.faro;
  if (k === "impero") return impero(me);
  if (k === "imprese") {
    const miei = S.lotti.filter((l) => l.owner === mioId);
    if (!miei.length) return `<p class="sub">Non hai ancora terreni. Quando atterri su un lotto libero puoi comprarlo.</p>`;
    return `<p class="sub">Ogni impresa nasce in 4 passi: terreno, permesso del Municipio, cantiere (apre all'Alba), apertura.</p>` + miei.map((l) => {
      const next = l.lvl + 1, costo = next <= 5 ? Math.round(L.N.costLvl[next] * l.prezzo * (me.pacchetto === "costruttore" ? 0.85 : 1)) : 0;
      let azioni = "";
      if (l.tipoCasella === "lotto" && l.lvl < 5 && !l.cantiere && miTurno) {
        if (l.negato) azioni = `<button class="piccolo" data-regalo="${l.id}">Una busta all'assessore (${euro(Math.max(50000, Math.round(l.prezzo * 0.1)))})</button>`;
        else if (!l.permesso) azioni = `<button class="piccolo oro" data-permesso="${l.id}">Chiedi il permesso al Municipio</button>`;
        else if (!me.azioneGiornoFatta) {
          const ok = next < 3 || L.haSerie(S, me, l.serie);
          azioni = !ok ? `<span class="sub">Per il livello ${next} serve avere tutte le vie del gruppo «${esc(l.serie)}».</span>` : `${l.lvl === 0 ? `<select id="t_${l.id}">${Object.entries(L.ATTIVITA).filter(([kk, t]) => (!t.isole || t.isole.includes(l.isola)) && !t.serie).map(([kk, t]) => `<option value="${kk}">${esc(t.nome)}</option>`).join("")}</select>` : ""}<button class="piccolo oro" data-cantiere="${l.id}" ${me.cash < costo ? "disabled" : ""}>Apri il cantiere · ${euro(costo)}</button>`;
        }
      }
      return `<div class="scheda"><h4>${esc(l.nome)} <span class="tag" style="background:${COL_SERIE[l.serie] || "#555"}">gruppo ${esc(l.serie || "")}</span></h4>
        <span class="sub">${l.cantiere ? "🚧 Cantiere: " + esc(L.ATTIVITA[l.cantiere.tipo].nome) + " livello " + l.cantiere.lvl + ", apre all'Alba." : l.tipo ? esc(L.ATTIVITA[l.tipo].nome) + " · rende " + euro(L.rendita(S, l)) + " a Ciclo" : "Terreno vuoto"}</span>
        ${l.tipoCasella === "lotto" ? tappe(l) : ""}${azioni ? `<div class="riga">${azioni}</div>` : ""}</div>`;
    }).join("");
  }
  if (k === "banca") {
    const altri = S.players.filter((x) => x.id !== mioId);
    const mov = (S.flussi || []).filter((f) => f.da === mioId || f.a === mioId).slice(-8).reverse();
    return `${mov.length ? `<div class="scheda"><h4>Ultimi movimenti</h4>${mov.map((f) => `<div style="font-size:13px;display:flex;justify-content:space-between;gap:8px"><span>${esc(f.motivo)} <span class="sub">${f.a === mioId ? "da " + esc(nomeDi(f.da)) : "a " + esc(nomeDi(f.a))}</span></span><b style="color:${f.a === mioId ? "#7bd88f" : "#ff9a9a"}">${f.a === mioId ? "+" : "−"}${euro(f.importo)}</b></div>`).join("")}</div>` : ""}<div class="scheda"><span class="kick" style="color:var(--muted)">Conto</span><span class="serif" style="font-size:28px;color:var(--pulito)">${euro(me.cash)}</span>${me.sporchi ? `<span style="color:var(--sporco)">In contanti sporchi: ${euro(me.sporchi)}</span>` : ""}</div>
      <div class="scheda"><h4>Debito: ${euro(me.debito)}</h4>${me.debito ? `<button class="piccolo" data-a2="restituisci">Restituisci tutto</button>` : ""}${miTurno && !me.azioneGiornoFatta ? `<button class="piccolo" data-a2="prestito">Chiedi un prestito</button>` : `<span class="sub">I prestiti si chiedono durante il tuo turno.</span>`}</div>
      <div class="scheda"><h4>Fai un regalo</h4><div class="riga"><select id="regA">${altri.map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("")}</select><input id="regImp" type="number" placeholder="quanto" style="width:110px"></div>${S.sblocco >= 1 ? `<label class="check"><input type="checkbox" id="regSp"> in contanti sporchi</label>` : ""}<button class="piccolo" data-a2="regala">Dai</button></div>
      ${S.sblocco >= 2 ? `<div class="scheda"><h4>Tasse</h4><span class="sub">Puoi nascondere una parte delle rendite al fisco. Non paghi le tasse su quella parte: diventa contante in nero, che di notte spendi subito (Mercato Nero, occasioni, "regali") senza ripulirlo. Ma lascia Tracce, e la Finanza guarda i più ricchi.</span><select id="evasione">${[0, 0.1, 0.2, 0.3].map((q) => `<option value="${q}" ${Math.abs(q - (me.evasione || 0)) < 0.01 ? "selected" : ""}>${q ? "Nascondi il " + q * 100 + "%" : "Pago tutto"}</option>`).join("")}</select></div>` : ""}`;
  }
  if (k === "gazzetta") return [...S.gazzetta].reverse().slice(0, 30).map((g) => `<div class="scheda"><span><span class="tag ${g.tipo}">Ciclo ${g.ciclo}</span></span><span class="serif" style="font-size:16px">${esc(g.testo)}</span></div>`).join("");
  if (k === "messaggi") {
    const cv = conversazioni(me);
    if (!cv.length) return `<p class="sub">Nessun messaggio.</p>`;
    const c = chatAperta && cv.find((x) => x.nome === chatAperta);
    if (c) {
      segnaChat(c.nome, c.msg.length);
      return `<div class="chat-testa"><button class="piccolo" id="tornaChat">‹</button><span class="avatar" style="background:${c.col}">${c.ico}</span><b>${esc(c.nome)}</b></div>
        <div class="chat">${c.msg.map((m) => `<div class="bolla">${esc(m.testo)}<span>Ciclo ${m.ciclo}</span></div>`).join("")}</div>`;
    }
    return cv.map((c) => { const ult = c.msg[c.msg.length - 1]; const nuovi = c.msg.length - lettiChat(c.nome);
      return `<button class="conv" data-chat="${esc(c.nome)}"><span class="avatar" style="background:${c.col}">${c.ico}</span><span class="cv-t"><b>${esc(c.nome)}</b><span>${esc(ult.testo.slice(0, 70))}${ult.testo.length > 70 ? "…" : ""}</span></span>${nuovi > 0 ? `<span class="pallino">${nuovi}</span>` : ""}</button>`; }).join("");
  }
  if (k === "valigetta") {
    const v = me.valigetta || [], posti = S.postiValigetta;
    return `<p class="sub">${v.length} posti usati su ${posti}. Gli oggetti si comprano di notte, nei posti giusti.</p>` +
      v.map((o) => { const O = L.OGGETTI[o.id]; return `<div class="ogg"><span class="ic">${ICO_OGG[o.id]}</span><div><b>${esc(O.nome)}</b><div class="sub" style="font-size:12px">${esc(O.descr)}${o.notti ? " Ancora " + o.notti + (o.notti === 1 ? " notte." : " notti.") : ""}</div></div></div>`; }).join("") +
      Array.from({ length: Math.max(0, posti - v.length) }, () => `<div class="ogg vuoto"><span class="ic">·</span><span class="sub">Posto libero</span></div>`).join("");
  }
  if (k === "palazzo") return appPalazzo(me, miTurno);
  if (k === "lusso") return `<div class="scheda"><h4>I tuoi mezzi</h4><span class="sub">${me.veicoli.map((x) => L.N.veicoli[x].nome).join(", ") || "Nessuno, per ora."}</span></div>${miTurno && !me.azioneGiornoFatta ? `<button class="oro" data-a2="veicolo">Vai in concessionaria</button>` : `<span class="sub">I mezzi si comprano con la mossa del giorno.</span>`}<span class="sub">Un motoscafo o un elicottero ti fanno muovere di notte in 1 ora ovunque.</span>`;
  if (k === "prove") return (me.prove || []).map((pr, i) => `<div class="scheda"><h4>📷 ${esc(S.players.find((x) => x.id === pr.su).nome)}</h4><span class="sub">${esc(pr.cosa)} · Ciclo ${pr.ciclo}</span><button class="piccolo" data-denuncia="${i}">Manda alla polizia</button></div>`).join("") || `<p class="sub">Nessuna prova. Una macchina fotografica aiuta.</p>`;
  if (k === "borsa") return L.AZIENDE.map((a) => `<div class="scheda"><h4>${a} <span class="sub">${S.borsa[a].toFixed(1)}</span></h4><span class="sub">Ne hai per ${euro((me.azioni[a] || 0) * S.borsa[a])}</span><div class="riga"><input type="number" placeholder="quanto" data-imp="b_${a}" style="width:100px"><button class="piccolo" data-compra="borsa|${a}">Compra</button><button class="piccolo" data-vendi="borsa|${a}">Vendi</button></div></div>`).join("") +
    `<p class="sub">Le cripto si comprano con soldi puliti e cambiano prezzo una volta per Ciclo, all'Alba. In media salgono, ma ogni tanto crollano del 70% in una notte.</p>` +
    L.MONETE.map((m) => `<div class="scheda"><h4>${m} <span class="sub">${S.cripto[m].toFixed(2)}</span></h4><span class="sub" style="display:block;margin-bottom:4px">${{ LagunaCoin: "La più tranquilla: si muove poco e crolla di rado.", FlamingoToken: "La più pazza: può raddoppiare o dimezzarsi in un Ciclo.", ShadowCoin: "Media. Serve anche per ripulire i soldi sporchi. Il Sindaco può bloccarla." }[m] || ""}</span><span class="sub">Ne hai per ${euro((me.cripto[m] || 0) * S.cripto[m])}</span><div class="riga"><input type="number" placeholder="quanto" data-imp="c_${m}" style="width:100px"><button class="piccolo" data-compra="cripto|${m}">Compra</button><button class="piccolo" data-vendi="cripto|${m}">Vendi</button></div></div>`).join("");
  if (k === "contratti") {
    const miei = S.contratti.filter((x) => x.da === mioId || x.a === mioId);
    return miei.map((x) => `<div class="scheda"><span><span class="tag">${x.tipo === "notarile" ? "Dal notaio" : "Sulla parola"}</span><span class="tag">${esc(x.stato)}</span></span><span>${esc(S.players.find((y) => y.id === x.da).nome)} ↔ ${esc(S.players.find((y) => y.id === x.a).nome)}: subito ${euro(x.pagoOra)}, poi ${euro(x.pagoDopo)}</span>${x.testo ? `<i class="sub">"${esc(x.testo)}"</i>` : ""}${x.a === mioId && x.stato === "proposto" ? `<div class="riga"><button class="piccolo oro" data-contr="${x.id}|1">Accetta</button><button class="piccolo" data-contr="${x.id}|0">Rifiuta</button></div>` : ""}</div>`).join("") + `<button class="oro" data-a2="nuovoContratto">Proponi un patto</button>`;
  }
  if (k === "agenzia") {
    const c = casellaDi(me), isola = (c && c.isola) || L.isolaDiPos(me.pos);
    const liberi = S.lotti.filter((l) => l.owner == null && l.isola === isola && (l.tipoCasella === "lotto" || l.tipoCasella === "molo"));
    const testa = `<div class="scheda"><h4>Agenzia di ${esc(L.NOMI_ISOLE[isola])}</h4><span class="sub">Una volta per turno puoi comprare un terreno libero dell'isola dove sei, anche se non ti sei fermato sopra. ${me.agenziaSconto ? "<b style='color:var(--pulito)'>Sei passato da un'Agenzia: oggi paghi il prezzo pieno, senza sovrapprezzo.</b>" : "Costa il 20% in più del prezzo. Se ti fermi su una casella Agenzia, niente sovrapprezzo."}</span></div>`;
    if (!mioTurno() || S.fase !== "giorno") return testa + `<p class="sub">L'Agenzia lavora di giorno, nel tuo turno.</p>`;
    if (!me.haTirato) return testa + `<p class="sub">Prima tira i dadi: l'Agenzia vende sull'isola dove arrivi.</p>`;
    if (me.agenziaUsata) return testa + `<p class="sub">In questo turno hai già comprato all'Agenzia.</p>`;
    if (!liberi.length) return testa + `<p class="sub">A ${esc(L.NOMI_ISOLE[isola])} non ci sono più terreni liberi.</p>`;
    return testa + liberi.map((l) => { const costo = L.prezzoAgenzia(S, me, l); return `<div class="scheda"><h4><span style="color:${COL_SERIE[l.serie] || "#aaa"}">■</span> ${esc(l.nome)}</h4><span class="sub">${l.tipoCasella === "molo" ? "Molo: chi ci passa ti paga il pedaggio." : "Gruppo " + esc(l.serie) + " · prezzo " + euro(l.prezzo)}</span><button class="piccolo oro" data-agenzia="${l.id}" ${me.cash < costo ? "disabled" : ""}>Compra a ${euro(costo)}</button></div>`; }).join("");
  }
  if (k === "municipio") {
    return `<div class="scheda"><h4>Sindaco: ${S.sindaco ? esc(S.players.find((x) => x.id === S.sindaco).nome) : "nessuno"}</h4><span class="sub">Tasse al ${Math.round(S.tassa * 100)}%. Le elezioni sono ogni 2 Cicli: per candidarti serve fama 40, passando dal Municipio.</span></div>
      ${S.candidati[mioId] !== undefined ? `<div class="scheda"><h4>Sei candidato</h4><div class="riga"><input id="campImp" type="number" placeholder="quanto" style="width:110px"><button class="piccolo" data-a2="campagna">Investi in campagna</button></div></div>` : ""}
      ${S.sindaco === mioId ? `<div class="scheda"><h4>Sei il Sindaco</h4><div class="riga"><select id="leggeSel">${Object.entries(L.LEGGI).map(([kk, x]) => `<option value="${kk}">${esc(x.nome)}</option>`).join("")}</select><select id="leggeIsola">${L.ISOLE.map((i) => `<option value="${i}">${L.NOMI_ISOLE[i]}</option>`).join("")}</select><button class="piccolo" data-a2="legge">Firma</button></div><div class="riga">Tasse <select id="tasseSel">${[0.1, 0.15, 0.2, 0.25, 0.3].map((q) => `<option value="${q}" ${Math.abs(q - S.tassa) < 0.01 ? "selected" : ""}>${q * 100}%</option>`).join("")}</select><button class="piccolo" data-a2="tasse">Cambia</button></div></div>` : ""}
      <div class="scheda"><h4>La licenza del casinò</h4>${S.licenze.includes(mioId) ? `<span class="sub">Ce l'hai. Ora puoi aprire un casinò su un tuo terreno di Baia Flamingo o Isola Corona, e il Casinò privato nel tuo Palazzo.</span>`
        : `<span class="sub">Serve per aprire un casinò. Costa 500.000 € se approvata. Il Municipio può approvare, rimandare o negare: più fama hai, più è facile. Se ti fermi sulla casella del Municipio, allo sportello la ottieni sicura a 400.000 €.</span>
        ${me.licenzaNegata && miTurnoApp() ? `<button class="piccolo" data-a2="bustaLicenza">Una busta all'assessore (650.000 €, lascia tracce)</button>` : ""}
        ${miTurnoApp() ? `<button class="piccolo oro" data-a2="licenza">Chiedi la licenza</button>` : `<span class="sub">Si chiede nel tuo turno, dopo aver tirato i dadi.</span>`}`}</div>`;
  }
  if (k === "rubrica") return rubrica(me);
  if (k === "sporchi") {
    const cop = L.copertura(S, me), sp = me.sporchi || 0;
    return `<div class="scheda"><h4 style="color:var(--sporco)">Hai ${euro(sp)} sporchi</h4><span class="sub">Sono contanti che non puoi mostrare. Di giorno non comprano quasi niente: case, piani e azioni vogliono soldi puliti.</span></div>
      ${laTuaRete(me)}<div class="scheda"><h4 style="color:var(--oro)">Attento: a fine partita valgono poco</h4><span class="sub">Nella classifica finale ogni euro sporco conta solo ${Math.round(L.N.valoreSporchi * 100)} centesimi. Ripuliscili prima della fine.</span></div>
      <div class="scheda"><h4>Da dove arrivano</h4><span class="sub">Gli affari della notte (container, orologi, carichi dal mare, il colpo alla villa…), le vincite alla Bisca e le tasse che non paghi.</span></div>
      <div class="scheda"><h4>Come spenderli così</h4><span class="sub">Di notte: oggetti del Mercato Nero, occasioni, sfide a carte, ingresso alle serate. Per corrompere costano il 20% in meno.</span></div>
      <div class="scheda"><h4>Come ripulirli (di notte)</h4>
        <div class="liv"><span class="liv-n">1</span><div><b>Attività di copertura</b> · al Casinò Reale<div class="sub" style="font-size:12px">Perdi il 15%. Poche tracce. Ne puoi ripulire al massimo ${euro(cop)} a Ciclo con le tue lavanderie, gallerie e magazzini.</div></div></div>
        <div class="liv"><span class="liv-n">2</span><div><b>ShadowCoin</b> · al Casinò Reale<div class="sub" style="font-size:12px">Perdi il 25%. Più tracce. Il Sindaco la può bloccare.</div></div></div>
        <div class="liv"><span class="liv-n">3</span><div><b>Paradiso fiscale</b> · dal tuo Palazzo, serve il jet<div class="sub" style="font-size:12px">Perdi il 30%. Una volta per Ciclo.</div></div></div></div>
      <div class="scheda"><h4>${ico("siren")} Come ti scoprono</h4>
        <span class="sub">Ogni affare sporco lascia <b>Tracce</b>. A ogni Alba la polizia tira i dadi: più Tracce hai, più è facile che tu salga di un gradino. Agenti e commissario corrotti, e la setta, abbassano il rischio. Un Ciclo senza affari sporchi può farti scendere.</span>
        ${["Tranquillo: nessuno parla di te.", "Voci: si parla di te.", "Osservato: la polizia ti tiene d'occhio.", "Indagato: la Gazzetta fa il tuo nome.", "Processo: il Giudice ti condanna per il reato più grave che hai fatto."].map((x, i) => `<div class="liv"><span class="liv-n" style="${(me.stato || 0) === i ? "background:var(--oro);color:#111" : ""}">${i}</span><div class="sub" style="font-size:12px">${x}${(me.stato || 0) === i ? " <b>← tu sei qui</b>" : ""}</div></div>`).join("")}
        <span class="sub" style="margin-top:6px">Le pene:</span>
        ${["lieve", "media", "grave", "gravissima"].map((g) => `<div class="sub" style="font-size:12px">· <b>${NOMI_GRAVITA[g]}</b>: ${esc(testoPena(g))}</div>`).join("")}</div>
      <div class="scheda"><h4 style="color:var(--setta)">La setta</h4><span class="sub">${sp >= L.N.settaSporchi ? "Hai abbastanza soldi sporchi: puoi fondare una setta, di notte, dall'app Setta." : "Si apre quando hai " + euro(L.N.settaSporchi) + " sporchi. Fondarla costa " + euro(L.N.settaCosto) + " (di cui " + euro(L.N.settaTesoroIniziale) + " diventano il tesoro)."}</span></div>`;
  }
  if (k === "setta") {
    return (S.inviti || []).map((x) => `<div class="scheda"><h4>Un invito senza firma</h4><div class="riga"><button class="piccolo oro" data-invito="${x.setta}|1">Entro</button><button class="piccolo" data-invito="${x.setta}|0">Rifiuto</button></div></div>`).join("") +
      (S.sette.length ? S.sette.map((st) => `<div class="scheda"><h4 style="color:var(--setta)">${esc(st.nome)}</h4><i class="sub">${esc(st.motto)}</i><span class="sub">Livello ${L.livelloSetta(S, st)} · membri: ${st.membri.map((id) => esc(S.players.find((x) => x.id === id).nome)).join(", ")} · tesoro ${euro(st.tesoro)}</span>
        <div class="riga"><input type="number" placeholder="versa" id="versa_${st.id}" style="width:100px"><button class="piccolo" data-versa="${st.id}|0">Puliti</button><button class="piccolo" data-versa="${st.id}|1">Sporchi</button></div>
        ${st.gm === mioId ? `<div class="riga"><select id="inv_${st.id}">${S.players.filter((x) => !st.membri.includes(x.id)).map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("")}</select><button class="piccolo" data-invita="${st.id}">Invita</button></div><span class="sub">Le operazioni si decidono di notte, al Faro.</span>` : ""}</div>`).join("")
        : S.fase === "notte" ? `<div class="scheda"><h4>Fonda una setta</h4><span class="sub">Il patto costa ${euro(L.N.settaCosto)} in soldi sporchi: ${euro(L.N.settaTesoroIniziale)} diventano il tesoro della setta, il resto se ne va nel rito.</span><span class="sub" style="display:block;margin-top:6px"><b>Cosa ti dà:</b><br>· i tuoi affari sporchi lasciano il 30% di Tracce in meno<br>· gli avvocati della setta: ogni condanna scende di un gradino<br>· il Faro sempre aperto, con occasioni enormi solo per i membri<br>· al Gran Maestro, ogni Ciclo, il 5% del tesoro in contanti sporchi</span><input id="sNome" placeholder="Nome"><input id="sMotto" placeholder="Motto"><button class="piccolo oro" data-a2="fonda">Fonda</button></div>` : `<p class="sub">Le sette si fondano di notte.</p>`);
  }
  return "";
}
const LIVELLI = [
  ["Terreno", "Un lotto vuoto. Chi ci passa paga un piccolo pedaggio."],
  ["Livello 1 · Apertura", "L'attività apre: inizia a rendere ogni Ciclo e l'affitto sale."],
  ["Livello 2 · Crescita", "Rende circa il doppio. Si può fare su qualsiasi lotto."],
  ["Livello 3 · Successo", "Serve avere tutte le vie del suo gruppo (stesso colore). Affitti molto più alti."],
  ["Livello 4 · Lusso", "Una delle attività più ricche dell'isola."],
  ["Livello 5 · Icona", "Serve fama 50. Il simbolo dell'isola: affitti da capogiro."],
];
// Chi conta nella Laguna: dove trovarli, quando, cosa fanno per te
const PERSONAGGI = [
  { id: "vera", nome: "Vera", ruolo: "La tua consigliera", ico: "vera", col: "#ff5fa2", dove: null, quando: "sempre", lv: 0,
    fa: "Ti avvisa quando sali di livello, quando c'è un'occasione e quando rischi troppo.", costo: "Gratis", come: "Ti scrive lei: la trovi nell'app Messaggi." },
  { id: "agente", nome: "L'agente di quartiere", ruolo: "Polizia di un'isola", ico: "siren", col: "#2f6fe0", dove: "club", quando: "notte", lv: 1,
    fa: "Chiude un occhio sui tuoi affari in un'isola: meno guai con le pattuglie.", costo: "250.000 €, poi 125.000 € a Ciclo", come: "Di notte al Club Neon: scegli \"Parla con un agente fuori servizio\"." },
  { id: "vargas", nome: "Il Commissario Vargas", ruolo: "Capo della polizia", ico: "siren", col: "#1e3a8a", dove: "club", quando: "notte", lv: 1,
    fa: "Rallenta le indagini su di te in tutta la Laguna.", costo: "1.000.000 €, poi 500.000 € a Ciclo", come: "Di notte al Club Neon: scegli \"Parla con un agente fuori servizio\" e poi il Commissario Vargas." },
  { id: "lenz", nome: "Il banchiere Lenz", ruolo: "Banchiere privato", ico: "banca", col: "#0f766e", dove: "casino", quando: "notte", lv: 1,
    fa: "Fa sparire i soldi dai registri: i controlli sui tuoi conti trovano meno.", costo: "750.000 €, poi 375.000 € a Ciclo", come: "Di notte al Casinò Reale: scegli \"Un drink con il banchiere Lenz\"." },
  { id: "cassiere", nome: "Il cassiere del Casinò", ruolo: "Cambia le fiches", ico: "ricicla", col: "#7a2c2c", dove: "casino", quando: "notte", lv: 1,
    fa: "Ripulisce i tuoi soldi sporchi: ne trattiene una parte.", costo: "Dal 15% al 25% di quello che ripulisci", come: "Di notte al Casinò Reale: scegli \"Ripulisci i soldi sporchi\"." },
  { id: "venditore", nome: "Il venditore del Mercato", ruolo: "Mercato Nero", ico: "mercato", col: "#8a5a2c", dove: "mercato", quando: "notte", lv: 1,
    fa: "Vende gli oggetti per la valigetta (maschere, telefoni usa-e-getta, avvocato…) e le soffiate sulla polizia.", costo: "Da 50.000 €", come: "Di notte al Mercato Nero: tocca la bancarella." },
  { id: "gruista", nome: "Il gruista", ruolo: "Porto Container", ico: "porto", col: "#c97a2c", dove: "porto", quando: "notte", lv: 1,
    fa: "Sa quali container arrivano senza bolla: ti passa gli affari del Porto.", costo: "Gratis (vuole solo una parte)", come: "Di notte al Porto Container: scegli \"Parla con i gruisti\"." },
  { id: "doganiere", nome: "Il doganiere", ruolo: "Capo della dogana", ico: "aereo", col: "#0e7490", dove: "aeroporto", quando: "notte", lv: 2,
    fa: "Chiude un occhio sui tuoi carichi all'Aeroporto: rischiano la metà.", costo: "500.000 €, poi 250.000 € a Ciclo", come: "Di notte all'Aeroporto della Laguna: scegli \"Una busta al doganiere\"." },
  { id: "caporedattore", nome: "Il caporedattore", ruolo: "Gazzetta della Laguna", ico: "gazzetta", col: "#6b5d3f", dove: "redazione", quando: "notte", lv: 2,
    fa: "Pubblica un articolo che ti fa salire la fama, o che rovina un rivale.", costo: "Quanto metti nella busta", come: "Di notte alla Redazione: scegli \"Una busta al caporedattore\"." },
  { id: "sindaco", nome: "Il Sindaco", ruolo: "Municipio", ico: "municipio", col: "#5c7f99", dove: "municipio", quando: "giorno", lv: 0,
    fa: "Dà permessi e licenze, fa le leggi e decide le tasse. Puoi diventarlo tu.", costo: "Candidatura 750.000 € (serve fama 40)", come: "Di giorno: fermati sulla casella Il Municipio (Isola Corona) o usa l'app Municipio." },
  { id: "giudice", nome: "Il Giudice", ruolo: "Tribunale", ico: "tribunale", col: "#8d1f2c", dove: null, quando: "alba", lv: 3,
    fa: "All'Alba decide le condanne di chi arriva al Processo.", costo: "Non si compra da soli: solo una setta di livello 2 (3,5 milioni dal Tesoro)", come: "Lo incontri solo se ti processano. La tua setta può reclutarlo dall'app Setta." },
  { id: "boss", nome: "Il boss straniero", ruolo: "Arriva col megayacht nero", ico: "sconosciuto", col: "#222", dove: "porto", quando: "raro", lv: 1,
    fa: "Una notte il tuo carico al Porto vale il doppio. Ma lascia il doppio delle Tracce.", costo: "Niente: è lui a cercare te", come: "Appare ogni tanto: ti scrive un messaggio. Quella notte vai al Porto." },
];
function volto(pg, grande) { return `<span class="volto ${grande ? "grande" : ""}" style="background:${pg.col}" title="${esc(pg.nome)}">${ico(pg.ico)}</span>`; }
function laTuaRete(me) {
  const ks = Object.keys(me.corrotti || {});
  const DOVE = (k) => k.startsWith("agente_") ? "ti copre solo a " + L.NOMI_ISOLE[k.slice(7)] + " (rischio −40%)" : k === "commissario" ? "ti copre un po' ovunque (rischio −20%)" : k === "doganiere" ? "ti copre solo all'Aeroporto (rischio −50%)" : k === "banchiere" ? "i controlli sui tuoi conti trovano meno" : "";
  return `<div class="scheda"><h4>La tua rete</h4>${ks.length ? ks.map((k) => { const c = me.corrotti[k], r = Math.round(L.rischioContatto(S, { ...me, tracce: 0 }, k) * 100);
    return `<div style="margin-top:8px"><b>${esc(L.nomeContatto(k).replace(/^./, (x) => x.toUpperCase()))}</b><div class="sub">${DOVE(k)}.</div>${c.sospetto ? `<div class="sub" style="color:#ff8a8a;font-weight:700">Gli Affari Interni indagano su di lui: all'Alba può fare il tuo nome.</div>` : `<div class="sub">Rischio che gli Affari Interni lo scoprano: almeno ${r}% a Ciclo (sale più lo usi e più Tracce hai).</div>`}<button class="piccolo" data-scarica="${k}" style="margin-top:4px">Scaricalo</button></div>`; }).join("") : `<span class="sub">Nessun contatto comprato. Agenti e Vargas al Club Neon, Lenz al Casinò, il doganiere all'Aeroporto: guarda la Rubrica.</span>`}
    <div class="sub" style="margin-top:8px">Gli oggetti ti salvano quasi sempre, non sempre: circa 1 volta su 7 qualcosa va storto.</div></div>`;
}
function rubrica(me) {
  const notte = S.fase === "notte", dove = notte ? S.notte.dove[mioId] : null;
  const QUANDO = { notte: "di notte", giorno: "di giorno", alba: "all'Alba", sempre: "sempre", raro: "ogni tanto, di notte" };
  const sindaco = S.sindaco ? (S.players.find((p) => p.id === S.sindaco) || {}).nome : "Albertini";
  return `<p class="sub" style="margin-bottom:8px">Chi conta nella Laguna. Tocca \"Vai da lui\" per raggiungerlo di notte.</p>` + PERSONAGGI.map((pg) => {
    const luogo = pg.dove && L.LUOGHI[pg.dove] ? pg.dove : null;
    const nomeDove = pg.dove === "municipio" ? "Il Municipio, Isola Corona" : luogo ? L.LUOGHI[luogo].nome + " · " + L.NOMI_ISOLE[L.LUOGHI[luogo].isola] : pg.id === "giudice" ? "Tribunale" : "Ti scrive lei";
    const bloccato = pg.lv > S.sblocco && !(luogo && L.luogoAperto(S, luogo, me));
    let azione = "";
    if (bloccato) azione = `<span class="sub" style="color:var(--oro)">Lo incontri dal Livello ${pg.lv}.</span>`;
    else if (notte && luogo && dove === luogo && !S.notte.viaggio[mioId]) azione = `<span class="sub" style="color:#7ee2a8">È qui con te: guarda le scelte della scena.</span>`;
    else if (notte && luogo) azione = `<button class="piccolo notte" data-vai="${luogo}">Vai da lui</button>`;
    else if (luogo) azione = `<span class="sub">Lo trovi ${QUANDO[pg.quando]}.</span>`;
    return `<div class="scheda pg">${volto(pg, true)}<div style="flex:1"><h4>${esc(pg.id === "sindaco" ? "Il Sindaco " + sindaco : pg.nome)}</h4><span class="sub">${esc(pg.ruolo)}</span>
      <div class="sub" style="margin-top:4px">${ico("mappa")} ${esc(nomeDove)} · ${QUANDO[pg.quando]}</div>
      <div style="margin-top:4px;font-size:13px">${esc(pg.fa)}</div>
      <div class="sub" style="margin-top:2px">Costo: ${esc(pg.costo)}</div>
      <div class="sub" style="margin-top:2px">${esc(pg.come)}</div>
      <div style="margin-top:6px">${azione}</div></div></div>`;
  }).join("");
}
const SBLOCCHI = [
  ["Livello 0 · si parte", "Dadi, terreni, permessi e cantieri. Di notte: il tuo Palazzo, il Club Neon e la Marina. Valigetta da 2 posti."],
  ["Livello 1 · patrimonio 3,5 milioni", "Mercato Nero, Bisca, Porto e Casinò Reale. Soldi sporchi e app Soldi sporchi, occasioni illegali, Prove. Valigetta da 4 posti."],
  ["Livello 2 · patrimonio 7 milioni", "Borsa, Cripto, Contratti, evasione delle tasse. Di notte anche la Redazione."],
  ["Livello 3 · patrimonio 15 milioni", "La Villa sulla scogliera e il Faro. Valigetta da 6 posti. (La setta si apre a parte: servono 8 milioni sporchi.)"],
];
const PAROLE = [
  ["Ciclo", "Un giro completo: 4 giorni di dadi, una notte, un'Alba. La partita dura 6, 8 o 10 Cicli (si sceglie quando la crei)."],
  ["Gruppo di vie", "Ogni isola ha 2 gruppi di vie dello stesso colore (es. «Acciaio» a Distretto Sole). Averle tutte raddoppia gli affitti e ti fa costruire più in alto."],
  ["Permesso e cantiere", "Per costruire chiedi il permesso al Municipio, poi apri il cantiere: l'attività apre all'Alba."],
  ["Fama", "Quanto sei famoso. Serve per alcune cose (Sindaco, livello 5, sette)."],
  ["Soldi sporchi", "Contanti in nero: li spendi di notte. Per usarli di giorno vanno ripuliti."],
  ["Tracce", "Quanto la polizia sa di te. Non le vedi: vedi solo i segnali sotto i tuoi soldi."],
  ["Valigetta", "Gli oggetti comprati di notte. Ti salvano quando qualcosa va storto."],
  ["Prove", "Foto o confidenze su un rivale: puoi denunciarlo o ricattarlo."],
  ["Il Faro", "La prigione: se ci finisci stai fermo qualche turno."],
];
function impero(me) {
  const miei = S.lotti.filter((l) => l.owner === mioId);
  const rend = miei.reduce((a, l) => a + L.rendita(S, l), 0);
  const fasi = ["Nessuno parla di te", "Voci", "Osservato", "Indagato", "Processo"];
  const cl = [...S.players].sort((a, b) => (b.id === mioId ? L.patrimonio(S, me, false) : 0) - 0);
  return `<div class="scheda"><span class="kick" style="color:var(--muted)">Il tuo patrimonio</span><span class="serif" style="font-size:28px;color:var(--oro)">${euro(L.patrimonio(S, me, false))}</span><span class="sub">${esc(L.fascia(S, me))} · fama ${Math.round(me.fama)} · ${fasi[me.stato || 0]}</span></div>
    <div class="cifre"><div><b>${miei.length}</b><span>proprietà</span></div><div><b>${miei.filter((l) => l.lvl > 0).length}</b><span>attività aperte</span></div><div><b>${me.piani}</b><span>piani del Palazzo</span></div><div><b>${euro(rend)}</b><span>rendita a Ciclo</span></div></div>
    <div class="scheda"><h4>${ico("imprese")} I livelli di un'attività</h4>${LIVELLI.map(([t, d], i) => `<div class="liv"><span class="liv-n">${i === 0 ? ico("palma") : i}</span><div><b>${t}</b><div class="sub" style="font-size:12px">${d}</div></div></div>`).join("")}
      <span class="sub" style="font-size:12px">Ogni passo richiede il permesso del Municipio e un cantiere, che apre all'Alba.</span></div>
    <div class="scheda"><h4>${ico("notizie")} Le parole del gioco</h4>${PAROLE.map(([t, d]) => `<div class="liv"><div><b>${t}</b><div class="sub" style="font-size:12px">${d}</div></div></div>`).join("")}</div>
    <div class="scheda"><h4>${ico("chiave")} Cosa si apre, e quando</h4>${SBLOCCHI.map(([t, d], i) => `<div class="liv ${S.sblocco >= i ? "" : "chiuso"}"><span class="liv-n">${S.sblocco >= i ? "✓" : i + 1}</span><div><b>${t}</b><div class="sub" style="font-size:12px">${d}</div></div></div>`).join("")}</div>`;
}
function collegaApp(me) {
  const box = $("#telefonoBox");
  const on = (sel, f) => box.querySelectorAll(sel).forEach((b) => b.onclick = () => f(b));
  const v = (q) => box.querySelector(q)?.value;
  on("[data-chat]", (b) => { chatAperta = b.dataset.chat; disegnaTelefono(me); });
  on("#tornaChat", () => { chatAperta = null; disegnaTelefono(me); });
  const ch = box.querySelector(".chat"); if (ch) ch.scrollTop = ch.scrollHeight;
  on("[data-permesso]", (b) => agisci({ tipo: "permesso", lotto: b.dataset.permesso }));
  on("[data-agenzia]", (b) => agisci({ tipo: "agenzia", lotto: b.dataset.agenzia }));
  on("[data-scarica]", (b) => agisci({ tipo: "scarica_contatto", chiave: b.dataset.scarica }));
  on("[data-vai]", (b) => { telAperto = false; disegnaTelefono(me); chiediViaggio(me, b.dataset.vai); });
  on('[data-a2="licenza"]', () => agisci({ tipo: "licenza" }));
  on('[data-a2="bustaLicenza"]', () => agisci({ tipo: "busta_licenza" }));
  on("[data-regalo]", (b) => agisci({ tipo: "regalo_assessore", lotto: b.dataset.regalo }));
  on("[data-cantiere]", (b) => agisci({ tipo: "costruisci", lotto: b.dataset.cantiere, attivita: v("#t_" + b.dataset.cantiere) }));
  on('[data-a2="restituisci"]', () => agisci({ tipo: "restituisci", importo: me.debito }));
  on('[data-a2="prestito"]', () => finestraPrestito(me));
  on('[data-a2="regala"]', () => agisci({ tipo: "regala", a: v("#regA"), importo: Number(v("#regImp")), sporchi: !!box.querySelector("#regSp")?.checked }));
  on('[data-a2="piano"]', () => finestraPalazzo(me));
  on('[data-a2="veicolo"]', () => finestraVeicolo());
  on('[data-a2="nuovoContratto"]', () => finestraContratto());
  on('[data-a2="campagna"]', () => agisci({ tipo: "campagna", importo: Number(v("#campImp")) }));
  on('[data-a2="legge"]', () => agisci({ tipo: "legge", legge: v("#leggeSel"), isola: v("#leggeIsola") }));
  on('[data-a2="tasse"]', () => agisci({ tipo: "tasse", quota: Number(v("#tasseSel")) }));
  on('[data-a2="fonda"]', () => agisci({ tipo: "fonda_setta", nome: v("#sNome"), motto: v("#sMotto") }));
  if (box.querySelector("#evasione")) box.querySelector("#evasione").onchange = (e) => agisci({ tipo: "evasione", quota: Number(e.target.value) });
  on("[data-denuncia]", (b) => agisci({ tipo: "denuncia", prova: Number(b.dataset.denuncia) }));
  on("[data-compra]", (b) => { const [cosa, nome] = b.dataset.compra.split("|"); agisci({ tipo: "investi", cosa, nome, importo: Number(v(`[data-imp="${cosa === "borsa" ? "b" : "c"}_${nome}"]`)) }); });
  on("[data-vendi]", (b) => { const [cosa, nome] = b.dataset.vendi.split("|"); agisci({ tipo: "vendi", cosa, nome, quota: 1 }); });
  on("[data-invito]", (b) => { const [st, si] = b.dataset.invito.split("|"); agisci({ tipo: "rispondi_invito", setta: st, si: si === "1" }); });
  on("[data-versa]", (b) => { const [st, sp] = b.dataset.versa.split("|"); agisci({ tipo: "versa_setta", setta: st, importo: Number(v("#versa_" + st)), sporchi: sp === "1" }); });
  on("[data-invita]", (b) => agisci({ tipo: "invita_setta", setta: b.dataset.invita, invitato: v("#inv_" + b.dataset.invita) }));
  on("[data-contr]", (b) => { const [kk, si] = b.dataset.contr.split("|"); agisci({ tipo: "rispondi_contratto", id: kk, si: si === "1" }); });
}

// ------------------------------------------------------------ finestre
function finestra(html, collega) {
  const d = document.createElement("div"); d.className = "velo"; d.innerHTML = `<div class="fin vetro">${html}</div>`;
  document.body.appendChild(d);
  const chiudi = () => d.remove();
  collega && collega(d, chiudi);
  return chiudi;
}
function finestreAutomatiche(me) {
  if (document.querySelector(".velo")) return;
  // 1. cose a cui rispondere subito
  if (S.fase === "notte" && S.notte && finestraProposteNotte(me)) return;
  // 2. livello nuovo: una finestra sola, con la voce di Vera e le app nuove
  const livVisto = (() => { try { return +(localStorage.getItem("laguna_liv_" + partita) || 0); } catch (e) { return 0; } })();
  if ((S.sblocco || 0) > livVisto) {
    try { localStorage.setItem("laguna_liv_" + partita, String(S.sblocco)); } catch (e) { }
    const nuove = APPS.filter((a) => appVisibile(me, a) && a.lv === S.sblocco);
    const vera = (me.messaggi || []).filter((m) => m.testo.startsWith("Vera:")).slice(-1)[0];
    const [tit] = SBLOCCHI[S.sblocco] || [""];
    return finestra(`<span class="kick" style="color:var(--oro)">${ico("stella")} Sei salito di livello</span><h2>${esc(tit.split(" · ")[0])}</h2>${vera ? `<p class="storia">${esc(vera.testo.replace(/^Vera: /, "").replace(/^"|"$/g, ""))}</p>` : ""}${nuove.length ? `<div class="home" style="grid-template-columns:repeat(4,1fr);margin-top:8px">${nuove.map((a) => `<div class="app"><span class="ico" style="background:${a.col}">${a.ico}</span>${a.nome}</div>`).join("")}</div>` : ""}<div class="pulsanti"><button class="oro" id="ok">Andiamo</button></div>`, (d, c) => { d.querySelector("#ok").onclick = () => { c(); finestreAutomatiche(io()); }; });
  }
  // 3. la notte: una sola finestra all'inizio (completa solo la prima volta), poi avvisi leggeri
  if (S.fase === "notte" && S.notte) {
    const N2 = S.notte, vg = N2.viaggio[mioId];
    const libero = !N2.chiuso[mioId] && !vg && !S.notteFatti[mioId] && !me.faro;
    const inv = (N2.serate || []).find((x) => x.host !== mioId && x.host !== N2.ospite && !(vg && vg.serata === x.host) && !visti.has("ser" + S.ciclo + x.host));
    if (N2.ora === 0 && !visti.has("notte" + S.ciclo)) {
      visti.add("notte" + S.ciclo); if (inv) visti.add("ser" + S.ciclo + inv.host);
      const prima = (() => { try { return !localStorage.getItem("laguna_notte1_" + partita); } catch (e) { return true; } })();
      try { localStorage.setItem("laguna_notte1_" + partita, "1"); } catch (e) { }
      const sp = (me.sporchi || 0) >= 1_000_000 ? `<p>${ico("maschera")} Hai <b style="color:var(--sporco)">${euro(me.sporchi)}</b> sporchi: spendili stanotte o ripuliscili al Casinò Reale.</p>` : "";
      const invito = inv && libero ? `<p>${ico("casino")} <b>${esc(inv.nome)}</b> ti invita a poker al piano ${inv.piani} del suo Palazzo (ingresso ${inv.ingresso ? euro(inv.ingresso) : "gratis"}).</p>` : "";
      if (!prima && !sp && !invito) { avviso(`${ico("luna")} <b>Cala la notte.</b> Hai 6 ore.`); return; }
      return finestra(`<span class="kick" style="color:var(--cielo)">${ico("luna")} Cala la notte</span><h2>${prima ? "La Laguna è tua, fino alle 4" : "Un'altra notte"}</h2>
        ${prima ? `<p>Ogni ora scegli una cosa, poi premi <b>Avanti</b>. Trascina per guardarti intorno e tocca i cerchi luminosi.</p>` : ""}${sp}${invito}
        <div class="pulsanti">${invito ? `<button id="no">Esco per conto mio</button><button class="oro" id="si">Vado da ${esc(inv.nome)}</button>` : `<button class="notte" id="no">Esco</button>`}</div>`, (d, c) => {
        d.querySelector("#no").onclick = () => { c(); finestreAutomatiche(io()); };
        const si = d.querySelector("#si"); if (si) si.onclick = () => { c(); agisci({ tipo: "vai_serata", host: inv.host }); };
      });
    }
    if (inv) {
      visti.add("ser" + S.ciclo + inv.host);
      if (!libero) { avviso(`${ico("casino")} <b>${esc(inv.nome)}</b> ha aperto una serata di poker. La trovi in "Vai altrove".`); return; }
      return finestra(`<span class="kick" style="color:var(--oro)">${ico("casino")} Invito</span><h2>Poker da ${esc(inv.nome)}</h2><p>Al piano ${inv.piani} del suo Palazzo. Ingresso ${inv.ingresso ? euro(inv.ingresso) : "gratis"}.</p><div class="pulsanti"><button id="no">No, grazie</button><button class="oro" id="si">Ci vado</button></div>`, (d, c) => { d.querySelector("#no").onclick = c; d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "vai_serata", host: inv.host }); }; });
    }
  }
  // 4. il riepilogo dell'ora: un biglietto che sparisce da solo, non una finestra
  const rm = S.riepOra && S.riepOra.mio, vuoto = rm && !rm.soldi && !rm.fama && !rm.rischio && !rm.visti.length;
  if (rm && !rm.aCasa && !vuoto && !visti.has("riep" + S.riepOra.ciclo + "_" + S.riepOra.n)) { visti.add("riep" + S.riepOra.ciclo + "_" + S.riepOra.n); avvisoRiepilogo(S.riepOra); }
  if (S.fase === "pacchetti" && tocca() && !visti.has("pk")) { visti.add("pk"); return finestraPacchetti(); }
  if (S.pending && S.pending.tipo === "asta" && tocca()) { const k = "asta" + S.pending.lotto + S.ciclo + S.giorno; if (!visti.has(k)) { visti.add(k); return finestraAsta(me); } }
  if (S.pending && S.pending.giocatore === mioId && S.pending.tipo !== "asta") { const k = "p" + S.pending.tipo + (S.pending.lotto || "") + S.ciclo + S.giorno; if (!visti.has(k)) { visti.add(k); return finestraPending(me); } }
  const prop = (S.proposte || []).find((x) => x.a === mioId && x.stato === "proposta" && !visti.has("prop" + x.id));
  if (prop) { visti.add("prop" + prop.id); return finestraProposta(prop); }
  if (S.ultimaAlba && S.fase === "giorno" && !visti.has("alba" + S.ultimaAlba.ciclo)) { visti.add("alba" + S.ultimaAlba.ciclo); return finestraAlba(me); }
  if (S.ultimaCarta && S.ultimaCarta.giocatore === mioId) { const k = "carta" + S.ultimaCarta.testo + S.ciclo + S.giorno; if (!visti.has(k)) { visti.add(k); return finestra(`<span class="kick" style="color:var(--oro)">Gazzetta</span><h2>${esc(S.ultimaCarta.testo)}</h2><div class="pulsanti"><button class="oro" id="ok">Ok</button></div>`, (d, c) => d.querySelector("#ok").onclick = c); } }
  if (me.ultimaSentenza && !visti.has("sent" + JSON.stringify(me.ultimaSentenza))) { visti.add("sent" + JSON.stringify(me.ultimaSentenza)); const s = me.ultimaSentenza; return finestra(`<span class="kick" style="color:var(--sporco)">Sentenza · ${esc(s.gravita)}</span><h2>Il Giudice ha deciso</h2><p>Soldi sporchi confiscati: <b>${euro(s.confiscati)}</b><br>Multa: <b>${euro(s.multa)}</b>${s.faro ? `<br>Faro: <b>${s.faro} turni</b>` : ""}${s.blocco ? `<br>Entrate bloccate per <b>${s.blocco} Cicli</b>` : ""}</p><div class="pulsanti"><button class="oro" id="ok">Ho capito</button></div>`, (d, c) => d.querySelector("#ok").onclick = c); }
}
function extraTesto(e) {
  const t = [];
  if (e.cash) t.push("+" + euro(e.cash)); if (e.piani) t.push("un Palazzo di " + e.piani + " piani"); if (e.azioni) t.push(euro(e.azioni) + " in azioni");
  if (e.veicolo) t.push("un motoscafo"); if (e.fama) t.push("fama " + e.fama); if (e.reputazione) t.push("amici nel giro"); if (e.cripto) t.push(euro(e.cripto) + " in FlamingoToken");
  return t.join(" · ");
}
function finestraPacchetti() {
  finestra(`<span class="kick" style="color:var(--oro)">La tua storia</span><h2>Chi sei, quando arrivi nella Laguna?</h2><p>Partite tutti uguali: <b>${euro(L.N.cashStart)}</b> e <b>un terreno a sorte</b> (se ti tocca uno più economico, la differenza ti arriva in contanti). Ogni storia ti dà un vantaggio diverso: scegli quello che va col tuo modo di giocare.</p>
    <div class="griglia">${S.pacchettiDisponibili.map((id) => { const k = L.PACCHETTI.find((x) => x.id === id); return `<button class="sch" data-pk="${id}"><h3 class="serif" style="font-weight:400;font-size:20px">${esc(k.nome)}</h3><p style="margin-top:6px;color:var(--oro);font-weight:700">${esc(k.perk)}</p></button>`; }).join("")}</div>`,
    (d, chiudi) => d.querySelectorAll("[data-pk]").forEach((el) => el.onclick = () => { chiudi(); agisci({ tipo: "pacchetto", id: el.dataset.pk }); }));
}
function finestraAsta(me) {
  const l = S.lotti.find((x) => x.id === S.pending.lotto);
  finestra(`<span class="kick" style="color:var(--rosa)">Asta${l.isola ? " · " + esc(L.NOMI_ISOLE[l.isola]) : ""}</span><h2>${esc(l.nome)}</h2><p>Vale ${euro(l.prezzo)}. Ognuno offre in segreto: vince chi offre di più. Hai ${euro(me.cash)}.</p>${S.pending.sequestro ? `<p class="sub">Terreno sequestrato dal Comune. Offerta minima ${euro(S.pending.minimo)}. I soldi vanno alla banca; l'ex padrone non può partecipare.</p>` : ""}
    <div class="campo"><label for="off">La tua offerta</label><input id="off" type="number" value="0" style="font-size:22px;font-weight:800"></div>
    <div class="pulsanti"><button id="no">Non offro</button><button class="oro" id="ok">Offro</button></div>`, (d, chiudi) => {
    d.querySelector("#ok").onclick = () => { chiudi(); agisci({ tipo: "offerta", importo: Number(d.querySelector("#off").value) }); };
    d.querySelector("#no").onclick = () => { chiudi(); agisci({ tipo: "offerta", importo: 0 }); };
  });
}
function finestraPending(me) {
  const pd = S.pending;
  if (pd.tipo === "compra") {
    const l = S.lotti.find((x) => x.id === pd.lotto);
    return finestra(`<span class="kick" style="color:${COL_SERIE[l.serie] || "var(--oro)"}">${l.isola ? esc(L.NOMI_ISOLE[l.isola]) : ""}</span><h2>${esc(l.nome)}</h2>
      <p class="serif" style="font-size:30px;color:var(--oro);margin:4px 0">${euro(l.prezzo)}</p>
      <p>Un terreno libero. Se lo compri, poi ti serve il permesso del Municipio per costruirci. Se non lo compri, va all'asta tra tutti.</p>${gruppo(l) ? `<p class="sub"><span style="color:${COL_SERIE[l.serie]}">■</span> ${gruppo(l)}</p>` : ""}
      <div class="pulsanti"><button id="no">Lascio stare</button><button class="oro" id="si" ${me.cash < l.prezzo ? "disabled" : ""}>Compro · ${euro(l.prezzo)}</button></div>`, (d, c) => {
      d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "compra", si: true }); };
      d.querySelector("#no").onclick = () => { c(); agisci({ tipo: "compra", si: false }); };
    });
  }
  if (pd.tipo === "chiamata") {
    Suono.telefono();
    const tel = (me.valigetta || []).some((o) => o.id === "telefono");
    return finestra(`<span class="kick" style="color:var(--rosa)">${ico("sconosciuto")} Numero sconosciuto</span><p class="storia" style="font-size:17px">${esc(pd.testo)}</p>
      ${tel ? `<label class="check"><input type="checkbox" id="tel" checked> Rispondo dal telefono usa-e-getta</label>` : `<p class="sub">Se accetti dal tuo numero, qualcuno potrebbe ascoltare.</p>`}
      <div class="pulsanti"><button id="no">Riattacco</button><button class="oro" id="si">Ci sto</button></div>`, (d, c) => {
      d.querySelector("#no").onclick = () => { c(); agisci({ tipo: "chiamata", si: false }); };
      d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "chiamata", si: true, telefono: !!d.querySelector("#tel")?.checked }); };
    });
  }
  if (pd.tipo === "gala") return finestra(`<span class="kick" style="color:var(--rosa)">Baia Flamingo</span><h2>Il Gala Flamingo</h2><p>Serata di beneficenza. Chi dona tanto, fa parlare di sé.</p><div class="campo"><label for="v">Quanto doni?</label><input id="v" type="number" value="0"></div><div class="pulsanti"><button class="oro" id="ok">Conferma</button></div>`,
    (d, c) => d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "gala", importo: Number(d.querySelector("#v").value) }); });
  if (pd.tipo === "casino_reale") return finestra(`<span class="kick" style="color:var(--oro)">Isola Corona</span><h2>Il Casinò Reale</h2><p>Una puntata sul rosso. Quasi metà delle volte raddoppi.</p><div class="campo"><label for="v">Puntata (0 = non giochi)</label><input id="v" type="number" value="0"></div><div class="pulsanti"><button class="oro" id="ok">Conferma</button></div>`,
    (d, c) => d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "casino_reale", importo: Number(d.querySelector("#v").value) }); });
  if (pd.tipo === "municipio") return finestra(`<span class="kick" style="color:var(--setta)">Isola Corona</span><h2>Il Municipio</h2><p>Puoi candidarti a Sindaco (fama 40, ${euro(L.N.candidatura)}). Allo sportello la licenza del casinò è sicura e costa solo 400.000 €.</p><div class="pulsanti"><button id="n">Niente</button><button id="l">Licenza casinò</button><button class="oro" id="c">Mi candido</button></div>`,
    (d, c) => { d.querySelector("#n").onclick = () => { c(); agisci({ tipo: "municipio", scelta: "nulla" }); }; d.querySelector("#l").onclick = () => { c(); agisci({ tipo: "municipio", scelta: "licenza" }); }; d.querySelector("#c").onclick = () => { c(); agisci({ tipo: "municipio", scelta: "candidati" }); }; });
}
function finestraAlba(me) {
  const r = (S.ultimaAlba.riepilogo || {})[mioId] || {};
  const racc = me.raccontoNotte || [];
  const gaz = S.gazzetta.filter((g) => g.ciclo === S.ultimaAlba.ciclo || g.ciclo === S.ultimaAlba.ciclo + 1).slice(-6);
  finestra(`<span class="kick" style="color:var(--oro)">${ico("sole")} L'Alba · Ciclo ${S.ultimaAlba.ciclo}</span><h2>La tua notte</h2>
    <div style="display:flex;flex-direction:column;gap:6px">${racc.map((x) => { const [o, t] = x.split(" — "); return `<p class="storia" style="margin:0"><b style="color:var(--cielo);font-style:normal">${esc(o)}</b> ${esc(t)}</p>`; }).join("") || `<p class="sub">Una notte tranquilla.</p>`}</div>
    <p class="kick" style="color:var(--muted);margin-top:16px">I conti del mattino</p>
    ${(r.dettaglio || []).length ? `<table class="cl">${r.dettaglio.map((x) => `<tr><td>${esc(x.nome)} <span class="sub">${esc(x.cosa)}</span></td><td style="color:${x.importo ? "var(--pulito)" : "var(--muted)"};font-weight:700">${x.importo ? "+ " + euro(x.importo) : "0 €"}</td></tr>`).join("")}${r.palazzo ? `<tr><td>Il tuo Palazzo</td><td style="color:var(--pulito);font-weight:700">+ ${euro(r.palazzo)}</td></tr>` : ""}${r.veicoli ? `<tr><td>Noleggio dei tuoi veicoli</td><td style="color:var(--pulito);font-weight:700">+ ${euro(Math.round(r.veicoli))}</td></tr>` : ""}</table>` : ""}
    <table class="cl"><tr><td><b>Totale rendite</b></td><td style="color:var(--pulito);font-weight:800">+ ${euro(r.rendite || 0)}</td></tr><tr><td>Tasse</td><td style="color:var(--sporco);font-weight:800">− ${euro(r.tasse || 0)}</td></tr>
    ${r.interessi ? `<tr><td>Interessi alla Banca</td><td>− ${euro(r.interessi)}</td></tr>` : ""}${r.corruzione ? `<tr><td>Le "mance" ai tuoi amici</td><td>− ${euro(r.corruzione)}</td></tr>` : ""}</table>
    <p class="kick" style="color:var(--muted);margin-top:16px">📰 La Gazzetta del mattino</p>${gaz.map((g) => `<p class="serif" style="font-size:16px;margin:4px 0">${esc(g.testo)}</p>`).join("")}
    <div class="pulsanti"><button class="oro" id="ok">Inizia il giorno</button></div>`, (d, c) => d.querySelector("#ok").onclick = c);
}
const NOMI_GRAVITA = { lieve: "Lieve", media: "Media", grave: "Grave", gravissima: "Gravissima" };
function testoPena(g) {
  const P = L.PENE[g]; if (!P) return "";
  const pezzi = [];
  if (P.faro) pezzi.push(P.faro + " Cicli in cella al Faro");
  pezzi.push("multa del " + Math.round(P.multa * 100) + "% dei tuoi soldi");
  if (P.attivita === "chiusa") pezzi.push("un'attività chiusa");
  if (P.attivita && P.attivita.startsWith("confisca")) pezzi.push("confisca dei soldi sporchi");
  pezzi.push("−" + P.fama + " fama");
  return pezzi.join(", ");
}
const COLORE_POLIZIA = { tranquillo: "#7bd88f", agitato: "#f3c56b", pericoloso: "#ff5c5c" };
function boxRischio(me, o) {
  const N2 = S.notte, lv = N2.pericoloQui, i = ["tranquillo", "agitato", "pericoloso"].indexOf(lv);
  const prob = i >= 0 ? Math.round(L.P_GUAI[i] * (N2.protezione || 1) * 100) : null;
  const v = (me.valigetta || []).map((x) => x.id);
  const righe = (o.pericoli || []).map((k) => {
    const G = L.PERICOLI[k]; const salva = Object.entries(L.OGGETTI).filter(([id, O]) => (O.salva || []).includes(k));
    const ho = salva.some(([id]) => v.includes(id));
    const danno = { perso: "perdi il carico e i soldi messi", riconosciuto: "ti riconoscono: più tracce, la polizia ti tiene d'occhio", allarme: "scappi a mani vuote e la polizia ha il tuo nome", foto: "un altro giocatore ottiene una Prova contro di te", retata: "sequestrano il carico e gli oggetti illegali", meta: "ti porti via solo metà" }[G.danno] || "";
    return `<div class="liv"><span class="liv-n" style="background:${ho ? "#2e7d4f" : "rgba(255,255,255,.1)"}">${ho ? "✓" : "!"}</span><div><b>Se ${esc(G.arriva)}</b><div class="sub" style="font-size:12px">${esc(danno)}.${salva.length ? " Ti salva quasi sempre: " + salva.map(([id, O]) => O.nome.toLowerCase() + (v.includes(id) ? " (ce l'hai)" : "")).join(" o ") + "." : " Niente ti salva."}</div></div></div>`;
  }).join("");
  return `<div class="rischio-box">
    <div class="riga" style="justify-content:space-between"><b>${ico("siren")} Il rischio</b>${prob !== null ? `<span>Polizia stanotte: <b style="color:${COLORE_POLIZIA[lv]}">${lv}</b> · guai: <b>${prob}%</b></span>` : ""}</div>
    ${righe}
    <div class="sub" style="font-size:12px;margin-top:6px">Reato <b>${NOMI_GRAVITA[o.gravita] || "lieve"}</b>. Lascia circa ${Math.round(o.tracce * 0.75)} Tracce: più Tracce hai, più è facile che all'Alba la polizia salga di un gradino. Se arrivi al Processo: ${esc(testoPena(o.gravita || "lieve"))}.</div>
  </div>`;
}
function boxReato(gravita, righe) {
  return `<div class="rischio-box"><b>${ico("siren")} Il rischio</b>${righe.map((r) => `<div class="sub" style="font-size:12px;margin-top:4px">• ${r}</div>`).join("")}
    <div class="sub" style="font-size:12px;margin-top:6px">Reato <b>${NOMI_GRAVITA[gravita]}</b>. Se arrivi al Processo: ${esc(testoPena(gravita))}.</div></div>`;
}
function finestraOccasione(me, n) {
  const o = S.notte.occasioni.find((x) => x.n === n); if (!o) return;
  const v = me.valigetta || [];
  const scelti = new Set();
  finestra(`<span class="kick" style="color:var(--cielo)">${esc(nomeLuogo(o.luogo))} · ore ${L.ORE[S.notte.ora]}</span><h2>${esc(o.nome)}</h2><p class="storia">${esc(o.testo)}</p>
    <p>${o.costo ? "Ci metti <b>" + euro(o.costo) + "</b> (prima i soldi sporchi)." : "Non ci metti niente."} ${o.legale ? "" : o.guadagno ? "Se va bene, torni con <b>" + euro(o.guadagno[0] * L.N.bonusIllegale) + " – " + euro(o.guadagno[1] * L.N.bonusIllegale) + "</b> sporchi." : ""}</p>
    ${o.legale ? "" : boxRischio(me, o)}
    ${o.legale ? "" : v.length ? `<p class="kick" style="color:var(--muted);margin-top:12px">Cosa porti con te?</p><p class="sub">Scegli gli oggetti della valigetta. Se qualcosa va storto, quello giusto può salvarti. Quelli che si consumano li perdi.</p><div style="display:flex;flex-direction:column;gap:6px">${[...new Set(v.map((x) => x.id))].map((id) => { const quanti = v.filter((x) => x.id === id).length; return `<button class="ogg" data-id="${id}" style="text-align:left;color:#fff"><span class="ic">${ICO_OGG[id]}</span><div><b>${esc(L.OGGETTI[id].nome)}${quanti > 1 ? ` <span class="tag">ne hai ${quanti}: ne usi 1</span>` : ""}</b><div class="sub" style="font-size:12px">${esc(L.OGGETTI[id].descr)}</div></div></button>`; }).join("")}</div>` : `<p class="sub">La valigetta è vuota: vai a mani nude.</p>`}
    <div class="pulsanti"><button id="no">Lascio stare</button><button class="${o.legale ? "oro" : "notte"}" id="si">${o.legale ? "Ci sto" : "Accetto"}</button></div>`, (d, c) => {
    d.querySelectorAll(".ogg[data-id]").forEach((b) => b.onclick = () => { const id = b.dataset.id; if (scelti.has(id)) scelti.delete(id); else scelti.add(id); d.querySelectorAll(`.ogg[data-id="${id}"]`).forEach((x) => x.classList.toggle("sel", scelti.has(id))); });
    d.querySelector("#no").onclick = c;
    d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "occasione", n, oggetti: [...scelti] }); };
  });
}
function finestraNegozio(me) {
  const dove = S.notte.dove[mioId];
  const merce = Object.entries(L.OGGETTI).filter(([k, O]) => O.dove === dove);
  const v = me.valigetta || [];
  finestra(`<span class="kick" style="color:var(--cielo)">${ICO_LUOGO[dove]} ${esc(nomeLuogo(dove))}</span><h2>${dove === "mercato" ? "Il banco del Mercato Nero" : "Si può comprare"}</h2>
    <p class="sub">Valigetta: ${v.length} posti usati su ${S.postiValigetta}. Si paga prima con i soldi sporchi.</p>
    <div style="display:flex;flex-direction:column;gap:8px">${merce.map(([k, O]) => `<div class="ogg"><span class="ic">${ICO_OGG[k]}</span><div style="flex:1"><b>${esc(O.nome)}</b><div class="sub" style="font-size:12px">${esc(O.descr)}</div></div><button class="piccolo oro" data-ogg="${k}" ${v.length >= S.postiValigetta || me.cash + me.sporchi < O.prezzo ? "disabled" : ""}>${euro(O.prezzo)}</button></div>`).join("")}</div>
    <div class="pulsanti"><button id="x">Chiudi</button></div>`, (d, c) => {
    d.querySelector("#x").onclick = c;
    d.querySelectorAll("[data-ogg]").forEach((b) => b.onclick = async () => { c(); await agisci({ tipo: "compra_oggetto", oggetto: b.dataset.ogg }); finestraNegozio(io()); });
  });
}
function finestraSoffiata(me) {
  const luoghi = Object.keys(L.LUOGHI).filter((l) => l !== "palazzo" && l !== "mercato" && L.LUOGHI[l].sblocco <= S.sblocco);
  finestra(`<span class="kick" style="color:var(--cielo)">🕯️ Mercato Nero</span><h2>Una soffiata</h2><p>Un vecchio informatore sa dove stanotte gira la polizia. Per 50.000 € ti dice com'è un posto.</p>
    <div class="campo"><label for="lu">Su quale posto?</label><select id="lu">${luoghi.map((l) => `<option value="${l}">${esc(L.LUOGHI[l].nome)}</option>`).join("")}</select></div>
    <div class="pulsanti"><button id="x">Lascio stare</button><button class="notte" id="ok">Pago</button></div>`, (d, c) => { d.querySelector("#x").onclick = c; d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "soffiata", luogo: d.querySelector("#lu").value }); }; });
}
function finestraRicicla(me, paradiso) {
  finestra(`<span class="kick" style="color:var(--cielo)">${paradiso ? "✈️ Il tuo jet" : "🎰 Casinò Reale"}</span><h2>Ripulire i soldi</h2>
    <p>Hai ${euro(me.sporchi)} sporchi. ${paradiso ? "Un volo veloce in un paradiso fiscale: ne perdi il 30%." : "Al cambio fiches li fai passare per vincite. Con le tue attività di copertura ne perdi poco; senza, li cambi in ShadowCoin e ne perdi di più."}</p>
    ${paradiso ? "" : `<div class="campo"><label for="met">Come</label><select id="met"><option value="copertura">Con le mie attività di copertura (ancora ${euro(Math.max(0, L.copertura(S, me) - (me.copUsata || 0)))})</option><option value="shadow">Con ShadowCoin</option></select></div>`}
    <div class="campo"><label for="imp">Quanto</label><input id="imp" type="number" value="${Math.round(me.sporchi)}"></div>
    ${boxReato((me.riciclTot || 0) > 8_000_000 ? "grave" : "lieve", [
      `Lascia Tracce: circa ${paradiso ? "0,2" : "0,4 (copertura) o 0,6 (ShadowCoin)"} ogni 100.000 € ripuliti.`,
      "Le tue attività di copertura attirano controlli: all'Alba aggiungono Tracce se stanotte hai ripulito.",
      `Oltre 8 milioni ripuliti in tutto il reato diventa Grave. Finora: ${euro(me.riciclTot || 0)}.`])}
    <div class="pulsanti"><button id="x">Lascio stare</button><button class="notte" id="ok">Ripulisco</button></div>`, (d, c) => { d.querySelector("#x").onclick = c; d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "ricicla", metodo: paradiso ? "paradiso" : d.querySelector("#met").value, importo: Number(d.querySelector("#imp").value) }); }; });
}
function finestraCorrompi(me) {
  const club = S.notte.dove[mioId] === "club" || S.notte.dove[mioId] === "palazzo";
  finestra(`<span class="kick" style="color:var(--cielo)">🤝 ${club ? "Club Neon, il tavolo in fondo" : "Casinò Reale, la sala privata"}</span><h2>${club ? "Un amico in divisa" : "Il banchiere Lenz"}</h2>
    <p>${club ? "Stasera al club c'è chi indossa una divisa di giorno. Un regalo ogni Ciclo, e chiuderà un occhio." : "Lenz sa far sparire i soldi dai registri. Non è gratis, e non è per sempre."} Può anche rifiutare e fare il tuo nome.</p>
    ${club ? `<div class="campo"><label for="chi">Chi</label><select id="chi"><option value="agente">L'agente di quartiere (${euro(L.N.corruz.agente[0])}, poi ${euro(L.N.corruz.agente[1])} a Ciclo)</option><option value="commissario">Il Commissario Vargas (${euro(L.N.corruz.commissario[0])})</option></select></div><div class="campo"><label for="iso">L'agente di quale isola</label><select id="iso">${L.ISOLE.map((i) => `<option value="${i}">${L.NOMI_ISOLE[i]}</option>`).join("")}</select></div>` : `<p>Prezzo: ${euro(L.N.corruz.banchiere[0])}, poi ${euro(L.N.corruz.banchiere[1])} a Ciclo.</p>`}
    <label class="check"><input type="checkbox" id="sp"> Pago in contanti sporchi (costa il 20% in meno)</label>
    ${boxReato(club ? "media" : "grave", [
      `Rifiuta ${Math.round((0.05 + 0.03 * (me.stato || 0)) * 100)} volte su 100 (di più se la polizia ti guarda già): perdi i soldi e +20 Tracce.`,
      "Se accetta: +4 Tracce. L'agente è reato Medio, Vargas e Lenz sono reato Grave."])}
    <div class="pulsanti"><button id="x">Meglio di no</button><button class="notte" id="ok">Faccio l'offerta</button></div>`, (d, c) => { d.querySelector("#x").onclick = c; d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "corrompi", chi: club ? d.querySelector("#chi").value : "banchiere", isola: club ? d.querySelector("#iso").value : null, sporchi: d.querySelector("#sp").checked }); }; });
}
function finestraRapido(me) {
  const dest = L.destinazioniRapide(S, me);
  const MEZZO = { traghetto: ["marina", "Traghetto"], motoscafo: ["motoscafo", "Motoscafo"], elicottero: ["palazzo", "Elicottero"], jet: ["aereo", "Jet"] };
  finestra(`<span class="kick" style="color:var(--oro)">${ico("aereo")} Viaggio rapido</span><h2>Dove vuoi andare?</h2>
    <p>Una volta per Ciclo, al posto dei dadi. Non passi dalla Partenza (niente stipendio) e se atterri sul terreno di un altro paghi l'affitto.</p>
    <div class="lista-luoghi">${dest.map((d) => { const l = S.lotti.find((x) => x.idx === d.idx); const own = l.owner ? S.players.find((p) => p.id === l.owner) : null;
      return `<button class="luogo-riga" data-rap="${d.idx}" ${me.cash < d.costo ? "disabled" : ""}><span class="ic">${ico(MEZZO[d.mezzo][0])}</span><span style="flex:1;text-align:left"><b>${esc(l.nome)}</b><br><span class="sub">${MEZZO[d.mezzo][1]}${l.isola ? " · " + esc(L.NOMI_ISOLE[l.isola]) : ""}${own ? " · di " + esc(own.nome) : ""}</span></span><span class="ore">${d.costo ? euro(d.costo) : "gratis"}</span></button>`; }).join("")}</div>
    <div class="pulsanti"><button id="no">Tiro i dadi</button></div>`, (d, c) => {
    d.querySelector("#no").onclick = c;
    d.querySelectorAll("[data-rap]").forEach((b) => b.onclick = () => { c(); agisci({ tipo: "viaggio_rapido", idx: +b.dataset.rap }); });
  });
}
function finestraDoganiere(me) {
  const [p0, p1] = L.N.corruz.doganiere;
  finestra(`<span class="kick" style="color:var(--cielo)">${ico("aereo")} Aeroporto della Laguna</span><h2>Il doganiere</h2>
    <p>Il capo della dogana fa il turno di notte. Con lui dalla tua parte, i tuoi carichi all'Aeroporto rischiano la metà. Prezzo: ${euro(p0)}, poi ${euro(p1)} a Ciclo. Può anche rifiutare e fare il tuo nome.</p>
    <label class="check"><input type="checkbox" id="sp"> Pago in contanti sporchi (costa il 20% in meno)</label>
    ${boxReato("media", [`Rifiuta ${Math.round((0.05 + 0.03 * (me.stato || 0)) * 100)} volte su 100: perdi i soldi e +20 Tracce.`, "Se accetta: +4 Tracce."])}
    <div class="pulsanti"><button id="x">Meglio di no</button><button class="notte" id="ok">Faccio l'offerta</button></div>`, (d, c) => { d.querySelector("#x").onclick = c; d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "corrompi", chi: "doganiere", isola: null, sporchi: d.querySelector("#sp").checked }); }; });
}
function finestraArticolo(me) {
  finestra(`<span class="kick" style="color:var(--cielo)">📰 Redazione</span><h2>Un articolo per domattina</h2><p>Il caporedattore pubblica quello che gli porti, se la busta è abbastanza pesante. Uno scandalo contro chi è pulito può ritorcersi contro di te.</p>
    <div class="campo"><label for="art">Su chi</label><select id="art">${S.players.map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("")}</select></div>
    <div class="campo"><label for="ton">Come</label><select id="ton"><option value="elogio">Un elogio (più fama)</option><option value="scandalo">Uno scandalo (meno fama)</option></select></div>
    <div class="campo"><label for="artImp">La busta (almeno 125.000 €)</label><input id="artImp" type="number" value="250000"></div>
    <div class="campo"><label for="artTesto">Il titolo</label><input id="artTesto"></div>
    <label class="check"><input type="checkbox" id="artSp"> Pago in contanti sporchi</label>
    <div class="pulsanti"><button id="x">Lascio stare</button><button class="notte" id="ok">Consegno la busta</button></div>`, (d, c) => { d.querySelector("#x").onclick = c; d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "articolo", bersaglio: d.querySelector("#art").value, tono: d.querySelector("#ton").value, importo: Number(d.querySelector("#artImp").value), testo: d.querySelector("#artTesto").value, sporchi: d.querySelector("#artSp").checked }); }; });
}
function finestraSetta(me) {
  const st = S.sette.find((x) => x.gm === mioId);
  finestra(`<span class="kick" style="color:var(--setta)">🗼 Il Faro, a mezzanotte</span><h2>${esc(st.nome)}</h2><p>Livello ${L.livelloSetta(S, st)} · tesoro ${euro(st.tesoro)}. Cosa decide la setta stanotte?</p>
    <div class="campo"><label for="op">Operazione</label><select id="op"><option value="manipola">Muovere un titolo in Borsa (liv. 2)</option><option value="blackout">Spegnere un'isola (liv. 3)</option><option value="evasione">Far evadere qualcuno dal Faro (liv. 3)</option><option value="fantoccio">Un Sindaco fantoccio (liv. 4)</option></select></div>
    <div class="riga"><select id="ob">${L.AZIENDE.map((a) => `<option value="${a}">${a}</option>`).join("")}${L.ISOLE.map((i) => `<option value="${i}">${L.NOMI_ISOLE[i]}</option>`).join("")}${S.players.map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("")}</select><select id="od"><option value="su">su</option><option value="giu">giù</option></select></div>
    <div class="pulsanti"><button id="x">Chiudi</button><button id="rec">Recluta il banchiere</button><button class="notte" id="ok">Si fa</button></div>`, (d, c) => {
    d.querySelector("#x").onclick = c;
    d.querySelector("#rec").onclick = () => { c(); agisci({ tipo: "recluta", setta: st.id, chi: "banchiere" }); };
    d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "operazione", setta: st.id, op: d.querySelector("#op").value, bersaglio: d.querySelector("#ob").value, direzione: d.querySelector("#od").value }); };
  });
}
function finestraPalazzo(me) {
  const costo = L.costoPiano(me), poss = L.stanzePossibili(S, me), primo = poss.find((x) => x.ok);
  finestra(`<span class="kick" style="color:var(--oro)">${ico("palazzo")} Il tuo Palazzo</span><h2>Il piano ${me.piani + 1}</h2><p>Costa <b>${euro(costo)}</b>${me.piani === 0 && me.pacchetto !== "costruttore" ? ", più il permesso (300.000 €)" : ""}. Scegli la stanza:</p>
    <div class="lista-luoghi">${poss.map((x) => `<button class="luogo-riga stanza ${x.id === (primo && primo.id) ? "scelta-on" : ""}" data-st="${x.id}" ${x.ok ? "" : "disabled"}><span class="ic">${ico(x.ok ? "palazzo" : "chiave")}</span><span style="flex:1;text-align:left"><b>${esc(L.STANZE[x.id].nome)}</b><br><span class="sub">${esc(L.STANZE[x.id].descr)}</span></span><span class="ore">${x.ok ? x.fascia : esc(x.perche)}</span></button>`).join("")}</div>
    <div class="pulsanti"><button id="x">Chiudi</button></div>`, (d, c) => { d.querySelector("#x").onclick = c; d.querySelectorAll("[data-st]").forEach((b) => b.onclick = () => { c(); agisci({ tipo: "piano", funzione: b.dataset.st }); }); });
}
function appPalazzo(me, miTurno) {
  const F = L.FASCE_PALAZZO, n = me.piani, fasciaDi = (num) => F.reduce((r, f, i) => (num >= f.da ? i : r), 0);
  const prossima = F.find((f) => f.da > n);
  const meta = prossima ? `<div class="scheda" style="border-color:var(--oro)"><h4 style="color:var(--oro)">Prossimo traguardo: ${prossima.nome}</h4><span class="sub">Ti ${prossima.da - n === 1 ? "manca 1 piano" : "mancano " + (prossima.da - n) + " piani"}${S.sblocco < prossima.lv ? " e il Livello " + prossima.lv : ""}. Si aprono: ${prossima.fun.map((f) => L.STANZE[f].nome).join(", ")}. Premio: +${prossima.da === F[1].da ? 5 : 10} fama e una vista più alta.</span></div>` : `<div class="scheda"><h4 style="color:var(--oro)">Sei in cima: Grattacielo</h4><span class="sub">Più piani costruisci, più rendi. Il palazzo più alto vale il titolo di Padrone dello Skyline.</span></div>`;
  const COL = ["#8a6d3b", "#b8860b", "#7a5cff"];
  const torre = Array.from({ length: Math.max(n + 2, Math.min(F[2].da + 1, n + 4)) }, (_, i) => i + 1).reverse().map((num) => {
    const f = me.funzioniPiani[num - 1], fi = fasciaDi(num), conf = F.some((x) => x.da === num && num > 1);
    return `${conf ? `<div class="pal-fascia" style="color:${COL[fi]}">— ${F[fi].nome} (dal piano ${F[fi].da}, Livello ${F[fi].lv}) —</div>` : ""}<div class="pal-piano ${f ? "" : "vuoto"}" style="--c:${COL[fi]}"><span class="num">${num}</span><span>${f ? esc(L.STANZE[f]?.nome || f) : num === n + 1 ? "prossimo piano · " + euro(L.costoPiano(me)) : "…"}</span></div>`;
  }).join("") + `<div class="pal-fascia" style="color:${COL[0]}">— Palazzo (dal piano 1) —</div>`;
  const stanze = F.map((fa, i) => `<div class="scheda"><h4 style="color:${COL[i]}">${fa.nome} · dal piano ${fa.da}${fa.lv ? " · Livello " + fa.lv : ""}</h4>${fa.fun.map((f) => `<div style="margin-top:4px"><b>${esc(L.STANZE[f].nome)}</b>${me.funzioniPiani.includes(f) ? ` <span class="tag">ce l'hai</span>` : ""}<div class="sub">${esc(L.STANZE[f].descr)}</div></div>`).join("")}</div>`).join("");
  return `<div class="scheda"><span class="serif" style="font-size:30px">${n} ${n === 1 ? "piano" : "piani"}</span><span class="sub">${n ? "Fascia: " + F[fasciaDi(n)].nome + ". Ogni piano costa un po' più del precedente; i piani che rendono ripagano col tempo." : "Il tuo grattacielo è ancora un sogno. Servono almeno 2 attività aperte per iniziare."}</span>
    ${miTurno && !me.azioneGiornoFatta ? `<button class="oro" data-a2="piano">Costruisci il piano ${n + 1} · ${euro(L.costoPiano(me))}</button>` : `<span class="sub">I piani si costruiscono con la mossa del giorno, durante il tuo turno.</span>`}</div>
    ${meta}<div class="pal-torre">${torre}</div><h4 style="margin:10px 0 4px">Le stanze</h4>${stanze}`;
}
function finestraVeicolo() {
  finestra(`<span class="kick" style="color:var(--oro)">🛥️ Marina dei Re</span><h2>Mezzi di lusso</h2><div class="griglia">${Object.entries(L.N.veicoli).map(([k, v]) => `<button class="sch" data-v="${k}"><h3>${v.nome}</h3><p>${euro(v.prezzo)}<br>rende ${euro(v.prezzo * v.rend)} a Ciclo · +${v.fama} fama</p></button>`).join("")}</div>
    <div class="pulsanti"><button id="x">Chiudi</button></div>`, (d, c) => { d.querySelector("#x").onclick = c; d.querySelectorAll("[data-v]").forEach((el) => el.onclick = () => { c(); agisci({ tipo: "veicolo", veicolo: el.dataset.v }); }); });
}
function finestraPrestito(me) {
  const cap = Math.max(0, L.N.prestitoQuota * S.lotti.filter((l) => l.owner === mioId && l.serie !== "Moli").reduce((a, l) => a + L.valoreLotto(l), 0) - me.debito);
  finestra(`<span class="kick" style="color:var(--pulito)">🏦 Banca Centrale</span><h2>Un prestito</h2><p>Puoi chiedere fino a <b>${euro(cap)}</b>. Costa il 10% a Ciclo, da restituire entro 3 Cicli.</p>
    <div class="campo"><label for="imp">Quanto</label><input id="imp" type="number" value="${Math.round(cap / 2)}"></div>
    <div class="pulsanti"><button id="x">Chiudi</button><button class="oro" id="ok">Chiedi</button></div>`, (d, c) => { d.querySelector("#x").onclick = c; d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "prestito", importo: Number(d.querySelector("#imp").value) }); }; });
}
function finestraContratto() {
  const altri = S.players.filter((x) => x.id !== mioId);
  const lotti = S.lotti.filter((l) => l.owner && l.tipoCasella !== "angolo");
  finestra(`<span class="kick" style="color:var(--setta)">✍️ Contratti</span><h2>Proponi un patto</h2>
    <div class="campo"><label for="a">Con chi</label><select id="a">${altri.map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("")}</select></div>
    <div class="campo"><label for="tipo">Come</label><select id="tipo"><option value="notarile">Dal notaio (lo fa rispettare il gioco, costa il 2%)</option><option value="parola">Sulla parola (nessuno lo fa rispettare)</option></select></div>
    <div class="campo"><label>Subito</label><div class="riga"><input id="ora" type="number" value="0" style="width:140px"> li paga <select id="chiOra"><option value="da">io</option><option value="a">lui/lei</option></select></div></div>
    <div class="campo"><label>Più avanti</label><div class="riga"><input id="dopo" type="number" value="0" style="width:140px"> li paga <select id="chiDopo"><option value="a">lui/lei</option><option value="da">io</option></select> fra <select id="cicli">${[1, 2, 3, 4].map((n) => `<option>${n}</option>`).join("")}</select> Cicli</div></div>
    <div class="campo"><label for="lotto">Un lotto che passa di mano subito (facoltativo)</label><select id="lotto"><option value="">nessuno</option>${lotti.map((l) => `<option value="${l.id}">${esc(l.nome)} (${esc(S.players.find((x) => x.id === l.owner).nome)})</option>`).join("")}</select></div>
    <div class="campo"><label for="testo">Il resto, con parole tue</label><textarea id="testo" rows="3"></textarea></div>
    <div class="pulsanti"><button id="x">Annulla</button><button class="oro" id="ok">Proponi</button></div>`, (d, c) => {
    d.querySelector("#x").onclick = c;
    d.querySelector("#ok").onclick = () => { const g = (q) => d.querySelector(q).value; c(); agisci({ tipo: "contratto", contratto: { a: g("#a"), tipo: g("#tipo"), pagoOra: Number(g("#ora")), chiPagaOra: g("#chiOra"), pagoDopo: Number(g("#dopo")), chiPagaDopo: g("#chiDopo"), cicli: Number(g("#cicli")), lottoCeduto: g("#lotto") || null, garanzia: null, testo: g("#testo") } }); };
  });
}
function fine() {
  if (document.querySelector(".velo")) return;
  finestra(`<span class="kick" style="color:var(--oro)">Fine della serata</span><h2>La Rivelazione</h2>
    <table class="cl"><tr><th>#</th><th>Chi</th><th>Patrimonio</th><th>Fama</th></tr>${S.classifica.map((c, i) => `<tr><td>${i + 1}</td><td>${esc(c.nome)}</td><td>${euro(c.patrimonio)}</td><td>${c.fama}</td></tr>`).join("")}</table>
    <p class="kick" style="color:var(--muted);margin-top:14px">I titoli</p>${S.titoli.map((t) => `<p><b>${esc(t.titolo)}:</b> ${esc(t.a)}</p>`).join("")}
    <p class="kick" style="color:var(--muted);margin-top:14px">Le sette</p>${S.rivelazione.length ? S.rivelazione.map((r) => `<p><b style="color:var(--setta)">${esc(r.setta)}</b> — Gran Maestro ${esc(r.gm)}, membri: ${r.membri.map(esc).join(", ")}, tesoro ${euro(r.tesoro)}</p>`).join("") : "<p>Nessuna setta è nata in questa partita.</p>"}
    <div class="pulsanti"><button class="oro" id="nuova">Nuova partita</button></div>`, (d, c) => d.querySelector("#nuova").onclick = () => { c(); try { localStorage.removeItem("laguna_online"); } catch (e) { } S = null; partita = null; schermataCasa(); });
}

for (const f of ["laguna", "marina", "mappa", ...Object.values(SCENE).map((x) => x.slice(4, -4))]) { const i = new Image(); i.src = "img/" + f + ".jpg"; }
// il telefono si chiude anche con Esc o toccando fuori
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && telAperto && !document.querySelector(".velo")) { telAperto = false; if (S) disegnaTelefono(io()); } });
document.addEventListener("pointerdown", (e) => { if (telAperto && S && !document.querySelector(".velo") && !e.target.closest("#telefonoBox") && !e.target.closest("[data-a=\"imprese\"]")) { telAperto = false; disegnaTelefono(io()); } });
collegaEsplora();
avvio();
