/* static/world/albedo/modules/a3.js — v2.4 Hermetic Restore & Lagna Clean-up */

/* ─────────────────────────────────────────────────────────────
   1. CONSTANTS & STATE
   ───────────────────────────────────────────────────────────── */
const PLANET_GLOW_MAP = {
    "♄": "glow-saturn", "♃": "glow-jupiter", "♂": "glow-mars",
    "☉": "glow-sun", "♀": "glow-venus", "☿": "glow-mercury", "☽": "glow-moon"
};

const ELEMENT_MAP = {
    "♈︎": "glow-fire", "♌︎": "glow-fire", "♐︎": "glow-fire",
    "♉︎": "glow-earth", "♍︎": "glow-earth", "♑︎": "glow-earth",
    "♊︎": "glow-air", "♎︎": "glow-air", "♒︎": "glow-air",
    "♋︎": "glow-water", "♏︎": "glow-water", "♓︎": "glow-water"
};

const AYANAMSA_DESCS = {
    'lahiri': 'Standard Vedic (Chitra Paksha)',
    'raman': 'B.V. Raman',
    'kp': 'Krishnamurti Paddhati',
    'fagan-bradley': 'Fagan-Bradley',
    'yukteswar': 'Sri Yukteswar'
};

let FS_MEANINGS = {};

/* ─────────────────────────────────────────────────────────────
   2. INITIALIZATION
   ───────────────────────────────────────────────────────────── */
(async function initOrdinatioModule() {
    console.log("[ORDINATIO] A3 Module Loaded (v2.5)");

    // 🚀 [Added]: Apply Hover Tooltips
    document.querySelectorAll('.ayan-tab').forEach(btn => {
        const id = btn.dataset.ayan;
        if (AYANAMSA_DESCS[id]) btn.title = AYANAMSA_DESCS[id];
    });

    initializeOrdinatioUI();
    renderEmptyOrdinatioTable(); 

    await ensureDataIntegrity();
    loadFixedStarMeanings(); 
    await fetchAndRenderOrdinatio();
    
    document.addEventListener('click', (e) => {
        const popover = document.getElementById('fs-popover');
        if (popover && popover.style.display === 'block') {
            if (!e.target.closest('.fs-icon') && !e.target.closest('.fs-popover-box')) {
                popover.style.display = 'none';
                popover.classList.remove('active');
            }
        }
    });
})();

async function ensureDataIntegrity() {
    let localData = null;
    try { 
        let seed = localStorage.getItem('active_davison');
        localData = seed ? JSON.parse(seed) : null;
    } catch (e) {}

    if (localData) {
        try {
            await fetch('/api/astro/coagulatio/sync-active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localData)
            });
        } catch (e) { console.error("[A3] Sync Failed:", e); }
    }
}

async function loadFixedStarMeanings() {
    if (Object.keys(FS_MEANINGS).length > 0) return;
    try {
        const res = await fetch('/api/theory/fixedstar/meanings');
        if (res.ok) FS_MEANINGS = await res.json();
    } catch(e) {}
}

/* ─────────────────────────────────────────────────────────────
   3. UI SETUP & SKELETON
   ───────────────────────────────────────────────────────────── */
function initializeOrdinatioUI() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'cusp';
    const sys = params.get('system') || 'tropical';
    const view = params.get('view') || 'zodiac';
    const ayan = params.get('ayanamsa') || 'lahiri';
    const method = params.get('method') || 'composite';
    const anti = params.get('anti') || 'off';

    // 1. Method Toggle
    const methodKnob = document.getElementById('method-knob');
    const labelComp = document.getElementById('label-method-composite');
    const labelDavi = document.getElementById('label-method-davison');
    const antiWrapper = document.getElementById('anti-composite-wrapper');

    if (method === 'davison') {
        if(methodKnob) methodKnob.classList.add('right');
        if(labelDavi) labelDavi.classList.add('active');
        if(labelComp) labelComp.classList.remove('active');
        if(antiWrapper) {
            antiWrapper.style.opacity = '0'; 
            antiWrapper.style.pointerEvents = 'none';
        }
    } else {
        if(methodKnob) methodKnob.classList.remove('right');
        if(labelComp) labelComp.classList.add('active');
        if(labelDavi) labelDavi.classList.remove('active');
        if(antiWrapper) {
            antiWrapper.style.opacity = '1';
            antiWrapper.style.pointerEvents = 'auto';
        }
    }

    // 2. Anti-Composite Toggle
    const antiKnob = document.getElementById('anti-knob');
    const labelAntiOff = document.getElementById('label-anti-off');
    const labelAntiOn = document.getElementById('label-anti-on');

    if (anti === 'on') {
        if(antiKnob) antiKnob.classList.add('right');
        if(labelAntiOn) labelAntiOn.classList.add('active');
        if(labelAntiOff) labelAntiOff.classList.remove('active');
    } else {
        if(antiKnob) antiKnob.classList.remove('right');
        if(labelAntiOff) labelAntiOff.classList.add('active');
        if(labelAntiOn) labelAntiOn.classList.remove('active');
    }

    // 3. Mode Toggle
    const domKnob = document.getElementById('ordinatio-mode-knob');
    if (domKnob) { 
        if (mode === 'domain') {
            domKnob.classList.add('right');
            document.getElementById('label-mode-domain').classList.add('active');
            document.getElementById('label-mode-cusp').classList.remove('active');
        } else {
            domKnob.classList.remove('right');
            document.getElementById('label-mode-cusp').classList.add('active');
            document.getElementById('label-mode-domain').classList.remove('active');
        }
    }

    // 4. System Tabs
    document.querySelectorAll('.sys-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.sys === sys);
    });

    // 5. Sidereal & Lagna Controls
    const sidePanel = document.getElementById('ordinatio-sidereal-panel');
    const lagnaToggle = document.getElementById('ordinatio-lagna-toggle');
    
    if (sidePanel) {
        if (sys === 'sidereal') {
            sidePanel.classList.add('manifested');
            document.querySelectorAll('.ayan-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.ayan === ayan);
            });
            
            if (lagnaToggle) {
                if (method === 'composite') {
                    lagnaToggle.style.display = 'none';
                } else {
                    // Davison Sidereal Mode
                    if (mode === 'cusp') {
                        lagnaToggle.style.display = 'flex';
                        const lKnob = document.getElementById('lagna-knob');
                        if (view === 'lagna') {
                            if(lKnob) lKnob.classList.add('right');
                            document.getElementById('label-lagna').classList.add('active');
                            document.getElementById('label-zodiac').classList.remove('active');
                        } else {
                            if(lKnob) lKnob.classList.remove('right');
                            document.getElementById('label-zodiac').classList.add('active');
                            document.getElementById('label-lagna').classList.remove('active');
                        }
                    } else {
                        lagnaToggle.style.display = 'none';
                    }
                }
            }
        } else {
            sidePanel.classList.remove('manifested');
        }
    }
}

function renderEmptyOrdinatioTable() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'cusp';
    const sys = params.get('system') || 'tropical';
    const view = params.get('view') || 'zodiac';
    const method = params.get('method') || 'composite';

    const table = document.getElementById('ordinatio-table');
    if (!table) return;

    table.classList.remove('mode-cusp', 'mode-domain', 'mode-lagna');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = ''; tbody.innerHTML = '';

    // 🚀 [Fix]: Lagna Mode - Removed 'House' Column
    if (sys === 'sidereal' && mode === 'cusp' && view === 'lagna' && method !== 'composite') {
        table.classList.add('mode-lagna');
        thead.innerHTML = `<tr><th>Lagna</th><th>Information</th></tr>`;
        // Skeleton Rows
        ["AL", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "UL"].forEach(lbl => {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${lbl}</strong></td><td class="cell-info">-</td>`;
            tbody.appendChild(row);
        });
    } 
    else if (mode === 'domain') {
        table.classList.add('mode-domain');
        // 🚀 [추가]: Composite 모드일 땐 Hermetic 표시 여부 스위치 OFF
        const showHermetic = method !== 'composite';
        
        let thHTML = `<tr><th>House</th><th>Information</th><th class="text-center">Range</th><th>Planets</th><th>Asteroids</th>`;
        if (showHermetic) thHTML += `<th>Hermetic</th>`;
        thHTML += `</tr>`;
        thead.innerHTML = thHTML;

        for(let i=1; i<=12; i++) {
            const ord = (i%10==1&&i!=11)?'st':(i%10==2&&i!=12)?'nd':(i%10==3&&i!=13)?'rd':'th';
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${i}${ord} House</strong></td><td class="cell-info">-</td><td class="cell-range text-center">-</td><td class="cell-content">-</td><td class="cell-content">-</td><td class="cell-content">-</td>`;
            tbody.appendChild(row);
        }
    } 
    else {
        table.classList.add('mode-cusp');
        // Standard Cusp Mode
        thead.innerHTML = `<tr>
            <th>Cusps</th><th>Information</th><th class="text-center">Range</th>
            <th class="text-center" title="Duad">Duad</th>
            <th class="text-center" title="Dodecatemoria">Dod.</th>
            <th class="text-center" title="Decan">Decan</th>
            <th class="text-center" title="Egyptian Bounds">Bd.</th>
            <th>Sabian Symbol</th>
        </tr>`;
        const labels = ["Asc.", "2h cusp", "3h cusp", "I.C.", "5h cusp", "6h cusp", "Dsc.", "8h cusp", "9h cusp", "M.C.", "11h cusp", "12h cusp"];
        labels.forEach(lbl => {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${lbl}</strong></td><td class="cell-info">-</td><td class="cell-range text-center">-</td><td class="cell-center">-</td><td class="cell-center">-</td><td class="cell-center">-</td><td class="cell-center">-</td><td class="cell-sabian">-</td>`;
            tbody.appendChild(row);
        });
    }
}

/* static/world/albedo/modules/a3.js — v20.0 Composite Logic Override */

async function fetchAndRenderOrdinatio() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'cusp';
    const sys = params.get('system') || 'tropical';
    const view = params.get('view') || 'zodiac';
    const ayan = params.get('ayanamsa') || 'lahiri';
    
    const method = params.get('method') || 'composite';
    const anti = params.get('anti') || 'off';
    
    let h_sys = params.get('h_sys');
    if (!h_sys) {
        if (window.WorldSettings && window.WorldSettings.getHouseCode) {
            h_sys = window.WorldSettings.getHouseCode();
        } else {
            const saved = localStorage.getItem('tetramegistus_house');
            h_sys = (saved === 'whole') ? 'W' : (saved === 'koch' ? 'K' : 'P');
        }
    }
    
    // 🚀 [수복]: Orb 설정 로드
    let orbValue = 1.5;
    const savedOrb = localStorage.getItem('tetramegistus_orb');
    if (savedOrb) {
        const parsed = parseFloat(savedOrb);
        if (!isNaN(parsed)) orbValue = parsed;
    }
    
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    const table = document.getElementById('ordinatio-table');

    try {
        // 🔗 URL에 fixed_star_orb 추가
        const url = `/api/astro/ordinatio/reading?system=${sys}&ayanamsa=${ayan}&h_sys=${h_sys}&view=${view}&method=${method}&anti=${anti}&fixed_star_orb=${orbValue}`;
        
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.error) return console.warn(data.error);

        // 🚀 [Angles Source Logic]: 앵글 데이터의 원천을 결정하는 핵심 분기
        let finalAscDms = '-';
        let finalMcDms = '-';
        let ascTooltip = '';

        if (method === 'composite') {
            // 💡 [Composite Mode]: 하단 테이블(Cusps)이 정답입니다.
            // 180도 플립 문제를 피하기 위해, 이미 검증된 1하우스/10하우스 커스프 값을 직접 사용합니다.
            const h1 = data.domus.find(d => d.house_num === 1);
            const h10 = data.domus.find(d => d.house_num === 10);
            
            if (h1) finalAscDms = h1.dms;
            if (h10) finalMcDms = h10.dms;
            
        } else {
            // 💡 [Davison / Natal]: 기하학적 포인트(Actual Point)가 정답입니다.
            // Whole Sign 모드 등에서 커스프(0도)와 실제 상승점(예: 18도)이 다른 경우를 위해 
            // data.planets의 값을 우선합니다.
            if (data.planets) {
                const realAsc = data.planets['Ascendant'] || data.planets['Asc.'];
                const realMc = data.planets['Midheaven'] || data.planets['M.C.'];
                
                if (realAsc) {
                    finalAscDms = realAsc.dms;
                    ascTooltip = `Ruler: ${realAsc.ruler || '-'} | ${realAsc.nakshatra?.name || ''}`;
                }
                if (realMc) finalMcDms = realMc.dms;
            }
        }

        // DOM Update
        const ascEl = document.getElementById('val-asc');
        const mcEl = document.getElementById('val-mc');
        
        if (ascEl) {
            ascEl.textContent = finalAscDms;
            if (ascTooltip) ascEl.title = ascTooltip;
        }
        if (mcEl) mcEl.textContent = finalMcDms;

        // Table Rendering
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';

        if (mode === 'cusp') renderOrdinatioCuspMode(tbody, data, sys, view, lang);
        else renderOrdinatioDomainMode(tbody, data, sys, lang, method);

    } catch (e) { console.error("[ORDINATIO] Fetch Error:", e); }
}

function renderOrdinatioCuspMode(tbody, data, sys, view, lang) {
    const isLagnaView = (sys === 'sidereal' && view === 'lagna');

    data.domus.forEach(d => {
        const row = document.createElement('tr');
        
        // Label Generation
        let labelHTML = `<strong>${d.label}</strong>`;
        let infoText = d.dms;

        if (isLagnaView && d.lagna_info) {
            labelHTML = `<strong>${d.lagna_info.label}</strong>`; 
            infoText = d.lagna_info.position_str || d.lagna_info.dms;
        }

        // Cell 1: Name
        const cellName = document.createElement('td');
        cellName.innerHTML = labelHTML;
        if (isLagnaView && d.lagna_info) {
            if (d.lagna_info.label === 'AL') cellName.title = "Arudha Lagna";
            if (d.lagna_info.label === 'UL') cellName.title = "Upapada Lagna";
        }
        if (isLagnaView && d.lagna_info) {
            if (d.lagna_info.label === 'AL') cellName.title = "Arudha Lagna";
            if (d.lagna_info.label === 'UL') cellName.title = "Upapada Lagna";
        }
        
        // 🚀 [Fix]: Lagna Mode does NOT show Fixed Stars
        if (!isLagnaView) {
            const angleMap = {1: 'Ascendant', 4: 'Immum Coeli', 7: 'Descendant', 10: 'Midheaven'};
            const angleKey = angleMap[d.house_num];
            if (angleKey && data.angles_fs && data.angles_fs[angleKey]) {
                data.angles_fs[angleKey].forEach(fs => {
                    const icon = document.createElement('span');
                    icon.className = `fs-icon fs-${fs.tier.toLowerCase()}`;
                    icon.title = `${fs.name} | ${fs.dms || fs.position || "?"} | orb ${fs.orb}°`;
                    icon.onclick = (e) => { e.stopPropagation(); showFixedStarMeaning(fs.name, e); };
                    cellName.appendChild(icon);
                });
            }
        }
        row.appendChild(cellName);

        // Cell 2: Info
        const cellInfo = document.createElement('td');
        // 🚀 [수복]: Lagna 모드일 때는 커스프의 Anaretic 속성 전염 차단!
        cellInfo.className = 'cell-info' + ((d.is_anaretic && !isLagnaView) ? ' text-anaretic' : '');
        cellInfo.textContent = infoText;
        
        let rulerList = Array.isArray(d.ruler) ? d.ruler : [d.ruler];
        let tooltipLines = [];
        rulerList.forEach(rName => {
            let found = null;
            for (let h in data.contents) {
                const p = data.contents[h].planets.find(item => item.name === rName);
                if (p) { found = p; break; }
            }
            if (found) {
                let line = `${rName}: ${found.dms}`;
                if (found.dignity && found.dignity !== '-') line += ` | ${found.dignity}`;
                tooltipLines.push(line);
            } else tooltipLines.push(`${rName}: -`);
        });
        
        if (!isLagnaView) if (!isLagnaView) cellInfo.title = tooltipLines.join('\n');
        row.appendChild(cellInfo);

        // 🚀 [Fix]: If Lagna View, Stop here (2 Columns Only)
        if (isLagnaView) {
            tbody.appendChild(row);
            return; 
        }

        // Standard Columns for Cusp Mode
        const cellRange = document.createElement('td');
        cellRange.className = 'cell-range text-center'; 
        cellRange.textContent = d.range_str;
        row.appendChild(cellRange);

        ['duad', 'dodeca', 'decan', 'bound'].forEach(k => {
            const td = document.createElement('td');
            td.className = 'cell-center';
            td.textContent = d[k];
            const map = (k==='duad'||k==='dodeca') ? ELEMENT_MAP : PLANET_GLOW_MAP;
            applySymbolGlow(td, d[k], map);
            row.appendChild(td);
        });

        const cellSabian = document.createElement('td');
        cellSabian.className = 'cell-sabian';
        renderSabianText(cellSabian, d.sabian_index, lang);
        row.appendChild(cellSabian);

        tbody.appendChild(row);
    });
}

function renderOrdinatioDomainMode(tbody, data, sys, lang, method) {
    const isLagnaView = false; // Domain mode safety definition
    data.domus.forEach(d => {
        const row = document.createElement('tr');
        
        // 1. House Name
        const cellName = document.createElement('td');
        const ord = (d.house_num%10==1&&d.house_num!=11)?'st':(d.house_num%10==2&&d.house_num!=12)?'nd':(d.house_num%10==3&&d.house_num!=13)?'rd':'th';
        cellName.innerHTML = `<strong>${d.house_num}${ord} House</strong>`;
        row.appendChild(cellName);

        // a3.js 내부 렌더링 루프 (data.domus.forEach 부분)
        const cellInfo = document.createElement('td');
        cellInfo.className = 'cell-info';

        // 🔥 [Anaretic Injection]: 백엔드에서 보낸 is_anaretic 태그가 true면 클래스 추가
        if (d.is_anaretic) {
            cellInfo.classList.add('text-anaretic');
        }

        cellInfo.textContent = d.dms;
        
        let rulerList = Array.isArray(d.ruler) ? d.ruler : [d.ruler];
        let tooltipLines = [];
        rulerList.forEach(rName => {
            let found = null;
            for (let h in data.contents) {
                const p = data.contents[h].planets.find(item => item.name === rName);
                if (p) { found = p; break; }
            }
            if (found) {
                let line = `${rName}: ${found.dms}`;
                if (found.dignity && found.dignity !== '-') line += ` | ${found.dignity}`;
                tooltipLines.push(line);
            } else tooltipLines.push(`${rName}: -`);
        });
        if (!isLagnaView) cellInfo.title = tooltipLines.join('\n');
        row.appendChild(cellInfo);

        // 3. Range
        const cellRange = document.createElement('td');
        cellRange.className = 'cell-range text-center'; 
        cellRange.textContent = d.range_str;
        row.appendChild(cellRange);

        const houseContent = data.contents[d.house_num];
        
        // 🚀 [Fix]: Separate Planets, Asteroids, Hermetic (N3 Logic)
        
        // 4. Planets
        const cellPlanets = document.createElement('td');
        cellPlanets.className = 'cell-content';
        if (houseContent.planets.length > 0) {
            cellPlanets.innerHTML = houseContent.planets.map(item => {
                return `<span class="content-item" title="${item.dms}">${item.name}</span>`;
            }).join(', ');
        } else { cellPlanets.textContent = "-"; }
        row.appendChild(cellPlanets);
        
        // 5. Asteroids
        const cellAsteroids = document.createElement('td');
        cellAsteroids.className = 'cell-content';
        if (houseContent.asteroids.length > 0) {
            cellAsteroids.innerHTML = houseContent.asteroids.map(item => {
                return `<span class="content-item" title="${item.dms}">${item.name}</span>`;
            }).join(', ');
        } else { cellAsteroids.textContent = "-"; }
        row.appendChild(cellAsteroids);

        // 6. Hermetic (부활 & 독립 렌더링)
        if (method !== 'composite') {
            const cellHermetic = document.createElement('td');
            cellHermetic.className = 'cell-content';
            if (houseContent.hermetic && houseContent.hermetic.length > 0) {
                cellHermetic.innerHTML = houseContent.hermetic.map(item => {
                    let title = item.dms;
                    // Tropical이 아니면 툴팁(상세좌표) 숨김 처리 (N3 정책)
                    if (sys !== 'tropical') title = ""; 
                    return `<span class="content-item" title="${title}">${item.name}</span>`;
                }).join(', ');
            } else { cellHermetic.textContent = "-"; }
            row.appendChild(cellHermetic);
        }

        tbody.appendChild(row);
    });
}
// Global Utils (No Change)
window.switchOrdinatioMode = function() {
    const url = new URL(window.location.href);
    const curr = url.searchParams.get('mode') || 'cusp';
    url.searchParams.set('mode', curr === 'cusp' ? 'domain' : 'cusp');
    window.location.href = url.toString();
};
window.switchOrdinatioSystem = function(sys) {
    const url = new URL(window.location.href);
    url.searchParams.set('system', sys);
    if (sys !== 'sidereal') { url.searchParams.delete('ayanamsa'); url.searchParams.delete('view'); }
    window.location.href = url.toString();
};
window.switchOrdinatioMethod = function() {
    const url = new URL(window.location.href);
    const curr = url.searchParams.get('method') || 'composite';
    if (curr === 'composite') { url.searchParams.set('method', 'davison'); url.searchParams.delete('anti'); } 
    else { url.searchParams.set('method', 'composite'); }
    window.location.href = url.toString();
};
window.switchAntiComposite = function() {
    const url = new URL(window.location.href);
    const curr = url.searchParams.get('anti') || 'off';
    url.searchParams.set('anti', curr === 'off' ? 'on' : 'off');
    window.location.href = url.toString();
};
window.switchLagnaView = function() {
    const url = new URL(window.location.href);
    const curr = url.searchParams.get('view') || 'zodiac';
    url.searchParams.set('view', curr === 'zodiac' ? 'lagna' : 'zodiac');
    window.location.href = url.toString();
};
window.switchAyanamsa = function(ayan) {
    const url = new URL(window.location.href);
    url.searchParams.set('ayanamsa', ayan);
    window.location.href = url.toString();
};
function applySymbolGlow(cell, symbol, map) {
    if (!cell || !map) return;
    cell.textContent = symbol || "-";
    cell.className = cell.className.replace(/\bglow-\w+\b/g, "").trim();
    if (!symbol || symbol === "-") return;
    const key = symbol.trim();
    if (map[key]) cell.classList.add(map[key]);
}
async function renderSabianText(cell, index, lang) {
    if (index === undefined || index === null) return;
    try {
        const res = await fetch(`/api/theory/sabian/render/${index}?lang=${lang}`);
        if (res.ok) { const d = await res.json(); cell.textContent = d.text; cell.title = d.text; }
    } catch (e) { cell.textContent = "-"; }
}
// a3.js - 항성 팝업 로직 (N3와 동일하게 수복)
function showFixedStarMeaning(starName, event) {
    let popover = document.getElementById('fs-popover');
    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'fs-popover';
        popover.className = 'fs-popover-box';
        document.body.appendChild(popover);
    }
    
    // CSS transform 간섭 원천 차단
    popover.style.transform = 'none';
    
    const cleanName = starName.trim();
    let data = FS_MEANINGS[cleanName] || FS_MEANINGS[cleanName.toLowerCase()];
    
    if (!data) {
        popover.innerHTML = `<div class="fs-title">${cleanName}</div><div class="fs-content">Interpretation missing.</div>`;
    } else {
        // 🔥 한/영 호환 로직 적용
        const userLang = localStorage.getItem('tetramegistus_lang') || 'en';
        const targetLang = (userLang === 'ko') ? 'ko' : 'en';
        
        const rawContent = (data.symbolism && (data.symbolism[targetLang] || data.symbolism['en'])) || ["No text available."];
        const htmlContent = (Array.isArray(rawContent) ? rawContent : [rawContent]).map(l => `<p style="margin-bottom:8px;">• ${l}</p>`).join('');
        
        popover.innerHTML = `
            <div class="fs-title">${data.name || cleanName}</div>
            <div class="fs-constellation">${data.constellation || ''}</div>
            <div class="fs-content">${htmlContent}</div>
        `;
    }

    if (popover.dataset.current === cleanName && popover.style.display === 'block') {
        popover.style.display = 'none';
        popover.classList.remove('active');
        return;
    }

    popover.dataset.current = cleanName;
    popover.classList.add('active');
    popover.style.display = 'block'; 

    // Position & Safety (마우스 커서 바로 위 밀착)
    const popoverWidth = 320; 
    const popoverHeight = popover.offsetHeight;
    
    let finalX = event.pageX + 15;
    if (finalX + popoverWidth > window.innerWidth + window.scrollX - 20) {
        finalX = event.pageX - popoverWidth - 10;
    }
    let finalY = event.pageY - popoverHeight - 15;
    if (finalY < window.scrollY + 10) {
        finalY = event.pageY + 20; 
    }

    popover.style.left = `${finalX}px`;
    popover.style.top = `${finalY}px`;
    popover.style.position = 'absolute';
}

/* ─────────────────────────────────────────────────────────────
   4. GRIMOIRE MANIFESTATION (A3 -> Archive)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    const params = new URLSearchParams(window.location.search);
    const sys = params.get('system') || 'tropical';
    const ayan = params.get('ayanamsa') || 'lahiri';
    const view = params.get('view') || 'zodiac';
    const method = params.get('method') || 'composite';
    const anti = params.get('anti') || 'off';
    const mode = params.get('mode') || 'cusp';

    let h_sys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    let orbValue = params.get('fixed_star_orb') || localStorage.getItem('tetramegistus_orb') || '1.0';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    // 🚀 A2와 동일: 로컬스토리지에서 시드 정보를 가져와 이름(A & B) 즉시 조합
    const activeDavison = JSON.parse(localStorage.getItem('active_davison'));
    const activeComposite = JSON.parse(localStorage.getItem('active_composite'));
    const albedoStation = activeDavison || activeComposite || {};

    let s1Name = albedoStation.seed1?.name || "";
    let s2Name = albedoStation.seed2?.name || "";
    let seedId = albedoStation.id;

    if (!seedId) {
        let id1 = albedoStation.seed1?.idx || albedoStation.seed1?.id || "unknown1";
        let id2 = albedoStation.seed2?.idx || albedoStation.seed2?.id || "unknown2";
        seedId = `${id1}_${id2}`;
    }

    // 🚀 귀찮은 팝업창 삭제! A2처럼 기존 시드 조합 이름으로 곧바로 고정
    let targetName = (s1Name && s2Name) ? `${s1Name} & ${s2Name}` : "Unknown Coniunctio";
    
    // 상태에 따른 정확한 컴파일러(Compiler ID) 타겟팅
    let compilerId = "a3";

    if (method === 'composite') {
        if (mode === 'domain') {
            compilerId = 'a3_comp_domain'; 
        } else {
            compilerId = 'a3_comp'; 
        }
    } else {
        if (mode === 'domain') {
            compilerId = 'a3_domain';
        } else {
            if (sys === 'sidereal' && view === 'lagna') {
                compilerId = 'a3_lagna';
            } else {
                compilerId = 'a3';
            }
        }
    }

    // 🚀 엑셀 컴파일에 필요한 메타데이터만 쏴주면, 연산은 파이썬 컴파일러가 직접 수행!
    const payload = {
        seed_id: seedId, // 기존 시드 조합(Coniunctio) 밑으로 정확히 들어가도록 ID 연결
        stage: 'albedo',
        target_name: targetName,
        language: lang,
        metadata: {
            sys_tab: sys,
            ayanamsa: ayan,
            view_mode: view,
            h_sys: h_sys,
            mode: method === 'composite' ? (anti === 'on' ? 'anti' : 'normal') : mode,
            method: method,
            anti: anti,
            fixed_star_orb: orbValue
        }
    };

    try {
        console.log(`[GRIMOIRE] Manifesting to Archive using [ ${compilerId} ]...`, payload);
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();

        if (res.ok) {
            console.log(`[GRIMOIRE] Archive [${targetName}] Saved Successfully!`);
            return true; // 성공 시 UI 딴에서 로딩 스피너 종료 등 처리
        } else {
            alert(`Manifestation Failed: ${result.detail || result.error || 'Unknown Error'}`);
            throw new Error(result.detail || result.error);
        }
    } catch (e) {
        console.error("[GRIMOIRE] Manifestation Error:", e);
        alert("Network Error during Grimoire Save.");
        throw e;
    }
};