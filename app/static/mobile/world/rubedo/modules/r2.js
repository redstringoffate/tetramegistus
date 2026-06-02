/* static/mobile/world/rubedo/modules/r2.js */

const R2 = {
    icons: ['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎'],
    keys: ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'],
    state: { view: 'sign', sIdx: 0, nVal: null },

    init() {
        this.updateStateFromURL();
        this.render();
        this.syncUI();
        this.load();

        window.onpopstate = () => {
            this.updateStateFromURL();
            this.render();
            this.syncUI();
            this.load();
        };
    },

    updateStateFromURL() {
        const params = new URLSearchParams(window.location.search);
        this.state.view = params.get('mode') || 'sign';
        const signParam = params.get('sign');
        if (signParam && this.keys.includes(signParam)) {
            this.state.sIdx = this.keys.indexOf(signParam);
        }
        const numParam = params.get('num');
        this.state.nVal = numParam ? parseInt(numParam) : null;
    },

    switchDichotomy() {
        this.state.view = (this.state.view === 'sign') ? 'symbol' : 'sign';
        this.state.nVal = null; 

        const url = new URL(window.location.href);
        url.searchParams.set('mode', this.state.view);
        url.searchParams.delete('sign');
        url.searchParams.delete('num');
        
        history.pushState(null, '', url); 
        this.render();
        this.syncUI();
        this.load();
    },

    syncUI() {
        const isSymbol = (this.state.view === 'symbol');
        const knob = document.getElementById('r2-knob');
        const numSection = document.getElementById('number-section');
        
        if (knob) knob.classList.toggle('right', isSymbol);
        if (numSection) numSection.style.display = isSymbol ? 'block' : 'none';
        
        document.getElementById('label-sign').classList.toggle('active', !isSymbol);
        document.getElementById('label-symbol').classList.toggle('active', isSymbol);
    },

    handleSignClick(idx, el) {
        this.state.sIdx = idx;
        const url = new URL(window.location.href);
        url.searchParams.set('sign', this.keys[idx]);

        if (this.state.view === 'symbol') {
            if (!this.state.nVal) this.state.nVal = 1; 
            url.searchParams.set('num', this.state.nVal.toString());
        }

        history.pushState(null, '', url);
        this.render();
        this.load();
    },

    handleNumClick(val, el) {
        this.state.nVal = val;
        const url = new URL(window.location.href);
        url.searchParams.set('sign', this.keys[this.state.sIdx]);
        url.searchParams.set('num', val.toString()); 
        
        history.pushState(null, '', url);
        this.render();
        this.load();
    },

    async load() {
        if (this.state.view === 'symbol' && !this.state.nVal) return;
        if (this.state.view === 'sign' && !new URLSearchParams(window.location.search).get('sign')) return;

        const lang = (typeof WorldSettings !== 'undefined') ? WorldSettings.get('lang', 'en') : 'en';
        const signName = this.keys[this.state.sIdx];
        let endpoint = (this.state.view === 'sign') 
            ? `/api/theory/sabian/sign/${signName}` 
            : `/api/theory/sabian/symbol/${signName}/${this.state.nVal}`;

        try {
            const res = await fetch(`${endpoint}?lang=${lang}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            
            const titleEl = document.getElementById('theory-title');
            const bodyEl = document.getElementById('theory-body');
            
            titleEl.innerHTML = `<span>${data.title}</span>`; 
            bodyEl.innerHTML = data.content;

            const combinedContent = (data.content || "");
            const isGrimoireBanned = combinedContent.toLowerCase().includes('#nogrimoire');
            const isLoggedIn = document.cookie.includes('session_user_id');
            const isPublished = data.status === 'published';

            if (isLoggedIn && !isGrimoireBanned && isPublished) {
                const btn = document.createElement('button');
                btn.className = 'grimoire-pdf-btn';
                btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
                btn.onclick = (e) => { e.stopPropagation(); this.triggerPDFDownload(); };
                titleEl.appendChild(btn);
            }
        } catch (e) {
            const errorId = this.state.view === 'sign' ? signName : `${signName} ${this.state.nVal}°`;
            document.getElementById('theory-body').innerHTML = 
                `<p class="error-msg">[SYSTEM]: The duality of knowledge '${errorId}' is not yet manifested.</p>`;
        }
    },

    render() {
        const sm = document.getElementById('sign-matrix');
        if (sm) {
            sm.innerHTML = this.icons.map((icon, i) => {
                const isActive = (i === this.state.sIdx);
                return `<div class="grid-cell ${isActive ? 'active' : ''}" onclick="R2.handleSignClick(${i}, this)">${icon}</div>`;
            }).join('');
        }

        const nm = document.getElementById('number-matrix');
        if (nm) {
            nm.innerHTML = Array.from({length: 30}, (_, i) => {
                const val = i + 1;
                const isActive = (this.state.nVal === val);
                return `<div class="grid-cell ${isActive ? 'active' : ''}" onclick="R2.handleNumClick(${val}, this)">${val.toString().padStart(2, '0')}</div>`;
            }).join('');
        }
    },

    // --- Grimoire 다운로드 로직 ---
    async triggerPDFDownload() {
        const titleEl = document.getElementById('theory-title');
        const bodyEl = document.getElementById('theory-body');
        if (!titleEl || !bodyEl) return;

        const lang = (typeof WorldSettings !== 'undefined') ? WorldSettings.get('lang', 'en') : 'en';
        const signName = this.keys[this.state.sIdx];
        let defaultFileName = this.state.view === 'sign' ? `${signName}_${lang}` : `${signName}_${this.state.nVal}_${lang}`;
        const titleText = titleEl.querySelector('span') ? titleEl.querySelector('span').textContent : "Sabian Symbol";
        const htmlContent = `<h1 class="article-view-title">${titleText}</h1><div class="article-body-content">${bodyEl.innerHTML}</div>`;

        let finalName = defaultFileName;
        try {
            const checkRes = await fetch(`/api/grimoire/check_name/rubedo?name=${defaultFileName}`);
            const checkData = await checkRes.json();
            if (checkData.exists) {
                if (confirm(`"${defaultFileName}" already exists.\nSave as a different name?`)) {
                    const newName = prompt("Enter new name:", defaultFileName);
                    if (!newName) return; 
                    finalName = newName;
                }
            }
            await this.runInscriptionRitual(finalName, htmlContent);
        } catch (e) { alert("Failed to communicate with the Grimoire core."); }
    },

    async runInscriptionRitual(fileName, html) {
        const overlay = document.getElementById('inscribe-overlay');
        const fillBar = document.getElementById('inscribe-fill');
        const pText = document.getElementById('inscribe-percentage');
        
        if (overlay) { overlay.style.display = 'flex'; setTimeout(() => overlay.style.opacity = '1', 10); }

        try {
            const res = await fetch('/api/grimoire/save/pdf/r2', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_name: fileName, stage: 'rubedo', html_content: html })
            });

            if (res.ok) {
                let progress = 0;
                const intv = setInterval(() => {
                    progress += Math.floor(Math.random() * 15) + 5;
                    if (progress > 100) progress = 100;
                    if (fillBar) fillBar.style.width = `${progress}%`;
                    if (pText) pText.textContent = `${progress}%`;
                    if (progress === 100) { clearInterval(intv); this.finishInscriptionRitual(); }
                }, 50);
            } else throw new Error();
        } catch (e) {
            if (overlay) overlay.style.display = 'none';
            alert("Failed to inscribe PDF.");
        }
    },

    finishInscriptionRitual() {
        const statusText = document.getElementById('inscribe-status');
        const barContainer = document.getElementById('inscribe-bar-container');
        const doneText = document.getElementById('inscribe-done');
        const overlay = document.getElementById('inscribe-overlay');
        const fillBar = document.getElementById('inscribe-fill');
        const pText = document.getElementById('inscribe-percentage');

        if (statusText) statusText.style.opacity = '0';
        if (barContainer) barContainer.style.opacity = '0';
        if (doneText) doneText.style.opacity = '1';

        setTimeout(() => {
            if (overlay) overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay) overlay.style.display = 'none';
                if (fillBar) fillBar.style.width = '0%';
                if (pText) pText.textContent = '0%';
                if (statusText) statusText.style.opacity = '1';
                if (barContainer) barContainer.style.opacity = '1';
                if (doneText) doneText.style.opacity = '0';
            }, 500); 
        }, 1500); 
    }
};

document.addEventListener('DOMContentLoaded', () => { R2.init(); });

// ==========================================
// 💀 [God Mode 모바일 터치 트리거 프로토콜]
// ==========================================

let leoSignTap = 0;
let num7Tap = 0;
let r2TitleTap = 0;
let silenceTimer = null;

document.addEventListener('touchstart', (e) => {
    if (!document.getElementById('god-mode-clearance')) return;
    
    if (R2.state.view !== 'symbol' || R2.state.sIdx !== 4 || R2.state.nVal !== 7) {
        leoSignTap = 0; num7Tap = 0; r2TitleTap = 0; return;
    }

    if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
    }

    const target = e.target;
    const isSignCell = target.closest('#sign-matrix .grid-cell');
    const isNumCell = target.closest('#number-matrix .grid-cell');
    const isTheoryTitle = target.closest('#theory-title');

    if (isSignCell && isSignCell.textContent.trim() === '♌︎') {
        leoSignTap++;
        num7Tap = 0; 
        r2TitleTap = 0;
        if (leoSignTap > 4) leoSignTap = 1; 
    } 
    else if (isNumCell && isNumCell.textContent.trim() === '07') {
        if (leoSignTap === 4) {
            num7Tap++;
            r2TitleTap = 0;
            if (num7Tap > 7) num7Tap = 1; 
        } else {
            leoSignTap = 0; num7Tap = 0; r2TitleTap = 0;
        }
    } 
    else if (isTheoryTitle) {
        if (leoSignTap === 4 && num7Tap === 7) {
            r2TitleTap++;
            if (r2TitleTap > 7) r2TitleTap = 1;
        } else {
            leoSignTap = 0; num7Tap = 0; r2TitleTap = 0;
        }
    } 
    else {
        leoSignTap = 0; num7Tap = 0; r2TitleTap = 0;
    }
});

document.addEventListener('touchend', () => {
    if (leoSignTap === 4 && num7Tap === 7 && r2TitleTap === 7) {
        silenceTimer = setTimeout(() => {
            RitualUI.showLayer1();
            leoSignTap = 0; num7Tap = 0; r2TitleTap = 0; 
        }, 4000);
    }
});

// ==========================================
// 💀 [God Mode 모바일 UI 프로토콜]
// ==========================================

const RitualUI = {
    overlay: null, input: null, label: null,
    step: 0, codes: { l1: "", em: "", ot: "" }, 
    uiTimer: null,

    init() {
        this.overlay = document.getElementById('ritual-overlay');
        this.input = document.getElementById('ritual-input');
        this.label = document.getElementById('ritual-label');

        if (!this.input) return;

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.process(); }
        });
    },

    startTimer() {
        if (this.uiTimer) clearTimeout(this.uiTimer);
        this.uiTimer = setTimeout(() => { this.hide(); }, 30000);
    },

    showLayer1() {
        this.overlay.classList.remove('closing'); 
        this.step = 0;
        this.label.innerText = "awaiting protocol...";
        this.input.type = "password"; // 🚀 영구적 패스워드 고정
        this.input.value = "";
        this.overlay.style.display = 'flex'; 
        this.input.focus();
        this.startTimer();
    },

    async process() {
        const val = this.input.value.trim();
        if (!val) return;

        if (this.step === 0) {
            const fd = new FormData();
            fd.append('layer1_key', val);
            try {
                const res = await fetch('/api/auth/verify-layer1', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.status === 'success') {
                    this.codes.l1 = val; 
                    this.step = 1;
                    this.label.innerText = "enter 6-digit code";
                    // 🚀 this.input.type = "text"; 코드 영구 삭제 완료 (Lv4 방식 수복)
                    this.input.value = "";
                    this.input.focus();
                    this.startTimer();
                } else { this.hide(); }
            } catch (err) { this.hide(); }

        } else if (this.step === 1) {
            const fd = new FormData();
            fd.append('email_code', val);
            try {
                const res = await fetch('/api/auth/verify-resurrection', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.status === 'success') {
                    this.codes.em = val; 
                    this.step = 2;
                    this.label.innerText = "enter google authenticator";
                    this.input.value = "";
                    this.input.focus();
                    this.startTimer();
                } else { this.hide(); }
            } catch (err) { this.hide(); }

        } else if (this.step === 2) {
            this.codes.ot = val;
            if (this.uiTimer) clearTimeout(this.uiTimer);
            await this.verify();
        }
    },

    async verify() {
        const fd = new FormData();
        fd.append('layer1_key', this.codes.l1);
        fd.append('email_code', this.codes.em);
        fd.append('otp_code', this.codes.ot);

        try {
            const res = await fetch('/api/auth/unlock-god-mode', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.status === 'success') {
                this.hide(true); 
                this.triggerAwakening();
            } else { this.hide(); }
        } catch (err) { this.hide(); }
    },

    hide(immediate = false) { 
        if (this.uiTimer) clearTimeout(this.uiTimer);
        if (immediate) { this.overlay.style.display = 'none'; return; }

        this.overlay.classList.add('closing');
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.overlay.classList.remove('closing');
            this.input.value = "";
        }, 1000);
    },

    triggerAwakening() {
        document.body.style.transition = "all 0.8s ease";
        document.body.style.boxShadow = "inset 0 0 100px rgba(60, 255, 143, 0.15)";
        
        setTimeout(() => {
            document.body.classList.add('dissolve-out');
            setTimeout(() => {
                window.location.href = '/world/rubedo/godmode_lv3';
            }, 1200); 
        }, 800);
    }
};

document.addEventListener('DOMContentLoaded', () => { RitualUI.init(); });