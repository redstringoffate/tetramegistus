/* C1 ADD NATAL LOGIC CONTROLLER (Edit Enabled) */

window.initC1Natal = function() {
    console.log("[C1] Natal Module Initialized.");

    // 1. Elements
    const els = {
        name: document.getElementById('c1-natal-name'),
        y: document.getElementById('c1-natal-y'),
        m: document.getElementById('c1-natal-m'),
        d: document.getElementById('c1-natal-d'),
        h: document.getElementById('c1-natal-h'),
        min: document.getElementById('c1-natal-min'),
        s: document.getElementById('c1-natal-s'),
        unknown: document.getElementById('c1-natal-unknown'),
        
        cityInp: document.getElementById('c1-city-search'),
        cityRes: document.getElementById('c1-city-results'),
        
        manualToggle: document.getElementById('c1-manual-toggle'),
        manualPanel: document.getElementById('c1-manual-panel'),
        
        latInt: document.getElementById('c1-lat-int'),
        latDec: document.getElementById('c1-lat-dec'),
        lngInt: document.getElementById('c1-lng-int'),
        lngDec: document.getElementById('c1-lng-dec'),
        tz: document.getElementById('c1-tz'),
        
        tooltip: document.getElementById('c1-sign-tooltip')
    };

    // State
    let cities = {};
    let currentResults = [];
    let activeIndex = -1;
    let manualOpen = false;
    let pendingLocation = null;

    // 2. Numeric Helper
    function setupNumeric(id, min, max, digits) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", () => {
            if (digits) {
                el.value = el.value.replace(/\D/g, "").slice(0, digits);
            } else {
                let v = parseInt(el.value || "0", 10);
                if (isNaN(v)) {
                    el.value = "";
                } else {
                    el.value = Math.max(min, Math.min(max, v));
                }
            }
        });
    }
    setupNumeric('c1-lat-int', 0, 90);
    setupNumeric('c1-lat-dec', 0, 0, 4);
    setupNumeric('c1-lng-int', 0, 180);
    setupNumeric('c1-lng-dec', 0, 0, 4);

    // 3. Populate Selectors
    function fillSelect(sel, start, end, pad=false) {
        sel.innerHTML = '';
        for(let i=start; i<=end; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = pad ? String(i).padStart(2, '0') : i;
            sel.appendChild(opt);
        }
    }

    const now = new Date();
    fillSelect(els.y, 1900, now.getFullYear() + 1);
    fillSelect(els.m, 1, 12, true);
    fillSelect(els.d, 1, 31, true);
    fillSelect(els.h, 0, 23, true);
    fillSelect(els.min, 0, 59, true);
    fillSelect(els.s, 0, 59, true);

    els.y.value = 2000; els.m.value = 1; els.d.value = 1;

    // Timezone
    const tzNames = {
        "-10": "HST", "-8": "PST", "-7": "MST", "-6": "CST", "-5": "EST",
        "0": "UTC/GMT", "+1": "CET", "+2": "EET", "+3": "MSK", "+5.5": "IST",
        "+7": "WIB", "+8": "CST/SGT", "+9": "KST/JST", "+10": "AEST", "+12": "NZST"
    };
    els.tz.innerHTML = '';
    for(let i=-12; i<=14; i++) {
        const opt = document.createElement('option');
        const sign = i >= 0 ? '+' : '';
        const label = tzNames[String(i)] || "";
        opt.value = i;
        opt.textContent = `UTC${sign}${i}${label ? ` (${label})` : ""}`;
        if(i === 9) opt.selected = true; 
        els.tz.appendChild(opt);
    }

    // 4. Date Logic
    function adjustDays() {
        const y = parseInt(els.y.value);
        const m = parseInt(els.m.value);
        const daysInMonth = new Date(y, m, 0).getDate();
        const cur = parseInt(els.d.value);
        fillSelect(els.d, 1, daysInMonth, true);
        els.d.value = cur > daysInMonth ? daysInMonth : cur;
    }
    els.y.onchange = adjustDays;
    els.m.onchange = adjustDays;

    // 5. Cities API & Search
    fetch('/api/cities').then(r => r.json()).then(d => cities = d);

    function renderResults() {
        els.cityRes.innerHTML = '';
        els.cityRes.style.display = currentResults.length ? 'block' : 'none';
        
        currentResults.forEach((c, i) => {
            const div = document.createElement('div');
            div.className = `c1-result-item ${i === activeIndex ? 'active' : ''}`;
            div.textContent = c.label;
            div.onmousedown = () => selectCity(i);
            els.cityRes.appendChild(div);
        });
    }

    function selectCity(index) {
        const d = currentResults[index];
        if(!d) return;
        pendingLocation = { label: d.label, lat: d.lat, lng: d.lon || d.lng, tz: d.tz };
        els.cityInp.value = d.label;
        els.cityRes.style.display = 'none';
        activeIndex = -1;
    }

    els.cityInp.addEventListener('input', (e) => {
        if(manualOpen) {
            manualOpen = false;
            els.manualPanel.style.display = 'none';
            els.manualToggle.textContent = 'Manual Entry ▾';
        } 
        const q = e.target.value.trim().toLowerCase();
        if(!q) { els.cityRes.style.display = 'none'; return; }
        currentResults = Object.values(cities).filter(c => c.label.toLowerCase().includes(q)).slice(0, 8);
        activeIndex = -1;
        renderResults();
    });

    els.cityInp.addEventListener('keydown', (e) => {
        if(!currentResults.length) return;
        if(e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % currentResults.length;
            renderResults();
        } else if(e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + currentResults.length) % currentResults.length;
            renderResults();
        } else if(e.key === 'Enter') {
            e.preventDefault();
            if(activeIndex >= 0) selectCity(activeIndex);
        }
    });
    
    els.cityInp.addEventListener('blur', () => {
        setTimeout(() => els.cityRes.style.display = 'none', 200);
    });

    // 6. Manual Entry Logic
    els.manualToggle.onclick = () => {
        manualOpen = !manualOpen;
        els.manualPanel.style.display = manualOpen ? 'block' : 'none';
        els.manualToggle.textContent = manualOpen ? 'Manual Entry ▴' : 'Manual Entry ▾';
        if(manualOpen) {
            els.cityInp.value = '';
            pendingLocation = null;
        }
    };

    document.querySelectorAll('.c1-sign-btn').forEach(btn => {
        btn.onclick = () => {
            const target = btn.dataset.target;
            document.querySelectorAll(`.c1-sign-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        btn.addEventListener('mousemove', (e) => {
            const sign = btn.dataset.sign;
            const target = btn.dataset.target;
            const label = target === 'lat' ? (sign === '+' ? 'North' : 'South') : (sign === '+' ? 'East' : 'West');
            els.tooltip.textContent = label;
            els.tooltip.style.left = (e.clientX + 15) + 'px';
            els.tooltip.style.top = (e.clientY + 15) + 'px';
            els.tooltip.style.opacity = 1;
        });
        btn.addEventListener('mouseleave', () => {
            els.tooltip.style.opacity = 0;
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 🚀 [NEW]: Populate Data for Edit (Called by c1.js)
    // ─────────────────────────────────────────────────────────────
    window.populateC1NatalData = function(data) {
        if (!data) return;
        
        // 1. Name
        els.name.value = data.name;
        
        // 2. Date (YYYY-MM-DD)
        const dSplit = data.birth_date.split('-');
        els.y.value = parseInt(dSplit[0]);
        els.m.value = parseInt(dSplit[1]);
        
        // 날짜 선택에 따라 일(Day) 옵션 갱신
        adjustDays();
        els.d.value = parseInt(dSplit[2]);

        // 3. Time
        if (data.is_time_unknown) {
            els.unknown.checked = true;
        } else {
            els.unknown.checked = false;
            const tSplit = data.birth_time.split(':');
            els.h.value = parseInt(tSplit[0]);
            els.min.value = parseInt(tSplit[1]);
            els.s.value = parseInt(tSplit[2] || 0);
        }

        // 4. Location
        if (data.location === "Manual Entry") {
            // Manual Mode Activation
            manualOpen = true;
            els.manualPanel.style.display = 'block';
            els.manualToggle.textContent = 'Manual Entry ▴';
            els.cityInp.value = "";
            
            // Lat (Integer / Decimal)
            const latAbs = Math.abs(data.lat);
            els.latInt.value = Math.floor(latAbs);
            els.latDec.value = (latAbs % 1).toFixed(4).substring(2);
            setSign('lat', data.lat >= 0 ? '+' : '-');

            // Lng (Integer / Decimal)
            const lngAbs = Math.abs(data.lng);
            els.lngInt.value = Math.floor(lngAbs);
            els.lngDec.value = (lngAbs % 1).toFixed(4).substring(2);
            setSign('lng', data.lng >= 0 ? '+' : '-');

            els.tz.value = data.timezone;
        } else {
            // Search Mode Activation
            manualOpen = false;
            els.manualPanel.style.display = 'none';
            els.manualToggle.textContent = 'Manual Entry ▾';
            
            els.cityInp.value = data.location;
            pendingLocation = { 
                label: data.location, 
                lat: data.lat, 
                lng: data.lng, 
                tz: data.timezone 
            };
        }
    };
    
    // Alias for consistency with c1.js
    window.populateC1Natal = window.populateC1NatalData;

    function setSign(target, sign) {
        document.querySelectorAll(`.c1-sign-btn[data-target="${target}"]`).forEach(b => {
            if(b.dataset.sign === sign) b.classList.add('active');
            else b.classList.remove('active');
        });
    }

    // 7. Data Collection
    window.collectC1NatalData = function() {
        const name = els.name.value.trim();
        if(!name) { alert("Seed Designation Required"); return null; }

        let finalLoc = null;
        if(manualOpen) {
            const latVal = parseInt(els.latInt.value||0) + parseFloat("0."+(els.latDec.value||0));
            const lngVal = parseInt(els.lngInt.value||0) + parseFloat("0."+(els.lngDec.value||0));
            const latSign = document.querySelector('.c1-sign-btn[data-target="lat"].active').dataset.sign === '+' ? 1 : -1;
            const lngSign = document.querySelector('.c1-sign-btn[data-target="lng"].active').dataset.sign === '+' ? 1 : -1;
            
            if(latVal === 0 && lngVal === 0) { alert("Coordinates Required"); return null; }
            
            finalLoc = {
                label: "Manual Entry",
                lat: latVal * latSign,
                lng: lngVal * lngSign,
                timezone: els.tz.value
            };
        } else {
            if(!pendingLocation) { alert("Point of Emergence Required"); return null; }
            finalLoc = pendingLocation;
        }

        const isUnk = els.unknown.checked;
        const dateStr = `${els.y.value}-${String(els.m.value).padStart(2,'0')}-${String(els.d.value).padStart(2,'0')}`;
        const timeStr = isUnk ? "12:00:00" : `${String(els.h.value).padStart(2,'0')}:${String(els.min.value).padStart(2,'0')}:${String(els.s.value).padStart(2,'0')}`;

        return {
            name: name,
            birth_date: dateStr,
            birth_time: timeStr,
            is_time_unknown: isUnk ? 1 : 0,
            location: finalLoc.label,
            lat: finalLoc.lat,
            lng: finalLoc.lng,
            timezone: finalLoc.timezone
        };
    };
};