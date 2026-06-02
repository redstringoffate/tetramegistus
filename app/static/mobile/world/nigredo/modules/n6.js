/* static/mobile/world/nigredo/modules/n6.js - Mobile DIVISIO */

const N6_STATE = {
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

// 🚀 [점성학적 컬러 매핑]
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

// 🚀 [신규]: 낙샤트라 지배성 매핑 (27 Nakshatras -> 9 Grahas)
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

let n6ToastTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    // 🚀 [추가]: URL 해시를 읽어 초기 상태 복구
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        const parts = hash.split('-');
        if (parts[0] === 'varga' || parts[0] === 'harmonics') N6_STATE.mode = parts[0];
        if (parts[1] && (parts[1] === 'positions' || parts[1] === 'aspects')) N6_STATE.view = parts[1];
    }
    initGrids();
    updateN6UI();
    fetchVargaDefs();
    fetchN6Data();

    document.addEventListener('touchstart', (e) => {
        const popover = document.getElementById('fs-popover');
        if (popover && popover.style.display === 'block') {
            if (!e.target.closest('.fs-popover-box') && !e.target.closest('.sticky-col')) {
                popover.style.display = 'none';
                popover.classList.remove('active');
            }
        }
        
        const ddList = document.getElementById('n6-dd-list');
        const ddSel = document.getElementById('n6-dd-selected');
        if (ddList && ddList.style.display === 'block') {
            if (e.target !== ddList && e.target !== ddSel && !ddSel.contains(e.target)) {
                ddList.style.display = 'none';
            }
        }
    });
});

window.toggleN6Dropdown = function() {
    const list = document.getElementById('n6-dd-list');
    if(list) list.style.display = list.style.display === 'none' ? 'block' : 'none';
};

function initGrids() {
    const ayanNav = document.getElementById('n6-ayanamsa-nav-container');
    if (ayanNav) {
        ayanNav.innerHTML = '';
        AYANAMSAS.forEach(ay => {
            const btn = document.createElement('button');
            btn.className = `m-tab ${N6_STATE.ayanamsa === ay.id ? 'active' : ''}`;
            btn.textContent = ay.label;
            btn.onclick = () => window.switchN6Ayanamsa(ay.id);
            ayanNav.appendChild(btn);
        });
    }

    const grahaGrid = document.getElementById('n6-graha-grid');
    if (grahaGrid) {
        grahaGrid.innerHTML = '';
        GRAHAS.forEach(g => {
            const btn = document.createElement('div');
            btn.className = `m-grid-btn ${N6_STATE.v_graha === g.id ? 'active' : ''}`;
            btn.textContent = g.id;
            btn.onclick = () => { N6_STATE.v_graha = g.id; initGrids(); renderN6(); };
            grahaGrid.appendChild(btn);
        });
    }

    const hGrid = document.getElementById('n6-h-btn-grid');
    if (hGrid) {
        hGrid.innerHTML = '';
        H_LEVELS.forEach(h => {
            const btn = document.createElement('div');
            btn.className = `m-grid-btn ${N6_STATE.h_level === h ? 'active' : ''}`;
            btn.textContent = `H${h}`;
            btn.onclick = () => { 
                N6_STATE.h_level = h; 
                initGrids(); 
                N6_STATE.selectedAspect = null;
                if(N6_STATE.view === 'positions') renderPositions();
                else renderAspects(); 
            };
            hGrid.appendChild(btn);
        });
    }

    const posThead = document.getElementById('m-n6-thead-positions');
    if (posThead && posThead.children.length === 1) {
        H_LEVELS.forEach(h => {
            const th = document.createElement('th');
            th.textContent = `H${h}`;
            posThead.appendChild(th);
        });
    }
}

// 🚀 [신규]: Varga 모드 자물쇠 시각화 함수
function handleN6VargaLock(isLocked) {
    const vargaLabel = document.getElementById('n6-lbl-varga');
    const toggleSwitch = document.querySelector('.m-anti-switch-module .m-toggle-switch');

    if (isLocked) {
        if (vargaLabel) {
            vargaLabel.innerHTML = 'VARGA 🔒';
            vargaLabel.style.opacity = '0.5';
            vargaLabel.style.color = '#ff6b6b'; // 경고 느낌의 붉은빛 추가
        }
        if (toggleSwitch) {
            toggleSwitch.style.opacity = '0.5';
        }
    } else {
        if (vargaLabel) {
            vargaLabel.innerHTML = 'VARGA';
            vargaLabel.style.opacity = '1';
            vargaLabel.style.color = ''; // 기본 상태 복구
        }
        if (toggleSwitch) {
            toggleSwitch.style.opacity = '1';
        }
    }
}

function updateN6UI() {
    const knobMode = document.getElementById('n6-knob-mode');
    const knobView = document.getElementById('n6-knob-view');

    if (N6_STATE.mode === 'varga') {
        knobMode.classList.add('right');
        document.getElementById('n6-lbl-harmonics').classList.remove('active');
        document.getElementById('n6-lbl-varga').classList.add('active');
        
        document.getElementById('n6-dicho-view').style.display = 'none';
        document.getElementById('m-n6-controls-varga').style.display = 'block';

        document.getElementById('m-view-positions').style.display = 'none';
        document.getElementById('m-view-aspects').style.display = 'none';
        document.getElementById('m-view-varga').style.display = 'block';
    } else {
        knobMode.classList.remove('right');
        document.getElementById('n6-lbl-harmonics').classList.add('active');
        document.getElementById('n6-lbl-varga').classList.remove('active');

        document.getElementById('n6-dicho-view').style.display = 'flex';
        document.getElementById('m-n6-controls-varga').style.display = 'none';

        if (N6_STATE.view === 'aspects') {
            knobView.classList.add('right');
            document.getElementById('n6-lbl-positions').classList.remove('active');
            document.getElementById('n6-lbl-aspects').classList.add('active');
            
            document.getElementById('m-view-positions').style.display = 'none';
            document.getElementById('m-view-aspects').style.display = 'block';
            document.getElementById('m-view-varga').style.display = 'none'; 
        } else {
            knobView.classList.remove('right');
            document.getElementById('n6-lbl-positions').classList.add('active');
            document.getElementById('n6-lbl-aspects').classList.remove('active');
            
            document.getElementById('m-view-positions').style.display = 'block';
            document.getElementById('m-view-aspects').style.display = 'none';
            document.getElementById('m-view-varga').style.display = 'none'; 
        }
    }
}

window.toggleN6Mode = function() {
    const isLocked = N6_STATE.data && N6_STATE.data.meta && Number(N6_STATE.data.meta.is_time_unknown) === 1;
    if (isLocked) {
        showN6Toast("<strong style='color:#ff6b6b;'>TIME UNKNOWN</strong><br><span style='color:#ccc;'>Varga calculation is locked.</span>");
        return;
    }
    N6_STATE.mode = (N6_STATE.mode === 'harmonics') ? 'varga' : 'harmonics';
    
    // 🚀 [추가]: 상태 변경 시 URL 해시 업데이트
    window.location.hash = N6_STATE.mode === 'harmonics' ? `harmonics-${N6_STATE.view}` : 'varga';
    
    updateN6UI();
    renderN6();
};

window.toggleN6View = function() {
    if (N6_STATE.mode !== 'harmonics') return;
    N6_STATE.view = (N6_STATE.view === 'positions') ? 'aspects' : 'positions';
    
    // 🚀 [추가]: 상태 변경 시 URL 해시 업데이트
    window.location.hash = `harmonics-${N6_STATE.view}`;
    
    updateN6UI();
    renderN6();
};

window.switchN6Ayanamsa = function(ayan) {
    N6_STATE.ayanamsa = ayan;
    initGrids();
    fetchN6Data();
};

// 🚀 [절대 방어]: API 주소를 양방향으로 찌르고, 데이터 구조를 무조건 찾아냅니다.
async function fetchVargaDefs() {
    try {
        let res = await fetch('/api/astro/theory/varga/definitions');
        if (!res.ok) res = await fetch('/api/astro/theory/vargas/definitions');
        
        if (res.ok) {
            let json = await res.json();
            // 백엔드가 {data: {...}} 로 주든, 그냥 {...} 로 주든 무조건 찾아냄
            N6_STATE.vargaDefs = json.data || json;
            console.log("🔥 [Varga Defs Loaded]:", N6_STATE.vargaDefs);
        }
    } catch(e) {
        console.error("Varga Defs Load Fail:", e);
    }
}

window.showVargaPopup = function(vKey) {
    const popover = document.getElementById('fs-popover');
    
    if (!popover || !N6_STATE.vargaDefs) {
        showN6Toast("Definitions data not loaded.");
        return;
    }

    let def = null;
    if (Array.isArray(N6_STATE.vargaDefs)) {
        def = N6_STATE.vargaDefs.find(d => d.id === vKey || d.varga === vKey || d.name === vKey);
    } else {
        def = N6_STATE.vargaDefs[vKey] || N6_STATE.vargaDefs[vKey.toLowerCase()] || N6_STATE.vargaDefs[vKey.toUpperCase()];
    }

    if (!def) {
        showN6Toast(`No definition found for ${vKey}`);
        return;
    }
    
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    const tLang = (lang === 'ko' || lang.startsWith('ko')) ? 'ko' : 'en';
    
    // PC판 a6.js 구조(def.amsa, def[lang]) 우선 적용 및 폴백 처리
    const titleName = def.amsa || def.name || def.title || '';
    let descText = def[tLang] || def['en'] || (def.desc && (def.desc[tLang] || def.desc['en'])) || 'No description';
    
    let html = `
        <div style="font-size: 1.1rem; font-weight: 900; border-bottom: 1px solid #7CFF9B; padding-bottom: 8px; margin-bottom: 12px; color: #7CFF9B; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
            ${vKey} ${titleName ? '- ' + titleName : ''}
        </div>
        <div style="font-size: 0.85rem; line-height: 1.6; color: #ddd; text-align: left;">
            ${descText}
        </div>
        <div style="margin-top: 15px; font-size: 0.7rem; color: #555; text-align: center; border-top: 1px dashed rgba(124, 255, 155, 0.2); padding-top: 10px;">TAP TO CLOSE</div>
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

async function fetchN6Data() {
    try {
        let h_sys = (localStorage.getItem('tetramegistus_house') === 'whole') ? 'W' : 'P';
        let targetBodyStr = N6_STATE.v_graha;
        
        if (targetBodyStr === "Ascendant") targetBodyStr = "Lagna";
        if (targetBodyStr === "Sun") targetBodyStr = "Surya";
        if (targetBodyStr === "Moon") targetBodyStr = "Chandra";
        if (targetBodyStr === "Mercury") targetBodyStr = "Budha";
        if (targetBodyStr === "Venus") targetBodyStr = "Shukra";
        if (targetBodyStr === "Mars") targetBodyStr = "Mangala";
        if (targetBodyStr === "Jupiter") targetBodyStr = "Brihaspati";
        if (targetBodyStr === "Saturn") targetBodyStr = "Shani";
        if (targetBodyStr === "North Node") targetBodyStr = "Rahu";
        if (targetBodyStr === "South Node") targetBodyStr = "Ketu";

        const url = `/api/astro/divisio/reading?ayanamsa=${N6_STATE.ayanamsa}&h_sys=${h_sys}&h_level=${N6_STATE.h_level}&graha=${targetBodyStr}&target_body=${targetBodyStr}`;
        const res = await fetch(url);
        
        if (res.ok) {
            const json = await res.json();
            N6_STATE.data = json.data || json; 
            if (json.meta) N6_STATE.data.meta = json.meta;
            
            const isLocked = N6_STATE.data.meta && N6_STATE.data.meta.is_time_unknown === 1;
            
            // 🔥 여기에 시각적 자물쇠 처리 로직 추가
            handleN6VargaLock(isLocked); 

            if (isLocked && N6_STATE.mode === 'varga') {
                N6_STATE.mode = 'harmonics';
                updateN6UI();
            }
            renderN6();
        }
    } catch(e) {
        console.error("Fetch Error: ", e);
    }
}

async function fetchAspects(bodyName) {
    const container = document.getElementById('m-n6-list-aspects');
    if (!container) return;
    container.innerHTML = '<div class="m-asp-item m-asp-item-center" style="color:#666;">SCANNING...</div>';
    
    try {
        const res = await fetch(`/api/astro/aspects/harmonic/${N6_STATE.h_level}?body=${bodyName}`);
        const data = await res.json();
        N6_STATE.currentAspectData = data.aspects || [];
        renderAspectList(); 
    } catch (e) {
        container.innerHTML = '<div class="m-asp-item m-asp-item-center" style="color:#ff4444;">ERROR</div>';
    }
}

/* ─────────────────────────────────────────────────────────────
   COLOR & TEXT FORMATTING HELPERS
   ───────────────────────────────────────────────────────────── */
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

// 🚀 [수정 2]: 낙샤트라 지배성 컬러 전체 텍스트 랩핑
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
        // 낙샤트라 매칭 시, 이름과 숫자(-3 등) 전체를 통째로 랩핑
        return `<span style="color:${color} !important; font-weight:bold;">${text}</span>`;
    }

    return colorizeText(text); // 매칭 안 될 경우 일반 텍스트 처리
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

/* ─────────────────────────────────────────────────────────────
   RENDER FUNCTIONS
   ───────────────────────────────────────────────────────────── */
function renderN6() {
    if (!N6_STATE.data) return;
    if (N6_STATE.mode === 'harmonics') {
        if (N6_STATE.view === 'positions') renderPositions();
        else renderAspects();
    } else {
        renderVarga();
    }
}

function renderPositions() {
    const tbody = document.getElementById('m-n6-tbody-positions');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    CELESTIALS.forEach(name => {
        const tr = document.createElement('tr');
        
        // 🚀 [수정 1]: Chiron 시작 시 상단에 Cyan Blue 구분선 추가
        if (name === 'Chiron') {
            tr.classList.add('m-n6-divider-cyan');
        }

        // 포지션 표의 행성명은 모두 DDS Green
        tr.innerHTML = `<td class="sticky-col" style="color:#7CFF9B !important;">${name}</td>`;
        
        H_LEVELS.forEach(h => {
            let val = '-';
            if (N6_STATE.data && N6_STATE.data.harmonics && N6_STATE.data.harmonics[name]) {
                val = N6_STATE.data.harmonics[name][`H${h}`] || '-';
            }
            const td = document.createElement('td');
            td.innerHTML = colorizeText(val);
            if (h === N6_STATE.h_level) td.style.backgroundColor = 'rgba(124, 255, 155, 0.05)'; 
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function renderAspects() {
    const list = document.getElementById('n6-dd-list');
    const selectedDiv = document.getElementById('n6-dd-selected');
    if (!list || !selectedDiv) return;
    
    list.innerHTML = ''; 
    const currentVal = N6_STATE.selectedBody || CELESTIALS[0];

    CELESTIALS.forEach(name => {
        let posInfo = "-";
        if (N6_STATE.data && N6_STATE.data.harmonics && N6_STATE.data.harmonics[name]) {
            posInfo = N6_STATE.data.harmonics[name][`H${N6_STATE.h_level}`] || "-";
        }
        
        const item = document.createElement('div');
        item.className = 'm-dropdown-item';
        // 🚀 [수복]: 드롭다운의 행성명도 모두 DDS Green
        item.innerHTML = `<span style="color:#7CFF9B; font-weight:bold;">${name}</span> <span style="color:#aaa;">[${colorizeText(posInfo)}]</span>`;
        
        item.onclick = (e) => {
            e.stopPropagation();
            N6_STATE.selectedBody = name;
            N6_STATE.selectedAspect = null;
            selectedDiv.innerHTML = `<span style="color:#7CFF9B; font-weight:bold;">${name}</span> <span style="color:#aaa;">[${colorizeText(posInfo)}]</span>`;
            list.style.display = 'none';
            document.getElementById('m-n6-list-objects').innerHTML = '';
            fetchAspects(name);
        };
        list.appendChild(item);
        
        if (name === currentVal) {
            selectedDiv.innerHTML = `<span style="color:#7CFF9B; font-weight:bold;">${name}</span> <span style="color:#aaa;">[${colorizeText(posInfo)}]</span>`;
            N6_STATE.selectedBody = currentVal;
        }
    });
    
    if (!N6_STATE.selectedAspect) {
        document.getElementById('m-n6-list-aspects').innerHTML = `<div class="m-asp-item m-asp-item-center" style="border:none;">Loading...</div>`;
        document.getElementById('m-n6-list-objects').innerHTML = `<div class="m-asp-item m-asp-item-center" style="border:none;">-</div>`;
    }
    fetchAspects(N6_STATE.selectedBody);
}

function renderAspectList() {
    const container = document.getElementById('m-n6-list-aspects');
    if (!container) return;
    container.innerHTML = '';

    const aspects = N6_STATE.currentAspectData;
    if (!aspects || aspects.length === 0) {
        container.innerHTML = `<div class="m-asp-item m-asp-item-center" style="border:none;">No Aspects</div>`;
        document.getElementById('m-n6-list-objects').innerHTML = '';
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
                btn.className = `m-asp-item ${N6_STATE.selectedAspect === aspName ? 'active' : ''}`;
                btn.style.flexDirection = 'row';
                btn.style.justifyContent = 'space-between';
                btn.style.alignItems = 'center';
                
                btn.innerHTML = `<span style="font-size:0.75rem; color:#ccc;">${aspName}</span> <span style="background:rgba(255,255,255,0.1); padding:2px 5px; border-radius:4px; font-size:0.6rem; color:#7CFF9B;">${count}</span>`;
                
                btn.onclick = () => {
                    N6_STATE.selectedAspect = aspName;
                    renderAspectList(); 
                    renderObjectList(aspName); 
                };
                container.appendChild(btn);
            });
        }
    });
}

function renderObjectList(aspectName) {
    const container = document.getElementById('m-n6-list-objects');
    if (!container) return;
    container.innerHTML = '';
    
    const targets = N6_STATE.currentAspectData.filter(a => a.aspect === aspectName);
    
    targets.forEach(obj => {
        const div = document.createElement('div');
        div.className = 'm-asp-item'; 
        
        let objPosInfo = "-";
        if (N6_STATE.data && N6_STATE.data.harmonics && N6_STATE.data.harmonics[obj.target]) {
            objPosInfo = N6_STATE.data.harmonics[obj.target][`H${N6_STATE.h_level}`] || "-";
        }

        const orbText = `${obj.orb.toFixed(2)}°`;
        
        // 🚀 [수복]: Objects 글자 크기를 Aspects(0.75rem)와 동일하게 통일
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:normal; color:#ccc;">
                <span style="font-size:0.75rem;">${obj.target}</span>
                <span style="color:#7CFF9B; font-size:0.75rem;">${orbText}</span>
            </div>
        `;
        
        const toastStr = encodeURIComponent(`
            <strong style="color:#fff; font-size:1.1em;">${obj.target}</strong><br>
            <span style="display:inline-block; margin-top:4px;">${colorizeText(objPosInfo)}</span>
        `).replace(/'/g, "%27");
        
        div.onclick = () => showN6Toast(decodeURIComponent(toastStr));

        container.appendChild(div);
    });
}

function renderVarga() {
    const tbody = document.getElementById('m-n6-tbody-varga');
    if (!tbody) return;
    tbody.innerHTML = '';

    const grahaMap = {
        'Lagna': 'Ascendant', 'Surya': 'Sun', 'Chandra': 'Moon', 
        'Budha': 'Mercury', 'Shukra': 'Venus', 'Mangala': 'Mars', 
        'Brihaspati': 'Jupiter', 'Shani': 'Saturn',
        'Ketu': 'South Node (t)', 'Rahu': 'North Node (t)'
    };
    
    const targetKey = grahaMap[N6_STATE.v_graha] || 'Sun';
    const vData = (N6_STATE.data && N6_STATE.data.varga) ? N6_STATE.data.varga[targetKey] : null;

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

            tdInfo.className = 'm-n6-clickable-td';
            tdNak.className = 'm-n6-clickable-td';

            tdInfo.innerHTML = colorizeText(infoText);
            tdNak.innerHTML = colorizeNakshatra(nakText);
            tdPur.innerHTML = colorizePurushartha(purVal);

            // 🚀 심플해진 INFO Toast 로직
            let infoToast = `<strong style="color:#7CFF9B;">${div} INFORMATION</strong><br><span style="color:#ccc;">No Ruler Info</span>`;
            const signMatch = infoText.match(/^([a-zA-Z]+)/);
            if (signMatch && SIGN_RULERS[signMatch[1]]) {
                const r = SIGN_RULERS[signMatch[1]];
                const c = PLANET_COLORS[r] || '#fff';
                infoToast = `<strong style="color:#7CFF9B;">${div} INFO</strong><br>Ruler: <span style="color:${c} !important; font-weight:bold;">${r}</span>`;
            }

            // 🚀 심플해진 NAKSHATRA Toast 로직
            let nakToast = `<strong style="color:#7CFF9B;">${div} NAKSHATRA</strong><br><span style="color:#ccc;">No Nakshatra Info</span>`;
            const nakName = nakText.split('-')[0];
            const idx = NAK_LIST.indexOf(nakName);
            if (idx !== -1) {
                const r = NAK_RULERS_CYCLE[idx % 9];
                const c = PLANET_COLORS[r] || '#fff';
                nakToast = `<strong style="color:#7CFF9B;">${div} NAKSHATRA</strong><br>Nakshatra #${idx + 1} | Ruler: <span style="color:${c} !important; font-weight:bold;">${r}</span>`;
            }
            
            tdInfo.onclick = () => showN6Toast(infoToast);
            tdNak.onclick = () => showN6Toast(nakToast);

        } else { 
            tdInfo.textContent = '-'; tdNak.textContent = '-'; tdPur.textContent = '-'; 
        }

        tr.appendChild(tdInfo); tr.appendChild(tdNak); tr.appendChild(tdPur);
        tbody.appendChild(tr);
    });
}

function showN6Toast(htmlContent) {
    const toast = document.getElementById('m-n6-toast');
    if (!toast) return;
    toast.innerHTML = `<div style="display: block; width: 100%; text-align: center; line-height: 1.5;">${htmlContent}</div>`;
    toast.classList.remove('m-toast-hidden');
    if (n6ToastTimer) clearTimeout(n6ToastTimer);
    n6ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 4000);
}

window.saveToGrimoire = async function() {
    const activeSeedRaw = localStorage.getItem('active_seed');
    const activeSeed = activeSeedRaw ? JSON.parse(activeSeedRaw) : {};
    
    if (N6_STATE.mode === 'varga' && activeSeed.is_time_unknown) {
        alert("Varga requires precise birth time. Feature locked.");
        return false;
    }

    let hSys = localStorage.getItem('tetramegistus_house') || 'P';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    let compilerId = '';
    if (N6_STATE.mode === 'harmonics') {
        compilerId = N6_STATE.view === 'positions' ? 'n6' : 'n6_aspects';
    } else if (N6_STATE.mode === 'varga') {
        compilerId = N6_STATE.ayanamsa === 'kp' ? 'n6_varga_kp' : 'n6_varga';
    }

    const grahaMap = {
        'Lagna': 'Ascendant', 'Surya': 'Sun', 'Chandra': 'Moon', 
        'Budha': 'Mercury', 'Shukra': 'Venus', 'Mangala': 'Mars', 
        'Brihaspati': 'Jupiter', 'Shani': 'Saturn',
        'Ketu': 'South Node (t)', 'Rahu': 'North Node (t)'
    };
    const targetBody = grahaMap[N6_STATE.v_graha] || 'Sun';

    const payload = {
        seed_id: activeSeed.id ?? activeSeed.idx ?? "unknown",
        stage: 'nigredo',
        target_name: activeSeed.name || "Unknown",
        language: lang,
        metadata: {
            h_sys: hSys,
            sys_tab: 'tropical', 
            ayanamsa: N6_STATE.ayanamsa,
            h_level: `H${N6_STATE.h_level}`,
            graha: targetBody,
            target_body: targetBody
        },
        seed: activeSeed 
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