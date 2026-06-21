/* app/static/world/nigredo/modules/n1.js — v16.0 Pagination Integration */

let allUniqueSeeds = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

/**
 * 🔑 [Helper]: 씨앗 텍스트 포맷팅 (N8 벤치마킹 규격)
 */
function formatSeedText(seed) {
    const name = decodeURIComponent(seed.name || "").trim();
    let date = (seed.birth_date || "").trim();
    if (date.includes('-')) {
        const parts = date.split('-');
        if (parts.length === 3) {
            date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
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

    let locDisplay = decodeURIComponent(seed.location || "Unknown").trim();
    
    // 🚀 [수복]: Manual Entry일 때 "위도, 경도" 뒤에 타임존을 안전하게 붙여줍니다.
    if (locDisplay === "Manual Entry" && seed.lat !== undefined) {
        const lat = parseFloat(seed.lat);
        const lng = parseFloat(seed.lng);
        locDisplay = `${Math.abs(lat).toFixed(2)} ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(2)} ${lng >= 0 ? "E" : "W"}`;
        
        // Timezone 값이 존재할 경우에만 덧붙임
        if (seed.timezone !== undefined && seed.timezone !== null && seed.timezone !== "") {
            // DB에 "+9", "9.0", "UTC+9" 등 어떻게 들어있든 숫자만 안전하게 추출
            let tzStr = String(seed.timezone).replace(/[^0-9\.\-]/g, '');
            let tzNum = parseFloat(tzStr);
            
            if (!isNaN(tzNum)) {
                let tzPrefix = tzNum >= 0 ? '+' : '';
                locDisplay += ` (UTC ${tzPrefix}${tzNum})`;
            } else {
                locDisplay += ` (UTC ${seed.timezone})`; // 혹시 모를 예외 문자열 방어
            }
        }
    }
    
    return `${name} — ${date}, ${cleanTime}; ${locDisplay}`;
}

/**
 * 🚀 [Core Logic]: 데이터 동기화 및 선택적 새로고침
 */
async function updateActiveContext(seedData, selectorValue, selectorText, shouldReload = false) {
    if (!seedData) return;

    // --- Nigredo 전용 신호 발송 ---
    const cleanTime = seedData.birth_time || "";
    const isUnknown = seedData.is_unknown_time || (typeof cleanTime === 'string' && cleanTime.toLowerCase().includes("unknown"));
    localStorage.setItem('nigredo_time_locked', isUnknown ? 'true' : 'false');
    // ---------------------------------------------

    localStorage.setItem('active_seed', JSON.stringify(seedData));
    if (selectorValue) localStorage.setItem('current_seed_idx', selectorValue);
    if (selectorText) localStorage.setItem('current_seed_text', selectorText);
    
    try {
        const response = await fetch('/api/astro/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(seedData)
        });

        if (response.ok && shouldReload) {
            window.location.reload(); 
        }
    } catch (e) {
        console.error("[N1] Sync Fail:", e);
    }
}

/**
 * 🔑 [Render]: 리스트 렌더링 및 Albedo 선제 붕괴 (Proactive Collapse)
 */
async function renderSeeds() {
    const selector = document.getElementById('seed-selector');
    if (!selector) return;

    let currentVal = localStorage.getItem('current_seed_idx');

    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/natal/list?t=${timestamp}`);
        const serverSeeds = await response.ok ? await response.json() : [];

        const meSeeds = [];
        try {
            const meData = localStorage.getItem('tetramegistus.me');
            if (meData) {
                const meSeed = JSON.parse(meData);
                meSeed.idx = 0; 
                meSeed.name = "[me]";
                meSeeds.push(meSeed);
            }
        } catch (e) { console.warn("[N1] Failed to load [me] seed."); }

        // ─────────────────────────────────────────────────────────
        // 🚀 [System Keys Guard]: 쓰레기 데이터 원천 차단
        // ─────────────────────────────────────────────────────────
        const invalidKeys = [
            "active_seed", "active_davison", "current_seed_idx", 
            "current_seed_text", "session", "session_user_id", "tetramegistus.me",
            "nigredo_time_locked", "albedo_time_locked", "albedo_s1_idx", "albedo_s2_idx"
        ];

        const localSeeds = [];
        // 🚀 [Airtight Guard]: 현재 세션(로그인) 상태 확인
        const sessionUser = document.cookie.split('; ').find(row => row.startsWith('session_user_id='));

        if (!sessionUser) {
            // 비회원(GUEST)일 때만 기기의 로컬 시드를 수집하여 렌더링
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith("tetramegistus_") || invalidKeys.includes(key)) continue;
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.birth_date && data.birth_time && data.name) {
                        data.id = `LOCAL_${key}`;
                        data.name = data.name || key; 
                        localSeeds.push(data);
                    }
                } catch(e) {}
            }
        } else {
            // 🚀 [Absolute Isolation]: 로그인 상태(Admin 포함)라면 기기의 찌꺼기 시드를 화면에 띄우지 않음.
            // 나아가, 다른 유저의 로컬 데이터가 내 계정을 오염시키는 착시를 막기 위해 기기의 로컬 시드를 즉시 소각(Purge)
            const keysToPurge = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key.startsWith("tetramegistus_") && !invalidKeys.includes(key)) {
                    keysToPurge.push(key);
                }
            }
            keysToPurge.forEach(k => localStorage.removeItem(k));
            console.log("[N1] Session Active: Local mirage seeds purged for absolute isolation.");
        }

        // ─────────────────────────────────────────────────────────
        // 🚀 [Absolute Hierarchy]: 서버 데이터(DB의 진리)를 최우선으로 배치
        // ─────────────────────────────────────────────────────────
        const combined = [...serverSeeds, ...meSeeds, ...localSeeds];
        const seenIdentity = new Set();
        const seenIdx = new Set();
        
        // ─────────────────────────────────────────────────────────
        // 🚀 [Doppelgänger Guard & Absolute Me Protection]
        // 로컬 스토리지의 찌꺼기가 DB 계정 데이터를 오염시키는 것을 원천 차단
        // ─────────────────────────────────────────────────────────
        const uniqueSeeds = combined.filter(s => {
            if (!s || !s.name || invalidKeys.includes(s.name)) return false;
            
            const sName = s.name.trim();

            // 1. ⚓ [me] Absolute Identity Guard (시간 불문 무조건 하나만 허용)
            const isMe = (sName === "[me]" || String(s.idx) === "0");
            if (isMe) {
                // 이미 서버(DB)의 진짜 [me]가 선점했다면, 뒤따라온 로컬의 가짜 [me]는 가차없이 폐기
                if (seenIdentity.has("[me]")) return false; 
                seenIdentity.add("[me]");
                seenIdx.add("0");

                // 🚀 [Logout Anchor Protocol]: 로그인한 계정의 진짜 데이터라면,
                // 로컬 스토리지를 소각하는 대신, 서버의 최신 [me] 데이터로 완벽하게 덮어써서(Bake) 
                // 로그아웃 시 Void로 추락하는 것을 방지하는 안전망(Anchor)으로 만듭니다.
                if (s.user_id && s.user_id !== "GUEST") {
                    const bakedMe = {
                        id: 0, idx: 0, name: "[me]",
                        birth_date: s.birth_date,
                        birth_time: s.birth_time,
                        location: s.location || "Unknown",
                        lat: parseFloat(s.lat) || 0,
                        lng: parseFloat(s.lng) || 0,
                        timezone: s.timezone || "9.0",
                        is_unknown_time: s.is_unknown_time || 0,
                        has_body: 1, is_seed: 1
                    };
                    localStorage.setItem('tetramegistus.me', JSON.stringify(bakedMe));
                    
                    // 🚀 [Soul Integrity]: 로그아웃 후 엔진 밖으로 튕겨나가지 않도록 쿠키 기억도 함께 동기화합니다.
                    document.cookie = `temp_birth_date=${encodeURIComponent(s.birth_date || "")}; path=/; max-age=31536000;`;
                    document.cookie = `temp_birth_time=${encodeURIComponent(s.birth_time || "00:00:00")}; path=/; max-age=31536000;`;
                    document.cookie = `temp_location=${encodeURIComponent(s.location || "Unknown")}; path=/; max-age=31536000;`;
                }
                return true;
            }

            // 2. 일반 시드 도플갱어 방어 (이름+날짜+시간 기반)
            const identityKey = `${sName}_${s.birth_date}_${s.birth_time}`;
            if (seenIdentity.has(identityKey)) return false;

            // 3. 인덱스 충돌 방어 (로컬 찌꺼기가 서버의 고유 idx 자리를 뺏는 것 차단)
            if (s.idx !== undefined && s.idx !== null && String(s.idx) !== "undefined") {
                if (seenIdx.has(String(s.idx))) return false;
                seenIdx.add(String(s.idx));
            }

            seenIdentity.add(identityKey);
            return true;
        });

        uniqueSeeds.sort((a, b) => {
        // ... (기존 sort 로직 유지) ...
            const idxA = (a.idx !== undefined && a.idx !== null) ? Number(a.idx) : 999;
            const idxB = (b.idx !== undefined && b.idx !== null) ? Number(b.idx) : 999;
            return idxA - idxB;
        });

        // ─────────────────────────────────────────────────────────
        // 🚀 Albedo Proactive Collapse (선제 붕괴 로직)
        // ─────────────────────────────────────────────────────────
        const savedDavison = localStorage.getItem('active_davison');
        let shouldCollapse = uniqueSeeds.length < 2;

        if (!shouldCollapse && savedDavison) {
            try {
                const data = JSON.parse(savedDavison);
                if (data.seed1 && data.seed2) {
                    const p1Exists = uniqueSeeds.some(s => String(s.idx) === String(data.seed1.idx) || s.name === data.seed1.name);
                    const p2Exists = uniqueSeeds.some(s => String(s.idx) === String(data.seed2.idx) || s.name === data.seed2.name);
                    if (!p1Exists || !p2Exists) {
                        shouldCollapse = true; 
                    }
                }
            } catch(e) {}
        }

        if (shouldCollapse && savedDavison) {
            console.log("[N1] Proactive Albedo Collapse: Basis seeds extinguished.");
            
            localStorage.removeItem('active_davison');
            localStorage.removeItem('albedo_s1_idx');
            localStorage.removeItem('albedo_s2_idx');
            localStorage.removeItem('albedo_time_locked');
            document.cookie = "active_davison=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            
            fetch('/api/astro/coagulatio/sync-active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) 
            }).catch(() => {});
        }
        // ─────────────────────────────────────────────────────────
        // 🚀 [Pagination]: 데이터 저장 및 목표 페이지 산출
        // ─────────────────────────────────────────────────────────
        allUniqueSeeds = uniqueSeeds;

        let targetPage = 1;
        if (currentVal) {
            const foundIndex = allUniqueSeeds.findIndex(s => String(s.idx !== undefined ? s.idx : s.id) === String(currentVal));
            if (foundIndex !== -1) {
                targetPage = Math.floor(foundIndex / ITEMS_PER_PAGE) + 1;
            }
        }
        currentPage = targetPage;

        renderSeedPage(currentPage, currentVal);

    } catch (err) {
        console.error("[N1] Ritual of Rendering Failed:", err);
    }
}

/**
 * 🚀 지정된 페이지의 10개 아이템만 렌더링
 */
function renderSeedPage(page, currentVal) {
    const selector = document.getElementById('seed-selector');
    if (!selector) return;

    selector.innerHTML = ""; 
    let activePayload = null;
    let activeText = "";

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageSeeds = allUniqueSeeds.slice(start, end);

    const isCurrentValInPage = pageSeeds.some(s => String(s.idx !== undefined ? s.idx : s.id) === String(currentVal));
    if (!isCurrentValInPage && pageSeeds.length > 0) {
        currentVal = pageSeeds[0].idx !== undefined ? pageSeeds[0].idx.toString() : pageSeeds[0].id;
    }

    pageSeeds.forEach(seed => {
        const opt = document.createElement('option');
        const val = seed.idx !== undefined ? seed.idx.toString() : seed.id;
        opt.value = val;
        opt.textContent = formatSeedText(seed);
        opt.dataset.seedPayload = JSON.stringify(seed);
        
        if (String(val) === String(currentVal)) {
            opt.selected = true;
            activePayload = seed;
            activeText = opt.textContent;
        }
        if (Number(seed.idx) === 0 || seed.name === "[me]") opt.style.color = "#7CFF9B";
        selector.appendChild(opt);
    });

    buildPaginationUI();

    if (activePayload) {
        updateActiveContext(activePayload, currentVal, activeText, false);
    }
}

/**
 * 🚀 페이지 전환 로직 (자동 첫 번째 시드 선택 및 동기화)
 */
function changePage(newPage) {
    const totalPages = Math.ceil(allUniqueSeeds.length / ITEMS_PER_PAGE);
    if (newPage < 1 || newPage > totalPages) return;
    
    currentPage = newPage;
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const firstSeedOfPage = allUniqueSeeds[start];
    if (!firstSeedOfPage) return;

    const newVal = firstSeedOfPage.idx !== undefined ? firstSeedOfPage.idx.toString() : firstSeedOfPage.id;
    localStorage.setItem('current_seed_idx', newVal);
    
    renderSeedPage(currentPage, newVal);
}

/**
 * 🚀 CSS 분리형 << < > >> 버튼 동적 생성
 */
function buildPaginationUI() {
    const selector = document.getElementById('seed-selector');
    let container = document.getElementById('seed-pagination');
    let wrapper = document.getElementById('seed-selector-wrapper');
    
    const totalPages = Math.ceil(allUniqueSeeds.length / ITEMS_PER_PAGE);

    // 🚀 [수복]: Select와 Pagination을 가로로 나란히 배치하기 위한 Wrapper 동적 생성
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'seed-selector-wrapper';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '20px'; // 드롭다운과 버튼 사이 간격
        wrapper.style.marginBottom = '20px'; // 원래 셀렉터가 가졌던 하단 여백 대체
        
        // 기존 DOM 위치에 래퍼를 꽂아넣고, 셀렉터를 그 안으로 이동
        selector.parentNode.insertBefore(wrapper, selector);
        wrapper.appendChild(selector);
        
        selector.style.marginBottom = '0'; // 기존 여백 무효화
    }

    if (!container) {
        container = document.createElement('div');
        container.id = 'seed-pagination';
        wrapper.appendChild(container); // 🚀 래퍼의 우측 자식으로 나란히 삽입
    }

    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';

    const isFirst = currentPage === 1;
    const isLast = currentPage === totalPages;

    container.innerHTML = `
        <div id="page-first" class="page-btn ${isFirst ? 'disabled' : 'active'}">&lt;&lt;</div>
        <div id="page-prev" class="page-btn ${isFirst ? 'disabled' : 'active'}">&lt;</div>
        <div class="page-info">${currentPage} / ${totalPages}</div>
        <div id="page-next" class="page-btn ${isLast ? 'disabled' : 'active'}">&gt;</div>
        <div id="page-last" class="page-btn ${isLast ? 'disabled' : 'active'}">&gt;&gt;</div>
    `;

    document.getElementById('page-first').onclick = () => !isFirst && changePage(1);
    document.getElementById('page-prev').onclick = () => !isFirst && changePage(currentPage - 1);
    document.getElementById('page-next').onclick = () => !isLast && changePage(currentPage + 1);
    document.getElementById('page-last').onclick = () => !isLast && changePage(totalPages);
}

/**
 * 🔑 [Event Handler]: 사용자 직접 선택 시
 */
document.getElementById('seed-selector')?.addEventListener('change', async function() {
    const selectedOption = this.options[this.selectedIndex];
    if (!selectedOption) return;

    const selectedText = selectedOption.textContent;
    const seedData = JSON.parse(selectedOption.dataset.seedPayload || "{}");
    
    await updateActiveContext(seedData, this.value, selectedText, true);
});

// ─────────────────────────────────────────────────────────
// 🚀 [Fallback Deletion Protocol]: UI 기반의 소각이 실패할 경우의 보조 수단
// ─────────────────────────────────────────────────────────
window.deleteSeed = async function() {
    const selector = document.getElementById('seed-selector');
    if (!selector || !selector.value) return;

    const val = selector.value;
    const selectedOption = selector.options[selector.selectedIndex];
    const seedData = JSON.parse(selectedOption.dataset.seedPayload || "{}");

    if (String(val) === "0" || seedData.name === "[me]") {
        alert("Anchor [me] cannot be extinguished.");
        return;
    }

    const confirmDelete = confirm(`Are you sure you want to return '${seedData.name}' to the void?`);
    if (!confirmDelete) return;

    try {
        if (String(val).startsWith('LOCAL_')) {
            const localKey = String(val).replace('LOCAL_', '');
            localStorage.removeItem(localKey);
        } else {
            const response = await fetch(`/api/natal/delete/${val}`, { method: 'DELETE' });
            if (!response.ok) throw new Error("Server rejected the purge.");
        }

        localStorage.removeItem('active_seed');
        localStorage.setItem('current_seed_idx', '0');
        localStorage.setItem('current_seed_text', '');
        localStorage.setItem('nigredo_time_locked', 'false');

        window.location.reload(); 

    } catch (e) {
        console.error("[N1] Deletion Failed:", e);
        alert("Failed to extinguish seed.");
    }
};

document.addEventListener("DOMContentLoaded", function() {
    const deleteBtn = document.getElementById('btn-delete-seed') || document.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', window.deleteSeed);
    }
    
    // 🚀 [추가]: 페이지가 켜질 때 아카식 결계 UI도 미리 장전합니다.
    AkashicUI.init();
});

// 시작
renderSeeds();

// ---------------------------------------------------------
// ⚖️ [Lv1: Akashic Records] 진입 결계 프로토콜 (Ctrl + Shift + 5)
// ---------------------------------------------------------
let isAkashicAwaiting = false;
let akashicBuffer = "";
let akashicTimer = null;

const AkashicUI = {
    overlay: null, input: null, label: null, status: null,
    step: 1, codes: { l1: "", em: "", ot: "" },
    uiTimer: null,

    init() {
        // HTML이 없을 경우를 대비해 동적으로 Red Void 테마 껍데기 생성 (CSS 완전 격리)
        if (!document.getElementById('akashic-overlay')) {
            const html = `
            <div id="akashic-overlay" class="ritual-shell-overlay">
                <div class="ritual-shell-box akashic-box">
                    <div id="akashic-title" class="ritual-shell-title akashic-title"></div>
                    <input type="password" id="akashic-input" class="ritual-shell-input akashic-input" autocomplete="off">
                    <div class="ritual-shell-footer">
                        <div id="akashic-status" class="ritual-shell-status akashic-status"></div>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        }

        this.overlay = document.getElementById('akashic-overlay');
        this.input = document.getElementById('akashic-input');
        this.label = document.getElementById('akashic-title');
        this.status = document.getElementById('akashic-status');

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.process();
            if (e.key === 'Escape') this.hide();
        });
    },

    startTimer() {
        if (this.uiTimer) clearTimeout(this.uiTimer);
        this.uiTimer = setTimeout(() => {
            console.warn("[SYSTEM]: The Akashic gateway closed due to hesitation.");
            this.hide(); 
        }, 12000);
    },

    show(l1Key) {
        this.overlay.classList.remove('closing'); 
        this.codes.l1 = l1Key; 
        this.step = 1;
        this.label.innerText = "enter 6-digit code";
        this.input.value = "";
        this.status.innerText = "";
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
                // auth.py에 전역으로 만들어둔 일일 자정코드 검증 로직 재활용
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
                    this.status.innerText = data.message || "The void remains silent.";
                    setTimeout(() => this.hide(), 2000);
                }
            } catch (err) {
                console.error("Verification error:", err);
                this.hide();
            }
        } else {
            this.codes.ot = val;
            if (this.uiTimer) clearTimeout(this.uiTimer);
            this.status.innerText = "verifying akashic resonance...";
            await this.verify();
        }
    },

    async verify() {
        const fd = new FormData();
        fd.append('layer1_key', this.codes.l1);
        fd.append('email_code', this.codes.em);
        fd.append('otp_code', this.codes.ot);

        try {
            // 이전에 auth.py에 만들어둔 Akashic 전용 검증 라우터 호출
            const res = await fetch('/api/auth/unlock-akashic', { method: 'POST', body: fd });
            const data = await res.json();

            if (data.status === 'success') {
                this.status.innerText = "clearance granted. transitioning...";
                this.hide(true); 
                this.triggerAwakening();
            } else {
                this.status.innerText = data.message || "The void remains silent.";
                setTimeout(() => this.hide(), 2000);
            }
        } catch (err) {
            console.error("Ritual failed:", err);
            this.status.innerText = "The void is silent.";
            setTimeout(() => this.hide(), 2000);
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
            this.status.innerText = "";
        }, 2000);
    },

    triggerAwakening() {
        console.log("--- [SYSTEM]: Akashic Records clearance granted. Transitioning... ---");
        
        // 🚀 CSS 클래스로 효과 위임 (인라인 스타일 완전 제거)
        document.body.classList.add('akashic-awakening');
        
        setTimeout(() => {
            document.body.classList.add('dissolve-out');
            setTimeout(() => {
                window.location.href = '/world/nigredo/akashic';
            }, 1200); 
        }, 800);
    }
};

// 🔒 [의식 감지 로직]: Ctrl + Shift + 5 트리거 및 투명창 입력
window.addEventListener('keydown', async (e) => {
    
    if (e.ctrlKey && e.shiftKey && e.code === 'Digit5') {
        e.preventDefault();
        
        isAkashicAwaiting = true;
        akashicBuffer = "";
        if (akashicTimer) clearTimeout(akashicTimer);

        console.log("--- [SYSTEM]: The Red Void is watching. ---");

        akashicTimer = setTimeout(() => {
            if (isAkashicAwaiting) {
                isAkashicAwaiting = false;
                akashicBuffer = "";
                console.warn("[SYSTEM]: The gateway closed due to silence.");
            }
        }, 5000); 
        return;
    }

    if (isAkashicAwaiting) {
        // 숫자키 입력 시 버퍼에 저장
        if (e.key >= '0' && e.key <= '9') {
            akashicBuffer += e.key;
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (akashicTimer) clearTimeout(akashicTimer);
            isAkashicAwaiting = false; 

            // 🚀 [수복 핵심]: 서버 대답을 기다리는 동안 값이 날아가지 않도록 안전한 곳에 백업!
            const currentPin = akashicBuffer;
            akashicBuffer = ""; // 버퍼는 여기서 바로 비워도 안전함

            const fd = new FormData();
            fd.append('pin', currentPin);

            fetch('/api/auth/verify-akashic-layer1', { method: 'POST', body: fd })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        console.log("--- [SYSTEM]: First layer breached. ---");
                        // 🚀 백업해둔 currentPin(0325)을 최종 검증을 위해 온전히 넘겨줍니다.
                        AkashicUI.show(currentPin); 
                    } else {
                        console.warn("--- [SYSTEM]: The Void rejects your offering. ---");
                    }
                })
                .catch(err => {
                    console.warn("--- [SYSTEM]: The Void is silent. ---");
                });
        }
        
        if (e.key === 'Escape') {
            if (akashicTimer) clearTimeout(akashicTimer);
            isAkashicAwaiting = false;
            akashicBuffer = "";
        }
    }
});