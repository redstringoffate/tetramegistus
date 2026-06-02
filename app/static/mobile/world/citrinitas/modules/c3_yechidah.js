// app/static/mobile/world/citrinitas/modules/c3_yechidah.js

window.Yechidah = {
    lang: 'ko',
    dict: null,
    state: { 
        answers: {}, 
        finalData: null
    },
    
    flowSequence: [
        'scn_1', 'scn_2', 'scn_3', 'scn_4', 'scn_5', 'scn_6', 'scn_7', 'scn_8', 'scn_9', 'q_malkuth',
        'scn_10', 'scn_11', 'scn_12', 'scn_13', 'scn_14', 'scn_15', 'q_yesod',
        'scn_16', 'scn_17', 'scn_18', 'scn_19', 'scn_20', 'scn_21', 'q_alignment_1',
        'scn_22', 'scn_23', 'scn_24', 'q_tiferet',
        'scn_25', 'scn_26', 'scn_27', 'q_alignment_2',
        'scn_28', 'q_alignment_3', 'scn_29',
        
        // --- Da'at Abyss Interceptor ---
        'scn_daat_1', 'q_daat',
        
        'scn_31', 'scn_32', 'q_kether',
        'scn_33', 'scn_34', 'scn_35', 'scn_36', 'scn_37', 'scn_38', 'scn_39', 'scn_40',
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

    // 1. 기존 fetchDict 함수 수정 (성공 시 프리로드 즉시 실행)
    fetchDict() {
        fetch('/api/theory/citrinitas/yechidah')
            .then(r => r.json())
            .then(d => { 
                this.dict = d; 
                this.preloadImages(); // 🚀 JSON을 받자마자 이미지 백그라운드 캐싱 시작
            })
            .catch(e => console.error("[C3 Yechidah] Fetch Error:", e));
    },

    // 2. 🚀 새로 추가할 프리로드 함수
    preloadImages() {
        if (!this.dict || !this.dict.script) return;
        
        const imageUrls = new Set();
        const solidColors = ['black', 'white'];

        // JSON 스크립트를 순회하며 진짜 이미지 파일명만 추출
        for (const key in this.dict.script) {
            const scn = this.dict.script[key];
            if (scn.bg_image && !solidColors.includes(scn.bg_image)) {
                imageUrls.add(`/static/world/citrinitas/modules/assets/yechidah/${scn.bg_image}`);
            }
        }

        // 브라우저 캐시에 백그라운드로 강제 적재
        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
        console.log(`[C3 Yechidah] Preloaded ${imageUrls.size} images for seamless transition.`);
    },

    delayedReset() {
        const container = document.querySelector('#yechidah-render-area .m-scn-scene');
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
        const area = document.getElementById('yechidah-render-area');
        if (!area) return;

        const introText = this.lang === 'ko' ? "What speaks is not the one who listens." : "What speaks is not the one who listens.";

        area.innerHTML = `
            <div id="m-yechidah-intro-wrapper" style="transition: opacity 1s ease-in-out; display:flex; justify-content:center;">
                <span class="m-yechidah-intro-text" onclick="if(window.Yechidah) window.Yechidah.startSequence();">
                    ${introText}
                </span>
            </div>
        `;
    },

    async startSequence() {
        this.updateLang();
        const area = document.getElementById('yechidah-render-area');
        if (!area) return;

        if (!this.dict) {
            const syncText = this.lang === 'ko' ? "동기화 중입니다..." : "Synchronizing...";
            area.innerHTML = `<p class="m-scene-narrative">${syncText}</p>`;
            try {
                const res = await fetch('/api/theory/citrinitas/yechidah');
                this.dict = await res.json();
            } catch (e) {
                area.innerHTML = `<p class="m-scene-narrative">Error occurred. Refresh recommended.</p>`;
                return;
            }
        }

        const introWrapper = document.getElementById('m-yechidah-intro-wrapper');
        if (introWrapper) introWrapper.style.opacity = '0';

        setTimeout(() => {
            this.currentIndex = 0;
            this.state.answers = {};
            this.renderScene();
        }, 1200); 
    },

    // 💡 최신화된 Da'at 발동 조건
    checkDaatCondition() {
        const ans = this.state.answers;
        const a1 = ans['q_alignment_1'];
        const a2 = ans['q_alignment_2'];
        const a3 = ans['q_alignment_3'];
        
        if (!a1 || !a2 || !a3) return false;

        const isAllSame = (a1 === a2 && a2 === a3);
        if (isAllSame) return false;

        const planets = { saturn: 0, jupiter: 0, mars: 0, sun: 0, venus: 0, mercury: 0, moon: 0 };
        const pillars = { severity: 0, center: 0, benevolence: 0 };

        const pWeights = { q_malkuth: 0.9, q_yesod: 1.1, q_tiferet: 1.3 }; 
        for (const [q, w] of Object.entries(pWeights)) {
            if (ans[q]) planets[ans[q]] += w;
        }

        pillars[a1] += 1; pillars[a2] += 1; pillars[a3] += 1;

        const profiles = {
            kether: { p: ['sun'], pil: 'center' },
            chokmah: { p: ['jupiter'], pil: 'benevolence' },
            binah: { p: ['saturn'], pil: 'severity' },
            chesed: { p: ['jupiter', 'mars'], pil: 'benevolence' },
            geburah: { p: ['saturn', 'mars'], pil: 'severity' },
            tiferet: { p: ['venus'], pil: 'center' },
            netzach: { p: ['jupiter', 'mercury'], pil: 'benevolence' },
            hod: { p: ['saturn', 'mercury'], pil: 'severity' },
            yesod: { p: ['mercury'], pil: 'center' },
            malkuth: { p: ['moon'], pil: 'center' }
        };

        let topSeph = "";
        let maxScore = -1;

        for (const [name, prof] of Object.entries(profiles)) {
            let pSum = 0;
            for (const p of prof.p) pSum += (planets[p] || 0);
            const score = (pSum / prof.p.length) + (pillars[prof.pil] || 0);
            if (score > maxScore) { maxScore = score; topSeph = name; }
        }

        return ['kether', 'chokmah', 'binah'].includes(topSeph);
    },

    renderScene() {
        this.updateLang();
        const renderArea = document.getElementById('yechidah-render-area');
        if (!renderArea || this.currentIndex >= this.flowSequence.length) return; 

        let qId = this.flowSequence[this.currentIndex];

        if (qId === 'scn_daat_1') {
            if (!this.checkDaatCondition()) {
                this.currentIndex += 2;
                qId = this.flowSequence[this.currentIndex];
            }
        }

        if (qId === 'EVALUATE') {
            this.evaluateYechidah(); return;
        }

        if (qId === 'SHOW_RESULT') {
            this.renderFinalResult(); return;
        }

        const sceneData = this.dict.script[qId];
        if (!sceneData) { this.nextScene(); return; }

        const narrative = this.formatText(sceneData[this.lang]);
        
        let bgStyle = "";
        let bgClass = "";
        
        const solidColors = ['black', 'white'];
        if (sceneData.bg_image && solidColors.includes(sceneData.bg_image)) {
            bgClass = `m-yechidah-bg-${sceneData.bg_image}`;
        } else if (sceneData.bg_image) {
            bgStyle = `background-image: url('/static/world/citrinitas/modules/assets/yechidah/${sceneData.bg_image}');`;
        }

        let effectClass = sceneData.bg_effect ? `effect-${sceneData.bg_effect}` : "";
        let optionsHtml = `<div class="m-c1-options-grid">`;
        
        if (sceneData.options) {
            for (const [optKey, optData] of Object.entries(sceneData.options)) {
                let text = typeof optData === 'string' ? optData : optData[this.lang];
                optionsHtml += `<div class="m-c1-option-card" onclick="window.Yechidah.setAnswer('${qId}', '${optKey}')">${text}</div>`;
            }
        } else {
            let btnText = 'Continue ➔';
            let action = `window.Yechidah.setAnswer('${qId}', 'next')`;
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

        document.getElementById('yechidah-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

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

    async evaluateYechidah() {
        this.updateLang();
        const renderArea = document.getElementById('yechidah-render-area');
        if (!renderArea) return;

        renderArea.innerHTML = `
            <div class="m-scn-scene" id="scene-wait">
                <div class="m-scn-visual-area">
                    <div class="m-scn-bg m-yechidah-bg-black"></div>
                    <div class="m-scn-overlay"></div>
                </div>
                <div class="m-scn-content">
                    <p class="m-scene-narrative">${this.lang === 'ko' ? "The silence answers..." : "The silence answers..."}</p>
                </div>
            </div>`;
        
        setTimeout(() => { 
            const el = document.getElementById('scene-wait');
            if(el) { el.classList.add('revealed', 'veiled'); }
        }, 350);

        try {
            const response = await fetch('/api/astro/citrinitas/yechidah/reveal', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ answers: this.state.answers })
            });

            if (!response.ok) throw new Error(`Server Error: ${response.status}`);
            const result = await response.json();
            this.state.finalData = result;

            const waitScene = document.getElementById('scene-wait');
            if (waitScene) {
                waitScene.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => {
                    el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0';
                });
                await new Promise(r => setTimeout(r, 1000));
            }

            this.flowSequence = ['SHOW_RESULT'];
            this.currentIndex = 0;
            this.renderScene();

        } catch (e) {
            console.error("Evaluation Error", e);
            if (renderArea) {
                const errText = this.lang === 'ko' ? "연결이 끊겼습니다." : "Connection lost.";
                renderArea.innerHTML = `<div class="m-scn-scene"><div class="m-scn-content"><p class="m-scene-narrative">${errText}</p></div></div>`;
            }
        }
    },

    renderFinalResult() {
        this.updateLang();
        const renderArea = document.getElementById('yechidah-render-area');
        if (!renderArea) return;

        const data = this.state.finalData || {};
        const rev = this.dict.revelations;

        const sephKey = data.final_sephiroth;
        const pathKey = data.final_path;
        const triKey = data.final_triangle;

        const sephData = rev.sephiroth[sephKey] || {};
        const pathData = rev.path[pathKey] || {};
        const triData = rev.triangle[triKey] || {};

        const capitalize = (s) => s ? s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
        
        const sephTitleStr = sephKey ? capitalize(sephKey) : "UNKNOWN";
        const sephDescStr = this.formatText(sephData[this.lang]);

        const pathNumStr = pathKey ? pathKey.replace('_', ' ').toUpperCase() : "";
        const pathTitleStr = `${pathNumStr}`;
        const pathDescStr = this.formatText(pathData[this.lang]);

        const triTitleStr = (triData.title && triData.title[this.lang]) ? triData.title[this.lang] : "";
        const triDescStr = this.formatText(triData[this.lang]);

        const btnText = "Awaken";

        renderArea.innerHTML = `
            <div class="m-scn-scene" id="scene-final">
                <div class="m-scn-content m-yechidah-result-container" style="min-height: auto;">
                    
                    <div class="m-yechidah-revelation-block">
                        <h2 class="m-y-title-sephiroth">${sephTitleStr}</h2>
                        <div class="m-y-desc-sephiroth">${sephDescStr}</div>
                    </div>

                    <div class="m-yechidah-revelation-block">
                        <h2 class="m-y-title-path">${pathTitleStr}</h2>
                        <div class="m-y-desc-path">${pathDescStr}</div>
                    </div>

                    <div class="m-yechidah-revelation-block" style="border-bottom: none;">
                        <h2 class="m-y-title-triangle">${triTitleStr}</h2>
                        <div class="m-y-desc-triangle">${triDescStr}</div>
                    </div>

                    <button type="button" class="m-cyber-btn m-yechidah-mt-20" onclick="location.reload()">${btnText}</button>
                </div>
            </div>
        `;

        document.getElementById('yechidah-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

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

window.initC3Yechidah = function() {
    if (!window.Yechidah) return;

    const pulseContainer = document.getElementById('m-yechidah-pulse-container');
    if (pulseContainer && pulseContainer.parentNode !== document.body) {
        document.body.appendChild(pulseContainer);
    }

    window.Yechidah.updateLang();

    const area = document.getElementById('yechidah-render-area');
    if (area && !window.Yechidah.initialized) {
        window.Yechidah.initialized = true;
        window.Yechidah.renderStartScreen();
        window.Yechidah.fetchDict();
    }
};

if (document.getElementById('yechidah-app') && !document.getElementById('yechidah-app').dataset.bound) {
    document.getElementById('yechidah-app').dataset.bound = "true";
    window.initC3Yechidah();
}