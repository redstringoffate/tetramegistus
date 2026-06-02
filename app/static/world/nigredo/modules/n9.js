/* static/world/nigredo/modules/n9.js */

(function() {
    console.log("🚀 [N9] Chronomantia Engine Restored (Custom Neon Tooltips).");

    const STATE = {
        mode: 'zodiac',
        ayanamsa: 'lahiri',
        segment: 1, 
        data: [],       
        meta: {}, 
        isRendering: false
    };

    const MAP = {
        "Sun": { s: "☉", c: "glow-sun" }, "Moon": { s: "☽", c: "glow-moon" },
        "Mars": { s: "♂", c: "glow-mars" }, "Mercury": { s: "☿", c: "glow-mercury" },
        "Jupiter": { s: "♃", c: "glow-jupiter" }, "Venus": { s: "♀", c: "glow-venus" },
        "Saturn": { s: "♄", c: "glow-saturn" },
        "Rahu": { s: "☊", c: "glow-rahu" }, "Ketu": { s: "☋", c: "glow-ketu" },
        "North Node": { s: "☊", c: "glow-rahu" }, "South Node": { s: "☋", c: "glow-ketu" },
        "Aries": { s: "♈︎", c: "glow-fire" }, "Leo": { s: "♌︎", c: "glow-fire" }, "Sagittarius": { s: "♐︎", c: "glow-fire" },
        "Taurus": { s: "♉︎", c: "glow-earth" }, "Virgo": { s: "♍︎", c: "glow-earth" }, "Capricorn": { s: "♑︎", c: "glow-earth" },
        "Gemini": { s: "♊︎", c: "glow-air" }, "Libra": { s: "♎︎", c: "glow-air" }, "Aquarius": { s: "♒︎", c: "glow-air" },
        "Cancer": { s: "♋︎", c: "glow-water" }, "Scorpio": { s: "♏︎", c: "glow-water" }, "Pisces": { s: "♓︎", c: "glow-water" },
        "♈︎": { s: "♈︎", c: "glow-fire" }, "♉︎": { s: "♉︎", c: "glow-earth" }, "♊︎": { s: "♊︎", c: "glow-air" },
        "♋︎": { s: "♋︎", c: "glow-water" }, "♌︎": { s: "♌︎", c: "glow-fire" }, "♍︎": { s: "♍︎", c: "glow-earth" },
        "♎︎": { s: "♎︎", c: "glow-air" }, "♏︎": { s: "♏︎", c: "glow-water" }, "♐︎": { s: "♐︎", c: "glow-fire" },
        "♑︎": { s: "♑︎", c: "glow-earth" }, "♒︎": { s: "♒︎", c: "glow-air" }, "♓︎": { s: "♓︎", c: "glow-water" }
    };

    const AYANAMSAS = [
        { id: 'lahiri', label: 'Lahiri', desc: 'Standard Vedic (Chitra Paksha)' }, 
        { id: 'raman', label: 'Raman', desc: 'B.V. Raman' },
        { id: 'kp', label: 'KP', desc: 'Krishnamurti Paddhati' }, 
        { id: 'fagan-bradley', label: 'Fagan-Bradley', desc: 'Fagan-Bradley' },
        { id: 'yukteswar', label: 'Yukteswar', desc: 'Sri Yukteswar' }
    ];

    // 🌟 [Tooltips Engine]: 기호를 네온 텍스트로 치환
    function formatTooltipContent(text) {
        if (!text) return '';
        let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        const symMap = {
            '☉': 'glow-sun', '☽': 'glow-moon', '♂': 'glow-mars', '☿': 'glow-mercury',
            '♃': 'glow-jupiter', '♀': 'glow-venus', '♄': 'glow-saturn',
            '☊': 'glow-rahu', '☋': 'glow-ketu'
        };
        
        for (const [sym, cls] of Object.entries(symMap)) {
            // \uFE0E (Text Variation Selector)를 붙여 OS가 금성/화성을 강제로 이모지로 만드는 것을 억제
            const displaySym = (sym === '♀' || sym === '♂') ? sym + '\uFE0E' : sym;
            html = html.split(sym).join(`<span class="${cls}" style="font-weight:bold; font-size:1.1em;">${displaySym}</span>`);
        }
        return html;
    }

    let tooltipEl = null;
    function showN9Tooltip(contentHtml, x, y) {
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'n9-hover-tooltip';
            document.body.appendChild(tooltipEl);
        }
        tooltipEl.innerHTML = contentHtml;
        tooltipEl.style.display = 'block';
        positionN9Tooltip(x, y);
    }

    function positionN9Tooltip(x, y) {
        if (!tooltipEl || tooltipEl.style.display === 'none') return;
        const rect = tooltipEl.getBoundingClientRect();
        let finalY = y - rect.height - 15;
        let finalX = x + 15;
        if (finalY < 0) finalY = y + 15; 
        if (finalX + rect.width > window.innerWidth) finalX = x - rect.width - 15;
        tooltipEl.style.left = `${finalX}px`;
        tooltipEl.style.top = `${finalY}px`;
    }

    function hideN9Tooltip() {
        if (tooltipEl) tooltipEl.style.display = 'none';
    }

    function bindTooltips() {
        document.body.addEventListener('mouseover', (e) => {
            const target = e.target.closest('.n9-hoverable');
            if (target) {
                const text = target.getAttribute('data-tooltip');
                showN9Tooltip(formatTooltipContent(text), e.clientX, e.clientY);
            }
        });
        document.body.addEventListener('mousemove', (e) => {
            const target = e.target.closest('.n9-hoverable');
            if (target) positionN9Tooltip(e.clientX, e.clientY);
        });
        document.body.addEventListener('mouseout', (e) => {
            const target = e.target.closest('.n9-hoverable');
            if (target) hideN9Tooltip();
        });
    }

    // 🛠️ 기호 렌더링 시 title 대신 data-tooltip 사용
    const renderSym = (key, tooltipText = null) => {
        if (!key || key === '-') return '<span class="sym-none">-</span>';
        let entry = MAP[key] || Object.values(MAP).find(v => v.s === key);
        const symbol = entry ? entry.s : key;
        const className = entry ? entry.c : 'n9-text';
        
        if (tooltipText) {
            const safeText = tooltipText.replace(/"/g, '&quot;');
            return `<span class="n9-sym ${className} n9-hoverable" data-tooltip="${safeText}">${symbol}</span>`;
        }
        return `<span class="n9-sym ${className}">${symbol}</span>`;
    };

    function showN9Loader() {
        const loading = document.getElementById('n9-loading');
        const container = document.getElementById('n9-result-container');
        if (container) container.style.visibility = 'hidden'; 
        if (loading) {
            loading.style.display = 'flex';
            loading.style.opacity = '1';
            loading.innerHTML = `<div class="n9-loading-text">ACCESSING CHRONOMANTIA</div>`;
        }
    }

    function hideN9Loader() {
        const loading = document.getElementById('n9-loading');
        const container = document.getElementById('n9-result-container');
        if (container) container.style.visibility = 'visible';
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => { loading.style.display = 'none'; }, 400);
        }
    }

    function loadStateFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const modeParam = params.get('mode');
        const ayaParam = params.get('ayanamsa');
        const segParam = params.get('seg');
        if (modeParam && ['zodiac', 'jyotish'].includes(modeParam)) STATE.mode = modeParam;
        if (ayaParam) STATE.ayanamsa = ayaParam;
        if (segParam) STATE.segment = parseInt(segParam) || 1;
    }

    function updateUrl() {
        const url = new URL(window.location);
        url.searchParams.set('mode', STATE.mode);
        if (STATE.mode === 'zodiac') url.searchParams.set('seg', STATE.segment);
        else url.searchParams.delete('seg');
        if (STATE.mode === 'jyotish') url.searchParams.set('ayanamsa', STATE.ayanamsa);
        else url.searchParams.delete('ayanamsa');
        window.history.pushState({}, '', url);
    }

    window.initN9 = function() {
        loadStateFromUrl(); 
        renderSkeleton(); 
        bindControls();
        bindTooltips(); // 🚀 커스텀 툴팁 이벤트 바인딩
        fetchTimeline();  
    };

    async function fetchTimeline() {
        if (STATE.isRendering) return;
        showN9Loader(); 
        try {
            const rawSeed = localStorage.getItem('active_seed');
            if (!rawSeed) { hideN9Loader(); return; }
            const seed = JSON.parse(rawSeed);

            const response = await fetch('/api/astro/chronomantia/timeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seed: seed, mode: STATE.mode, ayanamsa: STATE.ayanamsa })
            });
            const resData = await response.json();
            
            if (resData.status === 'success') {
                STATE.data = resData.data.timeline;
                STATE.meta = resData.data.meta || {};
                renderSkeleton(); 
                renderBodyAsync(); 
            } else {
                hideN9Loader();
            }
        } catch (e) {
            console.error("Fetch Error:", e);
            hideN9Loader();
        }
    }

    function renderBodyAsync() {
        const tbody = document.getElementById('n9-table-body');
        if (!tbody) return;
        
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
            
            // 🚀 [수정]: 쪼개진 배열에서 계산하지 않고, 백엔드가 주입해준 진짜 next_date 사용
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
                    fragment.appendChild(createRowElement(filteredData[i], isTodayRow));
                }
                tbody.appendChild(fragment);
                index = end;
                
                if (index < total) {
                    requestAnimationFrame(renderChunk);
                } else {
                    STATE.isRendering = false;
                    if(STATE.mode === 'zodiac') updateSegmentActiveUI();
                    hideN9Loader(); 
                }
            } catch (err) {
                console.error("Render Loop Error:", err);
                STATE.isRendering = false;
                hideN9Loader();
            }
        }
        requestAnimationFrame(renderChunk);
    }

    function createRowElement(row, isTodayRow) {
        const dateStr = (row && row.date) ? row.date.split('T')[0] : '-';
        const tr = document.createElement('tr');
        tr.className = 'n9-row';

        if (isTodayRow) tr.classList.add('n9-today-row');

        const getNatal = (pName) => {
            if (STATE.meta.natal_planets && STATE.meta.natal_planets[pName]) return STATE.meta.natal_planets[pName];
            return null;
        };

        const getJyotishDualTooltip = (pName) => {
            if (!pName || pName === '-') return null;
            const trop = STATE.meta.tropical_planets ? STATE.meta.tropical_planets[pName] : '';
            const sid = STATE.meta.sidereal_planets ? STATE.meta.sidereal_planets[pName] : '';
            if (trop && sid) return `${trop}\n${sid}`;
            return trop || sid || null;
        };

        if (STATE.mode === 'zodiac') {
            const mkZR = (lot) => {
                const z = row.zr[lot];
                const l1Class = z.l1_lb ? 'n9-cell-lb' : '';
                const l2Class = z.l2_lb ? 'n9-cell-lb' : '';
                const l3Class = z.l3_lb ? 'n9-cell-lb' : '';
                
                // 🚀 [FIX]: LB 상태일 때만 커스텀 툴팁에 띄울 텍스트를 정의합니다.
                const t1 = z.l1_lb ? "Loosing of the Bonds (LB)" : null;
                const t2 = z.l2_lb ? "Loosing of the Bonds (LB)" : null;
                const t3 = z.l3_lb ? "Loosing of the Bonds (LB)" : null;
                
                // 🚀 [FIX]: renderSym의 두 번째 인자로 툴팁 텍스트를 다시 넘겨줍니다.
                return `<td class="n9-cell-zr ${l1Class}">${renderSym(z.l1, t1)}</td>
                        <td class="n9-cell-zr ${l2Class}">${renderSym(z.l2, t2)}</td>
                        <td class="n9-cell-zr ${l3Class}">${renderSym(z.l3, t3)}</td>`;
            };
            const mkT = (name) => {
                const t = row.transits[name] || {};
                return `<td class="n9-cell-transit">${renderSym(t.sign, t.full_text)}</td>`;
            };

            tr.innerHTML = `
                <td class="n9-date-col">${dateStr}</td>
                ${mkZR('spirit')}${mkZR('fortune')}${mkZR('eros')}
                <td class="n9-cell-firdaria">${renderSym(row.firdaria.main, getNatal(row.firdaria.main))}</td>
                <td class="n9-cell-firdaria">${renderSym(row.firdaria.sub, getNatal(row.firdaria.sub))}</td>
                <td class="n9-cell-prof">${renderSym(row.profections)}</td>
                ${mkT('Jupiter')}${mkT('Saturn')}${mkT('Uranus')}${mkT('Neptune')}${mkT('Pluto')}
            `;
        } else {
            tr.innerHTML = `
                <td class="n9-date-col">${dateStr}</td>
                <td class="n9-cell-age">${row.age}</td>
                <td class="n9-cell-dasha-l1" style="color:#8700FF">${renderSym(row.l1, getJyotishDualTooltip(row.l1))}</td>
                <td class="n9-cell-dasha-l2" style="color:#BE75FF">${renderSym(row.l2, getJyotishDualTooltip(row.l2))}</td>
                <td class="n9-cell-dasha-l3" style="color:#EBD4FF">${renderSym(row.l3, getJyotishDualTooltip(row.l3))}</td>
            `;
        }
        return tr;
    }

    function renderSkeleton() {
        const thead = document.getElementById('n9-table-head');
        if (!thead) return;

        const zodiacDateHeader = `
            <th rowspan="3" class="th-top-cat n9-date-col-header">
                <div class="n9-header-date-label">DATE</div>
                <div class="n9-seg-control">
                    <div class="n9-seg-row">
                        <button class="n9-seg-btn" data-seg="1" title="Duodecim-1">I</button>
                        <button class="n9-seg-btn" data-seg="2" title="Duodecim-2">II</button>
                        <button class="n9-seg-btn" data-seg="3" title="Duodecim-3">III</button>
                    </div>
                    <div class="n9-seg-row">
                        <button class="n9-seg-btn" data-seg="4" title="Duodecim-4">IV</button>
                        <button class="n9-seg-btn" data-seg="5" title="Duodecim-5">V</button>
                        <button class="n9-seg-btn" data-seg="6" title="Duodecim-6">VI</button>
                    </div>
                </div>
            </th>`;

        const jyotishDateHeader = `<th class="th-top-cat n9-date-col-header">DATE</th>`;

        const m = STATE.meta || {};
        const lots = m.lots || {};
        
        // 🚀 Native title 대신 커스텀 data-tooltip과 n9-hoverable 클래스 부착
        const sectAttr = m.sect ? `class="th-top-cat n9-hoverable" data-tooltip="Sect | ${m.sect}"` : 'class="th-top-cat"';
        const profAttr = m.ascendant ? `class="th-top-cat th-prof n9-hoverable" data-tooltip="Ascendant | ${m.ascendant}"` : 'class="th-top-cat th-prof"';
        const spiritAttr = lots.Spirit ? `class="th-mid-cat th-spirit-head n9-hoverable" data-tooltip="Spirit | ${lots.Spirit}"` : 'class="th-mid-cat th-spirit-head"';
        const fortuneAttr = lots.Fortune ? `class="th-mid-cat th-fortune-head n9-hoverable" data-tooltip="Fortune | ${lots.Fortune}"` : 'class="th-mid-cat th-fortune-head"';
        const erosAttr = lots.Eros ? `class="th-mid-cat th-eros-head n9-hoverable" data-tooltip="Eros | ${lots.Eros}"` : 'class="th-mid-cat th-eros-head"';
        const moonAttr = m.moon_position ? `class="th-top-cat th-mahadasha n9-hoverable" data-tooltip="Sidereal Moon | ${m.moon_position}"` : 'class="th-top-cat th-mahadasha"';

        if (STATE.mode === 'zodiac') {
            thead.innerHTML = `<tr>${zodiacDateHeader}<th colspan="9" class="th-top-cat">ZODIACAL RELEASING</th><th colspan="2" ${sectAttr}>FIRDARIA</th><th rowspan="3" ${profAttr}>PROFECTIONS</th><th rowspan="2" colspan="5" class="th-top-cat th-transit">TRANSITS</th></tr>
            <tr><th colspan="3" ${spiritAttr}>SPIRIT</th><th colspan="3" ${fortuneAttr}>FORTUNE</th><th colspan="3" ${erosAttr}>EROS</th><th rowspan="2" class="th-mid-cat th-firdaria">MAIN</th><th rowspan="2" class="th-mid-cat th-firdaria">SUB</th></tr>
            <tr><th class="th-bot-cat th-spirit">L1</th><th class="th-bot-cat th-spirit">L2</th><th class="th-bot-cat th-spirit">L3</th><th class="th-bot-cat th-fortune">L1</th><th class="th-bot-cat th-fortune">L2</th><th class="th-bot-cat th-fortune">L3</th><th class="th-bot-cat th-eros">L1</th><th class="th-bot-cat th-eros">L2</th><th class="th-bot-cat th-eros">L3</th>
                <th class="th-bot-cat th-transit"><span class="transit-symbol-ju">♃</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-sa">♄</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-ur">♅</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-ne">♆</span></th><th class="th-bot-cat th-transit"><span class="transit-symbol-pl">♇</span></th>
            </tr>`;
            
            document.querySelectorAll('.n9-seg-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    if(STATE.isRendering) return;
                    showN9Loader(); 
                    STATE.segment = parseInt(btn.dataset.seg);
                    updateUrl();
                    setTimeout(() => { renderBodyAsync(); }, 50); 
                };
            });
        } else {
            thead.innerHTML = `<tr>${jyotishDateHeader}<th class="th-top-cat th-age">AGE</th><th ${moonAttr}>MAHADASHA</th><th class="th-top-cat th-antardasha">ANTARDASHA</th><th class="th-top-cat th-pratyantardasha">PRATYANTARDASHA</th></tr>`;
        }
    }

    function updateSegmentActiveUI() {
        document.querySelectorAll('.n9-seg-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.seg) === STATE.segment);
        });
    }

    function bindControls() {
        const switchBox = document.getElementById('n9-dicho-switch');
        if (switchBox) {
            switchBox.onclick = () => {
                if (STATE.isRendering) return;
                showN9Loader();
                STATE.mode = (STATE.mode === 'zodiac') ? 'jyotish' : 'zodiac';
                STATE.segment = 1;
                updateUrl(); 
                updateUI(); 
                setTimeout(() => { renderSkeleton(); fetchTimeline(); }, 50);
            };
        }
        const bar = document.getElementById('n9-ayanamsa-bar');
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
                    updateUrl(); 
                    updateUI(); 
                    fetchTimeline();
                };
                bar.appendChild(btn);
            });
        }
        updateUI();
    }

    function updateUI() {
        const knob = document.getElementById('n9-dicho-knob');
        const lZod = document.getElementById('n9-label-zodiac');
        const lJyo = document.getElementById('n9-label-jyotish');
        const bar = document.getElementById('n9-ayanamsa-bar');
        if (STATE.mode === 'zodiac') {
            if(knob) { knob.style.left = '3px'; knob.style.backgroundColor = '#7CFF9B'; }
            if(lZod) lZod.classList.add('active');
            if(lJyo) lJyo.classList.remove('active-jyotish');
            if(bar) bar.classList.add('hidden');
        } else {
            if(knob) { knob.style.left = '20px'; knob.style.backgroundColor = '#7CFF9B'; }
            if(lZod) lZod.classList.remove('active');
            if(lJyo) lJyo.classList.add('active-jyotish');
            if(bar) bar.classList.remove('hidden');
            
            document.querySelectorAll('.n9-aya-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.aya === STATE.ayanamsa);
            });
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(window.initN9, 50);
    } else {
        document.addEventListener('DOMContentLoaded', window.initN9);
    }

/* ─────────────────────────────────────────────────────────────
        3. GRIMOIRE MANIFESTATION (N9 -> Archive) 
        (N6 로직 완벽 이식 및 IIFE 내부 스코프 준수)
       ───────────────────────────────────────────────────────────── */
    window.saveToGrimoire = async function() {
        const activeSeedRaw = localStorage.getItem('active_seed');
        const activeSeed = activeSeedRaw ? JSON.parse(activeSeedRaw) : {};
        
        // 시드 데이터가 없으면 중단
        if (!activeSeed.birth_date) {
            alert("No active seed data found in localStorage.");
            return false;
        }

        const lang = localStorage.getItem('tetramegistus_lang') || 'ko';

        // 🚀 N9 내부 STATE 참조 (Zodiac/Jyotish 모드 판별)
        const compilerId = STATE.mode === 'jyotish' ? 'n9_vd' : 'n9';

        // 🚀 Payload 조립 (N6 규격 100% 동일)
        const payload = {
            seed_id: activeSeed.id ?? activeSeed.idx ?? "unknown",
            stage: 'Nigredo', 
            target_name: activeSeed.name || "Unknown", // 폴더명이 됨 (ex: archives/me/)
            language: lang,
            metadata: {
                view_mode: STATE.mode,
                ayanamsa: STATE.ayanamsa,
                sys_tab: 'tropical',
                segment: STATE.segment // 🚀 [추가됨]: Duodecim 페이지 번호 전달!
            },
            seed: activeSeed 
        };

        try {
            console.log(`[GRIMOIRE] Manifesting N9 Archive using [ ${compilerId} ]...`, payload);
            const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await res.json();

            if (res.ok) {
                console.log(`[GRIMOIRE] Archive [${payload.target_name}] Saved Successfully!`);
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