// static/mobile/world/citrinitas/modules/c2_shin.js

window.Shin = {
    lang: (typeof WorldSettings !== 'undefined') ? WorldSettings.get('lang', 'en') : 'en',
    dict: null,
    state: { date: null, lat: null, lng: null, timezone: null },

    cities: {}, currentResults: [], activeIndex: -1,
    manualOpen: false, pendingLocation: null,

    scanBlocks: [], activeBlocks: [],
    stepFlow: ['AL', 'A10', 'UL', 'Asc'], 
    currentStepIdx: 0, currentOptions: [],

    setupUI() {
        const ySel = document.getElementById('shin-date-y');
        if (!ySel || ySel.dataset.bound) return; 
        ySel.dataset.bound = "true";

        fetch('/api/cities').then(r => r.json()).then(d => this.cities = d);
        fetch('/api/theory/citrinitas/shin').then(r => r.json()).then(d => { if(!d.error) this.dict = d; });

        const mSel = document.getElementById('shin-date-m');
        const dSel = document.getElementById('shin-date-d');
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

        const cityInp = document.getElementById('shin-city-search');
        const cityRes = document.getElementById('shin-city-results');
        const manualToggle = document.getElementById('shin-manual-toggle');
        const manualPanel = document.getElementById('shin-manual-panel');

        const selectCity = (d) => {
            if(!d) return;
            this.pendingLocation = { label: d.label, lat: d.lat, lng: d.lon || d.lng, timezone: d.tz || "UTC" };
            cityInp.value = d.label; cityRes.style.display = 'none';
        };

        cityInp.addEventListener('input', (e) => {
            if(this.manualOpen) {
                this.manualOpen = false;
                manualPanel.style.display = 'none';
                manualPanel.classList.add('m-shin-hidden'); 
                manualToggle.textContent = 'or Manual Entry ▾';
            } 
            const q = e.target.value.trim().toLowerCase();
            if(!q) { cityRes.style.display = 'none'; return; }
            
            this.currentResults = Object.values(this.cities).filter(c => c.label.toLowerCase().includes(q)).slice(0, 8);
            cityRes.innerHTML = '';
            cityRes.style.display = this.currentResults.length ? 'block' : 'none';
            this.currentResults.forEach(d => {
                const div = document.createElement('div');
                div.className = 'm-c1-result-item'; 
                const tzSign = d.tz >= 0 ? '+' : '';
                div.innerHTML = `<strong>${d.label}</strong><br><span style="font-size:0.75rem; color:#888;">Lat: ${d.lat}, Lng: ${d.lon || d.lng} / UTC ${tzSign}${d.tz}</span>`;
                div.onclick = () => selectCity(d);
                cityRes.appendChild(div);
            });
        });

        manualToggle.onclick = () => {
            this.manualOpen = !this.manualOpen;
            manualPanel.style.display = this.manualOpen ? 'block' : 'none';
            if (this.manualOpen) manualPanel.classList.remove('m-shin-hidden');
            else manualPanel.classList.add('m-shin-hidden');
            manualToggle.textContent = this.manualOpen ? 'Manual Entry ▴' : 'or Manual Entry ▾';
            if(this.manualOpen) { cityInp.value = ''; this.pendingLocation = null; }
        };

        // 🚀 터치 클릭으로 N/S, E/W 값 변경 (Hover/툴팁 제거)
        document.querySelectorAll('#shin-manual-panel .m-c1-sign-btn').forEach(btn => {
            btn.onclick = () => {
                const target = btn.dataset.target;
                document.querySelectorAll(`#shin-manual-panel .m-c1-sign-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        const tzSel = document.getElementById('shin-tz');
        if (tzSel) {
            tzSel.innerHTML = '';
            for(let i=-12; i<=14; i++) {
                let opt = new Option(`UTC${i>=0?'+':''}${i}`, i);
                if(i===9) opt.selected = true; 
                tzSel.appendChild(opt);
            }
        }
    },

    async initiateScan() {
        const ySel = document.getElementById('shin-date-y');
        if(!ySel) { alert("Form not fully loaded."); return; }

        let finalLoc = null;
        if (this.manualOpen) {
            const latVal = (parseInt(document.getElementById('shin-lat-int').value||0) + parseFloat("0."+(document.getElementById('shin-lat-dec').value||0))) * (document.querySelector('#shin-manual-panel .m-c1-sign-btn[data-target="lat"].active').dataset.sign === '+' ? 1 : -1);
            const lngVal = (parseInt(document.getElementById('shin-lng-int').value||0) + parseFloat("0."+(document.getElementById('shin-lng-dec').value||0))) * (document.querySelector('#shin-manual-panel .m-c1-sign-btn[data-target="lng"].active').dataset.sign === '+' ? 1 : -1);
            if(latVal === 0 && lngVal === 0) { alert("Coordinates Required"); return; }
            finalLoc = { lat: latVal, lng: lngVal, timezone: document.getElementById('shin-tz').value || "UTC" }; 
        } else {
            if(!this.pendingLocation) { alert("Location Required"); return; }
            finalLoc = this.pendingLocation;
        }

        this.state.lat = finalLoc.lat; this.state.lng = finalLoc.lng; this.state.timezone = finalLoc.timezone;
        this.state.date = `${ySel.value}-${String(document.getElementById('shin-date-m').value).padStart(2,'0')}-${String(document.getElementById('shin-date-d').value).padStart(2,'0')}`;

        try {
            const res = await fetch('/api/astro/citrinitas/shin/scan', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: this.state.date, timezone: String(this.state.timezone), time_blocks: [{ start: "00:00", end: "23:59", lat: this.state.lat, lng: this.state.lng }] })
            });
            const data = await res.json();
            if (data.error) { alert("Error: " + data.error); return; }

            this.scanBlocks = data.blocks; this.activeBlocks = [...data.blocks];
            this.currentStepIdx = 0;
            this.switchStep('step-2-questions');
            this.renderCurrentStep();
        } catch (e) { console.error(e); }
    },

    renderCurrentStep() {
        if (this.currentStepIdx >= this.stepFlow.length) { this.showResults(); return; }

        const stepKey = this.stepFlow[this.currentStepIdx];
        const area = document.getElementById('q-render-area');
        area.innerHTML = ''; this.currentOptions = [];

        if (this.activeBlocks.length === 0) { this.showResults(); return; }

        setTimeout(() => document.getElementById('shin-app').scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);

        if (stepKey === 'Asc') {
            const combos = [...new Set(this.activeBlocks.map(b => `${b.tropical_asc}_${b.sidereal_asc}`))];
            if (combos.length <= 1) { this.showResults(); return; }
            this.currentOptions = combos;
            this.renderAscQuestions(area, combos);
            document.getElementById('shin-next-btn').innerText = "CONSUMMATE";
            return;
        }

        document.getElementById('shin-next-btn').innerText = "NEXT";
        const uniqueHouses = [...new Set(this.activeBlocks.map(b => b.arudha[stepKey].house))];
        this.currentOptions = uniqueHouses;
        const stepDict = this.dict.arudha_questions[stepKey];

        let html = `<div class="m-q-block"><div class="m-q-title">${stepDict.title[this.lang]}</div><div class="m-q-narrative">${stepDict.narrative[this.lang].join('<br>')}</div>`;
        uniqueHouses.forEach(h => {
            const optData = stepDict.options[h];
            html += `
                <div class="m-q-option-block" data-val="${h}">
                    <div class="m-q-archetype">${optData.archetype[this.lang]}</div>
                    <div class="m-q-desc">${optData.desc[this.lang].join('<br>')}</div>
                    <div class="m-shin-radio-group">
                        <input type="radio" id="q_${stepKey}_${h}_O" name="q_${stepKey}_${h}" value="O">
                        <label class="m-shin-radio-label" for="q_${stepKey}_${h}_O">YES (O)</label>
                        <input type="radio" id="q_${stepKey}_${h}_?" name="q_${stepKey}_${h}" value="?">
                        <label class="m-shin-radio-label" for="q_${stepKey}_${h}_?">MAYBE (?)</label>
                        <input type="radio" id="q_${stepKey}_${h}_X" name="q_${stepKey}_${h}" value="X">
                        <label class="m-shin-radio-label" for="q_${stepKey}_${h}_X">NO (X)</label>
                    </div>
                </div>`;
        });
        area.innerHTML = html + `</div>`;
    },

    renderAscQuestions(area, combos) {
        const ascDict = this.dict.ascendant_final;
        let html = `<div class="m-q-block"><div class="m-q-title">${ascDict.title[this.lang]}</div><div class="m-q-narrative">${ascDict.narrative[this.lang].join('<br>')}</div>`;
        combos.forEach(combo => {
            const [trop, sid] = combo.split('_');
            html += `
                <div class="m-q-option-block" data-val="${combo}">
                    <div class="m-q-archetype">Tropical ${trop} | Sidereal ${sid}</div>
                    <div class="m-q-desc">${ascDict.components.base[trop][this.lang]}<br><br>${ascDict.components.undertone[sid][this.lang]}</div>
                    <div class="m-shin-radio-group">
                        <input type="radio" id="q_Asc_${combo}_O" name="q_Asc_${combo}" value="O">
                        <label class="m-shin-radio-label" for="q_Asc_${combo}_O">YES (O)</label>
                        <input type="radio" id="q_Asc_${combo}_?" name="q_Asc_${combo}" value="?">
                        <label class="m-shin-radio-label" for="q_Asc_${combo}_?">MAYBE (?)</label>
                        <input type="radio" id="q_Asc_${combo}_X" name="q_Asc_${combo}" value="X">
                        <label class="m-shin-radio-label" for="q_Asc_${combo}_X">NO (X)</label>
                    </div>
                </div>`;
        });
        area.innerHTML = html + `</div>`;
    },

    processNext() {
        const stepKey = this.stepFlow[this.currentStepIdx];
        let eliminatedValues = [], allAnswered = true;
        this.currentOptions.forEach(optVal => {
            const radio = document.querySelector(`input[name="q_${stepKey}_${optVal}"]:checked`);
            if (!radio) allAnswered = false; 
            else if (radio.value === 'X') eliminatedValues.push(String(optVal));
        });

        if (!allAnswered) { alert("You must answer all Questions."); return; }
        if (eliminatedValues.length === this.currentOptions.length) { alert("At least one option must be selected as YES (O) or MAYBE (?)."); return; }

        this.activeBlocks = this.activeBlocks.filter(b => stepKey === 'Asc' ? !eliminatedValues.includes(`${b.tropical_asc}_${b.sidereal_asc}`) : !eliminatedValues.includes(String(b.arudha[stepKey].house)));
        this.currentStepIdx++; this.renderCurrentStep();
    },

    goBack() {
        if (this.currentStepIdx > 0) { this.currentStepIdx--; this.renderCurrentStep(); } 
        else this.switchStep('step-1-input');
    },

    showResults() {
        this.switchStep('step-3-results');
        const resArea = document.getElementById('res-blocks');
        setTimeout(() => document.getElementById('shin-app').scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        
        if (this.activeBlocks.length === 0) { resArea.innerHTML = "<span class='m-shin-error-text'>All time blocks were eliminated. Ritual failed.</span>"; return; }

        let merged = [];
        this.activeBlocks.forEach(b => {
            if (merged.length === 0) merged.push({...b});
            else {
                let last = merged[merged.length - 1];
                if (last.key === b.key && last.end === b.start) last.end = b.end;
                else merged.push({...b});
            }
        });

        let html = "";
        merged.forEach(b => {
            html += `
                <div class="m-shin-result-item">
                    <div class="m-shin-res-time-line"><span class="m-shin-bullet">*</span><span class="m-shin-result-time">${b.start} - ${b.end}</span></div>
                    <div class="m-shin-res-line m-shin-res-arudha">AL: ${b.arudha.AL.sign} H${b.arudha.AL.house} | A7: ${b.arudha.A7.sign} H${b.arudha.A7.house} | A10: ${b.arudha.A10.sign} H${b.arudha.A10.house} | UL: ${b.arudha.UL.sign} H${b.arudha.UL.house}</div>
                    <div class="m-shin-res-line m-shin-res-asc">Ascendant: ${b.tropical_asc} | Sid_Asc: ${b.sidereal_asc}</div>
                </div>`;
        });
        resArea.innerHTML = html;
    },

    switchStep(stepId) {
        ['step-1-input', 'step-2-questions', 'step-3-results'].forEach(s => {
            const el = document.getElementById(s);
            if (el) {
                if (s === stepId) { el.classList.add('active'); el.style.display = 'block'; } 
                else { el.classList.remove('active'); el.style.display = 'none'; }
            }
        });
    },

    resetRitual() {
        this.activeBlocks = [...this.scanBlocks]; this.currentStepIdx = 0; this.switchStep('step-1-input');
    }
};

window.initC2Shin = function() { if (window.Shin && typeof window.Shin.setupUI === 'function') window.Shin.setupUI(); };
if (document.getElementById('shin-date-y')) window.Shin.setupUI();

const shinObserver = new MutationObserver(() => {
    const ySel = document.getElementById('shin-date-y');
    if (ySel && !ySel.dataset.bound) window.Shin.setupUI();
});
shinObserver.observe(document.body, { childList: true, subtree: true });