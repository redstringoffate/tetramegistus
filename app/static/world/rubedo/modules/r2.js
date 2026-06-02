// app/static/world/rubedo/modules/r2.js

const R2 = {
    icons: ['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎'],
    keys: ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'],
    state: { view: 'sign', sIdx: 0, nVal: null },

    init() {
        console.log("--- [R2]: Principia System Initialized ---");
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
		let endpoint = '';

		if (this.state.view === 'sign') {
			endpoint = `/api/theory/sabian/sign/${signName}`;
		} else {
			endpoint = `/api/theory/sabian/symbol/${signName}/${this.state.nVal}`;
		}

		try {
			const res = await fetch(`${endpoint}?lang=${lang}`);
			if (!res.ok) throw new Error();
			const data = await res.json();
			
			const titleEl = document.getElementById('theory-title');
			const bodyEl = document.getElementById('theory-body');
			
			titleEl.innerText = data.title;
			bodyEl.innerHTML = data.content;

			const combinedContent = (data.content || "");
			const isGrimoireBanned = combinedContent.toLowerCase().includes('#nogrimoire');
			const isLoggedIn = document.cookie.includes('session_user_id');

			// 🚀 [발행 여부 감지]: index.json의 status 값을 기준으로 명확하게 판별
			const isPublished = data.status === 'published';

			if (isLoggedIn && !isGrimoireBanned && isPublished) {
				const btn = document.createElement('button');
				btn.className = 'grimoire-pdf-btn';
				btn.title = "Inscribe to Grimoire";
				btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
				btn.onclick = () => this.triggerPDFDownload();
				
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
        if (!sm) return;
        sm.innerHTML = this.icons.map((icon, i) => {
            const isActive = (i === this.state.sIdx);
            return `<div class="grid-cell ${isActive ? 'active' : ''}" onclick="R2.handleSignClick(${i}, this)">${icon}</div>`;
        }).join('');

        const nm = document.getElementById('number-matrix');
        if (!nm) return;
        nm.innerHTML = Array.from({length: 30}, (_, i) => {
            const val = i + 1;
            const isActive = (this.state.nVal === val);
            return `<div class="grid-cell ${isActive ? 'active' : ''}" onclick="R2.handleNumClick(${val}, this)">${val.toString().padStart(2, '0')}</div>`;
        }).join('');
    },

    // 🚀 Grimoire PDF 저장 트리거 및 중복 검사 로직
    async triggerPDFDownload() {
        const titleEl = document.getElementById('theory-title');
        const bodyEl = document.getElementById('theory-body');
        if (!titleEl || !bodyEl) return;

        const lang = (typeof WorldSettings !== 'undefined') ? WorldSettings.get('lang', 'en') : 'en';
        const signName = this.keys[this.state.sIdx];
        
        let defaultFileName = this.state.view === 'sign' 
            ? `${signName}_${lang}` 
            : `${signName}_${this.state.nVal}_${lang}`;

        const titleText = titleEl.firstChild ? titleEl.firstChild.textContent : "Sabian Symbol";
        const htmlContent = `
            <h1 class="article-view-title">${titleText}</h1>
            <hr class="article-view-hr">
            <div class="article-body-content">${bodyEl.innerHTML}</div>
        `;

        let finalName = defaultFileName;

        try {
            const checkRes = await fetch(`/api/grimoire/check_name/rubedo?name=${defaultFileName}`);
            const checkData = await checkRes.json();

            if (checkData.exists) {
                const wantsToRename = confirm(`"${defaultFileName}" already exists in your Grimoire.\nWould you like to save as a different name?`);
                if (wantsToRename) {
                    const newName = prompt("Enter new name for the Grimoire archive:", defaultFileName);
                    if (!newName) return; 
                    finalName = newName;
                }
            }

            await this.runInscriptionRitual(finalName, htmlContent);

        } catch (e) {
            console.error("Grimoire insight failed.", e);
            alert("Failed to communicate with the Grimoire core.");
        }
    },

    // 🚀 실제 통신 및 이펙트 연성 로직
    async runInscriptionRitual(fileName, html) {
        const overlay = document.getElementById('inscribe-overlay');
        const fillBar = document.getElementById('inscribe-fill');
        const percentageText = document.getElementById('inscribe-percentage');
        
        if (overlay) {
            overlay.style.display = 'flex';
            setTimeout(() => overlay.style.opacity = '1', 10);
        }

        try {
            const res = await fetch('/api/grimoire/save/pdf/r2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_name: fileName,
                    stage: 'rubedo',
                    html_content: html
                })
            });

            if (res.ok) {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.floor(Math.random() * 15) + 5;
                    if (progress > 100) progress = 100;
                    
                    if (fillBar) fillBar.style.width = `${progress}%`;
                    if (percentageText) percentageText.textContent = `${progress}%`;
                    
                    if (progress === 100) {
                        clearInterval(interval);
                        this.finishInscriptionRitual();
                    }
                }, 50);
            } else {
                throw new Error("Alchemy rejected by the server.");
            }
        } catch (e) {
            console.error("Alchemy failed", e);
            if (overlay) overlay.style.display = 'none';
            alert("Failed to inscribe PDF. The Prima Materia was rejected.");
        }
    },

    finishInscriptionRitual() {
        const statusText = document.getElementById('inscribe-status');
        const barContainer = document.getElementById('inscribe-bar-container');
        const doneText = document.getElementById('inscribe-done');
        const overlay = document.getElementById('inscribe-overlay');
        const fillBar = document.getElementById('inscribe-fill');
        const percentageText = document.getElementById('inscribe-percentage');

        if (statusText) statusText.style.opacity = '0';
        if (barContainer) barContainer.style.opacity = '0';
        if (doneText) doneText.style.opacity = '1';

        setTimeout(() => {
            if (overlay) overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay) overlay.style.display = 'none';
                
                if (fillBar) fillBar.style.width = '0%';
                if (percentageText) percentageText.textContent = '0%';
                if (statusText) statusText.style.opacity = '1';
                if (barContainer) barContainer.style.opacity = '1';
                if (doneText) doneText.style.opacity = '0';
            }, 500); 
        }, 1500); 
    }
};

R2.init();

// --- [이하 God Mode 의식 진입 프로토콜 유지] ---

let isRitualAwaiting = false; 
let ritualBuffer = "";        
let ritualTimer = null; 

const RitualUI = {
    overlay: null, input: null, label: null,
    step: 1, codes: { l1: "", em: "", ot: "" },
    uiTimer: null,

    init() {
        this.overlay = document.getElementById('ritual-overlay');
        this.input = document.getElementById('ritual-input');
        this.label = document.getElementById('ritual-label');

        if (!this.input) return;

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.process();
            if (e.key === 'Escape') this.hide();
        });
    },

    startTimer() {
        if (this.uiTimer) clearTimeout(this.uiTimer);
        this.uiTimer = setTimeout(() => {
            console.warn("[SYSTEM]: The gateway closed due to hesitation.");
            this.hide(); 
        }, 12000);
    },

    show(l1Key) {
        this.overlay.classList.remove('closing'); 
        this.codes.l1 = l1Key; 
        this.step = 1;
        this.label.innerText = "enter 6-digit code";
        this.input.value = "";
        this.overlay.style.display = 'flex'; 
        this.input.focus();
        this.startTimer();
    },

    async process() {
        const val = this.input.value.trim();
        if (!val) return;

        if (this.step === 1) {
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
                } else {
                    alert(data.message || "The void remains silent.");
                    this.hide(); 
                }
            } catch (err) {
                console.error("Verification error:", err);
                this.hide();
            }

        } else {
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
            } else {
                alert(data.message || "The void remains silent.");
                this.hide(); 
            }
        } catch (err) {
            console.error("Ritual failed:", err);
            this.hide();
        }
    },

    hide(immediate = false) { 
        if (this.uiTimer) clearTimeout(this.uiTimer);

        if (immediate) {
            this.overlay.style.display = 'none';
            return;
        }

        this.overlay.classList.add('closing');

        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.overlay.classList.remove('closing');
            this.input.value = "";
        }, 2000);
    },

    triggerAwakening() {
        console.log("--- [SYSTEM]: God Mode clearance granted. Transitioning... ---");
        
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

// 🔒 [의식 감지 로직]: 트리거 및 투명창 입력
window.addEventListener('keydown', async (e) => {
    if (!document.getElementById('god-mode-clearance')) return;
    
    if (e.ctrlKey && e.shiftKey && e.code === 'Digit4') {
        if (typeof R2 !== 'undefined' && R2.state.view === 'symbol' && R2.state.sIdx === 4 && R2.state.nVal === 7) {
            e.preventDefault();
            
            isRitualAwaiting = true;
            ritualBuffer = "";
            if (ritualTimer) clearTimeout(ritualTimer);

            console.log("--- [SYSTEM]: The Void is watching. ---");

            ritualTimer = setTimeout(() => {
                if (isRitualAwaiting) {
                    isRitualAwaiting = false;
                    ritualBuffer = "";
                    console.warn("[SYSTEM]: The gateway closed due to silence.");
                }
            }, 5000); 
            return;
        }
    }

    if (isRitualAwaiting) {
        if (e.key >= '0' && e.key <= '9') {
            ritualBuffer += e.key;
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (ritualTimer) clearTimeout(ritualTimer);
            isRitualAwaiting = false; 

            const fd = new FormData();
            fd.append('layer1_key', ritualBuffer);

            try {
                const res = await fetch('/api/auth/verify-layer1', { method: 'POST', body: fd });
                const data = await res.json();

                if (data.status === 'success') {
                    console.log("--- [SYSTEM]: First layer breached. ---");
                    RitualUI.show(ritualBuffer); 
                } else {
                    console.warn("--- [SYSTEM]: The Void rejects your offering. ---");
                }
            } catch (err) {
                console.warn("--- [SYSTEM]: The Void is silent. ---");
            }

            ritualBuffer = ""; 
        }
        
        if (e.key === 'Escape') {
            if (ritualTimer) clearTimeout(ritualTimer);
            isRitualAwaiting = false;
            ritualBuffer = "";
        }
    }
});

RitualUI.init();