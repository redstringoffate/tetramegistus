/* static/mobile/world/albedo/modules/a10.js - Matrix Architecture */

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

const MobileA10 = {
    async init() {
        const isInternalNav = sessionStorage.getItem('a10_internal_nav') === 'true';
        sessionStorage.removeItem('a10_internal_nav'); 

        // 내부 전환(탭 클릭)이 아닐 때만 로딩(Hieros Gamos) 발동
        if (!isInternalNav) {
            this.showLoading();
            setTimeout(() => { this.hideLoading(); }, 3000);
        } else {
            this.hideLoading();
        }

        this.loadStateFromUrl();
        this.updateUISelection();
        this.bindEvents();
        
        await this.ensureDataIntegrity();
        
        try {
            const sRes = await fetch('/api/astro/theory/sabian/definitions');
            if (sRes.ok) A10_STATE.sabianDefs = await sRes.json();
        } catch (e) {}

        this.renderStructure();
        await this.fetchAndRenderData();
    },

    showLoading() { 
        const loader = document.getElementById('m-a10-loading');
        if (loader) {
            // 🚀 [스태킹 컨텍스트 탈옥]: 부모의 z-index 한계를 벗어나기 위해 Body 최상단으로 강제 이주!
            if (loader.parentNode !== document.body) {
                document.body.appendChild(loader);
            }
            loader.style.display = 'flex'; 
        }
    },
    hideLoading() { document.getElementById('m-a10-loading').style.display = 'none'; },

    loadStateFromUrl() {
        const params = new URLSearchParams(window.location.search);
        if (params.has('system')) A10_STATE.system = params.get('system');
        if (params.has('ayanamsa')) A10_STATE.ayanamsa = params.get('ayanamsa');
        if (params.has('mode')) A10_STATE.mode = params.get('mode');
        if (params.has('category')) A10_STATE.category = params.get('category');
    },

    updateUISelection() {
        const updateActive = (selector, val, dataAttr) => {
            document.querySelectorAll(selector).forEach(btn => {
                if (btn.dataset[dataAttr] === val) btn.classList.add('active');
                else btn.classList.remove('active');
            });
        };

        updateActive('#m-sys-tabs .m-tab', A10_STATE.system, 'sys');
        updateActive('#m-ayan-tabs .m-tab', A10_STATE.ayanamsa, 'ayan');
        updateActive('#m-cat-tabs .m-tab', A10_STATE.category, 'cat');

        const ayanBox = document.getElementById('m-ayan-tabs');
        if (A10_STATE.system === 'sidereal') ayanBox.classList.remove('m-hidden');
        else ayanBox.classList.add('m-hidden');

        const knob = document.getElementById('m-anti-knob');
        if (A10_STATE.mode === 'anti') {
            knob.style.left = '22px'; // 소형화된 스위치 너비에 맞춤
            document.getElementById('m-label-comp').classList.remove('active');
            document.getElementById('m-label-anti').classList.add('active');
        } else {
            knob.style.left = '2px';
            document.getElementById('m-label-comp').classList.add('active');
            document.getElementById('m-label-anti').classList.remove('active');
        }

        const hermeticBtn = document.getElementById('m-tab-hermetic');
        if (hermeticBtn) {
            if (A10_STATE.system !== 'tropical') {
                hermeticBtn.disabled = true; hermeticBtn.style.opacity = '0.3';
                if (A10_STATE.category === 'hermetic') this.switchCategory('planets');
            } else {
                hermeticBtn.disabled = false; hermeticBtn.style.opacity = '1';
            }
        }
    },

    switchMode() {
        const newMode = A10_STATE.mode === 'composite' ? 'anti' : 'composite';
        this.redirectWithParams({ mode: newMode });
    },

    switchSystem(sys) {
        let params = { system: sys };
        if (sys !== 'sidereal') params.ayanamsa = null; 
        if (A10_STATE.category === 'hermetic' && sys !== 'tropical') params.category = 'planets';
        this.redirectWithParams(params);
    },

    switchAyan(ayan) { this.redirectWithParams({ ayanamsa: ayan }); },

    switchCategory(cat) {
        const btn = document.querySelector(`.m-tab[data-cat="${cat}"]`);
        
        // 🚀 [수복]: 잠긴 탭(Time Unknown) 터치 시 시각적 피드백(토스트 알림) 제공
        if (btn && btn.classList.contains('locked')) {
            const toast = document.getElementById('m-a10-toast');
            if (toast) {
                // PC판과 동일한 붉은색 경고 디자인
                toast.innerHTML = "<strong style='color:#ff4b4b; font-size:1.1em; letter-spacing:1px;'>TIME UNKNOWN</strong><br><span style='color:#ccc;'>Calculation is locked.</span>";
                toast.classList.remove('m-toast-hidden');
                
                if (this.toastTimer) clearTimeout(this.toastTimer);
                this.toastTimer = setTimeout(() => {
                    toast.classList.add('m-toast-hidden');
                }, 3500); // 3.5초 후 자연스럽게 사라짐
            } else {
                // 토스트 UI가 없을 경우를 대비한 최후의 안전장치
                alert("TIME UNKNOWN\nCalculation is locked.");
            }
            return; // 탭 이동 로직 차단
        }
        
        this.redirectWithParams({ category: cat });
    },

    redirectWithParams(newParams) {
        const url = new URL(window.location.href);
        for (const [k, v] of Object.entries(newParams)) {
            if (v === null) url.searchParams.delete(k);
            else url.searchParams.set(k, v);
        }
        sessionStorage.setItem('a10_internal_nav', 'true');
        window.location.href = url.toString();
    },

    bindEvents() {
        // 본문 셀 클릭 시 토스트 정보창 표시
        document.addEventListener('click', (e) => {
            const cell = e.target.closest('.m-sabian-cell');
            if (cell && cell.dataset.info) {
                const toast = document.getElementById('m-a10-toast');
                toast.innerHTML = cell.dataset.info;
                toast.classList.remove('m-toast-hidden');
                
                if(this.toastTimer) clearTimeout(this.toastTimer);
                this.toastTimer = setTimeout(() => {
                    toast.classList.add('m-toast-hidden');
                }, 4000);
            }
        });

        // Toggle Label Touch Tooltip
        document.querySelectorAll('.m-dicho-label').forEach(lbl => {
            lbl.addEventListener('touchstart', (e) => {
                const tooltip = document.getElementById('m-toggle-tooltip');
                tooltip.textContent = lbl.dataset.full;
                tooltip.style.opacity = '1';
                tooltip.style.left = (e.touches[0].clientX) + 'px';
                tooltip.style.top = (e.touches[0].clientY - 10) + 'px';
            });
            lbl.addEventListener('touchend', () => {
                document.getElementById('m-toggle-tooltip').style.opacity = '0';
            });
        });
    },

    renderStructure() {
        const thead = document.getElementById('m-a10-thead');
        const tbody = document.getElementById('m-a10-tbody');
        const colgroup = document.getElementById('m-a10-colgroup');
        
        const isHermetic = (A10_STATE.category === 'hermetic');
        const isAngles = (A10_STATE.category === 'angles');

        let colHTML = `<col style="width: 140px;">`; 
        let col1Name = (isAngles || isHermetic) ? "ELEMENTS" : "CELESTIAL BODIES";
        let compName = (A10_STATE.mode === 'anti') ? "ANTI-COMPOSITE" : "COMPOSITE";

        let headerHTML = `<tr><th>${col1Name}</th>`;
        
        if (!isHermetic) {
            colHTML += `<col style="width: 180px;">`;
            headerHTML += `<th id="m-th-comp">${compName}</th>`;
        }
        
        colHTML += `
            <col style="width: 180px;">
            <col style="width: 180px;">
            <col style="width: 180px;">`;
            
        headerHTML += `<th id="m-th-davison">DAVISON</th><th id="m-th-a">A</th><th id="m-th-b">B</th></tr>`;
        
        colgroup.innerHTML = colHTML;
        thead.innerHTML = headerHTML;
        tbody.innerHTML = "";

        const items = getA10CurrentBodies();
        
        items.forEach(bodyName => {
            const tr = document.createElement('tr');
            if (isHermetic && bodyName === 'Vertex') tr.style.borderTop = "1px solid #333";

            let displayName = bodyName;
            
            // 🚀 플래닛 카테고리만 아이콘+흰색 조합, 나머지는 회색 처리하여 확실하게 구분
            if (A10_STATE.category === 'planets' && A10_PLANET_SYMBOLS[bodyName]) {
                displayName = `<span style="color:#7CFF9B; font-size:1.1em; margin-right:4px;">${A10_PLANET_SYMBOLS[bodyName]}</span> <span style="color:#fff">${bodyName}</span>`;
            } else {
                displayName = `<span style="color:#EBC2F5; font-weight:normal;">${bodyName}</span>`;
            }

            let rowHTML = `<td>${displayName}</td>`;
            const cols = isHermetic ? ['davison', 'a', 'b'] : ['comp', 'davison', 'a', 'b'];
            
            cols.forEach(col => {
                rowHTML += `<td class="m-sabian-cell" id="m-${bodyName.replace(/\s+/g, '')}-${col}">-</td>`;
            });
            
            tr.innerHTML = rowHTML;
            tbody.appendChild(tr);
        });
    },

    async ensureDataIntegrity() {
        let s1 = null, s2 = null;
        try { 
            const activeDavison = JSON.parse(localStorage.getItem('active_davison'));
            const activeComposite = JSON.parse(localStorage.getItem('active_composite'));
            const albedoStation = activeDavison || activeComposite || {};
            s1 = albedoStation.seed1; s2 = albedoStation.seed2;
        } catch (e) {}

        if (s1 && s2) {
            try {
                await fetch('/api/astro/coagulatio/sync-active', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ seed1: s1, seed2: s2 })
                });
            } catch (e) {}
        }
    },

    async fetchAndRenderData() {
        const lang = localStorage.getItem('tetramegistus_lang') || 'en';
        let hSys = localStorage.getItem('tetramegistus_house') || 'P';
        const houseMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
        hSys = houseMap[hSys] || hSys;
        
        try {
            const sys = A10_STATE.system;
            const ayan = A10_STATE.ayanamsa;
            const engineMode = (A10_STATE.mode === 'anti') ? 'anticomposite' : 'composite';
            const cat = A10_STATE.category;

            const res = await fetch(`/api/astro/resonantia/reading?system=${sys}&ayanamsa=${ayan}&mode=${engineMode}&category=${cat}&h_sys=${hSys}`);
            if (!res.ok) return;

            const resData = await res.json();
            if (resData.error) return;

            const dataMap = resData.data;
            const meta = resData.meta || {};

            // Time Unknown 락 처리
            const isUnknown = meta.is_time_unknown === 1;
            ['angles', 'hermetic'].forEach(targetCat => {
                const btn = document.querySelector(`.m-tab[data-cat="${targetCat}"]`);
                if (btn) {
                    if (isUnknown) {
                        btn.classList.add('locked');
                        if (A10_STATE.category === targetCat) this.switchCategory('planets');
                    } else {
                        btn.classList.remove('locked');
                    }
                }
            });

            let stationData = {};
            try { stationData = JSON.parse(localStorage.getItem('active_davison')) || JSON.parse(localStorage.getItem('active_composite')) || {}; } catch(e) {}

            function formatLocStr(data, isDavisonRoot = false) {
                if (!data) return `Unknown Location`;
                let latVal = NaN, lngVal = NaN, tzVal = NaN;
                let cityName = data.city || data.location || "";
                
                if (isDavisonRoot) {
                    latVal = data.lat !== undefined ? parseFloat(data.lat) : 37.56;
                    lngVal = data.lng !== undefined ? parseFloat(data.lng) : 126.97;
                    tzVal = parseFloat(data.timezone || 9.0);
                } else {
                    latVal = parseFloat(data.lat ?? data.latitude);
                    lngVal = parseFloat(data.lng ?? data.lon ?? data.longitude);
                    if (isNaN(latVal) && data.coordinates) latVal = parseFloat(data.coordinates.lat ?? data.coordinates.latitude);
                    if (isNaN(lngVal) && data.coordinates) lngVal = parseFloat(data.coordinates.lng ?? data.coordinates.lon ?? data.coordinates.longitude);
                    tzVal = parseFloat(data.timezone);
                }

                if (!isNaN(latVal) && !isNaN(lngVal)) {
                    const latDir = latVal >= 0 ? "N" : "S";
                    const lngDir = lngVal >= 0 ? "E" : "W";
                    const tzStr = !isNaN(tzVal) ? ` (UTC${tzVal >= 0 ? "+" : ""}${tzVal})` : "";
                    const coordStr = `${Math.abs(latVal).toFixed(2)} ${latDir}, ${Math.abs(lngVal).toFixed(2)} ${lngDir}`;
                    
                    if (isDavisonRoot) return `${coordStr}${tzStr}`;
                    if (cityName && cityName !== "Manual Entry") return cityName; // 도시 이름만 깔끔하게 출력
                    return coordStr; // Manual Entry이거나 도시 정보가 없을 때만 좌표 출력
                } else if (cityName) {
                    return cityName;
                }
                return `Unknown Location`;
            }

            // 🚀 헤더와 서브텍스트(날짜, 위치 등) 사이에 <br>을 삽입하여 줄바꿈 적용
            ['davison', 'a', 'b'].forEach(k => {
                const el = document.getElementById(`m-th-${k}`);
                if (el && meta[`info_${k}`]) {
                    let text = meta[`info_${k}`];
                    
                    if (k === 'davison') text += "<br>" + formatLocStr(stationData, true); 
                    else if (k === 'a') text += "<br>" + formatLocStr(stationData.seed1, false);
                    else if (k === 'b') text += "<br>" + formatLocStr(stationData.seed2, false);
                    
                    el.innerHTML = `${k.toUpperCase()}<br><span style="color:#ccc; font-size:0.8em; font-weight:normal; display:block; margin-top:5px; line-height:1.2;">${text}</span>`;
                }
            });

            const items = getA10CurrentBodies();
            const cols = (A10_STATE.category === 'hermetic') ? ['davison', 'a', 'b'] : ['comp', 'davison', 'a', 'b'];
            
            items.forEach(bodyName => {
                cols.forEach(col => {
                    const cell = document.getElementById(`m-${bodyName.replace(/\s+/g, '')}-${col}`);
                    if (!cell) return;

                    const info = dataMap[bodyName] ? dataMap[bodyName][col] : null;
                    if (!info) { cell.textContent = "-"; return; }

                    let sabianText = "-";
                    if (A10_STATE.sabianDefs && info.sabian_index !== undefined) {
                        const def = A10_STATE.sabianDefs[info.sabian_index];
                        if (def) sabianText = def[lang] || def['en'] || "-";
                    }
                    cell.textContent = sabianText;

                    let houseStr = info.house && info.house !== "-" ? ` | H${info.house}` : "";
                    let dignityStr = info.dignity && info.dignity !== "-" ? ` | ${info.dignity}` : "";
                    
                    cell.dataset.info = `<strong style="color:#49dce1">${bodyName} (${col.toUpperCase()})</strong><br><span style="color:#fff">${info.dms}</span>${houseStr}${dignityStr}`;
                });
            });

        } catch (error) { console.error(error); }
    }
};

document.addEventListener('DOMContentLoaded', () => MobileA10.init());

// =======================================================================
// 🚀 GRIMOIRE MANIFESTATION (A10 Resonantia - Mobile Protocol)
// =======================================================================
window.saveToGrimoire = async function() {
    console.log("[A10] Attempting Manifestation...");

    let albedoStation = {};
    try {
        const activeDavison = JSON.parse(localStorage.getItem('active_davison'));
        const activeComposite = JSON.parse(localStorage.getItem('active_composite'));
        albedoStation = activeDavison || activeComposite || {};
    } catch(e) {}

    const s1 = albedoStation.seed1;
    const s2 = albedoStation.seed2;
    let seedId = albedoStation.id;

    if (!seedId) {
        let id1 = s1?.idx || s1?.id || "unknown1";
        let id2 = s2?.idx || s2?.id || "unknown2";
        seedId = `${id1}_${id2}`;
    }

    if (!s1 || !s2) {
        alert("Manifestation Error: No active synastry data found. Please return to the main station.");
        throw new Error("Missing Seeds"); // 애니메이션 차단 결계
    }

    const targetName = `${s1.name} & ${s2.name}`;
    const currentLang = localStorage.getItem('tetramegistus_lang') || 'en';
    const compilerId = `a10`;

    const rawHouse = (localStorage.getItem('tetramegistus_house') || 'placidus').toLowerCase();
    const hSysMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
    const hSys = hSysMap[rawHouse] || 'P';

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

    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            console.log(`[A10] Successfully archived to: ${targetName}`);
            // 🚀 [수복]: 모바일 전역 애니메이션(world.js)이 UI 피드백을 통제하므로, 
            // 여기서 강제로 버튼 HTML(✔ Archived)을 조작해 SVG를 파괴하던 코드를 소거함.
            return true; 
        } else {
            const result = await res.json();
            alert(`Manifestation Failed (${res.status}): ${result.detail || result.error || 'Bad Request'}`);
            throw new Error("Manifestation Failed");
        }
    } catch (e) {
        console.error("[A10] Network Error:", e);
        // 에러를 world.js로 던져서 투명 애니메이션이 헛돌지 않게 방어
        throw e; 
    }
};