/* static/mobile/world/citrinitas/modules/c1_add_conjunction.js */

(function() {
    let activePerson = 1; 
    let p1Data = null; 
    let p2Data = null; 

    let cities = {};
    let currentResults = [];
    let pendingLocation = null;
    let manualOpen = false;

    window.m_initC1Conj = function() {
        activePerson = 1;
        p1Data = null;
        p2Data = null;

        populateSelect('m-c1-conj-y', 1900, 2100, 2000, "YYYY");
        populateSelect('m-c1-conj-m', 1, 12, 1, "MM", true);
        populateSelect('m-c1-conj-d', 1, 31, 1, "DD", true);
        populateSelect('m-c1-conj-h', 0, 23, 0, "HH", true);
        populateSelect('m-c1-conj-min', 0, 59, 0, "MIN", true);
        populateSelect('m-c1-conj-s', 0, 59, 0, "SEC", true);
        
        populateTimezones('m-c1-conj-tz');
        setupNumericValidation();
        bindEvents();
        fetchCityData();
        bindConfirmButton();

        const editingId = sessionStorage.getItem('m_c1_editing_id');
        if (editingId) {
            loadDataForEdit(editingId);
        } else {
            document.getElementById('m-lbl-conj-name').textContent = "NAME (1)";
            document.getElementById('m-btn-p1').classList.add('active');
            document.getElementById('m-btn-p2').classList.remove('active');
        }
    };

    function loadDataForEdit(id) {
        let rawData = [];
        try {
            const parsed = JSON.parse(localStorage.getItem('c1_data'));
            rawData = parsed.data ? parsed.data : parsed;
        } catch(e){}
        
        const item = rawData.find(d => d.id === id);
        if (!item) return;

        const convert = (t) => {
            if(!t) return null;
            const dateStr = t.birth_date || `${t.year}-${String(t.month).padStart(2,'0')}-${String(t.day).padStart(2,'0')}`;
            const ymd = dateStr.split('-');
            const isUnk = t.is_time_unknown || t.time_unknown || t.unknown;
            const timeStr = (!isUnk && t.birth_time) ? t.birth_time : `${t.hour||0}:${t.minute||0}:${t.second||0}`;
            const hms = timeStr.split(':');
            
            const raw = {
                name: t.name,
                y: parseInt(ymd[0]), m: parseInt(ymd[1]), d: parseInt(ymd[2]||1),
                h: parseInt(hms[0]||0), min: parseInt(hms[1]||0), s: parseInt(hms[2]||0),
                unknown: !!isUnk,
                cityInp: "", manualOpen: false, pendingLocation: null,
                latInt: "", latDec: "", lngInt: "", lngDec: "",
                tz: t.timezone || 0, latSign: "+", lngSign: "+"
            };

            if (t.location === "Manual Entry") {
                raw.manualOpen = true;
                raw.latInt = Math.floor(Math.abs(t.lat)); 
                raw.latDec = (Math.abs(t.lat) % 1).toFixed(4).substring(2).padEnd(4, '0');
                raw.lngInt = Math.floor(Math.abs(t.lng)); 
                raw.lngDec = (Math.abs(t.lng) % 1).toFixed(4).substring(2).padEnd(4, '0');
                raw.latSign = t.lat >= 0 ? '+' : '-'; 
                raw.lngSign = t.lng >= 0 ? '+' : '-';
            } else {
                raw.cityInp = t.location;
                raw.pendingLocation = { label: t.location, lat: t.lat, lng: t.lng, tz: t.timezone };
            }
            return raw;
        };

        const payload = item.payload || {};
        const sourceP1 = payload.seed1 || payload.p1 || item.p1;
        const sourceP2 = payload.seed2 || payload.p2 || item.p2;

        p1Data = convert(sourceP1);
        p2Data = convert(sourceP2);

        activePerson = 1;
        document.getElementById('m-btn-p1').classList.add('active');
        document.getElementById('m-btn-p2').classList.remove('active');
        document.getElementById('m-lbl-conj-name').textContent = "NAME (1)";
        
        loadFromMemory(p1Data);
    }

    function populateSelect(id, start, end, def, placeholder, pad=false) {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = '';
        for (let i = start; i <= end; i++) {
            const val = pad ? i.toString().padStart(2, '0') : i;
            const opt = document.createElement('option');
            opt.value = i; opt.textContent = val;
            if (i === def) opt.selected = true;
            sel.appendChild(opt);
        }
    }

    function populateTimezones(id) {
        const sel = document.getElementById(id);
        if (!sel) return;
        const tzNames = {
            "-10": "HST", "-8": "PST", "-7": "MST", "-6": "CST", "-5": "EST",
            "0": "UTC/GMT", "+1": "CET", "+2": "EET", "+3": "MSK", "+5.5": "IST",
            "+7": "WIB", "+8": "CST/SGT", "+9": "KST/JST", "+10": "AEST", "+12": "NZST"
        };
        sel.innerHTML = '';
        for(let i=-12; i<=14; i++) {
            const opt = document.createElement('option');
            const sign = i >= 0 ? '+' : '';
            const label = tzNames[String(i)] || "";
            opt.value = i; opt.textContent = `UTC${sign}${i}${label ? ` (${label})` : ""}`;
            if(i === 9) opt.selected = true; 
            sel.appendChild(opt);
        }
    }

    function setupNumericValidation() {
        const setup = (id, min, max, digits) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener("input", () => {
                if (digits) el.value = el.value.replace(/\D/g, "").slice(0, digits);
                else {
                    let v = parseInt(el.value || "0", 10);
                    if (isNaN(v)) el.value = ""; else el.value = Math.max(min, Math.min(max, v));
                }
            });
        };
        setup('m-c1-conj-lat-int', 0, 90); setup('m-c1-conj-lat-dec', 0, 0, 4);
        setup('m-c1-conj-lng-int', 0, 180); setup('m-c1-conj-lng-dec', 0, 0, 4);
    }

    function adjustDays() {
        const y = parseInt(document.getElementById('m-c1-conj-y').value);
        const m = parseInt(document.getElementById('m-c1-conj-m').value);
        const daysInMonth = new Date(y, m, 0).getDate();
        const dSel = document.getElementById('m-c1-conj-d');
        const cur = parseInt(dSel.value);
        populateSelect('m-c1-conj-d', 1, daysInMonth, cur > daysInMonth ? daysInMonth : cur, "DD", true);
    }

    async function fetchCityData() {
        try { const r = await fetch('/api/cities'); if(r.ok) cities = await r.json(); } catch(e) {}
    }

    window.m_c1_switchPerson = function(target) {
        if (activePerson === target) return;
        saveCurrentToMemory();

        activePerson = target;
        document.getElementById('m-btn-p1').classList.toggle('active', activePerson === 1);
        document.getElementById('m-btn-p2').classList.toggle('active', activePerson === 2);
        document.getElementById('m-lbl-conj-name').textContent = activePerson === 1 ? "NAME (1)" : "NAME (2)";

        loadFromMemory(activePerson === 1 ? p1Data : p2Data);
    };

    function saveCurrentToMemory() {
        const latActive = document.querySelector('.m-sign-toggle[data-target="lat"] .m-sign-btn.active');
        const lngActive = document.querySelector('.m-sign-toggle[data-target="lng"] .m-sign-btn.active');

        const currentData = {
            name: document.getElementById('m-c1-conj-name').value,
            y: document.getElementById('m-c1-conj-y').value,
            m: document.getElementById('m-c1-conj-m').value,
            d: document.getElementById('m-c1-conj-d').value,
            h: document.getElementById('m-c1-conj-h').value,
            min: document.getElementById('m-c1-conj-min').value,
            s: document.getElementById('m-c1-conj-s').value,
            unknown: document.getElementById('m-c1-conj-unknown').checked,
            cityInp: document.getElementById('m-c1-conj-city-search').value,
            pendingLocation: pendingLocation,
            manualOpen: manualOpen,
            latInt: document.getElementById('m-c1-conj-lat-int').value,
            latDec: document.getElementById('m-c1-conj-lat-dec').value,
            lngInt: document.getElementById('m-c1-conj-lng-int').value,
            lngDec: document.getElementById('m-c1-conj-lng-dec').value,
            tz: document.getElementById('m-c1-conj-tz').value,
            latSign: latActive ? latActive.dataset.sign : '+',
            lngSign: lngActive ? lngActive.dataset.sign : '+'
        };

        if (activePerson === 1) p1Data = currentData; else p2Data = currentData;
    }

    function loadFromMemory(data) {
        const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
        
        if (!data) {
            setVal('m-c1-conj-name', "");
            setVal('m-c1-conj-y', 2000); setVal('m-c1-conj-m', 1); setVal('m-c1-conj-d', 1);
            setVal('m-c1-conj-h', 0); setVal('m-c1-conj-min', 0); setVal('m-c1-conj-s', 0);
            document.getElementById('m-c1-conj-unknown').checked = false;
            setVal('m-c1-conj-city-search', "");
            pendingLocation = null; manualOpen = false;
            setVal('m-c1-conj-lat-int', ""); setVal('m-c1-conj-lat-dec', "");
            setVal('m-c1-conj-lng-int', ""); setVal('m-c1-conj-lng-dec', "");
            setVal('m-c1-conj-tz', 9);
            setSign('lat', '+'); setSign('lng', '+');
        } else {
            setVal('m-c1-conj-name', data.name);
            setVal('m-c1-conj-y', data.y); setVal('m-c1-conj-m', data.m); 
            adjustDays(); 
            setVal('m-c1-conj-d', data.d);
            setVal('m-c1-conj-h', data.h); setVal('m-c1-conj-min', data.min); setVal('m-c1-conj-s', data.s);
            document.getElementById('m-c1-conj-unknown').checked = data.unknown;
            setVal('m-c1-conj-city-search', data.cityInp);
            pendingLocation = data.pendingLocation; manualOpen = data.manualOpen;
            setVal('m-c1-conj-lat-int', data.latInt); setVal('m-c1-conj-lat-dec', data.latDec);
            setVal('m-c1-conj-lng-int', data.lngInt); setVal('m-c1-conj-lng-dec', data.lngDec);
            setVal('m-c1-conj-tz', data.tz);
            setSign('lat', data.latSign); setSign('lng', data.lngSign);
        }

        document.getElementById('m-c1-conj-manual-panel').style.display = manualOpen ? 'flex' : 'none';
        document.getElementById('m-c1-conj-manual-toggle').textContent = manualOpen ? 'Manual Entry ▴' : 'Manual Entry ▾';
        document.getElementById('m-c1-conj-unknown').dispatchEvent(new Event('change'));
    }

    function setSign(target, sign) {
        document.querySelectorAll(`.m-sign-toggle[data-target="${target}"] .m-sign-btn`).forEach(b => {
            if(b.dataset.sign === sign) b.classList.add('active'); else b.classList.remove('active');
        });
    }

    function bindEvents() {
        document.getElementById('m-c1-conj-y').onchange = adjustDays;
        document.getElementById('m-c1-conj-m').onchange = adjustDays;

        document.getElementById('m-c1-conj-unknown').addEventListener('change', (e) => {
            const isUnk = e.target.checked;
            const tRow = document.getElementById('m-c1-conj-time-row');
            tRow.style.opacity = isUnk ? '0.3' : '1';
            tRow.style.pointerEvents = isUnk ? 'none' : 'auto';
        });

        const manualToggle = document.getElementById('m-c1-conj-manual-toggle');
        const manualPanel = document.getElementById('m-c1-conj-manual-panel');
        const cityInp = document.getElementById('m-c1-conj-city-search');
        
        manualToggle.addEventListener('click', () => {
            manualOpen = !manualOpen;
            manualPanel.style.display = manualOpen ? 'flex' : 'none';
            manualToggle.textContent = manualOpen ? 'Manual Entry ▴' : 'Manual Entry ▾';
            if(manualOpen) { cityInp.value = ''; pendingLocation = null; }
        });

        document.querySelectorAll('.m-sign-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parent = e.target.closest('.m-sign-toggle');
                parent.querySelectorAll('.m-sign-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        const cityRes = document.getElementById('m-c1-conj-city-results');
        cityInp.addEventListener('input', (e) => {
            if(manualOpen) manualToggle.click();
            const q = e.target.value.trim().toLowerCase();
            if(!q) { cityRes.style.display = 'none'; return; }
            
            currentResults = Object.values(cities).filter(c => c.label.toLowerCase().includes(q)).slice(0, 8);
            cityRes.innerHTML = '';
            
            if (currentResults.length > 0) {
                cityRes.style.display = 'block';
                currentResults.forEach(c => {
                    const div = document.createElement('div');
                    div.className = 'm-city-item';
                    div.textContent = c.label;
                    div.addEventListener('click', () => {
                        pendingLocation = { label: c.label, lat: c.lat, lng: c.lon || c.lng, tz: c.tz };
                        cityInp.value = c.label;
                        cityRes.style.display = 'none';
                    });
                    cityRes.appendChild(div);
                });
            } else { cityRes.style.display = 'none'; }
        });
    }

    function bindConfirmButton() {
        const confirmBtn = document.getElementById('m-c1-btn-confirm');
        if (!confirmBtn) return;
        
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        
        newBtn.onclick = () => {
            saveCurrentToMemory(); 

            if (!p1Data || !p1Data.name.trim()) { alert("Person 1 Designation Required"); m_c1_switchPerson(1); return; }
            if (!p2Data || !p2Data.name.trim()) { alert("Person 2 Designation Required"); m_c1_switchPerson(2); return; }

            const p1Payload = processData(p1Data);
            if (!p1Payload) { alert("Person 1 Location Required"); m_c1_switchPerson(1); return; }

            const p2Payload = processData(p2Data);
            if (!p2Payload) { alert("Person 2 Location Required"); m_c1_switchPerson(2); return; }

            const payload = {
                type: 'conjunction',
                name: `${p1Payload.name} & ${p2Payload.name}`,
                p1: p1Payload,
                p2: p2Payload
            };

            saveToLocalStorage(payload);
            if (window.m_c1_closeModal) window.m_c1_closeModal();
        };
    }

    function processData(d) {
        let finalLoc = null;
        if (d.manualOpen) {
            const latVal = parseInt(d.latInt||0) + parseFloat("0."+(d.latDec||0));
            const lngVal = parseInt(d.lngInt||0) + parseFloat("0."+(d.lngDec||0));
            const latS = d.latSign === '+' ? 1 : -1;
            const lngS = d.lngSign === '+' ? 1 : -1;
            if(latVal === 0 && lngVal === 0) return null;
            finalLoc = { label: "Manual Entry", lat: latVal * latS, lng: lngVal * lngS, timezone: d.tz };
        } else {
            if(!d.pendingLocation) return null;
            finalLoc = d.pendingLocation;
        }

        const dateStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
        const timeStr = d.unknown ? "12:00:00" : `${String(d.h).padStart(2,'0')}:${String(d.min).padStart(2,'0')}:${String(d.s).padStart(2,'0')}`;

        return {
            name: d.name.trim(),
            birth_date: dateStr,
            birth_time: timeStr,
            is_time_unknown: d.unknown ? 1 : 0,
            location: finalLoc.label,
            lat: finalLoc.lat,
            lng: finalLoc.lng,
            timezone: finalLoc.timezone
        };
    }

    function saveToLocalStorage(payload) {
        let parsed = null;
        let rawData = [];
        let isObject = false;
        try {
            const d = localStorage.getItem('c1_data');
            if (d) {
                parsed = JSON.parse(d);
                isObject = !Array.isArray(parsed);
                rawData = isObject ? (parsed.data || []) : parsed;
            }
        } catch(e) {}

        const editingId = sessionStorage.getItem('m_c1_editing_id');
        
        if (editingId) {
            const idx = rawData.findIndex(d => d.id === editingId);
            if (idx > -1) {
                rawData[idx] = { id: editingId, type: 'conjunction', ...payload };
            }
            sessionStorage.removeItem('m_c1_editing_id');
        } else {
            if (rawData.length >= 50) { alert("Tabula Full"); return; }
            const newId = Date.now().toString();
            rawData.push({ id: newId, type: 'conjunction', ...payload });

            let config = { entities: {} };
            try { const c = localStorage.getItem('c1_config'); if(c) config = JSON.parse(c); } catch(e){}
            if (!config.entities) config.entities = {};
            config.entities[newId] = { active: true, subs: ['comp_main', 'davi_tro'] };
            localStorage.setItem('c1_config', JSON.stringify(config));
        }

        if (isObject) { parsed.data = rawData; localStorage.setItem('c1_data', JSON.stringify(parsed)); }
        else { localStorage.setItem('c1_data', JSON.stringify(rawData)); }
    }
})();