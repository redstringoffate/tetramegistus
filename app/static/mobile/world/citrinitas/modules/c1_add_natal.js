/* static/mobile/world/citrinitas/modules/c1_add_natal.js */

(function() {
    let cities = {};
    let currentResults = [];
    let pendingLocation = null;
    let manualOpen = false;

    window.m_initC1Natal = function() {
        populateSelect('m-c1-natal-y', 1900, 2100, 2000, "YYYY");
        populateSelect('m-c1-natal-m', 1, 12, 1, "MM", true);
        populateSelect('m-c1-natal-d', 1, 31, 1, "DD", true);
        populateSelect('m-c1-natal-h', 0, 23, 0, "HH", true);
        populateSelect('m-c1-natal-min', 0, 59, 0, "MIN", true);
        populateSelect('m-c1-natal-s', 0, 59, 0, "SEC", true);
        
        populateTimezones('m-c1-tz');
        setupNumericValidation();
        bindNatalEvents();
        fetchCityData();
        bindConfirmButton();

        const editingId = sessionStorage.getItem('m_c1_editing_id');
        if (editingId) loadDataForEdit(editingId);
    };

    function loadDataForEdit(id) {
        let rawData = [];
        try {
            const parsed = JSON.parse(localStorage.getItem('c1_data'));
            rawData = parsed.data ? parsed.data : parsed;
        } catch(e) {}
        
        const item = rawData.find(d => d.id === id);
        if (!item) return;

        const t = item.payload ? item.payload : item; 

        document.getElementById('m-c1-natal-name').value = t.name || "";
        
        const dateStr = t.birth_date || `${t.year}-${String(t.month).padStart(2,'0')}-${String(t.day).padStart(2,'0')}`;
        const ymd = dateStr.split('-');
        document.getElementById('m-c1-natal-y').value = parseInt(ymd[0]);
        document.getElementById('m-c1-natal-m').value = parseInt(ymd[1]);
        adjustDays(); 
        document.getElementById('m-c1-natal-d').value = parseInt(ymd[2] || 1);

        const isUnk = t.is_time_unknown || t.time_unknown || t.unknown;
        document.getElementById('m-c1-natal-unknown').checked = !!isUnk;
        document.getElementById('m-c1-time-row').style.opacity = isUnk ? '0.3' : '1';
        document.getElementById('m-c1-time-row').style.pointerEvents = isUnk ? 'none' : 'auto';

        if (!isUnk) {
            const timeStr = t.birth_time || `${t.hour}:${t.minute}:${t.second}`;
            const hms = timeStr.split(':');
            document.getElementById('m-c1-natal-h').value = parseInt(hms[0] || 0);
            document.getElementById('m-c1-natal-min').value = parseInt(hms[1] || 0);
            document.getElementById('m-c1-natal-s').value = parseInt(hms[2] || 0);
        }

        if (t.location === "Manual Entry") {
            if(!manualOpen) document.getElementById('m-c1-manual-toggle').click();
            document.getElementById('m-c1-lat-int').value = Math.floor(Math.abs(t.lat));
            document.getElementById('m-c1-lat-dec').value = (Math.abs(t.lat) % 1).toFixed(4).substring(2).padEnd(4, '0');
            document.getElementById('m-c1-lng-int').value = Math.floor(Math.abs(t.lng));
            document.getElementById('m-c1-lng-dec').value = (Math.abs(t.lng) % 1).toFixed(4).substring(2).padEnd(4, '0');
            setSign('lat', t.lat >= 0 ? '+' : '-');
            setSign('lng', t.lng >= 0 ? '+' : '-');
            document.getElementById('m-c1-tz').value = t.timezone || 0;
        } else {
            if(manualOpen) document.getElementById('m-c1-manual-toggle').click();
            document.getElementById('m-c1-city-search').value = t.location || "";
            pendingLocation = { label: t.location, lat: t.lat, lng: t.lng, tz: t.timezone };
        }
    }

    function setSign(target, sign) {
        document.querySelectorAll(`.m-sign-toggle[data-target="${target}"] .m-sign-btn`).forEach(b => {
            if(b.dataset.sign === sign) b.classList.add('active'); else b.classList.remove('active');
        });
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
        setup('m-c1-lat-int', 0, 90); setup('m-c1-lat-dec', 0, 0, 4);
        setup('m-c1-lng-int', 0, 180); setup('m-c1-lng-dec', 0, 0, 4);
    }

    function adjustDays() {
        const y = parseInt(document.getElementById('m-c1-natal-y').value);
        const m = parseInt(document.getElementById('m-c1-natal-m').value);
        const daysInMonth = new Date(y, m, 0).getDate();
        const dSel = document.getElementById('m-c1-natal-d');
        const cur = parseInt(dSel.value);
        populateSelect('m-c1-natal-d', 1, daysInMonth, cur > daysInMonth ? daysInMonth : cur, "DD", true);
    }

    async function fetchCityData() {
        try { const r = await fetch('/api/cities'); if(r.ok) cities = await r.json(); } catch(e) {}
    }

    function bindNatalEvents() {
        document.getElementById('m-c1-natal-y').onchange = adjustDays;
        document.getElementById('m-c1-natal-m').onchange = adjustDays;

        document.getElementById('m-c1-natal-unknown').addEventListener('change', (e) => {
            const isUnk = e.target.checked;
            const tRow = document.getElementById('m-c1-time-row');
            tRow.style.opacity = isUnk ? '0.3' : '1';
            tRow.style.pointerEvents = isUnk ? 'none' : 'auto';
        });

        const manualToggle = document.getElementById('m-c1-manual-toggle');
        const manualPanel = document.getElementById('m-c1-manual-panel');
        const cityInp = document.getElementById('m-c1-city-search');
        
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

        const cityRes = document.getElementById('m-c1-city-results');
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
            const payload = collectNatalPayload();
            if (payload) {
                saveToLocalStorage(payload);
                if (window.m_c1_closeModal) window.m_c1_closeModal();
            }
        };
    }

    function collectNatalPayload() {
        const name = document.getElementById('m-c1-natal-name').value.trim();
        if(!name) { alert("Designation Required"); return null; }

        let finalLoc = null;
        if(manualOpen) {
            const latVal = parseInt(document.getElementById('m-c1-lat-int').value||0) + parseFloat("0."+(document.getElementById('m-c1-lat-dec').value||0));
            const lngVal = parseInt(document.getElementById('m-c1-lng-int').value||0) + parseFloat("0."+(document.getElementById('m-c1-lng-dec').value||0));
            const latSign = document.querySelector('.m-sign-toggle[data-target="lat"] .m-sign-btn.active').dataset.sign === '+' ? 1 : -1;
            const lngSign = document.querySelector('.m-sign-toggle[data-target="lng"] .m-sign-btn.active').dataset.sign === '+' ? 1 : -1;
            
            if(latVal === 0 && lngVal === 0) { alert("Coordinates Required"); return null; }
            finalLoc = { label: "Manual Entry", lat: latVal * latSign, lng: lngVal * lngSign, timezone: document.getElementById('m-c1-tz').value };
        } else {
            if(!pendingLocation) { alert("Point of Origin Required"); return null; }
            finalLoc = pendingLocation;
        }

        const isUnk = document.getElementById('m-c1-natal-unknown').checked;
        const y = document.getElementById('m-c1-natal-y').value;
        const m = String(document.getElementById('m-c1-natal-m').value).padStart(2,'0');
        const d = String(document.getElementById('m-c1-natal-d').value).padStart(2,'0');
        const h = String(document.getElementById('m-c1-natal-h').value).padStart(2,'0');
        const min = String(document.getElementById('m-c1-natal-min').value).padStart(2,'0');
        const s = String(document.getElementById('m-c1-natal-s').value).padStart(2,'0');

        return {
            name: name,
            birth_date: `${y}-${m}-${d}`,
            birth_time: isUnk ? "12:00:00" : `${h}:${min}:${s}`,
            is_time_unknown: isUnk ? 1 : 0,
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
                rawData[idx] = { id: editingId, type: 'natal', ...payload };
            }
            sessionStorage.removeItem('m_c1_editing_id');
        } else {
            if (rawData.length >= 50) { alert("Tabula Full: Maximum 50 items allowed."); return; }
            const newId = Date.now().toString();
            rawData.push({ id: newId, type: 'natal', ...payload });

            let config = { entities: {} };
            try { const c = localStorage.getItem('c1_config'); if(c) config = JSON.parse(c); } catch(e){}
            if (!config.entities) config.entities = {};
            config.entities[newId] = { active: true, subs: ['tropical'] };
            localStorage.setItem('c1_config', JSON.stringify(config));
        }

        if (isObject) { parsed.data = rawData; localStorage.setItem('c1_data', JSON.stringify(parsed)); }
        else { localStorage.setItem('c1_data', JSON.stringify(rawData)); }
    }
})();