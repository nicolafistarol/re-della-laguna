import sys, numpy as np
sys.path.insert(0, "/home/claude/attrezzi")
from isole import ISOLE, TORRI
from PIL import Image, ImageDraw
from scipy import ndimage as nd
out = sys.argv[1]; W, H = 1024, 576; k = W / 800
def maschera(polys):
    m = Image.new("L", (W, H), 0); d = ImageDraw.Draw(m)
    for p in polys: d.polygon([(x * k, y * k) for x, y in p], fill=255)
    return np.asarray(m) > 0
terra = maschera(ISOLE.values()); torri = maschera(TORRI)
d = nd.distance_transform_edt(terra)
alt = np.clip(d / 16, 0, 1) ** 0.7
alt = nd.gaussian_filter(alt, 2.2)
mare = nd.gaussian_filter((~(terra | nd.binary_dilation(torri, iterations=6))).astype(np.float32), 2)
img = np.zeros((H, W, 3), np.uint8)
img[..., 0] = (np.clip(alt, 0, 1) * 255).astype(np.uint8)
img[..., 1] = (np.clip(mare, 0, 1) * 255).astype(np.uint8)
Image.fromarray(img).save(out, optimize=True)
