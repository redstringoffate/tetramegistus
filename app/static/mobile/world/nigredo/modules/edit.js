/* static/mobile/world/nigredo/modules/edit.js */

(() => {
    let pendingLocation = null;
    let citiesDatabase = {};
    let activeIndex = -1;
    let currentResults = [];
    
    // Edit 고유 상태
    let loadedIdx = null; 
    let loadedId = null; 
    let originalName = null;
    let originalLocalKey = null; 

    function buildSelectOptions(id, start, end, suffix = "", pad = true) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = "";
        for (let i = start; i <= end; i++) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = pad ? String(i).padStart(2, '0') + suffix : i + suffix;
            el.appendChild(opt);
        }
    }

    function initFormSelectors() {
        const currentYear = new Date().getFullYear();
        buildSelectOptions("year", 1900, currentYear + 5, "", false);
        buildSelectOptions("month", 1, 12);
        buildSelectOptions("day", 1, 31);
        buildSelectOptions("hour", 0, 23);
        buildSelectOptions("minute", 0, 59);
        buildSelectOptions("second", 0, 59);

        const tzSelect = document.getElementById("tz-select");
        if (tzSelect) {
            const tzNames = {
                "-10": "HST", "-8": "PST", "-7": "MST", "-6": "CST", "-5": "EST",
                "0": "UTC/GMT", "+1": "CET", "+2": "EET", "+3": "MSK", "+5.5": "IST",
                "+7": "WIB", "+8": "CST/SGT", "+9": "KST/JST", "+10": "AEST", "+12": "NZST"
            };

            tzSelect.innerHTML = "";
            for (let t = -12; t <= 14; t += 0.5) {
                const opt = document.createElement("option");
                opt.value = t;
                const offsetStr = (t >= 0 ? "+" : "") + t;
                const friendly = tzNames[offsetStr] || "";
                opt.textContent = `UTC${offsetStr}${friendly ? ` (${friendly})` : ""}`;
                tzSelect.appendChild(opt);
            }
            tzSelect.value = 9.0;
        }
    }

    function bindMobileEvents() {
        document.getElementById("time-unknown")?.addEventListener("change", (e) => {
            const panel = document.getElementById("time-inputs");
            if (panel) {
                if (e.target.checked) panel.classList.add("disabled");
                else panel.classList.remove("disabled");
            }
        });

        document.querySelectorAll('input[name="m-entry-mode"]').forEach(radio => {
            radio.addEventListener("change", (e) => {
                const searchBox = document.getElementById("m-search-box-group");
                const manualPanel = document.getElementById("manual-panel");
                if (e.target.id === "m-mode-search") {
                    searchBox.style.display = "block";
                    manualPanel.style.display = "none";
                } else {
                    searchBox.style.display = "none";
                    manualPanel.style.display = "block";
                    pendingLocation = { id: "manual", label: "Manual Entry" }; 
                }
            });
        });

        let editCitySearchTimeout = null;
        const searchInput = document.getElementById("city-search");
        
        searchInput?.addEventListener("input", (e) => {
            const query = e.target.value.trim();
            
            // 검색어가 비어있거나 2글자 미만이면 결과창 초기화
            if (!query || query.length < 2) {
                document.getElementById("city-results").innerHTML = "";
                currentResults = [];
                activeIndex = -1;
                return;
            }

            // 0.3초 대기 후 API 요청 (서버 과부하 방지)
            clearTimeout(editCitySearchTimeout);
            editCitySearchTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        currentResults = await res.json();
                        activeIndex = -1;
                        renderCityResults();
                    }
                } catch (err) {
                    console.error("💀 [API ERROR]: 수정 화면 검색 실패", err);
                }
            }, 300);
        });

        document.querySelectorAll(".m-sign-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const target = btn.dataset.target;
                document.querySelectorAll(`.m-sign-btn[data-target="${target}"]`).forEach(b => b.classList.remove("m-active"));
                btn.classList.add("m-active");
            });
        });

        document.getElementById("incarnate")?.addEventListener("click", () => saveSeedUpdate());
    }

    function renderCityResults() {
        const box = document.getElementById("city-results");
        if (!box) return;
        box.innerHTML = "";

        currentResults.forEach((city, idx) => {
            const item = document.createElement("div");
            item.className = "m-city-item" + (idx === activeIndex ? " active" : "");
            item.textContent = city.label;
            item.addEventListener("click", () => {
                document.getElementById("city-search").value = city.label;
                document.getElementById("city-results").innerHTML = "";
                pendingLocation = city;
                currentResults = [];
            });
            box.appendChild(item);
        });
    }

    async function loadSeedData() {
        if (typeof SEED_ID === 'undefined') return;
        let data = null;

        try {
            const activeRaw = localStorage.getItem("active_seed");
            if (activeRaw) {
                const activeData = JSON.parse(activeRaw);
                if (String(activeData.idx) === String(SEED_ID) || String(activeData.id) === String(SEED_ID)) {
                    data = activeData;
                    if (data._localKey) originalLocalKey = data._localKey;
                }
            }
        } catch (e) {}

        if (!data && SEED_ID === "0") {
            try {
                const meRaw = localStorage.getItem("tetramegistus.me");
                if (meRaw) data = JSON.parse(meRaw);
            } catch (e) {}
        }

        const isLocal = String(SEED_ID).startsWith("LOCAL_");
        const localTargetName = String(SEED_ID).replace("LOCAL_", "");

        if (!data) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (["active_seed", "session", "current_seed_idx", "current_seed_text", "tetramegistus.me", "nigredo_time_locked", "albedo_time_locked", "albedo_s1_idx", "albedo_s2_idx"].includes(key)) continue;
                try {
                    const localData = JSON.parse(localStorage.getItem(key));
                    if (isLocal) {
                        if (localData && (key === localTargetName || localData.name === localTargetName)) { 
                            data = localData; 
                            originalLocalKey = key; 
                            break; 
                        }
                    } else if (localData && (String(localData.idx) === String(SEED_ID) || String(localData.id) === String(SEED_ID))) {
                        data = localData; 
                        originalLocalKey = key; 
                        break;
                    }
                } catch (e) {}
            }
        }

        if (!data && !isLocal && String(SEED_ID) !== "0") {
            try {
                const res = await fetch(`/api/natal/detail/${SEED_ID}`);
                if (res.ok) data = await res.json();
            } catch (e) {}
        }

        if (!data) {
            alert("Anchor lost in the void.");
            location.href = "/world/nigredo?module=n1";
            return;
        }

        loadedIdx = (data.idx !== undefined && data.idx !== null) ? data.idx : data.id; 
        loadedId = data.id || SEED_ID; 
        originalName = data.name;
        
        const nameInp = document.getElementById('name');
        nameInp.value = data.name || "";
        
        if (data.name === "[me]") {
            nameInp.readOnly = true; 
            nameInp.style.opacity = "0.6"; 
        } else {
            nameInp.readOnly = false; 
            nameInp.style.opacity = "1"; 
        }

        if (data.birth_date) {
            const d = data.birth_date.split('-');
            document.getElementById('year').value = parseInt(d[0]);
            document.getElementById('month').value = parseInt(d[1]);
            document.getElementById('day').value = parseInt(d[2]);
        }

        if (data.is_unknown_time || data.birth_time === "Unknown") {
            document.getElementById('time-unknown').checked = true;
            document.getElementById("time-inputs").classList.add("disabled");
        } else if (data.birth_time) {
            const t = data.birth_time.split(':');
            document.getElementById('hour').value = parseInt(t[0] || 0);
            document.getElementById('minute').value = parseInt(t[1] || 0);
            document.getElementById('second').value = parseInt(t[2] || 0);
        }

        if (data.timezone !== undefined) {
            document.getElementById('tz-select').value = parseFloat(data.timezone);
        }

        if (data.location === "Manual Entry" || (data.lat !== undefined && !data.location)) {
            document.getElementById('m-mode-manual').checked = true;
            document.getElementById("m-search-box-group").style.display = "none";
            document.getElementById("manual-panel").style.display = "block";
            
            pendingLocation = { id: "manual", label: "Manual Entry" };
            
            const lat = Math.abs(data.lat || 0);
            const lng = Math.abs(data.lng || 0);
            
            document.getElementById('lat-int').value = Math.floor(lat);
            document.getElementById('lat-dec').value = (lat % 1).toFixed(4).substring(2);
            document.getElementById('lon-int').value = Math.floor(lng);
            document.getElementById('lon-dec').value = (lng % 1).toFixed(4).substring(2);
            
            const setSignBtn = (target, sign) => {
                document.querySelectorAll(`.m-sign-btn[data-target="${target}"]`).forEach(btn => {
                    btn.classList.toggle('m-active', btn.dataset.sign === sign);
                });
            };
            setSignBtn("lat", (data.lat >= 0 || data.lat === undefined) ? "+" : "-");
            setSignBtn("lon", (data.lng >= 0 || data.lng === undefined) ? "+" : "-");
        } else {
            document.getElementById('m-mode-search').checked = true;
            document.getElementById('city-search').value = decodeURIComponent(data.location || "");
            pendingLocation = { label: decodeURIComponent(data.location), lat: data.lat, lng: data.lng, tz: data.timezone };
        }
    }

    async function saveSeedUpdate() {
        const nameInput = document.getElementById('name').value.trim();
        if (!nameInput) { alert("Seed Designation required."); return; }

        const isUnknown = document.getElementById('time-unknown').checked;
        const birthDate = `${document.getElementById('year').value}-${document.getElementById('month').value.padStart(2,'0')}-${document.getElementById('day').value.padStart(2,'0')}`;
        const birthTime = isUnknown ? "Unknown" : `${document.getElementById('hour').value.padStart(2,'0')}:${document.getElementById('minute').value.padStart(2,'0')}:${document.getElementById('second').value.padStart(2,'0')}`;

        let finalLat, finalLng, finalTz, locLabel;
        const isManual = document.getElementById('m-mode-manual').checked;

        if (isManual) {
            locLabel = "Manual Entry";
            const latSign = document.querySelector('.m-sign-btn[data-target="lat"].m-active').dataset.sign === "-" ? -1 : 1;
            const lonSign = document.querySelector('.m-sign-btn[data-target="lon"].m-active').dataset.sign === "-" ? -1 : 1;
            
            const latV = parseInt(document.getElementById('lat-int').value || "0", 10) + parseFloat("0." + (document.getElementById('lat-dec').value || "0"));
            const lonV = parseInt(document.getElementById('lon-int').value || "0", 10) + parseFloat("0." + (document.getElementById('lon-dec').value || "0"));
            
            finalLat = latSign * latV;
            finalLng = lonSign * lonV;
            finalTz = String(document.getElementById('tz-select').value);
        } else {
            const currentText = document.getElementById('city-search').value.trim();
            if (!currentText || !pendingLocation || currentText !== pendingLocation.label) {
                alert("Location Omitted: Point of Emergence required.");
                return false;
            }
            locLabel = pendingLocation.label; 
            finalLat = pendingLocation.lat; 
            finalLng = pendingLocation.lng || pendingLocation.lon; 
            finalTz = String(pendingLocation.tz);
        }

        let safeIdx = loadedIdx;
        if (typeof loadedIdx === 'string' && isNaN(parseInt(loadedIdx, 10))) {
            safeIdx = Date.now(); 
        } else {
            safeIdx = parseInt(loadedIdx, 10) || Date.now();
        }
        
        // [me] 시드의 고유 식별자(0) 강제 유지
        if (nameInput === "[me]" || String(loadedIdx) === "0") {
            safeIdx = 0;
        }

        const updateData = {
            id: loadedId || SEED_ID,
            idx: safeIdx, 
            name: nameInput, 
            birth_date: birthDate, 
            birth_time: birthTime,
            location: locLabel, 
            lat: parseFloat(finalLat), 
            lng: parseFloat(finalLng), 
            timezone: finalTz,
            is_unknown_time: isUnknown ? 1 : 0, 
            has_body: 1, 
            is_seed: 1
        };

        const incarnateBtn = document.getElementById('incarnate');
        if (incarnateBtn) incarnateBtn.disabled = true;

        let formatLoc = locLabel;
        if (isManual) {
            formatLoc = `${Math.abs(finalLat).toFixed(2)} ${finalLat >= 0 ? "N" : "S"}, ${Math.abs(finalLng).toFixed(2)} ${finalLng >= 0 ? "E" : "W"}`;
            let tzn = parseFloat(finalTz);
            if (!isNaN(tzn)) formatLoc += ` (UTC ${tzn >= 0 ? '+' : ''}${tzn})`;
        }
        let formatTime = isUnknown ? "Time Unknown" : birthTime;
        const fullTextFormat = `${nameInput} [${birthDate}, ${formatTime}; ${formatLoc}]`;

        let isActiveSeed = false;
        try {
            const currentActive = JSON.parse(localStorage.getItem("active_seed"));
            if (currentActive && (String(currentActive.idx) === String(safeIdx) || String(currentActive.id) === String(loadedId))) {
                isActiveSeed = true;
            }
        } catch(e){}

        if (String(safeIdx) === "0" || nameInput === "[me]") {
            localStorage.setItem("tetramegistus.me", JSON.stringify(updateData));
            isActiveSeed = true; 
        } else {
            const targetKey = originalLocalKey || `tetramegistus_seed_${safeIdx}`;
            if (originalName && originalName !== nameInput && originalLocalKey === originalName) {
                localStorage.removeItem(originalName);
            }
            localStorage.setItem(targetKey, JSON.stringify(updateData));
        }

        if (isActiveSeed) {
            localStorage.setItem("active_seed", JSON.stringify(updateData));
            localStorage.setItem("current_seed_idx", String(safeIdx));
            localStorage.setItem("current_seed_text", encodeURIComponent(fullTextFormat));
            localStorage.setItem("nigredo_time_locked", isUnknown ? 'true' : 'false');
        }

        const cookieMatch = document.cookie.match(/(?:^|; )session_user_id=([^;]+)/);
        const sessionUser = cookieMatch ? decodeURIComponent(cookieMatch[1]).trim() : null;

        if (!isNaN(SEED_ID) && String(SEED_ID).trim() !== "" && String(SEED_ID) !== "0" && sessionUser) {
            try {
                const res = await fetch(`/api/natal/update/${SEED_ID}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                if (res.ok) { playUpdateRitual(); } 
                else { alert("Cloud update failed."); if (incarnateBtn) incarnateBtn.disabled = false; }
            } catch (e) { playUpdateRitual(); }
        } else {
            playUpdateRitual();
        }
    }

    // 🚀 복구된 핵심 UI 애니메이션 및 리다이렉트
    function playUpdateRitual() {
        const overlay = document.getElementById("manifest-overlay");
        overlay?.classList.remove("m-hidden-element");
        overlay?.classList.add("is-manifesting");

        setTimeout(() => {
            location.href = "/world/nigredo?module=n1";
        }, 2000);
    }

    // 🚀 복구된 메인 초기화 트리거
    document.addEventListener("DOMContentLoaded", () => {
        initFormSelectors();
        bindMobileEvents();
        loadSeedData();
    });
})();