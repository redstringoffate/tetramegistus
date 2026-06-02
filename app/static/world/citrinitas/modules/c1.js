/* static/world/citrinitas/modules/c1.js — v6.0 A8 Presentation Match */

(() => {
    // ─────────────────────────────────────────────────────────────
    // 1. Constants & Configuration
    // ─────────────────────────────────────────────────────────────
    const TROPICAL_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const ELEMENT_CYCLE = ['elem-fire', 'elem-earth', 'elem-air', 'elem-water'];
    
    const AYANAMSAS = [
        { id: 'lahiri', label: 'Lahiri', desc: 'Lahiri' },
        { id: 'raman', label: 'Raman', desc: 'Raman' },
        { id: 'kp', label: 'KP', desc: 'Krishnamurti Paddhati' },
        { id: 'fagan-bradley', label: 'Fagan-Bradley', desc: 'Fagan-Bradley' },
        { id: 'yukteswar', label: 'Yukteswar', desc: 'Yukteswar' }
    ];

    // 🚀 Suffix Mapping (User Request)
    const SUFFIX_MAP = {
        'asteroids': '_ast',
        'tropical': '_T',
        'sidereal': '_S',
        'draconic': '_D',
        'ketunic': '_K',
        'arabic': '_lot',
        'comp_main': '_comp',
        'comp_anti': '_anti',
        'davi_ast': '_davi_ast',
        'davi_tro': '_davi_T',
        'davi_sid': '_davi_S',
        'davi_dra': '_davi_D',
        'davi_ket': '_davi_K',
        'davi_lot': '_davi_lot'
    };

    // System Sort Priority
    const SYSTEM_PRIORITY = {
        'asteroids': 0, 'davi_ast': 1,
        'tropical': 2, 'comp_main': 3, 'comp_anti': 4, 'davi_tro': 5,
        'sidereal': 6, 'davi_sid': 7,
        'draconic': 8, 'davi_dra': 9,
        'ketunic': 10, 'davi_ket': 11,
        'arabic': 12, 'davi_lot': 12
    };

    // 🚀 [New]: Definitions Cache
    let DEFINITIONS = { asteroids: {}, arabic: {} };

    let STATE = {
        data: [], 
        config: { sortMode: 'seed', ayanamsa: 'lahiri', dichotomy: 'traditional', entities: {} },
        sabianSymbols: null,
        editingId: null,
        activeColumns: [] 
    };

    // ─────────────────────────────────────────────────────────────
    // 2. Initialization
    // ─────────────────────────────────────────────────────────────
    
    // 🚀 [수정]: 페이지에 돌아왔을 때 데이터가 증발하지 않도록 즉시 로드합니다.
    loadPersistence();

    async function initC1Module() {
        // URL Param Sync
        const params = new URLSearchParams(window.location.search);
        const urlAyanamsa = params.get('ayanamsa');
        if (urlAyanamsa && AYANAMSAS.some(a => a.id === urlAyanamsa)) {
            STATE.config.ayanamsa = urlAyanamsa;
        }

        renderGlobalControls(); 
        
        // Parallel Fetch
        await Promise.all([
            fetchSabianSymbols(),
            fetchDefinitions()
        ]);
        
        rebuildC1Table();
        refreshGrid();
        
        const modalType = params.get('modal');
        if (modalType) {
            setTimeout(() => c1_openModal(modalType, null, false), 100);
        }
    }

    // 🚀 [수정]: 페이지 상태에 따라 안전하게 실행 (SPA 증발 완벽 방어)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initC1Module);
    } else {
        initC1Module();
    }

    // 🚀 [New]: Definition Fetcher
    async function fetchDefinitions() {
        try {
            const [resAst, resAra] = await Promise.all([
                fetch('/api/astro/theory/asteroids/definitions'),
                fetch('/api/astro/theory/arabic/definitions')
            ]);
            if (resAst.ok) DEFINITIONS.asteroids = await resAst.json();
            if (resAra.ok) DEFINITIONS.arabic = await resAra.json();
        } catch (e) { console.warn("[C1] Defs Load Fail"); }
    }

    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.modal) {
            c1_openModal(event.state.modal, null, false);
        } else {
            closeModalInternal();
        }
    });

    // ─────────────────────────────────────────────────────────────
    // 🚀 [CORE 1]: Dynamic Table Builder
    // ─────────────────────────────────────────────────────────────

/* static/world/citrinitas/modules/c1.js (Partial Update) */

    window.c1_getContent = function() {
        return `
            <div class="c1-container">
                <div id="c1-loading" class="c1-loading-overlay">
                    <div class="c1-loading-text">
                        Rendering Tabula<span class="c1-loading-dots">.......</span>
                    </div>
                </div>

                <div class="c1-header">
                </div>
                </div>
        `;
    };

    window.rebuildC1Table = function() {
        loadPersistence(); 

        const theadRow = document.getElementById('c1-head-row');
        const tbody = document.getElementById('c1-body');
        if (!theadRow || !tbody) return;

        // 1. Collect Columns
        let allCols = [];
        STATE.data.forEach((item, index) => {
            const conf = STATE.config.entities[item.id];
            if (!conf || !conf.active) return; 

            let baseName = item.name.replace(/\s*&\s*/g, '-');

            conf.subs.forEach(subKey => {
                let suffix = SUFFIX_MAP[subKey] || `_${subKey}`;
                let colLabel = `${baseName}${suffix}`;

                allCols.push({
                    itemId: item.id,
                    dataIndex: index,
                    subKey: subKey,
                    label: colLabel,
                    type: item.type,
                    prio: SYSTEM_PRIORITY[subKey] !== undefined ? SYSTEM_PRIORITY[subKey] : 99
                });
            });
        });

        // 2. Sort Logic
        const SUB_WEIGHTS = {
            'asteroids': [1, 1], 'davi_ast': [1, 2],
            'tropical': [2, 1], 'comp_main': [2, 2], 'comp_anti': [2, 3], 'davi_tro': [2, 4],
            'sidereal': [3, 1], 'davi_sid': [3, 2],
            'draconic': [4, 1], 'davi_dra': [4, 2],
            'ketunic': [5, 1], 'davi_ket': [5, 2],
            'arabic': [6, 1], 'davi_lot': [6, 2]
        };

        allCols.sort((a, b) => {
            // c1.js 배열에서는 속성명이 subKey 이므로 이를 사용
            const wA = SUB_WEIGHTS[a.subKey] || [99, 99];
            const wB = SUB_WEIGHTS[b.subKey] || [99, 99];
            
            if (STATE.config.sortMode === 'system') {
                if (wA[0] !== wB[0]) return wA[0] - wB[0];   // 1. 시스템 Level 비교
                if (a.dataIndex !== b.dataIndex) return a.dataIndex - b.dataIndex; // 2. 같은 시스템이면 시드 순서
                return wA[1] - wB[1];                          // 3. 같은 시드의 세부 순서
            } else { // 'seed' 모드
                if (a.dataIndex !== b.dataIndex) return a.dataIndex - b.dataIndex; // 1. 시드 순서 우선
                if (wA[0] !== wB[0]) return wA[0] - wB[0];   // 2. 해당 시드 내 시스템 Level
                return wA[1] - wB[1];                          // 3. 세부 순서
            }
        });

        STATE.activeColumns = allCols;

        // 3. Header Construction
        theadRow.innerHTML = '';
        const thNum = document.createElement('th');
        thNum.className = 'sticky-col';
        thNum.textContent = 'SABIAN NUMBER';
        theadRow.appendChild(thNum);

        if (STATE.activeColumns.length === 0) {
            const thEmpty = document.createElement('th');
            thEmpty.className = 'empty-state-header';
            thEmpty.textContent = 'NO DATA (Configure Settings)';
            theadRow.appendChild(thEmpty);
        } else {
            STATE.activeColumns.forEach(col => {
                const th = document.createElement('th');
                th.textContent = col.label;
                th.style.whiteSpace = 'nowrap';
                th.style.fontSize = '0.75rem';
                th.style.textAlign = 'center';
                
                // Header Color by Type
                if (col.type === 'conjunction') {
                    th.style.color = '#b9f6ca'; // Greenish
                    th.style.borderBottom = '2px solid #1f5f3a';
                } else {
                    th.style.color = '#49dce1'; // Cyan
                    th.style.borderBottom = '2px solid #004d40';
                }

                // 🚀 [Border Color]: Apply 50 Shades based on Data Index
                // 데이터의 인덱스(0~49)에 해당하는 색상을 밑줄로 사용하여 소유권 명시
                // Asteroids/Lots 컬럼이라도 "누구의 것인지" 식별하기 위해 고유 색상 유지
                const colorIdx = col.dataIndex % 50;
                th.style.borderBottom = `3px solid var(--c1-color-${colorIdx})`;

                theadRow.appendChild(th);
            });
        }

        const thSym = document.createElement('th');
        thSym.textContent = 'SABIAN SYMBOL';
        thSym.style.minWidth = '200px';
        theadRow.appendChild(thSym);

        // 4. Body Construction
        tbody.innerHTML = '';
        const frag = document.createDocumentFragment();

        for (let i = 0; i < 360; i++) {
            const tr = document.createElement('tr');
            tr.id = `tr-${i}`;
            tr.dataset.absDeg = i;
            if ((i % 30) + 1 === 30) tr.classList.add('sign-boundary');

            const tdNum = document.createElement('td');
            tdNum.className = `sticky-col ${getElemClass(i)}`;
            tdNum.innerHTML = getSabianLabel(i);
            tr.appendChild(tdNum);

            if (STATE.activeColumns.length === 0) {
                const tdEmp = document.createElement('td');
                tdEmp.className = 'c1-empty-cell';
                tdEmp.textContent = '...';
                tr.appendChild(tdEmp);
            } else {
                STATE.activeColumns.forEach(col => {
                    const td = document.createElement('td');
                    td.className = 'c1-data-cell';
                    td.id = `cell-${i}-${col.itemId}-${col.subKey}`;
                    tr.appendChild(td);
                });
            }

            const tdSym = document.createElement('td');
            tdSym.className = 'col-sabian-symbol';
            if (STATE.sabianSymbols && STATE.sabianSymbols[i]) {
                const lang = localStorage.getItem('tetramegistus_lang') || 'ko'; // 👈 글로벌 언어 로드
                tdSym.textContent = STATE.sabianSymbols[i][lang] || STATE.sabianSymbols[i]['en'];
            }
            tr.appendChild(tdSym);

            frag.appendChild(tr);
        }
        tbody.appendChild(frag);
    };

// ─────────────────────────────────────────────────────────────
    // 🚀 [CORE 2]: Data Fetching & Rendering (Final Refresh Logic)
    // ─────────────────────────────────────────────────────────────
    
    async function refreshGrid() {
        const overlay = document.getElementById('c1-loading');
        
        // 1. 로딩 시작
        if (overlay) overlay.classList.add('active');

        // 🚀 [Safety Valve]: 3초 뒤에 무조건 로딩 끄기 (무한 로딩 방지)
        // 서버 응답이 없거나 스크립트 에러가 나도 화면이 멈추지 않게 합니다.
        const safetyTimer = setTimeout(() => {
            if (overlay) overlay.classList.remove('active');
        }, 3000);

        try {
            // (1) 기존 테이블 셀 초기화
            if (STATE.activeColumns.length > 0) {
                 STATE.activeColumns.forEach(col => {
                    for (let i = 0; i < 360; i++) {
                        const cell = document.getElementById(`cell-${i}-${col.itemId}-${col.subKey}`);
                        if(cell) { 
                            cell.innerHTML = ''; 
                            cell.className = 'c1-data-cell'; 
                            // 배경색 클래스 등도 초기화됨
                        }
                    }
                });
            }

            // (2) 활성 아이템 수집
            const activeItems = [];
            STATE.data.forEach(item => {
                const conf = STATE.config.entities[item.id];
                if (conf && conf.active && conf.subs && conf.subs.length > 0) {
                    activeItems.push({ 
                        ...item, 
                        active_subs: conf.subs 
                    });
                }
            });

            // 데이터가 없으면 즉시 종료
            if (activeItems.length === 0) {
                if (overlay) overlay.classList.remove('active');
                clearTimeout(safetyTimer); 
                return;
            }

            // (3) API 요청 준비
            let orbValue = 1.5;
            const savedOrb = localStorage.getItem('tetramegistus_orb');
            if (savedOrb) {
                const parsed = parseFloat(savedOrb);
                if (!isNaN(parsed)) orbValue = parsed;
            }

            const savedHouse = localStorage.getItem('tetramegistus_house') || 'placidus';
            const houseMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
            const hSys = houseMap[savedHouse] || 'P'; 

            const payload = {
                items: activeItems,
                ayanamsa: STATE.config.ayanamsa,
                dichotomy: STATE.config.dichotomy,
                h_sys: hSys,  // 👈 하드코딩 제거
                orb: orbValue
            };

            // (4) 서버 통신
            const res = await fetch('/api/astro/c1/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(`Server Error: ${res.status}`);
            
            const json = await res.json();
            
            // (5) 데이터 렌더링
            if (json.results) {
                renderCellData(json.results);       // 셀 데이터 채우기
                renderSabianLines(json.results);    // 사비안 라인 그리기
            }

        } catch (e) {
            console.error("[C1] Refresh Error:", e);
            // 필요 시 에러 알림 추가 가능
        } finally {
            // 2. 정상 완료/에러 발생 상관없이 로딩 해제 🚀
            clearTimeout(safetyTimer); // 안전 타이머 해제
            if (overlay) {
                // '완료됨'을 사용자가 인지할 수 있도록 아주 짧은 지연(0.2초) 후 제거
                setTimeout(() => overlay.classList.remove('active'), 200);
            }
        }
    }

    // 🚀 [New Logic]: Sabian Line Visualization
    function renderSabianLines(results) {
        // Clear old lines first
        for (let i = 0; i < 360; i++) {
            const tr = document.getElementById(`tr-${i}`);
            if (tr) {
                const stickyTd = tr.querySelector('.sticky-col');
                const oldLine = stickyTd.querySelector('.sabian-line-box');
                if (oldLine) oldLine.remove();
            }
        }

        // 🚀 [Whole House 방역]: 하우스 설정 확인
        const isWholeHouse = (localStorage.getItem('tetramegistus_house') === 'whole');

        // Iterate all degrees
        for (let i = 0; i < 360; i++) {
            let activeIndices = new Set(); // Data index (0~49) for thick lines
            let hasMinor = false;          // Flag for thin line

            // Check visible columns at this degree
            STATE.activeColumns.forEach(col => {
                const itemResult = results[col.itemId];
                if (!itemResult) return;
                const degData = itemResult[i];
                if (!degData) return;

                let bodies = degData[col.subKey] || [];
                
                // 🚀 [핵심 필터링]: Whole House일 경우, 라인을 생성할 때만 Cusp 데이터를 제외
                if (isWholeHouse && bodies.length > 0) {
                    bodies = bodies.filter(item => !(item.css && item.css.includes('p-cusp')) && !(item.text && item.text.toLowerCase().includes('cusp')));
                }

                if (bodies.length > 0) {
                    // Check Logic: Minor vs Major
                    const isMinor = ['asteroids', 'arabic', 'davi_ast', 'davi_lot'].includes(col.subKey);
                    
                    if (isMinor) {
                        hasMinor = true;
                    } else {
                        // Major: Use Item Index for Color (0~49)
                        activeIndices.add(col.dataIndex);
                    }
                }
            });

            if (activeIndices.size === 0 && !hasMinor) continue;

            // Draw Lines
            const tr = document.getElementById(`tr-${i}`);
            if (!tr) continue;
            const stickyTd = tr.querySelector('.sticky-col');
            
            const lineBox = document.createElement('div');
            lineBox.className = 'sabian-line-box';

            // 1. Thick Lines (Major items with unique colors)
            // Sort to ensure consistent stacking order
            const sortedIndices = Array.from(activeIndices).sort((a,b) => a - b);
            
            sortedIndices.forEach(idx => {
                const thick = document.createElement('div');
                thick.className = 's-line-thick';
                // 🚀 Apply predefined 50 colors cyclically (just in case >50, though limited)
                thick.style.backgroundColor = `var(--c1-color-${idx % 50})`;
                lineBox.appendChild(thick);
            });

            // 2. Thin Line (Minor items, shared color)
            if (hasMinor) {
                const thin = document.createElement('div');
                thin.className = 's-line-thin';
                lineBox.appendChild(thin);
            }

            stickyTd.appendChild(lineBox);
        }
    }

    function renderCellData(results) {
        STATE.activeColumns.forEach(col => {
            const itemResult = results[col.itemId];
            if (!itemResult) return; 

            for (let i = 0; i < 360; i++) {
                const degData = itemResult[i];
                if (!degData) continue;

                const cell = document.getElementById(`cell-${i}-${col.itemId}-${col.subKey}`);
                if (!cell) continue;

                // 🚀 [Fix 2 & 3]: Advanced House Tinting Logic (Draconic/Ketunic Enabled)
                let bgKey = null;
                
                // 1. 하우스 적용 대상 정의
                if (col.subKey === 'tropical') bgKey = 'tropical_h';
                else if (col.subKey === 'sidereal') bgKey = 'sidereal_h';
                else if (col.subKey === 'comp_main') bgKey = 'comp_main_h';
                else if (col.subKey === 'comp_anti') bgKey = 'comp_anti_h';
                else if (col.subKey === 'davi_tro') bgKey = 'davi_tro_h';
                else if (col.subKey === 'davi_sid') bgKey = 'davi_sid_h';
                // 🚀 [New]: Draconic & Ketunic Tinting
                else if (col.subKey === 'draconic') bgKey = 'draconic_h';
                else if (col.subKey === 'ketunic') bgKey = 'ketunic_h';
                else if (col.subKey === 'davi_dra') bgKey = 'davi_dra_h';
                else if (col.subKey === 'davi_ket') bgKey = 'davi_ket_h';
                
                // 2. 하우스 적용 제외 대상 (Asteroids, Lots 등)
                // 🚀 [Removed]: draconic/ketunic 관련 키들을 제외 목록에서 삭제
                const NO_TINT = ['asteroids', 'arabic', 'davi_ast', 'davi_lot'];
                if (NO_TINT.includes(col.subKey)) bgKey = null;

                // 3. Apply Tint
                if (bgKey && degData[bgKey] && degData[bgKey] > 0) {
                    cell.classList.add(`bg-house-${degData[bgKey]}`);
                }

                const bodies = degData[col.subKey];
                if (bodies && bodies.length > 0) {
                    bodies.forEach(body => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'c1-item-row';

                        const nameSpan = document.createElement('span');
                        let cleanText = body.text.replace(/\*$/, '');
                        nameSpan.textContent = cleanText;
                        
                        let cssClass = body.css || 'p-minor';
                        nameSpan.className = `c1-item-text ${cssClass}`;

                        // Arabic Lots Color
                        if (cssClass.includes('lot') || cssClass.includes('arabic')) {
                            const lookupKey = body.name.replace("Lot of ", "");
                            const def = DEFINITIONS.arabic[body.name] || DEFINITIONS.arabic[lookupKey];
                            if (def && def.category) {
                                nameSpan.className += ` lot-item ${def.category}`;
                            }
                        }

                        // Fixed Stars Marker
                        let suffixHtml = body.html_suffix || '';
                        if (!suffixHtml && body.fixed_stars && body.fixed_stars.length > 0) {
                            const isRoyal = body.fixed_stars.some(s => s.tier === 'royal');
                            const isSpica = body.fixed_stars.some(s => s.tier === 'spica');
                            suffixHtml = (isRoyal || isSpica) ? '<b>*</b>' : '*';
                        }

                        // Interaction
                        if (cssClass.includes('p-minor') || cssClass.includes('lot') || cssClass.includes('arabic')) {
                            itemDiv.classList.add('clickable-meaning');
                            itemDiv.onclick = (e) => {
                                e.stopPropagation();
                                showMeaningPopup(body.name, e.clientX, e.clientY);
                            };
                        }

                        itemDiv.innerHTML = ``;
                        itemDiv.appendChild(nameSpan);
                        if (suffixHtml) {
                            const starSpan = document.createElement('span');
                            starSpan.className = 'star-marker';
                            starSpan.innerHTML = suffixHtml;
                            itemDiv.appendChild(starSpan);
                        }

                        // 🚀 [Fix 1]: Tooltip Formatting (A8 Match: Name | Position)
                        // "undefined (orb?)" 에러 방지를 위해 데이터 존재 여부 확인
                        let pureDms = body.dms ? body.dms.split('\n')[0] : '';
                        let tooltip = `${body.name}: ${pureDms}`;

                        if (body.fixed_stars && body.fixed_stars.length > 0) {
                            const starSet = new Set();
                            const uniqueStars = [];
                            body.fixed_stars.forEach(s => {
                                if (!starSet.has(s.name)) { 
                                    starSet.add(s.name);
                                    uniqueStars.push(s);
                                }
                            });
                            
                            const starTooltip = uniqueStars.map(s => {
                                const starName = s.name || s.star || 'Unknown Star';
                                const starPos = s.position || 'Unknown Pos';
                                return `★ ${starName} | ${starPos}`;
                            }).join('\n');
                            
                            tooltip += '\n' + starTooltip;
                        }
                        itemDiv.title = tooltip;

                        cell.appendChild(itemDiv);
                    });
                }
            }
        });
    }

    function showMeaningPopup(key, x, y) {
        const old = document.getElementById('c1-meaning-popup');
        if (old) old.remove();

        let def = DEFINITIONS.asteroids[key];
        if (!def) {
            const cleanKey = key.replace("Lot of ", "");
            def = DEFINITIONS.arabic[key] || DEFINITIONS.arabic[cleanKey];
        }
        if (!def) return; 

        const lang = localStorage.getItem('tetramegistus_lang') || 'ko';
        // Logic: if KO requested & available, show KO. Else EN.
        // Some defs structure: { meaning: { ko: "...", en: "..." } } (Arabic)
        // Some defs structure: { ko: "...", en: "..." } (Asteroids)
        
        let desc = "";
        if (def.meaning) {
            desc = (lang === 'ko' && def.meaning.ko) ? def.meaning.ko : def.meaning.en;
        } else {
            desc = (lang === 'ko' && def.ko) ? def.ko : def.en;
        }

        const pop = document.createElement('div');
        pop.id = 'c1-meaning-popup';
        pop.innerHTML = `
            <div class="c1-pop-header">${key}</div>
            <div class="c1-pop-body">${desc || "No description."}</div>
        `;
        document.body.appendChild(pop);

        const rect = pop.getBoundingClientRect();
        let finalY = y + 15;
        if (finalY + rect.height > window.innerHeight) finalY = y - rect.height - 10;
        let finalX = Math.min(x, window.innerWidth - rect.width - 10);
        
        pop.style.left = `${finalX}px`;
        pop.style.top = `${finalY}px`;

        setTimeout(() => {
            const close = (e) => {
                if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('click', close); }
            };
            document.addEventListener('click', close);
        }, 50);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. UI Controls
    // ─────────────────────────────────────────────────────────────

    window.c1_setSort = function(mode) {
        STATE.config.sortMode = mode;
        savePersistence();
        renderGlobalControls();
        rebuildC1Table();
        refreshGrid();
    };

    function renderGlobalControls() {
        // 1. Seed | System Switch
        const seedBtn = document.querySelector('.sort-label[data-mode="seed"]');
        const sysBtn = document.querySelector('.sort-label[data-mode="system"]');
        
        if(seedBtn && sysBtn) {
            if(STATE.config.sortMode === 'seed') {
                seedBtn.classList.add('active');
                sysBtn.classList.remove('active');
            } else {
                seedBtn.classList.remove('active');
                sysBtn.classList.add('active');
            }
        }
        
        // 2. Ayanamsa Nav (Update: Tooltip Added)
        const nav = document.getElementById('c1-ayanamsa-nav');
        if (nav) {
            nav.innerHTML = '';
            
            const group = document.createElement('div');
            group.style.display = 'flex';
            group.style.border = '1px solid #999999';
            group.style.borderRadius = '1px';
            group.style.overflow = 'hidden';
            group.style.background = '#000';

            AYANAMSAS.forEach((ay, idx) => {
                const btn = document.createElement('button');
                btn.textContent = ay.label;
                btn.title = ay.desc; // 🚀 Tooltip Added
                
                btn.style.borderRight = '1px solid #FFFFFF';
                if(idx === AYANAMSAS.length -1) btn.style.borderRight = 'none';
                
                btn.style.color = (STATE.config.ayanamsa === ay.id) ? '#49dce1' : '#666';
                btn.style.fontWeight = (STATE.config.ayanamsa === ay.id) ? 'bold' : 'normal';
                btn.style.backgroundColor = (STATE.config.ayanamsa === ay.id) ? 'rgba(124, 255, 155, 0.15)' : 'transparent';
                
                btn.style.padding = '4px 12px';
                btn.style.fontSize = '0.7rem';
                btn.style.cursor = 'pointer';
                btn.style.fontFamily = 'inherit';
                
                btn.onclick = () => {
                    STATE.config.ayanamsa = ay.id;
                    savePersistence();
                    renderGlobalControls();
                    refreshGrid(); 
                };
                group.appendChild(btn);
            });
            nav.appendChild(group);
        }

        // 3. Dichotomy Toggle
        const switchEl = document.getElementById('c1-dicho-switch');
        const knob = document.getElementById('c1-dicho-knob');
        const lTrad = document.getElementById('c1-label-trad');
        const lMod = document.getElementById('c1-label-mod');
        const isMod = STATE.config.dichotomy === 'modern';
        
        if (switchEl) {
            // Click Binding
            switchEl.onclick = window.toggleDichotomy;
            switchEl.style.cursor = 'pointer';

            // Tooltip
            const rulerText = isMod ? 'Modern Rulers (Outer Planets)' : 'Traditional Rulers (7 Planets)';
            switchEl.setAttribute('data-tooltip', rulerText);

            // Visual Logic
            if (knob) {
                // 1) Knob Position
                knob.style.left = isMod ? '18px' : '2px';
                
                // 2) Knob Color (요청하신 부분: 노브만 Gold/Purple)
                knob.style.background = isMod ? '#b388ff' : '#ffd700'; // Purple vs Gold
                knob.style.boxShadow = isMod 
                    ? '0 0 6px rgba(179, 136, 255, 0.6)' 
                    : '0 0 6px rgba(255, 215, 0, 0.6)';

                // 3) Text State (색상은 CSS에서 처리)
                if(lTrad) lTrad.classList.toggle('active', !isMod);
                if(lMod) lMod.classList.toggle('active', isMod);
            }
        }
    }

    window.toggleDichotomy = () => {
        STATE.config.dichotomy = (STATE.config.dichotomy === 'traditional') ? 'modern' : 'traditional';
        savePersistence();
        renderGlobalControls();
        refreshGrid();
    };

    // Persistence Logic
    function savePersistence() {
        // 🚀 [캐시 유통기한]: 현재 시간 기준 + 90일 (넉넉하게 설정)
        const expireMs = Date.now() + (1000 * 60 * 60 * 24 * 90);
        const payload = { data: STATE.data, expiry: expireMs };
        
        localStorage.setItem('c1_data', JSON.stringify(payload));
        localStorage.setItem('c1_config', JSON.stringify(STATE.config));
    }

    function loadPersistence() {
        try {
            const d = localStorage.getItem('c1_data');
            if (d) {
                const parsed = JSON.parse(d);
                // 🚀 [수정]: 유효기간 검증 로직 추가
                if (parsed.expiry && parsed.data) {
                    if (Date.now() < parsed.expiry) {
                        STATE.data = parsed.data;
                    } else {
                        localStorage.removeItem('c1_data'); // 90일 지나면 만료
                        STATE.data = [];
                    }
                } else if (Array.isArray(parsed)) {
                    // 과거 버전(유효기간 없던 시절) 호환성 유지
                    STATE.data = parsed;
                }
            }
            
            const c = localStorage.getItem('c1_config');
            if (c) STATE.config = JSON.parse(c);
            
            let changed = false;
            STATE.data.forEach(item => {
                if(!STATE.config.entities[item.id]) {
                    STATE.config.entities[item.id] = { active: true, subs: ['tropical'] };
                    changed = true;
                }
            });
            if(changed) savePersistence();
        } catch(e) {
            console.warn("[C1] Persistence Load Error", e);
        }
    }

    function getSabianLabel(i) { return `${TROPICAL_SIGNS[Math.floor(i/30)]} ${(i%30)+1}`; }
    function getElemClass(i) { return ELEMENT_CYCLE[Math.floor(i/30)%4]; }
    
    async function fetchSabianSymbols() {
        try {
            const res = await fetch('/api/astro/theory/sabian/definitions');
            if (res.ok) STATE.sabianSymbols = await res.json();
        } catch(e) {}
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Modal & CRUD System
    // ─────────────────────────────────────────────────────────────

    window.c1_openModal = async (type, id=null, pushState=true) => {
        const overlay = document.getElementById('c1-modal-overlay');
        const title = document.getElementById('c1-modal-title');
        const content = document.getElementById('c1-modal-content');
        const btnConfirm = document.getElementById('c1-btn-confirm');
        const btnReturn = overlay.querySelector('.c1-btn-return');

        if (pushState) {
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('modal', type);
            window.history.pushState({modal: type}, '', newUrl);
        }

        overlay.style.display = 'flex';
        content.innerHTML = '';
        content.style.opacity = '0'; 

        if(btnConfirm) {
            btnConfirm.style.display = 'block';
            btnConfirm.textContent = "CONFIRM";
            btnConfirm.onclick = null;
        }
        if(btnReturn) btnReturn.style.display = 'block';

        if (!id && type !== 'edit_list') STATE.editingId = null; 

        try {
            if (type === 'add_natal') {
                title.textContent = STATE.editingId ? "EDIT DATA (NATAL)" : "ADD DATA (NATAL)";
                await loadModuleFromTemplate('c1_add_natal', 'tpl-c1-add-natal');
                if(window.initC1Natal) window.initC1Natal();
                if (STATE.editingId) {
                    const item = STATE.data.find(d => d.id === STATE.editingId);
                    if (item && window.populateC1Natal) window.populateC1Natal(item);
                }
                btnConfirm.textContent = STATE.editingId ? "UPDATE" : "CONFIRM";
                btnConfirm.onclick = () => saveData('natal');
                revealContent();
            } 
            else if (type === 'add_conj') {
                title.textContent = STATE.editingId ? "EDIT DATA (CONJUNCTION)" : "ADD DATA (CONJUNCTION)";
                await loadModuleFromTemplate('c1_add_conjunction', 'tpl-c1-add-conjunction');
                if(window.initC1Conj) window.initC1Conj();
                if (STATE.editingId) {
                    const item = STATE.data.find(d => d.id === STATE.editingId);
                    if (item && window.populateC1Conj) window.populateC1Conj(item);
                }
                btnConfirm.textContent = STATE.editingId ? "UPDATE" : "CONFIRM";
                btnConfirm.onclick = () => saveData('conjunction');
                revealContent();
            }
            else if (type === 'edit_list') {
                title.textContent = "EDIT DATA";
                if(btnConfirm) btnConfirm.style.display = 'none';
                await loadModuleFromTemplate('c1_edit_list', 'tpl-c1-edit-list');
                if(window.initC1EditList) window.initC1EditList();
                revealContent();
            }
            else if (type === 'settings') {
                title.textContent = "SYSTEM SETTINGS";
                if(btnConfirm) {
                    btnConfirm.style.display = 'block';
                    btnConfirm.textContent = "CONFIRM";
                    btnConfirm.onclick = () => c1_closeModal();
                }
                if(btnReturn) btnReturn.style.display = 'none';
                
                await loadModuleFromTemplate('c1_settings', 'tpl-c1-settings');
                if(window.initC1Settings) window.initC1Settings();
                revealContent();
            }
        } catch(e) {
            console.error(e);
            content.innerHTML = `<div style="color:red">Module Load Error: ${e.message}</div>`;
            revealContent();
        }

        function revealContent() {
            requestAnimationFrame(() => {
                content.style.transition = 'opacity 0.2s ease-in';
                content.style.opacity = '1';
            });
        }
    };

    window.c1_closeModal = () => {
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('modal');
        window.history.pushState({}, '', newUrl);
        closeModalInternal();
    };

    function closeModalInternal() {
        document.getElementById('c1-modal-overlay').style.display = 'none';
        STATE.editingId = null; 
        loadPersistence(); 
        rebuildC1Table(); 
        refreshGrid(); 
    }

    async function loadModuleFromTemplate(moduleName, templateId) {
        const ts = Date.now();
        const tpl = document.getElementById(templateId);
        if (!tpl) throw new Error(`Template #${templateId} missing.`);
        
        const cssId = `css-${moduleName}`;
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId; link.rel = 'stylesheet';
            link.href = `/static/world/citrinitas/modules/${moduleName}.css?v=${ts}`;
            document.head.appendChild(link);
        }

        const scriptId = `js-${moduleName}`;
        if (document.getElementById(scriptId)) document.getElementById(scriptId).remove();
        
        const content = document.getElementById('c1-modal-content');
        content.innerHTML = tpl.innerHTML;

        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `/static/world/citrinitas/modules/${moduleName}.js?v=${ts}`;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`JS Load Failed: ${moduleName}`));
            document.body.appendChild(script);
        });
    }

    function saveData(type) {
        // 🚀 [Limit Check]: Max 50 Items
        if (!STATE.editingId && STATE.data.length >= 50) {
            alert("Tabula Full: Maximum 50 items allowed.");
            return;
        }

        let newData = null;
        if (type === 'natal' && typeof window.collectC1NatalData === 'function') {
            newData = window.collectC1NatalData();
        } 
        else if (type === 'conjunction' && typeof window.collectC1ConjunctionData === 'function') {
            newData = window.collectC1ConjunctionData();
        }

        if (newData) {
            if (STATE.editingId) {
                const idx = STATE.data.findIndex(d => d.id === STATE.editingId);
                if (idx !== -1) {
                    STATE.data[idx] = { ...STATE.data[idx], ...newData, id: STATE.editingId, type: type };
                }
                STATE.editingId = null;
            } else {
                const newId = Date.now().toString();
                STATE.data.push({ id: newId, type: type, ...newData });
                
                // 🚀 [수정]: type에 따라 알맞은 초기 디폴트 컬럼을 주입합니다.
                const defaultSubs = (type === 'conjunction') ? ['comp_main', 'davi_tro'] : ['tropical'];
                STATE.config.entities[newId] = { active: true, subs: defaultSubs };
            }
            
            savePersistence();
            
            // 🚀 [추가]: 저장 완료 후 Return 버튼과 동일하게 창을 닫고 Tabula 렌더링 강제 실행!
            if (typeof window.c1_closeModal === 'function') {
                window.c1_closeModal();
            }
        }
    }

    window.c1_edit = (id) => {
        const item = STATE.data.find(d => d.id === id);
        if (!item) return;
        STATE.editingId = id;
        const targetModal = item.type === 'conjunction' ? 'add_conj' : 'add_natal';
        c1_openModal(targetModal, id, false); 
    };

    window.c1_delete = (id) => {
        if(!confirm("Destroy this seed?")) return;
        STATE.data = STATE.data.filter(d => d.id !== id);
        delete STATE.config.entities[id]; 
        savePersistence();
        if (window.initC1EditList) window.initC1EditList();
        rebuildC1Table();
        refreshGrid();
    };
// =======================================================================
    // 🚀 GRIMOIRE MANIFESTATION (Save As & Dynamic Payload)
    // =======================================================================
    window.saveToGrimoire = async function() {
        // 1. Save As 팝업 띄우기
        let customName = prompt("Enter a name for this Citrinitas archive:");
        
        // 취소를 누르거나 빈칸으로 확인을 누르면 저장 중단
        if (!customName || customName.trim() === "") return false;
        
        customName = customName.trim();
        
        // 2. 모듈 Prefix 자동 부착 (C1 모듈이므로 c1_ 접두사)
        const targetName = `c1_${customName}`;

        // 3. 중복 이름 검사
        try {
            const listRes = await fetch('/api/grimoire/list/citrinitas');
            if (listRes.ok) {
                const archives = await listRes.json();
                const isDuplicate = archives.some(a => a.name === targetName);
                
                if (isDuplicate) {
                    alert(`Archive "${targetName}" already exists!\nPlease choose a different name.`);
                    return false; 
                }
            }
        } catch(e) {
            console.warn("Could not fetch archive list for duplicate check", e);
        }

        // 4. Payload 조립 (동적 렌더링을 위한 c1_data 통째로 전송)
        // 4. Payload 조립 (동적 렌더링을 위한 c1_data 통째로 전송)
        
        // 🚀 [수정]: 'whole', 'placidus' 글자를 백엔드가 알아듣는 P, W, K로 변환
        const rawHouse = localStorage.getItem('tetramegistus_house') || 'placidus';
        const hSysMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
        const finalHSys = hSysMap[rawHouse] || 'P';

        const payload = {
            stage: 'citrinitas',
            target_name: targetName,
            language: STATE.lang || 'en',
            metadata: {
                sort_mode: STATE.config.sortMode,
                ayanamsa: STATE.ayanamsa || 'lahiri',
                h_sys: finalHSys, // 🚀 변환된 'W'가 성공적으로 날아갑니다!
                arabic_ruler: localStorage.getItem('tetramegistus_arabic_ruler') || 'traditional',
                
                c1_data: STATE.data,
                c1_config: STATE.config.entities
            }
        };

        // 5. 백엔드 API로 전송
        try {
            console.log(`[GRIMOIRE] Saving Citrinitas Archive as [ ${targetName} ]...`);
            
            // 언어에 따라 c1_en 또는 c1_ko 컴파일러 호출
            const compilerId = `c1_${STATE.lang || 'en'}`;
            const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await res.json();
            
            if (res.ok) {
                console.log(`[GRIMOIRE] Archive [${targetName}] Saved Successfully!`);
                
                // 시각적 성공 피드백 애니메이션
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

})();