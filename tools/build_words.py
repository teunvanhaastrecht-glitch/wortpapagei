"""Zet data/words-<niveau>.txt om in words.js (Duits|Nederlands per regel). Een woord dat al op een lager niveau staat, valt weg."""
import json, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
levels, seen, out = ['A1', 'A2', 'B1', 'B2', 'C1'], set(), {}
key = lambda de: re.sub(r'^(der|die|das)\s+|,.*$|\s*\(.*?\)', '', de).strip().lower()
for lvl in levels:
    f = root / 'data' / f'words-{lvl}.txt'
    items = []
    if f.exists():
        for line in f.read_text(encoding='utf-8').splitlines():
            if line.count('|') != 1:
                continue
            de, nl = (x.strip() for x in line.split('|'))
            if de and nl and key(de) not in seen:
                seen.add(key(de))
                items.append([de, nl])
    out[lvl] = items
    print(lvl, len(items))
js = ('/* WortPapagei: woordenschat A1 t/m C1 (Duits, Nederlands). Gemaakt door tools/build_words.py uit data/. */\n'
      'window.WortPapageiWords = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('],[', '],\n[') + ';\n')
# Vooraf geladen eigen sets: data/sets/<id>.txt, eerste regel '# Naam'. Ze komen één keer in Mijn sets en zijn daarna gewoon bewerkbaar.
presets = []
for f in sorted((root / 'data' / 'sets').glob('*.txt')):
    lines = f.read_text(encoding='utf-8').splitlines()
    name = lines[0].lstrip('#').strip() if lines and lines[0].startswith('#') else f.stem
    items = [[x.strip() for x in l.split('|')] for l in lines if l.count('|') == 1 and not l.startswith('#')]
    presets.append({'id': 'eigen-' + f.stem, 'name': name, 'items': items})
    print('set', f.stem, len(items))
js += 'window.WortPapageiPresets = ' + json.dumps(presets, ensure_ascii=False, separators=(',', ':')).replace('],[', '],\n[') + ';\n'
(root / 'words.js').write_text(js, encoding='utf-8')
