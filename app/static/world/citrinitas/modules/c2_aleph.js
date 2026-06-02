// app/static/world/citrinitas/modules/c2_aleph.js

window.Aleph = {
    lang: (typeof WorldSettings !== 'undefined') ? WorldSettings.get('lang', 'ko') : 'ko',
    dict: null,
    state: { date: null, lat: null, lng: null, timezone: null, answers: {} },
    
    cities: {}, 
    currentResults: [],
    activeIndex: -1,
    manualOpen: false,
    pendingLocation: null,
    scanResults: null, 

    setupUI() {
        const ySel = document.getElementById('c2-date-y');
        if (!ySel || ySel.dataset.bound) return; 
        ySel.dataset.bound = "true";

        console.log("[C2 Aleph] Setting up UI synchronously...");

        fetch('/api/cities')
            .then(r => r.json())
            .then(d => this.cities = d)
            .catch(e => console.error("Cities Load Error:", e));
            
        fetch('/api/theory/citrinitas/aleph')
            .then(r => r.json())
            .then(d => {
                if(d.error) console.error("Dict Error:", d.error);
                else {
                    this.dict = d;
                    console.log("✅ [C2 Aleph] Dictionary loaded.", Object.keys(d));
                }
            })
            .catch(e => console.error("Dict Load Error:", e));

        const mSel = document.getElementById('c2-date-m');
        const dSel = document.getElementById('c2-date-d');
        
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

        console.log("[C2 Aleph] Setting default date to 2000-01-01");
        ySel.value = 2000;
        mSel.value = 1; 
        adjustDays();   
        dSel.value = 1; 

        const cityInp = document.getElementById('c2-city-search');
        const cityRes = document.getElementById('c2-city-results');
        const manualToggle = document.getElementById('c2-manual-toggle');
        const manualPanel = document.getElementById('c2-manual-panel');

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
            cityInp.value = d.label;
            cityRes.style.display = 'none';
            this.activeIndex = -1;
        };

        cityInp.addEventListener('input', (e) => {
            if(this.manualOpen) {
                this.manualOpen = false;
                manualPanel.style.display = 'none';
                manualToggle.textContent = 'or Manual Entry ▾';
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

        cityInp.addEventListener('blur', () => {
            setTimeout(() => cityRes.style.display = 'none', 200);
        });

        manualToggle.onclick = () => {
            this.manualOpen = !this.manualOpen;
            manualPanel.style.display = this.manualOpen ? 'block' : 'none';
            manualToggle.textContent = this.manualOpen ? 'Manual Entry ▴' : 'or Manual Entry ▾';
            if(this.manualOpen) {
                cityInp.value = '';
                this.pendingLocation = null;
            }
        };

        let tooltip = document.getElementById('c2-sign-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'c2-sign-tooltip';
            tooltip.style.cssText = "position: fixed; background: rgba(59,59,59,0.9); color: #fff; padding: 4px 8px; font-size: 0.75rem; border-radius: 3px; pointer-events: none; z-index: 9999; opacity: 0; transition: opacity 0.1s;";
            document.body.appendChild(tooltip);
        }

        document.querySelectorAll('#c2-manual-panel .c1-sign-btn').forEach(btn => {
            if(btn.dataset.bound) return;
            
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                document.querySelectorAll(`#c2-manual-panel .c1-sign-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
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
        setupNumeric('c2-lat-int', 0, 90);
        setupNumeric('c2-lat-dec', 0, 0, 4);
        setupNumeric('c2-lng-int', 0, 180);
        setupNumeric('c2-lng-dec', 0, 0, 4);

        const tzSel = document.getElementById('c2-tz');
        if (tzSel && !tzSel.dataset.bound) {
            const tzNames = {
                "-10": "HST", "-8": "PST", "-7": "MST", "-6": "CST", "-5": "EST",
                "0": "UTC/GMT", "+1": "CET", "+2": "EET", "+3": "MSK", "+5.5": "IST",
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
    }, 

    async submitData() {
        const ySel = document.getElementById('c2-date-y');
        if(!ySel) { alert("Form not fully loaded."); return; }

        const y = ySel.value;
        const m = String(document.getElementById('c2-date-m').value).padStart(2,'0');
        const d = String(document.getElementById('c2-date-d').value).padStart(2,'0');
        this.state.date = `${y}-${m}-${d}`;

        let finalLoc = null;

        if (this.manualOpen) {
            const latInt = document.getElementById('c2-lat-int').value || 0;
            const latDec = document.getElementById('c2-lat-dec').value || 0;
            const lngInt = document.getElementById('c2-lng-int').value || 0;
            const lngDec = document.getElementById('c2-lng-dec').value || 0;
            
            const latSign = document.querySelector('.c1-sign-btn[data-target="lat"].active').dataset.sign === '+' ? 1 : -1;
            const lngSign = document.querySelector('.c1-sign-btn[data-target="lng"].active').dataset.sign === '+' ? 1 : -1;

            const latVal = (parseInt(latInt) + parseFloat("0." + latDec)) * latSign;
            const lngVal = (parseInt(lngInt) + parseFloat("0." + lngDec)) * lngSign;

            const tzSel = document.getElementById('c2-tz');
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

        console.log("[Aleph] Requesting Engine Scan...", this.state);
        
        try {
            const response = await fetch('/api/astro/citrinitas/aleph/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: this.state.date,
                    lat: this.state.lat,
                    lng: this.state.lng,
                    timezone: String(this.state.timezone)
                })
            });
            
            if (!response.ok) {
                const errText = await response.text();
                console.error("[Backend Error]", response.status, errText);
                alert(`통신 에러 (${response.status}): F12 콘솔창을 확인해주세요.`);
                return;
            }

            const data = await response.json();
            
            if (data.error) {
                alert("Scan Error: " + data.error);
                return;
            }

            this.lastScanData = data; 
            this.scanResults = data.timeline_blocks;

            this.renderDisclaimer(data.flags || []);
            this.switchStep('step-2-disclaimer');
            
        } catch (error) {
            console.error("🔥 통신 또는 JS 에러 발생:", error);
            alert(`[오류 발생] ${error.message}\n(F12를 눌러 콘솔을 확인하세요)`);
        }
    },

    renderDisclaimer(flags) {
        console.log("Rendering Disclaimer. Current dict state:", this.dict);

        if (!this.dict) {
            alert("❌ [치명적 에러] 딕셔너리가 비어있습니다!\n원인: 파이썬 서버를 껐다 켜지 않았거나, c2_aleph.json 파일 경로가 틀렸습니다.");
            return;
        }
        
        if (!this.dict.system_messages) {
            alert("❌ [데이터 에러] 딕셔너리를 가져왔으나 엉뚱한 데이터입니다.\n내용: " + JSON.stringify(this.dict));
            return;
        }

        const msgs = this.dict.system_messages;
        const lang = this.lang;

        const disclaimerEl = document.getElementById('disclaimer-text');
        if (disclaimerEl && msgs.disclaimer) {
            const targetMsg = msgs.disclaimer[lang] || msgs.disclaimer['en'];
            disclaimerEl.innerHTML = `<strong>[ GUIDANCE ]</strong><br><br>` + this.formatText(targetMsg);
        }

        const flagsEl = document.getElementById('flags-container');
        if (flagsEl) {
            flagsEl.innerHTML = ""; 
            if (flags && flags.length > 0 && msgs.modifiers) {
                let flagHtml = `<br><strong>[ DETECTED ASTRAL MODIFIERS ]</strong><br><br>`;
                let hasValidFlags = false;

                flags.forEach(flag => {
                    if (msgs.modifiers[flag]) {
                        hasValidFlags = true;
                        const targetFlagMsg = msgs.modifiers[flag][lang] || msgs.modifiers[flag]['en'];
                        flagHtml += `<div class="c2-flag-item" style="padding:10px; margin-bottom:10px; border-left: 3px solid #ff4444; background: rgba(255, 68, 68, 0.1);">` 
                                  + this.formatText(targetFlagMsg) 
                                  + `</div>`;
                    }
                });

                if (hasValidFlags) {
                    flagsEl.innerHTML = flagHtml;
                }
            }
        }
    },

    startQuestionnaire() {
        this.switchStep('step-3-questions');
        if (!this.lastScanData || !this.dict || !this.scanResults) return;

        this.activeBlocks = JSON.parse(JSON.stringify(this.scanResults)); 
        this.currentLayer = 1; 
        this.state.answers = {}; 
        
        // 🚀 추가: 뒤로 가기를 위한 히스토리 저장소 (1층 시작 전 상태 백업)
        this.historyBlocks = [JSON.parse(JSON.stringify(this.scanResults))];

        this.renderCurrentLayer();
    },

    renderCurrentLayer() {
        const renderArea = document.getElementById('q-render-area');
        renderArea.innerHTML = ""; 

        if (this.activeBlocks.length === 0) {
            renderArea.innerHTML = `
                <div style='color:#ff4444; text-align:center; padding: 2rem;'>
                    모든 시간대가 배제되었습니다. 선택을 다시 확인해주세요.<br><br>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="c1-action-btn" style="flex:1; background: transparent; border: 1px solid #777; color: #777;" 
                                onclick="Aleph.currentLayer=1; Aleph.activeBlocks=JSON.parse(JSON.stringify(Aleph.scanResults)); Aleph.state.answers={}; Aleph.renderCurrentLayer();">
                            ◀ RESTART
                        </button>
                        <button class="c1-action-btn" style="flex:1; background: #333; border: 1px solid #ff4444; color: #ff4444;" 
                                onclick="Aleph.showResults();">
                            FORCE RESULTS ➔
                        </button>
                    </div>
                </div>`;
            return;
        }

        const dict = this.dict;
        const flags = this.lastScanData.flags || [];
        
        const survivingAscendants = [...new Set(this.activeBlocks.map(b => b.ascendant))];
        const survivingHlAscPairs = [...new Set(this.activeBlocks.map(b => `${b.hour_lord}|${b.ascendant}`))];
        const survivingSatChiPairs = [...new Set(this.activeBlocks.map(b => `${b.saturn_house}|${b.chiron_house}`))];

        // ══════════════════════════════════════════
        // LAYER 1: Mars
        // ══════════════════════════════════════════
        if (this.currentLayer === 1) {
            const isAnaretic = flags.includes("mars_ingress");
            const anInfo = this.lastScanData.mars_ingress_info;
            const marsSign = this.lastScanData.mars_sign; 

            if (isAnaretic && anInfo) {
                // (기존 Anaretic 로직 그대로 유지)
                const key = `${anInfo.from_sign}_to_${anInfo.to_sign}`.toLowerCase();
                if (dict.anaretic_questions && dict.anaretic_questions[key]) {
                    const anData = dict.anaretic_questions[key];
                    const qText = `<b>[Mars Ingress: ${anInfo.from_sign} ➔ ${anInfo.to_sign}]</b><br><br>` 
                                + `Q. ${this.formatText(anData.question[this.lang])}`;
                    const textA = this.formatText(anData["29_deg"][this.lang]);
                    const textB = this.formatText(anData["0_deg"][this.lang]);
                    renderArea.innerHTML += this.buildABQuestionBlock(`q_anaretic`, qText, textA, textB, 'ingress', anInfo.from_sign, anInfo.to_sign);
                }
            } else if (marsSign) {
                if (dict.mars_asc_questions && dict.mars_asc_questions[marsSign]) {
                    
                    // 1층 안내문 렌더링
                    if (dict.system_messages && dict.system_messages.instruction_note) {
                        renderArea.innerHTML += `
                            <div class="instruction-note">
                                <span class="instruction-title">[ INSTRUCTION ]</span><br>
                                ${this.formatText(dict.system_messages.instruction_note[this.lang])}
                            </div>`;
                    }

                    // 🚀 [추가]: 1층 메인 질문(Prompt) 렌더링
                    if (dict.system_messages && dict.system_messages.mars_asc_prompt) {
                        renderArea.innerHTML += `
                            <div class="layer-prompt">
                                <span class="q-mark">Q.</span> ${this.formatText(dict.system_messages.mars_asc_prompt[this.lang])}
                            </div>`;
                    }

                    survivingAscendants.forEach(asc => {
                        if (dict.mars_asc_questions[marsSign][asc]) {
                            const qText = this.formatText(dict.mars_asc_questions[marsSign][asc][this.lang]);
                            renderArea.innerHTML += this.buildQuestionBlock(`q_mars_${asc}`, qText, 'ascendant', asc);
                        }
                    });
                }
            }
            this.appendNextButton("NEXT ➔");
        } 
        // ══════════════════════════════════════════
        // LAYER 2: Hour Lord + Ascendant
        // ══════════════════════════════════════════
        else if (this.currentLayer === 2) {
            // 2층 안내문 렌더링
            if (dict.system_messages && dict.system_messages.instruction_note) {
                renderArea.innerHTML += `
                    <div class="instruction-note">
                        <span class="instruction-title">[ INSTRUCTION ]</span><br>
                        ${this.formatText(dict.system_messages.instruction_note[this.lang])}
                    </div>`;
            }

            // 🚀 [추가]: 2층 메인 질문(Prompt) 렌더링
            if (dict.system_messages && dict.system_messages.hourlord_asc_prompt) {
                renderArea.innerHTML += `
                    <div class="layer-prompt">
                        <span class="q-mark">Q.</span> ${this.formatText(dict.system_messages.hourlord_asc_prompt[this.lang])}
                    </div>`;
            }

            survivingHlAscPairs.forEach(pair => {
                const [hl, asc] = pair.split('|');
                if (dict.hourlord_asc_questions && dict.hourlord_asc_questions[hl] && dict.hourlord_asc_questions[hl][asc]) {
                    const qText = this.formatText(dict.hourlord_asc_questions[hl][asc][this.lang]);
                    renderArea.innerHTML += this.buildQuestionBlock(`q_hl_${hl}_${asc}`, qText, 'hl_asc', pair);
                }
            });
            this.appendNextButton("NEXT ➔");
        }
        // ══════════════════════════════════════════
        // LAYER 3: Saturn & Chiron Houses 조합
        // ══════════════════════════════════════════
        else if (this.currentLayer === 3) {
            // 3층 전용 안내문 렌더링
            if (dict.system_messages && dict.system_messages.instruction_note_saturn_chiron) {
                renderArea.innerHTML += `
                    <div class="instruction-note">
                        <span class="instruction-title">[ INSTRUCTION ]</span><br>
                        ${this.formatText(dict.system_messages.instruction_note_saturn_chiron[this.lang])}
                    </div>`;
            }

            // 🚀 [추가]: 3층 메인 질문(Prompt) 렌더링
            if (dict.system_messages && dict.system_messages.saturn_chiron_prompt) {
                renderArea.innerHTML += `
                    <div class="layer-prompt">
                        <span class="q-mark">Q.</span> ${this.formatText(dict.system_messages.saturn_chiron_prompt[this.lang])}
                    </div>`;
            }

            survivingSatChiPairs.forEach(pair => {
                const [satH, chiH] = pair.split('|');
                let satText = "", chiText = "";
                
                if (dict.house_questions && dict.house_questions.Saturn && dict.house_questions.Saturn[satH]) {
                    satText = this.formatText(dict.house_questions.Saturn[satH][this.lang]);
                }
                if (dict.house_questions && dict.house_questions.Chiron && dict.house_questions.Chiron[chiH]) {
                    chiText = this.formatText(dict.house_questions.Chiron[chiH][this.lang]);
                }

                const qText = `<div class="saturn-text">${satText}</div><div class="chiron-text">${chiText}</div>`;
                renderArea.innerHTML += this.buildQuestionBlock(`q_sc_${satH}_${chiH}`, qText, 'sat_chi', pair);
            });
            
            this.appendNextButton("FINISH ➔", true);
        }

        const generatedBlocks = renderArea.querySelectorAll('.question-block');
        if (generatedBlocks.length === 0) {
            console.log(`[Aleph] 층위 ${this.currentLayer}에서 물어볼 질문이 없습니다. 자동 스킵 발동!`);
            if (this.currentLayer >= 3) {
                this.showResults();
            } else {
                this.currentLayer++;
                this.renderCurrentLayer();
            }
        }
    },

    // 🚀 수정된 네비게이션 버튼 (안전하고 완벽한 일괄 소거법 적용)
    appendNextButton(label, isFinal = false) {
        const renderArea = document.getElementById('q-render-area');
        
        const btnContainer = document.createElement('div');
        btnContainer.style.display = "flex";
        btnContainer.style.gap = "10px";
        btnContainer.style.marginTop = "2rem";

        if (this.currentLayer > 1) {
            const backBtn = document.createElement('button');
            backBtn.className = "c1-action-btn btn-restart"; 
            backBtn.style.flex = "1";
            backBtn.innerText = "◀ PREVIOUS"; 
            
            backBtn.onclick = () => {
                this.currentLayer--;
                // 이전 층위의 상태로 완벽하게 롤백
                this.activeBlocks = JSON.parse(JSON.stringify(this.historyBlocks[this.currentLayer - 1]));
                this.renderCurrentLayer();
                document.getElementById('aleph-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
            btnContainer.appendChild(backBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.id = "aleph-next-btn"; 
        nextBtn.className = "c1-action-btn"; 
        nextBtn.style.flex = "2";
        nextBtn.style.display = "none"; 
        nextBtn.innerText = label;
        
        // 🟢 NEXT 버튼 클릭 시 실행되는 핵심 소거 로직
        nextBtn.onclick = () => {
            const allBlocks = document.querySelectorAll('.question-block');
            let allAnswered = true;
            
            // 모든 질문에 답변했는지 1차 검증
            allBlocks.forEach(b => {
                const qId = b.id.replace('block-', '');
                if (!this.state.answers[qId]) {
                    allAnswered = false;
                }
            });

            if (!allAnswered) {
                alert("질문에 대한 선택지를 먼저 클릭해 주세요.");
                return;
            }

            // 🚀 [버그 픽스]: 현재 층위에 진입했을 때의 '가장 깨끗한 원본'을 복사해서 필터링을 시작합니다.
            let filteredBlocks = JSON.parse(JSON.stringify(this.historyBlocks[this.currentLayer - 1]));

            allBlocks.forEach(b => {
                const qId = b.id.replace('block-', '');
                const ans = this.state.answers[qId];

                if (!ans) return;

                // A/B 양자택일 (Ingress) 필터: 선택한 별자리만 살림
                if (ans.type === 'ingress') {
                    filteredBlocks = filteredBlocks.filter(blk => 
                        blk.mars_sign && blk.mars_sign.toLowerCase() === ans.param.toLowerCase()
                    );
                } 
                // O/X/? 필터: 사용자가 'X(no)'를 선택한 항목들을 무자비하게 쳐냄
                else if (ans.val === 'no') {
                    filteredBlocks = filteredBlocks.filter(blk => {
                        if (ans.type === 'ascendant') return blk.ascendant !== ans.param;
                        if (ans.type === 'hl_asc') return `${blk.hour_lord}|${blk.ascendant}` !== ans.param;
                        if (ans.type === 'sat_chi') return `${blk.saturn_house}|${blk.chiron_house}` !== ans.param;
                        return true; // X가 아닌 나머지는 다 살림
                    });
                }
            });

            // 🚀 필터링이 완료된 깨끗한 배열을 현재 activeBlocks로 덮어씌움
            this.activeBlocks = filteredBlocks;
            console.log(`[Aleph] Layer ${this.currentLayer} 필터링 완료. 남은 시간대 블록 수:`, this.activeBlocks.length);

            // 결과창으로 가거나 다음 층위로 이동
            if (isFinal) {
                this.showResults();
            } else {
                // 다음 층위로 넘어가기 전, 현재 살아남은 블록들을 다시 히스토리에 백업
                this.historyBlocks[this.currentLayer] = JSON.parse(JSON.stringify(this.activeBlocks));
                this.currentLayer++;
                this.renderCurrentLayer();
                document.getElementById('aleph-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
        
        btnContainer.appendChild(nextBtn);
        renderArea.appendChild(btnContainer);
    },

    revealNextButton() {
        const allBlocks = document.querySelectorAll('.question-block');
        let allAnswered = true;
        
        allBlocks.forEach(b => {
            const qId = b.id.replace('block-', '');
            if (!this.state.answers[qId]) {
                allAnswered = false;
            }
        });

        const nextBtn = document.getElementById('aleph-next-btn');
        if (nextBtn && allAnswered && allBlocks.length > 0) {
            nextBtn.style.display = "block"; 
        }
    },

    buildQuestionBlock(qId, text, filterType, filterValue) {
        return `
            <div class="question-block" id="block-${qId}">
                <div class="q-text">${text}</div>
                <div class="q-controls">
                    <button class="ox-btn btn-o" onclick="Aleph.setAnswer('${qId}', 'yes', '${filterType}', '${filterValue}')">O</button>
                    <button class="ox-btn btn-x" onclick="Aleph.setAnswer('${qId}', 'no', '${filterType}', '${filterValue}')">X</button>
                    <button class="ox-btn btn-q" onclick="Aleph.setAnswer('${qId}', 'maybe', '${filterType}', '${filterValue}')">?</button>
                </div>
            </div>`;
    },

    buildABQuestionBlock(qId, questionHtml, textA, textB, filterType, valA, valB) {
        return `
            <div class="question-block mars-ingress-block" id="block-${qId}">
                <div class="q-text">${questionHtml}</div>
                <div class="q-controls-ab" style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
                    <button class="ab-btn btn-a" id="btn-${qId}-a" onclick="Aleph.setABAnswer('${qId}', 'A', '${filterType}', '${valA}')">
                        <b>[ A ]</b> ${textA}
                    </button>
                    <button class="ab-btn btn-b" id="btn-${qId}-b" onclick="Aleph.setABAnswer('${qId}', 'B', '${filterType}', '${valB}')">
                        <b>[ B ]</b> ${textB}
                    </button>
                </div>
            </div>`;
    },

    // 🚀 수정된 O/X/? 답변 설정 로직 (모든 'X' 선택 방지 가드 추가)
    setAnswer(qId, answerVal, filterType, filterValue) {
        
        // 🚀 [추가]: 모든 문항을 'X'로 선택하는 것을 방지하는 가드 로직 (경고문)
        if (answerVal === 'no') {
            const currentQuestions = this.current_layer_questions || [];
            if (currentQuestions.length > 0) {
                let otherAnswered = 0;
                let otherNoCount = 0;
                for (const otherQId of currentQuestions) {
                    if (otherQId === qId) continue; // 현재 문항 제외
                    const ans = this.state.answers[otherQId];
                    if (ans) {
                        otherAnswered++;
                        if (ans.val === 'no') {
                            otherNoCount++;
                        }
                    }
                }

                // 다른 모든 문항이 답변되었고, 그 모두가 'X'인 경우
                if (otherAnswered === currentQuestions.length - 1 && otherNoCount === otherAnswered) {
                    // 가드 발동! 경고창을 띄우고 답변 설정을 중단합니다.
                    alert("You cannot select ❌ for all items."); // 간결한 경고문
                    return; // 함수 실행 중단 -> state 미업데이트, 'X' 버튼 UI 비활성화
                }
            }
        }

        // 값과 필터 속성을 객체로 묶어서 저장 (Next 버튼 누를 때 쓰기 위함)
        this.state.answers[qId] = { val: answerVal, type: filterType, param: filterValue };
        
        const block = document.getElementById(`block-${qId}`);
        block.classList.remove('state-yes', 'state-no', 'state-maybe');
        block.classList.add(`state-${answerVal}`);

        this.revealNextButton(); 
    },

    // 🚀 [6] A/B 양자택일 소거 로직 (팝업 경고 및 즉시 삭제 제거)
    setABAnswer(qId, choice, filterType, keepValue) {
        // 값과 필터 속성을 객체로 묶어서 저장
        this.state.answers[qId] = { val: choice, type: filterType, param: keepValue };

        const btnA = document.getElementById(`btn-${qId}-a`);
        const btnB = document.getElementById(`btn-${qId}-b`);
        
        btnA.classList.remove('active');
        btnB.classList.remove('active');

        if (choice === 'A') btnA.classList.add('active');
        if (choice === 'B') btnB.classList.add('active');

        // 🚨 기존에 있던 에러 팝업창(alert) 및 즉시 삭제 로직 완전 제거
        
        this.revealNextButton(); 
    },

    showResults() {
        this.switchStep('step-4-results');
        
        const totalBlocks = this.activeBlocks.length;
        
        // 🚀 3. 실제 시간대 도출 로직 (시작~종료 시간 렌더링)
        const timesContainer = document.getElementById('res-times');
        timesContainer.innerHTML = ""; // 초기화

        if (totalBlocks === 0) {
            timesContainer.innerHTML = "<div class='res-time-item' style='color:#ff4444;'>모든 시간대가 배제되었습니다.</div>";
        } else {
            // 시간대 리스트 출력 (예: 14:00 - 14:23)
            this.activeBlocks.forEach(b => {
                timesContainer.innerHTML += `<div class='res-time-item'>${b.start} - ${b.end}</div>`;
            });
        }

        const finalAscs = [...new Set(this.activeBlocks.map(b => b.ascendant))].join(", ") || "-";
        const finalHLs = [...new Set(this.activeBlocks.map(b => b.hour_lord))].join(", ") || "-";
        
        document.getElementById('res-asc').innerText = finalAscs;
        document.getElementById('res-hl').innerText = finalHLs;

        const pairsList = document.getElementById('res-pairs');
        pairsList.innerHTML = "";
        
        if (totalBlocks === 0) {
            pairsList.innerHTML = "<li class='res-pair-item'>-</li>";
        } else {
            // 🚀 5. Saturn / Chiron 구분자를 | 로 변경
            const uniquePairs = [...new Set(this.activeBlocks.map(b => `Saturn H${b.saturn_house} | Chiron H${b.chiron_house}`))];
            uniquePairs.forEach(p => {
                pairsList.innerHTML += `<li class='res-pair-item'>${p}</li>`;
            });
        }
    },

    switchStep(stepId) {
        ['step-1-input', 'step-2-disclaimer', 'step-3-questions', 'step-4-results'].forEach(s => {
            const el = document.getElementById(s);
            if (el) el.style.display = (s === stepId) ? 'block' : 'none';
        });
    },

    formatText(textData) {
        return Array.isArray(textData) ? textData.join("<br>") : (textData || "");
    }
};

window.initC2Aleph = function() {
    window.Aleph.setupUI();
};

if (document.getElementById('c2-date-y')) {
    window.Aleph.setupUI();
}

const observer = new MutationObserver(() => {
    const ySel = document.getElementById('c2-date-y');
    if (ySel && !ySel.dataset.bound) {
        window.Aleph.setupUI();
    }
});
observer.observe(document.body, { childList: true, subtree: true });