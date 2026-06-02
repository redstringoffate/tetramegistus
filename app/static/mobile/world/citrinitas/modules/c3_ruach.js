// static/mobile/world/citrinitas/modules/c3_ruach.js

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

    updateLang() {
        if (typeof WorldSettings !== 'undefined') this.lang = WorldSettings.get('lang', 'ko');
        else {
            const docLang = document.documentElement.lang;
            this.lang = (docLang === 'ko' || docLang === 'en') ? docLang : (localStorage.getItem('lang') || 'ko');
        }
    },

    init() {
        this.updateLang();
        this.renderStartScreen();
        fetch('/api/theory/citrinitas/ruach')
            .then(r => r.json()).then(d => { this.dict = d; }).catch(e => console.error(e));
    },

    renderStartScreen() {
        this.updateLang();
        const area = document.getElementById('ruach-render-area');
        if (!area) return;
        const introText = this.lang === 'ko' ? "What is seen does not remain." : "What is seen does not remain.";
        area.innerHTML = `<span class="m-ruach-intro-text" onclick="if(window.Ruach) window.Ruach.startSequence();">${introText}</span>`;
    },

    async startSequence() {
        this.updateLang();
        const area = document.getElementById('ruach-render-area');
        if (!area) return;

        if (!this.dict) {
            area.innerHTML = `<p class="m-scene-narrative">${this.lang === 'ko' ? "동기화 중입니다..." : "Synchronizing..."}</p>`;
            try {
                const res = await fetch('/api/theory/citrinitas/ruach');
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
        const renderArea = document.getElementById('ruach-render-area');
        if (!renderArea || this.currentIndex >= this.flowSequence.length) {
            if (this.currentIndex >= this.flowSequence.length) this.endSequence();
            return; 
        }

        const qId = this.flowSequence[this.currentIndex];
        const qData = this.dict.subconscious_questions[qId];
        if (!qData) { this.nextScene(); return; }

        const narrative = this.formatText(qData.narrative[this.lang]);
        let bgStyle = qData.bg_image ? `background-image: url('/static/world/citrinitas/modules/assets/ruach/${qData.bg_image}');` : "";

        let optionsHtml = `<div class="m-c1-options-grid">`;
        if (qData.options) {
            for (const [optKey, optTexts] of Object.entries(qData.options)) {
                let text = typeof optTexts === 'string' ? optTexts : optTexts[this.lang];
                optionsHtml += `<div class="m-c1-option-card" onclick="window.Ruach.setAnswer('${qId}', '${optKey}')">${text}</div>`;
            }
        } else if (qData.options_by_mother) {
            const mother = this.state.motherLetter || "Mem";
            const motherOptions = qData.options_by_mother[mother];
            for (const [optKey, optTexts] of Object.entries(motherOptions)) {
                let text = typeof optTexts === 'string' ? optTexts : optTexts[this.lang];
                optionsHtml += `<div class="m-c1-option-card" onclick="window.Ruach.setAnswer('${qId}', '${optKey}')">${text}</div>`;
            }
        } else {
            optionsHtml += `<button type="button" class="m-cyber-btn" onclick="window.Ruach.setAnswer('${qId}', 'next')">${this.lang === 'ko' ? 'Continue ➔' : 'Continue ➔'}</button>`;
        }
        optionsHtml += `</div>`;

        renderArea.innerHTML = `
            <div id="scene-${qId}" class="m-scn-scene">
                <div class="m-scn-visual-area">
                    <div class="m-scn-bg" style="${bgStyle}"></div>
                    <div class="m-scn-overlay"></div>
                </div>
                <div class="m-scn-content">
                    <p class="m-scene-narrative">${narrative}</p>
                    ${optionsHtml}
                </div>
            </div>`;

        document.getElementById('ruach-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { const sceneEl = document.getElementById(`scene-${qId}`); if (sceneEl) { sceneEl.classList.add('revealed', 'veiled'); } }, 350);
    },

    setAnswer(qId, val) {
        if (val !== 'next') this.state.answers[qId] = val;
        if (qId === 'q_mother_2') this.state.motherLetter = val;

        const container = document.getElementById(`scene-${qId}`);
        if(container) {
            container.querySelectorAll('.m-cyber-btn, .m-c1-option-card').forEach(btn => btn.style.pointerEvents = 'none');
            container.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => { el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0'; });
            
            setTimeout(() => {
                if (!document.getElementById('ruach-render-area')) return;
                if (qId === 'scn_epilogue_intro') this.revealFinalRune(); else this.nextScene();
            }, 1000); 
        } else {
            if (qId === 'scn_epilogue_intro') this.revealFinalRune(); else this.nextScene();
        }
    },

    nextScene() { this.currentIndex++; this.renderScene(); },
    endSequence() { this.revealFinalRune(); },

    async revealFinalRune() {
        this.updateLang();
        const renderArea = document.getElementById('ruach-render-area');
        if (!renderArea) return;
        
        renderArea.innerHTML = `
            <div class="m-scn-scene" id="scene-wait">
                <div class="m-scn-visual-area">
                    <div class="m-scn-bg" style="background-color: #000; background-image: none;"></div>
                    <div class="m-scn-overlay"></div>
                </div>
                <div class="m-scn-content">
                    <p class="m-scene-narrative">${this.lang === 'ko' ? "영혼의 주파수를 공명시키는 중..." : "Resonating the frequency of the soul..."}</p>
                </div>
            </div>`;
        
        setTimeout(() => { const el = document.getElementById('scene-wait'); if(el) { el.classList.add('revealed', 'veiled'); } }, 350);

        const phase1 = {}; const phase2 = [];
        for (const [k, v] of Object.entries(this.state.answers)) {
            if (k.startsWith('q_mother') || k === 'scn_tree_intro') phase1[k] = v;
            else if (k.startsWith('q_planet')) phase2.push(v);
        }

        try {
            const response = await fetch('/api/astro/citrinitas/ruach/reveal', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ phase1_answers: phase1, phase2_answers: phase2 })
            });
            const result = await response.json();
            
            if (!document.getElementById('ruach-render-area')) return; 

            const waitScene = document.getElementById('scene-wait');
            if (waitScene) {
                waitScene.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => { el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0'; });
                await new Promise(r => setTimeout(r, 1000));
            }
            if (!document.getElementById('ruach-render-area')) return; 

            const tbLog = result.tie_breaker_log || "None";
            if (tbLog !== "None") {
                let tool = ""; let face = "";
                if (tbLog.includes("Golden Coin")) { tool = "coin"; face = tbLog.replace("Golden Coin (", "").replace(")", ""); } 
                else if (tbLog.includes("Rune Dice")) { tool = "dice"; face = tbLog.replace("Rune Dice (", "").replace(")", ""); }
                this.renderTieBreakerSequence(tool, face, result);
            } else {
                this.renderFinalRuneDirectly(result);
            }
        } catch (e) {
            if (document.getElementById('ruach-render-area')) {
                document.getElementById('ruach-render-area').innerHTML = `<div class="m-scn-scene"><div class="m-scn-content"><p class="m-scene-narrative">Connection lost.</p></div></div>`;
            }
        }
    },

    renderTieBreakerSequence(tool, face, finalResult) {
        this.updateLang();
        const toolData = this.dict.epilogue_tools[tool];
        const renderArea = document.getElementById('ruach-render-area');
        
        this.state.pendingFinalResult = finalResult;
        let bgStyle = toolData.bg_image ? `background-image: url('/static/world/citrinitas/modules/assets/ruach/${toolData.bg_image}');` : "";

        const btnText = tool === 'coin' ? (this.lang === 'ko' ? '[ 금화를 던진다 ]' : '[ Flip the Coin ]') : (this.lang === 'ko' ? '[ 주사위를 굴린다 ]' : '[ Roll the Dice ]');

        renderArea.innerHTML = `
            <div class="m-scn-scene" id="scene-tiebreaker">
                <div class="m-scn-visual-area">
                    <div class="m-scn-bg" style="${bgStyle}"></div>
                    <div class="m-scn-overlay"></div>
                </div>
                <div class="m-scn-content">
                    <p class="m-scene-narrative">${this.formatText(toolData.action[this.lang])}</p>
                    <div class="m-c1-options-grid">
                        <button type="button" class="m-cyber-btn" onclick="window.Ruach.transitionToTieBreakerResult('${tool}', '${face}')">${btnText}</button>
                    </div>
                </div>
            </div>`;

        document.getElementById('ruach-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { const el = document.getElementById('scene-tiebreaker'); if(el) el.classList.add('revealed', 'veiled'); }, 350);
    },

    transitionToTieBreakerResult(tool, face) {
        const container = document.querySelector('#ruach-render-area .m-scn-scene');
        if (container) {
            container.querySelectorAll('.m-cyber-btn').forEach(btn => btn.style.pointerEvents = 'none');
            container.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => { el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0'; });
            setTimeout(() => { if (document.getElementById('ruach-render-area')) this.showTieBreakerResult(tool, face); }, 1000);
        } else this.showTieBreakerResult(tool, face);
    },

    showTieBreakerResult(tool, face) {
        this.updateLang();
        const toolData = this.dict.epilogue_tools[tool];
        const renderArea = document.getElementById('ruach-render-area');
        let bgStyle = toolData.bg_image ? `background-image: url('/static/world/citrinitas/modules/assets/ruach/${toolData.bg_image}');` : "";

        renderArea.innerHTML = `
            <div class="m-scn-scene" id="scene-tiebreaker-res">
                <div class="m-scn-visual-area">
                    <div class="m-scn-bg" style="${bgStyle}"></div>
                    <div class="m-scn-overlay" style="background: rgba(0,0,0,0.6);"></div>
                </div>
                <div class="m-scn-content">
                    <p class="m-scene-narrative" style="color: #7CFF9B !important;">${this.formatText(toolData.results[face][this.lang])}</p>
                    <div class="m-c1-options-grid">
                        <button type="button" class="m-cyber-btn" onclick="window.Ruach.transitionToFinalRune()">${this.lang === 'ko' ? '[ 계시를 확인한다 ➔ ]' : '[ Acknowledge the Revelation ➔ ]'}</button>
                    </div>
                </div>
            </div>`;

        document.getElementById('ruach-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { const el = document.getElementById('scene-tiebreaker-res'); if(el) el.classList.add('revealed', 'veiled'); }, 350);
    },

    transitionToFinalRune() {
        const container = document.querySelector('#ruach-render-area .m-scn-scene');
        if (container) {
            container.querySelectorAll('.m-cyber-btn').forEach(btn => btn.style.pointerEvents = 'none');
            container.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => { el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0'; });
            setTimeout(() => { if (document.getElementById('ruach-render-area')) this.renderFinalRuneDirectly(this.state.pendingFinalResult); }, 1000);
        } else this.renderFinalRuneDirectly(this.state.pendingFinalResult);
    },

    renderFinalRuneDirectly(result) {
        this.updateLang();
        const renderArea = document.getElementById('ruach-render-area');
        if (!renderArea) return;

        const runeMean = this.dict.interpretations.runes[result.final_rune]?.[this.lang] || "";
        const motherMean = this.dict.interpretations.mother_letters[result.winning_mother]?.[this.lang] || "";
        const planetMean = this.dict.interpretations.planets[result.winning_planet]?.[this.lang] || "";
        const numMean = this.dict.interpretations.numerology.primary[result.numerology]?.[this.lang] || "";
        const cohesiveParagraph = [runeMean, motherMean, planetMean, numMean].filter(p => p.trim() !== "").join('<br><br>');

        const runeSymbols = { "FEHU": "ᚠ", "URUZ": "ᚢ", "THURISAZ": "ᚦ", "ANSUZ": "ᚨ", "RAIDHO": "ᚱ", "KENAZ": "ᚲ", "GEBO": "ᚷ", "WUNJO": "ᚹ", "HAGALAZ": "ᚺ", "NIED": "ᚾ", "ISAZ": "ᛁ", "JERA": "ᛃ", "EIHWAZ": "ᛇ", "PEROTH": "ᛈ", "ALGIZ": "ᛉ", "SOWILO": "ᛋ", "TIWAZ": "ᛏ", "BERKANO": "ᛒ", "EHWAZ": "ᛖ", "MANNAZ": "ᛗ", "LAGUZ": "ᛚ", "INGWAZ": "ᛜ", "DAGAZ": "ᛞ", "OTHALA": "ᛟ" };
        const runeGlyph = runeSymbols[result.final_rune.toUpperCase()] || "?";
        
        renderArea.innerHTML = `
            <div class="m-scn-scene" id="scene-final">
                <div class="m-scn-content m-ritual-result-container" style="min-height: auto;">
                    <p class="m-scene-narrative" style="color: #aaa; margin: 0 0 10px 0 !important; min-height: auto; padding: 0;">${this.lang === 'ko' ? "무의식의 심연에서 떠오른 형상:" : "The shape that emerged from the abyss:"}</p>
                    <h2 class="m-c3-final-rune-title">${result.final_rune}</h2>
                    <div class="m-c3-rune-stone">
                        <span class="m-c3-rune-glyph">${runeGlyph}</span>
                    </div>
                    <div class="m-c3-rune-interpretation-panel">
                        <p>${cohesiveParagraph}</p>
                    </div>
                    <button type="button" class="m-cyber-btn" style="margin-top: 20px;" onclick="location.reload()">Return to Garden</button>
                </div>
            </div>`;

        document.getElementById('ruach-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { const el = document.getElementById('scene-final'); if (el) el.classList.add('revealed', 'veiled'); }, 350);
    },

    formatText(textData) { if (!textData) return ""; return Array.isArray(textData) ? textData.join("<br>") : textData; }
};

window.initC3Ruach = function() {
    if (window.Ruach) {
        window.Ruach.updateLang(); 
        if (!window.Ruach.initialized) { window.Ruach.initialized = true; window.Ruach.init(); } 
        else if (window.Ruach.currentIndex === 0 && Object.keys(window.Ruach.state.answers).length === 0) window.Ruach.renderStartScreen();
    }
};

if (document.getElementById('ruach-app') && !document.getElementById('ruach-app').dataset.bound) {
    document.getElementById('ruach-app').dataset.bound = "true";
    window.initC3Ruach();
}