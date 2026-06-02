/* static/mobile/world/albedo/modules/a2.js - Mobile Hybrid Engine (v8 Final) */

const A2_STATE = {
    method: 'composite', mode: 'normal', system: 'tropical',
    ayanamsa: 'lahiri', view: 'zodiac', category: 'planets',
    data: {}, sabianDefs: null
};

const A2_BODIES = {
    planets: [{ sym: "☉", name: "Sun" }, { sym: "☽", name: "Moon" }, { sym: "☿", name: "Mercury" }, { sym: "♀", name: "Venus" }, { sym: "♂", name: "Mars" }, { sym: "♃", name: "Jupiter" }, { sym: "♄", name: "Saturn" }, { sym: "♅", name: "Uranus" }, { sym: "♆", name: "Neptune" }, { sym: "♇", name: "Pluto" }],
    asteroids: [{ sym: "", name: "Chiron" }, { sym: "", name: "Ceres" }, { sym: "", name: "Juno" }, { sym: "", name: "Pallas" }, { sym: "", name: "Vesta" }, { sym: "", name: "Asteroid Eros" }, { sym: "", name: "Psyche" }],
    lilith: [{ sym: "", name: "Mean Lilith" }, { sym: "", name: "True Lilith" }, { sym: "", name: "Asteroid Lilith" }, { sym: "", name: "North Node (m)" }, { sym: "", name: "North Node (t)" }, { sym: "", name: "South Node (m)" }, { sym: "", name: "South Node (t)" }],
    fates: [{ sym: "", name: "Moira" }, { sym: "", name: "Klotho" }, { sym: "", name: "Lachesis" }, { sym: "", name: "Atropos" }],
    grahas: [{ sym: "☉", name: "Sun" }, { sym: "☽", name: "Moon" }, { sym: "☿", name: "Mercury" }, { sym: "♀", name: "Venus" }, { sym: "♂", name: "Mars" }, { sym: "♃", name: "Jupiter" }, { sym: "♄", name: "Saturn" }, { sym: "☊", name: "Rahu" }, { sym: "☋", name: "Ketu" }, { sym: "", name: "Mean Lilith" }, { sym: "", name: "Chiron" }],
    angles: [{ sym: "", name: "Ascendant" }, { sym: "", name: "Immum Coeli" }, { sym: "", name: "Descendant" }, { sym: "", name: "Midheaven" }]
};

const PLANET_GLOW_MAP = { "♄": "glow-saturn", "♃": "glow-jupiter", "♂": "glow-mars", "☉": "glow-sun", "♀": "glow-venus", "☿": "glow-mercury", "☽": "glow-moon", "☋": "glow-ketu", "☊": "glow-rahu" };
const ELEMENT_MAP = { "♈︎": "glow-fire", "♌︎": "glow-fire", "♐︎": "glow-fire", "♉︎": "glow-earth", "♍︎": "glow-earth", "♑︎": "glow-earth", "♊︎": "glow-air", "♎︎": "glow-air", "♒︎": "glow-air", "♋︎": "glow-water", "♏︎": "glow-water", "♓︎": "glow-water" };

let FS_MEANINGS = {};
let a2ToastTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
    loadA2StateFromUrl();
    await ensureDataIntegrity();
    await loadFixedStarMeanings();
    
    updateA2UIState();
    await fetchAndRenderA2();

    // 팝업 바깥 빈 공간 터치 시 닫기
    document.addEventListener('touchstart', (e) => {
        const popover = document.getElementById('fs-popover');
        if (popover && popover.style.display === 'block') {
            if (!e.target.closest('.fs-icon') && !e.target.closest('.fs-popover-box')) {
                popover.style.display = 'none';
                popover.classList.remove('active');
            }
        }
    });

    // 🚀 [수복 1]: 이벤트 충돌 완전 해결 (이벤트 위임 방식으로 통일)
    document.addEventListener('click', (e) => {
        const starIcon = e.target.closest('.fs-icon');
        if (starIcon) {
            e.stopPropagation();
            const sName = starIcon.dataset.starname;
            const sToast = starIcon.dataset.startoast;
            
            // 1. 하단 토스트 띄우기 (위치 & Orb)
            if (sToast) showA2Toast(decodeURIComponent(sToast));
            
            // 2. 중앙 팝업 띄우기 (JSON 별 사전)
            if (sName) window.triggerStar(e, sName);
        }

        // 팝업 내부의 "TAP TO CLOSE" 문구 클릭 시 닫기
        const popover = document.getElementById('fs-popover');
        if (popover && popover.style.display === 'block') {
            if (e.target.innerText === "TAP TO CLOSE") {
                popover.style.display = 'none';
                popover.classList.remove('active');
            }
        }
    });
});

window.showToggleTooltip = function(id, leftText, rightText, isLeft) {
    const tooltip = document.getElementById(id);
    if(tooltip) {
        tooltip.textContent = isLeft ? leftText : rightText;
        tooltip.style.opacity = '1';
    }
};

window.hideToggleTooltip = function(id) {
    const tooltip = document.getElementById(id);
    if(tooltip) tooltip.style.opacity = '0';
};

function loadA2StateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('method')) A2_STATE.method = params.get('method');
    if (params.has('mode')) A2_STATE.mode = params.get('mode');
    if (params.has('system')) A2_STATE.system = params.get('system');
    if (params.has('ayanamsa')) A2_STATE.ayanamsa = params.get('ayanamsa');
    if (params.has('view')) A2_STATE.view = params.get('view');
    if (params.has('category')) A2_STATE.category = params.get('category');

    // 🚀 [방어막 추가]: Composite 모드일 때 강제로 Zodiac 및 기본 카테고리로 고정
    if (A2_STATE.method === 'composite' && A2_STATE.view === 'nakshatra') {
        A2_STATE.view = 'zodiac';
        if (A2_STATE.category === 'grahas' || A2_STATE.category === 'angles') {
            A2_STATE.category = 'planets';
        }
    }
}

function updateA2UIState() {
    document.getElementById('method-knob').classList.toggle('right', A2_STATE.method === 'davison');
    document.getElementById('label-method-comp').classList.toggle('active', A2_STATE.method === 'composite');
    document.getElementById('label-method-dav').classList.toggle('active', A2_STATE.method === 'davison');
    document.getElementById('m-davison-lords').style.display = A2_STATE.method === 'davison' ? 'flex' : 'none';
    document.getElementById('m-composite-controls').style.display = A2_STATE.method === 'davison' ? 'none' : 'flex';

    document.getElementById('anti-knob').classList.toggle('right', A2_STATE.mode === 'anti');
    document.getElementById('label-mode-comp').classList.toggle('active', A2_STATE.mode !== 'anti');
    document.getElementById('label-mode-anti').classList.toggle('active', A2_STATE.mode === 'anti');

    document.querySelectorAll('#main-system-nav .sys-tab, .m-connected-tabs > .m-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.sys === A2_STATE.system));
    
    const sVault = document.getElementById('m-sidereal-vault');
    if (A2_STATE.system === 'sidereal') {
        sVault.classList.remove('m-hidden');
        document.querySelectorAll('.m-ayan-tabs .m-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.ayan === A2_STATE.ayanamsa));
        
        // 🚀 [로직 추가]: Composite면 View 토글 숨김, Davison일 때만 표시
        const viewToggle = document.getElementById('m-view-toggle');
        if (viewToggle) {
            viewToggle.style.display = (A2_STATE.method === 'composite') ? 'none' : 'flex';
        }
        
        document.getElementById('view-knob').classList.toggle('right', A2_STATE.view === 'nakshatra');
        document.getElementById('label-view-zod').classList.toggle('active', A2_STATE.view !== 'nakshatra');
        document.getElementById('label-view-nak').classList.toggle('active', A2_STATE.view === 'nakshatra');
    } else {
        sVault.classList.add('m-hidden');
    }

    const zodGrid = document.getElementById('m-cat-grid-zodiac');
    const nakGrid = document.getElementById('m-cat-grid-nakshatra');
    
    if (A2_STATE.view === 'nakshatra') {
        zodGrid.style.display = 'none';
        nakGrid.style.display = 'grid';
    } else {
        zodGrid.style.display = 'grid';
        nakGrid.style.display = 'none';
    }

    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.cat === A2_STATE.category));
}

window.switchA2View = function() { 
    const u = new URL(window.location.href); 
    const nextView = A2_STATE.view === 'zodiac' ? 'nakshatra' : 'zodiac';
    u.searchParams.set('view', nextView); 
    u.searchParams.set('category', nextView === 'nakshatra' ? 'grahas' : 'planets');
    window.location.href = u.toString(); 
};
window.switchA2Method = function() { const u = new URL(window.location.href); u.searchParams.set('method', A2_STATE.method === 'composite' ? 'davison' : 'composite'); u.searchParams.delete('mode'); u.searchParams.delete('view'); window.location.href = u.toString(); };
window.switchA2Mode = function() { const u = new URL(window.location.href); u.searchParams.set('mode', A2_STATE.mode === 'normal' ? 'anti' : 'normal'); window.location.href = u.toString(); };
window.switchA2System = function(sys) { 
    const u = new URL(window.location.href); 
    u.searchParams.set('system', sys); 
    if (sys !== 'sidereal') { 
        u.searchParams.delete('ayanamsa'); 
        u.searchParams.delete('view'); 
        const currentCat = u.searchParams.get('category') || A2_STATE.category;
        if (currentCat === 'grahas' || currentCat === 'angles') {
            u.searchParams.set('category', 'planets');
        }
    } 
    window.location.href = u.toString(); 
};
window.switchA2Ayanamsa = function(ayan) { const u = new URL(window.location.href); u.searchParams.set('ayanamsa', ayan); window.location.href = u.toString(); };
// 기존 window.switchA2Category = function(cat) { ... } 지우고 아래로 교체
window.switchA2Category = function(cat) { 
    const btn = document.querySelector(`.cat-btn[data-cat="${cat}"]`);
    if (btn && btn.classList.contains('locked')) {
        showA2Toast("<strong style='color:#ff4b4b; font-size:1.1em; letter-spacing:1px;'>TIME UNKNOWN</strong><br><span style='color:#ccc;'>Calculation is locked.</span>");
        return; // 탭 이동 차단
    }
    const u = new URL(window.location.href); 
    u.searchParams.set('category', cat); 
    window.location.href = u.toString(); 
};

async function fetchAndRenderA2() {
    let h_sys = window.WorldSettings ? window.WorldSettings.getHouseCode() : (localStorage.getItem('tetramegistus_house') || 'P');
    let orbValue = parseFloat(localStorage.getItem('tetramegistus_orb')) || 1.5;
    const url = `/api/astro/coagulatio/reading?method=${A2_STATE.method}&mode=${A2_STATE.mode}&system=${A2_STATE.system}&ayanamsa=${A2_STATE.ayanamsa}&view=${A2_STATE.view}&h_sys=${h_sys}&fixed_star_orb=${orbValue}`;

    // (a2.js fetchAndRenderA2 안의 fetch 블록 찾아서 교체)
    try {
        const response = await fetch(url);
        if (!response.ok) return;
        const resData = await response.json();
        A2_STATE.data = resData;

        // 🚀 [추가됨]: Time Unknown 감지 및 Angles 탭 락 처리
        const isUnknown = resData.meta && resData.meta.is_time_unknown === 1;
        const angleBtn = document.querySelector(`.cat-btn[data-cat="angles"]`);
        
        if (angleBtn) {
            if (isUnknown) angleBtn.classList.add('locked');
            else angleBtn.classList.remove('locked');
        }
        
        if (isUnknown && A2_STATE.category === 'angles') {
            window.switchA2Category('planets'); 
            return;
        }

        if (A2_STATE.method === 'davison' && resData.lords) {
            document.getElementById('day-lord').textContent = resData.lords.day || "-";
            document.getElementById('hour-lord').textContent = resData.lords.hour || "-";
        }
        renderA2Cards(resData.planets);
    } catch (e) {}
}

function renderA2Cards(planetData) {
    const container = document.getElementById('m-a2-cards-container');
    container.innerHTML = "";
    if (!planetData) return;

    let items = A2_BODIES[A2_STATE.category] || [];
    if (A2_STATE.system === 'draconic' || A2_STATE.system === 'ketunic') items = items.filter(b => !b.name.includes('Node'));

    const isNak = A2_STATE.view === 'nakshatra' && A2_STATE.method === 'davison' && A2_STATE.system === 'sidereal';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    
    let dayLords = [];
    let hourLord = "";
    if (A2_STATE.data.lords) {
        dayLords = (A2_STATE.data.lords.day || "").split('|').map(s => s.trim());
        hourLord = A2_STATE.data.lords.hour || "";
    }

    items.forEach(body => {
        if (A2_STATE.category === 'grahas' && body.name === 'Mean Lilith') {
            container.insertAdjacentHTML('beforeend', `<div class="m-system-divider"></div>`);
        }

        const pKey = Object.keys(planetData).find(k => (body.sym + " " + body.name).includes(k) || body.name.includes(k));
        if (!pKey) return;
        const info = planetData[pKey];

        const isLord = dayLords.includes(body.name) || hourLord === body.name;

        let infoClass = "m-card-info";
        if (info.is_anaretic) {
            infoClass += " text-anaretic";
        } else if (info.solar_phase) {
            if (info.solar_phase === 'cazimi') infoClass += " phase-cazimi";
            else if (info.solar_phase === 'combust') infoClass += " phase-combust";
            else if (info.solar_phase === 'under_beams') infoClass += " phase-beams";
        }
        
        let titleClass = "m-card-title";
        if (isLord) titleClass += " lord-active-title";

        let lordTags = "";
        if (dayLords.includes(body.name)) lordTags += `<br><strong style="color:#FFD700;">[Day Lord]</strong>`;
        if (hourLord === body.name) lordTags += `<br><strong style="color:#FFD700;">[Hour Lord]</strong>`;

        let toastHTML = `<strong style="color:#49dce1;">${body.name}</strong>${lordTags}`;
        if (info.is_anaretic) toastHTML += `<br><span class="text-anaretic">! ANARETIC !</span>`;
        if (info.ruler) toastHTML += `<br><span style="color:#fff;">Ruler:</span> ${info.ruler}`;
        if (info.dignity && info.dignity !== '-') toastHTML += ` | <span style="color:#fff;">Dignity:</span> ${info.dignity}`;
        if (info.solar_phase) {
            const pMap = { 'cazimi': 'Cazimi', 'combust': 'Combust', 'under_beams': 'Under the Beams' };
            toastHTML += `<br><span style="color:#FFD700;">Phase:</span> ${pMap[info.solar_phase] || info.solar_phase.toUpperCase()}`;
        }
        const encodedToast = encodeURIComponent(toastHTML);

        // 🚀 [수복 2]: 인라인 onclick 분쇄 후 안전한 dataset 속성 부여
        let starsHTML = "";
        if (A2_STATE.method === 'davison' && info.fixed_stars?.length > 0) {
            starsHTML = `<div class="fs-container">`;
            info.fixed_stars.forEach(star => {
                const sToast = encodeURIComponent(`<strong style="color:#FFD700;">${star.name}</strong><br><span style="color:#fff;"></span> ${star.position} | <span style="color:#fff;"></span> ${star.orb}°`);
                const safeName = star.name.replace(/"/g, '&quot;'); // 더블 쿼트 이스케이프 방어
                starsHTML += `<span class="fs-icon fs-${star.tier.toLowerCase()}" data-starname="${safeName}" data-startoast="${sToast}"></span>`;
            });
            starsHTML += `</div>`;
        }

        let dignitiesHTML = "";
        if (isNak) {
            const padaName = A2_STATE.ayanamsa === 'kp' ? 'SUB' : 'PADA';
            const padaVal = A2_STATE.ayanamsa === 'kp' ? (info.sub_lord || "-") : (info.pada_lord || "-");
            const padaGlow = PLANET_GLOW_MAP[padaVal] || "";
            
            let nakHTML = `<span class="m-glow-slot" style="font-size:0.85rem; color:#49dce1;">${info.nakshatra?.name || "-"}</span>`;
            if (info.nakshatra && info.nakshatra.name) {
                const nakToast = encodeURIComponent(`<strong style="color:#49dce1;">Nakshatra #${info.nakshatra.number}</strong><br><span style="color:#ccc;">Ruler: ${info.nakshatra.ruler}</span>`);
                nakHTML = `<span class="m-glow-slot" style="font-size:0.85rem; color:#49dce1; cursor:pointer; border-bottom:1px dotted #49dce1;" onclick="showA2Toast(decodeURIComponent('${nakToast}'))">${info.nakshatra.name}</span>`;
            }

            dignitiesHTML = `
                <div class="m-dignities" style="justify-content: space-around;">
                    <div class="m-dig-col"><span class="m-dig-lbl">NAKSHATRA</span>${nakHTML}</div>
                    <div class="m-dig-col"><span class="m-dig-lbl">${padaName}</span><span class="m-glow-slot ${padaGlow}">${padaVal}</span></div>
                </div>`;
        } else {
            const duGlow = ELEMENT_MAP[info.duad] || "";
            const doGlow = ELEMENT_MAP[info.dodeca] || "";
            const deGlow = PLANET_GLOW_MAP[info.decan] || "";
            const boGlow = PLANET_GLOW_MAP[info.bound] || "";
            dignitiesHTML = `
                <div class="m-dignities">
                    <div class="m-dig-col"><span class="m-dig-lbl">DUAD</span><span class="m-glow-slot ${duGlow}">${info.duad || "-"}</span></div>
                    <div class="m-dig-col"><span class="m-dig-lbl">DOD.</span><span class="m-glow-slot ${doGlow}">${info.dodeca || "-"}</span></div>
                    <div class="m-dig-col"><span class="m-dig-lbl">DECAN</span><span class="m-glow-slot ${deGlow}">${info.decan || "-"}</span></div>
                    <div class="m-dig-col"><span class="m-dig-lbl">BOUND</span><span class="m-glow-slot ${boGlow}">${info.bound || "-"}</span></div>
                </div>`;
        }

        let sabianText = "-";
        if (A2_STATE.sabianDefs && info.sabian_index !== undefined) {
            const def = A2_STATE.sabianDefs[info.sabian_index];
            if (def) sabianText = def[lang] || def['en'] || "-";
        }

        const html = `
            <div class="m-figura-card">
                <div class="m-card-header">
                    <span class="${titleClass}">${body.sym} ${body.name}</span>
                    <span class="${infoClass}" onclick="showA2Toast(decodeURIComponent('${encodedToast}'))" style="cursor: pointer; border-bottom: 1px dotted currentColor; padding-bottom: 2px;">${info.dms || "-"}</span>
                </div>
                <div class="m-card-meta">
                    <span>House: <span class="m-card-house">${info.house || "-"}</span></span>
                    ${starsHTML}
                </div>
                ${dignitiesHTML}
                <div class="m-card-sabian" id="sabian-${pKey}">${sabianText}</div>
            </div>`;
        
        container.insertAdjacentHTML('beforeend', html);
        if (sabianText === "-") renderAsyncSabian(pKey, info.sabian_index, lang);
    });
}

function showA2Toast(htmlContent) {
    const toast = document.getElementById('m-a2-toast');
    if (!toast) return;
    toast.innerHTML = htmlContent;
    toast.classList.remove('m-toast-hidden');
    if (a2ToastTimer) clearTimeout(a2ToastTimer);
    a2ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 4000);
}

// 🚀 [수복]: PC판 n2.js의 JSON 렌더링 이식 + 터치 시 닫기(Dismiss) 로직 완벽 적용
window.triggerStar = function(event, starName) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const popover = document.getElementById('fs-popover');
    if (!popover) return;
    
    const cleanName = starName.trim();
    
    // 1. 대소문자 무시 탐색 로직
    const matchedKey = Object.keys(FS_MEANINGS).find(k => k.toLowerCase() === cleanName.toLowerCase());
    const sData = matchedKey ? FS_MEANINGS[matchedKey] : null;
    
    if (!sData) {
        popover.innerHTML = `
            <div class="fs-title" style="font-size: 1.1rem; font-weight: 900; border-bottom: 1px solid #49dce1; padding-bottom: 8px; margin-bottom: 12px; color: #49dce1; text-align: center;">${cleanName}</div>
            <div class="fs-content"><p style="color:#888; text-align:center;">Interpretation missing.</p></div>
            <div style="margin-top: 15px; font-size: 0.7rem; color: #555; text-align: center; border-top: 1px dashed rgba(73, 220, 225, 0.2); padding-top: 10px;">TAP ANYWHERE TO CLOSE</div>
        `;
    } else {
        const userLang = localStorage.getItem('tetramegistus_lang') || 'en';
        const targetLang = (userLang === 'ko' || userLang.startsWith('ko')) ? 'ko' : 'en';
        
        const rawContent = (sData.symbolism && (sData.symbolism[targetLang] || sData.symbolism['en']));
        
        let descHtml = '<p style="color:#888;">No text available.</p>';
        if (rawContent) {
            const descLines = Array.isArray(rawContent) ? rawContent : [rawContent];
            descHtml = descLines.map(l => `<p style="margin: 6px 0; line-height: 1.5; color: #ddd; font-size: 0.85rem;">• ${l}</p>`).join('');
        }
        
        popover.innerHTML = `
            <div class="fs-title" style="font-size: 1.1rem; font-weight: 900; border-bottom: 1px solid #49dce1; padding-bottom: 8px; margin-bottom: 12px; color: #49dce1; text-align: center;">
                ${cleanName}
            </div>
            <div style="margin-bottom: 15px;">
                <div style="color: #49dce1; font-size: 0.8em; margin-bottom: 8px; font-style: italic; text-align: right;">
                    ${sData.constellation || ''}
                </div>
                <div class="fs-content" style="text-align: left;">
                    ${descHtml}
                </div>
            </div>
            <div style="margin-top: 15px; font-size: 0.7rem; color: #555; text-align: center; border-top: 1px dashed rgba(73, 220, 225, 0.2); padding-top: 10px;">TAP ANYWHERE TO CLOSE</div>
        `;
    }

    // 🚀 [해결]: 팝업창 내부 어디를 터치하든(심지어 글자를 눌러도) 즉시 닫히는 직관적 제어
    popover.onclick = function() {
        this.style.display = 'none';
        this.classList.remove('active');
    };

    popover.style.display = 'block';
    popover.classList.add('active');
};

async function renderAsyncSabian(domId, index, lang) {
    if (index === undefined || index === null) return;
    try {
        const res = await fetch(`/api/theory/sabian/render/${index}?lang=${lang}`);
        if (res.ok) {
            const d = await res.json();
            const el = document.getElementById(`sabian-${domId}`);
            if (el) el.textContent = d.text;
            if (!A2_STATE.sabianDefs) A2_STATE.sabianDefs = {};
            A2_STATE.sabianDefs[index] = { [lang]: d.text };
        }
    } catch(e) {}
}

async function loadFixedStarMeanings() {
    if (Object.keys(FS_MEANINGS).length > 0) return;
    try { const res = await fetch('/api/theory/fixedstar/meanings'); if (res.ok) FS_MEANINGS = await res.json(); } catch(e) {}
}

async function ensureDataIntegrity() {
    let localData = null;
    try { localData = JSON.parse(localStorage.getItem('active_davison')); } catch(e) {}
    if (localData && localData.seed1 && localData.seed2) {
        try { await fetch('/api/astro/coagulatio/sync-active', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(localData) }); } catch(e) {}
    }
}

window.saveToGrimoire = async function() {
    if (!A2_STATE.data || !A2_STATE.data.planets) {
        alert("Manifestation Error: Data not loaded."); throw new Error("No Data");
    }

    const albedoStation = JSON.parse(localStorage.getItem('active_davison')) || JSON.parse(localStorage.getItem('active_composite')) || {};
    let s1Name = albedoStation.seed1?.name || "";
    let s2Name = albedoStation.seed2?.name || "";
    let seedId = albedoStation.id;

    if (!seedId) {
        let id1 = albedoStation.seed1?.idx || albedoStation.seed1?.id || "unknown1";
        let id2 = albedoStation.seed2?.idx || albedoStation.seed2?.id || "unknown2";
        seedId = `${id1}_${id2}`;
    }

    const targetName = (s1Name && s2Name) ? `${s1Name} & ${s2Name}` : "Unknown Coniunctio";
    let h_sys = window.WorldSettings ? window.WorldSettings.getHouseCode() : (localStorage.getItem('tetramegistus_house') || 'P');
    let orb = localStorage.getItem('tetramegistus_orb') || '1.0';

    const metadata = {
        day_lord: A2_STATE.data.lords?.day || "",
        hour_lord: A2_STATE.data.lords?.hour || "",
        sys_tab: A2_STATE.system, ayanamsa: A2_STATE.ayanamsa,
        h_sys: h_sys, fixed_star_orb: orb,
        view_mode: A2_STATE.view, method: A2_STATE.method, mode: A2_STATE.mode, 
        target_name: targetName, language: localStorage.getItem('tetramegistus_lang') || 'en'
    };

    const bodies = {};
    const flatBodies = Object.values(A2_BODIES).flat();
    
    flatBodies.forEach(b => {
        const pKey = Object.keys(A2_STATE.data.planets).find(k => (b.sym + " " + b.name).includes(k) || b.name.includes(k));
        if (!pKey) return;
        
        if ((A2_STATE.system === 'draconic' || A2_STATE.system === 'ketunic') && b.name.includes('Node')) return;

        const info = A2_STATE.data.planets[pKey];
        const starsFormat = (info.fixed_stars || []).map(s => ({ name: s.name, info: s.position, orb: s.orb }));
        
        let bodyData = { 
            info: info.dms || "-", ruler: info.ruler || "", dignity: info.dignity || "", 
            is_anaretic: !!info.is_anaretic, stars: starsFormat 
        };

        if (A2_STATE.view === 'nakshatra' && A2_STATE.method === 'davison' && A2_STATE.system === 'sidereal') {
            bodyData.nakshatra = info.nakshatra?.name || "-";
            bodyData.pada_lord = A2_STATE.ayanamsa === 'kp' ? (info.sub_lord || "-") : (info.pada_lord || "-");
        } else {
            bodyData.house = info.house || "-";
            bodyData.duad = info.duad || "-";
            bodyData.dodeca = info.dodeca || "-";
            bodyData.decan = info.decan || "-";
            bodyData.bounds = info.bound || "-";
        }
        
        if (A2_STATE.sabianDefs && A2_STATE.sabianDefs[info.sabian_index]) {
            bodyData.sabian = A2_STATE.sabianDefs[info.sabian_index][metadata.language] || "-";
        } else { bodyData.sabian = "-"; }

        bodies[b.name] = bodyData;
    });

    const payload = { seed_id: seedId, stage: 'albedo', target_name: targetName, metadata: metadata, bodies: bodies };

    let compilerId = 'a2';
    if (A2_STATE.method === 'composite') compilerId = 'a2_comp';
    else if (A2_STATE.view === 'nakshatra' && A2_STATE.system === 'sidereal') compilerId = 'a2_nak';

    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) return true; 
        else throw new Error("Manifestation Failed");
    } catch (e) { throw e; }
};