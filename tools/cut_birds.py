"""Knipt de raaf en de kanarie uit ontwerp/side-characters.png met een doorzichtige achtergrond."""
from PIL import Image, ImageFilter
import numpy as np
from collections import deque
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = Image.open(root / 'ontwerp' / 'side-characters.png').convert('RGB')

def flood(mask_ok, seeds):
    h, w = mask_ok.shape
    out = np.zeros((h, w), bool); q = deque(seeds)
    while q:
        y, x = q.popleft()
        if y < 0 or x < 0 or y >= h or x >= w or out[y, x] or not mask_ok[y, x]:
            continue
        out[y, x] = True
        q.extend(((y-1, x), (y+1, x), (y, x-1), (y, x+1)))
    return out

def border(h, w):
    return [(0, x) for x in range(w)] + [(h-1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w-1) for y in range(h)]

def cut(box, name, tol=42, close=31, trim_top=False):
    im = src.crop(box); a = np.array(im).astype(int); h, w, _ = a.shape
    ref = np.median(np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]), axis=0)
    dist = np.sqrt(((a - ref) ** 2).sum(2))
    bg = flood(dist <= tol, border(h, w))
    bird = Image.fromarray(np.where(bg, 0, 255).astype('uint8'))
    # Sluiten: dicht de opening bij het lichte gezicht, daarna gaten vullen
    closed = bird.filter(ImageFilter.MaxFilter(close)).filter(ImageFilter.MinFilter(close))
    c = np.array(closed) > 0
    outside = flood(~c, border(h, w))
    solid = ~outside
    # Alleen het grootste stuk houden (geen losse spikkels)
    seen = np.zeros_like(solid); best = None
    for y in range(0, h, 3):
        for x in range(0, w, 3):
            if solid[y, x] and not seen[y, x]:
                comp = flood(solid & ~seen, [(y, x)]); seen |= comp
                if best is None or comp.sum() > best.sum(): best = comp
    # Binnen de gesloten vorm: originele rand aanhouden, behalve in gaten (gezicht)
    # Het lichte gezicht lijkt op de achtergrond: herstel alleen gaten rechtsboven (de vogels kijken naar rechts)
    yy, xx = np.mgrid[0:h, 0:w]
    ys, xs = np.nonzero(best)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    head = ((yy - y0) < 0.42 * (y1 - y0)) & ((xx - x0) > 0.52 * (x1 - x0))
    inner = np.array(Image.fromarray((best * 255).astype('uint8')).filter(ImageFilter.MinFilter(9))) > 0
    keep = best & (~bg | (bg & head & inner))
    # Schaduw onder de pootjes: licht en grijzig in de onderste rand weghalen
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(2), a.min(2)
    sat = (mx - mn) / np.maximum(mx, 1)
    foot = (yy - y0) > 0.78 * (y1 - y0)
    top = ((yy - y0) < 0.07 * (y1 - y0)) & trim_top
    keep &= ~((foot | top) & (mx > 150) & (sat < 0.2))
    alpha = Image.fromarray(np.where(keep, 255, 0).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA'); out.putalpha(alpha)
    out = out.crop(out.getbbox()); out.thumbnail((300, 300), Image.LANCZOS)
    out.save(root / 'assets' / f'{name}.png'); out.save(root / 'assets' / f'{name}.webp', 'WEBP', quality=85)
    print(name, out.size)

def flood_holes(bg, shape):
    # achtergrondpixels die niet met de rand verbonden zijn zodra de vorm dicht is
    h, w = bg.shape
    reach = flood(bg & ~shape, border(h, w))
    return bg & ~reach & shape & np.array(Image.fromarray((shape*255).astype('uint8')).filter(ImageFilter.MinFilter(9))).astype(bool)

cut((140, 55, 520, 490), 'raven')
cut((160, 578, 462, 995), 'canary', trim_top=True)
