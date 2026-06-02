/* static/world/nigredo/modules/n3.js — v7.2 Rich Tooltip & Dual Ruler */

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
(async function initDomusModule() {
    console.log("[DOMUS] N3 Module Loaded (v7.3)");

    // 🚀 [Added]: Apply Hover Tooltips to Existing Buttons
    document.querySelectorAll('.ayan-tab').forEach(btn => {
        const id = btn.dataset.ayan;
        if (AYANAMSA_DESCS[id]) btn.title = AYANAMSA_DESCS[id];
    });

    // 1. Data Integrity & Preload
    loadFixedStarMeanings(); 
    await ensureDataIntegrity();
    
    // 2. UI Init
    initializeDomusUI();
    
    // 3. Render Skeleton
    renderEmptyDomusTable(); 

    // 4. Fetch & Render Data
    await fetchAndRenderDomus(); 
    
    // 5. Global Event Listener (Close Popover)
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

// --- Integrity Helper ---
async function ensureDataIntegrity() {
    let localData = null;
    try { 
        let seed = localStorage.getItem('active_seed');
        let davison = localStorage.getItem('active_davison');
        localData = seed ? JSON.parse(seed) : (davison ? JSON.parse(davison) : null);
    } catch (e) {}

    if (localData) {
        try {
            await fetch('/api/astro/principia/sync-active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localData)
            });
        } catch (e) { console.error("[DOMUS] Sync Failed:", e); }
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
function initializeDomusUI() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'cusp';
    const sys = params.get('system') || 'tropical';
    const view = params.get('view') || 'zodiac';
    const ayan = params.get('ayanamsa') || 'lahiri';
    
    // Mode Toggle Knob Sync
    const domKnob = document.getElementById('domus-mode-knob');
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

    // System Tabs Sync
    document.querySelectorAll('.sys-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.sys === sys);
    });

    // Sidereal Controls Sync
    const sidePanel = document.getElementById('sidereal-controls-panel');
    const lagnaToggle = document.getElementById('lagna-view-toggle');
    
    if (sidePanel) {
        if (sys === 'sidereal') {
            sidePanel.classList.add('manifested');
            document.querySelectorAll('.ayan-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.ayan === ayan);
            });
            
            if (lagnaToggle) {
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
        } else {
            sidePanel.classList.remove('manifested');
        }
    }
}

function renderEmptyDomusTable() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'cusp';
    const sys = params.get('system') || 'tropical';
    const view = params.get('view') || 'zodiac';

    const table = document.getElementById('domus-table');
    if (!table) return;

    table.classList.remove('mode-cusp', 'mode-domain', 'mode-lagna');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = ''; tbody.innerHTML = '';

    if (sys === 'sidereal' && mode === 'cusp' && view === 'lagna') {
        table.classList.add('mode-lagna');
        // Lagna Skeleton
        thead.innerHTML = `<tr><th>Lagna</th><th>Information</th></tr>`;
        ["AL", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "UL"].forEach(lbl => {
            tbody.innerHTML += `<tr><td><strong>${lbl}</strong></td><td class="cell-info">-</td></tr>`;
        });
    } 
    else if (mode === 'domain') {
        table.classList.add('mode-domain');
        // Domain Skeleton
        thead.innerHTML = `<tr><th>House</th><th>Information</th><th class="text-center">Range</th><th>Planets</th><th>Asteroids</th><th>Hermetic</th></tr>`;
        for(let i=1; i<=12; i++) {
            const ord = (i%10==1&&i!=11)?'st':(i%10==2&&i!=12)?'nd':(i%10==3&&i!=13)?'rd':'th';
            tbody.innerHTML += `<tr><td><strong>${i}${ord} House</strong></td><td class="cell-info">-</td><td class="cell-range text-center">-</td><td class="cell-content">-</td><td class="cell-content">-</td><td class="cell-content">-</td></tr>`;
        }
    } 
    else {
        table.classList.add('mode-cusp');
        // Cusp Skeleton
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
            tbody.innerHTML += `<tr><td><strong>${lbl}</strong></td><td class="cell-info">-</td><td class="cell-range text-center">-</td><td class="cell-center">-</td><td class="cell-center">-</td><td class="cell-center">-</td><td class="cell-center">-</td><td class="cell-sabian">-</td></tr>`;
        });
    }
}

/* static/world/nigredo/modules/n3.js — fetchAndRenderDomus 수복 */

async function fetchAndRenderDomus() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'cusp';
    const sys = params.get('system') || 'tropical';
    const view = params.get('view') || 'zodiac';
    const ayan = params.get('ayanamsa') || 'lahiri';
    
    let h_sys = params.get('h_sys');
    if (!h_sys) {
        if (window.WorldSettings && window.WorldSettings.getHouseCode) h_sys = window.WorldSettings.getHouseCode();
        else {
            const savedHouse = localStorage.getItem('tetramegistus_house');
            h_sys = (savedHouse === 'whole') ? 'W' : (savedHouse === 'koch' ? 'K' : 'P');
        }
    }
    
    // 🚀 [수복]: Orb 설정 로드 (기본값 1.5)
    let orbValue = 1.5;
    const savedOrb = localStorage.getItem('tetramegistus_orb');
    if (savedOrb) {
        const parsed = parseFloat(savedOrb);
        if (!isNaN(parsed)) orbValue = parsed;
    }
    
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    const table = document.getElementById('domus-table');

    try {
        // 🔗 URL에 fixed_star_orb 추가
        const url = `/api/astro/domus/reading?system=${sys}&ayanamsa=${ayan}&h_sys=${h_sys}&view=${view}&fixed_star_orb=${orbValue}`;
        
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.error) return console.warn(data.error);

        // 🚀 [수복]: Angles Bar Update - 실제 기하학적 앵글 포인트 도수 주입
        // Whole Sign(W) 모드에서도 상단 바는 0도가 아닌 실제 Asc/MC 도수를 보여줍니다.
        // (기존의 data.domus로 덮어쓰던 코드를 삭제하여 이 값이 유지되도록 함)
        if (data.planets) {
            const realAsc = data.planets['Ascendant'];
            const realMc = data.planets['Midheaven'];
            
            const ascEl = document.getElementById('val-asc');
            const mcEl = document.getElementById('val-mc');

            if (ascEl && realAsc) {
                ascEl.textContent = realAsc.dms;
                // 필요 시 툴팁 정보 추가
                ascEl.title = `Ruler: ${realAsc.ruler || '-'} | ${realAsc.nakshatra?.name || ''}`;
            }
            if (mcEl && realMc) {
                mcEl.textContent = realMc.dms;
            }
        }

        // Table Rendering
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = ''; // 헤더는 renderEmptyDomusTable에서 이미 세팅됨

        if (mode === 'cusp') renderCuspMode(tbody, data, sys, view, lang);
        else renderDomainMode(tbody, data, sys, lang);

    } catch (e) { console.error("[DOMUS] Fetch Error:", e); }
}

function renderCuspMode(tbody, data, sys, view, lang) {
    const isLagnaView = (sys === "sidereal" && view === "lagna");
    data.domus.forEach(d => {
        const row = document.createElement('tr');
        
        // 1. Label & Fixed Stars
        let labelHTML = `<strong>${d.label}</strong>`;
        let infoText = d.dms;

        if (sys === 'sidereal' && view === 'lagna' && d.lagna_info) {
            labelHTML = `<strong>${d.lagna_info.label}</strong>`; 
            infoText = d.lagna_info.position_str || d.lagna_info.dms;
        }

        const cellName = document.createElement('td');
        cellName.innerHTML = labelHTML;
        if (d.lagna_info) {
            if (d.lagna_info.label === 'AL') cellName.title = "Arudha Lagna";
            if (d.lagna_info.label === 'UL') cellName.title = "Upapada Lagna";
        }
        
        // Fixed Stars Injection (Angles only)
        const angleMap = {1: 'Ascendant', 4: 'Immum Coeli', 7: 'Descendant', 10: 'Midheaven'};
        const angleKey = angleMap[d.house_num];
        if (!isLagnaView && angleKey && data.angles_fs && data.angles_fs[angleKey]) {
            data.angles_fs[angleKey].forEach(fs => {
                const icon = document.createElement('span');
                icon.className = `fs-icon fs-${fs.tier.toLowerCase()}`;
                icon.title = `${fs.name} | ${fs.dms || fs.position || "?"} | orb ${fs.orb}°`;
                icon.onclick = (e) => { e.stopPropagation(); showFixedStarMeaning(fs.name, e); };
                cellName.appendChild(icon);
            });
        }
        row.appendChild(cellName);

        // 2. Info & Rich Ruler Tooltip (Dual + Dignity)
        const cellInfo = document.createElement('td');
        cellInfo.className = 'cell-info';
        
        // 🚀 [수복]: Lagna 모드일 때는 하우스 커스프의 Anaretic 속성이 전염되지 않도록 차단!
        if (d.is_anaretic && !isLagnaView) {
            cellInfo.classList.add('text-anaretic');
        }
        
        cellInfo.textContent = infoText;
        
        cellInfo.textContent = infoText;
        
        // 🚀 [Updated Logic]: Handle Dual Rulers & Dignity
        let rulerList = Array.isArray(d.ruler) ? d.ruler : [d.ruler];
        let tooltipLines = [];
        
        rulerList.forEach(rName => {
            let found = null;
            // Search in contents to find planet info
            for (let h in data.contents) {
                const p = data.contents[h].planets.find(item => item.name === rName);
                if (p) { found = p; break; }
            }
            
            if (found) {
                let line = `${rName}: ${found.dms}`;
                if (found.dignity && found.dignity !== '-') line += ` | ${found.dignity}`;
                tooltipLines.push(line);
            }
            else tooltipLines.push(`${rName}: -`);
        });
        
        if (!isLagnaView) cellInfo.title = tooltipLines.join('\n');
        row.appendChild(cellInfo);

        if (isLagnaView) {
            tbody.appendChild(row);
            return;
        }

        // 3. Range (Centered)
        const cellRange = document.createElement('td');
        cellRange.className = 'cell-range text-center'; 
        cellRange.textContent = d.range_str;
        row.appendChild(cellRange);

        // 4. Divisions (Colored & Centered)
        ['duad', 'dodeca', 'decan', 'bound'].forEach(k => {
            const td = document.createElement('td');
            td.className = 'cell-center';
            td.textContent = d[k];
            const map = (k==='duad'||k==='dodeca') ? ELEMENT_MAP : PLANET_GLOW_MAP;
            applySymbolGlow(td, d[k], map);
            row.appendChild(td);
        });

        // 5. Sabian
        const cellSabian = document.createElement('td');
        cellSabian.className = 'cell-sabian';
        renderSabianText(cellSabian, d.sabian_index, lang);
        row.appendChild(cellSabian);

        tbody.appendChild(row);
    });
}

function renderDomainMode(tbody, data, sys, lang) {
    const isLagnaView = false; // Domain mode is never Lagna View
    data.domus.forEach(d => {
        const row = document.createElement('tr');
        
        // House Num
        const cellName = document.createElement('td');
        const ord = (d.house_num%10==1&&d.house_num!=11)?'st':(d.house_num%10==2&&d.house_num!=12)?'nd':(d.house_num%10==3&&d.house_num!=13)?'rd':'th';
        cellName.innerHTML = `<strong>${d.house_num}${ord} House</strong>`;
        row.appendChild(cellName);

        // Info & Rich Ruler Tooltip
        const cellInfo = document.createElement('td');
        cellInfo.className = 'cell-info';
        
        // 🔥 Anaretic CSS 트리거 추가
        if (d.is_anaretic) {
            cellInfo.classList.add('text-anaretic');
        }
        
        cellInfo.textContent = d.dms;
        
        // 🚀 [Updated Logic]: Handle Dual Rulers & Dignity
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

        // Range (Centered)
        const cellRange = document.createElement('td');
        cellRange.className = 'cell-range text-center'; 
        cellRange.textContent = d.range_str;
        row.appendChild(cellRange);

        // Contents Lists
        const houseContent = data.contents[d.house_num];
        ['planets', 'asteroids', 'hermetic'].forEach(cat => {
            const td = document.createElement('td');
            td.className = 'cell-content';
            const items = houseContent[cat];
            
            if (items.length > 0) {
                const htmlList = items.map(item => {
                    let title = item.dms;
                    // Fix 7: Hermetic Hover only in Tropical
                    if (cat === 'hermetic' && sys !== 'tropical') title = "";
                    return `<span class="content-item" title="${title}">${item.name}</span>`;
                }).join(', ');
                td.innerHTML = htmlList;
            } else { td.textContent = "-"; }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
}

/* ─────────────────────────────────────────────────────────────
   5. UTILS & EXPORTS
   ───────────────────────────────────────────────────────────── */
window.switchDomusMode = function() {
    const url = new URL(window.location.href);
    const curr = url.searchParams.get('mode') || 'cusp';
    url.searchParams.set('mode', curr === 'cusp' ? 'domain' : 'cusp');
    window.location.href = url.toString();
};
window.switchDomusSystem = function(sys) {
    const url = new URL(window.location.href);
    url.searchParams.set('system', sys);
    if (sys !== 'sidereal') { url.searchParams.delete('ayanamsa'); url.searchParams.delete('view'); }
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

// Fixed Star Popover Logic (Synced with N2 Fix & Dual Lang)
function showFixedStarMeaning(starName, event) {
    let popover = document.getElementById('fs-popover');
    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'fs-popover';
        popover.className = 'fs-popover-box';
        document.body.appendChild(popover);
    }
    
    // CSS 간섭 원천 차단
    popover.style.transform = 'none';
    
    // Data Fetch
    const cleanName = starName.trim();
    let data = FS_MEANINGS[cleanName];
    if (!data) {
        const titleCase = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
        data = FS_MEANINGS[titleCase];
    }
    if (!data) data = FS_MEANINGS[cleanName.toLowerCase()];

    // HTML Rendering (🔥 한/영 호환 로직 적용)
    if (!data) {
        popover.innerHTML = `<div class="fs-title">${cleanName}</div><div class="fs-content">Interpretation missing.</div>`;
    } else {
        const userLang = localStorage.getItem('tetramegistus_lang') || 'en';
        const targetLang = (userLang === 'ko') ? 'ko' : 'en';
        
        // 번역 데이터가 없으면 영어로, 영어도 없으면 대체 텍스트 출력
        const rawContent = (data.symbolism && (data.symbolism[targetLang] || data.symbolism['en'])) || ["No text available."];
        const htmlContent = (Array.isArray(rawContent) ? rawContent : [rawContent]).map(l => `<p style="margin-bottom:8px;">• ${l}</p>`).join('');
        
        popover.innerHTML = `<div class="fs-title">${data.name || cleanName}</div><div class="fs-constellation">${data.constellation || ''}</div><div class="fs-content">${htmlContent}</div>`;
    }

    // Toggle Close
    if (popover.dataset.current === cleanName && popover.style.display === 'block') {
        popover.style.display = 'none';
        popover.classList.remove('active');
        return;
    }

    // Toggle Open
    popover.dataset.current = cleanName;
    popover.classList.add('active');
    
    // 🔥 실제 높이 측정을 위해 위치 계산 전에 block 처리 강제
    popover.style.display = 'block'; 

    // Position & Safety (🔥 N2/A2와 동일한 마우스 위쪽 밀착 로직)
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
   GRIMOIRE SAVE SYSTEM (Nigredo / N3 Series)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    // 1. URL 파라미터 및 로컬 스토리지에서 핵심 메타데이터 추출
    const params = new URLSearchParams(window.location.search);
    const system = params.get('system') || 'tropical';
    const ayanamsa = params.get('ayanamsa') || 'lahiri';
    
    // N3 특화 파라미터 
    let h_sys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    let orb = params.get('fixed_star_orb') || localStorage.getItem('tetramegistus_orb') || '1.0';
    // 🚀 [추가]: 현재 테트라메기스투스 언어 설정 로드
    const currentLang = localStorage.getItem('tetramegistus_lang') || 'en';    

    // 🚀 [수복 1]: mode(Domain/Cusp)와 view(Zodiac/Lagna)를 정확히 분리해서 가져옵니다.
    const currentMode = params.get('mode') || 'cusp';
    const currentView = params.get('view') || 'zodiac';

    // 2. 현재 활성화된 시드(Seed) 확보
    const activeSeedRaw = localStorage.getItem('active_seed');
    if (!activeSeedRaw) {
        alert("Cannot manifest: No active seed found in station.");
        return false;
    }
    const activeSeed = JSON.parse(activeSeedRaw);
    
    const targetName = activeSeed ? activeSeed.name : "Unknown_Seed";
    const seedId = activeSeed ? activeSeed.id : "unknown";

    // 3. 백엔드 컴파일러 판독기 (Airtight Routing)
    let compilerId = 'n3'; 
    
    // 🚀 [수복 2]: 실제 HTML ID(label-mode-domain)에 맞게 2차 스캐너 수정
    const isDomainActive = document.getElementById('label-mode-domain')?.classList.contains('active');
    const isLagnaActive = document.getElementById('label-lagna')?.classList.contains('active');

    // 라우팅 조건 분기
    if (currentMode === 'domain' || isDomainActive) {
        compilerId = 'n3_domain';
    } else if (currentView === 'lagna' || isLagnaActive) {
        compilerId = 'n3_lagna';
    }

    // 4. Payload 조립
    const payload = {
        seed_id: seedId,
        stage: 'nigredo',       
        target_name: targetName,
        metadata: {
            sys_tab: system,
            ayanamsa: ayanamsa,
            h_sys: h_sys,
            fixed_star_orb: orb,
            language: currentLang,
            view_mode: currentView // zodiac인지 lagna인지 백엔드에 정확히 전달
        },
        seed: activeSeed 
    };

    // 5. Grimoire 마스터 라우터로 연성 요청
    try {
        console.log(`[GRIMOIRE] Manifesting N3 Archive using [ ${compilerId} ]...`, payload);
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (res.ok) {
            console.log(`[GRIMOIRE] Archive [${targetName}] Saved Successfully!`);
            return true;
        } else {
            alert('Failed to manifest Grimoire: ' + result.detail);
            throw new Error(result.detail);
        }
    } catch (e) {
        console.error(e);
        alert('Network Error during Grimoire Save.');
        throw e;
    }
};