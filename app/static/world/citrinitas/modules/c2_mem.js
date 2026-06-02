// app/static/world/citrinitas/modules/c2_mem.js

window.Mem = {
    lang: (typeof WorldSettings !== 'undefined') ? WorldSettings.get('lang', 'ko') : 'ko',
    dict: null,
    cities: {},
    currentResults: [], 
    activeIndex: -1,    
    manualOpen: false,        
    pendingLocation: null, 
    state: { date: null, lat: null, lng: null, timezone: null, age: 25, answers: {} },
    
    lastScanData: null,
    scanResults: [],
    activeBlocks: [],

    questionSequence: [
        { id: 'child_emotion', type: 'clinical' },
        { id: 'childhood_relationships', type: 'clinical' },
        { id: 'scn_intro', type: 'subconscious' },
        { id: 'scn_call', type: 'subconscious' },
        { id: 'scn_whisper', type: 'subconscious' },
        { id: 'soul_origin', type: 'clinical' },
        { id: 'solitude', type: 'clinical' },
        { id: 'scn_righteous', type: 'subconscious' },
        { id: 'scn_confusion', type: 'subconscious' },
        { id: 'life_shift_timing', type: 'clinical' },
        { id: 'scn_abyss', type: 'subconscious' },
        { id: 'scn_temptation', type: 'subconscious' },
        { id: 'letting_go', type: 'subconscious' },
        { id: 'scn_epilogue', type: 'subconscious' }
    ],
    currentQIndex: 0,

    setupUI() {
        const ySel = document.getElementById('mem-date-y');
        const mSel = document.getElementById('mem-date-m');
        const dSel = document.getElementById('mem-date-d');
        const ageSel = document.getElementById('mem-age'); 
        
        if (!ySel || ySel.dataset.bound) return; 
        ySel.dataset.bound = "true";

        if (ageSel) {
            ageSel.options.length = 0;
            for (let i = 10; i <= 99; i++) {
                ageSel.add(new Option(`${i} Yrs`, i));
            }
            ageSel.value = "25"; 
            this.state.age = 25;
        }

        const currYear = new Date().getFullYear();
        ySel.innerHTML = ''; mSel.innerHTML = ''; dSel.innerHTML = ''; 
        
        for(let i = currYear + 5; i >= 1900; i--) {
            let opt = document.createElement('option'); opt.value = i; opt.textContent = i; ySel.appendChild(opt);
        }
        for(let i = 1; i <= 12; i++) {
            let opt = document.createElement('option'); opt.value = i; opt.textContent = String(i).padStart(2,'0'); mSel.appendChild(opt);
        }
        
        const adjustDays = () => {
            const y = parseInt(ySel.value);
            const m = parseInt(mSel.value);
            const daysInMonth = new Date(y, m, 0).getDate();
            const cur = parseInt(dSel.value) || 1;
            dSel.innerHTML = '';
            for(let i = 1; i <= daysInMonth; i++) {
                let opt = document.createElement('option'); opt.value = i; opt.textContent = String(i).padStart(2,'0'); dSel.appendChild(opt);
            }
            dSel.value = cur > daysInMonth ? daysInMonth : cur;
        };
        ySel.onchange = adjustDays;
        mSel.onchange = adjustDays;
        adjustDays(); 

        ySel.value = "2000";
        mSel.value = "1"; 
        adjustDays();   
        dSel.value = "1"; 

        fetch('/api/cities')
            .then(r => r.json())
            .then(d => this.cities = d)
            .catch(e => console.error("Cities Load Error:", e));

        const cityInp = document.getElementById('mem-city-search');
        const cityRes = document.getElementById('mem-city-results');

        const renderResults = () => {
            cityRes.innerHTML = '';
            cityRes.style.display = this.currentResults.length ? 'block' : 'none';
            this.currentResults.forEach((c, i) => {
                const div = document.createElement('div');
                div.className = `c1-result-item ${i === this.activeIndex ? 'active' : ''}`;
                div.textContent = c.label; 
                div.onmousedown = () => selectCity(i);
                cityRes.appendChild(div);
            });
        };

        const selectCity = (index) => {
            const d = this.currentResults[index];
            if(!d) return;
            this.pendingLocation = { label: d.label, lat: d.lat, lng: d.lon || d.lng, timezone: d.tz || "UTC" };
            this.state.lat = d.lat;
            this.state.lng = d.lon || d.lng;
            this.state.timezone = d.tz || "UTC";
            cityInp.value = d.label;
            cityRes.style.display = 'none';
            this.activeIndex = -1;
        };

        cityInp.addEventListener('input', (e) => {
            if(this.manualOpen) {
                this.manualOpen = false;
                document.getElementById('mem-manual-panel').style.display = 'none';
                document.getElementById('mem-manual-toggle').textContent = 'or Manual Entry ▾';
            } 
            const q = e.target.value.trim().toLowerCase();
            if(!q) { cityRes.style.display = 'none'; return; }
            this.currentResults = Object.values(this.cities).filter(c => c.label.toLowerCase().includes(q)).slice(0, 8);
            this.activeIndex = -1;
            renderResults();
        });

        cityInp.addEventListener('keydown', (e) => {
            if(!this.currentResults.length) return;
            if(e.key === 'ArrowDown') {
                e.preventDefault();
                this.activeIndex = (this.activeIndex + 1) % this.currentResults.length;
                renderResults();
            } else if(e.key === 'ArrowUp') {
                e.preventDefault();
                this.activeIndex = (this.activeIndex - 1 + this.currentResults.length) % this.currentResults.length;
                renderResults();
            } else if(e.key === 'Enter') {
                e.preventDefault();
                if(this.activeIndex >= 0) selectCity(this.activeIndex);
            }
        });

        cityInp.addEventListener('blur', () => setTimeout(() => cityRes.style.display = 'none', 200));

        fetch('/api/theory/citrinitas/mem')
            .then(r => r.json())
            .then(d => {
                if(!d.error) this.dict = d;
            })
            .catch(e => console.error("Fetch Error:", e));

        const manualToggle = document.getElementById('mem-manual-toggle');
        const manualPanel = document.getElementById('mem-manual-panel');

        if (manualToggle && manualPanel) {
            manualToggle.onclick = () => {
                this.manualOpen = !this.manualOpen;
                manualPanel.style.display = this.manualOpen ? 'block' : 'none';
                manualToggle.textContent = this.manualOpen ? 'Manual Entry ▴' : 'or Manual Entry ▾';
                if(this.manualOpen) {
                    cityInp.value = '';
                    this.pendingLocation = null;
                }
            };

            let tooltip = document.getElementById('c2-sign-tooltip-mem');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'c2-sign-tooltip-mem';
                tooltip.style.cssText = "position: fixed; background: rgba(59,59,59,0.9); color: #fff; padding: 4px 8px; font-size: 0.75rem; border-radius: 3px; pointer-events: none; z-index: 9999; opacity: 0; transition: opacity 0.1s;";
                document.body.appendChild(tooltip);
            }

            document.querySelectorAll('#mem-manual-panel .c1-sign-btn').forEach(btn => {
                if(btn.dataset.bound) return;
                btn.addEventListener('click', () => {
                    const target = btn.dataset.target;
                    document.querySelectorAll(`#mem-manual-panel .c1-sign-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
                btn.addEventListener('mousemove', (e) => {
                    const sign = btn.dataset.sign;
                    const target = btn.dataset.target;
                    const label = target === 'lat' ? (sign === '+' ? 'North' : 'South') : (sign === '+' ? 'East' : 'West');
                    tooltip.textContent = label;
                    tooltip.style.left = (e.clientX + 15) + 'px';
                    tooltip.style.top = (e.clientY + 15) + 'px';
                    tooltip.style.opacity = '1';
                });
                btn.addEventListener('mouseleave', () => tooltip.style.opacity = '0');
                btn.dataset.bound = "true";
            });
            
            const setupNumeric = (id, min, max, digits) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.addEventListener("input", () => {
                    if (digits) el.value = el.value.replace(/\D/g, "").slice(0, digits);
                    else {
                        let v = parseInt(el.value || "0", 10);
                        if (isNaN(v)) el.value = "";
                        else el.value = Math.max(min, Math.min(max, v));
                    }
                });
            };
            setupNumeric('mem-lat-int', 0, 90); setupNumeric('mem-lat-dec', 0, 0, 4);
            setupNumeric('mem-lng-int', 0, 180); setupNumeric('mem-lng-dec', 0, 0, 4);

            const tzSel = document.getElementById('mem-tz');
            if (tzSel && !tzSel.dataset.bound) {
                const tzNames = {
                    "-10": "HST", "-8": "PST", "-7": "MST", "-6": "CST", "-5": "EST",
                    "0": "UTC/GMT", "+1": "CET", "+2": "EET", "+3": "MSK", "+5": "PKT", "+5.5": "IST",
                    "+7": "WIB", "+8": "CST/SGT", "+9": "KST/JST", "+10": "AEST", "+12": "NZST"
                };
                tzSel.innerHTML = '';
                for(let i=-12; i<=14; i++) {
                    const opt = document.createElement('option');
                    const sign = i >= 0 ? '+' : '';
                    const label = tzNames[String(i)] || "";
                    opt.value = i;
                    opt.textContent = `UTC${sign}${i}${label ? ` (${label})` : ""}`;
                    if(i === 9) opt.selected = true; 
                    tzSel.appendChild(opt);
                }
                tzSel.dataset.bound = "true";
            }
        }
    },

    async manifestTimeline() {
        let finalLoc = null;

        if (this.manualOpen) {
            const latInt = document.getElementById('mem-lat-int').value || 0;
            const latDec = document.getElementById('mem-lat-dec').value || 0;
            const lngInt = document.getElementById('mem-lng-int').value || 0;
            const lngDec = document.getElementById('mem-lng-dec').value || 0;
            
            const latSign = document.querySelector('#mem-manual-panel .c1-sign-btn[data-target="lat"].active').dataset.sign === '+' ? 1 : -1;
            const lngSign = document.querySelector('#mem-manual-panel .c1-sign-btn[data-target="lng"].active').dataset.sign === '+' ? 1 : -1;

            const latVal = (parseInt(latInt) + parseFloat("0." + latDec)) * latSign;
            const lngVal = (parseInt(lngInt) + parseFloat("0." + lngDec)) * lngSign;

            const tzSel = document.getElementById('mem-tz');
            const tzVal = tzSel ? tzSel.value : "UTC";

            if(latVal === 0 && lngVal === 0) { alert("Coordinates Required"); return; }
            finalLoc = { lat: latVal, lng: lngVal, timezone: tzVal }; 
        } else {
            if(!this.pendingLocation && !this.state.lat) { alert("Location Required"); return; }
            finalLoc = this.pendingLocation || { lat: this.state.lat, lng: this.state.lng, timezone: this.state.timezone };
        }

        this.state.lat = finalLoc.lat;
        this.state.lng = finalLoc.lng;
        this.state.timezone = finalLoc.timezone || "UTC";

        this.state.age = parseInt(document.getElementById('mem-age').value);
        const ySel = document.getElementById('mem-date-y').value;
        const mSel = String(document.getElementById('mem-date-m').value).padStart(2,'0');
        const dSel = String(document.getElementById('mem-date-d').value).padStart(2,'0');
        this.state.date = `${ySel}-${mSel}-${dSel}`;

        console.log(`[C2 Mem] Requesting Backend Scan... Date: ${this.state.date}, Age: ${this.state.age}`);

        try {
            const response = await fetch('/api/astro/citrinitas/mem/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: this.state.date,
                    lat: this.state.lat,
                    lng: this.state.lng,
                    timezone: String(this.state.timezone),
                    age: this.state.age
                })
            });
            
            if (!response.ok) throw new Error("Backend 통신 에러");

            const data = await response.json();
            this.lastScanData = data;
            this.scanResults = data.timeline_blocks || [];
            this.activeBlocks = JSON.parse(JSON.stringify(this.scanResults)); 

            this.currentQIndex = 0;
            this.state.answers = {};
            this.switchStep('step-3-questions');
            this.renderNextQuestion();

        } catch (error) {
            console.error(error);
            alert("서버 오류: 백엔드 엔진이 준비되지 않았거나 연결이 끊겼습니다.");
        }
    },

    renderNextQuestion() {
        const qContainer = document.getElementById('step-3-questions');
        if (!document.getElementById('q-render-area')) {
            qContainer.innerHTML = '<div id="q-render-area"></div>';
        }

        if (this.currentQIndex >= this.questionSequence.length) {
            this.showResults();
            return;
        }

        const currentQ = this.questionSequence[this.currentQIndex];
        const qId = currentQ.id;

        if (currentQ.type === 'clinical') {
            this.renderClinicalScene(qId);
        } else {
            this.renderSubconsciousScene(qId);
        }
    },

    renderClinicalScene(qId) {
        const renderArea = document.getElementById('q-render-area');
        const qData = this.dict.clinical_questions[qId];
        if (!qData) {
            console.warn(`[!] Dictionary missing clinical question: ${qId}`);
            return this.nextQuestion(); 
        }

        const title = qData.title[this.lang];
        const narrative = this.formatText(qData.narrative[this.lang]);
        const instruction = this.formatText(this.dict.system_messages.instruction_clinical[this.lang]);
        
        let bgStyle = qData.bg_image ? `background-image: url('/static/world/citrinitas/modules/assets/mem/${qData.bg_image}');` : "";

        const matchKey = qData.match_key; 
        const validOptions = new Set();
        
        if (matchKey) {
            this.activeBlocks.forEach(b => {
                const blockValues = Array.isArray(b[matchKey]) ? b[matchKey] : [b[matchKey]];
                blockValues.forEach(v => {
                    if(v) validOptions.add(String(v).toLowerCase());
                });
            });
        }

        let optionsHtml = `<div class="c1-options-grid scn-options-wrapper">`;
        for (const [optKey, optTexts] of Object.entries(qData.options)) {
            
            const lowerKey = String(optKey).toLowerCase();
            const isUnknown = lowerKey === 'unknown' || lowerKey === 'no_shift';

            // 🚀 [메타인지 로직]: 20대 후반(26세) 이상이면 "잘 모르겠다" 선택지 강제 삭제!
            if (isUnknown && this.state.age >= 26) {
                continue;
            }

            // 나머지 옵션들은 일치하는 타임라인이 있을 때만 노출
            if (matchKey && validOptions.size > 0 && !isUnknown && !validOptions.has(lowerKey)) continue;

            const text = this.formatText(optTexts[this.lang]);
            if (!text) continue;
            optionsHtml += `
                <div class="c1-option-card scn-opt" onclick="Mem.setAnswer('${qId}', '${optKey}')">
                    <div class="c1-opt-text">${text}</div>
                </div>
            `;
        }
        optionsHtml += `</div>`;

        const sceneHtml = `
            <div id="scene-${qId}" class="scn-scene theme-image">
                <div class="scn-bg" style="${bgStyle}"></div>
                <div class="scn-overlay" style="background: rgba(0, 0, 0, 0.85);"></div> 
                <div class="scn-content clinical-scene animation-fade-in">
                    <h3 class="scene-title">${title}</h3>
                    <p class="scene-instruction">${instruction}</p>
                    <p class="scene-narrative">${narrative}</p>
                    ${optionsHtml}
                </div>
            </div>
        `;
        renderArea.innerHTML = sceneHtml;

        const sceneEl = document.getElementById(`scene-${qId}`);
        setTimeout(() => sceneEl.classList.add('revealed'), 100);
        setTimeout(() => sceneEl.classList.add('veiled'), 1000); 
    },

    renderSubconsciousScene(qId) {
        const renderArea = document.getElementById('q-render-area');
        const qData = this.dict.subconscious_questions[qId];
        if (!qData) {
            console.warn(`[!] Dictionary missing subconscious question: ${qId}`);
            return this.nextQuestion();
        }

        const title = qData.title[this.lang];
        const narrative = this.formatText(qData.narrative[this.lang]);
        
        let themeClass = "";
        let bgStyle = "";
        if (qId === 'letting_go') themeClass = "theme-dark";
        else if (qId === 'scn_epilogue') themeClass = "theme-light";
        else {
            themeClass = "theme-image";
            bgStyle = qData.bg_image ? `background-image: url('/static/world/citrinitas/modules/assets/mem/${qData.bg_image}');` : "";
        }

        let optionsHtml = `<div class="c1-options-grid scn-options-wrapper">`;
        if (qData.options) {
            for (const [optKey, optTexts] of Object.entries(qData.options)) {
                const text = this.formatText(optTexts[this.lang]);
                if (!text) continue;
                optionsHtml += `
                    <div class="c1-option-card scn-opt" onclick="Mem.setAnswer('${qId}', '${optKey}')">
                        <div class="c1-opt-text">${text}</div>
                    </div>
                `;
            }
        } else {
            optionsHtml += `<button class="cyber-btn full-width" onclick="Mem.setAnswer('${qId}', 'next')">Continue ➔</button>`;
        }
        optionsHtml += `</div>`;

        const sceneHtml = `
            <div id="scene-${qId}" class="scn-scene ${themeClass}">
                <div class="scn-bg" style="${bgStyle}"></div>
                <div class="scn-overlay"></div>
                <div class="scn-content">
                    <h3 class="scene-title">${title}</h3>
                    <p class="scene-narrative">${narrative}</p>
                    ${optionsHtml}
                </div>
            </div>
        `;
        renderArea.innerHTML = sceneHtml;

        const sceneEl = document.getElementById(`scene-${qId}`);
        setTimeout(() => sceneEl.classList.add('revealed'), 100);
        setTimeout(() => sceneEl.classList.add('veiled'), 2600); 
    },

    setAnswer(qId, val) {
        if (qId === 'life_shift_timing') { 
            if (['child'].includes(val)) {
                this.questionSequence.splice(this.currentQIndex + 1, 0, { id: 'life_shift_mood_child', type: 'clinical' });
            } else if (['puberty_start', 'puberty', 'post_puberty', '20s'].includes(val)) {
                this.questionSequence.splice(this.currentQIndex + 1, 0, { id: 'life_shift_mood_teen', type: 'clinical' });
            }

            const beforeCount = this.activeBlocks.length;
            this.activeBlocks = this.activeBlocks.filter(b => {
                const s = b.shifts; 
                if (!s) return true;
                if (val === 'child') return s.child === true;
                if (val === 'puberty_start' || val === 'puberty') return s.puberty === true;
                if (val === 'post_puberty') return s.p_puberty === true;
                if (val === '20s') return s['20s'] === true;
                if (val === 'no_shift') return !(s.child || s.puberty || s.p_puberty || s['20s']); 
                return true; 
            });
            console.log(`[Shift Filter] ${val}: ${beforeCount} -> ${this.activeBlocks.length}`);
        }

        const fakeFlowIds = ['soul_origin', 'scn_intro', 'scn_call', 'scn_confusion', 'scn_temptation', 'scn_epilogue'];
        const beforeCount = this.activeBlocks.length;

        if (fakeFlowIds.includes(qId)) {
            console.log(`[Flow] ${qId} Passed.`);
            
        } else if (['scn_whisper', 'scn_righteous', 'scn_abyss'].includes(qId)) {
            console.log(`[Pada Vote Recorded] ${qId}: ${val}`);
            
        } else if (qId === 'letting_go') {
            const votes = [
                this.state.answers['scn_whisper'],
                this.state.answers['scn_righteous'],
                this.state.answers['scn_abyss']
            ].filter(Boolean).map(v => String(v).toLowerCase());
            
            const eliminated = String(val).toLowerCase();
            const finalCandidatePadas = votes.filter(v => v !== eliminated);
            
            this.activeBlocks = this.activeBlocks.filter(block => {
                if (!block.pada_purushartha) return false;
                return finalCandidatePadas.includes(String(block.pada_purushartha).toLowerCase());
            });
            console.log(`[Pada Resolution] Votes: ${votes}, Eliminated: ${eliminated}, Result: ${this.activeBlocks.length}`);
            
        } else if (qId !== 'life_shift_timing') { 
            const qData = this.dict.clinical_questions[qId];
            const matchKey = qData ? qData.match_key : null; 
            
            if (matchKey && val && String(val).toLowerCase() !== 'unknown') {
                this.activeBlocks = this.activeBlocks.filter(block => {
                    const blockValues = Array.isArray(block[matchKey]) ? block[matchKey] : [block[matchKey]];
                    return blockValues.some(v => v && String(v).toLowerCase() === String(val).toLowerCase());
                });
                console.log(`[Clinical Match] ${qId} (${matchKey}): ${beforeCount} -> ${this.activeBlocks.length}`);
            }
        }

        this.state.answers[qId] = val;
        
        const container = document.getElementById(`scene-${qId}`);
        if(container) {
            const buttons = container.querySelectorAll('button, .c1-option-card');
            buttons.forEach(btn => btn.style.pointerEvents = 'none');
            setTimeout(() => {
                container.style.transition = 'opacity 1s ease-in-out';
                container.style.opacity = '0';
                setTimeout(() => this.nextQuestion(), 1000); 
            }, 2000); 
        } else {
            this.nextQuestion();
        }
    },

    nextQuestion() {
        this.currentQIndex++;
        this.renderNextQuestion();
        document.getElementById('mem-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    showResults() {
        this.switchStep('step-4-results');
        const resArea = document.getElementById('res-mem-content');
        
        // 연속된 시간 병합 로직 (그대로 유지)
        let mergedBlocks = [];
        if (this.activeBlocks.length > 0) {
            let curr = Object.assign({}, this.activeBlocks[0]);
            for (let i = 1; i < this.activeBlocks.length; i++) {
                let next = this.activeBlocks[i];
                let currEndMins = parseInt(curr.end.split(':')[0]) * 60 + parseInt(curr.end.split(':')[1]);
                let nextStartMins = parseInt(next.start.split(':')[0]) * 60 + parseInt(next.start.split(':')[1]);
                
                if (curr.pada_purushartha === next.pada_purushartha && (nextStartMins - currEndMins <= 1)) {
                    curr.end = next.end;
                } else {
                    mergedBlocks.push(curr);
                    curr = Object.assign({}, next);
                }
            }
            mergedBlocks.push(curr);
        }

        let blockText = mergedBlocks.map(b => `${b.start} ~ ${b.end} (Pada: ${b.pada_purushartha})`).join("\n");
        if(mergedBlocks.length === 0) blockText = "소거됨 (결과 없음)";

        if (resArea) {
            resArea.innerHTML = `
                <div class="res-summary-container">
                    <h2 class="result-title" style="color: #000000 !important;">The Ritual is Complete.</h2>
                    
                    <p class="res-summary-desc">Remaining Karmic Hours:</p>
                    <pre class="res-summary-json" style="color: #3cff8f;">${blockText}</pre>
                </div>`;
        }
    },

    switchStep(stepId) {
        ['step-1-input', 'step-3-questions', 'step-4-results'].forEach(s => {
            const el = document.getElementById(s);
            if (el) el.style.display = (s === stepId) ? 'block' : 'none';
        });
    },

    formatText(textData) {
        return Array.isArray(textData) ? textData.join("<br>") : (textData || "");
    }
};

window.initC2Mem = function() {
    if (window.Mem && typeof window.Mem.setupUI === 'function') {
        window.Mem.setupUI();
    }
};

if (document.getElementById('mem-date-y')) {
    window.Mem.setupUI();
}

const memObserver = new MutationObserver(() => {
    const ySel = document.getElementById('mem-date-y');
    if (ySel && !ySel.dataset.bound) {
        window.Mem.setupUI();
    }
});
memObserver.observe(document.body, { childList: true, subtree: true });