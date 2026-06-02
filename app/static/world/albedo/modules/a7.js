/* static/world/albedo/modules/a7.js */

const A7_STATE = {
    system: 'tropical', 
    ayanamsa: 'lahiri', 
    mode1: 'sigilum', 
    mode2: 'sabian', 
    category: 'planets',
    data: null,
    sabianSymbols: null
};

const A7_BODIES = {
    planets: ["Sun (Natal)", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"],
    asteroids: ["Chiron", "Ceres", "Juno", "Pallas", "Vesta", "Asteroid Eros", "Psyche"],
    lilith: ["Mean Lilith", "True Lilith", "Asteroid Lilith", "North Node (t)", "Rahu", "South Node (t)", "Ketu"], 
    fates: ["Moira", "Klotho", "Lachesis", "Atropos"],
    angles: ["Ascendant", "Immum Coeli", "Descendant", "Midheaven"],
    hermetic: ["Fortune", "Spirit", "Necessity", "Necessity (v)", "Eros", "Eros (v)", "Courage", "Victory", "Nemesis", "Vertex", "Syzygy"]
};

const PLENITUDO_LEFT_COL = [
    "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
    "DIVIDER",
    "Chiron", "Ceres", "Juno", "Pallas", "Vesta", "Asteroid Eros", "Psyche",
    "DIVIDER",
    "Mean Lilith", "True Lilith", "Asteroid Lilith", "North Node (t)", "Rahu", "South Node (t)", "Ketu",
    "DIVIDER",
    "Ascendant", "Immum Coeli", "Descendant", "Midheaven",
    "DIVIDER",
    "Fortune", "Spirit", "Necessity", "Necessity (v)", "Eros", "Eros (v)", "Courage", "Victory", "Nemesis",
    "DIVIDER",
    "Moira", "Klotho", "Lachesis", "Atropos",
    "DIVIDER",
    "Vertex", "Syzygy"
];

function getA7MateriaClass(name) {
    if (A7_BODIES.planets.includes(name) || name === 'Sun') return 'p-planet';
    if (A7_BODIES.asteroids.includes(name)) return 'p-major';
    if (A7_BODIES.lilith.includes(name)) return 'p-node';
    if (A7_BODIES.fates.includes(name)) return 'p-fate';
    if (A7_BODIES.angles.includes(name)) return 'p-angle';
    if (name === 'Vertex') return 'p-vertex';
    if (name === 'Syzygy') return 'p-syzygy';
    if (A7_BODIES.hermetic.includes(name)) return 'p-hermetic';
    return '';
}

function getA7LordClasses(planetName, chartInfo) {
    if (!chartInfo) return '';
    const syms = { "Sun (Natal)": "☉", "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂", "Jupiter": "♃", "Saturn": "♄" };
    const sym = syms[planetName];
    if (!sym) return '';
    
    let cls = [];
    if (chartInfo.day_lord && chartInfo.day_lord.includes(sym)) cls.push('lord-day');
    if (chartInfo.hour_lord && chartInfo.hour_lord.includes(sym)) cls.push('lord-hour');
    return cls.join(' ');
}

// 🚀 [추가된 헬퍼]: 360도 도수의 하우스 번호를 계산 (배경색용)
function getHouseNumForDegree(deg, chartData) {
    let cusps = { ...chartData.cusps };
    const pts = chartData.points;
    if (cusps['H1'] === undefined && pts['Ascendant']) cusps['H1'] = pts['Ascendant'].longitude;
    if (cusps['H4'] === undefined && pts['Immum Coeli']) cusps['H4'] = pts['Immum Coeli'].longitude;
    if (cusps['H7'] === undefined && pts['Descendant']) cusps['H7'] = pts['Descendant'].longitude;
    if (cusps['H10'] === undefined && pts['Midheaven']) cusps['H10'] = pts['Midheaven'].longitude;

    for (let i = 1; i <= 12; i++) {
        let curr = Math.floor(cusps[`H${i}`]); 
        let next = Math.floor(cusps[`H${i === 12 ? 1 : i + 1}`]);
        if (isNaN(curr) || isNaN(next)) continue;
        if (curr <= next) {
            if (deg >= curr && deg < next) return i;
        } else {
            if (deg >= curr || deg < next) return i;
        }
    }
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    loadA7StateFromURL();
    initializeA7UI();
    bindA7Tooltips();
    fetchA7SabianSymbols(); 
    fetchAndRenderA7(); 
});

/* 1. URL STATE PERSISTENCE */
function saveA7StateToURL() {
    const params = new URLSearchParams(window.location.search);
    params.set('a7_sys', A7_STATE.system);
    params.set('a7_ayan', A7_STATE.ayanamsa);
    params.set('a7_m1', A7_STATE.mode1);
    params.set('a7_m2', A7_STATE.mode2);
    params.set('a7_cat', A7_STATE.category);
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({path: newURL}, '', newURL);
}

function loadA7StateFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('a7_sys')) A7_STATE.system = params.get('a7_sys');
    if (params.has('a7_ayan')) A7_STATE.ayanamsa = params.get('a7_ayan');
    if (params.has('a7_m1')) A7_STATE.mode1 = params.get('a7_m1');
    if (params.has('a7_m2')) A7_STATE.mode2 = params.get('a7_m2');
    if (params.has('a7_cat')) A7_STATE.category = params.get('a7_cat');
}

/* 2. UI CONTROL */
function initializeA7UI() { updateA7UI(); }

function updateA7UI() {
    document.querySelectorAll('#a7-system-nav .sys-tab').forEach(btn => 
        btn.classList.toggle('active', btn.dataset.sys === A7_STATE.system)
    );
    
    const vault = document.getElementById('a7-ayanamsa-vault');
    if (vault) {
        if (A7_STATE.system === 'sidereal') {
            vault.style.visibility = 'visible';
            document.querySelectorAll('#sidereal-controls-panel-a7 .a7-ayan-tab').forEach(btn => 
                btn.classList.toggle('active', btn.dataset.ayan === A7_STATE.ayanamsa)
            );
        } else { vault.style.visibility = 'hidden'; }
    }

    document.querySelectorAll('#a7-category-tabs .a7-ayan-tab').forEach(btn => 
        btn.classList.toggle('active', btn.dataset.cat === A7_STATE.category)
    );
    
    const hermeticBtn = document.getElementById('btn-cat-hermetic-a7');
    if (hermeticBtn) hermeticBtn.style.display = (A7_STATE.system === 'tropical') ? 'inline-block' : 'none';

    const knob1 = document.getElementById('a7-knob-primary');
    if (A7_STATE.mode1 === 'plenitudo') {
        if(knob1) { knob1.classList.add('right'); knob1.style.left = '18px'; knob1.style.background = '#7CFF9B'; knob1.style.boxShadow = '0 0 8px #7CFF9B'; }
        document.getElementById('a7-lbl-sigilum').classList.remove('active');
        document.getElementById('a7-lbl-plenitudo').classList.add('active');
        document.getElementById('a7-dicho-secondary').style.display = 'flex';
    } else {
        if(knob1) { knob1.classList.remove('right'); knob1.style.left = '2px'; knob1.style.background = '#333'; knob1.style.boxShadow = 'none'; }
        document.getElementById('a7-lbl-sigilum').classList.add('active');
        document.getElementById('a7-lbl-plenitudo').classList.remove('active');
        document.getElementById('a7-dicho-secondary').style.display = 'none';
    }

    const knob2 = document.getElementById('a7-knob-secondary');
    if (A7_STATE.mode2 === 'tabula') {
        if(knob2) { knob2.classList.add('right'); knob2.style.left = '18px'; knob2.style.background = '#7CFF9B'; knob2.style.boxShadow = '0 0 8px #7CFF9B'; }
        document.getElementById('a7-lbl-sabian').classList.remove('active');
        document.getElementById('a7-lbl-tabula').classList.add('active');
    } else {
        if(knob2) { knob2.classList.remove('right'); knob2.style.left = '2px'; knob2.style.background = '#333'; knob2.style.boxShadow = 'none'; }
        document.getElementById('a7-lbl-sabian').classList.add('active');
        document.getElementById('a7-lbl-tabula').classList.remove('active');
    }

    document.getElementById('a7-view-sigilum').style.display = 'none';
    document.getElementById('a7-view-plenitudo-sabian').style.display = 'none';
    document.getElementById('a7-view-plenitudo-tabula').style.display = 'none';

    if (A7_STATE.mode1 === 'sigilum') {
        document.getElementById('a7-view-sigilum').style.display = 'block';
        renderSigilumSkeleton();
    } else if (A7_STATE.mode1 === 'plenitudo' && A7_STATE.mode2 === 'sabian') {
        document.getElementById('a7-view-plenitudo-sabian').style.display = 'block';
        renderPlenitudoSabianSkeleton();
    } else {
        document.getElementById('a7-view-plenitudo-tabula').style.display = 'block';
        renderPlenitudoTabulaSkeleton();
    }
}

/* 3. DATA FETCHING */
window.switchA7System = function(sys) { 
    A7_STATE.system = sys; 
    if (A7_STATE.category === 'hermetic' && sys !== 'tropical') A7_STATE.category = 'planets';
    saveA7StateToURL(); fetchAndRenderA7(); 
};
window.switchA7Ayanamsa = function(ayan) { A7_STATE.ayanamsa = ayan; saveA7StateToURL(); fetchAndRenderA7(); };
window.switchA7Category = function(cat) { A7_STATE.category = cat; saveA7StateToURL(); fetchAndRenderA7(); };
window.toggleA7Primary = function() {
    A7_STATE.mode1 = (A7_STATE.mode1 === 'sigilum') ? 'plenitudo' : 'sigilum';
    saveA7StateToURL(); updateA7UI(); populateA7Data();
};
window.toggleA7Secondary = function() {
    A7_STATE.mode2 = (A7_STATE.mode2 === 'sabian') ? 'tabula' : 'sabian';
    saveA7StateToURL(); updateA7UI(); populateA7Data();
};

async function fetchAndRenderA7() {
    let h_sys = (localStorage.getItem('tetramegistus_house') === 'whole') ? 'W' : 'P';
    const { system, ayanamsa, category } = A7_STATE;
    A7_STATE.data = null; 
    updateA7UI(); 

    try {
        const url = `/api/astro/evocationes/reading?category=${category}&system=${system}&ayanamsa=${ayanamsa}&h_sys=${h_sys}`;
        const res = await fetch(url);
        const resData = await res.json();
        if (resData.error) return;
        A7_STATE.data = resData.data; 
        populateA7Data();
    } catch (e) { console.error("[A7] Fetch failed", e); }
}

/* 4. RENDERING ENGINE */
function populateA7Data() {
    if (!A7_STATE.data) return;
    if (A7_STATE.mode1 === 'sigilum') populateA7Sigilum();
    else if (A7_STATE.mode1 === 'plenitudo') {
        if (A7_STATE.mode2 === 'sabian') populateA7Sabian();
        else populateA7Tabula(); 
    }
}

// 🚀 [수정] 영문 텍스트(Aries, Taurus 등)와 기호를 모두 감지하여 해당 별자리 Glow 클래스를 반환
function getA7ZodiacGlow(text) {
    if (!text) return '';
    const t = text.toLowerCase(); // 대소문자 구별 없이 매칭하기 위함
    
    if (t.includes('♈') || t.includes('aries')) return 'glow-aries';
    if (t.includes('♉') || t.includes('taurus')) return 'glow-taurus';
    if (t.includes('♊') || t.includes('gemini')) return 'glow-gemini';
    if (t.includes('♋') || t.includes('cancer')) return 'glow-cancer';
    if (t.includes('♌') || t.includes('leo')) return 'glow-leo';
    if (t.includes('♍') || t.includes('virgo')) return 'glow-virgo';
    if (t.includes('♎') || t.includes('libra')) return 'glow-libra';
    if (t.includes('♏') || t.includes('scorpio')) return 'glow-scorpio';
    if (t.includes('♐') || t.includes('sagittarius')) return 'glow-sagittarius';
    if (t.includes('♑') || t.includes('capricorn')) return 'glow-capricorn';
    if (t.includes('♒') || t.includes('aquarius')) return 'glow-aquarius';
    if (t.includes('♓') || t.includes('pisces')) return 'glow-pisces';
    
    return '';
}

function getA7ElementGlow(text) {
    if (!text) return '';
    // 불(Fire), 땅(Earth), 공기(Air), 물(Water)
    if (text.includes('♈') || text.includes('♌') || text.includes('♐')) return 'glow-fire';
    if (text.includes('♉') || text.includes('♍') || text.includes('♑')) return 'glow-earth';
    if (text.includes('♊') || text.includes('♎') || text.includes('♒')) return 'glow-air';
    if (text.includes('♋') || text.includes('♏') || text.includes('♓')) return 'glow-water';
    return '';
}

function getA7PlanetGlow(text) {
    if (!text) return '';
    if (text.includes('☉')) return 'glow-sun';
    if (text.includes('☽')) return 'glow-moon';
    if (text.includes('☿')) return 'glow-mercury';
    if (text.includes('♀')) return 'glow-venus';
    if (text.includes('♂')) return 'glow-mars';
    if (text.includes('♃')) return 'glow-jupiter';
    if (text.includes('♄')) return 'glow-saturn';
    if (text.includes('♅')) return 'glow-uranus';
    if (text.includes('♆')) return 'glow-neptune';
    if (text.includes('♇')) return 'glow-pluto';
    if (text.includes('☊')) return 'glow-rahu';
    if (text.includes('☋')) return 'glow-ketu';
    return '';
}

// 여러 개의 행성(예: Day Lord, Hour Lord)이 파이프(|)로 묶여있을 때 개별 적용하는 헬퍼
function formatLordsGlow(lordStr) {
    if (!lordStr || lordStr === '-') return '-';
    return lordStr.split('|').map(p => {
        const trimP = p.trim();
        return `<span class="${getA7PlanetGlow(trimP)}">${trimP}</span>`;
    }).join(' | ');
}

// 🚀 [수정] Sigilum 렌더링 함수 (CSS 클래스 동적 주입)
function populateA7Sigilum() {
    const tbody = document.getElementById('a7-tbody-sigilum');
    if (!tbody) return;
    tbody.innerHTML = '';
    const targets = A7_BODIES[A7_STATE.category] || [];
    
    targets.forEach(t => {
        const chartData = A7_STATE.data[t];
        if (!chartData) return; 
        const info = chartData.chart_info;
        const pData = chartData.points[t] || {}; 
        
        const tooltipStr = `[Persona Birth]\n${info.datetime || '-'}\nDay Lord: ${info.day_lord || '-'}\nHour Lord: ${info.hour_lord || '-'}`;
        
        let dmsText = pData.dms || '-';
        if (pData.is_retrograde && !dmsText.includes(',r')) dmsText += ' (r)';

        let sabianIdx = (pData.sabian_index !== undefined && pData.sabian_index !== "") 
                        ? pData.sabian_index 
                        : Math.floor(pData.longitude || 0) % 360;
        
        const tr = document.createElement('tr');
        
        // 🚀 각 컬럼 성격에 맞게 헬퍼 함수로 클래스를 입혀줍니다.
        tr.innerHTML = `
            <td class="a7-hover-target" data-tooltip="${tooltipStr}" style="cursor:help;">
                <strong class="${getA7MateriaClass(t)}">${t.toUpperCase()}</strong>
            </td>
            <td style="color:#aaa;"><span class="${getA7ZodiacGlow(dmsText)}">${dmsText}</span></td>
            <td style="text-align:center !important; color:#49dce1;">${pData.house || '-'}</td>
            <td style="text-align:center !important; color:#7CFF9B;">${info.aries_0_house || '-'}</td>
            <td style="text-align:center !important; color:#ddd; font-weight:bold;">${formatLordsGlow(info.day_lord)}</td>
            <td style="text-align:center !important; color:#ddd; font-weight:bold;">${formatLordsGlow(info.hour_lord)}</td>
            <td style="text-align:center !important;"><span class="${getA7ElementGlow(pData.duad)}">${pData.duad || '-'}</span></td>
            <td style="text-align:center !important;"><span class="${getA7ElementGlow(pData.dodeca)}">${pData.dodeca || '-'}</span></td>
            <td style="text-align:center !important;"><span class="${getA7PlanetGlow(pData.decan)}">${pData.decan || '-'}</span></td>
            <td style="text-align:center !important;"><span class="${getA7PlanetGlow(pData.bound)}">${pData.bound || '-'}</span></td>
            <td class="col-sabian-symbol" data-sabian="${sabianIdx}" style="color:#aaa; font-style:italic;">...</td>
        `;
        tbody.appendChild(tr);
    });
    renderA7SabianSymbolsInView('#a7-tbody-sigilum');
}

// 🚀 [수정]: Sabian Matrix 렌더링 함수 (Hover 필터링, 대문자 변환, 볼드 처리)
function populateA7Sabian() {
    const targets = A7_BODIES[A7_STATE.category] || [];
    const tbody = document.getElementById('a7-tbody-sabian');
    const theadTr = document.querySelector('#a7-thead-sabian tr');
    if(!tbody) return;

    tbody.innerHTML = ''; 
    PLENITUDO_LEFT_COL.forEach(rowItem => {
        const tr = document.createElement('tr');
        if (rowItem === "DIVIDER") {
            tr.classList.add('row-divider-group');
            let cells = `<td></td>`; targets.forEach(() => cells += `<td></td>`);
            tr.innerHTML = cells;
        } else {
            let rowHTML = `<td><strong class="${getA7MateriaClass(rowItem)}">${rowItem}</strong></td>`;
            targets.forEach((colTargetName, idx) => {
                const chartData = A7_STATE.data[colTargetName];
                let cellHTML = `<div class="a7-cell-line1" style="color:#555;">-</div><div class="a7-cell-line2">-</div>`;
                let cellClass = "", tooltip = "", hoverClass = "";
                
                if(chartData) {
                    if(theadTr) {
                        const th = theadTr.cells[idx + 1];
                        if(th) {
                            const info = chartData.chart_info;
                            th.classList.add('a7-hover-target');
                            th.dataset.tooltip = `[Persona Birth]\n${info.datetime || '-'}\nDay Lord: ${info.day_lord || '-'}\nHour Lord: ${info.hour_lord || '-'}`;
                            th.style.cursor = 'help';
                        }
                    }

                    let searchKey = rowItem;
                    if(searchKey === "Sun" && chartData.points["Sun (Natal)"]) searchKey = "Sun (Natal)";
                    const pData = chartData.points[searchKey] || (searchKey === "Rahu" ? chartData.points["North Node (t)"] : (searchKey === "Ketu" ? chartData.points["South Node (t)"] : null));
                    
                    if(pData && pData.dms) {
                        let dmsDisp = pData.dms;
                        if(pData.is_retrograde && !dmsDisp.includes(',r')) dmsDisp += ' (r)';
                        
                        // 1. Day / Hour Lord 판별
                        const syms = { "Sun (Natal)": "☉", "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂", "Jupiter": "♃", "Saturn": "♄" };
                        const sym = syms[searchKey];
                        let isDayLord = false;
                        let isHourLord = false;
                        if (sym) {
                            if (chartData.chart_info.day_lord && chartData.chart_info.day_lord.includes(sym)) isDayLord = true;
                            if (chartData.chart_info.hour_lord && chartData.chart_info.hour_lord.includes(sym)) isHourLord = true;
                        }

                        // 2. Hour Lord 텍스트 대문자 변환 (Gemini,24... -> GEMINI,24...)
                        if (isHourLord) {
                            let commaIdx = dmsDisp.indexOf(',');
                            if (commaIdx !== -1) {
                                dmsDisp = dmsDisp.substring(0, commaIdx).toUpperCase() + dmsDisp.substring(commaIdx);
                            } else {
                                dmsDisp = dmsDisp.toUpperCase(); // 콤마가 없을 경우 전체 대문자
                            }
                        }

                        // 3. 교차점(Moon in Moon 등) 판별
                        let isIntersection = (searchKey === colTargetName || (rowItem === "Sun" && colTargetName === "Sun (Natal)"));
                        if (isIntersection) cellClass = "a7-cell-intersection";

                        // 4. Hover Tooltip 조립 (Lord이거나 교차점일 때만 Tooltip 생성)
                        let tooltipParts = [];
                        if (isDayLord) tooltipParts.push("[Day Lord]");
                        if (isHourLord) tooltipParts.push("[Hour Lord]");
                        if (isIntersection) tooltipParts.push(`${rowItem} in ${colTargetName}`);
                        
                        tooltip = tooltipParts.join(" ");
                        if (tooltip) hoverClass = "a7-hover-target";

                        // 5. Day Lord 폰트 Bold 처리
                        let fontWeight = isDayLord ? "bold" : "normal";
                        
                        let sIdx = (pData.sabian_index !== undefined && pData.sabian_index !== "") 
                                    ? pData.sabian_index 
                                    : Math.floor(pData.longitude || 0) % 360;
                        
                        cellHTML = `
                            <div class="a7-cell-line1" style="font-weight: ${fontWeight};">${dmsDisp} | <strong style="color:#fff;">${pData.house || '-'}</strong></div>
                            <div class="a7-cell-line2 col-sabian-symbol" data-sabian="${sIdx}">...</div>
                        `;
                    }
                }
                
                // Tooltip이 존재하는 경우에만 data-tooltip 속성과 cursor: help를 주입합니다.
                let tooltipAttr = tooltip ? `data-tooltip="${tooltip}"` : '';
                let cursorStyle = tooltip ? `style="cursor:help;"` : '';
                
                rowHTML += `<td class="a7-sabian-cell ${hoverClass} ${cellClass}" ${tooltipAttr} ${cursorStyle}>${cellHTML}</td>`;
            });
            tr.innerHTML = rowHTML;
        }
        tbody.appendChild(tr);
    });
    renderA7SabianSymbolsInView('#a7-tbody-sabian');
}

// 🚀 [추가]: 타겟 이름에 맞는 CSS 라인 변수(var)를 반환하는 헬퍼
function getA7LineColorVar(targetName) {
    const map = {
        "Sun (Natal)": "var(--l-sun)", "Sun": "var(--l-sun)", "Moon": "var(--l-moon)", "Mercury": "var(--l-mercury)",
        "Venus": "var(--l-venus)", "Mars": "var(--l-mars)", "Jupiter": "var(--l-jupiter)", "Saturn": "var(--l-saturn)",
        "Uranus": "var(--l-uranus)", "Neptune": "var(--l-neptune)", "Pluto": "var(--l-pluto)", "Chiron": "var(--l-chiron)",
        "Ceres": "var(--l-ceres)", "Juno": "var(--l-juno)", "Pallas": "var(--l-pallas)", "Vesta": "var(--l-vesta)",
        "Asteroid Eros": "var(--l-asteroid-eros)", "Psyche": "var(--l-psyche)", "Mean Lilith": "var(--l-mean-lilith)",
        "True Lilith": "var(--l-true-lilith)", "Asteroid Lilith": "var(--l-asteroid-lilith)", "North Node (t)": "var(--l-north-node-t)",
        "Rahu": "var(--l-rahu)", "South Node (t)": "var(--l-south-node-t)", "Ketu": "var(--l-ketu)", "Moira": "var(--l-moira)",
        "Klotho": "var(--l-klotho)", "Lachesis": "var(--l-lachesis)", "Atropos": "var(--l-atropos)", "Ascendant": "var(--l-ascendant)",
        "Immum Coeli": "var(--l-immum-coeli)", "Descendant": "var(--l-descendant)", "Midheaven": "var(--l-midheaven)",
        "Fortune": "var(--l-fortune)", "Spirit": "var(--l-spirit)", "Necessity": "var(--l-necessity)", "Necessity (v)": "var(--l-necessity-v)",
        "Eros": "var(--l-eros)", "Eros (v)": "var(--l-eros-v)", "Courage": "var(--l-courage)", "Victory": "var(--l-victory)",
        "Nemesis": "var(--l-nemesis)", "Vertex": "var(--l-vertex)", "Syzygy": "var(--l-syzygy)"
    };
    return map[targetName] || "#ffffff";
}

// 🚀 [수정]: Tabula 뷰 렌더링 - Draconic/Ketunic 모드 시 Node 계열 렌더링 패스
function populateA7Tabula() {
    const targets = A7_BODIES[A7_STATE.category] || [];
    const tbody = document.getElementById('a7-tabula-body');
    const theadTr = document.getElementById('a7-tabula-head-row');
    if(!tbody) return;

    Array.from(tbody.rows).forEach(tr => {
        const stickyCol = tr.querySelector('.sticky-col');
        if (stickyCol) {
            const lineBox = stickyCol.querySelector('.sabian-line-box');
            if (lineBox) lineBox.remove();
        }

        for(let c=1; c<=targets.length; c++) {
            tr.cells[c].innerHTML = '-'; 
            tr.cells[c].style.color = '#555';
            tr.cells[c].className = ''; 
        }
    });

    function addSabianLine(tr, targetName) {
        const stickyCol = tr.querySelector('.sticky-col');
        if (!stickyCol) return;
        
        let lineBox = stickyCol.querySelector('.sabian-line-box');
        if (!lineBox) {
            lineBox = document.createElement('div');
            lineBox.className = 'sabian-line-box';
            stickyCol.appendChild(lineBox);
        }
        
        const existingLine = Array.from(lineBox.children).find(el => el.dataset.target === targetName);
        if (!existingLine) {
            const line = document.createElement('div');
            line.className = 's-line-colored';
            line.dataset.target = targetName;
            const colorVar = getA7LineColorVar(targetName);
            line.style.backgroundColor = colorVar;
            line.style.color = colorVar; 
            lineBox.appendChild(line);
        }
    }

    targets.forEach((targetName, colIdx) => {
        const chartData = A7_STATE.data[targetName];
        if(!chartData) return;
        const cellIndex = colIdx + 1; 

        if(theadTr) {
            const th = theadTr.cells[cellIndex];
            if(th) {
                const info = chartData.chart_info;
                th.classList.add('a7-hover-target');
                th.dataset.tooltip = `[Persona Birth]\n${info.datetime || '-'}\nDay Lord: ${info.day_lord || '-'}\nHour Lord: ${info.hour_lord || '-'}`;
                th.style.cursor = 'help';
                th.style.setProperty('border-bottom', `3px solid ${getA7LineColorVar(targetName)}`, 'important');
            }
        }
        
        Array.from(tbody.rows).forEach(tr => {
            const deg = parseInt(tr.dataset.absDeg);
            const hNum = getHouseNumForDegree(deg, chartData);
            if (hNum) tr.cells[cellIndex].classList.add(`bg-house-${hNum}`);
        });
        
        // 1. 행성 렌더링
        for (const [bodyName, pData] of Object.entries(chartData.points)) {
            if(pData.longitude === undefined) continue;

            // 🚀 [추가됨]: Draconic / Ketunic 시스템일 경우 해당 노드 마커 렌더링 강제 패스 (Tabula 전용)
            if ((A7_STATE.system === 'draconic' || A7_STATE.system === 'ketunic') && 
                ["North Node (t)", "Rahu", "South Node (t)", "Ketu"].includes(bodyName)) {
                continue;
            }

            const tr = tbody.querySelector(`tr[data-abs-deg="${Math.floor(pData.longitude) % 360}"]`);
            if(tr && tr.cells[cellIndex]) {
                if (tr.cells[cellIndex].innerHTML === '-') tr.cells[cellIndex].innerHTML = '';
                let marker = document.createElement('div');
                let shortName = bodyName.replace(" (Natal)", "");
                marker.textContent = shortName;
                
                const lordClasses = getA7LordClasses(bodyName, chartData.chart_info);
                marker.className = `${getA7MateriaClass(bodyName)} ${lordClasses}`.trim();
                
                marker.classList.add('a7-hover-target');
                marker.style.cursor = 'help';
                marker.dataset.tooltip = `[${targetName} Persona]\n${shortName}: ${pData.dms}`;
                
                marker.style.fontSize = "0.7rem"; 
                marker.style.marginBottom = "2px";
                
                // 🚀 [추가]: 정렬을 위한 정확한 소수점 도수 심기
                marker.dataset.exactLon = pData.longitude;
                marker.dataset.isCusp = "false";
                
                tr.cells[cellIndex].appendChild(marker);

                addSabianLine(tr, targetName);
            }
        }
        
        // 2. Cusp 렌더링
        // 2. Cusp 렌더링
        const isWholeHouse = (localStorage.getItem('tetramegistus_house') === 'whole');
        
        if (chartData.cusps) {
            for (let i = 1; i <= 12; i++) {
                const hLon = chartData.cusps[`H${i}`];
                if (hLon !== undefined) {
                    const tr = tbody.querySelector(`tr[data-abs-deg="${Math.floor(hLon) % 360}"]`);
                    if (tr && tr.cells[cellIndex]) {
                        if (tr.cells[cellIndex].innerHTML === '-') tr.cells[cellIndex].innerHTML = '';
                        let marker = document.createElement('div');
                        
                        marker.className = `a7-house-marker p-cusp a7-hover-target`;
                        marker.textContent = `${i}h cusp`;
                        
                        let d = Math.floor(hLon);
                        let m = Math.floor((hLon - d) * 60);
                        let s = Math.floor(((hLon - d) * 60 - m) * 60);
                        let dmsStr = `${d%30}°${m.toString().padStart(2,'0')}'${s.toString().padStart(2,'0')}''`;
                        const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
                        
                        marker.style.cursor = 'help';
                        marker.dataset.tooltip = `[${targetName} Persona]\n${i}h cusp: ${SIGNS[Math.floor(hLon/30)%12]}, ${dmsStr}`;
                        marker.style.fontSize = "0.65rem"; 
                        marker.style.marginTop = "2px";

                        // 🚀 [추가]: 정렬을 위한 정확한 소수점 도수 심기
                        marker.dataset.exactLon = hLon;
                        marker.dataset.isCusp = "true";

                        tr.cells[cellIndex].appendChild(marker);

                        // 🚀 [수정]: Cusp 텍스트는 출력하되, Whole House일 때 컬러 라인 렌더링만 패스
                        if (!isWholeHouse) {
                            addSabianLine(tr, targetName);
                        }
                    }
                }
            }
        }
    }); // targets.forEach 닫히는 곳

    // 🚀 [DOM 물리적 재정렬 방역]: 표에 다 때려박은 후, 한 칸(Cell)에 2개 이상 들어있으면 소수점 기준으로 위치 변경!
    Array.from(tbody.rows).forEach(tr => {
        for(let c = 1; c <= targets.length; c++) {
            const cell = tr.cells[c];
            // 해당 셀 안의 마커(div)들을 배열로 수집
            const markers = Array.from(cell.children).filter(el => el.hasAttribute('data-exact-lon'));
            
            if (markers.length > 1) {
                markers.sort((a, b) => {
                    const lonA = parseFloat(a.dataset.exactLon);
                    const lonB = parseFloat(b.dataset.exactLon);
                    
                    if (lonA !== lonB) return lonA - lonB; // 소수점 기준 오름차순 (Aries 0에 가까운 순)
                    
                    // 도수가 완벽히 같다면(Whole Sign 등) 무조건 Cusp를 위로(-1) 올림
                    const cuspA = a.dataset.isCusp === "true" ? -1 : 1;
                    const cuspB = b.dataset.isCusp === "true" ? -1 : 1;
                    return cuspA - cuspB;
                });
                
                // 정렬된 순서대로 다시 어펜드하면 브라우저가 위아래 순서를 예쁘게 바꿔줌
                markers.forEach(m => cell.appendChild(m));
            }
        }
    });
} // populateA7Tabula() 닫히는 곳

/* 5. HELPERS */
function renderSigilumSkeleton() {
    const tbody = document.getElementById('a7-tbody-sigilum');
    if (!tbody) return;
    if (!A7_STATE.data) tbody.innerHTML = `<tr><td colspan="11" class="text-center" style="padding:30px; color:#555; font-style:italic;">Loading Personas...</td></tr>`;
    else populateA7Sigilum();
}

function renderPlenitudoSabianSkeleton() {
    const thead = document.getElementById('a7-thead-sabian');
    const tbody = document.getElementById('a7-tbody-sabian');
    const targets = A7_BODIES[A7_STATE.category] || [];
    let headHTML = `<tr><th class="a7-col-header">CELESTIAL BODIES</th>`;
    targets.forEach(t => headHTML += `<th class="a7-col-header a7-hover-target ${getA7MateriaClass(t)}">${t}</th>`);
    thead.innerHTML = headHTML + `</tr>`;
    if(!A7_STATE.data) tbody.innerHTML = `<tr><td colspan="${targets.length + 1}" style="text-align:center; padding:30px; color:#555;">Loading Matrix...</td></tr>`;
    else populateA7Sabian();
}

function renderPlenitudoTabulaSkeleton() {
    const wrapper = document.getElementById('a7-tabula-wrapper');
    wrapper.innerHTML = `<div class="codex-table-wrapper" style="width:100%; height:75vh; overflow:auto;"><table class="a8-table a7-tabula-table"><thead><tr id="a7-tabula-head-row"></tr></thead><tbody id="a7-tabula-body"></tbody></table></div>`;
    const thead = document.getElementById('a7-tabula-head-row');
    const tbody = document.getElementById('a7-tabula-body');
    const targets = A7_BODIES[A7_STATE.category] || [];
    let headHTML = `<th class="sticky-col">SABIAN NUMBER</th>`;
    targets.forEach(t => headHTML += `<th class="${getA7MateriaClass(t)}">${t.toUpperCase()}</th>`);
    thead.innerHTML = headHTML + `<th class="col-sabian-symbol">SABIAN SYMBOL</th>`;

    const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const ELEMS = ['elem-fire', 'elem-earth', 'elem-air', 'elem-water'];

    for (let i = 0; i < 360; i++) {
        const tr = document.createElement('tr');
        tr.dataset.absDeg = i;
        if ((i % 30) === 29) tr.classList.add('sign-boundary');
        let rowHTML = `<td class="sticky-col ${ELEMS[Math.floor(i/30)%4]}">${SIGNS[Math.floor(i/30)]} ${(i%30)+1}</td>`;
        targets.forEach(() => rowHTML += `<td>-</td>`);
        tr.innerHTML = rowHTML + `<td class="col-sabian-symbol" data-sabian="${i}">...</td>`;
        tbody.appendChild(tr);
    }
    if(A7_STATE.data) populateA7Tabula();
    renderA7SabianSymbolsInView('#a7-tabula-body');
}

async function fetchA7SabianSymbols() {
    if (A7_STATE.sabianSymbols) return;
    try {
        const res = await fetch('/api/astro/theory/sabian/definitions');
        if (res.ok) A7_STATE.sabianSymbols = await res.json();
    } catch (e) { console.warn("[A7] Sabian Fail", e); }
}

async function renderA7SabianSymbolsInView(containerSelector) {
    if (!A7_STATE.sabianSymbols) await fetchA7SabianSymbols();
    if (!A7_STATE.sabianSymbols) return;
    const syms = A7_STATE.sabianSymbols;
    const lang = localStorage.getItem('tetramegistus_lang') || 'ko';
    document.querySelectorAll(`${containerSelector} .col-sabian-symbol`).forEach(cell => {
        const index = cell.getAttribute('data-sabian');
        if (index !== null && index !== "NaN" && syms[index]) {
            cell.textContent = syms[index][lang] || syms[index]['en'];
        } else if (cell.textContent === '...') { cell.textContent = "-"; }
    });
}

function bindA7Tooltips() {
    const tooltip = document.getElementById('a7-info-tooltip');
    if (!tooltip) return;
    document.addEventListener('mouseover', e => {
        const target = e.target.closest('.a7-hover-target');
        if (target && target.dataset.tooltip) {
            tooltip.innerHTML = target.dataset.tooltip.replace(/\n/g, '<br>');
            tooltip.style.display = 'block';
        }
    });
    document.addEventListener('mousemove', e => {
        if (tooltip.style.display === 'block') {
            let x = e.pageX + 15, y = e.pageY + 15;
            if (x + 250 > window.innerWidth) x = e.pageX - 260;
            tooltip.style.left = x + 'px'; tooltip.style.top = y + 'px';
        }
    });
    document.addEventListener('mouseout', e => {
        if (e.target.closest('.a7-hover-target')) tooltip.style.display = 'none';
    });
}

/* ─────────────────────────────────────────────────────────────
   X. GRIMOIRE MANIFESTATION (A7 -> Archive)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    // 1. Albedo(Coniunctio) 시드 조합 가져오기 (A2/A3 방식)
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

    if (!s1Name && !s2Name) {
        alert("No active seed found. Please return to the main station.");
        return false;
    }

    let targetName = `${s1Name} & ${s2Name}`;

    // 2. 테트라메기스투스 언어 및 설정 로드
    const currentLang = localStorage.getItem('tetramegistus_lang') || 'en';
    const params = new URLSearchParams(window.location.search);
    const hSys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';

    // 3. 다이나믹 컴파일러 라우팅 (A7 Structure)
    const m1 = String(A7_STATE.mode1).toLowerCase();
    const m2 = String(A7_STATE.mode2).toLowerCase();
    let cat = String(A7_STATE.category).toLowerCase();
    
    // 🚀 [네이밍 충돌 해결]: 프론트엔드의 'lilith'를 백엔드의 'nodes'로 강제 치환!
    if (cat === 'lilith') {
        cat = 'nodes';
    }

    let compilerId = '';
    if (m1 === 'sigilum') {
        compilerId = 'a7';
    } else if (m1 === 'plenitudo') {
        if (m2 === 'sabian') {
            compilerId = `a7_sabian_${cat}`;
        } else if (m2 === 'tabula') {
            compilerId = `a7_${cat}_${currentLang}`;
        }
    }

    if (!compilerId) {
        console.error("[GRIMOIRE] Invalid A7 state for compilation.", {m1, m2, cat});
        alert("System State Error: Cannot determine compiler.");
        return false;
    }

    // 4. Payload 조립
    const payload = {
        seed_id: seedId,        
        stage: 'albedo',       
        target_name: targetName,
        language: currentLang,
        metadata: {
            sys_tab: A7_STATE.system,
            ayanamsa: A7_STATE.ayanamsa,
            h_sys: hSys,
            category: cat
        },
        seed: albedoStation // 파이썬 백엔드가 필요할 경우를 대비해 시드 정보 통째로 전송
    };

    // 5. 백엔드 API로 전송
    try {
        console.log(`[GRIMOIRE] Manifesting to Archive using [ ${compilerId} ]...`, payload);
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        
        if (res.ok) {
            console.log(`[GRIMOIRE] Archive [${targetName}] Saved Successfully!`);
            return true; 
        } else {
            alert('Failed to manifest Grimoire: ' + (result.detail || result.error));
            throw new Error(result.detail || result.error); 
        }
    } catch (e) {
        console.error("[GRIMOIRE] Manifestation Error:", e);
        alert("Network Error during Grimoire Save.");
        throw e;
    }
};