/* static/world/nigredo/modules/n5.js — v19.6.0 Hermetic Lock Final Sync (Grimoire Enabled) */

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
    sys1: 'default',
    sys2: 'default',
    activeCategory: 'planets',
    selectedBody: null,
    selectedAspect: null,
    selectedPattern: null,
    aspectFilter: 'sys1', 
    data: null, 
    definitions: {},
    isDataCalculated: false // 🚀 [추가됨]: Grimoire 세이브 방어용 상태값
};

function updateN5Url() {
    const params = new URLSearchParams(window.location.search);
    params.set('module', 'n5');
    params.set('mode', STATE.mode);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
}

window.switchN5Category = function(cat) {
    const btn = document.querySelector(`#n5-aspect-tabs button[data-cat="${cat}"]`);
    
    if (btn && btn.classList.contains('locked')) return;

    STATE.activeCategory = cat;
    STATE.selectedBody = null; 
    
    const allTabs = document.querySelectorAll('#n5-aspect-tabs .tab-btn');
    allTabs.forEach(b => b.classList.remove('active'));
    
    if(btn) btn.classList.add('active');
    
    renderAspectExplorer();
};

(async function initSchemaModule() {
    const tabContainer = document.getElementById('n5-aspect-tabs');
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
                console.warn("🚫 [N5] Locked Tab Access Denied: Time Unknown.");
                return;
            }

            const cat = btn.dataset.cat;
            if (cat) window.switchN5Category(cat);

        }, true); 
    }

    try {
        const defRes = await fetch('/api/astro/theory/patterns/definitions'); 
        if(defRes.ok) STATE.definitions = await defRes.json();
    } catch(e) { console.warn("Definitions load failed."); }

    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'intersectus') STATE.mode = 'intersectus';
    else { STATE.mode = 'unus'; STATE.sys1 = 'tropical'; }

    await fetchSchemaData(); 
    document.addEventListener('mousemove', moveTooltip);
    syncModeUI();
})();

function syncModeUI() {
    const knob = document.getElementById('schema-mode-knob');
    const labelU = document.getElementById('label-unus');
    const labelI = document.getElementById('label-intersectus');
    const selectors = document.getElementById('system-selectors');

    if (STATE.mode === 'intersectus') {
        knob?.classList.add('right');
        labelU?.classList.remove('active');
        labelI?.classList.add('active');
        if (selectors) selectors.style.display = 'flex';
    } else {
        knob?.classList.remove('right');
        labelU?.classList.add('active');
        labelI?.classList.remove('active');
        if (selectors) selectors.style.display = 'none';
    }
}

async function fetchSchemaData() {
    const activeSeed = JSON.parse(localStorage.getItem('active_seed'));
    if (activeSeed) await fetch('/api/astro/principia/sync-active', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(activeSeed)});
    
    const s1 = STATE.mode==='unus'?'tropical':STATE.sys1;
    const s2 = STATE.sys2;
    if(STATE.mode==='intersectus' && (s1==='default'||s2==='default')) return;

    try {
        const res = await fetch(`/api/astro/schema/reading?mode=${STATE.mode}&s1=${s1}&s2=${s2}`);
        STATE.data = await res.json();
        
        STATE.isDataCalculated = true; // 🚀 [추가됨]: 데이터 연산 성공 시 세이브 락 해제

        const isUnknown = STATE.data.meta && STATE.data.meta.is_time_unknown === 1;
        const hermeticBtn = document.querySelector('#n5-aspect-tabs button[data-cat="hermetic"]');
        
        if (hermeticBtn) {
            if (isUnknown) {
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

                if (STATE.activeCategory === 'hermetic') {
                    window.switchN5Category('planets');
                }
            } else {
                hermeticBtn.classList.remove('locked');
                hermeticBtn.onmouseenter = null;
                hermeticBtn.onmouseleave = null;
            }
        }

        renderPatterns();
        renderAspectExplorer();
    } catch (e) { console.error("N5 Fetch Failed", e); }
}

function renderPatterns() {
    const tbody = document.querySelector('#patterns-table tbody');
    if(!tbody || !STATE.data) return;
    tbody.innerHTML = '';

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
            btn.onmouseenter = () => showPatternTooltip(shape);
            btn.onmouseleave = () => hideTooltip();
            btn.onclick = () => { hideTooltip(); STATE.selectedPattern = shape; renderPatterns(); };
            tdShape.appendChild(btn);
            tr.appendChild(tdShape);
            for(let i=0; i<6; i++) tr.appendChild(document.createElement('td'));
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
                const lon = STATE.data.bodies[pKey] || 0.0;
                td.title = `${displayName} | ${formatFullDMS(lon)}`; 
                td.style.cursor = 'help';
            } else { td.textContent = '-'; }
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

window.toggleSchemaMode = function() {
    STATE.mode = (STATE.mode === 'unus') ? 'intersectus' : 'unus';
    STATE.isDataCalculated = false; // 🚀 [추가됨]: 모드 변경 시 세이브 락 초기화
    STATE.selectedPattern = null; 
    if (STATE.data) STATE.data.patterns = []; 
    
    syncModeUI();
    updateN5Url();
    renderPatterns(); 
    renderAspectExplorer();

    if(STATE.mode === 'unus') {
        STATE.sys1 = 'tropical';
        fetchSchemaData();
    }
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

    // 🚀 [추가된 로직]: 현재 탭의 시스템이 Draconic/Ketunic이면 노드 버튼 렌더링을 차단
    const isNodeExempt = currentSys.startsWith('draconic') || currentSys.startsWith('ketunic');
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

    const bodyAspects = STATE.data.aspects.filter(a => 
        a.p1 === STATE.selectedBody || a.p2 === STATE.selectedBody
    );

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
            const h = document.createElement('div'); 
            h.className = 'aspect-group-label'; 
            h.textContent = group;
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
    STATE.isDataCalculated = false; // 🚀 [추가됨]: 옵션 변경 시 세이브 락 발동
    handleSystemChangeUI(v, 'sys-b-select'); 
};

window.handleSystemBChange = function(v) { 
    STATE.sys2 = v; 
    STATE.isDataCalculated = false; // 🚀 [추가됨]: 옵션 변경 시 세이브 락 발동
};

function handleSystemChangeUI(val, targetId) {
    const sel = document.getElementById(targetId);
    if (val === 'default') { sel.innerHTML = '<option value="default">Waiting for System A...</option>'; return; }
    const systems = ['tropical', 'sidereal', 'draconic', 'ketunic'];
    let html = '<option value="default" selected>Select System B</option>';
    systems.filter(s => s !== val).forEach(s => html += `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`);
    sel.innerHTML = html;
}

/* ─────────────────────────────────────────────────────────────
   4. GRIMOIRE MANIFESTATION (N5 -> Archive) [추가됨]
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    // 🚀 [핵심 방어벽]: 연산(Enter)이 끝나지 않았으면 세이브 차단!
    if (STATE.mode === 'intersectus' && !STATE.isDataCalculated) {
        alert("System A and System B must be entered prior to Grimoire Save.");
        return false;
    }

    const params = new URLSearchParams(window.location.search);
    let h_sys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    
    const orbInput = document.getElementById('orb-input');
    const orbValue = orbInput ? orbInput.value : 1.0;

    const activeSeedRaw = localStorage.getItem('active_seed');
    const activeSeed = activeSeedRaw ? JSON.parse(activeSeedRaw) : {};
    const seedId = activeSeed.id || activeSeed.idx || "unknown";
    const targetName = activeSeed.name || "Unknown";

    let compilerId = STATE.mode === 'unus' ? 'n5_unus' : 'n5_intersectus';

    if (!compilerId) {
        console.error("[GRIMOIRE] Invalid N5 state for compilation.");
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
        stage: 'Nigredo',
        target_name: targetName,
        language: lang,
        metadata: metadata,
        seed: activeSeed 
    };

    try {
        console.log(`[GRIMOIRE] Manifesting N5 Archive using [ ${compilerId} ]...`, payload);
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();

        if (res.ok) {
            console.log(`[GRIMOIRE] Archive [${targetName}] Saved Successfully!`);
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
            alert(`Manifestation Failed: ${result.detail || result.error || 'Unknown Error'}`);
            throw new Error(result.detail || result.error);
        }
    } catch (e) {
        console.error("[GRIMOIRE] Manifestation Error:", e);
        alert("Network Error during Grimoire Save.");
        throw e;
    }
};