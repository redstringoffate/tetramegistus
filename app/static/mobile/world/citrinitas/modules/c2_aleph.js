// static/mobile/world/citrinitas/modules/c2_aleph.js

window.Aleph = {
    lang: (typeof WorldSettings !== 'undefined') ? WorldSettings.get('lang', 'ko') : 'ko',
    dict: null,
    state: { date: null, lat: null, lng: null, timezone: null, answers: {} },
    
    cities: {}, currentResults: [], activeIndex: -1,
    manualOpen: false, pendingLocation: null, scanResults: null, 

    setupUI() {
        const ySel = document.getElementById('c2-date-y');
        if (!ySel || ySel.dataset.bound) return; 
        ySel.dataset.bound = "true";

        fetch('/api/cities').then(r => r.json()).then(d => this.cities = d);
        fetch('/api/theory/citrinitas/aleph').then(r => r.json()).then(d => {
            if(!d.error) this.dict = d;
        });

        const mSel = document.getElementById('c2-date-m');
        const dSel = document.getElementById('c2-date-d');
        const currYear = new Date().getFullYear();
        
        ySel.innerHTML = ''; mSel.innerHTML = ''; dSel.innerHTML = ''; 
        for(let i = currYear; i >= 1900; i--) ySel.appendChild(new Option(i, i));
        for(let i = 1; i <= 12; i++) mSel.appendChild(new Option(String(i).padStart(2,'0'), i));
        
        const adjustDays = () => {
            const days = new Date(ySel.value, mSel.value, 0).getDate();
            const cur = parseInt(dSel.value) || 1;
            dSel.innerHTML = '';
            for(let i = 1; i <= days; i++) dSel.appendChild(new Option(String(i).padStart(2,'0'), i));
            dSel.value = cur > days ? days : cur;
        };
        ySel.onchange = adjustDays; mSel.onchange = adjustDays;
        
        ySel.value = 2000; mSel.value = 1; adjustDays(); dSel.value = 1; 

        // City Search
        const cityInp = document.getElementById('c2-city-search');
        const cityRes = document.getElementById('c2-city-results');
        const manualToggle = document.getElementById('c2-manual-toggle');
        const manualPanel = document.getElementById('c2-manual-panel');

        const selectCity = (d) => {
            if(!d) return;
            this.pendingLocation = { label: d.label, lat: d.lat, lng: d.lon || d.lng, timezone: d.tz || "UTC" };
            cityInp.value = d.label;
            cityRes.style.display = 'none';
        };

        cityInp.addEventListener('input', (e) => {
            if(this.manualOpen) {
                this.manualOpen = false; manualPanel.style.display = 'none';
                manualToggle.textContent = 'or Manual Entry ▾';
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

        manualToggle.onclick = () => {
            this.manualOpen = !this.manualOpen;
            manualPanel.style.display = this.manualOpen ? 'block' : 'none';
            manualToggle.textContent = this.manualOpen ? 'Manual Entry ▴' : 'or Manual Entry ▾';
            if(this.manualOpen) { cityInp.value = ''; this.pendingLocation = null; }
        };

        // 🚀 [수복] 마우스 호버(툴팁) 제거, 터치 클릭으로 N/S, E/W 값 변경만 처리
        document.querySelectorAll('.m-c1-sign-btn').forEach(btn => {
            btn.onclick = () => {
                const target = btn.dataset.target;
                document.querySelectorAll(`.m-c1-sign-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        const tzSel = document.getElementById('c2-tz');
        if (tzSel) {
            tzSel.innerHTML = '';
            for(let i=-12; i<=14; i++) {
                let opt = new Option(`UTC${i>=0?'+':''}${i}`, i);
                if(i===9) opt.selected = true;
                tzSel.appendChild(opt);
            }
        }
    }, 

    async submitData() {
        const y = document.getElementById('c2-date-y').value;
        const m = String(document.getElementById('c2-date-m').value).padStart(2,'0');
        const d = String(document.getElementById('c2-date-d').value).padStart(2,'0');
        this.state.date = `${y}-${m}-${d}`;

        let finalLoc = null;
        if (this.manualOpen) {
            const latVal = (parseInt(document.getElementById('c2-lat-int').value||0) + parseFloat("0."+(document.getElementById('c2-lat-dec').value||0))) * (document.querySelector('.m-c1-sign-btn[data-target="lat"].active').dataset.sign === '+' ? 1 : -1);
            const lngVal = (parseInt(document.getElementById('c2-lng-int').value||0) + parseFloat("0."+(document.getElementById('c2-lng-dec').value||0))) * (document.querySelector('.m-c1-sign-btn[data-target="lng"].active').dataset.sign === '+' ? 1 : -1);
            if(latVal === 0 && lngVal === 0) { alert("Coordinates Required"); return; }
            finalLoc = { lat: latVal, lng: lngVal, timezone: document.getElementById('c2-tz').value || "UTC" }; 
        } else {
            if(!this.pendingLocation) { alert("Location Required"); return; }
            finalLoc = this.pendingLocation;
        }

        this.state.lat = finalLoc.lat; this.state.lng = finalLoc.lng; this.state.timezone = finalLoc.timezone;

        try {
            const response = await fetch('/api/astro/citrinitas/aleph/scan', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: this.state.date, lat: this.state.lat, lng: this.state.lng, timezone: String(this.state.timezone) })
            });
            const data = await response.json();
            if (data.error) { alert("Scan Error: " + data.error); return; }

            this.lastScanData = data; this.scanResults = data.timeline_blocks;
            this.renderDisclaimer(data.flags || []);
            this.switchStep('step-2-disclaimer');
        } catch (error) { alert(`Error: ${error.message}`); }
    },

    renderDisclaimer(flags) {
        if (!this.dict || !this.dict.system_messages) return;
        const msgs = this.dict.system_messages;
        const lang = this.lang;

        document.getElementById('disclaimer-text').innerHTML = `<strong>[ GUIDANCE ]</strong><br><br>${this.formatText(msgs.disclaimer[lang])}`;
        const flagsEl = document.getElementById('flags-container');
        flagsEl.innerHTML = ""; 
        if (flags.length > 0 && msgs.modifiers) {
            let flagHtml = `<br><strong style="color:#ff4444;">[ DETECTED MODIFIERS ]</strong><br><br>`;
            flags.forEach(f => {
                if (msgs.modifiers[f]) flagHtml += `<div style="padding:10px; margin-bottom:10px; border-left:3px solid #ff4444; background:rgba(255,68,68,0.1);">${this.formatText(msgs.modifiers[f][lang])}</div>`;
            });
            flagsEl.innerHTML = flagHtml;
        }
    },

    startQuestionnaire() {
        this.switchStep('step-3-questions');
        this.activeBlocks = JSON.parse(JSON.stringify(this.scanResults)); 
        this.currentLayer = 1; this.state.answers = {}; 
        this.historyBlocks = [JSON.parse(JSON.stringify(this.scanResults))];
        this.renderCurrentLayer();
    },

    renderCurrentLayer() {
        const renderArea = document.getElementById('q-render-area');
        renderArea.innerHTML = ""; 

        if (this.activeBlocks.length === 0) {
            renderArea.innerHTML = `<div style='color:#ff4444; text-align:center; padding:2rem;'>All times excluded.</div>
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button class="m-c1-action-btn" style="flex:1;" onclick="Aleph.currentLayer=1; Aleph.activeBlocks=JSON.parse(JSON.stringify(Aleph.scanResults)); Aleph.state.answers={}; Aleph.renderCurrentLayer();">RESTART</button>
                    <button class="m-c1-action-btn" style="flex:1;" onclick="Aleph.showResults();">RESULTS ➔</button>
                </div>`;
            return;
        }

        const dict = this.dict; const flags = this.lastScanData.flags || [];
        const survivingAscendants = [...new Set(this.activeBlocks.map(b => b.ascendant))];
        const survivingHlAscPairs = [...new Set(this.activeBlocks.map(b => `${b.hour_lord}|${b.ascendant}`))];
        const survivingSatChiPairs = [...new Set(this.activeBlocks.map(b => `${b.saturn_house}|${b.chiron_house}`))];

        if (this.currentLayer === 1) {
            const isAnaretic = flags.includes("mars_ingress");
            const anInfo = this.lastScanData.mars_ingress_info;
            const marsSign = this.lastScanData.mars_sign; 

            if (isAnaretic && anInfo) {
                const key = `${anInfo.from_sign}_to_${anInfo.to_sign}`.toLowerCase();
                if (dict.anaretic_questions && dict.anaretic_questions[key]) {
                    const anData = dict.anaretic_questions[key];
                    const qText = `<b style="color:#ff4444;">[Mars Ingress: ${anInfo.from_sign} ➔ ${anInfo.to_sign}]</b><br><br>Q. ${this.formatText(anData.question[this.lang])}`;
                    renderArea.innerHTML += this.buildABQuestionBlock(`q_anaretic`, qText, this.formatText(anData["29_deg"][this.lang]), this.formatText(anData["0_deg"][this.lang]), 'ingress', anInfo.from_sign, anInfo.to_sign);
                }
            } else if (marsSign && dict.mars_asc_questions && dict.mars_asc_questions[marsSign]) {
                if (dict.system_messages.instruction_note) renderArea.innerHTML += `<div class="m-instruction-note"><span style="color:#7CFF9B; font-weight:bold;">[ INSTRUCTION ]</span><br>${this.formatText(dict.system_messages.instruction_note[this.lang])}</div>`;
                if (dict.system_messages.mars_asc_prompt) renderArea.innerHTML += `<div class="m-layer-prompt"><span class="m-q-mark">Q.</span> ${this.formatText(dict.system_messages.mars_asc_prompt[this.lang])}</div>`;
                survivingAscendants.forEach(asc => {
                    if (dict.mars_asc_questions[marsSign][asc]) renderArea.innerHTML += this.buildQuestionBlock(`q_mars_${asc}`, this.formatText(dict.mars_asc_questions[marsSign][asc][this.lang]), 'ascendant', asc);
                });
            }
            this.appendNextButton("NEXT ➔");
        } else if (this.currentLayer === 2) {
            if (dict.system_messages.instruction_note) renderArea.innerHTML += `<div class="m-instruction-note"><span style="color:#7CFF9B; font-weight:bold;">[ INSTRUCTION ]</span><br>${this.formatText(dict.system_messages.instruction_note[this.lang])}</div>`;
            if (dict.system_messages.hourlord_asc_prompt) renderArea.innerHTML += `<div class="m-layer-prompt"><span class="m-q-mark">Q.</span> ${this.formatText(dict.system_messages.hourlord_asc_prompt[this.lang])}</div>`;
            survivingHlAscPairs.forEach(pair => {
                const [hl, asc] = pair.split('|');
                if (dict.hourlord_asc_questions && dict.hourlord_asc_questions[hl] && dict.hourlord_asc_questions[hl][asc]) {
                    renderArea.innerHTML += this.buildQuestionBlock(`q_hl_${hl}_${asc}`, this.formatText(dict.hourlord_asc_questions[hl][asc][this.lang]), 'hl_asc', pair);
                }
            });
            this.appendNextButton("NEXT ➔");
        } else if (this.currentLayer === 3) {
            if (dict.system_messages.instruction_note_saturn_chiron) renderArea.innerHTML += `<div class="m-instruction-note"><span style="color:#7CFF9B; font-weight:bold;">[ INSTRUCTION ]</span><br>${this.formatText(dict.system_messages.instruction_note_saturn_chiron[this.lang])}</div>`;
            if (dict.system_messages.saturn_chiron_prompt) renderArea.innerHTML += `<div class="m-layer-prompt"><span class="m-q-mark">Q.</span> ${this.formatText(dict.system_messages.saturn_chiron_prompt[this.lang])}</div>`;
            survivingSatChiPairs.forEach(pair => {
                const [satH, chiH] = pair.split('|');
                let satText = (dict.house_questions && dict.house_questions.Saturn && dict.house_questions.Saturn[satH]) ? this.formatText(dict.house_questions.Saturn[satH][this.lang]) : "";
                let chiText = (dict.house_questions && dict.house_questions.Chiron && dict.house_questions.Chiron[chiH]) ? this.formatText(dict.house_questions.Chiron[chiH][this.lang]) : "";
                const qText = `<div style="color:#43A047; margin-bottom:15px;">${satText}</div><div style="color:#DC143C;">${chiText}</div>`;
                renderArea.innerHTML += this.buildQuestionBlock(`q_sc_${satH}_${chiH}`, qText, 'sat_chi', pair);
            });
            this.appendNextButton("FINISH ➔", true);
        }

        if (renderArea.querySelectorAll('.m-question-block').length === 0) {
            if (this.currentLayer >= 3) this.showResults();
            else { this.currentLayer++; this.renderCurrentLayer(); }
        }
    },

    appendNextButton(label, isFinal = false) {
        const renderArea = document.getElementById('q-render-area');
        const btnContainer = document.createElement('div');
        btnContainer.style.display = "flex"; btnContainer.style.gap = "10px"; btnContainer.style.marginTop = "2rem";

        if (this.currentLayer > 1) {
            const backBtn = document.createElement('button');
            backBtn.className = "m-c1-action-btn m-btn-restart"; backBtn.style.flex = "1"; backBtn.innerText = "PREV"; 
            backBtn.onclick = () => {
                this.currentLayer--;
                this.activeBlocks = JSON.parse(JSON.stringify(this.historyBlocks[this.currentLayer - 1]));
                this.renderCurrentLayer();
                window.scrollTo(0, 0);
            };
            btnContainer.appendChild(backBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.id = "aleph-next-btn"; nextBtn.className = "m-c1-action-btn"; nextBtn.style.flex = "2"; nextBtn.style.display = "none"; nextBtn.innerText = label;
        
        nextBtn.onclick = () => {
            let filteredBlocks = JSON.parse(JSON.stringify(this.historyBlocks[this.currentLayer - 1]));
            document.querySelectorAll('.m-question-block').forEach(b => {
                const qId = b.id.replace('block-', '');
                const ans = this.state.answers[qId];
                if (!ans) return;
                if (ans.type === 'ingress') {
                    filteredBlocks = filteredBlocks.filter(blk => blk.mars_sign && blk.mars_sign.toLowerCase() === ans.param.toLowerCase());
                } else if (ans.val === 'no') {
                    filteredBlocks = filteredBlocks.filter(blk => {
                        if (ans.type === 'ascendant') return blk.ascendant !== ans.param;
                        if (ans.type === 'hl_asc') return `${blk.hour_lord}|${blk.ascendant}` !== ans.param;
                        if (ans.type === 'sat_chi') return `${blk.saturn_house}|${blk.chiron_house}` !== ans.param;
                        return true; 
                    });
                }
            });

            this.activeBlocks = filteredBlocks;
            if (isFinal) this.showResults();
            else {
                this.historyBlocks[this.currentLayer] = JSON.parse(JSON.stringify(this.activeBlocks));
                this.currentLayer++; this.renderCurrentLayer(); window.scrollTo(0, 0);
            }
        };
        btnContainer.appendChild(nextBtn); renderArea.appendChild(btnContainer);
    },

    revealNextButton() {
        const allBlocks = document.querySelectorAll('.m-question-block');
        let allAnswered = true;
        allBlocks.forEach(b => { if (!this.state.answers[b.id.replace('block-', '')]) allAnswered = false; });
        const nextBtn = document.getElementById('aleph-next-btn');
        if (nextBtn && allAnswered && allBlocks.length > 0) nextBtn.style.display = "block"; 
    },

    buildQuestionBlock(qId, text, filterType, filterValue) {
        return `
            <div class="m-question-block" id="block-${qId}">
                <div class="m-q-text">${text}</div>
                <div class="m-q-controls">
                    <button class="m-ox-btn btn-o" onclick="Aleph.setAnswer('${qId}', 'yes', '${filterType}', '${filterValue}')">O</button>
                    <button class="m-ox-btn btn-x" onclick="Aleph.setAnswer('${qId}', 'no', '${filterType}', '${filterValue}')">X</button>
                    <button class="m-ox-btn btn-q" onclick="Aleph.setAnswer('${qId}', 'maybe', '${filterType}', '${filterValue}')">?</button>
                </div>
            </div>`;
    },

    buildABQuestionBlock(qId, questionHtml, textA, textB, filterType, valA, valB) {
        return `
            <div class="m-question-block mars-ingress-block" id="block-${qId}">
                <div class="m-q-text">${questionHtml}</div>
                <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
                    <button class="m-ab-btn btn-a" id="btn-${qId}-a" onclick="Aleph.setABAnswer('${qId}', 'A', '${filterType}', '${valA}')"><b>[ A ]</b> ${textA}</button>
                    <button class="m-ab-btn btn-b" id="btn-${qId}-b" onclick="Aleph.setABAnswer('${qId}', 'B', '${filterType}', '${valB}')"><b>[ B ]</b> ${textB}</button>
                </div>
            </div>`;
    },

    setAnswer(qId, answerVal, filterType, filterValue) {
        if (answerVal === 'no') {
            const blocks = document.querySelectorAll('.m-question-block');
            let otherAnswered = 0; let otherNoCount = 0;
            blocks.forEach(b => {
                const oId = b.id.replace('block-', '');
                if (oId === qId) return;
                if (this.state.answers[oId]) {
                    otherAnswered++;
                    if (this.state.answers[oId].val === 'no') otherNoCount++;
                }
            });
            if (otherAnswered === blocks.length - 1 && otherNoCount === otherAnswered) {
                alert("You cannot select ❌ for all items."); return; 
            }
        }
        this.state.answers[qId] = { val: answerVal, type: filterType, param: filterValue };
        const block = document.getElementById(`block-${qId}`);
        block.classList.remove('state-yes', 'state-no', 'state-maybe'); block.classList.add(`state-${answerVal}`);
        this.revealNextButton(); 
    },

    setABAnswer(qId, choice, filterType, keepValue) {
        this.state.answers[qId] = { val: choice, type: filterType, param: keepValue };
        document.getElementById(`btn-${qId}-a`).classList.toggle('active', choice === 'A');
        document.getElementById(`btn-${qId}-b`).classList.toggle('active', choice === 'B');
        this.revealNextButton(); 
    },

    showResults() {
        this.switchStep('step-4-results');
        const timesContainer = document.getElementById('res-times'); timesContainer.innerHTML = ""; 
        if (this.activeBlocks.length === 0) timesContainer.innerHTML = "<div class='m-res-time-item' style='color:#ff4444;'>All times excluded.</div>";
        else this.activeBlocks.forEach(b => { timesContainer.innerHTML += `<div class='m-res-time-item'>${b.start} - ${b.end}</div>`; });

        document.getElementById('res-asc').innerText = [...new Set(this.activeBlocks.map(b => b.ascendant))].join(", ") || "-";
        document.getElementById('res-hl').innerText = [...new Set(this.activeBlocks.map(b => b.hour_lord))].join(", ") || "-";

        const pairsList = document.getElementById('res-pairs'); pairsList.innerHTML = "";
        if (this.activeBlocks.length === 0) pairsList.innerHTML = "<li class='m-res-pair-item'>-</li>";
        else {
            [...new Set(this.activeBlocks.map(b => `Saturn H${b.saturn_house} | Chiron H${b.chiron_house}`))].forEach(p => {
                pairsList.innerHTML += `<li class='m-res-pair-item'>${p}</li>`;
            });
        }
    },

    switchStep(stepId) {
        ['step-1-input', 'step-2-disclaimer', 'step-3-questions', 'step-4-results'].forEach(s => {
            const el = document.getElementById(s);
            if (el) el.style.display = (s === stepId) ? 'block' : 'none';
        });
    },

    formatText(textData) { return Array.isArray(textData) ? textData.join("<br>") : (textData || ""); }
};

window.initC2Aleph = function() { window.Aleph.setupUI(); };
if (document.getElementById('c2-date-y')) window.Aleph.setupUI();