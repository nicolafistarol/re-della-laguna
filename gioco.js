import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const SB_URL = "https://eqnrzboulnzkjuyhqsvu.supabase.co";
const SB_KEY = "sb_publishable_yTidV9j2WvfIA-VWrFVJQA_xUnfWX4_";
const sb = createClient(SB_URL, SB_KEY);
const db = sb.schema("laguna");
import { ico } from "./icone.js?v=51";
const L = window.Laguna;
const euro = L.euro;
const $ = (q) => document.querySelector(q);
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const VELOCE = location.search.includes("veloce");
const VELOCE_2D = location.search.includes("2d");
const LOCALE = location.search.includes("locale");  // ?locale = partita contro il computer, senza server
// Il tabellone 3D (il diorama: la foto in rilievo) si carica a parte, con un tempo massimo.
// Se non arriva o non parte, si gioca lo stesso sulla foto piatta e un avviso dice il perché. ?cubetti = il vecchio mondo a cubetti, solo per confronto.
let Tre = null, motivo3D = "", provato3D = false;
// v86: il mondo 3D libero (si gira e si avvicina da ogni lato). Si sceglie dal pannello Vista e resta ricordato; ?foto torna al diorama.
const CUBETTI = location.search.includes("cubetti") || (!location.search.includes("foto") && (() => { try { return localStorage.getItem("laguna_motore") === "libero"; } catch (e) { return false; } })());
import(CUBETTI ? "./cubetti.js?v=88" : "./tre.js?v=88").then((m) => { Tre = m; motivo3D = ""; }, (e) => { console.warn("Tabellone 3D non caricato:", e); motivo3D = "La grafica 3D non si è scaricata (connessione o un blocco del browser)."; }).then(() => { if (S) disegna(); });
setTimeout(() => { if (!Tre && !motivo3D) { motivo3D = "La grafica 3D ci sta mettendo troppo a scaricarsi: appena arriva, parte da sola."; if (S) disegna(); } }, 12000);
import * as Pano from "./panorama.js?v=51";
// il tabellone 3D e' la vista normale. La foto piatta si sceglie dal selettore "Vista" (chiave nuova: la vecchia scelta laguna_3d="0" non conta piu')
let TRE3D = false;
let camminaAttivo = false; // v87: di notte cammini col tuo personaggio nel mondo 3D
function vuole3D() { try { return localStorage.getItem("laguna_vista") !== "piatta"; } catch (e) { return true; } }
// avviso fisso quando il 3D doveva partire e non e' partito: dice il motivo e come riprovare
function avviso3D() {
  const c = document.querySelector("#avviso3d"), serve = !TRE3D && !VELOCE_2D && motivo3D && vuole3D() && S && !(S.fase === "notte" && S.notte);
  if (!serve) { if (c) c.remove(); return; }
  if (c) { if (c.dataset.m === motivo3D) return; c.remove(); }
  const d = document.createElement("div"); d.id = "avviso3d"; d.className = "vetro"; d.dataset.m = motivo3D;
  d.innerHTML = `<span><b>Il tabellone 3D non è partito.</b> ${esc(motivo3D)} Intanto giochi sulla foto piatta: il gioco è lo stesso.</span><button class="piccolo oro" id="av3dSi">Riprova</button><button class="piccolo" id="av3dNo" aria-label="Chiudi l'avviso">✕</button>`;
  document.body.appendChild(d);
  d.querySelector("#av3dSi").onclick = () => location.reload();
  d.querySelector("#av3dNo").onclick = () => { motivo3D = ""; d.remove(); };
}
import * as Loc from "./locale.js?v=88";   // ?veloce = senza animazioni (per le prove)
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const COL_SERIE = { Spezie: "#9b5a2c", Lanterne: "#ff8a3d", Terracotta: "#d9480f", Giungla: "#2b9348", Perla: "#f2a7c3", Diamante: "#e0f7ff", Rame: "#b87333", Sabbia: "#e9c46a", Corallo: "#14b8a6", Neon: "#ff4fa3", Velluto: "#b5179e", Acciaio: "#5c7f99", Vetro: "#2f6fe0", Oro: "#c9a24a", Platino: "#8d99ae", Moli: "#9aa", Salina: "#f4f1de", Mangrovie: "#1b5e3b", Smeraldo: "#10b981", Tramonto: "#f97316", Cobalto: "#1e40af" };
const SCENE = { Ambra: "img/ambra.jpg", Palma: "img/palma.jpg", Flamingo: "img/flamingo.jpg", Sole: "img/sole.jpg", Corona: "img/corona.jpg" };

let utente = null, partita = null, mioId = null, S = null, canale = null;
let telAperto = false, app = null, saldoNascosto = false, attesa = false, principianti = (() => { try { return localStorage.getItem("laguna_guidata") !== "0"; } catch (e) { return true; } })(), timerSala = null, durata = leggiDurata();
const visti = new Set();
// come finisce la partita: { modo: "cicli", cicli } · { modo: "obiettivo", obiettivo } · { modo: "libera" }
function leggiDurata() {
  try { const j = JSON.parse(localStorage.getItem("laguna_durata2") || "null"); if (j && j.modo) return j; } catch (e) { }
  return { modo: "cicli", cicli: 8 };
}
function salvaDurata() { try { localStorage.setItem("laguna_durata2", JSON.stringify(durata)); } catch (e) { } }
const ORE_CICLO = 15; // minuti circa per Ciclo
function sceltaDurataHtml() {
  const d = durata;
  const sec = d.modo === "cicli"
    ? `<select id="durN" style="flex:2">${L.N.durataCicli.filter((n) => n !== 10).map((n) => `<option value="${n}" ${d.cicli === n ? "selected" : ""}>${n} Cicli · circa ${testoOre(n * ORE_CICLO)}</option>`).join("")}</select>`
    : d.modo === "obiettivo"
      ? `<select id="durN" style="flex:2">${L.N.obiettivi.map((n) => `<option value="${n}" ${d.obiettivo === n ? "selected" : ""}>Vince il primo a ${euro(n)}</option>`).join("")}</select>`
      : `<span class="sub" style="flex:2">Non finisce da sola. Solo tu, che la crei, la chiudi dal telefono quando volete.</span>`;
  return `<div class="posto" style="flex-wrap:wrap"><span style="flex:1">Come finisce</span><select id="durModo" style="flex:2">
      <option value="cicli" ${d.modo === "cicli" ? "selected" : ""}>Dopo un numero di Cicli</option>
      <option value="obiettivo" ${d.modo === "obiettivo" ? "selected" : ""}>A obiettivo: il primo che arriva a…</option>
      <option value="libera" ${d.modo === "libera" ? "selected" : ""}>Libera: la chiudo io</option></select></div>
    <div class="posto">${d.modo === "libera" ? "" : `<span style="flex:1"></span>`}${sec}</div>`;
}
function testoOre(min) { const h = Math.floor(min / 60), m = min % 60; return (h ? h + (h === 1 ? " ora" : " ore") : "") + (m ? (h ? " e " : "") + m + " minuti" : ""); }
function collegaDurata(ridisegna) {
  $("#durModo").onchange = (e) => { const m = e.target.value; durata = m === "cicli" ? { modo: m, cicli: 8 } : m === "obiettivo" ? { modo: m, obiettivo: L.N.obiettivi[1] } : { modo: m }; salvaDurata(); ridisegna(); };
  if ($("#durN")) $("#durN").onchange = (e) => { if (durata.modo === "cicli") durata.cicli = +e.target.value; else durata.obiettivo = +e.target.value; salvaDurata(); };
}
function testoDurata(s) {
  const m = s.modoFine || "cicli";
  if (m === "obiettivo") return "Vince il primo a " + euro(s.obiettivo);
  if (m === "libera") return "Partita libera" + (s.chiusura ? ": ultima notte" : "");
  return (s.cicli || L.N.cicli) + " Cicli";
}

function toast(t) { let box = $("#toasts"); if (!box) { box = document.createElement("div"); box.id = "toasts"; document.body.appendChild(box); } const d = document.createElement("div"); d.className = "toast"; d.textContent = t; box.appendChild(d); Suono.avviso(); while (box.children.length > 3) box.firstChild.remove(); setTimeout(() => d.remove(), 4500); }
function esciDallaPartita(msg) {
  try { localStorage.removeItem("laguna_online"); } catch (e) { }
  if (canale) { sb.removeChannel(canale); canale = null; }
  clearInterval(timerVista); clearInterval(timerPresenza); presenze = {}; S = null; partita = null; mioId = null; telAperto = false; app = null;
  document.querySelectorAll(".velo").forEach((x) => x.remove());
  if (LOCALE) { location.href = location.pathname + "?locale&nuova"; return; } // nella prova da solo si torna alla schermata della prova
  schermataCasa(); if (msg) toast(msg);
}
function salvaLocale() { try { localStorage.setItem("laguna_online", JSON.stringify({ partita, mioId })); } catch (e) { } }
function leggiLocale() { try { return JSON.parse(localStorage.getItem("laguna_online") || "{}"); } catch (e) { return {}; } }
function sfondo(img) { $("#sfondo").style.backgroundImage = `url('${img}')`; }

// ------------------------------------------------------------ suoni (generati dal browser) e musica (due brani originali in musica/)
// Tutto passa da WebAudio: sull'iPhone il volume di un <audio> non si cambia da codice, quello di un GainNode si'.
//   master ── musica (un brano alla volta, in loop senza salto, con dissolvenza vera)
//          └─ effetti (suoni sintetizzati: niente file)
// Il tasto del suono spegne tutto (master a zero e brano fermato).
const Suono = (() => {
  let ctx = null, master = null, busMusica = null, busEffetti = null, eco = null, acceso = true, modo = null;
  try { acceso = localStorage.getItem("laguna_audio") !== "0"; } catch (e) { }
  const VOL_MASTER = 0.9, VOL_MUSICA = 0.34, VOL_EFFETTI = 0.6;
  function avvia() {
    if (ctx) { if (ctx.state !== "running") ctx.resume().catch(() => { }); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    master = ctx.createGain(); master.gain.value = acceso ? VOL_MASTER : 0; master.connect(ctx.destination);
    busMusica = ctx.createGain(); busMusica.gain.value = VOL_MUSICA; busMusica.connect(master);
    busEffetti = ctx.createGain(); busEffetti.gain.value = VOL_EFFETTI; busEffetti.connect(master);
    // un'eco morbida per dare spazio agli effetti
    eco = ctx.createDelay(1); eco.delayTime.value = 0.33; const fb = ctx.createGain(); fb.gain.value = 0.32; const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
    eco.connect(lp); lp.connect(fb); fb.connect(eco); lp.connect(busEffetti);
    if (ctx.state !== "running") ctx.resume().catch(() => { });
    if (!modo) modo = "giorno"; // la musica parte gia' dalla prima schermata, al primo tocco
    suonaBrano();
  }
  const ok = () => ctx && acceso;
  function nota(f, t0, dur, vol, tipo = "sine", conEco = true, fFine) {
    if (!ok()) return;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipo; o.frequency.setValueAtTime(f, t0);
    if (fFine) o.frequency.exponentialRampToValueAtTime(fFine, t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(busEffetti); if (conEco) g.connect(eco); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function rumore(t0, dur, vol, freq, q = 1.2, tipo = "bandpass") {
    if (!ok()) return;
    const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; f.type = tipo; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(busEffetti); s.start(t0);
  }
  const adesso = () => ctx.currentTime + 0.01;
  // ---- la colonna sonora: due brani originali (musica/giorno.mp3 e musica/notte.mp3, composti da musica/compositore.py,
  // nessun diritto). Si scaricano una volta, si decodificano e si suonano con un AudioBufferSource in loop:
  // il punto di giunta e' esatto (32 battute), quindi niente "buco" dell'MP3. Mai due brani insieme:
  // quello vecchio sfuma e si ferma, poi entra quello nuovo.
  const DURATA = { giorno: 32 * 4 * 60 / 92, notte: 32 * 4 * 60 / 76 }; // secondi veri del brano composto
  const buffer = {}, inArrivo = {}; let voce = null, giro = 0;
  function carica(k) {
    if (buffer[k]) return Promise.resolve(buffer[k]);
    if (!inArrivo[k]) inArrivo[k] = fetch("musica/" + k + ".mp3?v=64").then((r) => { if (!r.ok) throw new Error("musica"); return r.arrayBuffer(); })
      .then((ab) => new Promise((si, no) => { const p = ctx.decodeAudioData(ab, si, no); if (p && p.then) p.then(si, no); }))
      .then((b) => { buffer[k] = b; return b; }).catch((e) => { delete inArrivo[k]; throw e; });
    return inArrivo[k];
  }
  // dove comincia davvero il suono: alcuni browser lasciano in testa il silenzio dell'MP3 (circa 25 ms)
  function inizioVero(b) {
    const d = b.getChannelData(0), max = Math.min(d.length, Math.round(b.sampleRate * 0.08));
    for (let i = 0; i < max; i++) if (Math.abs(d[i]) > 0.0015) return Math.max(0, i - 8) / b.sampleRate;
    return 0;
  }
  function spegniVoce(sec) {
    const v = voce; voce = null; if (!v) return 0;
    const t = ctx.currentTime;
    try { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0, t + sec); v.src.stop(t + sec + 0.05); } catch (e) { }
    return sec;
  }
  function suonaBrano() {
    if (!ctx || !modo) return;
    const k = modo === "notte" ? "notte" : "giorno", mio = ++giro;
    if (!acceso) { spegniVoce(0.15); return; }
    if (voce && voce.k === k) return;
    const attesa = spegniVoce(0.9); // il vecchio sfuma e tace...
    carica(k).then((b) => {
      if (mio !== giro || !acceso) return; // nel frattempo e' cambiato qualcosa: lascio stare
      const parte = Math.max(ctx.currentTime + 0.05, ctx.currentTime + attesa - 0.25); // ...poi entra il nuovo
      const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = b; src.loop = true;
      const t0 = inizioVero(b); src.loopStart = t0; src.loopEnd = Math.min(b.duration, t0 + (DURATA[k] || b.duration));
      g.gain.setValueAtTime(0, parte); g.gain.linearRampToValueAtTime(1, parte + 1.4);
      src.connect(g); g.connect(busMusica); src.start(parte, t0);
      voce = { k, src, g };
    }).catch(() => { });
  }
  function ambiente(m, forza) {
    if (m === modo && !forza) return; modo = m;
    if (ctx) suonaBrano();
  }
  // la musica si abbassa quando un suono importante deve sentirsi bene (Alba, vittoria), poi risale
  function sottofondo(sec) { if (!ok()) return; const t = ctx.currentTime, g = busMusica.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(VOL_MUSICA * 0.3, t + 0.25); g.linearRampToValueAtTime(VOL_MUSICA * 0.3, t + sec); g.linearRampToValueAtTime(VOL_MUSICA, t + sec + 1.2); }
  // scheda nascosta: la musica tace, gli avvisi no
  document.addEventListener("visibilitychange", () => { if (!ctx || !busMusica) return; const t = ctx.currentTime, g = busMusica.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(document.hidden ? 0 : VOL_MUSICA, t + 0.6); });
  const peso = (importo) => Math.max(0, Math.min(3, Math.floor(Math.log10(Math.max(1, importo || 0)) - 4))); // 10k→0, 100k→1, 1M→2, 10M→3
  return {
    avvia, ambiente,
    acceso: () => acceso,
    cambia() {
      acceso = !acceso; try { localStorage.setItem("laguna_audio", acceso ? "1" : "0"); } catch (e) { }
      avvia(); if (!ctx) return;
      const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(acceso ? VOL_MASTER : 0, t + 0.12);
      suonaBrano();
    },
    // dadi: colpetti sul tavolo che rallentano, poi si fermano
    dado() { if (!ok()) return; const t = adesso(); let x = 0; for (let i = 0; i < 9; i++) { x += 0.05 + i * 0.012; rumore(t + x + Math.random() * 0.02, 0.06, 0.55 - i * 0.045, 1800 + Math.random() * 1800); nota(190 + Math.random() * 60, t + x, 0.05, 0.05 - i * 0.004, "triangle", false); } },
    // un passo sul tabellone: un "tic" morbido, solo per le tue mosse (quelle degli altri non fanno rumore)
    passo(mio) { if (!ok() || !mio) return; nota(1320, adesso(), 0.06, 0.035, "sine", false, 880); },
    soldi(su, importo) { if (!ok()) return; const t = adesso(), n = peso(importo); if (su) { [1046.5, 1318.5, 1568, 2093, 2637].slice(0, 2 + n).forEach((f, i) => nota(f, t + i * 0.075, 0.3 + i * 0.05, 0.07)); } else { nota(392, t, 0.3, 0.06, "triangle"); nota(311.1, t + 0.12, 0.45, 0.06, "triangle"); if (n >= 2) nota(233.1, t + 0.26, 0.6, 0.06, "triangle"); } },
    // acquisto: cassetto del registratore + campanello
    acquisto() { if (!ok()) return; const t = adesso(); rumore(t, 0.09, 0.5, 900, 0.8); rumore(t + 0.07, 0.05, 0.4, 3200, 2); nota(1975.5, t + 0.12, 0.7, 0.07); nota(2637, t + 0.14, 0.9, 0.05); nota(3951, t + 0.14, 0.5, 0.02); },
    // affitto incassato: monete che cadono (di piu' se la cifra e' grande)
    affittoIncassato(importo) { if (!ok()) return; const t = adesso(), n = 3 + peso(importo) * 2; for (let i = 0; i < n; i++) { const f = 2200 + Math.random() * 1800; nota(f, t + i * 0.055 + Math.random() * 0.02, 0.18, 0.045, "sine", i % 2 === 0); rumore(t + i * 0.055, 0.03, 0.12, 5200, 3); } nota(1568, t + n * 0.055 + 0.05, 0.5, 0.06); },
    // affitto pagato: il portafogli che si svuota (tre note che scendono)
    affittoPagato(importo) { if (!ok()) return; const t = adesso(), n = peso(importo); rumore(t, 0.12, 0.3, 500, 0.7); [392, 329.6, 261.6, 196].slice(0, 2 + Math.min(2, n)).forEach((f, i) => nota(f, t + 0.05 + i * 0.13, 0.4, 0.07, "triangle")); },
    // l'Alba: campane lontane e un accordo che si apre
    alba() { if (!ok()) return; sottofondo(3.2); const t = adesso(); [[392, 0], [587.3, 0.35], [784, 0.7], [987.8, 1.05], [1174.7, 1.4]].forEach(([f, d]) => { nota(f, t + d, 2.2, 0.06); nota(f * 2.01, t + d, 1.4, 0.015); }); nota(196, t, 3, 0.05, "triangle"); },
    // cala la notte: due note basse e un soffio
    notte() { if (!ok()) return; const t = adesso(); nota(220, t, 1.6, 0.06, "triangle"); nota(164.8, t + 0.5, 2.2, 0.07, "triangle"); nota(659.3, t + 1, 1.8, 0.025); rumore(t, 1.2, 0.12, 700, 0.5, "lowpass"); },
    // polizia: sirena a due toni, breve
    polizia() { if (!ok()) return; const t = adesso(); for (let i = 0; i < 4; i++) { nota(i % 2 ? 620 : 830, t + i * 0.3, 0.3, 0.05, "sawtooth", false); nota(i % 2 ? 622 : 833, t + i * 0.3, 0.3, 0.03, "square", false); } },
    // la serratura della cella
    cella() { if (!ok()) return; const t = adesso(); rumore(t, 0.2, 0.6, 300, 0.8); nota(110, t, 0.5, 0.12, "triangle", true, 55); rumore(t + 0.28, 0.08, 0.5, 2400, 3); },
    // salita di livello: arpeggio d'oro che sale
    livello() { if (!ok()) return; sottofondo(1.6); const t = adesso(); [523.3, 659.3, 784, 1046.5, 1318.5, 1568].forEach((f, i) => nota(f, t + i * 0.085, 0.6 + i * 0.08, 0.065)); nota(2093, t + 0.6, 1.4, 0.05); },
    // vittoria: una piccola fanfara
    vittoria() { if (!ok()) return; sottofondo(4.5); const t = adesso(); const F = [[392, 0, .22], [392, .22, .22], [392, .44, .22], [523.3, .66, .7], [466.2, 1.36, .22], [523.3, 1.58, .22], [587.3, 1.8, .22], [784, 2.02, 1.6]]; F.forEach(([f, d, l]) => { nota(f, t + d, l + 0.25, 0.07, "sawtooth"); nota(f / 2, t + d, l + 0.25, 0.06, "triangle"); nota(f * 1.5, t + d, l + 0.2, 0.025); }); [1046.5, 1318.5, 1568, 2093].forEach((f, i) => nota(f, t + 2.1 + i * 0.09, 1.6, 0.045)); },
    // il martelletto dell'asta
    asta() { if (!ok()) return; const t = adesso(); [0, 0.16].forEach((d) => { rumore(t + d, 0.05, 0.7, 1100, 1.5); nota(150, t + d, 0.12, 0.14, "triangle", true, 90); }); },
    // una carta girata sul tavolo
    carta() { if (!ok()) return; const t = adesso(); rumore(t, 0.09, 0.3, 4200, 0.9, "highpass"); },
    // l'attimo prima di sapere com'e' andata: un battito che accelera
    suspense() { if (!ok()) return; const t = adesso(); [0, 0.34, 0.62, 0.84, 1.0].forEach((d, i) => nota(70, t + d, 0.18, 0.13 + i * 0.01, "sine", false, 45)); },
    esito(bene) { if (!ok()) return; const t = adesso(); if (bene) { nota(659.3, t, 0.3, 0.07); nota(987.8, t + 0.09, 0.6, 0.07); } else { nota(207.7, t, 0.5, 0.08, "sawtooth"); nota(155.6, t + 0.14, 0.8, 0.08, "sawtooth"); } },
    clic() { if (!ok()) return; nota(1500, adesso(), 0.035, 0.02, "sine", false, 1100); },
    avviso() { if (!ok()) return; const t = adesso(); nota(880, t, 0.25, 0.04); nota(1174.7, t + 0.1, 0.35, 0.04); },
    telefono() { if (!ok()) return; const t = adesso(); for (let i = 0; i < 2; i++) { nota(1318.5, t + i * 0.18, 0.12, 0.05, "sine", false); nota(1760, t + i * 0.18 + 0.06, 0.12, 0.05, "sine", false); } },
  };
})();
// il primo tocco sblocca l'audio (sull'iPhone serve un gesto vero: tocco, clic o tasto)
for (const ev of ["pointerdown", "touchend", "click", "keydown"]) addEventListener(ev, () => Suono.avvia(), { capture: true, passive: true });
if (location.search.includes("provasuono")) window.Suono = Suono; // solo per le prove automatiche dell'audio

// qualche icona in piu' (Lucide, licenza ISC) per i tasti e gli avvisi: cosi' niente emoji, che cambiano da un computer all'altro
const ICONE_E = {
  "suono-si": '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  "suono-no": '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
  lucchetto: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  attenzione: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  corona: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',
  libro: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  fatto: '<path d="M20 6 9 17l-5-5"/>',
  altro: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  giu: '<path d="m6 9 6 6 6-6"/>',
  su: '<path d="m18 15-6-6-6 6"/>',
  freccia: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  medaglia: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  candela: '<path d="M9 9h6v12H9z"/><path d="M12 2c1.5 1.6 2 2.7 2 3.6A2 2 0 0 1 12 7.5a2 2 0 0 1-2-1.9c0-.9.5-2 2-3.6z"/>',
  binocolo: '<circle cx="6.5" cy="16" r="3.5"/><circle cx="17.5" cy="16" r="3.5"/><path d="M10 16h4"/><path d="M4 13 6 5h3l1 8"/><path d="m20 13-2-8h-3l-1 8"/>',
  pacco: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
};
function icoE(nome, cls = "") { const p = ICONE_E[nome]; return p ? `<svg class="lic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>` : ico(nome, cls); }

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
// doppio clic: la stessa mossa ripetuta entro 1,2 secondi non parte due volte
let ultimaAz = "", ultimaAzT = 0;
// v75: prima di una mossa sporca, chi ha la Fedina pulita (2 o piu') riceve un avviso
let saltaAvviso = false;
function agisciSubito(azione) { saltaAvviso = true; return agisci(azione); }
function agisci(azione) {
  const salta = saltaAvviso; saltaAvviso = false;
  if (!salta && S && azione && typeof conFedina === "function" && rischiaFedina(io()) && L.macchiaAzione && L.macchiaAzione(S, mioId, azione)) return conFedina(azione);
  const k = JSON.stringify(azione), ora = Date.now();
  if (k === ultimaAz && ora - ultimaAzT < 1200) return filaAzioni;
  ultimaAz = k; ultimaAzT = ora;
  filaAzioni = filaAzioni.then(() => inviaAzione(azione)).catch(() => { }); return filaAzioni;
}
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
  avviaPresenza();
}

// ------------------------------------------------------------ chi e' collegato (punto 33)
// Ogni 30 secondi la pagina dice al server "ci sono". Chi non si fa vivo da 3 minuti: al suo posto gioca il computer finche' non torna.
let presenze = {}, timerPresenza = null;
async function segnaPresenza() {
  if (LOCALE || !partita) return;
  const r = await chiama({ comando: "presente", partita });
  if (r && r.presenze) {
    const prima = S ? S.players.filter(puoSostituire).map((q) => q.id).join() : "";
    presenze = {}; for (const x of r.presenze) presenze[x.id] = x;
    // v81: se qualcuno ha smesso (o ripreso) a rispondere, i nomi in alto si aggiornano subito
    if (S && !animando && S.players.filter(puoSostituire).map((q) => q.id).join() !== prima) disegna();
  }
}
function avviaPresenza() {
  if (LOCALE) return;
  clearInterval(timerPresenza); segnaPresenza();
  timerPresenza = setInterval(segnaPresenza, 30000);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && partita && !LOCALE) segnaPresenza().then(() => { if (S) caricaVista(); }); });
// chi ha creato la partita puo' far giocare il computer al posto di chi non si fa vivo da 3 minuti (v81: prima 1 minuto, e il pulsante era solo nel telefono)
function puoSostituire(q) { return !LOCALE && S && mioId === S.players[0].id && !S.fine && q.id !== mioId && !q.bot && presenze[q.id] && presenze[q.id].persona && (presenze[q.id].secondi === null || presenze[q.id].secondi >= 180); }
// la scritta accanto al nome: "non collegato", "gioca il computer", "uscito"
function statoCollegamento(p) {
  if (LOCALE || !p || p.id === mioId) return "";
  if (p.uscito) return "uscito · gioca il computer";
  if (p.assente) return "non collegato · gioca il computer";
  const x = presenze[p.id];
  if (p.bot || !x || x.secondi === null || x.secondi < 75) return "";
  return "non collegato da " + Math.max(1, Math.round(x.secondi / 60)) + " min";
}

// ------------------------------------------------------------ ingresso
async function avvio() {
  if (LOCALE) {
    partita = "locale"; mioId = "g1";
    const m = /seed=(\d+)/.exec(location.search);
    if (location.search.includes("prova")) { Loc.nuovaProva(nomeLocale()); history.replaceState(null, "", location.pathname + "?locale"); }
    else if (location.search.includes("nuova") || !Loc.carica()) {
      const seed = m ? +m[1] : undefined;
      if (VELOCE || location.search.includes("subito")) Loc.nuova(nomeLocale(), seed, durata);
      else return schermataProvaLocale(seed);
    }
    return caricaVista();
  }
  const { data: { session } } = await sb.auth.getSession();
  utente = session?.user || null;
  const loc = leggiLocale();
  if (!utente) return schermataNome();
  if (codiceDalLink()) return entraConCodice(codiceDalLink());
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
function nomeLocale() { try { return localStorage.getItem("laguna_nome_locale") || "Tu"; } catch (e) { return "Tu"; } }
// prova da soli: prima di partire si sceglie come finisce
function schermataProvaLocale(seed) {
  const disegna = () => {
    schermoIngresso(`<div class="cartaI vetro" style="width:min(560px,94vw)">
      <span class="kick" style="color:var(--oro)">Prova da solo</span>
      <span class="serif" style="font-size:44px;line-height:1">Re della Laguna</span>
      <span class="sub">Tu contro Rocco, Greta e Dario (giocatori-computer).</span>
      <div class="campo"><label for="nomeLoc">Come ti chiami?</label><input id="nomeLoc" maxlength="24" placeholder="Scrivi il tuo nome" value="${esc(nomeLocale() === "Tu" ? "" : nomeLocale())}"></div>
      <div class="vetro" style="padding:14px;border-radius:16px;display:flex;flex-direction:column;gap:8px">${sceltaDurataHtml()}
        <label class="check"><input type="checkbox" id="princL" ${principianti ? "checked" : ""}> Partita guidata: Vera ti dà consigli e le cose si scoprono piano piano (consigliata la prima volta)</label></div>
      <button class="oro grande" id="via">Inizia</button>${tastoGuida()}
      <a href="${location.pathname}" style="align-self:stretch;text-align:center;padding:12px;border-radius:12px;text-decoration:none;font-weight:800;color:#fff;background:rgba(79,195,247,.18);border:1px solid rgba(79,195,247,.6)">👥 Gioca online con gli amici</a></div>`);
    collegaTastoGuida(); if (guidaMaiVista()) apriGuida(0);
    $("#princL").onchange = (e) => { principianti = e.target.checked; try { localStorage.setItem("laguna_guidata", principianti ? "1" : "0"); } catch (er) { } };
    collegaDurata(disegna);
    $("#nomeLoc").oninput = (e) => { try { localStorage.setItem("laguna_nome_locale", e.target.value.trim()); } catch (er) { } };
    $("#via").onclick = () => { Loc.nuova(nomeLocale(), seed, durata, principianti); history.replaceState(null, "", location.pathname + "?locale"); caricaVista(); };
  };
  disegna();
}
function schermoIngresso(html) { $("#mondo").style.display = "none"; $("#telefonoBox").innerHTML = ""; sfondo("img/laguna.jpg"); $("#sfondo").style.filter = "none"; $("#radice").innerHTML = `<div class="ingresso">${html}</div>`; }
// il codice d'invito puo' arrivare nel link: ?codice=PALMA-4821
function codiceDalLink() { const m = /[?&]codice=([A-Za-z]+-\d+)/.exec(location.search); return m ? m[1].toUpperCase() : ""; }
async function entraConCodice(codice) {
  const r = await chiama({ comando: "entra", codice, nome: nomeMio() });
  if (r.errore) { toast(r.errore); return schermataCasa(); }
  history.replaceState(null, "", location.pathname);
  partita = r.partita; mioId = r.player; salvaLocale(); sala();
}
function schermataNome() {
  const cod = codiceDalLink();
  schermoIngresso(`<div class="cartaI vetro">
    <span class="kick" style="color:var(--oro)">${cod ? "Ti hanno invitato a una partita · codice " + esc(cod) : "Benvenuto nella Laguna"}</span>
    <span class="serif" style="font-size:52px;line-height:1">Re della Laguna</span>
    <div class="campo"><label for="nome">Come ti chiami?</label><input id="nome" maxlength="24" placeholder="Il tuo nome"></div>
    <button class="oro grande" id="entra">Entra</button>
    <span style="font-size:12px;color:var(--muted)">Niente email e niente password: ti ricordiamo su questo computer.</span></div>`);
  $("#entra").onclick = async () => {
    const nome = $("#nome").value.trim(); if (!nome) return toast("Scrivi il tuo nome.");
    const { data, error } = await sb.auth.signInAnonymously({ options: { data: { nome } } });
    if (error) return toast("Non riesco a farti entrare: " + error.message);
    utente = data.user; if (cod) return entraConCodice(cod); schermataCasa();
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
      <div class="vetro" style="padding:14px;border-radius:16px;display:flex;flex-direction:column;gap:8px;border:1px solid rgba(79,195,247,.6)">
        <b>Un amico ti ha invitato? Scrivi il codice</b>
        <div class="riga"><input id="codice" placeholder="es. PALMA-4821" style="flex:1;text-transform:uppercase"><button class="oro" id="unisciti">Entra</button></div>
      </div>
      <div class="vetro" style="padding:14px;border-radius:16px;display:flex;flex-direction:column;gap:8px">
        <b>Oppure crea tu una partita</b>
        <div class="posto"><div class="pall" style="background:var(--oro)">${esc(nomeMio()[0] || "T")}</div><span style="flex:1">${esc(nomeMio())} (tu)</span></div>
        ${righe.map((r, i) => `<div class="posto"><div class="pall" style="background:${r.tipo === "amico" ? "#4fc3f7" : "#8a8a8a"}">${i + 2}</div>
          <select data-i="${i}" class="tipo" style="flex:1"><option value="amico" ${r.tipo === "amico" ? "selected" : ""}>Posto per un amico</option>${STR.map((s) => `<option value="${s}" ${r.tipo === "computer" && r.strat === s ? "selected" : ""}>Computer: ${s}</option>`).join("")}</select></div>`).join("")}
        <div class="riga"><button class="piccolo" id="piu">+ posto</button><button class="piccolo" id="meno">− posto</button></div>
        ${sceltaDurataHtml()}
        <label class="check"><input type="checkbox" id="princ" ${principianti ? "checked" : ""}> Partita guidata: Vera dà consigli e le cose si scoprono piano piano. Togli la spunta se conoscete già il gioco.</label>
        <button class="oro grande" id="crea">Crea la partita</button>
        <a class="piccolo" href="?locale&nuova" style="align-self:center;color:var(--muted)">Oppure prova da solo contro 3 giocatori-computer (senza internet)</a>
      </div>${tastoGuida()}
</div>`);
    document.querySelectorAll(".tipo").forEach((s) => s.onchange = () => { const r = righe[s.dataset.i]; if (s.value === "amico") { r.tipo = "amico"; r.strat = null; } else { r.tipo = "computer"; r.strat = s.value; } });
    $("#princ").onchange = (e) => { principianti = e.target.checked; try { localStorage.setItem("laguna_guidata", principianti ? "1" : "0"); } catch (er) { } };
    collegaDurata(disegnaCasa); collegaTastoGuida(); if (guidaMaiVista()) apriGuida(0);
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
    // chi ha chiuso la pagina della sala da piu' di un minuto risulta "non collegato" (vale per chi ha la versione nuova)
    const via = (x) => x.user_id && !x.bot && x.player_id !== mioId && x.visto_il && Date.now() - Date.parse(x.visto_il) > 60000;
    schermoIngresso(`<div class="cartaI vetro" style="width:min(560px,94vw)">
      <span class="kick" style="color:var(--oro)">Sala d'attesa</span>
      <span class="kick" style="color:var(--muted)">Codice d'invito</span>
      <div class="riga"><span class="serif" style="font-size:44px;letter-spacing:.04em">${esc(p.codice)}</span><button class="piccolo" id="copia">Copia</button></div>
      <span class="sub">Manda agli amici il <b>link d'invito</b>: lo aprono, scrivono il nome ed entrano da soli. Oppure dài il codice: lo scrivono nel riquadro "Un amico ti ha invitato?".</span>
      <button class="oro" id="copiaLink">📋 Copia il link d'invito</button>
      ${(g || []).map((x) => `<div class="posto"><div class="pall" style="background:${x.bot ? "#8a8a8a" : x.user_id ? "#4fc3f7" : "transparent;border:2px dashed rgba(255,255,255,.4)"}">${x.user_id || x.bot ? esc(x.nome[0]) : ""}</div>
        <span style="flex:1"><b>${x.user_id || x.bot ? esc(x.nome) : "Posto libero"}</b>${x.player_id === mioId ? " (tu)" : ""}</span>
        <span style="font-size:12px;color:${via(x) ? "#ffb3b3" : x.user_id && !x.bot ? "var(--pulito)" : "var(--muted)"}">${x.bot ? "Computer" : via(x) ? "Non collegato" : x.user_id ? "Pronto" : "In attesa"}</span>${creatore && !x.bot && x.player_id !== mioId ? `<button class="piccolo" data-computer="${x.player_id}" title="Al suo posto gioca il computer">🤖 Metti il computer</button>` : ""}</div>`).join("")}
      ${creatore ? `<button class="oro grande" id="inizia" ${manca ? "disabled" : ""}>${manca ? `Mancano ${manca} amici` : "Inizia la partita"}</button>` : `<span class="sub">Aspetta che chi ha creato la partita la faccia iniziare.</span>`}
      ${tastoGuida()}<button class="piccolo" id="esci" style="align-self:flex-start">Esci dalla sala</button></div>`);
    collegaTastoGuida();
    $("#copia").onclick = () => { navigator.clipboard?.writeText(p.codice).then(() => toast("Codice copiato."), () => { }); };
    $("#copiaLink").onclick = () => { const link = location.origin + location.pathname + "?codice=" + p.codice; navigator.clipboard?.writeText(link).then(() => toast("Link copiato: incollalo in WhatsApp."), () => prompt("Copia questo link:", link)); };
    $("#esci").onclick = () => { clearInterval(timerSala); clearInterval(timerPresenza); chiama({ comando: "esci", partita }).catch(() => { }); try { localStorage.removeItem("laguna_online"); } catch (e) { } partita = null; schermataCasa(); };
    document.querySelectorAll("[data-computer]").forEach((b) => b.onclick = async () => { b.disabled = true; const r = await chiama({ comando: "computer", partita, player: b.dataset.computer }); if (r && r.errore) toast(r.errore); disegnaSala(); });
    if ($("#inizia")) $("#inizia").onclick = async () => {
      clearInterval(timerSala);
      const d = leggiDurata();
      const r = await chiama({ comando: "inizia", partita, principianti, consigli: principianti, durata: d, cicli: d.cicli || 8 });
      if (r.errore) { toast(r.errore); timerSala = setInterval(disegnaSala, 3000); return; }
      await caricaVista(); ascolta();
    };
  };
  avviaPresenza();
  await disegnaSala();
  timerSala = setInterval(disegnaSala, 3000);
}

function testoCiclo() {
  const m = S.modoFine || "cicli";
  if (m === "obiettivo") { const me = io(); const pct = me && me.cash !== undefined ? Math.max(0, Math.min(99, Math.floor(L.patrimonio(S, me, true) / S.obiettivo * 100))) : null; return `Ciclo ${S.ciclo + 1} · Traguardo ${euro(S.obiettivo)}${pct !== null ? ` (tu al ${pct}%)` : ""}`; }
  if (m === "libera") return `Ciclo ${S.ciclo + 1}${S.chiusura ? ' · <span style="color:var(--oro)">ultima notte</span>' : " · partita libera"}`;
  return `Ciclo ${S.ciclo + 1} di ${S.cicli || L.N.cicli}`;
}
// ------------------------------------------------------------ chi deve agire
window.__S = () => S; // per le prove automatiche
window.__ultimOra = (g) => ultimOra(g);
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
// gli strumenti del mercato nero a rotazione: icone prese da quelle che ci sono
Object.assign(ICO_OGG, Object.fromEntries(Object.entries({ guanti: "maschera", piede_porco: "martello", radio_polizia: "disturbatore", cimice: "disturbatore", spray_cani: "siren", gommone: "motoscafo", tuta: "porto", sigilli: "documenti", bilancino: "soldi", mazzo_segnato: "fiches", infrarossi: "setta", passaporto: "documenti", doppiofondo: "valigetta", timbro: "municipio", registratore: "telefono", santino: "faro", drone: "aereo", smoking: "gala", kit_pulitore: "ricicla", mappa_fogne: "mappa", contanti_puliti: "soldi", binocolo: "setta", scanner: "disturbatore", fiaschetta: "gala" }).map(([k, i]) => [k, ico(i)])));
const OGG = (id) => L.oggettoDef ? L.oggettoDef(id) : L.OGGETTI[id];
const RARO = ["", " · raro", " · LEGGENDARIO"];
const haBanco = (dove) => !!(S.notte && S.notte.banco && S.notte.banco.length) || Object.values(L.OGGETTI).some((O) => O.dove === dove);
function isolaCasa(p) { const l = S.lotti.find((x) => x.owner === p.id && x.isola); return l ? l.isola : "Corona"; }
function posLuogo(l, p) { return l === "palazzo" ? POS_CASA[isolaCasa(p)] : POS_LUOGO[l]; }
function nomeLuogo(l, maiusc) { return l === "palazzo" ? (maiusc ? "Il tuo Palazzo" : "il tuo Palazzo") : L.LUOGHI[l].nome; }

// ------------------------------------------------------------ animazioni (dadi, pedine)
let ultimoFlusso = Infinity, segnoTurno = 0;
let disp = {}, ultimoLog = null, coda = [], animando = false, ultimaVistaJson = "", attesaAvanti = null;
const PRIVATI = /prestito|restituisce|investe|vende|ipoteca|riscatta/;
function copiaPos(p) { return { inner: !!p.inner, pos: p.pos, ipos: p.ipos }; }
function nuoviLog(log) {
  if (!ultimoLog) return [];
  const k = JSON.stringify(ultimoLog);
  for (let i = log.length - 1; i >= 0; i--) if (JSON.stringify(log[i]) === k) return log.slice(i + 1);
  return log.slice(-12);
}
// la pagina e' piu' vecchia del motore che ha calcolato la vista? Allora chiede di aggiornare (v76)
function indirizzoAggiornato(href, n) { const u = new URL(href); u.searchParams.set("v", String(n)); return u.toString(); }
function controllaVersione(v) {
  const mia = L.VERSIONE_REGOLE || 0, sua = (v && v.versioneRegole) || 0, motore = (v && v.versioneMotore) || 0;
  if (!(sua > mia || (L.VERSIONE && motore > L.VERSIONE))) return false;
  if (document.getElementById("avvisoVersione")) return true;
  const n = Math.max(sua, mia + 1), d = document.createElement("div"); d.id = "avvisoVersione";
  d.innerHTML = `<span>C'è una versione nuova del gioco.</span><button class="oro piccolo" id="aggiornaVersione">Aggiorna</button>`;
  document.body.appendChild(d);
  d.querySelector("#aggiornaVersione").onclick = () => { location.href = indirizzoAggiornato(location.href, n); };
  return true;
}
window.lagunaControllaVersione = controllaVersione; // per le prove automatiche
// la parola rotta si deve vedere subito (v76): a chi la rompe e a chi la subisce compare un avviso con gli effetti
const parolaVista = new Set(); let parolaPronta = false;
function avvisiParola(v) {
  const me = (v.players || []).find((p) => p.id === mioId); if (!me) return;
  const nuovi = [];
  for (const m of me.messaggi || []) { const k = m.ciclo + "|" + m.testo; if (parolaVista.has(k)) continue; parolaVista.add(k); if (parolaPronta && /Hai rotto la parola con |non ha mantenuto la parola: /.test(m.testo)) nuovi.push(m.testo); }
  parolaPronta = true;
  if (!nuovi.length) return;
  const mia = nuovi.some((t) => /Hai rotto la parola con /.test(t));
  toast(mia ? "Hai rotto la parola: −8 fama." : "Qualcuno non ha mantenuto la parola con te.");
  finestra(`<span class="kick" style="color:var(--sporco)">🧵 La parola rotta</span><h2>${mia ? "Hai rotto la parola" : "Non ha mantenuto la parola"}</h2>${nuovi.map((t) => `<p>${esc(t)}</p>`).join("")}<p class="sub">Lo sa tutta la Laguna: è sulla Gazzetta.</p><div class="pulsanti"><button class="oro" id="ok">Ho capito</button></div>`, (d, c) => d.querySelector("#ok").onclick = c);
}
window.lagunaAvvisiParola = avvisiParola; // per le prove automatiche
function riceviVista(v) {
  const j = JSON.stringify(v); if (j === ultimaVistaJson) return; ultimaVistaJson = j;
  try { controllaVersione(v); } catch (e) { console.warn("versione", e); }
  try { avvisiParola(v); } catch (e) { console.warn("parola", e); }
  if (!S) { (v.gazzetta || []).forEach((g) => gazzettaVista.add(g.ciclo + "|" + g.testo)); }
  if (!S) { S = v; S.players.forEach((p) => disp[p.id] = copiaPos(p)); ultimoLog = S.log[S.log.length - 1] || null; ultimoFlusso = Math.max(0, ...(S.flussi || []).map((f) => f.n)); segnoTurno = ultimoFlusso; disegna(); mostraNovita(); return; }
  coda.push(v);
  if (!animando) eseguiCoda();
}
async function eseguiCoda() {
  animando = true;
  try { await eseguiCodaDentro(); } catch (e) { console.error("animazione", e); }
  // qualunque cosa succeda, la partita non resta mai bloccata sui "…"
  finally { if (coda.length) { const v = coda.pop(); coda.length = 0; S = v; S.players.forEach((p) => disp[p.id] = copiaPos(p)); } animando = false; disegna(); }
}
async function eseguiCodaDentro() {
  while (coda.length) {
    const v = coda.shift();
    const righe = nuoviLog(v.log);
    if (v.log.length) ultimoLog = v.log[v.log.length - 1];
    const cashPrima = io() ? io().cash : 0;
    const tiri = [];
    for (const r of righe) { const m = / tira (\d(?: e \d)+)\.$/.exec(r.testo); if (m && r.chi) tiri.push({ chi: r.chi, d: m[1].split(" e ").map(Number) }); }
    // la notte e' finita sul server, ma tu stai ancora leggendo "Com'e' andata": il giorno (e i dadi degli altri) aspetta il tuo Avanti (v81)
    if (S.fase === "notte" && v.fase !== "notte" && document.querySelector('[data-a="avanti"]')) { await new Promise((ok) => { attesaAvanti = ok; setTimeout(() => { if (attesaAvanti === ok) { attesaAvanti = null; ok(); } }, 120000); }); }
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
    ultimOra(v.gazzetta || []);
    // i soldi che passano di mano: si vedono volare, con il motivo
    const nuoviF = (v.flussi || []).filter((f) => f.n > ultimoFlusso);
    if (v.flussi && v.flussi.length) ultimoFlusso = Math.max(ultimoFlusso, ...v.flussi.map((f) => f.n));
    for (const f of nuoviF.slice(-6)) await volaSoldi(f, v);
    // il risultato di un'asta lo vedono tutti, grande, e resta finché non premi Ok
    for (const r of righe) if (/^Asta/.test(r.testo)) await annuncioAsta(r.testo);
  }
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
    ped.style.left = x + "%"; ped.style.top = y + "%"; ped.dataset.pos = q.pos;
    ped.classList.remove("salto"); void ped.offsetWidth; ped.classList.add("salto"); Suono.passo(mio);
    await pausa(mio ? 190 : 95);
  }
  if (finale) { const [x, y] = puntoMappa(finale); ped.style.left = x + "%"; ped.style.top = y + "%"; ped.dataset.pos = finale.pos; disp[id] = copiaPos(finale); }
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
  if (camminaAttivo && !(notte && TRE3D && Tre.camminando && Tre.camminando() && !S.notte.chiuso[mioId] && !S.notte.viaggio[mioId] && !S.notteFatti[mioId])) fermaCammino();
  $("#mondo").style.display = notte && !S.fine && !camminaAttivo ? "none" : "block";
  $("#mondo").classList.toggle("notte", !!notte);
  document.body.classList.toggle("di-notte", !!notte);
  // un solo tentativo di avvio: se va male resta la foto piatta, con l'avviso
  if (!TRE3D && !provato3D && Tre && vuole3D() && !VELOCE_2D) {
    provato3D = true;
    try {
      if (!Tre.supportato()) motivo3D = "Il browser ha la grafica 3D spenta. In Chrome: Impostazioni › Sistema › «Usa l'accelerazione grafica quando disponibile», poi riavvia Chrome.";
      else if ((TRE3D = Tre.avvia($("#mondo"), $("#mappa"), "img/mappa-hd.jpg"))) {
        Tre.sonoIo(mioId); Tre.suCasella((id, x, y) => schedaCasella(id, x, y));
        if (Tre.suErrore) Tre.suErrore((m) => { TRE3D = false; motivo3D = m === "immagini" ? "Le immagini del tabellone 3D non si sono scaricate." : "La scheda grafica si è fermata."; disegna(); });
      } else motivo3D = "Il browser non riesce ad accendere la grafica 3D.";
    } catch (e) { console.warn("Tabellone 3D:", e); TRE3D = false; motivo3D = "La grafica 3D si è bloccata (" + (e.message || e) + ")."; }
  }
  $("#mondo").classList.toggle("tre", TRE3D);
  avviso3D();
  if (TRE3D) Tre.impostaNotte(!!notte);
  Suono.ambiente(notte ? "notte" : "giorno");
  $("#sfondo").style.filter = "";
  const c = casellaDi(me);
  sfondo(notte ? "img/marina.jpg" : c && c.isola ? SCENE[c.isola] : "img/laguna.jpg");
  disegnaMappa(me, notte);
  const turno = S.fase === "giorno" ? L.corrente(S) : null;
  const faseTesto = S.fine ? "Partita finita" : S.fase === "pacchetti" ? "Si sceglie come iniziare" : notte ? `${ico("luna")} Notte · ${L.ORE[S.notte.ora]}` : `${testoCiclo()} · Giorno ${S.giorno + 1} di ${L.N.giorni} · ${turno.id === mioId ? '<span style="color:var(--oro)">Tocca a te</span>' : "Turno di " + esc(turno.nome)}`;
  const segn = ["Nessuno parla di te.", "Voci: si parla di te, in giro.", "Osservato: la polizia ti tiene d'occhio.", "Indagato: la Gazzetta fa il tuo nome.", "Processo: convocazione del Giudice all'Alba."][me.stato || 0];
  const cron = S.log.filter((r) => !/ tira \d( e \d)+\.$/.test(r.testo) && !(r.chi && r.chi !== mioId && PRIVATI.test(r.testo))).slice(-4);
  $("#radice").innerHTML = `
  <div class="hud-alto">
    <div class="chips">${S.players.map((p) => `<div class="chip vetro ${turno && turno.id === p.id ? "turno" : ""} ${p.id !== mioId ? "tratta" : ""}" data-gioc="${p.id}" ${p.id !== mioId ? `title="Tocca per fare un affare con ${esc(p.nome)}"` : ""}><div class="pall" style="background:${p.colore}">${esc(p.nome[0])}</div><div><div class="n">${esc(p.nome)}${p.id === mioId ? " (tu)" : ""}</div><div class="s">${p.id === mioId ? esc(L.fascia(S, me)) : esc(p.fascia || "")}${p.faro ? " · al Faro" : ""}${statoCollegamento(p) ? `<span class="non-coll"> · ${statoCollegamento(p)}</span>` : puoSostituire(p) ? `<span class="non-coll"> · non risponde</span>` : ""}${notte && p.id === mioId ? (S.notteFatti[p.id] ? " · a casa" : S.notte.chiuso[p.id] ? " · hai deciso" : " · decidi…") : ""}</div><div class="s liv-chip">Liv. ${p.livello ?? "?"} · fama ${p.fama ?? "?"}</div>${p.id === mioId && (p.fedina || 0) >= 2 ? `<div class="s fed-chip" title="Fedina pulita: ${p.fedina} Cicli senza atti sporchi">⚖️ Fedina ${p.fedina}</div>` : ""}</div></div>`).join("")}</div>
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
  <button class="vetro audio ${Suono.acceso() ? "" : "spento"}" id="audio" title="${Suono.acceso() ? "Spegni musica e suoni" : "Accendi musica e suoni"}" aria-label="${Suono.acceso() ? "Spegni" : "Accendi"} musica e suoni">${icoE(Suono.acceso() ? "suono-si" : "suono-no")}</button>
  ${notte ? "" : `<div class="carta vetro">${animando ? `<div class="sub">…</div>` : cartaGiorno(me)}</div>`}`;
  $("#occhio").onclick = () => { saldoNascosto = !saldoNascosto; disegna(); };
  document.querySelectorAll(".chip.tratta").forEach((c) => c.onclick = () => finestraTratta(me, c.dataset.gioc));
  // v81: accanto al nome di chi non c'e', subito visibile in alto, il pulsante per far giocare il computer
  document.querySelectorAll(".chip.tratta").forEach((c) => { const q = S.players.find((x) => x.id === c.dataset.gioc); if (!q || !puoSostituire(q)) return; const b = document.createElement("button"); b.className = "piccolo oro sost-chip"; b.textContent = "🤖 Fai giocare il computer"; b.onclick = async (e) => { e.stopPropagation(); b.disabled = true; const r = await chiama({ comando: "computer", partita, player: q.id }); if (r && r.errore) { toast(r.errore); b.disabled = false; } else { toast("Al posto di " + q.nome + " ora gioca il computer. Quando torna, riprende a giocare."); caricaVista(); } }; c.appendChild(b); });
  if (!notte) collegaComandiVista(me); applicaVista(); if (!notte) apriMappaVicino(me);
  $("#audio").onclick = () => { Suono.cambia(); const b = $("#audio"), si = Suono.acceso(); b.innerHTML = icoE(si ? "suono-si" : "suono-no"); b.classList.toggle("spento", !si); b.title = si ? "Spegni musica e suoni" : "Accendi musica e suoni"; b.setAttribute("aria-label", b.title); };
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
      return `<div class="ped ${p.id === mioId ? "io" : ""}" data-id="${p.id}" data-pos="${q.pos}" title="${esc(p.nome)}" style="left:${x}%;top:${y}%;margin-left:${(p.id === mioId ? -21 : -17) + k * 16}px;background:${p.colore}${p.faro ? ";opacity:.45" : ""}"><b>${esc(p.nome[0])}</b><span class="nomeped">${esc(p.nome.slice(0, 12))}</span></div>`;
    }).join("");
    const c = casellaDi(me);
    const [mx, my] = puntoMappa(disp[mioId] || me);
    if (TRE3D) aggiorna3D(gruppi);
    m.innerHTML = nomiIsole() + caselle + edifici() + torri() + segniMappa() + `<svg class="scia" viewBox="0 0 100 56.25" preserveAspectRatio="none"></svg>` + pedine +
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
      <span class="pin">${ICO_LUOGO[l]}</span>${(() => { const v = PERSONAGGI.filter((pg) => pg.dove === l && pg.quando !== "raro" && (pg.lv <= S.sblocco || L.luogoAperto(S, l, me))); return v.length ? `<span class="volti">${v.map((pg) => volto(pg)).join("")}</span>` : ""; })()}<span class="nome">${l === "palazzo" ? "Il tuo Palazzo" : esc(L.LUOGHI[l].nome)}${(me.calore || {})[l] ? ` <span title="Qui ti conoscono" style="color:${me.calore[l] >= 2 ? "#ff5c5c" : "#f3c56b"}">${"●".repeat(Math.min(3, me.calore[l]))}</span>` : ""}</span>${ore ? `<span class="ore">${ore === 1 ? "1 ora" : "2 ore"}</span>` : qui ? `<span class="ore">sei qui</span>` : ""}</button>`;
  }).join("");
  const conta = {};
  // di notte vedi solo te stesso, e chi e' nel tuo stesso posto (gli altri li scopri arrivando)
  const mioPosto = N2.dove[mioId];
  const luci = S.players.filter((p) => !p.faro && N2.dove[p.id] && (p.id === mioId || (N2.dove[p.id] === mioPosto && mioPosto !== "palazzo" && !N2.viaggio[p.id] && !N2.viaggio[mioId]))).map((p) => {
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
  let cls = "cas", dentro = "", sotto = "", extra = "", stile = `left:${x}%;top:${y}%;`;
  const terreno = l.tipoCasella === "lotto" || l.tipoCasella === "molo";
  if (terreno) {
    cls += " terreno" + (l.tipoCasella === "molo" ? " molo" : "");
    stile += `--serie:${COL_SERIE[l.serie] || "#888"};`;
    if (own) { cls += " pres" + (own.id === mioId ? " mio" : ""); stile += `--own:${own.colore};`; dentro = `<b>${esc(own.nome[0].toUpperCase())}</b>`; }
    else dentro = l.tipoCasella === "molo" ? ico("molo") : `<em>${kEuro(l.prezzo)}</em>`;
    sotto = nomeCorto;
    if (own && l.tipoCasella === "lotto") extra = l.cantiere ? `<span class="livc cant">${ico("cantiere")}</span>` : l.lvl ? `<span class="livc">${[1, 2, 3, 4, 5].map((k) => `<u class="${k <= l.lvl ? "on" : ""}"></u>`).join("")}</span>` : `<span class="livc vuoto">vuoto</span>`;
  } else if (l.tipoCasella === "angolo") { cls += " ang"; dentro = icoAngolo(l); sotto = nomeCorto; }
  else if (l.tipoCasella === "agenzia") { cls += " spec agz"; dentro = ico("chiave"); sotto = "Agenzia"; }
  else if (l.tipoCasella === "libero") { cls += " lib"; dentro = ico("palma"); sotto = nomeCorto; }
  else if (l.tipoCasella === "eliporto") { cls += " spec agz"; dentro = "<b>H</b>"; sotto = "Eliporto"; }
  else if (l.tipoCasella === "aeroporto") { cls += " spec agz"; dentro = ico("aereo"); sotto = "Aeroporto"; }
  else if (l.tipoCasella === "asta") { cls += " spec agz"; dentro = ico("martello"); sotto = "Asta"; }
  else { cls += " spec"; dentro = ICO_CASELLA[l.nome] || ico("stella"); sotto = NOME_BREVE[l.nome] || nomeCorto; }
  return `<div class="${cls}" data-cas="${l.id}" title="${esc(tit)}" style="${stile}"><i>${dentro}</i>${extra}<span class="cn">${esc(sotto)}</span></div>`;
}
// la Legenda sta subito sotto i nomi dei giocatori (prima ci finiva sopra quando i nomi andavano su due righe)
function posLegenda() { const lg = $(".legenda"), ch = $(".hud-alto .chips"); if (!lg || !ch) return; const b = ch.getBoundingClientRect(); if (b.height) lg.style.top = Math.round(b.bottom + 6) + "px"; }
window.addEventListener("resize", () => posLegenda());
function legenda() {
  return `<div class="legenda vetro"><div class="riga" style="gap:6px"><button class="piccolo" id="legTasto">${ico("mappa")} Legenda</button><button class="piccolo ${soloMiei ? "oro" : ""}" id="mieiTasto">${ico("stella")} Cosa ho</button><button class="piccolo" id="guidaTasto" title="Come si gioca">📖 Guida</button></div><div class="leg-dentro">
    <div><span class="lg terreno"><em>60k</em></span> Terreno libero: il numero è il prezzo</div>
    <div><span class="lg terreno pres mio" style="--own:var(--oro)"><b>T</b></span> Il tuo terreno: bordo d'oro e stellina</div>
    <div><span class="lg terreno pres" style="--own:#4aa3a2"><b>R</b></span> Terreno di un altro (la sua iniziale)</div>
    <div><span class="livc vuoto" style="position:static">vuoto</span> Terreno senza attività: rende quasi niente</div>
    <div><span class="livc" style="position:static;--own:var(--oro)"><u class="on"></u><u class="on"></u><u></u><u></u><u></u></span> Attività aperta: i pallini sono il livello (max 5)</div>
    <div><span class="livc cant" style="position:static">${ico("cantiere")}</span> Cantiere: l'attività apre all'Alba</div>
    <div><span class="lg spec">${ico("chiave")}</span> Agenzia: compri un terreno dell'isola</div>
    <div><span class="lg spec">${ico("gazzetta")}</span> Posto speciale: il nome è scritto sotto</div>
    <div><span class="lg ang">${ico("flag")}</span> Ponte: Partenza, Faro, Posto di blocco</div>
    ${TRE3D && Tre.mondoNuovo() ? `<div class="sub" style="margin-top:6px"><b>Nel mondo 3D:</b> ogni terreno è un lotto accanto alla strada. Il colore della piastra e del bordo strada è il quartiere (gruppo di vie). Cartello bianco = in vendita. Bandiera e cornice colorate = di chi è; cornice d'oro = tuo. La forma dell'edificio dice l'attività (case, torre, locale, magazzino, casinò…), l'altezza il livello. Le auto sono le pedine. Tocca un lotto per la sua scheda.</div>` : ""}
    <div class="sub">Il colore della striscia è il gruppo di vie. Tocca una casella per la sua scheda. «Cosa ho» mostra solo le tue cose.</div></div>${soloMiei ? pannelloMiei() : ""}</div>`;
}
// «Cosa ho»: solo le tue cose sul tabellone, con l'elenco
let soloMiei = false;
function pannelloMiei() {
  const me = io(), miei = S.lotti.filter((l) => l.owner === mioId);
  const riga = (l, testo, col) => `<button class="mieo" data-mio="${l.id}"><span class="mieo-n">${esc(l.nome.replace(/ — .*/, ""))}</span><span class="sub" style="color:${col || "inherit"}">${testo}</span></button>`;
  const att = miei.filter((l) => l.tipo && !l.cantiere), cant = miei.filter((l) => l.cantiere), vuoti = miei.filter((l) => l.tipoCasella === "lotto" && !l.tipo && !l.cantiere), moli = miei.filter((l) => l.tipoCasella === "molo");
  const rendTot = att.reduce((a, l) => a + L.rendita(S, l), 0);
  return `<div class="miei-pannello">
    <div class="miei-cifre"><div><b>${miei.length}</b>terreni</div><div><b>${att.length}</b>attività</div><div><b style="color:${vuoti.length ? "#ff9a9a" : "inherit"}">${vuoti.length}</b>vuoti</div><div><b>${me.piani}</b>piani</div></div>
    ${att.length ? `<h5>Attività aperte · rendono ${euro(rendTot)} a ogni Alba</h5>${att.map((l) => riga(l, esc(L.ATTIVITA[l.tipo].nome) + " · livello " + l.lvl + " · " + euro(L.rendita(S, l)))).join("")}` : ""}
    ${cant.length ? `<h5>Cantieri (aprono all'Alba)</h5>${cant.map((l) => riga(l, esc(L.ATTIVITA[l.cantiere.tipo].nome) + " · livello " + l.cantiere.lvl)).join("")}` : ""}
    ${vuoti.length ? `<h5 style="color:#ff9a9a">Vuoti: rendono quasi niente</h5>${vuoti.map((l) => riga(l, "apri un'attività", "#ff9a9a")).join("")}` : ""}
    ${moli.length ? `<h5>Moli</h5>${moli.map((l) => riga(l, "chi ci passa paga il pedaggio")).join("")}` : ""}
    ${!miei.length ? `<p class="sub">Non hai ancora terreni. Fermati su un terreno libero o passa dall'Agenzia.</p>` : ""}
    <button class="mieo" data-app="palazzo"><span class="mieo-n">${ico("palazzo")} Il tuo Palazzo</span><span class="sub">${me.piani ? me.piani + " piani · " + euro(L.renditaPalazzo(me)) + " a ogni Alba" : "da costruire"}</span></button>
  </div>`;
}
function aggiorna3D(gruppi) {
  const conta = {};
  const caselle = S.lotti.map((l) => {
    const [x, y] = puntoMappa({ pos: l.idx }); const own = l.owner ? S.players.find((p) => p.id === l.owner) : null;
    return { id: l.id, idx: l.idx, isola: l.isola || L.isolaDiPos(l.idx), serie: l.serie, coloreSerie: COL_SERIE[l.serie] || "#9aa4b2", terreno: l.tipoCasella === "lotto" || l.tipoCasella === "molo", mio: !!own && own.id === mioId, attivita: l.tipo || null, x, y, tipo: l.tipoCasella, colore: own ? own.colore : COL_SERIE[l.serie] || (l.tipoCasella === "angolo" ? "#c9a24a" : "#28344a"), proprietario: own ? own.colore : null, livello: l.lvl, cantiere: !!l.cantiere, spento: soloMiei && (!own || own.id !== mioId) };
  });
  const cc = {};
  const torri3 = S.players.filter((p) => p.piani > 0).map((p) => { const isola = isolaCasa(p); const k = (cc[isola] = (cc[isola] || 0) + 1) - 1; const [x, y] = POS_CASA[isola]; return { x: x + k * 2.2, y, isola, colore: p.colore, piani: p.piani, spento: soloMiei && p.id !== mioId }; });
  const giocatori = S.players.map((p) => { const q = disp[p.id] || copiaPos(p); const key = "o" + q.pos; const k = (conta[key] = (conta[key] || 0) + 1) - 1; const [x, y] = puntoMappa(q); return { id: p.id, colore: p.colore, x, y, pos: q.pos, offset: k, nascosta: S.fase === "notte" || p.faro > 0 }; });
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
  if (l.isola) righe.push(`<span class="sub">${L.NOMI_ISOLE[l.isola]}</span>`);
  let tasti = "";
  if (l.tipoCasella === "lotto" || l.tipoCasella === "molo") {
    const pall = (lv) => `<span class="livc" style="position:static;--own:${own ? own.colore : "#888"}">${[1, 2, 3, 4, 5].map((k) => `<u class="${k <= lv ? "on" : ""}"></u>`).join("")}</span>`;
    if (own) righe.push(own.id === mioId ? `<b style="color:var(--oro)">★ È tuo</b>` : `Di <b style="color:${own.colore}">${esc(own.nome)}</b>`);
    else righe.push(`<b>Libero</b> · costa ${euro(l.prezzo)}`);
    if (l.tipoCasella === "molo") righe.push(own ? "Molo: chi ci passa paga il pedaggio a " + (own.id === mioId ? "te" : esc(own.nome)) + "." : "Molo: chi lo possiede incassa un pedaggio da chi ci passa.");
    else if (l.cantiere) righe.push(`${ico("cantiere")} Cantiere: <b>${esc(L.ATTIVITA[l.cantiere.tipo].nome)}</b> livello ${l.cantiere.lvl}. Apre all'Alba.`);
    else if (l.tipo) righe.push(`<b>${esc(L.ATTIVITA[l.tipo].nome)}</b> ${pall(l.lvl)} livello ${l.lvl} di 5`);
    else if (own) righe.push(own.id === mioId ? `<span style="color:#ff9a9a">Terreno vuoto: rende quasi niente. Aprici un'attività.</span>` : "Terreno vuoto (nessuna attività).");
    if (own && own.id === mioId && l.tipoCasella === "lotto") {
      if (l.tipo && !l.cantiere) righe.push(`Ti rende <b style="color:var(--pulito)">${euro(L.rendita(S, l))}</b> a ogni Alba`);
      righe.push(`Chi ci finisce sopra ti paga <b>${euro(L.affitto(S, l))}</b>`);
      if (!l.cantiere && l.lvl < 5) { const next = l.lvl + 1, costo = Math.round(L.N.costLvl[next] * l.prezzo * (io().pacchetto === "costruttore" ? 0.85 : 1)); righe.push(`<span class="sub">${l.lvl ? "Prossimo livello" : "Aprire l'attività"}: ${euro(costo)} (permesso, poi cantiere)${next >= 3 && !L.haSerie(S, io(), l.serie) ? ". Dal livello 3 serve tutto il gruppo di vie." : ""}</span>`); }
      tasti = `<button class="piccolo oro" data-cas-app="imprese">${ico("imprese")} ${l.tipo ? "Gestisci" : "Apri un'attività"}</button>`;
    } else if (own && own.id !== mioId) righe.push(`Se ci finisci sopra paghi <b style="color:#ff9a9a">${euro(L.affitto(S, l))}</b>`);
    else if (!own) righe.push(`<span class="sub">Lo compri se ti fermi qui coi dadi, oppure dall'app Agenzia quando sei su quest'isola (+20%).</span>`);
    } else {
    const SPIEGA = { "Gazzetta": "Peschi una notizia: può andarti bene o male.", "Mercato Nero": "Di giorno ti danno una dritta. Di notte ci puoi comprare oggetti.", "Spiaggia VIP": "Incontri gente famosa: più fama.", "Gala Flamingo": "Serata di beneficenza: doni e guadagni fama.", "Porto Container": "Di giorno senti delle voci. Di notte arrivano i carichi.", "La Borsa": "Investimenti senza commissioni.", "Il Municipio": "Candidature a Sindaco e licenza del casinò.", "Banca Centrale": "Prestiti.", "Casinò Reale": "Una puntata al tavolo." };
    const ANG = { 0: "Si parte da qui. Ogni volta che ci passi incassi lo Stipendio.", 16: "La prigione. Se ci finisci per una condanna, stai fermo qualche turno.", 32: "L'ingresso di Isola Corona: le vie più care della Laguna.", 64: "Posto di blocco: se sei sotto indagine ti controllano." };
    SPIEGA["Bisca del Vicolo"] = "Di giorno senti qualche voce. Di notte si gioca forte.";
    righe.push(l.tipoCasella === "angolo" ? ANG[l.idx] : l.tipoCasella === "agenzia" ? "Se ti fermi qui, in questo turno l'app Agenzia ti vende un terreno di quest'isola a prezzo pieno, senza il 20% in più." : l.tipoCasella === "libero" ? "Qui non succede niente: ti riposi." : l.tipoCasella === "eliporto" ? "Eliporto: con un elicottero, l'eliporto nel Palazzo o il jet ci arrivi col Viaggio rapido (una volta per Ciclo, al posto dei dadi)." : l.tipoCasella === "aeroporto" ? "Aeroporto della Laguna: col jet ci arrivi col Viaggio rapido. Di notte, dal Livello 2, qui arrivano i voli cargo e partono le spedizioni." : l.tipoCasella === "asta" ? "Asta del Comune. Se ti fermi qui, in questo turno compri un terreno libero di quest'isola a prezzo pieno. I terreni sequestrati dal Giudice vanno all'asta per tutti (tranne l'ex padrone): i soldi vanno alla banca." : SPIEGA[l.nome] || "");
  }
  if (gruppo(l)) righe.push(`<span class="sub"><span style="color:${COL_SERIE[l.serie]}">■</span> ${gruppo(l)}</span>`);
  const d = document.createElement("div"); d.className = "scheda-cas vetro";
  d.innerHTML = `<b>${esc(l.nome)}</b>${righe.map((r) => `<span>${r}</span>`).join("")}${tasti ? `<div class="riga">${tasti}</div>` : ""}`;
  d.querySelectorAll("[data-cas-app]").forEach((b) => b.onclick = () => { d.remove(); apriApp(b.dataset.casApp); });
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
    return `<div class="edificio ${l.cantiere ? "cant" : ""} ${own.id === mioId ? "mio" : ""}" title="${esc(l.nome)}" style="left:${x}%;top:${y}%;--s:${size}px;--col:${own.colore}">${l.cantiere ? ico("cantiere") : ICO_LIV[lv]}</div>`;
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
  const maxX = Math.max((w * vista.z) / 2, (w * vista.z - W) / 2), maxY = Math.max((h * vista.z) / 2, (h * vista.z - H) / 2); // ogni punto della mappa si puo' portare al centro dello schermo
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
// muovendo il mouse verso il bordo dello schermo la mappa scorre (come nei giochi di strategia)
const bordo = { x: 0, y: 0, attivo: false };
function scorriAlBordo(t) {
  requestAnimationFrame(scorriAlBordo);
  const dt = Math.min(0.05, ((t || 0) - (bordo.ultimo || t || 0)) / 1000); bordo.ultimo = t;
  if (!bordo.dentro || !S || (S.fase === "notte" && S.notte) || document.querySelector(".velo,#guida")) return;
  const Z = 70, W = innerWidth, H = innerHeight;
  // vicino al bordo scorre solo sopra la mappa; proprio sul bordo (24 px) scorre sempre, anche sopra i pannelli
  if (!bordo.attivo && !(bordo.x < 24 || bordo.y < 24 || bordo.x > W - 24 || bordo.y > H - 24)) return;
  const fx = bordo.x < Z ? -(Z - bordo.x) / Z : bordo.x > W - Z ? (bordo.x - (W - Z)) / Z : 0;
  const fy = bordo.y < Z ? -(Z - bordo.y) / Z : bordo.y > H - Z ? (bordo.y - (H - Z)) / Z : 0;
  if (!fx && !fy) return;
  const v = 1100 * dt; // pixel al secondo, uguale su ogni computer
  if (TRE3D) Tre.sposta(fx * v, fy * v);
  else { vista.x -= fx * v; vista.y -= fy * v; $("#mondo").classList.add("trascino"); applicaVista(); clearTimeout(bordo.t); bordo.t = setTimeout(() => $("#mondo").classList.remove("trascino"), 150); }
}
addEventListener("mousemove", (e) => {
  bordo.x = e.clientX; bordo.y = e.clientY; bordo.dentro = true;
  // sopra i pannelli (soldi, carta, telefono, legenda...) non scorre
  bordo.attivo = !!e.target.closest && !!e.target.closest("#mondo") && !e.target.closest(".scheda-cas");
});
document.addEventListener("mouseleave", () => { bordo.attivo = false; bordo.dentro = false; });
requestAnimationFrame(scorriAlBordo);
let apertaVicino = false;
function apriMappaVicino(me) {
  if (apertaVicino || !S || S.fase === "notte") return;
  apertaVicino = true;
  const [x, y] = puntoMappa(disp[mioId] || me);
  if (TRE3D) Tre.apriVicino(x, y); else { vista.z = 1.6; centraSu(x, y); }
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
  const dio = TRE3D && !!Tre.DIORAMA, cubi = TRE3D && !dio, m = TRE3D ? Tre.modoVista() : "";
  const visuali = dio ? `<button id="vArci" class="${m === "arcipelago" ? "attivo" : ""}" title="Tutta la Laguna: la visuale resta ferma">🏝️<small>Arcipelago</small></button><button id="vSegui" class="${m === "segui" ? "attivo" : ""}" title="Quando tiri i dadi la visuale si avvicina alla tua auto e la accompagna">🚗<small>Segui</small></button>`
    : cubi ? `<button id="vSegui" class="${m === "segui" ? "attivo" : ""}" title="Segui la tua auto da dietro">🚗<small>Segui</small></button><button id="vLibera" class="${m === "libera" ? "attivo" : ""}" title="Gira la visuale come vuoi">🧭<small>Libera</small></button><button id="vAlto" class="${m === "alto" ? "attivo" : ""}" title="Tutta la Laguna vista dall'alto">🗺️<small>Alto</small></button>` : "";
  return `<div class="comandi-vista vetro"><span class="cv-titolo">Vista</span>${visuali}<button id="z3d" class="${TRE3D ? "" : "attivo"}" title="${TRE3D ? "Passa alla foto piatta, senza 3D" : "Torna al tabellone 3D"}">${TRE3D ? "🖼️<small>Piatta</small>" : "🧊<small>Torna al 3D</small>"}</button>${TRE3D ? `<button id="zMotore" title="${cubi ? "Torna alla foto della Laguna" : "Il mondo 3D: giralo e guardalo da ogni lato"}">${cubi ? "📷<small>Foto</small>" : "🌍<small>Mondo 3D</small>"}</button>` : ""}<i class="cv-riga"></i><button id="zPiu" aria-label="Avvicina" title="Avvicina">＋</button><button id="zMeno" aria-label="Allontana" title="Allontana">−</button>${cubi ? `<button id="zSx" aria-label="Ruota a sinistra" title="Ruota">⟲</button><button id="zDx" aria-label="Ruota a destra" title="Ruota">⟳</button>` : ""}${TRE3D ? "" : `<button id="zTutto" aria-label="Vista intera" title="Vista intera">⤢</button>`}<button id="zMio" aria-label="Vai alla tua pedina" title="La tua pedina">◎</button></div>`;
}
function notteOra() { return S && S.fase === "notte" && S.notte; }
let legendaAperta = false;
function collegaComandiVista(me) {
  const gt = $("#guidaTasto"); if (gt) gt.onclick = () => apriGuida(0);
  const mt = $("#mieiTasto"); if (mt) {
    mt.onclick = () => { soloMiei = !soloMiei; disegna(); };
    document.querySelectorAll("[data-mio]").forEach((b) => b.onclick = (e) => { const l = S.lotti.find((x) => x.id === b.dataset.mio); const [x, y] = puntoMappa({ pos: l.idx }); let r = b.getBoundingClientRect();
      if (innerWidth < 700) { soloMiei = false; disegna(); r = { right: innerWidth / 2 - 130, top: innerHeight / 2 - 60 }; } // sul telefono l'elenco si chiude, cosi' vedi la casella
      TRE3D ? Tre.centraSu(x, y) : centraSu(x, y); setTimeout(() => schedaCasella(l.id, r.right, r.top), 80); });
    document.querySelectorAll(".miei-pannello [data-app]").forEach((b) => b.onclick = () => apriApp(b.dataset.app));
  }
  $("#mondo").classList.toggle("solo-miei", soloMiei);
  posLegenda();
  const lt = $("#legTasto"); if (lt) { $(".legenda").classList.toggle("aperta", legendaAperta); lt.onclick = () => { legendaAperta = !legendaAperta; $(".legenda").classList.toggle("aperta", legendaAperta); }; }
  $("#zPiu").onclick = () => TRE3D ? Tre.avvicina(0.7) : zoomA(vista.z * 1.35);
  $("#zMeno").onclick = () => TRE3D ? Tre.avvicina(1.4) : zoomA(vista.z / 1.35);
  if ($("#zSx")) { $("#zSx").onclick = () => Tre.ruota(-35); $("#zDx").onclick = () => Tre.ruota(35); }
  if ($("#zTutto")) $("#zTutto").onclick = () => { if (TRE3D) return Tre.tutto(); vista = { z: 1, x: 0, y: 0 }; applicaVista(); };
  const modoV = (m) => { Tre.impostaModo(m, mioId); document.querySelectorAll("#vArci,#vSegui,#vLibera,#vAlto").forEach((b) => b.classList.toggle("attivo", b.id === { arcipelago: "vArci", segui: "vSegui", libera: "vLibera", alto: "vAlto" }[m])); };
  for (const [id, m] of [["#vArci", "arcipelago"], ["#vSegui", "segui"], ["#vLibera", "libera"], ["#vAlto", "alto"]]) if ($(id)) $(id).onclick = () => modoV(m);
  $("#zMio").onclick = () => { const notte = S.fase === "notte" && S.notte; const [x, y] = notte ? posLuogo(S.notte.dove[mioId], me) : puntoMappa(disp[mioId] || me); if (TRE3D && (Tre.DIORAMA || Tre.mondoNuovo()) && Tre.seguiPedina(mioId)) return; TRE3D ? Tre.centraSu(x, y) : centraSu(x, y); };
  // la vista si sceglie qui e solo qui: tabellone 3D (di base) oppure foto piatta
  if ($("#zMotore")) $("#zMotore").onclick = () => { const cubi = TRE3D && !Tre.DIORAMA; try { localStorage.setItem("laguna_motore", cubi ? "foto" : "libero"); } catch (e) { } const u = new URL(location.href); u.searchParams.delete("cubetti"); u.searchParams.delete("foto"); location.href = u.toString(); };
  $("#z3d").onclick = () => { try { if (TRE3D) localStorage.setItem("laguna_vista", "piatta"); else localStorage.removeItem("laguna_vista"); } catch (e) { } location.reload(); };
  if (TRE3D && Tre.DIORAMA && $(".leg-dentro") && !$(".leg-dio")) $(".leg-dentro").insertAdjacentHTML("beforeend", `<div class="sub leg-dio"><b>Sul tabellone 3D:</b> la piazzola sulla strada è la casella, del colore del gruppo di vie. Bandiera e alone colorato = di chi è il terreno (cerchio d'oro = tuo). L'edificio cresce col livello. Il cartellino col prezzo = terreno libero vicino a te. Tocca una casella per la sua scheda; tocca il nome di un'isola per volarci dentro.</div>`);
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
  if (!me.haTirato) return riepilogoGiro() + rivalita() + `<div class="riga" style="justify-content:space-between;align-items:center"><div><div class="kick" style="color:var(--muted)">Sei a</div><div class="dove">${esc(c ? c.nome : "")}</div></div><div class="riga">${!me.doppi && L.destinazioniRapide(S, me).length ? `<button data-a="rapido"${L.motivoNoRapido && L.motivoNoRapido(S, me) ? ' class="spento"' : ""}>${ico("aereo")} Viaggio rapido</button>` : ""}<button class="oro grande" data-a="tira">${ico("dado")} Tira i dadi</button></div></div>`;
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
  if (N2.chiuso[mioId]) return `<div class="titolo">Hai deciso.</div><div class="sub">${attesaNotte(N2) || "L'ora sta per finire…"}</div>`;
  const dove = N2.dove[mioId];
  const ultima = [...N2.racconto].reverse().find((r) => r.includes("Arrivi a")) || "";
  const indizio = ultima.includes(nomeLuogo(dove)) ? ultima.split(". ").slice(1).join(". ") : "";
  const occ = (N2.occasioni || []).map((o) => `<div class="occ ${o.legale ? "legale" : ""}"><h3>${esc(o.nome)}</h3><div class="storia">${esc(o.testo)}</div>
      <div class="riga"><span class="sub">${o.costo ? "Ci metti " + euro(o.costo) : "Non costa niente"}</span><button class="${o.legale ? "oro" : "notte"}" data-occ="${o.n}" style="margin-left:auto">${o.legale ? "Ci sto" : "Accetto"}</button></div></div>`).join("");
  const extra = [];
  if (haBanco(dove)) extra.push(`<button data-a="negozio">${ico("mercato")} ${L.BANCHI && L.BANCHI[dove] ? L.BANCHI[dove].replace(/^il /, "Il ") + ((N2.banco || []).length ? " · " + N2.banco.length + " strumenti stanotte" : "") : "Compra qui"}</button>`);
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
    else if (tipo === "negozio") { if (!haBanco(N2.dove[mioId])) classe = "spento"; else azione = () => finestraNegozio(me); }
    else if (tipo === "soffiata") azione = () => finestraSoffiata(me);
    else if (tipo === "aspetta") { if (!libero) classe = "spento"; else azione = () => agisci({ tipo: "aspetta" }); }
    else if (tipo === "chiuso") { classe = "chiuso"; azione = () => toast((S.lustro || 0) >= 2 ? chi + ": arriva presto." : "Dietro la porta d'oro c'è la " + chi + ". Si apre solo ai più potenti della Laguna."); }
    return { ...Pano.daFoto(pt.x, pt.y), ...pt, testo: esc(testo), icona: ico(pt.icona), classe, azione };
  });
  if (panoOra === "palazzo") {
    const extra = { serata: "casino", mia_serata: "casino", spa: "stella", polizia: "handshake", tavolo: "casino", brinda: "gala" };
    let k = 0;
    scelte.forEach((c, i) => { if (!extra[c.k] || !libero) return; punti.push({ ...Pano.daFoto(0.28 + (k++) * 0.22, 0.70), testo: esc(c.titolo), icona: ico(extra[c.k]), classe: "", azione: () => { const b = document.querySelector(`.scena [data-scelta="${i}"]`); if (b) b.click(); } }); });
  }
  // gli altri giocatori presenti compaiono nella sala
  (N2.qui || []).forEach((id, k) => {
    const q = S.players.find((x) => x.id === id); if (!q) return;
    punti.push({ ...Pano.daFoto(0.38 + k * 0.12, 0.62), testo: esc(q.nome) + " è qui", icona: `<b style="color:${q.colore};font-size:18px">${esc(q.nome[0])}</b>`, classe: "persona", azione: () => finestraIncontro(me, id) });
  });
  for (let k = 0; k < (N2.incappucciati || 0); k++) punti.push({ ...Pano.daFoto(0.62 + k * 0.08, 0.62), testo: "Incappucciato", icona: `<b style="font-size:18px">?</b>`, classe: "persona", azione: () => toast("Sotto il cappuccio non sai chi è.") });
  Pano.mostra(V.img, punti, { yaw: 0 });
}
const ICO_SCELTA = { ballo: "maschera", ricettatore: "mercato", rito: "setta", scava: "faro", jet: "aereo", doganiere: "handshake", tavolo: "casino", brinda: "gala", serata: "casino", mia_serata: "casino", spa: "stella", occ: "sconosciuto", ricicla: "ricicla", banchiere: "handshake", polizia: "handshake", articolo: "gazzetta", setta: "setta", paradiso: "ricicla", foto: "macchina", aspetta: "orologio" };
function righeNotte(lista) { return lista.map((r) => { const [o, ...t] = r.split(" — "); return `<p><b>${esc(o)}</b> ${esc(t.join(" — "))}</p>`; }).join(""); }
// l'orologio del server: se quello del computer e' avanti o indietro, il conto alla rovescia si corregge
let scartoOrologio = 0, ultimoAdesso = null;
function oraServer() { const N2 = S && S.notte; if (N2 && N2.adesso && N2.adesso !== ultimoAdesso) { ultimoAdesso = N2.adesso; scartoOrologio = N2.adesso - Date.now(); } return Date.now() + scartoOrologio; }
// di notte non si dice chi stai aspettando: solo quanti (v76)
function attesaNotte(N2) { const n = (N2 && N2.mancano) || 0; return n ? "Aspettiamo ancora " + n + (n === 1 ? " giocatore" : " giocatori") + "…" : ""; }
function restoOra() { const N2 = S.notte; if (!N2 || !N2.inizio) return null; return Math.max(0, Math.ceil((N2.tempo || 120) - (oraServer() - N2.inizio) / 1000)); }
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
  const mancano = N2.mancano || 0; // v76: solo quanti, mai chi
  const resto = restoOra();
  const cvN = N2.convocazione, traCv = cvN ? cvN.ora - N2.ora : 0;
  const bannerCv = cvN && traCv >= -2 ? `<div class="conv-banner">🕯️ <span>Rito della setta: <b>${esc(L.LUOGHI[cvN.luogo].nome)}</b> alle <b>${L.ORE[cvN.ora]}</b> · ${traCv > 0 ? "tra " + traCv + (traCv === 1 ? " ora" : " ore") : traCv === 0 ? "<b>adesso</b>" : "è iniziato"}${N2.dove[mioId] === cvN.luogo ? " · sei qui" : ""}</span>${N2.dove[mioId] !== cvN.luogo && !N2.viaggio[mioId] && !N2.chiuso[mioId] ? `<button class="piccolo oro" data-cvvai="${cvN.luogo}">Vai</button>` : ""}</div>` : "";
  const testa = bannerMano() + bannerCv + `<div class="scena-testa">
      <div class="kick" style="color:var(--cielo)">${ico("luna")} ore ${L.ORE[N2.ora]} · ${6 - N2.ora} ${6 - N2.ora === 1 ? "ora" : "ore"} all'alba${isola ? " · " + esc(isola) : ""}${N2.pericoloQui && !v && !aCasa ? ` · <span style="color:${COLORE_POLIZIA[N2.pericoloQui]}">polizia ${N2.pericoloQui}</span>` : ""}</div>
      <h1>${esc(nome)}</h1>${sala ? `<div class="sala">${ico("stella")} ${esc(sala)}</div>` : ""}
      ${N2.incappucciati ? `<div class="qui-altri"><span class="persona incappucciato"><span class="pall" style="background:#222">?</span>${N2.incappucciati === 1 ? "Un incappucciato" : N2.incappucciati + " incappucciati"}</span> <span class="sub">confratelli della setta: sotto il cappuccio non sai chi sono</span></div>` : ""}
      ${quiAltri.length ? `<div class="qui-altri">${quiAltri.map((p) => `<button class="persona" data-persona="${p.id}"><span class="pall" style="background:${p.colore}">${esc(p.nome[0])}</span>${esc(p.nome)}</button>`).join(" ")} <span class="sub">${quiAltri.length === 1 ? "è qui con te: toccalo" : "sono qui con te: toccali"}</span></div>` : ""}
      ${me.giroPg && !me.faro ? `<div class="sub giro-pg">🔭 Dal cannocchiale: ${Object.entries(me.giroPg).map(([k, l]) => `${{ banchiere: "Lenz", commissario: "Vargas", doganiere: "il doganiere", giornalista: "la giornalista" }[k]} → <b>${esc(nomeLuogo(l))}</b>`).join(" · ")}</div>` : ""}
      ${resto !== null && !aCasa && !me.faro ? `<div class="tempo"><div class="barra" id="barraTempo" style="width:${(resto / (N2.tempo || 120)) * 100}%"></div></div><div class="sub" id="contoTempo">${resto <= 20 ? testoTempo(resto) : ""}</div>` : ""}
    </div>`;
  let corpo = "";
  const racc = N2.racconto || [];
  if (me.faro) corpo = `<div class="storia">Sei in cella. Fuori la Laguna si muove senza di te.</div>`;
  else if (aCasa) corpo = `<div class="storia">Per te la notte è finita. ${mancano ? (mancano === 1 ? "Qualcuno è ancora in giro." : "Altri sono ancora in giro.") : ""} All'alba si scopre tutto.</div>`;
  else if (!scelto && !v) {
    const intro = racc.slice(N2.inizioRacc || 0);
    const scelte = N2.scelte || [];
    const negozio = haBanco(dove);
    corpo = `${intro.length ? `<div class="righe">${righeNotte(intro.slice(-1))}</div>` : ""}
      ${appuntamenti(me, dove)}
      <div class="scelte">${scelte.map((c, i) => `<button class="scelta ${c.k === "occ" && !c.legale ? "losca" : c.k === "occ" ? "legale" : c.k === "aspetta" ? "calma" : ""}" data-scelta="${i}">
        <span class="ic">${ico(c.k === "occ" ? (c.legale ? "stella" : "maschera") : c.k === "fissa" ? ICO_FISSA[c.id] || "stella" : ICO_SCELTA[c.k] || "orologio")}</span><b>${esc(c.titolo)}</b><span class="t">${esc(c.testo)}</span><span class="fai">Tocca ancora per farlo</span>${c.k === "occ" ? `<span class="costo">${c.costo ? "Ci metti " + euro(c.costo) : "Non costa niente"}${c.riservata ? " · è l'appuntamento" : ""}</span>` : c.k === "fissa" ? `<span class="costo">${c.costo ? euro(c.costo) : c.puntata ? "Scegli la puntata" : "Non costa niente"}</span>` : ""}</button>`).join("")}</div>
      <div class="scena-barra">${negozio ? `<button data-a="negozio">${ico("mercato")} Guarda la merce</button>` : ""}${dove === "mercato" ? `<button data-a="soffiata">${ico("soffiata")} Soffiata</button>` : ""}${scelte.some((c) => c.k === "aspetta") ? "" : `<button data-a="aspetta">${ico("orologio")} Resta qui</button>`}${N2.puoTradire ? `<button data-a="tradisci">☎️ Fai un nome</button>` : ""}${TRE3D && Tre.avviaCammino && Tre.mondoNuovo && Tre.mondoNuovo() ? `<button data-a="cammina">🚶 Cammina</button>` : ""}<button data-a="altrove">${ico("mappa")} Vai altrove</button><button data-a="casa">${ico("casa")} Torna a casa</button></div>`;
  } else {
    const da = v && N2.daScelta === undefined ? N2.inizioRacc || 0 : N2.daScelta !== undefined ? N2.daScelta : N2.inizioRacc || 0;
    const storia = racc.slice(da);
    corpo = `<div class="righe grandi">${storia.length ? righeNotte(storia) : v ? `<p>Arrivi tra ${v.restano === 1 ? "un'ora" : v.restano + " ore"}.</p>` : ""}</div>${riquadroEsito(me)}
      ${pronto ? `<div class="attesa">${attesaNotte(N2) || "L'ora sta finendo…"}</div>` : `<button class="oro grande avanti" data-a="avanti">Avanti</button>`}`;
  }
  // le animazioni non devono ripartire a ogni aggiornamento: ricordo quando e' iniziata questa scena
  const chiave = img + "|" + S.ciclo, nuova = !inizioScena[chiave];
  if (nuova) inizioScena[chiave] = Date.now();
  const da = (Date.now() - inizioScena[chiave]) / 1000;
  if (panoOra) return `<div class="scena con-pano ${nuova ? "entra" : ""}"><div class="scena-velo"></div><div class="scena-dentro">${testa}${corpo}</div></div>`;
  return `<div class="scena ${nuova ? "entra" : ""}"><div class="scena-foto" style="background-image:url('${img}');animation-delay:-${da.toFixed(1)}s"></div><div class="scena-nebbia" style="animation-delay:-${da.toFixed(1)}s"></div><div class="scena-velo"></div><div class="scena-dentro">${testa}${corpo}</div></div>`;
}
const inizioScena = {};
// dopo ogni azione della notte: cosa hai guadagnato o perso, quante Tracce hai lasciato, se la polizia ti guarda
function riquadroEsito(me) {
  const e = me.ultimoEsito; if (!e || e.ciclo !== S.ciclo || e.ora !== S.notte.ora) return "";
  const soldi = (x, sp) => x ? `<span style="color:${x > 0 ? (sp ? "#ff9a9a" : "var(--pulito)") : "#ffb3b3"}">${x > 0 ? "+" : "−"} ${euro(Math.abs(x))}${sp ? " sporchi" : ""}</span>` : "";
  const TR = ["nessuna traccia", "poche Tracce", "parecchie Tracce", "molte Tracce"], COL = ["var(--pulito)", "#ffd27a", "#ffab5e", "#ff6b6b"];
  const STATI = ["", "Voci: si parla di te", "Osservato: la polizia ti tiene d'occhio", "Indagato: la Gazzetta fa il tuo nome", "Processo all'Alba"];
  return `<div class="esito-notte"><b>Com'è andata</b><div class="esito-cifre">${soldi(e.dc) || ""}${e.dc && e.ds ? " · " : ""}${soldi(e.ds, true)}${!e.dc && !e.ds ? "<span>nessun soldo mosso</span>" : ""}</div>
    <div><span class="pallino" style="background:${COL[e.tr]}"></span> Hai lasciato <b>${TR[e.tr]}</b>${e.tr >= 2 ? ": all'Alba la polizia tira i dadi, più Tracce hai più rischi." : "."}</div>${e.sale ? `<div style="color:#ffb3b3">⚠️ ${STATI[e.sale]}.</div>` : ""}</div>`;
}
function testoTempo(r) { return r > 0 ? "Restano " + r + " secondi per quest'ora" : "Tempo finito: chi non ha scelto resta dov'è"; }
let orologioNotte = null, scadutoInviato = "", ultimoScaduto = 0;
function collegaScena(me) {
  const on = (a, f) => document.querySelectorAll(`.scena [data-a="${a}"]`).forEach((b) => b.onclick = f);
  document.querySelectorAll(".scena [data-vai]").forEach((b) => b.onclick = () => chiediViaggio(me, b.dataset.vai));
  on("avanti", () => { if (attesaAvanti) { const f = attesaAvanti; attesaAvanti = null; f(); return; } agisci({ tipo: "avanti" }); });
  on("negozio", () => finestraNegozio(me));
  on("soffiata", () => finestraSoffiata(me));
  on("altrove", () => finestraAltrove(me));
  on("tradisci", () => finestraDenuncia(me));
  on("cammina", () => iniziaCammino(me));
  on("casa", () => finestra(`<h2>Torni a casa?</h2><p>Per te la notte finisce qui. Non potrai più uscire fino all'alba.</p><div class="pulsanti"><button id="no">Resto fuori</button><button class="notte" id="si">Torno a casa</button></div>`, (d, c) => { d.querySelector("#no").onclick = c; d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "torna_a_casa" }); }; }));
  const scelte = S.notte.scelte || [];
  document.querySelectorAll(".scena [data-scelta]").forEach((b) => b.onclick = () => {
    const c = scelte[+b.dataset.scelta]; if (!c) return;
    const diretta = ["occ", "ricicla", "paradiso", "banchiere", "polizia", "doganiere", "rito", "scava", "jet"].includes(c.k);
    if (!diretta && !b.classList.contains("aperta")) { document.querySelectorAll(".scena .scelta.aperta").forEach((x) => x.classList.remove("aperta")); b.classList.add("aperta"); return; }
    if (c.k === "occ") return finestraOccasione(me, c.n);
    if (c.k === "ricicla") return finestraRicicla(me, false);
    if (c.k === "paradiso") return finestraRicicla(me, true);
    if (c.k === "banchiere" || c.k === "polizia") return finestraCorrompi(me, c.chi);
    if (c.k === "doganiere") return finestraDoganiere(me);
    if (c.k === "ballo") return agisci({ tipo: "ballo" });
    if (c.k === "ricettatore") return finestra(`<span class="kick" style="color:var(--sporco)">📦 Mercato Nero, il retro</span><h2>Il Ricettatore</h2>
      <p>Merce rubata: la paghi adesso in <b>contanti sporchi</b>, all'Alba la rivendi al <b>160%</b>. Ma 1 volta su 4 la Finanza trova il camion: perdi tutto e +8 Tracce. Lascia anche 3 Tracce per milione.</p>
      <p class="sub">Esempio: metti 1 milione. All'Alba ne incassi 1,6 (sporchi), oppure niente.</p>
      <div class="campo"><label for="ricImp">Quanto (da 100.000 € a 2 milioni, hai ${euro(me.sporchi)} sporchi)</label><input id="ricImp" type="number" step="100000" value="${Math.min(1_000_000, Math.floor((me.sporchi || 0) / 100000) * 100000)}"></div>
      <div class="pulsanti"><button id="x">Lascio stare</button><button class="notte" id="ok">Compro</button></div>`, (d, cl) => { d.querySelector("#x").onclick = cl; d.querySelector("#ok").onclick = () => { cl(); agisci({ tipo: "ricettatore", importo: +d.querySelector("#ricImp").value }); }; });
    if (c.k === "articolo") return finestraArticolo(me);
    if (c.k === "setta") return finestraSetta(me);
    if (c.k === "rito") return agisci({ tipo: "rito", setta: c.setta });
    if (c.k === "scava") return agisci({ tipo: "scava", setta: c.setta });
    if (c.k === "jet") return agisci({ tipo: "jet_setta", setta: c.setta });
    if (c.k === "foto") return agisci({ tipo: "foto", bersaglio: c.bersaglio });
    if (c.k === "aspetta") return agisci({ tipo: "aspetta" });
    if (c.k === "fissa") return c.puntata ? finestraPuntata(me, c) : agisci({ tipo: "attivita" });
    if (c.k === "spa") return agisci({ tipo: "spa" });
    if (c.k === "mia_serata") return agisci({ tipo: "giro_serata" });
    if (c.k === "brinda") return agisci({ tipo: "incontro", a: c.a, cosa: "drink" });
    if (c.k === "tavolo") return finestraPuntata(me, { ...c, id: "tavolo" });
    if (c.k === "serata") return finestra(`<span class="kick" style="color:var(--oro)">${ico("casino")} Il tuo Casinò privato · piano ${me.piani}</span><h2>Apri una serata</h2><p>Tutti ricevono l'invito. Chi viene sale nel tuo Palazzo e vede la Laguna dal piano ${me.piani}. Paga l'ingresso a te, poi gioca al tuo tavolo: il banco sei tu (vince un po' più spesso, ma se un ospite sbanca paghi tu).</p><p class="sub">Quanto fai pagare l'ingresso?</p><div class="riga" style="flex-wrap:wrap">${[0, 50_000, 100_000, 250_000].map((x) => `<button class="oro" data-ing="${x}">${x ? euro(x) : "Gratis"}</button>`).join("")}</div><div class="pulsanti"><button id="no">Non stanotte</button></div>`, (d, chiudi) => { d.querySelector("#no").onclick = chiudi; d.querySelectorAll("[data-ing]").forEach((b) => b.onclick = () => { chiudi(); agisci({ tipo: "serata", ingresso: +b.dataset.ing }); }); });
  });
  on("aspetta", () => agisci({ tipo: "aspetta" }));
  document.querySelectorAll("[data-cvvai]").forEach((b) => b.onclick = () => agisci({ tipo: "vai", luogo: b.dataset.cvvai }));
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
    // l'ora non deve mai bloccarsi: finito il tempo, chiunque sia collegato la fa avanzare, e se il server
    // risponde "non ancora" (orologi un po' diversi) o "riprova" si ritenta ogni 4 secondi finche' l'ora cambia
    const crudo = (N2.tempo || 120) - (oraServer() - N2.inizio) / 1000;
    if (r <= 0 && !LOCALE && (hoFinito || crudo <= -3) && (scadutoInviato !== chiave || Date.now() - ultimoScaduto > 4000)) { scadutoInviato = chiave; ultimoScaduto = Date.now(); chiama({ comando: "azione", partita, azione: { tipo: "tempo_scaduto" } }).then(() => caricaVista()).catch(() => { }); }
  }, 1000);
}
const ICO_FISSA = { giro: "gala", yacht: "marina", chiedi: "soffiata", carte: "bisca", gruisti: "porto", roulette: "casino", bozze: "gazzetta", osserva: "villa", mare: "faro" };
function finestraPuntata(me, c) {
  const puntate = [50_000, 100_000, 250_000, 500_000, 1_000_000].filter((x) => x <= (c.id === "roulette" ? me.cash : me.cash + me.sporchi));
  finestra(`<span class="kick" style="color:var(--cielo)">${ico(ICO_FISSA[c.id])} ${esc(nomeLuogo(S.notte.dove[mioId], true))}</span><h2>${esc(c.titolo)}</h2><p class="storia">${esc(c.testo)}</p>
    <p class="sub">${c.id === "tavolo" ? "Sette e mezzo contro il banco del padrone di casa: giochi tu la mano. Se vinci ti paga il doppio, se perdi i soldi vanno a lui." : c.id === "carte" ? "Sette e mezzo contro il banco: giochi tu la mano. Se vinci ti danno il doppio in contanti sporchi. Lascia qualche Traccia." : "Se vinci, ti danno il doppio, tutto pulito. Qui si gioca solo con soldi puliti."}${c.id === "carte" ? " Si paga prima con i soldi sporchi." : ""}</p>
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
      ${riga("sfida", "bisca", "Sfidalo a Sette e mezzo", "Giochi la tua mano, poi lui gioca la sua senza vedere le tue carte. Puoi rilanciare per bluffare. Se rifiuta, ti riprendi i soldi.")}
      ${riga("segui", "setta", "Seguilo", "Non se ne accorge. Alla fine dell'ora sai dove è andato.")}
      ${foto ? riga("foto", "macchina", "Fotografalo", "Se fa qualcosa di losco, hai una Prova.") : ""}
    </div>
    <div class="pulsanti"><button id="no">Lascia stare</button></div>`, (d, c) => {
    d.querySelector("#no").onclick = c;
    d.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => {
      const k = b.dataset.i; c();
      if (k === "foto") return agisci({ tipo: "foto", bersaglio: id });
      if (k === "sfida") return finestra(`<h2>Quanto metti sul tavolo?</h2><p class="sub">Sette e mezzo: chi si avvicina di più a 7 e mezzo senza superarlo prende tutto. Dopo la prima carta puoi rilanciare e raddoppiare. La puntata minima è ${euro(50_000)}. Hai ${euro(me.cash + (me.sporchi || 0))} (puliti + sporchi).</p>${me.cash + (me.sporchi || 0) < 50_000 ? `<p style="color:#ff9a9a">Non hai abbastanza soldi per sfidarlo: servono almeno ${euro(50_000)}.</p>` : ""}<div class="riga" style="flex-wrap:wrap">${[50_000, 100_000, 250_000, 500_000, 1_000_000].map((x) => `<button class="oro" data-p="${x}" ${x <= me.cash + (me.sporchi || 0) ? "" : "disabled"}>${euro(x)}</button>`).join("")}</div><div class="pulsanti"><button id="no">Lascia stare</button></div>`, (d2, c2) => { d2.querySelector("#no").onclick = c2; d2.querySelectorAll("[data-p]").forEach((x) => x.onclick = () => { c2(); agisci({ tipo: "incontro", a: id, cosa: "sfida", importo: +x.dataset.p }); }); });
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
    <h2>${pr.tipo === "drink" ? esc(da.nome) + " ti offre da bere" : esc(da.nome) + " ti sfida a Sette e mezzo"}</h2>
    <p>${pr.tipo === "drink" ? "Un cameriere posa due bicchieri sul tuo tavolo. Se accetti: +2 fama, ma potresti parlare troppo." : "Ha già giocato la sua mano a Sette e mezzo, coperta, e ha messo <b>" + euro(pr.importo) + "</b> sul tavolo." + (pr.rilancio ? " <b>Ha rilanciato</b>: ha una mano forte, o sta bluffando." : "") + " Per accettare metti altrettanto e giochi la tua mano."}</p>
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
    <div class="lista-luoghi">${luoghi.map((l) => { const ore = L.oreViaggio(S, me, dove, l); const gente = 0; /* chi c'e' in un posto lo scopri solo arrivando */ return `<button class="luogo-riga" data-l="${l}" ${ore > restano ? "disabled" : ""} style="background-image:linear-gradient(90deg,rgba(6,10,24,.92),rgba(6,10,24,.55)),url('${SCENA_NOTTE[l]}')"><span class="ic">${ICO_LUOGO[l]}</span><span style="flex:1;text-align:left"><b>${esc(nomeLuogo(l, true))}</b><br><span class="sub">${l === "palazzo" ? "Casa tua" : esc(L.NOMI_ISOLE[L.LUOGHI[l].isola] || "")}${gente ? " · " + gente + (gente === 1 ? " persona" : " persone") + " ci sono già" : ""}${chiamate.has(l) ? " · appuntamento" : ""}${(me.calore || {})[l] ? ` · <span style="color:${me.calore[l] >= 2 ? "#ff5c5c" : "#f3c56b"}">qui ti conoscono ${"●".repeat(Math.min(3, me.calore[l]))}</span>` : ""}</span></span>${(() => { const v = PERSONAGGI.filter((pg) => pg.dove === l && pg.quando !== "raro"); return v.length ? `<span class="volti-riga" title="${esc(v.map((pg) => pg.nome).join(", "))}">${v.map((pg) => volto(pg)).join("")}</span>` : ""; })()}<span class="ore">${ore === 1 ? "1 ora" : "2 ore"}</span></button>`; }).join("")}</div>
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
    if (scaduto) return `<div class="appunt scad">${ico("sconosciuto")} <span>L'appuntamento con «${esc(c.nome)}» a <b>${esc(L.LUOGHI[c.luogo].nome)}</b> era entro le ${L.ORE[c.alle]}: quel contatto se n'è andato. Chi trovi qui adesso è un'altra persona.</span></div>`;
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
  document.querySelectorAll("[data-cvvai]").forEach((b) => b.onclick = () => agisci({ tipo: "vai", luogo: b.dataset.cvvai }));
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
// al Faro (in prigione) queste app non si possono usare: non hanno azioni da "telefonata"
const SPENTE_FARO = ["imprese", "agenzia", "palazzo", "lusso", "valigetta", "sporchi", "grandi"];
const APPS = [
  { k: "impero", nome: "Il mio impero", ico: ico("impero"), col: "#b8860b", lv: 0 },
  { k: "conti", nome: "I miei conti", ico: ico("soldi"), col: "#1f6f50", lv: 0 },
  { k: "scoperte", nome: "Da scoprire", ico: ico("stella"), col: "#e0a526", lv: 0 },
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
  { k: "grandi", nome: "Grandi Affari", ico: ico("tv"), col: "#e11d48", lv: 4 },
];
// ogni messaggio arriva da una persona: stessa persona = stessa conversazione
const MITTENTI = [
  [/^Vera:/, "Vera", ico("vera"), "#ff5fa2"],
  [/^Lenz:/, "Il banchiere Lenz", ico("banca"), "#0f766e"],
  [/^Vargas:/, "Il Commissario Vargas", ico("siren"), "#1e3a8a"],
  [/^Il doganiere:|^Il doganiere/, "Il doganiere", ico("aereo"), "#0e7490"],
  [/^L'agente/, "L'agente di quartiere", ico("siren"), "#2f6fe0"],
  [/^Fascicolo su|esposto|Esposto|Inchiesta pubblicata|fascicolo|inchiesta su di te/, "Procura della Laguna", ico("tribunale"), "#8d1f2c"],
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
// ------------------------------------------------------------ la Gazzetta della Laguna
// Prima pagina per ogni Ciclo (titolone, foto, sezioni), "Ultim'ora" che scorre in alto quando succede
// qualcosa di grosso, e i più potenti per fascia (mai i saldi).
const gazzettaVista = new Set();
const PESO_NOTIZIA = { scandalo: 9, parola: 8, allarme: 8, evento: 7, politica: 6, borsa: 5, affari: 4, fama: 3, notarile: 2, voce: 2, notizia: 1 };
const SEZIONI_GAZZETTA = [["Cronaca nera", ["scandalo", "allarme", "parola"]], ["Politica", ["politica"]], ["Affari", ["affari", "notarile", "notizia"]], ["Mondanità", ["fama"]], ["Si dice che…", ["voce"]], ["La Laguna", ["evento"]]];
function fotoNotizia(g) {
  const x = g.testo;
  const regole = [[/Porto|carico|container/i, "img/notte-porto.jpg"], [/Casin/i, "img/notte-casino.jpg"], [/Faro|arrestat|cella|Processo|condann|Procura/i, "img/notte-faro.jpg"], [/Borsa|titol|cripto|Coin|Token/i, "img/corona.jpg"],
    [/Sindaco|Municipio|legge|tasse|elezion/i, "img/corona.jpg"], [/setta|simboli|Faro/i, "img/notte-villa.jpg"], [/yacht|Marina|jet|elicottero/i, "img/notte-marina.jpg"], [/Aeroporto|dogan/i, "img/notte-aeroporto.jpg"],
    [/Flamingo/i, "img/flamingo.jpg"], [/Palma/i, "img/palma.jpg"], [/Ambra/i, "img/ambra.jpg"], [/Sole/i, "img/sole.jpg"], [/Corona/i, "img/corona.jpg"], [/Gazzetta|giornal|foto/i, "img/notte-redazione.jpg"], [/palazzo|piano|grattacielo|Attico/i, "img/penthouse.jpg"]];
  for (const [re, img] of regole) if (re.test(x)) return img;
  return g.tipo === "scandalo" ? "img/notte-redazione.jpg" : "img/laguna.jpg";
}
function titolone(testo) {
  const t = testo.split(/[.:!]/)[0];
  return t.length > 70 ? t.slice(0, 68) + "…" : t;
}
function primaPagina(ciclo, compatta) {
  const items = S.gazzetta.filter((g) => g.ciclo === ciclo && !/^Sorge il sole/.test(g.testo));
  if (!items.length) return `<div class="giornale"><div class="testata"><b>La Gazzetta della Laguna</b><span>Ciclo ${ciclo}</span></div><p class="sub" style="padding:10px">Niente di nuovo, per ora. Ma la notte è lunga.</p></div>`;
  const ord = [...items].sort((a, b) => (PESO_NOTIZIA[b.tipo] || 1) - (PESO_NOTIZIA[a.tipo] || 1) || S.gazzetta.indexOf(b) - S.gazzetta.indexOf(a));
  const apertura = ord[0], resto = ord.slice(1);
  const borsa = S.borsaIeri ? L.AZIENDE.map((a) => { const d = (S.borsa[a] / (S.borsaIeri[a] || S.borsa[a]) - 1) * 100; return `<span class="titolo-borsa"><b>${esc(a)}</b> ${S.borsa[a].toFixed(0)} <i style="color:${d >= 0 ? "var(--pulito)" : "var(--sporco)"}">${d >= 0 ? "▲" : "▼"} ${Math.abs(d).toFixed(1)}%</i></span>`; }).join("") : "";
  const sezioni = compatta ? `<div class="g-sez">${resto.slice(0, 3).map((g) => `<p class="g-breve">${esc(g.testo)}</p>`).join("")}</div>`
    : (() => { const io_ = S.players.find((x) => x.id === mioId), mie = io_ ? resto.filter((g) => g.testo.includes(io_.nome)) : []; return mie.length ? `<div class="g-sez g-mie"><span class="g-sez-t">Parlano di te</span>${mie.map((g) => `<p class="g-breve">${esc(g.testo)}</p>`).join("")}</div>` : ""; })()
    + SEZIONI_GAZZETTA.map(([nome, tipi]) => { const xs = resto.filter((g) => tipi.includes(g.tipo || "notizia")); return xs.length ? `<div class="g-sez"><span class="g-sez-t">${nome}</span>${xs.slice(0, 4).map((g) => `<p class="g-breve">${esc(g.testo)}</p>`).join("")}${xs.length > 4 ? `<details><summary class="sub">altre ${xs.length - 4}</summary>${xs.slice(4).map((g) => `<p class="g-breve">${esc(g.testo)}</p>`).join("")}</details>` : ""}</div>` : ""; }).join("")
      + (borsa ? `<div class="g-sez"><span class="g-sez-t">Borsa della Laguna</span><div class="g-borsa">${borsa}</div></div>` : "");
  return `<div class="giornale">
    <div class="testata"><b>La Gazzetta della Laguna</b><span>Ciclo ${ciclo} · ${ciclo === S.ciclo + 1 ? "ultima edizione" : "edizione del Ciclo " + ciclo}</span></div>
    <div class="g-apertura" style="background-image:linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(0,0,0,.85)),url('${fotoNotizia(apertura)}')"><span class="g-kick">${{ scandalo: "Scandalo", allarme: "Allarme", evento: "In primo piano", politica: "Politica", borsa: "Borsa", affari: "Affari", fama: "Mondanità", voce: "Indiscrezioni" }[apertura.tipo] || "Cronaca"}</span><h3>${esc(titolone(apertura.testo))}</h3></div>
    <p class="g-occhiello">${esc(apertura.testo)}</p>
    ${sezioni}
  </div>`;
}
function potentiHtml() {
  const ORD = ["Sovrano", "Magnate", "Milionario", "Ricco", "Benestante"];
  const cl = [...S.players].map((p) => ({ p, f: p.id === mioId ? L.fascia(S, p) : p.fascia })).sort((a, b) => (b.p.livello || 0) - (a.p.livello || 0) || (ORD.indexOf(a.f) < 0 ? 9 : ORD.indexOf(a.f)) - (ORD.indexOf(b.f) < 0 ? 9 : ORD.indexOf(b.f)) || (b.p.fama || 0) - (a.p.fama || 0));
  return `<div class="g-sez"><span class="g-sez-t">I giocatori della Laguna</span><table class="g-potenti"><tr><th></th><th>Chi</th><th>Livello</th><th>Fama</th><th>Vive da</th></tr>${cl.map((x, i) => `<tr${x.p.id === mioId ? ' class="io"' : ""}><td>${i + 1}</td><td><b>${esc(x.p.nome)}</b>${S.sindaco === x.p.id ? " 🎗️" : ""}${x.p.id === mioId ? " (tu)" : ""}</td><td>${x.p.livello ?? "?"}</td><td>${x.p.fama ?? "?"}</td><td>${esc(x.f || "?")}</td></tr>`).join("")}</table><span class="sub" style="font-size:11px">Il Livello sale con i soldi e non scende. La Gazzetta non conosce i conti di nessuno: solo come vivono.${S.sindaco ? " 🎗️ = Sindaco." : ""}</span></div>`;
}
// le situazioni in corso nella Laguna (durano 1 o 2 Cicli)
function situazioniHtml() {
  const xs = S.situazioniAttive || [];
  return `<div class="giornale" style="margin-bottom:10px"><div class="testata"><b>Adesso in Laguna</b><span>${xs.length ? xs.length + (xs.length === 1 ? " situazione" : " situazioni") : "tutto tranquillo"}</span></div>
    ${xs.map((x) => `<div class="g-sez"><p class="g-breve"><b>${esc(x.t)}</b><br><span style="color:var(--oro)">${esc(x.spiega)}</span><br><span class="sub" style="font-size:11px">${x.fino - S.ciclo - 1 <= 0 ? "Finisce all'Alba" : "Dura ancora " + (x.fino - S.ciclo) + " Cicli"}</span></p></div>`).join("")}
    ${S.sitProssime ? `<p class="sub" style="padding:6px 10px;font-size:12px">Si dice che al prossimo Ciclo succederà qualcosa: leggi "Si dice che…" qui sotto e preparati.</p>` : ""}</div>`;
}
// ogni aggiornamento delle regole si annuncia una volta, al primo ingresso dopo l'aggiornamento
const NOVITA = { 88: ["<b>La tua serata.</b> Dopo che hai aperto la serata nel tuo Casinò privato, ogni ora trovi «Scendi nel tuo Casinò»: vedi chi è al tavolo e quanto ha fatto il banco. Il primo giro dei tavoli con ospiti dà fama (+1 per ospite, fino a 3). Se la sala è vuota, rimandi gli inviti.", "«Apri una serata» ora compare sempre per prima nel tuo Palazzo: prima poteva sparire dietro altre scelte."], 85: ["<b>La soffiata.</b> Di notte, da qualunque posto, puoi chiamare la polizia e fare il nome di un rivale e del posto dove pensi che lavori. Se indovini, i suoi guai lì quasi raddoppiano e, se lo prendono, hai una Prova contro di lui. Costa 100.000 €.", "<b>Attento a te.</b> Anche gli altri possono venderti, compresi i computer più furbi, che sanno dove lavori di solito. Se senti che ci sono più divise del solito, forse aspettano proprio te. A volte un informatore ti avvisa di chi ti ha tradito.", "<b>Mondo 3D.</b> Nel pannello Vista a destra c'è il tasto «Mondo 3D»: la Laguna diventa un mondo vero che giri e avvicini da ogni lato, con il mare che cambia colore sui fondali, palme, barche che navigano, grattacieli e casette con le finestre (di notte si accendono). Il tasto «Foto» ti riporta alla foto. Il gioco ricorda la tua scelta.", "<b>Cammina di notte.</b> Con il Mondo 3D acceso, di notte c'è il tasto «🚶 Cammina»: guidi il tuo personaggio per le isole (frecce o W A S D, sul telefono tocchi dove andare). Ogni posto è una colonna di luce: avvicinati e premi «Entra» per andarci (costa le ore di sempre)."], 84: ["<b>Tutti gli affari si giocano.</b> Come alla Marina, ora anche il container, gli orologi, il tavolo truccato, la merce rubata, i quadri falsi, il peschereccio, la villa, i lingotti, il volo cargo, la spedizione e gli affari della setta al Faro hanno i loro bivi: come entri, quanto prendi, e poi il segnale. Ogni posto ha i suoi segnali: impara a leggerli."], 83: ["<b>Il colpo si gioca.</b> Alla Marina dei Re «Il carico dal mare» non si risolve più da solo: decidi come arrivi alla barca (a remi, a motore o pagando il guardiano) e quanto carico prendi. Ogni scelta cambia il rischio e il bottino, e lo vedi subito.", "Alla fine arriva un segnale (una luce, un rumore). Dice il vero 3 volte su 4: scappi, ti nascondi o tiri dritto? Hai 20 secondi per ogni scelta: se esiti, va peggio.", "Presto lo stesso negli altri affari della notte."], 82: ["<b>La condanna fa più paura.</b> Le protezioni (setta, Giudici, avvocato) abbassano la pena, ma la multa resta almeno il 60% di quella piena, in proporzione a quanto possiedi. Un reato gravissimo non scende mai sotto Grave. E 1 volta su 8 il Procuratore capo non fa nessuno sconto: lo vedi scritto prima, nella pena che rischi. Caveau e Giudice supremo salvano al massimo il 60% dei soldi sporchi.", "<b>Soldi sporchi più duri da fare.</b> Ai Livelli alti gli affari della notte rendono meno di prima (Livello 4: ×2,4 invece di ×4), e la finestra dell'affare ora mostra la cifra vera. Ripulire: +5% di rischio per ogni milione oltre il primo (prima +4%).", "<b>La setta conta.</b> Di notte la tua setta lavora con te: +10% sugli affari sporchi per ogni suo livello (livello 4 = +40%), e quando ripulisci ti copre (rischio × 0,8)."], 81: ["<b>La Fedina degli altri è segreta.</b> Vedi solo la tua: degli altri non sai più se hanno fatto cose losche.", "<b>Mercato Nero più duro.</b> Maschera, disturbatore, telefono usa-e-getta e documenti falsi non ci sono più tutte le notti: ogni notte ne escono solo 2. E costano di più: maschera 70.000 €, disturbatore 150.000 €, telefono 35.000 €, documenti 250.000 €.", "<b>Chi non risponde.</b> Se un amico non si fa vivo da 3 minuti, accanto al suo nome in alto compare «non risponde» e, a chi ha creato la partita, il pulsante «Fai giocare il computer».", "<b>La notte finisce quando la chiudi tu.</b> Se stai ancora leggendo «Com'è andata», i dadi del giorno dopo aspettano il tuo Avanti.", "<b>Tabellone:</b> sul telefono il nome dell'isola non copre più le caselle (prima il Molo non si poteva toccare)."], 80: ["<b>Gazzetta: i giocatori.</b> In cima alla Gazzetta, anche dal telefono, c'è la tabella di tutti i giocatori: Livello, fama e come vivono (Benestante, Ricco…). Prima il Livello degli altri non si vedeva."], 79: ["<b>Ripulire è un rischio.</b> Ogni volta che ripulisci soldi sporchi (Casinò, ShadowCoin, paradiso fiscale, la tua banca) la Finanza può scoprirti. Il rischio parte dal 3-6% e sale con la somma (+4% per ogni milione oltre il primo) e con quante volte hai ripulito negli ultimi 3 Cicli (+5% a volta), fino a un massimo del 50%. Lo vedi scritto prima di decidere.", "Se ti scopre: ti sequestra metà della somma, il resto resta sporco, +12 Tracce e l'indagine sale di un gradino. Il banchiere Lenz dalla tua parte abbassa il rischio. Somme piccole e pause tengono basso il pericolo."], 78: ["<b>Sentenza spiegata.</b> Quando ti condannano si apre una finestra grande: perché sei finito a Processo, quanto è grave la pena (e cosa l'ha alzata o abbassata), e ogni effetto uno per uno: cosa perdi, quanto e per quanto tempo. In fondo, in breve, come funzionano soldi sporchi e condanne.", "Puoi rileggere l'ultima sentenza dall'app Soldi sporchi, nella scheda «Le tue piste»."],
  77: ["<b>Chi esce dalla partita.</b> Accanto al nome di chi ha chiuso il gioco compare \"non collegato\". Se resta via più di 3 minuti, al suo posto gioca il computer e la partita va avanti; quando torna riprende lui.", "<b>Esci dalla partita</b> (in fondo al telefono) ora è vero: il tuo posto passa al computer e gli altri continuano. Chi ha creato la partita può anche far giocare subito il computer al posto di chi non c'è.", "<b>Sala d'attesa.</b> Chi esce dalla sala libera il suo posto; chi ha creato la partita vede chi non è collegato e può mettere il computer al suo posto."],
  76: ["<b>Viaggio rapido.</b> Ora si fa una volta ogni 2 Cicli e costa il carburante: motoscafo 100.000 €, elicottero 300.000 €, jet 600.000 €. Ti costa anche la mossa del giorno. Il taxi per il Municipio non c'è più: ti candidi a Sindaco allo sportello, o dal telefono pagando il doppio.",
  "<b>Il Timbro del Municipio</b> non si consuma più da solo: quando chiedi un permesso il gioco ti chiede se vuoi usarlo.",
  "<b>Prova di fedeltà.</b> Costa il 10% del Tesoro (almeno 2 milioni), e di più se la rifai nello stesso Ciclo. Il membro lo sa. Se era fedele, la setta perde 3 Influenza.",
  "<b>Chi vende la setta paga.</b> Il Gran Maestro tiene una Prova sul traditore, e per 4 Cicli nessuna setta lo prende. Al rito, sotto il cappuccio, solo il Gran Maestro sa chi c'è.",
  "<b>Patto sulla parola.</b> Quando scade, chi deve pagare ha tempo fino all'Alba dopo (\"Paga ora\" nell'app Contratti). Se non paga, rompe la parola: −8 fama. Quando qualcuno rompe la parola (anche un Favore) esce in Ultim'ora e compare un avviso a tutti e due.",
  "<b>Notte più segreta.</b> Di notte non vedi più chi sta ancora decidendo: solo quanti giocatori aspettiamo. <b>Versione nuova.</b> Se il gioco è stato aggiornato, in alto compare \"C'è una versione nuova del gioco\": tocca Aggiorna.",
  "<b>Favori scritti giusti.</b> Nel patto la frase del Favore ora dice chi lo deve a chi, con il nome (es. Passo libero: chi non paga affitti sui terreni di chi). <b>Borsa più chiara:</b> prezzo in €, variazione dall'Alba, quante azioni hai e quanto valgono, Vendi metà o tutto."], 75: ["<b>I Servizi dei contatti.</b> Un poliziotto o un banchiere comprato ora ti fa un Servizio per Ciclo: una transenna sul tabellone, una retata dove vuoi tu, il conto di un rivale, un carico tenuto da parte. App Soldi sporchi, La tua rete.",
  "<b>Attento all'umore.</b> Ogni Servizio rende il contatto più nervoso: più lo usi, prima gli Affari Interni arrivano a lui. E poi a te.",
  "<b>La Fedina pulita.</b> Ogni Ciclo senza atti sporchi la fa crescere. A 2 puoi firmare un esposto, a 4 aprire un'inchiesta su un rivale, a 6 donare un'opera alla città. App Municipio, «Cittadino onesto».",
  "<b>Basta un atto sporco</b> e la Fedina torna a zero. Prima di una mossa sporca il gioco te lo dice. La Fedina degli altri la vedi accanto al loro nome."], 74: ["<b>I Favori.</b> In un patto (app Contratti) ora puoi chiedere un Favore: un voto alle elezioni, un passaggio gratis sui suoi terreni, un silenzio, un appuntamento di notte. Il gioco lo fa rispettare.",
  "<b>I miei fili.</b> In Rubrica vedi chi ti deve un Favore e a chi lo devi tu. Chi rompe la parola perde fama, finisce sulla Gazzetta e per 2 Cicli nessuno si fida di lui.",
  "<b>Il ricatto.</b> Una Prova non serve solo a denunciare: dall'app Prove puoi mostrarla al rivale e chiedergli un Favore. È un reato grave: +6 Tracce subito.",
  "<b>Se ti ricattano</b> scegli: accetti, rifiuti, confessi (e fai il suo nome sulla Gazzetta) oppure, se hai una Prova su di lui, pari e patta."], 73: ["<b>Aste giuste.</b> Chi rinuncia non può più offrire, la base d'asta è il 60% del prezzo e le offerte si scoprono solo alla fine.",
  "<b>Trucchi chiusi.</b> La spinta in Borsa della setta non si ripete più a volontà, il Casinò privato non ripulisce gratis, le pene si calcolano in un modo solo e chiaro.",
  "<b>Notte.</b> Le proposte tra giocatori non spariscono più, e il Sette e mezzo tra giocatori si gioca davvero.",
  "<b>Musica e suoni rifatti:</b> funzionano anche su iPhone.",
  "<b>Solo nelle partite nuove:</b> permessi sicuri ma con un bollo, affitti che crescono di più con il livello, Palazzo che non fa più esplodere i soldi nelle partite lunghe."], 72: ["<b>Tabellone nuovo.</b> È la foto della Laguna in rilievo. Le caselle sono piazzole dipinte sulla strada: il colore è il quartiere, il bordo colorato dice di chi è. A destra, in Vista: Arcipelago (tutta la Laguna), Segui (la tua auto) e Piatta. Tocca un'isola per volarci dentro.", "<b>Partita più sicura.</b> Un valore sbagliato non blocca più la partita, e nessuno può spiare le carte degli altri a Sette e mezzo."], 70: ["<b>Strumenti del mercato nero.</b> Al Mercato Nero, al Porto e al Casinò ogni notte ci sono 3 strumenti diversi, presi a caso tra 24. Ognuno è unico: chi arriva prima lo prende. Ci sono strumenti rari e leggendari. Quelli grossi occupano 2 posti nella valigetta, che resta della stessa misura: scegli bene cosa portarti.",
  "<b>Come si usano.</b> Prima di un affare scegli cosa portare. Alcuni ti salvano da un pericolo, altri fanno rendere di più un colpo preciso, altri tolgono Tracce. Alcuni funzionano in coppia, per esempio Maschera + Guanti. Il Timbro del Municipio si usa di giorno: il permesso è sicuro, ma lascia Tracce.",
  "<b>Situazioni della Laguna.</b> A ogni Alba succede qualcosa: uno sciopero chiude il Porto, l'alta marea abbassa gli affitti di Sole, un black-out spegne le telecamere di Corona, la Finanza cerca i contanti… Sono più di 100. Durano 1 o 2 Cicli e aiutano alcuni e colpiscono altri.",
  "<b>Prepararsi.</b> Metà delle situazioni la Gazzetta le annuncia un Ciclo prima, in \"Si dice che…\". Le altre arrivano a sorpresa. Cosa succede adesso lo vedi in Gazzetta, nel riquadro \"Adesso in Laguna\".",
  "<b>Il rischio della notte è quello vero.</b> Ora conta anche il Commissario Vargas e le situazioni in corso."] };
function mostraNovita() {
  const ver = L.VERSIONE_REGOLE || 0; let vista = 0;
  try { vista = +(localStorage.getItem("laguna_regole") || 0); localStorage.setItem("laguna_regole", String(ver)); } catch (e) { return; }
  const nuove = Object.keys(NOVITA).map(Number).filter((v) => v > vista && v <= ver).sort();
  if (!nuove.length || !vista && !S) return;
  finestra(`<span class="kick" style="color:var(--oro)">${ico("stella")} Novità nel gioco</span><h2>Cosa è cambiato</h2>${nuove.map((v) => `<ul style="text-align:left;padding-left:18px;margin:8px 0">${NOVITA[v].map((x) => `<li style="margin:6px 0">${x}</li>`).join("")}</ul>`).join("")}<div class="pulsanti"><button class="oro" id="ok">Ho capito</button></div>`, (d, c) => d.querySelector("#ok").onclick = c);
}
let gazzettaCiclo = null;
function appGazzetta() {
  const cicli = [...new Set(S.gazzetta.map((g) => g.ciclo))].sort((a, b) => b - a);
  const c = gazzettaCiclo && cicli.includes(gazzettaCiclo) ? gazzettaCiclo : cicli[0] || S.ciclo + 1;
  return `<div class="riga" style="justify-content:space-between;margin-bottom:8px"><button class="piccolo" data-gciclo="${c - 1}" ${cicli.includes(c - 1) ? "" : "disabled"}>‹ Ciclo prima</button><button class="piccolo" data-gciclo="${c + 1}" ${cicli.includes(c + 1) ? "" : "disabled"}>Ciclo dopo ›</button></div>`
    + `<div class="giornale" style="margin-bottom:10px">${potentiHtml()}</div>` + situazioniHtml() + primaPagina(c);
}
// Ultim'ora: le notizie grosse scorrono in alto mentre giochi
const codaUltimOra = []; let ultimOraAttiva = false;
function ultimOra(gaz) {
  for (const g of gaz) {
    const k = g.ciclo + "|" + g.testo; if (gazzettaVista.has(k)) continue; gazzettaVista.add(k);
    if ((PESO_NOTIZIA[g.tipo] || 1) >= 5) codaUltimOra.push(g);
  }
  while (codaUltimOra.length > 4) codaUltimOra.shift();
  if (!ultimOraAttiva) mostraUltimOra();
}
function mostraUltimOra() {
  const g = codaUltimOra.shift(); if (!g) { ultimOraAttiva = false; return; }
  ultimOraAttiva = true;
  const el = document.createElement("div"); el.className = "ultimora";
  el.innerHTML = `<span class="uo-t">Ultim'ora</span><span class="uo-testo">${esc(g.testo)}</span>`;
  el.onclick = () => { el.remove(); apriApp("gazzetta"); };
  document.body.appendChild(el);
  setTimeout(() => { el.classList.add("via"); setTimeout(() => { el.remove(); mostraUltimOra(); }, 500); }, VELOCE ? 300 : 6500);
}

// ------------------------------------------------------------ telefono: home chiara
// App raggruppate, una riga di stato sotto ogni icona, pallino rosso solo per le cose da fare,
// "NUOVA" sulle app appena sbloccate, e in alto "Adesso puoi" con 1-3 cose da fare subito.
const GRUPPI_APP = [["Soldi", ["impero", "conti", "banca", "borsa"]], ["Costruire", ["imprese", "agenzia", "palazzo", "lusso"]], ["Persone", ["messaggi", "rubrica", "contratti", "setta"]], ["Notte", ["valigetta", "sporchi", "prove"]], ["Città", ["gazzetta", "grandi", "municipio", "scoperte"]]];
const APP_SEMPRE = ["impero", "imprese", "agenzia", "banca", "gazzetta", "messaggi", "valigetta", "palazzo", "lusso", "rubrica", "municipio"];
function appViste() { try { return new Set(JSON.parse(localStorage.getItem("laguna_appviste_" + partita) || "[]")); } catch (e) { return new Set(); } }
function segnaAppVista(k) { try { const v = appViste(); v.add(k); localStorage.setItem("laguna_appviste_" + partita, JSON.stringify([...v])); } catch (e) { } }
function appNuova(k) { return !APP_SEMPRE.includes(k) && !appViste().has(k); }
function contrattiPerMe() { return (S.contratti || []).filter((c) => c.a === mioId && c.stato === "proposto"); }
// riga di stato e numero di cose da fare per ogni app
function statoApp(me, k, nuovi) {
  const miei = S.lotti.filter((l) => l.owner === mioId);
  switch (k) {
    case "impero": return { riga: kEuro(L.patrimonio(S, me, false)) };
    case "conti": { const c = (me.conti || {})[S.ciclo] || {}; let t = 0; for (const v of Object.values(c)) t += v[0]; return { riga: (t >= 0 ? "+" : "−") + kEuro(Math.abs(t)) + " oggi" }; }
    case "banca": { const scade = (me.prestiti || []).filter((p) => p.scadenza <= S.ciclo + 1).length; return { riga: me.debito > 0 ? "debito " + kEuro(me.debito) : "nessun debito", fare: scade }; }
    case "borsa": { let inv = 0; for (const a of L.AZIENDE) inv += (me.azioni[a] || 0) * S.borsa[a]; for (const m of L.MONETE) inv += (me.cripto[m] || 0) * S.cripto[m]; return { riga: inv > 0 ? "portafoglio " + kEuro(inv) : "niente investito" }; }
    case "imprese": { const vuoti = miei.filter((l) => l.tipoCasella === "lotto" && !l.lvl && !l.cantiere).length; return { riga: vuoti ? vuoti + (vuoti === 1 ? " terreno vuoto" : " terreni vuoti") : miei.filter((l) => l.lvl > 0).length + " attività", caldo: vuoti > 0 }; }
    case "agenzia": { const lib = S.lotti.filter((l) => !l.owner && l.tipoCasella === "lotto").length; return { riga: lib + " liberi" }; }
    case "palazzo": return { riga: me.piani ? me.piani + (me.piani === 1 ? " piano" : " piani") : "da costruire" };
    case "lusso": return { riga: (me.veicoli || []).length ? (me.veicoli.length === 1 ? "1 mezzo" : me.veicoli.length + " mezzi") : "nessun mezzo" };
    case "messaggi": return { riga: nuovi ? nuovi + (nuovi === 1 ? " nuovo" : " nuovi") : "letti", fare: nuovi };
    case "rubrica": return { riga: "chi conta" };
    case "contratti": { const n = contrattiPerMe().length; return { riga: n ? "proposta per te" : (S.contratti || []).filter((c) => c.stato === "attivo" && (c.a === mioId || c.da === mioId)).length + " attivi", fare: n }; }
    case "setta": { const inv = (S.inviti || []).length; return { riga: inv ? "invito segreto" : S.sette.length ? esc(S.sette[0].nome) : "fondala", fare: inv }; }
    case "valigetta": return { riga: (me.valigetta || []).length + " / " + (S.postiValigetta || 0) };
    case "sporchi": { const cal = Object.keys(me.calore || {}).length || me.calSoldi > 0; return { riga: kEuro(me.sporchi || 0), caldo: !!cal }; }
    case "prove": return { riga: (me.prove || []).length + " in mano" };
    case "gazzetta": return { riga: "Ciclo " + (S.ciclo + 1) };
    case "municipio": { const sind = S.players.find((p) => p.id === S.sindaco); return { riga: sind ? "Sindaco " + esc(sind.nome) : "Sindaco Albertini" }; }
    case "grandi": { const gg = S.grandi || {}; const asta = L.ORDINE_GRANDI.find((k) => gg[k] && gg[k].stato === "asta"); const miei = L.ORDINE_GRANDI.filter((k) => gg[k] && gg[k].capo === mioId);
      if (asta) return { riga: "asta: " + (asta === "tv" ? "TV" : "Banca"), fare: gg[asta].offerte && gg[asta].offerte[mioId] ? 0 : 1 };
      if (miei.length) return { riga: "comandi " + miei.map((k) => (k === "tv" ? "TV" : "Banca")).join(" e "), fare: gg.tv && gg.tv.capo === mioId && gg.tv.titoloneCiclo !== S.ciclo ? 1 : 0 };
      return { riga: L.ORDINE_GRANDI.some((k) => gg[k]) ? "in mano ad altri" : "chiusi" }; }
    case "scoperte": { const n = L.SCOPERTE.filter((x) => (me.scoperte || {})[x.id] !== undefined).length; return { riga: n + " / " + L.SCOPERTE.length }; }
  }
  return { riga: "" };
}
const APP_DI_SCOPERTA = { agenzia: "agenzia", permesso: "imprese", piano: "palazzo", veicolo: "lusso", prestito: "banca", investi: "borsa", contratto: "contratti", evasione: "banca", candidati: "municipio", ricicla: "sporchi", corrompi: "sporchi", oggetto: "valigetta", fonda_setta: "setta", invita_setta: "setta", denuncia: "prove", serata: "palazzo", proposta: "agenzia" };
// le 1-3 cose piu' importanti da fare adesso
function adessoPuoi(me, nuovi) {
  const out = [];
  if ((S.inviti || []).length) out.push({ testo: "Hai ricevuto un invito segreto in una setta.", app: "setta", forte: true });
  const k = contrattiPerMe(); if (k.length) out.push({ testo: (S.players.find((p) => p.id === k[0].da) || {}).nome + " ti propone un contratto.", app: "contratti", forte: true });
  if (S.resaAnnunciata && !S.fine && (me.sporchi > 0 || Object.keys(me.calore || {}).length)) out.push({ testo: "Inchiesta finale in arrivo: ripulisci gli sporchi e stai lontano dai posti dove ti conoscono.", app: "sporchi", forte: true });
  const caldo = Object.entries(me.calore || {}).sort((a, b) => b[1] - a[1])[0];
  if (caldo && caldo[1] >= 2) out.push({ testo: "Al " + (L.LUOGHI[caldo[0]] || {}).nome + " ti conoscono: stanotte cambia posto.", app: "sporchi" });
  if (nuovi) out.push({ testo: nuovi === 1 ? "Hai un messaggio nuovo." : "Hai " + nuovi + " messaggi nuovi.", app: "messaggi" });
  const cons = ((S.ultimaAlba || {}).riepilogo || {})[mioId]?.consiglio;
  if (S.consigli !== false && cons && (me.scoperte || {})[cons.id] === undefined) out.push({ testo: "Vera: " + cons.testo, app: APP_DI_SCOPERTA[cons.id] || "scoperte" });
  return out.slice(0, 3);
}
function homeTelefono(me, nuovi) {
  const vis = APPS.filter((a) => appVisibile(me, a));
  const cose = adessoPuoi(me, nuovi);
  const alFaro = me.faro > 0 && S.fase === "giorno";
  const usata = me.telefonataUsata === S.ciclo * 10 + S.giorno;
  const icona = (a) => {
    const st = statoApp(me, a.k, nuovi), nuova = appNuova(a.k);
    return `<button class="app ${alFaro && SPENTE_FARO.includes(a.k) ? "spenta" : ""}" data-app="${a.k}"><span class="ico" style="background:${a.col}">${a.ico}${st.fare ? `<span class="badge">${st.fare}</span>` : nuova ? `<span class="nuova">NUOVA</span>` : ""}</span><span class="app-nome">${a.nome}</span><span class="app-riga ${st.caldo ? "calda" : ""}">${st.riga}</span></button>`;
  };
  return `<div class="home2">
    ${alFaro ? `<div class="faro-tel"><b>🔒 Sei al Faro · Telefonata: ${usata ? "già usata in questo turno" : "1 rimasta"}</b><span>Ancora ${me.faro} turni. Puoi fare <b>una</b> azione per turno da: Banca (debito, regali, tasse), Borsa, Municipio, Gazzetta, Contratti, Setta. Le app grigie sono chiuse finché sei dentro.</span></div>` : ""}
    ${cose.length ? `<div class="adesso"><span class="adesso-t">Adesso puoi</span>${cose.map((c) => `<button class="adesso-r ${c.forte ? "forte" : ""}" data-app="${c.app}"><span>${esc(c.testo)}</span><span class="freccia">›</span></button>`).join("")}</div>` : ""}
    ${GRUPPI_APP.map(([titolo, ks]) => { const as = ks.map((k) => vis.find((a) => a.k === k)).filter(Boolean); return as.length ? `<div class="gruppo-app"><span class="gruppo-t">${titolo}</span><div class="home">${as.map(icona).join("")}</div></div>` : ""; }).join("")}
  </div>`;
}
function apriApp(k) { segnaAppVista(k); telAperto = true; app = k; chatAperta = null; if (k === "messaggi") segnaLetti((io().messaggi || []).length); disegnaTelefono(io()); }
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
    dentro = homeTelefono(me, nuovi) + `${S.modoFine === "libera" && mioId === S.players[0].id && !S.fine ? `<button class="piccolo esci-partita" id="chiudiPartita">${S.chiusura ? "Non chiudere più la partita" : "Chiudi la partita"}</button>` : ""}${LOCALE ? `<button class="piccolo esci-partita" id="cambiaNome">Cambia nome</button>` : ""}${!LOCALE && mioId === S.players[0].id && !S.fine ? S.players.filter(puoSostituire).map((q) => `<button class="piccolo esci-partita" data-sostituisci="${q.id}">🤖 ${esc(q.nome)} non c'è: fai giocare il computer</button>`).join("") : ""}<button class="piccolo esci-partita" id="esciPartita">Esci dalla partita</button>`;
  } else {
    const A = APPS.find((a) => a.k === app);
    dentro = `<div class="app-testa"><button id="indietro">‹ Home</button><b>${A.ico} ${A.nome}</b></div><div class="app-corpo">${contenutoApp(me, app)}</div>`;
  }
  // quando arriva un aggiornamento (un altro tira i dadi) il telefono si ridisegna: la pagina resta dove l'avevi lasciata
  const primaCorpo = box.querySelector(".app-corpo"), primaHome = box.querySelector(".home2");
  const scrollPrima = { app: box.dataset.app || "", corpo: primaCorpo ? primaCorpo.scrollTop : 0, home: primaHome ? primaHome.scrollTop : 0 };
  box.dataset.app = app || "";
  box.innerHTML = `<div class="tel"><div class="schermo"><div class="barra"><span>${ora}</span><button class="piccolo" id="chiudiTel2" aria-label="Chiudi il telefono" style="padding:3px 10px">✕ Chiudi</button></div>${dentro}</div><button class="tel-chiudi" id="chiudiTel" aria-label="Chiudi il telefono"></button></div>`;
  if (scrollPrima.app === (app || "")) { const c = box.querySelector(".app-corpo"), h = box.querySelector(".home2"); if (c) c.scrollTop = scrollPrima.corpo; if (h) h.scrollTop = scrollPrima.home; }
  $("#chiudiTel").onclick = $("#chiudiTel2").onclick = () => { telAperto = false; disegnaTelefono(me); };
  box.querySelectorAll("[data-app]").forEach((b) => b.onclick = () => apriApp(b.dataset.app));
  if ($("#cambiaNome")) $("#cambiaNome").onclick = () => finestra(`<h2>Come ti chiami?</h2><input id="nuovoNome" maxlength="24" value="${esc(me.nome)}"><div class="pulsanti"><button id="no">Annulla</button><button class="oro" id="si">Salva</button></div>`, (d, c) => { d.querySelector("#no").onclick = c; d.querySelector("#si").onclick = () => { const n = d.querySelector("#nuovoNome").value.trim(); if (!n) return toast("Scrivi un nome."); try { localStorage.setItem("laguna_nome_locale", n); } catch (e) { } Loc.rinomina(n); c(); caricaVista(); }; });
  if ($("#chiudiPartita")) $("#chiudiPartita").onclick = () => S.chiusura ? agisci({ tipo: "chiudi_partita", si: false })
    : finestra(`<h2>Chiudi la partita?</h2><p>Questa diventa l'ultima notte. All'Alba arriva la classifica finale e si scopre chi è il Re della Laguna. Fino all'Alba puoi ancora cambiare idea.</p><div class="pulsanti"><button id="no">Continuiamo</button><button class="oro" id="si">Chiudo</button></div>`, (d, c) => { d.querySelector("#no").onclick = c; d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "chiudi_partita", si: true }); }; });
  if ($("#esciPartita")) $("#esciPartita").onclick = () => finestra(`<h2>Esci dalla partita?</h2><p>${LOCALE ? "Torni alla schermata iniziale. La partita di prova si cancella." : "Esci per sempre: <b>al tuo posto gioca il computer</b>, così la partita va avanti per gli altri. Non potrai rientrare."}</p>${LOCALE ? "" : `<p class="sub">Devi solo chiudere un attimo? Non serve uscire: se resti via più di 3 minuti il computer gioca per te, e quando torni riprendi tu.</p>`}<div class="pulsanti"><button id="no">Resto</button><button class="oro" id="si">Esco</button></div>`, (d, c) => { d.querySelector("#no").onclick = c; d.querySelector("#si").onclick = async () => { c(); if (LOCALE) { try { localStorage.removeItem("laguna_locale"); } catch (e) { } } else { const r = await chiama({ comando: "esci", partita }); if (r && r.errore) { toast(r.errore); return; } } esciDallaPartita(LOCALE ? "" : "Sei uscito: al tuo posto ora gioca il computer."); }; });
  document.querySelectorAll("[data-sostituisci]").forEach((b) => b.onclick = async () => { b.disabled = true; const r = await chiama({ comando: "computer", partita, player: b.dataset.sostituisci }); if (r && r.errore) toast(r.errore); else toast("Al suo posto ora gioca il computer. Quando torna, riprende lui."); await caricaVista(); });
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
// ---- Il contenuto di ogni app del telefono: UNA FUNZIONE PER APP (prima era tutto dentro contenutoApp).
// Chi lavora su un'app tocca solo la sua funzione; per un'app nuova: una funzione qui e una riga in CONTENUTO_APP.
// Tutte ricevono (me, miTurno): me = il giocatore, miTurno = e' il mio turno, ho gia' tirato e non c'e' niente in sospeso.
// (Il corpo delle funzioni e' stato spostato cosi' com'era, senza cambiare una virgola: per questo ha un rientro in piu'.)
function appImprese(me, miTurno) {
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
          azioni = !ok ? `<span class="sub">Per il livello ${next} serve avere tutte le vie del gruppo «${esc(l.serie)}».</span>` : l.lvl === 0 ? sceltaAttivita(l, me, costo) : `<button class="piccolo oro" data-cantiere="${l.id}" ${me.cash < costo ? "disabled" : ""}>Apri il cantiere · ${euro(costo)}</button>`;
        }
      }
      return `<div class="scheda"><h4>${esc(l.nome)} <span class="tag" style="background:${COL_SERIE[l.serie] || "#555"}">gruppo ${esc(l.serie || "")}</span></h4>
        <span class="sub">${l.cantiere ? "🚧 Cantiere: " + esc(L.ATTIVITA[l.cantiere.tipo].nome) + " livello " + l.cantiere.lvl + ", apre all'Alba." : l.tipo ? esc(L.ATTIVITA[l.tipo].nome) + " · rende " + euro(L.rendita(S, l)) + " a Ciclo" : "Terreno vuoto"}</span>
        ${l.tipo && L.ATTIVITA[l.tipo].perk ? `<span class="sub">⭐ ${esc(L.ATTIVITA[l.tipo].perk)}${L.ATTIVITA[l.tipo].rischio !== "Nessuno." ? ` · <span style="color:#ff9a9a">⚠ ${esc(L.ATTIVITA[l.tipo].rischio)}</span>` : ""}</span>` : ""}
        ${l.tipoCasella === "lotto" ? tappe(l) : ""}${azioni ? `<div class="riga">${azioni}</div>` : ""}</div>`;
    }).join("");
}
function appBanca(me, miTurno) {
    const altri = S.players.filter((x) => x.id !== mioId);
    const mov = (S.flussi || []).filter((f) => f.da === mioId || f.a === mioId).slice(-8).reverse();
    return `${mov.length ? `<div class="scheda"><h4>Ultimi movimenti</h4>${mov.map((f) => `<div style="font-size:13px;display:flex;justify-content:space-between;gap:8px"><span>${esc(f.motivo)} <span class="sub">${f.a === mioId ? "da " + esc(nomeDi(f.da)) : "a " + esc(nomeDi(f.a))}</span></span><b style="color:${f.a === mioId ? "#7bd88f" : "#ff9a9a"}">${f.a === mioId ? "+" : "−"}${euro(f.importo)}</b></div>`).join("")}</div>` : ""}<div class="scheda"><span class="kick" style="color:var(--muted)">Conto</span><span class="serif" style="font-size:28px;color:var(--pulito)">${euro(me.cash)}</span>${me.sporchi ? `<span style="color:var(--sporco)">In contanti sporchi: ${euro(me.sporchi)}</span>` : ""}</div>
      <div class="scheda"><h4>Debito: ${euro(me.debito)}</h4><span class="sub">Interesse a ogni Alba: ${me.pacchetto === "ereditiera" ? "0%" : Math.round(L.tassoPrestiti(S, me) * 100) + "%"}${(() => { const gb = (S.grandi || {}).banca; const c = gb && gb.capo && S.players.find((p) => p.id === gb.capo); return c && c.id !== mioId ? " (lo decide " + esc(c.nome) + ", che comanda la Banca della Laguna)" : ""; })()}.${me.contoBloccato === S.ciclo ? ` <b style="color:#ff9a9a">Conto bloccato: niente prestiti fino all'Alba.</b>` : ""}</span>${me.debito ? `<button class="piccolo" data-a2="restituisci">Restituisci tutto</button>` : ""}${miTurno && !me.azioneGiornoFatta ? `<button class="piccolo" data-a2="prestito">Chiedi un prestito</button>` : `<span class="sub">I prestiti si chiedono durante il tuo turno.</span>`}</div>
      <div class="scheda"><h4>Fai un regalo</h4><div class="riga"><select id="regA">${altri.map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("")}</select><input id="regImp" type="number" placeholder="quanto" style="width:110px"></div>${S.sblocco >= 1 ? `<label class="check"><input type="checkbox" id="regSp"> in contanti sporchi</label>` : ""}<button class="piccolo" data-a2="regala">Dai</button></div>
      ${S.sblocco >= 2 ? `<div class="scheda"><h4>Tasse</h4><span class="sub">Puoi nascondere una parte delle rendite al fisco. Non paghi le tasse su quella parte: diventa contante in nero, che di notte spendi subito (Mercato Nero, occasioni, "regali") senza ripulirlo. Ma lascia Tracce, e la Finanza guarda i più ricchi.</span><select id="evasione">${[0, 0.1, 0.2, 0.3].map((q) => `<option value="${q}" ${Math.abs(q - (me.evasione || 0)) < 0.01 ? "selected" : ""}>${q ? "Nascondi il " + q * 100 + "%" : "Pago tutto"}</option>`).join("")}</select></div>` : ""}`;
}
function appMessaggi(me, miTurno) {
    const cv = conversazioni(me);
    const ric = (S.ricatti || []).filter((r) => r.a === mioId && r.stato === "attesa").map((r) => `<div class="scheda filo ricatto"><span><b>${esc(nomeDi(r.da))} ti ricatta</b>: vuole ${esc(NOME_FAV(r.tipo))}. <span class="sub">Rispondi prima dell'Alba: ${tempoAllAlba()}.</span></span><button class="piccolo oro" data-ricapri="${r.id}">Rispondi</button></div>`).join("");
    if (!cv.length) return ric + `<p class="sub">Nessun messaggio.</p>`;
    const c = chatAperta && cv.find((x) => x.nome === chatAperta);
    if (c) {
      segnaChat(c.nome, c.msg.length);
      return `<div class="chat-testa"><button class="piccolo" id="tornaChat">‹</button><span class="avatar" style="background:${c.col}">${c.ico}</span><b>${esc(c.nome)}</b></div>
        <div class="chat">${c.msg.map((m) => `<div class="bolla">${esc(m.testo)}<span>Ciclo ${m.ciclo}</span></div>`).join("")}</div>`;
    }
    return ric + cv.map((c) => { const ult = c.msg[c.msg.length - 1]; const nuovi = c.msg.length - lettiChat(c.nome);
      return `<button class="conv" data-chat="${esc(c.nome)}"><span class="avatar" style="background:${c.col}">${c.ico}</span><span class="cv-t"><b>${esc(c.nome)}</b><span>${esc(ult.testo.slice(0, 70))}${ult.testo.length > 70 ? "…" : ""}</span></span>${nuovi > 0 ? `<span class="pallino">${nuovi}</span>` : ""}</button>`; }).join("");
}
function appValigetta(me, miTurno) {
    const v = me.valigetta || [], posti = S.postiValigetta, usati = S.postiUsati ?? v.length;
    return `<p class="sub">${usati} posti usati su ${posti}. Gli oggetti si comprano di notte, nei posti giusti. Al Mercato Nero, al Porto e al Casinò ogni notte ci sono 3 strumenti diversi: chi arriva prima li prende. Quelli grossi occupano 2 posti.</p>` +
      v.map((o) => { const O = OGG(o.id); return `<div class="ogg"><span class="ic">${ICO_OGG[o.id] || ""}</span><div><b>${esc(O.nome)}${O.posti > 1 ? ` <span class="tag">${O.posti} posti</span>` : ""}</b><div class="sub" style="font-size:12px">${esc(O.descr)}${o.notti ? " Ancora " + o.notti + (o.notti === 1 ? " notte." : " notti.") : ""}${(O.salva || []).length || ["motoscafo", "furgone"].includes(o.id) ? ` <b style="color:${(me.trucchi || {})[o.id] >= 2 ? "#ff9a9a" : "var(--pulito)"}">Funziona circa ${Math.round(100 - Math.min(55, 15 + 10 * ((me.trucchi || {})[o.id] || 0)))}% delle volte.</b>` : ""}</div></div></div>`; }).join("") +
      `<p class="sub" style="margin-top:8px">Ogni volta che un oggetto ti salva, la polizia impara il trucco: la volta dopo funziona di meno. Col passare dei Cicli se ne dimentica.</p>` +
      Array.from({ length: Math.max(0, posti - usati) }, () => `<div class="ogg vuoto"><span class="ic">·</span><span class="sub">Posto libero</span></div>`).join("");
}
function appLusso(me, miTurno) {
  return `<div class="scheda"><h4>I tuoi mezzi</h4><span class="sub">${me.veicoli.map((x) => L.N.veicoli[x].nome).join(", ") || "Nessuno, per ora."}</span></div>${miTurno && !me.azioneGiornoFatta ? `<button class="oro" data-a2="veicolo">Vai in concessionaria</button>` : `<span class="sub">I mezzi si comprano con la mossa del giorno.</span>`}<span class="sub">Un motoscafo o un elicottero ti fanno muovere di notte in 1 ora ovunque.</span>`;
}
function appProve(me, miTurno) {
  return (me.prove || []).map((pr, i) => `<div class="scheda"><h4>📷 ${esc(S.players.find((x) => x.id === pr.su).nome)}</h4><span class="sub">${esc(pr.cosa)} · Ciclo ${pr.ciclo}</span><div class="riga"><button class="piccolo" data-denuncia="${i}">Manda alla polizia</button>${pr.rifiutata ? `<span class="sub">L'ha già vista: ora puoi solo denunciarlo.</span>` : `<button class="piccolo oro" data-ricatta="${i}">Usala: chiedi un Favore</button>`}</div></div>`).join("") || `<p class="sub">Nessuna prova. Una macchina fotografica aiuta.</p>`;
}
function appBorsa(me, miTurno) {
  // come le app vere: in alto il totale, poi una riga per titolo con prezzo e variazione (v75b)
  const pr = (v, d) => v.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d }) + " €";
  const varia = (ora, ieri) => { if (!ieri || ieri === ora) return `<span class="bv-pari">= dall'Alba</span>`; const x = (ora / ieri - 1) * 100; return `<span class="${x > 0 ? "bv-su" : "bv-giu"}">${x > 0 ? "▲ +" : "▼ "}${x.toLocaleString("it-IT", { maximumFractionDigits: 1 })}% dall'Alba</span>`; };
  const pezzi = (q) => q >= 10 ? Math.round(q).toLocaleString("it-IT") : q.toLocaleString("it-IT", { maximumFractionDigits: 2 });
  const riga = (cosa, nome, prezzo, ieri, quante, nota, dec, unita) => {
    const val = quante * prezzo, k = cosa === "borsa" ? "b" : "c";
    return `<div class="scheda bv"><div class="bv-testa"><b>${esc(nome)}</b><span class="bv-prezzo">${pr(prezzo, dec)}</span></div>
<div class="bv-testa"><span class="sub">${unita}</span>${varia(prezzo, ieri)}</div>${nota ? `<span class="sub">${nota}</span>` : ""}
${quante > 0 ? `<div class="bv-mio">Hai <b>${pezzi(quante)}</b> ${cosa === "borsa" ? "azioni" : "monete"} · valgono <b>${euro(val)}</b></div>` : `<span class="sub">Non ne hai.</span>`}
<div class="riga"><input type="number" placeholder="€ da investire" data-imp="${k}_${nome}" style="width:120px"><button class="piccolo" data-compra="${cosa}|${nome}">Compra</button>${quante > 0 ? `<button class="piccolo" data-vendimeta="${cosa}|${nome}">Vendi metà</button><button class="piccolo" data-vendi="${cosa}|${nome}">Vendi tutto</button>` : ""}</div></div>`;
  };
  let tA = 0, tC = 0;
  for (const a of L.AZIENDE) tA += (me.azioni[a] || 0) * S.borsa[a];
  for (const m of L.MONETE) tC += (me.cripto[m] || 0) * S.cripto[m];
  const note = { LagunaCoin: "La più tranquilla: si muove poco e crolla di rado.", FlamingoToken: "La più pazza: può raddoppiare o dimezzarsi in un Ciclo.", ShadowCoin: "Media. Serve anche per ripulire i soldi sporchi. Il Sindaco può bloccarla." };
  return `<div class="scheda bv-tot"><span class="sub">Il tuo portafoglio</span><b class="bv-grande">${euro(tA + tC)}</b><span class="sub">Azioni ${euro(tA)} · Cripto ${euro(tC)} · Contanti puliti ${euro(me.cash)}</span><span class="sub">Scrivi quanti € vuoi investire e premi Compra. I prezzi cambiano all'Alba.</span></div>
<h4 class="bv-sez">Azioni</h4>` +
    L.AZIENDE.map((a) => riga("borsa", a, S.borsa[a], (S.borsaIeri || {})[a], me.azioni[a] || 0, "", 2, "Prezzo di 1 azione")).join("") +
    `<h4 class="bv-sez">Cripto</h4><p class="sub">Si comprano con soldi puliti. In media salgono, ma ogni tanto crollano del 70% in una notte.</p>` +
    L.MONETE.map((m) => riga("cripto", m, S.cripto[m], (S.criptoIeri || {})[m], me.cripto[m] || 0, note[m] || "", 2, "Prezzo di 1 moneta")).join("");
}
// un patto sulla parola scaduto: chi deve pagare ha tempo fino all'Alba dopo (v76)
function pattoDaPagare(x, me) {
  if (x.stato !== "scaduto" || x.tipo === "notarile") return "";
  const deve = x.chiPagaDopo === "da" ? x.da : x.a, resto = L.restoPatto ? L.restoPatto(x) : x.pagoDopo;
  const entro = x.scadutoCiclo != null ? " entro l'Alba di questo Ciclo" : "";
  if (deve !== mioId) return `<span class="sub">${esc(nomeDi(deve))} deve pagarti ${euro(resto)}${entro}. Se non paga, rompe la parola davanti a tutti.</span>`;
  return `<span class="sub" style="color:#ffb3b3">Devi pagare ${euro(resto)}${entro}. Se non paghi: −8 fama, la Gazzetta lo scrive e per 2 Cicli nessuno si fida di te.</span><div class="riga"><button class="piccolo oro" data-pagapatto="${x.id}" ${me.cash < resto ? "disabled" : ""}>Paga ora · ${euro(resto)}</button></div>`;
}
function appContratti(me, miTurno) {
    const miei = S.contratti.filter((x) => x.da === mioId || x.a === mioId);
    return miei.map((x) => `<div class="scheda"><span><span class="tag">${x.tipo === "notarile" ? "Dal notaio" : "Sulla parola"}</span>${x.favore ? `<span class="tag" style="background:rgba(201,162,74,.25)">Favore: ${esc(NOME_FAV(x.favore.tipo))} · lo deve ${esc(nomeDi(x.favore.deve === "da" ? x.da : x.a))}</span>` : ""}<span class="tag">${esc(x.stato)}</span></span><span>${esc(S.players.find((y) => y.id === x.da).nome)} ↔ ${esc(S.players.find((y) => y.id === x.a).nome)}: subito ${euro(x.pagoOra)}, poi ${euro(x.pagoDopo)}</span>${x.testo ? `<i class="sub">"${esc(x.testo)}"</i>` : ""}${x.a === mioId && x.stato === "proposto" ? `<div class="riga"><button class="piccolo oro" data-contr="${x.id}|1">Accetta</button><button class="piccolo" data-contr="${x.id}|0">Rifiuta</button></div>` : ""}${pattoDaPagare(x, me)}</div>`).join("") + `<button class="oro" data-a2="nuovoContratto">Proponi un patto</button>`;
}
function appAgenzia(me, miTurno) {
    const c = casellaDi(me), isola = (c && c.isola) || L.isolaDiPos(me.pos);
    const liberi = S.lotti.filter((l) => l.owner == null && l.isola === isola && (l.tipoCasella === "lotto" || l.tipoCasella === "molo"));
    const testa = `<div class="scheda"><h4>Agenzia di ${esc(L.NOMI_ISOLE[isola])}</h4><span class="sub">Una volta per turno puoi comprare un terreno libero dell'isola dove sei, anche se non ti sei fermato sopra. ${me.agenziaSconto ? "<b style='color:var(--pulito)'>Sei passato da un'Agenzia: oggi paghi il prezzo pieno, senza sovrapprezzo.</b>" : "Costa il 20% in più del prezzo. Se ti fermi su una casella Agenzia, niente sovrapprezzo."}</span></div>`;
    if (!mioTurno() || S.fase !== "giorno") return testa + `<p class="sub">L'Agenzia lavora di giorno, nel tuo turno.</p>`;
    if (!me.haTirato) return testa + `<p class="sub">Prima tira i dadi: l'Agenzia vende sull'isola dove arrivi.</p>`;
    if (me.agenziaUsata) return testa + `<p class="sub">In questo turno hai già comprato all'Agenzia.</p>`;
    if (!liberi.length) return testa + `<p class="sub">A ${esc(L.NOMI_ISOLE[isola])} non ci sono più terreni liberi.</p>`;
    return testa + liberi.map((l) => { const costo = L.prezzoAgenzia(S, me, l); return `<div class="scheda"><h4><span style="color:${COL_SERIE[l.serie] || "#aaa"}">■</span> ${esc(l.nome)}</h4><span class="sub">${l.tipoCasella === "molo" ? "Molo: chi ci passa ti paga il pedaggio." : "Gruppo " + esc(l.serie) + " · prezzo " + euro(l.prezzo)}</span><button class="piccolo oro" data-agenzia="${l.id}" ${me.cash < costo ? "disabled" : ""}>Compra a ${euro(costo)}</button></div>`; }).join("");
}
function appMunicipio(me, miTurno) {
    return `<div class="scheda"><h4>Sindaco: ${S.sindaco ? esc(S.players.find((x) => x.id === S.sindaco).nome) : "nessuno"}</h4><span class="sub">Tasse al ${Math.round(S.tassa * 100)}%. Le elezioni sono ogni 2 Cicli: per candidarti serve fama 40. Allo sportello del Municipio (ci arrivi coi dadi) costa ${euro(L.costoCandidatura(S, me, false))}; da qui, dal telefono, il doppio.</span>${S.candidati[mioId] === undefined ? `<div class="riga"><button class="piccolo" data-a2="candidatiTel" ${me.fama < 40 || me.cash < L.costoCandidatura(S, me, true) ? "disabled" : ""}>Candidati dal telefono · ${euro(L.costoCandidatura(S, me, true))}</button></div>${me.fama < 40 ? `<span class="sub">Ti serve fama 40 (ora ${Math.round(me.fama)}).</span>` : ""}` : ""}</div>
      ${S.candidati[mioId] !== undefined ? `<div class="scheda"><h4>Sei candidato</h4><div class="riga"><input id="campImp" type="number" placeholder="quanto" style="width:110px"><button class="piccolo" data-a2="campagna">Investi in campagna</button></div></div>` : ""}
      ${S.sindaco === mioId && S.transenna ? `<div class="scheda"><h4>🚧 Una transenna in città</h4><span class="sub">Un agente ha messo un posto di blocco in ${esc((S.lotti.find((l) => l.giro === "o" && l.idx === S.transenna.pos) || {}).nome || "una via")}. Da Sindaco la fai togliere gratis, una volta per Ciclo, nel tuo turno.</span>${me.togliCiclo === S.ciclo ? `<span class="sub">In questo Ciclo l'hai già fatto.</span>` : `<button class="piccolo oro" data-a2="togliTransenna" ${mioTurnoGiorno() ? "" : "disabled"}>Fai togliere la transenna</button>`}</div>` : ""}
      ${cittadinoOnesto(me)}
      ${S.sindaco === mioId ? `<div class="scheda"><h4>Sei il Sindaco</h4><div class="riga"><select id="leggeSel">${Object.entries(L.LEGGI).map(([kk, x]) => `<option value="${kk}">${esc(x.nome)}</option>`).join("")}</select><select id="leggeIsola">${L.ISOLE.map((i) => `<option value="${i}">${L.NOMI_ISOLE[i]}</option>`).join("")}</select><button class="piccolo" data-a2="legge">Firma</button></div><div class="riga">Tasse <select id="tasseSel">${[0.1, 0.15, 0.2, 0.25, 0.3].map((q) => `<option value="${q}" ${Math.abs(q - S.tassa) < 0.01 ? "selected" : ""}>${q * 100}%</option>`).join("")}</select><button class="piccolo" data-a2="tasse">Cambia</button></div></div>` : ""}
      <div class="scheda"><h4>La licenza del casinò</h4>${S.licenze.includes(mioId) ? `<span class="sub">Ce l'hai. Ora puoi aprire un casinò su un tuo terreno di Baia Flamingo o Isola Corona, e il Casinò privato nel tuo Palazzo.</span>`
        : `<span class="sub">Serve per aprire un casinò. Costa 500.000 € se approvata. Il Municipio può approvare, rimandare o negare: più fama hai, più è facile. Se ti fermi sulla casella del Municipio, allo sportello la ottieni sicura a 400.000 €.</span>
        ${me.licenzaNegata && miTurnoApp() ? `<button class="piccolo" data-a2="bustaLicenza">Una busta all'assessore (650.000 €, lascia tracce)</button>` : ""}
        ${miTurnoApp() ? `<button class="piccolo oro" data-a2="licenza">Chiedi la licenza</button>` : `<span class="sub">Si chiede nel tuo turno, dopo aver tirato i dadi.</span>`}`}</div>`;
}
function appSporchi(me, miTurno) {
    const cop = L.copertura(S, me), sp = me.sporchi || 0;
    return `<div class="scheda"><h4 style="color:var(--sporco)">Hai ${euro(sp)} sporchi</h4><span class="sub">Sono contanti che non puoi mostrare. Di giorno non comprano quasi niente: case, piani e azioni vogliono soldi puliti.</span></div>
      ${laTuaRete(me)}<div class="scheda"><h4 style="color:var(--oro)">Attento: a fine partita valgono poco</h4><span class="sub">Nella classifica finale ogni euro sporco conta solo ${Math.round(L.N.valoreSporchi * 100)} centesimi. Ripuliscili prima della fine.</span></div>
      <div class="scheda"><h4>Da dove arrivano</h4><span class="sub">Gli affari della notte (container, orologi, carichi dal mare, il colpo alla villa…), le vincite alla Bisca e le tasse che non paghi.</span></div>
      <div class="scheda"><h4>Come spenderli così</h4><span class="sub">Di notte: oggetti del Mercato Nero, occasioni, sfide a carte, ingresso alle serate. Per corrompere costano il 20% in meno.</span></div>
      <div class="scheda"><h4>Come ripulirli (di notte)</h4>
        <div class="liv"><span class="liv-n">1</span><div><b>Attività di copertura</b> · al Casinò Reale<div class="sub" style="font-size:12px">Perdi il 15%. Poche tracce. Ne puoi ripulire al massimo ${euro(cop)} a Ciclo con le tue lavanderie, gallerie e magazzini.</div></div></div>
        <div class="liv"><span class="liv-n">2</span><div><b>ShadowCoin</b> · al Casinò Reale<div class="sub" style="font-size:12px">Perdi il 25%. Più tracce. Il Sindaco la può bloccare.</div></div></div>
        <div class="liv"><span class="liv-n">3</span><div><b>Paradiso fiscale</b> · dal tuo Palazzo, serve il jet<div class="sub" style="font-size:12px">Perdi il 30%. Una volta per Ciclo.</div></div></div></div>
      ${schedaPiste(me)}
      <div class="scheda"><h4>${ico("siren")} Come ti scoprono</h4>
        <span class="sub">Ogni affare sporco lascia <b>Tracce</b>. A ogni Alba la polizia tira i dadi: più Tracce hai, più è facile che tu salga di un gradino. Agenti e commissario corrotti, e la setta, abbassano il rischio. Un Ciclo senza affari sporchi può farti scendere.<br>Se un altro è <b>Indagato</b>, la polizia è occupata con lui: per te rischi e controlli calano di un quarto${S.poliziaSu ? ` (adesso è su <b>${esc(S.poliziaSu)}</b>)` : ""}.<br><b>Resa dei conti:</b> prima della fine la Gazzetta annuncia l'inchiesta finale. All'ultima Alba chi ha lasciato Tracce rischia una multa sul patrimonio${S.resaAnnunciata ? ' — <b style="color:var(--sporco)">è stata annunciata!</b>' : ""}.</span>
        ${["Tranquillo: nessuno parla di te.", "Voci: si parla di te.", "Osservato: la polizia ti tiene d'occhio.", "Indagato: la Gazzetta fa il tuo nome.", "Processo: il Giudice ti condanna per il reato più grave che hai fatto."].map((x, i) => `<div class="liv"><span class="liv-n" style="${(me.stato || 0) === i ? "background:var(--oro);color:#111" : ""}">${i}</span><div class="sub" style="font-size:12px">${x}${(me.stato || 0) === i ? " <b>← tu sei qui</b>" : ""}</div></div>`).join("")}
        <span class="sub" style="margin-top:6px">Le pene:</span>
        ${["lieve", "media", "grave", "gravissima"].map((g) => `<div class="sub" style="font-size:12px">· <b>${NOMI_GRAVITA[g]}</b>: ${esc(testoPena(g))}</div>`).join("")}</div>
      <div class="scheda"><h4 style="color:var(--setta)">La setta</h4><span class="sub">${sp >= L.N.settaSporchi ? "Hai abbastanza soldi sporchi: puoi fondare una setta, di notte, dall'app Setta." : "Si apre quando hai " + euro(L.N.settaSporchi) + " sporchi. Fondarla costa " + euro(L.N.settaCosto) + " (di cui " + euro(L.N.settaTesoroIniziale) + " diventano il tesoro)."}</span></div>`;
}
function appScoperte(me, miTurno) {
    const fatte = me.scoperte || {}, tutte = L.SCOPERTE, n = tutte.filter((x) => fatte[x.id] !== undefined).length;
    const GRUPPI = [["giorno", "Di giorno"], ["notte", "Di notte"], ["potere", "Potere e rivali"]];
    return `<div class="scheda"><h4>${ico("stella")} Hai scoperto ${n} cose su ${tutte.length}</h4>
        <div style="height:8px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;margin:6px 0"><div style="height:100%;width:${Math.round(n / tutte.length * 100)}%;background:var(--oro)"></div></div>
        <span class="sub">Ogni cosa nuova che provi ti dà +1 fama.${S.consigli !== false ? " Vera, a ogni Alba, ti suggerisce una cosa che puoi fare subito." : " Partita senza consigli: tocca a te scoprire tutto."}</span></div>` +
      GRUPPI.map(([g, titolo]) => `<div class="scheda"><h4>${titolo}</h4>${tutte.filter((x) => x.gruppo === g).map((x) => {
        const ok = fatte[x.id] !== undefined, aperta = x.lv <= S.sblocco;
        return `<div class="liv"><span class="liv-n" style="${ok ? "background:#2e7d4f" : ""}">${ok ? "✓" : aperta ? "?" : x.lv}</span><div><b>${ok ? esc(x.nome) : aperta ? "Da scoprire" : "Livello " + x.lv}</b><div class="sub" style="font-size:12px">${ok ? esc(x.spiega) : aperta ? esc(x.indizio) : "Si apre quando sali al Livello " + x.lv + "."}</div></div></div>`;
      }).join("")}</div>`).join("");
}
function appSetta(me, miTurno) {
    const pct = Math.round(L.N.decima * 100);
    return (S.inviti || []).map((x) => `<div class="scheda"><h4>Un invito senza firma</h4>
        <span class="sub">La setta <b style="color:var(--setta)">${esc(x.nome || "")}</b>${x.motto ? ` · <i>${esc(x.motto)}</i>` : ""} · livello ${x.livello || 1} · ${x.membri || 1} ${x.membri === 1 ? "membro" : "membri"}</span>
        <div class="liv"><span class="liv-n">€</span><div class="sub" style="font-size:12px">${x.offerta > 0 ? `<b>Ti regalano ${euro(x.offerta)}</b> in soldi sporchi se entri.` : x.offerta < 0 ? `<b>Quota d'ingresso: ${euro(-x.offerta)}</b> (prima dai tuoi sporchi, poi dai puliti).` : "Nessun regalo e nessuna quota."}<br>Ogni Alba il ${pct}% delle tue rendite va al Tesoro della setta.</div></div>
        <div class="liv"><span class="liv-n">+</span><div class="sub" style="font-size:12px">In cambio: affari sporchi con il 30% di Tracce in meno, condanne più leggere di un gradino, il Faro sempre aperto con affari solo per i membri.</div></div>
        <div class="riga"><button class="piccolo oro" data-invito="${x.setta}|1">Entro</button><button class="piccolo" data-invito="${x.setta}|0">Rifiuto</button></div></div>`).join("") +
      (S.sette.length ? `<details class="scheda in-breve" ${S.sette.some((st) => st.gm === mioId) && L.livelloSetta(S, S.sette[0]) <= 1 ? "open" : ""}><summary><b>🕯️ Come funziona la setta</b></summary>
        <div class="ib"><b>1</b><span><b>Cosa ti dà sempre:</b> affari sporchi con il 30% di Tracce in meno, condanne più leggere, il Faro aperto di notte. Ogni Alba il ${pct}% delle rendite dei membri va nel Tesoro; il Gran Maestro prende il 5% del Tesoro in sporchi.</span></div>
        <div class="ib"><b>2</b><span><b>Il livello sale con l'Influenza</b>, non con i membri. L'Influenza si guadagna <b>usando il Tesoro</b>: operazioni riuscite, riti, personaggi reclutati, soldi ripuliti con la Lavanderia, Grandi Opere. Livello 2 a ${L.N.settaInfluenza[2]} punti, 3 a ${L.N.settaInfluenza[3]}, 4 a ${L.N.settaInfluenza[4]}. L'Influenza non si perde.</span></div>
        <div class="ib"><b>3</b><span><b>I membri servono</b> per la decima (più Tesoro), per i riti (più presenti, più Influenza) e per votare le Grandi Opere.</span></div>
        <div class="ib"><b>4</b><span><b>Grandi Opere</b>: colpi enormi pagati dal Tesoro (da 10 a 30 milioni). Il Gran Maestro propone, gli altri membri votano sì o no fino all'Alba. Passa se i sì sono almeno quanti i no. Da soli si decide da soli, ma costa il 50% in più.</span></div>
        <span class="sub">Esempio: la tua setta ha 14 punti (livello 2) e 12 milioni nel Tesoro. Proponi l'Amnistia. Sabri vota sì, lo Spavaldo vota no: 1 a 1, decidi tu, passa. All'Alba spariscono le vostre condanne e il 70% delle Tracce, la setta prende +12 Influenza e arriva a 26. Ma per 2 Cicli ogni Traccia nuova pesa di più.</span></details>` + S.sette.map((st) => `<div class="scheda"><h4 style="color:var(--setta)">${esc(st.nome)}</h4><i class="sub">${esc(st.motto)}</i><span class="sub">Livello ${L.livelloSetta(S, st)} · ${Math.floor(L.influenzaDi(S, st))} Influenza · membri: ${st.membri.map((id) => esc(S.players.find((x) => x.id === id).nome)).join(", ")} · tesoro ${euro(st.tesoro)}</span>
        <div class="riga"><input type="number" placeholder="versa" id="versa_${st.id}" style="width:100px"><button class="piccolo" data-versa="${st.id}|0">Puliti</button><button class="piccolo" data-versa="${st.id}|1">Sporchi</button></div>
        ${st.membri.filter((id) => id !== st.gm).length ? `<div style="display:flex;flex-direction:column;gap:4px;margin-top:6px">${st.membri.filter((id) => id !== st.gm).map((id) => { const m = S.players.find((x) => x.id === id); return `<div class="riga" style="justify-content:space-between"><span class="sub">${esc(m.nome)}${id === mioId ? " (tu)" : ""}</span>${st.gm === mioId ? `<span><button class="piccolo" data-prova="${st.id}|${id}" title="Costa ${euro(L.costoProvaFedelta(S, st))} dal Tesoro: scopri se sta tradendo">Prova di fedeltà</button> <button class="piccolo" data-caccia="${st.id}|${id}">Caccia</button></span>` : id === mioId ? `<button class="piccolo" data-lascia="${st.id}">Esci dalla setta</button>` : ""}</div>`; }).join("")}</div>` : ""}
        <span class="sub" style="display:block;margin-top:6px">${PNG_SETTA.filter((x) => st[x.k]).length ? "Personaggi: " + PNG_SETTA.filter((x) => st[x.k]).map((x) => x.nome).join(", ") + "." : "Nessun personaggio reclutato (si reclutano di notte al Faro)."}</span>
        ${schedaInfluenza(st)}${schedaOpere(st, me)}${schedaLavanderia(st, me)}
        ${(() => { const cv = st.convocazione && st.convocazione.ciclo === S.ciclo ? st.convocazione : null;
          const luoghi = Object.keys(L.LUOGHI).filter((l) => l !== "palazzo");
          return `<div class="scheda conv-setta"><h4>🕯️ Convocazione</h4>${cv ? `<span class="sub"><b>Stanotte alle ${L.ORE[cv.ora]}, ${esc(L.LUOGHI[cv.luogo].nome)}</b>${cv.fatto ? " · il rito è già stato fatto" : ". Chi è lì a quell'ora partecipa al rito: Tracce cancellate e protezione per il resto della notte." + (S.players.find((x) => x.id === st.gm).veicoli.includes("jet") ? " Il jet del Gran Maestro ti porta lì in 1 ora." : "")}</span>` : `<span class="sub">Nessuna convocazione per stanotte.</span>`}
          ${st.gm === mioId && !(cv && cv.fatto) ? `<div class="riga" style="flex-wrap:wrap;margin-top:6px"><select id="convL_${st.id}">${luoghi.map((l) => `<option value="${l}" ${cv && cv.luogo === l ? "selected" : ""}>${esc(L.LUOGHI[l].nome)}</option>`).join("")}</select><select id="convO_${st.id}">${[1, 2, 3, 4, 5].filter((o) => !(S.fase === "notte" && S.notte && o <= S.notte.ora)).map((o) => `<option value="${o}" ${cv && cv.ora === o ? "selected" : ""}>${L.ORE[o]}</option>`).join("")}</select><button class="piccolo oro" data-convoca="${st.id}">Convoca</button></div><span class="sub">Solo i membri ricevono il messaggio. Il rito lo celebri tu, di notte, quando sei lì.</span>` : ""}</div>`; })()}
        ${st.gm !== mioId ? `<div class="scheda" style="margin-top:8px;border-color:#7a2c2c"><h4>🗡️ Tradire la setta</h4><span class="sub">${st.tradimento ? "<b>Hai già parlato con la polizia.</b> All'Alba scatta il tradimento, se il Gran Maestro non ti scopre prima." : "Vendi la setta alla polizia: all'Alba prendi il 10% del Tesoro (fino a 5 M) puliti e ti cancellano 30 Tracce. La setta perde metà del Tesoro e gli altri membri finiscono sotto osservazione. Se il Gran Maestro ti fa la Prova di fedeltà prima dell'Alba, sei scoperto. Se riesce, il Gran Maestro tiene una Prova su di te e per 4 Cicli nessuna setta ti prende."}</span>${st.tradimento ? "" : `<button class="piccolo" data-tradisci="${st.id}" style="margin-top:6px">Chiama la polizia</button>`}</div>` : `<span class="sub" style="display:block;margin-top:6px">⚰️ Tesoro sepolto: ${euro(st.sepolto || 0)}. Si nasconde e si recupera di notte al Faro.</span>`}
        <div class="scheda chat-setta"><h4>💬 Parla con i confratelli</h4>
          <div class="chat-righe">${(st.chat || []).slice(-12).map((m) => `<div class="${m.da === mioId ? "mio" : ""}"><b>${esc(m.nome)}</b> ${esc(m.testo)}</div>`).join("") || `<span class="sub">Ancora nessun messaggio. Qui scrivono solo i membri.</span>`}</div>
          <div class="riga"><input id="chat_${st.id}" maxlength="160" placeholder="Scrivi ai confratelli…" style="flex:1"><button class="piccolo oro" data-schat="${st.id}">Invia</button></div></div>
        ${st.gm === mioId ? (() => { const fuori = S.players.filter((x) => !st.membri.includes(x.id)); return fuori.length ? `<div class="scheda" style="margin-top:8px;background:rgba(255,255,255,.04)"><h4>Invita qualcuno</h4>
          <span class="sub">L'invito arriva senza firma: vedono la setta e il patto, non chi lo manda.</span>
          <select id="inv_${st.id}">${fuori.map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("")}</select>
          <div class="riga"><select id="invTipo_${st.id}"><option value="0">Nessun patto</option><option value="1">Gli regalo (dal Tesoro)</option><option value="-1">Gli chiedo una quota</option></select><input type="number" id="invSoldi_${st.id}" placeholder="quanto" min="0" step="100000" style="width:110px"></div>
          <button class="piccolo oro" data-invita="${st.id}">Manda l'invito</button></div>` : `<span class="sub">Tutti i giocatori sono già nella tua setta.</span>`; })() + `<span class="sub">Le operazioni si decidono di notte, al Faro.</span>` : ""}</div>`).join("")
        : S.fase === "notte" ? `<div class="scheda"><h4>Fonda una setta</h4><span class="sub">Il patto costa ${euro(L.N.settaCosto)} in soldi sporchi: ${euro(L.N.settaTesoroIniziale)} diventano il tesoro della setta, il resto se ne va nel rito.</span><span class="sub" style="display:block;margin-top:6px"><b>Cosa ti dà:</b><br>· i tuoi affari sporchi lasciano il 30% di Tracce in meno<br>· gli avvocati della setta: ogni condanna scende di un gradino<br>· il Faro sempre aperto, con occasioni enormi solo per i membri<br>· al Gran Maestro, ogni Ciclo, il 5% del tesoro in contanti sporchi</span><input id="sNome" placeholder="Nome"><input id="sMotto" placeholder="Motto"><button class="piccolo oro" data-a2="fonda">Fonda</button></div>` : `<p class="sub">Le sette si fondano di notte.</p>`);
}
const CONTENUTO_APP = {
  impero: (me) => impero(me),
  conti: (me) => appConti(me),
  imprese: appImprese,
  banca: appBanca,
  gazzetta: () => appGazzetta(),
  messaggi: appMessaggi,
  valigetta: appValigetta,
  palazzo: (me, miTurno) => appPalazzo(me, miTurno),
  grandi: (me) => appGrandi(me),
  tv: (me) => appGrandi(me),
  lusso: appLusso,
  prove: appProve,
  borsa: appBorsa,
  contratti: appContratti,
  agenzia: appAgenzia,
  municipio: appMunicipio,
  rubrica: (me) => rubrica(me),
  sporchi: appSporchi,
  scoperte: appScoperte,
  setta: appSetta,
};
function contenutoApp(me, k) {
  const miTurno = mioTurno() && !S.pending && me.haTirato && !me.faro;
  const f = Object.prototype.hasOwnProperty.call(CONTENUTO_APP, k) ? CONTENUTO_APP[k] : null;
  const html = f ? f(me, miTurno) : "";
  return html == null ? "" : html;
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
// v75: l'umore del contatto e il suo Servizio
const UMORE = { tranquillo: ["tranquillo", "#7ee2a8"], teso: ["teso", "#f3c56b"], nervoso: ["nervoso: se continui, parlerà", "#ff9a6b"], inchiesta: ["sotto inchiesta: scaricalo o rischia", "#ff8a8a"] };
function nomeBreveContatto(k) { return k.startsWith("agente_") ? "L'agente di " + L.NOMI_ISOLE[k.slice(7)] : k === "commissario" ? "Vargas" : k === "banchiere" ? "Lenz" : k === "doganiere" ? "Il doganiere" : k; }
function mioTurnoGiorno() { const me = io(); return S.fase === "giorno" && mioTurno() && !S.pending && !me.faro; }
function servizioHtml(me, k, c) {
  const chi = k.startsWith("agente_") ? "agente" : k;
  if (!L.SERVIZI || !L.SERVIZI[chi]) return "";
  const nota = `<div class="sub" style="font-size:12px">Un Servizio per Ciclo. Ogni Servizio lo rende più nervoso.</div>`;
  if (c.sospetto != null) return `<div class="sub">È sotto inchiesta: non risponde al telefono.</div>`;
  const fatto = c.servizioCiclo === S.ciclo;
  const ar = me.arrivi && me.arrivi.ciclo === S.ciclo ? me.arrivi : null;
  if (chi === "doganiere" && fatto && ar) {
    if (ar.riservato != null) { const x = ar.lista.find((y) => y.n === ar.riservato); return `<div class="sub">Il doganiere ti tiene da parte: <b>${esc(x ? x.nome : "un carico")}</b>${x ? ` (${esc(nomeLuogo(x.luogo))}, prima delle ${L.ORE[x.alle]})` : ""}.</div>`; }
    if (!ar.lista.length) return `<div class="sub">Stanotte non arriva niente per te.</div>`;
    return `<div class="sub">Stanotte arrivano:</div>${ar.lista.map((x) => `<div class="riga" style="justify-content:space-between;margin-top:3px"><span class="sub">${esc(x.nome)} · ${esc(nomeLuogo(x.luogo))}, ${L.ORE[x.dalle]}–${L.ORE[x.alle]}</span><button class="piccolo oro" data-dogn="${x.n}">Tienilo per me</button></div>`).join("")}`;
  }
  if (fatto) {
    const cv = chi === "banchiere" ? Object.entries(me.contiVisti || {}).filter(([, v]) => v.ciclo === S.ciclo) : [];
    return `<div class="sub">Questo Ciclo ti ha già fatto un Servizio.</div>${cv.map(([id, v]) => `<div class="sub">Lenz: ${esc(nomeDi(id))} ha circa ${v.puliti} M puliti e ${v.sporchi} M sporchi.</div>`).join("")}`;
  }
  if (chi === "agente") {
    const pronto = S.ciclo - (c.dal || 0) >= 2;
    return `<button class="piccolo oro" data-serv="agente|${k.slice(7)}" ${!pronto || !mioTurnoGiorno() || S.transennaCiclo === S.ciclo ? "disabled" : ""}>🚧 Metti una transenna</button>
      <div class="sub" style="font-size:12px">${!pronto ? "L'agente non si fida ancora: deve passare un altro Ciclo." : S.transennaCiclo === S.ciclo ? "In questo Ciclo c'è già stata una transenna." : !mioTurnoGiorno() ? "Si mette nel tuo turno, di giorno." : "Tutti la vedono. Vale anche per te. Resta fino al tuo prossimo turno."}</div>${nota}`;
  }
  if (chi === "commissario") return `<button class="piccolo oro" data-serv="commissario" ${!mioTurnoGiorno() ? "disabled" : ""}>🚨 Sposta la retata</button><div class="sub" style="font-size:12px">${mioTurnoGiorno() ? "Stanotte quel posto è pieno di sbirri, per tutti." : "Si chiede nel tuo turno, di giorno."}</div>${nota}`;
  if (chi === "banchiere") { const ok = S.fase === "giorno" || (S.fase === "notte" && !S.notteFatti[mioId]); return `<button class="piccolo oro" data-serv="banchiere" ${!ok ? "disabled" : ""}>🔎 Fammi vedere il conto</button>${nota}`; }
  if (chi === "doganiere") { const ok = S.fase === "notte" && !S.notteFatti[mioId]; return `<button class="piccolo oro" data-serv="doganiere" ${!ok ? "disabled" : ""}>📦 Cosa arriva stanotte?</button><div class="sub" style="font-size:12px">${ok ? "È una telefonata: la fai da dove sei." : "Si chiama di notte."}</div>${nota}`; }
  return "";
}
function finestraServizio(me, tipo, isola) {
  const me2 = io();
  if (tipo === "agente") {
    const lotti = S.lotti.filter((l) => l.giro === "o" && l.tipoCasella === "lotto" && l.isola === isola && !S.players.some((q) => !q.fallito && !q.inner && q.pos === l.idx));
    const ultimo = (S.giorno || 0) >= 3 && S.players.every((q, i) => i <= S.turno || q.fallito);
    return finestra(`<span class="kick" style="color:var(--sporco)">🚧 L'agente di ${esc(L.NOMI_ISOLE[isola])}</span><h2>Dove metto la transenna?</h2>
      <p>Chi si ferma lì viene controllato, come al Posto di blocco del Ponte Est. Chi la polizia tiene d'occhio viene fermato sempre.</p>
      <div class="campo"><label for="trC">Casella</label><select id="trC">${lotti.map((l) => `<option value="${l.idx}">${esc(l.nome)}${l.owner ? " · di " + esc(nomeDi(l.owner)) : " · libera"}</option>`).join("")}</select></div>
      <p class="sub">Tutti la vedono. Vale anche per te. Resta fino al tuo prossimo turno, o fino alla Notte.${ultimo ? " <b>È l'ultimo giro del giorno 4: con la Notte sparisce quasi subito.</b>" : ""}</p>
      ${avvisoFedina(me2)}<p class="sub">+3 Tracce. L'agente diventa più nervoso.</p>
      <div class="pulsanti"><button id="x">Lascia stare</button><button class="oro" id="ok" ${lotti.length ? "" : "disabled"}>Mettila</button></div>`, (d, c) => {
      d.querySelector("#x").onclick = c;
      d.querySelector("#ok").onclick = () => { c(); agisciSubito({ tipo: "servizio", chi: "agente", isola, pos: +d.querySelector("#trC").value }); };
    });
  }
  if (tipo === "commissario") {
    const luoghi = Object.keys(L.LUOGHI).filter((l) => l !== "palazzo");
    return finestra(`<span class="kick" style="color:var(--sporco)">🚨 Il Commissario Vargas</span><h2>Dove la faccio, la retata?</h2>
      <div class="campo"><label for="vL">Posto</label><select id="vL">${luoghi.map((l) => `<option value="${l}">${esc(L.LUOGHI[l].nome)}</option>`).join("")}</select></div>
      <p class="sub">Stanotte quel posto è pieno di sbirri, per tutti. Anche per te. Nessuno lo legge sulla Gazzetta: chi arriva se ne accorge dagli indizi.</p>
      ${avvisoFedina(me2)}<p class="sub">+4 Tracce. Vargas diventa più nervoso.</p>
      <div class="pulsanti"><button id="x">Lascia stare</button><button class="oro" id="ok">Ordina</button></div>`, (d, c) => {
      d.querySelector("#x").onclick = c;
      d.querySelector("#ok").onclick = () => { c(); agisciSubito({ tipo: "servizio", chi: "commissario", luogo: d.querySelector("#vL").value }); };
    });
  }
  if (tipo === "banchiere") {
    const altri = S.players.filter((x) => x.id !== mioId && !x.fallito);
    return finestra(`<span class="kick" style="color:var(--sporco)">🔎 Il banchiere Lenz</span><h2>Di chi vuoi vedere il conto?</h2>
      <div class="campo"><label for="lB">Rivale</label><select id="lB">${altri.map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("")}</select></div>
      <p class="sub">Lui non lo saprà. Lenz ti dice quanti milioni ha, puliti e sporchi.</p>
      ${avvisoFedina(me2)}<p class="sub">+2 Tracce. Lenz diventa più nervoso.</p>
      <div class="pulsanti"><button id="x">Lascia stare</button><button class="oro" id="ok">Chiedi</button></div>`, (d, c) => {
      d.querySelector("#x").onclick = c;
      d.querySelector("#ok").onclick = () => { c(); agisciSubito({ tipo: "servizio", chi: "banchiere", bersaglio: d.querySelector("#lB").value }); };
    });
  }
  if (tipo === "doganiere") return conFedina({ tipo: "servizio", chi: "doganiere" });
}
function laTuaRete(me) {
  const ks = Object.keys(me.corrotti || {});
  const DOVE = (k) => k.startsWith("agente_") ? "ti copre solo a " + L.NOMI_ISOLE[k.slice(7)] + " (rischio −40%)" : k === "commissario" ? "ti copre un po' ovunque (rischio −20%)" : k === "doganiere" ? "ti copre solo all'Aeroporto (rischio −50%)" : k === "banchiere" ? "i controlli sui tuoi conti trovano meno" : "";
  return `<div class="scheda"><h4>La tua rete</h4>${ks.length ? ks.map((k) => { const c = me.corrotti[k], r = Math.round(L.rischioContatto(S, { ...me, tracce: 0 }, k) * 100), um = UMORE[(me.umoreContatti || {})[k] || (c.sospetto ? "inchiesta" : "tranquillo")] || UMORE.tranquillo;
    return `<div class="contatto-rete" style="margin-top:8px"><b>${esc(L.nomeContatto(k).replace(/^./, (x) => x.toUpperCase()))}</b><div class="sub">${DOVE(k)}.</div><div class="sub" style="color:${um[1]};font-weight:700">${esc(nomeBreveContatto(k))}: ${esc(um[0])}</div>${c.sospetto ? `<div class="sub" style="color:#ff8a8a;font-weight:700">Gli Affari Interni indagano su di lui: all'Alba può fare il tuo nome.</div>` : `<div class="sub">Rischio che gli Affari Interni lo scoprano: almeno ${r}% a Ciclo (sale più lo usi, più Servizi gli chiedi e più Tracce hai).</div>`}<div style="margin-top:4px">${servizioHtml(me, k, c)}</div><button class="piccolo" data-scarica="${k}" style="margin-top:4px">Scaricalo</button></div>`; }).join("") : `<span class="sub">Nessun contatto comprato. Agenti e Vargas al Club Neon, Lenz al Casinò, il doganiere all'Aeroporto: guarda la Rubrica.</span>`}
    <div class="sub" style="margin-top:8px">Gli oggetti ti salvano quasi sempre, non sempre: circa 1 volta su 7 qualcosa va storto.</div></div>`;
}
// ------------------------------------------------------------ La Fedina pulita (v75)
function rischiaFedina(me) { return !!me && (me.fedina || 0) >= 2 && !me.macchia; }
function avvisoFedina(me) { return rischiaFedina(me) ? `<p class="avviso-rischio" style="color:#ffb3b3"><b>Attenzione: perdi la Fedina pulita (${me.fedina} Cicli).</b></p>` : ""; }
function conFedina(a) {
  const me = io();
  if (!rischiaFedina(me) || !L.macchiaAzione || !L.macchiaAzione(S, mioId, a)) return agisciSubito(a);
  finestra(`<span class="kick" style="color:var(--oro)">⚖️ Fedina pulita</span><h2>Sei sicuro?</h2>${avvisoFedina(me)}<p class="sub">Questa mossa è sporca. All'Alba la tua Fedina torna a zero e perdi i suoi poteri (esposto, inchiesta, opera pubblica).</p><div class="pulsanti"><button id="no">Ci ripenso</button><button class="oro" id="si">Lo faccio</button></div>`, (d, c) => {
    d.querySelector("#no").onclick = () => { c(); disegnaTelefono(io()); };
    d.querySelector("#si").onclick = () => { c(); agisciSubito(a); };
  });
  return filaAzioni;
}
const POTERI_F = [[2, "L'Esposto"], [4, "L'Inchiesta"], [6, "L'Opera pubblica"]];
function rigaFedina(me) {
  const f = me.fedina || 0, pros = POTERI_F.find(([n]) => f < n), manca = pros ? pros[0] - f : 0;
  const perche = me.macchia ? "In questo Ciclo hai fatto una cosa sporca: all'Alba la Fedina torna a zero." : (me.sette || []).length ? "Sei in una setta: la Fedina resta a zero." : Object.keys(me.corrotti || {}).length ? "Hai contatti a libro paga: la Fedina resta a zero." : (me.evasione || 0) > 0 ? "Stai evadendo le tasse: la Fedina resta a zero." : "";
  return `<div class="scheda fedina"><h4>⚖️ Fedina pulita: ${f} ${f === 1 ? "Ciclo" : "Cicli"}</h4>
    <div class="tacche-fed">${POTERI_F.map(([n, nome]) => `<span class="${f >= n ? "piena" : ""}" title="${esc(nome)}"><b>${n}</b>${esc(nome.replace(/^L'/, ""))}</span>`).join("")}</div>
    <span class="sub">${pros ? `Ancora ${manca} ${manca === 1 ? "Ciclo pulito" : "Cicli puliti"}: ${esc(pros[1])}.` : "Hai tutti i poteri della Fedina pulita (Municipio, «Cittadino onesto»)."}${perche ? ` <b style="color:#ffb3b3">${perche}</b>` : ""}</span></div>`;
}
const OPERA_ICO = { teatro: "🎭", parco: "🌳", scuola: "🏫" };
function nomeOperaP(o) { const O = (L.OPERE_PUBBLICHE || {})[o.opera] || { nome: "Opera" }; return O.nome + (o.nome ? " " + o.nome : ""); }
function cittadinoOnesto(me) {
  const f = me.fedina || 0, turno = mioTurnoGiorno(), altri = S.players.filter((x) => x.id !== mioId && !x.fallito);
  const grigio = (n, titolo) => `<div class="liv chiuso"><span class="liv-n">${n}</span><div><b>${titolo}</b><div class="sub" style="font-size:12px">Ti serve Fedina pulita ${n}.</div></div></div>`;
  const nonTurno = turno ? "" : `<div class="sub" style="font-size:12px">Si fa nel tuo turno, di giorno.</div>`;
  let esp, inc, op;
  // l'esposto
  if (f < 2) esp = grigio(2, "Firma un esposto");
  else {
    const luoghi = Object.keys(L.LUOGHI).filter((l) => l !== "palazzo" && l !== "faro");
    let corpo;
    if (S.esposto && S.esposto.da === mioId) corpo = `<span class="sub">Hai firmato: stanotte la polizia sarà a <b>${esc(nomeLuogo(S.esposto.luogo))}</b>.</span>`;
    else if (me.espostoStop != null && me.espostoStop >= S.ciclo) corpo = `<span class="sub">Dopo l'allarme inutile, la polizia per ora non ti ascolta.</span>`;
    else if (S.esposto && S.esposto.ciclo === S.ciclo) corpo = `<span class="sub">La polizia ha già una segnalazione per stanotte.</span>`;
    else if (me.espostoCiclo === S.ciclo) corpo = `<span class="sub">In questo Ciclo hai già firmato un esposto.</span>`;
    else corpo = `<div class="riga"><select id="espL">${luoghi.map((l) => `<option value="${l}">${esc(L.LUOGHI[l].nome)}</option>`).join("")}</select><button class="piccolo oro" data-a2="esposto" ${turno ? "" : "disabled"}>Firma un esposto</button></div>${nonTurno}`;
    esp = `<div class="liv"><span class="liv-n" style="background:var(--oro);color:#111">2</span><div style="flex:1"><b>Firma un esposto</b><div class="sub" style="font-size:12px">Stanotte la polizia sarà lì. Se nessuno fa affari in quel posto, perdi 4 di fama e salti un Ciclo.</div>${corpo}</div></div>`;
  }
  // l'inchiesta
  if (f < 4 && !me.fascicolo) inc = grigio(4, "Apri un'inchiesta");
  else {
    let corpo;
    const fc = me.fascicolo;
    if (fc) corpo = `<span class="sub">Fascicolo su <b>${esc(nomeDi(fc.su))}</b> · Albe passate: ${fc.albe} su 4.</span>${fc.indizi.length ? fc.indizi.map((x, i) => `<div class="sub" style="font-size:12px">Indizio ${i + 1}: ${esc(x.testo)}</div>`).join("") : `<div class="sub" style="font-size:12px">Ancora nessun indizio. Arrivano all'Alba.</div>`}${fc.indizi.length ? `<button class="piccolo oro" data-a2="pubblica" ${turno ? "" : "disabled"}>Pubblica</button>` : ""}${nonTurno}`;
    else {
      const ok = altri.filter((x) => !((me.inchiestaBlocco || {})[x.id] > S.ciclo));
      corpo = ok.length ? `<div class="riga"><select id="incB">${ok.map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("")}</select><button class="piccolo oro" data-a2="inchiesta" ${turno ? "" : "disabled"}>Apri un'inchiesta</button></div>${nonTurno}` : `<span class="sub">Su tutti hai già indagato da poco.</span>`;
    }
    inc = `<div class="liv"><span class="liv-n" style="background:var(--oro);color:#111">4</span><div style="flex:1"><b>Apri un'inchiesta</b><div class="sub" style="font-size:12px">Ogni Alba un indizio vero, se c'è. Con due indizi pubblichi. Lui saprà che qualcuno indaga.</div>${corpo}</div></div>`;
  }
  // l'opera pubblica
  if (f < 6 && !me.operaFatta) op = grigio(6, "Dona un'opera alla città");
  else if (me.operaFatta) op = `<div class="liv"><span class="liv-n" style="background:#2e7d4f">✓</span><div><b>Dona un'opera alla città</b><div class="sub" style="font-size:12px">L'hai già fatto: una sola volta a partita.</div></div></div>`;
  else {
    const libere = L.ISOLE.filter((i) => !(S.opere || []).some((o) => o.isola === i));
    op = `<div class="liv"><span class="liv-n" style="background:var(--oro);color:#111">6</span><div style="flex:1"><b>Dona un'opera alla città</b><div class="sub" style="font-size:12px">${euro(L.COSTO_OPERA_PUBBLICA || 3e6)}. L'isola vale di più per tutti. Sull'edificio c'è il tuo nome.</div>
      ${libere.length ? `<div class="riga" style="flex-wrap:wrap"><select id="opI">${libere.map((i) => `<option value="${i}">${esc(L.NOMI_ISOLE[i])}</option>`).join("")}</select><select id="opT"><option value="teatro">Teatro</option><option value="parco">Parco</option><option value="scuola">Scuola</option></select><button class="piccolo oro" data-a2="opera" ${turno && me.cash >= (L.COSTO_OPERA_PUBBLICA || 3e6) ? "" : "disabled"}>Dona</button></div>${me.cash < (L.COSTO_OPERA_PUBBLICA || 3e6) ? `<div class="sub" style="font-size:12px;color:#ff9a9a">Non hai abbastanza soldi puliti.</div>` : ""}${nonTurno}` : `<span class="sub">Ogni isola ha già la sua opera.</span>`}</div></div>`;
  }
  const opere = (S.opere || []).map((o) => `<div class="sub" style="font-size:12px">${OPERA_ICO[o.opera] || "🏛️"} ${esc(nomeOperaP(o))} · ${esc(L.NOMI_ISOLE[o.isola])}${o.nome ? "" : " (targa tolta)"}</div>`).join("");
  return `<div class="scheda ${f < 2 && !me.fascicolo ? "grigia" : ""}"><h4>⚖️ Cittadino onesto</h4><span class="sub">Fedina pulita: ${f} ${f === 1 ? "Ciclo" : "Cicli"}. ${f < 2 ? "Ti serve Fedina pulita 2." : "Poteri solo per chi è pulito."}</span>${esp}${inc}${op}${opere ? `<div style="margin-top:6px"><b class="sub">Le opere della città</b>${opere}</div>` : ""}</div>`;
}
function finestraPubblica(me) {
  const fc = me.fascicolo; if (!fc || !fc.indizi.length) return;
  const n = fc.indizi.length, e = L.effettoInchiesta(n), chi = nomeDi(fc.su);
  finestra(`<span class="kick" style="color:var(--oro)">⚖️ Inchiesta</span><h2>Pubblichi l'inchiesta su ${esc(chi)}?</h2>
    ${fc.indizi.map((x, i) => `<p class="sub">Indizio ${i + 1}: ${esc(x.testo)}</p>`).join("")}
    <p>A ${esc(chi)}: <b>−${e.fama} fama</b>, +${e.tracce} Tracce${e.stato ? ", e la polizia sale di un gradino (mai fino al Processo)" : ""}.<br>A te: <b>+${e.mia} fama</b>.</p>
    <p class="sub">${n < 2 ? "Con un indizio solo è un'accusa debole. Con due fa molto più male." : "Due indizi: è un'inchiesta vera."} È firmata: tutti sapranno che sei tu. Il suo Ufficio stampa non la ferma.</p>
    <div class="pulsanti"><button id="x">Aspetto</button><button class="oro" id="ok">Pubblica</button></div>`, (d, c) => {
    d.querySelector("#x").onclick = c;
    d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "inchiesta_pubblica" }); };
  });
}
function finestraOpera(me, isola, tipo) {
  const O = (L.OPERE_PUBBLICHE || {})[tipo] || { nome: "Opera" };
  finestra(`<span class="kick" style="color:var(--oro)">${OPERA_ICO[tipo] || "🏛️"} Un dono alla città</span><h2>${esc(O.nome)} ${esc(me.nome)} a ${esc(L.NOMI_ISOLE[isola])}?</h2>
    <p>${euro(L.COSTO_OPERA_PUBBLICA || 3e6)} puliti. ${esc(L.NOMI_ISOLE[isola])} vale di più per tutti (affitti e rendite), tu prendi +8 fama. Sull'edificio c'è il tuo nome.</p>
    <p class="sub">Si fa una volta sola a partita. Se un giorno ti condannano, l'opera resta ma la targa no.</p>
    <div class="pulsanti"><button id="x">Ci penso</button><button class="oro" id="ok">Dona</button></div>`, (d, c) => {
    d.querySelector("#x").onclick = c;
    d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "opera_pubblica", isola, opera: tipo }); };
  });
}
// sul tabellone: la transenna e le opere pubbliche (segni HTML: il 3D li mette al loro posto sulla foto)
function segniMappa() {
  let h = "";
  if (S.transenna) { const [x, y] = puntoMappa({ pos: S.transenna.pos }); h += `<div class="segno-transenna" style="left:${x}%;top:${y}%" title="Transenna: chi si ferma qui viene controllato"><span>🚧</span><small>Transenna</small></div>`; }
  for (const o of S.opere || []) { const p = NOMI_POS[o.isola]; if (!p) continue; h += `<div class="segno-opera" style="left:${p[0]}%;top:${p[1] + 4.5}%" title="${esc(nomeOperaP(o))}"><span>${OPERA_ICO[o.opera] || "🏛️"}</span><small>${esc(nomeOperaP(o))}</small></div>`; }
  return h;
}
// ------------------------------------------------------------ I miei fili: Favori e ricatti (v74)
const NOME_FAV = (t) => ((L.FAVORI || {})[t] || { nome: t }).nome;
const SPIEGA_FAV = (t) => ((L.FAVORI || {})[t] || { spiega: "" }).spiega;
function tempoAllAlba() {
  if (S.fase === "notte" && S.notte) { const h = 6 - S.notte.ora; return "mancano " + h + (h === 1 ? " ora" : " ore") + " all'Alba"; }
  const g = 4 - (S.giorno || 0); return "mancano " + g + (g === 1 ? " giorno" : " giorni") + " e la notte, poi l'Alba";
}
function usoFavore(f) {
  const u = f.uso || {};
  if (f.tipo === "voto") return u.elezione ? "conta alle prossime elezioni" : "usato";
  if (f.tipo === "passo") return "ancora " + (u.turni || 0) + (u.turni === 1 ? " turno" : " turni");
  if (f.tipo === "silenzio") return "fino alla fine del Ciclo " + ((u.fino || 0) + 1);
  if (f.tipo === "mano") return "stanotte alle " + L.ORE[u.ora] + " a " + nomeLuogo(u.luogo);
  return "";
}
function ricattoVittimaHtml(r, me) {
  const da = nomeDi(r.da), pari = (me.prove || []).some((x) => x.su === r.da);
  return `<div class="filo ricatto"><b>${esc(da)} ti ricatta.</b> <span class="sub">Ha una Prova su di te (${esc((r.prova && r.prova.cosa) || "una foto")}, Ciclo ${r.prova ? r.prova.ciclo : "?"}). Vuole: <b>${esc(NOME_FAV(r.tipo))}</b>. Rispondi prima dell'Alba: ${tempoAllAlba()}.</span>
    <div class="scelte-ricatto">
      <button class="piccolo oro" data-ricresp="${r.id}|accetto"><b>Accetto</b><span>Gli devi il Favore. La Prova resta in pegno finché non lo paghi.</span></button>
      <button class="piccolo" data-ricresp="${r.id}|rifiuto"><b>Rifiuto</b><span>Può denunciarti: +35 Tracce e la polizia sale di un gradino.</span></button>
      <button class="piccolo" data-ricresp="${r.id}|confesso"><b>Confesso</b><span>+17 Tracce a te, la Prova sparisce. A lui +25 Tracce e il nome sulla Gazzetta.</span></button>
      ${pari ? `<button class="piccolo" data-ricresp="${r.id}|pari"><b>Pari e patta</b><span>Bruci la tua Prova su di lui e lui la sua su di te.</span></button>` : ""}
    </div></div>`;
}
function filiHtml(me) {
  const fs = (S.favori || []).filter((f) => (f.deve === mioId || f.a === mioId) && (f.stato === "aperto" || f.stato === "attivo"));
  const rs = (S.ricatti || []).filter((r) => r.stato === "attesa" && (r.a === mioId || r.da === mioId));
  const altri = S.players.filter((x) => x.id !== mioId);
  return `<div class="scheda fili-testa"><h4>🧵 I miei fili</h4><span class="sub">Le promesse tra te e gli altri. Il gioco le fa rispettare: chi rompe la parola finisce sulla Gazzetta.${me.senzaParola != null && S.ciclo <= me.senzaParola ? ` <b style="color:#ff9a9a">Hai rotto la parola: fino al Ciclo ${me.senzaParola + 1} nessuno accetta Favori da te.</b>` : ""}</span></div>` + altri.map((x) => {
    const righe = [];
    for (const r of rs.filter((r) => r.a === mioId && r.da === x.id)) righe.push(ricattoVittimaHtml(r, me));
    for (const r of rs.filter((r) => r.da === mioId && r.a === x.id)) righe.push(`<div class="filo ricatto"><span>Lo stai ricattando: vuoi <b>${esc(NOME_FAV(r.tipo))}</b>. Aspetti la risposta (${tempoAllAlba()}).</span></div>`);
    for (const f of fs.filter((f) => f.a === mioId && f.deve === x.id)) righe.push(`<div class="filo"><span>Ti deve: <b>${esc(NOME_FAV(f.tipo))}</b> <span class="sub">(${f.stato === "attivo" ? "in uso: " + esc(usoFavore(f)) : "scade al Ciclo " + (f.scade + 1)}${f.origine === "ricatto" ? " · hai una Prova in pegno" : ""})</span></span>${f.stato === "aperto" ? `<button class="piccolo oro" data-fusa="${f.id}">Usa</button>` : ""}</div>`);
    for (const f of fs.filter((f) => f.deve === mioId && f.a === x.id)) righe.push(`<div class="filo"><span>Gli devi: <b>${esc(NOME_FAV(f.tipo))}</b> <span class="sub">(${f.stato === "attivo" ? "in uso: " + esc(usoFavore(f)) : "scade al Ciclo " + (f.scade + 1)}${f.origine === "ricatto" ? " · ha una Prova su di te in pegno" : ""})</span></span>${f.stato === "aperto" ? `<button class="piccolo" data-frompi="${f.id}">Rompi la parola</button>` : ""}</div>`);
    const sp = x.senzaParola != null && S.ciclo <= x.senzaParola ? `<div class="sub" style="color:#ff9a9a">Ha rotto la parola: nessuno si fida di lui fino al Ciclo ${x.senzaParola + 1}.</div>` : "";
    return `<div class="scheda filo-pers"><h4><span class="pall" style="background:${x.colore}">${esc(x.nome[0])}</span> ${esc(x.nome)}</h4>${sp}${righe.join("") || `<span class="sub">Nessun filo con ${esc(x.nome)}. Per ora.</span>`}</div>`;
  }).join("") + `<hr style="border:0;border-top:1px solid rgba(255,255,255,.12);margin:12px 0">`;
}
function finestraRicattoVittima(r) {
  const me = io();
  finestra(`<span class="kick" style="color:var(--sporco)">${ico("maschera")} Un ricatto</span><h2>${esc(nomeDi(r.da))} ha una Prova su di te</h2>${ricattoVittimaHtml(r, me)}<div class="pulsanti"><button id="dopo">Ci penso</button></div>`, (d, c) => {
    d.querySelector("#dopo").onclick = c;
    d.querySelectorAll("[data-ricresp]").forEach((b) => b.onclick = () => { const [id, scelta] = b.dataset.ricresp.split("|"); c(); agisci({ tipo: "rispondi_ricatto", id, scelta }); });
  });
}
function finestraUsaFavore(f) {
  const deve = nomeDi(f.deve);
  let corpo = "";
  if (f.tipo === "voto") {
    const cand = S.candidati && S.candidati[mioId] !== undefined;
    const st = (S.sette || []).find((x) => x.opera && x.membri.includes(f.deve) && x.membri.includes(mioId) && x.gm !== f.deve);
    corpo = `<p>${esc(SPIEGA_FAV("voto"))}</p>${cand ? `<button class="oro" data-u="elezione">Per le elezioni: la fama di ${esc(deve)} conta per me</button>` : `<p class="sub">Alle elezioni il Voto si usa quando sei candidato (app Municipio).</p>`}
      ${st ? `<p class="sub">Grande Opera della setta ${esc(st.nome)}: decidi tu il voto di ${esc(deve)}.</p><div class="riga"><button class="piccolo" data-u="si">Fagli votare SÌ</button><button class="piccolo" data-u="no">Fagli votare NO</button></div>` : ""}`;
  } else if (f.tipo === "mano") {
    const luoghi = Object.keys(L.LUOGHI).filter((l) => l !== "palazzo");
    const ore = [1, 2, 3, 4, 5].filter((o) => !(S.fase === "notte" && S.notte && o < S.notte.ora + 2));
    corpo = `<p>${esc(SPIEGA_FAV("mano"))}</p>${ore.length ? `<div class="campo"><label for="mL">Dove</label><select id="mL">${luoghi.map((l) => `<option value="${l}">${esc(L.LUOGHI[l].nome)}</option>`).join("")}</select></div><div class="campo"><label for="mO">A che ora</label><select id="mO">${ore.map((o) => `<option value="${o}">${L.ORE[o]}</option>`).join("")}</select></div><p class="sub">Se ${esc(deve)} non c'è, rompe la parola.</p><button class="oro" data-u="mano">Fissa l'appuntamento</button>` : `<p class="sub">Stanotte è troppo tardi: servono almeno 2 ore per arrivare.</p>`}`;
  } else corpo = `<p>${esc(SPIEGA_FAV(f.tipo))}</p>${f.tipo === "passo" && S.fase !== "giorno" ? `<p class="sub">Il Passo libero si usa di giorno.</p>` : `<button class="oro" data-u="usa">Usalo adesso</button>`}`;
  finestra(`<span class="kick" style="color:var(--oro)">🧵 Un Favore</span><h2>${esc(deve)} ti deve ${esc(NOME_FAV(f.tipo))}</h2>${corpo}<div class="pulsanti"><button id="x">Non ora</button></div>`, (d, c) => {
    d.querySelector("#x").onclick = c;
    d.querySelectorAll("[data-u]").forEach((b) => b.onclick = () => {
      const u = b.dataset.u, a = { tipo: "favore_usa", id: f.id };
      if (u === "si" || u === "no") { a.opera = true; a.si = u === "si"; }
      if (u === "mano") { a.luogo = d.querySelector("#mL").value; a.ora = +d.querySelector("#mO").value; }
      c(); agisci(a);
    });
  });
}
function finestraRompiParola(f) {
  finestra(`<span class="kick" style="color:var(--sporco)">🧵 Rompi la parola</span><h2>Non mantieni ${esc(NOME_FAV(f.tipo))}?</h2><p>Perdi 8 di fama, lo saprà tutta la Laguna, e per 2 Cicli nessuno accetterà Favori da te. Sicuro?</p>${f.origine === "ricatto" ? `<p class="sub" style="color:#ffb3b3">${esc(nomeDi(f.a))} si riprende la Prova su di te e potrà denunciarti.</p>` : ""}<div class="pulsanti"><button id="no">No, la mantengo</button><button class="oro" id="si">Sì, la rompo</button></div>`, (d, c) => {
    d.querySelector("#no").onclick = c;
    d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "favore_rompi", id: f.id }); };
  });
}
function finestraRicatto(idx) {
  const me = io(), pr = (me.prove || [])[idx]; if (!pr) return;
  const chi = nomeDi(pr.su);
  finestra(`<span class="kick" style="color:var(--sporco)">${ico("maschera")} Usare una Prova</span><h2>Ricatti ${esc(chi)}?</h2>
    <p class="avviso-rischio" style="color:#ffb3b3">Ricattare è un reato GRAVE. Subito: +6 Tracce. Finché non è chiuso, la polizia ha una pista in più su di te. Se lui confessa: +25 Tracce a te e il tuo nome sulla Gazzetta. Una Prova vale un solo Favore.</p>
    <p class="sub">Cosa vuoi da ${esc(chi)} in cambio del silenzio? Lui saprà che sei tu.</p>${avvisoFedina(me)}
    <div class="scelte-ricatto">${Object.keys(L.FAVORI || {}).map((k) => `<button class="piccolo" data-rf="${k}"><b>${esc(NOME_FAV(k))}</b><span>${esc(SPIEGA_FAV(k))}</span></button>`).join("")}</div>
    <div class="pulsanti"><button id="x">Ci ripenso</button></div>`, (d, c) => {
    d.querySelector("#x").onclick = c;
    d.querySelectorAll("[data-rf]").forEach((b) => b.onclick = () => { c(); agisciSubito({ tipo: "ricatto", prova: idx, favore: b.dataset.rf }); });
  });
}
function bannerMano() {
  const f = (S.favori || []).find((x) => x.tipo === "mano" && x.stato === "attivo" && x.deve === mioId && x.uso && x.uso.ciclo === S.ciclo);
  if (!f || !S.notte) return "";
  const qui = S.notte.dove[mioId] === f.uso.luogo && !S.notte.viaggio[mioId];
  return `<div class="conv-banner">🤝 <span>Appuntamento: <b>${esc(nomeLuogo(f.uso.luogo))}</b> alle <b>${L.ORE[f.uso.ora]}</b>. L'hai promesso a ${esc(nomeDi(f.a))}.${qui ? " · sei qui" : ""}</span>${!qui && !S.notte.viaggio[mioId] && !S.notte.chiuso[mioId] && S.notte.ora <= f.uso.ora ? `<button class="piccolo oro" data-cvvai="${f.uso.luogo}">Vai</button>` : ""}</div>`;
}
function rubrica(me) {
  const notte = S.fase === "notte", dove = notte ? S.notte.dove[mioId] : null;
  const QUANDO = { notte: "di notte", giorno: "di giorno", alba: "all'Alba", sempre: "sempre", raro: "ogni tanto, di notte" };
  const sindaco = S.sindaco ? (S.players.find((p) => p.id === S.sindaco) || {}).nome : "Albertini";
  return filiHtml(me) + `<p class="sub" style="margin-bottom:8px">Chi conta nella Laguna. Tocca \"Vai da lui\" per raggiungerlo di notte.</p>` + PERSONAGGI.map((pg) => {
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
  ["Livello 4 · patrimonio 40 milioni (solo partite lunghe)", "I Grandi Affari: all'asta prima la TV della Laguna (sceglie il titolone), poi la Banca della Laguna (tasso dei prestiti, blocco dei conti). Si strappano comprando quote."],
];
const PAROLE = [
  ["Ciclo", "Un giro completo: 4 giorni di dadi, una notte, un'Alba. Come finisce la partita si sceglie quando la crei: a Cicli, a obiettivo o libera."],
  ["Gruppo di vie", "Ogni isola ha 2 gruppi di vie dello stesso colore (es. «Acciaio» a Distretto Sole). Averle tutte raddoppia gli affitti e ti fa costruire più in alto."],
  ["Permesso e cantiere", "Per costruire chiedi il permesso al Municipio, poi apri il cantiere: l'attività apre all'Alba."],
  ["Fama", "Quanto sei famoso. Serve per alcune cose (Sindaco, livello 5, sette)."],
  ["Soldi sporchi", "Contanti in nero: li spendi di notte. Per usarli di giorno vanno ripuliti."],
  ["Tracce", "Quanto la polizia sa di te. Non le vedi: vedi solo i segnali sotto i tuoi soldi."],
  ["Valigetta", "Gli oggetti comprati di notte. Ti salvano quando qualcosa va storto."],
  ["Prove", "Foto o confidenze su un rivale: puoi denunciarlo o ricattarlo."],
  ["Il Faro", "La prigione: se ci finisci stai fermo qualche turno."],
];
// I miei conti: da dove arrivano e dove vanno i soldi, Ciclo per Ciclo
function appConti(me) {
  const blocco = (ciclo, titolo) => {
    const c = (me.conti || {})[ciclo]; if (!c) return `<div class="scheda"><h4>${titolo}</h4><span class="sub">Nessun movimento.</span></div>`;
    const righe = Object.entries(c).filter(([, v]) => v[0] || v[1]).sort((a, b) => Math.abs(b[1][0] + b[1][1]) - Math.abs(a[1][0] + a[1][1]));
    const tot = righe.reduce((a, [, v]) => [a[0] + v[0], a[1] + v[1]], [0, 0]);
    const cifra = (x, sp) => x ? `<span style="color:${x > 0 ? (sp ? "#ff9a9a" : "var(--pulito)") : "#ffb3b3"};white-space:nowrap">${x > 0 ? "+" : "−"} ${euro(Math.abs(x))}${sp ? " sp." : ""}</span>` : "";
    return `<div class="scheda"><h4>${titolo}</h4><table class="conti">${righe.map(([m, v]) => `<tr><td>${esc(m)}</td><td>${cifra(v[0])}${v[0] && v[1] ? "<br>" : ""}${cifra(v[1], true)}</td></tr>`).join("")}
      <tr class="tot"><td><b>Totale</b></td><td><b>${cifra(tot[0]) || "0 €"}</b>${tot[1] ? "<br>" + cifra(tot[1], true) : ""}</td></tr></table></div>`;
  };
  const r = S.ultimaAlba && S.ultimaAlba.riepilogo && S.ultimaAlba.riepilogo[mioId];
  const voci = r ? [["Rendite (attività, Palazzo, mezzi)", r.rendite], ["Tasse", -r.tasse], ["Tasse evase (diventano sporchi)", -r.evasa], ["Decima alla setta", -r.decima], ["Interessi alla Banca", -r.interessi], ["Mance ai corrotti", -r.corruzione], ["Stipendio da Sindaco", r.stipendioSindaco], ["Dividendi", r.dividendo], ["Il Banchiere della setta ripulisce", r.banchiereSetta], ["Quota del Tesoro (Gran Maestro)", r.tesoroSetta], ["Isola della setta (sporchi)", r.isolaSetta], ["Merce del Ricettatore rivenduta (sporchi)", r.refurtiva]].filter(([, x]) => x) : [];
  return rigaFedina(me) + `<div class="scheda"><span class="sub">Qui vedi <b>perché</b> i tuoi soldi salgono o scendono. Verde: entrate pulite. Rosso chiaro: soldi sporchi ("sp."). Rosso: uscite.</span></div>
    ${blocco(S.ciclo, "Questo Ciclo (" + (S.ciclo + 1) + ")")}${S.ciclo > 0 ? blocco(S.ciclo - 1, "Il Ciclo prima (" + S.ciclo + ")") : ""}
    ${voci.length ? `<div class="scheda"><h4>L'ultima Alba, voce per voce</h4><table class="conti">${voci.map(([k, x]) => `<tr><td>${k}</td><td style="white-space:nowrap;color:${x > 0 ? "var(--pulito)" : "#ffb3b3"}">${x > 0 ? "+" : "−"} ${euro(Math.abs(x))}</td></tr>`).join("")}</table></div>` : ""}`;
}
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
  on("[data-permesso]", (b) => chiediPermesso(me, b.dataset.permesso));
  on("[data-agenzia]", (b) => agisci({ tipo: "agenzia", lotto: b.dataset.agenzia }));
  on("[data-scarica]", (b) => agisci({ tipo: "scarica_contatto", chiave: b.dataset.scarica }));
  on("[data-serv]", (b) => { const [chi, isola] = b.dataset.serv.split("|"); finestraServizio(me, chi, isola); });
  on("[data-dogn]", (b) => agisci({ tipo: "servizio", chi: "doganiere", n: +b.dataset.dogn }));
  on('[data-a2="togliTransenna"]', () => agisci({ tipo: "togli_transenna" }));
  on('[data-a2="esposto"]', () => agisci({ tipo: "esposto", luogo: v("#espL") }));
  on('[data-a2="inchiesta"]', () => agisci({ tipo: "inchiesta_apri", bersaglio: v("#incB") }));
  on('[data-a2="pubblica"]', () => finestraPubblica(io()));
  on('[data-a2="opera"]', () => finestraOpera(io(), v("#opI"), v("#opT")));
  on("[data-vai]", (b) => { telAperto = false; disegnaTelefono(me); chiediViaggio(me, b.dataset.vai); });
  on('[data-a2="licenza"]', () => agisci({ tipo: "licenza" }));
  on('[data-a2="bustaLicenza"]', () => agisci({ tipo: "busta_licenza" }));
  on("[data-regalo]", (b) => agisci({ tipo: "regalo_assessore", lotto: b.dataset.regalo }));
  on("[data-cantiere]", (b) => agisci({ tipo: "costruisci", lotto: b.dataset.cantiere, attivita: b.dataset.tipo || undefined }));
  on('[data-a2="restituisci"]', () => agisci({ tipo: "restituisci", importo: me.debito }));
  on('[data-a2="prestito"]', () => finestraPrestito(me));
  on('[data-a2="regala"]', () => agisci({ tipo: "regala", a: v("#regA"), importo: Number(v("#regImp")), sporchi: !!box.querySelector("#regSp")?.checked }));
  on('[data-a2="piano"]', () => finestraPalazzo(me));
  on("[data-piani]", (b) => agisci({ tipo: "piano", quanti: +b.dataset.piani }));
  collegaTV(box, me);
  on("[data-stanza]", (b) => agisci({ tipo: "stanza", stanza: b.dataset.stanza }));
  on('[data-a2="veicolo"]', () => finestraVeicolo());
  on('[data-a2="nuovoContratto"]', () => finestraContratto());
  on('[data-a2="candidatiTel"]', () => agisci({ tipo: "candidati" }));
  on('[data-a2="campagna"]', () => agisci({ tipo: "campagna", importo: Number(v("#campImp")) }));
  on('[data-a2="legge"]', () => agisci({ tipo: "legge", legge: v("#leggeSel"), isola: v("#leggeIsola") }));
  on('[data-a2="tasse"]', () => agisci({ tipo: "tasse", quota: Number(v("#tasseSel")) }));
  on('[data-a2="fonda"]', () => agisci({ tipo: "fonda_setta", nome: v("#sNome"), motto: v("#sMotto") }));
  if (box.querySelector("#evasione")) box.querySelector("#evasione").onchange = (e) => agisci({ tipo: "evasione", quota: Number(e.target.value) });
  on("[data-denuncia]", (b) => agisci({ tipo: "denuncia", prova: Number(b.dataset.denuncia) }));
  on("[data-ricatta]", (b) => finestraRicatto(Number(b.dataset.ricatta)));
  on("[data-fusa]", (b) => { const f = (S.favori || []).find((x) => x.id === b.dataset.fusa); if (f) finestraUsaFavore(f); });
  on("[data-frompi]", (b) => { const f = (S.favori || []).find((x) => x.id === b.dataset.frompi); if (f) finestraRompiParola(f); });
  on("[data-ricresp]", (b) => { const [id, scelta] = b.dataset.ricresp.split("|"); agisci({ tipo: "rispondi_ricatto", id, scelta }); });
  on("[data-ricapri]", (b) => { const r = (S.ricatti || []).find((x) => x.id === b.dataset.ricapri); if (r) finestraRicattoVittima(r); });
  on("[data-compra]", (b) => { const [cosa, nome] = b.dataset.compra.split("|"); agisci({ tipo: "investi", cosa, nome, importo: Number(v(`[data-imp="${cosa === "borsa" ? "b" : "c"}_${nome}"]`)) }); });
  on("[data-vendi]", (b) => { const [cosa, nome] = b.dataset.vendi.split("|"); agisci({ tipo: "vendi", cosa, nome, quota: 1 }); });
  on("[data-vendimeta]", (b) => { const [cosa, nome] = b.dataset.vendimeta.split("|"); agisci({ tipo: "vendi", cosa, nome, quota: 0.5 }); });
  on("[data-gciclo]", (b) => { gazzettaCiclo = +b.dataset.gciclo; disegnaTelefono(io()); });
  on("[data-invito]", (b) => { const [st, si] = b.dataset.invito.split("|"); agisci({ tipo: "rispondi_invito", setta: st, si: si === "1" }); });
  on("[data-prova]", (b) => { const [st, m] = b.dataset.prova.split("|"); finestraProvaFedelta(st, m); });
  on("[data-tradisci]", (b) => finestra(`<h2>Tradire la setta?</h2><p>Non si torna indietro. All'Alba la polizia riceve tutto, a meno che il Gran Maestro ti scopra prima.</p><div class="pulsanti"><button id="no">Ci ripenso</button><button class="oro" id="si">Chiamo</button></div>`, (d, c) => { d.querySelector("#no").onclick = c; d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "tradisci", setta: b.dataset.tradisci }); }; }));
  on("[data-convoca]", (b) => { const id = b.dataset.convoca; agisci({ tipo: "convoca", setta: id, luogo: v("#convL_" + id), ora: +v("#convO_" + id) }); });
  on("[data-schat]", (b) => { const id = b.dataset.schat, t = v("#chat_" + id); if (t && t.trim()) agisci({ tipo: "msg_setta", setta: id, testo: t }); });
  on("[data-versa]", (b) => { const [st, sp] = b.dataset.versa.split("|"); agisci({ tipo: "versa_setta", setta: st, importo: Number(v("#versa_" + st)), sporchi: sp === "1" }); });
  on("[data-invita]", (b) => { const id = b.dataset.invita; const segno = +v("#invTipo_" + id); const soldi = Math.max(0, Number(v("#invSoldi_" + id)) || 0); if (segno && !soldi) return toast("Scrivi quanto."); agisci({ tipo: "invita_setta", setta: id, invitato: v("#inv_" + id), offerta: segno * soldi }); toast("Invito mandato."); });
  on("[data-caccia]", (b) => { const [st, id] = b.dataset.caccia.split("|"); const m = S.players.find((x) => x.id === id); finestra(`<h2>Cacci ${esc(m.nome)}?</h2><p>Perde subito tutti i privilegi della setta. Però sa chi sono i membri: potrebbe parlare.</p><div class="pulsanti"><button id="no">No</button><button class="oro" id="si">Caccialo</button></div>`, (d, c) => { d.querySelector("#no").onclick = c; d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "espelli_setta", setta: st, membro: id }); }; }); });
  on("[data-lascia]", (b) => agisci({ tipo: "lascia_setta", setta: b.dataset.lascia }));
  on("[data-opera]", (b) => { const [st, k] = b.dataset.opera.split("|"); const o = L.OPERE[k]; finestra(`<h2>${esc(o.nome)}</h2><p>${o.fa}</p><p class="sub" style="color:#ffb3b3"><b>Il rischio:</b> ${o.rischio}</p><div class="pulsanti"><button id="no">Ci penso</button><button class="oro" id="si">Proponi</button></div>`, (d, c) => { d.querySelector("#no").onclick = c; d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "proponi_opera", setta: st, opera: k }); }; }); });
  on("[data-vota]", (b) => { const [st, si] = b.dataset.vota.split("|"); agisci({ tipo: "vota_opera", setta: st, si: si === "1" }); });
  on("[data-ritira]", (b) => agisci({ tipo: "ritira_opera", setta: b.dataset.ritira }));
  on("[data-lava]", (b) => { const id = b.dataset.lava; agisci({ tipo: "lava_setta", setta: id, importo: Number(v("#lava_" + id)) }); });
  on("[data-pagapatto]", (b) => agisci({ tipo: "paga_patto", id: b.dataset.pagapatto }));
  on("[data-contr]", (b) => { const [kk, si] = b.dataset.contr.split("|"); agisci({ tipo: "rispondi_contratto", id: kk, si: si === "1" }); });
}

// ------------------------------------------------------------ finestre
// Le scelte sul tabellone (compro o lascio, asta, gala, municipio...) si aprono di lato e senza velo:
// il tabellone resta in vista e i comandi della vista restano usabili. Chi le apre chiama prima diLato().
let finLato = false;
function diLato() { finLato = true; queueMicrotask(() => { finLato = false; }); }
function finestra(html, collega) {
  const d = document.createElement("div"); d.className = "velo" + (finLato ? " laterale" : ""); finLato = false; d.innerHTML = `<div class="fin vetro">${html}</div>`;
  document.body.appendChild(d);
  const chiudi = () => d.remove();
  collega && collega(d, chiudi);
  return chiudi;
}
// ---------------------------------------------------------------- Sette e mezzo
const SEMI_SM = [["denari", "🪙", "#d4a017"], ["coppe", "🏆", "#c0392b"], ["spade", "⚔️", "#34495e"], ["bastoni", "🪵", "#6b4f2a"]];
function cartaSM(c, coperta) {
  if (coperta) return `<span class="carta-sm coperta"></span>`;
  const v = c % 10, [nome, simbolo, col] = SEMI_SM[Math.floor(c / 10)];
  const fig = ["Fante", "Cavallo", "Re"][v - 7];
  return `<span class="carta-sm" style="--c:${col}"><b>${v < 7 ? v + 1 : fig[0]}</b><i>${simbolo}</i><small>${v < 7 ? nome : fig}</small></span>`;
}
const puntiSM = (t) => t === 0.5 ? "½" : String(t).replace(".5", "½");
let chiaveSM = "";
function tavoloSM(me) {
  const m = S.notte && S.notte.manoSM;
  const aperto = document.querySelector(".velo.sm");
  if (!m) { if (aperto) aperto.remove(); chiaveSM = ""; return false; }
  const chiave = m.carte.join(".") + "_" + m.rilancio + "_" + m.posta;
  if (aperto && chiave === chiaveSM) return true;
  if (aperto) aperto.remove();
  if (document.querySelector(".velo")) return false;
  chiaveSM = chiave;
  const avv = m.tipo === "sfida" || m.tipo === "risposta" ? (() => { const pr = (S.notte.proposte || []).find((x) => x.id === m.prop); const id = pr && (pr.da === mioId ? pr.a : pr.da); const q = S.players.find((x) => x.id === id); return q ? q.nome : "l'avversario"; })() : m.tipo === "serata" ? "il banco di " + ((S.players.find((x) => x.id === m.host) || {}).nome || "") : "il banco della Bisca";
  const tot = m.totale, sballo = tot > 7.5;
  const spiega = m.tipo === "sfida" ? `Giochi tu per primo. ${esc(avv)} non vedrà le tue carte: vedrà solo quanto c'è sul tavolo.` : m.tipo === "risposta" ? `${esc(avv)} ha già giocato la sua mano, coperta. Avvicinati a 7 e mezzo senza superarlo.` : `Il banco gioca dopo di te e si ferma a 5 e mezzo. A pari punti vince il banco. Sette e mezzo con 2 carte paga il triplo.`;
  const d = document.createElement("div"); d.className = "velo sm";
  d.innerHTML = `<div class="fin vetro tavolo-sm">
    <span class="kick" style="color:var(--oro)">♠ Sette e mezzo · contro ${esc(avv)}</span>
    <h2>Sul tavolo: ${euro(m.posta)}</h2>
    <p class="sub">${spiega}</p>
    <div class="mano-sm">${m.carte.map((c) => cartaSM(c)).join("")}</div>
    <div class="tot-sm ${sballo ? "sballo" : tot === 7.5 ? "sette" : ""}">${puntiSM(tot)} <span>${tot > 7.5 ? "sballato" : tot === 7.5 ? "sette e mezzo!" : "punti"}</span></div>
    <div class="pulsanti">
      <button id="smSto">Sto</button>
      <button class="oro" id="smCarta">Un'altra carta</button>
    </div>
    ${m.puoRilanciare && !m.rilancio ? `<button class="piccolo rilancio-sm" id="smRil">Rilancia: metti altri ${euro(m.posta)} (bluff o mano buona?)</button>` : ""}
    <p class="sub">Asso–7 valgono il loro numero. Fante, Cavallo e Re valgono mezzo punto. Sopra 7 e mezzo hai perso.</p>
  </div>`;
  document.body.appendChild(d);
  const mossa = (x) => { d.querySelectorAll("button").forEach((b) => b.disabled = true); agisci({ tipo: "sm", mossa: x }); };
  d.querySelector("#smSto").onclick = () => mossa("sto");
  d.querySelector("#smCarta").onclick = () => mossa("carta");
  if (d.querySelector("#smRil")) d.querySelector("#smRil").onclick = () => mossa("rilancia");
  return true;
}
function esitoSM() {
  const u = S.notte && S.notte.ultimaMano;
  if (!u || u.gioco !== "sm" || visti.has("sm" + S.ciclo + u.id)) return false;
  try { if (sessionStorage.getItem("laguna_sm_" + partita + "_" + S.ciclo + u.id)) return false; sessionStorage.setItem("laguna_sm_" + partita + "_" + S.ciclo + u.id, "1"); } catch (e) { }
  visti.add("sm" + S.ciclo + u.id);
  const tit = u.esito === "vinto" ? (u.sette ? "Sette e mezzo reale! Hai vinto" : "Hai vinto") : u.esito === "pari" ? "Pari" : "Hai perso";
  finestra(`<span class="kick" style="color:var(--oro)">♠ Sette e mezzo · ${euro(u.importo)} sul tavolo</span>
    <h2 style="color:${u.esito === "vinto" ? "var(--pulito)" : u.esito === "pari" ? "var(--oro)" : "#ff8a8a"}">${tit}</h2>
    <div class="esito-sm"><span class="sub">Tu</span><div class="mano-sm">${u.mie.map((c) => cartaSM(c)).join("")}</div><b>${puntiSM(u.totMie)}${u.totMie > 7.5 ? " · sballato" : ""}</b></div>
    <div class="esito-sm"><span class="sub">${esc(u.avv)}</span><div class="mano-sm">${u.sue.map((c) => cartaSM(c)).join("")}</div><b>${puntiSM(u.totSue)}${u.totSue > 7.5 ? " · sballato" : ""}</b></div>
    <div class="pulsanti"><button class="oro" id="ok">Avanti</button></div>`, (d, c) => d.querySelector("#ok").onclick = c);
  return true;
}
// ---------------------------------------------------------------- Camminare di notte nel mondo 3D (v87)
function iniziaCammino(me) {
  const N2 = S.notte, dove = N2.dove[mioId];
  const luoghi = Object.keys(L.LUOGHI).filter((l) => L.LUOGHI[l].sblocco <= S.sblocco).map((l) => { const [x, y] = posLuogo(l, me); return { id: l, nome: nomeLuogo(l), x, y, colore: l === dove ? "#7bd88f" : "#ffd27a" }; });
  { const [x, y] = posLuogo("palazzo", me); luoghi.push({ id: "palazzo", nome: "Il tuo Palazzo", x, y, colore: "#c9a7ff" }); }
  const [x, y] = posLuogo(dove, me);
  camminaAttivo = true; document.body.classList.add("cammino");
  $("#mondo").style.display = "block";
  const barra = document.createElement("div"); barra.id = "camminaBarra"; barra.className = "cammina-barra vetro";
  barra.innerHTML = `<span id="cbTesto">Frecce o W A S D per camminare. Sul telefono tocca dove vuoi andare. Avvicinati a una luce per entrare.</span><button id="cbEntra" class="notte" style="display:none"></button><button id="cbTorna">Torna alla scena</button>`;
  document.body.appendChild(barra);
  barra.querySelector("#cbTorna").onclick = () => { fermaCammino(); disegna(); };
  const vicino = (id) => {
    const b = barra.querySelector("#cbEntra"), testo = barra.querySelector("#cbTesto");
    if (!id) { b.style.display = "none"; testo.textContent = "Frecce o W A S D per camminare. Sul telefono tocca dove vuoi andare. Avvicinati a una luce per entrare."; return; }
    const nome = id === "palazzo" ? "il tuo Palazzo" : nomeLuogo(id);
    b.style.display = "";
    if (id === dove) { testo.textContent = "Sei davanti a " + nome + ", dove sei adesso."; b.textContent = "Rientra"; b.onclick = () => { fermaCammino(); disegna(); }; return; }
    const ore = L.oreViaggio(S, me, dove, id);
    testo.textContent = "Davanti a " + nome + ". Entrare costa " + (ore === 1 ? "1 ora" : ore + " ore") + " della notte.";
    b.textContent = "Entra";
    b.onclick = () => { fermaCammino(); agisci({ tipo: "vai", luogo: id }); };
  };
  if (!Tre.avviaCammino({ x, y, colore: me.colore, luoghi, vicino })) { fermaCammino(); finestra(`<h2>Non si può camminare</h2><p>Il mondo 3D non è pronto. Riprova tra poco.</p><div class="pulsanti"><button class="oro" id="ok">Ok</button></div>`, (d, c) => d.querySelector("#ok").onclick = c); return; }
  disegna();
}
function fermaCammino() {
  camminaAttivo = false; document.body.classList.remove("cammino");
  const b = document.querySelector("#camminaBarra"); if (b) b.remove();
  if (TRE3D && Tre.fermaCammino) Tre.fermaCammino();
}
// ---------------------------------------------------------------- La soffiata contro un rivale (v85)
function finestraDenuncia(me) {
  const rivali = S.players.filter((p) => p.id !== mioId);
  const posti = ["porto", "marina", "bisca", "mercato", "club", "villa", "aeroporto"];
  finestra(`<span class="kick" style="color:var(--sporco)">☎️ Una cabina telefonica</span><h2>La soffiata</h2>
    <p>Fai il nome di un rivale e il posto dove pensi che lavori stanotte. Se indovini e lui fa un affare lì, la polizia lo aspetta: i suoi guai quasi raddoppiano e, se lo prendono, tu hai una <b>Prova</b> contro di lui.</p>
    <p class="sub">Pensa a dove va di solito, a che livello è, a cosa si apre stanotte. Costa ${euro(100000)} (prima gli sporchi). 1 volta su 4 l'informatore parla e lui saprà che sei stato tu.</p>
    <div class="campo"><label for="denSu">Chi</label><select id="denSu">${rivali.map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("")}</select></div>
    <div class="campo"><label for="denLu">Dove</label><select id="denLu">${posti.map((l) => `<option value="${l}">${esc(nomeLuogo(l))}</option>`).join("")}</select></div>
    <div class="pulsanti"><button id="x">Lascio stare</button><button class="notte" id="ok" ${me.cash + me.sporchi < 100000 ? "disabled" : ""}>Chiamo la polizia</button></div>`, (d, cl) => { d.querySelector("#x").onclick = cl; d.querySelector("#ok").onclick = () => { cl(); agisci({ tipo: "soffiata_rivale", su: d.querySelector("#denSu").value, luogo: d.querySelector("#denLu").value }); }; });
}
// ---------------------------------------------------------------- Il colpo a scelte (v83)
let chiaveColpo = "", timerColpo = null;
function tavoloColpo(me) {
  const C = S.notte && S.notte.colpo;
  const aperto = document.querySelector(".velo.colpo");
  if (!C) { if (aperto) aperto.remove(); chiaveColpo = ""; clearInterval(timerColpo); return false; }
  const chiave = C.passo + "_" + C.quando;
  if (aperto && chiave === chiaveColpo) return true;
  if (aperto) aperto.remove();
  if (document.querySelector(".velo")) document.querySelectorAll(".velo").forEach((x) => x.remove());
  chiaveColpo = chiave; clearInterval(timerColpo);
  const ultimo = C.passo >= C.passi - 1;
  const col = C.rischio >= 50 ? "#ff5c5c" : C.rischio >= 25 ? "#f3c56b" : "#7bd88f";
  const battito = Math.max(0.35, 1.2 - C.rischio / 70);
  const d = document.createElement("div"); d.className = "velo colpo";
  d.innerHTML = `<div class="fin vetro colpo-fin${ultimo ? (C.segnale ? " allarme" : " calmo") : ""}" style="--battito:${battito}s">
    <span class="kick" style="color:var(--cielo)">${esc(nomeLuogo(C.luogo))} · ${esc(C.nome)} · bivio ${C.passo + 1} di ${C.passi}</span>
    <div class="colpo-cuore" aria-hidden="true">♥</div>
    <h2>${esc(C.testo)}</h2>
    ${C.storia.length ? `<p class="sub" style="font-size:12px">Finora: ${C.storia.map(esc).join(" · ")}</p>` : ""}
    <div class="colpo-stato">
      <div><span class="sub">Rischio di guai</span><b style="color:${col}">${C.rischio}%</b></div>
      <div><span class="sub">Bottino</span><b>${euro(C.bottino[0])} – ${euro(C.bottino[1])}</b></div>
      <div><span class="sub">Tracce</span><b>~${C.tracce}</b></div>
    </div>
    ${C.venduto ? `<p style="color:#ff8a8a;font-size:13px;margin:4px 0">⚠️ ${esc(C.venduto)}</p>` : ""}
    ${ultimo ? `<p class="sub" style="font-size:12px">Il segnale dice il vero 3 volte su 4. Fidati, o no.</p>` : ""}
    <div class="colpo-opz">${C.opzioni.map((o, i) => `<button class="ogg" data-i="${i}" style="text-align:left;color:#fff" ${o.costo && me.cash + me.sporchi < o.costo ? "disabled" : ""}><div><b>${esc(o.l)}${o.costo ? " · " + euro(o.costo) : ""}</b><div class="sub" style="font-size:12px">${esc(o.d)}${o.gu ? " Rischio " + (o.gu < 1 ? "−" : "+") + Math.round(Math.abs(o.gu - 1) * 100) + "%" : ""}${o.ga && o.ga !== 1 ? ", bottino " + (o.ga < 1 ? "−" : "+") + Math.round(Math.abs(o.ga - 1) * 100) + "%" : ""}${o.gu ? "." : ""}</div></div></button>`).join("")}</div>
    <div class="colpo-tempo"><i></i></div>
    <p class="sub" style="font-size:12px" id="colpoSec"></p>
  </div>`;
  document.body.appendChild(d);
  if (ultimo && C.segnale && navigator.vibrate) try { navigator.vibrate([120, 80, 120]); } catch (e) { }
  let mandato = false;
  const manda = (i, esitato) => { if (mandato) return; mandato = true; clearInterval(timerColpo); d.querySelectorAll("button").forEach((b) => b.disabled = true); agisci({ tipo: "colpo", i, esitato }); };
  d.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => manda(+b.dataset.i, false));
  const barra = d.querySelector(".colpo-tempo i"), sec = d.querySelector("#colpoSec");
  const tic = () => {
    const resta = (C.tempo || 20) - (oraServer() - C.quando) / 1000;
    barra.style.width = Math.max(0, resta / (C.tempo || 20) * 100) + "%";
    barra.style.background = resta < 6 ? "#ff5c5c" : "var(--oro)";
    sec.textContent = resta > 0 ? "Hai " + Math.ceil(resta) + " secondi. Se esiti, " + (ultimo ? "resti impietrito e tiri dritto." : "fai la cosa prudente ma il rischio sale.") : "Esiti…";
    if (resta <= 0) manda(0, true);
  };
  tic(); timerColpo = setInterval(tic, 250);
  return true;
}
function finestreAutomatiche(me) {
  if (S.fase === "notte" && S.notte && tavoloColpo(me)) return;
  if (camminaAttivo) return; // mentre cammini niente finestre che coprono il mondo
  if (S.fase === "notte" && S.notte && tavoloSM(me)) return;
  if (document.querySelector(".velo")) return;
  if (S.fase === "notte" && S.notte && esitoSM()) return;
  // 1. cose a cui rispondere subito
  if (S.fase === "notte" && S.notte && finestraProposteNotte(me)) return;
  { const ric = (S.ricatti || []).find((r) => r.a === mioId && r.stato === "attesa" && !visti.has("ric" + r.id)); if (ric) { visti.add("ric" + ric.id); return finestraRicattoVittima(ric); } }
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
  if (S.ultimaCarta && S.ultimaCarta.giocatore === mioId) { const k = "carta" + S.ultimaCarta.testo + S.ciclo + S.giorno; if (!visti.has(k)) { visti.add(k); toast("📰 Gazzetta · " + S.ultimaCarta.testo); } }
  if (me.ultimaSentenza && !visti.has("sent" + JSON.stringify(me.ultimaSentenza))) { visti.add("sent" + JSON.stringify(me.ultimaSentenza)); return finestraSentenza(me, me.ultimaSentenza); }
}
// Punto 29: la sentenza in una finestra grande, in parole semplici. Prima in breve cosa ti succede, poi perche', poi i dettagli.
const GRAV_SPIEGA = { lieve: "piccolo", media: "medio", grave: "grave", gravissima: "gravissimo" };
function finestraSentenza(me, s) {
  const gio = L.N.giorni || 4, conf = s.confiscati || 0, tes = (s.tesori || []).reduce((t, x) => t + x.importo, 0);
  const chiusi = s.chiusiNomi && s.chiusiNomi.length ? s.chiusiNomi : null, nChiusi = chiusi ? chiusi.length : s.chiusi || 0;
  // 1. in breve: una riga per cosa, frasi corte
  const r = [];
  r.push(["⚖️", `Paghi una multa di <b>${euro(s.multa)}</b>.`]);
  if (conf > 0) r.push(["💸", `Ti portano via i soldi sporchi che avevi: <b>${euro(conf)}</b>.`]);
  if (s.faro) r.push(["🗼", `Vai in cella al Faro per <b>${s.faro} turni</b>${s.faro >= gio ? ` (circa ${Math.round(s.faro / gio)} ${Math.round(s.faro / gio) === 1 ? "Ciclo" : "Cicli"})` : ""}.`]);
  if (s.blocco) r.push(["📉", s.blocco === 1 ? "Alla prossima Alba i tuoi locali rendono <b>la metà</b>." : `Per le prossime <b>${s.blocco} Albe</b> i tuoi locali rendono <b>la metà</b>.`]);
  if (nChiusi) r.push(["🔒", `${nChiusi === 1 ? "Un tuo locale resta chiuso" : nChiusi + " tuoi locali restano chiusi"} per un Ciclo${chiusi ? ": " + esc(chiusi.join(", ")) : ""}.`]);
  if (s.sequestrati && s.sequestrati.length) r.push(["🏚️", `Ti tolgono per sempre: <b>${esc(s.sequestrati.join(", "))}</b>.`]);
  if (s.piani) r.push(["🏢", `Perdi <b>${s.piani} piani</b> del Palazzo${s.stanzePerse && s.stanzePerse.length ? " (con " + esc(s.stanzePerse.join(", ")) + ")" : ""}.`]);
  if (s.contatti) r.push(["📇", `Perdi i tuoi <b>${s.contatti} contatti</b> corrotti.`]);
  for (const x of s.tesori || []) r.push(["🗝️", `La setta «${esc(x.nome)}» perde <b>${euro(x.importo)}</b> dal Tesoro (sei il Gran Maestro).`]);
  if (s.cerchiePerse) r.push(["🥂", "I circoli esclusivi ti cacciano."]);
  if (s.fama) r.push(["⭐", `Perdi <b>${s.fama} di fama</b>.`]);
  const totale = s.multa + conf + tes;
  const breve = `<div class="sent-breve"><div class="sent-tot">In tutto perdi <b>${euro(totale)}</b></div>${r.map(([i, x]) => `<div class="sent-riga"><span>${i}</span><span>${x}</span></div>`).join("")}</div>`;
  // 2. perche': le piste, poi cosa ha alzato o abbassato la pena
  const note = s.note || (s.sconti || []).map((x) => ({ k: /sale/.test(x) ? "recidiva" : "", testo: x }));
  const meglio = note.filter((x) => x.k !== "recidiva" && x.k !== "tetto"), peggio = note.filter((x) => x.k === "recidiva");
  const breveNota = (x) => ({ setta: "alla tua setta", giudice: "al Giudice amico della setta", supremo: "al Giudice supremo della setta", avvocato: "al tuo avvocato" })[x.k] || x.testo;
  const perche = `<div class="sent-box"><b>Perché?</b> La polizia ha raccolto abbastanza prove su di te${s.piste && s.piste.length ? ", soprattutto per " + s.piste.map((x) => "<b>" + esc(x.cosa) + "</b>").join(" e ") : ""}. Il reato è <b>${esc(GRAV_SPIEGA[s.gravita] || s.gravita)}</b>.
    ${peggio.length ? `<br>🔺 Pena più dura: avevi già una condanna.` : ""}${meglio.length ? `<br>🔻 Pena più leggera grazie ${meglio.map((x) => esc(breveNota(x))).join(" e ")}.` : ""}${s.salvi > 0 ? `<br>🛟 Hai salvato <b>${euro(s.salvi)}</b> di soldi sporchi.` : ""}</div>`;
  // 3. adesso
  const dopo = `<div class="sent-azzera"><b>E adesso?</b> La polizia ti lascia in pace: le Tracce ripartono quasi da zero. Ma se ti condannano di nuovo, la pena sarà più dura.${s.faro ? ` Al Faro non tiri i dadi e di notte resti in cella; a ogni tuo turno puoi fare <b>una sola cosa</b> dal telefono.` : ""}</div>`;
  // 4. i dettagli e come funziona: chiusi, per chi vuole
  const det = [];
  det.push(`<li><b>Multa:</b> è una parte di tutto quello che hai (contanti, locali, azioni): ${Math.round((s.multaQuota != null ? s.multaQuota : (L.MULTA_CONDANNA[s.gravita] || 0)) * 100)}%. Più il reato è grave, più è alta.${s.legale ? " Il tuo Studio legale l'ha abbassata." : ""} Se mancano i contanti, la banca vende le tue azioni.</li>`);
  det.push(`<li><b>Soldi sporchi:</b> a ogni condanna perdi quelli che hai in quel momento${conf ? "" : " (oggi non ne avevi, quindi niente)"}. Il Caveau del Palazzo e la cassetta di sicurezza ne salvano una parte.</li>`);
  if (s.faro) det.push(`<li><b>Faro:</b> ${gio} turni fanno un Ciclo. Esci da solo quando finiscono.</li>`);
  if (s.blocco) det.push(`<li><b>Entrate a metà:</b> anche lo Stipendio del Ponte Sud non arriva.</li>`);
  const come = `<details class="sent-come"><summary>Dettagli e come funzionano le condanne</summary><ul>${det.join("")}</ul>
    <p><b>In breve:</b> gli affari sporchi danno soldi sporchi ma lasciano Tracce. Tante Tracce = la polizia indaga, fino al Processo. Al Processo, all'Alba, ti condannano. Per evitarlo: cambia posto di notte, fai Cicli puliti, compra l'Avvocato. Le protezioni (setta, Giudici, avvocato) abbassano la pena ma non la cancellano: la multa resta almeno il 60% di quella piena, un reato gravissimo non scende sotto Grave, e 1 volta su 8 il Procuratore capo non fa sconti.</p></details>`;
  return finestra(`<span class="kick" style="color:var(--sporco)">Sentenza · reato ${esc(GRAV_SPIEGA[s.gravita] || s.gravita)}</span><h2>Sei stato condannato</h2>
    ${breve}${perche}${dopo}${come}
    <div class="pulsanti"><button class="oro grande" id="ok">Ho capito</button></div>`, (d, c) => { d.querySelector(".fin").classList.add("sentenza"); d.querySelector("#ok").onclick = c; });
}
window.rileggiSentenza = () => { const me = S && S.players && S.players.find((p) => p.id === mioId); if (me && me.ultimaSentenza) finestraSentenza(me, me.ultimaSentenza); };
function extraTesto(e) {
  const t = [];
  if (e.cash) t.push("+" + euro(e.cash)); if (e.piani) t.push("un Palazzo di " + e.piani + " piani"); if (e.azioni) t.push(euro(e.azioni) + " in azioni");
  if (e.veicolo) t.push("un motoscafo"); if (e.fama) t.push("fama " + e.fama); if (e.reputazione) t.push("amici nel giro"); if (e.cripto) t.push(euro(e.cripto) + " in FlamingoToken");
  return t.join(" · ");
}
function finestraPacchetti() {
  document.querySelectorAll(".velo [data-pk]").forEach((el) => el.closest(".velo") && el.closest(".velo").remove()); // mai due finestre uguali
  if (S.fase !== "pacchetti") return;
  finestra(`<span class="kick" style="color:var(--oro)">La tua storia</span><h2>Chi sei, quando arrivi nella Laguna?</h2><p>Partite tutti uguali: <b>${euro(L.N.cashStart)}</b> e <b>un terreno a sorte</b> (se ti tocca uno più economico, la differenza ti arriva in contanti). Ogni storia ti dà un vantaggio diverso: scegli quello che va col tuo modo di giocare.</p>
    <div class="griglia">${S.pacchettiDisponibili.map((id) => { const k = L.PACCHETTI.find((x) => x.id === id); return `<button class="sch" data-pk="${id}"><h3 class="serif" style="font-weight:400;font-size:20px">${esc(k.nome)}</h3><p style="margin-top:6px;color:var(--oro);font-weight:700">${esc(k.perk)}</p></button>`; }).join("")}</div>`,
    (d, chiudi) => d.querySelectorAll("[data-pk]").forEach((el) => el.onclick = () => { chiudi(); agisci({ tipo: "pacchetto", id: el.dataset.pk }); }));
}
function finestraAsta(me) {
  diLato();
  const l = S.lotti.find((x) => x.id === S.pending.lotto);
  finestra(`<span class="kick" style="color:var(--rosa)">Asta${l.isola ? " · " + esc(L.NOMI_ISOLE[l.isola]) : ""}</span><h2>${esc(l.nome)}</h2><p>Vale ${euro(l.prezzo)}. Ognuno offre in segreto: vince chi offre di più. Hai ${euro(me.cash)}.</p>${S.pending.sequestro ? `<p class="sub">Terreno sequestrato dal Comune. Offerta minima ${euro(S.pending.minimo)}. I soldi vanno alla banca; l'ex padrone non può partecipare.</p>` : ""}
    <div class="campo"><label for="off">La tua offerta</label><input id="off" type="number" value="0" style="font-size:22px;font-weight:800"></div>
    <div class="pulsanti"><button id="no">Non offro</button><button class="oro" id="ok">Offro</button></div>`, (d, chiudi) => {
    d.querySelector("#ok").onclick = () => { chiudi(); agisci({ tipo: "offerta", importo: Number(d.querySelector("#off").value) }); };
    d.querySelector("#no").onclick = () => { chiudi(); agisci({ tipo: "offerta", importo: 0 }); };
  });
}
function finestraPending(me) {
  diLato();
  const pd = S.pending;
  if (!pd) return disegna();
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
// L'Alba in ordine: prima i numeri, poi i fatti importanti della notte, poi (chiusi) il racconto completo, i conti e il giornale
function tipoRiga(t) {
  if (/^(Esci|Parti |Arrivi|Torni|Alle 4|Resti|Aspetti|Ti metti in viaggio)/.test(t) || /Tutto tranquillo\.?$/.test(t)) return "via";
  if (/(perdi|Perdi|hai perso|sequestr|arrest|Faro|sirene|Sirene|scappi|riconosc|foto|Prova|scoperto|Tracce in più|condann|multa|retata)/.test(t)) return "male";
  if (/(Vinci|vinci|vinto|guadagn|ti porti via|incassi|Incassi|ripulit|pulit|\+\s?\d|fama cresce|riuscit)/.test(t)) return "bene";
  return "fatto";
}
function finestraAlba(me) {
  const r = (S.ultimaAlba.riepilogo || {})[mioId] || {};
  const racc = (me.raccontoNotte || []).map((x) => { const [o, ...t] = x.split(" — "); return { o, t: t.join(" — ") }; });
  const importanti = racc.filter((x) => tipoRiga(x.t) !== "via");
  const netto = (r.rendite || 0) - (r.tasse || 0) - (r.interessi || 0) - (r.corruzione || 0) + (r.tesoroSetta || 0) + (r.banchiereSetta || 0);
  const guai = importanti.filter((x) => tipoRiga(x.t) === "male").length;
  const ICO_R = { bene: ["✓", "var(--pulito)"], male: ["!", "var(--sporco)"], fatto: ["•", "var(--cielo)"] };
  const gazAlba = S.gazzetta.filter((g) => g.ciclo === S.ultimaAlba.ciclo || g.ciclo === S.ultimaAlba.ciclo + 1);
  const mie = gazAlba.filter((g) => g.testo.includes(me.nome));
  finestra(`<span class="kick" style="color:var(--oro)">${ico("sole")} L'Alba · Ciclo ${S.ultimaAlba.ciclo}</span><h2>Com'è andata stanotte</h2>
    <div class="alba-numeri">
      <div><span>Rendite del mattino</span><b style="color:${netto >= 0 ? "var(--pulito)" : "var(--sporco)"}">${netto >= 0 ? "+ " : "− "}${euro(Math.abs(netto))}</b><i>dopo tasse e spese</i></div>
      <div><span>Polizia</span><b style="color:${(me.stato || 0) >= 3 ? "var(--sporco)" : (me.stato || 0) >= 1 ? "#f3c56b" : "var(--pulito)"}">${esc(L.STATI[me.stato || 0] || "")}</b><i>${guai ? guai + (guai === 1 ? " guaio" : " guai") + " stanotte" : "nessun guaio stanotte"}</i></div>
    </div>
    <p class="kick" style="color:var(--muted);margin-top:14px">I fatti della notte</p>
    <div class="alba-fatti">${importanti.length ? importanti.map((x) => { const k = tipoRiga(x.t), [ic, col] = ICO_R[k]; return `<div class="alba-fatto ${k}"><span class="af-ico" style="background:${col}">${ic}</span><div><b>${esc(x.o)}</b> ${esc(x.t)}</div></div>`; }).join("") : `<p class="sub">Una notte tranquilla: niente di importante.</p>`}</div>
    ${racc.length > importanti.length ? `<details class="alba-det"><summary>Tutto il racconto della notte (${racc.length} momenti)</summary>${racc.map((x) => `<p class="storia" style="margin:4px 0"><b style="color:var(--cielo);font-style:normal">${esc(x.o)}</b> ${esc(x.t)}</p>`).join("")}</details>` : ""}
    <details class="alba-det"><summary>I conti del mattino: ${netto >= 0 ? "+ " : "− "}${euro(Math.abs(netto))}</summary>
      ${(r.dettaglio || []).length ? `<table class="cl">${r.dettaglio.map((x) => `<tr><td>${esc(x.nome)} <span class="sub">${esc(x.cosa)}</span></td><td style="color:${x.importo ? "var(--pulito)" : "var(--muted)"};font-weight:700;white-space:nowrap">${x.importo ? "+ " + euro(x.importo) : "—"}</td></tr>`).join("")}</table>` : ""}
      <table class="cl"><tr><td><b>Totale rendite</b></td><td style="color:var(--pulito);font-weight:800;white-space:nowrap">+ ${euro(r.rendite || 0)}</td></tr><tr><td>Tasse</td><td style="color:var(--sporco);font-weight:800;white-space:nowrap">− ${euro(r.tasse || 0)}</td></tr>
      ${r.interessi ? `<tr><td>Interessi alla Banca</td><td style="white-space:nowrap">− ${euro(r.interessi)}</td></tr>` : ""}${r.corruzione ? `<tr><td>Le "mance" ai tuoi amici</td><td style="white-space:nowrap">− ${euro(r.corruzione)}</td></tr>` : ""}${r.tesoroSetta ? `<tr><td>Dal Tesoro della setta (sporchi)</td><td style="white-space:nowrap">+ ${euro(r.tesoroSetta)}</td></tr>` : ""}${r.banchiereSetta ? `<tr><td>Ripuliti dal Banchiere della setta</td><td style="white-space:nowrap">${euro(r.banchiereSetta)}</td></tr>` : ""}</table>
    </details>
    ${r.consiglio ? `<div class="scheda" style="margin-top:12px;border:1px solid rgba(255,95,162,.4)"><b style="color:#ff5fa2">Vera ti suggerisce</b><p style="margin:4px 0 0">${esc(r.consiglio.testo)}</p></div>` : ""}
    ${mie.length ? `<p class="kick" style="color:var(--muted);margin-top:14px">La Gazzetta parla di te</p>${mie.slice(0, 3).map((g) => `<p class="sub" style="margin:4px 0;color:var(--testo,#e5e7eb)">📰 ${esc(g.testo)}</p>`).join("")}` : ""}
    <details class="alba-det"><summary>La Gazzetta di stamattina (${gazAlba.length} notizie)</summary>${primaPagina(S.ultimaAlba.ciclo, true)}</details>
    <div class="pulsanti"><button class="oro" id="ok">Inizia il giorno</button></div>`, (d, c) => d.querySelector("#ok").onclick = c);
}
// Le piste: cosa sta seguendo la polizia su di te (le prove dei rivali restano nascoste)
function schedaPiste(me) {
  const ps = L.piste(S, me);
  const cal = Object.entries(me.calore || {});
  const pall = (n) => `<span style="letter-spacing:2px;color:${n >= 3 ? "var(--sporco)" : n === 2 ? "#ff8a3d" : "#f3c56b"}">${"●".repeat(Math.min(3, n))}${"○".repeat(Math.max(0, 3 - n))}</span>`;
  return `<div class="scheda"><h4>${ico("siren")} Le tue piste</h4>
    <span class="sub">La polizia non tira a caso: segue le piste che lasci. Se le conosci, le puoi schivare.</span>${me.ultimaSentenza ? `<button style="margin:6px 0" onclick="rileggiSentenza()">⚖️ Rileggi la tua ultima sentenza</button>` : ""}
    ${me.rischioPerq != null ? `<div class="liv"><span class="liv-n">🚨</span><div><b>Perquisizione all'Alba: ${me.rischioPerq >= 20 ? "rischio alto" : me.rischioPerq >= 8 ? "rischio medio" : me.rischioPerq > 0 ? "rischio basso" : "nessun rischio"}${me.rischioPerq ? " (circa " + me.rischioPerq + "%)" : ""}</b><div class="sub" style="font-size:12px">Più Tracce lasci, più è facile che la polizia entri nel tuo Palazzo: porta via il 30% degli sporchi e gli oggetti illegali. Il caveau e la cassetta ne salvano una parte; poliziotti comprati e setta abbassano il rischio.</div></div></div>` : ""}
    <div class="liv"><span class="liv-n">📍</span><div><b>I posti</b><div class="sub" style="font-size:12px">${cal.length ? cal.map(([l, c]) => `${esc(L.LUOGHI[l] ? L.LUOGHI[l].nome : l)} ${pall(c)}`).join(" · ") + "<br>Più torni nello stesso posto, più ti riconoscono. Cambia posto e la pista si raffredda." : "Nessun posto ti conosce. Una notte di affari nello stesso posto basta per farti notare."}</div></div></div>
    <div class="liv"><span class="liv-n">€</span><div><b>I soldi</b><div class="sub" style="font-size:12px">${me.calSoldi > 0 ? `La Finanza ti guarda ${pall(Math.ceil(me.calSoldi / 2))}. Ripulisci e spendi in lusso solo quanto i tuoi locali possono giustificare.` : "I tuoi conti tornano. Se ripulisci o compri lusso oltre quello che rendono i tuoi locali, la Finanza se ne accorge."}</div></div></div>
    <div class="liv"><span class="liv-n">🤝</span><div><b>I complici</b><div class="sub" style="font-size:12px">${ps.some((x) => x.k === "complici") ? "Un tuo complice è sotto inchiesta: scaricalo (La tua rete), o può fare il tuo nome." : "Nessun complice nervoso. Più usi lo stesso, più è facile che lo becchino."}</div></div></div>
    <div class="liv"><span class="liv-n">?</span><div><b>I rivali</b><div class="sub" style="font-size:12px">Non sai mai chi ha una foto o una prova contro di te. È la pista che non vedi.</div></div></div>
    ${me.ultimaPista ? `<div class="sub" style="font-size:12px;margin-top:6px;color:var(--sporco)">L'ultima volta ti hanno tradito: ${esc(me.ultimaPista.testo)}</div>` : ""}</div>`;
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
  const prob = i >= 0 ? Math.round(Math.min(0.95, L.P_GUAI[i] * (N2.protezione || 1) * (1 + L.N.pistaLuogoNotte * (N2.caloreQui || 0))) * 100) : null;
  const v = (me.valigetta || []).map((x) => x.id);
  const righe = (o.pericoli || []).map((k) => {
    const G = L.PERICOLI[k]; const salva = Object.entries({ ...L.OGGETTI, ...(L.STRUMENTI || {}) }).filter(([id, O]) => (O.salva || []).includes(k) && (L.OGGETTI[id] || v.includes(id)));
    const ho = salva.some(([id]) => v.includes(id));
    const danno = { perso: "perdi il carico e i soldi messi", riconosciuto: "ti riconoscono: più tracce, la polizia ti tiene d'occhio", allarme: "scappi a mani vuote e la polizia ha il tuo nome", foto: "un altro giocatore ottiene una Prova contro di te", retata: "sequestrano il carico e gli oggetti illegali", meta: "ti porti via solo metà" }[G.danno] || "";
    return `<div class="liv"><span class="liv-n" style="background:${ho ? "#2e7d4f" : "rgba(255,255,255,.1)"}">${ho ? "✓" : "!"}</span><div><b>Se ${esc(G.arriva)}</b><div class="sub" style="font-size:12px">${esc(danno)}.${salva.length ? " Ti salva quasi sempre: " + salva.map(([id, O]) => O.nome.toLowerCase() + (v.includes(id) ? " (ce l'hai)" : "")).join(" o ") + "." : " Niente ti salva."}</div></div></div>`;
  }).join("");
  return `<div class="rischio-box">
    ${S.poliziaSu ? `<div class="sub" style="font-size:12px;color:var(--pulito);margin-bottom:4px">La polizia è tutta su ${esc(S.poliziaSu)}: stanotte rischi un quarto in meno.</div>` : ""}
    ${N2.caloreQui ? `<div class="sub" style="font-size:12px;color:var(--sporco);margin-bottom:4px">Qui ti conoscono già (${N2.caloreQui === 1 ? "una notte" : N2.caloreQui + " notti"}): guai più probabili del ${Math.round(L.N.pistaLuogoNotte * N2.caloreQui * 100)}%. Un altro posto sarebbe più sicuro.</div>` : ""}
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
    <p>${o.costo ? "Ci metti <b>" + euro(o.costo) + "</b> (prima i soldi sporchi)." : "Non ci metti niente."} ${o.legale ? "" : o.guadagno ? "Se va bene, torni con <b>" + euro(o.guadagno[0] * L.N.bonusIllegale * L.moltIllegale(S, me)) + " – " + euro(o.guadagno[1] * L.N.bonusIllegale * L.moltIllegale(S, me)) + "</b> sporchi." + (L.bonusSetta && L.bonusSetta(S, me) > 0 ? " <span style=\"color:var(--oro)\">La tua setta lavora con te: +" + Math.round(L.bonusSetta(S, me) * 100) + "%.</span>" : "") : ""}</p>
    ${o.legale ? "" : boxRischio(me, o)}
    ${o.legale ? "" : v.length ? `<p class="kick" style="color:var(--muted);margin-top:12px">Cosa porti con te?</p><p class="sub">Scegli gli oggetti della valigetta. Se qualcosa va storto, quello giusto può salvarti. Quelli che si consumano li perdi.</p><div style="display:flex;flex-direction:column;gap:6px">${[...new Set(v.map((x) => x.id))].map((id) => { const quanti = v.filter((x) => x.id === id).length; return `<button class="ogg" data-id="${id}" style="text-align:left;color:#fff"><span class="ic">${ICO_OGG[id] || ""}</span><div><b>${esc(OGG(id).nome)}${quanti > 1 ? ` <span class="tag">ne hai ${quanti}: ne usi 1</span>` : ""}</b><div class="sub" style="font-size:12px">${esc(OGG(id).descr)}</div></div></button>`; }).join("")}</div>` : `<p class="sub">La valigetta è vuota: vai a mani nude.</p>`}
    <div class="pulsanti"><button id="no">Lascio stare</button><button class="${o.legale ? "oro" : "notte"}" id="si">${o.legale ? "Ci sto" : "Accetto"}</button></div>`, (d, c) => {
    d.querySelectorAll(".ogg[data-id]").forEach((b) => b.onclick = () => { const id = b.dataset.id; if (scelti.has(id)) scelti.delete(id); else scelti.add(id); d.querySelectorAll(`.ogg[data-id="${id}"]`).forEach((x) => x.classList.toggle("sel", scelti.has(id))); });
    d.querySelector("#no").onclick = c;
    d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "occasione", n, oggetti: [...scelti], scelte: true }); };
  });
}
function finestraNegozio(me) {
  const dove = S.notte.dove[mioId];
  const fissi = S.notte && S.notte.fissi, merce = Object.entries(L.OGGETTI).filter(([k, O]) => O.dove === dove && !(dove === "mercato" && Array.isArray(fissi) && !fissi.includes(k))).map(([k, O]) => [k, O, O.prezzo]);
  const banco = ((S.notte && S.notte.banco) || []).map((b) => [b.id, OGG(b.id), b.prezzo]);
  const v = me.valigetta || [], usati = S.postiUsati ?? v.length, liberi = S.postiValigetta - usati;
  const riga = ([k, O, prezzo]) => { const posti = O.subito ? 0 : O.posti || 1; return `<div class="ogg"><span class="ic">${ICO_OGG[k] || ""}</span><div style="flex:1"><b>${esc(O.nome)}</b>${posti > 1 ? ` <span class="tag">${posti} posti</span>` : ""}${O.raro ? `<span class="tag" style="color:var(--oro)">${RARO[O.raro].slice(3)}</span>` : ""}<div class="sub" style="font-size:12px">${esc(O.descr)}</div></div><button class="piccolo oro" data-ogg="${k}" ${posti > liberi || me.cash + me.sporchi < prezzo ? "disabled" : ""}>${euro(prezzo)}</button></div>`; };
  finestra(`<span class="kick" style="color:var(--cielo)">${ICO_LUOGO[dove]} ${esc(nomeLuogo(dove))}</span><h2>${L.BANCHI && L.BANCHI[dove] ? esc(L.BANCHI[dove].replace(/^il /, "Il ")) : "Si può comprare"}</h2>
    <p class="sub">Valigetta: ${usati} posti usati su ${S.postiValigetta}. Si paga prima con i soldi sporchi.</p>
    ${banco.length ? `<p class="kick" style="color:var(--oro);margin-top:10px">Solo stanotte</p><p class="sub" style="font-size:12px">Ogni pezzo è unico: se lo compri tu, gli altri non lo trovano più. Domani notte ci sarà altra roba.</p><div style="display:flex;flex-direction:column;gap:8px">${banco.map(riga).join("")}</div>` : ""}
    ${merce.length ? `<p class="kick" style="color:var(--muted);margin-top:10px">Sempre in vendita</p><div style="display:flex;flex-direction:column;gap:8px">${merce.map(riga).join("")}</div>` : ""}
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
    <div class="ric-rischio" id="ricR"></div>
    ${boxReato((me.riciclTot || 0) > 8_000_000 ? "grave" : "lieve", [
      `Lascia Tracce: circa ${paradiso ? "0,2" : "0,4 (copertura) o 0,6 (ShadowCoin)"} ogni 100.000 € ripuliti.`,
      "Le tue attività di copertura attirano controlli: all'Alba aggiungono Tracce se stanotte hai ripulito.",
      `Oltre 8 milioni ripuliti in tutto il reato diventa Grave. Finora: ${euro(me.riciclTot || 0)}.`])}
    <div class="pulsanti"><button id="x">Lascio stare</button><button class="notte" id="ok">Ripulisco</button></div>`, (d, c) => {
    const met = () => paradiso ? "paradiso" : d.querySelector("#met").value;
    const agg = () => { const box = d.querySelector("#ricR"); if (box) box.innerHTML = boxRischioRicicla(me, met(), Number(d.querySelector("#imp").value)); };
    d.querySelector("#imp").oninput = agg; if (!paradiso) d.querySelector("#met").onchange = agg; agg();
    d.querySelector("#x").onclick = c; d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "ricicla", metodo: met(), importo: Number(d.querySelector("#imp").value) }); }; });
}
// il rischio che la Finanza ti scopra mentre ripulisci, spiegato voce per voce (motore: rischioRicicla)
function boxRischioRicicla(me, metodo, importo) {
  if (!L.rischioRicicla) return "";
  const q = L.quotaRicicla(S, me, metodo, importo);
  if (q <= 0 && importo > 0 && metodo === "copertura") return `<div class="sent-box"><b>Le tue attività di copertura non possono ripulire altro stanotte.</b> <span class="sub">Scegli ShadowCoin, o apri locali di copertura (Lavanderia, Galleria, Magazzino, Casinò, Banca privata).</span></div>`;
  const r = L.rischioRicicla(S, me, metodo, q), pc = Math.round(r.p * 100);
  const col = pc >= 25 ? "var(--sporco)" : pc >= 12 ? "var(--oro)" : "var(--verde, #4a8)";
  const voci = r.voci.map((v) => `<li>${esc(v.testo)}: ${v.p >= 0 ? "+" : "−"}${Math.round(Math.abs(v.p) * 100)}%</li>`).join("");
  return `<div class="sent-box" style="border-color:${col}"><b style="color:${col}">Rischio che la Finanza ti scopra: ${pc}%</b>${q < importo ? ` <span class="sub">(stanotte ne passano ${euro(q)})</span>` : ""}
    <ul style="margin:6px 0 4px;padding-left:18px;text-align:left;font-size:13px">${voci}</ul>
    <div class="sub" style="font-size:12px">Se ti scoprono: ti sequestrano metà della somma (${euro(Math.round(q * L.N.ricSequestro))}), il resto resta sporco, +${L.N.ricScopertoTracce} Tracce e l'indagine sale di un gradino (a Processo arriva la condanna). Somme piccole e pause di qualche Ciclo tengono basso il rischio; massimo ${Math.round(L.N.ricRischioMax * 100)}%.</div></div>`;
}
function finestraCorrompi(me, chiGiro) {
  const club = chiGiro ? chiGiro !== "banchiere" : S.notte.dove[mioId] === "club" || S.notte.dove[mioId] === "palazzo";
  finestra(`<span class="kick" style="color:var(--cielo)">🤝 ${club ? "Club Neon, il tavolo in fondo" : "Casinò Reale, la sala privata"}</span><h2>${club ? "Un amico in divisa" : "Il banchiere Lenz"}</h2>
    <p>${club ? "Stasera al club c'è chi indossa una divisa di giorno. Un regalo ogni Ciclo, e chiuderà un occhio." : "Lenz sa far sparire i soldi dai registri. Non è gratis, e non è per sempre."} Può anche rifiutare e fare il tuo nome.</p>
    ${club ? `<div class="campo"><label for="chi">Chi</label><select id="chi">${chiGiro === "commissario" ? "" : `<option value="agente">L'agente di quartiere (${euro(L.N.corruz.agente[0])}, poi ${euro(L.N.corruz.agente[1])} a Ciclo)</option>`}<option value="commissario">Il Commissario Vargas (${euro(L.N.corruz.commissario[0])})</option></select></div><div class="campo"><label for="iso">L'agente di quale isola</label><select id="iso">${L.ISOLE.map((i) => `<option value="${i}">${L.NOMI_ISOLE[i]}</option>`).join("")}</select></div>` : `<p>Prezzo: ${euro(L.N.corruz.banchiere[0])}, poi ${euro(L.N.corruz.banchiere[1])} a Ciclo.</p>`}
    <label class="check"><input type="checkbox" id="sp"> Pago in contanti sporchi (costa il 20% in meno)</label>
    ${boxReato(club ? "media" : "grave", [
      `Rifiuta ${Math.round((0.05 + 0.03 * (me.stato || 0)) * 100)} volte su 100 (di più se la polizia ti guarda già): perdi i soldi e +20 Tracce.`,
      "Se accetta: +4 Tracce. L'agente è reato Medio, Vargas e Lenz sono reato Grave."])}
    <div class="pulsanti"><button id="x">Meglio di no</button><button class="notte" id="ok">Faccio l'offerta</button></div>`, (d, c) => { d.querySelector("#x").onclick = c; d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "corrompi", chi: club ? d.querySelector("#chi").value : "banchiere", isola: club ? d.querySelector("#iso").value : null, sporchi: d.querySelector("#sp").checked }); }; });
}
// il permesso: se hai il Timbro falso in valigetta il gioco ti chiede se usarlo (v76: non si consuma piu' da solo)
function chiediPermesso(me, idLotto) {
  if (!(me.valigetta || []).some((o) => o.id === "timbro")) return agisci({ tipo: "permesso", lotto: idLotto });
  const l = S.lotti.find((x) => x.id === idLotto);
  finestra(`<span class="kick" style="color:var(--sporco)">${ico("municipio")} Timbro del Municipio</span><h2>Usi il Timbro falso?</h2>
    <p>Il permesso per <b>${esc(l ? l.nome : "")}</b> passa subito${S.gen >= 2 ? " (e senza bollo)" : ""}, ma <b>+6 Tracce</b>.</p><p class="sub">Se non lo usi, il Timbro resta in valigetta.</p>
    <div class="pulsanti"><button id="x">Annulla</button><button id="no">Senza Timbro</button><button class="oro" id="si">Sì, uso il Timbro</button></div>`, (d, c) => {
    d.querySelector("#x").onclick = c;
    d.querySelector("#no").onclick = () => { c(); agisci({ tipo: "permesso", lotto: idLotto, timbro: false }); };
    d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "permesso", lotto: idLotto, timbro: true }); };
  });
}
function finestraProvaFedelta(idSetta, idMembro) {
  const st = (S.sette || []).find((x) => x.id === idSetta); if (!st) return;
  const costo = L.costoProvaFedelta(S, st), n = st.prove && st.prove.ciclo === S.ciclo ? st.prove.n || 0 : 0, nome = nomeDi(idMembro);
  finestra(`<span class="kick" style="color:var(--setta)">${ico("setta")} Prova di fedeltà</span><h2>Metti alla prova ${esc(nome)}?</h2>
    <p>Costa <b>${euro(costo)}</b> dal Tesoro (il 10% del Tesoro, almeno 2 milioni${n ? `; è la ${n + 1}ª di questo Ciclo, per questo costa ${n === 1 ? "il doppio" : "di più"}` : ""}).</p>
    <p class="sub">Se sta tradendo, lo scopri e lo cacci. Se è fedele, se ne accorge: la setta perde 3 Influenza (il livello però resta) e magari se ne va. La prossima Prova in questo Ciclo costa il doppio.</p>
    ${st.tesoro < costo ? `<p class="avviso-rischio">Nel Tesoro ci sono solo ${euro(st.tesoro)}.</p>` : ""}
    <div class="pulsanti"><button id="x">Annulla</button><button class="oro" id="si" ${st.tesoro < costo ? "disabled" : ""}>Sì, mettilo alla prova</button></div>`, (d, c) => {
    d.querySelector("#x").onclick = c;
    d.querySelector("#si").onclick = () => { c(); agisci({ tipo: "prova_fedelta", setta: idSetta, membro: idMembro }); };
  });
}
function finestraRapido(me) {
  const dest = L.destinazioniRapide(S, me);
  const MEZZO = { traghetto: ["marina", "Traghetto (dal molo)"], motoscafo: ["motoscafo", "Motoscafo · carburante"], elicottero: ["palazzo", "Elicottero · carburante"], jet: ["aereo", "Jet · carburante"] };
  const no = L.motivoNoRapido ? L.motivoNoRapido(S, me) : "", fra = L.cicliAlRapido ? L.cicliAlRapido(S, me) : 0;
  const quando = fra > 0 ? `<p class="avviso-rischio">Prossimo viaggio rapido fra <b>${fra} ${fra === 1 ? "Ciclo" : "Cicli"}</b>.</p>` : no ? `<p class="avviso-rischio">${esc(no)}</p>` : `<p class="sub">Dopo questo, il prossimo viaggio rapido sarà fra ${L.N.rapidoOgni || 2} Cicli.</p>`;
  finestra(`<span class="kick" style="color:var(--oro)">${ico("aereo")} Viaggio rapido</span><h2>Dove vuoi andare?</h2>
    <p>Una volta ogni ${L.N.rapidoOgni || 2} Cicli, al posto dei dadi. Paghi il carburante e <b>ti costa la mossa del giorno</b>: in questo turno niente permesso, cantiere, piano o altra mossa del giorno. Non passi dalla Partenza (niente stipendio) e se atterri sul terreno di un altro paghi l'affitto.</p>
    ${quando}
    <div class="lista-luoghi">${dest.map((d) => { const l = S.lotti.find((x) => x.idx === d.idx); const own = l.owner ? S.players.find((p) => p.id === l.owner) : null;
      return `<button class="luogo-riga" data-rap="${d.idx}" ${me.cash < d.costo || no ? "disabled" : ""}><span class="ic">${ico(MEZZO[d.mezzo][0])}</span><span style="flex:1;text-align:left"><b>${esc(l.nome)}</b><br><span class="sub">${MEZZO[d.mezzo][1]}${l.isola ? " · " + esc(L.NOMI_ISOLE[l.isola]) : ""}${own ? " · di " + esc(own.nome) : ""}</span></span><span class="ore">${d.costo ? euro(d.costo) : "gratis"}<br><span class="sub">+ mossa del giorno</span></span></button>`; }).join("")}</div>
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
const OPS_SETTA = [
  { k: "manipola", nome: "Muovere un titolo in Borsa", lv: 2, costo: 1_000_000, ob: "azienda", descr: "Un titolo sale o scende del 15% (del 40% dal livello 3). Compra prima, poi fallo salire." },
  { k: "blackout", nome: "Spegnere un'isola", lv: 3, costo: 3_000_000, ob: "isola", descr: "Stanotte su quell'isola la polizia è al buio: niente pericoli negli affari." },
  { k: "evasione", nome: "Far evadere qualcuno dal Faro", lv: 3, costo: 2_000_000, ob: "giocatore", descr: "Esce subito dalla prigione." },
  { k: "sabotaggio", nome: "Sabotare una setta rivale", lv: 2, costo: 1_500_000, ob: "setta", descr: "Un incendio nella notte: la setta rivale perde il 25% del suo Tesoro (fino a 5 M). Il Tesoro sepolto si salva." },
  { k: "inchiesta", nome: "Inchiesta pilotata", lv: 4, costo: 4_000_000, ob: "giocatore", descr: "Una soffiata alla Procura: il bersaglio prende +25 Tracce e la polizia lo tiene d'occhio." },
  { k: "fantoccio", nome: "Un Sindaco fantoccio", lv: 4, costo: 10_000_000, ob: null, descr: "Diventi Sindaco per 2 Cicli." },
];
const PNG_SETTA = [
  { k: "banchiere", nome: "Il Banchiere", costo: 2_500_000, descr: "A ogni Alba ripulisce il 10% dei soldi sporchi di ogni membro (fino a 500.000 €)." },
  { k: "commissario", nome: "Il Commissario", costo: 3_000_000, descr: "Di notte la polizia disturba meno i membri: pericoli -15% negli affari." },
  { k: "giudice", nome: "Il Giudice", costo: 3_500_000, descr: "Spesso alleggerisce le condanne dei membri." },
];
function requisitiSetta(st) {
  const lv = L.livelloSetta(S, st), inf = L.influenzaDi(S, st), soglie = L.N.settaInfluenza;
  if (lv >= 4) return `Livello massimo (${Math.floor(inf)} Influenza).`;
  return `Influenza ${Math.floor(inf)} su ${soglie[lv + 1]}: per il livello ${lv + 1} ti mancano ${Math.ceil(soglie[lv + 1] - inf)} punti.`;
}
const COME_INFLUENZA = [["Operazione riuscita", "+3 e +1 per ogni milione speso (fallita: +1)"], ["Rito", "+1 per ogni presente, fino a 7 (costa 250.000 € a persona dal Tesoro)"], ["Personaggio reclutato", "+6"], ["Lavanderia o Banchiere", "+1 per ogni milione ripulito"], ["Grande Opera", "+1 per ogni milione speso"]];
function schedaInfluenza(st) {
  const lv = L.livelloSetta(S, st), inf = L.influenzaDi(S, st), so = L.N.settaInfluenza;
  const da = so[lv] || 0, a = so[Math.min(4, lv + 1)], pct = lv >= 4 ? 100 : Math.max(0, Math.min(100, Math.round((inf - da) / (a - da) * 100)));
  const log = (st.infLog || []).slice(-4).reverse();
  return `<div class="scheda conv-setta"><h4>📈 Influenza · livello ${lv}</h4>
    <div class="barra-inf"><i style="width:${pct}%"></i></div><span class="sub">${requisitiSetta(st)}</span>
    <details><summary class="sub"><b>Come si guadagna</b></summary>${COME_INFLUENZA.map(([k, v]) => `<span class="sub" style="display:block">· <b>${k}</b>: ${v}</span>`).join("")}<span class="sub" style="display:block;margin-top:4px">Livello 2: Commissario e Giudice, operazioni, Amnistia e Porto. Livello 3: colpi più forti, Grande Colpo, Giudice supremo, Isola. Livello 4: Sindaco fantoccio e Inchiesta pilotata.</span></details>
    ${log.length ? `<span class="sub" style="display:block;margin-top:4px">Ultimi punti: ${log.map((x) => `${esc(x.motivo)} <b>+${x.punti}</b>`).join(" · ")}</span>` : ""}</div>`;
}
function statoOpera(st, k) {
  const a = (st.attive || {})[k];
  if (!a) return (st.opereFatte || []).includes(k) ? "fatta" : "";
  if (k === "porto") return a.chiuso ? "finita" : `attiva fino al Ciclo ${a.fino + 1}`;
  if (k === "amnistia") return a.fino >= S.ciclo ? `Procura vigile fino al Ciclo ${a.fino + 1}` : "fatta";
  if (k === "giudice") return a.caduto ? "il Giudice è caduto" : "attiva per tutta la partita";
  if (k === "isola") return a.sequestrata ? "sequestrata" : "attiva" + (a.blitz ? " · 1 blitz subito" : "");
  return "fatta";
}
function schedaOpere(st, me) {
  const O = L.OPERE, lv = L.livelloSetta(S, st), gm = st.gm === mioId, op = st.opera, solo = st.membri.length <= 1;
  let voto = "";
  if (op) {
    const altri = st.membri.filter((id) => id !== st.gm);
    let si = 0, no = 0; for (const id of altri) { if (op.voti[id] === true) si++; else if (op.voti[id] === false) no++; }
    voto = `<div class="scheda" style="border-color:var(--oro);margin-top:6px"><h4>🗳️ Si vota: ${esc(O[op.id].nome)}</h4>
      <span class="sub">Costo ${euro(op.costo)} dal Tesoro. ${op.solo ? "Sei solo: decidi tu, parte all'Alba." : `Si decide all'Alba. Ora: <b>${si} sì</b>, <b>${no} no</b>${si === no ? " (a parità decide il Gran Maestro: passa)" : si > no ? " (passa)" : " (bocciata)"}.`}</span>
      ${op.solo ? "" : `<span class="sub" style="display:block">${altri.map((id) => { const m = S.players.find((x) => x.id === id); const v = op.voti[id]; return `${esc(m.nome)}: ${v === true ? "✅ sì" : v === false ? "❌ no" : "⏳ non ha votato"}`; }).join(" · ")}</span>`}
      ${!gm && st.membri.includes(mioId) ? `<div class="riga" style="margin-top:6px"><button class="piccolo oro" data-vota="${st.id}|1">Voto sì</button><button class="piccolo" data-vota="${st.id}|0">Voto no</button></div>` : ""}
      ${gm ? `<button class="piccolo" data-ritira="${st.id}" style="margin-top:6px">Ritira la proposta</button>` : ""}</div>`;
  }
  const righe = Object.entries(O).map(([k, o]) => {
    const fatta = (st.opereFatte || []).includes(k), c = L.costoOpera(st, k), ok = !fatta && !op && lv >= o.lv && st.tesoro >= c;
    const perche = fatta ? "" : lv < o.lv ? `serve il livello ${o.lv}` : st.tesoro < c ? `mancano ${euro(c - st.tesoro)} nel Tesoro` : op ? "c'è già un voto in corso" : "";
    return `<details class="opera${fatta ? " fatta" : ""}"><summary><b>${esc(o.nome)}</b> · ${euro(c)} · liv. ${o.lv}${statoOpera(st, k) ? ` · <i>${statoOpera(st, k)}</i>` : ""}</summary>
      <span class="sub" style="display:block"><b>Cosa fa:</b> ${o.fa}</span><span class="sub" style="display:block;color:#ffb3b3"><b>Il rischio:</b> ${o.rischio}</span>
      ${gm && !fatta ? (ok ? `<button class="piccolo oro" data-opera="${st.id}|${k}" style="margin-top:6px">${solo ? "Decido io: si fa all'Alba" : "Proponi ai membri"}</button>` : `<span class="sub">Non ancora: ${perche}.</span>`) : ""}</details>`;
  }).join("");
  return `<div class="scheda conv-setta"><h4>🏛️ Grandi Opere</h4><span class="sub">${gm ? (solo ? "Sei l'unico membro: decidi da solo, ma ogni opera costa il 50% in più." : "Tu proponi, gli altri membri votano fino all'Alba. Passa se i sì sono almeno quanti i no.") : "Il Gran Maestro propone, tu voti sì o no fino all'Alba."} Ogni opera si fa una volta sola.</span>${voto}${righe}</div>`;
}
function schedaLavanderia(st, me) {
  if (!st.membri.includes(mioId)) return "";
  const lv = L.livelloSetta(S, st), max = 1_000_000 * lv, gia = me.lavatoCiclo === S.ciclo ? me.lavato || 0 : 0;
  return `<div class="scheda conv-setta"><h4>🧺 Lavanderia della setta</h4><span class="sub">Dai i tuoi sporchi alla setta: ti rende il <b>70% puliti</b> dal Tesoro, il 30% resta nel Tesoro. +2 Tracce per milione. Al massimo ${euro(max)} per Ciclo (1 milione per livello)${gia ? `, oggi già ${euro(gia)}` : ""}. Ogni milione dà +1 Influenza.</span>
    <div class="riga"><input type="number" id="lava_${st.id}" step="100000" min="100000" placeholder="quanto" style="width:110px"><button class="piccolo" data-lava="${st.id}">Ripulisci</button></div></div>`;
}
function finestraSetta(me) {
  const st = S.sette.find((x) => x.gm === mioId), lv = L.livelloSetta(S, st);
  const opz = (o) => `<option value="${o.k}" ${lv < o.lv || st.tesoro < o.costo ? "disabled" : ""}>${o.nome} · liv. ${o.lv} · ${euro(o.costo)}</option>`;
  finestra(`<span class="kick" style="color:var(--setta)">🗼 Il Faro, a mezzanotte</span><h2>${esc(st.nome)}</h2>
    <p>Livello <b>${lv}</b> · Tesoro <b>${euro(st.tesoro)}</b> · ${st.membri.length} membri</p><p class="sub">${requisitiSetta(st)}</p>
    <h4 style="margin:10px 0 4px">Operazioni</h4>
    <div class="campo"><select id="op">${OPS_SETTA.map(opz).join("")}</select></div>
    <p class="sub" id="opDescr"></p>
    <div class="riga" id="obRiga"><select id="ob"></select><select id="od"><option value="su">su</option><option value="giu">giù</option></select></div>
    <p class="sub">Riesce 3 volte su 4. Ogni membro prende +5 Tracce. Se riesce: +3 Influenza e +1 per ogni milione speso.</p>
    <h4 style="margin:12px 0 4px">⚰️ Il Tesoro sepolto</h4>
    <p class="sub">Sotto la scogliera: ${euro(st.sepolto || 0)}. Qui la Finanza e i traditori non arrivano, ma non conta per il livello. Se qualcuno ti sta seguendo stanotte, vede dove scavi.</p>
    <div class="riga"><input id="sepImp" type="number" step="500000" placeholder="quanto" style="width:110px"><button class="piccolo" id="sep">Seppellisci</button><button class="piccolo" id="dis">Dissotterra</button></div>
    <h4 style="margin:12px 0 4px">Personaggi</h4>
    ${PNG_SETTA.map((x) => `<div class="riga" style="justify-content:space-between;align-items:center;gap:8px"><span class="sub" style="flex:1"><b>${x.nome}</b> · ${euro(x.costo)}<br>${x.descr}</span>${st[x.k] ? `<span class="sub" style="color:var(--pulito)">✔ è vostro</span>` : `<button class="piccolo" data-rec="${x.k}" ${(lv < 2 && x.k !== "banchiere") || st.tesoro < x.costo ? "disabled" : ""}>Recluta</button>`}</div>`).join("")}
    <p class="sub">Ogni personaggio: +6 Influenza. ${lv < 2 ? "Il Banchiere si recluta subito; Commissario e Giudice dal livello 2." : ""}</p>
    <div class="pulsanti"><button id="x">Chiudi</button><button class="notte" id="ok">Si fa</button></div>`, (d, c) => {
    const sel = d.querySelector("#op"), ob = d.querySelector("#ob"), od = d.querySelector("#od");
    const primo = OPS_SETTA.find((o) => lv >= o.lv && st.tesoro >= o.costo); if (primo) sel.value = primo.k;
    const aggiorna = () => {
      const o = OPS_SETTA.find((x) => x.k === sel.value);
      d.querySelector("#opDescr").textContent = o.descr;
      ob.innerHTML = o.ob === "setta" ? (S.setteRivali || []).map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("") : o.ob === "azienda" ? L.AZIENDE.map((a) => `<option value="${a}">${a}</option>`).join("") : o.ob === "isola" ? L.ISOLE.map((i) => `<option value="${i}">${L.NOMI_ISOLE[i]}</option>`).join("") : o.ob === "giocatore" ? S.players.filter((x) => o.k === "evasione" ? x.faro > 0 : x.id !== mioId).map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("") : "";
      ob.style.display = o.ob ? "" : "none"; od.style.display = o.ob === "azienda" ? "" : "none";
      d.querySelector("#ok").disabled = lv < o.lv || st.tesoro < o.costo || (o.ob && !ob.value);
    };
    sel.onchange = aggiorna; aggiorna();
    d.querySelector("#x").onclick = c;
    d.querySelectorAll("[data-rec]").forEach((b) => b.onclick = () => { c(); agisci({ tipo: "recluta", setta: st.id, chi: b.dataset.rec }); });
    d.querySelector("#sep").onclick = () => { c(); agisci({ tipo: "seppellisci", setta: st.id, importo: +d.querySelector("#sepImp").value }); };
    d.querySelector("#dis").onclick = () => { c(); agisci({ tipo: "seppellisci", setta: st.id, importo: +d.querySelector("#sepImp").value, indietro: true }); };
    d.querySelector("#ok").onclick = () => { c(); agisci({ tipo: "operazione", setta: st.id, op: sel.value, bersaglio: ob.value, direzione: od.value }); };
  });
}
// IL PALAZZO: i piani (altezza, rendono) e le stanze speciali (si comprano a parte)
const COL_FASCE = ["#c9a25a", "#e0b23a", "#9a7bff"];
const ICO_QUANDO = { giorno: ["sole", "di giorno"], notte: ["luna", "di notte, a casa tua"], sempre: ["stella", "sempre"] };
function cicliRipaga(costo, rend) { if (!rend) return "—"; const c = costo / rend; return c < 1.5 ? "in poco più di un Ciclo" : "in circa " + Math.round(c) + " Cicli"; }
function finestraPalazzo() { apriApp("palazzo"); }
function appPalazzo(me, miTurno) {
  const F = L.FASCE_PALAZZO, n = me.piani, fi = n ? L.fasciaPalazzo(n) : -1;
  const cond = L.condizioniPalazzo(S, me), possono = miTurno && !me.azioneGiornoFatta;
  const rendNow = L.renditaPalazzo(me);
  // 1. in cima: quanto e' alto e quanto rende
  const testa = `<div class="scheda pal-testa"><div class="riga" style="align-items:flex-end"><span class="serif" style="font-size:34px;line-height:1">${n}</span><span style="flex:1">${n === 1 ? "piano" : "piani"}${n ? ` · <b style="color:${COL_FASCE[fi]}">${F[fi].nome}</b>` : ""}</span><span style="text-align:right"><b style="color:var(--pulito)">+ ${euro(rendNow)}</b><br><span class="sub">a ogni Alba</span></span></div>
    <div class="sub" style="margin-top:6px">${ico("palazzo")} <b>Piani</b> = l'altezza: ogni piano ti dà un affitto a ogni Alba. ${ico("chiave")} <b>Stanze</b> = poteri speciali, si comprano a parte quando il Palazzo è abbastanza alto.</div></div>`;
  // 2. per iniziare: cosa manca
  const inizia = n ? "" : `<div class="scheda" style="border-color:var(--oro)"><h4 style="color:var(--oro)">Per iniziare il Palazzo ti serve</h4>
    <div class="pal-cond ${cond.aperte >= 2 ? "si" : "no"}">${cond.aperte >= 2 ? "✔" : "✘"} 2 attività aperte sul tabellone <span class="sub">(ne hai ${cond.aperte})</span></div>
    <div class="pal-cond ${cond.permesso ? "si" : "attesa"}">${cond.permesso ? "✔ Permesso: ce l'hai" : "● Permesso del Comune: 300.000 € (lo paghi insieme al primo piano)"}</div>
    ${cond.aperte < 2 ? `<span class="sub">Un'attività si apre dall'app Imprese: permesso del Municipio, poi cantiere.</span>` : ""}</div>`;
  // 3. costruire: 1, 2 o 3 piani con il conto chiaro
  const prossima = F.find((f) => f.da > Math.max(n, 1));
  const opz = (() => {
    if (n >= 60) return `<span class="sub">Hai raggiunto i 60 piani.</span>`;
    const costo = L.costoPiano(me) + (n === 0 && !cond.permesso ? 300_000 : 0), piu = L.renditaPiani(n + 1) - L.renditaPiani(n);
    const no = !cond.ok ? "mancano le attività" : me.cash < costo ? "non hai abbastanza" : "";
    const uno = `<button class="pal-opz ${no ? "" : "oro"}" data-piani="1" ${possono && !no ? "" : "disabled"}><b>Piano ${n + 1}</b><span class="pal-conto"><span>Costa <b>${euro(costo)}</b>${n === 0 && !cond.permesso ? " (con il permesso)" : ""}</span><span>Rende <b>+ ${euro(piu)}</b> a ogni Alba</span><span class="sub">si ripaga ${cicliRipaga(costo, piu)}${no ? ` · <span class="pal-no">${no}</span>` : ""}</span></span></button>`;
    // Cantiere grande: dall'Attico in su, 2 o 3 piani in una mossa, pagando un sovrapprezzo
    const grande = [2, 3].filter((q) => n + q <= 60).map((q) => {
      const c = L.costoPiani(me, q), r = L.renditaPiani(n + q) - L.renditaPiani(n), extra = c - Array.from({ length: q }, (_, k) => L.costoPiani({ ...me, piani: n + k }, 1)).reduce((a, b) => a + b, 0);
      const nq = n < 6 ? "dall'Attico (6 piani)" : me.cash < c ? "non hai abbastanza" : "";
      return `<button class="pal-opz" data-piani="${q}" ${possono && !nq ? "" : "disabled"}><b>Cantiere grande: +${q} piani</b><span class="pal-conto"><span>Costa <b>${euro(c)}</b> <span class="sub">(${euro(extra)} di sovrapprezzo)</span></span><span>Rende <b>+ ${euro(r)}</b> a ogni Alba</span>${nq ? `<span class="sub"><span class="pal-no">${nq}</span></span>` : ""}</span></button>`;
    }).join("");
    return uno + grande;
  })();
  const costruisci = `<div class="scheda"><h4>Alza il Palazzo</h4><div class="pal-opzioni">${opz}</div>
    <span class="sub">${possono ? "Un piano per mossa del giorno. Ogni piano costa l'8% in più del precedente. Dall'Attico puoi fare il Cantiere grande: 2 o 3 piani insieme, pagando di più." : miTurno ? "Hai già fatto la mossa di oggi: riprova domani." : mioTurno() && !me.haTirato ? "Prima tira i dadi: poi puoi costruire, con la mossa del giorno." : "Si costruisce durante il tuo turno: un piano per mossa del giorno."}</span></div>`;
  // 4. traguardo: barra
  const meta = prossima ? (() => { const prima = F.filter((f) => f.da <= n).slice(-1)[0], da0 = prima ? prima.da : 0, perc = Math.round(((n - da0) / (prossima.da - da0)) * 100);
    return `<div class="scheda" style="border-color:${COL_FASCE[F.indexOf(prossima)]}"><h4 style="color:${COL_FASCE[F.indexOf(prossima)]}">Prossimo traguardo: ${prossima.nome} (${prossima.da} piani)</h4><div class="pal-barra"><i style="width:${Math.max(4, perc)}%;background:${COL_FASCE[F.indexOf(prossima)]}"></i></div><span class="sub">${prossima.da - n === 1 ? "Manca 1 piano" : "Mancano " + (prossima.da - n) + " piani"}. Premio: +${prossima.fama} fama, i piani nuovi rendono il ${Math.round((prossima.rend - 1) * 100)}% in più, e si aprono ${prossima.fun.length} stanze nuove. Di notte la vista da casa tua sale.</span></div>`; })()
    : `<div class="scheda"><h4 style="color:${COL_FASCE[2]}">Sei in cima: Grattacielo</h4><span class="sub">Il palazzo più alto della Laguna vale il titolo di Padrone dello Skyline.</span></div>`;
  // 5. la torre disegnata: blocchi di piani colorati per traguardo, con le stanze
  const st = me.stanze || [];
  const blocchi = F.map((f, i) => { const fine = F[i + 1] ? F[i + 1].da - 1 : Math.max(n, f.da + 4); const fatti = Math.max(0, Math.min(n, fine) - f.da + 1), tot = fine - f.da + 1;
    const mie = f.fun.filter((x) => st.includes(x));
    return `<div class="pal-blocco ${fatti ? "" : "vuoto"}" style="--c:${COL_FASCE[i]}"><div class="pal-bnome">${f.nome}<span class="sub"> · ${i < 2 ? "piani " + f.da + "–" + fine : "dal piano " + f.da}</span></div><div class="pal-piani">${Array.from({ length: Math.min(tot, 12) }, (_, k) => `<i class="${k < fatti ? "on" : ""}"></i>`).join("")}${tot > 12 ? `<span class="sub">+${fatti > 12 ? fatti - 12 : tot - 12}</span>` : ""}</div>${mie.length ? `<div class="pal-mie">${mie.map((x) => `<span class="tag">${ico("chiave")} ${esc(L.STANZE[x].nome)}</span>`).join("")}</div>` : ""}</div>`; }).reverse().join("");
  const torre = `<div class="pal-torre">${blocchi}</div>`;
  // 6. le stanze: schede chiare
  const poss = L.stanzePossibili(S, me);
  const stanze = F.map((f, i) => `<div class="pal-gruppo" style="--c:${COL_FASCE[i]}"><h4 style="color:${COL_FASCE[i]}">${f.nome} · da ${f.da} ${f.da === 1 ? "piano" : "piani"}</h4>${f.fun.map((id) => { const x = poss.find((y) => y.id === id), S2 = L.STANZE[id], q = ICO_QUANDO[S2.quando];
    return `<div class="pal-stanza ${x.ce ? "mia" : x.ok ? "" : "chiusa"}"><div class="riga"><b style="flex:1">${esc(S2.nome)}</b><span class="tag">${ico(q[0])} ${q[1]}</span></div><div>${esc(S2.descr)}</div><div class="sub">Esempio: ${esc(S2.esempio)}</div>
      <div class="riga" style="margin-top:6px">${x.ce ? `<span class="tag" style="color:var(--pulito)">✔ ce l'hai</span>` : x.ok ? `<button class="oro" data-stanza="${id}" ${possono && me.cash >= x.costo ? "" : "disabled"}>Compra · ${euro(x.costo)}</button>${!possono ? `<span class="sub">${mioTurno() && !me.haTirato ? "dopo i dadi" : "nel tuo turno"}</span>` : me.cash < x.costo ? `<span class="sub">non hai abbastanza</span>` : ""}` : `<span class="sub">${ico("chiave")} ${esc(x.perche)} · ${euro(x.costo)}</span>`}</div></div>`; }).join("")}</div>`).join("");
  const vera = S.consigli !== false && n < 2 ? `<div class="scheda" style="border:1px solid rgba(255,95,162,.4)"><b style="color:#ff5fa2">${ico("vera")} Vera</b><p style="margin:4px 0 0">Il Palazzo è il tuo salvadanaio: i piani rendono a ogni Alba e non te li tocca nessuno coi dadi. A 6 piani diventa un Attico e si aprono le stanze per la notte, come il Casinò privato.</p></div>` : "";
  return testa + vera + inizia + costruisci + meta + `<h4 style="margin:12px 0 4px">Com'è il tuo Palazzo</h4>` + torre + `<h4 style="margin:12px 0 4px">Le stanze speciali</h4>` + stanze;
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
    <div class="campo"><label for="fav">Favore</label><select id="fav"><option value="">nessuno</option>${Object.keys(L.FAVORI || {}).map((k) => `<option value="${k}">${esc(NOME_FAV(k))}</option>`).join("")}</select></div>
    <div class="campo"><label for="favDeve">Chi lo deve</label><select id="favDeve"><option value="a">${esc(altri[0] ? altri[0].nome : "lui/lei")}</option><option value="da">io</option></select></div>
    <p class="sub" id="favSpiega">Un Favore è una promessa che il gioco fa rispettare. Chi rompe la parola finisce sulla Gazzetta.</p>
    <div class="campo"><label for="lotto">Un lotto che passa di mano subito (facoltativo)</label><select id="lotto"><option value="">nessuno</option>${lotti.map((l) => `<option value="${l.id}">${esc(l.nome)} (${esc(S.players.find((x) => x.id === l.owner).nome)})</option>`).join("")}</select></div>
    <div class="campo"><label for="testo">Il resto, con parole tue</label><textarea id="testo" rows="3"></textarea></div>
    <div class="pulsanti"><button id="x">Annulla</button><button class="oro" id="ok">Proponi</button></div>`, (d, c) => {
    d.querySelector("#x").onclick = c;
    // la frase sotto il Favore usa i nomi e il verso giusto: si aggiorna quando cambi il Favore, chi lo deve o con chi
    const spiega = () => {
      const tipo = d.querySelector("#fav").value, deveIo = d.querySelector("#favDeve").value === "da", altro = nomeDi(d.querySelector("#a").value);
      d.querySelector('#favDeve option[value="a"]').textContent = altro;
      d.querySelector("#favSpiega").textContent = tipo ? L.testoFavorePatto(tipo, deveIo, altro) : "Un Favore è una promessa che il gioco fa rispettare. Chi rompe la parola finisce sulla Gazzetta.";
    };
    for (const q of ["#fav", "#favDeve", "#a"]) d.querySelector(q).onchange = spiega;
    d.querySelector("#ok").onclick = () => { const g = (q) => d.querySelector(q).value; c(); agisci({ tipo: "contratto", contratto: { a: g("#a"), tipo: g("#tipo"), favore: g("#fav") || null, favoreDeve: g("#favDeve"), pagoOra: Number(g("#ora")), chiPagaOra: g("#chiOra"), pagoDopo: Number(g("#dopo")), chiPagaDopo: g("#chiDopo"), cicli: Number(g("#cicli")), lottoCeduto: g("#lotto") || null, garanzia: null, testo: g("#testo") } }); };
  });
}
function fine() {
  if (document.querySelector(".velo")) return;
  finestra(`<span class="kick" style="color:var(--oro)">Fine della serata</span><h2>La Rivelazione</h2>${S.motivoFine ? `<p class="sub">${esc(S.motivoFine)}</p>` : ""}
    <table class="cl"><tr><th>#</th><th>Chi</th><th>Patrimonio</th><th>Fama</th></tr>${S.classifica.map((c, i) => `<tr><td>${i + 1}</td><td>${esc(c.nome)}</td><td>${euro(c.patrimonio)}</td><td>${c.fama}</td></tr>`).join("")}</table>
    <p class="kick" style="color:var(--muted);margin-top:14px">I titoli</p>${S.titoli.map((t) => `<p><b>${esc(t.titolo)}:</b> ${esc(t.a)}</p>`).join("")}
    ${S.resa && S.resa.length ? `<p class="kick" style="color:var(--sporco);margin-top:14px">La Resa dei conti</p>${S.resa.map((r) => `<p><b>${esc(r.nome)}</b>: reato ${esc(r.gravita)}, multa ${euro(r.multa)}${r.sporchi ? `, confiscati ${euro(r.sporchi)} sporchi` : ""}</p>`).join("")}` : S.resaAnnunciata ? `<p class="kick" style="color:var(--muted);margin-top:14px">La Resa dei conti</p><p>La Procura non ha condannato nessuno.</p>` : ""}
    <p class="kick" style="color:var(--muted);margin-top:14px">Le sette</p>${S.rivelazione.length ? S.rivelazione.map((r) => `<p><b style="color:var(--setta)">${esc(r.setta)}</b> — Gran Maestro ${esc(r.gm)}, membri: ${r.membri.map(esc).join(", ")}, tesoro ${euro(r.tesoro)}</p>`).join("") : "<p>Nessuna setta è nata in questa partita.</p>"}
    <div class="pulsanti"><button class="oro" id="nuova">Nuova partita</button></div>`, (d, c) => d.querySelector("#nuova").onclick = () => { c(); if (LOCALE) { try { localStorage.removeItem("laguna_locale"); } catch (e) { } location.href = location.pathname + "?locale&nuova"; return; } try { localStorage.removeItem("laguna_online"); } catch (e) { } S = null; partita = null; schermataCasa(); });
}

for (const f of ["laguna", "marina", "mappa", ...Object.values(SCENE).map((x) => x.slice(4, -4))]) { const i = new Image(); i.src = "img/" + f + ".jpg"; }
// il telefono si chiude anche con Esc o toccando fuori
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && telAperto && !document.querySelector(".velo")) { telAperto = false; if (S) disegnaTelefono(io()); } });
document.addEventListener("pointerdown", (e) => { if (telAperto && S && !document.querySelector(".velo") && !e.target.closest("#telefonoBox") && !e.target.closest("[data-a=\"imprese\"]")) { telAperto = false; disegnaTelefono(io()); } });
collegaEsplora();
avvio();

// ------------------------------------------------------------ COME SI GIOCA: 6 slide, prima di giocare e durante
function datiGuida() { return [
  { img: "img/laguna.jpg", kick: "1 di 6 · Lo scopo", tit: "Diventa il Re della Laguna", righe: [
    "Partite tutti uguali: <b>1.500.000 €</b> e <b>un terreno a sorte</b>. Scegli una <b>storia</b>: ognuna ha un vantaggio.",
    "Un <b>Ciclo</b> = 4 giorni coi dadi, poi <b>la notte</b>, poi <b>l'Alba</b>: all'Alba incassi tutte le rendite.",
    "Vince chi ha il <b>patrimonio</b> più alto: soldi, terreni, Palazzo, mezzi, azioni. I soldi sporchi valgono solo un quarto.",
    "Come finisce lo scegliete voi: dopo 6–20 Cicli, a un obiettivo (50, 100 o 200 milioni) o partita libera.",
    "Prima della fine c'è la <b>Resa dei conti</b>: chi ha lasciato piste paga.",
    "<b>Livelli</b>: più sei ricco, più cose si aprono (Livello 1 a 3,5 M, 2 a 7 M, 3 a 15 M; nelle partite lunghe Livello 4 a 40 M).",
    "Il <b>telefono</b> in basso a destra: le app arrivano piano piano. Il pallino rosso vuol dire che c'è qualcosa da fare.",
  ], tag: ["Storie", "Ciclo", "Alba", "Patrimonio", "Resa dei conti", "Livelli", "Telefono"] },
  { img: "img/vicolo.jpg", kick: "2 di 6 · Il giorno", tit: "Dadi, terreni, attività", righe: [
    "Tiri i dadi. Su un terreno <b>libero</b> puoi comprarlo; su quello di un altro <b>paghi l'affitto</b>.",
    "Ogni giorno hai <b>1 mossa</b>: permesso del Municipio → cantiere → all'Alba l'attività apre. Poi la alzi fino al livello 5.",
    "Sul tabellone: <b>bordo d'oro e stellina</b> = tuo. I <b>pallini</b> sotto la casella = livello. <b>vuoto</b> = non rende quasi niente.",
    "<b>Gruppi di vie</b> (stesso colore): se le hai tutte, affitti doppi e livelli 3–5.",
    "<b>Agenzia</b>: compri un terreno dell'isola dove sei (+20%). <b>Asta</b>: i terreni sequestrati vanno all'asta.",
    "<b>Moli</b>: chi ci passa ti paga. <b>Viaggio rapido</b>: una volta per Ciclo vai dove vuoi invece dei dadi.",
    "Tasto <b>Cosa ho</b>: vedi solo le tue cose. Tocca una casella per leggere la sua scheda.",
  ], tag: ["Comprare", "Affitti", "Permesso", "Cantiere", "Gruppi di vie", "Agenzia", "Asta", "Moli", "Viaggio rapido", "Cosa ho"] },
  { img: "img/penthouse.jpg", kick: "3 di 6 · Il Palazzo e il lusso", tit: "Il tuo grattacielo", righe: [
    "<b>Piani</b> = l'altezza: ogni piano ti dà un affitto a ogni Alba. Uno per mossa, e ogni piano costa l'8% in più del precedente.",
    "Per iniziare servono <b>2 attività aperte</b> e il permesso (300.000 €).",
    "Traguardi: <b>Attico</b> a 6 piani, <b>Grattacielo</b> a 15. Ti danno fama, piani che rendono di più e stanze nuove.",
    "<b>Stanze speciali</b>, si comprano a parte: Garage, Ristorante, Spa, Sala insonorizzata, Caveau, Casinò privato, Eliporto, Piani segreti, Suite.",
    "<b>Mezzi di lusso</b> (motoscafo, supercar, yacht, elicottero, megayacht, jet): si noleggiano e rendono, danno fama e fanno viaggiare veloce.",
    "La <b>fama</b> apre le sale più esclusive di notte e serve per diventare Sindaco.",
  ], tag: ["Piani", "Attico", "Grattacielo", "Stanze", "Mezzi", "Fama"] },
  { img: "img/notte-club.jpg", kick: "4 di 6 · La notte", tit: "Tutti in giro, insieme", righe: [
    "Di notte giocate <b>tutti insieme</b>, dalle 22 alle 4. Tocca un luogo per andarci: ogni viaggio costa 1 o 2 ore.",
    "Subito: il tuo Palazzo, Club Neon, Marina. Livello 1: Mercato Nero, Bisca, Porto, Casinò. Livello 2: Redazione, Aeroporto. Livello 3: Villa e Faro.",
    "In ogni luogo: <b>occasioni</b> legali e illegali, <b>personaggi</b> da conoscere, sale più lussuose se hai fama.",
    "Se incontri un altro giocatore: fate affari, lo sfidi a carte, oppure lo fotografi di nascosto.",
    "<b>Valigetta</b>: oggetti comprati di notte (maschera, documenti falsi, avvocato, macchina fotografica…). Ti salvano o ti aprono affari.",
    "<b>Serate</b>: col Casinò privato inviti gli altri a poker. Paga l'ingresso e il banco sei tu.",
  ], tag: ["Luoghi", "Occasioni", "Personaggi", "Incontri", "Poker", "Valigetta", "Serate"] },
  { img: "img/notte-porto.jpg", kick: "5 di 6 · Soldi sporchi", tit: "Rischio e polizia", righe: [
    "Gli affari illegali pagano di più, ma in <b>soldi sporchi</b>: di giorno non comprano quasi niente.",
    "<b>Ripulirli</b>: al Casinò Reale con le tue attività di copertura (perdi il 15%), con ShadowCoin (25%), o col jet nel paradiso fiscale (30%).",
    "<b>Le piste</b>: ti scoprono sempre per un motivo. Stesso posto troppe volte, soldi che non tornano, complici nei guai, prove dei rivali.",
    "Scala: Voci → Osservato → Indagato → Processo. Poi multe, sequestri o il <b>Faro</b> (la prigione).",
    "Poliziotti e banchieri <b>si comprano</b>. Se la polizia indaga su un altro, tu rischi meno.",
    "<b>Setta</b>: si apre con 8 M sporchi, fondarla costa 5 M. Inviti gli altri con un patto e puoi cacciarli.",
  ], tag: ["Soldi sporchi", "Ripulire", "Piste", "Indagine", "Faro", "Corruzione", "Setta"] },
  { img: "img/corona.jpg", kick: "6 di 6 · Potere e affari", tit: "Tutto il resto", righe: [
    "<b>Banca</b>: prestiti e ipoteche. <b>Borsa e cripto</b> (Livello 2): salgono e scendono a ogni Alba.",
    "<b>Contratti</b> con un rivale, sulla parola o dal notaio. Puoi <b>comprare terreni</b> da un altro giocatore.",
    "<b>Tasse</b>: puoi nasconderle, diventano contante in nero da spendere di notte. Ma lasciano piste.",
    "<b>Municipio</b>: candidati a <b>Sindaco</b> e fai le leggi. Lì chiedi anche la licenza del casinò.",
    "<b>Gazzetta</b>: le notizie di ogni Ciclo. Puoi comprare un articolo, o <b>denunciare</b> un rivale con le prove.",
    "<b>Da scoprire</b>: 22 cose da provare, la prima volta +1 fama. Nella partita guidata <b>Vera</b> ti consiglia.",
    "<b>Grandi Affari</b> (Livello 4, partite lunghe): vanno all'asta la <b>TV della Laguna</b> (sceglie il titolone) e poi la <b>Banca della Laguna</b> (decide il tasso dei prestiti degli altri). Si possono strappare comprando quote.",
    "Titoli finali: Re della Laguna, La Stella, Mani Pulite, Gran Burattinaio.",
  ], tag: ["Banca", "Borsa", "Cripto", "Contratti", "Tasse", "Sindaco", "Leggi", "Gazzetta", "Denunce", "TV", "Da scoprire", "Vera"] },
]; }
function apriGuida(da = 0) {
  const GUIDA = datiGuida();
  document.querySelector("#guida")?.remove();
  try { localStorage.setItem("laguna_guida_vista", "1"); } catch (e) { }
  let i = da;
  const g = document.createElement("div"); g.id = "guida"; document.body.appendChild(g);
  const chiudi = () => { g.remove(); removeEventListener("keydown", tasti); };
  const tasti = (e) => { if (e.key === "ArrowRight") vai(i + 1); else if (e.key === "ArrowLeft") vai(i - 1); else if (e.key === "Escape") chiudi(); };
  addEventListener("keydown", tasti);
  const vai = (n) => { i = Math.max(0, Math.min(GUIDA.length - 1, n)); mostra(); };
  const mostra = () => {
    const s = GUIDA[i];
    g.innerHTML = `<div class="guida-carta vetro">
      <div class="guida-foto" style="background-image:linear-gradient(180deg,rgba(6,10,24,0) 35%,rgba(6,10,24,.95)),url('${s.img}')"><span class="kick" style="color:var(--oro)">${s.kick}</span><h2>${s.tit}</h2><button class="piccolo guida-x" id="gX">✕ Chiudi</button></div>
      <ul class="guida-righe">${s.righe.map((r) => `<li>${r}</li>`).join("")}</ul>
      <div class="guida-tag">${s.tag.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      <div class="guida-nav"><button id="gIndietro" ${i ? "" : "disabled"}>‹ Indietro</button><div class="guida-punti">${GUIDA.map((_, k) => `<button class="${k === i ? "on" : ""}" data-g="${k}" aria-label="Slide ${k + 1}"></button>`).join("")}</div>${i < GUIDA.length - 1 ? `<button class="oro" id="gAvanti">Avanti ›</button>` : `<button class="oro" id="gFine">Giochiamo!</button>`}</div></div>`;
    g.querySelector("#gX").onclick = chiudi;
    g.querySelector("#gIndietro").onclick = () => vai(i - 1);
    (g.querySelector("#gAvanti") || g.querySelector("#gFine")).onclick = () => (i < GUIDA.length - 1 ? vai(i + 1) : chiudi());
    g.querySelectorAll("[data-g]").forEach((b) => b.onclick = () => vai(+b.dataset.g));
  };
  // scorrere col dito
  let x0 = null;
  g.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
  g.addEventListener("pointerup", (e) => { if (x0 != null && Math.abs(e.clientX - x0) > 60) vai(i + (e.clientX < x0 ? 1 : -1)); x0 = null; });
  g.addEventListener("click", (e) => { if (e.target === g) chiudi(); });
  mostra();
}
function guidaMaiVista() { try { return !localStorage.getItem("laguna_guida_vista"); } catch (e) { return false; } }
function tastoGuida() { return `<button class="bianco" id="apriGuida" style="align-self:stretch">📖 Come si gioca · 6 slide</button>`; }
function collegaTastoGuida() { const b = $("#apriGuida"); if (b) b.onclick = () => apriGuida(0); }

// ------------------------------------------------------------ APP TV: il primo Grande Affare (Livello 4)
function appGrandi(me) {
  const gg = S.grandi || {};
  const intro = `<div class="scheda tv-testa"><span class="kick" style="color:#ff6b8a">${ico("stella")} Livello 4 · I Grandi Affari</span><span class="sub">Di ognuno ce n'è uno solo in tutta la Laguna. Si prende all'asta, poi si può strappare comprando quote: comanda chi ne ha di più. Vanno all'asta uno alla volta: prima la TV, poi la Banca.</span></div>`;
  return intro + L.ORDINE_GRANDI.map((k) => appAffare(me, k, gg[k] || { stato: "chiusa" })).join("");
}
const DESCR_GRANDI = { tv: "Chi la comanda sceglie a ogni Ciclo il titolone della Gazzetta.", banca: "Chi la comanda decide il tasso dei prestiti degli altri e incassa gli interessi. Può bloccare un conto e ripulire soldi sporchi (ma la Finanza guarda)." };
function appAffare(me, k, t) {
  const G = L.GRANDI[k], lv4 = (S.sblocco || 0) >= 4;
  const testa = `<div class="scheda tv-testa"><h3 style="margin:0">${k === "tv" ? ico("tv") : ico("banca")} ${G.nome}</h3><span class="sub">${DESCR_GRANDI[k]}</span></div>`;
  if (t.stato === "chiusa") return testa + `<div class="scheda"><span class="sub">${k === "tv" ? "Va all'asta quando il primo giocatore arriva al Livello 4 (40 milioni di patrimonio). Solo nelle partite lunghe." : "Va all'asta dopo la TV."}</span></div>`;
  if (t.stato === "asta") {
    const mia = (t.offerte || {})[mioId];
    const prop = [G.base, Math.round(G.base * 1.25), Math.round(G.base * 1.5), Math.round(G.base * 2)].filter((x) => x <= me.cash);
    return testa + `<div class="scheda" style="border-color:var(--oro)"><h4 style="color:var(--oro)">All'asta: si chiude all'Alba</h4>
      <span class="sub">L'offerta è <b>segreta</b>: la vedi solo tu. All'Alba vince la più alta e paga quello che ha offerto (i soldi vanno alla banca). Chi vince prende 4 quote su 10 e comanda. Base: ${euro(G.base)}.</span>
      ${!lv4 ? `<p class="sub">All'asta possono offrire solo i giocatori al Livello 4.</p>` : `
      <p>${mia ? `La tua offerta: <b style="color:var(--oro)">${euro(mia)}</b>` : "Non hai ancora offerto."}</p>
      ${prop.length ? `<div class="riga" style="flex-wrap:wrap">${prop.map((x) => `<button class="piccolo oro" data-g-off="${k}|${x}">${euro(x)}</button>`).join("")}</div>` : `<p class="sub">Ti servono almeno ${euro(G.base)} puliti.</p>`}
      <div class="riga"><input id="gOff_${k}" type="number" placeholder="altra cifra" style="flex:1"><button class="piccolo" data-g-off="${k}|campo">Offri</button>${mia ? `<button class="piccolo" data-g-off="${k}|0">Ritira</button>` : ""}</div>`}</div>`;
  }
  const capo = S.players.find((p) => p.id === t.capo), mie = (t.quote || {})[mioId] || 0, sonoCapo = t.capo === mioId;
  const celle = [];
  for (const [id, q] of Object.entries(t.quote || {}).sort((a, b) => (b[0] === t.capo) - (a[0] === t.capo) || b[1] - a[1])) { const p = S.players.find((x) => x.id === id); for (let i = 0; i < q; i++) celle.push(`<i title="${esc(p.nome)}" style="background:${p.colore}">${esc(p.nome[0])}</i>`); }
  for (let i = 0; i < t.mercato; i++) celle.push(`<i class="mercato" title="In vendita"></i>`);
  const gia = (t.quoteCiclo || {})[mioId] || 0, resta = G.maxQuoteCiclo - gia;
  const costo = (n) => { let c = 0; for (let x = 0; x < n; x++) c += Math.round(t.prezzoQuota * Math.pow(1.1, x)); return c; };
  const resaQuota = Math.round(G.pubblicita / G.quote);
  const quote = `<div class="scheda"><h4>Chi comanda: <span style="color:${capo ? capo.colore : "inherit"}">${capo ? esc(capo.nome) + (sonoCapo ? " (tu)" : "") : "nessuno"}</span></h4>
    <div class="tv-quote">${celle.join("")}</div>
    <span class="sub">Colori = quote dei giocatori · grigie = in vendita. Hai <b>${mie}</b> ${mie === 1 ? "quota" : "quote"}. Ogni quota rende almeno ${euro(resaQuota)} a ogni Alba (${k === "tv" ? "più una parte del lusso che comprano gli altri" : "più gli interessi dei prestiti degli altri"}).</span>
    ${lv4 ? (t.mercato > 0 ? `<div class="riga" style="flex-wrap:wrap;margin-top:6px">${[1, 2].filter((n) => n <= resta && n <= t.mercato).map((n) => `<button class="piccolo oro" data-g-quote="${k}|${n}" ${me.cash >= costo(n) ? "" : "disabled"}>Compra ${n} ${n === 1 ? "quota" : "quote"} · ${euro(costo(n))}</button>`).join("") || `<span class="sub">Questo Ciclo hai già comprato ${G.maxQuoteCiclo} quote.</span>`}</div>
      <span class="sub">Al massimo ${G.maxQuoteCiclo} quote per Ciclo. Ogni quota venduta fa salire il prezzo del 10%.</span>` : `<p class="sub">Tutte le quote sono in mano ai giocatori.</p>`) : `<p class="sub">Le quote le comprano solo i giocatori al Livello 4.</p>`}
    ${sonoCapo ? `<p class="sub" style="color:#ffb3b3">Chi comanda paga ${euro(G.spesa)} a ogni Alba. Se non li hai, perdi il comando.${k === "banca" ? " Se la polizia ti mette sotto indagine, la Finanza commissaria la banca: niente utili e niente poteri." : ""}</p>` : capo && lv4 ? `<p class="sub">Per strappargliela ti servono più quote di ${esc(capo.nome)} (${(t.quote || {})[t.capo] || 0}).</p>` : ""}</div>`;
  let poteri = "";
  const altri = S.players.filter((p) => p.id !== mioId);
  if (sonoCapo && k === "tv") {
    if (t.titoloneCiclo === S.ciclo) poteri = `<div class="scheda"><h4>Il titolone</h4><span class="sub">Hai già scelto il titolone di questo Ciclo. Torna al prossimo.</span></div>`;
    else poteri = `<h4 style="margin:12px 0 4px">Il titolone di questo Ciclo</h4>
      <div class="tv-scelta"><b>${ico("stella")} La tua faccia in prima serata</b><span class="sub">+8 fama. Sicuro, senza rischi.</span><button class="oro" data-tv-tit="fama">Scegli</button></div>
      <div class="tv-scelta"><b>${ico("siren")} Uno scandalo su un rivale</b><span class="sub">Se ha davvero qualcosa da nascondere: −15 fama e la polizia lo guarda di più. Se è pulito, metà delle volte la figuraccia è tua (−10 fama).</span><div class="riga"><select id="tvBers" style="flex:1">${altri.map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("")}</select><button class="oro" data-tv-tit="scandalo">Scegli</button></div></div>
      <div class="tv-scelta"><b>${ico("borsa")} Una notizia di Borsa</b><span class="sub">All'Alba l'azienda sale o scende del 12%. Comprale o vendile prima! Ma manipolare la Borsa lascia tracce.</span><div class="riga"><select id="tvAz" style="flex:1">${L.AZIENDE.map((a) => `<option>${a}</option>`).join("")}</select><select id="tvVerso"><option value="1">sale</option><option value="0">scende</option></select><button class="oro" data-tv-tit="borsa">Scegli</button></div></div>`;
  }
  if (sonoCapo && k === "banca") {
    const comm = (me.stato || 0) >= 3, tasso = t.tasso || 10, giaRic = t.riciclatoCiclo === S.ciclo ? t.riciclato || 0 : 0, restaRic = G.riciclaMax - giaRic;
    poteri = comm ? `<div class="scheda"><span class="sub" style="color:#ff9a9a">Sei indagato: la Finanza ha commissariato la tua banca. Niente poteri finché l'indagine non si calma.</span></div>` : `<h4 style="margin:12px 0 4px">I poteri della Banca</h4>
      <div class="tv-scelta"><b>${ico("soldi")} Il tasso dei prestiti degli altri: ${tasso}%</b><span class="sub">Più alto = più interessi per te e per chi ha quote; chi ha debiti paga di più (e magari restituisce prima). Si cambia una volta per Ciclo.</span><div class="riga">${[5, 10, 20].map((x) => `<button class="piccolo ${x === tasso ? "oro" : ""}" data-b-tasso="${x}" ${t.tassoCiclo === S.ciclo || x === tasso ? "disabled" : ""}>${x}%</button>`).join("")}</div></div>
      <div class="tv-scelta"><b>${ico("chiave")} Blocca un conto</b><span class="sub">Un rivale non può chiedere prestiti fino all'Alba. Una volta per Ciclo.</span><div class="riga"><select id="bBers" style="flex:1">${altri.map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("")}</select><button class="oro" data-b-blocca="1" ${t.bloccoCiclo === S.ciclo ? "disabled" : ""}>Blocca</button></div></div>
      ${(me.sporchi || 0) > 0 || S.sblocco >= 1 ? `<div class="tv-scelta"><b>${ico("ricicla")} Ripulisci nella tua banca</b><span class="sub">Perdi solo il 10%, fino a ${euro(G.riciclaMax)} per Ciclo (ti restano ${euro(restaRic)}). Ma la Finanza guarda i conti delle banche: lascia una pista sui soldi e tracce.${L.rischioRicicla ? ` Rischio che ti scopra: ${Math.round(L.rischioRicicla(S, me, "banca", 1e6).p * 100)}% con 1 M, ${Math.round(L.rischioRicicla(S, me, "banca", 3e6).p * 100)}% con 3 M (metà sequestrata, +12 Tracce, un gradino d'indagine).` : ""}</span><div class="riga"><input id="bRic" type="number" placeholder="quanto" style="flex:1"><button class="oro" data-b-ricicla="1" ${restaRic > 0 && me.sporchi > 0 ? "" : "disabled"}>Ripulisci</button></div></div>` : ""}`;
  }
  const breve = k === "tv" ? `<div class="scheda in-breve"><h4>📺 In breve, cosa fa la TV</h4>
    <div class="ib"><b>1</b><span><b>Ti paga.</b> A ogni Alba la TV incassa ${euro(G.pubblicita)} di pubblicità più il 10% di tutto il lusso che comprano gli altri. Si divide per quote: con ${mie} ${mie === 1 ? "quota" : "quote"} su 10 ti arriva circa <b>${euro(Math.round(G.pubblicita * mie / 10))}</b> a ogni Alba, più la parte del lusso.</span></div>
    <div class="ib"><b>2</b><span><b>Chi comanda sceglie il titolone</b>, una volta per Ciclo: un'intervista a te (+8 fama), uno scandalo su un rivale (se è sporco: −15 fama e +12 Tracce; se è pulito rischi la figuraccia tu), o una notizia che fa salire o scendere un'azione in Borsa.</span></div>
    <div class="ib"><b>3</b><span><b>Ti possono rubare il comando:</b> chi ha più quote comanda. Se un rivale compra quote più di te, la TV passa a lui. Chi comanda paga ${euro(G.spesa)} a ogni Alba.</span></div>
    <span class="sub">Esempio: comandi tu, Rocco è pieno di soldi sporchi → scegli "scandalo su Rocco": domani la Gazzetta lo distrugge e la polizia lo guarda di più.</span></div>`
    : `<div class="scheda in-breve"><h4>🏦 In breve, cosa fa la Banca</h4>
    <div class="ib"><b>1</b><span><b>Ti paga.</b> A ogni Alba la Banca incassa ${euro(G.pubblicita)} più tutti gli interessi dei prestiti degli altri. Si divide per quote: con ${mie} ${mie === 1 ? "quota" : "quote"} su 10 ti arriva circa <b>${euro(Math.round(G.pubblicita * mie / 10))}</b> più la parte degli interessi.</span></div>
    <div class="ib"><b>2</b><span><b>Chi comanda decide:</b> il tasso dei prestiti degli altri (5%, 10% o 20%), può bloccare il conto di un rivale per un Ciclo e può ripulire soldi sporchi nella sua banca.</span></div>
    <div class="ib"><b>3</b><span><b>Il rischio:</b> se chi comanda finisce Indagato, la Finanza commissaria la banca: niente utili e niente poteri. E chi ha più quote ti ruba il comando.</span></div>
    <span class="sub">Esempio: Rocco ha un grosso debito → alzi il tasso al 20%: ogni Alba lui paga di più e quei soldi arrivano a chi ha le quote.</span></div>`;
  return testa + breve + quote + poteri;
}
function collegaTV(box, me) {
  box.querySelectorAll("[data-g-off]").forEach((b) => b.onclick = () => { const [k, x] = b.dataset.gOff.split("|"); const v = x === "campo" ? Number(box.querySelector("#gOff_" + k).value) : Number(x); agisci({ tipo: "offerta_grande", affare: k, importo: v }); });
  box.querySelectorAll("[data-g-quote]").forEach((b) => b.onclick = () => { const [k, n] = b.dataset.gQuote.split("|"); agisci({ tipo: "quote_grande", affare: k, n: +n }); });
  box.querySelectorAll("[data-tv-tit]").forEach((b) => b.onclick = () => { const sc = b.dataset.tvTit; agisci(sc === "scandalo" ? { tipo: "titolone", scelta: sc, bersaglio: box.querySelector("#tvBers").value } : sc === "borsa" ? { tipo: "titolone", scelta: sc, azienda: box.querySelector("#tvAz").value, su: box.querySelector("#tvVerso").value === "1" } : { tipo: "titolone", scelta: sc }); });
  box.querySelectorAll("[data-b-tasso]").forEach((b) => b.onclick = () => agisci({ tipo: "tasso_banca", tasso: +b.dataset.bTasso }));
  box.querySelectorAll("[data-b-blocca]").forEach((b) => b.onclick = () => agisci({ tipo: "blocca_conto", bersaglio: box.querySelector("#bBers").value }));
  box.querySelectorAll("[data-b-ricicla]").forEach((b) => b.onclick = () => agisci({ tipo: "ricicla_banca", importo: Number(box.querySelector("#bRic").value) }));
}

// ------------------------------------------------------------ scegliere un'attivita': schede chiare (rende, affitto, vantaggio, rischio)
const ICO_ATT = { residenze: "🏠", ristorante: "🍽️", hotel: "🏨", boutique: "👜", uffici: "💼", yachtclub: "⛵", agenzia: "🔑", legale: "⚖️", lavanderia: "🧺", galleria: "🖼️", magazzino: "📦", discoteca: "🪩", beachclub: "🏖️", casino: "🎰", bancaprivata: "🏦" };
function sceltaAttivita(l, me, costo) {
  const tipi = Object.entries(L.ATTIVITA).filter(([k, t]) => (!t.isole || t.isole.includes(l.isola)) && !t.serie);
  const pallini = (n) => "●".repeat(n) + "○".repeat(5 - n);
  return `<div class="att-scelte"><span class="sub">Scegli cosa aprire. <b>Ogni attività costa ${euro(costo)}</b> (il cantiere) e apre all'Alba.</span>${tipi.map(([k, t]) => {
    const prova = { ...l, tipo: k, lvl: 1, cantiere: null, chiuso: 0, owner: mioId };
    const rend = L.rendita(S, prova), aff = L.affitto(S, prova), polizia = Math.min(5, t.att || 0);
    const serveLic = t.licenza && !(S.licenze || []).includes(mioId);
    return `<div class="att-carta ${serveLic ? "chiusa" : ""}"><div class="riga"><b style="flex:1">${ICO_ATT[k] || ""} ${esc(t.nome)}</b>${t.lusso ? `<span class="tag">lusso</span>` : ""}</div>
      <div class="att-num"><span>Rende <b style="color:var(--pulito)">${euro(rend)}</b><br><span class="sub">a ogni Alba</span></span><span>Affitto <b>${euro(aff)}</b><br><span class="sub">chi ci finisce</span></span><span>Polizia <b style="color:${polizia >= 2 ? "#ff7a7a" : polizia ? "#f3c56b" : "var(--pulito)"}">${polizia ? pallini(polizia) : "nessuna"}</b></span></div>
      <span class="sub">⭐ ${esc(t.perk || "")}</span>${t.rischio && t.rischio !== "Nessuno." ? `<span class="sub" style="color:#ff9a9a">⚠ ${esc(t.rischio)}</span>` : ""}
      ${serveLic ? `<span class="sub">🔒 Serve la licenza del casinò (Municipio).</span>` : `<button class="piccolo oro" data-cantiere="${l.id}" data-tipo="${k}" ${me.cash < costo ? "disabled" : ""}>Apri ${esc(t.nome)} · ${euro(costo)}</button>${me.cash < costo ? `<span class="sub" style="color:#ff9a9a">Non hai abbastanza soldi puliti.</span>` : ""}`}</div>`;
  }).join("")}</div>`;
}
