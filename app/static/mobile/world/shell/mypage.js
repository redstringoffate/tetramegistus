// static/mobile/world/shell/mypage.js

const PanopticonRitual = {
    overlay: null, input: null, label: null,
    step: 0, codes: { pin: "", email: "" },
    timer: null,
    
    // 타임아웃 관리 변수 (수복)
    timeLimit: 0,
    timerStartedAt: 0,
    remainingTime: 0,

    // 스텔스 제스처 변수
    tapCount: 0,
    lastTapTime: 0,
    ritualReady: false,
    readyTimeout: null,
    bgPressTimer: null,

    init() {
        this.overlay = document.getElementById('ritual-overlay');
        this.input = document.getElementById('ritual-input');
        this.label = document.getElementById('ritual-label');
        const triggerBtn = document.getElementById('me-ritual-trigger');
        const hintBox = document.getElementById('mobile-userid-hint');
        const container = document.querySelector('.m-cell-container');

        if (!this.input || !triggerBtn || !container) return;

        // 1. [me] 3연속 탭 감지
        triggerBtn.addEventListener('click', (e) => {
            const now = Date.now();
            if (now - this.lastTapTime > 1000) {
                this.tapCount = 1; 
            } else {
                this.tapCount++;
            }
            this.lastTapTime = now;

            if (this.tapCount === 3) {
                this.ritualReady = true;
                this.tapCount = 0;
                if (this.readyTimeout) clearTimeout(this.readyTimeout);
                this.readyTimeout = setTimeout(() => { this.ritualReady = false; }, 5000);
            }

            if(hintBox) {
                hintBox.innerText = triggerBtn.getAttribute('data-userid');
                hintBox.classList.add('visible');
                setTimeout(() => hintBox.classList.remove('visible'), 3000);
            }
        });

        // 2. 빈 공간 3초 롱프레스 감지
        container.addEventListener('touchstart', (e) => {
            if (e.target.closest('#me-ritual-trigger') || e.target.closest('a')) return;
            if (this.ritualReady) {
                this.bgPressTimer = setTimeout(() => {
                    this.ritualReady = false;
                    this.trigger();
                }, 3000);
            }
        }, { passive: true });

        const cancelPress = () => clearTimeout(this.bgPressTimer);
        container.addEventListener('touchend', cancelPress);
        container.addEventListener('touchcancel', cancelPress);
        container.addEventListener('touchmove', cancelPress);

        // 3. 엔터키 대응
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.process();
            }
        });

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.hide(true);
        });

        // 🚀 [신규 수복]: OTP 확인을 위해 앱을 나갔다 들어올 때 타이머를 얼려버리는 생명선 결계
        document.addEventListener('visibilitychange', () => {
            if (this.step === 0) return;

            if (document.visibilityState === 'hidden') {
                // 💡 사용자가 앱을 나간 순간: 흐른 시간을 계산해서 타이머를 일시정지(Freeze)
                if (this.timer) clearTimeout(this.timer);
                const elapsed = Date.now() - this.timerStartedAt;
                this.remainingTime = Math.max(0, this.remainingTime - elapsed);
            } else {
                // 💡 사용자가 코드를 보고 다시 돌아온 순간: 남은 시간만큼 타이머를 재가동(Resume)
                if (this.remainingTime > 0) {
                    this.timerStartedAt = Date.now();
                    this.timer = setTimeout(() => this.hide(), this.remainingTime);
                } else {
                    this.hide();
                }
            }
        });
    },

    trigger() {
        this.step = 1;
        this.codes.pin = "";
        this.codes.email = "";
        this.label.innerText = "enter 4-digit pin";
        this.input.type = "password";
        this.input.value = "";

        this.overlay.classList.remove('closing');
        this.overlay.style.display = 'flex';

        setTimeout(() => this.input.focus(), 50);
        
        // 🚀 1차 PIN 번호 입력 제한 시간: 1분 (60,000ms)으로 대폭 확장
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
            const fd = new FormData();
            fd.append('pin', val);

            try {
                const res = await fetch('/api/auth/verify-pano-pin', { method: 'POST', body: fd });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'success') {
                        this.codes.pin = val;
                        this.step = 2;
                        this.label.innerText = "enter 6-digit code";
                        this.input.value = "";
                        
                        setTimeout(() => this.input.focus(), 50);
                        
                        // 🚀 2차 OTP/이메일 코드 입력 제한 시간: 5분 (300,000ms)으로 우주만큼 늘림
                        // 이제 네이버 앱이나 Authenticator 갔다 와도 절대 안 꺼집니다.
                        this.startTimer(300000);
                        return;
                    }
                }
            } catch (e) {}
            
            this.hide();

        } else if (this.step === 2) {
            this.codes.email = val;
            if (this.timer) clearTimeout(this.timer);
            await this.verifyFinal();
        }
    },

    async verifyFinal() {
        const fd = new FormData();
        fd.append('pin', this.codes.pin);
        fd.append('email_code', this.codes.email);

        try {
            const res = await fetch('/api/auth/unlock-panopticon', { method: 'POST', body: fd });
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
        
        this.overlay.classList.add('closing');
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.overlay.classList.remove('closing');
            this.input.value = "";
        }, 1000);
    },

    awaken() {
        document.body.style.transition = "all 0.8s ease";
        document.body.style.boxShadow = "inset 0 0 100px rgba(60, 255, 143, 0.15)";
        
        setTimeout(() => {
            document.body.classList.add('dissolve-out');
            setTimeout(() => {
                window.location.href = '/world/panopticon';
            }, 1200); 
        }, 800);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PanopticonRitual.init());
} else {
    PanopticonRitual.init();
}

/* ─────────────────────────────────────────────────────────────
   💀 [LOGOUT PROTOCOL]: 세션 파괴 및 본체(me) 기억 로컬스토리지 보존
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementById("btn-logout"); 
    
    if (btnLogout) {
        btnLogout.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation(); 
            
            try {
                const res = await fetch("/gate/logout", { method: "POST" });
                const data = await res.json();
                
                // 🚀 낙하산 전개: 백엔드가 뱉어준 DB me 시드로 로컬 스토리지 무결성 보장
                if (data.ok && data.me_seed && data.me_seed.birth_date) {
                    let localSeed = JSON.parse(localStorage.getItem("active_seed") || "{}");
                    localSeed.birth_date = data.me_seed.birth_date;
                    localSeed.birth_time = data.me_seed.birth_time;
                    localSeed.location = data.me_seed.location;
                    localStorage.setItem("active_seed", JSON.stringify(localSeed));
                }
                
                // 🚀 [핵심 수복]: 대문으로 쫓아내지 않습니다! 
                // 낙하산(Guest 쿠키+로컬)을 맨 상태로 본진 월드에 비회원으로 남거나 로그인 창으로 보냅니다.
                window.location.replace("/world/nigredo"); 
            } catch (err) {
                console.error("Logout ritual failed:", err);
                window.location.replace("/login"); 
            }
        });
    }
});