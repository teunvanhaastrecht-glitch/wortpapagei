/* WortPapagei — Duitse werkwoorden: woordenlijst en vervoegingsmotor.
   Alle vormen worden hier zelf gegenereerd uit de stamtijden. */
(function (root) {
  'use strict';

  // Sterke, gemengde en onregelmatige werkwoorden.
  // infinitief|er-präsens|präteritum|partizip II|hulpww (h/s, hs = allebei)|konjunktiv II (/ = ook goed)|vertaling|du-präsens (alleen als afwijkend)
  // Scheidbare werkwoorden: prefix|basis, met de stamtijden van de basis.
  const STRONG = `
befehlen|befiehlt|befahl|befohlen|h||bevelen
beginnen|beginnt|begann|begonnen|h|begänne|beginnen
beißen|beißt|biss|gebissen|h||bijten
bekommen|bekommt|bekam|bekommen|h|bekäme|krijgen
betrügen|betrügt|betrog|betrogen|h||bedriegen
biegen|biegt|bog|gebogen|h||buigen
bieten|bietet|bot|geboten|h|böte|bieden
binden|bindet|band|gebunden|h||binden
bitten|bittet|bat|gebeten|h|bäte|verzoeken
blasen|bläst|blies|geblasen|h||blazen
bleiben|bleibt|blieb|geblieben|s|bliebe|blijven
braten|brät|briet|gebraten|h||braden|brätst
brechen|bricht|brach|gebrochen|h||breken
brennen|brennt|brannte|gebrannt|h||branden
bringen|bringt|brachte|gebracht|h|brächte|brengen
denken|denkt|dachte|gedacht|h|dächte|denken
empfehlen|empfiehlt|empfahl|empfohlen|h||aanbevelen
essen|isst|aß|gegessen|h|äße|eten
fahren|fährt|fuhr|gefahren|s|führe|rijden, varen
fallen|fällt|fiel|gefallen|s|fiele|vallen
fangen|fängt|fing|gefangen|h|finge|vangen
finden|findet|fand|gefunden|h|fände|vinden
fliegen|fliegt|flog|geflogen|s|flöge|vliegen
fliehen|flieht|floh|geflohen|s||vluchten
fließen|fließt|floss|geflossen|s||stromen
fressen|frisst|fraß|gefressen|h||vreten
frieren|friert|fror|gefroren|h||vriezen, het koud hebben
geben|gibt|gab|gegeben|h|gäbe|geven
gehen|geht|ging|gegangen|s|ginge|gaan
gelten|gilt|galt|gegolten|h||gelden|giltst
genießen|genießt|genoss|genossen|h||genieten
gewinnen|gewinnt|gewann|gewonnen|h||winnen
gießen|gießt|goss|gegossen|h||gieten
gleichen|gleicht|glich|geglichen|h||lijken op
graben|gräbt|grub|gegraben|h||graven
greifen|greift|griff|gegriffen|h||grijpen
halten|hält|hielt|gehalten|h|hielte|houden|hältst
hängen|hängt|hing|gehangen|h||hangen
heben|hebt|hob|gehoben|h||tillen
heißen|heißt|hieß|geheißen|h||heten
helfen|hilft|half|geholfen|h||helpen
kennen|kennt|kannte|gekannt|h||kennen
klingen|klingt|klang|geklungen|h||klinken
kommen|kommt|kam|gekommen|s|käme|komen
kriechen|kriecht|kroch|gekrochen|s||kruipen
laden|lädt|lud|geladen|h||laden
lassen|lässt|ließ|gelassen|h|ließe|laten
laufen|läuft|lief|gelaufen|s|liefe|lopen
leiden|leidet|litt|gelitten|h||lijden
leihen|leiht|lieh|geliehen|h||lenen
lesen|liest|las|gelesen|h|läse|lezen
liegen|liegt|lag|gelegen|h|läge|liggen
lügen|lügt|log|gelogen|h||liegen (niet de waarheid)
messen|misst|maß|gemessen|h||meten
nehmen|nimmt|nahm|genommen|h|nähme|nemen
nennen|nennt|nannte|genannt|h||noemen
pfeifen|pfeift|pfiff|gepfiffen|h||fluiten
raten|rät|riet|geraten|h||raden|rätst
reißen|reißt|riss|gerissen|h||scheuren
reiten|reitet|ritt|geritten|s||paardrijden
rennen|rennt|rannte|gerannt|s||rennen
riechen|riecht|roch|gerochen|h||ruiken
rufen|ruft|rief|gerufen|h|riefe|roepen
scheinen|scheint|schien|geschienen|h||schijnen
schieben|schiebt|schob|geschoben|h||schuiven
schießen|schießt|schoss|geschossen|h||schieten
schlafen|schläft|schlief|geschlafen|h|schliefe|slapen
schlagen|schlägt|schlug|geschlagen|h||slaan
schließen|schließt|schloss|geschlossen|h||sluiten
schneiden|schneidet|schnitt|geschnitten|h||snijden
schreiben|schreibt|schrieb|geschrieben|h|schriebe|schrijven
schreien|schreit|schrie|geschrien|h||schreeuwen
schweigen|schweigt|schwieg|geschwiegen|h||zwijgen
schwimmen|schwimmt|schwamm|geschwommen|s||zwemmen
sehen|sieht|sah|gesehen|h|sähe|zien
singen|singt|sang|gesungen|h||zingen
sinken|sinkt|sank|gesunken|s||zinken
sitzen|sitzt|saß|gesessen|h|säße|zitten
sprechen|spricht|sprach|gesprochen|h|spräche|spreken
springen|springt|sprang|gesprungen|s||springen
stechen|sticht|stach|gestochen|h||steken
stehen|steht|stand|gestanden|h|stünde/stände|staan
stehlen|stiehlt|stahl|gestohlen|h||stelen
steigen|steigt|stieg|gestiegen|s||stijgen, klimmen
sterben|stirbt|starb|gestorben|s||sterven
stinken|stinkt|stank|gestunken|h||stinken
stoßen|stößt|stieß|gestoßen|h||stoten
streiten|streitet|stritt|gestritten|h||ruziemaken
tragen|trägt|trug|getragen|h||dragen
treffen|trifft|traf|getroffen|h|träfe|ontmoeten, raken
treiben|treibt|trieb|getrieben|h||drijven
treten|tritt|trat|getreten|hs||trappen, treden|trittst
trinken|trinkt|trank|getrunken|h|tränke|drinken
verbieten|verbietet|verbot|verboten|h||verbieden
vergessen|vergisst|vergaß|vergessen|h|vergäße|vergeten
vergleichen|vergleicht|verglich|verglichen|h||vergelijken
verlieren|verliert|verlor|verloren|h||verliezen
versprechen|verspricht|versprach|versprochen|h||beloven
verstehen|versteht|verstand|verstanden|h|verstünde/verstände|begrijpen
verzeihen|verzeiht|verzieh|verziehen|h||vergeven
wachsen|wächst|wuchs|gewachsen|s||groeien
waschen|wäscht|wusch|gewaschen|h||wassen
werfen|wirft|warf|geworfen|h||werpen
wiegen|wiegt|wog|gewogen|h||wegen
ziehen|zieht|zog|gezogen|h|zöge|trekken
zwingen|zwingt|zwang|gezwungen|h||dwingen
an|fangen|fängt|fing|gefangen|h|finge|beginnen
an|kommen|kommt|kam|gekommen|s|käme|aankomen
an|rufen|ruft|rief|gerufen|h|riefe|opbellen
auf|stehen|steht|stand|gestanden|s|stünde/stände|opstaan
aus|sehen|sieht|sah|gesehen|h|sähe|eruitzien
ein|laden|lädt|lud|geladen|h||uitnodigen
ein|schlafen|schläft|schlief|geschlafen|s|schliefe|in slaap vallen
ein|steigen|steigt|stieg|gestiegen|s||instappen
aus|steigen|steigt|stieg|gestiegen|s||uitstappen
fern|sehen|sieht|sah|gesehen|h|sähe|televisiekijken
mit|nehmen|nimmt|nahm|genommen|h|nähme|meenemen
statt|finden|findet|fand|gefunden|h|fände|plaatsvinden
`;

  // Zwakke (regelmatige) werkwoorden: infinitief|vertaling|hulpww (standaard h)
  const WEAK = `
antworten|antwoorden
arbeiten|werken
atmen|ademen
baden|baden
benutzen|gebruiken
besuchen|bezoeken
bezahlen|betalen
brauchen|nodig hebben
danken|danken, bedanken
entdecken|ontdekken
erklären|uitleggen
erzählen|vertellen
feiern|vieren
folgen|volgen|s
fragen|vragen
glauben|geloven
gehören|toebehoren
heiraten|trouwen
holen|halen
hören|horen
kaufen|kopen
klettern|klimmen|s
kochen|koken
kosten|kosten
lachen|lachen
landen|landen|s
leben|leven
legen|leggen
lernen|leren
lieben|houden van
machen|maken
malen|schilderen
öffnen|openen
probieren|proberen
putzen|poetsen
rechnen|rekenen
reden|praten
reisen|reizen|s
sagen|zeggen
sammeln|verzamelen
schicken|sturen
setzen|zetten
spielen|spelen
stellen|zetten (rechtop)
studieren|studeren
suchen|zoeken
tanzen|dansen
telefonieren|telefoneren
träumen|dromen
verkaufen|verkopen
versuchen|proberen
wandern|wandelen, trekken|s
warten|wachten
wechseln|wisselen
weinen|huilen
wohnen|wonen
wünschen|wensen
zahlen|betalen
zählen|tellen
zeigen|tonen
ändern|veranderen
lächeln|glimlachen
ab|holen|ophalen
auf|hören|ophouden
auf|machen|opendoen
auf|räumen|opruimen
ein|kaufen|boodschappen doen
vor|stellen|voorstellen
zu|machen|dichtdoen
`;

  // Volledig onregelmatige werkwoorden (hulpwerkwoorden, modale werkwoorden).
  const IRREGULAR = [
    { inf: 'sein', nl: 'zijn', group: 'hulp', pres: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'], pt: 'war', pp: 'gewesen', aux: 's', k2: 'wäre', imp: ['sei', 'seid', 'seien Sie'] },
    { inf: 'haben', nl: 'hebben', group: 'hulp', pres: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'], pt: 'hatte', pp: 'gehabt', aux: 'h', k2: 'hätte', imp: ['hab|habe', 'habt', 'haben Sie'] },
    { inf: 'werden', nl: 'worden', group: 'hulp', pres: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'], pt: 'wurde', pp: 'geworden', aux: 's', k2: 'würde', imp: ['werde|werd', 'werdet', 'werden Sie'] },
    { inf: 'wissen', nl: 'weten', group: 'sterk', pres: ['weiß', 'weißt', 'weiß', 'wissen', 'wisst', 'wissen'], pt: 'wusste', pp: 'gewusst', aux: 'h', k2: 'wüsste', imp: null },
    { inf: 'tun', nl: 'doen', group: 'sterk', pres: ['tue', 'tust', 'tut', 'tun', 'tut', 'tun'], pt: 'tat', pp: 'getan', aux: 'h', k2: 'täte', imp: ['tu|tue', 'tut', 'tun Sie'] },
    { inf: 'können', nl: 'kunnen', group: 'modaal', pres: ['kann', 'kannst', 'kann', 'können', 'könnt', 'können'], pt: 'konnte', pp: 'gekonnt', aux: 'h', k2: 'könnte', imp: null },
    { inf: 'dürfen', nl: 'mogen (toestemming)', group: 'modaal', pres: ['darf', 'darfst', 'darf', 'dürfen', 'dürft', 'dürfen'], pt: 'durfte', pp: 'gedurft', aux: 'h', k2: 'dürfte', imp: null },
    { inf: 'müssen', nl: 'moeten', group: 'modaal', pres: ['muss', 'musst', 'muss', 'müssen', 'müsst', 'müssen'], pt: 'musste', pp: 'gemusst', aux: 'h', k2: 'müsste', imp: null },
    { inf: 'sollen', nl: 'moeten (opdracht)', group: 'modaal', pres: ['soll', 'sollst', 'soll', 'sollen', 'sollt', 'sollen'], pt: 'sollte', pp: 'gesollt', aux: 'h', k2: 'sollte', imp: null },
    { inf: 'wollen', nl: 'willen', group: 'modaal', pres: ['will', 'willst', 'will', 'wollen', 'wollt', 'wollen'], pt: 'wollte', pp: 'gewollt', aux: 'h', k2: 'wollte', imp: null },
    { inf: 'mögen', nl: 'lusten, graag mogen', group: 'modaal', pres: ['mag', 'magst', 'mag', 'mögen', 'mögt', 'mögen'], pt: 'mochte', pp: 'gemocht', aux: 'h', k2: 'möchte', imp: null },
  ];

  const PERSONS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
  const PRONOUNS = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'];
  const TENSES = [
    { id: 'pres', label: 'Präsens', nl: 'tegenwoordige tijd' },
    { id: 'pret', label: 'Präteritum', nl: 'onvoltooid verleden tijd' },
    { id: 'perf', label: 'Perfekt', nl: 'voltooid tegenwoordige tijd' },
    { id: 'plqp', label: 'Plusquamperfekt', nl: 'voltooid verleden tijd' },
    { id: 'fut1', label: 'Futur I', nl: 'toekomende tijd' },
    { id: 'k2', label: 'Konjunktiv II', nl: 'voorwaardelijke wijs' },
    { id: 'imp', label: 'Imperativ', nl: 'gebiedende wijs' },
  ];
  const IMP_PERSONS = ['du', 'ihr', 'Sie'];
  const GROUPS = [
    { id: 'sterk', label: 'Sterk & onregelmatig' },
    { id: 'zwak', label: 'Zwak (regelmatig)' },
    { id: 'scheidbaar', label: 'Scheidbaar' },
    { id: 'modaal', label: 'Modaal' },
    { id: 'hulp', label: 'Hulpwerkwoorden' },
  ];

  const INSEP = /^(be|emp|ent|er|ge|miss|ver|zer)/;
  const endsSibilant = s => /(s|ß|z|x)$/.test(s);

  function stemOf(inf) {
    return inf.endsWith('en') ? inf.slice(0, -2) : inf.slice(0, -1);
  }
  // Tussen-e nodig? (arbeit-e-st, öffn-e-st, red-e-t)
  function needsE(stem) {
    if (/[dt]$/.test(stem)) return true;
    return /[^aeiouäöüylrmn][mn]$/.test(stem) && !/[aeiouäöü]h[mn]$/.test(stem);
  }

  function regularPresent(inf) {
    const stem = stemOf(inf);
    if (/(el|er)n$/.test(inf) && !/en$/.test(inf)) {
      // sammeln / wandern
      const first = inf.endsWith('eln') ? stem.slice(0, -2) + 'le' : stem + 'e';
      return [first, stem + 'st', stem + 't', inf, stem + 't', inf];
    }
    const e = needsE(stem) ? 'e' : '';
    return [
      stem + 'e',
      stem + (endsSibilant(stem) ? 't' : e + 'st'),
      stem + e + 't',
      inf,
      stem + e + 't',
      inf,
    ];
  }

  function parse() {
    const verbs = [];
    const PREFIXES = new Set(['ab', 'an', 'auf', 'aus', 'ein', 'fern', 'mit', 'statt', 'vor', 'zu']);
    STRONG.trim().split('\n').forEach(line => {
      const parts = line.split('|');
      const prefix = PREFIXES.has(parts[0]) ? parts.shift() : '';
      const [base, p3, pt, pp, aux, k2, nl, p2] = parts;
      const [k2main, k2alt] = (k2 || '').split('/');
      verbs.push({ base, prefix, p3, pt, pp, aux, k2: k2main, k2alt: k2alt || '', nl, p2: p2 || '', kind: 'strong' });
    });
    WEAK.trim().split('\n').forEach(line => {
      const parts = line.split('|');
      const prefix = PREFIXES.has(parts[0]) ? parts.shift() : '';
      const [base, nl, aux] = parts;
      verbs.push({ base, prefix, nl, aux: aux || 'h', kind: 'weak' });
    });
    IRREGULAR.forEach(v => verbs.push(Object.assign({ base: v.inf, prefix: '', kind: 'irr' }, v)));
    verbs.forEach(finish);
    return verbs;
  }

  function finish(v) {
    v.inf = v.prefix + v.base;
    v.id = v.inf;
    const stem = stemOf(v.base);
    if (v.kind === 'irr') {
      v.presForms = v.pres.slice();
    } else {
      const reg = regularPresent(v.base);
      if (v.kind === 'weak') {
        v.presForms = reg;
        v.pt = stem + (needsE(stem) ? 'ete' : 'te');
        const ge = INSEP.test(v.base) || v.base.endsWith('ieren') ? '' : 'ge';
        v.pp = ge + stem + (needsE(stem) ? 'et' : 't');
        v.p3 = reg[2];
      } else {
        const pres = reg.slice();
        if (v.p3 !== reg[2]) {
          pres[2] = v.p3;
          const s3 = v.p3.replace(/t$/, '');
          pres[1] = v.p2 || (endsSibilant(s3) ? v.p3 : s3 + 'st');
        }
        v.presForms = pres;
      }
      v.group = v.prefix ? 'scheidbaar' : v.kind === 'weak' ? 'zwak' : 'sterk';
    }
    v.pp = v.prefix + v.pp;
    v.auxWord = v.aux === 's' ? 'sein' : 'haben';
    if (v.aux === 'hs') v.auxAlt = 'sein'; // treten: ich habe/bin getreten
    // stattfinden zeg je alleen in de derde persoon (es findet statt, sie finden statt)
    if (v.inf === 'stattfinden') v.only3 = true;
  }

  // ---- Vervoeging ----
  const AUX = {
    sein: { pres: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'], pt: ['war', 'warst', 'war', 'waren', 'wart', 'waren'] },
    haben: { pres: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'], pt: ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten'] },
  };
  const WERDEN = ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'];
  const WUERDE = ['würde', 'würdest', 'würde', 'würden', 'würdet', 'würden'];

  function withPrefix(v, form) {
    return v.prefix ? form + ' ' + v.prefix : form;
  }

  // Geeft per persoon een lijst met goedgekeurde antwoorden; de eerste is de standaardvorm.
  function pretForms(pt) {
    if (/e$/.test(pt)) {
      // zwakke uitgangen: dachte, wurde, hatte
      return [[pt], [pt + 'st'], [pt], [pt + 'n'], [pt + 't'], [pt + 'n']];
    }
    const plural = pt.endsWith('ie') ? pt + 'n' : pt + 'en';
    let du, ihr;
    if (endsSibilant(pt)) du = [pt + 'est', pt + 't'];
    else if (/d$/.test(pt)) du = [pt + 'est', pt + 'st'];
    else if (/t$/.test(pt)) du = [pt + 'est'];
    else du = [pt + 'st'];
    if (/[dt]$/.test(pt)) ihr = [pt + 'et'];
    else ihr = [pt + 't'];
    return [[pt], du, [pt], [plural], ihr, [plural]];
  }

  function k2Synthetic(k2) {
    const s = k2.slice(0, -1);
    const short = /(t|d|s|ß|z|x)$/.test(s) ? [] : null;
    return [[k2], [s + 'est'].concat(short || [s + 'st']), [k2], [s + 'en'], [s + 'et'].concat(short || [s + 't']), [s + 'en']];
  }

  function imperative(v) {
    if (v.kind === 'irr') {
      if (!v.imp) return null;
      return v.imp.map(x => x.split('|'));
    }
    const stem = stemOf(v.base);
    let du;
    const reg3 = regularPresent(v.base)[2];
    const eToI = v.kind === 'strong' && v.p3 !== reg3 && !/[äöü]/.test(v.p3);
    if (v.only3) return null;
    if (eToI) {
      const s3 = v.p3.replace(/t$/, '');
      du = [v.base === 'treten' ? 'tritt' : v.base === 'gelten' ? 'gilt' : s3];
      if (v.base === 'sehen') du.push('siehe');
    } else if (/(el|er)n$/.test(v.base) && !/en$/.test(v.base)) {
      du = [regularPresent(v.base)[0]];
      if (v.base.endsWith('eln')) du.push(stem + 'e'); // sammle of sammele
    } else if (needsE(stem)) {
      du = v.kind === 'strong' && /[dt]$/.test(stem) ? [stem + 'e', stem] : [stem + 'e'];
    } else {
      du = [stem, stem + 'e'];
    }
    const ihr = v.presForms[4];
    return [
      du.map(f => withPrefix(v, f)),
      [withPrefix(v, ihr)],
      [v.prefix ? v.base + ' Sie ' + v.prefix : v.base + ' Sie'],
    ];
  }

  // Alle vormen voor één tijd: array van 6 (of 3 voor Imperativ) lijsten met geldige antwoorden.
  function conjugate(v, tense) {
    const inf = v.inf;
    switch (tense) {
      case 'pres':
        return v.presForms.map((f, i) => {
          const list = [withPrefix(v, f)];
          if (i === 0 && v.kind === 'weak' && v.base.endsWith('eln')) list.push(withPrefix(v, stemOf(v.base) + 'e')); // ich sammle/sammele
          return list;
        });
      case 'pret': {
        return pretForms(v.pt).map(list => list.map(f => withPrefix(v, f)));
      }
      case 'perf':
      case 'plqp': {
        const key = tense === 'perf' ? 'pres' : 'pt';
        return AUX[v.auxWord][key].map((a, i) => [a + ' ' + v.pp].concat(v.auxAlt ? [AUX[v.auxAlt][key][i] + ' ' + v.pp] : []));
      }
      case 'fut1':
        return WERDEN.map(w => [w + ' ' + inf]);
      case 'k2': {
        const wuerde = WUERDE.map(w => w + ' ' + inf);
        let synth = null;
        if (v.k2) synth = k2Synthetic(v.k2);
        else if (v.kind === 'weak') synth = pretForms(v.pt);
        if (v.k2alt) synth = synth.map((list, i) => list.concat(k2Synthetic(v.k2alt)[i]));
        if (synth) synth = synth.map(list => list.map(f => withPrefix(v, f)));
        // Bij sein/haben/werden/modaal en kommen/gehen/geben is de enkelvoudige vorm de standaard, anders de würde-vorm.
        const synthFirst = v.kind === 'irr' || ['kommen', 'gehen', 'geben'].includes(v.base);
        return wuerde.map((w, i) => {
          // "würde sein", "würde können" e.d. leren we niet aan
          if (v.k2 && synthFirst) return v.kind === 'irr' ? synth[i] : synth[i].concat([w]);
          if (v.k2) return [w].concat(synth[i]);
          if (synth) return [w].concat(synth[i]);
          return [w];
        });
      }
      case 'imp':
        return imperative(v);
    }
    return null;
  }

  const DATA = parse();
  const api = { VERBS: DATA, PERSONS, PRONOUNS, TENSES, IMP_PERSONS, GROUPS, conjugate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WortPapagei = api;
})(typeof self !== 'undefined' ? self : this);
