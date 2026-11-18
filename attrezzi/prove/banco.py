import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":1280,"height":800}); errs=[]
        pg.on("pageerror", lambda e: errs.append("PAGEERR "+(e.stack or str(e))[:600]))
        await pg.route("https://esm.sh/**", lambda r: r.fulfill(content_type="application/javascript", body="export function createClient(){return new Proxy({},{get:()=>()=>({})})}"))
        await pg.goto("http://localhost:8765/?locale&nuova"); await pg.wait_for_timeout(2500)
        try: await pg.click("text=Chiudi", timeout=3000)
        except Exception: pass
        await pg.fill("input","Nicola"); await pg.click("text=Inizia"); await pg.wait_for_timeout(1500)
        # porto la partita alla notte con i bot, poi metto me al Mercato Nero
        print(await pg.evaluate("""()=>{
          const L=window.Laguna,B=window.LagunaBot; const s=JSON.parse(localStorage.getItem('laguna_locale'));
          const me=s.players[0]; me.bot=true; me.strat='Esperto';
          for(let i=0;i<20000&&!(s.fase==='notte'&&s.ciclo>=1);i++){let bot=null,a=null;for(const p of s.players){const x=B.prossima(s,p);if(x){bot=p;a=x;break;}} if(!bot)break; try{L.applica(s,bot.id,a)}catch(e){try{if(s.fase==='notte')L.applica(s,bot.id,{tipo:'pronto'});else L.applica(s,bot.id,bot.haTirato?{tipo:'fine_turno'}:{tipo:'tira'})}catch(e2){}}}
          me.bot=false; me.cash=9e6; me.sporchi=2e6; s.notte.dove[me.id]='mercato'; delete s.notte.viaggio[me.id]; s.notte.pronto[me.id]=false; s.notteFatti[me.id]=false; s.notte.chiuso[me.id]=false;
          localStorage.setItem('laguna_locale',JSON.stringify(s)); return [s.fase,s.ciclo,JSON.stringify(s.notte.banco),JSON.stringify(s.situazioni)];}"""))
        await pg.goto("http://localhost:8765/?locale"); await pg.wait_for_timeout(3000)
        await pg.evaluate("document.querySelectorAll('.velo').forEach(v=>v.remove())")
        btn = await pg.evaluate("[...document.querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>b.textContent.trim().slice(0,40)).join(' | ')")
        print(btn[:600])
        await pg.evaluate("[...document.querySelectorAll('button,[data-a]')].find(b=>/Guarda la merce/i.test(b.textContent))?.click()")
        await pg.wait_for_timeout(1200); await pg.screenshot(path="/tmp/banco.png")
        await pg.evaluate("document.querySelector('[data-ogg]:not([disabled])')?.click()"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path="/tmp/banco2.png")
        print("\n".join(errs) or "nessun errore")
        await b.close()
asyncio.run(main())
