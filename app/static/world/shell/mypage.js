// static/world/shell/mypage.js

const PanopticonRitual = {
    overlay: null, input: null, label: null,
    step: 0, codes: { pin: "", email: "" },
    timer: null,

    init() {
        this.overlay = document.getElementById('ritual-overlay');
        this.input = document.getElementById('ritual-input');
        this.label = document.getElementById('ritual-label');

        if (!this.input) return;

        // 👁️ 트리거: Ctrl + Shift + 3
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.code === 'Digit3') {
                e.preventDefault();
                this.trigger();
            }
        });

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.process();
            if (e.key === 'Escape') this.hide(true);
        });

        // 스텔스 창일 때 바탕 클릭해도 포커스 유지
        document.addEventListener('click', () => {
            if (this.step === 1 && this.overlay.style.display === 'flex') {
                this.input.focus();
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

        // 🚀 스텔스 모드 켜기
        this.overlay.classList.remove('closing');
        this.overlay.classList.add('stealth-mode');
        this.overlay.style.display = 'flex';

        setTimeout(() => this.input.focus(), 10);
        this.startTimer(5000);
    },

    startTimer(ms) {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.hide(), ms);
    },

    // 🚀 네가 확인했던 완벽하게 작동하는 오리지널 코드!
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
                        // 1차 결계 통과 -> 2차로 전환
                        this.codes.pin = val;
                        this.step = 2;
                        this.label.innerText = "enter 6-digit code";
                        this.overlay.style.display = 'flex'; 
                        this.input.value = "";

                        // 🚀 통과했으니 투명창(스텔스) 해제하고 보이게 만듦
                        this.overlay.classList.remove('stealth-mode');
                        this.input.focus();
                        
                        this.startTimer(10000); // ⏱️ 2차 10초 제한
                        return;
                    }
                } else {
                    console.error("[SYSTEM]: 1차 결계 거절됨. Status Code:", res.status);
                }
            } catch (e) {
                console.error("[SYSTEM]: 서버와의 통신 단절:", e);
            }
            
            // 틀리거나 에러나면 아무 티 내지 않고 조용히 취소
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
        if (immediate) {
            this.overlay.style.display = 'none';
            this.overlay.classList.remove('stealth-mode');
            this.input.value = "";
            return;
        }
        
        this.overlay.classList.add('closing');
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.overlay.classList.remove('closing');
            this.overlay.classList.remove('stealth-mode');
            this.input.value = "";
        }, 2000);
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
    // HTML에 있는 로그아웃 버튼 ID가 다를 경우 'btn-logout' 부분을 실제 ID로 변경해주세요.
    const btnLogout = document.getElementById("btn-logout"); 
    
    if (btnLogout) {
        btnLogout.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation(); // 부모 이벤트 간섭 방어
            
            try {
                const res = await fetch("/gate/logout", { method: "POST" });
                const data = await res.json();
                
                // 🚀 백엔드가 뱉어준 DB me 시드를 로컬 스토리지에 강제로 덮어씌워 부활시킴
                if (data.ok && data.me_seed && data.me_seed.birth_date) {
                    let localSeed = JSON.parse(localStorage.getItem("active_seed") || "{}");
                    localSeed.birth_date = data.me_seed.birth_date;
                    localSeed.birth_time = data.me_seed.birth_time;
                    localSeed.location = data.me_seed.location;
                    localStorage.setItem("active_seed", JSON.stringify(localSeed));
                }
                
                // 쿠키 갱신(백엔드) + 로컬스토리지 복구(프론트) 완료 후 대문으로 0초 만에 사출
                window.location.replace("https://prima-materia.net"); 
            } catch (err) {
                console.error("Logout ritual failed:", err);
                window.location.replace("https://prima-materia.net"); 
            }
        });
    }
});