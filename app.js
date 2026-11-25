/* WortPapagei — app-logica (oefenen, tabellen, resultaten). Werkt volledig offline. */
(function () {
  'use strict';
  const V = window.WortPapagei;
  const $ = (sel, el = document) => el.querySelector(sel);
  const root = document.documentElement;
  const view = $('#view');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const byId = Object.fromEntries(V.VERBS.map(v => [v.id, v]));
  const tenseById = Object.fromEntries(V.TENSES.map(t => [t.id, t]));
  const MODES = [
    { id: 'vervoegen', label: 'Vervoegen', sub: 'Typ de juiste vorm' },
    { id: 'stamtijden', label: 'Stamtijden', sub: 'Präsens, Präteritum, Partizip' },
    { id: 'klok', label: 'Tegen de klok', sub: 'Zoveel mogelijk in 60 seconden' },
    { id: 'fouten', label: 'Mijn fouten', sub: 'Herhaal wat je fout had' },
  ];
  const COUNTS = [10, 20, 30, 50];
  const modeLabel = id => (MODES.find(m => m.id === id) || {}).label || '';

  // ---------- Opslag ----------
  function load(key, fallback) {
    try { const raw = localStorage.getItem('wortpapagei.' + key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem('wortpapagei.' + key, JSON.stringify(value)); } catch (e) { /* opslag niet beschikbaar */ }
  }
  function forget(key) {
    try { localStorage.removeItem('wortpapagei.' + key); } catch (e) { /* opslag niet beschikbaar */ }
  }
  const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const num = x => typeof x === 'number' && isFinite(x) && x >= 0;
  function validKey(k) {
    const [id, tense, p] = String(k).split('|');
    const v = byId[id];
    if (!v) return false;
    if (tense === 'stamm') return true;
    const forms = tenseById[tense] && V.conjugate(v, tense);
    return !!forms && /^\d$/.test(p) && +p < forms.length;
  }
  // Oude of beschadigde gegevens mogen de app niet laten vastlopen: alleen geldige waarden overnemen.
  function cleanSettings(s) {
    const d = { mode: 'vervoegen', tenses: ['pres', 'pret', 'perf'], groups: ['sterk'], custom: [], useCustom: false, count: 20, showNl: true, vocabDir: 'de-nl', newPerDay: 20 };
    if (!isObj(s)) return d;
    if (MODES.some(m => m.id === s.mode)) d.mode = s.mode;
    if (Array.isArray(s.tenses)) d.tenses = s.tenses.filter(t => tenseById[t]);
    if (Array.isArray(s.groups)) d.groups = s.groups.filter(g => V.GROUPS.some(x => x.id === g));
    if (Array.isArray(s.custom)) d.custom = s.custom.filter(id => byId[id]);
    d.useCustom = s.useCustom === true && d.custom.length > 0;
    if (COUNTS.includes(s.count)) d.count = s.count;
    if (typeof s.showNl === 'boolean') d.showNl = s.showNl;
    if (['de-nl', 'nl-de', 'beide'].includes(s.vocabDir)) d.vocabDir = s.vocabDir;
    if ([10, 20, 30, 50].includes(s.newPerDay)) d.newPerDay = s.newPerDay;
    return d;
  }
  function cleanStore(s) {
    const d = { history: [], mistakes: {}, best: 0 };
    if (!isObj(s)) return d;
    if (Array.isArray(s.history)) {
      d.history = s.history
        .filter(x => isObj(x) && num(x.at) && num(x.ok) && num(x.total) && x.ok <= x.total && MODES.some(m => m.id === x.mode))
        .map(x => ({ at: x.at, mode: x.mode, ok: x.ok, total: x.total, secs: num(x.secs) ? x.secs : 0 }))
        .slice(0, 200);
    }
    if (isObj(s.mistakes)) for (const [k, n] of Object.entries(s.mistakes)) if (validKey(k) && num(n) && n > 0) d.mistakes[k] = Math.round(n);
    if (num(s.best)) d.best = Math.round(s.best);
    return d;
  }
  const settings = cleanSettings(load('settings', null));
  let store = cleanStore(load('store', null));
  const saveSettings = () => save('settings', settings);
  const saveStore = () => save('store', store);
  // Vraag de browser de gegevens niet zomaar op te ruimen.
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // Pictogrammen voor de papieren knoppen
  const svg = d => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const IC = {
    next: svg('M9 5l7 7-7 7'),
    back: svg('M15 5l-7 7 7 7'),
    check: svg('M4.5 12.5l5 5L19.5 7'),
    x: svg('M6 6l12 12M18 6L6 18'),
    redo: svg('M19 8.5A7.5 7.5 0 1 0 19.5 14M19 3.5v5h-5'),
    down: svg('M12 4v11M7 10l5 5 5-5M5 20h14'),
    up: svg('M12 15V4M7 9l5-5 5 5M5 20h14'),
    plus: svg('M12 5v14M5 12h14'),
    pen: svg('M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4'),
    cards: svg('M4 7h12v13H4zM8 4h12v13'),
    sound: svg('M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12'),
  };

  // ---------- Hulpfuncties ----------
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const grade = (ok, total) => total ? Math.max(1, Math.round((1 + 9 * ok / total) * 10) / 10) : 0;
  const fmtGrade = g => g.toFixed(1).replace('.', ',');
  const fmtTime = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
  const auxLabel = a => a === 'sein' ? 'ist' : 'hat';

  function pool() {
    if (settings.useCustom && settings.custom.length) return settings.custom.map(id => byId[id]).filter(Boolean);
    return V.VERBS.filter(v => settings.groups.includes(v.group));
  }
  function personLabel(tense, p) {
    return tense === 'imp' ? V.IMP_PERSONS[p] : V.PERSONS[p];
  }
  function norm(s) {
    return s.trim().replace(/[!.]+$/, '').trim().replace(/\s+/g, ' ').replace(/[’`´']/g, '').toLowerCase();
  }
  // Alleen het voornaamwoord dat bij de gevraagde persoon hoort mag ervoor staan.
  const PRON = [['ich'], ['du'], ['er/sie/es', 'er', 'sie', 'es', 'man'], ['wir'], ['ihr'], ['sie/sie', 'sie']];
  function stripPronoun(s, p) {
    for (const w of PRON[p] || []) if (s.startsWith(w + ' ')) return s.slice(w.length + 1);
    return s;
  }
  const plain = s => s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue');
  // Vergelijk een antwoord met de geldige vormen. Geeft 'ok', 'ss' (ss i.p.v. ß), 'uml' (ae i.p.v. ä) of 'bad'.
  // opts.p: persoon (voornaamwoord ervoor mag), opts.sie: Imperativ met Sie (Sie mag weg, het staat al voor het vak).
  function judge(input, answers, opts = {}) {
    let a = norm(input);
    if (opts.p != null) a = stripPronoun(a, opts.p);
    let list = answers.map(norm);
    if (opts.sie) {
      const dropSie = x => x.split(' ').filter(w => w !== 'sie').join(' ');
      a = dropSie(a); list = list.map(dropSie);
    }
    if (!a) return 'bad';
    if (list.includes(a)) return 'ok';
    if (list.map(x => x.replace(/ß/g, 'ss')).includes(a)) return 'ss';
    if (list.flatMap(x => [plain(x), plain(x.replace(/ß/g, 'ss'))]).includes(plain(a)) && !/[äöü]/.test(a)) return 'uml';
    return 'bad';
  }
  const mistakeKey = q => q.kind === 'stamm' ? q.v.id + '|stamm|0' : q.v.id + '|' + q.tense + '|' + q.p;
  function recordMistake(q) {
    const k = mistakeKey(q);
    store.mistakes[k] = (store.mistakes[k] || 0) + 1;
  }
  function clearMistake(q) { delete store.mistakes[mistakeKey(q)]; }
  const mistakeCount = () => Object.keys(store.mistakes).length;

  // ---------- Vragen maken ----------
  function conjQuestion(v, tense, p) {
    const forms = V.conjugate(v, tense);
    return { kind: 'conj', v, tense, p, answers: forms[p] };
  }
  function randomConj(verbs, tenses, last, persons) {
    for (let tries = 0; tries < 40; tries++) {
      const v = pick(verbs);
      const ok = tenses.filter(t => t !== 'imp' || V.conjugate(v, 'imp'));
      if (!ok.length) continue;
      const tense = pick(ok);
      const p = persons && tense !== 'imp' ? pick(persons) : v.only3 ? pick([2, 5]) : Math.floor(Math.random() * (tense === 'imp' ? 3 : 6));
      if (last && last.v === v && last.tense === tense && last.p === p) continue;
      return conjQuestion(v, tense, p);
    }
    return null;
  }
  function stammQuestion(v) {
    const pres = V.conjugate(v, 'pres')[2][0];
    const pret = V.conjugate(v, 'pret')[2][0];
    return { kind: 'stamm', v, fields: { pres: [pres], pret: [pret], pp: [v.pp] }, aux: [v.auxWord].concat(v.auxAlt || []) };
  }
  function buildQuestions(mode, n) {
    if (mode === 'fouten') {
      const keys = shuffle(Object.keys(store.mistakes)).slice(0, n);
      return keys.map(k => {
        const [id, tense, p] = k.split('|');
        const v = byId[id];
        if (!v) return null;
        return tense === 'stamm' ? stammQuestion(v) : conjQuestion(v, tense, +p);
      }).filter(Boolean);
    }
    const verbs = pool();
    if (!verbs.length) return [];
    if (mode === 'stamtijden') {
      const list = shuffle(verbs.slice());
      while (list.length < n) list.push(...shuffle(verbs.slice()));
      return list.slice(0, n).map(stammQuestion);
    }
    const qs = [];
    for (let i = 0; i < n; i++) {
      const q = randomConj(verbs, settings.tenses, qs[qs.length - 1]);
      if (q) qs.push(q);
    }
    return qs;
  }
  // Kan er met de huidige keuze een vraag gemaakt worden?
  function canBuild(mode) {
    if (mode === 'fouten') return mistakeCount() > 0;
    const verbs = pool();
    if (!verbs.length) return false;
    if (mode === 'stamtijden') return true;
    return settings.tenses.some(t => t !== 'imp' || verbs.some(v => V.conjugate(v, 'imp')));
  }

  // ---------- Ronde bewaren (iOS kan de app op de achtergrond afsluiten) ----------
  const serQ = q => ({ id: q.v.id, kind: q.kind, tense: q.tense, p: q.p, challenge: !!q.challenge });
  function deQ(x) {
    const v = isObj(x) && byId[x.id];
    if (!v) return null;
    if (x.kind === 'stamm') return stammQuestion(v);
    if (!validKey(`${x.id}|${x.tense}|${x.p}`)) return null;
    const q = conjQuestion(v, x.tense, x.p);
    if (x.challenge) q.challenge = true;
    return q;
  }
  function saveRound(d, i) {
    if (d.mode === 'klok' || d.done) return;
    save('round', { mode: d.mode, i, start: d.start, streak: d.streak || 0, at: Date.now(), qs: d.qs.map(serQ), results: d.results.map(r => ({ q: serQ(r.q), correct: r.correct, given: r.given })) });
  }
  function loadRound() {
    const r = load('round', null);
    if (!isObj(r) || !Array.isArray(r.qs) || !Array.isArray(r.results) || r.mode === 'klok' || !MODES.some(m => m.id === r.mode)) return null;
    if (!num(r.at) || Date.now() - r.at > 24 * 3600e3 || !num(r.i)) return null;
    const qs = r.qs.map(deQ);
    if (!qs.length || qs.some(q => !q) || r.i >= qs.length) return null;
    const results = r.results.map(x => ({ q: deQ(isObj(x) && x.q), correct: isObj(x) && x.correct === true, given: isObj(x) ? String(x.given ?? '') : '' }));
    if (results.some(x => !x.q)) return null;
    return { mode: r.mode, qs, i: r.i, ok: results.filter(x => x.correct).length, start: num(r.start) ? r.start : Date.now(), streak: num(r.streak) ? r.streak : 0, results, recent: [], phase: 'ask', done: false };
  }

  // ---------- Navigatie ----------
  let tab = 'oefenen';
  let drill = null;
  let timer = null;
  document.querySelectorAll('nav.tabs button').forEach(b => b.addEventListener('click', () => {
    if (drill && !drill.done) leaveDrill();
    study = null;
    setTab(b.dataset.tab);
  }));
  function setTab(t, arg) {
    tab = t;
    document.querySelectorAll('nav.tabs button').forEach(b => { if (b.dataset.tab === t) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (t === 'oefenen') renderSetup();
    else if (t === 'werkwoorden') arg ? renderVerb(arg) : renderVerbList();
    else if (t === 'woorden') renderDecks();
    else renderStats();
    window.scrollTo(0, 0);
  }
  function leaveDrill() {
    stopTimer();
    if (drill) clearTimeout(drill.auto);
    drill = null;
    setDrillMode(false);
  }

  // ---------- Oefenen: instellingen ----------
  function renderSetup() {
    setDrillMode(false);
    const mode = settings.mode;
    const usesTenses = mode === 'vervoegen' || mode === 'klok';
    const usesVerbs = mode !== 'fouten';
    const counts = Object.fromEntries(V.GROUPS.map(g => [g.id, V.VERBS.filter(v => v.group === g.id).length]));
    const nPool = pool().length;
    const mc = mistakeCount();
    const canStart = canBuild(mode);
    let why = '';
    if (!canStart) {
      if (mode === 'fouten') why = '';
      else if (!nPool) why = 'Kies minstens één groep werkwoorden.';
      else if (!settings.tenses.length) why = 'Kies minstens één tijd.';
      else why = 'Deze werkwoorden hebben geen gebiedende wijs. Kies er nog een tijd bij.';
    }
    const saved = loadRound();

    view.innerHTML = `
      <div class="hero"><img src="assets/parrot.webp" alt="Papegaai van gevouwen papier"><div class="bubble">Wort für Wort zu besserem Deutsch.<small>${mc ? `Je hebt ${mc} ${mc === 1 ? 'vorm' : 'vormen'} om te herhalen.` : 'Kies hieronder wat je wilt oefenen.'}</small></div></div>
      ${saved ? `<div class="resume"><div><b>Je was nog bezig</b><span>${esc(modeLabel(saved.mode))}: vraag ${saved.i + 1} van ${saved.qs.length}</span></div>
        <button class="btn mustard sm" id="resume" type="button">Verder ${IC.next}</button>
        <button class="close" id="dropRound" type="button" aria-label="Ronde weggooien">${IC.x}</button></div>` : ''}
      <section class="block">
        <p class="label">Oefenvorm</p>
        <div class="modes">
          ${MODES.map(m => `<button class="mode" data-mode="${m.id}" aria-pressed="${m.id === mode}">
            <b>${m.label}${m.id === 'fouten' && mc ? ` <span class="n">(${mc})</span>` : ''}</b><span>${m.sub}</span></button>`).join('')}
        </div>
      </section>
      ${usesTenses ? `<section class="block">
        <p class="label">Tijden</p>
        <div class="chips">${V.TENSES.map(t => `<button class="chip" data-tense="${t.id}" aria-pressed="${settings.tenses.includes(t.id)}">${t.label}</button>`).join('')}</div>
      </section>` : ''}
      ${usesVerbs ? `<section class="block">
        <p class="label">Werkwoorden</p>
        <div class="chips">${V.GROUPS.map(g => `<button class="chip" data-group="${g.id}" aria-pressed="${!settings.useCustom && settings.groups.includes(g.id)}">${g.label}<span class="n">${counts[g.id]}</span></button>`).join('')}
          <button class="chip" id="pickCustom" aria-pressed="${settings.useCustom}">Zelf kiezen${settings.useCustom ? `<span class="n">${settings.custom.length}</span>` : ''}</button>
        </div>
        <p class="hint">${nPool ? `${nPool} werkwoorden in de selectie.` : 'Kies minstens één groep werkwoorden.'}</p>
      </section>` : `<section class="block"><p class="hint">${mc ? `${mc} vormen die je eerder fout had. Een goed antwoord haalt de vorm uit deze lijst.` : 'Je hebt nog geen fouten verzameld. Fouten uit andere oefeningen komen hier vanzelf terecht.'}</p></section>`}
      ${mode !== 'klok' ? `<section class="block">
        <p class="label">Aantal vragen</p>
        <div class="chips">${COUNTS.map(n => `<button class="chip" data-count="${n}" aria-pressed="${settings.count === n}">${n}</button>`).join('')}</div>
      </section>` : ''}
      <section class="block">
        <div class="chips"><button class="chip" id="toggleNl" aria-pressed="${settings.showNl}">Toon Nederlandse betekenis</button></div>
      </section>
      <div class="startbar">
        ${why ? `<p class="hint warn" role="status">${why}</p>` : ''}
        <button class="btn" id="start" ${canStart ? '' : 'disabled'}>Aan de slag ${IC.next}</button>
      </div>
    `;
    view.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { settings.mode = b.dataset.mode; saveSettings(); renderSetup(); });
    view.querySelectorAll('[data-tense]').forEach(b => b.onclick = () => {
      const t = b.dataset.tense;
      settings.tenses = settings.tenses.includes(t) ? settings.tenses.filter(x => x !== t) : settings.tenses.concat(t);
      saveSettings(); renderSetup();
    });
    view.querySelectorAll('[data-group]').forEach(b => b.onclick = () => {
      const g = b.dataset.group;
      if (settings.useCustom) { settings.useCustom = false; settings.groups = [g]; }
      else settings.groups = settings.groups.includes(g) ? settings.groups.filter(x => x !== g) : settings.groups.concat(g);
      saveSettings(); renderSetup();
    });
    view.querySelectorAll('[data-count]').forEach(b => b.onclick = () => { settings.count = +b.dataset.count; saveSettings(); renderSetup(); });
    const pc = $('#pickCustom'); if (pc) pc.onclick = renderPicker;
    $('#toggleNl').onclick = () => { settings.showNl = !settings.showNl; saveSettings(); renderSetup(); };
    $('#start').onclick = startDrill;
    if (saved) {
      $('#resume').onclick = () => { drill = saved; renderQuestion(); };
      $('#dropRound').onclick = () => { forget('round'); renderSetup(); };
    }
  }

  function renderPicker() {
    let q = '';
    const chosen = new Set(settings.custom);
    view.innerHTML = `
      <div class="pickhead">
        <div class="row" style="align-items:center"><h2>Kies werkwoorden</h2><button class="btn dark sm" id="done" style="flex:0 0 auto;width:auto">${IC.check} Klaar</button></div>
        <input class="search" id="q" type="search" placeholder="Zoek in het Duits of Nederlands" autocomplete="off" autocapitalize="off" spellcheck="false">
        <div class="row"><button class="btn ghost sm" id="all">${IC.check} Alles in lijst</button><button class="btn ghost sm" id="none">${IC.x} Niets</button></div>
        <p class="hint" id="cnt"></p>
      </div>
      <div class="list" id="vl"></div>`;
    window.scrollTo(0, 0);
    const draw = () => {
      const list = V.VERBS.filter(v => !q || v.inf.includes(q) || v.nl.toLowerCase().includes(q));
      $('#vl').innerHTML = list.map(v => `<label class="verbrow"><b>${esc(v.inf)}</b><span>${esc(v.nl)}</span><input type="checkbox" class="tick" data-id="${esc(v.id)}" ${chosen.has(v.id) ? 'checked' : ''}></label>`).join('') || '<div class="muted">Niets gevonden.</div>';
      $('#cnt').textContent = `${chosen.size} gekozen`;
      view.querySelectorAll('#vl input').forEach(i => i.onchange = () => { i.checked ? chosen.add(i.dataset.id) : chosen.delete(i.dataset.id); $('#cnt').textContent = `${chosen.size} gekozen`; });
      return list;
    };
    let shown = draw();
    $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); shown = draw(); };
    $('#all').onclick = () => { shown.forEach(v => chosen.add(v.id)); shown = draw(); };
    $('#none').onclick = () => { chosen.clear(); shown = draw(); };
    $('#done').onclick = () => {
      settings.custom = [...chosen];
      settings.useCustom = chosen.size > 0;
      saveSettings(); renderSetup(); window.scrollTo(0, 0);
    };
  }

  // ---------- Oefenen: drill ----------
  function startDrill() {
    const mode = settings.mode;
    if (!canBuild(mode)) { renderSetup(); return; }
    const n = mode === 'klok' ? 400 : settings.count;
    const qs = buildQuestions(mode, n);
    if (!qs.length) { renderSetup(); return; }
    forget('round');
    drill = { mode, qs, i: 0, ok: 0, start: Date.now(), phase: 'ask', done: false, results: [], recent: [], streak: 0 };
    if (mode === 'klok') {
      drill.deadline = Date.now() + 60000;
      timer = setInterval(tick, 200);
    }
    renderQuestion();
  }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; }
  function tick() {
    if (!drill || drill.done) return stopTimer();
    const left = Math.max(0, drill.deadline - Date.now());
    const c = $('#clock');
    if (c) { c.textContent = Math.ceil(left / 1000); c.classList.toggle('low', left < 10000); }
    if (!left) { stopTimer(); finishDrill(); }
  }

  // Tijdens een les vult het oefenscherm precies het zichtbare deel (ook als het toetsenbord open is).
  const vv = window.visualViewport;
  function setDrillMode(on) {
    document.body.classList.toggle('in-drill', on);
    root.classList.toggle('in-drill', on);
    if (!on) view.scrollTop = 0;
    fitDrill();
  }
  function fitDrill() {
    const h = vv ? vv.height : window.innerHeight;
    root.style.setProperty('--vvh', Math.round(h) + 'px');
    root.style.setProperty('--vvt', Math.round(vv ? vv.offsetTop : 0) + 'px');
    document.body.classList.toggle('short', h < 600);
    document.body.classList.toggle('kb', !!vv && window.innerHeight - h > 120);
  }
  // Laat de kaart vanaf de tijdnaam tot en met de knoppen zien; de papegaai mag dan wegschuiven.
  function showCard() {
    const card = $('#qform'), bar = $('.drillbar');
    if (!card || !bar || !document.body.classList.contains('in-drill')) return;
    const h = view.clientHeight;
    const top = card.offsetTop - bar.offsetHeight - 6;
    const bottom = card.offsetTop + card.offsetHeight + 12 - h;
    view.scrollTop = Math.max(0, Math.min(top, bottom));
    // Na Controleer gaat de uitleg voor: het goede antwoord mag niet achter de knoppen verdwijnen.
    const fb = $('#fb'), actions = $('#actions');
    if (drill && drill.phase === 'shown' && fb && actions) {
      const hidden = fb.getBoundingClientRect().bottom - actions.getBoundingClientRect().top + 8;
      if (hidden > 0) view.scrollTop += hidden;
    }
  }
  if (vv) {
    const onVV = () => { fitDrill(); if (document.body.classList.contains('in-drill')) requestAnimationFrame(showCard); };
    vv.addEventListener('resize', onVV);
    vv.addEventListener('scroll', fitDrill);
  } else {
    window.addEventListener('resize', () => { fitDrill(); showCard(); });
  }

  function drillBar() {
    const d = drill;
    if (d.mode === 'klok') {
      return `<div class="drillbar"><button class="close" id="stop" type="button" aria-label="Stoppen">${IC.x}</button><span class="clock" id="clock">60</span><span style="flex:1">seconden</span><span><b id="okc">${d.ok}</b> goed</span></div>`;
    }
    const pct = Math.round(d.i / d.qs.length * 100);
    return `<div class="drillbar"><button class="close" id="stop" type="button" aria-label="Stoppen">${IC.x}</button><div class="progress"><i style="width:${pct}%"></i></div><span>${d.i + 1}/${d.qs.length}</span></div>`;
  }
  const inputAttrs = 'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"';
  const umlautKeys = `<div class="keys" role="group" aria-label="Speciale letters">${['ä', 'ö', 'ü', 'ß'].map(k => `<button type="button" data-key="${k}">${k}</button>`).join('')}</div>`;

  // ---------- Papegaai als coach ----------
  const HAPPY = ['Richtig!', 'Super!', 'Klasse!', 'Genau!', 'Sehr gut!', 'Prima!', 'Toll gemacht!', 'Wunderbar!'];
  const SAD = ['Fast!', 'Nicht ganz.', 'Kein Problem, weiter!', 'Das lernst du noch.', 'Hoppla!', 'Beim nächsten Mal!'];
  const ASK = ['Wie heißt die Form?', 'Du schaffst das!', 'Und jetzt diese.', 'Konzentrier dich!', 'Weiter so!'];
  function askLine(d) {
    if (d.i === 0) return d.mode === 'klok' ? 'Schnell, schnell!' : 'Los geht\'s!';
    if (d.i === d.qs.length - 1 && d.mode !== 'klok') return 'Die letzte Frage!';
    if (d.streak >= 3) return 'Du bist on fire!';
    return pick(ASK);
  }
  const sfx = name => { try { window.WortPapageiSound && window.WortPapageiSound.play(name); } catch (e) { /* geen geluid */ } };
  function coach(state, text) {
    const c = $('#coach'); if (!c) return;
    if (!c.classList.contains(state) || state !== 'think') {
      const guest = c.classList.contains('has-guest');
      c.className = 'coach';
      void c.offsetWidth; // animatie opnieuw starten
      c.classList.add(state);
      if (guest) c.classList.add('has-guest');
    }
    const say = $('#say'); if (say && say.textContent !== text) say.textContent = text;
  }

  // ---------- Bijfiguren: de raaf (uitdager) en de kanarie (motivator) ----------
  // Kanarie: bij 3 fouten in de laatste 5 antwoorden, daarna minstens 4 vragen rust.
  // Raaf: bij 5 goed op rij, hooguit eens per 8 vragen; hij stelt dan een moeilijkere vraag.
  const GUESTS = {
    canary: { img: 'assets/canary.webp', alt: 'Kanarie', name: 'Der Motivator' },
    raven: { img: 'assets/raven.webp', alt: 'Raaf', name: 'Der Herausforderer' },
  };
  const CHEER = ['Kopf hoch!', 'Nicht aufgeben!', 'Fehler sind okay!', 'Du lernst gerade viel!', 'Tief durchatmen!'];
  const DARE = ['Zu einfach für dich? Dann versuch mal diese!', 'Fünf richtig? Mal sehen, ob du das auch kannst…', 'Ich habe eine schwierigere Frage für dich.', 'Glück oder Können? Beweis es!'];
  const HARD_TENSES = ['plqp', 'k2', 'imp', 'pret', 'perf'];

  function sideCharacters(d, q, correct) {
    d.recent = (d.recent || []).concat(correct).slice(-5);
    if (q.challenge) {
      d.guest = { kind: 'raven', text: correct ? 'Hmpf. Nicht schlecht!' : 'Ha! Erwischt.', tip: correct ? 'Beim nächsten Mal wird es schwerer.' : 'Das war aber auch eine schwere.', until: d.i };
      return showGuest(d.guest, true);
    }
    const wrongs = d.recent.filter(x => !x).length;
    if (!correct && wrongs >= 3 && d.i - (d.lastCanary ?? -99) >= 5) {
      d.lastCanary = d.i;
      d.canaryHelp = d.i < d.qs.length - 1;
      d.guest = { kind: 'canary', text: pick(CHEER), tip: d.canaryHelp ? 'Bei der nächsten Frage helfe ich dir.' : 'Gleich hast du es geschafft.', until: d.i };
      return showGuest(d.guest, true);
    }
    if (correct && d.streak >= 5 && d.i - (d.lastRaven ?? -99) >= 8 && d.i < d.qs.length - 1) {
      d.lastRaven = d.i;
      const hard = q.kind === 'conj' && d.mode !== 'fouten' ? challengeQuestion(d) : null;
      d.challengeQ = hard;
      d.guest = { kind: 'raven', text: hard ? pick(DARE) : 'Nicht schlecht. Aber kennst du wirklich alle Stammformen?', tip: hard ? 'Die nächste Frage kommt von mir.' : '', until: d.i };
      // Eerst feliciteert de papegaai, daarna duikt de raaf op (bij de klok is daar geen tijd voor).
      return showGuest(d.guest, true, d.mode === 'klok' ? 0 : 1000);
    }
  }

  // Tip van de kanarie over precies de vraag die de speler nu ziet. De tip noemt de regel, niet het antwoord:
  // geen hulpwerkwoord, geen voorvoegsel en geen infinitief van deze vraag.
  function verbType(v) {
    if (v.group === 'modaal') return 'ein Modalverb';
    if (v.kind === 'irr') return 'ein unregelmäßiges Verb';
    if (v.kind === 'weak') return 'ein schwaches (regelmäßiges) Verb';
    if (/te$/.test(v.pt)) return 'ein gemischtes Verb';
    return 'ein starkes Verb';
  }
  const firstWord = s => s.split(' ')[0];
  function hintFor(q) {
    const v = q.v;
    const sep = v.prefix ? ' Trennbar: das Präfix steht am Ende.' : '';
    const ppEnd = /t$/.test(v.pp) ? '-t' : '-en';
    const noGe = !/^ge/.test(v.pp.slice(v.prefix.length));
    const auxRule = v.auxAlt ? 'Hier sind haben und sein beide richtig.' : 'haben oder sein? sein bei Bewegung von A nach B, bei Veränderung und bei sein/bleiben.';
    if (q.kind === 'stamm') {
      let rule;
      if (v.kind === 'irr') rule = 'Diese Formen musst du auswendig kennen.';
      else if (v.kind === 'weak') rule = `Präteritum mit -te, Partizip ${noGe ? 'ohne ge-' : 'mit ge-'} und auf -t.`;
      else if (/te$/.test(v.pt)) rule = 'Neuer Stamm, aber trotzdem -te und Partizip auf -t.';
      else rule = `Präteritum ohne -te, Partizip auf ${ppEnd}. Bei er ${stemVowelChanges(v) ? 'ändert sich' : 'bleibt'} der Vokal im Präsens.`;
      return `${verbType(v)[0].toUpperCase() + verbType(v).slice(1)}. ${rule}`;
    }
    const who = personLabel(q.tense, q.p);
    const ans = firstWord(q.answers[0]);
    switch (q.tense) {
      case 'pres': {
        if (v.group === 'modaal') return ['Modalverb: keine Endung, Vokal wie im Singular.', 'Modalverb: Vokal wie bei ich, dazu -st.', 'Modalverb: keine Endung, Vokal wie bei ich.', 'Endung -en.', 'Modalverb: Vokal wie bei wir, dazu -t.', 'Endung -en.'][q.p];
        if (v.kind === 'irr') return 'Unregelmäßig: diese Form musst du auswendig kennen.';
        if (v.kind === 'strong' && (q.p === 1 || q.p === 2) && stemVowelChanges(v)) return `Bei ${who} ändert sich hier der Stammvokal.${sep}`;
        const stem = stemPlain(v);
        let extra = '';
        if (q.p === 0 && /eln$/.test(v.base)) extra = ' Bei -eln fällt bei ich das e vor dem l weg.';
        else if (ans.startsWith(stem) && /^e(st|t)$/.test(ans.slice(stem.length))) extra = ' Achtung: vor der Endung kommt ein -e-.';
        else if (q.p === 1 && /(s|ß|z|x)$/.test(stem)) extra = ' Nach s, ß oder z bekommt du nur -t.';
        return `Stamm „${stem}“ + Endung für ${who}.${extra}${sep}`;
      }
      case 'pret': {
        const endings = q.p === 0 || q.p === 2 ? ` Bei ${who} keine Endung.` : '';
        if (v.group === 'modaal') return `Modalverb: Präteritum ohne Umlaut, mit -te.${v.base === 'mögen' ? ' Und g wird zu ch.' : ''}`;
        if (v.kind === 'irr') return /e$/.test(v.pt) ? 'Unregelmäßig, auswendig lernen. Bei ich und er/sie/es endet die Form auf -e.' : `Unregelmäßiger Stamm, auswendig lernen.${endings}`;
        if (v.kind === 'weak') return `${verbType(v)[0].toUpperCase() + verbType(v).slice(1)}: Stamm + ${/ete$/.test(v.pt) ? '-ete' : '-te'} + Endung.${sep}`;
        if (/te$/.test(v.pt)) return `Gemischtes Verb: neuer Stamm und trotzdem -te.${sep}`;
        return `Starkes Verb: neuer Stammvokal, kein -te.${endings}${sep}`;
      }
      case 'perf':
      case 'plqp': {
        const form = q.tense === 'perf' ? 'Präsens' : 'Präteritum';
        return `Hilfsverb im ${form} + Partizip auf ${ppEnd}${noGe ? ' (ohne ge-)' : ''}. ${auxRule}`;
      }
      case 'fut1': return `werden für ${who} + Infinitiv ganz am Ende.`;
      case 'k2': {
        if (q.answers[0].startsWith('würd') && v.base !== 'werden') return `Einfach: würde für ${who} + Infinitiv.`;
        const k2 = v.k2 || '';
        const umlaut = /[äöü]/.test(k2) && !/[äöü]/.test(v.pt);
        if (k2 === v.pt) return 'Hier ist der Konjunktiv II gleich wie das Präteritum.';
        const base = umlaut ? (/e$/.test(v.pt) ? 'Präteritum mit Umlaut' : 'Präteritum mit Umlaut + -e') : 'Präteritum + -e';
        return `Hier sagt man die Kurzform: ${base}${q.p === 0 || q.p === 2 ? '' : `, dazu die Endung für ${who}`}.`;
      }
      case 'imp':
        if (q.p === 2) return v.kind === 'irr' && !q.answers[0].startsWith(v.inf + ' ') ? 'Achtung, unregelmäßig: nicht wie der Infinitiv.' : `Wie der Infinitiv, Sie steht schon da.${sep}`;
        if (q.p === 1) return `Wie die ihr-Form im Präsens, nur ohne ihr.${sep}`;
        if (v.kind === 'irr') return 'Unregelmäßig: kurz und ohne -st.';
        if (stemVowelChanges(v) && !/[äöü]/.test(v.p3 || '')) return `Ohne Endung, und der Vokal e wird zu i oder ie.${sep}`;
        if (/e$/.test(ans)) return `Stamm + -e.${sep}`;
        return `Nur der Stamm, ohne Endung${/[äöü]/.test(v.p3 || '') && !/[äöü]/.test(v.base) ? ' und ohne Umlaut' : ''}.${sep}`;
    }
    return '';
  }
  function stemPlain(v) { return v.base.endsWith('en') ? v.base.slice(0, -2) : v.base.slice(0, -1); }
  function stemVowelChanges(v) {
    if (v.kind !== 'strong') return false;
    const stem = stemPlain(v);
    const reg = stem + (/[dt]$/.test(stem) ? 'et' : 't');
    return v.p3 !== reg && !(/(s|ß|z|x)$/.test(stem) && v.p3 === stem + 't');
  }

  // De raaf kiest uit de eigen selectie iets moeilijkers: een sterk werkwoord en/of een lastige tijd.
  function challengeQuestion(d) {
    const verbs = pool();
    const strong = verbs.filter(v => v.kind !== 'weak');
    const hard = HARD_TENSES.filter(t => settings.tenses.includes(t));
    const last = d.qs[d.i];
    let q = null;
    if (hard.length && (strong.length || verbs.length)) q = randomConj(strong.length ? strong : verbs, hard, last);
    else if (settings.tenses.includes('pres')) {
      const changing = verbs.filter(stemVowelChanges);
      if (changing.length) q = randomConj(changing, ['pres'], last, [1, 2]);
    }
    if (!q) return null;
    q.challenge = true; q.challengeText = 'Na, schaffst du diese?';
    return q;
  }

  function showGuest(g, animate, delay) {
    const d = drill;
    const put = () => {
      const c = $('#coach'), el = $('#guest'); if (!c || !el || drill !== d) return;
      const info = GUESTS[g.kind];
      $('#gimg').src = info.img; $('#gimg').alt = info.alt;
      $('#gtag').textContent = info.name;
      $('#gsay').textContent = g.text;
      $('#gname').textContent = g.tip || '';
      el.className = 'guest ' + g.kind + (animate ? ' enter' : '');
      if (animate) sfx(g.kind);
      c.classList.add('has-guest');
    };
    clearTimeout(d && d.guestT);
    if (delay && d) d.guestT = setTimeout(put, delay); else put();
  }

  function renderQuestion() {
    const d = drill;
    setDrillMode(true);
    const q = d.qs[d.i];
    d.phase = 'ask';
    d.readyAt = Date.now() + 350; // dubbele tik op Verder levert de nieuwe kaart niet meteen in
    const nl = settings.showNl ? `<p class="nl">${esc(q.v.nl)}</p>` : '';
    let body;
    if (q.kind === 'conj') {
      const t = tenseById[q.tense];
      const sie = q.tense === 'imp' && q.p === 2;
      body = `
        <span class="tense">${t.label}<small>${t.nl}</small></span>
        <div class="vh"><p class="verb">${esc(q.v.inf)}</p>${nl}</div>
        <div class="ask"><span class="pron">${esc(personLabel(q.tense, q.p))}</span>
          <input class="answer" id="ans" ${inputAttrs} enterkeyhint="go" aria-label="Jouw antwoord" placeholder="${q.tense === 'imp' ? (sie ? 'zonder Sie is ook goed' : 'gebiedende wijs') : '…'}"></div>
        ${umlautKeys}
        <div id="fb"></div>`;
    } else {
      body = `
        <span class="tense">Stamtijden</span>
        <div class="vh"><p class="verb">${esc(q.v.inf)}</p>${nl}</div>
        <div class="forms">
          <label for="f-pres">er (Präsens)</label><input class="answer" id="f-pres" ${inputAttrs} enterkeyhint="next">
          <label for="f-pret">er (Präteritum)</label><input class="answer" id="f-pret" ${inputAttrs} enterkeyhint="next">
          <label for="f-pp">Partizip II</label><input class="answer" id="f-pp" ${inputAttrs} enterkeyhint="go">
          <label>Perfekt met</label>
          <div class="auxpick" role="radiogroup" aria-label="Hulpwerkwoord"><button type="button" class="chip" data-aux="haben" aria-pressed="false">hat</button><button type="button" class="chip" data-aux="sein" aria-pressed="false">ist</button></div>
        </div>
        ${umlautKeys}
        <div id="fb"></div>`;
    }
    view.innerHTML = `${drillBar()}
      <div class="coach idle" id="coach" aria-live="polite">
        <div class="bird"><img src="assets/parrot.webp" alt="Papegaai"><span class="marks" aria-hidden="true"><i></i><i></i><i></i></span><span class="huh" aria-hidden="true">?</span><span class="dots" aria-hidden="true">…</span></div>
        <div class="bubble" id="say">${esc(askLine(d))}</div>
        <div class="guest" id="guest" aria-live="polite"><div class="bubble gb"><span id="gsay"></span><small id="gname"></small></div><div class="gfig"><img id="gimg" alt=""><span class="gtag" id="gtag"></span></div></div>
      </div>
      <form class="card pop" id="qform" novalidate>${body}
        <div class="row" id="actions"><button class="btn" id="go" type="submit">Controleer ${IC.check}</button></div>
      </form>`;
    const inputs = [...view.querySelectorAll('.answer')];
    inputs.forEach(i => {
      i.addEventListener('input', () => { if (d.phase === 'ask') coach('think', i.value ? 'Hmm…' : askLine(d)); });
      // Na Controleer blijft het veld in focus (toetsenbord blijft open), maar typen kan dan niet meer.
      i.addEventListener('beforeinput', e => { if (d.phase !== 'ask' && e.inputType !== 'insertLineBreak') e.preventDefault(); });
      i.addEventListener('focus', () => { lastInput = i; setTimeout(showCard, 60); });
    });
    $('#stop').onclick = () => { stopTimer(); clearTimeout(d.auto); if (d.results.length) finishDrill(); else { forget('round'); drill = null; renderSetup(); } };
    let lastInput = inputs[0];
    view.querySelectorAll('[data-key]').forEach(b => {
      b.addEventListener('mousedown', e => e.preventDefault());
      b.onclick = () => {
        const i = lastInput; if (!i || d.phase !== 'ask') return;
        const s = i.selectionStart ?? i.value.length, e = i.selectionEnd ?? i.value.length;
        i.value = i.value.slice(0, s) + b.dataset.key + i.value.slice(e);
        i.focus(); i.setSelectionRange(s + 1, s + 1);
        i.dispatchEvent(new Event('input'));
      };
    });
    view.querySelectorAll('[data-aux]').forEach(b => b.onclick = () => {
      if (d.phase !== 'ask') return;
      view.querySelectorAll('[data-aux]').forEach(x => x.setAttribute('aria-pressed', x === b));
      $('.auxpick').classList.remove('need');
    });
    const submit = () => {
      if (Date.now() < d.readyAt || drill !== d) return;
      if (d.phase === 'ask') check(); else next();
    };
    $('#qform').onsubmit = e => { e.preventDefault(); submit(); };
    if (q.kind === 'stamm') {
      // Enter springt naar het volgende lege veld; pas als alles is ingevuld wordt de kaart beoordeeld.
      inputs.forEach((inp, k) => inp.addEventListener('keydown', e => {
        if (e.key !== 'Enter' || d.phase !== 'ask') return;
        e.preventDefault();
        const empty = inputs.slice(k + 1).concat(inputs.slice(0, k + 1)).find(x => !x.value.trim());
        if (empty) empty.focus(); else submit();
      }));
    }
    if (d.canaryHelp) {
      d.canaryHelp = false;
      d.guest = { kind: 'canary', text: 'Ich helfe dir!', tip: hintFor(q), until: d.i };
    }
    if (q.challenge) d.guest = { kind: 'raven', text: q.challengeText || 'Na, schaffst du diese?', tip: 'Eine schwere Frage für dich.', until: d.i };
    if (d.guest && d.guest.until >= d.i) showGuest(d.guest, false); else d.guest = null;
    if (d.mode === 'klok') tick();
    const first = inputs[0]; if (first) first.focus({ preventScroll: true });
    requestAnimationFrame(showCard);
  }

  function check() {
    const d = drill; const q = d.qs[d.i];
    let correct; let note = '';
    const fb = $('#fb');
    const ssNote = 'Goed gerekend, maar let op de ß.';
    const umlNote = 'Goed gerekend, maar schrijf ä, ö of ü.';
    if (q.kind === 'conj') {
      const inp = $('#ans');
      if (!inp.value.trim()) { inp.focus(); return; }
      const r = judge(inp.value, q.answers, { p: q.tense === 'imp' ? null : q.p, sie: q.tense === 'imp' && q.p === 2 });
      correct = r !== 'bad';
      if (r === 'ss') note = ssNote;
      if (r === 'uml') note = umlNote;
      inp.classList.add('locked', correct ? 'ok' : 'bad');
      const others = correct ? q.answers.filter(x => judge(inp.value, [x], { p: q.tense === 'imp' ? null : q.p, sie: q.tense === 'imp' && q.p === 2 }) === 'bad') : q.answers.slice(1);
      if (correct) {
        fb.innerHTML = `<div class="feedback ok"><span class="status">${IC.check} Goed gedaan!</span>${note ? `<span>${note}</span>` : ''}${others.length ? `<span class="alt">Ook goed: ${others.map(esc).join(', ')}</span>` : ''}</div>`;
      } else {
        fb.innerHTML = `<div class="feedback bad"><span class="status red">${IC.x} Helaas…</span><span class="wrong">${esc(inp.value.trim())}</span><span class="right">${q.tense === 'imp' ? '' : esc(personLabel(q.tense, q.p).split('/')[0]) + ' '}${esc(q.answers[0])}</span>${others.length ? `<span class="alt">Ook goed: ${others.map(esc).join(', ')}</span>` : ''}</div>`;
      }
      d.lastAnswer = inp.value.trim();
    } else {
      const ids = ['pres', 'pret', 'pp'];
      const inputs = ids.map(id => $('#f-' + id));
      const empty = inputs.find(i => !i.value.trim());
      if (empty) { empty.focus(); coach('think', 'Füll alle Felder aus.'); return; }
      const chosen = view.querySelector('[data-aux][aria-pressed="true"]');
      if (!chosen) {
        const ap = $('.auxpick'); ap.classList.remove('need'); void ap.offsetWidth; ap.classList.add('need');
        coach('think', 'hat oder ist?');
        return;
      }
      let all = true;
      const given = {};
      ids.forEach((id, k) => {
        const inp = inputs[k];
        given[id] = inp.value.trim();
        const r = judge(inp.value, q.fields[id], { p: id === 'pp' ? null : 2 });
        const ok = r !== 'bad';
        if (r === 'ss') note = ssNote;
        if (r === 'uml') note = umlNote;
        all = all && ok;
        inp.classList.add('locked', ok ? 'ok' : 'bad');
        if (!ok) inp.insertAdjacentHTML('afterend', `<span class="solution">${esc(q.fields[id][0])}</span>`);
      });
      const auxOk = q.aux.includes(chosen.dataset.aux);
      // Het juiste hulpwerkwoord wordt groen, een verkeerde eigen keuze rood.
      view.querySelectorAll('[data-aux]').forEach(b => {
        if (q.aux.includes(b.dataset.aux)) b.classList.add('ok');
        else if (b === chosen) b.classList.add('bad');
      });
      all = all && auxOk;
      correct = all;
      const summary = `er ${q.fields.pres[0]} · ${q.fields.pret[0]} · ${q.aux.map(auxLabel).join('/')} ${q.v.pp}`;
      fb.innerHTML = correct
        ? `<div class="feedback ok"><span class="status">${IC.check} Alles goed!</span>${note ? `<span>${note}</span>` : ''}</div>`
        : `<div class="feedback bad"><span class="status red">${IC.x} Helaas…</span><span class="right">${esc(summary)}</span></div>`;
      d.lastAnswer = `${given.pres} · ${given.pret} · ${auxLabel(chosen.dataset.aux)} ${given.pp}`;
    }
    d.phase = 'shown';
    $('#qform').classList.add('shown');
    d.readyAt = Date.now() + 300;
    d.lastCorrect = correct;
    // Bewaar de stand van vóór dit antwoord, zodat "Toch goed" alles terug kan draaien.
    d.undo = { streak: d.streak || 0, mistakes: store.mistakes[mistakeKey(q)], lastCanary: d.lastCanary, guest: d.guest };
    d.streak = correct ? (d.streak || 0) + 1 : 0;
    sfx(!correct ? 'bad' : d.streak >= 3 && d.streak % 2 ? 'streak' : 'ok');
    if (correct) coach('happy', d.streak >= 3 ? `${d.streak} richtig hintereinander!` : pick(HAPPY));
    else coach('sad', pick(SAD));
    sideCharacters(d, q, correct);
    apply(q, correct);
    const actions = $('#actions');
    if (correct) {
      actions.innerHTML = `<button class="btn mustard" id="go" type="submit">Verder ${IC.next}</button>`;
    } else {
      actions.innerHTML = `<button class="btn dark sm" type="button" id="override">${IC.check} Toch goed</button><button class="btn mustard" id="go" type="submit">Verder ${IC.next}</button>`;
      $('#override').onclick = () => {
        const u = d.undo;
        apply(q, true, true);
        d.streak = u.streak + 1;
        d.recent[d.recent.length - 1] = true;
        if (d.lastCanary === d.i) { d.lastCanary = u.lastCanary; d.canaryHelp = false; d.guest = u.guest; }
        next();
      };
    }
    // Houd het toetsenbord open: focus terug op een (vergrendeld) invoerveld.
    const keep = $('.answer'); if (keep) keep.focus({ preventScroll: true });
    requestAnimationFrame(showCard);
    if (d.mode === 'klok') {
      clearTimeout(d.auto);
      d.auto = setTimeout(() => { if (drill === d && !d.done && d.phase === 'shown') next(); }, correct ? 300 : 1400);
    }
  }

  // Verwerk één antwoord; met override wordt een fout antwoord alsnog goed gerekend.
  function apply(q, correct, override) {
    const d = drill;
    if (override) {
      const r = d.results[d.results.length - 1];
      if (r && !r.correct) { r.correct = true; d.ok++; }
      // In Mijn fouten haalt een goed antwoord de vorm weg; elders komt de oude telling terug.
      if (d.mode !== 'fouten' && d.undo && d.undo.mistakes) store.mistakes[mistakeKey(q)] = d.undo.mistakes;
      else clearMistake(q);
      saveStore();
      saveRound(d, d.i + 1);
      return;
    }
    d.results.push({ q, correct, given: d.lastAnswer });
    if (correct) { d.ok++; if (d.mode === 'fouten') clearMistake(q); }
    else recordMistake(q);
    saveStore();
    saveRound(d, d.i + 1);
    const okc = $('#okc'); if (okc) okc.textContent = d.ok;
  }

  function next() {
    const d = drill;
    if (!d || d.done) return;
    clearTimeout(d.auto);
    clearTimeout(d.guestT);
    d.i++;
    if (d.i >= d.qs.length) return finishDrill();
    if (d.challengeQ) {
      d.qs[d.i] = d.challengeQ;
      d.challengeQ = null;
    }
    renderQuestion();
  }

  function finishDrill() {
    const d = drill;
    if (!d || d.done) return;
    clearTimeout(d.auto);
    clearTimeout(d.guestT);
    setDrillMode(false);
    stopTimer();
    d.done = true;
    forget('round');
    const total = d.results.length;
    const secs = (Date.now() - d.start) / 1000;
    const entry = { at: Date.now(), mode: d.mode, ok: d.ok, total, secs: Math.round(secs) };
    let newBest = false;
    if (total) {
      store.history.unshift(entry);
      store.history = store.history.slice(0, 200);
      if (d.mode === 'klok' && d.ok > (store.best || 0)) { store.best = d.ok; newBest = true; }
      saveStore();
    }
    const wrong = d.results.filter(r => !r.correct);
    if (total) sfx(newBest ? 'record' : 'finish');
    const g = grade(d.ok, total);
    const head = d.mode === 'klok'
      ? `<div class="score"><div><div class="grade">${d.ok}</div><div class="grade-sub">goed in 60 seconden</div></div>
          <div class="muted">${newBest ? '<b>Nieuw record!</b>' : `Record: ${store.best}`}<br>${total} beantwoord</div></div>`
      : `<div class="score"><div><div class="grade${g < 5.5 ? ' low' : ''}">${total ? fmtGrade(g) : '–'}</div><div class="grade-sub">cijfer</div></div>
          <div class="muted">${d.ok} van ${total} goed<br>tijd ${fmtTime(secs)}</div></div>`;
    const pct = total ? d.ok / total : 0;
    const praise = d.mode === 'klok' ? (newBest ? 'Neuer Rekord!' : 'Gut gemacht!') : pct >= 0.9 ? 'Sehr gut!' : pct >= 0.7 ? 'Gut gemacht!' : pct >= 0.5 ? 'Weiter so!' : 'Übung macht den Meister.';
    const canAgain = canBuild(settings.mode);
    view.innerHTML = `
      <div class="hero"><img src="assets/parrot.webp" alt="Papegaai van gevouwen papier"><div class="bubble">${praise}<small>${esc(modeLabel(d.mode))}: klaar</small></div></div>
      ${head}
      ${wrong.length ? `<section class="block"><p class="label">Fout (${wrong.length})</p><div class="list">${wrong.map(r => {
        const q = r.q;
        const what = q.kind === 'conj' ? `${esc(q.v.inf)} · ${tenseById[q.tense].label} · ${esc(personLabel(q.tense, q.p))}` : `${esc(q.v.inf)} · stamtijden`;
        const right = q.kind === 'conj' ? q.answers[0] : `${q.fields.pres[0]} · ${q.fields.pret[0]} · ${q.aux.map(auxLabel).join('/')} ${q.v.pp}`;
        return `<div><span class="k">${what}<br><s>${esc(r.given || '–')}</s></span><span class="v"><b>${esc(right)}</b></span></div>`;
      }).join('')}</div></section>` : (total ? '<p class="hint">Geen enkele fout.</p>' : '')}
      <div class="row">
        ${wrong.length ? `<button class="btn blue" id="redo">Herhalen ${IC.redo}</button>` : ''}
        ${canAgain ? `<button class="btn mustard" id="again">Nog eens ${IC.next}</button>` : ''}
      </div>
      <button class="btn ghost" id="back">${IC.back} ${canAgain ? 'Terug' : 'Andere oefening'}</button>`;
    window.scrollTo(0, 0);
    const redo = $('#redo');
    if (redo) redo.onclick = () => {
      // Herhaalronde: dezelfde vragen, zonder de raaf die er eerder bij stond.
      const qs = shuffle(wrong.map(r => Object.assign({}, r.q, { challenge: false })));
      drill = { mode: d.mode === 'klok' ? 'vervoegen' : d.mode, qs, i: 0, ok: 0, start: Date.now(), phase: 'ask', done: false, results: [], recent: [], streak: 0 };
      renderQuestion();
    };
    const again = $('#again'); if (again) again.onclick = startDrill;
    $('#back').onclick = () => { drill = null; renderSetup(); window.scrollTo(0, 0); };
  }

  // ---------- Werkwoorden ----------
  let listQuery = '';
  function renderVerbList() {
    view.innerHTML = `
      <h2>Werkwoorden</h2>
      <input class="search" id="q" type="search" placeholder="Zoek, bijvoorbeeld fahren of zwemmen" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(listQuery)}">
      <div class="list" id="vl"></div>`;
    const draw = () => {
      const q = listQuery.toLowerCase();
      const list = V.VERBS.filter(v => !q || v.inf.includes(q) || v.nl.toLowerCase().includes(q)).sort((a, b) => a.inf.localeCompare(b.inf, 'de'));
      $('#vl').innerHTML = list.map(v => `<button class="verbrow" data-id="${esc(v.id)}"><b>${esc(v.inf)}</b><span>${esc(v.nl)}</span></button>`).join('') || '<div class="muted">Niets gevonden.</div>';
      view.querySelectorAll('.verbrow').forEach(b => b.onclick = () => renderVerb(b.dataset.id));
    };
    draw();
    $('#q').oninput = e => { listQuery = e.target.value.trim(); draw(); };
  }
  function renderVerb(id) {
    const v = byId[id];
    const p3 = V.conjugate(v, 'pres')[2][0];
    const pt = V.conjugate(v, 'pret')[2][0];
    const tables = V.TENSES.map(t => {
      const f = V.conjugate(v, t.id);
      if (!f) return '';
      const persons = t.id === 'imp' ? V.IMP_PERSONS : V.PERSONS;
      return `<div class="list"><h3>${t.label} <span class="muted" style="font-weight:400">· ${t.nl}</span></h3><div class="tablewrap"><table class="conj">${f.map((forms, i) =>
        v.only3 && i !== 2 && i !== 5 ? '' :
        `<tr><th>${persons[i]}</th><td>${esc(forms[0])}${forms.length > 1 ? ` <span class="muted">(${forms.slice(1).map(esc).join(', ')})</span>` : ''}</td></tr>`).join('')}</table></div></div>`;
    }).join('');
    view.innerHTML = `
      <button class="btn ghost sm" id="back" style="align-self:flex-start;width:auto">${IC.back} Alle werkwoorden</button>
      <div><p class="verb">${esc(v.inf)}</p><p class="nl">${esc(v.nl)}</p></div>
      <div class="list" style="padding:12px 14px"><p class="label" style="margin-bottom:4px">Stamtijden</p>
        <div class="stamm">${esc(v.inf)} · ${esc(p3)} · ${esc(pt)} · ${[v.auxWord].concat(v.auxAlt || []).map(auxLabel).join('/')} ${esc(v.pp)}</div></div>
      <button class="btn" id="practice">Oefen dit werkwoord ${IC.next}</button>
      <div class="tables">${tables}</div>`;
    window.scrollTo(0, 0);
    $('#back').onclick = renderVerbList;
    $('#practice').onclick = () => {
      settings.custom = [v.id]; settings.useCustom = true;
      if (settings.mode === 'fouten') settings.mode = 'vervoegen';
      saveSettings(); setTab('oefenen');
    };
  }

  // ---------- Woordenkaarten: herhalen met tussenpozen, zoals Anki ----------
  // Elke kaart heeft een toestand: leren (stappen van 1 en 10 minuten), herhalen (interval in dagen, groeit met de
  // 'ease') of opnieuw leren na een fout. Een dag begint om 4 uur 's nachts, net als in Anki.
  const LEVELS = [
    { id: 'A1', name: 'Beginner' }, { id: 'A2', name: 'Elementair' }, { id: 'B1', name: 'Halfgevorderd' },
    { id: 'B2', name: 'Gevorderd' }, { id: 'C1', name: 'Vergevorderd' },
  ];
  const MIN = 6e4, DAY = 864e5, STEPS = [1, 10], LEARN_AHEAD = 20 * MIN;
  const RATES = [
    { r: 1, label: 'Opnieuw', cls: '' }, { r: 2, label: 'Moeilijk', cls: 'blue' },
    { r: 3, label: 'Goed', cls: 'dark' }, { r: 4, label: 'Makkelijk', cls: 'mustard' },
  ];
  let study = null;

  function cleanSrs(s) {
    const d = { cards: {}, newDay: { day: '', counts: {} } };
    if (!isObj(s)) return d;
    if (isObj(s.cards)) for (const [k, c] of Object.entries(s.cards)) {
      if (k.length > 400 || !isObj(c) || !['learn', 'relearn', 'review'].includes(c.s) || !num(c.due) || !num(c.ivl) || !num(c.ease) || !num(c.step)) continue;
      d.cards[k] = { s: c.s, step: Math.min(STEPS.length - 1, Math.round(c.step)), due: c.due, ivl: c.ivl, ease: Math.min(5, Math.max(1.3, c.ease)), reps: num(c.reps) ? c.reps : 0, lapses: num(c.lapses) ? c.lapses : 0 };
    }
    if (isObj(s.newDay) && typeof s.newDay.day === 'string' && isObj(s.newDay.counts)) {
      d.newDay.day = s.newDay.day;
      for (const [k, n] of Object.entries(s.newDay.counts)) if (typeof n === 'number' && isFinite(n)) d.newDay.counts[k] = n;
    }
    return d;
  }
  function cleanSets(s) {
    if (!Array.isArray(s)) return [];
    const str = (x, n) => typeof x === 'string' ? x.trim().slice(0, n) : '';
    return s.filter(x => isObj(x) && /^eigen-[\w-]{1,40}$/.test(x.id) && Array.isArray(x.items)).slice(0, 100).map(x => ({
      id: x.id, name: str(x.name, 60) || 'Mijn set',
      items: x.items.filter(i => Array.isArray(i) && str(i[0], 200) && str(i[1], 200)).slice(0, 3000).map(i => [str(i[0], 200), str(i[1], 200)]),
    }));
  }
  let srs = cleanSrs(load('srs', null));
  let sets = cleanSets(load('sets', null));
  // Vooraf geladen sets (words.js) één keer toevoegen. Wat je daarna weggooit, komt niet terug.
  (function seedPresets() {
    const done = new Set(Array.isArray(load('seeded', null)) ? load('seeded', null) : []);
    let changed = false;
    for (const p of cleanSets(window.WortPapageiPresets || [])) {
      if (done.has(p.id)) continue;
      done.add(p.id);
      if (!sets.some(s => s.id === p.id)) { sets.unshift(p); changed = true; }
    }
    if (changed) save('sets', sets);
    save('seeded', [...done]);
  })();
  const saveSrs = () => save('srs', srs);
  const saveSets = () => save('sets', sets);

  const dayStart = t => { const d = new Date(t - 4 * 3600e3); d.setHours(0, 0, 0, 0); return d.getTime() + 4 * 3600e3; };
  const dayKey = t => new Date(dayStart(t)).toISOString().slice(0, 10);
  function rollDay() {
    const k = dayKey(Date.now());
    if (srs.newDay.day !== k) srs.newDay = { day: k, counts: {} };
  }
  const deckName = id => { const l = LEVELS.find(x => x.id === id); if (l) return `${l.id} · ${l.name}`; const s = sets.find(x => x.id === id); return s ? s.name : ''; };
  function deckItems(id) {
    if (LEVELS.some(l => l.id === id)) return (window.WortPapageiWords || {})[id] || [];
    const s = sets.find(x => x.id === id);
    return s ? s.items : [];
  }
  const dirs = () => settings.vocabDir === 'beide' ? ['>', '<'] : settings.vocabDir === 'nl-de' ? ['<'] : ['>'];
  // Een kaart heet naar zijn Duitse kant, zodat voortgang blijft als je een set bewerkt.
  function deckCards(id) {
    const list = [];
    for (const item of deckItems(id)) for (const dir of dirs()) list.push({ key: `${id}|${item[0]}|${dir}`, de: item[0], nl: item[1], dir });
    return list;
  }
  function deckStats(id) {
    const now = Date.now(), end = dayStart(now) + DAY;
    rollDay();
    let fresh = 0, learn = 0, due = 0, known = 0;
    const cards = deckCards(id);
    for (const c of cards) {
      const s = srs.cards[c.key];
      if (!s) fresh++;
      else if (s.s === 'review') { known++; if (s.due < end) due++; }
      else learn++;
    }
    const newLeft = Math.max(0, Math.min(fresh, settings.newPerDay - (srs.newDay.counts[id] || 0)));
    return { total: cards.length, fresh, learn, due, known, newLeft };
  }

  function schedule(prev, r, now) {
    const c = prev ? Object.assign({}, prev) : { s: 'learn', step: 0, ivl: 0, ease: 2.5, reps: 0, lapses: 0, due: now };
    const onDay = d => dayStart(now) + d * DAY;
    if (c.s === 'learn') {
      if (r === 1) { c.step = 0; c.due = now + STEPS[0] * MIN; }
      else if (r === 2) c.due = now + (c.step === 0 ? (STEPS[0] + STEPS[1]) / 2 : STEPS[c.step]) * MIN;
      else if (r === 3 && c.step + 1 < STEPS.length) { c.step++; c.due = now + STEPS[c.step] * MIN; }
      else { c.s = 'review'; c.ivl = r === 4 ? 4 : 1; c.due = onDay(c.ivl); }
    } else if (c.s === 'relearn') {
      if (r <= 2) c.due = now + STEPS[1] * MIN;
      else { c.s = 'review'; c.ivl = Math.max(1, c.ivl) + (r === 4 ? 1 : 0); c.due = onDay(c.ivl); }
    } else if (r === 1) {
      c.lapses++; c.ease = Math.max(1.3, c.ease - 0.2); c.ivl = Math.max(1, Math.round(c.ivl * 0.5));
      c.s = 'relearn'; c.due = now + STEPS[1] * MIN;
    } else {
      const late = Math.max(0, (dayStart(now) - dayStart(c.due)) / DAY);
      let ivl;
      if (r === 2) { ivl = c.ivl * 1.2; c.ease = Math.max(1.3, c.ease - 0.15); }
      else if (r === 3) ivl = (c.ivl + late / 2) * c.ease;
      else { ivl = (c.ivl + late) * c.ease * 1.3; c.ease += 0.15; }
      c.ivl = Math.min(36500, Math.max(c.ivl + 1, Math.round(ivl)));
      c.due = onDay(c.ivl);
    }
    c.reps++;
    return c;
  }
  function fmtIvl(due, now) {
    const m = (due - now) / MIN;
    if (m < 1) return '< 1 min';
    if (m < 60) return Math.round(m) + ' min';
    const d = Math.round((dayStart(due) - dayStart(now)) / DAY);
    if (d < 1) return Math.round(m / 60) + ' u';
    if (d < 31) return d + ' d';
    if (d < 365) return (d / 30).toFixed(d < 300 ? 1 : 0).replace('.', ',').replace(',0', '') + ' mnd';
    return (d / 365).toFixed(1).replace('.', ',').replace(',0', '') + ' jaar';
  }
  // Lidwoord in kleur: der blauw, die rood, das groen; meervoud klein erachter.
  function fmtDe(s) {
    const m = s.match(/^(der|die|das)\s+(.+?)(,\s*[^,]+)?$/);
    if (!m) return esc(s);
    return `<span class="art ${m[1]}">${m[1]}</span> ${esc(m[2])}${m[3] ? `<span class="pl">${esc(m[3])}</span>` : ''}`;
  }
  const speakText = s => s.replace(/,\s*[-¨\w]*$/, '').replace(/\(.*?\)/g, '').trim();
  function speak(s) {
    try {
      const u = new SpeechSynthesisUtterance(speakText(s)); u.lang = 'de-DE'; u.rate = 0.9;
      const voice = speechSynthesis.getVoices().find(v => /^de/i.test(v.lang)); if (voice) u.voice = voice;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* geen spraak beschikbaar */ }
  }
  const canSpeak = 'speechSynthesis' in window;

  function renderDecks(message) {
    study = null;
    setDrillMode(false);
    const all = LEVELS.map(l => ({ id: l.id, label: l.id, name: l.name, st: deckStats(l.id) }))
      .concat(sets.map(s => ({ id: s.id, label: '', name: s.name, st: deckStats(s.id), own: true })));
    const today = all.reduce((n, d) => n + d.st.due + d.st.learn, 0), fresh = all.reduce((n, d) => n + d.st.newLeft, 0);
    const tile = d => {
      const pct = d.st.total ? Math.round(d.st.known / d.st.total * 100) : 0;
      return `<div class="deck${d.own ? ' own' : ''}">
        <button class="deck-main" data-deck="${esc(d.id)}" type="button" ${d.st.total ? '' : 'disabled'}>
          ${d.label ? `<span class="lvl">${d.label}</span>` : `<span class="lvl own">${IC.cards}</span>`}
          <span class="meta"><b>${esc(d.name)}</b><span>${d.st.total} ${d.st.total === 1 ? 'kaart' : 'kaarten'} · ${pct}% in herhaling</span>
            <span class="bar"><i style="width:${pct}%"></i></span></span>
          <span class="cnt" aria-label="${d.st.newLeft} nieuw, ${d.st.learn} aan het leren, ${d.st.due} te herhalen"><b class="c-new">${d.st.newLeft}</b><b class="c-learn">${d.st.learn}</b><b class="c-rev">${d.st.due}</b></span>
        </button>
        ${d.own ? `<button class="close edit" data-edit="${esc(d.id)}" type="button" aria-label="Set bewerken">${IC.pen}</button>` : ''}
      </div>`;
    };
    view.innerHTML = `
      <div class="hero"><img src="assets/parrot.webp" alt="Papegaai van gevouwen papier"><div class="bubble">Wörter lernen mit Karteikarten.<small>${today || fresh ? `Vandaag: ${today} te herhalen en ${fresh} nieuw.` : 'Alles is bij voor vandaag. Morgen staan er weer kaarten klaar.'}</small></div></div>
      ${message ? `<p class="hint" role="status">${esc(message)}</p>` : ''}
      <section class="block"><p class="label">Niveaus</p>
        <div class="decks">${all.filter(d => !d.own).map(tile).join('')}</div>
        <p class="legend"><b class="c-new">nieuw</b> <b class="c-learn">aan het leren</b> <b class="c-rev">herhalen</b></p>
      </section>
      <section class="block"><p class="label">Eigen sets</p>
        ${sets.length ? `<div class="decks">${all.filter(d => d.own).map(tile).join('')}</div>` : '<p class="hint" style="margin:0 0 8px">Maak een set met je eigen woorden, bijvoorbeeld uit je lesboek. Een woordenlijst uit Anki kun je ook inladen.</p>'}
        <button class="btn ghost sm" id="newSet" type="button">${IC.plus} Nieuwe set</button>
      </section>
      <section class="block"><p class="label">Richting</p>
        <div class="chips">${[['de-nl', 'Duits → Nederlands'], ['nl-de', 'Nederlands → Duits'], ['beide', 'Beide']].map(([v, l]) => `<button class="chip" data-dir="${v}" aria-pressed="${settings.vocabDir === v}">${l}</button>`).join('')}</div>
      </section>
      <section class="block"><p class="label">Nieuwe kaarten per dag (per set)</p>
        <div class="chips">${[10, 20, 30, 50].map(n => `<button class="chip" data-npd="${n}" aria-pressed="${settings.newPerDay === n}">${n}</button>`).join('')}</div>
      </section>`;
    view.querySelectorAll('[data-deck]').forEach(b => b.onclick = () => startStudy(b.dataset.deck));
    view.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => renderSetEditor(b.dataset.edit));
    view.querySelectorAll('[data-dir]').forEach(b => b.onclick = () => { settings.vocabDir = b.dataset.dir; saveSettings(); renderDecks(); });
    view.querySelectorAll('[data-npd]').forEach(b => b.onclick = () => { settings.newPerDay = +b.dataset.npd; saveSettings(); renderDecks(); });
    $('#newSet').onclick = () => renderSetEditor(null);
  }

  // Regels als "Duits = Nederlands"; ook tab, puntkomma of | als scheiding (zo werkt een Anki-export als tekst).
  function parseItems(text) {
    const items = [], seen = new Set();
    for (const raw of String(text).split(/\r?\n/)) {
      const line = raw.replace(/<[^>]*>/g, '').trim();
      if (!line || line.startsWith('#')) continue;
      const m = line.match(/^(.+?)\s*(?:\t|\s=\s|=|\||;|\s[-–]\s)\s*(.+)$/);
      if (!m) continue;
      const de = m[1].trim().slice(0, 200), nl = m[2].split('\t')[0].trim().slice(0, 200);
      if (!de || !nl || seen.has(de)) continue;
      seen.add(de); items.push([de, nl]);
    }
    return items;
  }
  function renderSetEditor(id) {
    setDrillMode(false);
    const set = id ? sets.find(s => s.id === id) : null;
    view.innerHTML = `
      <button class="btn ghost sm" id="back" type="button" style="align-self:flex-start;width:auto">${IC.back} Woorden</button>
      <h2>${set ? 'Set bewerken' : 'Nieuwe set'}</h2>
      <label class="label" for="setName">Naam</label>
      <input class="search" id="setName" maxlength="60" placeholder="Bijvoorbeeld: Hoofdstuk 3" value="${set ? esc(set.name) : ''}" autocomplete="off">
      <label class="label" for="setText">Woorden, één per regel: Duits = Nederlands</label>
      <textarea class="search" id="setText" rows="10" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="der Apfel, ¨- = de appel&#10;laufen = lopen&#10;schnell = snel">${set ? esc(set.items.map(i => i.join(' = ')).join('\n')) : ''}</textarea>
      <p class="hint" id="parsed" role="status"></p>
      <div class="row"><button class="btn ghost sm" id="fileBtn" type="button">${IC.up} Bestand inladen</button>
        <button class="btn dark sm" id="saveSet" type="button">${IC.check} Bewaar</button></div>
      <input type="file" id="setFile" accept=".txt,.csv,.tsv,text/plain,text/csv,text/tab-separated-values" hidden>
      <p class="hint">Een Anki-stapel exporteer je als "Notities in platte tekst". Elke regel met Duits en Nederlands gescheiden door een tab, =, ; of | wordt een kaart.</p>
      ${set ? '<div id="del"><button class="linkbtn" id="delBtn" type="button">Set verwijderen</button></div>' : ''}`;
    window.scrollTo(0, 0);
    const update = () => {
      const n = parseItems($('#setText').value).length;
      $('#parsed').textContent = n ? `${n} ${n === 1 ? 'kaart' : 'kaarten'} herkend.` : 'Nog geen kaarten herkend.';
      $('#saveSet').disabled = !n;
    };
    $('#setText').oninput = update; update();
    $('#back').onclick = () => renderDecks();
    $('#fileBtn').onclick = () => $('#setFile').click();
    $('#setFile').onchange = e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        const t = $('#setText');
        t.value = (t.value.trim() ? t.value.trim() + '\n' : '') + String(r.result);
        if (!$('#setName').value.trim()) $('#setName').value = f.name.replace(/\.[^.]+$/, '').slice(0, 60);
        update();
      };
      r.readAsText(f);
    };
    $('#saveSet').onclick = () => {
      const items = parseItems($('#setText').value);
      if (!items.length) return;
      const name = $('#setName').value.trim().slice(0, 60) || 'Mijn set';
      if (set) { set.name = name; set.items = items; }
      else sets.push({ id: 'eigen-' + Date.now().toString(36), name, items });
      saveSets();
      renderDecks(`Set "${name}" bewaard met ${items.length} kaarten.`);
    };
    const del = $('#delBtn');
    if (del) del.onclick = () => {
      $('#del').innerHTML = `<div class="confirm"><b>Set "${esc(set.name)}" en de voortgang ervan verwijderen?</b><div class="row"><button class="btn ghost sm" id="no" type="button">${IC.back} Annuleren</button><button class="btn sm" id="yes" type="button">${IC.x} Verwijderen</button></div></div>`;
      $('#no').onclick = () => renderSetEditor(id);
      $('#yes').onclick = () => {
        sets = sets.filter(s => s.id !== id);
        for (const k of Object.keys(srs.cards)) if (k.startsWith(id + '|')) delete srs.cards[k];
        saveSets(); saveSrs();
        renderDecks('Set verwijderd.');
      };
    };
  }

  function startStudy(id, extraNew) {
    rollDay();
    if (extraNew) { srs.newDay.counts[id] = (srs.newDay.counts[id] || 0) - extraNew; saveSrs(); }
    const now = Date.now(), end = dayStart(now) + DAY;
    const review = [], fresh = [], learn = [];
    for (const c of deckCards(id)) {
      const s = srs.cards[c.key];
      if (!s) fresh.push(c);
      else if (s.s === 'review') { if (s.due < end) review.push(c); }
      else learn.push(c);
    }
    const newLeft = Math.max(0, settings.newPerDay - (srs.newDay.counts[id] || 0));
    study = { id, review: shuffle(review), fresh: shuffle(fresh).slice(0, newLeft), learn, done: 0, again: 0, cur: null, shown: false, freshLeft: fresh.length };
    nextStudy();
  }
  function nextStudy() {
    const st = study, now = Date.now();
    const byDue = (a, b) => srs.cards[a.key].due - srs.cards[b.key].due;
    st.learn.sort(byDue);
    let c = null;
    if (st.learn.length && srs.cards[st.learn[0].key].due <= now) c = st.learn.shift();
    else if (st.review.length) c = st.review.shift();
    else if (st.fresh.length) c = st.fresh.shift();
    else if (st.learn.length && srs.cards[st.learn[0].key].due <= now + LEARN_AHEAD) c = st.learn.shift();
    if (!c) return finishStudy();
    st.cur = c; st.shown = false;
    renderStudy();
  }
  function studyCounts() {
    const st = study, c = st.cur, s = c && srs.cards[c.key];
    const plus = k => c && (k === 'new' ? !s : k === 'rev' ? s && s.s === 'review' : s && s.s !== 'review') ? 1 : 0;
    return { fresh: st.fresh.length + plus('new'), learn: st.learn.length + plus('learn'), rev: st.review.length + plus('rev') };
  }
  function renderStudy() {
    const st = study, c = st.cur, now = Date.now();
    setDrillMode(true);
    const front = c.dir === '>' ? fmtDe(c.de) : esc(c.nl);
    const back = c.dir === '>' ? esc(c.nl) : fmtDe(c.de);
    const n = studyCounts();
    const prev = srs.cards[c.key];
    const ask = c.dir === '>' ? ['Was heißt das?', 'Kennst du das Wort?', 'Na, weißt du es?'] : ['Wie sagt man das auf Deutsch?', 'Und auf Deutsch?', 'Weißt du das deutsche Wort?'];
    const sayBtn = canSpeak ? `<button class="close speak" id="speak" type="button" aria-label="Duits uitspreken">${IC.sound}</button>` : '';
    view.innerHTML = `
      <div class="drillbar"><button class="close" id="stop" type="button" aria-label="Stoppen">${IC.x}</button>
        <span style="flex:1">${esc(deckName(st.id))}</span>
        <span class="cnt" aria-label="${n.fresh} nieuw, ${n.learn} aan het leren, ${n.rev} te herhalen"><b class="c-new">${n.fresh}</b><b class="c-learn">${n.learn}</b><b class="c-rev">${n.rev}</b></span></div>
      <div class="coach idle" id="coach" aria-live="polite">
        <div class="bird"><img src="assets/parrot.webp" alt="Papegaai"><span class="marks" aria-hidden="true"><i></i><i></i><i></i></span><span class="huh" aria-hidden="true">?</span><span class="dots" aria-hidden="true">…</span></div>
        <div class="bubble" id="say">${esc(st.shown ? 'Und, wusstest du es?' : pick(ask))}</div>
      </div>
      <div class="card flash pop" id="qform">
        <span class="tense">${c.dir === '>' ? 'Duits → Nederlands' : 'Nederlands → Duits'}${!prev ? '<small>nieuw</small>' : ''}</span>
        <div class="face front">${front}${c.dir === '>' ? sayBtn : ''}</div>
        ${st.shown ? `<div class="fold" aria-hidden="true"></div><div class="face back">${back}${c.dir === '<' ? sayBtn : ''}</div>` : ''}
        <div id="actions" class="${st.shown ? 'rate' : 'row'}">
          ${st.shown ? RATES.map(x => `<button class="btn sm ${x.cls}" type="button" data-rate="${x.r}">${x.label}<small>${fmtIvl(schedule(prev, x.r, now).due, now)}</small></button>`).join('')
            : `<button class="btn mustard" id="flip" type="button">Toon antwoord</button>`}
        </div>
      </div>`;
    $('#stop').onclick = () => finishStudy();
    const sp = $('#speak'); if (sp) sp.onclick = () => speak(c.de);
    if (st.shown) {
      view.querySelectorAll('[data-rate]').forEach(b => b.onclick = () => rate(+b.dataset.rate));
      if (c.dir === '<' && canSpeak) speak(c.de);
    } else {
      $('#flip').onclick = flip;
    }
    st.readyAt = Date.now() + 300;
    requestAnimationFrame(showCard);
  }
  function flip() {
    if (!study || study.shown || Date.now() < study.readyAt) return;
    study.shown = true;
    sfx('flip');
    renderStudy();
    coach('think', 'Und, wusstest du es?');
  }
  function rate(r) {
    const st = study; if (!st || !st.shown || Date.now() < st.readyAt) return;
    const c = st.cur, now = Date.now(), prev = srs.cards[c.key];
    rollDay();
    if (!prev) srs.newDay.counts[st.id] = (srs.newDay.counts[st.id] || 0) + 1;
    const next = schedule(prev, r, now);
    srs.cards[c.key] = next;
    saveSrs();
    st.done++;
    if (r === 1) st.again++;
    if (next.s !== 'review') st.learn.push(c);
    st.readyAt = Infinity;
    sfx(r === 1 ? 'bad' : r === 2 ? 'tap' : r === 4 ? 'streak' : 'ok');
    coach(r === 1 ? 'sad' : r === 2 ? 'think' : 'happy', r === 1 ? 'Die kommt gleich wieder!' : r === 2 ? 'Fast!' : r === 4 ? 'Kinderspiel!' : pick(HAPPY));
    setTimeout(() => { if (study === st) nextStudy(); }, r === 1 ? 650 : 450);
  }
  function finishStudy() {
    const st = study; if (!st) return renderDecks();
    study = null;
    setDrillMode(false);
    const now = Date.now();
    const waiting = st.learn.filter(c => srs.cards[c.key] && srs.cards[c.key].due > now);
    const soon = waiting.length ? Math.min(...waiting.map(c => srs.cards[c.key].due)) : 0;
    const left = deckStats(st.id);
    if (st.done) sfx('finish');
    const praise = !st.done ? 'Bis bald!' : st.again / st.done < 0.2 ? 'Sehr gut!' : 'Gut gemacht!';
    view.innerHTML = `
      <div class="hero"><img src="assets/parrot.webp" alt="Papegaai van gevouwen papier"><div class="bubble">${praise}<small>${esc(deckName(st.id))}</small></div></div>
      <div class="score"><div><div class="grade">${st.done}</div><div class="grade-sub">${st.done === 1 ? 'kaart' : 'kaarten'} geoefend</div></div>
        <div class="muted">${st.again} keer opnieuw<br>${left.known} van ${left.total} in herhaling</div></div>
      ${waiting.length ? `<p class="hint">Nog ${waiting.length} ${waiting.length === 1 ? 'kaart' : 'kaarten'} aan het leren. De volgende is weer aan de beurt over ${fmtIvl(soon, now)}.</p>` : ''}
      ${!waiting.length && !left.due && !left.newLeft ? `<p class="hint">Deze set is klaar voor vandaag.</p>` : ''}
      <div class="row">
        ${left.due || left.newLeft || waiting.length ? `<button class="btn mustard" id="more" type="button">Verder ${IC.next}</button>` : ''}
        ${!left.newLeft && left.fresh ? `<button class="btn blue" id="extra" type="button">10 extra nieuw ${IC.plus}</button>` : ''}
      </div>
      <button class="btn ghost" id="back" type="button">${IC.back} Woorden</button>`;
    window.scrollTo(0, 0);
    const more = $('#more'); if (more) more.onclick = () => startStudy(st.id);
    const extra = $('#extra'); if (extra) extra.onclick = () => startStudy(st.id, 10);
    $('#back').onclick = () => renderDecks();
  }
  document.addEventListener('keydown', e => {
    if (!study || e.target.closest('input, textarea')) return;
    if (!study.shown && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); flip(); }
    else if (study.shown && /^[1-4]$/.test(e.key)) rate(+e.key);
    else if (study.shown && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); rate(3); }
  });

  // ---------- Resultaten ----------
  function renderStats(message) {
    const h = store.history;
    const asked = h.reduce((s, x) => s + x.total, 0);
    const ok = h.reduce((s, x) => s + x.ok, 0);
    const pct = asked ? Math.round(ok / asked * 100) : 0;
    const fmtDate = t => new Date(t).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) + ' ' + new Date(t).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    view.innerHTML = `
      <h2>Resultaten</h2>
      <div class="stats">
        <div class="stat"><b>${asked}</b><span>vragen gemaakt</span></div>
        <div class="stat"><b>${asked ? pct + '%' : '–'}</b><span>goed</span></div>
        <div class="stat"><b>${store.best || '–'}</b><span>record klok</span></div>
      </div>
      ${mistakeCount() ? `<button class="btn blue" id="fouten">Herhaal mijn ${mistakeCount()} fouten ${IC.redo}</button>` : ''}
      <section class="block"><p class="label">Geschiedenis</p>
      ${h.length ? `<div class="list">${h.slice(0, 50).map(x => `<div><span class="k">${esc(modeLabel(x.mode))}<br><span class="muted">${fmtDate(x.at)}</span></span>
        <span class="v">${x.mode === 'klok' ? `<b>${x.ok}</b> goed` : `<b>${fmtGrade(grade(x.ok, x.total))}</b><br><span class="muted">${x.ok}/${x.total}</span>`}</span></div>`).join('')}</div>`
        : '<p class="hint">Nog geen oefeningen gedaan. Je scores verschijnen hier na je eerste ronde.</p>'}
      </section>
      <section class="block"><p class="label">Back-up</p>
        <p class="hint" style="margin:0 0 8px">Je resultaten staan alleen op deze telefoon. Bewaar af en toe een back-up, bijvoorbeeld in Bestanden, dan kun je ze na het opnieuw installeren terugzetten.</p>
        <div class="row"><button class="btn ghost sm" id="exportBtn" type="button">${IC.down} Bewaar</button><button class="btn ghost sm" id="importBtn" type="button">${IC.up} Zet terug</button></div>
        <input type="file" id="importFile" accept="application/json,.json" hidden>
        ${message ? `<p class="hint" role="status">${esc(message)}</p>` : ''}
      </section>
      ${h.length || mistakeCount() ? '<div id="wipe"><button class="linkbtn" id="wipeBtn">Alle resultaten wissen</button></div>' : ''}`;
    const f = $('#fouten'); if (f) f.onclick = () => { settings.mode = 'fouten'; saveSettings(); setTab('oefenen'); };
    $('#exportBtn').onclick = exportBackup;
    $('#importBtn').onclick = () => $('#importFile').click();
    $('#importFile').onchange = e => { const file = e.target.files && e.target.files[0]; if (file) importBackup(file); };
    const w = $('#wipeBtn'); if (w) w.onclick = () => {
      $('#wipe').innerHTML = `<div class="confirm"><b>Alle scores, je record en je foutenlijst wissen?</b><div class="row"><button class="btn ghost sm" id="no">${IC.back} Annuleren</button><button class="btn sm" id="yes">${IC.x} Wissen</button></div></div>`;
      $('#no').onclick = () => renderStats();
      $('#yes').onclick = () => { store = cleanStore(null); saveStore(); renderStats(); };
    };
  }
  async function exportBackup() {
    const data = JSON.stringify({ app: 'WortPapagei', version: 2, at: Date.now(), settings, store, srs, sets });
    const name = `wortpapagei-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = typeof File === 'function' ? new File([data], name, { type: 'application/json' }) : null;
    try {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'WortPapagei back-up' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function importBackup(file) {
    const r = new FileReader();
    r.onload = () => {
      let data = null;
      try { data = JSON.parse(r.result); } catch (e) { /* geen geldig bestand */ }
      if (!isObj(data) || data.app !== 'WortPapagei' || !isObj(data.store)) return renderStats('Dit is geen WortPapagei-back-up.');
      $('#wipe') && ($('#wipe').innerHTML = '');
      const incoming = cleanStore(data.store);
      const inSets = cleanSets(data.sets), inSrs = cleanSrs(data.srs);
      const view2 = $('#importBtn').closest('section');
      view2.insertAdjacentHTML('beforeend', `<div class="confirm"><b>Back-up terugzetten? Je huidige resultaten worden vervangen door ${incoming.history.length} rondes, ${Object.keys(incoming.mistakes).length} fouten, ${Object.keys(inSrs.cards).length} geleerde woordkaarten en ${inSets.length} eigen ${inSets.length === 1 ? 'set' : 'sets'}.</b><div class="row"><button class="btn ghost sm" id="no">${IC.back} Annuleren</button><button class="btn sm dark" id="yes">${IC.check} Terugzetten</button></div></div>`);
      $('#no').onclick = () => renderStats();
      $('#yes').onclick = () => {
        store = incoming; saveStore();
        if (data.srs !== undefined) { srs = inSrs; saveSrs(); }
        if (data.sets !== undefined) { sets = inSets; saveSets(); }
        if (isObj(data.settings)) { Object.assign(settings, cleanSettings(data.settings)); saveSettings(); }
        renderStats('Back-up teruggezet.');
      };
    };
    r.onerror = () => renderStats('Het bestand kon niet worden gelezen.');
    r.readAsText(file);
  }

  // Voor tests: de kanarie-tip opvragen zonder les.
  V.hintFor = hintFor;

  // ---------- Start ----------
  fitDrill();
  setTab('oefenen');
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => { /* geen offline-cache mogelijk hier */ });
  }
})();
