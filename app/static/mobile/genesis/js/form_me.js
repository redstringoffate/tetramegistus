document.addEventListener("DOMContentLoaded", () => {
    
    // 🚀 [핵심 수복]: 로컬 IP(HTTP) 접속 시 브라우저가 randomUUID를 차단하는 현상 완벽 방어
    function uuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // HTTP 환경에서도 절대 뻗지 않는 범용 백업 알고리즘
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function setCookie(name, value, days = 7) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    }

    const yearSel   = document.getElementById("year");
    const monthSel  = document.getElementById("month");
    const daySel    = document.getElementById("day");
    const hourSel   = document.getElementById("hour");
    const minuteSel = document.getElementById("minute");
    const secondSel = document.getElementById("second");
    const cityInput   = document.getElementById("city-search");
    const cityResults = document.getElementById("city-results");
    const manualToggle = document.getElementById("manual-toggle");
    const manualPanel  = document.getElementById("manual-panel");
    const latInt = document.getElementById("lat-int");
    const latDec = document.getElementById("lat-dec");
    const lonInt = document.getElementById("lon-int");
    const lonDec = document.getElementById("lon-dec");
    const tzSelect = document.getElementById("tz-select");
    const signBtns = document.querySelectorAll(".sign-btn");
    const tooltip  = document.getElementById("sign-tooltip");
    const incarnateBtn = document.getElementById("incarnate");

    let cities = {};
    let pendingLocation = null;
    let manualOpen = false;
    let latSign = "+";
    let lonSign = "+";
    let activeIndex = -1;
    let currentResults = [];

    function fillSelect(select, from, to) {
        select.innerHTML = "";
        for (let i = from; i <= to; i++) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = String(i).padStart(2, "0");
            select.appendChild(opt);
        }
    }

    function daysInMonth(year, month) {
        if (month === 2) return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 29 : 28;
        return [4, 6, 9, 11].includes(month) ? 30 : 31;
    }

    function clampDay() {
        const max = daysInMonth(+yearSel.value, +monthSel.value);
        const cur = Math.min(+daySel.value || 1, max);
        fillSelect(daySel, 1, max);
        daySel.value = cur;
    }

    const nowYear = new Date().getFullYear();
    fillSelect(yearSel, 1900, nowYear + 1);
    fillSelect(monthSel, 1, 12);
    fillSelect(hourSel, 0, 23);
    fillSelect(minuteSel, 0, 59);
    fillSelect(secondSel, 0, 59);

    yearSel.value = 1992;
    monthSel.value = 6;
    clampDay();
    daySel.value = 1;

    const tzNames = {
        "-10": "HST", "-8": "PST", "-7": "MST", "-6": "CST", "-5": "EST",
        "0": "UTC/GMT", "+1": "CET", "+2": "EET", "+3": "MSK", "+5.5": "IST",
        "+7": "WIB", "+8": "CST/SGT", "+9": "KST/JST", "+10": "AEST", "+12": "NZST"
    };

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

    function clampIntInput(input, min, max) {
        input.addEventListener("input", () => {
            let v = parseInt(input.value || "0", 10);
            if (isNaN(v)) v = min;
            v = Math.max(min, Math.min(max, v));
            input.value = v;
        });
    }

    function clampDecInput(input, digits) {
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "").slice(0, digits);
        });
    }

    clampIntInput(latInt, 0, 90);
    clampDecInput(latDec, 4);
    clampIntInput(lonInt, 0, 180);
    clampDecInput(lonDec, 4);

    yearSel.onchange = clampDay;
    monthSel.onchange = clampDay;

    manualToggle.onclick = () => {
        manualOpen = !manualOpen;
        manualPanel.style.display = manualOpen ? "block" : "none";
        if (manualOpen) {
            pendingLocation = null;
            cityInput.value = "";
            cityResults.innerHTML = "";
            activeIndex = -1;
            currentResults = [];
        }
    }

    signBtns.forEach(btn => {
        btn.onclick = () => {
            const target = btn.dataset.target;
            const sign = btn.dataset.sign;
            signBtns.forEach(b => { if (b.dataset.target === target) b.classList.remove("active"); });
            btn.classList.add("active");
            if (target === "lat") latSign = sign;
            if (target === "lon") lonSign = sign;
        }

        btn.addEventListener("touchstart", e => {
            const sign = btn.dataset.sign;
            const target = btn.dataset.target;
            let label = target === "lat" ? (sign === "+" ? "North" : "South") : (sign === "+" ? "East"  : "West");
            tooltip.textContent = label;
            tooltip.style.left = e.touches[0].clientX + 12 + "px";
            tooltip.style.top  = e.touches[0].clientY - 20 + "px";
            tooltip.style.opacity = 1;
        });
        btn.addEventListener("touchend", () => { tooltip.style.opacity = 0; });
    });

    fetch("/api/cities").then(r => r.json()).then(d => cities = d);

    function renderResults(list) {
        cityResults.innerHTML = "";
        list.forEach((d, i) => {
            const div = document.createElement("div");
            div.className = "city-item";
            div.textContent = d.label;
            if (i === activeIndex) div.classList.add("active");
            div.onclick = () => selectCity(i);
            cityResults.appendChild(div);
        });
    }

    function selectCity(index) {
        const d = currentResults[index];
        if (!d) return;
        manualOpen = false;
        manualPanel.style.display = "none";
        latInt.value = ""; latDec.value = ""; lonInt.value = ""; lonDec.value = "";
        pendingLocation = { type: "city", lat: d.lat, lon: d.lon, tz: d.tz, label: d.label };
        cityInput.value = d.label;
        cityResults.innerHTML = "";
        activeIndex = -1;
        currentResults = [];
    }

    cityInput.addEventListener("input", () => {
        const q = cityInput.value.trim().toLowerCase();
        if (!q) { cityResults.innerHTML = ""; currentResults = []; activeIndex = -1; return; }
        manualOpen = false;
        manualPanel.style.display = "none";
        currentResults = Object.values(cities).filter(d => d.label.toLowerCase().includes(q)).slice(0, 8);
        activeIndex = -1;
        renderResults(currentResults);
    });

    incarnateBtn.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }

        let finalLocation = null;
        let timezoneValue = tzSelect.value;

        if (manualOpen) {
            const latV = parseInt(latInt.value || 0, 10) + parseFloat("0." + (latDec.value || "0"));
            const lonV = parseInt(lonInt.value || 0, 10) + parseFloat("0." + (lonDec.value || "0"));
            const lat = (latSign === "-" ? -1 : 1) * latV;
            const lon = (lonSign === "-" ? -1 : 1) * lonV;

            if (lat === 0 && lon === 0) { alert("Location Omitted: Precise coordinates required."); return false; }
            const latS = lat >= 0 ? "N" : "S"; const lonS = lon >= 0 ? "E" : "W";
            const displayLabel = `${Math.abs(lat).toFixed(2)}° ${latS}, ${Math.abs(lon).toFixed(2)}° ${lonS} (UTC${timezoneValue >= 0 ? "+" : ""}${timezoneValue})`;
            finalLocation = { type: "manual", lat, lon, label: displayLabel, tz: timezoneValue };
        } else {
            const currentText = cityInput.value.trim();
            if (!currentText) { alert("Location Omitted: Point of Emergence required."); cityInput.focus(); return false; }
            if (pendingLocation && currentText === pendingLocation.label) {
                finalLocation = pendingLocation; timezoneValue = pendingLocation.tz;
            }
        }

        if (!finalLocation) { alert("Location Omitted: Point of Emergence required."); cityInput.focus(); return false; }

        const finalDate = `${yearSel.value}-${String(monthSel.value).padStart(2, '0')}-${String(daySel.value).padStart(2, '0')}`;
        const finalTime = `${String(hourSel.value).padStart(2, '0')}:${String(minuteSel.value).padStart(2, '0')}:${String(secondSel.value).padStart(2, '0')}`;
        const locStr = finalLocation.label;

        const me = {
            id: uuid(), idx: 0, name: "[me]", has_body: 1, created_at: new Date().toISOString(),
            birth_date: finalDate, birth_time: finalTime, birth: `${finalDate}T${finalTime}`,
            location: locStr, lat: finalLocation.lat, lng: finalLocation.lon || finalLocation.lng,
            timezone: timezoneValue, timestamp: Date.now()
        };

        localStorage.setItem("tetramegistus.me", JSON.stringify(me));
        localStorage.setItem("active_seed", JSON.stringify(me)); 

        fetch('/api/godmode/pulse', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
            body: JSON.stringify({ module: 'RITUAL_ME_SEED', duration: 0 })
        }).catch(e => console.log('Pulse error', e));

        setCookie("temp_birth_date", finalDate);
        setCookie("temp_birth_time", finalTime);
        setCookie("temp_location", locStr);
        setCookie("temp_birth", `${finalDate} ${finalTime}`);
        setCookie("temp_lat", finalLocation.lat);
        setCookie("temp_lng", finalLocation.lon || finalLocation.lng);
        setCookie("temp_tz", timezoneValue);

        // 🚀 버튼 연타 방지 및 인지 피드백
        incarnateBtn.style.pointerEvents = "none";
        
        /* 2초 정적 후 오버레이 발동 */
        setTimeout(() => {
            const manifestOverlay = document.getElementById("manifest-overlay");
            manifestOverlay.classList.remove("hidden-element"); 
            
            setTimeout(() => {
                manifestOverlay.classList.add("is-manifesting");
            }, 50);

            setTimeout(() => {
                window.location.replace("/world");
            }, 5000);
        }, 2000);
    }
});