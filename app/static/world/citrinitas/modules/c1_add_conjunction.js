/* C1 ADD CONJUNCTION LOGIC (Edit Enabled) */

window.initC1Conj = function() {
    console.log("[C1] Conjunction Module Loaded.");

    // ── STATE ──
    let activePerson = 1; 
    let p1Data = null; // Stores P1 form snapshot
    let p2Data = null; // Stores P2 form snapshot
    
    let cities = {};
    let currentResults = [];
    let activeIndex = -1;
    let manualOpen = false;
    let pendingLocation = null;

    // ── ELEMENTS ──
    const els = {
        labelName: document.getElementById('lbl-name'),
        name: document.getElementById('c1-conj-name'),
        y: document.getElementById('c1-conj-y'),
        m: document.getElementById('c1-conj-m'),
        d: document.getElementById('c1-conj-d'),
        h: document.getElementById('c1-conj-h'),
        min: document.getElementById('c1-conj-min'),
        s: document.getElementById('c1-conj-s'),
        unknown: document.getElementById('c1-conj-unknown'),
        
        cityInp: document.getElementById('c1-conj-city-search'),
        cityRes: document.getElementById('c1-conj-city-results'),
        
        manualToggle: document.getElementById('c1-conj-manual-toggle'),
        manualPanel: document.getElementById('c1-conj-manual-panel'),
        
        latInt: document.getElementById('c1-conj-lat-int'),
        latDec: document.getElementById('c1-conj-lat-dec'),
        lngInt: document.getElementById('c1-conj-lng-int'),
        lngDec: document.getElementById('c1-conj-lng-dec'),
        tz: document.getElementById('c1-conj-tz'),
        
        btnP1: document.getElementById('btn-p1'),
        btnP2: document.getElementById('btn-p2'),
        tooltip: document.getElementById('c1-conj-tooltip')
    };

    // ── HELPERS ──
    function setupNumeric(id, min, max, digits) {
        const el = document.getElementById(id);
        if(!el) return;
        el.addEventListener("input", () => {
            if (digits) el.value = el.value.replace(/\D/g, "").slice(0, digits);
            else {
                let v = parseInt(el.value || "0", 10);
                if (isNaN(v)) el.value = "";
                else el.value = Math.max(min, Math.min(max, v));
            }
        });
    }
    setupNumeric('c1-conj-lat-int', 0, 90); setupNumeric('c1-conj-lat-dec', 0, 0, 4);
    setupNumeric('c1-conj-lng-int', 0, 180); setupNumeric('c1-conj-lng-dec', 0, 0, 4);

    function fillSelect(sel, start, end, pad=false) {
        sel.innerHTML = '';
        for(let i=start; i<=end; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = pad ? String(i).padStart(2, '0') : i;
            sel.appendChild(opt);
        }
    }

    // ── INITIALIZE ──
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

    // Date Logic
    els.y.onchange = els.m.onchange = () => {
        const y = parseInt(els.y.value), m = parseInt(els.m.value), cur = parseInt(els.d.value);
        const days = new Date(y, m, 0).getDate();
        fillSelect(els.d, 1, days, true);
        els.d.value = cur > days ? days : cur;
    };

    // City API
    fetch('/api/cities').then(r => r.json()).then(d => cities = d);

    // ── SWITCH LOGIC ──
    window.c1_switchPerson = function(target) {
        if (activePerson === target) return;

        // 1. Save Current to Memory
        saveCurrentToMemory();

        // 2. Switch State
        activePerson = target;
        els.btnP1.classList.toggle('active', activePerson === 1);
        els.btnP2.classList.toggle('active', activePerson === 2);
        els.labelName.textContent = activePerson === 1 ? "NAME (1)" : "NAME (2)";

        // 3. Load Target from Memory
        loadFromMemory(activePerson === 1 ? p1Data : p2Data);
    };

    function saveCurrentToMemory() {
        const currentData = extractFormData();
        if (activePerson === 1) p1Data = currentData;
        else p2Data = currentData;
    }

    function extractFormData() {
        // Collects raw form values (not full processing yet)
        return {
            name: els.name.value,
            y: els.y.value, m: els.m.value, d: els.d.value,
            h: els.h.value, min: els.min.value, s: els.s.value,
            unknown: els.unknown.checked,
            cityInp: els.cityInp.value,
            pendingLocation: pendingLocation, // Object ref
            manualOpen: manualOpen,
            latInt: els.latInt.value, latDec: els.latDec.value,
            lngInt: els.lngInt.value, lngDec: els.lngDec.value,
            tz: els.tz.value,
            // Save active sign buttons
            latSign: document.querySelector('.c1-sign-btn[data-target="lat"].active').dataset.sign,
            lngSign: document.querySelector('.c1-sign-btn[data-target="lng"].active').dataset.sign
        };
    }

    function loadFromMemory(data) {
        if (!data) {
            // Reset to Default
            els.name.value = "";
            els.y.value = 2000; els.m.value = 1; els.d.value = 1;
            els.h.value = 0; els.min.value = 0; els.s.value = 0;
            els.unknown.checked = false;
            els.cityInp.value = "";
            pendingLocation = null;
            manualOpen = false;
            els.latInt.value = ""; els.latDec.value = "";
            els.lngInt.value = ""; els.lngDec.value = "";
            els.tz.value = 9;
            setSign('lat', '+'); setSign('lng', '+');
        } else {
            // Restore
            els.name.value = data.name;
            els.y.value = data.y; els.m.value = data.m; els.d.value = data.d;
            els.h.value = data.h; els.min.value = data.min; els.s.value = data.s;
            els.unknown.checked = data.unknown;
            els.cityInp.value = data.cityInp;
            pendingLocation = data.pendingLocation;
            manualOpen = data.manualOpen;
            els.latInt.value = data.latInt; els.latDec.value = data.latDec;
            els.lngInt.value = data.lngInt; els.lngDec.value = data.lngDec;
            els.tz.value = data.tz;
            setSign('lat', data.latSign); setSign('lng', data.lngSign);
        }
        // UI Refresh
        els.manualPanel.style.display = manualOpen ? 'block' : 'none';
        els.manualToggle.textContent = manualOpen ? 'Manual Entry ▴' : 'Manual Entry ▾';
    }

    function setSign(target, sign) {
        document.querySelectorAll(`.c1-sign-btn[data-target="${target}"]`).forEach(b => {
            if(b.dataset.sign === sign) b.classList.add('active');
            else b.classList.remove('active');
        });
    }

    // ── UI EVENT LISTENERS ──
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
        if(manualOpen) { manualOpen = false; els.manualPanel.style.display='none'; els.manualToggle.textContent='Manual Entry ▾'; }
        const q = e.target.value.trim().toLowerCase();
        if(!q) { els.cityRes.style.display = 'none'; return; }
        currentResults = Object.values(cities).filter(c => c.label.toLowerCase().includes(q)).slice(0, 8);
        renderResults();
    });

    els.cityInp.addEventListener('blur', () => setTimeout(() => els.cityRes.style.display = 'none', 200));
    
    els.cityInp.addEventListener('keydown', (e) => {
        if(!currentResults.length) return;
        if(e.key === 'ArrowDown') { e.preventDefault(); activeIndex = (activeIndex + 1) % currentResults.length; renderResults(); }
        else if(e.key === 'ArrowUp') { e.preventDefault(); activeIndex = (activeIndex - 1 + currentResults.length) % currentResults.length; renderResults(); }
        else if(e.key === 'Enter') { e.preventDefault(); if(activeIndex >= 0) selectCity(activeIndex); }
    });

    els.manualToggle.onclick = () => {
        manualOpen = !manualOpen;
        els.manualPanel.style.display = manualOpen ? 'block' : 'none';
        els.manualToggle.textContent = manualOpen ? 'Manual Entry ▴' : 'Manual Entry ▾';
        if(manualOpen) { els.cityInp.value = ''; pendingLocation = null; }
    };

    document.querySelectorAll('.c1-sign-btn').forEach(btn => {
        btn.onclick = () => setSign(btn.dataset.target, btn.dataset.sign);
    });

    // ─────────────────────────────────────────────────────────────
    // 🚀 [NEW]: Populate Data for Edit (Reverse Engineering)
    // ─────────────────────────────────────────────────────────────
    window.populateC1Conj = function(savedData) {
        // Helper to convert processed record back to raw form data (State Object)
        const convert = (p) => {
            const dSplit = p.birth_date.split('-');
            // Parse time, defaulting to 00:00:00 if unknown or missing
            const tSplit = (!p.birth_time || (p.birth_time === "12:00:00" && p.is_time_unknown)) 
                ? [0,0,0] 
                : p.birth_time.split(':');
            
            const raw = {
                name: p.name,
                y: parseInt(dSplit[0]), m: parseInt(dSplit[1]), d: parseInt(dSplit[2]),
                h: parseInt(tSplit[0]||0), min: parseInt(tSplit[1]||0), s: parseInt(tSplit[2]||0),
                unknown: !!p.is_time_unknown,
                cityInp: "",
                manualOpen: false,
                pendingLocation: null,
                latInt: "", latDec: "", lngInt: "", lngDec: "",
                tz: p.timezone,
                latSign: "+", lngSign: "+"
            };

            if (p.location === "Manual Entry") {
                raw.manualOpen = true;
                const latAbs = Math.abs(p.lat);
                const lngAbs = Math.abs(p.lng);
                raw.latInt = Math.floor(latAbs); 
                raw.latDec = (latAbs % 1).toFixed(4).substring(2);
                raw.lngInt = Math.floor(lngAbs); 
                raw.lngDec = (lngAbs % 1).toFixed(4).substring(2);
                raw.latSign = p.lat >= 0 ? '+' : '-';
                raw.lngSign = p.lng >= 0 ? '+' : '-';
            } else {
                raw.cityInp = p.location;
                raw.pendingLocation = { label: p.location, lat: p.lat, lng: p.lng, timezone: p.timezone };
            }
            return raw;
        };

        // Populate State Variables
        if (savedData.p1) p1Data = convert(savedData.p1);
        if (savedData.p2) p2Data = convert(savedData.p2);

        // Reset View to Person 1
        activePerson = 1;
        els.btnP1.classList.add('active');
        els.btnP2.classList.remove('active');
        els.labelName.textContent = "NAME (1)";
        
        // Render P1 Data to DOM
        loadFromMemory(p1Data);
    };

    // ── FINAL COLLECTION ──
    window.collectC1ConjunctionData = function() {
        // 1. Force Save Current View
        saveCurrentToMemory();

        // 2. Validate
        if (!p1Data || !p1Data.name) { alert("Person 1 Data Required"); c1_switchPerson(1); return null; }
        if (!p2Data || !p2Data.name) { alert("Person 2 Data Required"); c1_switchPerson(2); return null; }

        // 3. Process Both
        function process(d) {
            let finalLoc = null;
            if (d.manualOpen) {
                const latVal = parseInt(d.latInt||0) + parseFloat("0."+(d.latDec||0));
                const lngVal = parseInt(d.lngInt||0) + parseFloat("0."+(d.lngDec||0));
                const latS = d.latSign === '+' ? 1 : -1;
                const lngS = d.lngSign === '+' ? 1 : -1;
                if(latVal === 0 && lngVal === 0) return null; // Invalid manual
                finalLoc = { label: "Manual Entry", lat: latVal * latS, lng: lngVal * lngS, timezone: d.tz };
            } else {
                if(!d.pendingLocation) return null;
                finalLoc = d.pendingLocation;
            }
            if (!finalLoc) return null;

            const dateStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
            const timeStr = d.unknown ? "12:00:00" : `${String(d.h).padStart(2,'0')}:${String(d.min).padStart(2,'0')}:${String(d.s).padStart(2,'0')}`;
            
            return {
                name: d.name,
                birth_date: dateStr,
                birth_time: timeStr,
                is_time_unknown: d.unknown ? 1 : 0,
                location: finalLoc.label,
                lat: finalLoc.lat,
                lng: finalLoc.lng,
                timezone: finalLoc.timezone
            };
        }

        const p1 = process(p1Data);
        if(!p1) { alert("Person 1 Location Required"); c1_switchPerson(1); return null; }
        
        const p2 = process(p2Data);
        if(!p2) { alert("Person 2 Location Required"); c1_switchPerson(2); return null; }

        // 4. Return Conjunction Payload
        return {
            name: `${p1.name} & ${p2.name}`,
            p1: p1,
            p2: p2,
            type: 'conjunction'
        };
    };
};