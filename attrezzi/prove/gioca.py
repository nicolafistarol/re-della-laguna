import asyncio, sys
from playwright.async_api import async_playwright
N = int(sys.argv[1])
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":1280,"height":800}); errs=[]
        pg.on("pageerror", lambda e: errs.append("PAGEERR "+(e.stack or str(e))[:900]))
        pg.on("console", lambda m: errs.append("ERR "+m.text[:300]) if m.type=="error" else None)
        await pg.route("https://esm.sh/**", lambda r: r.fulfill(content_type="application/javascript", body="export function createClient(){return new Proxy({},{get:()=>()=>({})})}"))
        await pg.goto("http://localhost:8765/?locale&nuova"); await pg.wait_for_timeout(2500)
        try: await pg.click("text=Chiudi", timeout=3000)
        except Exception: pass
        await pg.fill("input","Nicola"); await pg.click("text=Inizia"); await pg.wait_for_timeout(2000)
        fasi=set()
        for i in range(N):
            r = await pg.evaluate("""()=>{
              const vis=e=>e.offsetParent!==null&&!e.disabled;
              const bs=[...document.querySelectorAll('button')].filter(vis);
              const st=[...document.querySelectorAll('button,div')].filter(e=>e.offsetParent!==null&&e.textContent.trim().startsWith("L'Investitore")).pop(); if(st){st.click(); return 'storia';}
              const velo=[...document.querySelectorAll('.velo')].pop();
              if(velo){const vb=[...velo.querySelectorAll('button')].filter(vis); const pr=['Avanti','Ok','Chiudi','Continua','Non offro','Non compro','Passo','Rinuncio','No']; for(const p of pr){const x=vb.find(b=>b.textContent.trim().startsWith(p)); if(x){x.click(); return 'velo-'+p;}} if(vb.length){const x=vb[vb.length-1]; const t=x.textContent.trim().slice(0,20); x.click(); return 'velo-ultimo-'+t;}}
              const pref=['Tira','Avanti','Vedi le storie','Investitore','Fine turno','Decidi','Termina','Finisci','Passa','Conferma','Ok','Chiudi','Continua','Non compro','Rinuncia'];
              for(const p of pref){const x=bs.find(b=>b.textContent.trim().startsWith(p)); if(x){x.click(); return p;}}
              return 'nessuno:'+bs.slice(0,8).map(b=>b.textContent.trim().slice(0,20)).join('|');}""")
            fasi.add(r.split(':')[0]); await pg.wait_for_timeout(700)
            if i in (60,100): await pg.screenshot(path=f"/tmp/g{i}.png"); print("DIAG", await pg.evaluate("[document.querySelectorAll('.velo').length, [...document.querySelectorAll('.carta button')].map(b=>b.textContent.trim().slice(0,25)+(b.disabled?'(off)':''))]"))
            if i%40==0:
                st = await pg.evaluate("document.querySelector('#fase,.fase,.stato-fase')?.textContent||document.title")
                print(i, r[:120])
        await pg.screenshot(path="/tmp/g.png"); print("fasi", fasi); print("\n".join(errs[:20]) or "nessun errore")
        await b.close()
asyncio.run(main())
