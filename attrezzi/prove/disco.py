# serve i file del gioco dal disco dentro Playwright (al posto del server locale su 8765)
import os, mimetypes
RADICE = "/home/claude/re-della-laguna"
async def servi(route):
    url = route.request.url.split("://", 1)[1].split("/", 1)[1] if "/" in route.request.url.split("://", 1)[1] else ""
    path = url.split("?")[0].split("#")[0] or "index.html"
    f = os.path.join(RADICE, path)
    if not os.path.isfile(f): return await route.fulfill(status=404, body="")
    tipo = mimetypes.guess_type(f)[0] or "application/octet-stream"
    if f.endswith(".js") or f.endswith(".mjs"): tipo = "application/javascript"
    await route.fulfill(path=f, content_type=tipo)
