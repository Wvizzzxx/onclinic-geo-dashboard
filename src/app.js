(() => {
  const D = window.DASH, IC = window.AI_ICONS;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const NB = ' ';
  const num = (v, d = 1) => v == null ? '—' : Number(v).toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/\s/g, NB);
  const int = (v) => v == null ? '—' : Number(v).toLocaleString('ru-RU').replace(/\s/g, NB);
  const pct = (v) => v == null ? 'н/д' : num(v) + '%';
  const pp = (v) => num(Math.abs(v)) + NB + 'п.п.';
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c); };

  const CH = D.channels;
  const CH_KEYS = Object.keys(CH);
  const TYPE_NAME = { models: 'AI-модели', search: 'ИИ-выдача' };
  const TYPE_ALL = { models: 'Все AI-модели', search: 'Вся ИИ-выдача' };
  const METRICS = {
    vis: { name: 'Упоминаемость', short: 'Упоминаемость', unit: '%', desc: 'доля ответов, где клиника названа в тексте', layer: 'm' },
    sov: { name: 'Доля голоса (SOV)', short: 'SOV', unit: '%', desc: 'доля клиники среди всех упоминаний клиник направления', layer: 'm' },
    cit: { name: 'Цитирование сайта', short: 'Цитирование', unit: '%', desc: 'доля ответов с источниками, где есть ссылка на сайт клиники', layer: 'c' },
    pos: { name: 'Средняя позиция', short: 'Позиция', unit: '', desc: 'место среди названных клиник внутри ответа, меньше — выше', layer: 'm' },
  };
  const bname = (k) => D.brands[k].name;

  const state = { dir: 'plastic', faq: D.faq[0].key, type: 'models', ch: 'all', rank: 'vis', hm: 'vis' };
  try { const s = JSON.parse(localStorage.getItem('onclinic-geo-state') || 'null'); if (s) Object.assign(state, s); } catch (e) {}
  const save = () => { try { localStorage.setItem('onclinic-geo-state', JSON.stringify(state)); } catch (e) {} };

  const scopeKey = () => state.dir === 'faq' ? state.faq : state.dir;
  const scope = () => D.scopes[scopeKey()];
  const cubeKey = () => state.ch === 'all' ? state.type : state.ch;
  const cube = () => scope().cube[cubeKey()];
  const chLabel = () => state.ch === 'all' ? TYPE_ALL[state.type] : CH[state.ch].name;
  const scopeLabel = () => state.dir === 'faq' ? 'FAQ · ' + scope().title : scope().title;
  const citingNames = (type) => CH_KEYS.filter((k) => CH[k].type === type && CH[k].cit).map((k) => CH[k].name);
  const icon = (k, cls = '') => `<img src="${IC[CH[k].icon]}" alt="" class="${cls}">`;

  function sortBrands(c, metric) {
    const keys = scope().brands.slice();
    return keys.sort((a, b) => {
      const va = c.brands[a][metric], vb = c.brands[b][metric];
      if (va == null && vb == null) return 0;
      if (va == null) return 1; if (vb == null) return -1;
      return metric === 'pos' ? va - vb : vb - va;
    });
  }

  /* ---------- Hero ---------- */
  function renderHero() {
    const t = D.totals;
    $('heroEyebrow').textContent = `GEO-мониторинг · ${D.meta.site} · замер ${D.meta.date}`;
    $('measureTag').textContent = 'Замер ' + D.meta.date;
    $('footDate').textContent = 'Данные замера: ' + D.meta.date;
    $('heroStats').innerHTML = [
      [int(t.prompts_models + t.prompts_search), 'GEO-запросов'],
      [int(t.answers), 'ответов AI'],
      [CH_KEYS.length, 'AI-каналов: 5 моделей, 2 ИИ-выдачи'],
      [int(t.citations), 'ссылок-источников'],
    ].map(([a, b]) => `<div class="hero-stat"><strong>${a}</strong><span>${b}</span></div>`).join('');
  }

  /* ---------- Controls ---------- */
  function seg(el, items, active, onPick, cls = '') {
    el.innerHTML = items.map(([k, label]) => `<button type="button" role="tab" class="${cls}${k === active ? ' is-active' : ''}" aria-selected="${k === active}" data-k="${k}">${label}</button>`).join('');
    el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => onPick(b.dataset.k)));
  }
  function renderControls() {
    seg($('dirTabs'), [...D.directions.map((d) => [d.key, esc(d.title)]), ['faq', 'FAQ']], state.dir, (k) => { state.dir = k; update(); });
    seg($('typeSeg'), [['models', 'AI-модели'], ['search', 'ИИ-выдача']], state.type, (k) => { state.type = k; state.ch = 'all'; update(); });
    const faq = $('faqChips');
    faq.hidden = state.dir !== 'faq';
    faq.innerHTML = '<span class="slice-caption"><b>Группа FAQ:</b></span>' + D.faq.map((g) => `<button type="button" class="chip${g.key === state.faq ? ' is-active' : ''}" aria-pressed="${g.key === state.faq}" data-k="${g.key}">${esc(g.title)}</button>`).join('');
    faq.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { state.faq = b.dataset.k; update(); }));
    const chs = CH_KEYS.filter((k) => CH[k].type === state.type);
    const chips = [['all', TYPE_ALL[state.type]], ...chs.map((k) => [k, icon(k) + esc(CH[k].name)])];
    $('chChips').innerHTML = chips.map(([k, l]) => `<button type="button" class="chip${k === state.ch ? ' is-active' : ''}" aria-pressed="${k === state.ch}" data-k="${k}">${l}</button>`).join('');
    $('chChips').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { state.ch = b.dataset.k; update(); }));
  }

  /* ---------- Overview ---------- */
  // Два слоя данных, которые считаются независимо:
  //  1) упоминание клиники в ТЕКСТЕ ответа (база — все ответы среза);
  //  2) ссылка на САЙТ клиники в ИСТОЧНИКАХ ответа (база — ответы каналов, которые отдают источники).
  // В информационных запросах (FAQ) AI часто берёт статью клиники как источник, но саму клинику не называет —
  // поэтому цитирование может быть >0 при нулевой упоминаемости. Это разные сигналы, а не ошибка.
  const hostsLine = (o, nc) => o.hosts && o.hosts.length ? o.hosts.map((h) => `${esc(h.h)} — ${int(h.n)}`).join(' · ') + ` из ${int(nc)}` : `0 из ${int(nc)}`;
  const citBase = () => state.ch === 'all' ? citingNames(state.type).join(', ') : CH[state.ch].name;
  function noMentionsIn(c) { return scope().brands.every((k) => !c.brands[k].cnt); }

  function renderOverview() {
    const s = scope(), c = cube(), o = c.brands.onclinic;
    const nBrands = s.brands.length;
    const citOk = state.ch === 'all' ? true : CH[state.ch].cit;
    const small = c.n < 100;
    $('ovEyebrow').textContent = `${scopeLabel()} · ${chLabel()}`;
    $('ovTitle').textContent = state.dir === 'faq' ? `FAQ: ${s.title}` : s.title;
    $('ovCaption').innerHTML = `${int(s.prompts[state.type])} ${plural(s.prompts[state.type], 'запрос', 'запроса', 'запросов')} · ${int(c.n)} ${plural(c.n, 'ответ', 'ответа', 'ответов')} в срезе` + (small ? ' · <span class="tag tag--warning" style="min-height:22px;padding:2px 8px">малая выборка, индикативно</span>' : '');

    const noMentions = noMentionsIn(c);
    const byVis = sortBrands(c, 'vis'), leader = byVis[0], place = byVis.indexOf('onclinic') + 1, lv = c.brands[leader].vis;
    const byCit = sortBrands(c, 'cit'), citPlace = byCit.indexOf('onclinic') + 1, citLeader = byCit[0];
    const citPrimary = noMentions && citOk;

    const deltaVis = noMentions ? '<span class="metric__delta flat">клиники не названы</span>' : (leader === 'onclinic' ? '<span class="metric__delta up">лидер</span>' : `<span class="metric__delta down">−${pp(lv - o.vis)} к лидеру</span>`);
    const mentionTiles = `
      <div class="metric card${citPrimary ? '' : ' metric--brand'}"><div class="metric__top"><span class="metric__label">Упоминаемость ОН КЛИНИК</span>${deltaVis}</div><div class="metric__value">${pct(o.vis)}</div><div class="metric__foot">${int(o.cnt)} из ${int(c.n)} ответов называют клинику</div></div>
      <div class="metric card"><div class="metric__top"><span class="metric__label">Место среди ${nBrands} клиник</span></div>${noMentions
        ? `<div class="metric__value">—</div><div class="metric__foot">AI не назвал ни одну клинику: ответы справочные</div>`
        : `<div class="metric__value">${place}<small>из ${nBrands}</small></div><div class="metric__foot">${leader === 'onclinic' ? 'следующий: ' + esc(bname(byVis[1])) + ' · ' + pct(c.brands[byVis[1]].vis) : 'лидер: ' + esc(bname(leader)) + ' · ' + pct(lv)} · SOV ОН КЛИНИК ${pct(o.sov)}</div>`}</div>`;
    const mentionLayer = `<div class="layer"><div class="layer__head"><span class="layer__title"><span class="a-icon a-icon--message-circle a-icon--sm"></span>Упоминание в тексте ответа</span><span class="layer__base">база: ${int(c.n)} ${plural(c.n, 'ответ', 'ответа', 'ответов')}</span></div><div class="layer__tiles">${mentionTiles}</div></div>`;

    let citLayer;
    if (!citOk) {
      citLayer = `<div class="layer"><div class="layer__head"><span class="layer__title"><span class="a-icon a-icon--link a-icon--sm"></span>Ссылка на сайт в источниках</span><span class="layer__base">н/д</span></div><div class="card data-state"><span class="a-icon a-icon--info a-icon--muted"></span><div><b>${esc(CH[state.ch].name)} не отдаёт источники</b><small>Ссылки есть только в ${num(CH[state.ch].src)}% ответов канала, поэтому цитирование не считается. Это не равно нулю.</small></div></div></div>`;
    } else {
      const deltaCit = o.cit > 0 && citLeader === 'onclinic' ? '<span class="metric__delta up">лидер</span>' : (o.cit > 0 ? `<span class="metric__delta down">−${pp(c.brands[citLeader].cit - o.cit)} к лидеру</span>` : '<span class="metric__delta flat">нет ссылок</span>');
      const nextC = citLeader === 'onclinic' ? byCit[1] : citLeader;
      citLayer = `<div class="layer"><div class="layer__head"><span class="layer__title"><span class="a-icon a-icon--link a-icon--sm"></span>Ссылка на сайт в источниках</span><span class="layer__base">база: ${int(c.nc)} ${plural(c.nc, 'ответ', 'ответа', 'ответов')} с источниками (${esc(citBase())})</span></div><div class="layer__tiles">
        <div class="metric card${citPrimary ? ' metric--brand' : ''}"><div class="metric__top"><span class="metric__label">Цитирование сайтов ОН КЛИНИК</span>${deltaCit}</div><div class="metric__value">${pct(o.cit)}</div><div class="metric__foot">${hostsLine(o, c.nc)}</div></div>
        <div class="metric card"><div class="metric__top"><span class="metric__label">Место по цитированию</span></div><div class="metric__value">${o.cit > 0 ? citPlace : '—'}<small>из ${nBrands}</small></div><div class="metric__foot">${citLeader === 'onclinic' ? 'следующий' : 'лидер'}: ${esc(bname(nextC))} · ${pct(c.brands[nextC].cit)}</div></div>
      </div></div>`;
    }
    $('kpiRow').innerHTML = citPrimary ? citLayer + mentionLayer : mentionLayer + citLayer;

    // Вывод
    const parts = [];
    if (noMentions) {
      parts.push(`<p><b>Почему упоминаемость 0%, а цитирование ${citOk ? pct(o.cit) : 'есть'}.</b> Это два разных сигнала. Запросы здесь справочные («почему…», «что такое…»): AI объясняет тему и не называет ни одну из ${nBrands} клиник, но берёт статьи клиник как источник ответа. ${citOk ? `Сайты ОН КЛИНИК указаны в источниках ${int(o.citn)} из ${int(c.nc)} ответов — ${citPlace}-е место среди клиник.` : ''} Для FAQ главный показатель — цитирование.</p>`);
    } else {
      parts.push(`<p><b>Упоминания.</b> ОН КЛИНИК названа в ${pct(o.vis)} ответов — ${place}-е место из ${nBrands}. ` + (leader === 'onclinic' ? `Ближайший конкурент — ${esc(bname(byVis[1]))} (${pct(c.brands[byVis[1]].vis)}).` : `Лидер — ${esc(bname(leader))} (${pct(lv)}), разрыв ${pp(lv - o.vis)}.`) + ` В ${pct(c.none)} ответов не названа ни одна клиника из списка.</p>`);
      if (citOk) {
        const cl = citLeader === 'onclinic' ? byCit[1] : citLeader;
        parts.push(`<p><b>Ссылки.</b> Сайты ОН КЛИНИК в источниках ${pct(o.cit)} ответов, ${citPlace}-е место; ` + (citLeader === 'onclinic' ? `у следующего, ${esc(bname(cl))}, — ${pct(c.brands[cl].cit)}.` : `у лидера, ${esc(bname(citLeader))}, — ${pct(c.brands[citLeader].cit)}.`) + '</p>');
      }
    }
    if (citOk && o.hosts && o.hosts.length > 1) {
      parts.push(`<p><b>Из чего складывается ${pct(o.cit)}.</b> Это доля ответов, где есть ссылка хотя бы на один сайт клиники: ${o.hosts.map((h) => `${esc(h.h)} — ${pct(h.p)}`).join(', ')}. Ответ со ссылками на несколько сайтов клиники считается один раз. В ТОП-10 ниже сайты считаются по отдельности, поэтому там цифры меньше.</p>`);
    }
    if (s.hub_label && c.hub && citOk) {
      parts.push(`<p>Страница раздела <b>${esc(s.hub_label)}</b> указана в источниках ${int(c.hub.n)} ${plural(c.hub.n, 'ответа', 'ответов', 'ответов')}: AI ссылается на страницы услуг, которые лежат в корне onclinic.ru.</p>`);
    }
    $('ovInsightBody').innerHTML = `<h3>Что видно в срезе</h3>${parts.join('')}`;
  }

  /* ---------- Competitors ---------- */
  function renderCompetitors() {
    const s = scope(), c = cube();
    const citOk = state.ch === 'all' ? true : CH[state.ch].cit;
    seg($('rankSeg'), Object.keys(METRICS).map((k) => [k, METRICS[k].short]), state.rank, (k) => { state.rank = k; renderCompetitors(); save(); });
    const m = state.rank;
    const keys = sortBrands(c, m);
    const vals = keys.map((k) => c.brands[k][m]).filter((v) => v != null);
    const max = m === 'pos' ? Math.max(...vals, 1) : Math.max(...vals, 0.0001);
    $('rankSub').textContent = `${METRICS[m].name} · ${METRICS[m].desc}`;
    const emptyMentions = METRICS[m].layer === 'm' && noMentionsIn(c);
    if (emptyMentions) {
      $('rankRows').innerHTML = `<div class="data-state"><span class="a-icon a-icon--info a-icon--muted"></span><div><b>В этом срезе AI не называет клиники</b><small>Запросы справочные, поэтому ${METRICS[m].short.toLowerCase()} у всех клиник нулевая. Сравнивайте клиники по ссылкам на сайт.</small><button type="button" class="btn btn--secondary btn--sm" style="margin-top:10px" id="rankToCit">Показать цитирование</button></div></div>`;
      $('rankToCit').addEventListener('click', () => { state.rank = 'cit'; renderCompetitors(); save(); });
    } else if (m === 'cit' && !citOk) {
      $('rankRows').innerHTML = `<div class="data-state"><span class="a-icon a-icon--info a-icon--muted"></span><div><b>Канал не отдаёт источники</b><small>${esc(CH[state.ch].name)} даёт ссылки только в ${num(CH[state.ch].src)}% ответов, поэтому цитирование не считается. Это не равно нулю.</small></div></div>`;
    } else {
      $('rankRows').innerHTML = keys.map((k) => {
        const v = c.brands[k][m];
        const w = v == null ? 0 : (m === 'pos' ? (1 / v) / (1 / Math.min(...vals)) * 100 : v / max * 100);
        const label = v == null ? (m === 'pos' ? 'не назван' : '—') : (m === 'pos' ? num(v, 2) : pct(v));
        return `<div class="rank-row${k === 'onclinic' ? ' is-focus' : ''}${v == null || v === 0 ? ' is-empty' : ''}"><span class="rank-row__label">${esc(bname(k))}</span><span class="rank-row__track"><i style="width:${w.toFixed(1)}%"></i></span><span class="rank-row__value">${label}</span></div>`;
      }).join('');
    }
    $('rankNote').textContent = m === 'pos'
      ? 'Позиция — среднее место клиники среди шести клиник среза в тексте ответа. Считается только по ответам, где клиника названа; длина полосы — обратная величина.'
      : m === 'cit' ? `База цитирования — ${int(c.nc)} ответов каналов, которые отдают источники (${state.ch === 'all' ? citingNames(state.type).join(', ') : CH[state.ch].name}).`
      : `База — ${int(c.n)} ответов среза «${scopeLabel()} · ${chLabel()}».`;

    // Таблица
    const cols = [['vis', 'Упоминаемость'], ['sov', 'SOV'], ['pos', 'Позиция'], ['first', 'Назван первым'], ['cit', 'Цитирование']];
    const best = {};
    cols.forEach(([k]) => {
      const vs = s.brands.map((b) => c.brands[b][k]).filter((v) => v != null && (k !== 'cit' || citOk));
      best[k] = vs.length ? (k === 'pos' ? Math.min(...vs) : Math.max(...vs)) : null;
    });
    const rows = sortBrands(c, 'vis').map((b, i) => {
      const x = c.brands[b];
      const cells = cols.map(([k, label]) => {
        let v = x[k], txt;
        if (k === 'cit' && !citOk) txt = '<span class="na">н/д</span>';
        else if (k === 'pos') txt = v == null ? '<span class="na">—</span>' : num(v, 2);
        else txt = v == null ? '<span class="na">—</span>' : pct(v);
        const isBest = v != null && best[k] != null && v === best[k] && (k === 'pos' || v > 0) && !(k === 'cit' && !citOk);
        return `<td data-label="${label}"${isBest ? ' class="is-best"' : ''}>${txt}</td>`;
      }).join('');
      return `<tr${b === 'onclinic' ? ' class="is-focus"' : ''}><th scope="row"><span class="rank">${i + 1}</span>${esc(bname(b))}</th>${cells}</tr>`;
    }).join('');
    $('brandTable').innerHTML = `<caption>Все метрики · ${esc(scopeLabel())} · ${esc(chLabel())}. Синим — лучшее значение в столбце</caption>
      <thead><tr class="th-group"><th></th><th colspan="4">Упоминание в тексте · база ${int(c.n)}</th><th>Ссылка на сайт · база ${citOk ? int(c.nc) : 'н/д'}</th></tr>
      <tr><th scope="col">Клиника</th>${cols.map(([, l]) => `<th scope="col">${l}</th>`).join('')}</tr></thead><tbody>${rows}</tbody>`;
  }

  /* ---------- Heatmap ---------- */
  function renderHeatmap() {
    const s = scope();
    seg($('hmSeg'), [['vis', 'Упоминаемость'], ['sov', 'SOV'], ['cit', 'Цитирование']], state.hm, (k) => { state.hm = k; renderHeatmap(); save(); });
    const m = state.hm;
    const models = CH_KEYS.filter((k) => CH[k].type === 'models'), search = CH_KEYS.filter((k) => CH[k].type === 'search');
    const cols = [...models, ...search].filter((k) => s.cube[k]);
    const cell = (b, k) => {
      if (m === 'cit' && !CH[k].cit) return null;
      return s.cube[k].brands[b][m];
    };
    const all = [];
    s.brands.forEach((b) => cols.forEach((k) => { const v = cell(b, k); if (v != null) all.push(v); }));
    const max = Math.max(...all, 0.0001);
    const wrap = $('hmTable').parentElement;
    let empty = $('hmEmpty');
    if (!empty) { empty = document.createElement('div'); empty.id = 'hmEmpty'; wrap.before(empty); }
    const allZero = m !== 'cit' && all.every((v) => !v);
    empty.hidden = !allZero; wrap.hidden = allZero;
    if (allZero) empty.innerHTML = `<div class="data-state"><span class="a-icon a-icon--info a-icon--muted"></span><div><b>Ни один канал не назвал клиники в этом срезе</b><small>Запросы справочные. Переключитесь на «Цитирование», чтобы увидеть, чьи сайты AI берёт в источники.</small></div></div>`;
    const cls = (v) => v == null ? 'hm-na' : (v === 0 ? 'hm-0' : 'hm-' + Math.min(6, Math.max(1, Math.ceil(v / max * 6))));
    const nm = models.filter((k) => s.cube[k]).length, ns = search.filter((k) => s.cube[k]).length;
    const head = `<thead><tr class="hm-group"><th></th><th colspan="${nm}">AI-модели</th><th colspan="${ns}">ИИ-выдача</th></tr>
      <tr><th scope="col">Клиника</th>${cols.map((k) => `<th scope="col">${icon(k)}${esc(CH[k].name)}</th>`).join('')}</tr></thead>`;
    const body = sortBrands(s.cube[state.type], 'vis').map((b) => `<tr${b === 'onclinic' ? ' class="is-focus"' : ''}><th scope="row">${esc(bname(b))}</th>${cols.map((k) => {
      const v = cell(b, k);
      const na = m === 'cit' && !CH[k].cit;
      return `<td class="${na ? 'hm-na' : (v == null ? 'hm-0' : cls(v))}" data-label="${esc(CH[k].name)}" title="${esc(bname(b))} · ${esc(CH[k].name)}">${na ? 'н/д' : (v == null ? '—' : pct(v))}</td>`;
    }).join('')}</tr>`).join('');
    $('hmTable').innerHTML = `<caption class="sr-only">${METRICS[m].name} клиник по AI-каналам</caption>${head}<tbody>${body}</tbody>`;
    $('hmTitle').textContent = `${METRICS[m].name}: клиники × AI-каналы`;
    $('hmSub').textContent = `${scopeLabel()} · ${METRICS[m].desc}`;
    const na = CH_KEYS.filter((k) => !CH[k].cit).map((k) => CH[k].name);
    $('hmNote').innerHTML = `Модели и ИИ-выдача отвечают на разные пулы запросов, поэтому сравнивайте модели с моделями, а ИИ-выдачу с ИИ-выдачей. ` +
      (m === 'cit' ? `<b>н/д</b> — ${na.join(' и ')} почти не отдают источники (меньше ${Math.round(D.meta.cit_min * 100)}% ответов со ссылками), это не ноль.` : 'Цвет — интенсивность внутри этой таблицы, точное значение в ячейке.');
  }

  /* ---------- Top domains ---------- */
  function renderTop() {
    const s = scope(), c = cube();
    const citOk = state.ch === 'all' ? true : CH[state.ch].cit;
    $('topTitle').textContent = `ТОП-10 сайтов-источников · ${chLabel()}`;
    $('topCaption').textContent = `${scopeLabel()} · доля ответов с источниками, где сайт указан хотя бы одной ссылкой`;
    if (!citOk) {
      $('topCard').innerHTML = `<div class="data-state"><span class="a-icon a-icon--info a-icon--muted"></span><div><b>${esc(CH[state.ch].name)} не отдаёт источники</b><small>Ссылки есть только в ${num(CH[state.ch].src)}% ответов канала. Выберите другой канал или «${TYPE_ALL[state.type]}».</small></div></div>`;
      return;
    }
    const max = Math.max(...c.top.map((t) => t.p), 0.0001);
    const rows = c.top.map((t, i) => {
      const isClient = t.b === 'onclinic';
      const isComp = t.b && t.b !== 'onclinic' && t.b !== 'other_brand';
      const tag = isClient ? '<span class="tag tag--brand">ОН КЛИНИК</span>' : isComp ? `<span class="tag tag--comp">${esc(bname(t.b))}</span>` : '';
      return `<div class="top-row${isClient ? ' is-client' : ''}${isComp ? ' is-comp' : ''}"><span class="rank">${i + 1}</span><span class="top-row__domain">${esc(t.d)}${tag}</span><span class="top-row__bar"><i style="width:${(t.p / max * 100).toFixed(1)}%"></i></span><span class="top-row__value">${pct(t.p)}</span><span class="top-row__count">${int(t.n)} ${plural(t.n, 'ответ', 'ответа', 'ответов')}</span></div>`;
    }).join('');
    const o = c.brands.onclinic;
    const inTop = c.top.some((t) => t.b === 'onclinic');
    const base = state.ch === 'all' ? citingNames(state.type).join(', ') : CH[state.ch].name;
    const hostNote = o.hosts && o.hosts.length > 1
      ? `Сайты здесь считаются по отдельности, поэтому ${o.hosts.map((h) => `${esc(h.h)} — ${pct(h.p)}`).join(', ')}. Общее цитирование ОН КЛИНИК в обзоре — ${pct(o.cit)}: ответ со ссылкой хотя бы на один из этих сайтов.`
      : 'Поддомены считаются отдельными сайтами (plastica.onclinic.ru и onclinic.ru — разные строки).';
    $('topCard').innerHTML = `<div class="top-list">${rows}</div><div class="chart-note">База — ${int(c.nc)} ответов с источниками (${esc(base)}), всего ${int(c.domains_total)} уникальных сайтов. ${inTop ? '' : `Сайты ОН КЛИНИК в ТОП-10 не вошли, цитирование ${pct(o.cit)}. `}${hostNote}</div>`;
  }

  /* ---------- Gaps ---------- */
  function renderGaps() {
    const g = scope().gaps[state.type];
    $('gapCaption').textContent = `${scopeLabel()} · ${TYPE_ALL[state.type]} · найдено ${g.total} ${plural(g.total, 'запрос', 'запроса', 'запросов')}, показаны ${Math.min(g.total, g.list.length)} с наибольшим охватом каналов`;
    if (!g.list.length) {
      $('gapList').innerHTML = `<div class="card data-state"><span class="a-icon a-icon--circle-check a-icon--success"></span><div><b>Таких запросов нет</b><small>${state.dir === 'faq' ? 'В FAQ-запросах AI объясняет симптомы и почти не называет клиники. Смотрите цитирование сайта и ТОП-10 источников.' : 'В каждом запросе, где AI называет конкурентов, ОН КЛИНИК тоже названа.'}</small></div></div>`;
      return;
    }
    $('gapList').innerHTML = g.list.map((x) => `<div class="gap-item"><div class="gap-item__q">${esc(x.q)}</div>
      <div class="gap-item__ch" title="Каналы, где названы конкуренты">${x.ch.map((k) => `<img src="${IC[CH[k].icon]}" alt="${esc(CH[k].name)}" title="${esc(CH[k].name)}">`).join('')}</div>
      <div class="gap-item__meta"><span class="caption" style="align-self:center">Названы:</span>${x.comp.map((k) => `<span class="tag tag--comp">${esc(bname(k))}</span>`).join('')}</div></div>`).join('');
  }

  /* ---------- Metrika ---------- */
  function renderMetrika() {
    const M = D.metrika;
    const models = M.models.slice().sort((a, b) => b.visits - a.visits);
    const total = models.reduce((a, m) => a + m.visits, 0), goals = models.reduce((a, m) => a + m.goals, 0);
    const typed = M.types.reduce((a, t) => a + t.visits, 0);
    const top = models[0];
    const period = M.period ? `${M.period[0]}–${M.period[1]}` : '';
    $('mkCaption').textContent = `Период ${period.replace('-', '–')} · источник: отчёт Метрики по переходам из AI-моделей и ИИ-выдачи на onclinic.ru`;
    const conv = total ? goals / total * 100 : 0;
    const withGoals = models.filter((m) => m.goals > 0).map((m) => m.name);
    $('mkKpi').innerHTML = [
      `<div class="metric card metric--brand"><div class="metric__top"><span class="metric__label">Переходы из AI-моделей и ИИ-выдачи</span></div><div class="metric__value">${int(total)}</div><div class="metric__foot">визитов за год: ${models.map((m) => m.name).join(', ')}</div></div>`,
      `<div class="metric card"><div class="metric__top"><span class="metric__label">Избранные цели</span><span class="metric__delta ${goals ? 'up' : 'flat'}">${goals ? 'есть' : 'нет'}</span></div><div class="metric__value">${int(goals)}</div><div class="metric__foot">достижений · ${withGoals.length ? 'только из ' + withGoals.join(' и ') : 'ни из одного сервиса'}</div></div>`,
      `<div class="metric card"><div class="metric__top"><span class="metric__label">Конверсия в цели</span></div><div class="metric__value">${num(conv, 2)}%</div><div class="metric__foot">достижений на 100 визитов</div></div>`,
      `<div class="metric card"><div class="metric__top"><span class="metric__label">Главный источник</span></div><div class="metric__value">${esc(top.name)}</div><div class="metric__foot">${num(top.visits / total * 100)}% всех переходов из AI-моделей и ИИ-выдачи</div></div>`,
    ].join('');
    const maxV = Math.max(...models.map((m) => m.visits), 1);
    $('mkModels').innerHTML = models.map((m) => `<div class="mrow"><span class="mrow__label">${esc(m.name)}</span><span class="mrow__track"><i style="width:${(m.visits / maxV * 100).toFixed(1)}%"></i></span><span class="mrow__value">${int(m.visits)}</span><span class="mrow__goals"><span class="goal-pill${m.goals ? '' : ' is-zero'}">${m.goals ? int(m.goals) + ' ' + plural(m.goals, 'цель', 'цели', 'целей') : 'нет целей'}</span></span></div>`).join('') +
      `<div class="chart-note">Итого ${int(total)} визитов и ${int(goals)} достижений избранных целей. «Алиса» в Метрике объединяет модель (Алиса AI / YandexGPT) и ИИ-выдачу (Алиса на поиске): отдельно их отчёт не разделяет.</div>`;
    const colors = ['var(--brand-700)', 'var(--chart-2)'];
    const segs = M.types.map((t, i) => ({ name: t.name, v: t.visits, c: colors[i % 2] }));
    const sum = segs.reduce((a, x) => a + x.v, 0) || 1;
    $('mkTypes').innerHTML = `<div class="traffic-split" role="img" aria-label="${segs.map((x) => x.name + ' ' + num(x.v / sum * 100) + '%').join(', ')}">${segs.map((x) => `<span style="width:${(x.v / sum * 100).toFixed(2)}%;background:${x.c}">${x.v / sum > 0.12 ? num(x.v / sum * 100) + '%' : ''}</span>`).join('')}</div>
      <div class="traffic-legend">${segs.map((x) => `<div><i style="background:${x.c}"></i><span>${esc(x.name)}</span><b>${int(x.v)}</b><em>${num(x.v / sum * 100)}%</em></div>`).join('')}</div>
      <div class="chart-note">В выгрузке Метрики тип трафика дан одним итогом (${int(typed)} визитов), без разбивки по моделям, поэтому его нельзя точно отфильтровать до сервисов замера. Надёжнее смотреть доли, а не абсолютные визиты. Для точной цифры нужна выгрузка «тип трафика × модель».</div>`;
  }

  /* ---------- Method ---------- */
  function renderMethod() {
    const t = D.totals;
    const avail = CH_KEYS.map((k) => `${CH[k].name} — ${num(CH[k].src)}%${CH[k].cit ? '' : ' (н/д)'}`).join('; ');
    const items = [
      ['Объём замера', `<ul class="method-list"><li>AI-модели: ${CH_KEYS.filter((k) => CH[k].type === 'models').map((k) => CH[k].name).join(', ')} — ${int(t.prompts_models)} запросов, ${int(t.answers_models)} ответов.</li><li>ИИ-выдача: Google AI Overview и Алиса AI на поиске — ${int(t.answers_search)} ответов.</li><li>Направления: ${D.directions.map((d) => d.title).join(', ')}; FAQ в группах ${D.faq.map((f) => f.title).join(', ')}.</li><li>Дата съёма: ${D.meta.date}. Общих цифр по всем направлениям на дашборде нет: каждое направление считается отдельно.</li></ul>`],
      ['Два слоя данных: упоминания и ссылки', `<p>Каждый ответ AI проверяется дважды и независимо. <b>Упоминание</b> — клиника названа в тексте ответа. <b>Цитирование</b> — в источниках ответа есть ссылка на сайт клиники. Это разные сигналы: в справочных запросах (FAQ) AI часто берёт статью клиники как источник, но саму клинику не называет, поэтому цитирование бывает выше нуля при нулевой упоминаемости. Базы тоже разные: упоминания считаются от всех ответов среза, цитирование — от ответов каналов, которые отдают источники.</p><p>Цитирование клиники складывает все её сайты (например, plastica.onclinic.ru и onclinic.ru): ответ засчитывается один раз, если в нём есть ссылка хотя бы на один сайт. В ТОП-10 сайты идут отдельными строками, поэтому там цифры по каждому сайту меньше общей.</p>`],
      ['Метрики', `<ul class="method-list"><li><b>Упоминаемость</b> — доля ответов среза, где клиника названа в тексте.</li><li><b>Доля голоса (SOV)</b> — доля клиники среди всех упоминаний шести клиник направления.</li><li><b>Позиция</b> — среднее место клиники среди клиник направления по порядку первого упоминания в ответе.</li><li><b>Назван первым</b> — доля ответов с упоминанием, где клиника названа раньше остальных.</li><li><b>Цитирование</b> — доля ответов с источниками, где есть ссылка на любой сайт клиники (домен и поддомены).</li><li><b>ТОП-10 сайтов</b> — доля ответов, где сайт указан хотя бы одной ссылкой. Один ответ засчитывает сайт один раз.</li></ul>`],
      ['Конкуренты и словари', `<p>Пластическая хирургия и FAQ по пластике: ОН КЛИНИК, Фрау Клиник, СМ-Пластика, Медси, Доктор Пластик, ФНКЦ ФМБА. Остальные направления и FAQ: ОН КЛИНИК, СМ-Клиника, ФНКЦ ФМБА, Семейный доктор, Чудо Доктор, Медси.</p><p>Упоминания ищутся по словарю написаний (например, «Он Клиник», «ОН КЛИНИК», OnClinic). Ссылки внутри текста перед поиском вырезаются, чтобы адрес вроде prodoctorov.ru/…/frau-klinik не считался упоминанием. «Семейный доктор» засчитывается только как название: с заглавной буквы или в кавычках. ФМБА засчитывается по упоминаниям «ФНКЦ» и «ФМБА».</p><p>Сайты: ${Object.keys(D.brands).map((k) => `${D.brands[k].name} — <code>${D.brands[k].domain}</code>`).join(', ')}. Региональные сайты-франшизы (onclinic-ryazan.ru и т.п.) не засчитываются.</p>`],
      ['Источники и правило «н/д»', `<p>Источники берутся из поля «Источники» и из ссылок в тексте ответа, затем дедуплицируются. Служебные ссылки поиска (google.com/searchviewer, ya.ru/search, рекламные yabs.yandex.ru) исключены.</p><p>Канал участвует в цитировании, если ссылки есть минимум в ${Math.round(D.meta.cit_min * 100)}% его ответов. Доля ответов со ссылками: ${avail}. Для DeepSeek и GigaChat цитирование показано как «н/д», а не 0%.</p>`],
      ['Ограничения', `<ul class="method-list"><li>Пулы запросов для AI-моделей и ИИ-выдачи разные, поэтому их цифры не складываются и сравниваются только внутри своего типа.</li><li>FAQ-группы маленькие (12–13 запросов, 24–65 ответов в срезе) — показатели индикативные.</li><li>Метрика — по всему onclinic.ru за год, без разбивки по направлениям. Показаны только сервисы, которые есть в замере; строка «Алиса» в Метрике объединяет YandexGPT (Алиса AI) и Алису на поиске. Тип трафика в выгрузке дан без разбивки по моделям.</li><li>Разметка упоминаний автоматическая, по словарю; редкие написания могут не попасть в подсчёт.</li></ul>`],
    ];
    $('methodAcc').innerHTML = items.map(([h, b], i) => `<details${i === 0 ? ' open' : ''}><summary>${h}</summary><div class="accordion__body">${b}</div></details>`).join('');
  }

  function labelTables() {
    document.querySelectorAll('table').forEach((table) => {
      const labels = [...table.querySelectorAll('thead tr:last-child th')].map((th) => th.textContent.trim());
      table.querySelectorAll('tbody tr').forEach((row) => [...row.querySelectorAll('td')].forEach((td, i) => { if (!td.dataset.label) td.dataset.label = labels[i + 1] || ''; }));
    });
  }

  function update() {
    if (!D.scopes[scopeKey()]) state.dir = 'plastic';
    if (state.ch !== 'all' && (!CH[state.ch] || CH[state.ch].type !== state.type)) state.ch = 'all';
    renderControls(); renderOverview(); renderCompetitors(); renderHeatmap(); renderTop(); renderGaps(); labelTables(); save();
    $('sliceFabText').textContent = `${scopeLabel()} · ${chLabel()}`;
  }

  // Телефон: панель среза не липкая, поэтому показываем плавающую кнопку с текущим срезом
  const fab = $('sliceFab'), bar = $('slicebar'), mq = matchMedia('(max-width: 767px)');
  let ticking = false;
  const syncFab = () => {
    ticking = false;
    const show = mq.matches && bar.getBoundingClientRect().bottom < 0;
    if (fab.hidden === show) { fab.hidden = !show; document.body.classList.toggle('has-fab', show); }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(syncFab); } }, { passive: true });
  addEventListener('resize', syncFab);
  mq.addEventListener ? mq.addEventListener('change', syncFab) : mq.addListener(syncFab);
  fab.addEventListener('click', () => bar.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));

  // Подсветка активного раздела в навигации
  const navLinks = [...document.querySelectorAll('.nav a')];
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id)); });
  }, { rootMargin: '-40% 0px -55% 0px' }) : null;
  if (io) navLinks.forEach((a) => { const t = document.querySelector(a.getAttribute('href')); if (t) io.observe(t); });

  renderHero(); renderMetrika(); renderMethod(); update();
})();
