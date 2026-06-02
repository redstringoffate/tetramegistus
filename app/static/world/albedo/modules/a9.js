/* static/world/albedo/modules/a9.js */

(function() {
    console.log("🚀 [A9] Synchronicum Engine Initialized (Full Version).");

    const STATE = {
        mode: 'zodiac',        // 'zodiac' or 'jyotish'
        subMode: 'davison',    // 'davison' or 'synastry'
        ayanamsa: 'lahiri',
        segment: 1, 
        data: [],       
        meta: { A: {}, B: {}, Davison: {} }, 
        isRendering: false
    };

    // 🚀 [변경 1-1: URL에서 초기 상태를 읽어오는 함수 추가]
    function loadStateFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const modeParam = params.get('mode');
        const subModeParam = params.get('subMode');
        const ayaParam = params.get('ayanamsa');
        const segParam = params.get('seg');

        if (modeParam && ['zodiac', 'jyotish'].includes(modeParam)) STATE.mode = modeParam;
        if (subModeParam && ['davison', 'synastry'].includes(subModeParam)) STATE.subMode = subModeParam;
        if (ayaParam) STATE.ayanamsa = ayaParam;
        if (segParam) STATE.segment = parseInt(segParam) || 1;
    }

    // 🚀 [변경 1-2: 현재 상태를 URL 주소창에 실시간 반영하는 함수 추가]
    function updateUrl() {
        const url = new URL(window.location);
        url.searchParams.set('module', 'a9');
        url.searchParams.set('mode', STATE.mode);
        
        if (STATE.mode === 'zodiac') {
            url.searchParams.set('subMode', STATE.subMode);
            url.searchParams.set('seg', STATE.segment);
            url.searchParams.delete('ayanamsa');
        } else {
            url.searchParams.set('ayanamsa', STATE.ayanamsa);
            url.searchParams.delete('subMode');
            url.searchParams.delete('seg');
        }
        window.history.pushState({}, '', url);
    }

    // 🚀 [변경 1-1: URL에서 초기 상태를 읽어오는 함수 추가]
    function loadStateFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const modeParam = params.get('mode');
        const subModeParam = params.get('subMode');
        const ayaParam = params.get('ayanamsa');
        const segParam = params.get('seg');

        if (modeParam && ['zodiac', 'jyotish'].includes(modeParam)) STATE.mode = modeParam;
        if (subModeParam && ['davison', 'synastry'].includes(subModeParam)) STATE.subMode = subModeParam;
        if (ayaParam) STATE.ayanamsa = ayaParam;
        if (segParam) STATE.segment = parseInt(segParam) || 1;
    }

    // 🚀 [변경 1-2: 현재 상태를 URL 주소창에 실시간 반영하는 함수 추가]
    function updateUrl() {
        const url = new URL(window.location);
        url.searchParams.set('module', 'a9');
        url.searchParams.set('mode', STATE.mode);
        
        if (STATE.mode === 'zodiac') {
            url.searchParams.set('subMode', STATE.subMode);
            url.searchParams.set('seg', STATE.segment);
            url.searchParams.delete('ayanamsa');
        } else {
            url.searchParams.set('ayanamsa', STATE.ayanamsa);
            url.searchParams.delete('subMode');
            url.searchParams.delete('seg');
        }
        window.history.pushState({}, '', url);
    }

    // 🎨 [기호 맵핑: N9과 100% 동일]
    const MAP = {
        "Sun": { s: "☉", c: "glow-sun" }, "Moon": { s: "☽", c: "glow-moon" },
        "Mars": { s: "♂", c: "glow-mars" }, "Mercury": { s: "☿", c: "glow-mercury" },
        "Jupiter": { s: "♃", c: "glow-jupiter" }, "Venus": { s: "♀", c: "glow-venus" },
        "Saturn": { s: "♄", c: "glow-saturn" }, "Rahu": { s: "☊", c: "glow-rahu" }, "Ketu": { s: "☋", c: "glow-ketu" },
        "North Node": { s: "☊", c: "glow-rahu" }, "South Node": { s: "☋", c: "glow-ketu" },
        "Aries": { s: "♈︎", c: "glow-fire" }, "Taurus": { s: "♉︎", c: "glow-earth" }, "Gemini": { s: "♊︎", c: "glow-air" },
        "Cancer": { s: "♋︎", c: "glow-water" }, "Leo": { s: "♌︎", c: "glow-fire" }, "Virgo": { s: "♍︎", c: "glow-earth" },
        "Libra": { s: "♎︎", c: "glow-air" }, "Scorpio": { s: "♏︎", c: "glow-water" }, "Sagittarius": { s: "♐︎", c: "glow-fire" },
        "Capricorn": { s: "♑︎", c: "glow-earth" }, "Aquarius": { s: "♒︎", c: "glow-air" }, "Pisces": { s: "♓︎", c: "glow-water" },
        "♈︎": { s: "♈︎", c: "glow-fire" }, "♉︎": { s: "♉︎", c: "glow-earth" }, "♊︎": { s: "♊︎", c: "glow-air" },
        "♋︎": { s: "♋︎", c: "glow-water" }, "♌︎": { s: "♌︎", c: "glow-fire" }, "♍︎": { s: "♍︎", c: "glow-earth" },
        "♎︎": { s: "♎︎", c: "glow-air" }, "♏︎": { s: "♏︎", c: "glow-water" }, "♐︎": { s: "♐︎", c: "glow-fire" },
        "♑︎": { s: "♑︎", c: "glow-earth" }, "♒︎": { s: "♒︎", c: "glow-air" }, "♓︎": { s: "♓︎", c: "glow-water" }
    };

    const AYANAMSAS = [
        { id: 'lahiri', label: 'Lahiri', desc: 'Standard Vedic' }, 
        { id: 'raman', label: 'Raman', desc: 'B.V. Raman' },
        { id: 'kp', label: 'KP', desc: 'Krishnamurti Paddhati' }, 
        { id: 'fagan-bradley', label: 'Fagan-Bradley', desc: 'Fagan-Bradley' },
        { id: 'yukteswar', label: 'Yukteswar', desc: 'Sri Yukteswar' }
    ];

    function formatTooltip(text) {
        if (!text) return '';
        let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const symMap = { '☉': 'glow-sun', '☽': 'glow-moon', '♂': 'glow-mars', '☿': 'glow-mercury', '♃': 'glow-jupiter', '♀': 'glow-venus', '♄': 'glow-saturn', '☊': 'glow-rahu', '☋': 'glow-ketu' };
        for (const [sym, cls] of Object.entries(symMap)) {
            const displaySym = (sym === '♀' || sym === '♂') ? sym + '\uFE0E' : sym;
            html = html.split(sym).join(`<span class="${cls}" style="font-weight:bold; font-size:1.1em;">${displaySym}</span>`);
        }
        return html;
    }

    let tooltipEl = null;
    function showTooltip(html, x, y) {
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'n9-hover-tooltip'; 
            document.body.appendChild(tooltipEl);
        }
        tooltipEl.innerHTML = html; tooltipEl.style.display = 'block';
        let fY = y - tooltipEl.offsetHeight - 15; let fX = x + 15;
        if (fY < 0) fY = y + 15;
        tooltipEl.style.left = `${fX}px`; tooltipEl.style.top = `${fY}px`;
    }

    function bindTooltips() {
        document.body.addEventListener('mouseover', (e) => {
            const t = e.target.closest('.n9-hoverable');
            if (t) showTooltip(formatTooltip(t.getAttribute('data-tooltip')), e.clientX, e.clientY);
        });
        document.body.addEventListener('mouseout', (e) => {
            if (e.target.closest('.n9-hoverable')) if(tooltipEl) tooltipEl.style.display = 'none';
        });
    }

    const renderSym = (key, tooltip = null) => {
        if (!key || key === '-') return '<span class="sym-none">-</span>';
        let entry = MAP[key] || Object.values(MAP).find(v => v.s === key);
        const sym = entry ? entry.s : key; const cls = entry ? entry.c : 'n9-text';
        if (tooltip) return `<span class="n9-sym ${cls} n9-hoverable" data-tooltip="${tooltip.replace(/"/g, '&quot;')}">${sym}</span>`;
        return `<span class="n9-sym ${cls}">${sym}</span>`;
    };

    function showLoader() {
        const l = document.getElementById('a9-loading'); const c = document.getElementById('a9-timeline-table');
        if (c) c.style.visibility = 'hidden';
        if (l) { l.style.display = 'flex'; requestAnimationFrame(() => l.style.opacity = '1'); }
    }
    function hideLoader() {
        const l = document.getElementById('a9-loading'); const c = document.getElementById('a9-timeline-table');
        if (c) c.style.visibility = 'visible';
        if (l) { l.style.opacity = '0'; setTimeout(() => l.style.display = 'none', 400); }
    }

    async function fetchTimeline() {
        if (STATE.isRendering) return;
        showLoader(); 
        
        try {
            const url = `/api/astro/synchronicum/reading?mode=${STATE.mode}&subMode=${STATE.subMode}&ayanamsa=${STATE.ayanamsa}`;
            const response = await fetch(url);
            const resData = await response.json();
            
            if (resData.status === 'success' || resData.data) {
                const coreData = resData.data || resData; 
                STATE.data = coreData.timeline;
                STATE.meta = coreData.meta || { A: {}, B: {}, Davison: {} };
                
                renderSkeleton(); 
                renderBodyAsync(); 
            } else {
                console.error("A9 Engine Error:", resData.error || resData.message);
                hideLoader();
            }
        } catch (e) { 
            console.error("Fetch Error:", e);
            hideLoader(); 
        }
    }

    function renderSkeleton() {
        const thead = document.getElementById('a9-table-head');
        if (!thead) return;

        const m = STATE.meta || {};
        const getM = (sys, cat, key) => (m[sys] && m[sys][cat] && m[sys][cat][key]) ? m[sys][cat][key] : '';

        const dateHeader = `
            <th rowspan="3" class="th-top-cat n9-date-col-header">
                <div class="n9-header-date-label">DATE</div>
                <div class="n9-seg-control">
                    <div class="n9-seg-row">
                        <button class="n9-seg-btn" data-seg="1">I</button><button class="n9-seg-btn" data-seg="2">II</button><button class="n9-seg-btn" data-seg="3">III</button>
                    </div>
                    <div class="n9-seg-row">
                        <button class="n9-seg-btn" data-seg="4">IV</button><button class="n9-seg-btn" data-seg="5">V</button><button class="n9-seg-btn" data-seg="6">VI</button>
                    </div>
                </div>
            </th>`;

        if (STATE.mode === 'zodiac' && STATE.subMode === 'davison') {
            thead.innerHTML = `<tr>${dateHeader}
                <th colspan="9" class="th-top-cat th-white-title">ZODIACAL RELEASING</th>
                <th colspan="2" class="th-top-cat th-white-title">FIRDARIA</th>
                <th rowspan="3" class="th-top-cat th-prof th-red-title n9-hoverable" data-tooltip="Ascendant | ${m.Davison?.ascendant||''}">PROFECTIONS</th>
                <th rowspan="2" colspan="5" class="th-top-cat th-transit th-gray-title">TRANSITS</th></tr>
            <tr>
                <th colspan="3" class="th-mid-cat th-spirit-head n9-hoverable" data-tooltip="Spirit | ${getM('Davison', 'lots', 'Spirit')}">SPIRIT</th>
                <th colspan="3" class="th-mid-cat th-fortune-head n9-hoverable" data-tooltip="Fortune | ${getM('Davison', 'lots', 'Fortune')}">FORTUNE</th>
                <th colspan="3" class="th-mid-cat th-eros-head n9-hoverable" data-tooltip="Eros | ${getM('Davison', 'lots', 'Eros')}">EROS</th>
                <th rowspan="2" class="th-mid-cat th-firdaria n9-hoverable" data-tooltip="Sect | ${m.Davison?.sect||''}">MAIN</th><th rowspan="2" class="th-mid-cat th-firdaria">SUB</th>
            </tr>
            <tr><th class="th-bot-cat th-spirit">L1</th><th class="th-bot-cat th-spirit">L2</th><th class="th-bot-cat th-spirit">L3</th><th class="th-bot-cat th-fortune">L1</th><th class="th-bot-cat th-fortune">L2</th><th class="th-bot-cat th-fortune">L3</th><th class="th-bot-cat th-eros">L1</th><th class="th-bot-cat th-eros">L2</th><th class="th-bot-cat th-eros">L3</th>
            <th class="th-bot-cat th-transit"><span class="transit-symbol-ju">♃</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-sa">♄</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-ur">♅</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-ne">♆</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-pl">♇</span></th></tr>`;
        } 
        else if (STATE.mode === 'zodiac' && STATE.subMode === 'synastry') {
            thead.innerHTML = `<tr>${dateHeader}
                <th colspan="4" class="th-top-cat th-spirit-title">SPIRIT</th>
                <th colspan="4" class="th-top-cat th-fortune-title">FORTUNE</th>
                <th colspan="4" class="th-top-cat th-eros-title">EROS</th>
                <th colspan="4" class="th-top-cat th-white-title">FIRDARIA</th>
                <th colspan="2" class="th-top-cat th-red-title">PROFECTIONS</th>
                <th rowspan="2" colspan="5" class="th-top-cat th-transit th-gray-title">TRANSITS</th></tr>
            <tr>
                <th colspan="2" class="th-mid-cat th-syn-a n9-hoverable" data-tooltip="A_Spirit | ${getM('A','lots','Spirit')}">A</th><th colspan="2" class="th-mid-cat th-syn-b n9-hoverable" data-tooltip="B_Spirit | ${getM('B','lots','Spirit')}">B</th>
                <th colspan="2" class="th-mid-cat th-syn-a n9-hoverable" data-tooltip="A_Fortune | ${getM('A','lots','Fortune')}">A</th><th colspan="2" class="th-mid-cat th-syn-b n9-hoverable" data-tooltip="B_Fortune | ${getM('B','lots','Fortune')}">B</th>
                <th colspan="2" class="th-mid-cat th-syn-a n9-hoverable" data-tooltip="A_Eros | ${getM('A','lots','Eros')}">A</th><th colspan="2" class="th-mid-cat th-syn-b n9-hoverable" data-tooltip="B_Eros | ${getM('B','lots','Eros')}">B</th>
                <th colspan="2" class="th-mid-cat th-syn-a n9-hoverable" data-tooltip="A_Sect | ${m.A?.sect||''}">A</th><th colspan="2" class="th-mid-cat th-syn-b n9-hoverable" data-tooltip="B_Sect | ${m.B?.sect||''}">B</th>
                <th class="th-mid-cat th-syn-a n9-hoverable" data-tooltip="A_Asc | ${m.A?.ascendant||''}">A</th><th class="th-mid-cat th-syn-b n9-hoverable" data-tooltip="B_Asc | ${m.B?.ascendant||''}">B</th>
            </tr>
            <tr>
                <th class="th-bot-cat th-spirit">L1</th><th class="th-bot-cat th-spirit">L2</th><th class="th-bot-cat th-spirit">L1</th><th class="th-bot-cat th-spirit">L2</th>
                <th class="th-bot-cat th-fortune">L1</th><th class="th-bot-cat th-fortune">L2</th><th class="th-bot-cat th-fortune">L1</th><th class="th-bot-cat th-fortune">L2</th>
                <th class="th-bot-cat th-eros">L1</th><th class="th-bot-cat th-eros">L2</th><th class="th-bot-cat th-eros">L1</th><th class="th-bot-cat th-eros">L2</th>
                <th class="th-bot-cat th-firdaria">M</th><th class="th-bot-cat th-firdaria">S</th><th class="th-bot-cat th-firdaria">M</th><th class="th-bot-cat th-firdaria">S</th>
                <th class="th-bot-cat th-prof">P</th><th class="th-bot-cat th-prof">P</th>
                <th class="th-bot-cat th-transit"><span class="transit-symbol-ju">♃</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-sa">♄</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-ur">♅</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-ne">♆</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-pl">♇</span></th>
            </tr>`;
        } 
        else if (STATE.mode === 'jyotish') {
            thead.innerHTML = `<tr>
                <th class="th-top-cat n9-date-col-header" rowspan="2" style="vertical-align: middle;">
                    <div class="n9-header-date-label" style="margin: 0;">DATE</div>
                </th>
                <th colspan="3" class="th-top-cat th-syn-a n9-hoverable" data-tooltip="A_Moon | ${m.A?.moon_position || ''}">A</th>
                <th colspan="3" class="th-top-cat th-syn-dav n9-hoverable" data-tooltip="Dav_Moon | ${m.Davison?.moon_position || ''}">CONIUNCTIO</th>
                <th colspan="3" class="th-top-cat th-syn-b n9-hoverable" data-tooltip="B_Moon | ${m.B?.moon_position || ''}">B</th></tr>
            <tr>
                <th class="th-bot-cat th-mahadasha">L1</th><th class="th-bot-cat th-mahadasha">L2</th><th class="th-bot-cat th-mahadasha">L3</th>
                <th class="th-bot-cat th-antardasha">L1</th><th class="th-bot-cat th-antardasha">L2</th><th class="th-bot-cat th-antardasha">L3</th>
                <th class="th-bot-cat th-pratyantardasha">L1</th><th class="th-bot-cat th-pratyantardasha">L2</th><th class="th-bot-cat th-pratyantardasha">L3</th>
            </tr>`;
        }

        if (STATE.mode === 'zodiac') {
            document.querySelectorAll('.n9-seg-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation(); if(STATE.isRendering) return;
                    showLoader(); 
                    STATE.segment = parseInt(btn.dataset.seg);
                    updateUrl(); // 🚀 [변경 1-3: 세그먼트 버튼 클릭 시 주소지 업데이트]
                    updateUI();
                    setTimeout(() => { renderBodyAsync(); }, 50); 
                };
            });
            updateSegmentActiveUI(); 
        }
    }

    function updateSegmentActiveUI() {
        document.querySelectorAll('.n9-seg-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.seg) === STATE.segment);
        });
    }

    function createVeilCell(isVeil, text = "", colspan = 1) {
        if (!isVeil) return null;
        const textClass = (text && text.includes("Light")) ? "veil-light" : "veil-consummatum";
        return `<td class="a9-veil-cell" colspan="${colspan}">
                    ${text ? `<div class="veil-text-box ${textClass}">${text}</div>` : ''}
                </td>`;
    }

    function renderBodyAsync() {
        const tbody = document.getElementById('a9-table-body');
        if (!tbody || !STATE.data) return;
        
        tbody.innerHTML = '';
        STATE.isRendering = true;

        let filteredData = [];
        if (STATE.mode === 'zodiac') {
            const startAge = (STATE.segment - 1) * 12;
            const endAge = startAge + 12;
            filteredData = STATE.data.filter(row => {
                const age = Number(row.age);
                return age >= startAge && age < endAge;
            });
        } else {
            filteredData = STATE.data;
        }

        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        
        let todayRowIndex = -1;
        for (let i = 0; i < filteredData.length; i++) {
            const rowDate = (filteredData[i].date || "").split('T')[0];
            // 🚀 JS가 임의로 계산하지 않고, 백엔드가 보내준 진짜 next_date를 그대로 사용!
            const nextDate = filteredData[i].next_date; 
            
            if (rowDate <= todayStr && todayStr < nextDate) {
                todayRowIndex = i;
                break;
            }
        }

        let index = 0;
        const chunkSize = 60; 
        const total = filteredData.length; 

        function renderChunk() {
            try {
                const fragment = document.createDocumentFragment();
                const end = Math.min(index + chunkSize, total);
                for (let i = index; i < end; i++) {
                    const isTodayRow = (i === todayRowIndex);
                    fragment.appendChild(createA9RowElement(filteredData[i], isTodayRow));
                }
                tbody.appendChild(fragment);
                index = end;
                
                if (index < total) {
                    requestAnimationFrame(renderChunk);
                } else {
                    STATE.isRendering = false;
                    hideLoader(); 
                }
            } catch (err) {
                console.error("A9 Render Loop Error:", err);
                STATE.isRendering = false;
                hideLoader();
            }
        }
        requestAnimationFrame(renderChunk);
    }

    function createA9RowElement(row, isTodayRow) {
        const tr = document.createElement('tr');
        tr.className = 'n9-row';
        
        if (isTodayRow) tr.classList.add('n9-today-row');
        
        const dateStr = row.date.split('T')[0];
        let html = `<td class="n9-date-col">${dateStr}</td>`;

        const getNatal = (sys, pName) => {
            const sysMap = { 'a': 'A', 'b': 'B', 'dav': 'Davison' };
            const sysKey = sysMap[sys];
            if (STATE.meta[sysKey] && STATE.meta[sysKey].natal_planets && STATE.meta[sysKey].natal_planets[pName]) {
                return STATE.meta[sysKey].natal_planets[pName];
            }
            return null;
        };

        const getJyoNatal = (sys, pName) => {
            const sysMap = { 'a': 'A', 'b': 'B', 'dav': 'Davison' };
            const sysKey = sysMap[sys];
            if (!pName || pName === '-') return null;
            const trop = STATE.meta[sysKey]?.tropical_planets?.[pName] || '';
            const sid = STATE.meta[sysKey]?.sidereal_planets?.[pName] || '';
            if (trop && sid) return `${trop}\n${sid}`;
            return trop || sid || null;
        };

        if (STATE.mode === 'zodiac') {
            if (STATE.subMode === 'davison') {
                if (row.veil_d) {
                    html += createVeilCell(true, row.veil_text_dav, 17);
                } else {
                    const d = row.dav;
                    const mkZR = (lot) => {
                        const z = d.zr[lot];
                        const t1 = z.l1_lb ? "Loosing of the Bonds (LB)" : null;
                        const t2 = z.l2_lb ? "Loosing of the Bonds (LB)" : null;
                        const t3 = z.l3_lb ? "Loosing of the Bonds (LB)" : null;
                        return `<td class="n9-cell-zr ${z.l1_lb?'n9-cell-lb':''}">${renderSym(z.l1, t1)}</td>
                                <td class="n9-cell-zr ${z.l2_lb?'n9-cell-lb':''}">${renderSym(z.l2, t2)}</td>
                                <td class="n9-cell-zr ${z.l3_lb?'n9-cell-lb':''}">${renderSym(z.l3, t3)}</td>`;
                    };
                    html += mkZR('spirit') + mkZR('fortune') + mkZR('eros');
                    html += `<td class="n9-cell-firdaria">${renderSym(d.firdaria.main, getNatal('dav', d.firdaria.main))}</td>
                             <td class="n9-cell-firdaria">${renderSym(d.firdaria.sub, getNatal('dav', d.firdaria.sub))}</td>
                             <td class="n9-cell-prof">${renderSym(d.profections)}</td>`;
                    ['Jupiter','Saturn','Uranus','Neptune','Pluto'].forEach(p => {
                        const t = row.transits[p] || {};
                        html += `<td class="n9-cell-transit">${renderSym(t.sign, t.full_text)}</td>`;
                    });
                }
            } else {
                const mkSynZR = (lot, isFirstLot) => {
                    let cells = "";
                    ['a', 'b'].forEach(p => {
                        if (row[`veil_${p}`]) {
                            const vText = isFirstLot ? row[`veil_text_${p}`] : null;
                            cells += createVeilCell(true, vText, 2);
                        } else {
                            const z = row[p].zr[lot];
                            const t1 = z.l1_lb ? "Loosing of the Bonds (LB)" : null;
                            const t2 = z.l2_lb ? "Loosing of the Bonds (LB)" : null;
                            cells += `<td class="n9-cell-zr ${z.l1_lb?'n9-cell-lb':''}">${renderSym(z.l1, t1)}</td>
                                      <td class="n9-cell-zr ${z.l2_lb?'n9-cell-lb':''}">${renderSym(z.l2, t2)}</td>`;
                        }
                    });
                    return cells;
                };
                
                html += mkSynZR('spirit', true) + mkSynZR('fortune', false) + mkSynZR('eros', false);
                
                ['a', 'b'].forEach(p => {
                    if (row[`veil_${p}`]) html += createVeilCell(true, null, 2);
                    else html += `<td class="n9-cell-firdaria">${renderSym(row[p].firdaria.main, getNatal(p, row[p].firdaria.main))}</td>
                                  <td class="n9-cell-firdaria">${renderSym(row[p].firdaria.sub, getNatal(p, row[p].firdaria.sub))}</td>`;
                });
                
                ['a', 'b'].forEach(p => {
                    if (row[`veil_${p}`]) html += createVeilCell(true, null, 1);
                    else html += `<td class="n9-cell-prof">${renderSym(row[p].profections)}</td>`;
                });
                
                ['Jupiter','Saturn','Uranus','Neptune','Pluto'].forEach(p => {
                    const t = row.transits[p] || {};
                    html += `<td class="n9-cell-transit">${renderSym(t.sign, t.full_text)}</td>`;
                });
            }
        } else {
            ['a', 'dav', 'b'].forEach(k => {
                const isVeil = row[`veil_${k === 'dav' ? 'd' : k}`];
                const textKey = k === 'dav' ? 'veil_text_dav' : `veil_text_${k}`;
                
                if (isVeil) {
                    html += createVeilCell(true, row[textKey], 3);
                } else {
                    const d = row[k];
                    html += `<td class="n9-cell-dasha-l1" style="color:#8700FF">${renderSym(d.l1, getJyoNatal(k, d.l1))}</td>
                             <td class="n9-cell-dasha-l2" style="color:#BE75FF">${renderSym(d.l2, getJyoNatal(k, d.l2))}</td>
                             <td class="n9-cell-dasha-l3" style="color:#EBD4FF">${renderSym(d.l3, getJyoNatal(k, d.l3))}</td>`;
                }
            });
        }

        tr.innerHTML = html;
        return tr;
    }

    function bindControls() {
        const mainSw = document.getElementById('a9-dicho-switch');
        const subSw = document.getElementById('a9-sub-switch');
        
        mainSw.onclick = () => {
            if (STATE.isRendering) return; 
            showLoader();
            STATE.mode = (STATE.mode === 'zodiac') ? 'jyotish' : 'zodiac';
            STATE.segment = 1;
            updateUrl(); // 🚀 [변경 1-4: 메인 스위치 클릭 시 주소지 업데이트]
            updateUI(); 
            setTimeout(() => { renderSkeleton(); fetchTimeline(); }, 50);
        };
        
        subSw.onclick = () => {
            if (STATE.isRendering || STATE.mode === 'jyotish') return; 
            showLoader();
            STATE.subMode = (STATE.subMode === 'davison') ? 'synastry' : 'davison';
            STATE.segment = 1;
            updateUrl(); // 🚀 [변경 1-5: 서브 스위치 클릭 시 주소지 업데이트]
            updateUI(); 
            setTimeout(() => { renderSkeleton(); fetchTimeline(); }, 50);
        };

        const bar = document.getElementById('a9-ayanamsa-bar');
        if(bar) {
            bar.innerHTML = '';
            AYANAMSAS.forEach(a => {
                const btn = document.createElement('button');
                btn.className = 'n9-aya-btn';
                btn.dataset.aya = a.id; 
                if(STATE.ayanamsa === a.id) btn.classList.add('active');
                btn.textContent = a.label;
                btn.title = a.desc;
                btn.onclick = (e) => {
                    if (STATE.isRendering) return;
                    e.stopPropagation(); 
                    STATE.ayanamsa = a.id; 
                    updateUrl(); // 🚀 [변경 1-6: Ayanamsa 버튼 클릭 시 주소지 업데이트]
                    updateUI(); 
                    fetchTimeline();
                };
                bar.appendChild(btn);
            });
        }
        updateUI();
    }

    function updateUI() {
        const mainKnob = document.getElementById('a9-dicho-knob');
        const subSw = document.getElementById('a9-sub-switch');
        const ayaBar = document.getElementById('a9-ayanamsa-bar');
        
        if (STATE.mode === 'zodiac') {
            if(mainKnob) mainKnob.style.left = '3px';
            if(subSw) subSw.style.display = 'flex'; 
            if(ayaBar) ayaBar.classList.add('hidden');
            document.getElementById('a9-label-zodiac').classList.add('active');
            document.getElementById('a9-label-jyotish').classList.remove('active');
            
            const subKnob = document.getElementById('a9-sub-knob');
            if (STATE.subMode === 'davison') {
                if(subKnob) subKnob.style.left = '3px';
                document.getElementById('a9-label-davison').classList.add('active');
                document.getElementById('a9-label-synastry').classList.remove('active');
            } else {
                if(subKnob) subKnob.style.left = '20px';
                document.getElementById('a9-label-davison').classList.remove('active');
                document.getElementById('a9-label-synastry').classList.add('active');
            }
        } else {
            if(mainKnob) mainKnob.style.left = '20px';
            if(subSw) subSw.style.display = 'none'; 
            if(ayaBar) ayaBar.classList.remove('hidden');
            document.getElementById('a9-label-zodiac').classList.remove('active');
            document.getElementById('a9-label-jyotish').classList.add('active');
            
            document.querySelectorAll('.n9-aya-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.aya === STATE.ayanamsa);
            });
        }

        // 🚀 [추가]: Duodecim (Segment) 버튼 활성화 상태 동기화
        document.querySelectorAll('.n9-seg-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.seg) === STATE.segment);
        });
    }

    window.initA9 = function() {
        loadStateFromUrl(); // 🚀 [변경 1-7: 진입 시 주소창 파라미터 읽기]
        updateUrl();        // 🚀 [변경 1-8: 빈 주소로 들어왔을 때 디폴트 파라미터 꽂아주기]
        bindControls(); 
        bindTooltips(); 
        renderSkeleton(); 
        fetchTimeline();  
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(window.initA9, 50);
    } else {
        document.addEventListener('DOMContentLoaded', window.initA9);
    }

/* ─────────────────────────────────────────────────────────────
       🚀 GRIMOIRE MANIFESTATION (A9 -> Archive)
       (Albedo 듀얼 시드 규격 적용 및 다중 컴파일러 라우팅 완벽 수복)
    ───────────────────────────────────────────────────────────── */
    window.saveToGrimoire = async function() {
        // 1. 🚀 [수복 완료]: Albedo 전용 시드 조합 가져오기 (A2, A8과 100% 동일)
        const activeDavison = JSON.parse(localStorage.getItem('active_davison'));
        const activeComposite = JSON.parse(localStorage.getItem('active_composite'));
        const albedoStation = activeDavison || activeComposite || {};

        let s1 = albedoStation.seed1;
        let s2 = albedoStation.seed2;
        let seedId = albedoStation.id;

        if (!s1 || !s2) {
            alert("Dual seeds required for Synchronicum. Please return to the A1 Hub and select both seeds.");
            return false;
        }

        if (!seedId) {
            let id1 = s1.idx || s1.id || "unknown1";
            let id2 = s2.idx || s2.id || "unknown2";
            seedId = `${id1}_${id2}`;
        }

        let s1Name = s1.name || "A";
        let s2Name = s2.name || "B";
        let targetName = `${s1Name} & ${s2Name}`;

        const lang = localStorage.getItem('tetramegistus_lang') || 'en';

        // 2. 🚀 모드에 따른 컴파일러 ID 동적 라우팅
        let compilerId = 'a9'; // 기본값: Zodiac + Davison
        
        if (STATE.mode === 'jyotish') {
            compilerId = 'a9_vd';
        } else if (STATE.mode === 'zodiac' && STATE.subMode === 'synastry') {
            compilerId = 'a9_synastry';
        }

        // 3. 🚀 Payload 조립 (A8 Albedo 규격)
        const payload = {
            seed_id: seedId,
            stage: 'albedo', 
            target_name: targetName,
            language: lang,
            metadata: {
                view_mode: STATE.mode,
                sub_mode: STATE.subMode,
                ayanamsa: STATE.ayanamsa,
                segment: STATE.segment, // 12년 구간 필터링용
                sys_tab: 'tropical' 
            },
            seed: { seed1: s1, seed2: s2 } // A8 규격: 두 시드를 통째로 포장
        };

        try {
            console.log(`[GRIMOIRE] Manifesting A9 Archive using [ ${compilerId} ]...`, payload);
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
})();