/* static/mobile/world/nigredo/modules/n5.js - Mobile SCHEMA (Fully Patched) */

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

let N5_STATE = {
    mode: 'unus', 
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

let n5ToastTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const defRes = await fetch('/api/astro/theory/patterns/definitions'); 
        if(defRes.ok) N5_STATE.definitions = await defRes.json();
    } catch(e) {}

    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'intersectus') {
        N5_STATE.mode = 'intersectus';
    } else {
        N5_STATE.mode = 'unus'; 
        N5_STATE.sys1 = 'tropical'; 
    }

    updateN5ModeUI();
    updateN5ViewUI();
    
    if(N5_STATE.mode === 'unus') {
        await fetchSchemaData(); 
    }

    // 🚀 [수복]: 드롭다운 리스트 내부 터치 시 창이 먼저 닫혀버리는 현상 완벽 차단
    document.addEventListener('touchstart', (e) => {
        const popover = document.getElementById('fs-popover');
        if (popover && popover.style.display === 'block') {
            if (!e.target.closest('.fs-popover-box') && !e.target.closest('.m-card-header')) {
                popover.style.display = 'none';
                popover.classList.remove('active');
            }
        }
        
        const ddList = document.getElementById('n5-dd-list');
        const ddSel = document.getElementById('n5-dd-selected');
        if (ddList && ddList.style.display === 'block') {
            if (e.target !== ddList && !ddList.contains(e.target) && e.target !== ddSel && !ddSel.contains(e.target)) {
                ddList.style.display = 'none';
            }
        }
    });

    initHermeticLock();
});

function updateN5Url() {
    const params = new URLSearchParams(window.location.search);
    params.set('module', 'n5');
    params.set('mode', N5_STATE.mode);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
}

function updateN5ModeUI() {
    const lblUnus = document.getElementById('n5-lbl-unus');
    const lblInter = document.getElementById('n5-lbl-intersectus');
    const knob = document.getElementById('n5-knob-mode');
    const selectors = document.getElementById('n5-system-selectors');
    const filterCon = document.getElementById('n5-aspect-filter-container');

    if (N5_STATE.mode === 'intersectus') {
        knob.classList.add('right');
        lblUnus.classList.remove('active');
        lblInter.classList.add('active');
        selectors.style.display = 'block';
        if (N5_STATE.view === 'aspects') filterCon.style.display = 'flex';
    } else {
        knob.classList.remove('right');
        lblUnus.classList.add('active');
        lblInter.classList.remove('active');
        selectors.style.display = 'none';
        filterCon.style.display = 'none';
    }
}

function updateN5ViewUI() {
    const tabPat = document.getElementById('n5-tab-patterns');
    const tabAsp = document.getElementById('n5-tab-aspects');
    const viewPat = document.getElementById('m-view-patterns');
    const viewAsp = document.getElementById('m-view-aspects');
    const filterCon = document.getElementById('n5-aspect-filter-container');

    if (N5_STATE.view === 'patterns') {
        tabPat.classList.add('active'); tabAsp.classList.remove('active');
        viewPat.style.display = 'block'; viewAsp.style.display = 'none';
        filterCon.style.display = 'none';
    } else {
        tabPat.classList.remove('active'); tabAsp.classList.add('active');
        viewPat.style.display = 'none'; viewAsp.style.display = 'block';
        if (N5_STATE.mode === 'intersectus') filterCon.style.display = 'flex';
    }
}

// 🚀 [수복]: 모드 전환 시 기존 데이터를 파괴하여 default의 잔재(D_Sun 등) 출력을 원천 차단
window.toggleN5Mode = function() {
    N5_STATE.mode = (N5_STATE.mode === 'unus') ? 'intersectus' : 'unus';
    N5_STATE.isDataCalculated = false; 
    N5_STATE.selectedPattern = null; 
    N5_STATE.data = null; 
    
    updateN5ModeUI();
    updateN5Url();
    renderShapesGrid(); 
    renderTransposedTable();
    renderAspectExplorer();

    if(N5_STATE.mode === 'unus') {
        N5_STATE.sys1 = 'tropical';
        fetchSchemaData();
    }
};

window.switchN5View = function(view) {
    N5_STATE.view = view;
    updateN5ViewUI();
};

window.handleSystemAChange = function(v) { 
    N5_STATE.sys1 = v; 
    N5_STATE.isDataCalculated = false; 
    const sel = document.getElementById('n5-sys-b-select');
    if (v === 'default') { sel.innerHTML = '<option value="default">Wait for Sys A...</option>'; return; }
    const systems = ['tropical', 'sidereal', 'draconic', 'ketunic'];
    let html = '<option value="default" selected>Select System B</option>';
    systems.filter(s => s !== v).forEach(s => html += `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`);
    sel.innerHTML = html;
};

window.handleSystemBChange = function(v) { 
    N5_STATE.sys2 = v; 
    N5_STATE.isDataCalculated = false; 
};

window.fetchSchemaData = async function() {
    const activeSeed = JSON.parse(localStorage.getItem('active_seed'));
    if (activeSeed) await fetch('/api/astro/principia/sync-active', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(activeSeed)});
    
    const s1 = N5_STATE.mode==='unus'?'tropical':N5_STATE.sys1;
    const s2 = N5_STATE.sys2;
    if(N5_STATE.mode==='intersectus' && (s1==='default'||s2==='default')) {
        showN5Toast("<strong style='color:#ff6b6b;'>ERROR</strong><br>Select both systems first.");
        return;
    }

    try {
        const res = await fetch(`/api/astro/schema/reading?mode=${N5_STATE.mode}&s1=${s1}&s2=${s2}`);
        N5_STATE.data = await res.json();
        N5_STATE.isDataCalculated = true; 

        initHermeticLock();

        renderShapesGrid();
        renderTransposedTable();
        renderAspectExplorer();
        
        showN5Toast("<strong>DATA SYNCED</strong><br>Schema loaded successfully.");
    } catch (e) { console.error("N5 Fetch Failed", e); }
};

function initHermeticLock() {
    if (!N5_STATE.data) return;
    const isUnknown = N5_STATE.data.meta && N5_STATE.data.meta.is_time_unknown === 1;
    const hermeticBtn = document.querySelector('.m-tab[data-cat="hermetic"]');
    
    if (hermeticBtn) {
        if (isUnknown) {
            hermeticBtn.classList.add('locked');
            hermeticBtn.onclick = (e) => {
                e.stopPropagation();
                showN5Toast("<strong style='color:#ff6b6b;'>TIME UNKNOWN</strong><br><span style='color:#ccc;'>Hermetic calculation locked.</span>");
            };
            if (N5_STATE.activeCategory === 'hermetic') window.switchN5Category('planets');
        } else {
            hermeticBtn.classList.remove('locked');
            hermeticBtn.onclick = () => window.switchN5Category('hermetic');
        }
    }
}

// ============================================
// PATTERNS VIEW RENDER (N5)
// ============================================

function renderShapesGrid() {
    const grid = document.getElementById('n5-shapes-grid');
    if(!grid || !N5_STATE.data) return;
    grid.innerHTML = '';

    const allPatterns = N5_STATE.data.patterns || [];
    const uniqueShapes = [...new Set(allPatterns.map(p => p.shape))];

    // 🚀 [수복 1]: 패턴 데이터가 도착하면 첫 번째 도형을 강제로 자동 선택시킵니다.
    if (!N5_STATE.selectedPattern && uniqueShapes.length > 0) {
        N5_STATE.selectedPattern = uniqueShapes[0];
    }

    uniqueShapes.forEach(shape => {
        const btn = document.createElement('button');
        btn.className = `m-tab ${N5_STATE.selectedPattern === shape ? 'active' : ''}`;
        btn.textContent = shape;
        btn.onclick = () => {
            N5_STATE.selectedPattern = shape;
            renderShapesGrid();
            renderTransposedTable();
        };
        grid.appendChild(btn);
    });
}

function renderTransposedTable() {
    const detailArea = document.getElementById('n5-pattern-detail-area');
    const emptyArea = document.getElementById('n5-pattern-empty');
    const thead = document.getElementById('m-n5-thead-patterns');
    const tbody = document.getElementById('m-n5-tbody-patterns');

    if (!N5_STATE.selectedPattern || !N5_STATE.data) {
        if (detailArea) detailArea.style.display = 'none';
        if (emptyArea) {
            emptyArea.style.display = 'block';
            // 🚀 [수복 2]: 연산이 끝났는데 패턴이 0개인 경우 무한 로딩 착시를 파괴하고 텍스트 렌더링
            if (!N5_STATE.data) {
                emptyArea.innerHTML = '<div style="padding:40px 0; text-align:center; color:#49dce1;">LOADING PATTERNS...</div>';
            } else if (!N5_STATE.data.patterns || N5_STATE.data.patterns.length === 0) {
                emptyArea.innerHTML = '<div style="padding:40px 0; text-align:center; color:#aaa; font-size:0.85rem; letter-spacing:1px;">NO GEOMETRIC PATTERNS FORMED</div>';
            }
        }
        return;
    }

    if (detailArea) detailArea.style.display = 'block';
    if (emptyArea) emptyArea.style.display = 'none';
    document.getElementById('n5-shape-name').textContent = N5_STATE.selectedPattern;

    const displayPatterns = N5_STATE.data.patterns.filter(p => p.shape === N5_STATE.selectedPattern);
    
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
                td.className = 'm-n5-clickable-td';
                
                const lon = N5_STATE.data.bodies[pKey] || 0.0;
                td.onclick = () => {
                    showN5Toast(`<strong style="color:${categoryColor};">${display}</strong><br>${formatElementDMS(lon)}`);
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
    if(!popover || !N5_STATE.selectedPattern) return;
    
    const shape = N5_STATE.selectedPattern;
    const def = N5_STATE.definitions[shape];
    if (!def) return;

    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    const desc = def[lang] || def['en'] || "No description available.";

    popover.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: 900; border-bottom: 1px solid #7CFF9B; padding-bottom: 8px; margin-bottom: 12px; color: #7CFF9B; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
            ${shape}
        </div>
        <div style="font-size: 0.85rem; line-height: 1.6; color: #ddd; text-align: left;">
            ${desc}
        </div>
        <div style="margin-top: 15px; font-size: 0.7rem; color: #555; text-align: center; border-top: 1px dashed rgba(124, 255, 155, 0.2); padding-top: 10px;">TAP TO CLOSE</div>
    `;
    popover.onclick = function(e) { e.stopPropagation(); this.style.display='none'; this.classList.remove('active'); };
    popover.style.display = 'block';
    popover.classList.add('active');
};

// ============================================
// ASPECTS VIEW RENDER
// ============================================

window.toggleAspectSystemFilter = function() {
    N5_STATE.aspectFilter = (N5_STATE.aspectFilter === 'sys1') ? 'sys2' : 'sys1';
    const knob = document.getElementById('n5-knob-filter');
    const labelA = document.getElementById('n5-lbl-filter-a');
    const labelB = document.getElementById('n5-lbl-filter-b');
    
    if (N5_STATE.aspectFilter === 'sys2') {
        knob.classList.add('right'); labelA.classList.remove('active'); labelB.classList.add('active');
    } else {
        knob.classList.remove('right'); labelA.classList.add('active'); labelB.classList.remove('active');
    }
    renderBodiesDropdown();
};

window.switchN5Category = function(cat) {
    N5_STATE.activeCategory = cat;
    N5_STATE.selectedBody = null; 
    
    document.querySelectorAll('#n5-aspect-tabs .m-tab:not(.locked)').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`#n5-aspect-tabs .m-tab[data-cat="${cat}"]`);
    if(btn) btn.classList.add('active');
    
    renderAspectExplorer();
};

window.toggleN5Dropdown = function(e) {
    if(e) e.stopPropagation();
    const list = document.getElementById('n5-dd-list');
    if(list) {
        list.style.display = (list.style.display === 'none' || list.style.display === '') ? 'block' : 'none';
    }
};

function renderAspectExplorer() {
    renderBodiesDropdown();
    document.getElementById('m-n5-list-aspects').innerHTML = '<div class="m-placeholder" style="margin-top:20px;">Select Body</div>';
    document.getElementById('m-n5-list-objects').innerHTML = '<div class="m-placeholder" style="margin-top:20px;">-</div>';
}

// 🚀 [수복 2]: 드롭다운 첫 항목 강제 선택 해제 및 "SELECT BODY" 디폴트화
function renderBodiesDropdown() {
    const list = document.getElementById('n5-dd-list');
    const selectedDiv = document.getElementById('n5-dd-selected');
    if (!list || !selectedDiv || !N5_STATE.data) return;
    
    list.innerHTML = ''; 
    const allKeys = Object.keys(N5_STATE.data.bodies || {});
    let suffix = '';
    let currentSys = N5_STATE.sys1; 

    if (N5_STATE.mode === 'intersectus') {
        suffix = (N5_STATE.aspectFilter === 'sys1') ? '_1' : '_2';
        currentSys = (N5_STATE.aspectFilter === 'sys1') ? N5_STATE.sys1 : N5_STATE.sys2;
    }

    const isNodeExempt = currentSys.startsWith('draconic') || currentSys.startsWith('ketunic');
    const excludedNodes = ['Rahu', 'Ketu', 'North Node', 'South Node'];

    (CATEGORIES[N5_STATE.activeCategory] || []).forEach(base => {
        if (isNodeExempt && excludedNodes.includes(base)) return;

        const matchedKey = allKeys.find(k => {
            let kBase = k.replace(/_[12]$/, '');
            if (/^[TDSK]_/.test(kBase)) kBase = kBase.substring(2);
            
            if (N5_STATE.mode === 'intersectus') {
                return kBase === base && k.endsWith(suffix);
            } else {
                return kBase === base;
            }
        });

        if (matchedKey) {
            const lon = N5_STATE.data.bodies[matchedKey] || 0.0;
            const displayTxt = formatDisplayName(matchedKey);
            const categoryColor = getCategoryColor(matchedKey);
            
            const item = document.createElement('div');
            item.className = `m-dropdown-item`; 
            
            item.innerHTML = `
                <span style="color:${categoryColor}; font-weight:bold;">${displayTxt}</span> 
                <span style="color:#aaa; font-size:0.75rem;">[${formatElementDMS(lon)}]</span>
            `;
            
            item.onclick = (e) => {
                e.stopPropagation();
                N5_STATE.selectedBody = matchedKey;
                N5_STATE.selectedAspect = null;
                selectedDiv.innerHTML = item.innerHTML; 
                list.style.display = 'none';
                document.getElementById('m-n5-list-objects').innerHTML = '';
                renderAspectList();
            };
            list.appendChild(item);
        }
    });

    // 강제 자동 선택 로직 삭제됨 (직접 클릭하기 전까진 무조건 아래 else 블록 실행)
    if (N5_STATE.selectedBody) {
        const lonInfo = N5_STATE.data.bodies[N5_STATE.selectedBody] || 0.0;
        const displayTxt = formatDisplayName(N5_STATE.selectedBody);
        const categoryColor = getCategoryColor(N5_STATE.selectedBody);
        
        selectedDiv.innerHTML = `<span style="color:${categoryColor}; font-weight:bold;">${displayTxt}</span> <span style="color:#aaa; font-size:0.75rem;">[${formatElementDMS(lonInfo)}]</span>`;
        renderAspectList();
    } else {
        selectedDiv.innerHTML = "SELECT BODY";
        document.getElementById('m-n5-list-aspects').innerHTML = `<div class="m-asp-item m-asp-item-center" style="border:none;">Select Body</div>`;
        document.getElementById('m-n5-list-objects').innerHTML = '';
    }
}

function renderAspectList() {
    const container = document.getElementById('m-n5-list-aspects');
    if (!container || !N5_STATE.data || !N5_STATE.selectedBody) return;
    container.innerHTML = '';

    const bodyAspects = N5_STATE.data.aspects.filter(a => 
        a.p1 === N5_STATE.selectedBody || a.p2 === N5_STATE.selectedBody
    );

    const validAspects = bodyAspects.filter(a => {
        if (N5_STATE.mode === 'intersectus') {
            const currentTabSuffix = N5_STATE.aspectFilter === 'sys1' ? '_1' : '_2';
            const targetKey = (a.p1 === N5_STATE.selectedBody) ? a.p2 : a.p1;
            const targetSuffix = targetKey.includes('_1') ? '_1' : '_2';
            return currentTabSuffix !== targetSuffix;
        }
        return true;
    });

    if (validAspects.length === 0) {
        container.innerHTML = `<div class="m-asp-item m-asp-item-center" style="border:none;">No Aspects</div>`;
        document.getElementById('m-n5-list-objects').innerHTML = '';
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
                btn.className = `m-asp-item ${N5_STATE.selectedAspect === asp ? 'active' : ''}`;
                btn.style.flexDirection = 'row';
                btn.style.justifyContent = 'space-between';
                btn.style.alignItems = 'center';
                
                btn.innerHTML = `<span style="font-size:0.75rem; color:#ccc;">${asp}</span> <span style="background:rgba(255,255,255,0.1); padding:2px 5px; border-radius:4px; font-size:0.6rem; color:#7CFF9B;">${count}</span>`;
                
                btn.onclick = () => {
                    N5_STATE.selectedAspect = asp;
                    renderAspectList(); 
                    renderObjects(); 
                };
                container.appendChild(btn);
            });
        }
    });
}

function renderObjects() {
    const container = document.getElementById('m-n5-list-objects');
    if (!container || !N5_STATE.selectedBody) return;
    container.innerHTML = '';

    const aspects = N5_STATE.data.aspects.filter(a => 
        (a.p1 === N5_STATE.selectedBody && a.aspect === N5_STATE.selectedAspect) || 
        (a.p2 === N5_STATE.selectedBody && a.aspect === N5_STATE.selectedAspect)
    );

    aspects.forEach(t => {
        const targetKey = (t.p1 === N5_STATE.selectedBody) ? t.p2 : t.p1;
        
        if (N5_STATE.mode === 'intersectus') {
            const currentTabSuffix = (N5_STATE.aspectFilter === 'sys1') ? '_1' : '_2';
            const targetSuffix = targetKey.includes('_1') ? '_1' : '_2';
            if (currentTabSuffix === targetSuffix) return; 
        }

        const div = document.createElement('div');
        div.className = 'm-asp-item'; 
        
        const display = formatDisplayName(targetKey);
        const categoryColor = getCategoryColor(targetKey);
        const lon = N5_STATE.data.bodies[targetKey] || 0.0;
        const orbText = `${t.orb.toFixed(2)}°`;
        
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:normal; color:#ccc;">
                <span style="font-size:0.75rem; color:${categoryColor}; font-weight:bold;">${display}</span>
                <span style="color:#7CFF9B; font-size:0.75rem;">${orbText}</span>
            </div>
        `;
        
        const formatString = formatElementDMS(lon);
        const toastStr = encodeURIComponent(`
            <strong style="color:${categoryColor}; font-size:1.1em;">${display}</strong><br>
            <span style="display:inline-block; margin-top:4px;">${formatString}</span>
        `).replace(/'/g, "%27");
        
        div.onclick = () => showN5Toast(decodeURIComponent(toastStr));
        container.appendChild(div);
    });
}

/* ─────────────────────────────────────────────────────────────
   HELPERS & COLOR LOGICS (FIXED)
   ───────────────────────────────────────────────────────────── */

// 🚀 [수복]: T_, D_, _1 등의 접두/접미사를 정규식으로 완벽히 발라내어 분류용으로만 쓰고 오리지널 색상을 입힘
function getCategoryColor(bodyName) {
    let baseName = bodyName.replace(/_[12]$/, '');
    
    if (/^[TDSK]_/.test(baseName)) {
        baseName = baseName.substring(2);
    }
    
    if (CATEGORIES.planets.includes(baseName)) return '#06F8FF';
    if (CATEGORIES.asteroids.includes(baseName)) return '#54FF5F';
    if (CATEGORIES.lilith.includes(baseName)) return '#C164FF';
    if (CATEGORIES.fates.includes(baseName)) return '#ce93d8';
    if (CATEGORIES.hermetic.includes(baseName)) return '#FC09CA';
    
    return '#AAAAAA'; 
}

// 🚀 [수복 1]: 별자리 이름부터 도/분/초 끝까지 4원소 컬러 전체 랩핑
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
    
    // </span> 위치를 맨 끝으로 이동
    return `<span style="color:${color} !important; font-weight:bold;">${signName},${deg.toString().padStart(2, '0')}°${min.toString().padStart(2, '0')}'${sec.toString().padStart(2, '0')}''</span>`;
}

// 🚀 [수복]: default 상태일 때 기괴하게 D_Sun이 뜨는 현상 방어
function formatDisplayName(pKey) {
    const baseName = pKey.split('_')[0];
    if (N5_STATE.mode === 'intersectus') {
        const sys = pKey.includes('_1') ? N5_STATE.sys1 : N5_STATE.sys2;
        if (!sys || sys === 'default') return baseName;
        return `${sys.charAt(0).toUpperCase()}_${baseName}`;
    }
    return baseName;
}

function showN5Toast(htmlContent) {
    const toast = document.getElementById('m-n5-toast');
    if (!toast) return;
    toast.innerHTML = `<div style="display: block; width: 100%; text-align: center; line-height: 1.5;">${htmlContent}</div>`;
    toast.classList.remove('m-toast-hidden');
    if (n5ToastTimer) clearTimeout(n5ToastTimer);
    n5ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 4000);
}

window.saveToGrimoire = async function() {
    if (N5_STATE.mode === 'intersectus' && !N5_STATE.isDataCalculated) {
        alert("System A and System B must be entered prior to Grimoire Save.");
        return false;
    }

    let hSys = localStorage.getItem('tetramegistus_house') || 'P';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    
    const activeSeedRaw = localStorage.getItem('active_seed');
    const activeSeed = activeSeedRaw ? JSON.parse(activeSeedRaw) : {};
    const seedId = activeSeed.id || activeSeed.idx || "unknown";
    const targetName = activeSeed.name || "Unknown";

    let compilerId = N5_STATE.mode === 'unus' ? 'n5_unus' : 'n5_intersectus';

    function parseSys(val) {
        if (!val || val === 'default') return { sys: 'tropical', ayan: 'lahiri' };
        return { sys: val, ayan: 'lahiri' }; 
    }

    const p1 = parseSys(N5_STATE.sys1);
    const p2 = parseSys(N5_STATE.sys2);

    let metadata = {
        h_sys: hSys,
        view_mode: 'zodiac',
        fixed_star_orb: 1.0 
    };

    if (N5_STATE.mode === 'intersectus') {
        metadata.sys_a = p1.sys; metadata.ayan_a = p1.ayan;
        metadata.sys_b = p2.sys; metadata.ayan_b = p2.ayan;
    } else {
        metadata.sys_tab = p1.sys; metadata.ayanamsa = p1.ayan;
    }

    const payload = {
        seed_id: seedId,
        stage: 'Nigredo',
        target_name: targetName,
        language: lang,
        metadata: metadata,
        seed: activeSeed 
    };

    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) return true; 
        else throw new Error("Manifestation Failed");
    } catch (e) {
        throw e;
    }
};