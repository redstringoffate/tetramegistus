/* app/static/world/nigredo/modules/akashic.js */

const Akashic = {
    allSouls: [],
    currentPage: 1,
    perPage: 20,
    targetSoul: null,
    mouseX: 0,
    mouseY: 0,
    // 🚀 [수복]: 의식 제한시간 관리를 위한 타임아웃 홀더 배치
    emailTimer: null,
    otpTimer: null,

    async init() {
        this.bindEvents();
        await this.fetchSouls();
    },

    bindEvents() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            const tt = document.getElementById('seed-tooltip');
            if (tt && tt.style.display === 'block') {
                tt.style.left = (e.clientX + 15) + 'px';
                tt.style.top = (e.clientY + 15) + 'px';
            }
        });

        // 🚀 [모바일 대응]: 폰에서 화면의 빈 공간을 터치하면 열려있던 툴팁 즉시 소멸
        document.addEventListener('touchstart', (e) => {
            if (!e.target.closest('.soul-id') && !e.target.closest('#seed-tooltip')) {
                this.hideSeedTooltip();
            }
        });
    },

    async fetchSouls() {
        try {
            const res = await fetch('/api/godmode/akashic/souls');
            this.allSouls = await res.json();
            this.render();
        } catch (e) { console.error("Soul retrieval failed."); }
    },

    render() {
        const list = document.getElementById('soul-list');
        list.innerHTML = "";
        const start = (this.currentPage - 1) * this.perPage;
        this.allSouls.slice(start, start + this.perPage).forEach(soul => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="soul-id" onmouseover="Akashic.showSeedTooltip(event, '${soul.email}')" onmouseleave="Akashic.hideSeedTooltip()">${soul.email}</span></td>
                <td class="soul-time">${this.formatTime(soul.created_at)}</td>
                <td class="soul-time">${this.formatTime(soul.last_login)}</td>
                <td><button class="purge-trigger" onclick="Akashic.startPurgeRitual('${soul.email}')">x</button></td>
            `;
            list.appendChild(row);
        });
        this.renderPagination();
    },

    formatTime(ts) {
        if (!ts || ts === "---") return "---";
        try {
            const parts = ts.split(' ');
            if (parts.length === 2) {
                const dateParts = parts[0].split('-');
                const timeParts = parts[1].split(':');
                if (dateParts.length === 3 && timeParts.length >= 2) {
                    const yy = dateParts[0].slice(2);
                    const mm = dateParts[1].padStart(2, '0');
                    const dd = dateParts[2].padStart(2, '0');
                    const hh = timeParts[0].padStart(2, '0');
                    const min = timeParts[1].padStart(2, '0');
                    return `${yy}.${mm}.${dd}. ${hh}:${min}`;
                }
            }
        } catch (e) {
            console.error("[Akashic Core] Temporal alignment failure:", e);
        }
        return ts;
    },

    renderPagination() {
        const total = Math.ceil(this.allSouls.length / this.perPage);
        const container = document.getElementById('pagination');
        if (total <= 1) { container.innerHTML = ""; return; }
        const isF = this.currentPage === 1, isL = this.currentPage === total;
        container.innerHTML = `
            <div class="pg-btn ${isF ? 'disabled' : ''}" onclick="!${isF} && Akashic.goToPage(1)">&lt;&lt;</div>
            <div class="pg-btn ${isF ? 'disabled' : ''}" onclick="!${isF} && Akashic.goToPage(${this.currentPage-1})">&lt;</div>
            <div class="pg-info">${this.currentPage} / ${total}</div>
            <div class="pg-btn ${isL ? 'disabled' : ''}" onclick="!${isL} && Akashic.goToPage(${this.currentPage+1})">&gt;</div>
            <div class="pg-btn ${isL ? 'disabled' : ''}" onclick="!${isL} && Akashic.goToPage(${total})">&gt;&gt;</div>
        `;
    },

    goToPage(p) { this.currentPage = p; this.render(); },

    async showSeedTooltip(e, email) {
        const tt = document.getElementById('seed-tooltip');
        
        const startX = e.clientX + 15;
        const startY = e.clientY + 15;

        try {
            const res = await fetch(`/api/godmode/akashic/seed/${encodeURIComponent(email)}`);
            const s = await res.json();
            
            if (s.error) {
                tt.innerHTML = `
                    <div class="tooltip-header">Soul Seed Origin (${email})</div>
                    <div class="tooltip-row"><span class="tooltip-label" style="color:#ff4b4b;">[Origin Lost in the Void]</span></div>
                `;
            } else {
                // 🚀 [수복 2]: Emergence와 Spatial 통합 및 Timezone 출력 (N1 규격 이식)
                let locDisplay = (s.location || "Unknown").trim();
                
                if (locDisplay === "Manual Entry" && s.lat !== null && s.lat !== undefined) {
                    const lat = parseFloat(s.lat);
                    const lng = parseFloat(s.lng);
                    locDisplay = `${Math.abs(lat).toFixed(2)} ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(2)} ${lng >= 0 ? "E" : "W"}`;
                    
                    if (s.timezone !== undefined && s.timezone !== null && s.timezone !== "") {
                        let tzStr = String(s.timezone).replace(/[^0-9\.\-]/g, '');
                        let tzNum = parseFloat(tzStr);
                        if (!isNaN(tzNum)) {
                            let tzPrefix = tzNum >= 0 ? '+' : '';
                            locDisplay += ` (UTC ${tzPrefix}${tzNum})`;
                        } else {
                            locDisplay += ` (UTC ${s.timezone})`; 
                        }
                    }
                }

                tt.innerHTML = `
                    <div class="tooltip-header">Soul Seed Origin (${email})</div>
                    <div class="tooltip-row"><span class="tooltip-label">Arrival:</span><span>${s.birth_date || 'Unknown'}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Incarnation:</span><span>${s.birth_time || 'Unknown'}</span></div>
                    <div class="tooltip-row"><span class="tooltip-label">Emergence:</span><span>${locDisplay}</span></div>
                `;
            }
            
            // 🚀 렌더링 직전에 기억해둔 마우스 좌표를 강제로 주입 후 블록 처리
            tt.style.left = startX + 'px';
            tt.style.top = startY + 'px';
            tt.style.display = 'block';
            
        } catch (err) {
            console.error("Tooltip failed:", err);
        }
    },
    
    hideSeedTooltip() { document.getElementById('seed-tooltip').style.display = 'none'; },

    startPurgeRitual(email) { this.targetSoul = email; document.getElementById('ritual-step1').style.display = 'flex'; },
    closeRitual() { 
        this.targetSoul = null; 
        // 🚀 [수복]: 의식 해제 시 가동 중이던 모든 타이머를 흔적도 없이 파괴
        if (this.emailTimer) clearTimeout(this.emailTimer);
        if (this.otpTimer) clearTimeout(this.otpTimer);
        this.emailTimer = null;
        this.otpTimer = null;
        
        document.querySelectorAll('.ritual-overlay').forEach(el => el.style.display = 'none'); 
    },
    proceedToStep2() { 
        document.getElementById('ritual-step1').style.display = 'none'; 
        document.getElementById('ritual-step2').style.display = 'flex'; 
        
        const nameInp = document.getElementById('true-name-input');
        nameInp.value = "";
        nameInp.focus(); 

        // 🚀 [수복]: 2단계 진명 입력 구간 — 1분(60초) 제한시간 즉시 가동
        if (this.emailTimer) clearTimeout(this.emailTimer);
        this.emailTimer = setTimeout(() => {
            console.warn("[SYSTEM]: True name unmasking protocol expired (60s timeout).");
            this.closeRitual();
        }, 60000);
    },

    checkTrueName(e) {
        if (e.key === 'Enter') {
            if (e.target.value.trim() === this.targetSoul) {
                // 🚀 [수복]: 이메일 인증 통과 시 1분 타이머 정지
                if (this.emailTimer) clearTimeout(this.emailTimer);
                this.emailTimer = null;

                document.getElementById('ritual-step2').style.display = 'none';
                document.getElementById('ritual-step3').style.display = 'flex';
                
                const otpInp = document.getElementById('otp-input');
                otpInp.value = "";
                otpInp.focus();

                // 🚀 [수복]: 3단계 최종 봉인 구간 — 15초 제한시간 즉시 가동
                if (this.otpTimer) clearTimeout(this.otpTimer);
                this.otpTimer = setTimeout(() => {
                    console.warn("[SYSTEM]: OTP authorization expired (15s timeout).");
                    this.closeRitual();
                }, 15000);
            } else { 
                // 🚀 [수복]: 진명 오타 혹은 불일치 즉시 의식 취소 및 결계 폭파
                console.warn("[SYSTEM]: True name mismatch. Purge sequence aborted.");
                this.closeRitual(); 
            }
        }
    },

    async finalizePurge(e) {
        if (e.key === 'Enter') {
            const fd = new FormData();
            fd.append('target_email', this.targetSoul);
            fd.append('otp_code', e.target.value.trim());
            const res = await fetch('/api/godmode/akashic/purge', { method: 'POST', body: fd });
            const data = await res.json();
            alert(data.message);
            if (data.status === 'success') location.reload();
            else this.closeRitual();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Akashic.init());