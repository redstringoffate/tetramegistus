/* static/world/albedo/modules/a5.js — v19.5.4 URL Routing & Relations Sync (Grimoire Enabled) */

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

let STATE = {
    mode: 'unus',
    method: 'composite',
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

function updateA5Url() {
    const params = new URLSearchParams(window.location.search);
    params.set('module', 'a5');
    params.set('mode', STATE.mode);
    if (STATE.mode === 'unus') {
        params.set('method', STATE.method);
    } else {
        params.delete('method');
    }
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
}

function updateHermeticState() {
    const btn = document.querySelector('#aspect-category-tabs button[data-cat="hermetic"]');
    if (!btn) return;

    // 🚀 [로직 추가]: Unus의 Composite이거나, Intersectus의 System A가 Composite일 때
    const isCompositeMode = (STATE.mode === 'unus' && STATE.method === 'composite') || 
                            (STATE.mode === 'intersectus' && STATE.sys1 === 'composite');

    if (isCompositeMode) {
        btn.style.display = 'none';
        if (STATE.activeCategory === 'hermetic') {
            switchA5Category('planets');
        }
    } else {
        btn.style.display = 'inline-block'; 
    }
}

(async function initAspectusModule() {
    console.log("[ASPECTUS] A5 Module Initializing...");

    const tabContainer = document.getElementById('aspect-category-tabs');
    if (tabContainer) {
        const newContainer = tabContainer.cloneNode(true);
        tabContainer.parentNode.replaceChild(newContainer, tabContainer);
        
        newContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('.tab-btn');
            if (!btn) return;

            if (btn.classList.contains('locked')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.warn("🚫 [A5] Hermetic Tab Locked: Time Unknown.");
                return;
            }

            const cat = btn.dataset.cat;
            if (cat) switchA5Category(cat);

        }, true); 
    }

    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    const urlMethod = params.get('method');
    
    await ensureDataIntegrity();

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && STATE.mode === 'intersectus') {
            if (STATE.sys1 !== 'default' && STATE.sys2 !== 'default') fetchAspectusData();
        }
    });

    try {
        const defRes = await fetch('/api/astro/theory/patterns/definitions'); 
        if(defRes.ok) STATE.definitions = await defRes.json();
    } catch(e) { console.warn("Definitions missing", e); }

    if (urlMode === 'intersectus') STATE.mode = 'intersectus';
    else {
        STATE.mode = 'unus';
        STATE.method = urlMethod || 'composite';
    }

    await fetchAspectusData(); 
    document.addEventListener('mousemove', moveTooltip);
    syncAspectusUI();
})();

function syncAspectusUI() {
    const knob = document.getElementById('schema-mode-knob');
    const labelU = document.getElementById('label-unus');
    const labelI = document.getElementById('label-intersectus');
    const selectors = document.getElementById('system-selectors');
    const methodSwitch = document.getElementById('method-switch-container');

    if (STATE.mode === 'intersectus') {
        knob?.classList.add('right');
        labelU?.classList.remove('active');
        labelI?.classList.add('active');
        if (selectors) selectors.style.display = 'flex';
        if (methodSwitch) methodSwitch.style.display = 'none'; 
    } else {
        knob?.classList.remove('right');
        labelU?.classList.add('active');
        labelI?.classList.remove('active');
        if (selectors) selectors.style.display = 'none';
        if (methodSwitch) methodSwitch.style.display = 'flex';
        syncMethodUI();
    }
    updateHermeticState();
}

function syncMethodUI() {
    const mKnob = document.getElementById('method-knob');
    const labelC = document.getElementById('label-composite');
    const labelD = document.getElementById('label-davison');

    if (STATE.method === 'davison') {
        mKnob?.classList.add('right');
        labelC?.classList.remove('active');
        labelD?.classList.add('active');
    } else {
        mKnob?.classList.remove('right');
        labelC?.classList.add('active');
        labelD?.classList.remove('active');
    }
    updateHermeticState();
}

function renderPatterns() {
    const table = document.getElementById('patterns-table');
    const tbody = table.querySelector('tbody');
    if(!tbody || !STATE.data) return;
    tbody.innerHTML = '';

    table.style.tableLayout = "auto"; 

    const allPatterns = STATE.data.patterns || [];
    const uniqueShapes = [...new Set(allPatterns.map(p => p.shape))];
    
    if (!STATE.selectedPattern) {
        uniqueShapes.forEach(shape => {
            const tr = document.createElement('tr');
            
            const tdShape = document.createElement('td');
            tdShape.style.padding = "0"; 

            const btn = document.createElement('button');
            btn.className = 'shape-btn'; 
            btn.textContent = shape;
            
            btn.style.whiteSpace = "nowrap";
            
            btn.onmouseenter = () => showPatternTooltip(shape);
            btn.onmouseleave = () => hideTooltip();
            btn.onclick = () => { hideTooltip(); STATE.selectedPattern = shape; renderPatterns(); };

            tdShape.appendChild(btn);
            tr.appendChild(tdShape);
            
            for(let i=0; i<6; i++) {
                const td = document.createElement('td');
                td.textContent = '-';
                td.style.padding = "8px 10px"; 
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        });
        return;
    }

    const displayPatterns = allPatterns.filter(p => p.shape === STATE.selectedPattern);
    displayPatterns.forEach((p, idx) => {
        const tr = document.createElement('tr');
        
        const tdShape = document.createElement('td');
        tdShape.style.padding = "0";

        if (idx === 0) {
            const btn = document.createElement('button');
            btn.className = 'shape-btn active'; 
            btn.textContent = `BACK [${p.shape}]`;
            
            btn.style.whiteSpace = "nowrap"; 
            btn.style.padding = "8px 10px";
            btn.style.lineHeight = "1.0";
            
            btn.onmouseenter = () => showPatternTooltip(p.shape);
            btn.onmouseleave = () => hideTooltip();
            btn.onclick = () => { hideTooltip(); STATE.selectedPattern = null; renderPatterns(); };
            tdShape.appendChild(btn);
        }
        tr.appendChild(tdShape);

        for(let i=1; i<=6; i++) {
            const td = document.createElement('td');
            const pKey = p[`p${i}`] || '-';
            
            if (pKey !== '-') {
                const baseName = pKey.split('_')[0];
                let displayName = baseName;
                
                if (STATE.mode === 'intersectus') {
                    const suffix = pKey.includes('_1') ? '_1' : '_2';
                    const sys = (suffix === '_1') ? STATE.sys1 : STATE.sys2;
                    displayName = `${sys.charAt(0).toUpperCase()}_${baseName}`;
                }
                
                td.textContent = displayName;
                
                td.style.color = '#000000'; 
                td.style.fontWeight = 'normal';
                td.style.padding = "8px 10px"; 
                td.style.whiteSpace = "nowrap"; 
                td.style.lineHeight = "1.0"; 

                const lon = STATE.data.bodies[pKey] || 0.0;
                td.title = `${displayName} | ${formatFullDMS(lon)}`;
                td.style.cursor = 'help';
            } else { 
                td.textContent = '-';
                td.style.padding = "8px 10px";
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
}

function formatFullDMS(lon) {
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const s_idx = Math.floor(lon / 30) % 12;
    const deg = Math.floor(lon % 30);
    const m_total = (lon % 1) * 60;
    const min = Math.floor(m_total);
    const sec = Math.floor((m_total - min) * 60);
    return `${signs[s_idx]},${deg.toString().padStart(2, '0')}°${min.toString().padStart(2, '0')}'${sec.toString().padStart(2, '0')}''`;
}

window.toggleAspectusMode = function() {
    STATE.mode = (STATE.mode === 'unus') ? 'intersectus' : 'unus';
    STATE.isDataCalculated = false; 
    STATE.selectedPattern = null;
    STATE.data = null; 

    syncAspectusUI();
    updateA5Url();

    // 🚀 [강제 청소 로직]: 데이터가 없어서 렌더링 함수가 멈추더라도,
    // 화면에 남은 이전 모드의 찌꺼기(DOM)들을 물리적으로 완전히 날려버립니다.
    const tbody = document.querySelector('#patterns-table tbody');
    if (tbody) tbody.innerHTML = '';

    const listBodies = document.getElementById('list-bodies');
    if (listBodies) listBodies.innerHTML = '';

    const listAspects = document.getElementById('list-aspects');
    if (listAspects) listAspects.innerHTML = '';

    const listObjects = document.getElementById('list-objects');
    if (listObjects) listObjects.innerHTML = '<div class="placeholder-text">Select a body</div>';
    
    // 모드가 unus로 돌아왔을 때만 데이터를 다시 불러옵니다.
    if(STATE.mode === 'unus') {
        fetchAspectusData();
    }
};

window.toggleMethodMode = function() {
    if (STATE.mode === 'intersectus') return;
    
    STATE.method = (STATE.method === 'composite') ? 'davison' : 'composite';
    STATE.isDataCalculated = false; 
    
    syncMethodUI();
    updateA5Url();
    fetchAspectusData();
};

window.toggleAspectSystemFilter = function() {
    STATE.aspectFilter = (STATE.aspectFilter === 'sys1') ? 'sys2' : 'sys1';
    const knob = document.getElementById('aspect-filter-knob');
    const labelA = document.getElementById('label-filter-a');
    const labelB = document.getElementById('label-filter-b');
    if (STATE.aspectFilter === 'sys2') {
        knob?.classList.add('right'); labelA?.classList.remove('active'); labelB?.classList.add('active');
    } else {
        knob?.classList.remove('right'); labelA?.classList.add('active'); labelB?.classList.remove('active');
    }
    renderBodyList();
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
            console.log("[A5] Albedo Station Sync Completed.");
        } catch (e) { console.error("[A5] Sync Failed:", e); }
    }
}

async function fetchAspectusData() {
    await ensureDataIntegrity();
    const activeAlbedo = JSON.parse(localStorage.getItem('active_davison'));
    if (!activeAlbedo) {
        console.error("No Albedo data in LocalStorage.");
        return;
    }

    const mode_query = STATE.mode === 'unus' ? 'unus' : 'intersectus';
    const method_query = STATE.mode === 'unus' ? STATE.method : 'intersectus';
    let s1 = STATE.mode === 'unus' ? (STATE.method === 'composite' ? 'composite' : 'd_tropical') : STATE.sys1;
    let s2 = STATE.sys2;

    if (STATE.mode === 'intersectus' && (s1 === 'default' || s2 === 'default')) return;

    try {
        const url = `/api/astro/aspectus/reading?mode=${mode_query}&method=${method_query}&s1=${s1}&s2=${s2}`;
        const res = await fetch(url);
        if (!res.ok) return;
        
        STATE.data = await res.json();
        STATE.isDataCalculated = true; 
        
        const isUnknown = STATE.data.meta && STATE.data.meta.is_time_unknown === 1;
        const hermeticBtn = document.querySelector('#aspect-category-tabs button[data-cat="hermetic"]');
        
        // 🚀 [로직 추가]: 조건식 통합
        const isCompositeMode = (STATE.mode === 'unus' && STATE.method === 'composite') || 
                                (STATE.mode === 'intersectus' && STATE.sys1 === 'composite');
        
        if (hermeticBtn) {
            if (isCompositeMode) {
                updateHermeticState(); 
            } else if (isUnknown) {
                hermeticBtn.classList.add('locked');
                hermeticBtn.onmouseenter = function(e) {
                    const tooltip = document.getElementById('pattern-tooltip');
                    if(tooltip) {
                        tooltip.innerHTML = "<strong style='color:#ff6b6b'>! Time Unknown !</strong><br>Precision sensitive data is locked.";
                        tooltip.style.display = 'block';
                        tooltip.style.left = (e.pageX + 15) + 'px';
                        tooltip.style.top = (e.pageY + 15) + 'px';
                    }
                };
                hermeticBtn.onmouseleave = function() {
                    const tooltip = document.getElementById('pattern-tooltip');
                    if(tooltip) tooltip.style.display = 'none';
                };
                if (STATE.activeCategory === 'hermetic') switchA5Category('planets');
            } else {
                hermeticBtn.classList.remove('locked');
                hermeticBtn.style.opacity = '';
                hermeticBtn.style.pointerEvents = '';
                hermeticBtn.onmouseenter = null;
                hermeticBtn.onmouseleave = null;
            }
        }

        renderPatterns();
        renderAspectExplorer();
    } catch (e) { console.error("Fetch Failed", e); }
}

window.switchA5Category = function(cat) {
    const btn = document.querySelector(`#aspect-category-tabs button[data-cat="${cat}"]`);
    if (btn && btn.classList.contains('locked')) return;
    
    // 🚀 [로직 추가]: 카테고리 전환 시에도 탭 숨김 조건 2중 검사
    const isCompositeMode = (STATE.mode === 'unus' && STATE.method === 'composite') || 
                            (STATE.mode === 'intersectus' && STATE.sys1 === 'composite');
    if (isCompositeMode && cat === 'hermetic') return;

    STATE.activeCategory = cat;
    
    const allTabs = document.querySelectorAll('#aspect-category-tabs .tab-btn');
    allTabs.forEach(b => b.classList.remove('active'));
    
    if (btn) btn.classList.add('active');
    
    renderAspectExplorer();
};

function renderBodyList() {
    const container = document.getElementById('list-bodies');
    if (!container || !STATE.data) return;
    container.innerHTML = '';

    const allKeys = Object.keys(STATE.data.bodies || {});
    let suffix = '';
    let currentSys = STATE.sys1; // 기본값

    if (STATE.mode === 'intersectus') {
        suffix = (STATE.aspectFilter === 'sys1') ? '_1' : '_2';
        currentSys = (STATE.aspectFilter === 'sys1') ? STATE.sys1 : STATE.sys2;
    }

    // 🚀 [FIX]: A5는 'd_draconic', 'a_ketunic' 등 접두사가 붙으므로 includes로 넓게 포획
    const isNodeExempt = currentSys.includes('draconic') || currentSys.includes('ketunic');
    const excludedNodes = ['Rahu', 'Ketu', 'North Node', 'South Node'];

    (CATEGORIES[STATE.activeCategory] || []).forEach(base => {
        // 배제 대상 행성이면 렌더링 루프를 즉시 건너뜀
        if (isNodeExempt && excludedNodes.includes(base)) return;

        const key = base + suffix;
        if (allKeys.includes(key)) {
            const btn = document.createElement('button');
            btn.className = `explorer-btn ${STATE.selectedBody === key ? 'active' : ''}`;
            btn.textContent = base;
            btn.onclick = (e) => selectBody(key, e.currentTarget);
            
            const lon = STATE.data.bodies[key] || 0.0;
            btn.title = `${base} | ${formatFullDMS(lon)}`;
            btn.style.cursor = 'help';

            if (!STATE.data.aspects.some(a => a.p1 === key || a.p2 === key)) btn.classList.add('dimmed');
            container.appendChild(btn);
        }
    });
}

function selectBody(key, el) {
    STATE.selectedBody = key; STATE.selectedAspect = null;
    document.querySelectorAll('#list-bodies .explorer-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    renderAspectList();
    document.getElementById('list-objects').innerHTML = '<div class="placeholder-text">Select an aspect</div>';
}

function renderAspectList() {
    const container = document.getElementById('list-aspects');
    if (!container || !STATE.data) return;
    container.innerHTML = '';

    const bodyAspects = STATE.data.aspects.filter(a => a.p1 === STATE.selectedBody || a.p2 === STATE.selectedBody);
    
    const validAspects = bodyAspects.filter(a => {
        if (STATE.mode === 'intersectus') {
            const currentTabSuffix = STATE.aspectFilter === 'sys1' ? '_1' : '_2';
            const targetKey = (a.p1 === STATE.selectedBody) ? a.p2 : a.p1;
            const targetSuffix = targetKey.includes('_1') ? '_1' : '_2';
            return currentTabSuffix !== targetSuffix;
        }
        return true;
    });

    const foundNames = [...new Set(validAspects.map(a => a.aspect))];

    ["Major", "Minor"].forEach(group => {
        const list = ASPECT_GROUPS[group].filter(n => foundNames.includes(n));
        if (list.length > 0) {
            const h = document.createElement('div'); h.className = 'aspect-group-label'; h.textContent = group;
            container.appendChild(h);
            list.forEach(asp => {
                const count = validAspects.filter(a => a.aspect === asp).length;

                const btn = document.createElement('button');
                btn.className = `explorer-btn ${STATE.selectedAspect === asp ? 'active' : ''}`;
                
                btn.innerHTML = `<span>${asp}</span><span class="count-tag" style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:10px; font-size:0.7rem;">${count}</span>`;
                
                btn.onclick = (e) => selectAspect(asp, e.currentTarget);
                container.appendChild(btn);
            });
        }
    });
}

function selectAspect(asp, el) {
    STATE.selectedAspect = asp;
    document.querySelectorAll('#list-aspects .explorer-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    renderObjects();
}

function renderObjects() {
    const container = document.getElementById('list-objects');
    if (!container || !STATE.selectedBody) return;
    container.innerHTML = '';

    const aspects = STATE.data.aspects.filter(a => 
        (a.p1 === STATE.selectedBody && a.aspect === STATE.selectedAspect) || 
        (a.p2 === STATE.selectedBody && a.aspect === STATE.selectedAspect)
    );

    aspects.forEach(t => {
        const targetKey = (t.p1 === STATE.selectedBody) ? t.p2 : t.p1;
        
        if (STATE.mode === 'intersectus') {
            const currentTabSuffix = (STATE.aspectFilter === 'sys1') ? '_1' : '_2';
            const targetSuffix = targetKey.includes('_1') ? '_1' : '_2';
            if (currentTabSuffix === targetSuffix) return; 
        }

        const btn = document.createElement('button');
        btn.className = 'explorer-btn no-click';
        
        const base = targetKey.split('_')[0];
        let display = base;
        if (STATE.mode === 'intersectus') {
            const sys = targetKey.includes('_1') ? STATE.sys1 : STATE.sys2;
            display = `${sys.charAt(0).toUpperCase()}_${base}`;
        }
        
        btn.innerHTML = `<span>${display}</span><span class="orb-value">${t.orb.toFixed(2)}°</span>`;
        const lon = STATE.data.bodies[targetKey] || 0.0;
        btn.title = `${display} | ${formatFullDMS(lon)}`;
        btn.style.cursor = 'help';
        container.appendChild(btn);
    });
}

window.showPatternTooltip = function(shape) {
    const tooltip = document.getElementById('pattern-tooltip');
    if(!tooltip) return;
    const def = STATE.definitions[shape];
    if (def) {
        const lang = localStorage.getItem('tetramegistus_lang') || 'en';
        tooltip.innerHTML = `<strong>${shape}</strong><br>${def[lang] || def['en']}`;
        tooltip.style.display = 'block';
    }
};

window.hideTooltip = function() {
    const tooltip = document.getElementById('pattern-tooltip');
    if(tooltip) tooltip.style.display = 'none';
};

function moveTooltip(e) {
    const tooltip = document.getElementById('pattern-tooltip');
    if (tooltip && tooltip.style.display === 'block') {
        tooltip.style.left = (e.pageX + 15) + 'px';
        tooltip.style.top = (e.pageY + 15) + 'px';
    }
}

function renderAspectExplorer() {
    renderBodyList();
    const lA = document.getElementById('list-aspects'); if(lA) lA.innerHTML = '';
    const lO = document.getElementById('list-objects'); if(lO) lO.innerHTML = '<div class="placeholder-text">Select a body</div>';
}

window.handleSystemAChange = function(v) { 
    STATE.sys1 = v; 
    STATE.isDataCalculated = false; 
    updateHermeticState(); // 🚀 [로직 추가]: 드롭다운 옵션 변경 시 즉각적으로 탭 보임/숨김 업데이트
    
    const sel = document.getElementById('sys-b-select');
    if (v === 'default') { sel.innerHTML = '<option value="default">Waiting for System A...</option>'; return; }
    
    const systems = [
        'composite', 'd_tropical', 'd_sidereal', 'd_draconic', 'd_ketunic',
        'a_tropical', 'a_sidereal', 'a_draconic', 'a_ketunic',
        'b_tropical', 'b_sidereal', 'b_draconic', 'b_ketunic'
    ];
    let html = '<option value="default" selected>Select System B</option>';
    systems.filter(s => s !== v).forEach(s => {
        const label = s.replace('_', ' ').toUpperCase();
        html += `<option value="${s}">${label}</option>`;
    });
    sel.innerHTML = html;
};

window.handleSystemBChange = function(v) { 
    STATE.sys2 = v; 
    STATE.isDataCalculated = false; 
};

/* ─────────────────────────────────────────────────────────────
   4. GRIMOIRE MANIFESTATION (A5 -> Archive)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    if (STATE.mode === 'intersectus' && !STATE.isDataCalculated) {
        alert("System A and System B must be entered prior to Grimoire Save.");
        return false;
    }

    const params = new URLSearchParams(window.location.search);
    let h_sys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    
    const orbInput = document.getElementById('orb-input');
    const orbValue = orbInput ? orbInput.value : 1.0;

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
    if (STATE.mode === 'unus') {
        if (STATE.method === 'composite') {
            compilerId = 'a5_comp';
        } else { 
            compilerId = 'a5_unus';
        }
    } else if (STATE.mode === 'intersectus') {
        compilerId = 'a5_intersectus';
    }

    if (!compilerId) {
        console.error("[GRIMOIRE] Invalid A5 state for compilation.");
        alert("System State Error: Cannot determine compiler.");
        return false;
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

    const p1 = parseSys(STATE.sys1);
    const p2 = parseSys(STATE.sys2);

    let metadata = {
        h_sys: h_sys,
        view_mode: 'zodiac',
        fixed_star_orb: parseFloat(orbValue)
    };

    if (STATE.mode === 'intersectus') {
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
        console.log(`[GRIMOIRE] Manifesting A5 Archive using [ ${compilerId} ]...`, payload);
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
            alert(`Manifestation Failed: ${result.detail || result.error || 'Unknown Error'}`);
            throw new Error(result.detail || result.error);
        }
    } catch (e) {
        console.error("[GRIMOIRE] Manifestation Error:", e);
        alert("Network Error during Grimoire Save.");
        throw e;
    }
};