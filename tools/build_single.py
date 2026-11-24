"""Maakt één zelfstandig HTML-bestand (dist/verbuga-los.html) met alle CSS, JS, plaatjes en het lettertype ingebouwd."""
import re, pathlib, base64
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
title = re.search(r'<title>.*?</title>', html, re.S).group(0)
style = re.search(r'<style>.*?</style>', html, re.S).group(0)
body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
font = base64.b64encode((root / 'assets' / 'fonts' / 'nunito.woff2').read_bytes()).decode()
style = style.replace('url("assets/fonts/nunito.woff2")', f'url("data:font/woff2;base64,{font}")')
for name in ('verbs.js', 'words.js', 'app.js'):
    js = (root / name).read_text(encoding='utf-8')
    body = body.replace(f'<script src="{name}"></script>', f'<script>\n{js}\n</script>')
for name in ('parrot', 'raven', 'canary'):
    img = base64.b64encode((root / 'assets' / f'{name}.webp').read_bytes()).decode()
    data = 'data:image/webp;base64,' + img
    body = body.replace(f'assets/{name}.webp', data)
    style = style.replace(f'assets/{name}.webp', data)
head = ('<!doctype html>\n<html lang="nl">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        f'{title}\n<meta name="claude:viewport-fit-sides" content="cover">\n{style}\n</head>')
out = f'{head}\n<body>{body}</body>\n</html>\n'
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist' / 'verbuga-los.html').write_text(out, encoding='utf-8')
print('ok', len(out))
