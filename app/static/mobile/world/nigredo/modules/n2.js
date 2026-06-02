/* static/mobile/world/nigredo/modules/n2.js - Mobile N2 Engine */

const N2_STATE = {
    system: 'tropical', ayanamsa: 'lahiri', view: 'zodiac', category: 'planets',
    data: {}, sabianDefs: null
};

const N2_BODIES = {
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
let n2ToastTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
    loadN2StateFromUrl();
    await ensureDataIntegrity();
    await loadFixedStarMeanings();
    
    updateN2UIState();
    await fetchAndRenderN2();

    document.addEventListener('click', (e) => {
        const starIcon = e.target.closest('.fs-icon');
        if (starIcon) {
            e.stopPropagation();
            const sName = starIcon.dataset.starname;
            const sToast = starIcon.dataset.startoast;
            if (sToast) showN2Toast(decodeURIComponent(sToast));
            if (sName) window.triggerStar(e, sName);
        }
        const popover = document.getElementById('fs-popover');
        if (popover && popover.style.display === 'block') {
            if (e.target.innerText === "TAP ANYWHERE TO CLOSE") {
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

function loadN2StateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('system')) N2_STATE.system = params.get('system');
    if (params.has('ayanamsa')) N2_STATE.ayanamsa = params.get('ayanamsa');
    if (params.has('view')) N2_STATE.view = params.get('view');
    if (params.has('category')) N2_STATE.category = params.get('category');
}

function updateN2UIState() {
    document.querySelectorAll('#main-system-nav .sys-tab, .m-connected-tabs > .m-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.sys === N2_STATE.system));
    
    const sVault = document.getElementById('m-sidereal-vault');
    if (N2_STATE.system === 'sidereal') {
        sVault.classList.remove('m-hidden');
        document.querySelectorAll('.m-ayan-tabs .m-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.ayan === N2_STATE.ayanamsa));
        
        document.getElementById('view-knob').classList.toggle('right', N2_STATE.view === 'nakshatra');
        document.getElementById('label-view-zod').classList.toggle('active', N2_STATE.view !== 'nakshatra');
        document.getElementById('label-view-nak').classList.toggle('active', N2_STATE.view === 'nakshatra');
    } else {
        sVault.classList.add('m-hidden');
    }

    const zodGrid = document.getElementById('m-cat-grid-zodiac');
    const nakGrid = document.getElementById('m-cat-grid-nakshatra');
    
    if (N2_STATE.view === 'nakshatra') {
        zodGrid.style.display = 'none';
        nakGrid.style.display = 'grid';
    } else {
        zodGrid.style.display = 'grid';
        nakGrid.style.display = 'none';
    }

    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.cat === N2_STATE.category));
}

window.switchN2View = function() { 
    const u = new URL(window.location.href); 
    const nextView = N2_STATE.view === 'zodiac' ? 'nakshatra' : 'zodiac';
    u.searchParams.set('view', nextView); 
    u.searchParams.set('category', nextView === 'nakshatra' ? 'grahas' : 'planets');
    window.location.href = u.toString(); 
};
window.switchN2System = function(sys) { 
    const u = new URL(window.location.href); 
    u.searchParams.set('system', sys); 
    if (sys !== 'sidereal') { 
        u.searchParams.delete('ayanamsa'); 
        u.searchParams.delete('view'); 
        const currentCat = u.searchParams.get('category') || N2_STATE.category;
        if (currentCat === 'grahas' || currentCat === 'angles') {
            u.searchParams.set('category', 'planets');
        }
    } 
    window.location.href = u.toString(); 
};
window.switchN2Ayanamsa = function(ayan) { const u = new URL(window.location.href); u.searchParams.set('ayanamsa', ayan); window.location.href = u.toString(); };
// 기존 window.switchN2Category = function(cat) { ... } 지우고 아래로 교체
window.switchN2Category = function(cat) { 
    const btn = document.querySelector(`.cat-btn[data-cat="${cat}"]`);
    if (btn && btn.classList.contains('locked')) {
        showN2Toast("<strong style='color:#ff4b4b; font-size:1.1em; letter-spacing:1px;'>TIME UNKNOWN</strong><br><span style='color:#ccc;'>Calculation is locked.</span>");
        return; // 탭 이동 차단
    }
    const u = new URL(window.location.href); 
    u.searchParams.set('category', cat); 
    window.location.href = u.toString(); 
};

async function fetchAndRenderN2() {
    let h_sys = window.WorldSettings ? window.WorldSettings.getHouseCode() : (localStorage.getItem('tetramegistus_house') || 'P');
    let orbValue = parseFloat(localStorage.getItem('tetramegistus_orb')) || 1.5;
    
    // N2는 단일 차트이므로 method, mode 파라미터가 없음
    const url = `/api/astro/principia/resting?system=${N2_STATE.system}&ayanamsa=${N2_STATE.ayanamsa}&view=${N2_STATE.view}&h_sys=${h_sys}&fixed_star_orb=${orbValue}`;

    try {
        const response = await fetch(url);
        if (!response.ok) return;
        const resData = await response.json();
        N2_STATE.data = resData;

        // 🚀 [수정됨]: 심플한 락 클래스 부여 및 강제 이동 로직
        const isUnknown = resData.meta && resData.meta.is_time_unknown === 1;
        const angleBtn = document.querySelector(`.cat-btn[data-cat="angles"]`);
        
        if (angleBtn) {
            if (isUnknown) angleBtn.classList.add('locked');
            else angleBtn.classList.remove('locked');
        }
        
        if (isUnknown && N2_STATE.category === 'angles') {
            window.switchN2Category('planets'); 
            return;
        }

        if (resData.lords) {
            document.getElementById('day-lord').textContent = resData.lords.day || "-";
            document.getElementById('hour-lord').textContent = resData.lords.hour || "-";
        }
        renderN2Cards(resData.planets);
    } catch (e) {}
}

function renderN2Cards(planetData) {
    const container = document.getElementById('m-n2-cards-container');
    container.innerHTML = "";
    if (!planetData) return;

    let items = N2_BODIES[N2_STATE.category] || [];
    if (N2_STATE.system === 'draconic' || N2_STATE.system === 'ketunic') items = items.filter(b => !b.name.includes('Node'));

    const isNak = N2_STATE.view === 'nakshatra' && N2_STATE.system === 'sidereal';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    
    let dayLords = [];
    let hourLord = "";
    if (N2_STATE.data.lords) {
        dayLords = (N2_STATE.data.lords.day || "").split('|').map(s => s.trim());
        hourLord = N2_STATE.data.lords.hour || "";
    }

    items.forEach(body => {
        if (N2_STATE.category === 'grahas' && body.name === 'Mean Lilith') {
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
        if (dayLords.includes(body.name)) lordTags += `<br><strong style="color:#7CFF9B; font-size:0.85em; letter-spacing:0.5px;">[Day Lord]</strong>`;
        if (hourLord === body.name) lordTags += `<br><strong style="color:#7CFF9B; font-size:0.85em; letter-spacing:0.5px;">[Hour Lord]</strong>`;

        let toastHTML = `<strong style="color:#7CFF9B; font-size:1.1em;">${body.name}</strong>${lordTags}`;
        if (info.is_anaretic) toastHTML += `<br><span class="text-anaretic">! ANARETIC !</span>`;
        if (info.ruler) toastHTML += `<br><span style="color:#fff;">Ruler:</span> ${info.ruler}`;
        if (info.dignity && info.dignity !== '-') toastHTML += ` | <span style="color:#fff;">Dignity:</span> ${info.dignity}`;
        if (info.solar_phase) {
            const pMap = { 'cazimi': 'Cazimi', 'combust': 'Combust', 'under_beams': 'Under the Beams' };
            toastHTML += `<br><span style="color:#7CFF9B;">Phase:</span> ${pMap[info.solar_phase] || info.solar_phase.toUpperCase()}`;
        }
        const encodedToast = encodeURIComponent(toastHTML);

        // N2는 단일 차트이므로 항성이 있으면 무조건 출력
        let starsHTML = "";
        if (info.fixed_stars?.length > 0) {
            starsHTML = `<div class="fs-container">`;
            info.fixed_stars.forEach(star => {
                const sToast = encodeURIComponent(`<strong style="color:#7CFF9B;">${star.name}</strong><br><span style="color:#fff;"></span> ${star.position} | <span style="color:#fff;"></span> ${star.orb}°`);
                const safeName = star.name.replace(/"/g, '&quot;'); 
                starsHTML += `<span class="fs-icon fs-${star.tier.toLowerCase()}" data-starname="${safeName}" data-startoast="${sToast}"></span>`;
            });
            starsHTML += `</div>`;
        }

        let dignitiesHTML = "";
        if (isNak) {
            const padaName = N2_STATE.ayanamsa === 'kp' ? 'SUB' : 'PADA';
            const padaVal = N2_STATE.ayanamsa === 'kp' ? (info.sub_lord || "-") : (info.pada_lord || "-");
            const padaGlow = PLANET_GLOW_MAP[padaVal] || "";
            
            let nakHTML = `<span class="m-glow-slot" style="font-size:0.85rem; color:#7CFF9B;">${info.nakshatra?.name || "-"}</span>`;
            if (info.nakshatra && info.nakshatra.name) {
                const nakToast = encodeURIComponent(`<strong style="color:#7CFF9B;">Nakshatra #${info.nakshatra.number}</strong><br><span style="color:#ccc;">Ruler: ${info.nakshatra.ruler}</span>`);
                nakHTML = `<span class="m-glow-slot" style="font-size:0.85rem; color:#7CFF9B; cursor:pointer; border-bottom:1px dotted #7CFF9B;" onclick="showN2Toast(decodeURIComponent('${nakToast}'))">${info.nakshatra.name}</span>`;
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
        if (N2_STATE.sabianDefs && info.sabian_index !== undefined) {
            const def = N2_STATE.sabianDefs[info.sabian_index];
            if (def) sabianText = def[lang] || def['en'] || "-";
        }

        const html = `
            <div class="m-figura-card">
                <div class="m-card-header">
                    <span class="${titleClass}">${body.sym} ${body.name}</span>
                    <span class="${infoClass}" onclick="showN2Toast(decodeURIComponent('${encodedToast}'))" style="cursor: pointer; border-bottom: 1px dotted currentColor; padding-bottom: 2px;">${info.dms || "-"}</span>
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

function showN2Toast(htmlContent) {
    const toast = document.getElementById('m-n2-toast');
    if (!toast) return;
    toast.innerHTML = htmlContent;
    toast.classList.remove('m-toast-hidden');
    if (n2ToastTimer) clearTimeout(n2ToastTimer);
    n2ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 4000);
}

// 🚀 A2에서 완성한 무적의 JSON 팝업 로직
window.triggerStar = function(event, starName) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const popover = document.getElementById('fs-popover');
    if (!popover) return;
    
    const cleanName = starName.trim();
    
    const matchedKey = Object.keys(FS_MEANINGS).find(k => k.toLowerCase() === cleanName.toLowerCase());
    const sData = matchedKey ? FS_MEANINGS[matchedKey] : null;
    
    if (!sData) {
        popover.innerHTML = `
            <div class="fs-title" style="font-size: 1.1rem; font-weight: 900; border-bottom: 1px solid #7CFF9B; padding-bottom: 8px; margin-bottom: 12px; color: #7CFF9B; text-align: center;">${cleanName}</div>
            <div class="fs-content"><p style="color:#888; text-align:center;">Interpretation missing.</p></div>
            <div style="margin-top: 15px; font-size: 0.7rem; color: #555; text-align: center; border-top: 1px dashed rgba(124, 255, 155, 0.2); padding-top: 10px;">TAP ANYWHERE TO CLOSE</div>
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
            <div class="fs-title" style="font-size: 1.1rem; font-weight: 900; border-bottom: 1px solid #7CFF9B; padding-bottom: 8px; margin-bottom: 12px; color: #7CFF9B; text-align: center;">
                ${cleanName}
            </div>
            <div style="margin-bottom: 15px;">
                <div style="color: #7CFF9B; font-size: 0.8em; margin-bottom: 8px; font-style: italic; text-align: right;">
                    ${sData.constellation || ''}
                </div>
                <div class="fs-content" style="text-align: left;">
                    ${descHtml}
                </div>
            </div>
            <div style="margin-top: 15px; font-size: 0.7rem; color: #555; text-align: center; border-top: 1px dashed rgba(124, 255, 155, 0.2); padding-top: 10px;">TAP ANYWHERE TO CLOSE</div>
        `;
    }

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
            if (!N2_STATE.sabianDefs) N2_STATE.sabianDefs = {};
            N2_STATE.sabianDefs[index] = { [lang]: d.text };
        }
    } catch(e) {}
}

async function loadFixedStarMeanings() {
    if (Object.keys(FS_MEANINGS).length > 0) return;
    try { const res = await fetch('/api/theory/fixedstar/meanings'); if (res.ok) FS_MEANINGS = await res.json(); } catch(e) {}
}

async function ensureDataIntegrity() {
    let activeSeed = null;
    try { activeSeed = JSON.parse(localStorage.getItem('active_seed')); } catch(e) {}
    if (activeSeed && (!activeSeed.id || String(activeSeed.id).startsWith('LOCAL_'))) {
        try { await fetch('/api/astro/principia/sync-active', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(activeSeed) }); } catch(e) {}
    }
}

// 🚀 N2 전용 Grimoire Save (Single Chart)
window.saveToGrimoire = async function() {
    if (!N2_STATE.data || !N2_STATE.data.planets) {
        alert("Manifestation Error: Data not loaded."); throw new Error("No Data");
    }

    const activeSeed = JSON.parse(localStorage.getItem('active_seed'));
    const targetName = activeSeed ? activeSeed.name : "Unknown_Seed";
    const seedId = activeSeed ? activeSeed.id : "unknown"; 

    let h_sys = window.WorldSettings ? window.WorldSettings.getHouseCode() : (localStorage.getItem('tetramegistus_house') || 'P');
    let orb = localStorage.getItem('tetramegistus_orb') || '1.0';

    const metadata = {
        day_lord: N2_STATE.data.lords?.day || "",
        hour_lord: N2_STATE.data.lords?.hour || "",
        sys_tab: N2_STATE.system, ayanamsa: N2_STATE.ayanamsa,
        h_sys: h_sys, fixed_star_orb: orb,
        view_mode: N2_STATE.view, 
        target_name: targetName, language: localStorage.getItem('tetramegistus_lang') || 'en'
    };

    const bodies = {};
    const flatBodies = Object.values(N2_BODIES).flat();
    
    flatBodies.forEach(b => {
        const pKey = Object.keys(N2_STATE.data.planets).find(k => (b.sym + " " + b.name).includes(k) || b.name.includes(k));
        if (!pKey) return;
        
        if ((N2_STATE.system === 'draconic' || N2_STATE.system === 'ketunic') && b.name.includes('Node')) return;

        const info = N2_STATE.data.planets[pKey];
        const starsFormat = (info.fixed_stars || []).map(s => ({ name: s.name, info: s.position, orb: s.orb }));
        
        let bodyData = { 
            info: info.dms || "-", ruler: info.ruler || "", dignity: info.dignity || "", 
            is_anaretic: !!info.is_anaretic, stars: starsFormat 
        };

        if (N2_STATE.view === 'nakshatra' && N2_STATE.system === 'sidereal') {
            bodyData.nakshatra = info.nakshatra?.name || "-";
            bodyData.pada_lord = N2_STATE.ayanamsa === 'kp' ? (info.sub_lord || "-") : (info.pada_lord || "-");
        } else {
            bodyData.house = info.house || "-";
            bodyData.duad = info.duad || "-";
            bodyData.dodeca = info.dodeca || "-";
            bodyData.decan = info.decan || "-";
            bodyData.bounds = info.bound || "-";
        }
        
        if (N2_STATE.sabianDefs && N2_STATE.sabianDefs[info.sabian_index]) {
            bodyData.sabian = N2_STATE.sabianDefs[info.sabian_index][metadata.language] || "-";
        } else { bodyData.sabian = "-"; }

        bodies[b.name] = bodyData;
    });

    const payload = { seed_id: seedId, stage: 'nigredo', target_name: targetName, metadata: metadata, bodies: bodies };

    let compilerId = (N2_STATE.view === 'nakshatra') ? 'n2_nak' : 'n2';

    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) return true; 
        else throw new Error("Manifestation Failed");
    } catch (e) { throw e; }
};