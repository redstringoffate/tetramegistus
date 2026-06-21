function sendRitualPulse(keyword) {
    fetch('/api/godmode/pulse', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: keyword, duration: 0, country: "Other" })
    }).catch(e => console.error("[Omniscience] Pulse failed:", e));
}

function collectSeedsDirectly() {
    const extraSeeds = [];
    const invalidKeys = [ "me", "active_seed", "active_davison", "current_seed_idx", "current_seed_text", "session", "session_user_id", "tetramegistus.me", "nigredo_time_locked", "albedo_time_locked", "albedo_s1_idx", "albedo_s2_idx" ];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (invalidKeys.includes(key) || key.startsWith("temp_") || key.startsWith("albedo_")) continue;
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.birth_date && data.name) {
                extraSeeds.push({
                    name: data.name, birth_date: data.birth_date,
                    birth_time: (!data.birth_time || data.birth_time === "00:00") ? "12:00:00" : data.birth_time,
                    location: data.location || "Unknown", lat: data.lat, lng: data.lng, timezone: data.timezone, is_unknown_time: data.is_unknown_time,
                    _local_idx: (data.idx !== undefined && data.idx !== null) ? Number(data.idx) : 999
                });
            }
        } catch (e) { continue; }
    }
    extraSeeds.sort((a, b) => a._local_idx - b._local_idx);
    extraSeeds.forEach(seed => delete seed._local_idx);
    return extraSeeds;
}

async function handleInitialSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const pw = document.getElementById('password').value;
    const errorDiv = document.getElementById('password-error');
    
    if (pw.length < 8) { errorDiv.textContent = "password must be at least 8-digits"; errorDiv.style.opacity = "1"; return; }
    errorDiv.style.opacity = "0";

    try {
        const formData = new FormData();
        formData.append('email', email); formData.append('password', pw);

        const response = await fetch('/api/auth/login', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.status === "success") {
            // 🚀 [수복 핵심]: 로그인 성공 시, 비회원 시절 브라우저에 남아있던 오염된 기억을 즉시 소각합니다.
            // 이로써 n1.js는 무조건 서버(DB)의 깨끗한 [me] 데이터만을 신뢰하고 렌더링하게 됩니다.
            localStorage.removeItem('tetramegistus.me');
            localStorage.removeItem('active_seed');

            // 🚀 [추가됨]: 로그인 성공 시, 이스터에그(Hidden) 가입을 통한 첫 각성인지 확인
            if (result.is_hidden_anamnesis) {
                sendRitualPulse('ANAMNESIS_HIDDEN');
                setTimeout(() => {
                    window.location.href = result.redirect || "/world/nigredo";
                }, 300);
            } else {
                window.location.href = result.redirect || "/world/nigredo";
            }
        } else if (result.status === "anamnesis") {
            initiateAnamnesis();
        } else {
            errorDiv.textContent = result.message || "Invalid memory.";
            errorDiv.style.opacity = "1";
            setTimeout(() => { errorDiv.style.opacity = "0"; }, 3000);
        }
    } catch (err) {
        errorDiv.textContent = "Connection failed."; errorDiv.style.opacity = "1";
        setTimeout(() => { errorDiv.style.opacity = "0"; }, 3000);
    }
}

function initiateAnamnesis() {
    document.getElementById('auth-main').classList.add('dimmed');
    document.getElementById('anamnesis-layer').style.display = 'block';
    document.getElementById('verify-code').focus();
    sendRitualPulse('ANAMNESIS_GATE');
}

async function submitVerification() {
    const email = document.getElementById('email').value;
    const code = document.getElementById('verify-code').value;
    const anamnesisLayer = document.getElementById('anamnesis-layer');

    if (!code) return;

    try {
        const formData = new FormData();
        formData.append('email', email); formData.append('code', code);
        formData.append('extra_seeds_json', JSON.stringify(collectSeedsDirectly()));

        const response = await fetch('/api/auth/verify', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.status === "success") {
            sendRitualPulse(result.anamnesis_type === "hidden" ? 'ANAMNESIS_HIDDEN' : 'ANAMNESIS_NORMAL');
            anamnesisLayer.style.opacity = "0"; anamnesisLayer.style.pointerEvents = "none";

            setTimeout(() => {
                const overlay = document.createElement("div"); overlay.className = "migration-success-overlay";
                const veil = document.createElement("div"); veil.className = "migration-success-veil";
                const text = document.createElement("div"); text.className = "migration-success-text"; text.textContent = "verification successful";
                overlay.append(veil, text); document.body.appendChild(overlay);
                setTimeout(() => { text.style.opacity = "1"; }, 100);
                setTimeout(() => { window.location.replace("/world/nigredo"); }, 1500);
            }, 800);
        } else {
            const input = document.getElementById('verify-code');
            input.style.borderColor = "#ff4b4b"; input.value = ""; input.placeholder = "invalid memory";
            setTimeout(() => { input.style.borderColor = "#7CFF9B"; input.placeholder = "enter 6-digit code"; }, 1500);
        }
    } catch (err) { console.error("Verification failed:", err); }
}

document.addEventListener("DOMContentLoaded", () => {
    const verifyCodeInput = document.getElementById('verify-code');
    if (verifyCodeInput) verifyCodeInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitVerification(); });
});

function togglePopup(id, show) {
    document.getElementById(id).style.display = show ? 'block' : 'none';
    document.getElementById('popup-blur').style.display = show ? 'block' : 'none';
}

async function sendResetEmail() {
    const email = document.getElementById('reset-email').value;
    if(!email) return;

    try {
        const formData = new FormData(); formData.append('email', email);
        const response = await fetch('/api/auth/forgot-password', { method: 'POST', body: formData });
        const result = await response.json();
        alert(result.message);
        togglePopup('forgot-popup', false);
    } catch (err) { console.error(err); }
}

/* ===================================================
   👁️ [LV4 ANAMNESIS]: 7-Tap & 7-Sec Submit Long Press
=================================================== */
const Lv4Anamnesis = {
    overlay: null, input: null, label: null,
    step: 0, codes: { pin: "", code6: "", otp: "" },
    timer: null, timeLimit: 0, timerStartedAt: 0, remainingTime: 0,
    
    // 스텔스 제스처 변수
    tapCount: 0, lastTapTime: 0, ritualReady: false, readyTimeout: null, bgPressTimer: null,
    startX: 0, startY: 0, isRitualFired: false,

    init() {
        this.createOverlay(); 
        
        const titleBtn = document.querySelector('.m-auth-title');
        const submitBtn = document.querySelector('.m-submit-btn'); // 🚀 타겟을 Submit 버튼으로 변경
        
        if(!titleBtn || !submitBtn) return;

        titleBtn.style.userSelect = "none";
        titleBtn.style.webkitUserSelect = "none";

        // 1. 타이틀 7연속 탭 감지
        titleBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); 
            const now = Date.now();
            if (now - this.lastTapTime > 1000) {
                this.tapCount = 1;
            } else {
                this.tapCount++;
            }
            this.lastTapTime = now;

            if (this.tapCount === 7) {
                this.ritualReady = true;
                this.tapCount = 0;
                if (this.readyTimeout) clearTimeout(this.readyTimeout);
                this.readyTimeout = setTimeout(() => { this.ritualReady = false; }, 7000);
            }
        }, { passive: false });

        // 2. 🚀 Submit 버튼 7초 롱프레스 감지
        submitBtn.addEventListener('touchstart', (e) => {
            this.isRitualFired = false;
            
            if (this.ritualReady) {
                this.startX = e.touches[0].clientX;
                this.startY = e.touches[0].clientY;
                this.bgPressTimer = setTimeout(() => {
                    this.ritualReady = false;
                    this.isRitualFired = true; // 7초 도달! 의식 발동 플래그 ON
                    this.trigger(); 
                }, 7000);
            }
        }, { passive: true });

        // 손떨림 방지 (20px 이상 미끄러지면 취소)
        submitBtn.addEventListener('touchmove', (e) => {
            if (!this.bgPressTimer) return;
            const dx = Math.abs(e.touches[0].clientX - this.startX);
            const dy = Math.abs(e.touches[0].clientY - this.startY);
            if (dx > 20 || dy > 20) {
                clearTimeout(this.bgPressTimer);
                this.bgPressTimer = null;
            }
        }, { passive: true });

        const cancelPress = () => { if (this.bgPressTimer) clearTimeout(this.bgPressTimer); };
        
        // 🚀 버튼에서 손을 뗄 때의 분기 처리
        submitBtn.addEventListener('touchend', (e) => {
            cancelPress();
            
            // 만약 7초를 채워서 이미 의식이 발동되었다면, 
            // 원래 버튼이 하려던 '로그인 폼 제출(Click)'을 강제로 취소시킴
            if (this.isRitualFired) {
                e.preventDefault();
            }
        });
        
        submitBtn.addEventListener('touchcancel', cancelPress);
        
        // 버튼 롱프레스 시 브라우저 메뉴 차단
        submitBtn.addEventListener('contextmenu', (e) => {
            if (this.ritualReady || this.bgPressTimer) e.preventDefault();
        });

        // 3. 앱 라이프사이클 홀딩 결계
        document.addEventListener('visibilitychange', () => {
            if (this.step === 0) return;
            if (document.visibilityState === 'hidden') {
                if (this.timer) clearTimeout(this.timer);
                const elapsed = Date.now() - this.timerStartedAt;
                this.remainingTime = Math.max(0, this.remainingTime - elapsed);
            } else {
                if (this.remainingTime > 0) {
                    this.timerStartedAt = Date.now();
                    this.timer = setTimeout(() => this.hide(), this.remainingTime);
                } else {
                    this.hide();
                }
            }
        });
    },
    
    createOverlay() {
        const html = `
        <div id="lv4-ritual-overlay" class="m-intrusion-overlay lv4-void">
            <div class="m-ritual-box lv4-box">
                <h2 class="m-anamnesis-title lv4-title">level 4 anamnesis</h2>
                <div class="m-input-ritual">
                    <input type="password" id="lv4-ritual-input" class="lv4-input" spellcheck="false" autocomplete="off" inputmode="numeric" pattern="[0-9]*">
                </div>
                <p id="lv4-ritual-label" class="lv4-label">awaiting resonance...</p>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        
        this.overlay = document.getElementById('lv4-ritual-overlay');
        this.input = document.getElementById('lv4-ritual-input');
        this.label = document.getElementById('lv4-ritual-label');

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.process(); }
        });

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.hide(true);
        });
    },

    trigger() {
        this.step = 1;
        this.codes = { pin: "", code6: "", otp: "" };
        this.label.innerText = "enter 4-digit stealth pin";
        this.input.type = "password";
        this.input.value = "";
        this.input.maxLength = 4;
        
        this.overlay.style.display = 'flex';
        setTimeout(() => this.input.focus(), 50);
        this.startTimer(60000);
    },

    startTimer(ms) {
        if (this.timer) clearTimeout(this.timer);
        this.timeLimit = ms;
        this.remainingTime = ms;
        this.timerStartedAt = Date.now();
        this.timer = setTimeout(() => this.hide(), ms);
    },

    async process() {
        const val = this.input.value.trim();
        if (!val) return;

        if (this.step === 1) {
            const fd = new FormData(); fd.append('secret_pin', val);
            try {
                const res = await fetch('/api/auth/lv4/verify_pin', { method: 'POST', body: fd });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'success') {
                        this.codes.pin = val;
                        this.step = 2;
                        this.label.innerText = "enter daily resurrection code";
                        this.input.value = "";
                        this.input.maxLength = 6;
                        setTimeout(() => this.input.focus(), 50);
                        this.startTimer(300000); 
                        return;
                    }
                }
            } catch(e) {}
            this.hide(); 

        } else if (this.step === 2) {
            this.codes.code6 = val;
            this.step = 3;
            this.label.innerText = "enter authenticator otp";
            this.input.value = "";
            this.input.maxLength = 6;
            setTimeout(() => this.input.focus(), 50);
            this.startTimer(300000); 
            return;

        } else if (this.step === 3) {
            this.codes.otp = val;
            if (this.timer) clearTimeout(this.timer);
            await this.verifyFinal();
        }
    },

    async verifyFinal() {
        const fd = new FormData();
        fd.append('secret_pin', this.codes.pin);
        fd.append('code_6digit', this.codes.code6);
        fd.append('otp', this.codes.otp);

        try {
            const res = await fetch('/api/auth/lv4/awaken', { method: 'POST', body: fd });
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'success') {
                    this.hide(true);
                    this.awaken();
                    return;
                }
            }
        } catch (e) {}
        this.hide();
    },

    hide(immediate = false) {
        this.step = 0;
        if (this.timer) clearTimeout(this.timer);
        if(this.input) this.input.blur();

        if (immediate) {
            this.overlay.style.display = 'none';
            this.input.value = "";
            return;
        }
        
        this.overlay.style.opacity = '0';
        this.overlay.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.overlay.style.opacity = '1';
            this.input.value = "";
        }, 500);
    },

    awaken() {
        document.body.style.transition = "all 1.5s ease-in";
        document.body.style.filter = "invert(1) hue-rotate(180deg)";
        
        // 🚀 [수복 핵심]: LV4 관리자 각성 시 서버(파놉티콘)로 펄스를 쏘아 기록을 남깁니다.
        sendRitualPulse('GOD_MODE_LV4_AWAKEN');

        // 펄스가 서버에 닿을 시간(1.5초)을 충분히 준 뒤 본진으로 리다이렉트
        setTimeout(() => {
            window.location.replace('/world/nigredo');
        }, 1500);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Lv4Anamnesis.init();
});