"""Zet VERSION in sw.js op een hash van alle app-bestanden, zodat een nieuwe uitgave nooit een oude cache houdt.
Draai dit vóór het uploaden: python3 tools/stamp_sw.py"""
import hashlib, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
sw = root / 'sw.js'
text = sw.read_text(encoding='utf-8')
names = re.findall(r"'([^']+\.(?:html|js|webmanifest|woff2|webp|png))'", text)
h = hashlib.sha256()
for name in sorted(set(names)):
    h.update(name.encode())
    h.update((root / name).read_bytes())
version = 'wortpapagei-' + h.hexdigest()[:10]
text = re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{version}';", text)
sw.write_text(text, encoding='utf-8')
print(version)
