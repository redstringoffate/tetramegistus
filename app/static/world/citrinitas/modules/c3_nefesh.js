// app/static/world/citrinitas/modules/c3_nefesh.js

const params = new URLSearchParams(window.location.search);
if (params.has('module')) {
    window.location.href = `/world/citrinitas?module=${params.get('module')}`;
}

window.Nefesh = {
    lang: 'en',
    dict: null,
    state: { 
        answers: {}, 
        padaSetId: null, 
        validNumerologyKeys: null,
        winning_purushartha: null 
    },
    
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
        if (typeof WorldSettings !== 'undefined') {
            this.lang = WorldSettings.get('lang', 'ko');
        } else {
            const docLang = document.documentElement.lang;
            this.lang = (docLang === 'ko' || docLang === 'en') ? docLang : (localStorage.getItem('lang') || 'ko');
        }
    },

    init() {
        this.updateLang();
        this.renderStartScreen();

        fetch('/api/theory/citrinitas/nefesh')
            .then(r => r.json())
            .then(d => { this.dict = d; })
            .catch(e => console.error("[C4 Nefesh] Fetch Error:", e));
    },

    renderStartScreen() {
        this.updateLang();
        const area = document.getElementById('nefesh-render-area');
        if (!area) return;

        const introText = this.lang === 'ko' ? "The path remembers before you do." : "The path remembers before you do.";

        area.innerHTML = `
            <div class="ruach-intro-wrapper">
                <span class="nefesh-intro-text" onclick="if(window.Nefesh) window.Nefesh.startSequence();">
                    ${introText}
                </span>
            </div>
        `;
    },

    async startSequence() {
        this.updateLang();
        const area = document.getElementById('nefesh-render-area');
        if (!area) return;

        if (!this.dict) {
            const syncText = this.lang === 'ko' ? "동기화 중입니다..." : "Synchronizing...";
            const errText = this.lang === 'ko' ? "오류 발생. 새로고침을 권장합니다." : "Error occurred. Refresh recommended.";

            area.innerHTML = `<p class="scene-narrative">${syncText}</p>`;
            try {
                const res = await fetch('/api/theory/citrinitas/nefesh');
                this.dict = await res.json();
            } catch (e) {
                area.innerHTML = `<p class="scene-narrative">${errText}</p>`;
                return;
            }
        }
        this.currentIndex = 0;
        this.state.answers = {};
        this.renderScene();
    },

    renderScene() {
        this.updateLang();
        const renderArea = document.getElementById('nefesh-render-area');
        if (!renderArea) return; 

        if (this.currentIndex >= this.flowSequence.length) {
            return; 
        }

        const qId = this.flowSequence[this.currentIndex];
        const qData = this.dict.subconscious_questions[qId];
        if (!qData) { this.nextScene(); return; }

        const narrative = this.formatText(qData.narrative[this.lang]);
        let bgStyle = qData.bg_image && qData.bg_image !== 'black' && qData.bg_image !== 'white' 
            ? `background-image: url('/static/world/citrinitas/modules/assets/nefesh/${qData.bg_image}');` 
            : "";
        if (qData.bg_image === 'white') bgStyle = "background-color: #fff;";

        let effectClass = qData.bg_effect ? `effect-${qData.bg_effect}` : "";

        let optionsHtml = `<div class="c1-options-grid scn-options-wrapper">`;
        
        if (qId === 'pada_q7') {
            if (!this.state.padaSetId) {
                const randomSet = qData.options_pool[Math.floor(Math.random() * qData.options_pool.length)];
                this.state.padaSetId = randomSet.set_id;
            }
            const activeSet = qData.options_pool.find(s => s.set_id === this.state.padaSetId).options;
            for (const [optKey, optTexts] of Object.entries(activeSet)) {
                let text = typeof optTexts === 'string' ? optTexts : optTexts[this.lang];
                optionsHtml += `<div class="c1-option-card scn-opt" onclick="window.Nefesh.setAnswer('${qId}', '${optKey}')">${text}</div>`;
            }
        } 
        else if (qData.options) {
            for (const [optKey, optTexts] of Object.entries(qData.options)) {
                if (qId.startsWith('numerology') && this.state.validNumerologyKeys && !this.state.validNumerologyKeys.includes(optKey)) {
                    continue;
                }
                
                let text = typeof optTexts === 'string' ? optTexts : optTexts[this.lang];
                
                if (optKey === 'reach_out') {
                    optionsHtml += `<button type="button" class="cyber-btn" onclick="window.Nefesh.setAnswer('${qId}', '${optKey}')">${text}</button>`;
                } else {
                    optionsHtml += `<div class="c1-option-card scn-opt" onclick="window.Nefesh.setAnswer('${qId}', '${optKey}')">${text}</div>`;
                }
            }
        } 
        else {
            const btnText = this.lang === 'ko' ? 'Continue ➔' : 'Continue ➔';
            optionsHtml += `<button type="button" class="cyber-btn" onclick="window.Nefesh.setAnswer('${qId}', 'next')">${btnText}</button>`;
        }
        optionsHtml += `</div>`;

        renderArea.innerHTML = `
            <div id="scene-${qId}" class="scn-scene ${effectClass}">
                <div class="scn-bg" style="${bgStyle}"></div>
                <div class="scn-overlay"></div>
                <div class="scn-content">
                    <p class="scene-narrative">${narrative}</p>
                    ${optionsHtml}
                </div>
            </div>
        `;

        document.getElementById('nefesh-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => { 
            const sceneEl = document.getElementById(`scene-${qId}`);
            if (sceneEl) { sceneEl.classList.add('revealed'); sceneEl.classList.add('veiled'); }
        }, 350);
    },

    setAnswer(qId, val) {
        if (val !== 'next') {
            this.state.answers[qId] = val;
        }

        const container = document.getElementById(`scene-${qId}`);
        if(container) {
            const buttons = container.querySelectorAll('.cyber-btn, .c1-option-card');
            buttons.forEach(btn => btn.style.pointerEvents = 'none');
            
            container.querySelectorAll('.scn-bg, .scn-overlay, .scn-content').forEach(el => {
                el.style.transition = 'opacity 1s ease-in-out';
                el.style.opacity = '0';
            });
            
            setTimeout(() => {
                if (!document.getElementById('nefesh-render-area')) return;
                
                if (qId === 'scn_end') {
                    this.revealNefeshResult();
                } 
                else if (qId === 'purushartha_q3') {
                    this.fetchNumerologyKeys(); 
                }
                else {
                    this.nextScene();
                }
            }, 1000); 
        } else {
            if (qId === 'scn_end') this.revealNefeshResult();
            else if (qId === 'purushartha_q3') this.fetchNumerologyKeys(); 
            else this.nextScene();
        }
    },

    // 🚀 이 함수가 날아가서 Artha -> Moksha 버그가 터졌던 겁니다. 완벽히 복구했습니다.
    async fetchNumerologyKeys() {
        try {
            const response = await fetch('/api/astro/citrinitas/nefesh/phase1', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ answers: this.state.answers })
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                this.state.validNumerologyKeys = result.valid_numerology_keys;
                this.state.winning_purushartha = result.winning_purushartha;
            }
        } catch (e) {
            console.error("[Nefesh Phase 1] 통신 에러", e);
        }
        this.nextScene();
    },

    nextScene() { 
        this.currentIndex++; 
        this.renderScene(); 
    },

    async revealNefeshResult() {
        this.updateLang();
        const renderArea = document.getElementById('nefesh-render-area');
        if (!renderArea) return;
        
        const waitText = this.lang === 'ko' ? "Revealing the Silent Altar..." : "Revealing the Silent Altar...";

        renderArea.innerHTML = `
            <div class="scn-scene" id="scene-wait">
                <div class="scn-bg" style="background-color: #000; background-image: none;"></div>
                <div class="scn-overlay"></div>
                <div class="scn-content">
                    <p class="scene-narrative">${waitText}</p>
                </div>
            </div>`;
        
        setTimeout(() => { 
            const el = document.getElementById('scene-wait');
            if(el) { el.classList.add('revealed', 'veiled'); }
        }, 350);

        try {
            const response = await fetch('/api/astro/citrinitas/nefesh/reveal', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    answers: this.state.answers,
                    winning_purushartha: this.state.winning_purushartha,   
                    valid_numerology_keys: this.state.validNumerologyKeys  
                })
            });
            const result = await response.json();
            
            if (!document.getElementById('nefesh-render-area')) return; 

            const waitScene = document.getElementById('scene-wait');
            if (waitScene) {
                waitScene.querySelectorAll('.scn-bg, .scn-overlay, .scn-content').forEach(el => {
                    el.style.transition = 'opacity 1s ease-in-out';
                    el.style.opacity = '0';
                });
                await new Promise(r => setTimeout(r, 1000));
            }
            if (!document.getElementById('nefesh-render-area')) return; 

            this.renderFinalResultDirectly(result);

        } catch (e) {
            if (document.getElementById('nefesh-render-area')) {
                const errText = this.lang === 'ko' ? "연결이 끊겼습니다." : "Connection lost.";
                document.getElementById('nefesh-render-area').innerHTML = `<div class="scn-scene"><div class="scn-content"><p class="scene-narrative">${errText}</p></div></div>`;
            }
        }
    },

    renderFinalResultDirectly(result) {
        this.updateLang();
        const renderArea = document.getElementById('nefesh-render-area');
        if (!renderArea) return;

        const btnText = this.lang === 'ko' ? "Return to Abyss" : "Return to Abyss";
        
        const nakshatraStr = result.nakshatra || "Rohini";
        const padaStr = result.pada_planet || "Venus";
        
        const mainPuru = this.dict.interpretations.main_purushartha[result.main_purushartha]?.[this.lang] || "";
        const padaPuru = this.dict.interpretations.pada_purushartha[result.pada_purushartha]?.[this.lang] || "";
        const planetDesc = this.dict.interpretations.planets[result.pada_planet]?.[this.lang] || "";
        
        const sabianDesc = this.lang === 'ko' ? result.sabian_text_ko : result.sabian_text_en;

        const p1 = this.formatText(mainPuru);
        const p2 = this.formatText(padaPuru);
        const p3 = this.formatText(planetDesc);
        const pSabian = this.formatText(sabianDesc);

        // 🚀 [UI 픽스 적용]: Nakshatra 크게, Pada 작고 파랗게, [Main] 괄호 싹 제거
        renderArea.innerHTML = `
            <div class="scn-scene" id="scene-final">
                <div class="scn-bg" style="background-color: #000; background-image: none;"></div>
                <div class="scn-overlay" style="background: rgba(0,0,0,0.5);"></div>
                
                <div class="scn-content ritual-result-container">
                    
                    <h2 class="c4-final-title" style="margin-bottom: 5px;">Nakshatra: ${nakshatraStr}</h2>
                    <p class="c4-final-subtitle" style="margin-bottom: 30px; font-size: 1.2rem; color: var(--c4-cyber-cyan); letter-spacing: 2px;">Pada: ${padaStr}</p>
                    
                    <div class="c4-interpretation-panel cyber-panel">
                        ${p1 ? `<p>${p1}</p>` : ''}
                        ${p2 ? `<p>${p2}</p>` : ''}
                        ${p3 ? `<p>${p3}</p>` : ''}
                        ${pSabian ? `<p style="margin-top: 20px; color: var(--c4-primary) !important;">Sabian: ${pSabian}</p>` : ''}
                    </div>

                    <button type="button" class="cyber-btn" style="margin-top: 20px;" onclick="location.reload()">${btnText}</button>
                </div>
            </div>
        `;

        document.getElementById('nefesh-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => {
            const el = document.getElementById('scene-final');
            if (el) { el.classList.add('revealed', 'veiled'); }
        }, 350);
    },

    formatText(textData) {
        if (!textData) return "";
        if (Array.isArray(textData)) return textData.join("<br>");
        return textData;
    }
};

window.initC4Nefesh = function() {
    if (window.Nefesh) {
        window.Nefesh.updateLang(); 
        if (!window.Nefesh.initialized) {
            window.Nefesh.initialized = true;
            window.Nefesh.init();
        } else if (window.Nefesh.currentIndex === 0 && Object.keys(window.Nefesh.state.answers).length === 0) {
            window.Nefesh.renderStartScreen();
        }
    }
};

if (document.getElementById('nefesh-app') && !document.getElementById('nefesh-app').dataset.bound) {
    document.getElementById('nefesh-app').dataset.bound = "true";
    window.initC4Nefesh();
}