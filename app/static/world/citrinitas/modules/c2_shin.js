// app/static/world/citrinitas/modules/c2_shin.js

window.Shin = {
    lang: (typeof WorldSettings !== 'undefined') ? WorldSettings.get('lang', 'en') : 'en',
    dict: null,
    state: { date: null, lat: null, lng: null, timezone: null },

    // 🚨 Aleph에서 쓰던 UI 상태 변수 완벽 복구
    cities: {}, 
    currentResults: [],
    activeIndex: -1,
    manualOpen: false,
    pendingLocation: null,

    scanBlocks: [],
    activeBlocks: [],

    stepFlow: ['AL', 'A10', 'UL', 'Asc'], // 👈 'A7' 제거함
    currentStepIdx: 0,
    currentOptions: [],

    setupUI() {
        const ySel = document.getElementById('shin-date-y');
        if (!ySel || ySel.dataset.bound) return; 
        ySel.dataset.bound = "true";

        console.log("[C2 Shin] Setting up UI synchronously...");

        fetch('/api/cities')
            .then(r => r.json())
            .then(d => this.cities = d)
            .catch(e => console.error("Cities Load Error:", e));
            
        fetch('/api/theory/citrinitas/shin')
            .then(r => r.json())
            .then(d => {
                if(d.error) console.error("Dict Error:", d.error);
                else {
                    this.dict = d;
                    console.log("✅ [C2 Shin] Dictionary loaded.");
                }
            })
            .catch(e => console.error("Dict Load Error:", e));

        const mSel = document.getElementById('shin-date-m');
        const dSel = document.getElementById('shin-date-d');
        
        // 🚨 Aleph와 동일한 날짜 생성 및 2000-01-01 디폴트 로직 완벽 복구
        const currYear = new Date().getFullYear();
        ySel.innerHTML = ''; mSel.innerHTML = ''; dSel.innerHTML = ''; 
        
        for(let i = currYear; i >= 1900; i--) {
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

        console.log("[C2 Shin] Setting default date to 2000-01-01");
        ySel.value = 2000;
        mSel.value = 1; 
        adjustDays();   
        dSel.value = 1; 

        const cityInp = document.getElementById('shin-city-search');
        const cityRes = document.getElementById('shin-city-results');
        const manualToggle = document.getElementById('shin-manual-toggle');
        const manualPanel = document.getElementById('shin-manual-panel');

        const renderResults = () => {
            cityRes.innerHTML = '';
            cityRes.style.display = this.currentResults.length ? 'block' : 'none';
            this.currentResults.forEach((c, i) => {
                const div = document.createElement('div');
                // 👉 키보드로 선택되었을 때 'active' 클래스 부여
                div.className = `c1-result-item ${i === this.activeIndex ? 'active' : ''}`;
                
                // 👉 2줄 포맷팅 복구
                const tzSign = c.tz >= 0 ? '+' : '';
                div.innerHTML = `<strong>${c.label}</strong><br><span style="font-size:0.8rem; color:var(--c1-gray);">Lat: ${c.lat}, Lng: ${c.lon || c.lng} / UTC ${tzSign}${c.tz}</span>`;
                
                div.onmousedown = () => selectCity(i);
                cityRes.appendChild(div);
            });
        };

        const selectCity = (index) => {
            const d = this.currentResults[index];
            if(!d) return;
            this.pendingLocation = { label: d.label, lat: d.lat, lng: d.lon || d.lng, timezone: d.tz || "UTC" };
            cityInp.value = d.label;
            cityRes.style.display = 'none';
            this.activeIndex = -1; // 선택 완료 후 인덱스 초기화
        };

        cityInp.addEventListener('input', (e) => {
            if(this.manualOpen) {
                this.manualOpen = false;
                manualPanel.style.display = 'none';
                manualPanel.classList.add('shin-hidden'); // 👈 이 줄 추가
                manualToggle.textContent = 'or Manual Entry ▾';
            } 
            const q = e.target.value.trim().toLowerCase();
            if(!q) { cityRes.style.display = 'none'; return; }
            
            this.currentResults = Object.values(this.cities).filter(c => c.label.toLowerCase().includes(q)).slice(0, 8);
            this.activeIndex = -1; 
            renderResults();
        });

        // 👉 방향키 네비게이션 핵심 로직
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
                if(this.activeIndex >= 0) {
                    selectCity(this.activeIndex);
                }
            }
        });

        cityInp.addEventListener('blur', () => {
            setTimeout(() => cityRes.style.display = 'none', 200);
        });

        manualToggle.onclick = () => {
            this.manualOpen = !this.manualOpen;
            manualPanel.style.display = this.manualOpen ? 'block' : 'none';
            
            // 👈 이 부분 추가: CSS의 !important 무력화
            if (this.manualOpen) {
                manualPanel.classList.remove('shin-hidden');
            } else {
                manualPanel.classList.add('shin-hidden');
            }

            manualToggle.textContent = this.manualOpen ? 'Manual Entry ▴' : 'or Manual Entry ▾';
            if(this.manualOpen) {
                cityInp.value = '';
                this.pendingLocation = null;
            }
        };

        let tooltip = document.getElementById('shin-sign-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'shin-sign-tooltip';
            tooltip.style.cssText = "position: fixed; background: rgba(59,59,59,0.9); color: #fff; padding: 4px 8px; font-size: 0.75rem; border-radius: 3px; pointer-events: none; z-index: 9999; opacity: 0; transition: opacity 0.1s;";
            document.body.appendChild(tooltip);
        }

        document.querySelectorAll('#shin-manual-panel .c1-sign-btn').forEach(btn => {
            if(btn.dataset.bound) return;
            
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                document.querySelectorAll(`#shin-manual-panel .c1-sign-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
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
            
            btn.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
            });

            btn.dataset.bound = "true";
        });
        
        const setupNumeric = (id, min, max, digits) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener("input", () => {
                if (digits) {
                    el.value = el.value.replace(/\D/g, "").slice(0, digits);
                } else {
                    let v = parseInt(el.value || "0", 10);
                    if (isNaN(v)) el.value = "";
                    else el.value = Math.max(min, Math.min(max, v));
                }
            });
        };
        setupNumeric('shin-lat-int', 0, 90);
        setupNumeric('shin-lat-dec', 0, 0, 4);
        setupNumeric('shin-lng-int', 0, 180);
        setupNumeric('shin-lng-dec', 0, 0, 4);

        const tzSel = document.getElementById('shin-tz');
        if (tzSel && !tzSel.dataset.bound) {
            const tzNames = {
                "-10": "HST", "-8": "PST", "-7": "MST", "-6": "CST", "-5": "EST",
                "0": "UTC/GMT", "+1": "CET", "+2": "EET", "+3": "MSK", "+5.5": "IST",
                "+7": "WIB", "+8": "CST/SGT", "+9": "KST/JST", "+10": "AEST", "+12": "NZST"
            };
            tzSel.innerHTML = '';
            for(let i=-12; i++ < 14 || i===14;) {} // reset
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
    },

    async initiateScan() {
        const ySel = document.getElementById('shin-date-y');
        if(!ySel) { alert("Form not fully loaded."); return; }

        const y = ySel.value;
        const m = String(document.getElementById('shin-date-m').value).padStart(2,'0');
        const d = String(document.getElementById('shin-date-d').value).padStart(2,'0');
        this.state.date = `${y}-${m}-${d}`;

        let finalLoc = null;

        if (this.manualOpen) {
            const latInt = document.getElementById('shin-lat-int').value || 0;
            const latDec = document.getElementById('shin-lat-dec').value || 0;
            const lngInt = document.getElementById('shin-lng-int').value || 0;
            const lngDec = document.getElementById('shin-lng-dec').value || 0;
            
            const latSign = document.querySelector('#shin-manual-panel .c1-sign-btn[data-target="lat"].active').dataset.sign === '+' ? 1 : -1;
            const lngSign = document.querySelector('#shin-manual-panel .c1-sign-btn[data-target="lng"].active').dataset.sign === '+' ? 1 : -1;

            const latVal = (parseInt(latInt) + parseFloat("0." + latDec)) * latSign;
            const lngVal = (parseInt(lngInt) + parseFloat("0." + lngDec)) * lngSign;

            const tzSel = document.getElementById('shin-tz');
            const tzVal = tzSel ? tzSel.value : "UTC";

            if(latVal === 0 && lngVal === 0) { alert("Coordinates Required"); return; }
            finalLoc = { lat: latVal, lng: lngVal, timezone: tzVal }; 
        } else {
            if(!this.pendingLocation) { alert("Location Required"); return; }
            finalLoc = this.pendingLocation;
        }

        this.state.lat = finalLoc.lat;
        this.state.lng = finalLoc.lng;
        this.state.timezone = finalLoc.timezone || "UTC";

        console.log("[Shin] Requesting Engine Scan...", this.state);

        const payload = {
            date: this.state.date,
            timezone: String(this.state.timezone),
            time_blocks: [{ start: "00:00", end: "23:59", lat: this.state.lat, lng: this.state.lng }]
        };

        try {
            const res = await fetch('/api/astro/citrinitas/shin/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.error) {
                alert("Error: " + data.error);
                return;
            }

            this.scanBlocks = data.blocks;
            this.activeBlocks = [...data.blocks];
            this.currentStepIdx = 0;
            
            this.switchStep('step-2-questions');
            this.renderCurrentStep();

        } catch (e) {
            console.error(e);
        }
    },

    renderCurrentStep() {
        if (this.currentStepIdx >= this.stepFlow.length) {
            this.showResults();
            return;
        }

        const stepKey = this.stepFlow[this.currentStepIdx];
        const area = document.getElementById('q-render-area');
        area.innerHTML = '';
        this.currentOptions = [];

        if (this.activeBlocks.length === 0) {
            this.showResults();
            return;
        }

        // 🚀 [추가] 다음 질문 렌더링 시 무조건 화면 최상단으로 스크롤 끌어올리기
        setTimeout(() => {
            const app = document.getElementById('shin-app');
            if (app) app.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);

        if (stepKey === 'Asc') {
            const combos = [...new Set(this.activeBlocks.map(b => `${b.tropical_asc}_${b.sidereal_asc}`))];
            
            if (combos.length <= 1) {
                this.showResults();
                return;
            }

            this.currentOptions = combos;
            this.renderAscQuestions(area, combos);
            document.getElementById('shin-next-btn').innerText = "CONSUMMATE";
            return;
        }

        document.getElementById('shin-next-btn').innerText = "NEXT";
        const uniqueHouses = [...new Set(this.activeBlocks.map(b => b.arudha[stepKey].house))];
        this.currentOptions = uniqueHouses;

        const stepDict = this.dict.arudha_questions[stepKey];
        let html = `
            <div class="q-block">
                <div class="q-title">${stepDict.title[this.lang]}</div>
                <div class="q-narrative">${stepDict.narrative[this.lang].join('<br>')}</div>
        `;

        uniqueHouses.forEach(h => {
            const optData = stepDict.options[h];
            html += `
                <div class="q-option-block" data-val="${h}">
                    <div class="q-archetype">${optData.archetype[this.lang]}</div>
                    <div class="q-desc">${optData.desc[this.lang].join('<br>')}</div>
                    
                    <div class="shin-radio-group">
                        <input type="radio" id="q_${stepKey}_${h}_O" name="q_${stepKey}_${h}" value="O">
                        <label class="shin-radio-label" for="q_${stepKey}_${h}_O">YES (O)</label>
                        
                        <input type="radio" id="q_${stepKey}_${h}_?" name="q_${stepKey}_${h}" value="?">
                        <label class="shin-radio-label" for="q_${stepKey}_${h}_?">MAYBE (?)</label>
                        
                        <input type="radio" id="q_${stepKey}_${h}_X" name="q_${stepKey}_${h}" value="X">
                        <label class="shin-radio-label" for="q_${stepKey}_${h}_X">NO (X)</label>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        area.innerHTML = html;
    },

    renderAscQuestions(area, combos) {
        const ascDict = this.dict.ascendant_final;
        let html = `
            <div class="q-block">
                <div class="q-title">${ascDict.title[this.lang]}</div>
                <div class="q-narrative">${ascDict.narrative[this.lang].join('<br>')}</div>
        `;

        combos.forEach(combo => {
            const [trop, sid] = combo.split('_');
            const baseText = ascDict.components.base[trop][this.lang];
            const underText = ascDict.components.undertone[sid][this.lang];
            const archetype = `Tropical ${trop} | Sidereal ${sid}`;

            html += `
                <div class="q-option-block" data-val="${combo}">
                    <div class="q-archetype">${archetype}</div>
                    <div class="q-desc">${baseText}<br><br>${underText}</div>
                    
                    <div class="shin-radio-group">
                        <input type="radio" id="q_Asc_${combo}_O" name="q_Asc_${combo}" value="O">
                        <label class="shin-radio-label" for="q_Asc_${combo}_O">YES (O)</label>
                        
                        <input type="radio" id="q_Asc_${combo}_?" name="q_Asc_${combo}" value="?">
                        <label class="shin-radio-label" for="q_Asc_${combo}_?">MAYBE (?)</label>
                        
                        <input type="radio" id="q_Asc_${combo}_X" name="q_Asc_${combo}" value="X">
                        <label class="shin-radio-label" for="q_Asc_${combo}_X">NO (X)</label>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        area.innerHTML = html;
    },

    processNext() {
        const stepKey = this.stepFlow[this.currentStepIdx];
        let eliminatedValues = [];
        let allAnswered = true; // 🚀 답변 누락 방지 플래그

        this.currentOptions.forEach(optVal => {
            const radio = document.querySelector(`input[name="q_${stepKey}_${optVal}"]:checked`);
            if (!radio) {
                allAnswered = false; // 체크 안 된 항목 발견
            } else if (radio.value === 'X') {
                eliminatedValues.push(String(optVal));
            }
        });

        // 1. 하나라도 답변을 안 하고 NEXT를 누르면 경고창 띄우기
        if (!allAnswered) {
            alert("You must answer all Questions.");
            return;
        }

        // 🚨 [추가된 부분] 모든 항목을 X로 선택했는지 검사해서 입구컷하기
        if (eliminatedValues.length === this.currentOptions.length) {
            alert("At least one option must be selected as YES (O) or MAYBE (?).");
            return;
        }

        const beforeCount = this.activeBlocks.length; // 소거 전 블록 개수 기록

        this.activeBlocks = this.activeBlocks.filter(b => {
            if (stepKey === 'Asc') {
                const combo = `${b.tropical_asc}_${b.sidereal_asc}`;
                return !eliminatedValues.includes(combo);
            } else {
                return !eliminatedValues.includes(String(b.arudha[stepKey].house));
            }
        });

        // F12 콘솔에서 깔때기(Funnel)가 몇 개를 소거했는지 실시간 확인 가능
        console.log(`[Shin Funnel - ${stepKey}] 블록 소거됨: ${beforeCount}개 -> ${this.activeBlocks.length}개 생존`);

        this.currentStepIdx++;
        this.renderCurrentStep();
    },

    goBack() {
        if (this.currentStepIdx > 0) {
            this.currentStepIdx--;
            this.renderCurrentStep();
        } else {
            this.switchStep('step-1-input');
        }
    },

    showResults() {
        this.switchStep('step-3-results');
        const resArea = document.getElementById('res-blocks');
        
        // 🚀 [추가] 결과창 진입 시에도 화면 최상단으로 스크롤 끌어올리기
        setTimeout(() => {
            const app = document.getElementById('shin-app');
            if (app) app.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
        
        if (this.activeBlocks.length === 0) {
            resArea.innerHTML = "<span class='shin-error-text'>All time blocks were eliminated. Ritual failed.</span>";
            return;
        }

        let merged = [];
        this.activeBlocks.forEach(b => {
            if (merged.length === 0) {
                merged.push({...b});
            } else {
                let last = merged[merged.length - 1];
                if (last.key === b.key && last.end === b.start) { 
                    last.end = b.end;
                } else {
                    merged.push({...b});
                }
            }
        });

        let html = "";
        merged.forEach(b => {
            html += `
                <div class="shin-result-item">
                    <div class="shin-res-time-line">
                        <span class="shin-bullet">*</span>
                        <span class="shin-result-time">${b.start} - ${b.end}</span>
                    </div>
                    <div class="shin-res-line shin-res-arudha">
                        AL: ${b.arudha.AL.sign} H${b.arudha.AL.house} | A7: ${b.arudha.A7.sign} H${b.arudha.A7.house} | A10: ${b.arudha.A10.sign} H${b.arudha.A10.house} | UL: ${b.arudha.UL.sign} H${b.arudha.UL.house}
                    </div>
                    <div class="shin-res-line shin-res-asc">
                        Ascendant: ${b.tropical_asc} | Sid_Asc: ${b.sidereal_asc}
                    </div>
                </div>
            `;
        });

        resArea.innerHTML = html;
    },

    switchStep(stepId) {
        ['step-1-input', 'step-2-questions', 'step-3-results'].forEach(s => {
            const el = document.getElementById(s);
            if (el) {
                if (s === stepId) {
                    // 선택된 스텝은 클래스도 달아주고 화면에 강제로 띄움
                    // (입력폼은 flex 레이아웃을 깨지 않기 위해 분기 처리)
                    el.classList.add('active');
                    el.style.display = (s === 'step-1-input') ? 'flex' : 'block';
                } else {
                    // 선택되지 않은 스텝은 무조건 강제 숨김
                    el.classList.remove('active');
                    el.style.display = 'none';
                }
            }
        });
    },

    resetRitual() {
        this.activeBlocks = [...this.scanBlocks];
        this.currentStepIdx = 0;
        this.switchStep('step-1-input');
    }
};

window.initC2Shin = function() {
    if (window.Shin && typeof window.Shin.setupUI === 'function') {
        window.Shin.setupUI();
    }
};

if (document.getElementById('shin-date-y')) {
    window.Shin.setupUI();
}

const shinObserver = new MutationObserver(() => {
    const ySel = document.getElementById('shin-date-y');
    if (ySel && !ySel.dataset.bound) {
        window.Shin.setupUI();
    }
});
shinObserver.observe(document.body, { childList: true, subtree: true });