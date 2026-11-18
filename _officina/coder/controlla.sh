#!/usr/bin/env bash
# =====================================================================
# RE DELLA LAGUNA — un solo comando: via libera o no
#   ./controlla.sh                         controlla /home/claude/re-della-laguna
#   REPO=/percorso/copia ./controlla.sh    controlla una copia di lavoro
#   ./controlla.sh veloce                  senza il browser (circa 2 minuti)
#   ./controlla.sh completo                piu' partite (prima di pubblicare)
# Non modifica MAI il repo. Esce con 0 = VIA LIBERA, 1 = NON PUBBLICARE.
#   SEVERO=0 ./controlla.sh                i buchi trovati dal "giocatore matto" diventano solo avvisi
# Passi:
#   1. sintassi di tutti i file (node --check; i moduli copiati in .mjs)
#   2. "//" dentro un ${...} su una riga (regola di STATO.md)
#   3. coerenza della versione (?v=, VERSIONE del motore), del server/ e del commit scritto in server/index.ts (avvisi)
#   4. sim.js          partite di soli bot: 0 eccezioni, patrimonio del vincitore nel riferimento
#   5. casi.js         prove mirate: un caso preciso per ogni difetto gia' corretto
#   6. invarianti.js   soldi, proprieta', vista, segreti, JSON, fine partita, salva-e-ricarica, giocatore matto
#   7. server-finto.js server/index.ts con un database finto: una partita online intera
#   8. vecchia.js      partite iniziate con il motore vecchio continuano con quello nuovo (regola G1)
#   9. fumo.js         il gioco vero nel browser, PC e telefono
#  10. app.js          tutte le app del telefono, di giorno e di notte, con una partita avanzata
# =====================================================================
set -u
QUI="$(cd "$(dirname "$0")" && pwd)"
export REPO="${REPO:-/home/claude/re-della-laguna}"
MODO="${1:-normale}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
ROSSI=0; AVVISI=0
ok()     { echo "  ok   $*"; }
no()     { echo "  NO   $*"; ROSSI=$((ROSSI+1)); }
avviso() { echo "  !!   $*"; AVVISI=$((AVVISI+1)); }
titolo() { echo; echo "== $* =="; }

echo "CONTROLLA  repo=$REPO  modo=$MODO  $(date '+%d/%m/%Y %H:%M')"
[ -f "$REPO/motore.js" ] || { echo "Non trovo $REPO/motore.js"; exit 2; }

# ---------------------------------------------------------------- 1. sintassi
titolo "1. Sintassi"
# file "normali" (caricati con <script>): si controllano cosi' come sono
for f in motore.js bot.js server/motore.js server/bot.js; do
  if [ -f "$REPO/$f" ]; then
    if node --check "$REPO/$f" 2>"$TMP/err"; then ok "$f"; else no "$f"; sed 's/^/         /' "$TMP/err" | head -8; fi
  else avviso "$f non c'e'"; fi
done
# moduli (import/export): node li vuole con il nome .mjs, quindi li copio fuori dal repo
for f in gioco.js locale.js tre.js mondo3d.js panorama.js icone.js; do
  if [ -f "$REPO/$f" ]; then
    cp "$REPO/$f" "$TMP/${f%.js}.mjs"
    if node --check "$TMP/${f%.js}.mjs" 2>"$TMP/err"; then ok "$f (modulo)"; else no "$f (modulo)"; sed "s#$TMP/##; s/^/         /" "$TMP/err" | head -8; fi
  else avviso "$f non c'e'"; fi
done
# il server e' TypeScript per Deno: si controlla davvero solo se deno e' installato
if command -v deno >/dev/null 2>&1; then
  if deno check "$REPO/server/index.ts" >"$TMP/err" 2>&1; then ok "server/index.ts (deno check)"; else avviso "server/index.ts: deno check non passa (puo' dipendere dalla rete)"; head -5 "$TMP/err" | sed 's/^/         /'; fi
else
  # controllo minimo: parentesi in pari
  if node -e 'const t=require("fs").readFileSync(process.argv[1],"utf8").replace(/\/\/.*$/gm,"").replace(/"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g,"");const n=(c)=>t.split(c).length-1;process.exit(n("{")===n("}")&&n("(")===n(")")&&n("[")===n("]")?0:1)' "$REPO/server/index.ts"; then ok "server/index.ts (solo parentesi in pari: deno non e' installato)"; else no "server/index.ts: parentesi non in pari"; fi
fi

# ---------------------------------------------------------------- 2. // nei template
titolo "2. \"//\" dentro \${...} su una riga"
if (cd "$REPO" && node "$QUI/commenti.js" gioco.js motore.js bot.js locale.js tre.js mondo3d.js panorama.js icone.js) >"$TMP/comm" 2>&1; then
  ok "nessuno"; grep -h "avviso" "$TMP/comm" | sed 's/^/  !!   /'
else no "trovati:"; sed 's/^/         /' "$TMP/comm" | head -20; fi

# ---------------------------------------------------------------- 3. coerenza di versione e server (avvisi)
titolo "3. Versione, cartella server/, commit del server"
V="$(grep -o 'gioco\.js?v=[0-9]*' "$REPO/index.html" | grep -o '[0-9]*$')"
VERS="$(grep -o '\(stile\.css\|motore\.js\|bot\.js\|gioco\.js\)?v=[0-9]*' "$REPO/index.html" | grep -o '[0-9]*$' | sort -u | tr '\n' ' ')"
if [ "$(echo $VERS | wc -w)" = "1" ]; then ok "index.html: tutto a ?v=$V"; else avviso "index.html ha versioni diverse: $VERS"; fi
for coppia in "gioco.js:tre.js" "gioco.js:locale.js" "tre.js:mondo3d.js"; do
  dentro="${coppia%%:*}"; cosa="${coppia##*:}"
  vi="$(grep -o "\./$cosa?v=[0-9]*" "$REPO/$dentro" | grep -o '[0-9]*$' | head -1)"
  if [ "$vi" = "$V" ]; then ok "$dentro importa $cosa?v=$vi"; else avviso "$dentro importa $cosa?v=${vi:-?} ma index.html e' a v=$V (il browser puo' tenere il file vecchio)"; fi
done
VM="$(grep -o '^  const VERSIONE = [0-9]*' "$REPO/motore.js" | grep -o '[0-9]*$')"
if [ -z "$VM" ]; then avviso "motore.js non ha la costante VERSIONE"; elif [ "$VM" = "$V" ]; then ok "VERSIONE del motore = $VM, come ?v= di index.html"; else avviso "VERSIONE del motore = $VM ma index.html e' a ?v=$V (li alza insieme pubblica.sh)"; fi
# i file importati con una versione vecchia devono essere davvero uguali da allora (altrimenti la cache serve il vecchio)
if git -C "$REPO" rev-parse --git-dir >/dev/null 2>&1; then
  for f in icone.js panorama.js; do
    if [ -n "$(git -C "$REPO" status --porcelain -- "$f")" ]; then
      vi="$(grep -o "\./$f?v=[0-9]*" "$REPO/gioco.js" | grep -o '[0-9]*$' | head -1)"
      [ "$vi" = "$V" ] || avviso "$f e' stato modificato ma gioco.js lo importa ancora con ?v=$vi: va alzato"
    fi
  done
fi
TERSER=""; for t in "$QUI/node_modules/.bin/terser" "$(command -v terser 2>/dev/null)"; do [ -n "$t" ] && [ -x "$t" ] && TERSER="$t" && break; done
if [ -n "$TERSER" ]; then
  for f in motore.js bot.js; do
    "$TERSER" "$REPO/$f" -c -m -o "$TMP/min-$f" 2>/dev/null
    if cmp -s "$TMP/min-$f" "$REPO/server/$f"; then ok "server/$f e' la versione compressa di $f"; else avviso "server/$f NON corrisponde a $f: prima di pubblicare va rifatto (lo fa pubblica.sh)"; fi
  done
else avviso "terser non installato: non controllo server/motore.js e server/bot.js (cd $QUI && npm install terser)"; fi
H1="$(grep -o 're-della-laguna@[0-9a-f]*/server/motore\.js' "$REPO/server/index.ts" | sed 's/.*@//; s#/.*##')"
H2="$(grep -o 're-della-laguna@[0-9a-f]*/server/bot\.js' "$REPO/server/index.ts" | sed 's/.*@//; s#/.*##')"
if [ -z "$H1" ] || [ "$H1" != "$H2" ]; then avviso "server/index.ts: i due import (motore e bot) puntano a commit diversi o mancano: '$H1' / '$H2'"
elif [ "${#H1}" != "40" ]; then avviso "server/index.ts: il commit '$H1' non e' lungo 40 caratteri"
elif git -C "$REPO" cat-file -e "$H1^{commit}" 2>/dev/null; then
  if git -C "$REPO" diff --quiet "$H1" -- server/motore.js server/bot.js 2>/dev/null; then ok "server/index.ts punta al commit ${H1:0:7}, che ha lo stesso motore di adesso"
  else avviso "server/index.ts punta al commit ${H1:0:7}, ma server/motore.js o server/bot.js sono cambiati da allora: il server gioca con regole vecchie finche' non pubblichi"; fi
else avviso "server/index.ts punta al commit $H1 che in questo repo non c'e'"; fi
# server/index.ts nuovo (usa Laguna.vistaSicura e LagunaBot.gioca) con il motore del commit vecchio non parte nemmeno
if grep -q 'vistaSicura' "$REPO/server/index.ts" && [ -n "$H1" ] && ! git -C "$REPO" show "$H1:server/motore.js" 2>/dev/null | grep -q 'vistaSicura'; then
  avviso "server/index.ts usa le funzioni nuove del motore, ma il commit ${H1:0:7} a cui punta ha il motore vecchio: NON pubblicare la funzione su Supabase prima di pubblica.sh (che aggiorna il commit)"
fi

# ---------------------------------------------------------------- 4. sim
titolo "4. Partite di soli bot (sim.js)"
if [ "$MODO" = "completo" ]; then P12=60; P16=30; else P12=20; P16=6; fi
node "$QUI/sim.js" "$P12" 12 4 1000 --breve >"$TMP/sim12" 2>&1; E12=$?
grep -E "Partite finite|Patrimonio del vincitore|ECCEZIONI|BLOCCHI|Mosse dei bot rifiutate" "$TMP/sim12" | sed 's/^/       /'
if [ $E12 -eq 0 ]; then ok "12 Cicli, $P12 partite: nessun errore"; else no "12 Cicli: errori (vedi sotto)"; sed -n '/ECCEZIONI/,$p' "$TMP/sim12" | sed 's/^/         /' | head -30; fi
# il patrimonio mediano del vincitore deve restare vicino al riferimento (STATO.md: 12 Cicli ~100-105 M).
# Con poche partite la mediana balla: banda larga 80-130 M = avviso, non errore.
M12="$(grep -o 'mediana [0-9,]* M' "$TMP/sim12" | head -1 | grep -o '[0-9]*' | head -1)"
if [ -n "$M12" ]; then if [ "$M12" -ge 80 ] && [ "$M12" -le 130 ]; then ok "patrimonio mediano del vincitore a 12 Cicli: $M12 M (riferimento 100-105 M)"; else avviso "patrimonio mediano del vincitore a 12 Cicli: $M12 M, lontano dal riferimento 100-105 M: l'economia e' cambiata (voluto?)"; fi; fi
node "$QUI/sim.js" "$P16" 16 4 2000 --breve >"$TMP/sim16" 2>&1; E16=$?
grep -E "Partite finite|Patrimonio del vincitore" "$TMP/sim16" | sed 's/^/       /'
if [ $E16 -eq 0 ]; then ok "16 Cicli, $P16 partite: nessun errore"; else no "16 Cicli: errori"; sed -n '/ECCEZIONI/,$p' "$TMP/sim16" | sed 's/^/         /' | head -30; fi
M16="$(grep -o 'mediana [0-9,]* M' "$TMP/sim16" | head -1 | grep -o '[0-9]*' | head -1)"
if [ -n "$M16" ]; then if [ "$M16" -ge 330 ] && [ "$M16" -le 650 ]; then ok "patrimonio mediano del vincitore a 16 Cicli: $M16 M (riferimento 440-520 M)"; else avviso "patrimonio mediano del vincitore a 16 Cicli: $M16 M, lontano dal riferimento 440-520 M"; fi; fi

# ---------------------------------------------------------------- 5. casi
titolo "5. Prove mirate (casi.js)"
node "$QUI/casi.js" >"$TMP/casi" 2>&1; EC=$?
grep -E "prove riuscite" "$TMP/casi" | sed 's/^/       /'
if [ $EC -eq 0 ]; then ok "tutti i difetti gia' corretti restano corretti"; else no "prove mirate fallite:"; grep -A1 -E "^  NO " "$TMP/casi" | sed 's/^/       /' | head -30; fi
mkdir -p "$QUI/risultati"; cp "$TMP/casi" "$QUI/risultati/ultimo-casi.txt" 2>/dev/null

# ---------------------------------------------------------------- 6. invarianti
titolo "6. Invarianti (invarianti.js)"
if [ "$MODO" = "completo" ]; then PI=6; CI=12; else PI=2; CI=8; fi
SEV="--severo"; [ "${SEVERO:-1}" = "0" ] && SEV=""   # di norma anche i buchi del "giocatore matto" bloccano (SEVERO=0 per farne solo avvisi)
node "$QUI/invarianti.js" "$PI" "$CI" 4 7000 $SEV >"$TMP/inv" 2>&1; EI=$?
grep -E "^[123]b?\) |INVARIANTI:" "$TMP/inv" | sed 's/^/       /'
if [ $EI -eq 0 ]; then ok "invarianti rispettati (partite normali$([ -n "$SEV" ] && echo ' e giocatore matto'))"; else no "invarianti violati:"; sed -n '/^GRAVI/,/^BUCHI-MATTO/p' "$TMP/inv" | grep -v BUCHI-MATTO | sed 's/^/         /' | head -40; fi
NB="$(grep -o '^BUCHI-MATTO: [0-9]*' "$TMP/inv" | grep -o '[0-9]*$')"
[ "${NB:-0}" -gt 0 ] && [ -z "$SEV" ] && avviso "il 'giocatore matto' trova $NB tipi di buchi mandando azioni sbagliate. Elenco: $QUI/risultati/ultimo-invarianti.txt"
mkdir -p "$QUI/risultati"
cp "$TMP/inv" "$QUI/risultati/ultimo-invarianti.txt" 2>/dev/null

# ---------------------------------------------------------------- 7. il server con un database finto
titolo "7. Il server senza Supabase (server-finto.js)"
if [ -d "$QUI/node_modules/esbuild" ]; then
  node "$QUI/server-finto.js" 4 11 >"$TMP/srv" 2>&1; ES=$?
  grep -E "^Giocate|^SERVER FINTO:|^  - " "$TMP/srv" | sed 's/^/       /' | head -12
  if [ $ES -eq 0 ]; then ok "server/index.ts: una partita online intera senza errori"; else no "server/index.ts ha problemi"; fi
  cp "$TMP/srv" "$QUI/risultati/ultimo-server-finto.txt" 2>/dev/null
else avviso "esbuild non installato: non provo server/index.ts (cd $QUI && npm install esbuild)"; fi

# ---------------------------------------------------------------- 8. partite vecchie nel motore nuovo
titolo "8. Partite gia' iniziate (vecchia.js)"
VECCHIE=0; VOK=0
for f in "$QUI"/risultati/vecchia-*.json "$QUI"/risultati/partita-vera*.json; do
  [ -f "$f" ] || continue; VECCHIE=$((VECCHIE+1))
  if node "$QUI/vecchia.js" "$f" 3 >"$TMP/vec" 2>&1; then VOK=$((VOK+1)); else no "$(basename "$f") non gira nel motore nuovo:"; sed 's/^/         /' "$TMP/vec" | tail -6; fi
done
if [ $VECCHIE -eq 0 ]; then avviso "nessuna partita salvata da provare (node $QUI/vecchia.js --salva ... con il motore vecchio)"
elif [ $VOK -eq $VECCHIE ]; then ok "$VOK partite iniziate con il motore vecchio continuano per 3 Cicli senza errori"; fi
ls "$QUI"/risultati/partita-vera*.json >/dev/null 2>&1 || avviso "manca la prova sulla partita VERA (regola G1): salvare lo stato in $QUI/risultati/partita-vera.json (sola lettura) e rilanciare"

# ---------------------------------------------------------------- 9. fumo
titolo "9. Il gioco nel browser (fumo.js)"
if [ "$MODO" = "veloce" ]; then avviso "saltato (modo veloce): prima di pubblicare va fatto"
else
  node "$QUI/fumo.js" "$QUI/foto" >"$TMP/fumo" 2>&1; EF=$?
  grep -E "^== |^   (NO|--|!!)|^FUMO|^  - |Tempo" "$TMP/fumo" | sed 's/^/       /'
  if [ $EF -eq 0 ]; then ok "PC e telefono: nessun errore (foto in $QUI/foto)"; else no "il gioco nel browser ha problemi (foto in $QUI/foto)"; fi
  mkdir -p "$QUI/risultati"; cp "$TMP/fumo" "$QUI/risultati/ultimo-fumo.txt" 2>/dev/null
fi

# ---------------------------------------------------------------- 10. tutte le app del telefono
titolo "10. Tutte le app del telefono (app.js)"
if [ "$MODO" = "veloce" ]; then avviso "saltato (modo veloce)"
else
  node "$QUI/app.js" "$QUI/risultati/ultimo-app.json" >"$TMP/app" 2>&1; EA=$?
  grep -E "^   (giorno|notte|!!)|^APP:|^  - " "$TMP/app" | cut -c1-200 | sed 's/^/       /'
  if [ $EA -eq 0 ]; then ok "ogni app si apre, di giorno e di notte, senza errori"; else no "una o piu' app del telefono danno errore"; fi
fi

# ---------------------------------------------------------------- verdetto
echo
echo "====================================================================="
if [ $ROSSI -eq 0 ]; then echo "VIA LIBERA   ($AVVISI avvisi)"; exit 0
else echo "NON PUBBLICARE   ($ROSSI controlli falliti, $AVVISI avvisi)"; exit 1; fi
