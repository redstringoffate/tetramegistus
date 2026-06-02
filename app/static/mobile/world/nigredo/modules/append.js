/* static/mobile/world/nigredo/modules/append.js — v1.0 Mobile Architecture */

(() => {
    let pendingLocation = null;
    let citiesDatabase = {};
    let activeIndex = -1;
    let currentResults = [];

    // 🚀 HTTP 가드 수복 알고리즘
    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    function setCookie(name, value, days = 7) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    }

    // 드롭다운 날짜/시간 생성
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

        // 🚀 [수정]: 디폴트 시드를 1992-06-01 00:00:00 으로 강제 고정
        document.getElementById("year").value = 1992;
        document.getElementById("month").value = 6;
        document.getElementById("day").value = 1;
        document.getElementById("hour").value = 0;
        document.getElementById("minute").value = 0;
        document.getElementById("second").value = 0;

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
                
                // PC판과 완벽히 동일한 포맷: UTC+9 (KST/JST)
                opt.textContent = `UTC${offsetStr}${friendly ? ` (${friendly})` : ""}`;
                tzSelect.appendChild(opt);
            }
            tzSelect.value = 9.0;
        }
    }

    /* ─── C:\Users\Ellen\Documents\Astrology\tetramegistus\app\static\mobile\world\nigredo\modules\append.js — bindMobileEvents 수복 ─── */
    function bindMobileEvents() {
        // 1. Unknown Time 토글 관제 (유지)
        document.getElementById("time-unknown")?.addEventListener("change", (e) => {
            const panel = document.getElementById("time-inputs");
            if (panel) {
                if (e.target.checked) panel.classList.add("disabled");
                else panel.classList.remove("disabled");
            }
        });

        // 🚀 [수복] form_me 전환 로직: PC 방식의 Focus 꼼수를 버리고 라디오 버튼 변화를 감지
        document.querySelectorAll('input[name="m-entry-mode"]').forEach(radio => {
            radio.addEventListener("change", (e) => {
                const searchBox = document.getElementById("m-search-box-group");
                const manualPanel = document.getElementById("manual-panel");
                if (e.target.id === "m-mode-search") {
                    searchBox.style.display = "block";
                    manualPanel.style.display = "none";
                    pendingLocation = null; // 수동 데이터 초기화
                } else {
                    searchBox.style.display = "none";
                    manualPanel.style.display = "block";
                    // Manual 데이터 설정
                    pendingLocation = { id: "manual", label: "Manual Entry" }; 
                }
            });
        });

        // 🚀 [수복] 도시 검색 처리: 더 이상 ManualEntry를 리스트에 억지로 집어넣지 않음
        const searchInput = document.getElementById("city-search");
        searchInput?.addEventListener("input", (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (!query) {
                document.getElementById("city-results").innerHTML = "";
                currentResults = []; //
                return;
            }
            // 도시 딕셔너리에서 필터링만 수행
            currentResults = Object.values(citiesDatabase)
                .filter(c => c.label.toLowerCase().includes(query))
                .slice(0, 8);
            activeIndex = -1;
            renderCityResults(); //
        });

        // 수동 좌표 방위 부호 트리거 (유지)
        document.querySelectorAll(".m-sign-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const target = btn.dataset.target;
                document.querySelectorAll(`.m-sign-btn[data-target="${target}"]`).forEach(b => b.classList.remove("m-active"));
                btn.classList.add("m-active");
            });
            
            btn.addEventListener("mousemove", (e) => {
                const tooltip = document.getElementById("sign-tooltip");
                if (!tooltip) return;
                const { sign, target } = btn.dataset;
                tooltip.textContent = (target === "lat") ? (sign === "+" ? "North" : "South") : (sign === "+" ? "East" : "West");
                tooltip.style.left = e.clientX + 15 + "px";
                tooltip.style.top = e.clientY + 15 + "px";
                tooltip.style.display = "block";
            });

            btn.addEventListener("mouseleave", () => {
                const tooltip = document.getElementById("sign-tooltip");
                if (tooltip) tooltip.style.display = "none";
            });
        });

        // 최종 매니페스트 실행 버튼 (유지)
        document.getElementById("incarnate")?.addEventListener("click", () => manifestNewSeed());
    }


    function renderCityResults() {
        const box = document.getElementById("city-results");
        if (!box) return;
        box.innerHTML = "";

        currentResults.forEach((city, idx) => {
            const item = document.createElement("div");
            item.className = "m-city-item" + (idx === activeIndex ? " active" : "");
            item.textContent = city.label;
            item.addEventListener("click", () => selectCity(idx));
            box.appendChild(item);
        });
    }

    function selectCity(idx) {
        const city = currentResults[idx];
        if (!city) return;

        const searchInput = document.getElementById("city-search");
        if (searchInput) searchInput.value = city.label;
        document.getElementById("city-results").innerHTML = "";

        pendingLocation = city;

        const manualPanel = document.getElementById("manual-panel");
        if (city.id === "manual") {
            if (manualPanel) manualPanel.style.display = "block";
            pendingLocation = { id: "manual", label: "Manual Entry" };
        } else {
            if (manualPanel) manualPanel.style.display = "none";
        }
    }

    async function manifestNewSeed() {
        const nameEl = document.getElementById("name");
        const name = nameEl ? nameEl.value.trim() : "";
        if (!name) { alert("Enter seed designation."); return; }

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

        const year = document.getElementById("year").value;
        const month = String(document.getElementById("month").value).padStart(2, '0');
        const day = String(document.getElementById("day").value).padStart(2, '0');
        const finalDate = `${year}-${month}-${day}`;

        const isUnknown = document.getElementById("time-unknown").checked;
        let finalTime = "12:00:00";
        if (!isUnknown) {
            const h = String(document.getElementById("hour").value).padStart(2, '0');
            const m = String(document.getElementById("minute").value).padStart(2, '0');
            const s = String(document.getElementById("second").value).padStart(2, '0');
            finalTime = `${h}:${m}:${s}`;
        }

        const seedId = generateUUID();
        
        let payload = {
            id: seedId,
            // 🚀 [완벽 수복]: UUID 문자열 대신 생성 시점의 타임스탬프(정수)를 부여하여 
            // 영구적이고 완벽한 시간순 정렬(Chronological Order)을 보장합니다!
            idx: Date.now(), 
            name: name, 
            birth_date: finalDate,
            birth_time: isUnknown ? "Unknown" : finalTime,
            is_unknown_time: isUnknown ? 1 : 0, 
            location: locLabel, 
            lat: parseFloat(finalLat), 
            lng: parseFloat(finalLng), 
            timezone: finalTz,
            has_body: 1,
            is_seed: 1
        };

        const isMember = document.cookie.split('; ').find(row => row.startsWith('session_user_id='));

        try {
            if (isMember) {
                const res = await fetch('/api/natal/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error("Cloud rejection");
                
                // 🚀 [핵심 수복]: JSON 파싱 시도 삭제! 
                // 서버가 응답을 주면 그냥 믿고 넘어갑니다. 여기서 뻗던 증상을 원천 차단했습니다.
            } else {
                localStorage.setItem(`tetramegistus_seed_${Date.now()}`, JSON.stringify(payload));
            }

            const btn = document.getElementById("incarnate");
            if (btn) btn.style.pointerEvents = "none";

            setTimeout(() => {
                const overlay = document.getElementById("manifest-overlay");
                overlay?.classList.remove("m-hidden-element");
                overlay?.classList.add("is-manifesting");

                setTimeout(() => location.href = "/world/nigredo?module=n1", 2000);
            }, 200);

        } catch(e) {
            // 에러가 났을 때 구체적으로 어떤 에러인지 띄워주도록 강화했습니다.
            alert("Matrix deployment failed. The seed resisted.\n" + e.message);
            const btn = document.getElementById("incarnate");
            if (btn) btn.style.pointerEvents = "all";
        }
    }

    // 🚀 [필수 복구]: 이 부분이 누락되면 드롭다운과 버튼이 다 먹통이 됩니다! 절대 지우지 마세요.
    document.addEventListener("DOMContentLoaded", () => {
        initFormSelectors();
        bindMobileEvents();
        fetch("/api/cities").then(r => r.json()).then(data => {
            citiesDatabase = data;
        }).catch(() => {});
    });
})();