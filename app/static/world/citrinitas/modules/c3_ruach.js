// app/static/world/citrinitas/modules/c3_ruach.js

// 🚀 라우터 상대경로 늪 탈출기
const params = new URLSearchParams(window.location.search);
if (params.has('module')) {
    window.location.href = `/world/citrinitas?module=${params.get('module')}`;
}

window.Ruach = {
    lang: 'en',
    dict: null,
    state: { answers: {}, motherLetter: null, pendingFinalResult: null },
    flowSequence: [
        'scn_prologue', 'scn_tree_intro', 'q_mother_1', 'scn_thunder_1',
        'scn_thunder_2', 'q_mother_2', 'q_mother_3', 'scn_temple_1', 
        'scn_temple_2', 'q_planet_1', 'q_planet_2', 'q_planet_3', 'scn_epilogue_intro'
    ],
    currentIndex: 0,
    initialized: false,

    // 🚀 [픽스]: 언제든 현재 설정된 언어를 실시간으로 추적하는 함수
    updateLang() {
        if (typeof WorldSettings !== 'undefined') {
            this.lang = WorldSettings.get('lang', 'en');
        } else {
            this.lang = document.documentElement.lang || localStorage.getItem('lang') || 'en';
        }
    },

    init() {
        this.updateLang();
        this.renderStartScreen();

        fetch('/api/theory/citrinitas/ruach')
            .then(r => r.json())
            .then(d => { this.dict = d; })
            .catch(e => console.error("[C3 Ruach] Fetch Error:", e));
    },

    renderStartScreen() {
        this.updateLang();
        const area = document.getElementById('ruach-render-area');
        if (!area) return;

        // 🚀 인트로 텍스트 한영 동적 반영
        const introText = this.lang === 'ko' ? "What is seen does not remain." : "What is seen does not remain.";

        area.innerHTML = `
            <div class="ruach-intro-wrapper">
                <span class="ruach-intro-text" onclick="if(window.Ruach) window.Ruach.startSequence();">
                    ${introText}
                </span>
            </div>
        `;
    },

    async startSequence() {
        this.updateLang();
        const area = document.getElementById('ruach-render-area');
        if (!area) return;

        if (!this.dict) {
            const syncText = this.lang === 'ko' ? "동기화 중입니다..." : "Synchronizing...";
            const errText = this.lang === 'ko' ? "오류 발생. 새로고침을 권장합니다." : "Error occurred. Refresh recommended.";

            area.innerHTML = `<p class="scene-narrative">${syncText}</p>`;
            try {
                const res = await fetch('/api/theory/citrinitas/ruach');
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
        const renderArea = document.getElementById('ruach-render-area');
        if (!renderArea) return; 

        if (this.currentIndex >= this.flowSequence.length) {
            this.endSequence();
            return;
        }

        const qId = this.flowSequence[this.currentIndex];
        const qData = this.dict.subconscious_questions[qId];
        if (!qData) { this.nextScene(); return; }

        const narrative = this.formatText(qData.narrative[this.lang]);
        let bgStyle = qData.bg_image ? `background-image: url('/static/world/citrinitas/modules/assets/ruach/${qData.bg_image}');` : "";

        let optionsHtml = `<div class="c1-options-grid scn-options-wrapper">`;
        if (qData.options) {
            for (const [optKey, optTexts] of Object.entries(qData.options)) {
                let text = typeof optTexts === 'string' ? optTexts : optTexts[this.lang];
                optionsHtml += `<div class="c1-option-card scn-opt" onclick="window.Ruach.setAnswer('${qId}', '${optKey}')">${text}</div>`;
            }
        } else if (qData.options_by_mother) {
            const mother = this.state.motherLetter || "Mem";
            const motherOptions = qData.options_by_mother[mother];
            for (const [optKey, optTexts] of Object.entries(motherOptions)) {
                let text = typeof optTexts === 'string' ? optTexts : optTexts[this.lang];
                optionsHtml += `<div class="c1-option-card scn-opt" onclick="window.Ruach.setAnswer('${qId}', '${optKey}')">${text}</div>`;
            }
        } else {
            const btnText = this.lang === 'ko' ? 'Continue ➔' : 'Continue ➔';
            optionsHtml += `<button type="button" class="cyber-btn" onclick="window.Ruach.setAnswer('${qId}', 'next')">${btnText}</button>`;
        }
        optionsHtml += `</div>`;

        renderArea.innerHTML = `
            <div id="scene-${qId}" class="scn-scene">
                <div class="scn-bg" style="${bgStyle}"></div>
                <div class="scn-overlay"></div>
                <div class="scn-content">
                    <p class="scene-narrative">${narrative}</p>
                    ${optionsHtml}
                </div>
            </div>
        `;

        document.getElementById('ruach-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => {
            const sceneEl = document.getElementById(`scene-${qId}`);
            if (sceneEl) { sceneEl.classList.add('revealed'); sceneEl.classList.add('veiled'); }
        }, 150);
    },

    setAnswer(qId, val) {
        this.state.answers[qId] = val;
        if (qId === 'q_mother_2') this.state.motherLetter = val;

        const container = document.getElementById(`scene-${qId}`);
        if(container) {
            const buttons = container.querySelectorAll('.cyber-btn, .c1-option-card');
            buttons.forEach(btn => btn.style.pointerEvents = 'none');
            
            container.querySelectorAll('.scn-bg, .scn-overlay, .scn-content').forEach(el => {
                el.style.transition = 'opacity 1s ease-in-out';
                el.style.opacity = '0';
            });
            
            setTimeout(() => {
                if (!document.getElementById('ruach-render-area')) return;
                
                if (qId === 'scn_epilogue_intro') {
                    this.revealFinalRune();
                } else {
                    this.nextScene();
                }
            }, 1000); 
        } else {
            if (qId === 'scn_epilogue_intro') {
                this.revealFinalRune();
            } else {
                this.nextScene();
            }
        }
    },

    nextScene() { 
        this.currentIndex++; 
        this.renderScene(); 
    },

    endSequence() {
        this.revealFinalRune();
    },

    async revealFinalRune() {
        this.updateLang();
        const renderArea = document.getElementById('ruach-render-area');
        if (!renderArea) return;
        
        const waitText = this.lang === 'ko' ? "영혼의 주파수를 공명시키는 중..." : "Resonating the frequency of the soul...";

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
        }, 150);

        const phase1 = {};
        const phase2 = [];
        for (const [k, v] of Object.entries(this.state.answers)) {
            if (k.startsWith('q_mother') || k === 'scn_tree_intro') phase1[k] = v;
            else if (k.startsWith('q_planet')) phase2.push(v);
        }

        try {
            const response = await fetch('/api/astro/citrinitas/ruach/reveal', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ phase1_answers: phase1, phase2_answers: phase2 })
            });
            const result = await response.json();
            
            if (!document.getElementById('ruach-render-area')) return; 

            const waitScene = document.getElementById('scene-wait');
            if (waitScene) {
                waitScene.querySelectorAll('.scn-bg, .scn-overlay, .scn-content').forEach(el => {
                    el.style.transition = 'opacity 1s ease-in-out';
                    el.style.opacity = '0';
                });
                await new Promise(r => setTimeout(r, 1000));
            }
            if (!document.getElementById('ruach-render-area')) return; 

            const tbLog = result.tie_breaker_log || "None";
            
            if (tbLog !== "None") {
                let tool = "";
                let face = "";
                if (tbLog.includes("Golden Coin")) {
                    tool = "coin";
                    face = tbLog.replace("Golden Coin (", "").replace(")", ""); 
                } else if (tbLog.includes("Rune Dice")) {
                    tool = "dice";
                    face = tbLog.replace("Rune Dice (", "").replace(")", ""); 
                }
                
                this.renderTieBreakerSequence(tool, face, result);
            } else {
                this.renderFinalRuneDirectly(result);
            }

        } catch (e) {
            if (document.getElementById('ruach-render-area')) {
                const errText = this.lang === 'ko' ? "연결이 끊겼습니다." : "Connection lost.";
                document.getElementById('ruach-render-area').innerHTML = `<div class="scn-scene"><div class="scn-content"><p class="scene-narrative">${errText}</p></div></div>`;
            }
        }
    },

    renderTieBreakerSequence(tool, face, finalResult) {
        this.updateLang();
        const toolData = this.dict.epilogue_tools[tool];
        const renderArea = document.getElementById('ruach-render-area');
        
        const actionText = this.formatText(toolData.action[this.lang]);
        let bgStyle = toolData.bg_image ? `background-image: url('/static/world/citrinitas/modules/assets/ruach/${toolData.bg_image}');` : "";
        
        this.state.pendingFinalResult = finalResult;

        const btnText = tool === 'coin' 
            ? (this.lang === 'ko' ? '[ 금화를 던진다 ]' : '[ Flip the Coin ]')
            : (this.lang === 'ko' ? '[ 주사위를 굴린다 ]' : '[ Roll the Dice ]');

        renderArea.innerHTML = `
            <div class="scn-scene" id="scene-tiebreaker">
                <div class="scn-bg" style="${bgStyle}"></div>
                <div class="scn-overlay"></div>
                <div class="scn-content">
                    <p class="scene-narrative">${actionText}</p>
                    <div class="c1-options-grid scn-options-wrapper" style="margin-top: 20px;">
                        <button type="button" class="cyber-btn" onclick="window.Ruach.transitionToTieBreakerResult('${tool}', '${face}')">
                            ${btnText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('ruach-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => { 
            const el = document.getElementById('scene-tiebreaker');
            if(el) { el.classList.add('revealed', 'veiled'); }
        }, 150);
    },

    transitionToTieBreakerResult(tool, face) {
        const container = document.querySelector('#ruach-render-area .scn-scene');
        if (container) {
            container.querySelectorAll('.cyber-btn').forEach(btn => btn.style.pointerEvents = 'none');
            container.querySelectorAll('.scn-bg, .scn-overlay, .scn-content').forEach(el => {
                el.style.transition = 'opacity 1s ease-in-out';
                el.style.opacity = '0';
            });
            setTimeout(() => {
                if (document.getElementById('ruach-render-area')) this.showTieBreakerResult(tool, face);
            }, 1000);
        } else {
            this.showTieBreakerResult(tool, face);
        }
    },

    showTieBreakerResult(tool, face) {
        this.updateLang();
        const toolData = this.dict.epilogue_tools[tool];
        const renderArea = document.getElementById('ruach-render-area');
        const resultText = this.formatText(toolData.results[face][this.lang]);
        let bgStyle = toolData.bg_image ? `background-image: url('/static/world/citrinitas/modules/assets/ruach/${toolData.bg_image}');` : "";

        const btnText = this.lang === 'ko' ? '[ 계시를 확인한다 ➔ ]' : '[ Acknowledge the Revelation ➔ ]';

        renderArea.innerHTML = `
            <div class="scn-scene" id="scene-tiebreaker-res">
                <div class="scn-bg" style="${bgStyle}"></div>
                <div class="scn-overlay" style="background: rgba(0,0,0,0.85);"></div>
                <div class="scn-content">
                    <p class="scene-narrative" style="color: var(--c3-saber-green) !important;">${resultText}</p>
                    <div class="c1-options-grid scn-options-wrapper" style="margin-top: 20px;">
                        <button type="button" class="cyber-btn" onclick="window.Ruach.transitionToFinalRune()">
                            ${btnText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('ruach-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => {
            const el = document.getElementById('scene-tiebreaker-res');
            if(el) { el.classList.add('revealed', 'veiled'); }
        }, 150);
    },

    transitionToFinalRune() {
        const container = document.querySelector('#ruach-render-area .scn-scene');
        if (container) {
            container.querySelectorAll('.cyber-btn').forEach(btn => btn.style.pointerEvents = 'none');
            container.querySelectorAll('.scn-bg, .scn-overlay, .scn-content').forEach(el => {
                el.style.transition = 'opacity 1s ease-in-out';
                el.style.opacity = '0';
            });
            setTimeout(() => {
                if (document.getElementById('ruach-render-area')) this.renderFinalRuneDirectly(this.state.pendingFinalResult);
            }, 1000);
        } else {
            this.renderFinalRuneDirectly(this.state.pendingFinalResult);
        }
    },

    renderFinalRuneDirectly(result) {
        this.updateLang();
        const renderArea = document.getElementById('ruach-render-area');
        if (!renderArea) return;

        const titleText = this.lang === 'ko' ? "무의식의 심연에서 떠오른 형상:" : "The shape that emerged from the abyss:";
        const btnText = this.lang === 'ko' ? "Return to Garden" : "Return to Garden";
        
        const runeMean = this.dict.interpretations.runes[result.final_rune]?.[this.lang] || "";
        const motherMean = this.dict.interpretations.mother_letters[result.winning_mother]?.[this.lang] || "";
        const planetMean = this.dict.interpretations.planets[result.winning_planet]?.[this.lang] || "";
        const numMean = this.dict.interpretations.numerology.primary[result.numerology]?.[this.lang] || "";

        const cohesiveParagraph = [runeMean, motherMean, planetMean, numMean].filter(p => p.trim() !== "").join('<br><br>');

        const runeSymbols = {
            "FEHU": "ᚠ", "URUZ": "ᚢ", "THURISAZ": "ᚦ", "ANSUZ": "ᚨ", "RAIDHO": "ᚱ", "KENAZ": "ᚲ", "GEBO": "ᚷ", "WUNJO": "ᚹ",
            "HAGALAZ": "ᚺ", "NIED": "ᚾ", "ISAZ": "ᛁ", "JERA": "ᛃ", "EIHWAZ": "ᛇ", "PEROTH": "ᛈ", "ALGIZ": "ᛉ", "SOWILO": "ᛋ",
            "TIWAZ": "ᛏ", "BERKANO": "ᛒ", "EHWAZ": "ᛖ", "MANNAZ": "ᛗ", "LAGUZ": "ᛚ", "INGWAZ": "ᛜ", "DAGAZ": "ᛞ", "OTHALA": "ᛟ"
        };
        const runeGlyph = runeSymbols[result.final_rune.toUpperCase()] || "?";
        const runeClass = `rune-sculpt-${result.final_rune.toLowerCase()}`;
        
        renderArea.innerHTML = `
            <div class="scn-scene" id="scene-final">
                <div class="scn-bg" style="background-color: #000; background-image: none;"></div>
                <div class="scn-overlay" style="background: rgba(0,0,0,0.5);"></div>
                
                <div class="scn-content ritual-result-container" style="justify-content: center; gap: 15px; padding-top: 50px; padding-bottom: 50px;">
                    
                    <p class="scene-narrative" style="color: #aaa; margin: 0; min-height: auto; padding: 0;">${titleText}</p>
                    
                    <h2 class="c3-final-rune-title" style="margin: 0;">${result.final_rune}</h2>

                    <div class="c3-rune-stone ${runeClass}">
                        <span class="c3-rune-glyph">${runeGlyph}</span>
                    </div>
                    
                    <div class="c3-rune-interpretation cyber-panel">
                        <p>${cohesiveParagraph}</p>
                    </div>

                    <button type="button" class="cyber-btn" style="margin-top: 20px;" onclick="location.reload()">${btnText}</button>
                </div>
            </div>
        `;

        document.getElementById('ruach-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => {
            const el = document.getElementById('scene-final');
            if (el) { el.classList.add('revealed', 'veiled'); }
        }, 150);
    },

    formatText(textData) {
        if (!textData) return "";
        if (Array.isArray(textData)) return textData.join("<br>");
        return textData;
    }
};

// 🚀 라우터 진입 시 강제로 언어를 한 번 더 체크해서 반영함
window.initC3Ruach = function() {
    if (window.Ruach) {
        window.Ruach.updateLang(); 
        if (!window.Ruach.initialized) {
            window.Ruach.initialized = true;
            window.Ruach.init();
        } else if (window.Ruach.currentIndex === 0 && Object.keys(window.Ruach.state.answers).length === 0) {
            // 이미 렌더링된 인트로 화면이라도 언어가 바뀌었을 수 있으므로 다시 그림
            window.Ruach.renderStartScreen();
        }
    }
};

if (document.getElementById('ruach-app') && !document.getElementById('ruach-app').dataset.bound) {
    document.getElementById('ruach-app').dataset.bound = "true";
    window.initC3Ruach();
}