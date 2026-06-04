/* static/mobile/world/albedo/modules/a5.js - Mobile ASPECTUS */

const ASPECT_GROUPS = {
    "Major": ["Conjunction", "Opposition", "Trine", "Square", "Sextile"],
    "Minor": ["Quintile", "Septile", "Octile", "Sesquiquadrate", "Novile", "Decile", "Undecile", "Semi-sextile", "Quincunx"]
};

const CATEGORIES = {
    "planets": ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"],
    "asteroids": ["Chiron", "Ceres", "Juno", "Pallas", "Vesta", "Asteroid Eros", "Psyche"],
    "lilith": ["Rahu", "Ketu", "Mean Lilith", "True Lilith", "Asteroid Lilith", "North Node", "South Node"], 
    "fates": ["Moira", "Klotho", "Lachesis", "Atropos"],
    "hermetic": ["Fortune", "Spirit", "Necessity", "Necessity (v)", "Eros", "Eros (v)", "Courage", "Victory", "Nemesis", "Vertex", "Anti-Vertex", "Syzygy"]
};

let A5_STATE = {
    mode: 'unus', 
    method: 'composite',
    view: 'patterns',
    sys1: 'default',
    sys2: 'default',
    activeCategory: 'planets',
    selectedBody: null,
    selectedAspect: null,
    selectedPattern: null,
    aspectFilter: 'sys1', 
    data: null, 
    definitions: {},
    isDataCalculated: false 
};

let a5ToastTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const defRes = await fetch('/api/astro/theory/patterns/definitions'); 
        if(defRes.ok) A5_STATE.definitions = await defRes.json();
    } catch(e) {}

    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'intersectus') {
        A5_STATE.mode = 'intersectus';
    } else {
        A5_STATE.mode = 'unus'; 
        A5_STATE.method = params.get('method') || 'composite';
    }

    updateA5ModeUI();
    updateA5ViewUI();
    
    // 🚀 모바일 환경에 맞게 LocalStorage 연동 확실화
    await ensureDataIntegrity();
    if(A5_STATE.mode === 'unus') {
        await fetchAspectusData(); 
    }

    // 🚀 [수복]: 드롭다운 터치 씹힘 방어 로직 (N5와 동일)
    document.addEventListener('touchstart', (e) => {
        const popover = document.getElementById('fs-popover');
        if (popover && popover.style.display === 'block') {
            if (!e.target.closest('.fs-popover-box') && !e.target.closest('.m-card-header')) {
                popover.style.display = 'none';
                popover.classList.remove('active');
            }
        }
        
        const ddList = document.getElementById('a5-dd-list');
        const ddSel = document.getElementById('a5-dd-selected');
        if (ddList && ddList.style.display === 'block') {
            if (e.target !== ddList && !ddList.contains(e.target) && e.target !== ddSel && !ddSel.contains(e.target)) {
                ddList.style.display = 'none';
            }
        }
    });
});

function updateA5Url() {
    const params = new URLSearchParams(window.location.search);
    params.set('module', 'a5');
    params.set('mode', A5_STATE.mode);
    if (A5_STATE.mode === 'unus') params.set('method', A5_STATE.method);
    else params.delete('method');
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
}

function updateA5ModeUI() {
    const lblUnus = document.getElementById('a5-lbl-unus');
    const lblInter = document.getElementById('a5-lbl-intersectus');
    const knobMode = document.getElementById('a5-knob-mode');
    
    const methodSwitch = document.getElementById('a5-method-switch-container');
    const lblComp = document.getElementById('a5-lbl-comp');
    const lblDavi = document.getElementById('a5-lbl-davi');
    const knobMethod = document.getElementById('a5-knob-method');

    const selectors = document.getElementById('a5-system-selectors');
    const filterCon = document.getElementById('a5-aspect-filter-container');

    if (A5_STATE.mode === 'intersectus') {
        knobMode.classList.add('right');
        lblUnus.classList.remove('active');
        lblInter.classList.add('active');
        
        methodSwitch.style.display = 'none';
        selectors.style.display = 'block';
        if (A5_STATE.view === 'aspects') filterCon.style.display = 'flex';
    } else {
        knobMode.classList.remove('right');
        lblUnus.classList.add('active');
        lblInter.classList.remove('active');
        
        methodSwitch.style.display = 'flex';
        selectors.style.display = 'none';
        filterCon.style.display = 'none';

        // Update Comp/Davi UI
        if (A5_STATE.method === 'davison') {
            knobMethod.classList.add('right');
            lblComp.classList.remove('active');
            lblDavi.classList.add('active');
        } else {
            knobMethod.classList.remove('right');
            lblComp.classList.add('active');
            lblDavi.classList.remove('active');
        }
    }
}

function updateA5ViewUI() {
    const tabPat = document.getElementById('a5-tab-patterns');
    const tabAsp = document.getElementById('a5-tab-aspects');
    const viewPat = document.getElementById('m-view-patterns');
    const viewAsp = document.getElementById('m-view-aspects');
    const filterCon = document.getElementById('a5-aspect-filter-container');

    if (A5_STATE.view === 'patterns') {
        tabPat.classList.add('active'); tabAsp.classList.remove('active');
        viewPat.style.display = 'block'; viewAsp.style.display = 'none';
        filterCon.style.display = 'none';
    } else {
        tabPat.classList.remove('active'); tabAsp.classList.add('active');
        viewPat.style.display = 'none'; viewAsp.style.display = 'block';
        if (A5_STATE.mode === 'intersectus') filterCon.style.display = 'flex';
    }
}

// 🚀 [수복]: 잔재 파괴
window.toggleA5Mode = function() {
    A5_STATE.mode = (A5_STATE.mode === 'unus') ? 'intersectus' : 'unus';
    A5_STATE.isDataCalculated = false; 
    A5_STATE.selectedPattern = null; 
    A5_STATE.data = null; 
    
    updateA5ModeUI();
    updateA5Url();
    renderShapesGrid(); 
    renderTransposedTable();
    renderAspectExplorer();

    if(A5_STATE.mode === 'unus') {
        fetchAspectusData();
    }
};

window.toggleA5Method = function() {
    if (A5_STATE.mode === 'intersectus') return;
    A5_STATE.method = (A5_STATE.method === 'composite') ? 'davison' : 'composite';
    A5_STATE.isDataCalculated = false;
    A5_STATE.selectedPattern = null; 
    A5_STATE.data = null; 

    updateA5ModeUI();
    updateA5Url();
    renderShapesGrid(); 
    renderTransposedTable();
    renderAspectExplorer();

    fetchAspectusData();
};

window.switchA5View = function(view) {
    A5_STATE.view = view;
    updateA5ViewUI();
};

window.handleSystemAChange = function(v) { 
    A5_STATE.sys1 = v; 
    A5_STATE.isDataCalculated = false; 
    
    const sel = document.getElementById('a5-sys-b-select');
    if (v === 'default') { sel.innerHTML = '<option value="default">Wait for Sys A...</option>'; return; }
    
    const systems = [
        'composite', 'd_tropical', 'd_sidereal', 'd_draconic', 'd_ketunic',
        'a_tropical', 'a_sidereal', 'a_draconic', 'a_ketunic',
        'b_tropical', 'b_sidereal', 'b_draconic', 'b_ketunic'
    ];
    let html = '<option value="default" selected>Select System B</option>';
    systems.filter(s => s !== v).forEach(s => {
        html += `<option value="${s}">${s.replace('_', ' ').toUpperCase()}</option>`;
    });
    sel.innerHTML = html;
};

window.handleSystemBChange = function(v) { 
    A5_STATE.sys2 = v; 
    A5_STATE.isDataCalculated = false; 
};

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
        } catch (e) { console.error("[A5] Sync Failed:", e); }
    }
}

window.fetchAspectusData = async function() {
    await ensureDataIntegrity();
    const activeAlbedo = JSON.parse(localStorage.getItem('active_davison'));
    if (!activeAlbedo) {
        showA5Toast("<strong style='color:#ff6b6b;'>ERROR</strong><br>No Albedo Data Found.");
        return;
    }

    const mode_query = A5_STATE.mode === 'unus' ? 'unus' : 'intersectus';
    const method_query = A5_STATE.mode === 'unus' ? A5_STATE.method : 'intersectus';
    let s1 = A5_STATE.mode === 'unus' ? (A5_STATE.method === 'composite' ? 'composite' : 'd_tropical') : A5_STATE.sys1;
    let s2 = A5_STATE.sys2;

    if (A5_STATE.mode === 'intersectus' && (s1 === 'default' || s2 === 'default')) {
        showA5Toast("<strong style='color:#ff6b6b;'>ERROR</strong><br>Select both systems first.");
        return;
    }

    try {
        const url = `/api/astro/aspectus/reading?mode=${mode_query}&method=${method_query}&s1=${s1}&s2=${s2}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Fetch Failed");
        
        A5_STATE.data = await res.json();
        A5_STATE.isDataCalculated = true; 

        initHermeticLock();
        renderShapesGrid();
        renderTransposedTable();
        renderAspectExplorer();
        
        showA5Toast("<strong>DATA SYNCED</strong><br>Aspectus loaded successfully.");
    } catch (e) { console.error("A5 Fetch Failed", e); }
};

function initHermeticLock() {
    if (!A5_STATE.data) return;
    const isUnknown = A5_STATE.data.meta && A5_STATE.data.meta.is_time_unknown === 1;
    const isCompositeMode = (A5_STATE.mode === 'unus' && A5_STATE.method === 'composite') || 
                            (A5_STATE.mode === 'intersectus' && A5_STATE.sys1 === 'composite');
    
    const hermeticBtn = document.querySelector('.m-tab[data-cat="hermetic"]');
    
    if (hermeticBtn) {
        if (isCompositeMode) {
            hermeticBtn.style.display = 'none'; // 컴포짓에선 완전 숨김
            if (A5_STATE.activeCategory === 'hermetic') window.switchA5Category('planets');
        } else {
            hermeticBtn.style.display = 'block';
            if (isUnknown) {
                hermeticBtn.classList.add('locked');
                hermeticBtn.onclick = (e) => {
                    e.stopPropagation();
                    showA5Toast("<strong style='color:#ff6b6b;'>TIME UNKNOWN</strong><br><span style='color:#ccc;'>Hermetic calculation locked.</span>");
                };
                if (A5_STATE.activeCategory === 'hermetic') window.switchA5Category('planets');
            } else {
                hermeticBtn.classList.remove('locked');
                hermeticBtn.onclick = () => window.switchA5Category('hermetic');
            }
        }
    }
}

// ============================================
// PATTERNS VIEW RENDER (A5)
// ============================================

function renderShapesGrid() {
    const grid = document.getElementById('a5-shapes-grid');
    if(!grid || !A5_STATE.data) return;
    grid.innerHTML = '';

    const allPatterns = A5_STATE.data.patterns || [];
    const uniqueShapes = [...new Set(allPatterns.map(p => p.shape))];

    // 🚀 [수복 1]: 첫 번째 패턴 자동 선택 로직
    if (!A5_STATE.selectedPattern && uniqueShapes.length > 0) {
        A5_STATE.selectedPattern = uniqueShapes[0];
    }

    uniqueShapes.forEach(shape => {
        const btn = document.createElement('button');
        btn.className = `m-tab ${A5_STATE.selectedPattern === shape ? 'active' : ''}`;
        btn.textContent = shape;
        btn.onclick = () => {
            A5_STATE.selectedPattern = shape;
            renderShapesGrid();
            renderTransposedTable();
        };
        grid.appendChild(btn);
    });
}

function renderTransposedTable() {
    const detailArea = document.getElementById('a5-pattern-detail-area');
    const emptyArea = document.getElementById('a5-pattern-empty');
    const thead = document.getElementById('m-a5-thead-patterns');
    const tbody = document.getElementById('m-a5-tbody-patterns');

    if (!A5_STATE.selectedPattern || !A5_STATE.data) {
        if (detailArea) detailArea.style.display = 'none';
        if (emptyArea) {
            emptyArea.style.display = 'block';
            // 🚀 [수복 2]: 연산이 끝났는데 패턴이 0개인 경우 (무한 로딩 스피너 파괴)
            if (!A5_STATE.data) {
                emptyArea.innerHTML = '<div style="padding:40px 0; text-align:center; color:#49dce1;">LOADING PATTERNS...</div>';
            } else if (!A5_STATE.data.patterns || A5_STATE.data.patterns.length === 0) {
                emptyArea.innerHTML = '<div style="padding:40px 0; text-align:center; color:#aaa; font-size:0.85rem; letter-spacing:1px;">NO GEOMETRIC PATTERNS FORMED</div>';
            }
        }
        return;
    }

    if (detailArea) detailArea.style.display = 'block';
    if (emptyArea) emptyArea.style.display = 'none';
    document.getElementById('a5-shape-name').textContent = A5_STATE.selectedPattern;

    const displayPatterns = A5_STATE.data.patterns.filter(p => p.shape === A5_STATE.selectedPattern);
    
    let theadHtml = `<tr><th class="sticky-corner">#</th>`;
    displayPatterns.forEach((_, idx) => {
        theadHtml += `<th>SET ${idx + 1}</th>`;
    });
    theadHtml += `</tr>`;
    thead.innerHTML = theadHtml;

    tbody.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="sticky-col">${i}</td>`;
        
        displayPatterns.forEach((p) => {
            const pKey = p[`p${i}`] || '-';
            const td = document.createElement('td');
            
            if (pKey !== '-') {
                const display = formatDisplayName(pKey);
                const categoryColor = getCategoryColor(pKey); 
                
                td.innerHTML = `<span style="color:${categoryColor}; font-weight:bold;">${display}</span>`;
                td.className = 'm-a5-clickable-td';
                
                const lon = A5_STATE.data.bodies[pKey] || 0.0;
                td.onclick = () => {
                    showA5Toast(`<strong style="color:${categoryColor};">${display}</strong><br>${formatElementDMS(lon)}`);
                };
            } else {
                td.textContent = '-';
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    }
}

window.showPatternPopup = function() {
    const popover = document.getElementById('fs-popover');
    if(!popover || !A5_STATE.selectedPattern) return;
    
    const shape = A5_STATE.selectedPattern;
    const def = A5_STATE.definitions[shape];
    if (!def) return;

    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    const desc = def[lang] || def['en'] || "No description available.";

    popover.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: 900; border-bottom: 1px solid #49dce1; padding-bottom: 8px; margin-bottom: 12px; color: #49dce1; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
            ${shape}
        </div>
        <div style="font-size: 0.85rem; line-height: 1.6; color: #ddd; text-align: left;">
            ${desc}
        </div>
        <div style="margin-top: 15px; font-size: 0.7rem; color: #555; text-align: center; border-top: 1px dashed rgba(73, 220, 225, 0.2); padding-top: 10px;">TAP TO CLOSE</div>
    `;
    popover.onclick = function(e) { e.stopPropagation(); this.style.display='none'; this.classList.remove('active'); };
    popover.style.display = 'block';
    popover.classList.add('active');
};

// ============================================
// ASPECTS VIEW RENDER
// ============================================

window.toggleAspectSystemFilter = function() {
    A5_STATE.aspectFilter = (A5_STATE.aspectFilter === 'sys1') ? 'sys2' : 'sys1';
    const knob = document.getElementById('a5-knob-filter');
    const labelA = document.getElementById('a5-lbl-filter-a');
    const labelB = document.getElementById('a5-lbl-filter-b');
    
    if (A5_STATE.aspectFilter === 'sys2') {
        knob.classList.add('right'); labelA.classList.remove('active'); labelB.classList.add('active');
    } else {
        knob.classList.remove('right'); labelA.classList.add('active'); labelB.classList.remove('active');
    }
    renderBodiesDropdown();
};

window.switchA5Category = function(cat) {
    A5_STATE.activeCategory = cat;
    A5_STATE.selectedBody = null; 
    
    document.querySelectorAll('#a5-aspect-tabs .m-tab:not(.locked)').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`#a5-aspect-tabs .m-tab[data-cat="${cat}"]`);
    if(btn) btn.classList.add('active');
    
    renderAspectExplorer();
};

window.toggleA5Dropdown = function(e) {
    if(e) e.stopPropagation();
    const list = document.getElementById('a5-dd-list');
    if(list) {
        list.style.display = (list.style.display === 'none' || list.style.display === '') ? 'block' : 'none';
    }
};

function renderAspectExplorer() {
    renderBodiesDropdown();
    document.getElementById('m-a5-list-aspects').innerHTML = '<div class="m-placeholder" style="margin-top:20px;">Select Body</div>';
    document.getElementById('m-a5-list-objects').innerHTML = '<div class="m-placeholder" style="margin-top:20px;">-</div>';
}

// 🚀 [수복 2]: 드롭다운 첫 항목 강제 선택 해제 및 "SELECT BODY" 디폴트화
function renderBodiesDropdown() {
    const list = document.getElementById('a5-dd-list');
    const selectedDiv = document.getElementById('a5-dd-selected');
    if (!list || !selectedDiv || !A5_STATE.data) return;
    
    list.innerHTML = ''; 
    const allKeys = Object.keys(A5_STATE.data.bodies || {});
    let suffix = '';
    let currentSys = A5_STATE.sys1; 

    if (A5_STATE.mode === 'intersectus') {
        suffix = (A5_STATE.aspectFilter === 'sys1') ? '_1' : '_2';
        currentSys = (A5_STATE.aspectFilter === 'sys1') ? A5_STATE.sys1 : A5_STATE.sys2;
    }

    const isNodeExempt = currentSys.includes('draconic') || currentSys.includes('ketunic');
    const excludedNodes = ['Rahu', 'Ketu', 'North Node', 'South Node'];

    (CATEGORIES[A5_STATE.activeCategory] || []).forEach(base => {
        if (isNodeExempt && excludedNodes.includes(base)) return;

        // A5의 데이터는 키가 `Sun_1`, `Sun_2` 형태 (intersectus)이거나 그냥 `Sun` (unus)
        const targetKey = A5_STATE.mode === 'intersectus' ? base + suffix : base;
        
        if (allKeys.includes(targetKey)) {
            const lon = A5_STATE.data.bodies[targetKey] || 0.0;
            const displayTxt = formatDisplayName(targetKey);
            const categoryColor = getCategoryColor(targetKey);
            
            const item = document.createElement('div');
            item.className = `m-dropdown-item`; 
            
            item.innerHTML = `
                <span style="color:${categoryColor}; font-weight:bold;">${displayTxt}</span> 
                <span style="color:#aaa; font-size:0.75rem;">[${formatElementDMS(lon)}]</span>
            `;
            
            item.onclick = (e) => {
                e.stopPropagation();
                A5_STATE.selectedBody = targetKey;
                A5_STATE.selectedAspect = null;
                selectedDiv.innerHTML = item.innerHTML; 
                list.style.display = 'none';
                document.getElementById('m-a5-list-objects').innerHTML = '';
                renderAspectList();
            };
            list.appendChild(item);
        }
    });

    if (A5_STATE.selectedBody) {
        const lonInfo = A5_STATE.data.bodies[A5_STATE.selectedBody] || 0.0;
        const displayTxt = formatDisplayName(A5_STATE.selectedBody);
        const categoryColor = getCategoryColor(A5_STATE.selectedBody);
        
        selectedDiv.innerHTML = `<span style="color:${categoryColor}; font-weight:bold;">${displayTxt}</span> <span style="color:#aaa; font-size:0.75rem;">[${formatElementDMS(lonInfo)}]</span>`;
        renderAspectList();
    } else {
        selectedDiv.innerHTML = "SELECT BODY";
        document.getElementById('m-a5-list-aspects').innerHTML = `<div class="m-asp-item m-asp-item-center" style="border:none;">Select Body</div>`;
        document.getElementById('m-a5-list-objects').innerHTML = '';
    }
}

function renderAspectList() {
    const container = document.getElementById('m-a5-list-aspects');
    if (!container || !A5_STATE.data || !A5_STATE.selectedBody) return;
    container.innerHTML = '';

    const bodyAspects = A5_STATE.data.aspects.filter(a => 
        a.p1 === A5_STATE.selectedBody || a.p2 === A5_STATE.selectedBody
    );

    const validAspects = bodyAspects.filter(a => {
        if (A5_STATE.mode === 'intersectus') {
            const currentTabSuffix = A5_STATE.aspectFilter === 'sys1' ? '_1' : '_2';
            const targetKey = (a.p1 === A5_STATE.selectedBody) ? a.p2 : a.p1;
            const targetSuffix = targetKey.includes('_1') ? '_1' : '_2';
            return currentTabSuffix !== targetSuffix;
        }
        return true;
    });

    if (validAspects.length === 0) {
        container.innerHTML = `<div class="m-asp-item m-asp-item-center" style="border:none;">No Aspects</div>`;
        document.getElementById('m-a5-list-objects').innerHTML = '';
        return;
    }

    const foundNames = [...new Set(validAspects.map(a => a.aspect))];

    ["Major", "Minor"].forEach(group => {
        const list = ASPECT_GROUPS[group].filter(n => foundNames.includes(n));
        
        if (list.length > 0) {
            const h = document.createElement('div'); 
            h.style.cssText = 'font-size: 0.6rem; color: #444; margin: 10px 0 2px 5px; text-transform: uppercase; font-weight: bold;';
            h.textContent = group;
            container.appendChild(h);

            list.forEach(asp => {
                const count = validAspects.filter(a => a.aspect === asp).length;

                const btn = document.createElement('div');
                btn.className = `m-asp-item ${A5_STATE.selectedAspect === asp ? 'active' : ''}`;
                btn.style.flexDirection = 'row';
                btn.style.justifyContent = 'space-between';
                btn.style.alignItems = 'center';
                
                btn.innerHTML = `<span style="font-size:0.75rem; color:#ccc;">${asp}</span> <span style="background:rgba(255,255,255,0.1); padding:2px 5px; border-radius:4px; font-size:0.6rem; color:#49dce1;">${count}</span>`;
                
                btn.onclick = () => {
                    A5_STATE.selectedAspect = asp;
                    renderAspectList(); 
                    renderObjects(); 
                };
                container.appendChild(btn);
            });
        }
    });
}

function renderObjects() {
    const container = document.getElementById('m-a5-list-objects');
    if (!container || !A5_STATE.selectedBody) return;
    container.innerHTML = '';

    const aspects = A5_STATE.data.aspects.filter(a => 
        (a.p1 === A5_STATE.selectedBody && a.aspect === A5_STATE.selectedAspect) || 
        (a.p2 === A5_STATE.selectedBody && a.aspect === A5_STATE.selectedAspect)
    );

    aspects.forEach(t => {
        const targetKey = (t.p1 === A5_STATE.selectedBody) ? t.p2 : t.p1;
        
        if (A5_STATE.mode === 'intersectus') {
            const currentTabSuffix = (A5_STATE.aspectFilter === 'sys1') ? '_1' : '_2';
            const targetSuffix = targetKey.includes('_1') ? '_1' : '_2';
            if (currentTabSuffix === targetSuffix) return; 
        }

        const div = document.createElement('div');
        div.className = 'm-asp-item'; 
        
        const display = formatDisplayName(targetKey);
        const categoryColor = getCategoryColor(targetKey);
        const lon = A5_STATE.data.bodies[targetKey] || 0.0;
        const orbText = `${t.orb.toFixed(2)}°`;
        
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:normal; color:#ccc;">
                <span style="font-size:0.75rem; color:${categoryColor}; font-weight:bold;">${display}</span>
                <span style="color:#49dce1; font-size:0.75rem;">${orbText}</span>
            </div>
        `;
        
        const formatString = formatElementDMS(lon);
        const toastStr = encodeURIComponent(`
            <strong style="color:${categoryColor}; font-size:1.1em;">${display}</strong><br>
            <span style="display:inline-block; margin-top:4px;">${formatString}</span>
        `).replace(/'/g, "%27");
        
        div.onclick = () => showA5Toast(decodeURIComponent(toastStr));
        container.appendChild(div);
    });
}

/* ─────────────────────────────────────────────────────────────
   HELPERS & COLOR LOGICS (FIXED)
   ───────────────────────────────────────────────────────────── */

function getCategoryColor(bodyName) {
    let baseName = bodyName.replace(/_[12]$/, '');
    
    if (CATEGORIES.planets.includes(baseName)) return '#06F8FF';
    if (CATEGORIES.asteroids.includes(baseName)) return '#54FF5F';
    if (CATEGORIES.lilith.includes(baseName)) return '#C164FF';
    if (CATEGORIES.fates.includes(baseName)) return '#ce93d8';
    if (CATEGORIES.hermetic.includes(baseName)) return '#FC09CA';
    
    return '#AAAAAA'; 
}

function formatElementDMS(lon) {
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    
    const SIGN_COLORS = {
        "Aries": "#FFCCCC", "Leo": "#FFCCCC", "Sagittarius": "#FFCCCC",
        "Taurus": "#FFFF99", "Virgo": "#FFFF99", "Capricorn": "#FFFF99",
        "Gemini": "#F2F2F2", "Libra": "#F2F2F2", "Aquarius": "#F2F2F2",
        "Cancer": "#CCFFFF", "Scorpio": "#CCFFFF", "Pisces": "#CCFFFF"
    };
    
    const s_idx = Math.floor(lon / 30) % 12;
    const deg = Math.floor(lon % 30);
    const m_total = (lon % 1) * 60;
    const min = Math.floor(m_total);
    const sec = Math.floor((m_total - min) * 60);
    
    const signName = signs[s_idx];
    const color = SIGN_COLORS[signName];
    
    return `<span style="color:${color} !important; font-weight:bold;">${signName},${deg.toString().padStart(2, '0')}°${min.toString().padStart(2, '0')}'${sec.toString().padStart(2, '0')}''</span>`;
}

// 🚀 [A5 전용]: 시스템명 머리글자 추출 로직 적용 (Composite -> C_Sun)
function formatDisplayName(pKey) {
    const baseName = pKey.split('_')[0];
    if (A5_STATE.mode === 'intersectus') {
        const suffix = pKey.includes('_1') ? '_1' : '_2';
        const sys = suffix === '_1' ? A5_STATE.sys1 : A5_STATE.sys2;
        if (!sys || sys === 'default') return baseName;
        return `${sys.charAt(0).toUpperCase()}_${baseName}`;
    }
    return baseName;
}

function showA5Toast(htmlContent) {
    const toast = document.getElementById('m-a5-toast');
    if (!toast) return;
    toast.innerHTML = `<div style="display: block; width: 100%; text-align: center; line-height: 1.5;">${htmlContent}</div>`;
    toast.classList.remove('m-toast-hidden');
    if (a5ToastTimer) clearTimeout(a5ToastTimer);
    a5ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 4000);
}

window.saveToGrimoire = async function() {
    if (A5_STATE.mode === 'intersectus' && !A5_STATE.isDataCalculated) {
        alert("System A and System B must be entered prior to Grimoire Save.");
        return false;
    }

    const h_sys = localStorage.getItem('tetramegistus_house') || 'P';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

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

    const targetName = (s1Name && s2Name) ? `${s1Name} & ${s2Name}` : "Unknown Coniunctio";

    let compilerId = '';
    if (A5_STATE.mode === 'unus') {
        compilerId = (A5_STATE.method === 'composite') ? 'a5_comp' : 'a5_unus';
    } else {
        compilerId = 'a5_intersectus';
    }

    function parseSys(val) {
        if (!val || val === 'default') return { sys: 'tropical', ayan: 'lahiri' };
        let ayan = 'lahiri';
        let sys = val;
        if (val.endsWith('_lahiri')) { sys = val.replace('_lahiri', ''); ayan = 'lahiri'; }
        else if (val.endsWith('_fagan')) { sys = val.replace('_fagan', ''); ayan = 'fagan_bradley'; }
        else if (val.endsWith('_raman')) { sys = val.replace('_raman', ''); ayan = 'raman'; }
        return { sys, ayan };
    }

    const p1 = parseSys(A5_STATE.sys1);
    const p2 = parseSys(A5_STATE.sys2);

    let metadata = {
        h_sys: h_sys,
        view_mode: 'zodiac',
        fixed_star_orb: 1.0
    };

    if (A5_STATE.mode === 'intersectus') {
        metadata.sys_a = p1.sys;
        metadata.ayan_a = p1.ayan;
        metadata.sys_b = p2.sys;
        metadata.ayan_b = p2.ayan;
    } else {
        metadata.sys_tab = p1.sys;
        metadata.ayanamsa = p1.ayan;
    }

    const payload = {
        seed_id: seedId,
        stage: 'Albedo', 
        target_name: targetName,
        language: lang,
        metadata: metadata
    };

    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) return true; 
        else throw new Error("Manifestation Failed");
    } catch (e) {
        throw e;
    }
};