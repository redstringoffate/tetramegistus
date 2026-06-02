// app/static/world/citrinitas/modules/c3_neshamah.js

const params = new URLSearchParams(window.location.search);
if (params.has('module')) {
    window.location.href = `/world/citrinitas?module=${params.get('module')}`;
}

window.Neshamah = {
    lang: 'en', 
    initialized: false,
    currentNodeKey: null,

    state: {
        viewMode: 'script',     
        spreadType: 'tree_of_life', // 기본값을 생명나무로 변경
        drawnCards: [],         
        selectedIndex: 0,       
        coreData: null,         
        scriptData: null,
        drawCounter: 0,
        rollbackCount: 0
    },

    // 유저의 고유 체계 완벽 반영
    GLYPH_TABLE: {
        mother: { 
            'shin': { char: 'ש', cls: 'glyph-mother-shin' }, 
            'mem': { char: 'מ', cls: 'glyph-mother-mem' }, 
            'aleph': { char: 'א', cls: 'glyph-mother-aleph' }, 
            'infinity': { char: '∞', cls: 'glyph-fool' } 
        },
        double: { 
            'dalet': { char: '♂', cls: 'glyph-planet-mars' }, 
            'resh': { char: '☿', cls: 'glyph-planet-mercury' }, 
            'gimel': { char: '♃', cls: 'glyph-planet-jupiter' }, 
            'pe': { char: '♀', cls: 'glyph-planet-venus' }, 
            'bet': { char: '♄', cls: 'glyph-planet-saturn' }, 
            'kaf': { char: '☉', cls: 'glyph-planet-sun' }, 
            'tav': { char: '☽', cls: 'glyph-planet-moon' } 
        },
        // 연금술 기호와 수트를 Simple Letter에 매핑
        simple: { 
            'he': { char: '🜂', suit: 'WANDS', cls: 'glyph-element-fire' },
            'tet': { char: '🜂', suit: 'WANDS', cls: 'glyph-element-fire' },
            'samekh': { char: '🜂', suit: 'WANDS', cls: 'glyph-element-fire' },
            'vav': { char: '🜃', suit: 'COINS', cls: 'glyph-element-earth' },
            'yod': { char: '🜃', suit: 'COINS', cls: 'glyph-element-earth' },
            'ayin': { char: '🜃', suit: 'COINS', cls: 'glyph-element-earth' },
            'zayin': { char: '🜁', suit: 'SWORDS', cls: 'glyph-element-air' },
            'lamed': { char: '🜁', suit: 'SWORDS', cls: 'glyph-element-air' },
            'tzadi': { char: '🜁', suit: 'SWORDS', cls: 'glyph-element-air' },
            'chet': { char: '🜄', suit: 'CUPS', cls: 'glyph-element-water' },
            'nun': { char: '🜄', suit: 'CUPS', cls: 'glyph-element-water' },
            'qoph': { char: '🜄', suit: 'CUPS', cls: 'glyph-element-water' }
        }
    },

    toRoman(num) {
        const lookup = { M:1000, CM:900, D:500, CD:400, C:100, XC:90, L:50, XL:40, X:10, IX:9, V:5, IV:4, I:1 };
        let roman = '', i; let n = parseInt(num);
        if (n === 0) return '0';
        for (i in lookup) { while (n >= lookup[i]) { roman += i; n -= lookup[i]; } }
        return roman;
    },

    getExactCardName(cardId) {
        // 🚀 메이저 아르카나 완벽 포맷팅 (THE 유무 및 대소문자 엄격 준수)
        const MAJOR_EXACT = {
            "0_Fool": "THE FOOL", "1_Magician": "THE MAGICIAN", "2_High_Priestess": "THE HIGH PRIESTESS",
            "3_Empress": "THE EMPRESS", "4_Emperor": "THE EMPEROR", "5_Hierophant": "THE HIEROPHANT",
            "6_Lovers": "THE LOVERS", "7_Chariot": "THE CHARIOT", "8_Strength": "STRENGTH",
            "9_Hermit": "THE HERMIT", "10_Wheel_of_Fortune": "WHEEL of FORTUNE", "11_Justice": "JUSTICE",
            "12_Hanged_Man": "THE HANGED MAN", "13_Death": "DEATH", "14_Temperance": "TEMPERANCE",
            "15_Devil": "THE DEVIL", "16_Tower": "THE TOWER", "17_Star": "THE STAR",
            "18_Moon": "THE MOON", "19_Sun": "THE SUN", "20_Judgement": "JUDGEMENT", "21_World": "THE WORLD"
        };
        if (MAJOR_EXACT[cardId]) return MAJOR_EXACT[cardId];
        
        // 🚀 마이너 아르카나 포맷팅 (예: "ACE of WANDS", "2 of CUPS", "Page of SWORDS")
        const parts = cardId.split('_');
        if (parts.length === 2) {
            let rank = parts[0];
            let suit = parts[1].toUpperCase();
            if (rank === "Ace") rank = "ACE";
            else if (rank === "Page") rank = "Page";
            else if (rank === "Knight") rank = "Knight";
            else if (rank === "Queen") rank = "Queen";
            else if (rank === "King") rank = "King";
            return `${rank} of ${suit}`;
        }
        return cardId.toUpperCase();
    },

    updateLang() {
        if (typeof WorldSettings !== 'undefined') {
            this.lang = WorldSettings.get('lang', 'en');
        } else {
            this.lang = document.documentElement.lang || localStorage.getItem('lang') || 'en';
        }
    },

    // JSON 계층 탐색기
    getNodeData(path) {
        const root = this.state.scriptData?.neshamah_script;
        if (!root) return null;

        if (path.includes('.')) {
            let current = root;
            const parts = path.split('.');
            for (const p of parts) {
                if (!current[p]) return null;
                current = current[p];
            }
            return current;
        } 
        
        function find(obj, key) {
            if (!obj || typeof obj !== 'object') return null;
            if (obj[key]) return obj[key];
            for (const k in obj) {
                const res = find(obj[k], key);
                if (res) return res;
            }
            return null;
        }
        return find(root, path);
    },

    // 깊은 객체 병합 (Lazy Load로 불러온 루트 JSON을 기존 Core에 덮어씌움)
    mergeDeep(target, source) {
        const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj);
        if (!isObject(target) || !isObject(source)) return source;
        Object.keys(source).forEach(key => {
            const targetValue = target[key];
            const sourceValue = source[key];
            
            // 🚨 [핵심 버그 수정]: 기존 targetValue.concat(sourceValue) 로직 파기.
            // 배열일 경우 이어붙이지 말고 무조건 최신 데이터(sourceValue)로 깔끔하게 덮어씌움.
            if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
                target[key] = sourceValue; 
            } else if (isObject(targetValue) && isObject(sourceValue)) {
                target[key] = this.mergeDeep(Object.assign({}, targetValue), sourceValue);
            } else {
                target[key] = sourceValue;
            }
        });
        return target;
    },

// ==================================
// 🟢 교체: init() 전체
// ==================================
    init() {
        this.updateLang();
        this.state.viewMode = 'script';
        this.state.drawnCards = [];
        this.state.selectedIndex = 0;
        this.currentNodeKey = null;
        this.state.rollbackCount = 0;

        this.renderStartScreen();

        fetch('/api/theory/citrinitas/neshamah_core')
            .then(r => r.ok ? r.json() : null)
            .then(core => {
                if (core && !core.error) {
                    // 🚀 [필수] JSON 깊은 복사: Script가 병합될 때 Core 원형이 오염되지 않도록 격리
                    this.state.coreData = JSON.parse(JSON.stringify(core));
                    this.state.scriptData = JSON.parse(JSON.stringify(core));
                }
                const titleObj = this.state.coreData?.title || { en: "[ נשמה ] NESHAMAH : THE VEILED MYSTIC", ko: "[ נשמה ] NESHAMAH : 베일에 가려진 예언자" };
                const titleEl = document.querySelector('.ritual-title');
                if (titleEl) titleEl.innerText = titleObj[this.lang];
            })
            .catch(e => console.error("[C3 Neshamah] Fetch Error:", e));
    },

    renderStartScreen() {
        this.updateLang();
        const area = document.getElementById('neshamah-render-area');
        if (!area) return;

        const introText = "You only see what agrees to be seen.";
        area.innerHTML = `
            <div class="ruach-intro-wrapper">
                <span class="neshamah-intro-text" onclick="if(window.Neshamah) window.Neshamah.beginRitual();">
                    ${introText}
                </span>
            </div>
        `;
    },

    beginRitual() {
        const area = document.getElementById('neshamah-render-area');
        if (!this.state.scriptData) {
            area.innerHTML = `
                <div class="scn-scene" style="background:#000; justify-content:center; align-items:center; display:flex;">
                    <div style="text-align:center;">
                        <p style="color:#ff3333; font-weight:bold; letter-spacing:2px; margin-bottom:10px;">[ SYSTEM ERROR ]</p>
                        <p style="color:#aaa; font-size:0.85rem; line-height:1.6;">
                            neshamah_core 데이터를 불러오지 못했습니다.<br>
                            라우터 통신 상태를 확인하십시오.
                        </p>
                        <button type="button" class="cyber-btn" style="margin-top:20px;" onclick="window.Neshamah.renderStartScreen()">RETURN</button>
                    </div>
                </div>`;
            return;
        }

        // 🚀 Core JSON에 있는 프롤로그 시작점으로 직행
        this.currentNodeKey = 'prologue.intro_1'; 
        this.renderScene();
    },

    // ==========================================================
    // 2. 🚀 지연 로딩 (Lazy Loading) 라우터 연동기
    // ==========================================================
    lazyLoadRoute(routeId, targetPath) {
        const sceneEl = document.querySelector('#neshamah-render-area .scn-scene');
        if (sceneEl) {
            // 1. 연타 방지 및 서서히 암전 (nextNode와 동일한 결계)
            const buttons = sceneEl.querySelectorAll('.cyber-btn, .c1-option-card');
            buttons.forEach(btn => btn.style.pointerEvents = 'none');
            sceneEl.style.transition = 'opacity 1s ease-in-out';
            sceneEl.style.opacity = '0';
        }

        // 2. 1초 뒤 완전히 암전되면 로딩 텍스트를 띄우고 Fetch 시작
        setTimeout(() => {
            const area = document.getElementById('neshamah-render-area');
            if (area) {
                area.innerHTML = `
                    <div class="scn-scene" style="background:#000; justify-content:center; align-items:center; display:flex; opacity: 1; transition: opacity 1.5s ease-in-out;">
                        <p style="color:#666; font-style:italic; letter-spacing: 2px;">Descending deeper into the abyss...</p>
                    </div>`;
            }

            fetch(`/api/theory/citrinitas/neshamah_${routeId}`)
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data && !data.error) {
                        this.mergeDeep(this.state.scriptData, data); // JSON 합치기
                        // 몰입감을 위해 0.8초 정도 심연(Abyss) 대기 후 씬 렌더링
                        setTimeout(() => {
                            this.currentNodeKey = targetPath;
                            this.renderScene();
                        }, 800);
                    } else {
                        if (area) {
                            area.innerHTML = `
                                <div class="scn-scene" style="background:#000; justify-content:center; align-items:center; display:flex; opacity: 1;">
                                    <div style="text-align:center;">
                                        <p style="color:#ff3333;">[ERROR] Failed to load route: ${routeId}</p>
                                        <button type="button" class="cyber-btn" style="margin-top:20px;" onclick="window.Neshamah.renderStartScreen()">RETURN</button>
                                    </div>
                                </div>`;
                        }
                    }
                })
                .catch(e => console.error(e));
        }, 1000);
    },

    renderScene() {
        this.updateLang();
        const area = document.getElementById('neshamah-render-area');
        if (!area) return;

        const node = this.getNodeData(this.currentNodeKey);

        if (!node) {
            area.innerHTML = `
                <div class="scn-scene" style="background:#000; justify-content:center; align-items:center; display:flex;">
                    <div style="text-align:center;">
                        <p style="color:#ff3333; font-weight:bold;">[ PATH LOST ]</p>
                        <p style="color:#aaa; font-size:0.85rem;">'${this.currentNodeKey}' 노드를 찾을 수 없습니다.</p>
                        <button type="button" class="cyber-btn" style="margin-top:20px;" onclick="window.Neshamah.renderStartScreen()">RETURN</button>
                    </div>
                </div>`;
            return;
        }

        // 🚀 [해결]: 원본 데이터가 영구 조작되지 않도록 새로운 배열(renderLines)로 복사해서 사용
        const originalLines = node[this.lang] || node['en'] || [];
        let renderLines = [...originalLines];

        if (node.action === 'render_fatecoin_step') {
            const currentResult = this.state.drawnCards[this.state.coinTossIndex];
            const remaining = 5 - this.state.coinTossIndex; 
            
            const translatedResult = currentResult === 'Heads' 
                ? (this.lang === 'ko' ? '앞면 (Heads)' : 'Heads') 
                : (this.lang === 'ko' ? '뒷면 (Tails)' : 'Tails');
                
            for (let i = 0; i < renderLines.length; i++) {
                renderLines[i] = renderLines[i].replace(/{result}/g, translatedResult).replace(/{remaining}/g, remaining);
            }
        }

        const dialogueHTML = renderLines.map(line => `<p>${line}</p>`).join('');
        const bgImg = node.bg_image ? `/static/world/citrinitas/modules/assets/neshamah/${node.bg_image}` : '';

        let actionButtonsHTML = '';
        const act = node.action || "";

        if (act.startsWith("FETCH_ROUTE_")) {
            const routeId = act.replace("FETCH_ROUTE_", "").toLowerCase(); 
            const targetPath = node.route || node.next;
            actionButtonsHTML = `<button type="button" class="cyber-btn" onclick="window.Neshamah.lazyLoadRoute('${routeId}', '${targetPath}')">CONTINUE ➔</button>`;
        } 
        else if (node.options) {
            actionButtonsHTML = `<div class="c1-options-grid">`;
            for (const [optKey, optData] of Object.entries(node.options)) {
                const text = (typeof optData === 'object') ? (optData[this.lang] || optData['en']) : optData;
                const targetPath = (typeof optData === 'object') ? (optData.route || optData.next || optData.target || optKey) : optKey;
                
                if (typeof optData === 'object' && optData.action && optData.action.startsWith("FETCH_ROUTE_")) {
                    const routeId = optData.action.replace("FETCH_ROUTE_", "").toLowerCase();
                    actionButtonsHTML += `<div class="c1-option-card" onclick="window.Neshamah.lazyLoadRoute('${routeId}', '${targetPath}')">${text}</div>`;
                } else {
                    actionButtonsHTML += `<div class="c1-option-card" onclick="window.Neshamah.nextNode('${targetPath}')">${text}</div>`;
                }
            }
            actionButtonsHTML += `</div>`;
        }

        // 🚀 [여기에 복붙!] ========================================================
        else if (act === 'start_fatecoin_toss') {
            const targetPath = node.route || node.next;
            // 🚀 끝에 ,'flip_coin' 을 추가하여 툴 타입을 명확히 지정
            actionButtonsHTML = `<div class="c1-options-grid"><button type="button" class="cyber-btn" onclick="window.Neshamah.executeIntegratedDraw('flip_coin', '${targetPath}', 'flip_coin')">FLIP COIN (6) ➔</button></div>`;
            
        } else if (act === 'render_fatecoin_step') {
            // 🚀 [수정됨] 정확한 남은 횟수 계산 (총 6번 던지기, Index는 0~5)
            // coinTossIndex가 0일 때 남은 횟수는 5번이어야 함
            const maxTosses = 6;
            const currentTossNumber = this.state.coinTossIndex + 1; // 현재 몇 번째 던지는 중인지 (1~6)
            const remaining = maxTosses - currentTossNumber; 
            
            if (remaining > 0) {
                // 남은 횟수가 있으면 다음 던지기 진행 (부드러운 전환 함수 호출)
                actionButtonsHTML = `<div class="c1-options-grid"><button type="button" class="cyber-btn" onclick="window.Neshamah.nextCoinToss()">NEXT TOSS ➔</button></div>`;
            } else {
                // 6번 다 끝났으면 (remaining === 0) 앞면 개수를 세서 라우팅
                const headsCount = this.state.drawnCards.filter(c => c === 'Heads').length;
                let resultKey = '';
                
                if (headsCount === 6) resultKey = 'c2_c1_c2_c3_result_all_h';
                else if (headsCount === 0) resultKey = 'c2_c1_c2_c3_result_all_t';
                else if (headsCount >= 4) resultKey = 'c2_c1_c2_c3_result_h45';
                else if (headsCount <= 2) resultKey = 'c2_c1_c2_c3_result_t45';
                else resultKey = 'c2_c1_c2_c3_result_33'; 
                
                // 🚀 [수정됨] JSON 구조에 맞게 단축된 부모 경로 사용 (이전 경로 수정 반영)
                const targetPath = `branches.c2.c2_c1.c2_c1_c2_c3.${resultKey}`;
                actionButtonsHTML = `<div class="c1-options-grid"><button type="button" class="cyber-btn" onclick="window.Neshamah.nextNode('${targetPath}')">VIEW RESULT ➔</button></div>`;
            }
        }

        else if (act === "draw_tarot_card" || act === "roll_astrology_dice" || act === "draw_witchs_rune") {
            let toolType = "tarot";
            if (act === "roll_astrology_dice") toolType = "dice";
            if (act === "draw_witchs_rune") toolType = "rune";

            // 🚀 [해결 4] 무한 루프 차단: 노드 진입 시 무조건 드로우 노드 키 갱신 및 카운터 강제 초기화
            this.state.currentDrawNode = this.currentNodeKey;
            const nextTargetKey = node.next || node.route;
            
            if (toolType === "dice" || toolType === "rune") {
                this.state.spreadType = "1_card";
                this.state.drawCounter = 1; // 0이나 -1로 꼬이는 현상 원천 차단
            } else {
                const scrDict = this.state.scriptData?.scr_dict_tarot;
                let detectedSpread = "celtic_cross"; 
                if (scrDict && scrDict[nextTargetKey]) {
                    const validSpreadKeys = ["celtic_cross", "tree_of_life", "chaldean", "horseshoe", "graha", "triadic", "duad", "1_card", "1_card_m"];
                    const targetSubKeys = Object.keys(scrDict[nextTargetKey]);
                    const foundSpread = targetSubKeys.find(k => validSpreadKeys.includes(k));
                    if (foundSpread) detectedSpread = foundSpread;
                }
                this.state.spreadType = detectedSpread;
                const countMap = { "1_card": 1, "1_card_m": 1, "duad": 2, "triadic": 3, "horseshoe": 7, "chaldean": 7, "graha": 9, "celtic_cross": 10, "tree_of_life": 10 };
                this.state.drawCounter = countMap[this.state.spreadType] || 1;
            }
            
            const targetPath = node.route || node.next;
            let btnLabel = "DRAW";
            if (toolType === "dice") btnLabel = "ROLL";
            if (toolType === "rune") btnLabel = "CAST";
            
            actionButtonsHTML = `<div class="c1-options-grid"><button type="button" id="btn-draw-tarot" class="cyber-btn" onclick="window.Neshamah.handleDrawClick('${this.state.spreadType}', '${targetPath}', '${toolType}')">${btnLabel} (${this.state.drawCounter})</button></div>`;
        }
        else if (act === "render_tarot_results" || act === "render_dice_results" || act === "render_rune_results") {
            this.renderDivinationDashboard();
            return;
        } else if (node.next || node.route) {
            const targetPath = node.route || node.next;
            actionButtonsHTML = `<div class="c1-options-grid"><button type="button" class="cyber-btn" onclick="window.Neshamah.nextNode('${targetPath}')">NEXT ➔</button></div>`;
        } else {
            // renderStartScreen() 직행 대신 여운을 남기는 leaveTent() 호출로 변경
            actionButtonsHTML = `<div class="c1-options-grid"><button type="button" class="cyber-btn" onclick="window.Neshamah.leaveTent()">LEAVE TENT</button></div>`;
        }

        area.innerHTML = `
            <div class="scn-scene" style="opacity: 0; transition: opacity 1.5s ease-in-out;">
                <div class="scn-bg" style="background-image: url('${bgImg}');"></div>
                <div class="scn-overlay"></div>
                <div class="scn-content">
                    <div class="scene-narrative">${dialogueHTML}</div>
                    ${actionButtonsHTML}
                </div>
            </div>
        `;

        document.getElementById('neshamah-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            const newScene = document.querySelector('#neshamah-render-area .scn-scene');
            if (newScene) newScene.style.opacity = '1';
        }, 50);
    },

    nextCoinToss() {
        const sceneEl = document.querySelector('#neshamah-render-area .scn-scene');
        if (sceneEl) {
            // 1. 연타 방지 결계
            const buttons = sceneEl.querySelectorAll('.cyber-btn');
            buttons.forEach(btn => btn.style.pointerEvents = 'none');
            
            // 2. 0.8초 동안 부드럽게 화면을 어둡게 만듦 (Fade-out)
            sceneEl.style.transition = 'opacity 0.8s ease-in-out';
            sceneEl.style.opacity = '0';

            // 3. 암전이 끝난 후 인덱스를 올리고 다음 씬 렌더링 (Fade-in)
            setTimeout(() => {
                this.state.coinTossIndex++;
                this.renderScene();
            }, 800);
        } else {
            // 예외 처리: 요소를 못 찾으면 그냥 바로 넘김
            this.state.coinTossIndex++;
            this.renderScene();
        }
    },

    leaveTent() {
        const sceneEl = document.querySelector('#neshamah-render-area .scn-scene');
        if (sceneEl) {
            // 1. 연타 방지 결계 (사용자가 여러 번 클릭해 타이머가 꼬이는 것 방지)
            const buttons = sceneEl.querySelectorAll('.cyber-btn, .c1-option-card');
            buttons.forEach(btn => btn.style.pointerEvents = 'none');
            
            // 2. 2초(2000ms) 동안 서서히 암전되도록 CSS 트랜지션 강제 주입
            sceneEl.style.transition = 'opacity 2s ease-in-out';
            sceneEl.style.opacity = '0';

            // 3. 완전히 어두워진 후 (2초 뒤) 화면 전환
            setTimeout(() => {
                // 시작 화면 텍스트로 돌아가기
                this.renderStartScreen(); 
                
                // ※ 만약 텐트를 나갈 때 C3(Illuminatio) 메인 단계 선택기로 완전히 
                // 돌려보내고 싶다면 위 this.renderStartScreen() 대신 아래 코드를 사용하세요.
                // window.location.href = '/world/citrinitas';
            }, 2000);
        } else {
            // 에러 등으로 화면 요소를 못 찾았을 경우 즉시 전환
            this.renderStartScreen();
        }
    },

    nextNode(nodeKey) {
        // 🚀 [추가됨] 번복(Rollback) 로직 가로채기
        if (nodeKey === 'crossroads.return_q_list') {
            this.state.rollbackCount++;
            
            // 3번 번복했다면 쫓겨나는 시나리오로 목적지 강제 변경
            if (this.state.rollbackCount >= 3) {
                nodeKey = 'epilogue.kicked_out.kicked_out_1';
            }
        }

        const sceneEl = document.querySelector('#neshamah-render-area .scn-scene');
        if (sceneEl) {
            // 1. 다중 클릭(연타) 방지 결계
            const buttons = sceneEl.querySelectorAll('.cyber-btn, .c1-option-card');
            buttons.forEach(btn => btn.style.pointerEvents = 'none');
            
            // 2. 현재 씬 서서히 암전 (Nefesh 동기화)
            sceneEl.style.transition = 'opacity 1s ease-in-out';
            sceneEl.style.opacity = '0';

            // 3. 딱 1초(1000ms) 대기 후 다음 씬 로드
            setTimeout(() => {
                this.currentNodeKey = nodeKey;
                this.renderScene();
            }, 1000);
        } else {
            this.currentNodeKey = nodeKey;
            this.renderScene();
        }
    },

// 🚀 [수정됨]: toolType 파라미터 수신 및 릴레이
    handleDrawClick(spreadType, nextNodePath, toolType = "tarot") {
        this.state.drawCounter--;
        const btn = document.getElementById('btn-draw-tarot');
        if (this.state.drawCounter > 0) {
            btn.innerText = `DRAW (${this.state.drawCounter})`;
            btn.style.borderColor = "var(--c3-saber-red)";
            setTimeout(() => btn.style.borderColor = "var(--c3-saber-green)", 200);
        } else {
            btn.innerText = "REVEALING...";
            btn.style.pointerEvents = "none";
            this.executeIntegratedDraw(spreadType, nextNodePath, toolType);
        }
    },

    // 🚀 [수정됨]: 백엔드에 요청 시 하드코딩된 "tarot" 대신 동적 toolType 전송
    async executeIntegratedDraw(spreadType, nextNodePath, toolType = "tarot") {
        try {
            const response = await fetch('/api/astro/citrinitas/neshamah/draw', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tool: toolType, spread_type: spreadType })
            });
            const data = await response.json();
            
            if (data.status === "success") {
                this.state.currentTool = toolType; 
                this.state.drawnCards = data.drawn_results;
                
                // 🚀 [추가할 부분] 동전 던지기(flip_coin)일 경우 암전 및 대시보드 로직 무시하고 바로 씬으로 렌더링
                if (toolType === 'flip_coin') {
                    this.state.coinTossIndex = 0; // 동전 던지기 횟수 카운터 초기화
                    this.currentNodeKey = nextNodePath;
                    this.renderScene();
                    return; 
                }
                this.currentNodeKey = nextNodePath;
                
                // 🚀 [추가됨]: 결과 즉시 렌더링 방지 및 암전 연출
                const area = document.getElementById('neshamah-render-area');
                if (area) {
                    const loadingText = toolType === 'tarot' 
                        ? 'Reading the faces of the cards...' 
                        : 'The symbols are aligning...';
                        
                    area.innerHTML = `
                        <div class="scn-scene" style="background:#000; justify-content:center; align-items:center; display:flex; opacity: 0; transition: opacity 1s ease-in-out;">
                            <div style="text-align:center;">
                                <p style="color:#aaa; font-style:italic; letter-spacing: 3px; animation: pulse 2s infinite;">
                                    ${loadingText}
                                </p>
                            </div>
                        </div>`;
                    
                    // 아주 잠깐 대기 후 암전된 화면을 서서히 밝힘 (페이드인)
                    setTimeout(() => {
                        const loadingScene = document.querySelector('#neshamah-render-area .scn-scene');
                        if (loadingScene) loadingScene.style.opacity = '1';
                    }, 100);
                }

                // 🚀 2.5초(2500ms) 동안 여운을 남긴 후 결과 대시보드 렌더링
                setTimeout(() => {
                    this.renderDivinationDashboard();
                }, 2500);

            } else {
                throw new Error(data.message || "Divination Draw Failed");
            }
        } catch (e) {
            const area = document.getElementById('neshamah-render-area');
            if (area) {
                area.innerHTML = `
                    <div class="scn-scene" style="background:#000; justify-content:center; align-items:center; display:flex;">
                        <div style="text-align:center;">
                            <p style="color:#ff3333; font-weight:bold; letter-spacing:2px;">[ API ERROR ]</p>
                            <p style="color:#aaa; font-size: 0.85rem; margin-top:10px;">${e.message}</p>
                            <button type="button" class="cyber-btn" style="margin-top:20px;" onclick="window.Neshamah.renderStartScreen()">RETURN</button>
                        </div>
                    </div>`;
            }
        }
    },

    renderDivinationDashboard() {
        this.updateLang();
        const area = document.getElementById('neshamah-render-area');
        if (!area) return;

        // 🚀 [다중 스프레드 방어로직]: 대시보드를 그리기 직전에 딕셔너리 키셋을 역추적하여 spreadType을 강제 동기화 및 자동 보정
        if (this.state.currentTool === 'tarot' && this.state.scriptData?.scr_dict_tarot) {
            const scrTarot = this.state.scriptData.scr_dict_tarot;
            // 현재 노드 키 또는 드로우 노드 키와 일치하는 데이터를 확보
            const activeNodeData = scrTarot[this.currentNodeKey] || scrTarot[this.state.currentDrawNode];
            
            if (activeNodeData) {
                const validSpreadKeys = ["celtic_cross", "tree_of_life", "chaldean", "horseshoe", "graha", "triadic", "duad", "1_card", "1_card_m"];
                const actualSpreadKey = Object.keys(activeNodeData).find(k => validSpreadKeys.includes(k));
                
                // 현재 상태와 다르면 실제 시나리오 스펙에 맞춰 강제 갱신
                if (actualSpreadKey && this.state.spreadType !== actualSpreadKey) {
                    this.state.spreadType = actualSpreadKey;
                }
            }
        }

        // 다이스/룬일 경우 상단 타로 미니맵 완전 제거
        if (this.state.currentTool === 'dice' || this.state.currentTool === 'rune') {
            area.innerHTML = `
                <div class="scn-scene" style="background: #000; padding: 30px;">
                    <div id="neshamah-dashboard-panel" class="neshamah-result-panel" style="border: none; background: transparent; padding: 0;"></div>
                    <div class="scn-btn-container" style="margin-top: 20px; display: flex; justify-content: center; width: 100%;">
                        <button type="button" class="cyber-btn" onclick="window.Neshamah.acceptReadingAndProceed()">ACCEPT READING</button>
                    </div>
                </div>
            `;
            this.selectPosition(0);
            document.getElementById('neshamah-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        // --- 타로 렌더링 로직 ---
        let boardClass = 'neshamah-single-board';
        let posPrefix = '';
        
        switch (this.state.spreadType) {
            case 'celtic_cross': boardClass = 'neshamah-spread-board'; posPrefix = 'board-pos-celtic-'; break;
            case 'tree_of_life': boardClass = 'neshamah-tol-board'; posPrefix = 'board-pos-tol-'; break;
            case 'horseshoe': 
            case 'chaldean': boardClass = 'neshamah-horseshoe-board'; posPrefix = 'board-pos-horseshoe-'; break;
            case 'triadic': boardClass = 'neshamah-triadic-board'; posPrefix = 'board-pos-triadic-'; break;
            case 'duad': boardClass = 'neshamah-duad-board'; posPrefix = 'board-pos-duad-'; break;
            case 'graha': boardClass = 'neshamah-graha-board'; posPrefix = 'board-pos-graha-'; break;
            case '1_card': 
            case '1_card_m': boardClass = 'neshamah-single-board'; posPrefix = 'board-pos-single-'; break;
        }

        // 1_card 계열 일 경우 상단 미니맵/리스트 UI를 제거하여 화면을 정제
        const isSingleCard = (this.state.spreadType === '1_card' || this.state.spreadType === '1_card_m');
        let topSectionHTML = '';

        if (!isSingleCard) {
            let minimapHTML = `<div class="spread-minimap-container ${boardClass}">`;
            let listHTML = `<div class="drawn-cards-list">`;

            this.state.drawnCards.forEach((card, idx) => {
                const pos = idx + 1;
                const posClass = posPrefix ? `${posPrefix}${pos}` : '';
                minimapHTML += `<div class="mini-pos ${posClass}" id="mini-pos-${idx}" onclick="window.Neshamah.selectPosition(${idx})">${pos}</div>`;
                
                const cardName = this.getExactCardName(card.card_id);
                listHTML += `<div class="list-item" id="list-item-${idx}" onclick="window.Neshamah.selectPosition(${idx})">
                                <span class="list-pos">${pos}.</span> <span class="list-name">${cardName}</span>
                             </div>`;
            });
            minimapHTML += `</div>`;
            listHTML += `</div>`;

            topSectionHTML = `
                <div class="dashboard-top-section">
                    <div class="dashboard-left">${minimapHTML}</div>
                    <div class="dashboard-right">${listHTML}</div>
                </div>
            `;
        }

        area.innerHTML = `
            <div class="scn-scene" style="background: #000; padding: 30px;">
                ${topSectionHTML}
                <div id="neshamah-dashboard-panel" class="neshamah-result-panel" ${isSingleCard ? 'style="border: none; background: transparent; padding: 0; justify-content: center;"' : ''}></div>
                <div class="scn-btn-container" style="margin-top: 20px; ${isSingleCard ? 'display: flex; justify-content: center; width: 100%;' : ''}">
                    <button type="button" class="cyber-btn" onclick="window.Neshamah.acceptReadingAndProceed()">ACCEPT READING</button>
                </div>
            </div>
        `;
        
        this.selectPosition(0);
        document.getElementById('neshamah-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    buildCardHTMLComponent(card, extraClass = '') {
        let roman = '', name = '', mainGlyph = '', subGlyph = '';
        
        if (card.arcana_type === "major_fool" || card.arcana_type === "major") {
            const l = card.layers || {}; 
            const cardNum = parseInt(card.card_id.split('_')[0]);
            roman = card.arcana_type === "major_fool" ? '0' : this.toRoman(cardNum); 
            name = this.getExactCardName(card.card_id); 
            
            // 🚀 [수정됨] GLYPH_TABLE 조회를 위해 확실하게 소문자로 캐스팅
            const mKey = l.mother_letter ? l.mother_letter.toLowerCase() : 'aleph';
            const dKey = l.double_letter ? l.double_letter.toLowerCase() : '';
            
            const motherKey = card.arcana_type === "major_fool" ? 'infinity' : mKey;
            const m = this.GLYPH_TABLE.mother[motherKey] || { char: '?', cls: '' };
            const d = card.arcana_type === "major_fool" ? { char: '', cls: '' } : (this.GLYPH_TABLE.double[dKey] || { char: '?', cls: '' });
            
            mainGlyph = `<div class="t-main-glyph ${m.cls}">${m.char}</div>`; 
            subGlyph = d.char ? `<div class="t-sub-glyph ${d.cls}">${d.char}</div>` : '';
        } else {
            const l = card.layers || {}; 
            const isCourt = card.arcana_type === "minor_court";
            roman = isCourt ? (l.court_rank ? l.court_rank.toUpperCase() : "C") : this.toRoman(l.numerology || 1);
            name = ''; 
            
            // 🚀 [수정됨] GLYPH_TABLE 조회를 위해 확실하게 소문자로 캐스팅
            const sKey = l.simple_letter ? l.simple_letter.toLowerCase() : '';
            const e = this.GLYPH_TABLE.simple[sKey] || { char: '?', suit: 'UNKNOWN', cls: '' };
            mainGlyph = `<div class="t-main-glyph ${e.cls}">${e.char}</div>`; 
            subGlyph = `<div class="t-title ${e.cls}">${e.suit}</div>`;
        }
        
        return `<div class="neshamah-tarot-card ${extraClass}"><div class="t-roman">${roman}</div>${name ? `<div class="t-title">${name}</div>` : ''}${mainGlyph}${subGlyph}</div>`;
    },

    selectPosition(idx) {
        this.state.selectedIndex = idx; 
        this.state.viewMode = 'script'; 
        
        // 미니맵 활성화
        document.querySelectorAll('.mini-pos').forEach((el, i) => {
            el.classList.toggle('active', i === idx);
        });
        // 리스트 활성화
        document.querySelectorAll('.list-item').forEach((el, i) => {
            el.classList.toggle('active', i === idx);
        });
        
        this.syncDashboardPanelText();
    },

    toggleDecodingPhase() {
        this.state.viewMode = this.state.viewMode === 'script' ? 'core' : 'script';
        this.syncDashboardPanelText();
    },

    syncDashboardPanelText() {
        const panel = document.getElementById('neshamah-dashboard-panel');
        if (!panel) return;
        
        panel.innerHTML = ''; 

        const card = this.state.drawnCards[this.state.selectedIndex];
        if (!card) return;

        const isCoreMode = this.state.viewMode === 'core';
        
        let textHTML = ''; 
        let titleHTML = '';
        let headerTitleHTML = '';

        const getDictLore = (rootObj, category, key) => {
            if (!rootObj) return null;
            if (rootObj[category] && rootObj[category][key]) {
                const val = rootObj[category][key];
                return val[this.lang] || val['en'] || (Array.isArray(val) ? val : null);
            }
            if (rootObj[key]) {
                const val = rootObj[key];
                return val[this.lang] || val['en'] || (Array.isArray(val) ? val : null);
            }
            return null;
        };

        const formatLine = (label, text, cssClass) => {
            if (!text) return `<p class="${cssClass} data-missing" title="${label}">[ DATA MISSING ]</p>`;
            let content = '';
            if (Array.isArray(text)) {
                const uniqueText = [...new Set(text)];
                content = uniqueText.join('<br>');
            } else {
                content = text;
            }
            return `<p class="${cssClass} neshamah-layer-paragraph" title="${label}">${content}</p>`;
        };

        // --- 1. 다이스 / 룬 렌더링 ---
        if (card.card_type === 'astrodice' || card.card_type === 'witchs_rune') {
            let toolDict = this.state.scriptData?.scr_dict_tools?.[this.currentNodeKey] 
                        || this.state.scriptData?.scr_dict_tools?.[this.state.currentDrawNode];

            if (!toolDict) {
                const allDicts = Object.values(this.state.scriptData?.scr_dict_tools || {});
                if (card.card_type === 'astrodice') {
                    toolDict = allDicts.find(d => d.planet_dice) || allDicts[0];
                } else if (card.card_type === 'witchs_rune') {
                    toolDict = allDicts.find(d => d.witchs_rune) || allDicts[0];
                }
            }

            if (!toolDict) {
                textHTML = `<div class="script-lore-text" style="color:#ff3333; text-align:center;">[ DICTIONARY DATA MISSING ]</div>`;
            } else {
                if (card.card_type === 'astrodice') {
                    const raw = card.raw;
                    const pKey = raw.planet.toLowerCase().replace(' ', '_');
                    const hKey = `h${raw.house}`;
                    const zKey = card.layers.zodiac;

                    const pText = getDictLore(toolDict, 'planet_dice', pKey);
                    const hText = getDictLore(toolDict, 'house_dice', hKey);
                    const zText = getDictLore(toolDict, 'zodiac_dice', zKey);

                    titleHTML = `<div class="tool-title-label">${raw.planet} in ${raw.sign} (${raw.house}H)</div>`;

                    textHTML = formatLine(`Planet : ${raw.planet}`, pText, 'script-layer-planet') +
                               formatLine(`House : ${raw.house}H`, hText, 'script-layer-house') +
                               formatLine(`Zodiac : ${raw.sign}`, zText, 'script-layer-zodiac');

                } else if (card.card_type === 'witchs_rune') {
                    const raw = card.raw;
                    const rKey = raw.name.toLowerCase().replace(/ /g, '_');
                    const rText = getDictLore(toolDict, 'witchs_rune', rKey);

                    titleHTML = `<div class="tool-title-label">${raw.name.toUpperCase()}</div>`;
                    textHTML = formatLine(`Rune : ${raw.name}`, rText, 'script-layer-rune');
                }
            }

            panel.innerHTML = `
                <div class="panel-vertical-zone">
                    <div class="tool-visual-top-area">${this.buildToolHTMLComponent(card)}</div>
                    ${titleHTML}
                    <hr class="ritual-divider">
                    <div class="vertical-text-zone">${textHTML}</div>
                </div>
            `;
            return; 
        }

        // --- 2. 타로 렌더링 ---
        const currentPosKey = `pos_${this.state.selectedIndex + 1}`;
        let currentDict = null;

        if (!isCoreMode) {
            const scrTarot = this.state.scriptData?.scr_dict_tarot;
            
            // 🚀 [해결]: 무조건 첫 번째 키를 잡던 하드코딩 파기. 현재 노드 키 혹은 이전 드로우 노드 키와 일치하는 사전을 정확하게 저격
            const activeNodeData = scrTarot?.[this.currentNodeKey] || scrTarot?.[this.state.currentDrawNode] || scrTarot?.[Object.keys(scrTarot || {})[0]];
            currentDict = activeNodeData?.[this.state.spreadType]?.[currentPosKey] || activeNodeData?.[currentPosKey];
            
            const posTitle = currentDict?.title?.[this.lang];
            headerTitleHTML = `[ POSITION ${this.state.selectedIndex + 1} ]`;
            if (posTitle) {
                headerTitleHTML += `<br><span style="font-size: 1.1rem; color: #fff; margin-top: 8px; display:inline-block;">${posTitle}</span>`;
            }

            textHTML = `<h4 class="render-pos-header" style="color:var(--c3-primary); border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:20px;">
                            ${headerTitleHTML}
                         </h4>`;
        } else {
            currentDict = this.state.coreData?.dict;
            textHTML = `<h4 class="render-pos-header core-layer-title" style="border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:20px; color:var(--c3-saber-red);">
                            [ ARCHETYPAL CORE DECODER ]
                         </h4>`;
        }

        if (!currentDict) {
            textHTML += `<div class="script-lore-text" style="color:#ff3333;">[ DICTIONARY DATA MISSING ]</div>`;
        } else if (card.render_manifest) {
            const tempTextLayers = [];
            card.render_manifest.forEach(manifest => {
                const prefix = isCoreMode ? 'core' : 'script';
                const cssClass = `${prefix}-${manifest.css_suffix}`; 
                const textArray = getDictLore(currentDict, manifest.category, manifest.key);
                tempTextLayers.push(formatLine(manifest.label, textArray, cssClass));
            });
            textHTML += tempTextLayers.join(''); 
        }

        const cardWrapperClass = isCoreMode ? 'card-wrapper-core dict-mode-active' : 'card-wrapper-script';
        
        panel.innerHTML = `
            <div class="panel-left-zone ${cardWrapperClass}" onclick="window.Neshamah.toggleDecodingPhase()">
                ${this.buildCardHTMLComponent(card, 'card-size-focus')}
                <div class="toggle-decode-hint">[ CLICK TO DECODE ]</div>
            </div>
            <div class="panel-right-zone">${textHTML}</div>
        `;
    },

    buildToolHTMLComponent(card) {
        // 7행성 + 천해명 + 라후/케투 고유 오컬트 기호 매핑
        const pGlyphs = {
            "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂", "Jupiter": "♃", "Saturn": "♄",
            "Uranus": "♅", "Neptune": "♆", "Pluto": "♇", "Rahu": "☊", "Ketu": "☋"
        };
        
        // 텍스트 서식과 4원소 컬러 바인딩이 완벽히 먹히는 조디악 유니코드 폰트 매핑
        const zGlyphs = {
            "Aries": "♈︎", "Taurus": "♉︎", "Gemini": "♊︎", "Cancer": "♋︎", "Leo": "♌︎", "Virgo": "♍︎",
            "Libra": "♎︎", "Scorpio": "♏︎", "Sagittarius": "♐︎", "Capricorn": "♑︎", "Aquarius": "♒︎", "Pisces": "♓︎"
        };
        
        const zElements = {
            "Aries": "fire", "Leo": "fire", "Sagittarius": "fire",
            "Taurus": "earth", "Virgo": "earth", "Capricorn": "earth",
            "Gemini": "air", "Libra": "air", "Aquarius": "air",
            "Cancer": "water", "Scorpio": "water", "Pisces": "water"
        };
        
        // 🚀 [유저 고유 체계] 찾아오신 기호 사전 완벽 매핑
        const wRunes = {
            "sun": "☀︎", "moon": "⏾", "flight": "彡", "rings": "𓏌", "triquetra": "∴",
            "woman": "🇾", "man": "↑", "harvest": "⋓", "crossroads": "+",
            "star": "✳", "waves": "༄", "scythe": "⚸", "eye": "𓁿"
        };

        if (card.card_type === 'astrodice') {
            const raw = card.raw;
            const pKey = raw.planet.toLowerCase().replace(' ', '_');
            const elKey = zElements[raw.sign] || "fire"; 
            
            return `
                <div class="astrodice-container">
                    <div class="dice-item p-dice glyph-planet-${pKey}" title="${raw.planet}">${pGlyphs[raw.planet] || "?"}</div>
                    <div class="dice-item h-dice" title="${raw.house}th House">${raw.house}</div>
                    <div class="dice-item z-dice glyph-element-${elKey}" title="${raw.sign}">${zGlyphs[raw.sign] || "?"}</div>
                </div>
            `;
        } else if (card.card_type === 'witchs_rune') {
            const raw = card.raw;
            const rKey = raw.name.toLowerCase().replace(/ /g, '_');
            const rGlyph = wRunes[rKey] || "●";

            // 🚀 [Ruach 미학 완벽 복제] 둥근 원형 스톤이 아닌 Ruach 스타일 사각 결계 룬스톤 적용
            return `
                <div class="ruach-style-rune-stone" title="${raw.name}">
                    <div class="rune-glyph-core">${rGlyph}</div>
                </div>
            `;
        }
        return '';
    },

    toggleDecodingPhase() {
        this.state.viewMode = this.state.viewMode === 'script' ? 'core' : 'script';
        this.syncDashboardPanelText();
    },

    acceptReadingAndProceed() {
        const boardNode = this.getNodeData(this.currentNodeKey) || {};
        const targetPath = boardNode.next || boardNode.route || 'epilogue.epilogue';
        this.currentNodeKey = targetPath;
        this.renderScene();
    },

    showPulseSystem(txt) {
        const c = document.getElementById('neshamah-pulse-container'); const t = document.getElementById('neshamah-pulse-text');
        if (c && t) { t.innerText = txt; c.classList.add('active'); }
    },
    hidePulseSystem() { 
        const c = document.getElementById('neshamah-pulse-container'); if (c) c.classList.remove('active'); 
    }
};

window.initC3Neshamah = function() {
    if (window.Neshamah) {
        window.Neshamah.updateLang(); 
        if (!window.Neshamah.initialized) {
            window.Neshamah.initialized = true;
            window.Neshamah.init();
        } else if (window.Neshamah.currentNodeKey === null && Object.keys(window.Neshamah.state.drawnCards).length === 0) {
            window.Neshamah.renderStartScreen();
        }
    }
};

if (document.getElementById('neshamah-app') && !document.getElementById('neshamah-app').dataset.bound) {
    document.getElementById('neshamah-app').dataset.bound = "true";
    window.initC3Neshamah();
}