/* static/world/nigredo/n2.js — v18.4 CSS Segregation & House Expansion */

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
    console.log("[PRINCIPIA] Initializing N2 Module...");
    const activeSeed = JSON.parse(localStorage.getItem('active_seed'));
    if (activeSeed && (!activeSeed.id || String(activeSeed.id).startsWith('LOCAL_'))) {
        await syncLocalSeedToStation(activeSeed);
    }
    await loadFixedStarMeanings();
    await loadKarakaMeanings(); // 🚀 [NEW] JSON 로드
    initializePrincipiaUI();
    fetchAndRenderAstroData();
    
    // 🚀 [수정]: 생시 미상이어도 Nakshatra 모드는 진입 가능하므로 리스너는 항상 등록, 락은 동적 제어
    const titleEl = document.getElementById('principia-title');
    if (titleEl) {
        titleEl.addEventListener('click', handleTitleRitual);
    }
    
    // 🚀 [NEW] N/A/R/C 4분할 휠 클릭 이벤트
    document.querySelectorAll('.ana-quadrant').forEach(quad => {
        quad.addEventListener('click', (e) => {
            if (!isAnamnesisMode) return;
            const selectedMode = e.target.dataset.mode;
            currentAnaMode = selectedMode;
            
            // 활성화된 모드 색상 변경 (Cyan Blue)
            document.querySelectorAll('.ana-quadrant').forEach(q => q.classList.remove('active'));
            e.target.classList.add('active');
            
            // 바뀐 모드로 백엔드 연산 즉시 재요청
            fetchAndRenderAstroData();
        });
    });

    document.addEventListener('click', (e) => {
        const popover = document.getElementById('fs-popover');
        if (popover && popover.classList.contains('active')) {
            if (!e.target.closest('.fs-icon') && !e.target.closest('.fs-popover-box')) {
                popover.classList.remove('active');
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
});

async function loadFixedStarMeanings() {
    try {
        const res = await fetch('/api/theory/fixedstar/meanings'); 
        if (res.ok) {
            FS_MEANINGS = await res.json();
            console.log("[PRINCIPIA] Fixed Star Meanings Loaded.");
        } else {
            console.warn("[PRINCIPIA] Fixed Star dictionary empty or failed.");
        }
    } catch (e) { 
        console.error("[PRINCIPIA] API Error (FixedStar):", e); 
    }
}

async function syncLocalSeedToStation(seedData) {
    try {
        await fetch('/api/astro/principia/sync-active', { 
            method: 'POST', 
            body: JSON.stringify(seedData), 
            headers: {'Content-Type': 'application/json'} 
        });
    } catch (e) { console.error("Sync Error:", e); }
}

// 🚀 [NEW] 카라카 설명 JSON 패치
async function loadKarakaMeanings() {
    try { 
        const res = await fetch('/api/astro/theory/karaka/definitions'); 
        if(res.ok) KARAKA_DEFS = await res.json(); 
    } catch(e) {}
}

// 🚀 [NEW] 현재 View에 따라 Anamnesis로 갈지 Chara Karaka로 갈지 결정하는 관문
async function handleTitleRitual() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') || 'zodiac';
    
    if (view === 'nakshatra') {
        await handleCharaKarakaRitual();
    } else {
        await handleAnamnesisRitual();
    }
}

function initializePrincipiaUI() {
    const params = new URLSearchParams(window.location.search);
    const currentSys = params.get('system') || 'tropical';
    const currentAyan = params.get('ayanamsa') || 'lahiri';
    
    document.querySelectorAll('.sys-tab').forEach(tab => {
        tab.classList.toggle('active', tab.textContent.trim().toLowerCase() === currentSys);
    });

    const vault = document.getElementById('sidereal-controls-panel');
    if (currentSys === 'sidereal' && vault) {
        vault.classList.add('manifested');
        document.querySelectorAll('.ayan-tab').forEach(tab => {
            tab.classList.toggle('active', tab.textContent.trim().toLowerCase() === currentAyan);
        });
    }
}

// 🚀 [수복 완료] 화면 암전 및 모드 토글 (타이밍 시퀀스 완벽 적용)
async function handleAnamnesisRitual() {
    const titleEl = document.getElementById('principia-title');
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
                    
                    titleEl.textContent = "Anamnesis";
                    
                    if (wheelContainer) wheelContainer.classList.remove('hidden');
                    if (systemNav) systemNav.style.display = 'none';
                    if (subOptions) subOptions.style.display = 'none';
                } else {
                    titleEl.textContent = "Principia";
                    if (wheelContainer) wheelContainer.classList.add('hidden');
                    if (systemNav) systemNav.style.display = '';
                    if (subOptions) subOptions.style.display = '';
                }
                
                overlay.classList.remove('active');
                overlayText.classList.remove('show');
                
                fetchAndRenderAstroData();
            }, 1500); 
        }, 250); 
    }, 2000); 
}

// 🚀 [수복 완료] Chara Karaka 암전 시퀀스 (생시 미상 무관)
async function handleCharaKarakaRitual() {
    const overlay = document.getElementById('ana-overlay');
    const overlayText = document.getElementById('ana-overlay-text');
    const titleEl = document.getElementById('principia-title');
    const containerEl = document.querySelector('.n2-principia'); 
    
    const systemNav = document.getElementById('main-system-nav');
    const dichoToggle = document.querySelector('.dichotomy-module'); 
    
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
                    
                    if (systemNav) systemNav.style.display = 'none';
                    if (dichoToggle) dichoToggle.style.display = 'none'; 
                    
                    if (nakContainer) nakContainer.classList.add('hidden');
                    if (ckContainer) ckContainer.classList.remove('hidden');
                } else {
                    titleEl.textContent = "Principia";
                    containerEl.classList.remove('ck-mode-active'); 
                    
                    if (systemNav) systemNav.style.display = '';
                    if (dichoToggle) dichoToggle.style.display = 'flex';
                    
                    if (nakContainer) nakContainer.classList.remove('hidden');
                    if (ckContainer) ckContainer.classList.add('hidden');
                }
                
                overlay.classList.remove('active');
                overlayText.classList.remove('show');
                
                fetchAndRenderAstroData();
            }, 1500); 
        }, 250); 
    }, 2000); 
}

async function fetchAndRenderAstroData() {
    const params = new URLSearchParams(window.location.search);
    const system = params.get('system') || 'tropical';
    const ayanamsa = params.get('ayanamsa') || 'lahiri';
    const view = params.get('view') || 'zodiac';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    let h_sys = params.get('h_sys');
    if (!h_sys) {
        if (window.WorldSettings && window.WorldSettings.getHouseCode) {
            h_sys = window.WorldSettings.getHouseCode();
        } else {
            h_sys = localStorage.getItem('tetramegistus_house') || 'P';
        }
    }

    let orb = params.get('fixed_star_orb'); 
    if (!orb) {
        orb = localStorage.getItem('tetramegistus_orb') || '1.0'; 
    }
    
    // 🚀 [NEW] URL에 anamnesis 모드 정보 탑재
    const anaParam = isAnamnesisMode ? currentAnaMode : 'off';
    const apiUrl = `/api/astro/principia/resting?system=${system}&ayanamsa=${ayanamsa}&view=${view}&h_sys=${h_sys}&fixed_star_orb=${orb}&anamnesis=${anaParam}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("API Response Not OK");
        const data = await response.json();
        const isTimeUnknown = data.meta && (data.meta.is_time_unknown === 1);
        const anglesSection = document.getElementById('angles-section-nakshatra');

        // 🚀 [수정]: 생시 락다운 (Anamnesis(Zodiac)는 막지만, Chara Karaka(Nakshatra)는 풀어둠)
        const titleEl = document.getElementById('principia-title');
        if (titleEl) {
            if (isTimeUnknown && view !== 'nakshatra') {
                titleEl.classList.add('time-unknown-locked');
                titleEl.classList.remove('ritual-ready');
            } else {
                titleEl.classList.add('ritual-ready');
                titleEl.classList.remove('time-unknown-locked');
            }
        }

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

        let dayLords = [];
        let hourLord = null;
        if (data.lords) {
            const dLordEl = document.getElementById('day-lord');
            const hLordEl = document.getElementById('hour-lord');
            const rawDayLord = data.lords.day || "-";
            if (dLordEl) dLordEl.textContent = rawDayLord;
            dayLords = rawDayLord.split('|').map(s => s.trim()); 
            hourLord = data.lords.hour || "-";
            if (hLordEl) hLordEl.textContent = hourLord;
        }

        // 🚀 [NEW] 모드 분기
        if (isCharaKarakaMode) {
            renderCharaKarakaTable(data, dayLords, hourLord);
        } else if (data.planets) {
            const rows = document.querySelectorAll('.n2-chart-table tbody tr');
            rows.forEach(row => {
                const bodyCell = row.cells[0];
                const infoCell = row.cells[1];
                if (!bodyCell) return;

                const fullText = bodyCell.textContent.trim();
                const pureName = fullText.replace(/^[^\w]+/, '').trim(); 
                
                // 🔽🔽🔽 여기에 새로운 로직 추가 🔽🔽🔽
                // Draconic 또는 Ketunic 시스템일 때 'Node'가 들어간 행 숨기기
                if ((system === 'draconic' || system === 'ketunic') && pureName.includes('Node')) {
                    row.style.display = 'none';
                    row.classList.add('excluded-node'); // 컴파일러 제외용 꼬리표
                    return; // 데이터 렌더링 스킵
                } else {
                    row.style.display = ''; // 다른 모드일 땐 다시 보이게 복구
                    row.classList.remove('excluded-node');
                }
                const planetKey = Object.keys(data.planets).find(key => fullText.includes(key));

                if (planetKey) {
                    const info = data.planets[planetKey];

                    const existingFs = bodyCell.querySelector('.fs-container');
                    if (existingFs) existingFs.remove();

                    if (dayLords.includes(pureName)) { 
                        bodyCell.classList.add('lord-active-body');
                        bodyCell.title = "[Day Lord]"; 
                    } else {
                        bodyCell.classList.remove('lord-active-body');
                    }

                    if (info.fixed_stars && info.fixed_stars.length > 0 && !isAnamnesisMode) {
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

                    if (infoCell) {
                        infoCell.innerHTML = ''; 
                        infoCell.appendChild(document.createTextNode(info.dms));
                        infoCell.className = 'cell-info'; 
                        
                        infoCell.classList.remove('text-retrograde', 'text-direct', 'text-anaretic');

                        let tooltipText = "";
                        const angles = ["Ascendant", "Midheaven", "Descendant", "Immum Coeli"];

                        if (angles.includes(pureName)) {
                            const rulerName = info.ruler; 
                            const rulerData = data.planets[rulerName]; 

                            if (rulerData) {
                                let dignityStr = rulerData.dignity ? ` | ${rulerData.dignity}` : "";
                                tooltipText = `${rulerName}: ${rulerData.dms}${dignityStr}`;
                            } else {
                                tooltipText = `Ruler: ${rulerName}`;
                            }
                        } else {
                            tooltipText = `Ruler: ${info.ruler}`;
                            if (info.dignity) {
                                tooltipText += ` | Dignity: ${info.dignity}`;
                            }
                            if (pureName === hourLord) tooltipText = `[Hour Lord] ` + tooltipText;
                        }

                        if (info.is_anaretic) {
                            infoCell.classList.add('text-anaretic');
                            tooltipText = `! ANARETIC ! \n${tooltipText}`;
                        } else {
                            infoCell.classList.add(info.is_retrograde ? 'text-retrograde' : 'text-direct');
                        }
                        
                        if (info.solar_phase) {
                            const phaseMap = {
                                'cazimi': 'Cazimi',
                                'combust': 'Combustion',
                                'under_beams': 'Under the Beams'
                            };
                            const pName = phaseMap[info.solar_phase] || info.solar_phase.replace('_', ' ');
                            tooltipText += `\n[${pName}]`;

                            if (info.solar_phase === 'cazimi') infoCell.classList.add('phase-cazimi');
                            else if (info.solar_phase === 'combust') infoCell.classList.add('phase-combust');
                            else if (info.solar_phase === 'under_beams') infoCell.classList.add('phase-beams');
                        }

                        infoCell.title = tooltipText;
                        if (pureName === hourLord) infoCell.classList.add('lord-active-info');
                    }

                    // 🔑 인덱스 변경 (House 컬럼 추가로 인해 +1씩 우측 이동)
                    if (view === 'zodiac' && row.cells.length >= 8) {
                        if (row.cells[2]) row.cells[2].textContent = info.house || "-"; // 백엔드에서 house 정보 전달 가정
                        applySymbolGlow(row.cells[3], info.duad, ELEMENT_MAP);
                        applySymbolGlow(row.cells[4], info.dodeca, ELEMENT_MAP);
                        applySymbolGlow(row.cells[5], info.decan, PLANET_GLOW_MAP);
                        applySymbolGlow(row.cells[6], info.bound, PLANET_GLOW_MAP);
                        renderSabianText(row.cells[7], info.sabian_index, lang);
                    } 
                    else if (view === 'nakshatra' && row.cells.length >= 5) {
                        const nak = info.nakshatra;
                        if (row.cells[2] && nak) {
                            row.cells[2].textContent = nak.name;
                            row.cells[2].title = `Nakshatra #${nak.number} | Ruler: ${nak.ruler}`;
                        }
                        if (row.cells[3] && nak) {
                            const isKP = (ayanamsa.toLowerCase() === 'kp');
                            const val = isKP ? (info.sub_lord || "-") : (info.pada_lord || "-");
                            row.cells[3].textContent = val;
                            applySymbolGlow(row.cells[3], val, PLANET_GLOW_MAP);
                        }
                        renderSabianText(row.cells[4], info.sabian_index, lang);
                    }
                }
            });
        }
    } catch (e) { console.error("Data Render Error:", e); }
}

// 🚀 [NEW] Chara Karaka 렌더링 함수
function renderCharaKarakaTable(data, dayLords, hourLord) {
    const tbody = document.getElementById('chara-karaka-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (!data || !data.planets) return;

    const ckPlanets = [];
    const order = ["AK", "AmK", "BK", "MK", "PiK", "PK", "DK"];

    for (const [key, p] of Object.entries(data.planets)) {
        if (p.chara_karaka) {
            ckPlanets.push({
                key: key,
                karaka: p.chara_karaka,
                sanskrit: p.sanskrit_name || key,
                pos: p.dms,
                deg: p.longitude % 30
            });
        }
    }
    
    // 서열 순(AK -> DK) 정렬
    ckPlanets.sort((a, b) => order.indexOf(a.karaka) - order.indexOf(b.karaka));

    ckPlanets.forEach(p => {
        const tr = document.createElement('tr');
        
        const isDayLord = dayLords.includes(p.key);
        const isHourLord = hourLord === p.key;
        
        // 🚀 Day Lord = 대문자, Hour Lord = 볼드
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
        spanGraha.title = `${p.key}| ${p.pos}`;
        spanGraha.textContent = p.sanskrit;
        tdGraha.appendChild(spanGraha);
        
        tr.appendChild(tdKaraka);
        tr.appendChild(tdGraha);
        tbody.appendChild(tr);
    });
}

// 🚀 [NEW] Chara Karaka 의미 팝업 (N6 Varga 클론)
function showKarakaPopover(karakaCode, event) {
    let popover = document.getElementById('ck-popover');
    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'ck-popover';
        popover.className = 'ck-popover-box';
        document.body.appendChild(popover);
    }
    
    const def = KARAKA_DEFS[karakaCode];
    if (!def) return;
    
    const userLang = localStorage.getItem('tetramegistus_lang') || 'en';
    const targetLang = (userLang === 'ko' || userLang.startsWith('ko')) ? 'ko' : 'en';
    
    popover.innerHTML = `
        <div class="ck-popover-title">${def.karaka} (${karakaCode})</div>
        <div class="ck-popover-content">${def[targetLang] || def['en']}</div>
    `;
    
    popover.style.display = 'block';
    popover.style.left = `${event.pageX + 15}px`;
    popover.style.top = `${event.pageY + 15}px`;
}

function showFixedStarMeaning(starName, event) {
    let popover = document.getElementById('fs-popover');
    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'fs-popover';
        popover.className = 'fs-popover-box';
        document.body.appendChild(popover);
    }

    const cleanName = starName.trim();
    let data = FS_MEANINGS[cleanName];
    if (!data) {
        const titleCase = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
        data = FS_MEANINGS[titleCase];
    }
    if (!data) data = FS_MEANINGS[cleanName.toLowerCase()];

    if (!data) {
        popover.innerHTML = `
            <div class="fs-title">${cleanName}</div>
            <div class="fs-content"><p class="fs-missing">Interpretation missing.</p></div>`;
    } else {
        const userLang = localStorage.getItem('tetramegistus_lang') || 'en';
        const targetLang = (userLang === 'ko') ? 'ko' : 'en';
        
        let rawContent = (data.symbolism && (data.symbolism[targetLang] || data.symbolism['en']));
        if (!rawContent) rawContent = ["No text available."];
        
        const descLines = Array.isArray(rawContent) ? rawContent : [rawContent];
        const htmlContent = descLines.map(line => `<p>• ${line}</p>`).join('');
        
        popover.innerHTML = `
            <div class="fs-title">${data.name || cleanName}</div>
            <div class="fs-constellation">${data.constellation || ''}</div>
            <div class="fs-content">${htmlContent}</div>
        `;
    }

    if (popover.dataset.currentStar === cleanName && popover.classList.contains('active')) {
        popover.classList.remove('active');
        return;
    }

    popover.dataset.currentStar = cleanName;
    popover.classList.add('active'); 

    // 🔥 CSS transform 간섭 완전 차단 (가장 중요한 핵심!)
    popover.style.transform = 'none'; 
    
    // 이 시점에서 팝업의 실제 크기를 측정합니다
    const popoverWidth = 320; 
    const popoverHeight = popover.offsetHeight; 
    
    // 1. X축: 마우스 약간 우측 (화면 우측 밖으로 나가려 하면 왼쪽으로 꺾임)
    let finalX = event.pageX + 15;
    if (finalX + popoverWidth > window.innerWidth + window.scrollX - 20) {
        finalX = event.pageX - popoverWidth - 10;
    }

    // 2. Y축: 기본적으로 무조건 마우스 "바로 위" (-15px 여백)로 설정!
    let finalY = event.pageY - popoverHeight - 15;

    // 예외: 마우스가 화면 맨 꼭대기에 있어서 팝업이 브라우저 상단을 뚫고 나갈 때만 커서 아래로 내림
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
    } catch (e) { cell.textContent = `Index ${index}`; }
}

window.switchPrincipiaSystem = function(sys) {
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

window.saveToGrimoire = async function() {
    const params = new URLSearchParams(window.location.search);
    const system = params.get('system') || 'tropical';
    const ayanamsa = params.get('ayanamsa') || 'lahiri';
    const view = params.get('view') || 'zodiac';
    
    // 기존의 애매한 로직을 지우고 딱 이렇게만 써주세요.
    let h_sys = window.WorldSettings ? window.WorldSettings.getHouseCode() : (localStorage.getItem('tetramegistus_house') || 'P');
    let orb = params.get('fixed_star_orb') || localStorage.getItem('tetramegistus_orb') || '1.0';

    const currentLang = localStorage.getItem('tetramegistus_lang') || 'en';
    const activeSeed = JSON.parse(localStorage.getItem('active_seed'));
    const targetName = activeSeed ? activeSeed.name : "Unknown_Seed";
    const seedId = activeSeed ? activeSeed.id : "unknown"; 

    const metadata = {
        day_lord: document.getElementById('day-lord')?.textContent || "",
        hour_lord: document.getElementById('hour-lord')?.textContent || "",
        sys_tab: system,
        ayanamsa: ayanamsa,
        h_sys: h_sys,
        fixed_star_orb: orb,
        view_mode: view,
        target_name: targetName,
        language: currentLang,
        h_sys: h_sys,
        anamnesis_mode: isAnamnesisMode ? currentAnaMode : 'off'
    };

    const bodies = {};
    const rows = document.querySelectorAll('.n2-chart-table tbody tr');
    
    rows.forEach(row => {
        if (!row.cells || row.cells.length < 2) return;

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
                stars.push({
                    name: parts[0],
                    info: parts[1],
                    orb: parts[2].replace('orb', '').trim()
                });
            }
        });

        let bodyData = {
            info: infoText,
            ruler: ruler,
            dignity: dignity,
            is_anaretic: is_anaretic,
            stars: stars
        };

        // 🔑 인덱스 변경 로직 (House 추가)
        if (view === 'zodiac' && row.cells.length >= 8) {
            bodyData.house = row.cells[2].textContent.trim();
            bodyData.duad = row.cells[3].textContent.trim();
            bodyData.dodeca = row.cells[4].textContent.trim();
            bodyData.decan = row.cells[5].textContent.trim();
            bodyData.bounds = row.cells[6].textContent.trim();
            bodyData.sabian = row.cells[7].textContent.trim();
        } else if (view === 'nakshatra' && row.cells.length >= 5) {
            bodyData.nakshatra = row.cells[2].textContent.trim();
            bodyData.pada_lord = row.cells[3].textContent.trim();
            bodyData.sabian = row.cells[4].textContent.trim();
        }

        bodies[pureName] = bodyData;
    });

    const payload = {
        seed_id: seedId,        
        stage: 'nigredo',       
        target_name: targetName,
        metadata: metadata,
        bodies: bodies
    };

    const currentView = String(view).toLowerCase();
    // 🚀 [NEW] 아남네시스 모드일 경우 전용 컴파일러 락온
    let compilerId = (currentView === 'nakshatra') ? 'n2_nak' : 'n2';
    if (isAnamnesisMode) {
        compilerId = 'n2_anamnesis';
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
            console.log(`[GRIMOIRE] Archive [${result.file}] Saved Successfully!`);
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