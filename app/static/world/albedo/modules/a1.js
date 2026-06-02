/* static/world/albedo/modules/a1.js — v24.1 Absolute Lock & Collapse Enforcer */

let allSeeds = [];
let currentPage1 = 1;
let currentPage2 = 1;
const ITEMS_PER_PAGE = 10;

async function initA1() {
    console.log("[CONIUNCTIO] A1 Hub Initializing... (v24.1 Active Lock Enforcer)");
    
    // 1. 기초 데이터 로드 (내부에서 페이지네이션 렌더링까지 전부 수행함)
    await loadSeeds();

    // 🚀 [핵심]: 데이터 무결성 강제 집행 및 붕괴 처리 (Auto-Upgrade & Collapse)
    await ensureDataIntegrity();
}

/**
 * 🛠️ [Integrity Check]: 
 * 데이터가 썩었거나(Legacy), 합성에 사용된 부모 시드가 소멸한 경우 실체를 붕괴시킨다.
 */
async function ensureDataIntegrity() {
    const saved = localStorage.getItem('active_davison');
    
    // 1. 시드 총 개수가 2개 미만인지 확인 ([me]만 남았거나 아예 없는 경우)
    const isInsufficientSeeds = allSeeds.length < 2;
    
    // 2. 현재 생성되어 있는 Davison의 부모 시드가 삭제되어 고아(Orphan)가 되었는지 확인
    let isOrphaned = false;
    if (saved && !isInsufficientSeeds) {
        try {
            const data = JSON.parse(saved);
            if (data.seed1 && data.seed2) {
                // 부모1, 부모2가 현재 로드된 allSeeds 리스트에 존재하는지 검증
                const parent1Exists = allSeeds.some(s => String(s.idx) === String(data.seed1.idx) || s.name === data.seed1.name);
                const parent2Exists = allSeeds.some(s => String(s.idx) === String(data.seed2.idx) || s.name === data.seed2.name);
                
                if (!parent1Exists || !parent2Exists) {
                    isOrphaned = true;
                }
            }
        } catch(e) {}
    }

    // 🚀 [Albedo Collapse]: 재료가 부족하거나, 부모 중 하나라도 소멸했다면 합성 실체를 파괴한다.
    if (isInsufficientSeeds || isOrphaned) {
        if (saved) {
            console.log("[A1] Albedo Collapse: Basis seeds extinguished. Purging Coniunctio...");
            
            // 1. 클라이언트 단의 모든 합성 기록 소멸
            localStorage.removeItem('active_davison');
            localStorage.removeItem('albedo_s1_idx');
            localStorage.removeItem('albedo_s2_idx');
            localStorage.removeItem('albedo_time_locked');
            document.cookie = "active_davison=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            
            // 2. 서버 스테이션 초기화 (빈 객체 전송)
            try {
                await fetch('/api/astro/coagulatio/sync-active', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}) 
                });
            } catch(e) {}

            // 3. stage.html의 락(Coniunctio Missing)을 즉각 발동시키기 위해 페이지 새로고침
            window.location.reload();
        } else {
            updateDavisonPreview(null);
        }
        return;
    }

    if (!saved) return; 

    // --- 기존의 Legacy 데이터 업그레이드 로직 정상 수행 ---
    let data;
    try { data = JSON.parse(saved); } catch (e) { return; }

    const isLegacy = !data.seed1 || !data.seed2;

    if (isLegacy) {
        console.log("[A1] Legacy Data Detected. Auto-upgrading...");
        const s1_idx = localStorage.getItem('albedo_s1_idx');
        const s2_idx = localStorage.getItem('albedo_s2_idx');

        if (s1_idx && s2_idx) {
            await silentManifest(s1_idx, s2_idx);
        } else {
            updateDavisonPreview(null);
        }
    } else {
        updateDavisonPreview(data);
        syncAlbedoToStation(data);
    }
}

/**
 * 🤫 [Silent Manifest]: 사용자 개입 없이 조용히 데이터 갱신
 */
async function silentManifest(idx1, idx2) {
    // 로컬 데이터 대응을 위해 id도 함께 검사
    let p1 = allSeeds.find(s => String(s.idx) === String(idx1) || String(s.id) === String(idx1));
    let p2 = allSeeds.find(s => String(s.idx) === String(idx2) || String(s.id) === String(idx2));

    if (!p1 || !p2) return; 

    // 🚀 [장자우선 (Primogeniture) 강제 정렬]: 배열 내 순서가 뒤처지는 시드가 p1 자리에 왔다면 강제 스왑
    if (allSeeds.indexOf(p1) > allSeeds.indexOf(p2)) {
        [p1, p2] = [p2, p1];
    }

    const isUnknown1 = p1.is_unknown_time || (p1.birth_time && p1.birth_time.includes("Unknown"));
    const isUnknown2 = p2.is_unknown_time || (p2.birth_time && p2.birth_time.includes("Unknown"));
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
            
            updateDavisonPreview(result);
            syncAlbedoToStation(result);
            console.log("[A1] Data Upgraded Successfully (Primogeniture Enforced).");
        }
    } catch (e) { console.error("Silent Manifest Failed:", e); }
}

async function syncAlbedoToStation(data) {
    try {
        await fetch('/api/astro/coagulatio/sync-active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (e) {}
}

async function manifestDavison() {
    const s1 = document.getElementById('seed-selector-1');
    const s2 = document.getElementById('seed-selector-2');
    if (!s1.value || !s2.value) return alert("Select two seeds.");

    let p1 = JSON.parse(s1.options[s1.selectedIndex].dataset.payload);
    let p2 = JSON.parse(s2.options[s2.selectedIndex].dataset.payload);

    // 🚀 [장자우선 (Primogeniture) 강제 정렬]: 현재 데이터의 고유값을 기반으로 배열 내 실제 서열 확인
    const index1 = allSeeds.findIndex(s => s.name === p1.name && s.birth_date === p1.birth_date);
    const index2 = allSeeds.findIndex(s => s.name === p2.name && s.birth_date === p2.birth_date);

    // 만약 p1으로 선택된 시드가 서열상 p2보다 동생(인덱스가 더 큼)이라면 위치를 바꿈
    if (index1 > index2) {
        [p1, p2] = [p2, p1];
    }

    const isUnknown1 = p1.is_unknown_time || (p1.birth_time && p1.birth_time.includes("Unknown"));
    const isUnknown2 = p2.is_unknown_time || (p2.birth_time && p2.birth_time.includes("Unknown"));
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
            
            await syncAlbedoToStation(result); 
            window.location.reload(); 
        }
    } catch (e) { console.error("Manifest Fail:", e); }
}

function updateDavisonPreview(data) {
    const resDiv = document.getElementById('davison-summary'); 
    if (!resDiv) return;
    
    if (data) {
        resDiv.style.color = "#49dce1"; 
        
        const latVal = data.lat !== undefined ? parseFloat(data.lat) : 37.56;
        const lngVal = data.lng !== undefined ? parseFloat(data.lng) : 126.97;
        
        const latDir = latVal >= 0 ? "N" : "S";
        const lngDir = lngVal >= 0 ? "E" : "W";
        
        const tz = parseFloat(data.timezone || 9.0);
        const tzStr = (tz >= 0 ? "+" : "") + tz;

        const details = `${data.birth_date}, ${data.birth_time}; ${Math.abs(latVal).toFixed(2)} ${latDir}, ${Math.abs(lngVal).toFixed(2)} ${lngDir} (UTC${tzStr})`;

        resDiv.innerHTML = `
            <div><strong>${data.name}</strong></div>
            <div>${details}</div>
        `;
    } else {
        resDiv.style.color = "#888";
        resDiv.textContent = "Select seeds to manifest union.";
    }
}

async function loadSeeds() {
    let seeds = [];

    try {
        const meData = localStorage.getItem('tetramegistus.me');
        if (meData) {
            const meSeed = JSON.parse(meData);
            meSeed.idx = 0; 
            meSeed.name = "[me]";
            seeds.push(meSeed);
        }
    } catch (e) { console.warn("[A1] Failed to load [me] seed."); }

    try {
        const response = await fetch('/api/natal/list');
        if (response.ok) {
            const serverSeeds = await response.json();
            seeds = seeds.concat(serverSeeds);
        }
    } catch (e) { console.warn("[A1] Failed to fetch server seeds."); }

    // ─────────────────────────────────────────────────────────
    // 🚀 [System Keys Guard]: 쓰레기 데이터 원천 차단
    // ─────────────────────────────────────────────────────────
    const invalidKeys = [
        "active_seed", "active_davison", "current_seed_idx", 
        "current_seed_text", "session", "session_user_id", "tetramegistus.me",
        "nigredo_time_locked", "albedo_time_locked", "albedo_s1_idx", "albedo_s2_idx"
    ];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("tetramegistus_") || invalidKeys.includes(key)) continue;
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.birth_date && data.birth_time && data.name) {
                data.id = `LOCAL_${key}`; 
                data.name = data.name || key; 
                seeds.push(data);
            }
        } catch(e) {}
    }

    // ─────────────────────────────────────────────────────────
    // 🚀 [Doppelgänger Guard]: "이름+날짜+시간"으로 절대 식별
    // ─────────────────────────────────────────────────────────
    const seenIdentity = new Set();
    const uniqueSeeds = seeds.filter(s => {
        if (!s || !s.name || invalidKeys.includes(s.name)) return false;
        
        // 서버(DB)와 로컬의 데이터가 겹쳐서 분신술을 쓰는 현상 원천 차단
        const identityKey = `${s.name.trim()}_${s.birth_date}_${s.birth_time}`;
        
        if (seenIdentity.has(identityKey)) return false;
        seenIdentity.add(identityKey);
        return true;
    });
    // ─────────────────────────────────────────────────────────

    uniqueSeeds.sort((a, b) => {
        const idxA = (a.idx !== undefined && a.idx !== null) ? Number(a.idx) : 999;
        const idxB = (b.idx !== undefined && b.idx !== null) ? Number(b.idx) : 999;
        return idxA - idxB;
    });

    allSeeds = uniqueSeeds;
    
    // 🚀 [수복]: 불러온 데이터로 두 개의 섹터를 각각 페이지 렌더링
    const s1Val = localStorage.getItem('albedo_s1_idx');
    renderSelector1(s1Val);
    renderSelector2(s1Val);
}

// ─────────────────────────────────────────────────────────
// 🚀 [S1]: 첫 번째 부모 시드 페이지네이션 및 렌더링
// ─────────────────────────────────────────────────────────
function renderSelector1(currentVal) {
    let targetPage = 1;
    if (currentVal) {
        const foundIdx = allSeeds.findIndex(s => String(s.idx !== undefined ? s.idx : s.id) === String(currentVal));
        if (foundIdx !== -1) targetPage = Math.floor(foundIdx / ITEMS_PER_PAGE) + 1;
    }
    currentPage1 = targetPage;
    renderSelector1Page(currentPage1, currentVal);
}

function renderSelector1Page(page, currentVal) {
    const s1 = document.getElementById('seed-selector-1');
    if (!s1) return;

    const start = (page - 1) * ITEMS_PER_PAGE;
    const pageSeeds = allSeeds.slice(start, start + ITEMS_PER_PAGE);

    const isValInPage = pageSeeds.some(s => String(s.idx !== undefined ? s.idx : s.id) === String(currentVal));
    if (!isValInPage && pageSeeds.length > 0 && currentVal) {
        currentVal = pageSeeds[0].idx !== undefined ? pageSeeds[0].idx.toString() : pageSeeds[0].id;
        localStorage.setItem('albedo_s1_idx', currentVal);
    }

    s1.innerHTML = '<option value="" disabled ' + (!currentVal ? 'selected' : '') + '>Select first seed</option>';

    pageSeeds.forEach(s => {
        const opt = document.createElement('option');
        const val = s.idx !== undefined ? s.idx : s.id;
        opt.value = val;
        opt.textContent = s.name;
        opt.dataset.payload = JSON.stringify(s);
        if (String(val) === String(currentVal)) opt.selected = true;
        if (Number(s.idx) === 0 || s.name === "[me]") opt.style.color = "#49dce1";
        s1.appendChild(opt);
    });

    buildPaginationUI1();
}

function changePage1(newPage) {
    const totalPages = Math.ceil(allSeeds.length / ITEMS_PER_PAGE);
    if (newPage < 1 || newPage > totalPages) return;
    currentPage1 = newPage;

    const start = (currentPage1 - 1) * ITEMS_PER_PAGE;
    const firstSeed = allSeeds[start];
    if (!firstSeed) return;

    const newVal = firstSeed.idx !== undefined ? firstSeed.idx.toString() : firstSeed.id;
    localStorage.setItem('albedo_s1_idx', newVal);

    renderSelector1Page(currentPage1, newVal);
    renderSelector2(newVal); // 🚀 [동기화]: S1이 바뀌었으므로 S2의 필터 목록도 재구축!
}

function buildPaginationUI1() {
    const s1 = document.getElementById('seed-selector-1');
    let container = document.getElementById('seed-pagination-1');
    let wrapper = document.getElementById('seed-wrapper-1');

    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'seed-wrapper-1';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '15px';
        wrapper.style.marginBottom = '10px';
        s1.parentNode.insertBefore(wrapper, s1);
        wrapper.appendChild(s1);
        s1.style.marginBottom = '0';
    }

    if (!container) {
        container = document.createElement('div');
        container.id = 'seed-pagination-1';
        container.className = 'a1-pagination';
        wrapper.appendChild(container);
    }

    const totalPages = Math.ceil(allSeeds.length / ITEMS_PER_PAGE);
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    const isF = currentPage1 === 1, isL = currentPage1 === totalPages;

    container.innerHTML = `
        <div class="page-btn ${isF ? 'disabled' : 'active'}" onclick="!${isF} && changePage1(1)">&lt;&lt;</div>
        <div class="page-btn ${isF ? 'disabled' : 'active'}" onclick="!${isF} && changePage1(${currentPage1 - 1})">&lt;</div>
        <div class="page-info">${currentPage1} / ${totalPages}</div>
        <div class="page-btn ${isL ? 'disabled' : 'active'}" onclick="!${isL} && changePage1(${currentPage1 + 1})">&gt;</div>
        <div class="page-btn ${isL ? 'disabled' : 'active'}" onclick="!${isL} && changePage1(${totalPages})">&gt;&gt;</div>
    `;
}

// ─────────────────────────────────────────────────────────
// 🚀 [S2]: S1을 제외한 두 번째 부모 시드 페이지네이션 및 렌더링
// ─────────────────────────────────────────────────────────
function renderSelector2(excludeIdx) {
    const availableForS2 = allSeeds.filter(s => String(s.idx !== undefined ? s.idx : s.id) !== String(excludeIdx));
    let savedS2 = localStorage.getItem('albedo_s2_idx');

    if (savedS2 === String(excludeIdx)) {
        savedS2 = null;
        localStorage.removeItem('albedo_s2_idx');
    }

    let targetPage = 1;
    if (savedS2) {
        const foundIdx = availableForS2.findIndex(s => String(s.idx !== undefined ? s.idx : s.id) === String(savedS2));
        if (foundIdx !== -1) targetPage = Math.floor(foundIdx / ITEMS_PER_PAGE) + 1;
    }
    currentPage2 = targetPage;
    renderSelector2Page(currentPage2, savedS2, availableForS2);
}

function renderSelector2Page(page, currentVal, availableList) {
    const s2 = document.getElementById('seed-selector-2');
    if (!s2) return;

    const start = (page - 1) * ITEMS_PER_PAGE;
    const pageSeeds = availableList.slice(start, start + ITEMS_PER_PAGE);

    const isValInPage = pageSeeds.some(s => String(s.idx !== undefined ? s.idx : s.id) === String(currentVal));
    if (!isValInPage && pageSeeds.length > 0 && currentVal) {
        currentVal = pageSeeds[0].idx !== undefined ? pageSeeds[0].idx.toString() : pageSeeds[0].id;
        localStorage.setItem('albedo_s2_idx', currentVal);
    }

    s2.innerHTML = '<option value="" disabled ' + (!currentVal ? 'selected' : '') + '>Select second seed</option>';

    pageSeeds.forEach(s => {
        const opt = document.createElement('option');
        const val = s.idx !== undefined ? s.idx : s.id;
        opt.value = val;
        opt.textContent = s.name;
        opt.dataset.payload = JSON.stringify(s);
        if (String(val) === String(currentVal)) opt.selected = true;
        if (Number(s.idx) === 0 || s.name === "[me]") opt.style.color = "#49dce1";
        s2.appendChild(opt);
    });

    buildPaginationUI2(availableList);
}

function changePage2(newPage) {
    const excludeIdx = localStorage.getItem('albedo_s1_idx');
    const availableForS2 = allSeeds.filter(s => String(s.idx !== undefined ? s.idx : s.id) !== String(excludeIdx));

    const totalPages = Math.ceil(availableForS2.length / ITEMS_PER_PAGE);
    if (newPage < 1 || newPage > totalPages) return;
    currentPage2 = newPage;

    const start = (currentPage2 - 1) * ITEMS_PER_PAGE;
    const firstSeed = availableForS2[start];
    if (!firstSeed) return;

    const newVal = firstSeed.idx !== undefined ? firstSeed.idx.toString() : firstSeed.id;
    localStorage.setItem('albedo_s2_idx', newVal);

    renderSelector2Page(currentPage2, newVal, availableForS2);
}

function buildPaginationUI2(availableList) {
    const s2 = document.getElementById('seed-selector-2');
    let container = document.getElementById('seed-pagination-2');
    let wrapper = document.getElementById('seed-wrapper-2');

    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'seed-wrapper-2';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '15px';
        s2.parentNode.insertBefore(wrapper, s2);
        wrapper.appendChild(s2);
        s2.style.marginBottom = '0';
    }

    if (!container) {
        container = document.createElement('div');
        container.id = 'seed-pagination-2';
        container.className = 'a1-pagination';
        wrapper.appendChild(container);
    }

    const totalPages = Math.ceil(availableList.length / ITEMS_PER_PAGE);
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    const isF = currentPage2 === 1, isL = currentPage2 === totalPages;

    container.innerHTML = `
        <div class="page-btn ${isF ? 'disabled' : 'active'}" onclick="!${isF} && changePage2(1)">&lt;&lt;</div>
        <div class="page-btn ${isF ? 'disabled' : 'active'}" onclick="!${isF} && changePage2(${currentPage2 - 1})">&lt;</div>
        <div class="page-info">${currentPage2} / ${totalPages}</div>
        <div class="page-btn ${isL ? 'disabled' : 'active'}" onclick="!${isL} && changePage2(${currentPage2 + 1})">&gt;</div>
        <div class="page-btn ${isL ? 'disabled' : 'active'}" onclick="!${isL} && changePage2(${totalPages})">&gt;&gt;</div>
    `;
}

window.handleSeed1Change = function() {
    const val = document.getElementById('seed-selector-1').value;
    localStorage.setItem('albedo_s1_idx', val);
    renderSelector2(val); // 🚀 [필수]: S1 변경 시, S2에서 S1을 제외하고 목록을 다시 그리도록 강제!
}

window.handleSeed2Change = function() {
    localStorage.setItem('albedo_s2_idx', document.getElementById('seed-selector-2').value);
}

window.manifestDavison = manifestDavison;

initA1();