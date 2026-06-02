// app/static/world/citrinitas/modules/c2.js

const C2 = {
    state: { ritual: null },
    entryTime: 0, // 🚀 서브모듈 전용 체류 시간(스톱워치) 변수

    init() {
        const params = new URLSearchParams(window.location.search);
        const ritualParam = params.get('ritual');
        
        if (ritualParam && ['aleph', 'mem', 'shin'].includes(ritualParam)) {
            this.state.ritual = ritualParam;
            this.syncUI();
            this.loadRitual();
        } else {
            this.syncUI();
        }
    },

    selectRitual(ritualName) {
        if (this.state.ritual === ritualName) return; 
        
        // 🚀 다른 서브모듈로 넘어가기 직전, 기존에 머물던 모듈의 시간을 정산해서 서버로 핑을 쏩니다.
        this.sendDurationPulse();
        
        const url = new URL(window.location.href);
        url.searchParams.set('ritual', ritualName);
        window.history.pushState({}, '', url);
        
        this.state.ritual = ritualName;
        this.syncUI();
        this.loadRitual();
    },

    syncUI() {
        document.querySelectorAll('.ritual-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ritual === this.state.ritual);
        });
    },

    async loadRitual() {
        if (!this.state.ritual) return; 

        const sanctum = document.getElementById('ritual-sanctum');
        sanctum.innerHTML = `<div style="color: rgba(60,255,143,0.5); font-style: italic;">Initiating Ritual ${this.state.ritual.toUpperCase()}...</div>`;
        
        // 🚀 [추가] 서브모듈(SPA) 방문 시 수동으로 트래픽 핑(Pulse) 발송
        const moduleName = `C2_${this.state.ritual.toUpperCase()}`;
        console.log(`[Omniscience] Manually sending pulse for: ${moduleName}`);
        
        fetch('/api/godmode/pulse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                module: moduleName, 
                duration: 0  // 방문 횟수 +1
            }) 
        }).catch(e => console.log('Traffic pulse failed', e));

        // 🚀 모듈 진입 완료! 스톱워치 측정 시작
        this.entryTime = Date.now();

        try {
            // 1. HTML 구조(껍데기) 로드 및 주입
            const res = await fetch(`/world/citrinitas/modules/c2_${this.state.ritual}?t=${new Date().getTime()}`);
            if (!res.ok) throw new Error("Ritual Blocked");
            const html = await res.text();
            sanctum.innerHTML = html;
            
            // 🚀 2. 핵심: innerHTML로 무시된 JavaScript를 수동으로 강제 주입하여 실행
            const scriptId = `script-c2-${this.state.ritual}`;
            const oldScript = document.getElementById(scriptId);
            if (oldScript) oldScript.remove(); // 다른 탭 갔다 왔을 때 중복 실행 방지

            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `/static/world/citrinitas/modules/c2_${this.state.ritual}.js?t=${new Date().getTime()}`;
            
            script.onload = () => {
                console.log(`[C2 ROUTER] ${this.state.ritual}.js Module successfully loaded and ignited.`);
                
                // Aleph 모듈 초기화
                if (this.state.ritual === 'aleph' && typeof window.initC2Aleph === 'function') {
                    window.initC2Aleph();
                }
                // Mem 모듈 초기화
                else if (this.state.ritual === 'mem' && typeof window.initC2Mem === 'function') {
                    window.initC2Mem();
                }
                // 🚀 추가: Shin 모듈 초기화
                else if (this.state.ritual === 'shin' && typeof window.initC2Shin === 'function') {
                    window.initC2Shin();
                }
            };

            script.onerror = () => {
                console.error(`[C2 ROUTER] Failed to load c2_${this.state.ritual}.js`);
            };

            document.body.appendChild(script); // 이 순간 스크립트가 실행됨
            
        } catch (e) {
            sanctum.innerHTML = `<div style="color: red;">[ERROR] Failed to load ${this.state.ritual}</div>`;
            console.error(e);
        }
    },

    // 🚀 체류 시간 정산 및 발송 함수
    sendDurationPulse() {
        if (!this.state.ritual || !this.entryTime) return;

        const durationSec = Math.floor((Date.now() - this.entryTime) / 1000);
        if (durationSec <= 0) return; // 1초 미만 광속 이탈은 무시

        const moduleName = `C2_${this.state.ritual.toUpperCase()}`;
        console.log(`[Omniscience] Sub-module closed. Sending duration: ${durationSec}s for ${moduleName}`);

        // 🚀 keepalive: true 옵션이 핵심! 페이지가 닫히거나 튕겨도 브라우저가 끝까지 서버로 데이터를 밀어 넣음
        fetch('/api/godmode/pulse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true, 
            body: JSON.stringify({
                module: moduleName,
                duration: durationSec
            })
        }).catch(e => console.log('Duration pulse failed', e));

        this.entryTime = 0; // 정산 완료 후 타이머 리셋
    }
};

document.addEventListener('DOMContentLoaded', () => C2.init());

// 🚀 사용자가 탭을 전환하지 않고 C2 페이지 자체를 꺼버리거나 뒤로 가기를 눌렀을 때를 대비한 방어 로직
window.addEventListener('beforeunload', () => {
    C2.sendDurationPulse();
});