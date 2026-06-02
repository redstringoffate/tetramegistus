/* static/mobile/world/citrinitas/modules/c1.js */

(function() {
    let C1_STATE = {
        ayanamsa: 'lahiri',
        sortMode: 'seed',
        dichotomy: 'traditional',
        lang: localStorage.getItem('tetramegistus_lang') || 'en',
        matrixData: null,
        sabianDefs: null,
        // 🚀 [수복 1]: 사전 데이터 저장소 추가
        definitions: { asteroids: null, arabic: null } 
    };

    let c1ToastTimer = null;
    
    const TROPICAL_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const ELEMENT_CYCLE = ['elem-fire', 'elem-earth', 'elem-air', 'elem-water'];

    const SUFFIX_MAP = {
        'asteroids': '_ast', 'tropical': '_T', 'sidereal': '_S',
        'draconic': '_D', 'ketunic': '_K', 'arabic': '_lot',
        'comp_main': 'Comp', 'comp_anti': 'Anti',
        'davi_ast': 'Davi_ast', 'davi_tro': 'Davi_T', 'davi_sid': 'Davi_S',
        'davi_dra': 'Davi_D', 'davi_ket': 'Davi_K', 'davi_lot': 'Davi_lot'
    };

    // 🚀 [수복 1]: 백엔드 캐시를 데워주는 세션 확인 함수 추가 (n8에서 이식)
    async function ensureSession() {
        try {
            let seed = JSON.parse(localStorage.getItem('current_seed')) || JSON.parse(localStorage.getItem('active_seed'));
            if (seed) await fetch('/api/astro/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seed) });
        } catch (e) { console.warn("Session check-in failed", e); }
    }

    // 🚀 [수복 2]: C1_STATE 초기화 시 로컬 스토리지의 기본 상태(Ayanamsa 등) 강제 동기화
    function syncStateFromStorage() {
        const savedAya = localStorage.getItem('tetramegistus_ayanamsa');
        const savedDicho = localStorage.getItem('tetramegistus_dichotomy');
        if (savedAya) C1_STATE.ayanamsa = savedAya;
        if (savedDicho) C1_STATE.dichotomy = savedDicho;
    }

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const modal = document.getElementById('m-c1-modal-overlay');
            const loading = document.getElementById('m-c1-loading');
            if (modal) document.body.appendChild(modal);
            if (loading) document.body.appendChild(loading);

            // 상태 동기화 및 UI 렌더링
            syncStateFromStorage();
            renderAyanamsaBar();
            
            // 🚀 [핵심 수복 3]: 비동기 순차 실행으로 레이스 컨디션 및 백엔드 병목 차단
            showLoading(true); // 로딩창을 일찍 띄웁니다.
            
            // 1단계: 백엔드에 Seed 정보를 던져 메모리(에페메리스)를 Pre-warming
            await ensureSession(); 
            
            // 2단계: 무겁지 않은 텍스트(이론) 데이터를 먼저 확보
            await Promise.all([
                fetchSabianSymbols(),
                fetchDefinitions()
            ]);
            
            // 3단계: 백엔드 준비가 완벽히 끝난 후, 가장 무거운 본 연산 단독 실행
            await requestTabulaData();
            
            bindGlobalInteractions(); 
        } catch (e) {
            console.error("Init Error:", e);
            showLoading(false);
        }
    });

    // 🚀 사전(의미) 데이터 불러오기
    async function fetchDefinitions() {
        try {
            const [resAst, resAra] = await Promise.all([
                fetch('/api/astro/theory/asteroids/definitions'),
                fetch('/api/astro/theory/arabic/definitions')
            ]);
            if (resAst.ok) C1_STATE.definitions.asteroids = await resAst.json();
            if (resAra.ok) C1_STATE.definitions.arabic = await resAra.json();
        } catch(e) {}
    }

    async function fetchSabianSymbols() {
        try {
            let res = await fetch('/api/astro/theory/sabian/definitions'); 
            if (!res.ok) res = await fetch('/api/astro/codex/sabian_symbols'); 
            if(res.ok) C1_STATE.sabianDefs = await res.json();
        } catch(e) {}
    }

    function renderAyanamsaBar() {
        const bar = document.getElementById('m-c1-ayanamsa-bar');
        if (!bar) return;
        const AYANAMSAS = [
            { id: 'lahiri', label: 'LAHIRI' }, { id: 'raman', label: 'RAMAN' },
            { id: 'kp', label: 'KP' }, { id: 'fagan-bradley', label: 'FAGAN' },
            { id: 'yukteswar', label: 'YUKTESWAR' }
        ];
        bar.innerHTML = AYANAMSAS.map(ay => `
            <button class="m-tab ${C1_STATE.ayanamsa === ay.id ? 'active' : ''}" 
                    onclick="m_c1_switchAyanamsa('${ay.id}')">${ay.label}</button>
        `).join('');
    }

    window.m_c1_switchAyanamsa = async function(id) {
        C1_STATE.ayanamsa = id;
        renderAyanamsaBar();
        await requestTabulaData();
    };

    window.m_c1_switchSortMode = async function(mode) {
        C1_STATE.sortMode = mode;
        document.getElementById('m-c1-btn-sort-seed').classList.toggle('active', mode === 'seed');
        document.getElementById('m-c1-btn-sort-system').classList.toggle('active', mode === 'system');
        await requestTabulaData();
    };

    window.m_c1_switchDichotomy = async function() {
        C1_STATE.dichotomy = C1_STATE.dichotomy === 'traditional' ? 'modern' : 'traditional';
        const switchEl = document.querySelector('.m-toggle-switch');
        if (switchEl) switchEl.classList.toggle('modern-active', C1_STATE.dichotomy === 'modern');
        document.getElementById('m-c1-label-trad').classList.toggle('active', C1_STATE.dichotomy === 'traditional');
        document.getElementById('m-c1-label-mod').classList.toggle('active', C1_STATE.dichotomy === 'modern');
        await requestTabulaData();
    };

    async function requestTabulaData() {
        showLoading(true);
        try {
            let rawData = [];
            try {
                const parsed = JSON.parse(localStorage.getItem('c1_data'));
                rawData = parsed && parsed.data ? parsed.data : (Array.isArray(parsed) ? parsed : []);
            } catch(e) {}

            let config = null;
            try { config = JSON.parse(localStorage.getItem('c1_config')); } catch(e) {}

            const activeItems = [];
            rawData.forEach(item => {
                const conf = config && config.entities ? config.entities[item.id] : null;
                if (conf && conf.active && conf.subs && conf.subs.length > 0) {
                    activeItems.push({ ...item, active_subs: conf.subs });
                }
            });

            if (activeItems.length === 0) {
                C1_STATE.matrixData = null;
                buildTabulaTable();
                showLoading(false);
                return;
            }

            let orbValue = 1.5;
            const savedOrb = localStorage.getItem('tetramegistus_orb');
            if (savedOrb && !isNaN(parseFloat(savedOrb))) orbValue = parseFloat(savedOrb);

            const savedHouse = localStorage.getItem('tetramegistus_house') || 'placidus';
            const houseMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
            const hSys = houseMap[savedHouse] || 'P';

            const payload = {
                items: activeItems,
                ayanamsa: C1_STATE.ayanamsa,
                dichotomy: C1_STATE.dichotomy,
                h_sys: hSys,
                orb: orbValue
            };

            let res = await fetch('/api/astro/c1/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                let json = await res.json();
                C1_STATE.matrixData = json.results || null;
            }
        } catch(e) {
            console.error("Fetch Data Error:", e);
        } finally {
            buildTabulaTable();
            showLoading(false); 
        }
    }

    function buildTabulaTable() {
        try {
            const head = document.getElementById('m-c1-table-head');
            const body = document.getElementById('m-c1-table-body');
            if (!head || !body) return;

            head.innerHTML = '';
            body.innerHTML = '';

            let rawData = [];
            try {
                const parsed = JSON.parse(localStorage.getItem('c1_data'));
                rawData = parsed && parsed.data ? parsed.data : (Array.isArray(parsed) ? parsed : []);
            } catch(e) {}

            let config = null;
            try { config = JSON.parse(localStorage.getItem('c1_config')); } catch(e) {}
            
            let activeCols = [];

            if (config && config.entities && rawData.length > 0) {
                rawData.forEach((item, index) => {
                    const conf = config.entities[item.id];
                    if (conf && conf.active && Array.isArray(conf.subs)) {
                        conf.subs.forEach(subKey => {
                            let suffix = SUFFIX_MAP[subKey] || `_${subKey}`;
                            let headerLabel = "";
                            
                            if (subKey.startsWith('comp_') || subKey.startsWith('davi_')) {
                                headerLabel = `${item.name}<br><span style="color:#888; font-size:0.85em;">(${suffix})</span>`;
                            } else {
                                headerLabel = `${item.name}${suffix}`;
                            }
                            
                            activeCols.push({ id: item.id, sub: subKey, label: headerLabel, dataIndex: index });
                        });
                    }
                });
            }

            activeCols.sort((a, b) => {
                const SUB_WEIGHTS = {
                    'asteroids': [1, 1], 'davi_ast': [1, 2],
                    'tropical': [2, 1], 'comp_main': [2, 2], 'comp_anti': [2, 3], 'davi_tro': [2, 4],
                    'sidereal': [3, 1], 'davi_sid': [3, 2],
                    'draconic': [4, 1], 'davi_dra': [4, 2],
                    'ketunic': [5, 1], 'davi_ket': [5, 2],
                    'arabic': [6, 1], 'davi_lot': [6, 2]
                };
                const wA = SUB_WEIGHTS[a.sub] || [99, 99];
                const wB = SUB_WEIGHTS[b.sub] || [99, 99];
                
                if (C1_STATE.sortMode === 'system') {
                    if (wA[0] !== wB[0]) return wA[0] - wB[0];
                    if (a.dataIndex !== b.dataIndex) return a.dataIndex - b.dataIndex;
                    return wA[1] - wB[1];
                } else {
                    if (a.dataIndex !== b.dataIndex) return a.dataIndex - b.dataIndex;
                    if (wA[0] !== wB[0]) return wA[0] - wB[0];
                    return wA[1] - wB[1];
                }
            });

            let hRow = `<tr><th class="m-c1-sabian-num">SABIAN NUMBER</th>`;
            if (activeCols.length === 0) {
                hRow += `<th style="color:#555;">[ NO DATA ]</th>`;
            } else {
                activeCols.forEach(col => {
                    const colorVar = `var(--c1-color-${col.dataIndex % 50})`;
                    hRow += `<th style="border-bottom: 3px solid ${colorVar};">${col.label}</th>`; 
                });
            }
            hRow += `<th>SABIAN SYMBOL</th></tr>`;
            head.innerHTML = hRow;

            const isWholeHouse = (localStorage.getItem('tetramegistus_house') === 'whole');

            for (let i = 0; i < 360; i++) {
                let tr = document.createElement('tr');
                
                let signIdx = Math.floor(i / 30);
                let signDeg = (i % 30) + 1;
                let signName = TROPICAL_SIGNS[signIdx];
                let elemClass = ELEMENT_CYCLE[signIdx % 4];

                if (signDeg === 30) tr.classList.add('sign-boundary');

                const tdNum = document.createElement('td');
                tdNum.className = `m-c1-sabian-num ${elemClass}`;
                tdNum.innerHTML = `${signName} ${signDeg}`;
                tr.appendChild(tdNum);

                let activeIndices = new Set();
                let hasMinor = false;

                if (activeCols.length === 0) {
                    const tdEmp = document.createElement('td');
                    tdEmp.style.color = '#444';
                    tdEmp.textContent = '-';
                    tr.appendChild(tdEmp);
                } else {
                    activeCols.forEach(col => {
                        let td = document.createElement('td');
                        let hasData = false;

                        if (C1_STATE.matrixData && C1_STATE.matrixData[col.id]) {
                            let degData = C1_STATE.matrixData[col.id][i]; 
                            
                            if (degData) {
                                // 🚀 [하우스 컬러 완벽 수복]: N8과 동일하게 >0 검사 제거 및 범용 키 적용
                                let hIdx = degData[`${col.sub}_h`] || degData['tropical_h'] || degData['main_h'];
                                const NO_TINT = ['asteroids', 'arabic', 'davi_ast', 'davi_lot', 'minor_asteroids', 'arabic_lots'];

                                if (!NO_TINT.includes(col.sub) && hIdx && hIdx !== '-') {
                                    td.classList.add(`bg-house-${hIdx}`);
                                }

                                let bodies = degData[col.sub];
                                if (bodies && bodies.length > 0) {
                                    let filteredBodies = bodies;
                                    if (isWholeHouse) {
                                        filteredBodies = bodies.filter(item => !(item.css && item.css.includes('p-cusp')) && !(item.text && item.text.toLowerCase().includes('cusp')));
                                    }

                                    if (filteredBodies.length > 0) {
                                        hasData = true;
                                        const isMinor = ['asteroids', 'arabic', 'davi_ast', 'davi_lot'].includes(col.sub);
                                        if (isMinor) hasMinor = true;
                                        else activeIndices.add(col.dataIndex);
                                    }

                                    bodies.forEach(body => {
                                        const itemDiv = document.createElement('div');
                                        let cssClass = body.css || 'p-minor';
                                        itemDiv.className = `m-c1-item-row ${cssClass}`;
                                        
                                        let cleanText = body.text.replace(/\*$/, '');
                                        itemDiv.innerHTML = `<span>${cleanText}</span>`;
                                        
                                        let suffixHtml = body.html_suffix || '';
                                        if (!suffixHtml && body.fixed_stars && body.fixed_stars.length > 0) {
                                            const isRoyal = body.fixed_stars.some(s => s.tier === 'royal');
                                            const isSpica = body.fixed_stars.some(s => s.tier === 'spica');
                                            suffixHtml = (isRoyal || isSpica) ? '<b>*</b>' : '*';
                                        }
                                        if (suffixHtml) {
                                            itemDiv.innerHTML += `<span class="star-marker">${suffixHtml}</span>`;
                                        }

                                        // 클릭 이벤트로 피드백 엔진 호출
                                        itemDiv.onclick = (e) => {
                                            e.stopPropagation();
                                            triggerC1ItemFeedback(body, cssClass);
                                        };
                                        td.appendChild(itemDiv);
                                    });
                                }
                            }
                        }
                        
                        if (!hasData) {
                            td.innerHTML += `<span style="color:#444;">-</span>`;
                        }
                        
                        tr.appendChild(td);
                    });
                }

                if (activeIndices.size > 0 || hasMinor) {
                    const lineBox = document.createElement('div');
                    lineBox.className = 'sabian-line-box';
                    
                    const sortedIndices = Array.from(activeIndices).sort((a,b) => a - b);
                    sortedIndices.forEach(idx => {
                        const thick = document.createElement('div');
                        thick.className = 's-line-thick';
                        thick.style.backgroundColor = `var(--c1-color-${idx % 50})`;
                        lineBox.appendChild(thick);
                    });
                    if (hasMinor) {
                        const thin = document.createElement('div');
                        thin.className = 's-line-thin';
                        lineBox.appendChild(thin);
                    }
                    tdNum.appendChild(lineBox); 
                }

                let sabianText = "-";
                let degForSabian = i + 1;
                if (C1_STATE.sabianDefs && C1_STATE.sabianDefs[degForSabian]) {
                    sabianText = C1_STATE.sabianDefs[degForSabian][C1_STATE.lang] || C1_STATE.sabianDefs[degForSabian]['en'];
                }
                
                const tdSym = document.createElement('td');
                tdSym.className = 'm-c1-sabian-text';
                tdSym.textContent = sabianText;
                tr.appendChild(tdSym);

                body.appendChild(tr);
            }
        } catch (e) {
            console.error("Render Table Error:", e);
        }
    }

    // 🚀 [수복 3]: N8의 강력한 다중 피드백 엔진 (Toast + Popover 동시 타격) 완벽 이식
    function triggerC1ItemFeedback(body, cssClass) {
        if (!body) return;
        
        let targetDms = body.raw_dms || body.dms || "";
        let isDay = /\[Day Lord\]/i.test(targetDms);
        let isHour = /\[Hour Lord\]/i.test(targetDms);
        targetDms = targetDms.replace(/\[Day Lord\]/gi, '').replace(/\[Hour Lord\]/gi, '');

        let extractedStarInfos = [];
        if (targetDms.includes('★')) {
            let tokens = targetDms.replace(/[|:]/g, '★').split('★').map(t => t.trim()).filter(t => t !== '');
            if (tokens.length > 0) {
                targetDms = tokens[0];
                for (let i = 1; i < tokens.length; i += 2) {
                    let starName = tokens[i];
                    let starDms = tokens[i+1] || "";
                    extractedStarInfos.push(`★ ${starName} : ${starDms}`);
                }
            }
        }

        let toastHtml = `<div style="font-weight:bold; color:#06F8FF; font-size:1.1em; text-transform:uppercase; margin-bottom:4px;">${body.name}</div>`;
        if (isDay && isHour) toastHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord] [Hour Lord]</strong><br>`;
        else if (isDay) toastHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord]</strong><br>`;
        else if (isHour) toastHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Hour Lord]</strong><br>`;

        let infoArr = [];
        if (targetDms) infoArr.push(targetDms);
        if (body.dignity && body.dignity !== '-') infoArr.push(body.dignity);
        if (body.ruler && body.ruler !== '-') infoArr.push(`Lord: ${body.ruler}`);
        
        if (infoArr.length > 0) {
            toastHtml += `<div style="color:#ddd; font-size:0.85rem; margin-bottom:6px; margin-top:4px;">${infoArr.join(' | ')}</div>`;
        }

        if (body.fixed_stars && body.fixed_stars.length > 0) {
            toastHtml += `<div style="border-top:1px solid #333; margin-top:6px; padding-top:6px; text-align:center; display:inline-block; width:100%; box-sizing:border-box;">`;
            body.fixed_stars.forEach(star => {
                const sName = star.star_name || star.name || "Unknown Star";
                const sOrb = star.orb !== undefined ? star.orb.toFixed(2) : "0.00";
                let sInfo = star.meaning_ko || star.meaning || star.nature || "";
                if (!sInfo) {
                    let found = extractedStarInfos.find(t => t.toLowerCase().includes(sName.toLowerCase()));
                    if (found) {
                        let regex = new RegExp(`★?\\s*${sName}[\\s\\-\\:\\(]*`, 'i');
                        let infoPart = found.replace(regex, '').replace(/\)$/, '').trim();
                        if (infoPart) sInfo = infoPart;
                    }
                }
                const infoStr = sInfo ? ` | <span style="color:#999999;">${sInfo}</span>` : "";
                toastHtml += `<div style="font-size:0.75rem; color:#aaa; margin-bottom:3px; line-height:1.2;">
                    <span style="color:#fff; font-weight:bold;">*${sName}</span>${infoStr} | Orb: ${sOrb}°
                </div>`;
            });
            toastHtml += `</div>`;
        }

        // 토스트 출력
        let toast = document.getElementById('m-c1-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'm-c1-toast';
            toast.className = 'm-toast-hidden';
            document.body.appendChild(toast);
        }
        toast.innerHTML = toastHtml;
        requestAnimationFrame(() => toast.classList.remove("m-toast-hidden"));
        clearTimeout(c1ToastTimer);
        c1ToastTimer = setTimeout(() => toast.classList.add("m-toast-hidden"), 4000);

        // 🚀 팝업(Meaning) 출력 로직 
        let meaning = null;
        const lang = C1_STATE.lang;
        
        if ((cssClass.includes('p-minor') || cssClass.includes('asteroid')) && C1_STATE.definitions.asteroids && C1_STATE.definitions.asteroids[body.name]) {
            meaning = C1_STATE.definitions.asteroids[body.name][lang] || C1_STATE.definitions.asteroids[body.name]['en'];
        } else if ((cssClass.includes('lot') || cssClass.includes('arabic')) && C1_STATE.definitions.arabic) {
            const lookupKey = body.name.replace("Lot of ", "");
            const def = C1_STATE.definitions.arabic[body.name] || C1_STATE.definitions.arabic[lookupKey];
            if (def && def.meaning) {
                meaning = def.meaning[lang] || def.meaning['en'];
            }
        }

        if (meaning) {
            showC1Popup(body.name, meaning);
        }
    }

    function showC1Popup(title, text) {
        let popover = document.getElementById('m-c1-popover');
        if (!popover) {
            popover = document.createElement('div');
            popover.id = 'm-c1-popover';
            popover.className = 'c1-popover-box';
            document.body.appendChild(popover);
        }
        popover.innerHTML = `
            <div style="font-weight:bold; margin-bottom:10px; color:#49dce1; border-bottom:1px solid #49dce1; padding-bottom:5px; text-transform:uppercase; text-align:center;">
                ${title}
            </div>
            <div style="line-height:1.5; font-size:0.85rem; color:#ddd; text-align:center;">
                ${text.replace(/\\n/g, '<br>')}
            </div>
        `;
        popover.classList.add('active');
    }

    // 🚀 배경 클릭 시 열려있는 팝업을 닫는 전역 이벤트
    function bindGlobalInteractions() {
        document.addEventListener('click', (e) => {
            const popover = document.getElementById('m-c1-popover');
            // 클릭한 대상이 데이터 행(row)이 아닐 때만 팝업을 닫음
            if (popover && popover.classList.contains('active') && !e.target.closest('.m-c1-item-row')) {
                popover.classList.remove('active');
            }
        });
    }

    async function m_loadModuleFromTemplate(moduleName, templateId) {
        const tpl = document.getElementById(templateId);
        const content = document.getElementById('m-c1-modal-content');
        if (!tpl || !content) return;

        const cssId = `css-${moduleName}`;
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId; link.rel = 'stylesheet';
            link.href = `/static/mobile/world/citrinitas/modules/${moduleName}.css?v=${Date.now()}`;
            document.head.appendChild(link);
        }

        content.innerHTML = tpl.innerHTML;

        const scriptId = `js-${moduleName}`;
        if (document.getElementById(scriptId)) {
            document.getElementById(scriptId).remove();
        }
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `/static/mobile/world/citrinitas/modules/${moduleName}.js?v=${Date.now()}`;
            script.onload = resolve;
            script.onerror = resolve; 
            document.body.appendChild(script);
        });
    }

    window.m_c1_openModal = async function(type, isEdit = false) {
        if (!isEdit) {
            sessionStorage.removeItem('m_c1_editing_id');
        }

        const overlay = document.getElementById('m-c1-modal-overlay');
        const title = document.getElementById('m-c1-modal-title');
        const confirmBtn = document.getElementById('m-c1-btn-confirm');
        const returnBtn = document.getElementById('m-c1-btn-return') || document.querySelector('.m-c1-btn-return');
        
        const container = document.querySelector('.m-c1-container');
        if (container) container.style.setProperty('filter', 'none', 'important');

        if (overlay) overlay.style.display = 'flex';
        
        if (confirmBtn) {
            if (type === 'edit_list') confirmBtn.style.display = 'none';
            else { confirmBtn.style.display = 'block'; confirmBtn.textContent = isEdit ? "UPDATE" : "CONFIRM"; }
        }

        if (returnBtn) {
            if (type === 'settings') returnBtn.style.display = 'none';
            else returnBtn.style.display = 'block';
        }
        
        if (type === 'settings') {
            title.textContent = "SYSTEM SETTINGS";
            await m_loadModuleFromTemplate('c1_settings', 'tpl-m-c1-settings');
            if (window.initC1Settings) window.initC1Settings();
        } else if (type === 'edit_list') {
            title.textContent = "EDIT DATA";
            await m_loadModuleFromTemplate('c1_edit_list', 'tpl-m-c1-edit-list');
            if (window.m_initC1EditList) window.m_initC1EditList();
        } else if (type === 'add_natal') {
            title.textContent = isEdit ? "EDIT NATAL SPECTRUM" : "ADD DATA (NATAL)";
            await m_loadModuleFromTemplate('c1_add_natal', 'tpl-m-c1-add-natal');
            if (window.m_initC1Natal) window.m_initC1Natal();
        } else if (type === 'add_conj') {
            title.textContent = isEdit ? "EDIT CONJUNCTION" : "ADD CONJUNCTION";
            await m_loadModuleFromTemplate('c1_add_conjunction', 'tpl-m-c1-add-conjunction');
            if (window.m_initC1Conj) window.m_initC1Conj();
        }
    };

    window.m_c1_closeModal = function() {
        const overlay = document.getElementById('m-c1-modal-overlay');
        if (overlay) overlay.style.display = 'none';
        requestTabulaData(); 
    };

    window.rebuildC1Table = function() { buildTabulaTable(); };
    window.refreshGrid = function() { requestTabulaData(); };

    function showLoading(isActive) {
        const loader = document.getElementById('m-c1-loading');
        if (loader) {
            if (isActive) loader.classList.add('active');
            else loader.classList.remove('active');
        }
    }

})();

/* =======================================================================
   🚀 GRIMOIRE MANIFESTATION (Mobile C1 - Pure Logic for world.js)
   ======================================================================= */

// 마도서(Grimoire) 저장 마스터 함수 (토스트 제거, 원래 이펙트 복구판)
window.saveToGrimoire = async function() {
    // [0단계] Seed 검증
    const activeSeed = JSON.parse(localStorage.getItem('active_seed'));
    if (!activeSeed) {
        alert("SYSTEM ERROR\nNo active seed found.");
        return false;
    }

    // [1단계] Save As 팝업 (모바일 네이티브 prompt)
    let customName = prompt("Enter a name for this Citrinitas archive:");
    if (!customName || customName.trim() === "") return false;
    customName = customName.trim();
    const targetName = `c1_${customName}`;

    // [2단계] 중복 이름 검사
    try {
        const listRes = await fetch('/api/grimoire/list/citrinitas');
        if (listRes.ok) {
            const archives = await listRes.json();
            const isDuplicate = archives.some(a => a.name === targetName);
            if (isDuplicate) {
                alert(`DUPLICATE ERROR\nArchive "${targetName}" already exists!`);
                return false; 
            }
        }
    } catch(e) {
        console.warn("Could not fetch archive list for duplicate check", e);
    }

    // [3단계] Payload 조립
    let c1Data = null;
    let c1Config = null;
    try { c1Data = JSON.parse(localStorage.getItem('c1_data')); } catch(e){}
    try { c1Config = JSON.parse(localStorage.getItem('c1_config')); } catch(e){}

    if (!c1Data || !c1Config) {
        alert("SYSTEM ERROR\nC1 LocalStorage Data is missing.");
        return false;
    }

    const rawHouse = localStorage.getItem('tetramegistus_house') || 'placidus';
    const finalHSys = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' }[rawHouse] || 'P';
    const currentLang = localStorage.getItem('tetramegistus_lang') || 'ko';
    const seedId = activeSeed.id || activeSeed.idx || "unknown";

    // 현재 렌더링된 UI에서 Ayanamsa와 SortMode 역추적
    const activeAyaBtn = document.querySelector('#m-c1-ayanamsa-bar .m-tab.active');
    const currentAyanamsa = activeAyaBtn ? activeAyaBtn.innerText.toLowerCase() : 'lahiri';
    const isSortSystem = document.getElementById('m-c1-btn-sort-system') && document.getElementById('m-c1-btn-sort-system').classList.contains('active');
    const currentSortMode = isSortSystem ? 'system' : 'seed';

    const payload = {
        seed_id: seedId,        
        stage: 'Citrinitas',       
        target_name: targetName,
        language: currentLang,
        seed: activeSeed, 
        metadata: {
            sort_mode: currentSortMode,
            ayanamsa: currentAyanamsa,
            h_sys: finalHSys, 
            arabic_ruler: localStorage.getItem('tetramegistus_arabic_ruler') || 'traditional',
            c1_data: c1Data.data || c1Data, 
            c1_config: c1Config.entities || c1Config
        }
    };

    // [4단계] 백엔드 API로 전송
    try {
        const compilerId = `c1_${currentLang}`;
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        
        if (res.ok) {
            // 조용히 true만 반환하면 world.js가 넘겨받아 멋진 결계 애니메이션을 실행합니다.
            return true; 
        } else {
            alert(`MANIFESTATION FAILED\n${result.detail || result.error || 'Unknown Error'}`);
            throw new Error(result.detail || result.error);
        }
    } catch (e) {
        alert("NETWORK ERROR\nError occurred during Grimoire Save.");
        throw e;
    }
};