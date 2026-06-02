/* static/mobile/world/albedo/modules/a9.js */

const A9_STATE = {
    mode: 'zodiac',        // 'zodiac' or 'jyotish'
    subMode: 'davison',    // 'davison' or 'synastry'
    ayanamsa: 'lahiri',
    segment: 1, 
    data: [],       
    meta: { A: {}, B: {}, Davison: {} }, 
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
    "Capricorn": { s: "♑︎", c: "glow-earth" }, "Aquarius": { s: "♒︎", c: "glow-air" }, "Pisces": { s: "♓︎", c: "glow-water" },
    "☉": { s: "☉", c: "glow-sun" }, "☽": { s: "☽", c: "glow-moon" }, "♂": { s: "♂", c: "glow-mars" },
    "☿": { s: "☿", c: "glow-mercury" }, "♃": { s: "♃", c: "glow-jupiter" }, "♀": { s: "♀", c: "glow-venus" },
    "♄": { s: "♄", c: "glow-saturn" }, "☊": { s: "☊", c: "glow-rahu" }, "☋": { s: "☋", c: "glow-ketu" },
    "♈︎": { s: "♈︎", c: "glow-fire" }, "♉︎": { s: "♉︎", c: "glow-earth" }, "♊︎": { s: "♊︎", c: "glow-air" },
    "♋︎": { s: "♋︎", c: "glow-water" }, "♌︎": { s: "♌︎", c: "glow-fire" }, "♍︎": { s: "♍︎", c: "glow-earth" },
    "♎︎": { s: "♎︎", c: "glow-air" }, "♏︎": { s: "♏︎", c: "glow-water" }, "♐︎": { s: "♐︎", c: "glow-fire" },
    "♑︎": { s: "♑︎", c: "glow-earth" }, "♒︎": { s: "♒︎", c: "glow-air" }, "♓︎": { s: "♓︎", c: "glow-water" }
};

const AYANAMSAS = [
    { id: 'lahiri', label: 'Lahiri' }, { id: 'raman', label: 'Raman' },
    { id: 'kp', label: 'KP' }, { id: 'fagan-bradley', label: 'Fagan' },
    { id: 'yukteswar', label: 'Yukteswar' }
];

let a9ToastTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    loadStateFromUrl();
    updateUI();
    bindControls();
    
    document.addEventListener('click', (e) => {
        const cell = e.target.closest('.m-hoverable');
        if (cell && cell.dataset.info) {
            e.stopPropagation();
            showA9Toast(cell.dataset.info);
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
        html = `<strong style="color:#49dce1; font-size:1.1em;">${parts[0].trim()}</strong><br><span style="color:#fff;">${parts[1].trim()}</span>`;
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

function showA9Toast(rawInfo) {
    const toast = document.getElementById('m-a9-toast');
    if (!toast) return;
    
    // 🚀 [수복]: Jyotish 포맷처럼 이미 HTML 태그(<strong 등)가 있는 경우 텍스트 치환(formatToastHTML)을 건너뛰어 파괴를 막음
    let content = rawInfo.includes('<strong') ? rawInfo : formatToastHTML(rawInfo);
    
    // 🚀 [수복]: 이전 토스트가 내려가길 기다리지 않고 바로 내용 갈아끼우기 (Snap 반응)
    toast.innerHTML = `<div style="display: block; width: 100%; text-align: center; line-height: 1.5;">${content}</div>`;
    
    // 닫혀있었다면 열어줌
    if (toast.classList.contains('m-toast-hidden')) {
        toast.classList.remove('m-toast-hidden');
    }
    
    // 타이머만 초기화해서 계속 떠 있게 유지
    if (a9ToastTimer) clearTimeout(a9ToastTimer);
    a9ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 3500);
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
    if (params.has('mode')) A9_STATE.mode = params.get('mode');
    if (params.has('subMode')) A9_STATE.subMode = params.get('subMode');
    if (params.has('ayanamsa')) A9_STATE.ayanamsa = params.get('ayanamsa');
    if (params.has('seg')) A9_STATE.segment = parseInt(params.get('seg')) || 1;
}

function updateUrl() {
    const url = new URL(window.location);
    url.searchParams.set('module', 'a9');
    url.searchParams.set('mode', A9_STATE.mode);
    if (A9_STATE.mode === 'zodiac') {
        url.searchParams.set('subMode', A9_STATE.subMode);
        url.searchParams.set('seg', A9_STATE.segment);
        url.searchParams.delete('ayanamsa');
    } else {
        url.searchParams.set('ayanamsa', A9_STATE.ayanamsa);
        url.searchParams.delete('subMode');
        url.searchParams.delete('seg');
    }
    window.history.pushState({}, '', url);
}

// 🚀 [수복 1]: 부모 z-index의 한계를 부수고 Body 최상단으로 강제 이주
function showLoader() { 
    const l = document.getElementById('m-a9-loading');
    if (l) {
        if (l.parentNode !== document.body) document.body.appendChild(l);
        l.style.display = 'flex'; 
    }
}
function hideLoader() { 
    const l = document.getElementById('m-a9-loading');
    l.style.opacity = '0'; setTimeout(() => { l.style.display = 'none'; l.style.opacity = '1'; }, 400); 
}

window.switchA9Mode = function() {
    if (A9_STATE.isRendering) return;
    showLoader();
    A9_STATE.mode = (A9_STATE.mode === 'zodiac') ? 'jyotish' : 'zodiac';
    A9_STATE.segment = 1;
    updateUrl();
    updateUI();
    setTimeout(() => { renderSkeleton(); fetchTimeline(); }, 50);
};

window.switchA9SubMode = function() {
    if (A9_STATE.isRendering || A9_STATE.mode === 'jyotish') return;
    showLoader();
    A9_STATE.subMode = (A9_STATE.subMode === 'davison') ? 'synastry' : 'davison';
    A9_STATE.segment = 1;
    updateUrl();
    updateUI();
    setTimeout(() => { renderSkeleton(); fetchTimeline(); }, 50);
};

function bindControls() {
    const bar = document.getElementById('a9-ayanamsa-bar');
    if(bar) {
        bar.innerHTML = '';
        AYANAMSAS.forEach(a => {
            const btn = document.createElement('button');
            btn.className = 'm-tab';
            btn.dataset.aya = a.id; 
            if(A9_STATE.ayanamsa === a.id) btn.classList.add('active');
            btn.textContent = a.label;
            btn.onclick = (e) => {
                if (A9_STATE.isRendering) return;
                e.stopPropagation(); 
                A9_STATE.ayanamsa = a.id; 
                updateUrl(); 
                updateUI(); 
                fetchTimeline();
            };
            bar.appendChild(btn);
        });
    }
}

function updateUI() {
    const mainKnob = document.getElementById('a9-dicho-knob');
    const subWrap = document.getElementById('a9-sub-switch-wrapper');
    const ayaBar = document.getElementById('a9-ayanamsa-bar');
    
    if (A9_STATE.mode === 'zodiac') {
        if(mainKnob) mainKnob.style.left = '2px';
        if(subWrap) subWrap.style.display = 'flex'; 
        if(ayaBar) { ayaBar.classList.add('m-hidden'); ayaBar.style.display = 'none'; }
        document.getElementById('a9-label-zodiac').classList.add('active');
        document.getElementById('a9-label-jyotish').classList.remove('active');
        
        const subKnob = document.getElementById('a9-sub-knob');
        if (A9_STATE.subMode === 'davison') {
            if(subKnob) subKnob.style.left = '2px';
            document.getElementById('a9-label-davison').classList.add('active');
            document.getElementById('a9-label-synastry').classList.remove('active');
        } else {
            if(subKnob) subKnob.style.left = '24px';
            document.getElementById('a9-label-davison').classList.remove('active');
            document.getElementById('a9-label-synastry').classList.add('active');
        }
    } else {
        if(mainKnob) mainKnob.style.left = '24px';
        if(subWrap) subWrap.style.display = 'none'; 
        if(ayaBar) { ayaBar.classList.remove('m-hidden'); ayaBar.style.display = 'flex'; }
        document.getElementById('a9-label-zodiac').classList.remove('active');
        document.getElementById('a9-label-jyotish').classList.add('active');
        
        document.querySelectorAll('#a9-ayanamsa-bar .m-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.aya === A9_STATE.ayanamsa);
        });
    }

    document.querySelectorAll('.n9-seg-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.seg) === A9_STATE.segment);
    });
}

async function fetchTimeline() {
    if (A9_STATE.isRendering) return;
    showLoader(); 
    
    try {
        const url = `/api/astro/synchronicum/reading?mode=${A9_STATE.mode}&subMode=${A9_STATE.subMode}&ayanamsa=${A9_STATE.ayanamsa}`;
        const response = await fetch(url);
        const resData = await response.json();
        
        if (resData.status === 'success' || resData.data) {
            const coreData = resData.data || resData; 
            A9_STATE.data = coreData.timeline;
            A9_STATE.meta = coreData.meta || { A: {}, B: {}, Davison: {} };
            
            renderSkeleton(); 
            renderBodyAsync(); 
        } else {
            hideLoader();
        }
    } catch (e) { hideLoader(); }
}

function renderSkeleton() {
    const thead = document.getElementById('a9-table-head');
    if (!thead) return;

    const m = A9_STATE.meta || {};
    const getM = (sys, cat, key) => (m[sys] && m[sys][cat] && m[sys][cat][key]) ? m[sys][cat][key] : '';

    const mkBtn = (seg, roman) => `<button class="n9-seg-btn ${A9_STATE.segment === seg ? 'active' : ''}" data-seg="${seg}">${roman}</button>`;

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

    if (A9_STATE.mode === 'zodiac' && A9_STATE.subMode === 'davison') {
        thead.innerHTML = `<tr>${dateHeader}
            <th colspan="9" class="th-top-cat th-white-title">ZODIACAL RELEASING</th>
            <th colspan="2" class="th-top-cat th-white-title">FIRDARIA</th>
            <th rowspan="3" class="th-top-cat th-prof th-red-title m-hoverable" data-info="Ascendant | ${m.Davison?.ascendant||''}">PROFECTIONS</th>
            <th rowspan="2" colspan="5" class="th-top-cat th-transit th-gray-title">TRANSITS</th></tr>
        <tr>
            <th colspan="3" class="th-mid-cat th-spirit-head m-hoverable" data-info="Spirit | ${getM('Davison', 'lots', 'Spirit')}">SPIRIT</th>
            <th colspan="3" class="th-mid-cat th-fortune-head m-hoverable" data-info="Fortune | ${getM('Davison', 'lots', 'Fortune')}">FORTUNE</th>
            <th colspan="3" class="th-mid-cat th-eros-head m-hoverable" data-info="Eros | ${getM('Davison', 'lots', 'Eros')}">EROS</th>
            <th rowspan="2" class="th-mid-cat th-firdaria m-hoverable" data-info="Sect | ${m.Davison?.sect||''}">M</th><th rowspan="2" class="th-mid-cat th-firdaria">S</th>
        </tr>
        <tr><th class="th-bot-cat th-spirit">L1</th><th class="th-bot-cat th-spirit">L2</th><th class="th-bot-cat th-spirit">L3</th><th class="th-bot-cat th-fortune">L1</th><th class="th-bot-cat th-fortune">L2</th><th class="th-bot-cat th-fortune">L3</th><th class="th-bot-cat th-eros">L1</th><th class="th-bot-cat th-eros">L2</th><th class="th-bot-cat th-eros">L3</th>
        <th class="th-bot-cat th-transit"><span class="transit-symbol-ju">♃</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-sa">♄</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-ur">♅</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-ne">♆</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-pl">♇</span></th></tr>`;
    } 
    else if (A9_STATE.mode === 'zodiac' && A9_STATE.subMode === 'synastry') {
        thead.innerHTML = `<tr>${dateHeader}
            <th colspan="4" class="th-top-cat th-spirit-title">SPIRIT</th>
            <th colspan="4" class="th-top-cat th-fortune-title">FORTUNE</th>
            <th colspan="4" class="th-top-cat th-eros-title">EROS</th>
            <th colspan="4" class="th-top-cat th-white-title">FIRDARIA</th>
            <th colspan="2" class="th-top-cat th-red-title">PROF</th>
            <th rowspan="2" colspan="5" class="th-top-cat th-transit th-gray-title">TRANSITS</th></tr>
        <tr>
            <th colspan="2" class="th-mid-cat th-syn-a m-hoverable" data-info="A_Spirit | ${getM('A','lots','Spirit')}">A</th><th colspan="2" class="th-mid-cat th-syn-b m-hoverable" data-info="B_Spirit | ${getM('B','lots','Spirit')}">B</th>
            <th colspan="2" class="th-mid-cat th-syn-a m-hoverable" data-info="A_Fortune | ${getM('A','lots','Fortune')}">A</th><th colspan="2" class="th-mid-cat th-syn-b m-hoverable" data-info="B_Fortune | ${getM('B','lots','Fortune')}">B</th>
            <th colspan="2" class="th-mid-cat th-syn-a m-hoverable" data-info="A_Eros | ${getM('A','lots','Eros')}">A</th><th colspan="2" class="th-mid-cat th-syn-b m-hoverable" data-info="B_Eros | ${getM('B','lots','Eros')}">B</th>
            <th colspan="2" class="th-mid-cat th-syn-a m-hoverable" data-info="A_Sect | ${m.A?.sect||''}">A</th><th colspan="2" class="th-mid-cat th-syn-b m-hoverable" data-info="B_Sect | ${m.B?.sect||''}">B</th>
            <th class="th-mid-cat th-syn-a m-hoverable" data-info="A_Asc | ${m.A?.ascendant||''}">A</th><th class="th-mid-cat th-syn-b m-hoverable" data-info="B_Asc | ${m.B?.ascendant||''}">B</th>
        </tr>
        <tr>
            <th class="th-bot-cat th-spirit">L1</th><th class="th-bot-cat th-spirit">L2</th><th class="th-bot-cat th-spirit">L1</th><th class="th-bot-cat th-spirit">L2</th>
            <th class="th-bot-cat th-fortune">L1</th><th class="th-bot-cat th-fortune">L2</th><th class="th-bot-cat th-fortune">L1</th><th class="th-bot-cat th-fortune">L2</th>
            <th class="th-bot-cat th-eros">L1</th><th class="th-bot-cat th-eros">L2</th><th class="th-bot-cat th-eros">L1</th><th class="th-bot-cat th-eros">L2</th>
            <th class="th-bot-cat th-firdaria">M</th><th class="th-bot-cat th-firdaria">S</th><th class="th-bot-cat th-firdaria">M</th><th class="th-bot-cat th-firdaria">S</th>
            <th class="th-bot-cat th-prof">P</th><th class="th-bot-cat th-prof">P</th>
            <th class="th-bot-cat th-transit"><span class="transit-symbol-ju">♃</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-sa">♄</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-ur">♅</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-ne">♆</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-pl">♇</span></th>
        </tr>`;
    } 
    else if (A9_STATE.mode === 'jyotish') {
        thead.innerHTML = `<tr>
            <th class="th-top-cat n9-date-col-header" rowspan="2" style="vertical-align: middle;">
                <div class="n9-header-date-label" style="margin: 0;">DATE</div>
            </th>
            <th colspan="3" class="th-top-cat th-syn-a m-hoverable" data-info="A_Moon | ${m.A?.moon_position || ''}">A</th>
            <th colspan="3" class="th-top-cat th-syn-dav m-hoverable" data-info="Dav_Moon | ${m.Davison?.moon_position || ''}">CONIUNCTIO</th>
            <th colspan="3" class="th-top-cat th-syn-b m-hoverable" data-info="B_Moon | ${m.B?.moon_position || ''}">B</th></tr>
        <tr>
            <th class="th-bot-cat th-mahadasha">L1</th><th class="th-bot-cat th-mahadasha">L2</th><th class="th-bot-cat th-mahadasha">L3</th>
            <th class="th-bot-cat th-antardasha">L1</th><th class="th-bot-cat th-antardasha">L2</th><th class="th-bot-cat th-antardasha">L3</th>
            <th class="th-bot-cat th-pratyantardasha">L1</th><th class="th-bot-cat th-pratyantardasha">L2</th><th class="th-bot-cat th-pratyantardasha">L3</th>
        </tr>`;
    }

    if (A9_STATE.mode === 'zodiac') {
        document.querySelectorAll('.n9-seg-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation(); if(A9_STATE.isRendering) return;
                showLoader(); 
                A9_STATE.segment = parseInt(btn.dataset.seg);
                updateUrl(); 
                updateUI();
                setTimeout(() => { renderBodyAsync(); }, 50); 
            };
        });
    }
}

function createVeilCell(isVeil, text = "", colspan = 1, ownerKey = "") {
    if (!isVeil) return null;
    const isLight = text && text.toLowerCase().includes("light");
    const textClass = isLight ? "veil-light" : "veil-consummatum";
    
    // A의 장막 = B가 연장자라 A가 없는 상태 -> 우측 정렬하여 왼쪽 A칸으로 침범
    // B의 장막 = A가 연장자라 B가 없는 상태 -> 좌측 정렬하여 오른쪽 B칸으로 침범
    let alignClass = "veil-align-center";
    if (ownerKey === 'a') alignClass = "veil-align-right";
    else if (ownerKey === 'b') alignClass = "veil-align-left";

    return `<td class="a9-veil-cell" colspan="${colspan}">
                ${text ? `<div class="veil-text-box ${textClass} ${alignClass}">${text}</div>` : ''}
            </td>`;
}

function renderBodyAsync() {
    const tbody = document.getElementById('a9-table-body');
    if (!tbody || !A9_STATE.data) return;
    
    tbody.innerHTML = '';
    A9_STATE.isRendering = true;

    let filteredData = [];
    if (A9_STATE.mode === 'zodiac') {
        const startAge = (A9_STATE.segment - 1) * 12;
        const endAge = startAge + 12;
        filteredData = A9_STATE.data.filter(row => {
            const age = Number(row.age);
            return age >= startAge && age < endAge;
        });
    } else {
        filteredData = A9_STATE.data;
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
                fragment.appendChild(createA9RowElement(filteredData[i], isTodayRow));
            }
            tbody.appendChild(fragment);
            index = end;
            
            if (index < total) { requestAnimationFrame(renderChunk); } 
            else { A9_STATE.isRendering = false; hideLoader(); }
        } catch (err) { A9_STATE.isRendering = false; hideLoader(); }
    }
    requestAnimationFrame(renderChunk);
}

function createA9RowElement(row, isTodayRow) {
    const tr = document.createElement('tr');
    tr.className = 'n9-row';
    if (isTodayRow) tr.classList.add('n9-today-row');
    
    const dateStr = row.date.split('T')[0];
    let html = `<td class="n9-date-col">${dateStr}</td>`;

    // 🚀 [수복 1]: 딱 Day Lord / Hour Lord만 선언 (쓸데없는 공백이나 메타 텍스트 없음)
    const getLordTags = (lords, pName) => {
        if (!lords) return "";
        let isDay = (lords.day === pName || (lords.day && lords.day.includes(pName)));
        let isHour = (lords.hour === pName);
        if (isDay && isHour) return `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord] [Hour Lord]</strong><br>`;
        if (isDay) return `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord]</strong><br>`;
        if (isHour) return `<strong style="color:#FFD700; font-size:0.85em;">[Hour Lord]</strong><br>`;
        return "";
    };

    // 🚀 [수복 2]: Firdaria (조디악 모드) - 태그 증발 버그 및 들여쓰기 완벽 수정
    const getNatal = (sys, pName) => {
        const sysKey = { 'a': 'A', 'b': 'B', 'dav': 'Davison' }[sys];
        if (!pName || pName === '-') return null;

        let trop = A9_STATE.meta[sysKey]?.tropical_planets?.[pName] || "";
        let sid = A9_STATE.meta[sysKey]?.sidereal_planets?.[pName] || "";
        let oldNatal = A9_STATE.meta[sysKey]?.natal_planets?.[pName] || "";

        let tropStr = trop.split(/\\n|\n/)[0];
        let sidStr = sid.split(/\\n|\n/)[0];

        // 🚀 Rahu, Ketu 위계(Dignity)만 정확히 절단
        if (pName === 'Rahu' || pName === 'Ketu') {
            if (tropStr.includes('|')) tropStr = tropStr.split('|')[0].trim();
            if (sidStr.includes('|')) sidStr = sidStr.split('|')[0].trim();
            if (oldNatal.includes('|')) oldNatal = oldNatal.split('|')[0].trim();
        }

        // 🔥 백엔드 텍스트 스캔: 텍스트 자체에 Lord 태그가 있는지 직접 검사해서 추출
        const fullText = tropStr + " " + sidStr + " " + oldNatal;
        const isDayText = /\[Day Lord\]/i.test(fullText);
        const isHourText = /\[Hour Lord\]/i.test(fullText);
        
        // (안전장치) 혹시라도 나중에 meta.lords가 정상 작동할 경우를 대비한 교차 검증
        const lordHtml = getLordTags(A9_STATE.meta[sysKey]?.lords, pName);
        const isDay = isDayText || lordHtml.includes('Day Lord');
        const isHour = isHourText || lordHtml.includes('Hour Lord');

        // 🔥 텍스트 내의 지저분한 태그 찌꺼기를 도려내는 함수
        const cleanTxt = (str) => str.replace(/\[Day Lord\]/gi, '').replace(/\[Hour Lord\]/gi, '').trim();

        let html = `<strong style="color:#49dce1; font-size:1.1em;">${pName}</strong><br>`;
        
        // 🚀 추출한 플래그를 바탕으로 예쁜 노란색 HTML 태그를 딱 '한 번만' 출력
        if (isDay && isHour) {
            html += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord] [Hour Lord]</strong><br>`;
        } else if (isDay) {
            html += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord]</strong><br>`;
        } else if (isHour) {
            html += `<strong style="color:#FFD700; font-size:0.85em;">[Hour Lord]</strong><br>`;
        }

        let lines = [];
        if (tropStr) lines.push(cleanTxt(tropStr));
        if (sidStr) lines.push(cleanTxt(sidStr));
        if (!tropStr && !sidStr && oldNatal) lines.push(cleanTxt(oldNatal));
        
        html += lines.join('<br>');
        return html;
    };

    // 🚀 [수복 3]: Jyotish 모드 - 태그 증발 버그 수정 및 Pada 기호 강제 렌더링 폐기 (안정성 최우선)
    const getJyoNatal = (sys, pName) => {
        const sysKey = { 'a': 'A', 'b': 'B', 'dav': 'Davison' }[sys];
        if (!pName || pName === '-') return null;

        let trop = A9_STATE.meta[sysKey]?.tropical_planets?.[pName] || "";
        let sid = A9_STATE.meta[sysKey]?.sidereal_planets?.[pName] || "";

        let tropStr = trop.split(/\\n|\n/)[0];
        let parts = sid.split(/\\n|\n/);
        let sidStr = parts[0] || "";
        let nakStr = parts.length > 1 ? parts.slice(1).join(" ") : "";

        // 🚀 Rahu, Ketu 위계(Dignity) 절단
        if (pName === 'Rahu' || pName === 'Ketu') {
            if (tropStr.includes('|')) tropStr = tropStr.split('|')[0].trim();
            if (sidStr.includes('|')) sidStr = sidStr.split('|')[0].trim();
        }

        // ❌ 문제의 원인이었던 Pada 기호 정규식 매칭 및 색상 렌더링 로직 완전 삭제 ❌
        // 이제 nakStr은 백엔드에서 온 텍스트 형태 그대로 담백하게 출력됩니다.

        // 🔥 텍스트 스캔 및 교차 검증
        const fullText = tropStr + " " + sidStr + " " + nakStr;
        const isDayText = /\[Day Lord\]/i.test(fullText);
        const isHourText = /\[Hour Lord\]/i.test(fullText);
        
        const lordHtml = getLordTags(A9_STATE.meta[sysKey]?.lords, pName);
        const isDay = isDayText || lordHtml.includes('Day Lord');
        const isHour = isHourText || lordHtml.includes('Hour Lord');

        // 🔥 정화 로직
        const cleanTxt = (str) => str.replace(/\[Day Lord\]/gi, '').replace(/\[Hour Lord\]/gi, '').trim();

        let html = `<strong style="color:#49dce1; font-size:1.1em;">${pName}</strong><br>`;
        
        // 🚀 딱 한 번만 렌더링
        if (isDay && isHour) {
            html += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord] [Hour Lord]</strong><br>`;
        } else if (isDay) {
            html += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord]</strong><br>`;
        } else if (isHour) {
            html += `<strong style="color:#FFD700; font-size:0.85em;">[Hour Lord]</strong><br>`;
        }

        let lines = [];
        if (tropStr) lines.push(cleanTxt(tropStr));
        if (sidStr) lines.push(cleanTxt(sidStr));
        if (nakStr) lines.push(cleanTxt(nakStr)); // 기호 변환 없이 원본 그대로 삽입

        html += lines.join('<br>');
        return html;
    };

    if (A9_STATE.mode === 'zodiac') {
        if (A9_STATE.subMode === 'davison') {
            if (row.veil_d) {
                html += createVeilCell(true, row.veil_text_dav, 17, 'dav');
            } else {
                const d = row.dav;
                const mkZR = (lot) => {
                    const z = d.zr[lot];
                    const t1 = z.l1_lb ? "Loosing of the Bonds (LB)" : null;
                    const t2 = z.l2_lb ? "Loosing of the Bonds (LB)" : null;
                    const t3 = z.l3_lb ? "Loosing of the Bonds (LB)" : null;
                    return `<td class="n9-cell-zr ${z.l1_lb?'n9-cell-lb':''}">${renderSym(z.l1, t1)}</td>
                            <td class="n9-cell-zr ${z.l2_lb?'n9-cell-lb':''}">${renderSym(z.l2, t2)}</td>
                            <td class="n9-cell-zr ${z.l3_lb?'n9-cell-lb':''}">${renderSym(z.l3, t3)}</td>`;
                };
                html += mkZR('spirit') + mkZR('fortune') + mkZR('eros');
                html += `<td class="n9-cell-firdaria">${renderSym(d.firdaria.main, getNatal('dav', d.firdaria.main))}</td>
                         <td class="n9-cell-firdaria">${renderSym(d.firdaria.sub, getNatal('dav', d.firdaria.sub))}</td>
                         <td class="n9-cell-prof">${renderSym(d.profections)}</td>`;
                // 🚀 [수복]: Transit 토스트 시 상단에 행성 제목(T_Pluto 등) 표출 및 줄바꿈
                ['Jupiter','Saturn','Uranus','Neptune','Pluto'].forEach(p => {
                    const t = row.transits[p] || {};
                    const tInfo = t.full_text ? `<strong style="color:#49dce1; font-size:1.1em;">T_${p}</strong><br><br>${t.full_text.replace(/\\n|\n/g, '<br>')}` : null;
                    html += `<td class="n9-cell-transit">${renderSym(t.sign, tInfo)}</td>`;
                });
            }
        } else {
            const mkSynZR = (lot, isFirstLot) => {
                let cells = "";
                ['a', 'b'].forEach(p => {
                    if (row[`veil_${p}`]) {
                        cells += createVeilCell(true, isFirstLot ? row[`veil_text_${p}`] : null, 2, p);
                    } else {
                        const z = row[p].zr[lot];
                        const t1 = z.l1_lb ? "Loosing of the Bonds (LB)" : null;
                        const t2 = z.l2_lb ? "Loosing of the Bonds (LB)" : null;
                        cells += `<td class="n9-cell-zr ${z.l1_lb?'n9-cell-lb':''}">${renderSym(z.l1, t1)}</td>
                                  <td class="n9-cell-zr ${z.l2_lb?'n9-cell-lb':''}">${renderSym(z.l2, t2)}</td>`;
                    }
                });
                return cells;
            };
            
            html += mkSynZR('spirit', true) + mkSynZR('fortune', false) + mkSynZR('eros', false);
            
            ['a', 'b'].forEach(p => {
                if (row[`veil_${p}`]) html += createVeilCell(true, null, 2, p);
                else html += `<td class="n9-cell-firdaria">${renderSym(row[p].firdaria.main, getNatal(p, row[p].firdaria.main))}</td>
                              <td class="n9-cell-firdaria">${renderSym(row[p].firdaria.sub, getNatal(p, row[p].firdaria.sub))}</td>`;
            });
            
            ['a', 'b'].forEach(p => {
                if (row[`veil_${p}`]) html += createVeilCell(true, null, 1, p);
                else html += `<td class="n9-cell-prof">${renderSym(row[p].profections)}</td>`;
            });
            
            // 🚀 [수복]: Transit 토스트 시 상단에 행성 제목(T_Pluto 등) 표출 및 줄바꿈
            ['Jupiter','Saturn','Uranus','Neptune','Pluto'].forEach(p => {
                const t = row.transits[p] || {};
                const tInfo = t.full_text ? `<strong style="color:#49dce1; font-size:1.1em;">T_${p}</strong><br><br>${t.full_text.replace(/\\n|\n/g, '<br>')}` : null;
                html += `<td class="n9-cell-transit">${renderSym(t.sign, tInfo)}</td>`;
            });
        }
    } else {
        ['a', 'dav', 'b'].forEach(k => {
            const isVeil = row[`veil_${k === 'dav' ? 'd' : k}`];
            const textKey = k === 'dav' ? 'veil_text_dav' : `veil_text_${k}`;
            if (isVeil) {
                html += createVeilCell(true, row[textKey], 3, k);
            } else {
                const d = row[k];
                html += `<td class="n9-cell-dasha-l1" style="color:#8700FF">${renderSym(d.l1, getJyoNatal(k, d.l1))}</td>
                         <td class="n9-cell-dasha-l2" style="color:#BE75FF">${renderSym(d.l2, getJyoNatal(k, d.l2))}</td>
                         <td class="n9-cell-dasha-l3" style="color:#EBD4FF">${renderSym(d.l3, getJyoNatal(k, d.l3))}</td>`;
            }
        });
    }

    tr.innerHTML = html;
    return tr;
}

window.saveToGrimoire = async function() {
    const activeDavison = JSON.parse(localStorage.getItem('active_davison'));
    const activeComposite = JSON.parse(localStorage.getItem('active_composite'));
    const albedoStation = activeDavison || activeComposite || {};

    let s1 = albedoStation.seed1;
    let s2 = albedoStation.seed2;
    let seedId = albedoStation.id;

    if (!s1 || !s2) {
        alert("Dual seeds required for Synchronicum. Please return to the A1 Hub.");
        return false;
    }

    if (!seedId) {
        let id1 = s1.idx || s1.id || "unknown1";
        let id2 = s2.idx || s2.id || "unknown2";
        seedId = `${id1}_${id2}`;
    }

    let targetName = `${s1.name || "A"} & ${s2.name || "B"}`;
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    let compilerId = 'a9'; 
    if (A9_STATE.mode === 'jyotish') compilerId = 'a9_vd';
    else if (A9_STATE.mode === 'zodiac' && A9_STATE.subMode === 'synastry') compilerId = 'a9_synastry';

    const payload = {
        seed_id: seedId,
        stage: 'albedo', 
        target_name: targetName,
        language: lang,
        metadata: {
            view_mode: A9_STATE.mode,
            sub_mode: A9_STATE.subMode,
            ayanamsa: A9_STATE.ayanamsa,
            segment: A9_STATE.segment, 
            sys_tab: 'tropical' 
        },
        seed: { seed1: s1, seed2: s2 } 
    };

    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) return true; 
        else throw new Error("Manifestation Failed");
    } catch (e) { throw e; }
};
