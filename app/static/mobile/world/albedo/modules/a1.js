/* static/mobile/world/albedo/modules/a1.js - Core Rendering & PC Sync */

const MobileA1 = {
    state: {
        allSeeds: [],
        currentPage: 1,
        itemsPerPage: 10,
        selectedS1: null,
        selectedS2: null,
        activeSheetTarget: 1 
    },

    async init() {
        this.bindEvents();
        await this.fetchSeeds();
        await this.ensureDataIntegrity();
    },

    getSeedId(seed) {
        if (seed.name === "[me]") return "0";
        if (seed.idx !== undefined && seed.idx !== null && String(seed.idx) !== "0" && String(seed.idx) !== "undefined") return String(seed.idx);
        return String(seed.id);
    },

    bindEvents() {
        document.getElementById('m-s1-trigger')?.addEventListener('click', () => this.openSheet(1));
        document.getElementById('m-s2-trigger')?.addEventListener('click', () => this.openSheet(2));
        document.getElementById('m-list-close')?.addEventListener('click', () => this.closeSheet());
        
        document.getElementById('m-pg-first')?.addEventListener('click', () => this.shiftPage('first'));
        document.getElementById('m-pg-prev')?.addEventListener('click', () => this.shiftPage('prev'));
        document.getElementById('m-pg-next')?.addEventListener('click', () => this.shiftPage('next'));
        document.getElementById('m-pg-last')?.addEventListener('click', () => this.shiftPage('last'));

        document.getElementById('m-btn-manifest')?.addEventListener('click', () => this.manifestDavison());
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
                
                // 🚀 [방어벽 1]: A1 뷰가 열릴 때도 active_seed에 담긴 최신 [me] 정보를 최우선으로 갱신
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

            // 🚀 [핵심 방어벽 2]: N1과 동일하게 배열 병합 순서 교체 (meSeeds 최우선!)
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

            // 🚀 [수복 3]: N1과 동일한 완벽한 시간순 정렬 로직 유지
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
            this.state.selectedS1 = localStorage.getItem('albedo_s1_idx') || null;
            this.state.selectedS2 = localStorage.getItem('albedo_s2_idx') || null;
            
            this.updateUI();

        } catch(e) {
            console.error("[A1] Core fetch failed:", e);
        }
    },

    async ensureDataIntegrity() {
        const saved = localStorage.getItem('active_davison');
        const isInsufficientSeeds = this.state.allSeeds.length < 2;
        
        let isOrphaned = false;
        if (saved && !isInsufficientSeeds) {
            try {
                const data = JSON.parse(saved);
                if (data.seed1 && data.seed2) {
                    const parent1Exists = this.state.allSeeds.some(s => String(s.idx) === String(data.seed1.idx) || s.name === data.seed1.name);
                    const parent2Exists = this.state.allSeeds.some(s => String(s.idx) === String(data.seed2.idx) || s.name === data.seed2.name);
                    if (!parent1Exists || !parent2Exists) isOrphaned = true;
                }
            } catch(e) {}
        }

        if (isInsufficientSeeds || isOrphaned) {
            if (saved) {
                localStorage.removeItem('active_davison');
                localStorage.removeItem('albedo_s1_idx');
                localStorage.removeItem('albedo_s2_idx');
                localStorage.removeItem('albedo_time_locked');
                document.cookie = "active_davison=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                try { await fetch('/api/astro/coagulatio/sync-active', { method: 'POST', body: JSON.stringify({}) }); } catch(e) {}
                window.location.reload();
            } else {
                this.updateDavisonPreview(null);
            }
            return;
        }

        if (!saved) return;
        
        try {
            const data = JSON.parse(saved);
            const isLegacy = !data.seed1 || !data.seed2;
            if (isLegacy) {
                if (this.state.selectedS1 && this.state.selectedS2) {
                    await this.silentManifest(this.state.selectedS1, this.state.selectedS2);
                }
            } else {
                this.updateDavisonPreview(data);
                this.syncAlbedoToStation(data);
            }
        } catch(e) {}
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

    updateUI() {
        const t1 = document.getElementById('m-s1-text');
        const t2 = document.getElementById('m-s2-text');

        const seed1 = this.state.allSeeds.find(s => this.getSeedId(s) === String(this.state.selectedS1));
        const seed2 = this.state.allSeeds.find(s => this.getSeedId(s) === String(this.state.selectedS2));

        if (seed1) {
            const f = this.formatSeedText(seed1);
            t1.innerText = `${f.name} [${f.date}, ${f.time}; ${f.location}]`;
            t1.style.color = (f.name === '[me]') ? "#49dce1" : "#b6f5f8";
        } else {
            t1.innerText = "Select prime anchor...";
            t1.style.color = "#49dce1";
        }

        if (seed2) {
            const f = this.formatSeedText(seed2);
            t2.innerText = `${f.name} [${f.date}, ${f.time}; ${f.location}]`;
            t2.style.color = (f.name === '[me]') ? "#49dce1" : "#b6f5f8";
        } else {
            t2.innerText = seed1 ? "Select second anchor..." : "Waiting for prime anchor...";
            t2.style.color = seed1 ? "#49dce1" : "#555";
        }
    },

    openSheet(targetNum) {
        if (targetNum === 2 && !this.state.selectedS1) {
            alert("Please select the Prime Anchor first.");
            return;
        }
        this.state.activeSheetTarget = targetNum;
        this.state.currentPage = 1;
        
        document.getElementById('m-sheet-title').innerText = targetNum === 1 ? "SELECT PRIME ANCHOR (S1)" : "SELECT SECOND ANCHOR (S2)";
        document.getElementById('m-list-overlay')?.classList.remove('m-hidden');
        this.renderSheet();
    },

    closeSheet() { document.getElementById('m-list-overlay')?.classList.add('m-hidden'); },

    renderSheet() {
        const container = document.getElementById('m-seed-list-container');
        if (!container) return;
        container.innerHTML = '';

        let availableSeeds = this.state.allSeeds;
        if (this.state.activeSheetTarget === 2) {
            availableSeeds = this.state.allSeeds.filter(s => this.getSeedId(s) !== String(this.state.selectedS1));
        }

        const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const pageItems = availableSeeds.slice(start, start + this.state.itemsPerPage);

        if (pageItems.length === 0) {
            container.innerHTML = '<div style="padding:40px; text-align:center; color:#999;">No anchors available.</div>';
            this.updatePaginationUI(availableSeeds.length);
            return;
        }

        const currentSelection = this.state.activeSheetTarget === 1 ? this.state.selectedS1 : this.state.selectedS2;

        pageItems.forEach(seed => {
            const formatted = this.formatSeedText(seed);
            const val = this.getSeedId(seed);
            
            const btn = document.createElement('button');
            btn.className = 'm-seed-item';
            if (String(val) === String(currentSelection)) btn.classList.add('active-selection');

            btn.innerHTML = `
                <span class="m-seed-name" style="${(formatted.name === '[me]') ? 'color: #49dce1;' : ''}">${formatted.name}</span>
                <span class="m-seed-meta">${formatted.date} [${formatted.time}]<br>${formatted.location}</span>
            `;

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.commitSelection(val);
            });
            container.appendChild(btn);
        });

        this.updatePaginationUI(availableSeeds.length);
    },

    updatePaginationUI(totalItems) {
        const total = Math.max(1, Math.ceil(totalItems / this.state.itemsPerPage));
        const infoEl = document.getElementById('m-pg-info');
        if(infoEl) infoEl.innerText = `${this.state.currentPage} / ${total}`;
        
        document.getElementById('m-pg-first').disabled = (this.state.currentPage === 1);
        document.getElementById('m-pg-prev').disabled = (this.state.currentPage === 1);
        document.getElementById('m-pg-next').disabled = (this.state.currentPage === total);
        document.getElementById('m-pg-last').disabled = (this.state.currentPage === total);
    },

    shiftPage(action) {
        let availableSeeds = this.state.allSeeds;
        if (this.state.activeSheetTarget === 2) {
            availableSeeds = this.state.allSeeds.filter(s => this.getSeedId(s) !== String(this.state.selectedS1));
        }
        
        const totalItems = availableSeeds.length;
        const total = Math.max(1, Math.ceil(totalItems / this.state.itemsPerPage));
        
        if (action === 'first') this.state.currentPage = 1;
        else if (action === 'prev') this.state.currentPage = Math.max(1, this.state.currentPage - 1);
        else if (action === 'next') this.state.currentPage = Math.min(total, this.state.currentPage + 1);
        else if (action === 'last') this.state.currentPage = total;
        this.renderSheet();
    },

    commitSelection(val) {
        if (this.state.activeSheetTarget === 1) {
            this.state.selectedS1 = String(val);
            localStorage.setItem('albedo_s1_idx', val);
            if (this.state.selectedS1 === this.state.selectedS2) {
                this.state.selectedS2 = null;
                localStorage.removeItem('albedo_s2_idx');
            }
        } else {
            this.state.selectedS2 = String(val);
            localStorage.setItem('albedo_s2_idx', val);
        }
        this.updateUI();
        this.closeSheet();
    },

    async manifestDavison() {
        if (!this.state.selectedS1 || !this.state.selectedS2) {
            return alert("Two anchors are required to manifest the union.");
        }

        let p1 = this.state.allSeeds.find(s => this.getSeedId(s) === String(this.state.selectedS1));
        let p2 = this.state.allSeeds.find(s => this.getSeedId(s) === String(this.state.selectedS2));

        const index1 = this.state.allSeeds.findIndex(s => s.name === p1.name && s.birth_date === p1.birth_date);
        const index2 = this.state.allSeeds.findIndex(s => s.name === p2.name && s.birth_date === p2.birth_date);

        if (index1 > index2) { [p1, p2] = [p2, p1]; }

        const isUnknown1 = (String(p1.is_unknown_time) === "1" || String(p1.is_unknown_time).toLowerCase() === "true") || (typeof p1.birth_time === 'string' && p1.birth_time.toLowerCase().includes("unknown"));
        const isUnknown2 = (String(p2.is_unknown_time) === "1" || String(p2.is_unknown_time).toLowerCase() === "true") || (typeof p2.birth_time === 'string' && p2.birth_time.toLowerCase().includes("unknown"));
        const isAlbedoLocked = isUnknown1 || isUnknown2;

        try {
            const response = await fetch('/api/astro/davison', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seed1: p1, seed2: p2 })
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.setItem('albedo_time_locked', isAlbedoLocked ? 'true' : 'false');
                localStorage.setItem('active_davison', JSON.stringify(result));
                document.cookie = "active_davison=true; path=/; max-age=31536000"; 
                
                await this.syncAlbedoToStation(result); 
                window.location.reload(); 
            }
        } catch (e) { console.error("Manifest Fail:", e); }
    },

    async silentManifest(idx1, idx2) {
        let p1 = this.state.allSeeds.find(s => this.getSeedId(s) === String(idx1));
        let p2 = this.state.allSeeds.find(s => this.getSeedId(s) === String(idx2));

        if (!p1 || !p2) return; 

        if (this.state.allSeeds.indexOf(p1) > this.state.allSeeds.indexOf(p2)) {
            [p1, p2] = [p2, p1];
        }

        const isUnknown1 = (String(p1.is_unknown_time) === "1" || String(p1.is_unknown_time).toLowerCase() === "true") || (typeof p1.birth_time === 'string' && p1.birth_time.toLowerCase().includes("unknown"));
        const isUnknown2 = (String(p2.is_unknown_time) === "1" || String(p2.is_unknown_time).toLowerCase() === "true") || (typeof p2.birth_time === 'string' && p2.birth_time.toLowerCase().includes("unknown"));
        const isAlbedoLocked = isUnknown1 || isUnknown2;

        try {
            const response = await fetch('/api/astro/davison', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seed1: p1, seed2: p2 })
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.setItem('albedo_time_locked', isAlbedoLocked ? 'true' : 'false');
                localStorage.setItem('active_davison', JSON.stringify(result));
                document.cookie = "active_davison=true; path=/; max-age=31536000"; 
                
                this.updateDavisonPreview(result);
                this.syncAlbedoToStation(result);
            }
        } catch (e) { }
    },

    async syncAlbedoToStation(data) {
        try {
            await fetch('/api/astro/coagulatio/sync-active', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {}
    },

    updateDavisonPreview(data) {
        const resDiv = document.getElementById('m-davison-summary'); 
        if (!resDiv) return;
        
        if (data) {
            resDiv.style.color = "#b6f5f8"; 
            
            const latVal = data.lat !== undefined ? parseFloat(data.lat) : 37.56;
            const lngVal = data.lng !== undefined ? parseFloat(data.lng) : 126.97;
            const latDir = latVal >= 0 ? "N" : "S";
            const lngDir = lngVal >= 0 ? "E" : "W";
            
            const tz = parseFloat(data.timezone || 9.0);
            const tzStr = (tz >= 0 ? "+" : "") + tz;

            const details = `${data.birth_date}, ${data.birth_time}; ${Math.abs(latVal).toFixed(2)} ${latDir}, ${Math.abs(lngVal).toFixed(2)} ${lngDir} (UTC${tzStr})`;

            resDiv.innerHTML = `
                <div style="color: #49dce1; font-weight: bold; margin-bottom: 5px;">${data.name}</div>
                <div>${details}</div>
            `;
        } else {
            resDiv.style.color = "#666";
            resDiv.textContent = "Select two anchors to manifest union.";
        }
    }
};

document.addEventListener('DOMContentLoaded', () => { MobileA1.init(); });