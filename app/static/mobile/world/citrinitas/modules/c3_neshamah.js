// static/mobile/world/citrinitas/modules/c3_neshamah.js

window.Neshamah = {
    lang: 'en', 
    initialized: false,
    currentNodeKey: null,

    state: {
        viewMode: 'script',     
        spreadType: 'tree_of_life',
        drawnCards: [],         
        selectedIndex: 0,       
        coreData: null,         
        scriptData: null,
        drawCounter: 0,
        rollbackCount: 0
    },

    GLYPH_TABLE: {
        mother: { 'shin': { char: 'ש', cls: 'glyph-mother-shin' }, 'mem': { char: 'מ', cls: 'glyph-mother-mem' }, 'aleph': { char: 'א', cls: 'glyph-mother-aleph' }, 'infinity': { char: '∞', cls: 'glyph-fool' } },
        double: { 'dalet': { char: '♂', cls: 'glyph-planet-mars' }, 'resh': { char: '☿', cls: 'glyph-planet-mercury' }, 'gimel': { char: '♃', cls: 'glyph-planet-jupiter' }, 'pe': { char: '♀', cls: 'glyph-planet-venus' }, 'bet': { char: '♄', cls: 'glyph-planet-saturn' }, 'kaf': { char: '☉', cls: 'glyph-planet-sun' }, 'tav': { char: '☽', cls: 'glyph-planet-moon' } },
        simple: { 'he': { char: '🜂', suit: 'WANDS', cls: 'glyph-element-fire' }, 'tet': { char: '🜂', suit: 'WANDS', cls: 'glyph-element-fire' }, 'samekh': { char: '🜂', suit: 'WANDS', cls: 'glyph-element-fire' }, 'vav': { char: '🜃', suit: 'COINS', cls: 'glyph-element-earth' }, 'yod': { char: '🜃', suit: 'COINS', cls: 'glyph-element-earth' }, 'ayin': { char: '🜃', suit: 'COINS', cls: 'glyph-element-earth' }, 'zayin': { char: '🜁', suit: 'SWORDS', cls: 'glyph-element-air' }, 'lamed': { char: '🜁', suit: 'SWORDS', cls: 'glyph-element-air' }, 'tzadi': { char: '🜁', suit: 'SWORDS', cls: 'glyph-element-air' }, 'chet': { char: '🜄', suit: 'CUPS', cls: 'glyph-element-water' }, 'nun': { char: '🜄', suit: 'CUPS', cls: 'glyph-element-water' }, 'qoph': { char: '🜄', suit: 'CUPS', cls: 'glyph-element-water' } }
    },

    toRoman(num) {
        const lookup = { M:1000, CM:900, D:500, CD:400, C:100, XC:90, L:50, XL:40, X:10, IX:9, V:5, IV:4, I:1 };
        let roman = '', i; let n = parseInt(num);
        if (n === 0) return '0';
        for (i in lookup) { while (n >= lookup[i]) { roman += i; n -= lookup[i]; } }
        return roman;
    },

    getExactCardName(cardId) {
        const MAJOR_EXACT = { "0_Fool": "THE FOOL", "1_Magician": "THE MAGICIAN", "2_High_Priestess": "THE HIGH PRIESTESS", "3_Empress": "THE EMPRESS", "4_Emperor": "THE EMPEROR", "5_Hierophant": "THE HIEROPHANT", "6_Lovers": "THE LOVERS", "7_Chariot": "THE CHARIOT", "8_Strength": "STRENGTH", "9_Hermit": "THE HERMIT", "10_Wheel_of_Fortune": "WHEEL of FORTUNE", "11_Justice": "JUSTICE", "12_Hanged_Man": "THE HANGED MAN", "13_Death": "DEATH", "14_Temperance": "TEMPERANCE", "15_Devil": "THE DEVIL", "16_Tower": "THE TOWER", "17_Star": "THE STAR", "18_Moon": "THE MOON", "19_Sun": "THE SUN", "20_Judgement": "JUDGEMENT", "21_World": "THE WORLD" };
        if (MAJOR_EXACT[cardId]) return MAJOR_EXACT[cardId];
        const parts = cardId.split('_');
        if (parts.length === 2) {
            let rank = parts[0], suit = parts[1].toUpperCase();
            if (rank === "Ace") rank = "ACE"; else if (rank === "Page") rank = "Page"; else if (rank === "Knight") rank = "Knight"; else if (rank === "Queen") rank = "Queen"; else if (rank === "King") rank = "King";
            return `${rank} of ${suit}`;
        }
        return cardId.toUpperCase();
    },

    updateLang() {
        if (typeof WorldSettings !== 'undefined') this.lang = WorldSettings.get('lang', 'ko');
        else { const docLang = document.documentElement.lang; this.lang = (docLang === 'ko' || docLang === 'en') ? docLang : (localStorage.getItem('lang') || 'ko'); }
    },

    getNodeData(path) {
        const root = this.state.scriptData?.neshamah_script;
        if (!root) return null;
        if (path.includes('.')) { let current = root; const parts = path.split('.'); for (const p of parts) { if (!current[p]) return null; current = current[p]; } return current; } 
        function find(obj, key) { if (!obj || typeof obj !== 'object') return null; if (obj[key]) return obj[key]; for (const k in obj) { const res = find(obj[k], key); if (res) return res; } return null; }
        return find(root, path);
    },

    mergeDeep(target, source) {
        const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj);
        if (!isObject(target) || !isObject(source)) return source;
        Object.keys(source).forEach(key => {
            const tVal = target[key], sVal = source[key];
            if (Array.isArray(tVal) && Array.isArray(sVal)) target[key] = sVal; 
            else if (isObject(tVal) && isObject(sVal)) target[key] = this.mergeDeep(Object.assign({}, tVal), sVal);
            else target[key] = sVal;
        });
        return target;
    },

    init() {
        this.updateLang();
        this.state.viewMode = 'script'; this.state.drawnCards = []; this.state.selectedIndex = 0; this.currentNodeKey = null; this.state.rollbackCount = 0;
        this.renderStartScreen();
        fetch('/api/theory/citrinitas/neshamah_core')
            .then(r => r.ok ? r.json() : null)
            .then(core => {
                if (core && !core.error) {
                    this.state.coreData = JSON.parse(JSON.stringify(core));
                    this.state.scriptData = JSON.parse(JSON.stringify(core));
                }
            })
            .catch(e => console.error(e));
    },

    renderStartScreen() {
        this.updateLang();
        const area = document.getElementById('neshamah-render-area');
        if (!area) return;
        area.innerHTML = `<span class="m-neshamah-intro-text" onclick="if(window.Neshamah) window.Neshamah.beginRitual();">You only see what agrees to be seen.</span>`;
    },

    beginRitual() {
        const area = document.getElementById('neshamah-render-area');
        if (!this.state.scriptData) {
            area.innerHTML = `<div class="m-scn-scene"><div class="m-scn-content"><p class="m-scene-narrative">[ SYSTEM ERROR ] Data failed to load.</p><button type="button" class="m-cyber-btn" onclick="window.Neshamah.renderStartScreen()">RETURN</button></div></div>`;
            return;
        }
        this.currentNodeKey = 'prologue.intro_1'; 
        this.renderScene();
    },

    lazyLoadRoute(routeId, targetPath) {
        const sceneEl = document.querySelector('#neshamah-render-area .m-scn-scene');
        if (sceneEl) {
            sceneEl.querySelectorAll('.m-cyber-btn, .m-c1-option-card').forEach(btn => btn.style.pointerEvents = 'none');
            sceneEl.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => { el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0'; });
        }
        setTimeout(() => {
            const area = document.getElementById('neshamah-render-area');
            if (area) area.innerHTML = `<div class="m-scn-scene" id="scene-lazy-wait"><div class="m-scn-visual-area"></div><div class="m-scn-content"><p class="m-scene-narrative">Descending deeper into the abyss...</p></div></div>`;
            setTimeout(() => { const el = document.getElementById('scene-lazy-wait'); if(el) el.classList.add('revealed', 'veiled'); }, 100);
            
            fetch(`/api/theory/citrinitas/neshamah_${routeId}`)
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data && !data.error) {
                        this.mergeDeep(this.state.scriptData, data);
                        setTimeout(async () => { 
                            const waitScene = document.getElementById('scene-lazy-wait');
                            if (waitScene) {
                                waitScene.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => { el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0'; });
                                await new Promise(r => setTimeout(r, 1000));
                            }
                            this.currentNodeKey = targetPath; 
                            this.renderScene(); 
                        }, 800);
                    } else {
                        if (area) area.innerHTML = `<div class="m-scn-scene"><div class="m-scn-content"><p class="m-scene-narrative">[ERROR] Failed to load route: ${routeId}</p><button type="button" class="m-cyber-btn" onclick="window.Neshamah.renderStartScreen()">RETURN</button></div></div>`;
                    }
                }).catch(e => console.error(e));
        }, 1000);
    },

    renderScene() {
        this.updateLang();
        const area = document.getElementById('neshamah-render-area');
        if (!area) return;

        const node = this.getNodeData(this.currentNodeKey);
        if (!node) {
            area.innerHTML = `<div class="m-scn-scene"><div class="m-scn-content"><p class="m-scene-narrative">[ PATH LOST ]</p><button type="button" class="m-cyber-btn" onclick="window.Neshamah.renderStartScreen()">RETURN</button></div></div>`;
            return;
        }

        const originalLines = node[this.lang] || node['en'] || [];
        let renderLines = [...originalLines];

        if (node.action === 'render_fatecoin_step') {
            const currentResult = this.state.drawnCards[this.state.coinTossIndex];
            const remaining = 5 - this.state.coinTossIndex; 
            const translatedResult = currentResult === 'Heads' ? (this.lang === 'ko' ? '앞면 (Heads)' : 'Heads') : (this.lang === 'ko' ? '뒷면 (Tails)' : 'Tails');
            for (let i = 0; i < renderLines.length; i++) renderLines[i] = renderLines[i].replace(/{result}/g, translatedResult).replace(/{remaining}/g, remaining);
        }

        const dialogueHTML = renderLines.map(line => `<p>${line}</p>`).join('');
        const bgImg = node.bg_image ? `/static/world/citrinitas/modules/assets/neshamah/${node.bg_image}` : '';

        let actionButtonsHTML = '';
        const act = node.action || "";

        if (act.startsWith("FETCH_ROUTE_")) {
            const routeId = act.replace("FETCH_ROUTE_", "").toLowerCase(); 
            const targetPath = node.route || node.next;
            actionButtonsHTML = `<div class="m-c1-options-grid"><button type="button" class="m-cyber-btn" onclick="window.Neshamah.lazyLoadRoute('${routeId}', '${targetPath}')">CONTINUE ➔</button></div>`;
        } 
        else if (node.options) {
            actionButtonsHTML = `<div class="m-c1-options-grid">`;
            for (const [optKey, optData] of Object.entries(node.options)) {
                const text = (typeof optData === 'object') ? (optData[this.lang] || optData['en']) : optData;
                const targetPath = (typeof optData === 'object') ? (optData.route || optData.next || optData.target || optKey) : optKey;
                if (typeof optData === 'object' && optData.action && optData.action.startsWith("FETCH_ROUTE_")) {
                    const routeId = optData.action.replace("FETCH_ROUTE_", "").toLowerCase();
                    actionButtonsHTML += `<div class="m-c1-option-card" onclick="window.Neshamah.lazyLoadRoute('${routeId}', '${targetPath}')">${text}</div>`;
                } else {
                    actionButtonsHTML += `<div class="m-c1-option-card" onclick="window.Neshamah.nextNode('${targetPath}')">${text}</div>`;
                }
            }
            actionButtonsHTML += `</div>`;
        }
        else if (act === 'start_fatecoin_toss') {
            const targetPath = node.route || node.next;
            actionButtonsHTML = `<div class="m-c1-options-grid"><button type="button" class="m-cyber-btn" onclick="window.Neshamah.executeIntegratedDraw('flip_coin', '${targetPath}', 'flip_coin')">FLIP COIN (6) ➔</button></div>`;
        } 
        else if (act === 'render_fatecoin_step') {
            const remaining = 6 - (this.state.coinTossIndex + 1); 
            if (remaining > 0) {
                actionButtonsHTML = `<div class="m-c1-options-grid"><button type="button" class="m-cyber-btn" onclick="window.Neshamah.nextCoinToss()">NEXT TOSS ➔</button></div>`;
            } else {
                const headsCount = this.state.drawnCards.filter(c => c === 'Heads').length;
                let resultKey = '';
                if (headsCount === 6) resultKey = 'c2_c1_c2_c3_result_all_h'; else if (headsCount === 0) resultKey = 'c2_c1_c2_c3_result_all_t'; else if (headsCount >= 4) resultKey = 'c2_c1_c2_c3_result_h45'; else if (headsCount <= 2) resultKey = 'c2_c1_c2_c3_result_t45'; else resultKey = 'c2_c1_c2_c3_result_33'; 
                const targetPath = `branches.c2.c2_c1.c2_c1_c2_c3.${resultKey}`;
                actionButtonsHTML = `<div class="m-c1-options-grid"><button type="button" class="m-cyber-btn" onclick="window.Neshamah.nextNode('${targetPath}')">VIEW RESULT ➔</button></div>`;
            }
        }
        else if (act === "draw_tarot_card" || act === "roll_astrology_dice" || act === "draw_witchs_rune") {
            let toolType = "tarot";
            if (act === "roll_astrology_dice") toolType = "dice";
            if (act === "draw_witchs_rune") toolType = "rune";

            this.state.currentDrawNode = this.currentNodeKey;
            const nextTargetKey = node.next || node.route;
            
            if (toolType === "dice" || toolType === "rune") { this.state.spreadType = "1_card"; this.state.drawCounter = 1; } 
            else {
                const scrDict = this.state.scriptData?.scr_dict_tarot;
                let detectedSpread = "celtic_cross"; 
                if (scrDict && scrDict[nextTargetKey]) {
                    const validSpreadKeys = ["celtic_cross", "tree_of_life", "chaldean", "horseshoe", "graha", "triadic", "duad", "1_card", "1_card_m"];
                    const foundSpread = Object.keys(scrDict[nextTargetKey]).find(k => validSpreadKeys.includes(k));
                    if (foundSpread) detectedSpread = foundSpread;
                }
                this.state.spreadType = detectedSpread;
                const countMap = { "1_card": 1, "1_card_m": 1, "duad": 2, "triadic": 3, "horseshoe": 7, "chaldean": 7, "graha": 9, "celtic_cross": 10, "tree_of_life": 10 };
                this.state.drawCounter = countMap[this.state.spreadType] || 1;
            }
            const targetPath = node.route || node.next;
            let btnLabel = toolType === "dice" ? "ROLL" : (toolType === "rune" ? "CAST" : "DRAW");
            actionButtonsHTML = `<div class="m-c1-options-grid"><button type="button" id="btn-draw-tarot" class="m-cyber-btn" onclick="window.Neshamah.handleDrawClick('${this.state.spreadType}', '${targetPath}', '${toolType}')">${btnLabel} (${this.state.drawCounter})</button></div>`;
        }
        else if (act === "render_tarot_results" || act === "render_dice_results" || act === "render_rune_results") {
            this.renderDivinationDashboard(); return;
        } else if (node.next || node.route) {
            actionButtonsHTML = `<div class="m-c1-options-grid"><button type="button" class="m-cyber-btn" onclick="window.Neshamah.nextNode('${node.route || node.next}')">NEXT ➔</button></div>`;
        } else {
            actionButtonsHTML = `<div class="m-c1-options-grid"><button type="button" class="m-cyber-btn" onclick="window.Neshamah.leaveTent()">LEAVE TENT</button></div>`;
        }

        area.innerHTML = `
            <div id="scene-${this.currentNodeKey}" class="m-scn-scene">
                <div class="m-scn-visual-area">
                    <div class="m-scn-bg" style="background-image: url('${bgImg}');"></div>
                    <div class="m-scn-overlay"></div>
                </div>
                <div class="m-scn-content">
                    <div class="m-scene-narrative">${dialogueHTML}</div>
                    ${actionButtonsHTML}
                </div>
            </div>`;

        document.getElementById('neshamah-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { const sceneEl = document.getElementById(`scene-${this.currentNodeKey}`); if (sceneEl) { sceneEl.classList.add('revealed', 'veiled'); } }, 350);
    },

    nextCoinToss() {
        const sceneEl = document.querySelector('#neshamah-render-area .m-scn-scene');
        if (sceneEl) {
            sceneEl.querySelectorAll('.m-cyber-btn').forEach(btn => btn.style.pointerEvents = 'none');
            sceneEl.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => { el.style.transition = 'opacity 0.8s ease-in-out'; el.style.opacity = '0'; });
            setTimeout(() => { this.state.coinTossIndex++; this.renderScene(); }, 800);
        } else { this.state.coinTossIndex++; this.renderScene(); }
    },

    leaveTent() {
        const sceneEl = document.querySelector('#neshamah-render-area .m-scn-scene');
        if (sceneEl) {
            sceneEl.querySelectorAll('.m-cyber-btn, .m-c1-option-card').forEach(btn => btn.style.pointerEvents = 'none');
            sceneEl.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => { el.style.transition = 'opacity 2s ease-in-out'; el.style.opacity = '0'; });
            setTimeout(() => { this.renderStartScreen(); }, 2000);
        } else this.renderStartScreen();
    },

    nextNode(nodeKey) {
        if (nodeKey === 'crossroads.return_q_list') {
            this.state.rollbackCount++;
            if (this.state.rollbackCount >= 3) nodeKey = 'epilogue.kicked_out.kicked_out_1';
        }
        const sceneEl = document.querySelector('#neshamah-render-area .m-scn-scene');
        if (sceneEl) {
            sceneEl.querySelectorAll('.m-cyber-btn, .m-c1-option-card').forEach(btn => btn.style.pointerEvents = 'none');
            sceneEl.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => { el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0'; });
            setTimeout(() => { this.currentNodeKey = nodeKey; this.renderScene(); }, 1000);
        } else { this.currentNodeKey = nodeKey; this.renderScene(); }
    },

    handleDrawClick(spreadType, nextNodePath, toolType = "tarot") {
        this.state.drawCounter--;
        const btn = document.getElementById('btn-draw-tarot');
        if (this.state.drawCounter > 0) {
            btn.innerText = `DRAW (${this.state.drawCounter})`;
            btn.style.borderColor = "var(--c3-saber-red)"; setTimeout(() => btn.style.borderColor = "var(--c3-saber-green)", 200);
        } else {
            btn.innerText = "REVEALING..."; btn.style.pointerEvents = "none";
            this.executeIntegratedDraw(spreadType, nextNodePath, toolType);
        }
    },

    async executeIntegratedDraw(spreadType, nextNodePath, toolType = "tarot") {
        try {
            const response = await fetch('/api/astro/citrinitas/neshamah/draw', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tool: toolType, spread_type: spreadType })
            });
            const data = await response.json();
            
            if (data.status === "success") {
                this.state.currentTool = toolType; this.state.drawnCards = data.drawn_results;
                if (toolType === 'flip_coin') {
                    this.state.coinTossIndex = 0; this.currentNodeKey = nextNodePath; this.renderScene(); return; 
                }
                this.currentNodeKey = nextNodePath;
                const area = document.getElementById('neshamah-render-area');
                if (area) {
                    const loadingText = toolType === 'tarot' ? 'Reading the faces of the cards...' : 'The symbols are aligning...';
                    area.innerHTML = `<div class="m-scn-scene" id="scene-draw-wait"><div class="m-scn-visual-area"></div><div class="m-scn-content"><p class="m-scene-narrative">${loadingText}</p></div></div>`;
                    setTimeout(() => { const el = document.getElementById('scene-draw-wait'); if(el) el.classList.add('revealed', 'veiled'); }, 100);
                }
                setTimeout(async () => { 
                    const waitScene = document.getElementById('scene-draw-wait');
                    if (waitScene) {
                        waitScene.querySelectorAll('.m-scn-bg, .m-scn-overlay, .m-scn-content').forEach(el => { el.style.transition = 'opacity 1s ease-in-out'; el.style.opacity = '0'; });
                        await new Promise(r => setTimeout(r, 1000));
                    }
                    this.renderDivinationDashboard(); 
                }, 2500);
            } else throw new Error(data.message || "Divination Draw Failed");
        } catch (e) {
            const area = document.getElementById('neshamah-render-area');
            if (area) area.innerHTML = `<div class="m-scn-scene"><div class="m-scn-content"><p class="m-scene-narrative">[ API ERROR ]<br>${e.message}</p><button type="button" class="m-cyber-btn" onclick="window.Neshamah.renderStartScreen()">RETURN</button></div></div>`;
        }
    },

    renderDivinationDashboard() {
        this.updateLang();
        const area = document.getElementById('neshamah-render-area');
        if (!area) return;

        if (this.state.currentTool === 'tarot' && this.state.scriptData?.scr_dict_tarot) {
            const scrTarot = this.state.scriptData.scr_dict_tarot;
            const activeNodeData = scrTarot[this.currentNodeKey] || scrTarot[this.state.currentDrawNode];
            if (activeNodeData) {
                const validSpreadKeys = ["celtic_cross", "tree_of_life", "chaldean", "horseshoe", "graha", "triadic", "duad", "1_card", "1_card_m"];
                const actualSpreadKey = Object.keys(activeNodeData).find(k => validSpreadKeys.includes(k));
                if (actualSpreadKey && this.state.spreadType !== actualSpreadKey) this.state.spreadType = actualSpreadKey;
            }
        }

        if (this.state.currentTool === 'dice' || this.state.currentTool === 'rune') {
            area.innerHTML = `
                <div class="m-scn-scene" id="scene-dashboard">
                    <div class="m-scn-visual-area" style="display:none;"></div>
                    <div class="m-scn-content" style="padding: 20px 10px;">
                        <div id="neshamah-dashboard-panel" class="m-neshamah-result-panel" style="background: transparent; border: none;"></div>
                        <div style="padding: 0 10px; margin-top:20px;"><button type="button" class="m-cyber-btn" onclick="window.Neshamah.acceptReadingAndProceed()">ACCEPT READING</button></div>
                    </div>
                </div>`;
            this.selectPosition(0);
            document.getElementById('neshamah-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => { const el = document.getElementById('scene-dashboard'); if (el) el.classList.add('revealed', 'veiled'); }, 350);
            return;
        }

        let boardClass = 'm-neshamah-single-board'; let posPrefix = '';
        switch (this.state.spreadType) {
            case 'celtic_cross': boardClass = 'm-neshamah-spread-board'; posPrefix = 'board-pos-celtic-'; break;
            case 'tree_of_life': boardClass = 'm-neshamah-tol-board'; posPrefix = 'board-pos-tol-'; break;
            case 'horseshoe': case 'chaldean': boardClass = 'm-neshamah-horseshoe-board'; posPrefix = 'board-pos-horseshoe-'; break;
            case 'triadic': boardClass = 'm-neshamah-triadic-board'; posPrefix = 'board-pos-triadic-'; break;
            case 'duad': boardClass = 'm-neshamah-duad-board'; posPrefix = 'board-pos-duad-'; break;
            case 'graha': boardClass = 'm-neshamah-graha-board'; posPrefix = 'board-pos-graha-'; break;
            case '1_card': case '1_card_m': boardClass = 'm-neshamah-single-board'; posPrefix = 'board-pos-single-'; break;
        }

        const isSingleCard = (this.state.spreadType === '1_card' || this.state.spreadType === '1_card_m');
        let topSectionHTML = '';

        if (!isSingleCard) {
            let minimapHTML = `<div class="m-spread-minimap-container ${boardClass}">`;
            let listHTML = `<div class="m-drawn-cards-list">`;

            this.state.drawnCards.forEach((card, idx) => {
                const pos = idx + 1; const posClass = posPrefix ? `${posPrefix}${pos}` : '';
                minimapHTML += `<div class="mini-pos ${posClass}" id="mini-pos-${idx}" onclick="window.Neshamah.selectPosition(${idx})">${pos}</div>`;
                const cardName = this.getExactCardName(card.card_id);
                listHTML += `<div class="m-list-item" id="list-item-${idx}" onclick="window.Neshamah.selectPosition(${idx})"><span class="m-list-pos">${pos}.</span> <span class="list-name">${cardName}</span></div>`;
            });
            minimapHTML += `</div>`; listHTML += `</div>`;
            topSectionHTML = `<div class="m-dashboard-top-section"><div class="m-dashboard-minimap">${minimapHTML}</div><div class="m-dashboard-list-container">${listHTML}</div></div>`;
        }

        area.innerHTML = `
            <div class="m-scn-scene" id="scene-dashboard">
                <div class="m-scn-visual-area" style="display:none;"></div>
                <div class="m-scn-content" style="padding: 20px 10px;">
                    ${topSectionHTML}
                    <div id="neshamah-dashboard-panel" class="m-neshamah-result-panel" ${isSingleCard ? 'style="border: none; background: transparent; padding: 0;"' : ''}></div>
                    <div style="padding: 0 10px; margin-top:15px;"><button type="button" class="m-cyber-btn" onclick="window.Neshamah.acceptReadingAndProceed()">ACCEPT READING</button></div>
                </div>
            </div>`;
        this.selectPosition(0);
        document.getElementById('neshamah-app').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { const el = document.getElementById('scene-dashboard'); if (el) el.classList.add('revealed', 'veiled'); }, 350);
    },

    buildCardHTMLComponent(card, extraClass = '') {
        let roman = '', name = '', mainGlyph = '', subGlyph = '';
        if (card.arcana_type === "major_fool" || card.arcana_type === "major") {
            const l = card.layers || {}; const cardNum = parseInt(card.card_id.split('_')[0]);
            roman = card.arcana_type === "major_fool" ? '0' : this.toRoman(cardNum); name = this.getExactCardName(card.card_id); 
            const mKey = l.mother_letter ? l.mother_letter.toLowerCase() : 'aleph', dKey = l.double_letter ? l.double_letter.toLowerCase() : '';
            const motherKey = card.arcana_type === "major_fool" ? 'infinity' : mKey;
            const m = this.GLYPH_TABLE.mother[motherKey] || { char: '?', cls: '' }, d = card.arcana_type === "major_fool" ? { char: '', cls: '' } : (this.GLYPH_TABLE.double[dKey] || { char: '?', cls: '' });
            mainGlyph = `<div class="t-main-glyph ${m.cls}">${m.char}</div>`; subGlyph = d.char ? `<div class="t-sub-glyph ${d.cls}">${d.char}</div>` : '';
        } else {
            const l = card.layers || {}; const isCourt = card.arcana_type === "minor_court";
            roman = isCourt ? (l.court_rank ? l.court_rank.toUpperCase() : "C") : this.toRoman(l.numerology || 1); name = ''; 
            const sKey = l.simple_letter ? l.simple_letter.toLowerCase() : '';
            const e = this.GLYPH_TABLE.simple[sKey] || { char: '?', suit: 'UNKNOWN', cls: '' };
            mainGlyph = `<div class="t-main-glyph ${e.cls}">${e.char}</div>`; subGlyph = `<div class="t-title ${e.cls}">${e.suit}</div>`;
        }
        return `<div class="m-neshamah-tarot-card ${extraClass}"><div class="t-roman">${roman}</div>${name ? `<div class="t-title">${name}</div>` : ''}${mainGlyph}${subGlyph}</div>`;
    },

    selectPosition(idx) {
        this.state.selectedIndex = idx; this.state.viewMode = 'script'; 
        document.querySelectorAll('.mini-pos').forEach((el, i) => { el.classList.toggle('active', i === idx); });
        document.querySelectorAll('.m-list-item').forEach((el, i) => { el.classList.toggle('active', i === idx); });
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
        
        let textHTML = '', titleHTML = '', headerTitleHTML = '';

        const getDictLore = (rootObj, category, key) => {
            if (!rootObj) return null;
            if (rootObj[category] && rootObj[category][key]) { const val = rootObj[category][key]; return val[this.lang] || val['en'] || (Array.isArray(val) ? val : null); }
            if (rootObj[key]) { const val = rootObj[key]; return val[this.lang] || val['en'] || (Array.isArray(val) ? val : null); }
            return null;
        };

        const formatLine = (label, text, cssClass) => {
            if (!text) return `<p class="${cssClass} data-missing">[ DATA MISSING ]</p>`;
            const content = Array.isArray(text) ? [...new Set(text)].join('<br>') : text;
            return `<p class="${cssClass} m-neshamah-layer-paragraph">${content}</p>`;
        };

        if (card.card_type === 'astrodice' || card.card_type === 'witchs_rune') {
            let toolDict = this.state.scriptData?.scr_dict_tools?.[this.currentNodeKey] || this.state.scriptData?.scr_dict_tools?.[this.state.currentDrawNode];
            if (!toolDict) {
                const allDicts = Object.values(this.state.scriptData?.scr_dict_tools || {});
                if (card.card_type === 'astrodice') toolDict = allDicts.find(d => d.planet_dice) || allDicts[0];
                else if (card.card_type === 'witchs_rune') toolDict = allDicts.find(d => d.witchs_rune) || allDicts[0];
            }

            if (!toolDict) textHTML = `<div style="color:#ff3333; text-align:center;">[ DICTIONARY DATA MISSING ]</div>`;
            else {
                if (card.card_type === 'astrodice') {
                    const raw = card.raw, pKey = raw.planet.toLowerCase().replace(' ', '_'), hKey = `h${raw.house}`, zKey = card.layers.zodiac;
                    titleHTML = `<div class="m-tool-title-label">${raw.planet} in ${raw.sign} (${raw.house}H)</div>`;
                    textHTML = formatLine(`Planet`, getDictLore(toolDict, 'planet_dice', pKey), 'script-layer-planet') + formatLine(`House`, getDictLore(toolDict, 'house_dice', hKey), 'script-layer-house') + formatLine(`Zodiac`, getDictLore(toolDict, 'zodiac_dice', zKey), 'script-layer-zodiac');
                } else if (card.card_type === 'witchs_rune') {
                    const raw = card.raw, rKey = raw.name.toLowerCase().replace(/ /g, '_');
                    titleHTML = `<div class="m-tool-title-label">${raw.name.toUpperCase()}</div>`;
                    textHTML = formatLine(`Rune`, getDictLore(toolDict, 'witchs_rune', rKey), 'script-layer-rune');
                }
            }
            panel.innerHTML = `<div class="m-panel-vertical-zone"><div class="m-tool-visual-top-area">${this.buildToolHTMLComponent(card)}</div>${titleHTML}<hr class="m-ritual-divider"><div style="width:100%;">${textHTML}</div></div>`;
            return; 
        }

        const currentPosKey = `pos_${this.state.selectedIndex + 1}`;
        let currentDict = null;

        if (!isCoreMode) {
            const scrTarot = this.state.scriptData?.scr_dict_tarot;
            const activeNodeData = scrTarot?.[this.currentNodeKey] || scrTarot?.[this.state.currentDrawNode] || scrTarot?.[Object.keys(scrTarot || {})[0]];
            currentDict = activeNodeData?.[this.state.spreadType]?.[currentPosKey] || activeNodeData?.[currentPosKey];
            const posTitle = currentDict?.title?.[this.lang];
            headerTitleHTML = `[ POSITION ${this.state.selectedIndex + 1} ]`;
            if (posTitle) headerTitleHTML += `<br><span style="font-size: 1.05rem; color: #fff; margin-top: 8px; display:inline-block;">${posTitle}</span>`;
            textHTML = `<h4 class="m-render-pos-header" style="border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:20px; text-align:center;">${headerTitleHTML}</h4>`;
        } else {
            currentDict = this.state.coreData?.dict;
            textHTML = `<h4 class="m-render-pos-header" style="border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:20px; color:var(--c3-saber-red); text-align:center;">[ ARCHETYPAL CORE DECODER ]</h4>`;
        }

        if (!currentDict) textHTML += `<div style="color:#ff3333; text-align:center;">[ DICTIONARY DATA MISSING ]</div>`;
        else if (card.render_manifest) {
            const tempTextLayers = [];
            card.render_manifest.forEach(m => {
                const prefix = isCoreMode ? 'core' : 'script', cssClass = `${prefix}-${m.css_suffix}`; 
                tempTextLayers.push(formatLine(m.label, getDictLore(currentDict, m.category, m.key), cssClass));
            });
            textHTML += tempTextLayers.join(''); 
        }

        const cardWrapperClass = isCoreMode ? 'm-card-wrapper-core dict-mode-active' : 'm-card-wrapper-script';
        panel.innerHTML = `
            <div class="m-panel-top-zone ${cardWrapperClass}" onclick="window.Neshamah.toggleDecodingPhase()">
                ${this.buildCardHTMLComponent(card, 'm-card-size-focus')}
                <div class="m-toggle-decode-hint">[ CLICK TO DECODE ]</div>
            </div>
            <div class="m-panel-bottom-zone" style="margin-top:20px;">${textHTML}</div>
        `;
    },

    buildToolHTMLComponent(card) {
        const pGlyphs = { "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂", "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇", "Rahu": "☊", "Ketu": "☋" };
        const zGlyphs = { "Aries": "♈︎", "Taurus": "♉︎", "Gemini": "♊︎", "Cancer": "♋︎", "Leo": "♌︎", "Virgo": "♍︎", "Libra": "♎︎", "Scorpio": "♏︎", "Sagittarius": "♐︎", "Capricorn": "♑︎", "Aquarius": "♒︎", "Pisces": "♓︎" };
        const zElements = { "Aries": "fire", "Leo": "fire", "Sagittarius": "fire", "Taurus": "earth", "Virgo": "earth", "Capricorn": "earth", "Gemini": "air", "Libra": "air", "Aquarius": "air", "Cancer": "water", "Scorpio": "water", "Pisces": "water" };
        const wRunes = { "sun": "☀︎", "moon": "⏾", "flight": "彡", "rings": "𓏌", "triquetra": "∴", "woman": "🇾", "man": "↑", "harvest": "⋓", "crossroads": "+", "star": "✳", "waves": "༄", "scythe": "⚸", "eye": "𓁿" };

        if (card.card_type === 'astrodice') {
            const raw = card.raw, pKey = raw.planet.toLowerCase().replace(' ', '_'), elKey = zElements[raw.sign] || "fire"; 
            return `<div class="m-astrodice-container"><div class="m-dice-item glyph-planet-${pKey}">${pGlyphs[raw.planet] || "?"}</div><div class="m-dice-item m-h-dice">${raw.house}</div><div class="m-dice-item glyph-element-${elKey}">${zGlyphs[raw.sign] || "?"}</div></div>`;
        } else if (card.card_type === 'witchs_rune') {
            const raw = card.raw, rKey = raw.name.toLowerCase().replace(/ /g, '_'), rGlyph = wRunes[rKey] || "●";
            return `<div class="m-ruach-style-rune-stone"><div class="m-rune-glyph-core">${rGlyph}</div></div>`;
        }
        return '';
    },

    acceptReadingAndProceed() {
        const boardNode = this.getNodeData(this.currentNodeKey) || {};
        this.currentNodeKey = boardNode.next || boardNode.route || 'epilogue.epilogue';
        this.renderScene();
    }
};

window.initC3Neshamah = function() {
    if (window.Neshamah) {
        window.Neshamah.updateLang(); 
        if (!window.Neshamah.initialized) { window.Neshamah.initialized = true; window.Neshamah.init(); } 
        else if (window.Neshamah.currentNodeKey === null && Object.keys(window.Neshamah.state.drawnCards).length === 0) window.Neshamah.renderStartScreen();
    }
};

if (document.getElementById('neshamah-app') && !document.getElementById('neshamah-app').dataset.bound) {
    document.getElementById('neshamah-app').dataset.bound = "true";
    window.initC3Neshamah();
}