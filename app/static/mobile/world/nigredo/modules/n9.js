/* static/mobile/world/nigredo/modules/n9.js */

const N9_STATE = {
    mode: 'zodiac',        // 'zodiac' or 'jyotish'
    ayanamsa: 'lahiri',
    segment: 1, 
    data: [],       
    meta: {}, 
    isRendering: false
};

const MAP = {
    "Sun": { s: "☉", c: "glow-sun" }, "Moon": { s: "☽", c: "glow-moon" },
    "Mars": { s: "♂", c: "glow-mars" }, "Mercury": { s: "☿", c: "glow-mercury" },
    "Jupiter": { s: "♃", c: "glow-jupiter" }, "Venus": { s: "♀", c: "glow-venus" },
    "Saturn": { s: "♄", c: "glow-saturn" }, "Rahu": { s: "☊", c: "glow-rahu" }, "Ketu": { s: "☋", c: "glow-ketu" },
    "North Node": { s: "☊", c: "glow-rahu" }, "South Node": { s: "☋", c: "glow-ketu" },
    "North Node (t)": { s: "☊", c: "glow-rahu" }, "South Node (t)": { s: "☋", c: "glow-ketu" },
    "North Node (m)": { s: "☊", c: "glow-rahu" }, "South Node (m)": { s: "☋", c: "glow-ketu" },
    "Aries": { s: "♈︎", c: "glow-fire" }, "Taurus": { s: "♉︎", c: "glow-earth" }, "Gemini": { s: "♊︎", c: "glow-air" },
    "Cancer": { s: "♋︎", c: "glow-water" }, "Leo": { s: "♌︎", c: "glow-fire" }, "Virgo": { s: "♍︎", c: "glow-earth" },
    "Libra": { s: "♎︎", c: "glow-air" }, "Scorpio": { s: "♏︎", c: "glow-water" }, "Sagittarius": { s: "♐︎", c: "glow-fire" },
    "Capricorn": { s: "♑︎", c: "glow-earth" }, "Aquarius": { s: "♒︎", c: "glow-air" }, "Pisces": { s: "♓︎", c: "glow-water" }
};

const AYANAMSAS = [
    { id: 'lahiri', label: 'Lahiri' }, { id: 'raman', label: 'Raman' },
    { id: 'kp', label: 'KP' }, { id: 'fagan-bradley', label: 'Fagan' },
    { id: 'yukteswar', label: 'Yukteswar' }
];

let n9ToastTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    loadStateFromUrl();
    updateUI();
    bindControls();
    
    document.addEventListener('click', (e) => {
        const cell = e.target.closest('.m-hoverable');
        if (cell && cell.dataset.info) {
            e.stopPropagation();
            showN9Toast(cell.dataset.info);
        }
    });

    renderSkeleton();
    fetchTimeline();
});

window.showToggleTooltip = function(id, leftText, rightText, isLeft) {
    const tooltip = document.getElementById(id);
    if(tooltip) { tooltip.textContent = isLeft ? leftText : rightText; tooltip.style.opacity = '1'; }
};
window.hideToggleTooltip = function(id) {
    const tooltip = document.getElementById(id);
    if(tooltip) tooltip.style.opacity = '0';
};

function formatToastHTML(text) {
    if (!text) return '';
    let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const parts = html.split('|');
    if (parts.length > 1) {
        html = `<strong style="color:#7CFF9B; font-size:1.1em;">${parts[0].trim()}</strong><br><span style="color:#fff;">${parts[1].trim()}</span>`;
    }
    const symMap = { 
        '☉': 'glow-sun', '☽': 'glow-moon', '♂': 'glow-mars', '☿': 'glow-mercury', 
        '♃': 'glow-jupiter', '♀': 'glow-venus', '♄': 'glow-saturn', '☊': 'glow-rahu', '☋': 'glow-ketu' 
    };
    for (const [sym, cls] of Object.entries(symMap)) {
        const displaySym = (sym === '♀' || sym === '♂') ? sym + '\uFE0E' : sym;
        html = html.split(sym).join(`<span class="${cls}" style="font-weight:bold; font-size:1.1em;">${displaySym}</span>`);
    }
    return html;
}

function showN9Toast(rawInfo) {
    const toast = document.getElementById('m-n9-toast');
    if (!toast) return;
    
    let content = rawInfo.includes('<strong') ? rawInfo : formatToastHTML(rawInfo);
    toast.innerHTML = `<div style="display: block; width: 100%; text-align: center; line-height: 1.5;">${content}</div>`;
    
    if (toast.classList.contains('m-toast-hidden')) {
        toast.classList.remove('m-toast-hidden');
    }
    
    if (n9ToastTimer) clearTimeout(n9ToastTimer);
    n9ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 3500);
}

const renderSym = (key, info = null) => {
    if (!key || key === '-') return '<span class="sym-none">-</span>';
    let entry = MAP[key] || Object.values(MAP).find(v => v.s === key);
    const sym = entry ? entry.s : key; 
    const cls = entry ? entry.c : 'n9-text';
    if (info) {
        return `<span class="n9-sym ${cls} m-hoverable" data-info="${info.replace(/"/g, '&quot;')}">${sym}</span>`;
    }
    return `<span class="n9-sym ${cls}">${sym}</span>`;
};

function loadStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('mode')) N9_STATE.mode = params.get('mode');
    if (params.has('ayanamsa')) N9_STATE.ayanamsa = params.get('ayanamsa');
    if (params.has('seg')) N9_STATE.segment = parseInt(params.get('seg')) || 1;
}

function updateUrl() {
    const url = new URL(window.location);
    url.searchParams.set('module', 'n9');
    url.searchParams.set('mode', N9_STATE.mode);
    if (N9_STATE.mode === 'zodiac') {
        url.searchParams.set('seg', N9_STATE.segment);
        url.searchParams.delete('ayanamsa');
    } else {
        url.searchParams.set('ayanamsa', N9_STATE.ayanamsa);
        url.searchParams.delete('seg');
    }
    window.history.pushState({}, '', url);
}

function showLoader() { 
    const l = document.getElementById('m-n9-loading');
    if (l) {
        if (l.parentNode !== document.body) document.body.appendChild(l);
        l.style.display = 'flex'; 
    }
}
function hideLoader() { 
    const l = document.getElementById('m-n9-loading');
    l.style.opacity = '0'; setTimeout(() => { l.style.display = 'none'; l.style.opacity = '1'; }, 400); 
}

window.switchN9Mode = function() {
    if (N9_STATE.isRendering) return;
    showLoader();
    N9_STATE.mode = (N9_STATE.mode === 'zodiac') ? 'jyotish' : 'zodiac';
    N9_STATE.segment = 1;
    updateUrl();
    updateUI();
    setTimeout(() => { renderSkeleton(); fetchTimeline(); }, 50);
};

function bindControls() {
    const bar = document.getElementById('n9-ayanamsa-bar');
    if(bar) {
        bar.innerHTML = '';
        AYANAMSAS.forEach(a => {
            const btn = document.createElement('button');
            btn.className = 'm-tab';
            btn.dataset.aya = a.id; 
            if(N9_STATE.ayanamsa === a.id) btn.classList.add('active');
            btn.textContent = a.label;
            btn.onclick = (e) => {
                if (N9_STATE.isRendering) return;
                e.stopPropagation(); 
                N9_STATE.ayanamsa = a.id; 
                updateUrl(); 
                updateUI(); 
                fetchTimeline();
            };
            bar.appendChild(btn);
        });
    }
}

function updateUI() {
    const mainKnob = document.getElementById('n9-dicho-knob');
    const ayaBar = document.getElementById('n9-ayanamsa-bar');
    
    if (N9_STATE.mode === 'zodiac') {
        if(mainKnob) mainKnob.style.left = '2px';
        if(ayaBar) { ayaBar.classList.add('m-hidden'); ayaBar.style.display = 'none'; }
        document.getElementById('n9-label-zodiac').classList.add('active');
        document.getElementById('n9-label-jyotish').classList.remove('active');
    } else {
        if(mainKnob) mainKnob.style.left = '24px';
        if(ayaBar) { ayaBar.classList.remove('m-hidden'); ayaBar.style.display = 'flex'; }
        document.getElementById('n9-label-zodiac').classList.remove('active');
        document.getElementById('n9-label-jyotish').classList.add('active');
        
        document.querySelectorAll('#n9-ayanamsa-bar .m-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.aya === N9_STATE.ayanamsa);
        });
    }

    document.querySelectorAll('.n9-seg-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.seg) === N9_STATE.segment);
    });
}

async function fetchTimeline() {
    if (N9_STATE.isRendering) return;
    showLoader(); 
    
    try {
        const rawSeed = localStorage.getItem('active_seed');
        if (!rawSeed) { hideLoader(); return; }
        const seed = JSON.parse(rawSeed);

        const response = await fetch('/api/astro/chronomantia/timeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seed: seed, mode: N9_STATE.mode, ayanamsa: N9_STATE.ayanamsa })
        });
        const resData = await response.json();
        
        if (resData.status === 'success') {
            N9_STATE.data = resData.data.timeline;
            N9_STATE.meta = resData.data.meta || {};
            renderSkeleton(); 
            renderBodyAsync(); 
        } else {
            hideLoader();
        }
    } catch (e) { hideLoader(); }
}

function renderSkeleton() {
    const thead = document.getElementById('n9-table-head');
    if (!thead) return;

    const m = N9_STATE.meta || {};
    const lots = m.lots || {};

    const mkBtn = (seg, roman) => `<button class="n9-seg-btn ${N9_STATE.segment === seg ? 'active' : ''}" data-seg="${seg}">${roman}</button>`;

    const dateHeader = `
        <th rowspan="3" class="th-top-cat n9-date-col-header">
            <div class="n9-header-date-label">DATE</div>
            <div class="n9-seg-control">
                <div class="n9-seg-row">
                    ${mkBtn(1, 'I')}${mkBtn(2, 'II')}${mkBtn(3, 'III')}
                </div>
                <div class="n9-seg-row">
                    ${mkBtn(4, 'IV')}${mkBtn(5, 'V')}${mkBtn(6, 'VI')}
                </div>
            </div>
        </th>`;

    if (N9_STATE.mode === 'zodiac') {
        thead.innerHTML = `<tr>${dateHeader}
            <th colspan="9" class="th-top-cat th-white-title">ZODIACAL RELEASING</th>
            <th colspan="2" class="th-top-cat th-white-title m-hoverable" data-info="Sect | ${m.sect||''}">FIRDARIA</th>
            <th rowspan="3" class="th-top-cat th-prof th-red-title m-hoverable" data-info="Ascendant | ${m.ascendant||''}">PROFECTIONS</th>
            <th rowspan="2" colspan="5" class="th-top-cat th-transit th-gray-title">TRANSITS</th></tr>
        <tr>
            <th colspan="3" class="th-mid-cat th-spirit-head m-hoverable" data-info="Spirit | ${lots.Spirit||''}">SPIRIT</th>
            <th colspan="3" class="th-mid-cat th-fortune-head m-hoverable" data-info="Fortune | ${lots.Fortune||''}">FORTUNE</th>
            <th colspan="3" class="th-mid-cat th-eros-head m-hoverable" data-info="Eros | ${lots.Eros||''}">EROS</th>
            <th rowspan="2" class="th-mid-cat th-firdaria">M</th><th rowspan="2" class="th-mid-cat th-firdaria">S</th>
        </tr>
        <tr><th class="th-bot-cat th-spirit">L1</th><th class="th-bot-cat th-spirit">L2</th><th class="th-bot-cat th-spirit">L3</th><th class="th-bot-cat th-fortune">L1</th><th class="th-bot-cat th-fortune">L2</th><th class="th-bot-cat th-fortune">L3</th><th class="th-bot-cat th-eros">L1</th><th class="th-bot-cat th-eros">L2</th><th class="th-bot-cat th-eros">L3</th>
        <th class="th-bot-cat th-transit"><span class="transit-symbol-ju">♃</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-sa">♄</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-ur">♅</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-ne">♆</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-pl">♇</span></th></tr>`;
        
        document.querySelectorAll('.n9-seg-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation(); if(N9_STATE.isRendering) return;
                showLoader(); 
                N9_STATE.segment = parseInt(btn.dataset.seg);
                updateUrl(); 
                updateUI();
                setTimeout(() => { renderBodyAsync(); }, 50); 
            };
        });
    } else if (N9_STATE.mode === 'jyotish') {
        thead.innerHTML = `<tr>
            <th class="th-top-cat n9-date-col-header" rowspan="2" style="vertical-align: middle;">
                <div class="n9-header-date-label" style="margin: 0;">DATE</div>
            </th>
            <th class="th-top-cat th-age" rowspan="2" style="vertical-align: middle;">AGE</th>
            <th class="th-top-cat th-mahadasha m-hoverable" data-info="Sidereal Moon | ${m.moon_position || ''}">MAHADASHA</th>
            <th class="th-top-cat th-antardasha">ANTARDASHA</th>
            <th class="th-top-cat th-pratyantardasha">PRATYANTARDASHA</th></tr>
        <tr>
            <th class="th-bot-cat th-mahadasha">L1</th>
            <th class="th-bot-cat th-antardasha">L2</th>
            <th class="th-bot-cat th-pratyantardasha">L3</th>
        </tr>`;
    }
}

function renderBodyAsync() {
    const tbody = document.getElementById('n9-table-body');
    if (!tbody || !N9_STATE.data) return;
    
    tbody.innerHTML = '';
    N9_STATE.isRendering = true;

    let filteredData = [];
    if (N9_STATE.mode === 'zodiac') {
        const startAge = (N9_STATE.segment - 1) * 12;
        const endAge = startAge + 12;
        filteredData = N9_STATE.data.filter(row => {
            const age = Number(row.age);
            return age >= startAge && age < endAge;
        });
    } else {
        filteredData = N9_STATE.data;
    }

    const now = new Date();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    
    let todayRowIndex = -1;
    for (let i = 0; i < filteredData.length; i++) {
        const rowDate = (filteredData[i].date || "").split('T')[0];
        const nextDate = filteredData[i].next_date; 
        if (rowDate <= todayStr && todayStr < nextDate) {
            todayRowIndex = i; break;
        }
    }

    let index = 0;
    const chunkSize = 60; 
    const total = filteredData.length; 

    function renderChunk() {
        try {
            const fragment = document.createDocumentFragment();
            const end = Math.min(index + chunkSize, total);
            for (let i = index; i < end; i++) {
                const isTodayRow = (i === todayRowIndex);
                fragment.appendChild(createN9RowElement(filteredData[i], isTodayRow));
            }
            tbody.appendChild(fragment);
            index = end;
            
            if (index < total) { requestAnimationFrame(renderChunk); } 
            else { N9_STATE.isRendering = false; hideLoader(); }
        } catch (err) { N9_STATE.isRendering = false; hideLoader(); }
    }
    requestAnimationFrame(renderChunk);
}

function createN9RowElement(row, isTodayRow) {
    const tr = document.createElement('tr');
    tr.className = 'n9-row';
    if (isTodayRow) tr.classList.add('n9-today-row');
    
    const dateStr = row.date.split('T')[0];
    let html = `<td class="n9-date-col">${dateStr}</td>`;

    const getLordTags = (lords, pName) => {
        if (!lords) return "";
        let isDay = (lords.day === pName || (lords.day && lords.day.includes(pName)));
        let isHour = (lords.hour === pName);
        if (isDay && isHour) return `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord] [Hour Lord]</strong><br>`;
        if (isDay) return `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord]</strong><br>`;
        if (isHour) return `<strong style="color:#FFD700; font-size:0.85em;">[Hour Lord]</strong><br>`;
        return "";
    };

    // 🚀 [수복 2]: N9 메타데이터 구조에 맞춘 Firdaria 포맷터
    const getNatal = (pName) => {
        if (!pName || pName === '-') return null;

        let trop = N9_STATE.meta?.tropical_planets?.[pName] || "";
        let sid = N9_STATE.meta?.sidereal_planets?.[pName] || "";
        let oldNatal = N9_STATE.meta?.natal_planets?.[pName] || "";

        let tropStr = trop.split(/\\n|\n/)[0];
        let sidStr = sid.split(/\\n|\n/)[0];

        if (pName === 'Rahu' || pName === 'Ketu') {
            if (tropStr.includes('|')) tropStr = tropStr.split('|')[0].trim();
            if (sidStr.includes('|')) sidStr = sidStr.split('|')[0].trim();
            if (oldNatal.includes('|')) oldNatal = oldNatal.split('|')[0].trim();
        }

        const fullText = tropStr + " " + sidStr + " " + oldNatal;
        const isDayText = /\[Day Lord\]/i.test(fullText);
        const isHourText = /\[Hour Lord\]/i.test(fullText);
        
        const lordHtml = getLordTags(N9_STATE.meta?.lords, pName);
        const isDay = isDayText || lordHtml.includes('Day Lord');
        const isHour = isHourText || lordHtml.includes('Hour Lord');

        const cleanTxt = (str) => str.replace(/\[Day Lord\]/gi, '').replace(/\[Hour Lord\]/gi, '').trim();

        let infoHtml = `<strong style="color:#7CFF9B; font-size:1.1em;">${pName}</strong><br>`;
        if (isDay && isHour) infoHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord] [Hour Lord]</strong><br>`;
        else if (isDay) infoHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord]</strong><br>`;
        else if (isHour) infoHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Hour Lord]</strong><br>`;

        let lines = [];
        if (tropStr) lines.push(cleanTxt(tropStr));
        if (sidStr) lines.push(cleanTxt(sidStr));
        if (!tropStr && !sidStr && oldNatal) lines.push(cleanTxt(oldNatal));
        
        infoHtml += lines.join('<br>');
        return infoHtml;
    };

    // 🚀 [수복 3]: N9 메타데이터 구조에 맞춘 Jyotish 포맷터 (Pada 번역기 제거)
    const getJyoNatal = (pName) => {
        if (!pName || pName === '-') return null;

        let trop = N9_STATE.meta?.tropical_planets?.[pName] || "";
        let sid = N9_STATE.meta?.sidereal_planets?.[pName] || "";

        let tropStr = trop.split(/\\n|\n/)[0];
        let parts = sid.split(/\\n|\n/);
        let sidStr = parts[0] || "";
        let nakStr = parts.length > 1 ? parts.slice(1).join(" ") : "";

        if (pName === 'Rahu' || pName === 'Ketu') {
            if (tropStr.includes('|')) tropStr = tropStr.split('|')[0].trim();
            if (sidStr.includes('|')) sidStr = sidStr.split('|')[0].trim();
        }

        const fullText = tropStr + " " + sidStr + " " + nakStr;
        const isDayText = /\[Day Lord\]/i.test(fullText);
        const isHourText = /\[Hour Lord\]/i.test(fullText);
        
        const lordHtml = getLordTags(N9_STATE.meta?.lords, pName);
        const isDay = isDayText || lordHtml.includes('Day Lord');
        const isHour = isHourText || lordHtml.includes('Hour Lord');

        const cleanTxt = (str) => str.replace(/\[Day Lord\]/gi, '').replace(/\[Hour Lord\]/gi, '').trim();

        let infoHtml = `<strong style="color:#7CFF9B; font-size:1.1em;">${pName}</strong><br>`;
        if (isDay && isHour) infoHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord] [Hour Lord]</strong><br>`;
        else if (isDay) infoHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord]</strong><br>`;
        else if (isHour) infoHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Hour Lord]</strong><br>`;

        let lines = [];
        if (tropStr) lines.push(cleanTxt(tropStr));
        if (sidStr) lines.push(cleanTxt(sidStr));
        if (nakStr) lines.push(cleanTxt(nakStr));

        infoHtml += lines.join('<br>');
        return infoHtml;
    };

    if (N9_STATE.mode === 'zodiac') {
        const mkZR = (lot) => {
            const z = row.zr[lot];
            const t1 = z.l1_lb ? "Loosing of the Bonds (LB)" : null;
            const t2 = z.l2_lb ? "Loosing of the Bonds (LB)" : null;
            const t3 = z.l3_lb ? "Loosing of the Bonds (LB)" : null;
            return `<td class="n9-cell-zr ${z.l1_lb?'n9-cell-lb':''}">${renderSym(z.l1, t1)}</td>
                    <td class="n9-cell-zr ${z.l2_lb?'n9-cell-lb':''}">${renderSym(z.l2, t2)}</td>
                    <td class="n9-cell-zr ${z.l3_lb?'n9-cell-lb':''}">${renderSym(z.l3, t3)}</td>`;
        };
        
        html += mkZR('spirit') + mkZR('fortune') + mkZR('eros');
        html += `<td class="n9-cell-firdaria">${renderSym(row.firdaria.main, getNatal(row.firdaria.main))}</td>
                 <td class="n9-cell-firdaria">${renderSym(row.firdaria.sub, getNatal(row.firdaria.sub))}</td>
                 <td class="n9-cell-prof">${renderSym(row.profections)}</td>`;
                 
        ['Jupiter','Saturn','Uranus','Neptune','Pluto'].forEach(p => {
            const t = row.transits[p] || {};
            const tInfo = t.full_text ? `<strong style="color:#7CFF9B; font-size:1.1em;">T_${p}</strong><br><br>${t.full_text.replace(/\\n|\n/g, '<br>')}` : null;
            html += `<td class="n9-cell-transit">${renderSym(t.sign, tInfo)}</td>`;
        });
    } else {
        html += `<td class="n9-cell-age">${row.age}</td>
                 <td class="n9-cell-dasha-l1" style="color:#8700FF">${renderSym(row.l1, getJyoNatal(row.l1))}</td>
                 <td class="n9-cell-dasha-l2" style="color:#BE75FF">${renderSym(row.l2, getJyoNatal(row.l2))}</td>
                 <td class="n9-cell-dasha-l3" style="color:#EBD4FF">${renderSym(row.l3, getJyoNatal(row.l3))}</td>`;
    }

    tr.innerHTML = html;
    return tr;
}

window.saveToGrimoire = async function() {
    const activeSeedRaw = localStorage.getItem('active_seed');
    const activeSeed = activeSeedRaw ? JSON.parse(activeSeedRaw) : {};
    
    if (!activeSeed.birth_date) {
        alert("No active seed data found in localStorage.");
        return false;
    }

    const lang = localStorage.getItem('tetramegistus_lang') || 'ko';
    const compilerId = N9_STATE.mode === 'jyotish' ? 'n9_vd' : 'n9';

    const payload = {
        seed_id: activeSeed.id ?? activeSeed.idx ?? "unknown",
        stage: 'Nigredo', 
        target_name: activeSeed.name || "Unknown",
        language: lang,
        metadata: {
            view_mode: N9_STATE.mode,
            ayanamsa: N9_STATE.ayanamsa,
            sys_tab: 'tropical',
            segment: N9_STATE.segment 
        },
        seed: activeSeed 
    };

    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        if (res.ok) {
            const saveBtn = document.querySelector('.btn-save-grimoire');
            if (saveBtn) {
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '✔ Archived';
                saveBtn.classList.add('success');
                setTimeout(() => {
                    saveBtn.innerHTML = originalText;
                    saveBtn.classList.remove('success');
                }, 3000);
            }
            return true; 
        } else {
            throw new Error(result.detail || result.error);
        }
    } catch (e) { throw e; }
};