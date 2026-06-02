/* static/mobile/world/albedo/modules/a7.js - Mobile EVOCATIONES */

const A7_STATE = {
    system: 'tropical', 
    ayanamsa: 'lahiri', 
    mode1: 'sigilum', 
    mode2: 'sabian', 
    category: 'planets',
    data: null,
    sabianSymbols: null
};

const A7_BODIES = {
    planets: ["Sun (Natal)", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"],
    asteroids: ["Chiron", "Ceres", "Juno", "Pallas", "Vesta", "Asteroid Eros", "Psyche"],
    lilith: ["Mean Lilith", "True Lilith", "Asteroid Lilith", "North Node (t)", "Rahu", "South Node (t)", "Ketu"], 
    fates: ["Moira", "Klotho", "Lachesis", "Atropos"],
    angles: ["Ascendant", "Immum Coeli", "Descendant", "Midheaven"],
    hermetic: ["Fortune", "Spirit", "Necessity", "Necessity (v)", "Eros", "Eros (v)", "Courage", "Victory", "Nemesis", "Vertex", "Syzygy"]
};

const PLENITUDO_LEFT_COL = [
    "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
    "Chiron", "Ceres", "Juno", "Pallas", "Vesta", "Asteroid Eros", "Psyche",
    "Mean Lilith", "True Lilith", "Asteroid Lilith", "North Node (t)", "Rahu", "South Node (t)", "Ketu",
    "Ascendant", "Immum Coeli", "Descendant", "Midheaven",
    "Fortune", "Spirit", "Necessity", "Necessity (v)", "Eros", "Eros (v)", "Courage", "Victory", "Nemesis",
    "Moira", "Klotho", "Lachesis", "Atropos", "Vertex", "Syzygy"
];

const ELEMENT_MAP = { "♈︎": "glow-fire", "♌︎": "glow-fire", "♐︎": "glow-fire", "♉︎": "glow-earth", "♍︎": "glow-earth", "♑︎": "glow-earth", "♊︎": "glow-air", "♎︎": "glow-air", "♒︎": "glow-air", "♋︎": "glow-water", "♏︎": "glow-water", "♓︎": "glow-water" };
const PLANET_GLOW_MAP = { "♄": "glow-saturn", "♃": "glow-jupiter", "♂": "glow-mars", "☉": "glow-sun", "♀": "glow-venus", "☿": "glow-mercury", "☽": "glow-moon", "☋": "glow-ketu", "☊": "glow-rahu" };

// 🚀 [수복 1]: 토스트 전용 선명한 솔리드 컬러맵
const TOAST_PLANET_COLOR_MAP = {
    "☉": "#FC55CE", "☽": "#FFB9FA", "☿": "#341DFC", "♀": "#999999",
    "♂": "#F50000", "♃": "#47BD5A", "♄": "#FFF200", "☊": "#6AFFDD", "☋": "#FFFFFF"
};

function formatToastLordsA7(lordStr) {
    if (!lordStr || lordStr === '-') return '-';
    return lordStr.split('|').map(p => {
        const trimP = p.trim();
        const sym = trimP.charAt(0);
        const color = TOAST_PLANET_COLOR_MAP[sym] || '#FFF';
        return `<span style="color:${color}; font-weight:bold;">${trimP}</span>`;
    }).join(' <span style="color:#555;">|</span> ');
}

// 🚀 [추가]: 천체 이름에 맞는 위계 색상 CSS 반환
function getA7MateriaClass(name) {
    if (A7_BODIES.planets.includes(name) || name === 'Sun') return 'p-planet';
    if (A7_BODIES.asteroids.includes(name)) return 'p-major';
    if (A7_BODIES.lilith.includes(name) || name.includes('Node') || name.includes('Lilith')) return 'p-node';
    if (A7_BODIES.fates.includes(name)) return 'p-fate';
    if (A7_BODIES.angles.includes(name)) return 'p-angle';
    if (name === 'Vertex') return 'p-vertex';
    if (name === 'Syzygy') return 'p-syzygy';
    if (A7_BODIES.hermetic.includes(name)) return 'p-hermetic';
    return '';
}

let a7ToastTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    loadA7StateFromURL();
    initializeA7UI();
    fetchA7SabianSymbols(); 
    fetchAndRenderA7(); 
});

function loadA7StateFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('a7_sys')) A7_STATE.system = params.get('a7_sys');
    if (params.has('a7_ayan')) A7_STATE.ayanamsa = params.get('a7_ayan');
    if (params.has('a7_m1')) A7_STATE.mode1 = params.get('a7_m1');
    if (params.has('a7_m2')) A7_STATE.mode2 = params.get('a7_m2');
    if (params.has('a7_cat')) A7_STATE.category = params.get('a7_cat');
}

function saveA7StateToURL() {
    const params = new URLSearchParams(window.location.search);
    params.set('a7_sys', A7_STATE.system);
    params.set('a7_ayan', A7_STATE.ayanamsa);
    params.set('a7_m1', A7_STATE.mode1);
    params.set('a7_m2', A7_STATE.mode2);
    params.set('a7_cat', A7_STATE.category);
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({path: newURL}, '', newURL);
}

function initializeA7UI() { updateA7UI(); }

function updateA7UI() {
    // Nav Sync
    document.querySelectorAll('#a7-system-nav .m-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.sys === A7_STATE.system));
    document.querySelectorAll('#a7-category-tabs .m-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.cat === A7_STATE.category));
    
    const vault = document.getElementById('a7-ayanamsa-vault');
    if (A7_STATE.system === 'sidereal') {
        vault.classList.remove('m-hidden');
        document.querySelectorAll('#a7-ayanamsa-vault .m-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.ayan === A7_STATE.ayanamsa));
    } else {
        vault.classList.add('m-hidden');
    }

    const hermeticBtn = document.getElementById('btn-cat-hermetic-a7');
    if (hermeticBtn) hermeticBtn.style.display = (A7_STATE.system === 'tropical') ? 'block' : 'none';

    // Dichotomy 1 (Sigilum vs Plenitudo)
    const knob1 = document.getElementById('a7-knob-primary');
    if (A7_STATE.mode1 === 'plenitudo') {
        knob1.classList.add('right');
        document.getElementById('a7-lbl-sigilum').classList.remove('active');
        document.getElementById('a7-lbl-plenitudo').classList.add('active');
        document.getElementById('a7-dicho-secondary').style.display = 'flex';
    } else {
        knob1.classList.remove('right');
        document.getElementById('a7-lbl-sigilum').classList.add('active');
        document.getElementById('a7-lbl-plenitudo').classList.remove('active');
        document.getElementById('a7-dicho-secondary').style.display = 'none';
    }

    // Dichotomy 2 (Sabian vs Tabula)
    const knob2 = document.getElementById('a7-knob-secondary');
    if (A7_STATE.mode2 === 'tabula') {
        knob2.classList.add('right');
        document.getElementById('a7-lbl-sabian').classList.remove('active');
        document.getElementById('a7-lbl-tabula').classList.add('active');
    } else {
        knob2.classList.remove('right');
        document.getElementById('a7-lbl-sabian').classList.add('active');
        document.getElementById('a7-lbl-tabula').classList.remove('active');
    }

    // View Routing
    document.getElementById('m-view-sigilum').style.display = 'none';
    document.getElementById('m-view-sabian').style.display = 'none';
    document.getElementById('m-view-tabula').style.display = 'none';

    if (A7_STATE.mode1 === 'sigilum') {
        document.getElementById('m-view-sigilum').style.display = 'flex';
        if(!A7_STATE.data) document.getElementById('m-view-sigilum').innerHTML = `<div style="text-align:center; padding:30px; color:#555;">Loading...</div>`;
    } else if (A7_STATE.mode1 === 'plenitudo' && A7_STATE.mode2 === 'sabian') {
        document.getElementById('m-view-sabian').style.display = 'block';
        if(!A7_STATE.data) document.getElementById('m-a7-tbody-sabian').innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; color:#555;">Loading Matrix...</td></tr>`;
    } else {
        document.getElementById('m-view-tabula').style.display = 'block';
        renderPlenitudoTabulaSkeleton();
    }
}

window.switchA7System = function(sys) { 
    A7_STATE.system = sys; 
    if (A7_STATE.category === 'hermetic' && sys !== 'tropical') A7_STATE.category = 'planets';
    saveA7StateToURL(); fetchAndRenderA7(); 
};
window.switchA7Ayanamsa = function(ayan) { A7_STATE.ayanamsa = ayan; saveA7StateToURL(); fetchAndRenderA7(); };
window.switchA7Category = function(cat) { A7_STATE.category = cat; saveA7StateToURL(); fetchAndRenderA7(); };
window.toggleA7Primary = function() {
    A7_STATE.mode1 = (A7_STATE.mode1 === 'sigilum') ? 'plenitudo' : 'sigilum';
    saveA7StateToURL(); updateA7UI(); populateA7Data();
};
window.toggleA7Secondary = function() {
    A7_STATE.mode2 = (A7_STATE.mode2 === 'sabian') ? 'tabula' : 'sabian';
    saveA7StateToURL(); updateA7UI(); populateA7Data();
};

async function fetchAndRenderA7() {
    let h_sys = (localStorage.getItem('tetramegistus_house') === 'whole') ? 'W' : 'P';
    A7_STATE.data = null; 
    updateA7UI(); 

    try {
        const url = `/api/astro/evocationes/reading?category=${A7_STATE.category}&system=${A7_STATE.system}&ayanamsa=${A7_STATE.ayanamsa}&h_sys=${h_sys}`;
        const res = await fetch(url);
        const resData = await res.json();
        if (!resData.error) {
            A7_STATE.data = resData.data; 
            populateA7Data();
        }
    } catch (e) {}
}

function populateA7Data() {
    if (!A7_STATE.data) return;
    if (A7_STATE.mode1 === 'sigilum') populateA7Sigilum();
    else if (A7_STATE.mode1 === 'plenitudo') {
        if (A7_STATE.mode2 === 'sabian') populateA7Sabian();
        else populateA7Tabula(); 
    }
}

/* ─────────────────────────────────────────────────────────────
   RENDERING: SIGILUM (Cards)
   ───────────────────────────────────────────────────────────── */
function populateA7Sigilum() {
    const container = document.getElementById('m-view-sigilum');
    container.innerHTML = '';
    const targets = A7_BODIES[A7_STATE.category] || [];
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    
    targets.forEach(t => {
        const chartData = A7_STATE.data[t];
        if (!chartData) return; 
        const info = chartData.chart_info;
        const pData = chartData.points[t] || {}; 
        
        const toastStr = encodeURIComponent(`<strong style="color:#49dce1;">[${t} Persona]</strong><br><span style="color:#ccc;">${info.datetime || '-'}</span><br>Day Lord: ${formatToastLordsA7(info.day_lord)}<br>Hour Lord: ${formatToastLordsA7(info.hour_lord)}`).replace(/'/g, "%27");
        let dmsText = pData.dms || '-';
        if (pData.is_retrograde && !dmsText.includes(',r')) dmsText += ' (r)';

        const duGlow = ELEMENT_MAP[pData.duad] || "";
        const doGlow = ELEMENT_MAP[pData.dodeca] || "";
        const deGlow = PLANET_GLOW_MAP[pData.decan] || "";
        const boGlow = PLANET_GLOW_MAP[pData.bound] || "";

        let sabianIdx = (pData.sabian_index !== undefined && pData.sabian_index !== "") ? pData.sabian_index : Math.floor(pData.longitude || 0) % 360;
        let sabianText = "-";
        if (A7_STATE.sabianSymbols && A7_STATE.sabianSymbols[sabianIdx]) {
            sabianText = A7_STATE.sabianSymbols[sabianIdx][lang] || A7_STATE.sabianSymbols[sabianIdx]['en'];
        }

        const html = `
            <div class="m-figura-card">
                <div class="m-card-header">
                    <span class="m-card-title">${t.toUpperCase()}</span>
                    <span class="m-card-info" onclick="showA7Toast(decodeURIComponent('${toastStr}'))">${dmsText}</span>
                </div>
                <div class="m-card-meta">
                    <span>House: <strong style="color:#fff;">${pData.house || '-'}</strong></span>
                    <span>Aries 0°: <strong style="color:#7CFF9B;">${info.aries_0_house || '-'}</strong></span>
                </div>
                <div class="m-dignities">
                    <div class="m-dig-col"><span class="m-dig-lbl">DUAD</span><span class="m-glow-slot ${duGlow}">${pData.duad || "-"}</span></div>
                    <div class="m-dig-col"><span class="m-dig-lbl">DOD.</span><span class="m-glow-slot ${doGlow}">${pData.dodeca || "-"}</span></div>
                    <div class="m-dig-col"><span class="m-dig-lbl">DECAN</span><span class="m-glow-slot ${deGlow}">${pData.decan || "-"}</span></div>
                    <div class="m-dig-col"><span class="m-dig-lbl">BOUND</span><span class="m-glow-slot ${boGlow}">${pData.bound || "-"}</span></div>
                </div>
                <div class="m-card-sabian">${sabianText}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

/* ─────────────────────────────────────────────────────────────
   RENDERING: SABIAN (Matrix) 완벽 수복
   ───────────────────────────────────────────────────────────── */
function populateA7Sabian() {
    const targets = A7_BODIES[A7_STATE.category] || [];
    const thead = document.getElementById('m-a7-thead-sabian');
    const tbody = document.getElementById('m-a7-tbody-sabian');
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    
    // Header
    let headHTML = `<tr><th class="sticky-corner">CELESTIAL</th>`;
    targets.forEach(t => {
        const info = A7_STATE.data[t]?.chart_info || {};
        const tToast = encodeURIComponent(`<strong style="color:#49dce1;">[${t} Persona]</strong><br><span style="color:#ccc;">${info.datetime || '-'}</span><br>Day Lord: ${formatToastLordsA7(info.day_lord)}<br>Hour Lord: ${formatToastLordsA7(info.hour_lord)}`).replace(/'/g, "%27");
        headHTML += `<th class="${getA7MateriaClass(t)}" onclick="showA7Toast(decodeURIComponent('${tToast}'))" style="cursor:pointer;">${t}</th>`;
    });
    thead.innerHTML = headHTML + `</tr>`;

    // Body
    tbody.innerHTML = ''; 
    PLENITUDO_LEFT_COL.forEach(rowItem => {
        const tr = document.createElement('tr');
        let rowHTML = `<td class="sticky-col"><strong class="${getA7MateriaClass(rowItem)}">${rowItem}</strong></td>`;
        
        targets.forEach((colTargetName) => {
            const chartData = A7_STATE.data[colTargetName];
            let cellHTML = `<div style="color:#555;">-</div>`;
            let cellClass = "m-a7-sabian-cell";
            let toastAttr = "";
            
            if(chartData) {
                let searchKey = rowItem;
                if(searchKey === "Sun" && chartData.points["Sun (Natal)"]) searchKey = "Sun (Natal)";
                const pData = chartData.points[searchKey] || (searchKey === "Rahu" ? chartData.points["North Node (t)"] : (searchKey === "Ketu" ? chartData.points["South Node (t)"] : null));
                
                if(pData && pData.dms) {
                    let dmsDisp = pData.dms;
                    if(pData.is_retrograde && !dmsDisp.includes(',r')) dmsDisp += ' (r)';
                    
                    const syms = { "Sun (Natal)": "☉", "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂", "Jupiter": "♃", "Saturn": "♄" };
                    const sym = syms[searchKey];
                    let isDayLord = false, isHourLord = false;
                    if (sym) {
                        if (chartData.chart_info.day_lord && chartData.chart_info.day_lord.includes(sym)) isDayLord = true;
                        if (chartData.chart_info.hour_lord && chartData.chart_info.hour_lord.includes(sym)) isHourLord = true;
                    }

                    let isIntersection = (searchKey === colTargetName || (rowItem === "Sun" && colTargetName === "Sun (Natal)"));
                    if (isIntersection) cellClass += " m-a7-cell-intersection";

                    if (isHourLord) {
                        let commaIdx = dmsDisp.indexOf(',');
                        if (commaIdx !== -1) dmsDisp = dmsDisp.substring(0, commaIdx).toUpperCase() + dmsDisp.substring(commaIdx);
                        else dmsDisp = dmsDisp.toUpperCase();
                    }
                    
                    let sabianIdx = (pData.sabian_index !== undefined && pData.sabian_index !== "") ? pData.sabian_index : Math.floor(pData.longitude || 0) % 360;
                    let sabianText = "-";
                    if (A7_STATE.sabianSymbols && A7_STATE.sabianSymbols[sabianIdx]) {
                        sabianText = A7_STATE.sabianSymbols[sabianIdx][lang] || A7_STATE.sabianSymbols[sabianIdx]['en'];
                    }

                    let fWeight = isDayLord ? "bold" : "normal";
                    let dmsColor = isIntersection ? "#00FFFF" : "#FFFFFF";
                    
                    cellHTML = `
                        <div style="font-weight:${fWeight}; margin-bottom: 4px;">
                            <span style="color:${dmsColor};">${dmsDisp}</span> 
                            <span style="color:#555; margin: 0 2px;">|</span> 
                            <strong style="color:#7CFF9B;">${pData.house || '-'}H</strong>
                        </div>
                        <div class="col-sabian-symbol" style="font-size:0.75rem; color:#AAAAAA; font-style:italic; line-height:1.3;">
                            ${sabianText}
                        </div>
                    `;
                    
                    // 🚀 [수정]: 3단 토스트 레이아웃 정돈 (타이틀 -> 로드태그 -> 정보)
                    let lordTags = [];
                    if (isDayLord) lordTags.push('<span style="color:#FFD700; font-weight:bold;">[Day Lord]</span>');
                    if (isHourLord) lordTags.push('<span style="color:#FFD700; font-weight:bold;">[Hour Lord]</span>');
                    let lordHtml = lordTags.length > 0 ? `${lordTags.join(' ')}<br>` : '';

                    const toastStr = encodeURIComponent(`
                        <strong style="color:#49dce1; font-size:1.1em; display:inline-block; margin-bottom:4px;">${rowItem} in ${colTargetName}</strong><br>
                        ${lordHtml}
                        <span style="color:#ccc;">${dmsDisp} | ${pData.house}H</span>
                    `).replace(/'/g, "%27");

                    toastAttr = `onclick="showA7Toast(decodeURIComponent('${toastStr}'))"`;
                }
            }
            rowHTML += `<td class="${cellClass}" ${toastAttr}>${cellHTML}</td>`;
        });
        tr.innerHTML = rowHTML;
        tbody.appendChild(tr);
    });
}

/* ─────────────────────────────────────────────────────────────
   RENDERING: TABULA (360 Timeline) 완벽 수복
   ───────────────────────────────────────────────────────────── */
function renderPlenitudoTabulaSkeleton() {
    const thead = document.getElementById('m-a7-thead-tabula');
    const tbody = document.getElementById('m-a7-tbody-tabula');
    const targets = A7_BODIES[A7_STATE.category] || [];
    
    // 🚀 [수복]: SABIAN NUMBER로 헤더 변경
    let headHTML = `<tr><th class="sticky-corner">SABIAN NUMBER</th>`;
    targets.forEach(t => headHTML += `<th class="${getA7MateriaClass(t)}">${t}</th>`);
    thead.innerHTML = headHTML + `</tr>`;

    tbody.innerHTML = '';
    const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const ELEMS = ['elem-fire', 'elem-earth', 'elem-air', 'elem-water'];

    for (let i = 0; i < 360; i++) {
        const tr = document.createElement('tr');
        tr.dataset.absDeg = i;
        if ((i % 30) === 29) tr.classList.add('sign-boundary');
        
        // 🚀 [수복]: 4원소 CSS 클래스(elem-fire 등) 적용
        let rowHTML = `<td class="sticky-col ${ELEMS[Math.floor(i/30)%4]}">${SIGNS[Math.floor(i/30)]} ${(i%30)+1}</td>`;
        targets.forEach(() => rowHTML += `<td></td>`);
        tr.innerHTML = rowHTML;
        tbody.appendChild(tr);
    }
    if(A7_STATE.data) populateA7Tabula();
}

function getHouseNumForDegree(deg, chartData) {
    let cusps = { ...chartData.cusps };
    const pts = chartData.points;
    if (cusps['H1'] === undefined && pts['Ascendant']) cusps['H1'] = pts['Ascendant'].longitude;
    if (cusps['H4'] === undefined && pts['Immum Coeli']) cusps['H4'] = pts['Immum Coeli'].longitude;
    if (cusps['H7'] === undefined && pts['Descendant']) cusps['H7'] = pts['Descendant'].longitude;
    if (cusps['H10'] === undefined && pts['Midheaven']) cusps['H10'] = pts['Midheaven'].longitude;

    for (let i = 1; i <= 12; i++) {
        let curr = Math.floor(cusps[`H${i}`]); 
        let next = Math.floor(cusps[`H${i === 12 ? 1 : i + 1}`]);
        if (isNaN(curr) || isNaN(next)) continue;
        if (curr <= next) { if (deg >= curr && deg < next) return i; } 
        else { if (deg >= curr || deg < next) return i; }
    }
    return null;
}

function getHouseNumForDegree(deg, chartData) {
    let cusps = { ...chartData.cusps };
    const pts = chartData.points;
    if (cusps['H1'] === undefined && pts['Ascendant']) cusps['H1'] = pts['Ascendant'].longitude;
    if (cusps['H4'] === undefined && pts['Immum Coeli']) cusps['H4'] = pts['Immum Coeli'].longitude;
    if (cusps['H7'] === undefined && pts['Descendant']) cusps['H7'] = pts['Descendant'].longitude;
    if (cusps['H10'] === undefined && pts['Midheaven']) cusps['H10'] = pts['Midheaven'].longitude;

    for (let i = 1; i <= 12; i++) {
        let curr = Math.floor(cusps[`H${i}`]); 
        let next = Math.floor(cusps[`H${i === 12 ? 1 : i + 1}`]);
        if (isNaN(curr) || isNaN(next)) continue;
        if (curr <= next) { if (deg >= curr && deg < next) return i; } 
        else { if (deg >= curr || deg < next) return i; }
    }
    return null;
}

/* ─────────────────────────────────────────────────────────────
   RENDERING: TABULA (360 Timeline) 토스트 및 컬러 완벽 수복
   ───────────────────────────────────────────────────────────── */
function populateA7Tabula() {
    const targets = A7_BODIES[A7_STATE.category] || [];
    const tbody = document.getElementById('m-a7-tbody-tabula');
    const theadTr = document.querySelector('#m-a7-thead-tabula tr');
    if(!tbody) return;

    // Reset Table
    Array.from(tbody.rows).forEach(tr => {
        const stickyCol = tr.querySelector('.sticky-col');
        if (stickyCol) {
            const lineBox = stickyCol.querySelector('.sabian-line-box');
            if (lineBox) lineBox.remove();
        }
        for(let c=1; c<=targets.length; c++) {
            tr.cells[c].innerHTML = ''; 
            tr.cells[c].className = ''; 
        }
    });

    const isWholeHouse = (localStorage.getItem('tetramegistus_house') === 'whole');

    targets.forEach((targetName, colIdx) => {
        const chartData = A7_STATE.data[targetName];
        if(!chartData) return;
        const cellIndex = colIdx + 1; 
        
        if(theadTr) {
            const th = theadTr.cells[cellIndex];
            if(th) {
                const info = chartData.chart_info;
                const tToast = encodeURIComponent(`<strong style="color:#49dce1;">[${targetName} Persona]</strong><br><span style="color:#ccc;">${info.datetime || '-'}</span><br>Day Lord: ${formatToastLordsA7(info.day_lord)}<br>Hour Lord: ${formatToastLordsA7(info.hour_lord)}`).replace(/'/g, "%27");
                th.setAttribute('onclick', `showA7Toast(decodeURIComponent('${tToast}'))`);
                th.style.cursor = 'pointer';
                th.style.setProperty('border-bottom', `3px solid ${getA7LineColorVar(targetName)}`, 'important');
            }
        }
        
        Array.from(tbody.rows).forEach(tr => {
            const deg = parseInt(tr.dataset.absDeg);
            const hNum = getHouseNumForDegree(deg, chartData);
            if (hNum) tr.cells[cellIndex].classList.add(`bg-house-${hNum}`);
        });
        
        // 1. Planets
        for (const [bodyName, pData] of Object.entries(chartData.points)) {
            if(pData.longitude === undefined) continue;
            if ((A7_STATE.system === 'draconic' || A7_STATE.system === 'ketunic') && ["North Node (t)", "Rahu", "South Node (t)", "Ketu"].includes(bodyName)) continue;

            const tr = tbody.querySelector(`tr[data-abs-deg="${Math.floor(pData.longitude) % 360}"]`);
            if(tr && tr.cells[cellIndex]) {
                let marker = document.createElement('div');
                let shortName = bodyName.replace(" (Natal)", "");
                
                const syms = { "Sun (Natal)": "☉", "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂", "Jupiter": "♃", "Saturn": "♄" };
                const sym = syms[bodyName];
                let isDayLord = false, isHourLord = false;
                if (sym) {
                    if (chartData.chart_info.day_lord && chartData.chart_info.day_lord.includes(sym)) isDayLord = true;
                    if (chartData.chart_info.hour_lord && chartData.chart_info.hour_lord.includes(sym)) isHourLord = true;
                }

                marker.className = `marker-item ${getA7MateriaClass(bodyName)}`;
                if (isDayLord) marker.classList.add('lord-day');
                if (isHourLord) marker.classList.add('lord-hour');
                
                marker.textContent = shortName;
                
                // 🚀 [수정]: Tabula 행성 토스트 불필요한 줄바꿈 제거 완벽 밀착
                let lordTags = [];
                if (isDayLord) lordTags.push('<span style="color:#FFD700; font-weight:bold;">[Day Lord]</span>');
                if (isHourLord) lordTags.push('<span style="color:#FFD700; font-weight:bold;">[Hour Lord]</span>');
                let lordHtml = lordTags.length > 0 ? `<div style="margin-top:2px; margin-bottom:2px;">${lordTags.join(' ')}</div>` : '';

                const toastStr = encodeURIComponent(`
                    <strong style="color:#49dce1;">[${targetName} Persona]</strong><br>
                    <strong style="color:#fff; font-size:1.1em; display:inline-block; margin-top:4px;">${shortName}</strong><br>
                    ${lordHtml}
                    <span style="color:#ccc; display:inline-block;">${pData.dms} | ${pData.house}H</span>
                `).replace(/'/g, "%27");

                marker.setAttribute('onclick', `showA7Toast(decodeURIComponent('${toastStr}'))`);
                marker.dataset.exactLon = pData.longitude;
                marker.dataset.isCusp = "false";
                
                tr.cells[cellIndex].appendChild(marker);
                addSabianLine(tr, targetName);
            }
        }
        
        // 2. Cusps
        if (chartData.cusps) {
            for (let i = 1; i <= 12; i++) {
                const hLon = chartData.cusps[`H${i}`];
                if (hLon !== undefined) {
                    const tr = tbody.querySelector(`tr[data-abs-deg="${Math.floor(hLon) % 360}"]`);
                    if (tr && tr.cells[cellIndex]) {
                        let marker = document.createElement('div');
                        marker.className = `marker-item p-cusp`;
                        marker.textContent = `${i}h cusp`;
                        
                        let d = Math.floor(hLon);
                        let m = Math.floor((hLon - d) * 60);
                        let s = Math.round(((hLon - d) * 60 - m) * 60);
                        if (s === 60) { s = 0; m += 1; }
                        if (m === 60) { m = 0; d += 1; }
                        let dmsStr = `${d%30}°${m.toString().padStart(2,'0')}'${s.toString().padStart(2,'0')}''`;
                        const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
                        let signName = SIGNS[Math.floor(d/30)%12];

                        // 🚀 [수정]: Cusp 하단 여백 밀착
                        const toastStr = encodeURIComponent(`
                            <strong style="color:#49dce1;">[${targetName} Persona]</strong><br>
                            <strong style="color:#fff; font-size:1.1em; display:inline-block; margin-top:4px;">${i}h cusp</strong><br>
                            <span style="color:#ccc; display:inline-block; margin-top:2px;">${signName},${dmsStr}</span>
                        `).replace(/'/g, "%27");

                        marker.setAttribute('onclick', `showA7Toast(decodeURIComponent('${toastStr}'))`);
                        marker.dataset.exactLon = hLon;
                        marker.dataset.isCusp = "true";

                        tr.cells[cellIndex].appendChild(marker);
                        if (!isWholeHouse) addSabianLine(tr, targetName);
                    }
                }
            }
        }
    });

    // Reorder markers
    Array.from(tbody.rows).forEach(tr => {
        for(let c = 1; c <= targets.length; c++) {
            const cell = tr.cells[c];
            const markers = Array.from(cell.children).filter(el => el.hasAttribute('data-exact-lon'));
            if (markers.length > 1) {
                markers.sort((a, b) => {
                    const lonA = parseFloat(a.dataset.exactLon);
                    const lonB = parseFloat(b.dataset.exactLon);
                    if (lonA !== lonB) return lonA - lonB;
                    const cuspA = a.dataset.isCusp === "true" ? -1 : 1;
                    const cuspB = b.dataset.isCusp === "true" ? -1 : 1;
                    return cuspA - cuspB;
                });
                markers.forEach(m => cell.appendChild(m));
            }
        }
    });
}

function getA7LineColorVar(targetName) {
    const map = {
        "Sun (Natal)": "#FC55CE", "Sun": "#FC55CE", "Moon": "#FFB9FA", "Mercury": "#341DFC",
        "Venus": "#999999", "Mars": "#F50000", "Jupiter": "#47BD5A", "Saturn": "#FFF200"
    };
    return map[targetName] || "#ffffff";
}

function addSabianLine(tr, targetName) {
    const stickyCol = tr.querySelector('.sticky-col');
    if (!stickyCol) return;
    
    let lineBox = stickyCol.querySelector('.sabian-line-box');
    if (!lineBox) {
        lineBox = document.createElement('div');
        lineBox.className = 'sabian-line-box';
        stickyCol.appendChild(lineBox);
    }
    
    const existingLine = Array.from(lineBox.children).find(el => el.dataset.target === targetName);
    if (!existingLine) {
        const line = document.createElement('div');
        line.className = 's-line-colored';
        line.dataset.target = targetName;
        const color = getA7LineColorVar(targetName);
        line.style.backgroundColor = color;
        line.style.boxShadow = `0 0 5px ${color}`;
        lineBox.appendChild(line);
    }
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────── */
async function fetchA7SabianSymbols() {
    if (A7_STATE.sabianSymbols) return;
    try {
        const res = await fetch('/api/astro/theory/sabian/definitions');
        if (res.ok) A7_STATE.sabianSymbols = await res.json();
    } catch (e) {}
}

function showA7Toast(htmlContent) {
    const toast = document.getElementById('m-a7-toast');
    if (!toast) return;
    toast.innerHTML = `<div style="display: block; width: 100%; text-align: center; line-height: 1.5;">${htmlContent}</div>`;
    toast.classList.remove('m-toast-hidden');
    if (a7ToastTimer) clearTimeout(a7ToastTimer);
    a7ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 4000);
}

/* ─────────────────────────────────────────────────────────────
   GRIMOIRE MANIFESTATION (Archive Payload)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    const activeDavison = JSON.parse(localStorage.getItem('active_davison'));
    const activeComposite = JSON.parse(localStorage.getItem('active_composite'));
    const albedoStation = activeDavison || activeComposite || {};

    let s1Name = albedoStation.seed1?.name || "";
    let s2Name = albedoStation.seed2?.name || "";
    let seedId = albedoStation.id || `${albedoStation.seed1?.id || "u1"}_${albedoStation.seed2?.id || "u2"}`;

    if (!s1Name && !s2Name) {
        alert("No active seed found. Please return to the main station.");
        return false;
    }

    let targetName = `${s1Name} & ${s2Name}`;
    const currentLang = localStorage.getItem('tetramegistus_lang') || 'en';
    const hSys = localStorage.getItem('tetramegistus_house') || 'P';

    const m1 = String(A7_STATE.mode1).toLowerCase();
    const m2 = String(A7_STATE.mode2).toLowerCase();
    let cat = String(A7_STATE.category).toLowerCase();
    if (cat === 'lilith') cat = 'nodes';

    let compilerId = '';
    if (m1 === 'sigilum') compilerId = 'a7';
    else if (m1 === 'plenitudo') {
        if (m2 === 'sabian') compilerId = `a7_sabian_${cat}`;
        else if (m2 === 'tabula') compilerId = `a7_${cat}_${currentLang}`;
    }

    const payload = {
        seed_id: seedId,        
        stage: 'albedo',       
        target_name: targetName,
        language: currentLang,
        metadata: {
            sys_tab: A7_STATE.system,
            ayanamsa: A7_STATE.ayanamsa,
            h_sys: hSys,
            category: cat
        },
        seed: albedoStation
    };

    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) return true; 
        else {
            const result = await res.json();
            throw new Error(result.detail || result.error); 
        }
    } catch (e) {
        throw e;
    }
};