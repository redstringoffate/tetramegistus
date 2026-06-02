// static/mobile/world/citrinitas/modules/c2_mem.js

window.Mem = {
    lang: (typeof WorldSettings !== 'undefined') ? WorldSettings.get('lang', 'ko') : 'ko',
    dict: null, cities: {}, currentResults: [], activeIndex: -1,    
    manualOpen: false, pendingLocation: null, 
    state: { date: null, lat: null, lng: null, timezone: null, age: 25, answers: {} },
    lastScanData: null, scanResults: [], activeBlocks: [],

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
            for (let i = 10; i <= 99; i++) ageSel.add(new Option(`${i} Yrs`, i));
            ageSel.value = "25"; this.state.age = 25;
        }

        const currYear = new Date().getFullYear();
        ySel.innerHTML = ''; mSel.innerHTML = ''; dSel.innerHTML = ''; 
        
        for(let i = currYear + 5; i >= 1900; i--) ySel.appendChild(new Option(i, i));
        for(let i = 1; i <= 12; i++) mSel.appendChild(new Option(String(i).padStart(2,'0'), i));
        
        const adjustDays = () => {
            const days = new Date(ySel.value, mSel.value, 0).getDate();
            const cur = parseInt(dSel.value) || 1;
            dSel.innerHTML = '';
            for(let i = 1; i <= days; i++) dSel.appendChild(new Option(String(i).padStart(2,'0'), i));
            dSel.value = cur > days ? days : cur;
        };
        ySel.onchange = adjustDays; mSel.onchange = adjustDays;
        ySel.value = "2000"; mSel.value = "1"; adjustDays(); dSel.value = "1"; 

        fetch('/api/cities').then(r => r.json()).then(d => this.cities = d);

        const cityInp = document.getElementById('mem-city-search');
        const cityRes = document.getElementById('mem-city-results');

        const selectCity = (d) => {
            if(!d) return;
            this.pendingLocation = { label: d.label, lat: d.lat, lng: d.lon || d.lng, timezone: d.tz || "UTC" };
            this.state.lat = d.lat; this.state.lng = d.lon || d.lng; this.state.timezone = d.tz || "UTC";
            cityInp.value = d.label; cityRes.style.display = 'none';
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
            cityRes.innerHTML = '';
            cityRes.style.display = this.currentResults.length ? 'block' : 'none';
            this.currentResults.forEach(d => {
                const div = document.createElement('div');
                div.className = 'm-c1-result-item'; div.textContent = d.label; 
                div.onclick = () => selectCity(d);
                cityRes.appendChild(div);
            });
        });

        fetch('/api/theory/citrinitas/mem').then(r => r.json()).then(d => { if(!d.error) this.dict = d; });

        const manualToggle = document.getElementById('mem-manual-toggle');
        const manualPanel = document.getElementById('mem-manual-panel');

        if (manualToggle && manualPanel) {
            manualToggle.onclick = () => {
                this.manualOpen = !this.manualOpen;
                manualPanel.style.display = this.manualOpen ? 'block' : 'none';
                manualToggle.textContent = this.manualOpen ? 'Manual Entry ▴' : 'or Manual Entry ▾';
                if(this.manualOpen) { cityInp.value = ''; this.pendingLocation = null; }
            };

            // 🚀 터치 클릭으로 N/S, E/W 값 변경 (Hover/툴팁 제거)
            document.querySelectorAll('#mem-manual-panel .m-c1-sign-btn').forEach(btn => {
                btn.onclick = () => {
                    const target = btn.dataset.target;
                    document.querySelectorAll(`#mem-manual-panel .m-c1-sign-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                };
            });

            const tzSel = document.getElementById('mem-tz');
            if (tzSel) {
                tzSel.innerHTML = '';
                for(let i=-12; i<=14; i++) {
                    let opt = new Option(`UTC${i>=0?'+':''}${i}`, i);
                    if(i===9) opt.selected = true; 
                    tzSel.appendChild(opt);
                }
            }
        }
    },

    async manifestTimeline() {
        let finalLoc = null;

        if (this.manualOpen) {
            const latVal = (parseInt(document.getElementById('mem-lat-int').value||0) + parseFloat("0."+(document.getElementById('mem-lat-dec').value||0))) * (document.querySelector('#mem-manual-panel .m-c1-sign-btn[data-target="lat"].active').dataset.sign === '+' ? 1 : -1);
            const lngVal = (parseInt(document.getElementById('mem-lng-int').value||0) + parseFloat("0."+(document.getElementById('mem-lng-dec').value||0))) * (document.querySelector('#mem-manual-panel .m-c1-sign-btn[data-target="lng"].active').dataset.sign === '+' ? 1 : -1);

            if(latVal === 0 && lngVal === 0) { alert("Coordinates Required"); return; }
            finalLoc = { lat: latVal, lng: lngVal, timezone: document.getElementById('mem-tz').value || "UTC" }; 
        } else {
            if(!this.pendingLocation && !this.state.lat) { alert("Location Required"); return; }
            finalLoc = this.pendingLocation || { lat: this.state.lat, lng: this.state.lng, timezone: this.state.timezone };
        }

        this.state.lat = finalLoc.lat; this.state.lng = finalLoc.lng; this.state.timezone = finalLoc.timezone;
        this.state.age = parseInt(document.getElementById('mem-age').value);
        this.state.date = `${document.getElementById('mem-date-y').value}-${String(document.getElementById('mem-date-m').value).padStart(2,'0')}-${String(document.getElementById('mem-date-d').value).padStart(2,'0')}`;

        try {
            const response = await fetch('/api/astro/citrinitas/mem/scan', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: this.state.date, lat: this.state.lat, lng: this.state.lng, timezone: String(this.state.timezone), age: this.state.age })
            });
            const data = await response.json();
            this.lastScanData = data; this.scanResults = data.timeline_blocks || [];
            this.activeBlocks = JSON.parse(JSON.stringify(this.scanResults)); 
            this.currentQIndex = 0; this.state.answers = {};
            this.switchStep('step-3-questions');
            this.renderNextQuestion();
        } catch (error) { alert("Server Error."); }
    },

    renderNextQuestion() {
        const qContainer = document.getElementById('step-3-questions');
        if (!document.getElementById('q-render-area')) qContainer.innerHTML = '<div id="q-render-area"></div>';
        if (this.currentQIndex >= this.questionSequence.length) { this.showResults(); return; }

        const currentQ = this.questionSequence[this.currentQIndex];
        if (currentQ.type === 'clinical') this.renderClinicalScene(currentQ.id);
        else this.renderSubconsciousScene(currentQ.id);
    },

    renderClinicalScene(qId) {
        const renderArea = document.getElementById('q-render-area');
        const qData = this.dict.clinical_questions[qId];
        if (!qData) return this.nextQuestion(); 

        const bgStyle = qData.bg_image ? `background-image: url('/static/world/citrinitas/modules/assets/mem/${qData.bg_image}');` : "";
        const matchKey = qData.match_key; 
        const validOptions = new Set();
        
        if (matchKey) {
            this.activeBlocks.forEach(b => {
                (Array.isArray(b[matchKey]) ? b[matchKey] : [b[matchKey]]).forEach(v => { if(v) validOptions.add(String(v).toLowerCase()); });
            });
        }

        let optionsHtml = `<div class="m-c1-options-grid">`;
        for (const [optKey, optTexts] of Object.entries(qData.options)) {
            const lowerKey = String(optKey).toLowerCase();
            if ((lowerKey === 'unknown' || lowerKey === 'no_shift') && this.state.age >= 26) continue;
            if (matchKey && validOptions.size > 0 && !(lowerKey === 'unknown' || lowerKey === 'no_shift') && !validOptions.has(lowerKey)) continue;

            optionsHtml += `<div class="m-c1-option-card" onclick="Mem.setAnswer('${qId}', '${optKey}')">${this.formatText(optTexts[this.lang])}</div>`;
        }
        optionsHtml += `</div>`;

        renderArea.innerHTML = `
            <div id="scene-${qId}" class="m-scn-scene m-theme-image">
                <div class="m-scn-bg" style="${bgStyle}"></div>
                <div class="m-scn-overlay" style="background: rgba(0, 0, 0, 0.85);"></div> 
                <div class="m-scn-content">
                    <h3 class="m-scene-title">${qData.title[this.lang]}</h3>
                    <p class="m-scene-instruction">${this.formatText(this.dict.system_messages.instruction_clinical[this.lang])}</p>
                    <p class="m-scene-narrative">${this.formatText(qData.narrative[this.lang])}</p>
                    ${optionsHtml}
                </div>
            </div>`;

        setTimeout(() => document.getElementById(`scene-${qId}`).classList.add('revealed'), 100);
        setTimeout(() => document.getElementById(`scene-${qId}`).classList.add('veiled'), 1000); 
    },

    renderSubconsciousScene(qId) {
        const renderArea = document.getElementById('q-render-area');
        const qData = this.dict.subconscious_questions[qId];
        if (!qData) return this.nextQuestion();

        let themeClass = "m-theme-image", bgStyle = qData.bg_image ? `background-image: url('/static/world/citrinitas/modules/assets/mem/${qData.bg_image}');` : "";
        if (qId === 'letting_go') themeClass = "m-theme-dark";
        else if (qId === 'scn_epilogue') themeClass = "m-theme-light";

        let optionsHtml = `<div class="m-c1-options-grid">`;
        if (qData.options) {
            for (const [optKey, optTexts] of Object.entries(qData.options)) {
                optionsHtml += `<div class="m-c1-option-card" onclick="Mem.setAnswer('${qId}', '${optKey}')">${this.formatText(optTexts[this.lang])}</div>`;
            }
        } else {
            optionsHtml += `<button class="m-cyber-btn m-full-width" onclick="Mem.setAnswer('${qId}', 'next')">Continue ➔</button>`;
        }
        optionsHtml += `</div>`;

        renderArea.innerHTML = `
            <div id="scene-${qId}" class="m-scn-scene ${themeClass}">
                <div class="m-scn-bg" style="${bgStyle}"></div>
                <div class="m-scn-overlay"></div>
                <div class="m-scn-content">
                    <h3 class="m-scene-title">${qData.title[this.lang]}</h3>
                    <p class="m-scene-narrative">${this.formatText(qData.narrative[this.lang])}</p>
                    ${optionsHtml}
                </div>
            </div>`;

        setTimeout(() => document.getElementById(`scene-${qId}`).classList.add('revealed'), 100);
        setTimeout(() => document.getElementById(`scene-${qId}`).classList.add('veiled'), 2600); 
    },

    setAnswer(qId, val) {
        if (qId === 'life_shift_timing') { 
            if (['child'].includes(val)) this.questionSequence.splice(this.currentQIndex + 1, 0, { id: 'life_shift_mood_child', type: 'clinical' });
            else if (['puberty_start', 'puberty', 'post_puberty', '20s'].includes(val)) this.questionSequence.splice(this.currentQIndex + 1, 0, { id: 'life_shift_mood_teen', type: 'clinical' });

            this.activeBlocks = this.activeBlocks.filter(b => {
                const s = b.shifts; if (!s) return true;
                if (val === 'child') return s.child === true;
                if (val === 'puberty_start' || val === 'puberty') return s.puberty === true;
                if (val === 'post_puberty') return s.p_puberty === true;
                if (val === '20s') return s['20s'] === true;
                if (val === 'no_shift') return !(s.child || s.puberty || s.p_puberty || s['20s']); 
                return true; 
            });
        } else if (qId === 'letting_go') {
            const votes = [this.state.answers['scn_whisper'], this.state.answers['scn_righteous'], this.state.answers['scn_abyss']].filter(Boolean).map(v => String(v).toLowerCase());
            const eliminated = String(val).toLowerCase();
            const finalCandidatePadas = votes.filter(v => v !== eliminated);
            this.activeBlocks = this.activeBlocks.filter(block => finalCandidatePadas.includes(String(block.pada_purushartha).toLowerCase()));
        } else if (!['soul_origin', 'scn_intro', 'scn_call', 'scn_confusion', 'scn_temptation', 'scn_epilogue', 'scn_whisper', 'scn_righteous', 'scn_abyss'].includes(qId)) { 
            const matchKey = this.dict.clinical_questions[qId]?.match_key; 
            if (matchKey && val && String(val).toLowerCase() !== 'unknown') {
                this.activeBlocks = this.activeBlocks.filter(block => (Array.isArray(block[matchKey]) ? block[matchKey] : [block[matchKey]]).some(v => v && String(v).toLowerCase() === String(val).toLowerCase()));
            }
        }

        this.state.answers[qId] = val;
        const container = document.getElementById(`scene-${qId}`);
        if(container) {
            container.querySelectorAll('button, .m-c1-option-card').forEach(btn => btn.style.pointerEvents = 'none');
            setTimeout(() => { container.style.opacity = '0'; setTimeout(() => this.nextQuestion(), 1000); }, 2000); 
        } else this.nextQuestion();
    },

    nextQuestion() {
        this.currentQIndex++; this.renderNextQuestion();
        window.scrollTo(0, 0);
    },

    showResults() {
        this.switchStep('step-4-results');
        let mergedBlocks = [];
        if (this.activeBlocks.length > 0) {
            let curr = Object.assign({}, this.activeBlocks[0]);
            for (let i = 1; i < this.activeBlocks.length; i++) {
                let next = this.activeBlocks[i];
                if (curr.pada_purushartha === next.pada_purushartha && ((parseInt(next.start.split(':')[0]) * 60 + parseInt(next.start.split(':')[1])) - (parseInt(curr.end.split(':')[0]) * 60 + parseInt(curr.end.split(':')[1])) <= 1)) curr.end = next.end;
                else { mergedBlocks.push(curr); curr = Object.assign({}, next); }
            }
            mergedBlocks.push(curr);
        }

        let blockText = mergedBlocks.length === 0 ? "소거됨 (결과 없음)" : mergedBlocks.map(b => `${b.start} ~ ${b.end} (Pada: ${b.pada_purushartha})`).join("\n");
        document.getElementById('res-mem-content').innerHTML = `
            <div style="text-align: center; padding: 20px 0;">
                <h2 class="m-result-title">THE RITUAL IS COMPLETE.</h2>
                <p style="color: #888; font-size: 0.8rem; margin: 15px 0;">Remaining Karmic Hours:</p>
                <pre style="background: #050505; border: 1px solid #333; padding: 15px; color: #7CFF9B; text-align: left; font-size: 0.9rem;">${blockText}</pre>
            </div>`;
    },

    switchStep(stepId) {
        ['step-1-input', 'step-3-questions', 'step-4-results'].forEach(s => {
            const el = document.getElementById(s);
            if (el) el.style.display = (s === stepId) ? 'block' : 'none';
        });
    },

    formatText(textData) { return Array.isArray(textData) ? textData.join("<br>") : (textData || ""); }
};

window.initC2Mem = function() { if (window.Mem && typeof window.Mem.setupUI === 'function') window.Mem.setupUI(); };
if (document.getElementById('mem-date-y')) window.Mem.setupUI();