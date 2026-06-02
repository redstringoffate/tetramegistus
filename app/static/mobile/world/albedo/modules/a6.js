/* static/mobile/world/albedo/modules/a6.js - Mobile MULTIPLICATIO */

const A6_STATE = {
    mode: 'harmonics', 
    view: 'positions', 
    ayanamsa: 'lahiri',
    h_level: 1,
    v_graha: 'Lagna',
    data: null,
    vargaDefs: null,
    selectedBody: null,
    selectedAspect: null
};

const CELESTIALS = [
    "Sun", "Moon", "Mercury", "Venus", "Mars", 
    "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", 
    "Chiron", "Mean Lilith", "True Lilith", "North Node (t)"
];

const H_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 32];

const GRAHAS = [
    {id: 'Lagna', label: 'Ascendant'}, {id: 'Surya', label: 'Sun'}, 
    {id: 'Chandra', label: 'Moon'}, {id: 'Budha', label: 'Mercury'},
    {id: 'Shukra', label: 'Venus'}, {id: 'Mangala', label: 'Mars'},
    {id: 'Brihaspati', label: 'Jupiter'}, {id: 'Shani', label: 'Saturn'},
    {id: 'Ketu', label: 'South Node'}, {id: 'Rahu', label: 'North Node'}
];

const AYANAMSAS = [
    { id: 'lahiri', label: 'Lahiri' },
    { id: 'raman', label: 'Raman' },
    { id: 'kp', label: 'KP' },
    { id: 'fagan-bradley', label: 'Fagan' },
    { id: 'yukteswar', label: 'Yukteswar' }
];

const VARGA_DIVISIONS = [
    "D1", "D2", "D3", "D4", "D6", "D7", "D8", "D9", "D10", "D12", 
    "D16", "D20", "D24", "D30", "D60"
];

const ASPECT_GROUPS = {
    "Major": ["Conjunction", "Opposition", "Trine", "Square", "Sextile"],
    "Minor": ["Quintile", "Septile", "Octile", "Novile", "Decile", "Undecile", "Semi-sextile", "Quincunx"]
};

// 점성학적 컬러 매핑
const SIGN_COLORS = {
    "Aries": "#FFCCCC", "Leo": "#FFCCCC", "Sagittarius": "#FFCCCC",
    "Mesha": "#FFCCCC", "Simha": "#FFCCCC", "Dhanu": "#FFCCCC", "Dhanus": "#FFCCCC",
    "Taurus": "#FFFF99", "Virgo": "#FFFF99", "Capricorn": "#FFFF99",
    "Vrishabha": "#FFFF99", "Kanya": "#FFFF99", "Makara": "#FFFF99",
    "Gemini": "#F2F2F2", "Libra": "#F2F2F2", "Aquarius": "#F2F2F2",
    "Mithuna": "#F2F2F2", "Tula": "#F2F2F2", "Kumbha": "#F2F2F2",
    "Cancer": "#CCFFFF", "Scorpio": "#CCFFFF", "Pisces": "#CCFFFF",
    "Karka": "#CCFFFF", "Kataka": "#CCFFFF", "Vrishchika": "#CCFFFF", "Meena": "#CCFFFF"
};

const VEDIC_COLORS = { "Dharma": "#FFC000", "Artha": "#66FF05", "Kama": "#FF99FF", "Moksha": "#CCCCFF" };

const PLANET_COLORS = {
    "Rahu": "#595959", "☊": "#595959", "Ketu": "#EEEEEE", "☋": "#EEEEEE",
    "Saturn": "#FFFF00", "♄": "#FFFF00", "Jupiter": "#00B050", "♃": "#00B050",
    "Mars": "#FF0000", "♂": "#FF0000", "Sun": "#FF66CC", "☉": "#FF66CC",
    "Venus": "#A6A6A6", "♀": "#A6A6A6", "Mercury": "#00B0F0", "☿": "#00B0F0",
    "Moon": "#FFCCFF", "☽": "#FFCCFF"
};

const NAKSHATRA_RULERS = {
    "Ashwini": "Ketu", "Magha": "Ketu", "Mula": "Ketu",
    "Bharani": "Venus", "Purva Phalguni": "Venus", "Purva Ashadha": "Venus",
    "Krittika": "Sun", "Uttara Phalguni": "Sun", "Uttara Ashadha": "Sun",
    "Rohini": "Moon", "Hasta": "Moon", "Shravana": "Moon",
    "Mrigashirsha": "Mars", "Chitra": "Mars", "Dhanishta": "Mars",
    "Ardra": "Rahu", "Swati": "Rahu", "Shatabhisha": "Rahu",
    "Punarvasu": "Jupiter", "Vishakha": "Jupiter", "Purva Bhadrapada": "Jupiter",
    "Pushya": "Saturn", "Anuradha": "Saturn", "Uttara Bhadrapada": "Saturn",
    "Ashlesha": "Mercury", "Jyeshtha": "Mercury", "Revati": "Mercury"
};

const SIGN_RULERS = {
    "Mesha": "Mars", "Vrishabha": "Venus", "Mithuna": "Mercury", "Karka": "Moon",
    "Simha": "Sun", "Kanya": "Mercury", "Tula": "Venus", "Vrishchika": "Mars",
    "Dhanu": "Jupiter", "Makara": "Saturn", "Kumbha": "Saturn", "Meena": "Jupiter"
};

const NAK_LIST = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
const NAK_RULERS_CYCLE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];

let a6ToastTimer = null;

// 🚀 Albedo 동기화 로직
async function ensureAlbedoSession() {
    const activeDavison = JSON.parse(localStorage.getItem('active_davison'));
    const activeComposite = JSON.parse(localStorage.getItem('active_composite'));
    const activeSeed = activeDavison || activeComposite;
    if (!activeSeed) return false;
    
    try {
        const res = await fetch('/api/astro/coagulatio/sync-active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activeSeed)
        });
        return res.ok;
    } catch (e) { return false; }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 🚀 [추가]: URL 해시를 읽어 초기 상태 복구
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        const parts = hash.split('-');
        if (parts[0] === 'varga' || parts[0] === 'harmonics') A6_STATE.mode = parts[0];
        if (parts[1] && (parts[1] === 'positions' || parts[1] === 'aspects')) A6_STATE.view = parts[1];
    }

    initGrids();
    updateA6UI();
    fetchVargaDefs();
    
    // Albedo 세션 연결 대기
    let isStationReady = false;
    while (!isStationReady) {
        isStationReady = await ensureAlbedoSession();
        if (!isStationReady) await new Promise(r => setTimeout(r, 200));
    }
    
    fetchA6Data();

    document.addEventListener('touchstart', (e) => {
        const popover = document.getElementById('fs-popover');
        if (popover && popover.style.display === 'block') {
            if (!e.target.closest('.fs-popover-box') && !e.target.closest('.sticky-col')) {
                popover.style.display = 'none';
                popover.classList.remove('active');
            }
        }
        
        const ddList = document.getElementById('a6-dd-list');
        const ddSel = document.getElementById('a6-dd-selected');
        if (ddList && ddList.style.display === 'block') {
            if (e.target !== ddList && e.target !== ddSel && !ddSel.contains(e.target)) {
                ddList.style.display = 'none';
            }
        }
    });
});

window.toggleA6Dropdown = function() {
    const list = document.getElementById('a6-dd-list');
    if(list) list.style.display = list.style.display === 'none' ? 'block' : 'none';
};

function initGrids() {
    const ayanNav = document.getElementById('a6-ayanamsa-nav-container');
    if (ayanNav) {
        ayanNav.innerHTML = '';
        AYANAMSAS.forEach(ay => {
            const btn = document.createElement('button');
            btn.className = `m-tab ${A6_STATE.ayanamsa === ay.id ? 'active' : ''}`;
            btn.textContent = ay.label;
            btn.onclick = () => window.switchA6Ayanamsa(ay.id);
            ayanNav.appendChild(btn);
        });
    }

    const grahaGrid = document.getElementById('a6-graha-grid');
    if (grahaGrid) {
        grahaGrid.innerHTML = '';
        GRAHAS.forEach(g => {
            const btn = document.createElement('div');
            btn.className = `m-grid-btn ${A6_STATE.v_graha === g.id ? 'active' : ''}`;
            btn.textContent = g.id;
            btn.onclick = () => { A6_STATE.v_graha = g.id; initGrids(); renderA6(); };
            grahaGrid.appendChild(btn);
        });
    }

    const hGrid = document.getElementById('a6-h-btn-grid');
    if (hGrid) {
        hGrid.innerHTML = '';
        H_LEVELS.forEach(h => {
            const btn = document.createElement('div');
            btn.className = `m-grid-btn ${A6_STATE.h_level === h ? 'active' : ''}`;
            btn.textContent = `H${h}`;
            btn.onclick = () => { 
                A6_STATE.h_level = h; 
                initGrids(); 
                A6_STATE.selectedAspect = null;
                if(A6_STATE.view === 'positions') renderPositions();
                else renderAspects(); 
            };
            hGrid.appendChild(btn);
        });
    }

    const posThead = document.getElementById('m-a6-thead-positions');
    if (posThead && posThead.children.length === 1) {
        H_LEVELS.forEach(h => {
            const th = document.createElement('th');
            th.textContent = `H${h}`;
            posThead.appendChild(th);
        });
    }
}

function handleA6VargaLock(isLocked) {
    const vargaLabel = document.getElementById('a6-lbl-varga');
    const toggleSwitch = document.querySelector('.m-anti-switch-module .m-toggle-switch');

    if (isLocked) {
        if (vargaLabel) {
            vargaLabel.innerHTML = 'VARGA 🔒';
            vargaLabel.style.opacity = '0.5';
            vargaLabel.style.color = '#ff6b6b'; 
        }
        if (toggleSwitch) {
            toggleSwitch.style.opacity = '0.5';
        }
    } else {
        if (vargaLabel) {
            vargaLabel.innerHTML = 'VARGA';
            vargaLabel.style.opacity = '1';
            vargaLabel.style.color = ''; 
        }
        if (toggleSwitch) {
            toggleSwitch.style.opacity = '1';
        }
    }
}

function updateA6UI() {
    const knobMode = document.getElementById('a6-knob-mode');
    const knobView = document.getElementById('a6-knob-view');

    if (A6_STATE.mode === 'varga') {
        knobMode.classList.add('right');
        document.getElementById('a6-lbl-harmonics').classList.remove('active');
        document.getElementById('a6-lbl-varga').classList.add('active');
        
        document.getElementById('a6-dicho-view').style.display = 'none';
        document.getElementById('m-a6-controls-varga').style.display = 'block';

        document.getElementById('m-view-positions').style.display = 'none';
        document.getElementById('m-view-aspects').style.display = 'none';
        document.getElementById('m-view-varga').style.display = 'block';
    } else {
        knobMode.classList.remove('right');
        document.getElementById('a6-lbl-harmonics').classList.add('active');
        document.getElementById('a6-lbl-varga').classList.remove('active');

        document.getElementById('a6-dicho-view').style.display = 'flex';
        document.getElementById('m-a6-controls-varga').style.display = 'none';

        if (A6_STATE.view === 'aspects') {
            knobView.classList.add('right');
            document.getElementById('a6-lbl-positions').classList.remove('active');
            document.getElementById('a6-lbl-aspects').classList.add('active');
            
            document.getElementById('m-view-positions').style.display = 'none';
            document.getElementById('m-view-aspects').style.display = 'block';
            document.getElementById('m-view-varga').style.display = 'none'; 
        } else {
            knobView.classList.remove('right');
            document.getElementById('a6-lbl-positions').classList.add('active');
            document.getElementById('a6-lbl-aspects').classList.remove('active');
            
            document.getElementById('m-view-positions').style.display = 'block';
            document.getElementById('m-view-aspects').style.display = 'none';
            document.getElementById('m-view-varga').style.display = 'none'; 
        }
    }
}

window.toggleA6Mode = function() {
    const isLocked = A6_STATE.data && A6_STATE.data.meta && Number(A6_STATE.data.meta.is_time_unknown) === 1;
    if (isLocked) {
        showA6Toast("<strong style='color:#ff6b6b;'>TIME UNKNOWN</strong><br><span style='color:#ccc;'>Varga calculation is locked.</span>");
        return;
    }
    A6_STATE.mode = (A6_STATE.mode === 'harmonics') ? 'varga' : 'harmonics';
    
    // 🚀 [추가]: 상태 변경 시 URL 해시 업데이트
    window.location.hash = A6_STATE.mode === 'harmonics' ? `harmonics-${A6_STATE.view}` : 'varga';
    
    updateA6UI();
    renderA6();
};

window.toggleA6View = function() {
    if (A6_STATE.mode !== 'harmonics') return;
    A6_STATE.view = (A6_STATE.view === 'positions') ? 'aspects' : 'positions';
    
    // 🚀 [추가]: 상태 변경 시 URL 해시 업데이트
    window.location.hash = `harmonics-${A6_STATE.view}`;
    
    updateA6UI();
    renderA6();
};

window.switchA6Ayanamsa = function(ayan) {
    A6_STATE.ayanamsa = ayan;
    initGrids();
    fetchA6Data();
};

async function fetchVargaDefs() {
    try {
        let res = await fetch('/api/astro/theory/varga/definitions');
        if (!res.ok) res = await fetch('/api/astro/theory/vargas/definitions');
        
        if (res.ok) {
            let json = await res.json();
            A6_STATE.vargaDefs = json.data || json;
        }
    } catch(e) {
        console.error("Varga Defs Load Fail:", e);
    }
}

window.showVargaPopup = function(vKey) {
    const popover = document.getElementById('fs-popover');
    
    if (!popover || !A6_STATE.vargaDefs) {
        showA6Toast("Definitions data not loaded.");
        return;
    }

    let def = null;
    if (Array.isArray(A6_STATE.vargaDefs)) {
        def = A6_STATE.vargaDefs.find(d => d.id === vKey || d.varga === vKey || d.name === vKey);
    } else {
        def = A6_STATE.vargaDefs[vKey] || A6_STATE.vargaDefs[vKey.toLowerCase()] || A6_STATE.vargaDefs[vKey.toUpperCase()];
    }

    if (!def) {
        showA6Toast(`No definition found for ${vKey}`);
        return;
    }
    
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    const tLang = (lang === 'ko' || lang.startsWith('ko')) ? 'ko' : 'en';
    
    const titleName = def.amsa || def.name || def.title || '';
    let descText = def[tLang] || def['en'] || (def.desc && (def.desc[tLang] || def.desc['en'])) || 'No description';
    
    // 🚀 Albedo Cyan 팝업 테마
    let html = `
        <div style="font-size: 1.1rem; font-weight: 900; border-bottom: 1px solid #49DCE1; padding-bottom: 8px; margin-bottom: 12px; color: #49DCE1; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
            ${vKey} ${titleName ? '- ' + titleName : ''}
        </div>
        <div style="font-size: 0.85rem; line-height: 1.6; color: #ddd; text-align: left;">
            ${descText}
        </div>
        <div style="margin-top: 15px; font-size: 0.7rem; color: #555; text-align: center; border-top: 1px dashed rgba(73, 220, 225, 0.2); padding-top: 10px;">TAP TO CLOSE</div>
    `;

    popover.innerHTML = html;
    popover.onclick = function(e) { 
        e.stopPropagation(); 
        this.style.display = 'none'; 
        this.classList.remove('active'); 
    };
    popover.style.display = 'block';
    popover.classList.add('active');
};

async function fetchA6Data() {
    try {
        // 🚀 Albedo 전용 Multiplicatio API 호출
        const url = `/api/astro/multiplicatio/reading?ayanamsa=${A6_STATE.ayanamsa}`;
        const res = await fetch(url);
        
        if (res.ok) {
            const json = await res.json();
            if (json.status === "retry" || json.error || !json.data) {
                setTimeout(fetchA6Data, 500); 
                return;
            }

            A6_STATE.data = json.data; 
            if (json.meta) A6_STATE.data.meta = json.meta;
            
            const isLocked = A6_STATE.data.meta && A6_STATE.data.meta.is_time_unknown === 1;
            handleA6VargaLock(isLocked); 

            if (isLocked && A6_STATE.mode === 'varga') {
                A6_STATE.mode = 'harmonics';
                updateA6UI();
            }
            renderA6();
        }
    } catch(e) {
        console.error("Fetch Error: ", e);
        setTimeout(fetchA6Data, 1000);
    }
}

async function fetchAspects(bodyName) {
    // 🚀 1. 모바일 전용 컨테이너 ID로 변경
    const container = document.getElementById('m-a6-list-aspects');
    if (!container) return;
    
    // 🚀 모바일 전용 로딩 UI 테마 적용
    container.innerHTML = '<div class="m-asp-item m-asp-item-center" style="color:#49DCE1;">SCANNING...</div>';
    
    try {
        const safeBody = encodeURIComponent(bodyName);
        // 🚀 2. STATE 대신 A6_STATE 로 변경
        const url = `/api/astro/aspects/harmonic/albedo/${A6_STATE.h_level}?body=${safeBody}&ayanamsa=${A6_STATE.ayanamsa}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.error) {
            console.error("[A6 Backend Error]:", data.error);
            container.innerHTML = '<div class="m-asp-item m-asp-item-center" style="color:#ff6b6b;">DATA ERROR</div>';
            return;
        }

        A6_STATE.currentAspectData = data.aspects || [];
        renderAspectList(); 

    } catch (e) {
        console.error("[A6 Fetch Error]:", e);
        container.innerHTML = '<div class="m-asp-item m-asp-item-center" style="color:#ff6b6b;">API ERROR</div>';
    }
}

/* Color Helpers */
function colorizeText(text) {
    if (!text || text === '-') return "-";
    let res = text;
    
    Object.keys(PLANET_COLORS).forEach(p => {
        if (p.length > 1) { 
            const regex = new RegExp(`\\b${p}\\b`, 'g');
            res = res.replace(regex, `<span style="color:${PLANET_COLORS[p]} !important;">$&</span>`);
        } else { 
            const regex = new RegExp(`\\${p}`, 'g');
            res = res.replace(regex, `<span style="color:${PLANET_COLORS[p]} !important;">$&</span>`);
        }
    });

    let zColor = null;
    for (let z of Object.keys(SIGN_COLORS)) {
        if (new RegExp(`\\b${z}\\b`, 'i').test(text)) {
            zColor = SIGN_COLORS[z];
            break;
        }
    }
    if (zColor) {
        res = `<span style="color:${zColor} !important; font-weight:bold;">${res}</span>`;
    }

    return res;
}

function colorizeNakshatra(text) {
    if (!text || text === '-') return '-';
    let matchRuler = null;
    for (let nak of Object.keys(NAKSHATRA_RULERS)) {
        if (text.includes(nak)) {
            matchRuler = NAKSHATRA_RULERS[nak];
            break;
        }
    }
    if (matchRuler) {
        const color = PLANET_COLORS[matchRuler];
        return `<span style="color:${color} !important; font-weight:bold;">${text}</span>`;
    }
    return colorizeText(text); 
}

function colorizePurushartha(text) {
    if (!text || text === '-') return '-';
    let mainColor = "#fff";
    const keys = Object.keys(VEDIC_COLORS);
    for (let i = 0; i < keys.length; i++) {
        if (text.toLowerCase().includes(keys[i].toLowerCase())) {
            mainColor = VEDIC_COLORS[keys[i]];
            break;
        }
    }
    return `<span style="color:${mainColor} !important; font-weight:bold;">${text}</span>`;
}

/* Rendering */
function renderA6() {
    if (!A6_STATE.data) return;
    if (A6_STATE.mode === 'harmonics') {
        if (A6_STATE.view === 'positions') renderPositions();
        else renderAspects();
    } else {
        renderVarga();
    }
}

function renderPositions() {
    const tbody = document.getElementById('m-a6-tbody-positions');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    CELESTIALS.forEach(name => {
        const tr = document.createElement('tr');
        
        if (name === 'Chiron') {
            tr.classList.add('m-a6-divider-pink'); 
        }

        // 🚀 Albedo Cyan 
        tr.innerHTML = `<td class="sticky-col" style="color:#49DCE1 !important;">${name}</td>`;
        
        H_LEVELS.forEach(h => {
            let val = '-';
            if (A6_STATE.data && A6_STATE.data.harmonics && A6_STATE.data.harmonics[name]) {
                val = A6_STATE.data.harmonics[name][`H${h}`] || '-';
            }
            const td = document.createElement('td');
            td.innerHTML = colorizeText(val);
            if (h === A6_STATE.h_level) td.style.backgroundColor = 'rgba(73, 220, 225, 0.05)'; 
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function renderAspects() {
    const list = document.getElementById('a6-dd-list');
    const selectedDiv = document.getElementById('a6-dd-selected');
    if (!list || !selectedDiv) return;
    
    list.innerHTML = ''; 
    const currentVal = A6_STATE.selectedBody || CELESTIALS[0];

    CELESTIALS.forEach(name => {
        let posInfo = "-";
        if (A6_STATE.data && A6_STATE.data.harmonics && A6_STATE.data.harmonics[name]) {
            posInfo = A6_STATE.data.harmonics[name][`H${A6_STATE.h_level}`] || "-";
        }
        
        const item = document.createElement('div');
        item.className = 'm-dropdown-item';
        item.innerHTML = `<span style="color:#49DCE1; font-weight:bold;">${name}</span> <span style="color:#aaa;">[${colorizeText(posInfo)}]</span>`;
        
        item.onclick = (e) => {
            e.stopPropagation();
            A6_STATE.selectedBody = name;
            A6_STATE.selectedAspect = null;
            selectedDiv.innerHTML = `<span style="color:#49DCE1; font-weight:bold;">${name}</span> <span style="color:#aaa;">[${colorizeText(posInfo)}]</span>`;
            list.style.display = 'none';
            document.getElementById('m-a6-list-objects').innerHTML = '';
            fetchAspects(name);
        };
        list.appendChild(item);
        
        if (name === currentVal) {
            selectedDiv.innerHTML = `<span style="color:#49DCE1; font-weight:bold;">${name}</span> <span style="color:#aaa;">[${colorizeText(posInfo)}]</span>`;
            A6_STATE.selectedBody = currentVal;
        }
    });
    
    if (!A6_STATE.selectedAspect) {
        document.getElementById('m-a6-list-aspects').innerHTML = `<div class="m-asp-item m-asp-item-center" style="border:none;">Loading...</div>`;
        document.getElementById('m-a6-list-objects').innerHTML = `<div class="m-asp-item m-asp-item-center" style="border:none;">-</div>`;
    }
    fetchAspects(A6_STATE.selectedBody);
}

function renderAspectList() {
    const container = document.getElementById('m-a6-list-aspects');
    if (!container) return;
    container.innerHTML = '';

    const aspects = A6_STATE.currentAspectData;
    if (!aspects || aspects.length === 0) {
        container.innerHTML = `<div class="m-asp-item m-asp-item-center" style="border:none;">No Aspects</div>`;
        document.getElementById('m-a6-list-objects').innerHTML = '';
        return;
    }

    const foundNames = [...new Set(aspects.map(a => a.aspect))];
    ["Major", "Minor"].forEach(group => {
        const list = ASPECT_GROUPS[group].filter(n => foundNames.includes(n));
        if (list.length > 0) {
            const h = document.createElement('div');
            h.style.cssText = 'font-size: 0.6rem; color: #444; margin: 10px 0 2px 5px; text-transform: uppercase; font-weight: bold;';
            h.textContent = group;
            container.appendChild(h);

            list.forEach(aspName => {
                const count = aspects.filter(a => a.aspect === aspName).length;
                const btn = document.createElement('div');
                btn.className = `m-asp-item ${A6_STATE.selectedAspect === aspName ? 'active' : ''}`;
                btn.style.flexDirection = 'row';
                btn.style.justifyContent = 'space-between';
                btn.style.alignItems = 'center';
                
                // 🚀 Albedo Cyan 뱃지
                btn.innerHTML = `<span style="font-size:0.75rem; color:#ccc;">${aspName}</span> <span style="background:rgba(255,255,255,0.1); padding:2px 5px; border-radius:4px; font-size:0.6rem; color:#49DCE1;">${count}</span>`;
                
                btn.onclick = () => {
                    A6_STATE.selectedAspect = aspName;
                    renderAspectList(); 
                    renderObjectList(aspName); 
                };
                container.appendChild(btn);
            });
        }
    });
}

function renderObjectList(aspectName) {
    const container = document.getElementById('m-a6-list-objects');
    if (!container) return;
    container.innerHTML = '';
    
    const targets = A6_STATE.currentAspectData.filter(a => a.aspect === aspectName);
    
    targets.forEach(obj => {
        const div = document.createElement('div');
        div.className = 'm-asp-item'; 
        
        let objPosInfo = "-";
        if (A6_STATE.data && A6_STATE.data.harmonics && A6_STATE.data.harmonics[obj.target]) {
            objPosInfo = A6_STATE.data.harmonics[obj.target][`H${A6_STATE.h_level}`] || "-";
        }

        const orbText = `${obj.orb.toFixed(2)}°`;
        
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:normal; color:#ccc;">
                <span style="font-size:0.75rem;">${obj.target}</span>
                <span style="color:#49DCE1; font-size:0.75rem;">${orbText}</span>
            </div>
        `;
        
        const toastStr = encodeURIComponent(`
            <strong style="color:#fff; font-size:1.1em;">${obj.target}</strong><br>
            <span style="display:inline-block; margin-top:4px;">${colorizeText(objPosInfo)}</span>
        `).replace(/'/g, "%27");
        
        div.onclick = () => showA6Toast(decodeURIComponent(toastStr));

        container.appendChild(div);
    });
}

function renderVarga() {
    const tbody = document.getElementById('m-a6-tbody-varga');
    if (!tbody) return;
    tbody.innerHTML = '';

    const grahaMap = {
        'Lagna': 'Ascendant', 'Surya': 'Sun', 'Chandra': 'Moon', 
        'Budha': 'Mercury', 'Shukra': 'Venus', 'Mangala': 'Mars', 
        'Brihaspati': 'Jupiter', 'Shani': 'Saturn',
        'Ketu': 'South Node (t)', 'Rahu': 'North Node (t)'
    };
    
    const targetKey = grahaMap[A6_STATE.v_graha] || 'Sun';
    const vData = (A6_STATE.data && A6_STATE.data.varga) ? A6_STATE.data.varga[targetKey] : null;

    VARGA_DIVISIONS.forEach(div => {
        const tr = document.createElement('tr');
        
        const tdDiv = document.createElement('td');
        tdDiv.textContent = div;
        tdDiv.className = 'sticky-col'; 
        tdDiv.style.cursor = 'pointer';
        tdDiv.onclick = (e) => { e.stopPropagation(); showVargaPopup(div); };
        tr.appendChild(tdDiv);

        const tdInfo = document.createElement('td');
        const tdNak = document.createElement('td');
        const tdPur = document.createElement('td');

        if (vData && vData[div]) {
            const subData = vData[div];
            const infoText = subData.formatted || '-';
            const nakText = subData.nakshatra || '-';
            const purVal = subData.purushartha || '-';

            tdInfo.className = 'm-varga-clickable-td';
            tdNak.className = 'm-varga-clickable-td';

            tdInfo.innerHTML = colorizeText(infoText);
            tdNak.innerHTML = colorizeNakshatra(nakText);
            tdPur.innerHTML = colorizePurushartha(purVal);

            // 🚀 Albedo Cyan 기반 Toast
            let infoToast = `<strong style="color:#49DCE1;">${div} INFORMATION</strong><br><span style="color:#ccc;">No Ruler Info</span>`;
            const signMatch = infoText.match(/^([a-zA-Z]+)/);
            if (signMatch && SIGN_RULERS[signMatch[1]]) {
                const r = SIGN_RULERS[signMatch[1]];
                const c = PLANET_COLORS[r] || '#fff';
                infoToast = `<strong style="color:#49DCE1;">${div} INFO</strong><br>Ruler: <span style="color:${c} !important; font-weight:bold;">${r}</span>`;
            }

            let nakToast = `<strong style="color:#49DCE1;">${div} NAKSHATRA</strong><br><span style="color:#ccc;">No Nakshatra Info</span>`;
            const nakName = nakText.split('-')[0];
            const idx = NAK_LIST.indexOf(nakName);
            if (idx !== -1) {
                const r = NAK_RULERS_CYCLE[idx % 9];
                const c = PLANET_COLORS[r] || '#fff';
                nakToast = `<strong style="color:#49DCE1;">${div} NAKSHATRA</strong><br>Nakshatra #${idx + 1} | Ruler: <span style="color:${c} !important; font-weight:bold;">${r}</span>`;
            }
            
            tdInfo.onclick = () => showA6Toast(infoToast);
            tdNak.onclick = () => showA6Toast(nakToast);

        } else { 
            tdInfo.textContent = '-'; tdNak.textContent = '-'; tdPur.textContent = '-'; 
        }

        tr.appendChild(tdInfo); tr.appendChild(tdNak); tr.appendChild(tdPur);
        tbody.appendChild(tr);
    });
}

function showA6Toast(htmlContent) {
    const toast = document.getElementById('m-a6-toast');
    if (!toast) return;
    toast.innerHTML = `<div style="display: block; width: 100%; text-align: center; line-height: 1.5;">${htmlContent}</div>`;
    toast.classList.remove('m-toast-hidden');
    if (a6ToastTimer) clearTimeout(a6ToastTimer);
    a6ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 4000);
}

// 🚀 Albedo 전용 마도서 저장 로직 (PC판 a6.js 복제)
window.saveToGrimoire = async function() {
    const activeDavison = JSON.parse(localStorage.getItem('active_davison'));
    const activeComposite = JSON.parse(localStorage.getItem('active_composite'));
    const albedoStation = activeDavison || activeComposite || {};

    let s1Name = albedoStation.seed1?.name || "";
    let s2Name = albedoStation.seed2?.name || "";
    let seedId = albedoStation.id;

    if (!seedId) {
        let id1 = albedoStation.seed1?.idx || albedoStation.seed1?.id || "unknown1";
        let id2 = albedoStation.seed2?.idx || albedoStation.seed2?.id || "unknown2";
        seedId = `${id1}_${id2}`;
    }

    let targetName = (s1Name && s2Name) ? `${s1Name} & ${s2Name}` : "Unknown Coniunctio";

    const isTimeUnknown = A6_STATE.data && A6_STATE.data.meta && Number(A6_STATE.data.meta.is_time_unknown) === 1;
    if (A6_STATE.mode === 'varga' && isTimeUnknown) {
        alert("Varga requires precise birth time for both seeds. Feature locked.");
        return false;
    }

    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    let compilerId = '';
    if (A6_STATE.mode === 'harmonics') {
        compilerId = A6_STATE.view === 'positions' ? 'a6' : 'a6_aspects';
    } else if (A6_STATE.mode === 'varga') {
        compilerId = A6_STATE.ayanamsa === 'kp' ? 'a6_varga_kp' : 'a6_varga';
    }

    const grahaMap = {
        'Lagna': 'Ascendant', 'Surya': 'Sun', 'Chandra': 'Moon', 
        'Budha': 'Mercury', 'Shukra': 'Venus', 'Mangala': 'Mars', 
        'Brihaspati': 'Jupiter', 'Shani': 'Saturn',
        'Ketu': 'South Node (t)', 'Rahu': 'North Node (t)'
    };
    const targetBody = grahaMap[A6_STATE.v_graha] || 'Sun';

    const payload = {
        seed_id: seedId,
        stage: 'albedo', // 🚀 스테이지가 nigredo가 아닌 albedo
        target_name: targetName,
        language: lang,
        metadata: {
            sys_tab: 'tropical',
            ayanamsa: A6_STATE.ayanamsa,
            h_level: `H${A6_STATE.h_level}`,
            graha: targetBody,
            target_body: targetBody
        }
    };

    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) return true; 
        else throw new Error("Manifestation Failed");
    } catch (e) {
        throw e;
    }
};