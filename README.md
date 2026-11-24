# WortPapagei: iPhone-app voor Duitse werkwoorden

Een web-app (PWA) om Duitse werkwoorden te oefenen. Je zet hem via Safari op je beginscherm, daarna opent hij als een gewone app en werkt hij zonder internet. Er is geen Mac of App Store voor nodig.

## Wat zit erin

- **Vervoegen**: typ de juiste vorm bij een werkwoord, tijd en persoon. Met knoppen voor ä, ö, ü en ß.
- **Stamtijden**: er-Präsens, Präteritum, Partizip II en haben/sein.
- **Tegen de klok**: zoveel mogelijk goed in 60 seconden, met record.
- **Mijn fouten**: elke fout gaat naar een lijst die je apart kunt herhalen; een goed antwoord haalt hem eraf.
- **Werkwoorden**: zoeken en volledige vervoegingstabellen bekijken.
- **Woorden**: woordkaarten zoals in Anki, met herhalen op tussenpozen (Opnieuw, Moeilijk, Goed, Makkelijk). Er zijn sets voor A1 t/m C1 (ruim 1.450 woorden) en je kunt eigen sets maken of een Anki-export (platte tekst) inladen. De richting is Duits → Nederlands, Nederlands → Duits of beide.
- **Resultaten**: cijfer per ronde (1 tot 10), geschiedenis en totalen, plus een back-up die je kunt bewaren en terugzetten.
- Een onderbroken ronde kun je later hervatten (behalve Tegen de klok).

Tijden: Präsens, Präteritum, Perfekt, Plusquamperfekt, Futur I, Konjunktiv II en Imperativ.
Werkwoorden: 198 (sterk en onregelmatig, zwak, scheidbaar, modaal, hulpwerkwoorden).
Alle vormen worden door `verbs.js` zelf berekend uit de stamtijden; er is niets van verbuga.eu overgenomen.

## Bestanden

| Bestand | Wat |
|---|---|
| `index.html` | Opmaak en layout |
| `app.js` | Oefeningen, tabellen, resultaten |
| `verbs.js` | Woordenlijst en vervoegingsregels |
| `words.js`, `data/` | Woordenschat A1–C1; `data/words-*.txt` (Duits\|Nederlands) wordt met `tools/build_words.py` omgezet naar `words.js` |
| `sw.js` | Offline-cache; pagina en scripts komen eerst van internet, dus updates komen vanzelf binnen |
| `assets/` | Papegaai, raaf, kanarie en het lettertype Nunito (offline) |
| `manifest.webmanifest`, `icons/` | App-naam en pictogram voor het beginscherm |
| `dist/verbuga-los.html` | Alles in één bestand, voor een snelle preview |
| `tools/` | `build_single.py` (losse preview), `stamp_sw.py` (cacheversie uit de bestanden), `make_icons.py` (iconen en opstartschermen), `cut_birds.py` |
| `ontwerp/` | Moodboard, knoppenblad en tekeningen. Niet nodig voor de app; laat deze map weg bij het uploaden |

## Op je iPhone zetten

1. Draai `python3 tools/stamp_sw.py` en zet de map (zonder `ontwerp/` en `review/`) online via HTTPS, bijvoorbeeld met GitHub Pages (gratis): maak een repository, upload de bestanden, en zet bij *Settings → Pages* de branch `main` aan.
2. Open het adres in **Safari** op je iPhone.
3. Tik op het deelknopje en kies **Zet op beginscherm**.
4. Open de app één keer met internet; daarna werkt hij ook offline.

Je resultaten worden alleen op je eigen telefoon bewaard. Let op: de app op het beginscherm en Safari hebben elk hun eigen opslag, en als je het icoon verwijdert, ben je je resultaten kwijt. Maak dus af en toe een back-up via Resultaten.

## Werkwoord toevoegen

Voeg in `verbs.js` een regel toe aan `STRONG` (`infinitief|er-präsens|präteritum|partizip|h, s of hs|konjunktiv II|vertaling`) of aan `WEAK` (`infinitief|vertaling`). Scheidbare werkwoorden schrijf je als `an|kommen|…`.
