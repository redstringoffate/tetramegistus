// static/mobile/world/citrinitas/modules/c3_chayah.js

const PULSE_CONFIG = {
    'aldebaran_1': { color: '#ff3333', text: { en: "A red gaze fixes in place.", ko: "붉은 것이 당신을 응시합니다." } },
    'regulus_1':   { color: '#ff3333', text: { en: "A sovereign gaze settles from above.", ko: "위에서 시선이 당신을 내려다봅니다." } },
    'spica_1':     { color: '#3388ff', text: { en: "An unseen order takes measure.", ko: "보이지 않는 질서가 가늠합니다." } },
    'antares_1':   { color: '#ff3333', text: { en: "A burning presence bears down.", ko: "타오르는 것이 당신을 압박합니다." } },
    'fomalhaut_1': { color: '#ff3333', text: { en: "A distant gaze does not withdraw.", ko: "닿지 않는 곳에서 시선이 당신을 지켜봅니다." } },
    'void':        { color: '#7CFF9B', text: { en: "Entering the Void...", ko: "Entering the Void..." } },
    'abyss':       { color: '#49dce1', text: { en: "Reentering Abyss...", ko: "Reentering Abyss..." } }
};

window.Chayah = {
    lang: 'en',
    dict: null,
    state: { 
        answers: {}, 
        pulsePlayed: {},
        voidCandidates: null,
        finalData: null
    },
    
    flowSequence: [
        'intro_0', 'intro_1', 'intro_2', 'intro_3', 'intro_4', 'intro_5', 'intro_6', 'blank_black', 'intro_7', 'intro_8', 'intro_9', 'blank_white', 'intro_10', 'intro_11', 'blank_black', 'intro_12', 'intro_13',
        'aldebaran_1', 'aldebaran_2', 'aldebaran_3', 'q_hamal_ketu', 'aldebaran_4', 'aldebaran_5', 'q_sheratan_venus', 'aldebaran_6', 'q_pleiades_sun', 'aldebaran_7', 'blank_white', 'aldebaran_8', 'aldebaran_9', 'blank_black', 'aldebaran_10', 'aldebaran_11', 'aldebaran_12', 'aldebaran_13', 'q_bellatrix_mars', 'blank_white', 'aldebaran_14', 'aldebaran_15', 'aldebaran_16', 'q_betelgeuse_rahu', 'aldebaran_17', 'aldebaran_18',
        'regulus_1', 'regulus_2', 'q_pollux_jupiter', 'regulus_3', 'q_praesepe_saturn', 'regulus_4', 'regulus_5', 'regulus_6', 'q_alphard_mercury', 'blank_black', 'regulus_7', 'regulus_8', 'regulus_9', 'regulus_10', 'q_zosma_venus', 'regulus_11', 'regulus_12',
        'spica_1', 'spica_2', 'spica_3', 'q_denebola_sun', 'spica_4', 'spica_5', 'spica_6', 'spica_7', 'q_algorab_moon', 'blank_white', 'spica_8', 'q_arcturus_rahu', 'blank_white', 'spica_9', 'spica_10', 'spica_11', 'q_zuben_elgenubi_jupiter', 'spica_12', 'spica_13',
        'antares_1', 'antares_2', 'antares_3', 'antares_4', 'q_dschubba_saturn', 'blank_white', 'antares_5', 'antares_6', 'blank_white', 'antares_7', 'blank_black', 'q_galactic_center_ketu', 'antares_8', 'antares_9', 'q_nunki_venus', 'blank_black', 'antares_10', 'antares_11', 'antares_12', 'antares_13', 'q_vega_sun', 'blank_white', 'antares_14', 'antares_15', 'antares_16', 'antares_17', 'q_altair_moon', 'antares_18', 'antares_19',
        'fomalhaut_1', 'fomalhaut_2', 'fomalhaut_3', 'fomalhaut_4', 'fomalhaut_5', 'fomalhaut_6', 'fomalhaut_7', 'q_deneb_algedi_mars', 'fomalhaut_8', 'fomalhaut_9', 'fomalhaut_10', 'fomalhaut_11', 'fomalhaut_12', 'fomalhaut_13', 'fomalhaut_14', 'fomalhaut_15', 'q_markab_jupiter', 'blank_white', 'fomalhaut_16', 'fomalhaut_17', 'fomalhaut_18', 'fomalhaut_19', 'q_alpheratz_saturn', 'fomalhaut_20', 'fomalhaut_21', 'blank_white', 'fomalhaut_22', 'fomalhaut_23', 'fomalhaut_24', 'q_alrischa_mercury', 'fomalhaut_25', 'fomalhaut_26',
        'EVALUATE'
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

    fetchDict() {
        fetch('/api/theory/citrinitas/chayah')
            .then(r => r.json())
            .then(d => { this.dict = d; })
            .catch(e => console.error("[C3 Chayah] Fetch Error:", e));
    },

    delayedReset() {
        const container = document.querySelector('#chayah-render-area .m-scn-scene');
        if (container) {
            container.querySelectorAll('.m-cyber-btn').forEach(btn => btn.style.pointerEvents = 'none');
            container.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => {
                el.style.transition = 'opacity 2s ease-in-out';
                el.style.opacity = '0';
            });
            setTimeout(() => { location.reload(); }, 2000);
        } else {
            location.reload();
        }
    },

    renderStartScreen() {
        this.updateLang();
        const area = document.getElementById('chayah-render-area');
        if (!area) return;

        const introText = this.lang === 'ko' ? "What overflows was never yours." : "What overflows was never yours.";

        area.innerHTML = `
            <div id="m-chayah-intro-wrapper" style="transition: opacity 1s ease-in-out; display:flex; justify-content:center;">
                <span class="m-chayah-intro-text" onclick="if(window.Chayah) window.Chayah.startSequence();">
                    ${introText}
                </span>
            </div>
        `;
    },

    async startSequence() {
        this.updateLang();
        const area = document.getElementById('chayah-render-area');
        if (!area) return;

        if (!this.dict) {
            const syncText = this.lang === 'ko' ? "동기화 중입니다..." : "Synchronizing...";
            area.innerHTML = `<p class="m-scene-narrative">${syncText}</p>`;
            try {
                const res = await fetch('/api/theory/citrinitas/chayah');
                this.dict = await res.json();
            } catch (e) {
                area.innerHTML = `<p class="m-scene-narrative">Error occurred. Refresh recommended.</p>`;
                return;
            }
        }

        const introWrapper = document.getElementById('m-chayah-intro-wrapper');
        if (introWrapper) introWrapper.style.opacity = '0';

        setTimeout(() => {
            this.currentIndex = 0;
            this.state.answers = {};
            this.state.pulsePlayed = {};
            this.renderScene();
        }, 1200); 
    },

    // 🚀 모바일 전용 Pulse 로직 (전체 화면 장악)
    playPulse(type, callback) {
        const config = PULSE_CONFIG[type];
        if (!config) { callback(); return; }

        const container = document.getElementById('m-chayah-pulse-container');
        const textEl = document.getElementById('m-chayah-pulse-text');
        
        textEl.style.color = config.color;
        textEl.style.textShadow = `0 0 15px ${config.color}`;
        textEl.innerText = config.text[this.lang];

        setTimeout(() => {
            container.classList.add('active');
            setTimeout(() => {
                container.classList.remove('active');
                setTimeout(() => {
                    if (callback) callback();
                }, 1000); 
            }, 3000);
        }, 800); 
    },

    renderScene() {
        this.updateLang();
        const renderArea = document.getElementById('chayah-render-area');
        if (!renderArea || this.currentIndex >= this.flowSequence.length) return; 

        const qId = this.flowSequence[this.currentIndex];

        if (qId === 'EVALUATE') {
            this.evaluateChayah(); return;
        }

        if (qId === 'SHOW_RESULT') {
            this.renderFinalResult(); return;
        }

        if (PULSE_CONFIG[qId] && !this.state.pulsePlayed[qId]) {
            this.playPulse(qId, () => {
                this.state.pulsePlayed[qId] = true;
                this.renderScene();
            });
            return;
        }

        const qData = this.dict.subconscious_questions[qId];
        if (!qData) { this.nextScene(); return; }

        const narrative = this.formatText(qData.narrative[this.lang]);
        
        let bgStyle = "";
        let bgClass = "";
        
        const solidColors = ['black', 'white', 'crimson', 'grey'];
        if (qData.bg_image && solidColors.includes(qData.bg_image)) {
            bgClass = `m-chayah-bg-${qData.bg_image}`;
        } else if (qData.bg_image) {
            bgStyle = `background-image: url('/static/world/citrinitas/modules/assets/chayah/${qData.bg_image}');`;
        }

        let effectClass = qData.bg_effect ? `effect-${qData.bg_effect}` : "";
        let optionsHtml = `<div class="m-c1-options-grid">`;
        
        if (qData.options) {
            if (qId.startsWith('void_') && this.state.voidCandidates) {
                this.state.voidCandidates.forEach(cand => {
                    const optData = qData.options[cand.key];
                    if (optData) {
                        let text = typeof optData === 'string' ? optData : optData[this.lang];
                        optionsHtml += `<div class="m-c1-option-card" onclick="window.Chayah.setAnswer('${qId}', '${cand.key}')">${text}</div>`;
                    }
                });
            } else {
                for (const [optKey, optData] of Object.entries(qData.options)) {
                    let text = typeof optData === 'string' ? optData : optData[this.lang];
                    optionsHtml += `<div class="m-c1-option-card" onclick="window.Chayah.setAnswer('${qId}', '${optKey}')">${text}</div>`;
                }
            }
        } else {
            let btnText = this.lang === 'ko' ? 'Continue ➔' : 'Continue ➔';
            let action = `window.Chayah.setAnswer('${qId}', 'next')`;

            if (qId === 'ending_5' || qId === 'bad_end_4') {
                btnText = 'End';
                if (qId === 'bad_end_4') {
                    action = `window.Chayah.delayedReset()`; 
                }
            }
            optionsHtml += `<button type="button" class="m-cyber-btn" onclick="${action}">${btnText}</button>`;
        }
        optionsHtml += `</div>`;

        // 🚀 모바일 평행 우주 규격 적용 (상하 분할 씬 템플릿)
        renderArea.innerHTML = `
            <div id="scene-${qId}" class="m-scn-scene ${effectClass}">
                <div class="m-scn-visual-area">
                    <div class="m-scn-bg ${bgClass}" style="${bgStyle}"></div>
                    <div class="m-scn-overlay"></div>
                </div>
                <div class="m-scn-content">
                    <p class="m-scene-narrative">${narrative}</p>
                    ${optionsHtml}
                </div>
            </div>
        `;

        document.getElementById('chayah-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => { 
            const sceneEl = document.getElementById(`scene-${qId}`);
            if (sceneEl) { sceneEl.classList.add('revealed', 'veiled'); }
        }, 350);
    },

    setAnswer(qId, val) {
        if (val !== 'next') {
            this.state.answers[qId] = val;
        }

        const container = document.getElementById(`scene-${qId}`);
        if(container) {
            container.querySelectorAll('.m-cyber-btn, .m-c1-option-card').forEach(btn => btn.style.pointerEvents = 'none');
            container.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => {
                el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0';
            });
            setTimeout(() => { this.nextScene(); }, 1000); 
        } else {
            this.nextScene();
        }
    },

    nextScene() { 
        this.currentIndex++; 
        this.renderScene(); 
    },

    async evaluateChayah() {
        this.updateLang();
        const renderArea = document.getElementById('chayah-render-area');
        if (!renderArea) return;

        renderArea.innerHTML = `
            <div class="m-scn-scene" id="scene-wait">
                <div class="m-scn-visual-area">
                    <div class="m-scn-bg m-chayah-bg-black"></div>
                    <div class="m-scn-overlay"></div>
                </div>
                <div class="m-scn-content">
                    <p class="m-scene-narrative">${this.lang === 'ko' ? "The stars are aligning..." : "The stars are aligning..."}</p>
                </div>
            </div>`;
        
        setTimeout(() => { 
            const el = document.getElementById('scene-wait');
            if(el) { el.classList.add('revealed', 'veiled'); }
        }, 350);

        try {
            const response = await fetch('/api/astro/citrinitas/chayah/reveal', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ answers: this.state.answers })
            });

            if (!response.ok) throw new Error(`Server Error: ${response.status}`);
            const result = await response.json();

            const waitScene = document.getElementById('scene-wait');
            if (waitScene) {
                waitScene.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => {
                    el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0';
                });
                await new Promise(r => setTimeout(r, 1000));
            }

            if (result.status === 'needs_tiebreaker') {
                this.state.voidCandidates = result.candidates;
                this.flowSequence = [result.type, 'EVALUATE']; 
                this.currentIndex = 0;
                
                if (!this.state.pulsePlayed['entered_void']) {
                    this.playPulse('void', () => {
                        this.state.pulsePlayed['entered_void'] = true;
                        this.renderScene();
                    });
                } else {
                    this.renderScene();
                }
            } else {
                this.state.finalData = result;
                let endingRoute = [];
                
                if (result.status === 'bad_end') {
                    endingRoute = ['bad_end_1', 'bad_end_2', 'bad_end_3', 'bad_end_4'];
                } else {
                    const royals = ['aldebaran', 'regulus', 'antares', 'fomalhaut'];
                    let endType = 'normal_end';
                    if (result.final_star === 'spica') endType = 'spica_end';
                    else if (royals.includes(result.final_star)) endType = 'royal_end';
                    
                    endingRoute = ['ending_1', 'ending_2', endType, 'ending_3', 'ending_4', 'ending_5', 'SHOW_RESULT'];
                }

                this.flowSequence = endingRoute;
                this.currentIndex = 0;

                this.playPulse('abyss', () => {
                    this.renderScene();
                });
            }
        } catch (e) {
            console.error("Evaluation Error", e);
            if (renderArea) {
                const errText = this.lang === 'ko' ? "연결이 끊겼습니다. (서버 통신 오류)" : "Connection lost.";
                renderArea.innerHTML = `<div class="m-scn-scene"><div class="m-scn-content"><p class="m-scene-narrative">${errText}</p></div></div>`;
            }
        }
    },

    renderFinalResult() {
        this.updateLang();
        const renderArea = document.getElementById('chayah-render-area');
        if (!renderArea) return;

        const data = this.state.finalData || {};

        const capitalize = (s) => s ? s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
        const starName = capitalize(data.final_star);
        const grahaName = capitalize(data.final_graha);

        let starDesc = [];
        let grahaDesc = [];

        try {
            const source = this.dict.dict ? this.dict.dict : this.dict;
            if (data.final_star && source.stars && source.stars[data.final_star]) {
                starDesc = source.stars[data.final_star][this.lang] || [];
            }
            if (data.final_graha && source.graha && source.graha[data.final_graha]) {
                grahaDesc = source.graha[data.final_graha][this.lang] || [];
            }
        } catch(e) {
            console.error("Dict Parsing Error:", e);
        }

        const btnText = this.lang === 'ko' ? "Awaken" : "Awaken";

        // 🚀 최종 결과도 모바일 뷰에 맞춰 상단 비주얼 영역 제거하고 텍스트 위주로 렌더링
        renderArea.innerHTML = `
            <div class="m-scn-scene" id="scene-final">
                <div class="m-scn-content m-ritual-result-container" style="min-height: auto;">
                    <h2 class="m-chayah-final-title">${starName}</h2>
                    
                    <p class="m-chayah-final-subtitle" style="display: block !important;">
                        GRAHA: ${grahaName || '데이터 수신 실패!'}
                    </p>
                    
                    <div class="m-chayah-interpretation-panel">
                        <div class="m-chayah-desc-star">${this.formatText(starDesc)}</div>
                        <div class="m-chayah-desc-graha">
                            ${grahaDesc.length > 0 ? this.formatText(grahaDesc) : '(Graha 설명글이 딕셔너리에 없습니다)'}
                        </div>
                    </div>

                    <button type="button" class="m-cyber-btn m-chayah-mt-20" onclick="location.reload()">${btnText}</button>
                </div>
            </div>
        `;

        document.getElementById('chayah-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

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

window.initC3Chayah = function() {
    if (!window.Chayah) return;

    // 🚀 [핵심 수술]: 부모 래퍼의 함정(Stacking Context)을 물리적으로 뜯고 탈출하여 body의 직접 자식으로 강제 이주
    const pulseContainer = document.getElementById('m-chayah-pulse-container');
    if (pulseContainer && pulseContainer.parentNode !== document.body) {
        document.body.appendChild(pulseContainer);
    }

    window.Chayah.updateLang();

    const area = document.getElementById('chayah-render-area');
    if (area && !window.Chayah.initialized) {
        window.Chayah.initialized = true;
        window.Chayah.renderStartScreen();
        window.Chayah.fetchDict();
    }
};

if (document.getElementById('chayah-app') && !document.getElementById('chayah-app').dataset.bound) {
    document.getElementById('chayah-app').dataset.bound = "true";
    window.initC3Chayah();
}