"""Maakt het maskable icoon (papegaai binnen de veilige zone) en de opstartschermen voor iPhone."""
import pathlib
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
parrot = Image.open(root / 'assets' / 'parrot.png').convert('RGBA')
OLIVE, PAPER = (107, 127, 107), (232, 226, 214)

def place(size, bg, height_frac):
    w, h = size
    img = Image.new('RGB', size, bg)
    ph = int(min(w, h) * height_frac)
    pw = int(parrot.width * ph / parrot.height)
    p = parrot.resize((pw, ph), Image.LANCZOS)
    img.paste(p, ((w - pw) // 2, (h - ph) // 2), p)
    return img

# Android snijdt maskable iconen bij tot een cirkel van 80%: de papegaai blijft ruim daarbinnen.
place((512, 512), OLIVE, 0.56).save(root / 'icons' / 'icon-maskable-512.png', optimize=True)
# Opstartschermen (portret) voor gangbare iPhones: breedte, hoogte, pixelratio.
SPLASH = [(750, 1334, 2), (828, 1792, 2), (1125, 2436, 3), (1170, 2532, 3), (1179, 2556, 3), (1242, 2688, 3), (1284, 2778, 3), (1290, 2796, 3), (1080, 2340, 3)]
(root / 'icons' / 'splash').mkdir(exist_ok=True)
links = []
for w, h, r in SPLASH:
    name = f'icons/splash/splash-{w}x{h}.png'
    place((w, h), PAPER, 0.28).save(root / name, optimize=True)
    links.append(f'<link rel="apple-touch-startup-image" media="(device-width: {w // r}px) and (device-height: {h // r}px) and (-webkit-device-pixel-ratio: {r}) and (orientation: portrait)" href="{name}">')
print('\n'.join(links))
