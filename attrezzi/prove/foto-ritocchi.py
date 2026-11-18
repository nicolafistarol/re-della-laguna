import asyncio, sys, json
from playwright.async_api import async_playwright
from disco import servi
GIOCA = """()=>{const vis=e=>e.offsetParent!==null&&!e.disabled;
 const st=[...document.querySelectorAll('button,div')].filter(e=>e.offsetParent!==null&&e.textContent.trim().startsWith("L'Investitore")).pop(); if(st){st.click(); return 'storia';}
 const velo=[...document.querySelectorAll('.velo')].pop(); if(velo){const vb=[...velo.querySelectorAll('button')].filter(vis); const x=vb.find(b=>/^(Avanti|Ok|Chiudi|Continua|Ho capito|Decidi)/.test(b.textContent.trim()))||vb[vb.length-1]; if(x){x.click(); return 'velo';}}
 return 'niente';}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":1280,"height":800}); errs=[]
        pg.on("pageerror", lambda e: errs.append("PAGEERR "+str(e)[:400]))
        await pg.route("http://localhost:8765/**", servi)
        await pg.route("https://esm.sh/**", lambda r: r.fulfill(content_type="application/javascript", body="export function createClient(){return new Proxy({},{get:()=>()=>({})})}"))
        await pg.goto("http://localhost:8765/?locale&nuova"); await pg.wait_for_timeout(2500)
        try: await pg.click("text=Chiudi", timeout=3000)
        except Exception: pass
        await pg.fill("input","Nicola"); await pg.click("text=Inizia"); await pg.wait_for_timeout(2000)
        for i in range(12):
            r = await pg.evaluate(GIOCA); await pg.wait_for_timeout(500)
            if r == 'niente' and await pg.evaluate("!!document.querySelector('[data-a=tira]')"): break
        # stato: mi do un motoscafo e soldi, e ricarico la partita salvata
        print("MOD", await pg.evaluate("""()=>{const k=Object.keys(localStorage).find(k=>k.startsWith('laguna_locale')); const s=JSON.parse(localStorage.getItem(k)); const me=s.players.find(p=>p.id==='g1'); me.veicoli=['motoscafo']; me.cash=9000000; me.livello=2; me.valigetta=[{id:'timbro'}]; localStorage.setItem(k, JSON.stringify(s)); return [k, s.fase, s.players[s.ordine[s.turno]].id, s.ciclo];}"""))
        await pg.goto("http://localhost:8765/?locale"); await pg.wait_for_timeout(3000)
        for i in range(30):
            if await pg.evaluate("!!document.querySelector('[data-a=rapido]')"): break
            await pg.evaluate(GIOCA); await pg.wait_for_timeout(600)
        await pg.evaluate("document.querySelectorAll('.velo').forEach(v=>v.remove())")
        await pg.click("[data-a=rapido]"); await pg.wait_for_timeout(1200)
        await pg.screenshot(path="/tmp/rit-rapido.png")
        await pg.evaluate("document.querySelectorAll('.velo').forEach(v=>v.remove())")
        # finestra del patto: apro il telefono, app Contratti, Proponi un patto
        await pg.evaluate("document.querySelector('#telefonoBox')&&0")
        ok = await pg.evaluate("""()=>{const b=[...document.querySelectorAll('button')].find(x=>x.dataset.a==='telefono'||/📱/.test(x.textContent)); if(b){b.click(); return true;} return false;}""")
        await pg.wait_for_timeout(800)
        print("tel", ok, await pg.evaluate("[...document.querySelectorAll('[data-app]')].map(x=>x.dataset.app).join(',')"))
        await pg.evaluate("""()=>{const x=document.querySelector('[data-app=contratti]'); if(x) x.click();}"""); await pg.wait_for_timeout(800)
        await pg.evaluate("""()=>{const x=document.querySelector('[data-a2=nuovoContratto]'); if(x) x.click();}"""); await pg.wait_for_timeout(800)
        print("PATTO", await pg.evaluate("""()=>{const d=document.querySelector('.velo'); if(!d) return 'nessuna finestra'; const f=d.querySelector('#fav'); f.value='passo'; f.dispatchEvent(new Event('change')); const g=d.querySelector('#favDeve'); g.value='da'; g.dispatchEvent(new Event('change')); return d.querySelector('#favSpiega').textContent + ' || ' + [...d.querySelectorAll('#a option')].map(o=>o.textContent).join(',');}"""))
        await pg.screenshot(path="/tmp/rit-patto.png")
        print("PATTO2", await pg.evaluate("""()=>{const d=document.querySelector('.velo'); const g=d.querySelector('#favDeve'); g.value='a'; g.dispatchEvent(new Event('change')); const a=d.querySelector('#a'); a.selectedIndex=1; a.dispatchEvent(new Event('change')); return d.querySelector('#favSpiega').textContent + ' | opzione: ' + d.querySelector('#favDeve option[value=a]').textContent;}"""))
        await pg.evaluate("document.querySelectorAll('.velo').forEach(v=>v.remove())")
        # avviso di versione nuova e avviso della parola rotta
        print("VERS", await pg.evaluate("""()=>{window.lagunaControllaVersione({versioneRegole: 99}); const d=document.getElementById('avvisoVersione'); return d? d.textContent : 'niente';}"""))
        await pg.screenshot(path="/tmp/rit-versione.png")
        print("PAROLA", await pg.evaluate("""()=>{const k=Object.keys(localStorage).find(k=>k.startsWith('laguna_locale')); const s=JSON.parse(localStorage.getItem(k)); const v={players:[{id:'g1',messaggi:[{ciclo:9,testo:'Hai rotto la parola con Sabri: −8 fama, e fino al Ciclo 4 nessuno accetterà Favori da te.'}]}]}; window.lagunaAvvisiParola(v); const d=[...document.querySelectorAll('.velo')].pop(); return d? d.textContent.slice(0,160):'niente';}"""))
        await pg.screenshot(path="/tmp/rit-parola.png")
        print("\n".join(errs) or "nessun errore della pagina")
        await b.close()
asyncio.run(main())
