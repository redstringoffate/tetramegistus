// static/mobile/world/citrinitas/modules/c2.js

const C2 = {
    state: { ritual: null },
    entryTime: 0, 

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
        
        this.sendDurationPulse();
        
        const url = new URL(window.location.href);
        url.searchParams.set('ritual', ritualName);
        window.history.pushState({}, '', url);
        
        this.state.ritual = ritualName;
        this.syncUI();
        this.loadRitual();
    },

    syncUI() {
        document.querySelectorAll('.m-ritual-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ritual === this.state.ritual);
        });
    },

    async loadRitual() {
        if (!this.state.ritual) return; 

        const sanctum = document.getElementById('ritual-sanctum');
        sanctum.innerHTML = `<div style="color: rgba(73,220,225,0.5); font-size: 0.8rem; font-style: italic; text-align: center; margin-top: 20px;">Initiating Ritual ${this.state.ritual.toUpperCase()}...</div>`;
        
        const moduleName = `C2_${this.state.ritual.toUpperCase()}`;
        console.log(`[Omniscience Mobile] Manually sending pulse for: ${moduleName}`);
        
        fetch('/api/godmode/pulse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: moduleName, duration: 0 }) 
        }).catch(e => console.log('Traffic pulse failed', e));

        this.entryTime = Date.now();

        try {
            // HTML 렌더링 요청 (Python 라우터가 mobile 경로로 자동 우회시켜줌)
            const res = await fetch(`/world/citrinitas/modules/c2_${this.state.ritual}?t=${new Date().getTime()}`);
            if (!res.ok) throw new Error("Ritual Blocked");
            const html = await res.text();
            sanctum.innerHTML = html;
            
            // 🚀 모바일 전용 JS 스크립트 강제 주입
            const scriptId = `script-m-c2-${this.state.ritual}`;
            const oldScript = document.getElementById(scriptId);
            if (oldScript) oldScript.remove(); 

            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `/static/mobile/world/citrinitas/modules/c2_${this.state.ritual}.js?t=${new Date().getTime()}`;
            
            script.onload = () => {
                console.log(`[C2 ROUTER Mobile] ${this.state.ritual}.js Module successfully loaded and ignited.`);
                if (this.state.ritual === 'aleph' && typeof window.initC2Aleph === 'function') window.initC2Aleph();
                else if (this.state.ritual === 'mem' && typeof window.initC2Mem === 'function') window.initC2Mem();
                else if (this.state.ritual === 'shin' && typeof window.initC2Shin === 'function') window.initC2Shin();
            };

            script.onerror = () => { console.error(`[C2 ROUTER] Failed to load c2_${this.state.ritual}.js`); };
            document.body.appendChild(script); 
            
        } catch (e) {
            sanctum.innerHTML = `<div style="color: #ff4444; text-align:center;">[ERROR] Failed to load ${this.state.ritual}</div>`;
            console.error(e);
        }
    },

    sendDurationPulse() {
        if (!this.state.ritual || !this.entryTime) return;

        const durationSec = Math.floor((Date.now() - this.entryTime) / 1000);
        if (durationSec <= 0) return; 

        const moduleName = `C2_${this.state.ritual.toUpperCase()}`;
        fetch('/api/godmode/pulse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true, 
            body: JSON.stringify({ module: moduleName, duration: durationSec })
        }).catch(e => console.log('Duration pulse failed', e));

        this.entryTime = 0; 
    }
};

document.addEventListener('DOMContentLoaded', () => C2.init());

window.addEventListener('beforeunload', () => {
    C2.sendDurationPulse();
});