/* static/world/albedo/modules/a2.js — v31.0 CSS Segregation & House Expansion */

const PLANET_GLOW_MAP = {
    "♄": "glow-saturn", "♃": "glow-jupiter", "♂": "glow-mars",
    "☉": "glow-sun", "♀": "glow-venus", "☿": "glow-mercury", "☽": "glow-moon", "☋": "glow-ketu", "☊": "glow-rahu"
};

const ELEMENT_MAP = {
    "♈︎": "glow-fire", "♌︎": "glow-fire", "♐︎": "glow-fire",
    "♉︎": "glow-earth", "♍︎": "glow-earth", "♑︎": "glow-earth",
    "♊︎": "glow-air", "♎︎": "glow-air", "♒︎": "glow-air",
    "♋︎": "glow-water", "♏︎": "glow-water", "♓︎": "glow-water"
};

let FS_MEANINGS = {}; 
let KARAKA_DEFS = {}; // 🚀 [NEW]
let isAnamnesisMode = false;
let isCharaKarakaMode = false; // 🚀 [NEW]
let currentAnaMode = 'N';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("[COAGULATIO] Initializing A2 Module...");

    await ensureDataIntegrity();
    await loadFixedStarMeanings();
    await loadKarakaMeanings(); // 🚀 [NEW] JSON 로드

    initializeCoagulatioUI();
    await fetchAndRenderCoagulatio();

    // 🚀 [NEW] 관문 라우팅으로 교체
    const titleEl = document.getElementById('coagulatio-title');
    if (titleEl) {
        titleEl.addEventListener('click', handleTitleRitual);
    }
    
    document.querySelectorAll('.ana-quadrant').forEach(quad => {
        quad.addEventListener('click', (e) => {
            if (!isAnamnesisMode) return;
            currentAnaMode = e.target.dataset.mode;
            document.querySelectorAll('.ana-quadrant').forEach(q => q.classList.remove('active'));
            e.target.classList.add('active');
            fetchAndRenderCoagulatio();
        });
    });

    document.addEventListener('click', (e) => {
        const popover = document.getElementById('fs-popover');
        if (popover && popover.classList.contains('active')) {
            if (!e.target.closest('.fs-icon') && !e.target.closest('.fs-popover-box')) {
                popover.classList.remove('active');
                popover.style.display = ''; 
            }
        }
        
        // 🚀 [NEW] Karaka 팝업 닫기
        const ckPopover = document.getElementById('ck-popover');
        if (ckPopover && ckPopover.style.display === 'block') {
            if (!e.target.closest('.ck-label') && !e.target.closest('.ck-popover-box')) {
                ckPopover.style.display = 'none';
            }
        }
    });
}); // <-- DOMContentLoaded 끝

// 🚀 [NEW] 카라카 설명 JSON 패치
async function loadKarakaMeanings() {
    try { 
        const res = await fetch('/api/astro/theory/karaka/definitions'); 
        if(res.ok) KARAKA_DEFS = await res.json(); 
    } catch(e) {}
}

// 🚀 [NEW] 현재 모드 및 뷰에 따른 관문
async function handleTitleRitual() {
    const params = new URLSearchParams(window.location.search);
    const method = params.get('method') || 'composite';
    const view = params.get('view') || 'zodiac';
    
    // A2: Davison 차트이면서 Nakshatra 뷰일 때만 Chara Karaka 활성화
    if (method === 'davison' && view === 'nakshatra') {
        await handleCharaKarakaRitual();
    } else {
        await handleAnamnesisRitual();
    }
}

// 🚀 [NEW] N2와 동일한 타이밍 시퀀스의 암전 로직 (A2 Davison 조건 추가)
async function handleAnamnesisRitual() {
    const params = new URLSearchParams(window.location.search);
    const method = params.get('method') || 'composite';
    
    if (method !== 'davison') {
        alert("Anamnesis is only available in Davison mode.");
        return;
    }

    const titleEl = document.getElementById('coagulatio-title');
    if (titleEl.classList.contains('time-unknown-locked')) {
        alert("Time Unknown. Anamnesis Ritual is locked.");
        return;
    }

    const overlay = document.getElementById('ana-overlay');
    const overlayText = document.getElementById('ana-overlay-text');
    const wheelContainer = document.getElementById('ana-wheel-container');
    const systemNav = document.getElementById('main-system-nav');
    const subOptions = document.querySelector('.sub-options-vault');

    let flashEl = document.getElementById('ana-static-flash');
    if (!flashEl) {
        flashEl = document.createElement('div');
        flashEl.id = 'ana-static-flash';
        flashEl.className = 'ana-static-flash';
        overlay.appendChild(flashEl);
    }

    overlay.classList.add('active');

    setTimeout(() => {
        flashEl.classList.add('trigger');
        
        setTimeout(() => {
            flashEl.classList.remove('trigger');
            overlayText.textContent = isAnamnesisMode ? "As above, so below." : "Once again, you recur.";
            overlayText.classList.add('show');
            
            setTimeout(() => {
                isAnamnesisMode = !isAnamnesisMode;
                
                if (isAnamnesisMode) {
                    currentAnaMode = 'N';
                    document.querySelectorAll('.ana-quadrant').forEach(q => q.classList.remove('active'));
                    document.querySelector('.ana-quadrant[data-mode="N"]').classList.add('active');
                    
                    titleEl.textContent = "ANAMNESIS";
                    if (wheelContainer) wheelContainer.classList.remove('hidden');
                    if (systemNav) systemNav.style.display = 'none';
                    if (subOptions) subOptions.style.display = 'none';
                } else {
                    titleEl.textContent = "COAGULATIO";
                    if (wheelContainer) wheelContainer.classList.add('hidden');
                    if (systemNav) systemNav.style.display = '';
                    if (subOptions) subOptions.style.display = '';
                }
                
                overlay.classList.remove('active');
                overlayText.classList.remove('show');
                
                fetchAndRenderCoagulatio();
            }, 1500); 
        }, 250); 
    }, 2000); 
}

// 🚀 [NEW] Chara Karaka 암전 시퀀스 (Albedo PC 전용)
async function handleCharaKarakaRitual() {
    const overlay = document.getElementById('ana-overlay');
    const overlayText = document.getElementById('ana-overlay-text');
    const titleEl = document.getElementById('coagulatio-title');
    const containerEl = document.querySelector('.a2-coagulatio'); 
    
    const methodToggle = document.querySelector('.main-toggle-row'); 
    const systemNav = document.getElementById('main-system-nav');
    const dichoToggle = document.getElementById('sidereal-view-toggle'); 
    
    let flashEl = document.getElementById('ana-static-flash');
    if (!flashEl) {
        flashEl = document.createElement('div');
        flashEl.id = 'ana-static-flash';
        flashEl.className = 'ana-static-flash';
        overlay.appendChild(flashEl);
    }

    overlay.classList.add('active');

    setTimeout(() => {
        flashEl.classList.add('trigger');
        
        setTimeout(() => {
            flashEl.classList.remove('trigger');
            overlayText.textContent = isCharaKarakaMode ? "Nothing escapes the law." : "Everything flows, out and in.";
            overlayText.style.fontFamily = isCharaKarakaMode ? "" : '"Lucida Sans", "Lucida Sans Regular", "Lucida Grande", "Lucida Sans Unicode", Geneva, Verdana, sans-serif';
            overlayText.classList.add('show');
            
            setTimeout(() => {
                isCharaKarakaMode = !isCharaKarakaMode;
                
                const nakContainer = document.getElementById('nakshatra-view-container');
                const ckContainer = document.getElementById('chara-karaka-container');
                
                if (isCharaKarakaMode) {
                    titleEl.textContent = "Chara Karaka";
                    containerEl.classList.add('ck-mode-active'); 
                    
                    if (methodToggle) methodToggle.style.display = 'none';
                    if (systemNav) systemNav.style.display = 'none';
                    if (dichoToggle) dichoToggle.style.visibility = 'hidden'; // Ayanamsa 탭은 살리고 토글만 가림
                    
                    if (nakContainer) nakContainer.style.display = 'none';
                    if (ckContainer) ckContainer.classList.remove('hidden');
                } else {
                    titleEl.textContent = "COAGULATIO";
                    containerEl.classList.remove('ck-mode-active'); 
                    
                    if (methodToggle) methodToggle.style.display = 'flex';
                    if (systemNav) systemNav.style.display = '';
                    if (dichoToggle) dichoToggle.style.visibility = 'visible';
                    
                    if (nakContainer) nakContainer.style.display = 'block';
                    if (ckContainer) ckContainer.classList.add('hidden');
                }
                
                overlay.classList.remove('active');
                overlayText.classList.remove('show');
                
                fetchAndRenderCoagulatio();
            }, 1500); 
        }, 250); 
    }, 2000); 
}

async function fetchAndRenderCoagulatio() {
    const params = new URLSearchParams(window.location.search);
    const method = params.get('method') || 'composite';
    const mode = params.get('mode') || 'normal';
    const sys = params.get('system') || 'tropical';
    const ayan = params.get('ayanamsa') || 'lahiri';
    const view = params.get('view') || 'zodiac';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    let h_sys = params.get('h_sys');
    if (!h_sys) {
        if (window.WorldSettings && window.WorldSettings.getHouseCode) h_sys = window.WorldSettings.getHouseCode();
        else h_sys = localStorage.getItem('tetramegistus_house') || 'P';
    }

    let orbValue = 1.5;
    const savedOrb = localStorage.getItem('tetramegistus_orb');
    if (savedOrb) {
        const parsed = parseFloat(savedOrb);
        if (!isNaN(parsed)) orbValue = parsed;
    }

    // 🚀 [NEW] URL에 anamnesis 파라미터 추가
    const anaParam = isAnamnesisMode ? currentAnaMode : 'off';
    const url = `/api/astro/coagulatio/reading?method=${method}&mode=${mode}&system=${sys}&ayanamsa=${ayan}&view=${view}&h_sys=${h_sys}&fixed_star_orb=${orbValue}&anamnesis=${anaParam}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Response Not OK");
        const data = await response.json();
        if (!data || data.error) return;

        // 🚀 [NEW] A2 생시 락 동적 제어 (N2와 동일)
        const isTimeUnknown = data.meta && (data.meta.is_time_unknown === 1);

        // 🚀 [수정]: 생시 미상이어도 Nakshatra 뷰일 때는 의식(Chara Karaka) 진입 허용
        const titleEl = document.getElementById('coagulatio-title');
        if (titleEl) {
            if (isTimeUnknown && view !== 'nakshatra') {
                titleEl.classList.add('time-unknown-locked');
                titleEl.classList.remove('ritual-ready');
            } else {
                titleEl.classList.add('ritual-ready');
                titleEl.classList.remove('time-unknown-locked');
            }
        }

        // 1. [Lockdown Logic]: Angles Veil for Time Unknown
        const anglesSection = document.getElementById('angles-section-a2');
        if (anglesSection) {
            anglesSection.classList.remove('section-time-locked');
            const existingLock = anglesSection.querySelector('.lock-blackout');
            if (existingLock) existingLock.remove();

            if (isTimeUnknown) {
                anglesSection.classList.add('section-time-locked');
                const lockDiv = document.createElement('div');
                lockDiv.className = 'lock-blackout';
                lockDiv.innerHTML = '<span class="lock-label">TIME UNKNOWN - LOCKED</span>';
                anglesSection.appendChild(lockDiv);
            }
        }

        // 2. KP 시스템 헤더 처리
        const padaHeader = document.getElementById('pada-header-label');
        if (padaHeader) padaHeader.textContent = (ayan === 'kp') ? 'Sub-Lord' : 'Pada';

        // 3. [Lords Bar] 렌더링
        let dayLords = [];
        let hourLord = null;
        const lordBar = document.getElementById('davison-lords');
        if (lordBar) {
            if (method === 'davison' && data.lords) {
                lordBar.style.display = 'flex';
                const rawDay = data.lords.day || "-";
                dayLords = rawDay.split('|').map(s => s.trim());
                hourLord = data.lords.hour || "-";
                document.getElementById('day-lord').textContent = rawDay;
                document.getElementById('hour-lord').textContent = hourLord;
            } else { lordBar.style.display = 'none'; }
        }

        // 🚀 [NEW] 모드 분기 렌더링
        if (isCharaKarakaMode) {
            renderCharaKarakaTable(data, dayLords, hourLord);
        } else if (data.planets) {
            const rows = document.querySelectorAll('.a2-chart-table tbody tr');

            rows.forEach(row => {
                const bodyCell = row.cells[0];
                if (!bodyCell) return;

                const fullText = bodyCell.textContent.trim();
                const pureName = fullText.replace(/^[^\w]+/, '').trim(); 
                
                // 🔽🔽🔽 Draconic/Ketunic 시스템 Node 하이딩 로직 🔽🔽🔽
                if ((sys === 'draconic' || sys === 'ketunic') && pureName.includes('Node')) {
                    row.style.display = 'none';
                    row.classList.add('excluded-node'); 
                    return; 
                } else {
                    row.style.display = ''; 
                    row.classList.remove('excluded-node');
                }

                const planetKey = Object.keys(data.planets).find(k => fullText.includes(k));

                if (planetKey) {
                    const info = data.planets[planetKey];

                    if (method === 'davison' && dayLords.includes(pureName)) {
                        bodyCell.classList.add('lord-active-body');
                        bodyCell.title = "[Day Lord]"; 
                    } else {
                        bodyCell.classList.remove('lord-active-body');
                        bodyCell.removeAttribute('title');
                    }

                    const existingFs = bodyCell.querySelector('.fs-container');
                    if (existingFs) existingFs.remove();

                    // 🚀 [NEW] Anamnesis 모드일 땐 항성 차단
                    if (method === 'davison' && info.fixed_stars?.length > 0 && !isAnamnesisMode) {
                        const fsContainer = document.createElement('span');
                        fsContainer.className = 'fs-container';
                        info.fixed_stars.forEach(star => {
                            const icon = document.createElement('span');
                            icon.className = `fs-icon fs-${star.tier.toLowerCase()}`;
                            icon.title = `${star.name} | ${star.position} | orb ${star.orb}°`;
                            
                            icon.onclick = (e) => { 
                                e.stopPropagation(); 
                                showFixedStarMeaning(star.name, e); 
                            };
                            fsContainer.appendChild(icon);
                        });
                        bodyCell.appendChild(fsContainer);
                    }

                    const infoCell = row.querySelector('[data-field="info"]') || row.cells[1];
                    if (infoCell) {
                        infoCell.textContent = info.dms || "-";
                        infoCell.className = 'cell-info'; 
                        infoCell.style.color = ""; 

                        let tooltipText = "";
                        const angles = ["Ascendant", "Midheaven", "Descendant", "Immum Coeli"];

                        if (angles.includes(pureName)) {
                            const rulerName = info.ruler; 
                            const rulerData = data.planets[rulerName]; 
                            let dignityStr = (rulerData && rulerData.dignity) ? ` | ${rulerData.dignity}` : "";
                            tooltipText = rulerData ? `${rulerName}: ${rulerData.dms}${dignityStr}` : `Ruler: ${rulerName}`;
                        } else {
                            tooltipText = `Ruler: ${info.ruler}`;
                            if (info.dignity) tooltipText += ` | Dignity: ${info.dignity}`;
                            
                            if (method === 'davison') {
                                if (pureName === hourLord) tooltipText = `[Hour Lord] ` + tooltipText;
                            }
                        }

                        if (info.is_anaretic) {
                            infoCell.classList.add('text-anaretic');
                            tooltipText = `! ANARETIC ! \n${tooltipText}`;
                        } else {
                            infoCell.classList.remove('text-anaretic');
                            infoCell.style.color = info.is_retrograde ? "#ff4d4d" : "#49dce1";
                        }

                        if (info.solar_phase) {
                            const phaseMap = { 'cazimi': 'Cazimi', 'combust': 'Combustion', 'under_beams': 'Under the Beams' };
                            tooltipText += `\n[${phaseMap[info.solar_phase] || info.solar_phase}]`;
                            if (info.solar_phase === 'cazimi') infoCell.classList.add('phase-cazimi');
                            else if (info.solar_phase === 'combust') infoCell.classList.add('phase-combust');
                            else if (info.solar_phase === 'under_beams') infoCell.classList.add('phase-beams');
                        }

                        infoCell.title = tooltipText;

                        if (method === 'davison' && pureName === hourLord) {
                            infoCell.classList.add('lord-active-info');
                        } else {
                            infoCell.classList.remove('lord-active-info');
                        }
                    }

                    // 💥 여기서부터 덮어씌우기
                    if (view === 'nakshatra' && method === 'davison') {
                        const nakCell = row.querySelector('[data-field="nakshatra"]');
                        const padaCell = row.querySelector('[data-field="pada"]');
                        
                        // 🚀 [수복]: PC 마우스 호버 시 Nakshatra 툴팁 표시
                        if (nakCell && info.nakshatra) {
                            nakCell.textContent = info.nakshatra.name;
                            nakCell.title = `Nakshatra #${info.nakshatra.number} | Ruler: ${info.nakshatra.ruler}`;
                            nakCell.style.cursor = 'help'; 
                        }

                        if (padaCell) {
                            const val = (ayan === 'kp') ? (info.sub_lord || "-") : (info.pada_lord || "-");
                            applySymbolGlow(padaCell, val, PLANET_GLOW_MAP);
                        }
                        const sabianCell = row.querySelector('[data-field="sabian"]');
                        if (sabianCell) renderSabianText(sabianCell, info.sabian_index, lang);

                    } else {
                        // 🔽🔽🔽 House 컬럼 추가 🔽🔽🔽
                        const fields = ['house', 'duad', 'dodeca', 'decan', 'bound', 'sabian'];
                        fields.forEach(f => {
                            const cell = row.querySelector(`[data-field="${f}"]`);
                            if (!cell) return;
                            if (f === 'sabian') {
                                renderSabianText(cell, info.sabian_index, lang);
                            } else if (f === 'house') {
                                cell.textContent = info.house || "-"; 
                            } else {
                                const map = (f === 'duad' || f === 'dodeca') ? ELEMENT_MAP : PLANET_GLOW_MAP;
                                applySymbolGlow(cell, info[f], map);
                            }
                        });
                    }
                }
            });
        }
    } catch (e) { console.error("[A2] Render Error:", e); }
}

function showFixedStarMeaning(starName, event) {
    let popover = document.getElementById('fs-popover');
    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'fs-popover';
        popover.className = 'fs-popover-box';
        document.body.appendChild(popover);
    }
    
    popover.style.transform = 'none';
    popover.style.display = '';

    const cleanName = starName.trim();
    let data = FS_MEANINGS[cleanName] || FS_MEANINGS[cleanName.toLowerCase()];
    
    if (!data) {
        popover.innerHTML = `<div class="fs-title">${cleanName}</div><div class="fs-content">No interpretation.</div>`;
    } else {
        const lang = localStorage.getItem('tetramegistus_lang') || 'en';
        const rawContent = (data.symbolism && (data.symbolism[lang] || data.symbolism['en'])) || ["-"];
        const htmlContent = (Array.isArray(rawContent) ? rawContent : [rawContent]).map(l => `<p>• ${l}</p>`).join('');
        
        popover.innerHTML = `
            <div class="fs-title">${data.name || cleanName}</div>
            <div class="fs-constellation">${data.constellation || ''}</div>
            <div class="fs-content">${htmlContent}</div>`;
    }

    if (popover.dataset.current === cleanName && popover.classList.contains('active')) {
        popover.classList.remove('active');
        return;
    }
    popover.dataset.current = cleanName;
    popover.classList.add('active');

    // 🔥 N2와 동일한 절대 좌표 추적 및 CSS 간섭 원천 차단
    popover.style.transform = 'none';
    
    const popoverWidth = 320; 
    const popoverHeight = popover.offsetHeight; 
    
    // 1. X축: 마우스 약간 우측 (화면 우측 밖으로 나가려 하면 왼쪽으로 꺾임)
    let finalX = event.pageX + 15;
    if (finalX + popoverWidth > window.innerWidth + window.scrollX - 20) {
        finalX = event.pageX - popoverWidth - 10;
    }

    // 2. Y축: 기본적으로 무조건 마우스 "바로 위" (-15px 여백)
    let finalY = event.pageY - popoverHeight - 15;

    // 예외: 마우스가 화면 맨 꼭대기에 있어서 팝업이 브라우저 상단을 뚫을 때만 커서 아래로 내림
    if (finalY < window.scrollY + 10) {
        finalY = event.pageY + 20; 
    }
    
    popover.style.left = `${finalX}px`;
    popover.style.top = `${finalY}px`;
    popover.style.position = 'absolute'; 
}

function applySymbolGlow(cell, symbol, map) {
    if (!cell) return;
    cell.textContent = symbol || "-";
    
    cell.className = cell.className.replace(/\bglow-\w+\b/g, "").trim();
    cell.classList.add("cell-center");
    if (!symbol || symbol === "-") return;
    
    const key = symbol.trim();
    if (map[key]) {
        cell.classList.add(map[key]);
    }
}

async function renderSabianText(cell, index, lang) {
    if (index === undefined || index === null) return;
    try {
        const res = await fetch(`/api/theory/sabian/render/${index}?lang=${lang}`);
        if (res.ok) {
            const d = await res.json();
            cell.textContent = d.text;
            cell.title = d.text;
        }
    } catch (e) { cell.textContent = "-"; }
}

async function ensureDataIntegrity() {
    let localData = null;
    try { localData = JSON.parse(localStorage.getItem('active_davison')); } catch (e) {}

    if (localData && localData.seed1 && localData.seed2) {
        await syncAlbedoToStation(localData);
        return;
    }

    const s1_idx = localStorage.getItem('albedo_s1_idx');
    const s2_idx = localStorage.getItem('albedo_s2_idx');

    if (s1_idx && s2_idx) {
        const allSeeds = await fetchAllAvailableSeeds();
        const seed1 = allSeeds.find(s => String(s.idx) === String(s1_idx));
        const seed2 = allSeeds.find(s => String(s.idx) === String(s2_idx));

        if (seed1 && seed2) {
            try {
                const res = await fetch('/api/astro/davison', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ seed1: seed1, seed2: seed2 })
                });
                if (res.ok) {
                    const fixedData = await res.json();
                    localStorage.setItem('active_davison', JSON.stringify(fixedData));
                    await syncAlbedoToStation(fixedData);
                }
            } catch (e) {}
        }
    }
}

async function fetchAllAvailableSeeds() {
    let seeds = [];
    try {
        const res = await fetch('/api/natal/list');
        if (res.ok) seeds = await res.json();
    } catch (e) {}
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (["active_seed", "tetramegistus.me", "active_davison"].includes(key)) continue;
        try {
            const d = JSON.parse(localStorage.getItem(key));
            if (d && d.idx !== undefined) { d.id = `LOCAL_${key}`; seeds.push(d); }
        } catch (e) {}
    }
    return seeds;
}

async function syncAlbedoToStation(data) {
    try {
        await fetch('/api/astro/coagulatio/sync-active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (e) {}
}

async function loadFixedStarMeanings() {
    if (Object.keys(FS_MEANINGS).length > 0) return;
    try {
        const res = await fetch('/api/theory/fixedstar/meanings'); 
        if (res.ok) FS_MEANINGS = await res.json();
    } catch (e) {}
}

function initializeCoagulatioUI() {
    const params = new URLSearchParams(window.location.search);
    const method = params.get('method') || 'composite';
    const mode = params.get('mode') || 'normal';
    const sys = params.get('system') || 'tropical';
    const ayan = params.get('ayanamsa') || 'lahiri';
    const view = params.get('view') || 'zodiac';

    const mKnob = document.getElementById('method-knob');
    const lComp = document.getElementById('label-method-comp');
    const lDav = document.getElementById('label-method-dav');
    const lordBar = document.getElementById('davison-lords');
    const antiSwitch = document.getElementById('composite-controls');
    const nakToggle = document.getElementById('sidereal-view-toggle');

    if (method === 'composite') {
        if(mKnob) mKnob.classList.remove('right');
        if(lComp) lComp.classList.add('active');
        if(lDav) lDav.classList.remove('active');
        if(lordBar) lordBar.style.display = 'none';
        if(antiSwitch) antiSwitch.style.display = 'flex';
        if(nakToggle) nakToggle.style.display = 'none';

        const aKnob = document.getElementById('anti-knob');
        const lNorm = document.getElementById('label-mode-comp');
        const lAnti = document.getElementById('label-mode-anti');
        
        if (mode === 'anti') {
            if(aKnob) aKnob.classList.add('right');
            if(lAnti) lAnti.classList.add('active');
            if(lNorm) lNorm.classList.remove('active');
        } else {
            if(aKnob) aKnob.classList.remove('right');
            if(lNorm) lNorm.classList.add('active');
            if(lAnti) lAnti.classList.remove('active');
        }
    } else {
        if(mKnob) mKnob.classList.add('right');
        if(lDav) lDav.classList.add('active');
        if(lComp) lComp.classList.remove('active');
        if(lordBar) lordBar.style.display = 'flex';
        if(antiSwitch) antiSwitch.style.display = 'none';
        if(nakToggle) nakToggle.style.display = 'flex';
    }

    document.querySelectorAll('.sys-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.sys === sys);
    });

    const sPanel = document.getElementById('sidereal-controls-panel');
    if (sys === 'sidereal' && sPanel) {
        sPanel.classList.add('manifested');
        document.querySelectorAll('.ayan-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.ayan === ayan);
        });

        const vKnob = document.getElementById('dicho-knob');
        const lZod = document.getElementById('label-zodiac');
        const lNak = document.getElementById('label-nakshatra');
        const zCont = document.getElementById('zodiac-view-container');
        const nCont = document.getElementById('nakshatra-view-container');

        if (view === 'nakshatra' && method !== 'composite') {
            if(vKnob) vKnob.classList.add('right');
            if(lNak) lNak.classList.add('active');
            if(zCont) zCont.style.display = 'none';
            if(nCont) nCont.style.display = 'block';
        } else {
            if(vKnob) vKnob.classList.remove('right');
            if(lZod) lZod.classList.add('active');
            if(zCont) zCont.style.display = 'block';
            if(nCont) nCont.style.display = 'none';
        }
    }
}

window.switchMethodToggle = function() {
    const url = new URL(window.location.href);
    const current = url.searchParams.get('method') || 'composite';
    const next = current === 'composite' ? 'davison' : 'composite';
    url.searchParams.set('method', next);
    url.searchParams.delete('mode'); 
    url.searchParams.delete('view'); 
    window.location.href = url.toString();
};

window.switchCompositeMode = function() {
    const url = new URL(window.location.href);
    const current = url.searchParams.get('mode') || 'normal';
    url.searchParams.set('mode', current === 'normal' ? 'anti' : 'normal');
    window.location.href = url.toString();
};

window.switchCOAGULATIOSystem = function(sys) {
    const url = new URL(window.location.href);
    url.searchParams.set('system', sys);
    if (sys !== 'sidereal') {
        url.searchParams.delete('ayanamsa');
        url.searchParams.delete('view');
    }
    window.location.href = url.toString();
};

window.switchAyanamsa = function(ayan) {
    const url = new URL(window.location.href);
    url.searchParams.set('ayanamsa', ayan);
    window.location.href = url.toString();
};

window.switchDichotomy = function() {
    const url = new URL(window.location.href);
    const currentView = url.searchParams.get('view') || 'zodiac';
    url.searchParams.set('view', currentView === 'zodiac' ? 'nakshatra' : 'zodiac');
    window.location.href = url.toString();
};

/* ─────────────────────────────────────────────────────────────
   GRIMOIRE SAVE SYSTEM (Albedo / A2 & A2_COMP)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    const params = new URLSearchParams(window.location.search);
    const system = params.get('system') || 'tropical';
    const ayanamsa = params.get('ayanamsa') || 'lahiri';
    const view = params.get('view') || 'zodiac';
    const method = params.get('method') || 'composite'; 
    const mode = params.get('mode') || 'normal'; 

    let h_sys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    let orb = params.get('fixed_star_orb') || localStorage.getItem('tetramegistus_orb') || '1.0';

    const currentLang = localStorage.getItem('tetramegistus_lang') || 'en';

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

    let targetName = (s1Name && s2Name) ? `${s1Name} & ${s2Name}` : "Unknown Coniunctio";

    const metadata = {
        day_lord: document.getElementById('day-lord')?.textContent || "",
        hour_lord: document.getElementById('hour-lord')?.textContent || "",
        sys_tab: system,
        ayanamsa: ayanamsa,
        h_sys: h_sys,
        fixed_star_orb: orb,
        view_mode: view,
        method: method,
        mode: mode, 
        target_name: targetName,
        language: currentLang,
        // 🚀 [NEW] 아남네시스 모드 상태 전송 (A2)
        anamnesis_mode: isAnamnesisMode ? currentAnaMode : 'off'
    };

    const bodies = {};
    const rows = document.querySelectorAll('.coagulatio-chart-table tbody tr, .a2-chart-table tbody tr, table tbody tr');

    rows.forEach(row => {
        if (!row.cells || row.cells.length < 2) return;
        
        // 🔽🔽🔽 필터링된 행(Node) 제외 🔽🔽🔽
        if (row.classList.contains('excluded-node')) return; 

        const bodyCell = row.cells[0];
        let pureName = bodyCell.textContent.replace(/^[^\w]+/, '').trim();
        pureName = pureName.split('\n')[0].trim();

        const is_anaretic = row.cells[1].classList.contains('text-anaretic');
        const infoText = row.cells[1].textContent.trim();

        const tooltip = row.cells[1].title || "";
        let ruler = "";
        let dignity = "";
        const rulerMatch = tooltip.match(/Ruler:\s*([^\s|]+)/);
        if (rulerMatch) ruler = rulerMatch[1];
        const dignityMatch = tooltip.match(/Dignity:\s*([^\s|]+)/);
        if (dignityMatch) dignity = dignityMatch[1];

        const stars = [];
        const starIcons = bodyCell.querySelectorAll('.fs-icon');
        starIcons.forEach(icon => {
            const parts = icon.title.split('|').map(s => s.trim());
            if (parts.length >= 3) {
                stars.push({ name: parts[0], info: parts[1], orb: parts[2].replace('orb', '').trim() });
            }
        });

        let bodyData = { info: infoText, ruler: ruler, dignity: dignity, is_anaretic: is_anaretic, stars: stars };

        const currentView = String(view).toLowerCase();
        
        // 🔽🔽🔽 House 데이터 저장 인덱스 밀림 처리 (+1) 🔽🔽🔽
        if (currentView === 'zodiac' && row.cells.length >= 8) {
            bodyData.house = row.cells[2].textContent.trim();
            bodyData.duad = row.cells[3].textContent.trim();
            bodyData.dodeca = row.cells[4].textContent.trim();
            bodyData.decan = row.cells[5].textContent.trim();
            bodyData.bounds = row.cells[6].textContent.trim();
            bodyData.sabian = row.cells[7].textContent.trim();
        } else if (currentView === 'nakshatra' && row.cells.length >= 5) {
            bodyData.nakshatra = row.cells[2].textContent.trim();
            bodyData.pada_lord = row.cells[3].textContent.trim();
            bodyData.sabian = row.cells[4].textContent.trim();
        }

        bodies[pureName] = bodyData;
    });

    const payload = {
        seed_id: seedId,
        stage: 'albedo',       
        target_name: targetName,
        metadata: metadata,
        bodies: bodies
    };

    const currentView = String(view).toLowerCase();
    let compilerId = 'a2';
    
    if (method === 'composite') {
        compilerId = 'a2_comp';
    } else if (isAnamnesisMode && method === 'davison') {
        // 🚀 [NEW] Davison + Anamnesis 모드일 때 락온
        compilerId = 'a2_anamnesis';
    } else if (currentView === 'nakshatra') {
        compilerId = 'a2_nak';
    }

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

// 🚀 [수정]: 데이터 은닉을 포함한 렌더링 함수
function renderCharaKarakaTable(data, dayLords, hourLord) {
    const tbody = document.getElementById('chara-karaka-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (!data || !data.planets) return;

    const ckPlanets = [];
    const order = ["AK", "AmK", "BK", "MK", "PK", "GK", "DK"];

    for (const [key, p] of Object.entries(data.planets)) {
        if (p.chara_karaka) {
            ckPlanets.push({
                key: key,
                karaka: p.chara_karaka,
                sanskrit: p.sanskrit_name || key,
                pos: p.dms,
                nakshatra: p.nakshatra ? p.nakshatra.name : "-", // 🚀 낙샤트라 추가
                deg: p.longitude % 30
            });
        }
    }
    
    // 서열 정렬
    ckPlanets.sort((a, b) => order.indexOf(a.karaka) - order.indexOf(b.karaka));

    ckPlanets.forEach(p => {
        const tr = document.createElement('tr');
        
        // 🚀 나중에 Grimoire가 빼갈 수 있도록 데이터 은닉
        tr.dataset.karaka = p.karaka;
        tr.dataset.info = p.pos;
        tr.dataset.nakshatra = p.nakshatra;
        tr.dataset.graha_sa = p.sanskrit;
        tr.dataset.graha_en = p.key;

        const isDayLord = dayLords.includes(p.key);
        const isHourLord = hourLord === p.key;
        
        let grahaStyle = "";
        if (isDayLord) grahaStyle += "text-transform: uppercase; ";
        if (isHourLord) grahaStyle += "font-weight: bold; ";
        
        // TD 1: Karaka
        const tdKaraka = document.createElement('td');
        const spanKaraka = document.createElement('span');
        spanKaraka.className = 'ck-label';
        let fullName = p.karaka;
        if (KARAKA_DEFS[p.karaka]) fullName = KARAKA_DEFS[p.karaka].karaka;
        spanKaraka.textContent = fullName;
        spanKaraka.onclick = (e) => {
            e.stopPropagation();
            showKarakaPopover(p.karaka, e);
        };
        tdKaraka.appendChild(spanKaraka);
        
        // TD 2: Graha
        const tdGraha = document.createElement('td');
        const spanGraha = document.createElement('span');
        spanGraha.className = 'ck-graha';
        spanGraha.style.cssText = grahaStyle;
        spanGraha.title = `${p.key} | ${p.pos}`;
        spanGraha.textContent = p.sanskrit;
        tdGraha.appendChild(spanGraha);
        
        tr.appendChild(tdKaraka);
        tr.appendChild(tdGraha);
        tbody.appendChild(tr);
    });
}

// 🚀 [수정]: 분기 로직이 들어간 세이브 시스템
window.saveToGrimoire = async function() {
    const params = new URLSearchParams(window.location.search);
    const system = params.get('system') || 'tropical';
    const ayanamsa = params.get('ayanamsa') || 'lahiri';
    const view = params.get('view') || 'zodiac';
    const method = params.get('method') || 'composite'; 
    const mode = params.get('mode') || 'normal'; 

    let h_sys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    let orb = params.get('fixed_star_orb') || localStorage.getItem('tetramegistus_orb') || '1.0';

    const currentLang = localStorage.getItem('tetramegistus_lang') || 'en';

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

    let targetName = (s1Name && s2Name) ? `${s1Name} & ${s2Name}` : "Unknown Coniunctio";

    const metadata = {
        day_lord: document.getElementById('day-lord')?.textContent || "",
        hour_lord: document.getElementById('hour-lord')?.textContent || "",
        sys_tab: system,
        ayanamsa: ayanamsa,
        h_sys: h_sys,
        fixed_star_orb: orb,
        view_mode: view,
        method: method,
        mode: mode, 
        target_name: targetName,
        language: currentLang,
        anamnesis_mode: isAnamnesisMode ? currentAnaMode : 'off'
    };

    const bodies = {};
    let compilerId = 'a2';

    // 🚀 [NEW] Chara Karaka 모드일 때의 데이터 수집 로직 (Davison 전용)
    if (isCharaKarakaMode && method === 'davison') {
        const ckRows = document.querySelectorAll('#chara-karaka-body tr');
        ckRows.forEach(row => {
            const k = row.dataset.karaka;
            if (!k) return;
            bodies[k] = {
                info: row.dataset.info || "-",
                nakshatra: row.dataset.nakshatra || "-",
                graha_sa: row.dataset.graha_sa || "-",
                graha_en: row.dataset.graha_en || "-"
            };
        });
        compilerId = 'a2_ck';
    } else {
        // 기존 뷰(Composite / Davison Zodiac / Davison Nakshatra 등) 로직
        const rows = document.querySelectorAll('.coagulatio-chart-table tbody tr, .a2-chart-table tbody tr, table tbody tr');

        rows.forEach(row => {
            if (!row.cells || row.cells.length < 2) return;
            if (row.classList.contains('excluded-node')) return; 

            const bodyCell = row.cells[0];
            let pureName = bodyCell.textContent.replace(/^[^\w]+/, '').trim();
            pureName = pureName.split('\n')[0].trim();

            const is_anaretic = row.cells[1].classList.contains('text-anaretic');
            const infoText = row.cells[1].textContent.trim();

            const tooltip = row.cells[1].title || "";
            let ruler = ""; let dignity = "";
            const rulerMatch = tooltip.match(/Ruler:\s*([^\s|]+)/);
            if (rulerMatch) ruler = rulerMatch[1];
            const dignityMatch = tooltip.match(/Dignity:\s*([^\s|]+)/);
            if (dignityMatch) dignity = dignityMatch[1];

            const stars = [];
            const starIcons = bodyCell.querySelectorAll('.fs-icon');
            starIcons.forEach(icon => {
                const parts = icon.title.split('|').map(s => s.trim());
                if (parts.length >= 3) stars.push({ name: parts[0], info: parts[1], orb: parts[2].replace('orb', '').trim() });
            });

            let bodyData = { info: infoText, ruler: ruler, dignity: dignity, is_anaretic: is_anaretic, stars: stars };

            const currentView = String(view).toLowerCase();
            
            if (currentView === 'zodiac' && row.cells.length >= 8) {
                bodyData.house = row.cells[2].textContent.trim();
                bodyData.duad = row.cells[3].textContent.trim();
                bodyData.dodeca = row.cells[4].textContent.trim();
                bodyData.decan = row.cells[5].textContent.trim();
                bodyData.bounds = row.cells[6].textContent.trim();
                bodyData.sabian = row.cells[7].textContent.trim();
            } else if (currentView === 'nakshatra' && row.cells.length >= 5) {
                bodyData.nakshatra = row.cells[2].textContent.trim();
                bodyData.pada_lord = row.cells[3].textContent.trim();
                bodyData.sabian = row.cells[4].textContent.trim();
            }

            bodies[pureName] = bodyData;
        });

        const currentView = String(view).toLowerCase();
        if (method === 'composite') {
            compilerId = 'a2_comp';
        } else if (isAnamnesisMode && method === 'davison') {
            compilerId = 'a2_anamnesis';
        } else if (currentView === 'nakshatra') {
            compilerId = 'a2_nak';
        }
    }

    const payload = {
        seed_id: seedId,
        stage: 'albedo',       
        target_name: targetName,
        metadata: metadata,
        bodies: bodies
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