/* static/world/albedo/modules/a10.js */

const A10_STATE = {
    system: 'tropical',
    ayanamsa: 'lahiri',
    mode: 'composite', 
    category: 'planets',
    data: {},
    sabianDefs: null 
};

const A10_BODIES = {
    planets: ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"],
    asteroids: ["Chiron", "Ceres", "Juno", "Pallas", "Vesta", "Asteroid Eros", "Psyche"],
    lilith: ["Mean Lilith", "True Lilith", "Asteroid Lilith", "North Node (m)", "North Node (t)", "South Node (m)", "South Node (t)"],
    fates: ["Moira", "Klotho", "Lachesis", "Atropos"],
    angles: ["Ascendant", "Immum Coeli", "Descendant", "Midheaven"],
    hermetic: ["Fortune", "Spirit", "Necessity", "Necessity (v)", "Eros", "Eros (v)", "Courage", "Victory", "Nemesis", "Vertex", "Anti-Vertex", "Syzygy"]
};

// Planets 기호 맵핑
const A10_PLANET_SYMBOLS = {
    "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂",
    "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇"
};

function getA10CurrentBodies() {
    let items = A10_BODIES[A10_STATE.category] || [];
    if (A10_STATE.category === 'lilith' && (A10_STATE.system === 'draconic' || A10_STATE.system === 'ketunic')) {
        items = items.filter(name => !name.includes('Node'));
    }
    return items;
}

function loadA10StateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('system')) A10_STATE.system = params.get('system');
    if (params.has('ayanamsa')) A10_STATE.ayanamsa = params.get('ayanamsa');
    if (params.has('mode')) A10_STATE.mode = params.get('mode');
    if (params.has('category')) A10_STATE.category = params.get('category');
}

function updateA10UIState() {
    document.querySelectorAll('#a10-system-tabs .sys-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.sys === A10_STATE.system));
    
    const sPanel = document.getElementById('sidereal-controls-panel-a10');
    if (A10_STATE.system === 'sidereal') {
        sPanel.style.display = 'inline-flex';
        document.querySelectorAll('#sidereal-controls-panel-a10 .n9-aya-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.ayan === A10_STATE.ayanamsa));
    } else {
        sPanel.style.display = 'none';
    }

    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.cat === A10_STATE.category));

    const knob = document.getElementById('anti-knob');
    if (A10_STATE.mode === 'anti') {
        knob.style.left = '20px';
        document.getElementById('label-mode-comp').classList.remove('active');
        document.getElementById('label-mode-anti').classList.add('active');
    } else {
        knob.style.left = '2px';
        document.getElementById('label-mode-comp').classList.add('active');
        document.getElementById('label-mode-anti').classList.remove('active');
    }

    const hermeticBtn = document.querySelector('.cat-btn[data-cat="hermetic"]');
    if (hermeticBtn) {
        hermeticBtn.style.display = (A10_STATE.system === 'tropical') ? 'inline-block' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const isInternalNav = sessionStorage.getItem('a10_internal_nav') === 'true';
    sessionStorage.removeItem('a10_internal_nav'); 

    if (!isInternalNav) {
        showA10Loading();
        setTimeout(() => {
            hideA10Loading();
        }, 3000);
    } else {
        hideA10Loading();
    }

    loadA10StateFromUrl();
    updateA10UIState();
    bindA10Tooltips();
    renderA10Structure();
    
    try {
        const sRes = await fetch('/api/astro/theory/sabian/definitions');
        if (sRes.ok) A10_STATE.sabianDefs = await sRes.json();
    } catch (e) { console.error("Sabian Dict Load Error", e); }

    fetchAndRenderA10();
});

/* --- UI Controls --- */
window.switchA10System = function(sys) {
    const url = new URL(window.location.href);
    url.searchParams.set('system', sys);
    if (sys !== 'sidereal') url.searchParams.delete('ayanamsa');
    
    let currentCat = url.searchParams.get('category') || A10_STATE.category;
    if (currentCat === 'hermetic' && sys !== 'tropical') {
        url.searchParams.set('category', 'planets');
    }

    sessionStorage.setItem('a10_internal_nav', 'true'); 
    window.location.href = url.toString();
};

window.switchA10Mode = function() {
    const url = new URL(window.location.href);
    const current = url.searchParams.get('mode') || 'composite';
    url.searchParams.set('mode', current === 'composite' ? 'anti' : 'composite');
    
    sessionStorage.setItem('a10_internal_nav', 'true'); 
    window.location.href = url.toString();
};

window.switchA10Ayanamsa = function(ayan) {
    const url = new URL(window.location.href);
    url.searchParams.set('ayanamsa', ayan);
    
    sessionStorage.setItem('a10_internal_nav', 'true'); 
    window.location.href = url.toString();
};

window.switchA10Category = function(cat) {
    const btn = document.querySelector(`.cat-btn[data-cat="${cat}"]`);
    // 🚀 [추가]: 락이 걸린 탭은 클릭 무시
    if (btn && btn.classList.contains('locked')) {
        console.warn("🚫 [A10] Tab Locked: Time Unknown.");
        return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('category', cat);
    
    sessionStorage.setItem('a10_internal_nav', 'true'); 
    window.location.href = url.toString();
};

/* --- Table Rendering Engine --- */
function renderA10Structure() {
    const thead = document.getElementById('a10-thead');
    const tbody = document.getElementById('a10-tbody');
    const colgroup = document.getElementById('a10-colgroup');
    
    const isHermetic = (A10_STATE.category === 'hermetic');
    const isAngles = (A10_STATE.category === 'angles');

    let colHTML = `<col style="width: 180px;">`; 
    let col1Name = (isAngles || isHermetic) ? "ELEMENTS" : "CELESTIAL BODIES";
    let compName = (A10_STATE.mode === 'anti') ? "ANTI-COMPOSITE" : "COMPOSITE";

    let headerHTML = `<tr><th>${col1Name}</th>`;
    
    if (!isHermetic) {
        colHTML += `<col style="min-width: 150px;">`;
        headerHTML += `<th>${compName}</th>`;
    }
    
    colHTML += `
        <col style="min-width: 150px;">
        <col style="min-width: 150px;">
        <col style="min-width: 150px;">`;
        
    headerHTML += `<th id="a10-th-davison" class="a10-tooltip-target" style="cursor: help;">DAVISON</th><th id="a10-th-a" class="a10-tooltip-target" style="cursor: help;">A</th><th id="a10-th-b" class="a10-tooltip-target" style="cursor: help;">B</th></tr>`;
    
    colgroup.innerHTML = colHTML;
    thead.innerHTML = headerHTML;

    tbody.innerHTML = "";
    const items = getA10CurrentBodies();
    
    items.forEach(bodyName => {
        const tr = document.createElement('tr');
        if (isHermetic && bodyName === 'Vertex') tr.classList.add('row-divider-hermetic');

        let displayName = bodyName;
        if (A10_STATE.category === 'planets' && A10_PLANET_SYMBOLS[bodyName]) {
            displayName = `${A10_PLANET_SYMBOLS[bodyName]} ${bodyName}`;
        }

        let rowHTML = `<td><strong class="cell-body">${displayName}</strong></td>`;
        
        const cols = isHermetic ? ['davison', 'a', 'b'] : ['comp', 'davison', 'a', 'b'];
        cols.forEach(col => {
            rowHTML += `<td class="a10-sabian-cell" id="a10-${bodyName.replace(/\s+/g, '')}-${col}">-</td>`;
        });
        
        tr.innerHTML = rowHTML;
        tbody.appendChild(tr);
    });
}

async function ensureDataIntegrity() {
    let s1 = null, s2 = null;
    try { 
        // a8.js의 albedoStation 로직 적용
        const activeDavison = JSON.parse(localStorage.getItem('active_davison'));
        const activeComposite = JSON.parse(localStorage.getItem('active_composite'));
        const albedoStation = activeDavison || activeComposite || {};
        
        s1 = albedoStation.seed1;
        s2 = albedoStation.seed2;
    } catch (e) {}

    if (s1 && s2) {
        try {
            await fetch('/api/astro/coagulatio/sync-active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seed1: s1, seed2: s2 })
            });
        } catch (e) { console.error("[A10] Sync Failed:", e); }
    }
}

/* --- API & Info Rendering --- */
async function fetchAndRenderA10() {
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    
    let hSys = 'P';
    if (window.WorldSettings && window.WorldSettings.getHouseCode) {
        hSys = window.WorldSettings.getHouseCode();
    } else {
        const savedHouse = localStorage.getItem('tetramegistus_house');
        const houseMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
        hSys = houseMap[savedHouse] || 'P';
    }
    
    try {
        await ensureDataIntegrity(); 

        const sys = A10_STATE.system;
        const ayan = A10_STATE.ayanamsa;
        const mode = A10_STATE.mode;
        const cat = A10_STATE.category;

        // 🔥 [수복]: 프론트의 'anti' 상태를 백엔드 엔진 규격인 'anticomposite'로 치환!
        const engineMode = (mode === 'anti') ? 'anticomposite' : 'composite';

        const url = `/api/astro/resonantia/reading?system=${sys}&ayanamsa=${ayan}&mode=${engineMode}&category=${cat}&h_sys=${hSys}`;
        const res = await fetch(url);
        
        if (!res.ok) {
            console.error("[A10 Fetch Error]:", res.statusText);
            return;
        }

        const resData = await res.json();

        if (resData.error) {
            console.error("[A10 Engine Error]:", resData.error);
            return;
        }

        const dataMap = resData.data;
        const meta = resData.meta || {};

        // 🚀 [추가]: Time Unknown 상태를 감지하여 Angles & Hermetic 탭 락(Lock)
        const isUnknown = meta.is_time_unknown === 1;
        const lockTargets = ['angles', 'hermetic'];

        lockTargets.forEach(targetCat => {
            const btn = document.querySelector(`.cat-btn[data-cat="${targetCat}"]`);
            if (btn) {
                if (isUnknown) {
                    btn.classList.add('locked');
                    btn.classList.add('a10-tooltip-target');
                    btn.dataset.tooltip = "<strong style='color:#ff6b6b'>! Time Unknown !</strong><br>Precision sensitive data is locked.";
                    btn.style.opacity = '0.3';
                    btn.style.cursor = 'not-allowed';
                } else {
                    btn.classList.remove('locked');
                    btn.classList.remove('a10-tooltip-target');
                    btn.removeAttribute('data-tooltip');
                    btn.style.opacity = '';
                    btn.style.cursor = 'pointer';
                }
            }
        });

        // 🚀 [추가]: 이미 잠긴 탭에 들어와 있다면 강제로 기본 탭(Planets)으로 튕겨냄
        if (isUnknown && lockTargets.includes(A10_STATE.category)) {
            console.warn("🚫 [A10] Forced redirect to planets due to Time Unknown.");
            window.switchA10Category('planets');
            return; 
        }

        // 🚀 [수정]: 로컬 스토리지에서 시드 정보를 가져옴 (A/B 좌표 폴백 완벽 복구)
        let stationData = {};
        try {
            stationData = JSON.parse(localStorage.getItem('active_davison')) || JSON.parse(localStorage.getItem('active_composite')) || {};
        } catch(e) {}

        const locS1 = stationData.seed1;
        const locS2 = stationData.seed2;

        function formatA1Location(data, isDavisonRoot = false) {
            if (!data) return `<br><span style="color:#bbbbbb; font-size:0.9em;">Unknown Location</span>`;
            
            let latVal = NaN, lngVal = NaN, tzVal = NaN;
            let cityName = data.city || data.location || "";
            
            if (isDavisonRoot) {
                // Davison 본체: 객체 최상단의 lat, lng 사용
                latVal = data.lat !== undefined ? parseFloat(data.lat) : 37.56;
                lngVal = data.lng !== undefined ? parseFloat(data.lng) : 126.97;
                tzVal = parseFloat(data.timezone || 9.0);
            } else {
                // A, B 개별 시드: 빈 문자열("") 파싱 시 NaN이 되는 문제 방어
                latVal = parseFloat(data.lat ?? data.latitude);
                lngVal = parseFloat(data.lng ?? data.lon ?? data.longitude);
                
                if (isNaN(latVal) && data.coordinates) {
                    latVal = parseFloat(data.coordinates.lat ?? data.coordinates.latitude);
                }
                if (isNaN(lngVal) && data.coordinates) {
                    lngVal = parseFloat(data.coordinates.lng ?? data.coordinates.lon ?? data.coordinates.longitude);
                }
                tzVal = parseFloat(data.timezone);
            }

            // 1. 위경도 좌표가 모두 정상인 경우
            if (!isNaN(latVal) && !isNaN(lngVal)) {
                const latDir = latVal >= 0 ? "N" : "S";
                const lngDir = lngVal >= 0 ? "E" : "W";
                const tzStr = !isNaN(tzVal) ? ` (UTC${tzVal >= 0 ? "+" : ""}${tzVal})` : "";
                
                const coordStr = `${Math.abs(latVal).toFixed(2)} ${latDir}, ${Math.abs(lngVal).toFixed(2)} ${lngDir}`;
                let finalStr = isDavisonRoot ? `${coordStr}${tzStr}` : (cityName ? `${cityName} (${coordStr})` : coordStr);

                return `<br><span style="color:#bbbbbb; font-size:0.9em;">${finalStr}</span>`;
            } 
            // 2. 좌표는 망가졌지만 도시 이름(텍스트)은 살아있는 경우
            else if (cityName) {
                return `<br><span style="color:#bbbbbb; font-size:0.9em;">${cityName}</span>`;
            } 
            // 3. 둘 다 없는 경우
            else {
                return `<br><span style="color:#bbbbbb; font-size:0.9em;">Unknown Location</span>`;
            }
        }

        // 헤더 툴팁 적용 (기존 날짜/시간 밑에 Location 병합)
        ['davison', 'a', 'b'].forEach(k => {
            const el = document.getElementById(`a10-th-${k}`);
            if (el && meta[`info_${k}`]) {
                let text = meta[`info_${k}`];
                
                if (k === 'davison') {
                    text += formatA1Location(stationData, true); 
                } else if (k === 'a') {
                    text += formatA1Location(locS1, false);
                } else if (k === 'b') {
                    text += formatA1Location(locS2, false);
                }
                
                el.dataset.tooltip = text;
            }
        });

        const items = getA10CurrentBodies();
        const cols = (A10_STATE.category === 'hermetic') ? ['davison', 'a', 'b'] : ['comp', 'davison', 'a', 'b'];
        
        items.forEach(bodyName => {
            cols.forEach(col => {
                const cell = document.getElementById(`a10-${bodyName.replace(/\s+/g, '')}-${col}`);
                if (!cell) return;

                const info = dataMap[bodyName] ? dataMap[bodyName][col] : null;

                if (!info) {
                    cell.textContent = "-";
                    return;
                }

                let sabianText = "-";
                if (A10_STATE.sabianDefs && info.sabian_index !== undefined) {
                    const def = A10_STATE.sabianDefs[info.sabian_index];
                    if (def) sabianText = def[lang] || def['en'] || "-";
                }
                cell.textContent = sabianText;

                let tooltip = info.dms;
                let houseStr = info.house && info.house !== "-" ? ` | H${info.house}` : "";
                let dignityStr = info.dignity && info.dignity !== "-" ? ` | ${info.dignity}` : "";
                
                cell.dataset.tooltip = `${info.dms}${houseStr}${dignityStr}`;
            });
        });

    } catch (error) {
        console.error("[A10 Communication Error]:", error);
    }
}

/* --- Tooltip Hover --- */
function bindA10Tooltips() {
    const tooltip = document.getElementById('a10-info-tooltip');
    if (!tooltip) return;

    document.addEventListener('mouseover', function(e) {
        const target = e.target.closest('.a10-sabian-cell, .a10-tooltip-target');
        if (target && target.dataset.tooltip) {
            // 🚀 [수정]: 텍스트 속성 대신 HTML 렌더링 속성(innerHTML)을 사용하여 빨간색 경고창 지원
            tooltip.innerHTML = target.dataset.tooltip;
            tooltip.style.display = 'block';
        }
    });

    document.addEventListener('mousemove', function(e) {
        if (tooltip.style.display === 'block') {
            let x = e.pageX + 15;
            let y = e.pageY + 15;
            if (x + 250 > window.innerWidth) x = e.pageX - 260; 
            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
        }
    });

    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.a10-sabian-cell, .a10-tooltip-target')) tooltip.style.display = 'none';
    });
}

function showA10Loading() { document.getElementById('a10-loading').style.display = 'flex'; }
function hideA10Loading() { document.getElementById('a10-loading').style.display = 'none'; }

// =======================================================================
// 🚀 GRIMOIRE MANIFESTATION (A10 Resonantia - AlbedoStation Protocol)
// =======================================================================
window.saveToGrimoire = async function() {
    console.log("[A10] Attempting Manifestation...");

    // 1. 데이터 소스 확보 (a8.js 벤치마킹: albedoStation 패턴 적용)
    let albedoStation = {};
    try {
        const activeDavison = JSON.parse(localStorage.getItem('active_davison'));
        const activeComposite = JSON.parse(localStorage.getItem('active_composite'));
        albedoStation = activeDavison || activeComposite || {};
    } catch(e) {}

    const s1 = albedoStation.seed1;
    const s2 = albedoStation.seed2;
    let seedId = albedoStation.id;

    // Fallback ID 생성 (A8 방어 로직 동일 적용)
    if (!seedId) {
        let id1 = s1?.idx || s1?.id || "unknown1";
        let id2 = s2?.idx || s2?.id || "unknown2";
        seedId = `${id1}_${id2}`;
    }

    if (!s1 || !s2) {
        alert("Manifestation Error: No active synastry data found. Please return to the main station.");
        return false;
    }

    // 2. 환경 설정
    const targetName = `${s1.name} & ${s2.name}`;
    const currentLang = localStorage.getItem('tetramegistus_lang') || 'en';
    const compilerId = `a10`;

    // 하우스 시스템 변환
    const rawHouse = (localStorage.getItem('tetramegistus_house') || 'placidus').toLowerCase();
    const hSysMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
    const hSys = hSysMap[rawHouse] || 'P';

    // 3. 백엔드가 요구하는 '정확한' 페이로드 구조
    const payload = {
        seed_id: seedId,         
        stage: 'albedo',        
        target_name: targetName, 
        language: currentLang,
        metadata: {
            system: A10_STATE.system,
            ayanamsa: A10_STATE.ayanamsa,
            h_sys: hSys
        },
        seed: { seed1: s1, seed2: s2 } 
    };

    // 4. 백엔드 전송
    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            console.log(`[A10] Successfully archived to: ${targetName}`);
            
            // 성공 피드백 (A8 스타일)
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
            const result = await res.json();
            alert(`Manifestation Failed (${res.status}): ${result.detail || result.error || 'Bad Request'}`);
        }
    } catch (e) {
        console.error("[A10] Network Error:", e);
        alert("Network Error: Connection refused.");
    }
};