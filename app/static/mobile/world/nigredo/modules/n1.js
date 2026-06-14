/* static/mobile/world/nigredo/modules/n1.js - Core Rendering & PC Sync */

// n1.js 최상단에 추가
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
}

const MobileN1 = {
    state: {
        allSeeds: [],
        currentPage: 1,
        itemsPerPage: 10,
        selectedSeedId: null
    },

    init() {
        this.bindEvents();
        this.syncLocalStorage();
        this.fetchSeeds();
    },

    getSeedId(seed) {
        if (seed.name === "[me]") return "0";
        if (seed.idx !== undefined && seed.idx !== null && String(seed.idx) !== "0" && String(seed.idx) !== "undefined") return String(seed.idx);
        return String(seed.id);
    },

    bindEvents() {
        document.getElementById('m-seed-trigger')?.addEventListener('click', () => this.openSheet());
        document.getElementById('m-list-close')?.addEventListener('click', () => this.closeSheet());

        document.getElementById('m-pg-first')?.addEventListener('click', () => this.shiftPage('first'));
        document.getElementById('m-pg-prev')?.addEventListener('click', () => this.shiftPage('prev'));
        document.getElementById('m-pg-next')?.addEventListener('click', () => this.shiftPage('next'));
        document.getElementById('m-pg-last')?.addEventListener('click', () => this.shiftPage('last'));

        document.getElementById('m-btn-append')?.addEventListener('click', () => location.href = '/world/nigredo/append');
        document.getElementById('m-btn-edit')?.addEventListener('click', () => this.routeToEdit());
        document.getElementById('m-btn-delete')?.addEventListener('click', () => this.executeDelete());
    },

    syncLocalStorage() {
        const cId = localStorage.getItem('current_seed_idx');
        const cTxt = localStorage.getItem('current_seed_text');
        
        // 🚀 [방어벽 1]: [me] 시드(0)도 무조건 로컬 최신값을 즉각 신뢰하도록 예외 조항 제거
        if (cId && cTxt && cId !== "undefined" && cId !== "null") {
            this.state.selectedSeedId = cId;
            const displayEl = document.getElementById('m-selected-seed-text');
            if (displayEl) {
                try { displayEl.innerText = decodeURIComponent(cTxt); } 
                catch(e) { displayEl.innerText = cTxt; }
            }
        } else {
            try {
                let meDataRaw = localStorage.getItem('tetramegistus.me');
                let meSeed;
                if (meDataRaw) {
                    meSeed = JSON.parse(meDataRaw);
                } else {
                    meSeed = {
                        id: 0, idx: 0, name: "[me]",
                        birth_date: "1992-06-01",
                        birth_time: "09:30:00",
                        is_unknown_time: 0,
                        location: "Seoul",
                        lat: 37.5665, lng: 126.9780, timezone: "9.0",
                        has_body: 1, is_seed: 1
                    };
                    localStorage.setItem('tetramegistus.me', JSON.stringify(meSeed));
                }
                meSeed.idx = 0;
                meSeed.name = "[me]";
                this.commitSelection(meSeed, 0, true); 
            } catch (e) {
                console.error("Default ME seed recovery failed.");
            }
        }
    },

    formatSeedText(seed) {
        let name = "Unknown";
        try { name = decodeURIComponent(seed.name || "").trim(); } catch(e) { name = seed.name; }
        
        let date = (seed.birth_date || "").trim();
        if (date.includes('-')) {
            const parts = date.split('-');
            if (parts.length === 3) date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
        
        let cleanTime = seed.birth_time || "";
        if (seed.is_unknown_time || (typeof cleanTime === 'string' && cleanTime.toLowerCase().includes("unknown"))) {
            cleanTime = "Time Unknown";
        } else {
            const t = cleanTime.split(':');
            const hh = t[0] ? t[0].padStart(2, '0') : "00";
            const mm = t[1] ? t[1].padStart(2, '0') : "00";
            const ss = t[2] ? t[2].padStart(2, '0') : "00";
            cleanTime = `${hh}:${mm}:${ss}`;
        }

        let locDisplay = "Unknown";
        try { locDisplay = decodeURIComponent(seed.location || "Unknown").trim(); } catch(e) { locDisplay = seed.location || "Unknown"; }
        
        if (locDisplay === "Manual Entry" && seed.lat !== undefined) {
            const lat = parseFloat(seed.lat);
            const lng = parseFloat(seed.lng);
            locDisplay = `${Math.abs(lat).toFixed(2)} ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(2)} ${lng >= 0 ? "E" : "W"}`;
            
            if (seed.timezone !== undefined && seed.timezone !== null && seed.timezone !== "") {
                let tzStr = String(seed.timezone).replace(/[^0-9\.\-]/g, '');
                let tzNum = parseFloat(tzStr);
                if (!isNaN(tzNum)) {
                    let tzPrefix = tzNum >= 0 ? '+' : '';
                    locDisplay += ` (UTC ${tzPrefix}${tzNum})`;
                } else {
                    locDisplay += ` (UTC ${seed.timezone})`;
                }
            }
        }
        return { name, date, time: cleanTime, location: locDisplay };
    },

    async fetchSeeds() {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/natal/list?t=${timestamp}`);
            const serverSeeds = response.ok ? await response.json() : [];

            const meSeeds = [];
            try {
                let meData = localStorage.getItem('tetramegistus.me');
                let meSeed = meData ? JSON.parse(meData) : null;
                
                // 🚀 [방어벽 2]: Edit 폼에서 수정 후 돌아오면 active_seed가 가장 최신이므로 무조건 신뢰하여 덮어쓰기!
                const activeSeedRaw = localStorage.getItem('active_seed');
                if (activeSeedRaw) {
                    const activeData = JSON.parse(activeSeedRaw);
                    if (activeData.name === '[me]' || String(activeData.idx) === "0") {
                        meSeed = activeData;
                        localStorage.setItem('tetramegistus.me', JSON.stringify(meSeed));
                    }
                }

                if (meSeed) {
                    meSeed.idx = 0; 
                    meSeed.name = "[me]";
                    meSeeds.push(meSeed);
                }
            } catch (e) {}

            const invalidKeys = [
                "active_seed", "active_davison", "current_seed_idx", 
                "current_seed_text", "session", "session_user_id", "tetramegistus.me",
                "nigredo_time_locked", "albedo_time_locked", "albedo_s1_idx", "albedo_s2_idx"
            ];

            const localSeeds = [];
            const cookieMatch = document.cookie.match(/(?:^|; )session_user_id=([^;]+)/);
            const sessionUser = cookieMatch ? decodeURIComponent(cookieMatch[1]).trim() : null;

            if (!sessionUser) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (invalidKeys.includes(key)) continue;
                    
                    if (key.startsWith("tetramegistus_") && !key.startsWith("tetramegistus_seed_")) continue;
                    
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data && data.birth_date && data.birth_time && data.name) {
                            data._localKey = key; 
                            data.id = `LOCAL_${key}`;
                            data.name = data.name || key.replace("tetramegistus_seed_", ""); 
                            localSeeds.push(data);
                        }
                    } catch(e) {}
                }
            } else {
                const keysToPurge = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (!key.startsWith("tetramegistus_") && !invalidKeys.includes(key)) {
                        keysToPurge.push(key);
                    }
                }
                keysToPurge.forEach(k => localStorage.removeItem(k));
            }

            // 🚀 [핵심 방어벽 3]: 배열 병합 순서 교체! (meSeeds가 무조건 맨 앞에 와야 서버의 1992년 [me] 찌꺼기를 밀어내고 이김)
            const combined = [...meSeeds, ...localSeeds, ...serverSeeds];
            
            const seenIdentity = new Set();
            const seenIdx = new Set();
            
            const uniqueSeeds = combined.filter(s => {
                if (!s || !s.name || invalidKeys.includes(s.name)) return false;
                
                const sName = s.name.trim();
                const isMe = (sName === "[me]");
                
                if (isMe) {
                    if (seenIdentity.has("[me]")) return false; 
                    seenIdentity.add("[me]");
                    seenIdx.add("0"); 
                    if (s.user_id && s.user_id !== "GUEST") {
                        localStorage.removeItem('tetramegistus.me');
                    }
                    return true;
                }

                const identityKey = `${sName}_${s.birth_date}_${s.birth_time}`;
                if (seenIdentity.has(identityKey)) return false;

                if (s.idx !== undefined && s.idx !== null && String(s.idx) !== "undefined" && String(s.idx) !== "0") {
                    if (seenIdx.has(String(s.idx))) return false;
                    seenIdx.add(String(s.idx));
                }

                seenIdentity.add(identityKey);
                return true;
            });

            uniqueSeeds.sort((a, b) => {
                if (a.name === '[me]') return -1;
                if (b.name === '[me]') return 1;

                const validIdxA = !isNaN(parseInt(a.idx, 10)) && String(a.idx).length < 10;
                const validIdxB = !isNaN(parseInt(b.idx, 10)) && String(b.idx).length < 10;

                if (validIdxA && validIdxB) return parseInt(a.idx, 10) - parseInt(b.idx, 10);
                if (validIdxA && !validIdxB) return -1; 
                if (!validIdxA && validIdxB) return 1;

                const timeA = parseInt(String(a.id).replace(/[^0-9]/g, '') || "0", 10);
                const timeB = parseInt(String(b.id).replace(/[^0-9]/g, '') || "0", 10);
                
                return timeA - timeB;
            });

            this.state.allSeeds = uniqueSeeds;
            
            if (!this.state.selectedSeedId && this.state.allSeeds.length > 0) {
                document.getElementById('m-selected-seed-text').innerText = "Select Anchor...";
            } else if (this.state.allSeeds.length === 0) {
                document.getElementById('m-selected-seed-text').innerText = "No Anchors Available";
            }

            if (this.state.selectedSeedId) {
                const target = this.state.allSeeds.find(s => this.getSeedId(s) === String(this.state.selectedSeedId));
                if (target) {
                    this.state.currentPage = Math.floor(this.state.allSeeds.indexOf(target) / this.state.itemsPerPage) + 1;

                    const formatted = this.formatSeedText(target);
                    const textToDisplay = `${formatted.name} [${formatted.date}, ${formatted.time}; ${formatted.location}]`;
                    document.getElementById('m-selected-seed-text').innerText = textToDisplay;

                    const cleanTime = target.birth_time || "";
                    const isUnknown = (String(target.is_unknown_time) === "1" || String(target.is_unknown_time).toLowerCase() === "true") || (typeof cleanTime === 'string' && cleanTime.toLowerCase().includes("unknown"));
                    localStorage.setItem('nigredo_time_locked', isUnknown ? 'true' : 'false');

                    localStorage.setItem('active_seed', JSON.stringify(target));
                    localStorage.setItem('current_seed_text', encodeURIComponent(textToDisplay));
                    
                    if (String(this.state.selectedSeedId) === "0" || target.name === "[me]") {
                        localStorage.setItem('tetramegistus.me', JSON.stringify(target));
                    }
                    
                    try {
                        fetch('/api/astro/check-in', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(target)
                        });
                    } catch(e) {}
                }
            }

        } catch(e) {
            console.error("[N1] Core fetch failed:", e);
        }
    },

    openSheet() {
        document.getElementById('m-list-overlay')?.classList.remove('m-hidden');
        this.renderSheet();
    },

    closeSheet() {
        document.getElementById('m-list-overlay')?.classList.add('m-hidden');
    },

    renderSheet() {
        const container = document.getElementById('m-seed-list-container');
        if (!container) return;
        container.innerHTML = '';

        const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const pageItems = this.state.allSeeds.slice(start, start + this.state.itemsPerPage);

        if (pageItems.length === 0) {
            container.innerHTML = '<div style="padding:40px; text-align:center; color:#999;">No anchors found.</div>';
            this.updatePaginationUI();
            return;
        }

        pageItems.forEach(seed => {
            const formatted = this.formatSeedText(seed);
            const val = this.getSeedId(seed);
            
            const btn = document.createElement('button');
            btn.className = 'm-seed-item';
            if (String(val) === String(this.state.selectedSeedId)) btn.classList.add('active-selection');

            btn.innerHTML = `
                <span class="m-seed-name" style="${(formatted.name === '[me]') ? 'color: #7CFF9B;' : ''}">${formatted.name}</span>
                <span class="m-seed-meta">${formatted.date} [${formatted.time}]<br>${formatted.location}</span>
            `;

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.commitSelection(seed, val);
            });
            container.appendChild(btn);
        });

        this.updatePaginationUI();
    },

    updatePaginationUI() {
        const total = Math.max(1, Math.ceil(this.state.allSeeds.length / this.state.itemsPerPage));
        const infoEl = document.getElementById('m-pg-info');
        if(infoEl) infoEl.innerText = `${this.state.currentPage} / ${total}`;
        
        document.getElementById('m-pg-first').disabled = (this.state.currentPage === 1);
        document.getElementById('m-pg-prev').disabled = (this.state.currentPage === 1);
        document.getElementById('m-pg-next').disabled = (this.state.currentPage === total);
        document.getElementById('m-pg-last').disabled = (this.state.currentPage === total);
    },

    shiftPage(action) {
        const total = Math.max(1, Math.ceil(this.state.allSeeds.length / this.state.itemsPerPage));
        if (action === 'first') this.state.currentPage = 1;
        else if (action === 'prev') this.state.currentPage = Math.max(1, this.state.currentPage - 1);
        else if (action === 'next') this.state.currentPage = Math.min(total, this.state.currentPage + 1);
        else if (action === 'last') this.state.currentPage = total;
        this.renderSheet();
    },

    async commitSelection(seed, val, skipReload = false) {
        this.state.selectedSeedId = String(val);
        
        const formatted = this.formatSeedText(seed);
        const textToDisplay = `${formatted.name} [${formatted.date}, ${formatted.time}; ${formatted.location}]`;
        
        document.getElementById('m-selected-seed-text').innerText = textToDisplay;

        const cleanTime = seed.birth_time || "";
        const isUnknown = (String(seed.is_unknown_time) === "1" || String(seed.is_unknown_time).toLowerCase() === "true") || (typeof cleanTime === 'string' && cleanTime.toLowerCase().includes("unknown"));
        
        localStorage.setItem('nigredo_time_locked', isUnknown ? 'true' : 'false');
        localStorage.setItem('active_seed', JSON.stringify(seed));
        localStorage.setItem('current_seed_idx', String(val));
        localStorage.setItem('current_seed_text', encodeURIComponent(textToDisplay));

        try {
            await fetch('/api/astro/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(seed)
            });
        } catch(e) {}

        this.closeSheet();
        
        if (!skipReload) {
            window.location.reload();
        }
    },

    routeToEdit() {
        if (!this.state.selectedSeedId) { alert("Please select an anchor first."); return; }
        location.href = `/world/nigredo/edit?id=${this.state.selectedSeedId}`;
    },

    async executeDelete() {
        if (!this.state.selectedSeedId) { alert("No anchor selected."); return; }
        
        const targetSeed = this.state.allSeeds.find(s => this.getSeedId(s) === String(this.state.selectedSeedId));
        if (String(this.state.selectedSeedId) === "0" || (targetSeed && targetSeed.name === "[me]")) {
            alert("Anchor [me] cannot be extinguished.");
            return;
        }

        if (confirm(`Are you sure you want to return '${targetSeed ? targetSeed.name : 'this anchor'}' to the void?`)) {
            try {
                if (targetSeed && targetSeed._localKey) {
                    localStorage.removeItem(targetSeed._localKey);
                } 
                else if (String(this.state.selectedSeedId).startsWith('LOCAL_')) {
                    const localKey = String(this.state.selectedSeedId).replace('LOCAL_', '');
                    localStorage.removeItem(localKey);
                } else {
                    const res = await fetch(`/api/natal/delete/${this.state.selectedSeedId}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error("Server rejected the purge.");
                }

                localStorage.removeItem('active_seed');
                localStorage.setItem('current_seed_idx', '0');
                localStorage.setItem('current_seed_text', '');
                localStorage.setItem('nigredo_time_locked', 'false');

                alert("Extinguished successfully.");
                location.reload();
            } catch(e) {
                console.error("Delete failed:", e);
                alert("Failed to extinguish seed.");
            }
        }
    }
};

// ==========================================
// 💀 [God Mode 모바일 터치 트리거 프로토콜]
// ==========================================

let materiaTap = 0;
let akashicSilenceTimer = null;

document.addEventListener('touchstart', (e) => {
    if (akashicSilenceTimer) {
        clearTimeout(akashicSilenceTimer);
        akashicSilenceTimer = null;
    }

    const target = e.target;
    const isTitle = target.closest('.m-materia-title');

    if (isTitle) {
        materiaTap++;
        if (materiaTap > 5) materiaTap = 1;
    } else {
        materiaTap = 0; 
    }
});

document.addEventListener('touchend', () => {
    if (materiaTap === 5) {
        akashicSilenceTimer = setTimeout(() => {
            AkashicRitual.showLayer1();
            materiaTap = 0; 
        }, 4000); 
    }
});

const AkashicRitual = {
    overlay: null, input: null, label: null,
    step: 0, codes: { l1: "", em: "", ot: "" }, 
    uiTimer: null,

    init() {
        this.injectHTML();
    },

    injectHTML() {
        if (document.getElementById('akashic-overlay')) return;
        
        const html = `
        <div id="akashic-overlay" class="akashic-shell-overlay">
            <div class="akashic-shell-box">
                <div id="akashic-label" class="akashic-shell-title">awaiting protocol...</div>
                <input type="password" id="akashic-input" class="akashic-shell-input" autocomplete="off" spellcheck="false">
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);

        this.overlay = document.getElementById('akashic-overlay');
        this.input = document.getElementById('akashic-input');
        this.label = document.getElementById('akashic-label');

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
        this.input.type = "password"; 
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
            fd.append('pin', val); 
            try {
                const res = await fetch('/api/auth/verify-akashic-layer1', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.status === 'success') {
                    this.codes.l1 = val; 
                    this.step = 1;
                    this.label.innerText = "enter 6-digit code";
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
            const res = await fetch('/api/auth/unlock-akashic', { method: 'POST', body: fd });
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
        document.body.style.boxShadow = "inset 0 0 100px rgba(255, 60, 60, 0.15)";
        
        setTimeout(() => {
            document.body.classList.add('dissolve-out');
            setTimeout(() => {
                window.location.href = '/world/nigredo/akashic';
            }, 1200); 
        }, 800);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        MobileN1.init();
        AkashicRitual.init();
    });
} else {
    MobileN1.init();
    AkashicRitual.init();
}