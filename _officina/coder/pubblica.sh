#!/usr/bin/env bash
# =====================================================================
# RE DELLA LAGUNA — pubblicare una versione nuova (stessa procedura usata da v59 a v65)
#
#   ./pubblica.sh "Cosa cambia, in una frase"              PROVA: dice cosa farebbe, non tocca niente
#   ./pubblica.sh "Cosa cambia, in una frase" --davvero    lo fa davvero (commit + push)
#   REPO=/percorso/del/repo ./pubblica.sh ...
#   FIRMA=$'Co-Authored-By: ...\nClaude-Session: ...'      righe da mettere in fondo ai messaggi di commit
#
# Cosa fa, in ordine (ricavato dalla storia git: es. commit a8f7fef + f61a55a):
#   0. lancia controlla.sh: se non da' VIA LIBERA si ferma qui.
#   1. alza il numero di versione ?v=N -> N+1:
#        index.html  (stile.css, motore.js, bot.js, gioco.js)
#        gioco.js    (import di tre.js e locale.js; icone.js, panorama.js e la musica SOLO se sono cambiati)
#        tre.js      (import di mondo3d.js)
#        motore.js   (const VERSIONE = N: il numero che server e browser confrontano)
#      Serve perche' il browser tiene in memoria i file vecchi: con il numero nuovo li riscarica.
#   2. rifa' le copie compresse per il server:  terser motore.js -c -m -o server/motore.js  (e bot.js)
#   3. PRIMO commit (il gioco) + push.
#   4. Se server/motore.js o server/bot.js sono cambiati: scrive il codice lungo (40 caratteri) del primo
#      commit nei due import di server/index.ts, SECONDO commit "Server: motore <codice>" + push.
#      Se il motore non e' cambiato questo passo si salta (come i vecchi commit "Server: resta sul motore ...").
#   5. NON pubblica la funzione su Supabase: quello resta un passo a mano (vedi in fondo).
#
# Perche' due commit: il server scarica motore e bot da jsDelivr a un commit preciso
#   https://cdn.jsdelivr.net/gh/nicolafistarol/re-della-laguna@<commit>/server/motore.js
# e il codice del commit si conosce solo DOPO averlo fatto. Quindi: prima il gioco, poi il puntatore.
#
# ATTENZIONE (finestra di rischio): tra il push del punto 3 e la pubblicazione della funzione Supabase
# i browser hanno gia' il gioco nuovo ma il server decide ancora con le regole vecchie.
# Va fatto tutto di seguito, e MAI mentre Nicola sta giocando la sua partita.
# =====================================================================
set -euo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
REPO="${REPO:-/home/claude/re-della-laguna}"
MSG="${1:-}"; DAVVERO=0; [ "${2:-}" = "--davvero" ] && DAVVERO=1
FIRMA="${FIRMA:-}"
[ -n "$MSG" ] || { echo "Uso: ./pubblica.sh \"Cosa cambia, in una frase\" [--davvero]"; exit 2; }
cd "$REPO"
fai() { if [ $DAVVERO -eq 1 ]; then "$@"; else echo "   (prova) $*"; fi; }
messaggio() { if [ -n "$FIRMA" ]; then printf '%s\n\n%s\n' "$1" "$FIRMA"; else printf '%s\n' "$1"; fi; }

echo "PUBBLICA  repo=$REPO  $([ $DAVVERO -eq 1 ] && echo DAVVERO || echo 'PROVA (non tocca niente: aggiungi --davvero)')"

# ---- controlli prima di partire
[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || { echo "Non sei sul ramo main."; exit 1; }
if [ $DAVVERO -eq 1 ]; then git fetch -q origin main; [ -z "$(git log HEAD..origin/main --oneline)" ] || { echo "Su GitHub c'e' qualcosa di piu' nuovo: prima git pull."; exit 1; }; fi
NUOVI="$(git ls-files --others --exclude-standard)"
[ -z "$NUOVI" ] || { echo "File nuovi non ancora nel repo (aggiungili con 'git add' se servono al gioco, altrimenti toglili):"; echo "$NUOVI" | sed 's/^/   /'; [ $DAVVERO -eq 0 ] || exit 1; }
TERSER=""; for t in "$QUI/node_modules/.bin/terser" "$(command -v terser 2>/dev/null || true)"; do [ -n "$t" ] && [ -x "$t" ] && TERSER="$t" && break; done
[ -n "$TERSER" ] || { echo "Manca terser: cd $QUI && npm install terser"; exit 1; }
if [ "${SALTA_CONTROLLI:-0}" != "1" ]; then
  echo; echo "0. Controlli..."
  REPO="$REPO" "$QUI/controlla.sh" || { echo; echo "controlla.sh non da' via libera: non pubblico."; exit 1; }
fi

# ---- 1. versione
V="$(grep -o 'gioco\.js?v=[0-9]*' index.html | grep -o '[0-9]*$')"
N=$((V + 1))
echo; echo "1. Versione: v=$V -> v=$N"
fai sed -i -E "s/(stile\.css|motore\.js|bot\.js|gioco\.js)\?v=[0-9]+/\1?v=$N/g" index.html
fai sed -i -E "s#(\./(tre|locale)\.js)\?v=[0-9]+#\1?v=$N#g" gioco.js
fai sed -i -E "s#(\./mondo3d\.js)\?v=[0-9]+#\1?v=$N#g" tre.js
# lo stesso numero sta dentro il motore (VERSIONE): server e browser lo confrontano per dire "ricarica la pagina"
fai sed -i -E "s/^(  const VERSIONE = )[0-9]+;/\1$N;/" motore.js
if [ $DAVVERO -eq 1 ]; then grep -q "^  const VERSIONE = $N;" motore.js || { echo "Non ho trovato 'const VERSIONE' in motore.js. Fermo."; exit 1; }; fi
# questi tre si alzano solo se il file e' cambiato dall'ultimo commit (convenzione: icone e panorama sono fermi a v=51, la musica a v=64)
for f in icone.js panorama.js; do
  if ! git diff --quiet HEAD -- "$f"; then echo "   $f e' cambiato: alzo anche il suo import"; fai sed -i -E "s#(\./${f%.js}\.js)\?v=[0-9]+#\1?v=$N#g" gioco.js; fi
done
if ! git diff --quiet HEAD -- musica/; then echo "   la musica e' cambiata: alzo anche il suo numero"; fai sed -i -E "s#(\.mp3)\?v=[0-9]+#\1?v=$N#g" gioco.js; fi

# ---- 2. copie compresse per il server
echo; echo "2. Comprimo motore.js e bot.js in server/"
fai "$TERSER" motore.js -c -m -o server/motore.js
fai "$TERSER" bot.js -c -m -o server/bot.js
if [ $DAVVERO -eq 1 ]; then node --check server/motore.js && node --check server/bot.js; fi

# ---- 3. primo commit: il gioco
echo; echo "3. Primo commit (il gioco) e push"
MOTORE_CAMBIATO=1
if [ $DAVVERO -eq 1 ]; then
  git add -u
  git diff --cached --quiet -- server/motore.js server/bot.js && MOTORE_CAMBIATO=0
  git diff --cached --stat | sed 's/^/   /'
  git commit -q -m "$(messaggio "$MSG")"
  git push -q origin main
  HASH="$(git rev-parse HEAD)"
else
  echo "   (prova) git add -u ; git commit -m \"$MSG\" ; git push origin main"
  git diff --quiet HEAD -- motore.js bot.js && MOTORE_CAMBIATO=0
  HASH="<codice del commit appena fatto>"
fi
echo "   commit del gioco: $HASH"

# ---- 4. secondo commit: il server punta al motore nuovo
VECCHIO="$(grep -o 're-della-laguna@[0-9a-f]*/server/motore\.js' server/index.ts | sed 's/.*@//; s#/.*##')"
if [ $MOTORE_CAMBIATO -eq 1 ]; then
  echo; echo "4. Il server passa dal motore ${VECCHIO:0:7} al motore ${HASH:0:7}"
  fai sed -i -E "s#(re-della-laguna@)[0-9a-f]+(/server/(motore|bot)\.js)#\1$HASH\2#g" server/index.ts
  if [ $DAVVERO -eq 1 ]; then
    [ "$(grep -c "re-della-laguna@$HASH/server/" server/index.ts)" = "2" ] || { echo "server/index.ts: non ho trovato i due import da aggiornare. Fermo."; exit 1; }
    git add server/index.ts
    git commit -q -m "$(messaggio "Server: motore $HASH")"
    git push -q origin main
  else echo "   (prova) git commit -m \"Server: motore $HASH\" ; git push origin main"; fi
else
  echo; echo "4. Motore e bot non sono cambiati: il server resta sul motore ${VECCHIO:0:7} (niente secondo commit, niente Supabase)."
fi

# ---- 5. quello che resta da fare a mano
echo
echo "====================================================================="
echo "FATTO$([ $DAVVERO -eq 1 ] || echo ' (era solo una prova)'). Resta da fare a mano:"
if [ $MOTORE_CAMBIATO -eq 1 ]; then
  echo " a) aspettare 1-2 minuti e controllare che jsDelivr dia il file nuovo:"
  echo "      curl -sI https://cdn.jsdelivr.net/gh/nicolafistarol/re-della-laguna@$HASH/server/motore.js | head -1     (deve dire 200)"
  echo " b) pubblicare server/index.ts come funzione \"laguna\" su Supabase (progetto eqnrzboulnzkjuyhqsvu): la versione sale di 1"
  echo " c) provare una partita online NUOVA (mai quella di Nicola: 8e8dfc20-...)"
fi
echo " d) aprire il sito con ?v=$N e controllare che GitHub Pages abbia finito (1-2 minuti)"
echo " e) scrivere in STATO.md / nel documento del Project: versione v$N, cosa e' cambiato"
