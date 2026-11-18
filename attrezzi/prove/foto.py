import sys, asyncio, subprocess, time
from playwright.async_api import async_playwright
URL = sys.argv[1]; OUT = sys.argv[2]; W, H = int(sys.argv[3]), int(sys.argv[4])
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        pg = await b.new_page(viewport={"width": W, "height": H})
        logs = []
        pg.on("console", lambda m: logs.append(m.type + ": " + m.text) if m.type in ("error","warning") else None)
        pg.on("pageerror", lambda e: logs.append("PAGEERR " + str(e)))
        await pg.route("https://esm.sh/**", lambda r: r.fulfill(content_type="application/javascript", body="export function createClient(){return new Proxy({},{get:()=>()=>({})})}"))
        await pg.goto(URL); await pg.wait_for_timeout(int(sys.argv[5]) if len(sys.argv) > 5 else 6000)
        for sel in sys.argv[6:]:
            try:
                if sel.startswith("fill:"): a, v = sel[5:].split("="); await pg.fill(a, v)
                elif sel.startswith("wait:"): await pg.wait_for_timeout(int(sel[5:]))
                elif sel.startswith("js:"): print("JS", await pg.evaluate(sel[3:]))
                else: await pg.click(sel, timeout=2000); await pg.wait_for_timeout(1500)
            except Exception as e: logs.append("noclick " + sel)
        await pg.screenshot(path=OUT)
        print("\n".join(logs[:15])); print("3D:", await pg.evaluate("!!document.querySelector('.tre-canvas')"))
        await b.close()
asyncio.run(main())
