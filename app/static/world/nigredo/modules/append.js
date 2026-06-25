/* app/static/world/nigredo/modules/append.js — v13.1 Timezone Enforced */

let pendingLocation = null;
let cities = {};
let manualOpen = false;
let activeIndex = -1, currentResults = [];
const tooltip = document.getElementById("sign-tooltip");

// 🔑 Cookie Engine
function setCookie(name, value, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// 🔑 Numeric Limits (90/180/4)
function setupNumeric(id, min, max, digits) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
        if (digits) el.value = el.value.replace(/\D/g, "").slice(0, digits);
        else {
            let v = parseInt(el.value || "0", 10);
            el.value = isNaN(v) ? "" : Math.max(min, Math.min(max, v));
        }
    });
}

// 🔑 Helpers
function resetManualFields() {
    document.getElementById("lat-int").value = ""; 
    document.getElementById("lat-dec").value = "";
    document.getElementById("lon-int").value = ""; 
    document.getElementById("lon-dec").value = "";
}

function resetCityFields() {
    document.getElementById("city-search").value = "";
    document.getElementById("city-results").innerHTML = "";
    activeIndex = -1; 
    currentResults = [];
}

// 🔑 [v10 수복]: 비회원용 순차 인덱스 계산기
// 🔑 [v14.1 수복]: 비회원용 '장자우선' 순차 인덱스 계산기 (Airtight Version)
function getNextLocalIndex() {
    let maxIdx = 0;
    
    // 🛡️ 인덱스 계산에서 제외해야 할 시스템 예약 키들
    const systemKeys = [
        "session", "session_user_id", "active_davison", 
        "active_seed", "tetramegistus.me", "has_companion"
    ];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // 1. 세션 정보, 합성 데이터, 임시/설정값(temp_, albedo_)은 무시합니다.
        if (systemKeys.includes(key) || key.startsWith("temp_") || key.startsWith("albedo_")) continue;
        
        try {
            const data = JSON.parse(localStorage.getItem(key));
            
            // 🔑 [수복 핵심]: idx가 존재하고 '숫자'인 경우에만 최대값 계산에 포함합니다.
            // 이를 통해 'DAVISON' 같은 문자열 인덱스에 의한 산술 오염을 원천 차단합니다.
            if (data && typeof data.idx === 'number') {
                maxIdx = Math.max(maxIdx, data.idx);
            }
        } catch(e) {
            // 시드가 아닌 일반 문자열 데이터는 파싱 에러가 나므로 자연스럽게 스킵됩니다.
        }
    }
    
    // 🏛️ 가장 큰 번호에 +1을 하여 '장자우선' 계보를 잇습니다.
    return maxIdx + 1;
}

// 🔑 UI Functions
function renderResults() {
    const resDiv = document.getElementById("city-results");
    resDiv.innerHTML = "";
    currentResults.forEach((c, i) => {
        const div = document.createElement("div");
        div.className = `city-item ${i === activeIndex ? "active" : ""}`; 
        div.textContent = c.label;
        div.onclick = () => selectCity(i);
        resDiv.appendChild(div);
    });
}

function selectCity(index) {
    const d = currentResults[index];
    if (!d) return;

    // 🔑 [수복]: 전역 변수 pendingLocation에 좌표와 타임존을 안착시킵니다.
    pendingLocation = {
        label: d.label,
        lat: d.lat,
        lng: d.lon || d.lng,
        tz: d.tz
    };

    document.getElementById("city-search").value = d.label;
    document.getElementById("city-results").innerHTML = "";
    activeIndex = -1;
    currentResults = [];
}

function toggleManual() {
    manualOpen = !manualOpen;
    document.getElementById('manual-panel').style.display = manualOpen ? 'block' : 'none';
    if (manualOpen) resetCityFields();
}

function toggleTime(cb) {
    document.getElementById('time-inputs').classList.toggle('disabled', cb.checked);
}

/**
 * 🔑 [수복]: Seed Manifestation Ritual
 */
function playManifestRitual() {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "9999";
    overlay.style.pointerEvents = "none";

    const veil = document.createElement("div");
    veil.style.position = "absolute";
    veil.style.inset = "0";
    veil.style.background = "rgba(0,0,0,0.78)"; 
    veil.style.opacity = "0";
    veil.style.transition = "opacity 0.4s ease";

    const text = document.createElement("div");
    text.textContent = "the seed has manifested"; 
    text.style.position = "absolute";
    text.style.top = "50%";
    text.style.left = "50%";
    text.style.transform = "translate(-50%,-50%)";
    text.style.color = "rgb(3,234,252)"; 
    text.style.fontFamily = "Consolas,'Cascadia Code','JetBrains Mono','Fira Code',Menlo,Monaco,'Courier New',monospace"; 
    text.style.fontSize = "0.84rem"; 
    text.style.letterSpacing = "0.18em"; 
    text.style.opacity = "0";
    text.style.transition = "opacity 0.4s ease";

    overlay.appendChild(veil);
    overlay.appendChild(text);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            veil.style.opacity = "1";
            text.style.opacity = "0.85";
        });
    });

    setTimeout(() => {
        text.style.opacity = "0";
        veil.style.opacity = "0";
        setTimeout(() => {
            window.location.replace("/world/nigredo?module=n1");
        }, 0);
    }, 700); 
}

/**
/**
 * 🔑 통합 Manifest Core (v13.6: '기록'과 '선택'의 엄격한 분리 + Airtight Guard 반영)
 */
async function manifestNewSeed() {
    const nameInput = document.getElementById('name').value.trim();
    if (!nameInput) {
        alert("Seed Designation required.");
        return;
    }

    const cityInput = document.getElementById("city-search");
    const tzSelect = document.getElementById("tz-select");
    let finalLocation = null; 

    if (manualOpen) {
        const latInt = parseInt(document.getElementById("lat-int").value || 0, 10);
        const latDec = parseFloat("0." + (document.getElementById("lat-dec").value || "0"));
        const lonInt = parseInt(document.getElementById("lon-int").value || 0, 10);
        const lonDec = parseFloat("0." + (document.getElementById("lon-dec").value || "0"));

        const latSign = document.querySelector('.sign-btn[data-target="lat"].active').dataset.sign === "+" ? 1 : -1;
        const lonSign = document.querySelector('.sign-btn[data-target="lon"].active').dataset.sign === "+" ? 1 : -1;

        if (latInt === 0 && lonInt === 0 && latDec === 0 && lonDec === 0) {
            alert("Location Omitted: Precise coordinates required.");
            return false;
        }
        finalLocation = { 
            label: "Manual Entry", 
            lat: latSign * (latInt + latDec), 
            lng: lonSign * (lonInt + lonDec), 
            timezone: tzSelect.value 
        };
    } else {
        const currentText = cityInput.value.trim();
        
        // 🛡️ [Airtight Guard]: 화면 텍스트와 박제된 데이터(pendingLocation)가 일치하는지 최종 확인
        if (currentText && pendingLocation && currentText === pendingLocation.label) {
            finalLocation = { 
                label: pendingLocation.label, 
                lat: pendingLocation.lat, 
                lng: pendingLocation.lng, 
                timezone: pendingLocation.tz 
            };
        }
    }

    // 🛡️ 최종 관문: 데이터가 인양되지 않았다면 저장 프로세스 진입 원천 차단
    if (!finalLocation) {
        alert("Location Omitted: Point of Emergence required.");
        cityInput.focus();
        return false;
    }

    const isUnknown = document.getElementById('time-unknown').checked;
    const birthDate = `${document.getElementById('year').value}-${document.getElementById('month').value.padStart(2,'0')}-${document.getElementById('day').value.padStart(2,'0')}`;
    let birthTime = isUnknown ? "Unknown" : `${document.getElementById('hour').value.padStart(2,'0')}:${document.getElementById('minute').value.padStart(2,'0')}:${document.getElementById('second').value.padStart(2,'0')}`;
    
    const cookies = document.cookie.split(';').map(c => c.trim());
    const isMember = cookies.some(c => c.startsWith("session_user_id="));
    const manifestBtn = document.getElementById('incarnate');
    if (manifestBtn) manifestBtn.disabled = true;

    // 🏛️ [v13.6 공통 페이로드]: has_body=1 명시 (Natal 실체 선포)
    const seedPayload = {
        name: nameInput,
        birth_date: birthDate,
        birth_time: birthTime,
        location: finalLocation.label,
        lat: finalLocation.lat,
        lng: finalLocation.lng,
        timezone: finalLocation.timezone,
        is_unknown_time: isUnknown,
        has_body: 1, 
        is_seed: 1
    };

    if (isMember) {
        try {
            const res = await fetch('/api/natal/create', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(seedPayload) 
            });
            
            if (res.ok) {
                // 🔑 서버 저장 후 리프레시 (active_seed를 건드리지 않음)
                playManifestRitual(); 
            } else {
                const errorData = await res.json();
                alert(`MANIFEST FAILED: ${errorData.detail || "Unknown Error"}`);
                if (manifestBtn) manifestBtn.disabled = false;
            }
        } catch (e) { 
            console.error("Save failed", e);
            if (manifestBtn) manifestBtn.disabled = false;
        }
    } else {
        if (localStorage.getItem(nameInput)) {
            alert(`A seed with the designation '${nameInput}' already exists.`);
            if (manifestBtn) manifestBtn.disabled = false;
            return; 
        }
        
        const newSeed = {
            ...seedPayload,
            id: "LOCAL_" + Date.now(),
            idx: getNextLocalIndex(),
            is_active: 1
        };

        // 🔑 단순히 이름별 로컬 저장만 수행 (active_seed 조작 금지)
        localStorage.setItem(nameInput, JSON.stringify(newSeed));
        playManifestRitual(); 
    }
}

// 🔑 Initialization
document.addEventListener("DOMContentLoaded", () => {
    const yr = document.getElementById('year'), mo = document.getElementById('month'), dy = document.getElementById('day');
    const hr = document.getElementById('hour'), mi = document.getElementById('minute'), sc = document.getElementById('second');
    const nowYear = new Date().getFullYear();

    for (let i = nowYear + 1; i >= 1900; i--) yr.add(new Option(i, i));
    
    const fill = (el, start, end) => { 
        for (let i = start; i <= end; i++) {
            const val = String(i).padStart(2, '0');
            el.add(new Option(val, i)); 
        }
    };
    
    fill(mo, 1, 12); fill(dy, 1, 31);
    fill(hr, 0, 23); fill(mi, 0, 59); fill(sc, 0, 59);
    
    yr.value = 1992; mo.value = 6; dy.value = 1;

    setupNumeric("lat-int", 0, 90); setupNumeric("lat-dec", 0, 0, 4);
    setupNumeric("lon-int", 0, 180); setupNumeric("lon-dec", 0, 0, 4);

    const tzSelect = document.getElementById("tz-select");
    const tzNames = {
        "-10": "HST", "-8": "PST", "-7": "MST", "-6": "CST", "-5": "EST",
        "0": "UTC/GMT", "+1": "CET", "+2": "EET", "+3": "MSK", "+5.5": "IST",
        "+7": "WIB", "+8": "CST/SGT", "+9": "KST/JST", "+10": "AEST", "+12": "NZST"
    };

    if (tzSelect) {
        tzSelect.innerHTML = "";
        for (let i = -12; i <= 14; i++) {
            const opt = document.createElement("option");
            opt.value = i;
            const offsetStr = (i >= 0 ? "+" : "") + i;
            const friendly = tzNames[offsetStr] || "";
            opt.textContent = `UTC${offsetStr}${friendly ? ` (${friendly})` : ""}`;
            if (i === 9) opt.selected = true;
            tzSelect.appendChild(opt);
        }
    }

    document.querySelectorAll(".sign-btn").forEach(btn => {
        btn.onclick = () => {
            const target = btn.dataset.target;
            document.querySelectorAll(`.sign-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });


// 🔑 [v14.2 수복]: 부호 버튼 로직 및 방위(N/S/E/W) 호버 가이드 복구
    document.querySelectorAll(".sign-btn").forEach(btn => {
        btn.onclick = () => {
            const target = btn.dataset.target;
            document.querySelectorAll(`.sign-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };

        // 🛡️ 마우스 포인터를 따라다니는 방위 텍스트 현현
        btn.addEventListener("mousemove", e => {
            const sign = btn.dataset.sign, target = btn.dataset.target;
            tooltip.textContent = (target === "lat") ? (sign === "+" ? "North" : "South") : (sign === "+" ? "East" : "West");
            tooltip.style.left = e.clientX + 15 + "px"; 
            tooltip.style.top = e.clientY + 15 + "px";
            tooltip.style.opacity = 1;
        });

        // 🛡️ 마우스 이탈 시 가이드 소멸
        btn.addEventListener("mouseleave", () => tooltip.style.opacity = 0);
    });

    // 🔑 [v14.3 수복]: Supabase 실시간 검색 API 및 0.3초 디바운스(Debounce) 회로 적용
    let citySearchTimeout = null;
    const cityInp = document.getElementById("city-search");
    
    cityInp.addEventListener("input", (e) => {
        if (manualOpen) { 
            manualOpen = false; 
            document.getElementById('manual-panel').style.display='none'; 
            resetManualFields(); 
        }
        
        const q = e.target.value.trim();
        
        // 검색어가 비어있거나 2글자 미만이면 검색 중지 및 결과창 초기화
        if (!q || q.length < 2) { 
            document.getElementById("city-results").innerHTML = ""; 
            currentResults = [];
            activeIndex = -1;
            return; 
        }

        // 이전 요청 대기열 취소 후 0.3초 뒤에 새 요청 발사 (서버 과부하 방지)
        clearTimeout(citySearchTimeout);
        citySearchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}`);
                if (res.ok) {
                    currentResults = await res.json();
                    activeIndex = -1;
                    renderResults();
                }
            } catch (err) {
                console.error("💀 [API ERROR]: 세계 지도 매트릭스 연결 실패", err);
            }
        }, 300);
    });

    cityInp.addEventListener("keydown", (e) => {
        if (!currentResults.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = (activeIndex + 1) % currentResults.length; renderResults(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = (activeIndex - 1 + currentResults.length) % currentResults.length; renderResults(); }
        else if (e.key === "Enter") { e.preventDefault(); if (activeIndex >= 0) selectCity(activeIndex); }
    });
});