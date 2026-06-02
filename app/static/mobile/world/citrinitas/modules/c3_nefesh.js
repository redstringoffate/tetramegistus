// static/mobile/world/citrinitas/modules/c3_nefesh.js

window.Nefesh = {
    lang: 'en',
    dict: null,
    state: { answers: {}, padaSetId: null, validNumerologyKeys: null, winning_purushartha: null },
    
    flowSequence: [
        'scn_prologue', 'scn_transition', 'scn_deep_pull', 'purushartha_q1',
        'scn_tear', 'scn_light', 'scn_approach', 'scn_space', 'scn_tree', 'scn_fruit',
        'scn_hunger', 'scn_bite', 'purushartha_q2', 'scn_distortion', 'scn_amnesia',
        'scn_gone', 'scn_bird', 'scn_dying', 'purushartha_q3', 'scn_sin', 'scn_contamination',
        'scn_karma', 'scn_blank', 'scn_walk', 'scn_doubt', 'scn_anger', 'scn_walking', 'scn_stone',
        'scn_temple', 'scn_ritual', 'scn_fire', 'numerology_q4', 'scn_ram', 'scn_altar',
        'scn_killing', 'scn_sacrifice', 'scn_blood', 'scn_burn', 'scn_bone', 'scn_unbroken',
        'numerology_q5', 'scn_key', 'numerology_q6', 'scn_recalling', 'pada_q7',
        'scn_unconscious', 'scn_dejavu', 'scn_end'
    ],
    currentIndex: 0,
    initialized: false,

    updateLang() {
        if (typeof WorldSettings !== 'undefined') this.lang = WorldSettings.get('lang', 'ko');
        else {
            const docLang = document.documentElement.lang;
            this.lang = (docLang === 'ko' || docLang === 'en') ? docLang : (localStorage.getItem('lang') || 'ko');
        }
    },

    init() {
        this.updateLang();
        
        // 🚀 [강제 수복]: 이전 단계에서 꼬인 시간 미상 락 데이터를 C3 진입 시 완벽히 박살냅니다.
        localStorage.removeItem('nigredo_time_locked');
        localStorage.removeItem('albedo_time_locked');
        
        this.renderStartScreen();

        fetch('/api/theory/citrinitas/nefesh')
            .then(r => r.json()).then(d => { this.dict = d; }).catch(e => console.error(e));
    },

    renderStartScreen() {
        this.updateLang();
        const area = document.getElementById('nefesh-render-area');
        if (!area) return;

        area.innerHTML = `<span class="m-nefesh-intro-text" onclick="if(window.Nefesh) window.Nefesh.startSequence();">${this.lang === 'ko' ? "The path remembers before you do." : "The path remembers before you do."}</span>`;
    },

    async startSequence() {
        this.updateLang();
        const area = document.getElementById('nefesh-render-area');
        if (!area) return;

        if (!this.dict) {
            area.innerHTML = `<p class="m-scene-narrative">${this.lang === 'ko' ? "동기화 중입니다..." : "Synchronizing..."}</p>`;
            try {
                const res = await fetch('/api/theory/citrinitas/nefesh');
                this.dict = await res.json();
            } catch (e) {
                area.innerHTML = `<p class="m-scene-narrative">${this.lang === 'ko' ? "오류 발생. 새로고침 요망." : "Error occurred."}</p>`;
                return;
            }
        }
        this.currentIndex = 0; this.state.answers = {}; this.renderScene();
    },

    renderScene() {
        this.updateLang();
        const renderArea = document.getElementById('nefesh-render-area');
        if (!renderArea || this.currentIndex >= this.flowSequence.length) return; 

        const qId = this.flowSequence[this.currentIndex];
        const qData = this.dict.subconscious_questions[qId];
        if (!qData) { this.nextScene(); return; }

        const narrative = this.formatText(qData.narrative[this.lang]);
        let bgStyle = qData.bg_image && qData.bg_image !== 'black' && qData.bg_image !== 'white' 
            ? `background-image: url('/static/world/citrinitas/modules/assets/nefesh/${qData.bg_image}');` : "";
        if (qData.bg_image === 'white') bgStyle = "background-color: #fff;";

        let effectClass = qData.bg_effect ? `effect-${qData.bg_effect}` : "";
        let optionsHtml = `<div class="m-c1-options-grid">`;
        
        if (qId === 'pada_q7') {
            if (!this.state.padaSetId) this.state.padaSetId = qData.options_pool[Math.floor(Math.random() * qData.options_pool.length)].set_id;
            const activeSet = qData.options_pool.find(s => s.set_id === this.state.padaSetId).options;
            for (const [optKey, optTexts] of Object.entries(activeSet)) {
                let text = typeof optTexts === 'string' ? optTexts : optTexts[this.lang];
                optionsHtml += `<div class="m-c1-option-card" onclick="window.Nefesh.setAnswer('${qId}', '${optKey}')">${text}</div>`;
            }
        } 
        else if (qData.options) {
            for (const [optKey, optTexts] of Object.entries(qData.options)) {
                if (qId.startsWith('numerology') && this.state.validNumerologyKeys && !this.state.validNumerologyKeys.includes(optKey)) continue;
                let text = typeof optTexts === 'string' ? optTexts : optTexts[this.lang];
                if (optKey === 'reach_out') optionsHtml += `<button type="button" class="m-cyber-btn" onclick="window.Nefesh.setAnswer('${qId}', '${optKey}')">${text}</button>`;
                else optionsHtml += `<div class="m-c1-option-card" onclick="window.Nefesh.setAnswer('${qId}', '${optKey}')">${text}</div>`;
            }
        } 
        else {
            optionsHtml += `<button type="button" class="m-cyber-btn" onclick="window.Nefesh.setAnswer('${qId}', 'next')">${this.lang === 'ko' ? 'Continue ➔' : 'Continue ➔'}</button>`;
        }
        optionsHtml += `</div>`;

        // 🚀 [상하 레이아웃 이식] Visual Area와 Content 분할
        renderArea.innerHTML = `
            <div id="scene-${qId}" class="m-scn-scene ${effectClass}">
                <div class="m-scn-visual-area">
                    <div class="m-scn-bg" style="${bgStyle}"></div>
                    <div class="m-scn-overlay"></div>
                </div>
                <div class="m-scn-content">
                    <p class="m-scene-narrative">${narrative}</p>
                    ${optionsHtml}
                </div>
            </div>`;

        document.getElementById('nefesh-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => { 
            const sceneEl = document.getElementById(`scene-${qId}`);
            if (sceneEl) { sceneEl.classList.add('revealed', 'veiled'); }
        }, 350);
    },

    setAnswer(qId, val) {
        if (val !== 'next') this.state.answers[qId] = val;

        const container = document.getElementById(`scene-${qId}`);
        if(container) {
            container.querySelectorAll('.m-cyber-btn, .m-c1-option-card').forEach(btn => btn.style.pointerEvents = 'none');
            container.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => {
                el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0';
            });
            
            setTimeout(() => {
                if (!document.getElementById('nefesh-render-area')) return;
                if (qId === 'scn_end') this.revealNefeshResult();
                else if (qId === 'purushartha_q3') this.fetchNumerologyKeys(); 
                else this.nextScene();
            }, 1000); 
        } else {
            if (qId === 'scn_end') this.revealNefeshResult();
            else if (qId === 'purushartha_q3') this.fetchNumerologyKeys(); 
            else this.nextScene();
        }
    },

    async fetchNumerologyKeys() {
        try {
            const response = await fetch('/api/astro/citrinitas/nefesh/phase1', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ answers: this.state.answers })
            });
            const result = await response.json();
            if (result.status === 'success') {
                this.state.validNumerologyKeys = result.valid_numerology_keys;
                this.state.winning_purushartha = result.winning_purushartha;
            }
        } catch (e) { console.error("[Nefesh Phase 1] 통신 에러", e); }
        this.nextScene();
    },

    nextScene() { this.currentIndex++; this.renderScene(); },

    async revealNefeshResult() {
        this.updateLang();
        const renderArea = document.getElementById('nefesh-render-area');
        if (!renderArea) return;
        
        renderArea.innerHTML = `
            <div class="m-scn-scene" id="scene-wait">
                <div class="m-scn-visual-area">
                    <div class="m-scn-bg" style="background-color: #000; background-image: none;"></div>
                    <div class="m-scn-overlay"></div>
                </div>
                <div class="m-scn-content">
                    <p class="m-scene-narrative">${this.lang === 'ko' ? "Revealing the Silent Altar..." : "Revealing the Silent Altar..."}</p>
                </div>
            </div>`;
        
        setTimeout(() => { 
            const el = document.getElementById('scene-wait');
            if(el) el.classList.add('revealed', 'veiled'); 
        }, 350);

        try {
            const response = await fetch('/api/astro/citrinitas/nefesh/reveal', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ answers: this.state.answers, winning_purushartha: this.state.winning_purushartha, valid_numerology_keys: this.state.validNumerologyKeys })
            });
            const result = await response.json();
            
            if (!document.getElementById('nefesh-render-area')) return; 

            const waitScene = document.getElementById('scene-wait');
            if (waitScene) {
                waitScene.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => {
                    el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0';
                });
                await new Promise(r => setTimeout(r, 1000));
            }
            if (!document.getElementById('nefesh-render-area')) return; 
            this.renderFinalResultDirectly(result);

        } catch (e) {
            if (document.getElementById('nefesh-render-area')) {
                document.getElementById('nefesh-render-area').innerHTML = `<div class="m-scn-scene"><div class="m-scn-content"><p class="m-scene-narrative">Connection lost.</p></div></div>`;
            }
        }
    },

    renderFinalResultDirectly(result) {
        this.updateLang();
        const renderArea = document.getElementById('nefesh-render-area');
        if (!renderArea) return;

        const p1 = this.formatText(this.dict.interpretations.main_purushartha[result.main_purushartha]?.[this.lang]);
        const p2 = this.formatText(this.dict.interpretations.pada_purushartha[result.pada_purushartha]?.[this.lang]);
        const p3 = this.formatText(this.dict.interpretations.planets[result.pada_planet]?.[this.lang]);
        const pSabian = this.formatText(this.lang === 'ko' ? result.sabian_text_ko : result.sabian_text_en);

        // 🚀 결과창 상단에 비주얼 영역 제거하고 텍스트 패널로 변경
        renderArea.innerHTML = `
            <div class="m-scn-scene" id="scene-final">
                <div class="m-scn-content m-ritual-result-container" style="min-height: auto;">
                    <h2 class="m-c4-final-title">Nakshatra: ${result.nakshatra || "Rohini"}</h2>
                    <p class="m-c4-final-subtitle">Pada: ${result.pada_planet || "Venus"}</p>
                    
                    <div class="m-c4-interpretation-panel">
                        ${p1 ? `<p>${p1}</p>` : ''}
                        ${p2 ? `<p>${p2}</p>` : ''}
                        ${p3 ? `<p>${p3}</p>` : ''}
                        ${pSabian ? `<p style="margin-top: 20px; color: #85d0d6 !important;">Sabian: ${pSabian}</p>` : ''}
                    </div>

                    <button type="button" class="m-cyber-btn" onclick="location.reload()">Return to Abyss</button>
                </div>
            </div>`;

        document.getElementById('nefesh-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { const el = document.getElementById('scene-final'); if (el) el.classList.add('revealed', 'veiled'); }, 350);
    },

    formatText(textData) {
        if (!textData) return "";
        return Array.isArray(textData) ? textData.join("<br>") : textData;
    }
};

window.initC4Nefesh = function() {
    if (window.Nefesh) {
        window.Nefesh.updateLang(); 
        if (!window.Nefesh.initialized) { window.Nefesh.initialized = true; window.Nefesh.init(); } 
        else if (window.Nefesh.currentIndex === 0 && Object.keys(window.Nefesh.state.answers).length === 0) window.Nefesh.renderStartScreen();
    }
};

if (document.getElementById('nefesh-app') && !document.getElementById('nefesh-app').dataset.bound) {
    document.getElementById('nefesh-app').dataset.bound = "true";
    window.initC4Nefesh();
}