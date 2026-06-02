// app/static/world/citrinitas/modules/c3_yechidah.js

// 🚀 [복구]: 다른 서브모듈 탭 클릭 시 정상적으로 탈출하는 라우터 인터셉터
const params = new URLSearchParams(window.location.search);
if (params.has('module')) {
    window.location.href = `/world/citrinitas?module=${params.get('module')}`;
}

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

    fetchDict() {
        fetch('/api/theory/citrinitas/yechidah')
            .then(r => r.json())
            .then(d => { this.dict = d; })
            .catch(e => console.error("[C3 Yechidah] Fetch Error:", e));
    },

    delayedReset() {
        const container = document.querySelector('#yechidah-render-area .scn-scene');
        if (container) {
            container.querySelectorAll('.cyber-btn').forEach(btn => btn.style.pointerEvents = 'none');
            container.querySelectorAll('.scn-bg, .scn-overlay, .scn-content').forEach(el => {
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

        // 🚀 [복구]: Chayah와 동일하게 글로벌 레이아웃을 상속받는 ruach-intro-wrapper 사용
        area.innerHTML = `
            <div id="yechidah-intro-wrapper" class="ruach-intro-wrapper" style="transition: opacity 1s ease-in-out;">
                <span class="yechidah-intro-text" onclick="if(window.Yechidah) window.Yechidah.startSequence();">
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
            const errText = this.lang === 'ko' ? "오류 발생. 새로고침을 권장합니다." : "Error occurred. Refresh recommended.";
            
            area.innerHTML = `<p class="scene-narrative">${syncText}</p>`;
            try {
                const res = await fetch('/api/theory/citrinitas/yechidah');
                this.dict = await res.json();
            } catch (e) {
                area.innerHTML = `<p class="scene-narrative">${errText}</p>`;
                return;
            }
        }

        const introWrapper = document.getElementById('yechidah-intro-wrapper');
        if (introWrapper) introWrapper.style.opacity = '0';

        setTimeout(() => {
            this.currentIndex = 0;
            this.state.answers = {};
            this.renderScene();
        }, 1200); 
    },

    // 💡 다아트 발동 조건 (백엔드와 완벽 동기화)
    checkDaatCondition() {
        const ans = this.state.answers;
        const a1 = ans['q_alignment_1'];
        const a2 = ans['q_alignment_2'];
        const a3 = ans['q_alignment_3'];
        
        if (!a1 || !a2 || !a3) return false;

        // 1. 기둥 3개가 전부 똑같은 몰빵(3.0)인지 체크
        const isAllSame = (a1 === a2 && a2 === a3);
        if (isAllSame) return false; // 내면에 텐션(갈등)이 없으므로 열리지 않음

        // 2. 프론트엔드 가채점 (현재까지의 점수로 Kether, Chokmah, Binah 상위권 랭크 여부 확인)
        // 아직 q_kether(가중치 1.5)를 풀기 전이므로, 현재까지의 누적 점수로 천상계 진입 가능성을 평가
        const planets = { saturn: 0, jupiter: 0, mars: 0, sun: 0, venus: 0, mercury: 0, moon: 0 };
        const pillars = { severity: 0, center: 0, benevolence: 0 };

        const pWeights = { q_malkuth: 0.9, q_yesod: 1.1, q_tiferet: 1.3 }; 
        for (const [q, w] of Object.entries(pWeights)) {
            if (ans[q]) planets[ans[q]] += w;
        }

        pillars[a1] += 1; pillars[a2] += 1; pillars[a3] += 1;

        // 백엔드와 동일한 세피라 프로필 및 인플레이션(평균) 정규화 연산
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

        // 3. 1등 세피라가 천상계 3대장 중 하나라면 Da'at 오픈!
        return ['kether', 'chokmah', 'binah'].includes(topSeph);
    },

    renderScene() {
        this.updateLang();
        const renderArea = document.getElementById('yechidah-render-area');
        if (!renderArea) return; 
        if (this.currentIndex >= this.flowSequence.length) return; 

        let qId = this.flowSequence[this.currentIndex];

        // Da'at 분기 처리
        if (qId === 'scn_daat_1') {
            if (!this.checkDaatCondition()) {
                this.currentIndex += 2;
                qId = this.flowSequence[this.currentIndex];
            }
        }

        if (qId === 'EVALUATE') {
            this.evaluateYechidah();
            return;
        }

        if (qId === 'SHOW_RESULT') {
            this.renderFinalResult();
            return;
        }

        const sceneData = this.dict.script[qId];
        if (!sceneData) { this.nextScene(); return; }

        const narrative = this.formatText(sceneData[this.lang]);
        
        let bgStyle = "";
        let bgClass = "";
        const solidColors = ['black', 'white'];
        
        if (sceneData.bg_image && solidColors.includes(sceneData.bg_image)) {
            bgClass = `yechidah-bg-${sceneData.bg_image}`;
        } else if (sceneData.bg_image) {
            bgStyle = `background-image: url('/static/world/citrinitas/modules/assets/yechidah/${sceneData.bg_image}');`;
        }

        let effectClass = sceneData.bg_effect ? `effect-${sceneData.bg_effect}` : "";
        let optionsHtml = `<div class="c1-options-grid scn-options-wrapper">`;
        
        if (sceneData.options) {
            for (const [optKey, optData] of Object.entries(sceneData.options)) {
                let text = typeof optData === 'string' ? optData : optData[this.lang];
                optionsHtml += `<div class="c1-option-card scn-opt" onclick="window.Yechidah.setAnswer('${qId}', '${optKey}')">${text}</div>`;
            }
        } else {
            let btnText = 'Continue ➔';
            let action = `window.Yechidah.setAnswer('${qId}', 'next')`;
            optionsHtml += `<button type="button" class="cyber-btn" onclick="${action}">${btnText}</button>`;
        }
        optionsHtml += `</div>`;

        renderArea.innerHTML = `
            <div id="scene-${qId}" class="scn-scene ${effectClass}">
                <div class="scn-bg ${bgClass}" style="${bgStyle}"></div>
                <div class="scn-overlay"></div>
                <div class="scn-content">
                    <p class="scene-narrative">${narrative}</p>
                    ${optionsHtml}
                </div>
            </div>
        `;

        document.getElementById('yechidah-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => { 
            const sceneEl = document.getElementById(`scene-${qId}`);
            if (sceneEl) { sceneEl.classList.add('revealed', 'veiled'); }
        }, 450);
    },

    setAnswer(qId, val) {
        if (val !== 'next') {
            this.state.answers[qId] = val;
        }
        const container = document.getElementById(`scene-${qId}`);
        if(container) {
            container.querySelectorAll('.cyber-btn, .c1-option-card').forEach(btn => btn.style.pointerEvents = 'none');
            container.querySelectorAll('.scn-bg, .scn-overlay, .scn-content').forEach(el => {
                el.style.transition = 'opacity 1s ease-in-out';
                el.style.opacity = '0';
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

        const waitText = this.lang === 'ko' ? "The silence answers..." : "The silence answers...";
        renderArea.innerHTML = `
            <div class="scn-scene" id="scene-wait">
                <div class="scn-bg yechidah-bg-black"></div>
                <div class="scn-overlay"></div>
                <div class="scn-content"><p class="scene-narrative">${waitText}</p></div>
            </div>`;
        
        setTimeout(() => { 
            const el = document.getElementById('scene-wait');
            if(el) el.classList.add('revealed', 'veiled'); 
        }, 450);

        try {
            const response = await fetch('/api/astro/citrinitas/yechidah/reveal', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ answers: this.state.answers })
            });

            if (!response.ok) throw new Error(`Server Error: ${response.status}`);

            const result = await response.json();
            this.state.finalData = result;

            const waitScene = document.getElementById('scene-wait');
            if (waitScene) {
                waitScene.querySelectorAll('.scn-bg, .scn-overlay, .scn-content').forEach(el => {
                    el.style.transition = 'opacity 1s ease-in-out';
                    el.style.opacity = '0';
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
                renderArea.innerHTML = `<div class="scn-scene"><div class="scn-content"><p class="scene-narrative">${errText}</p></div></div>`;
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
        
        // Sephiroth
        const sephTitleStr = sephKey ? capitalize(sephKey) : "UNKNOWN";
        const sephDescStr = this.formatText(sephData[this.lang]);

        // Path
        const pathNumStr = pathKey ? pathKey.replace('_', ' ').toUpperCase() : "";
        const pathTitleStr = `${pathNumStr}`;
        const pathDescStr = this.formatText(pathData[this.lang]);

        // Triangle (title 직접 사용)
        const triTitleStr = (triData.title && triData.title[this.lang]) ? triData.title[this.lang] : "";
        const triDescStr = this.formatText(triData[this.lang]);

        const btnText = "Awaken";

        // 🚀 [복구]: Chayah와 완벽히 동일한 구조 내에 타이포그래피만 적용
        renderArea.innerHTML = `
            <div class="scn-scene" id="scene-final">
                <div class="scn-bg yechidah-bg-black"></div>
                <div class="scn-overlay yechidah-overlay-dark"></div>
                
                <div class="scn-content yechidah-result-container">
                    
                    <div class="yechidah-revelation-block">
                        <h2 class="y-title-sephiroth">${sephTitleStr}</h2>
                        <div class="y-desc-sephiroth">${sephDescStr}</div>
                    </div>

                    <div class="yechidah-revelation-block">
                        <h2 class="y-title-path">${pathTitleStr}</h2>
                        <div class="y-desc-path">${pathDescStr}</div>
                    </div>

                    <div class="yechidah-revelation-block" style="border-bottom: none;">
                        <h2 class="y-title-triangle">${triTitleStr}</h2>
                        <div class="y-desc-triangle">${triDescStr}</div>
                    </div>

                    <button type="button" class="cyber-btn chayah-mt-20" onclick="location.reload()">${btnText}</button>
                </div>
            </div>
        `;

        document.getElementById('yechidah-app').scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => {
            const el = document.getElementById('scene-final');
            if (el) { el.classList.add('revealed', 'veiled'); }
        }, 450);
    },

    formatText(textData) {
        if (!textData) return "";
        if (Array.isArray(textData)) return textData.join("<br>");
        return textData;
    }
};

window.initC3Yechidah = function() {
    if (!window.Yechidah) return;
    window.Yechidah.updateLang();

    const area = document.getElementById('yechidah-render-area');
    if (area) { window.Yechidah.renderStartScreen(); }

    if (!window.Yechidah.initialized) {
        window.Yechidah.initialized = true;
        window.Yechidah.fetchDict();
    }
};

const yechidahApp = document.getElementById('yechidah-app');
if (yechidahApp) {
    window.initC3Yechidah();
}