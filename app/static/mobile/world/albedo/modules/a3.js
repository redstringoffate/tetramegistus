/* static/mobile/world/albedo/modules/a3.js - Mobile A3 Engine (ORDINATIO) */

const A3_STATE = {
    method: 'composite', 
    mode: 'normal',
    domus_mode: 'cusp',  
    system: 'tropical',
    ayanamsa: 'lahiri',
    view: 'zodiac',  
    data: {},
    allPlanets: {}, 
    sabianDefs: null
};

const PLANET_GLOW_MAP = { "♄": "glow-saturn", "♃": "glow-jupiter", "♂": "glow-mars", "☉": "glow-sun", "♀": "glow-venus", "☿": "glow-mercury", "☽": "glow-moon", "☋": "glow-ketu", "☊": "glow-rahu" };
const ELEMENT_MAP = { "♈︎": "glow-fire", "♌︎": "glow-fire", "♐︎": "glow-fire", "♉︎": "glow-earth", "♍︎": "glow-earth", "♑︎": "glow-earth", "♊︎": "glow-air", "♎︎": "glow-air", "♒︎": "glow-air", "♋︎": "glow-water", "♏︎": "glow-water", "♓︎": "glow-water" };

let FS_MEANINGS = {};
let a3ToastTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
    loadA3StateFromUrl();
    await ensureDataIntegrity();
    await loadFixedStarMeanings();
    
    updateA3UIState();
    await fetchAndRenderA3();

    document.addEventListener('click', (e) => {
        const starIcon = e.target.closest('.fs-icon');
        if (starIcon) {
            e.stopPropagation();
            const sName = starIcon.dataset.starname;
            const sToast = starIcon.dataset.startoast;
            if (sToast) showA3Toast(decodeURIComponent(sToast));
            if (sName) window.triggerStar(e, sName);
            return;
        }
        const popover = document.getElementById('fs-popover');
        if (popover && popover.style.display === 'block') {
            if (e.target.innerText === "TAP ANYWHERE TO CLOSE" || !e.target.closest('.fs-content')) {
                popover.style.display = 'none';
                popover.classList.remove('active');
            }
        }
    });
});

window.showToggleTooltip = function(id, leftText, rightText, isLeft) {
    const tooltip = document.getElementById(id);
    if(tooltip) { tooltip.textContent = isLeft ? leftText : rightText; tooltip.style.opacity = '1'; }
};
window.hideToggleTooltip = function(id) {
    const tooltip = document.getElementById(id);
    if(tooltip) tooltip.style.opacity = '0';
};

function loadA3StateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('method')) A3_STATE.method = params.get('method');
    if (params.has('mode')) A3_STATE.mode = params.get('mode');
    if (params.has('domus_mode')) A3_STATE.domus_mode = params.get('domus_mode');
    if (params.has('system')) A3_STATE.system = params.get('system');
    if (params.has('ayanamsa')) A3_STATE.ayanamsa = params.get('ayanamsa');
    if (params.has('view')) A3_STATE.view = params.get('view');
}

function updateA3UIState() {
    document.getElementById('method-knob').classList.toggle('right', A3_STATE.method === 'davison');
    document.getElementById('label-method-comp').classList.toggle('active', A3_STATE.method === 'composite');
    document.getElementById('label-method-dav').classList.toggle('active', A3_STATE.method === 'davison');

    const antiWrapper = document.getElementById('m-anti-composite-wrapper');
    if (A3_STATE.method === 'composite') {
        antiWrapper.style.display = 'flex';
        // 🚀 [수복 1]: Anti 모드 스위치 UI 갱신 정상화
        document.getElementById('anti-knob').classList.toggle('right', A3_STATE.mode === 'anti');
        document.getElementById('label-mode-comp').classList.toggle('active', A3_STATE.mode !== 'anti');
        document.getElementById('label-mode-anti').classList.toggle('active', A3_STATE.mode === 'anti');
    } else {
        antiWrapper.style.display = 'none';
    }

    document.getElementById('domus-knob').classList.toggle('right', A3_STATE.domus_mode === 'domain');
    document.getElementById('label-domus-cusp').classList.toggle('active', A3_STATE.domus_mode === 'cusp');
    document.getElementById('label-domus-domain').classList.toggle('active', A3_STATE.domus_mode === 'domain');

    document.querySelectorAll('.m-connected-tabs > .m-tab[data-sys]').forEach(btn => btn.classList.toggle('active', btn.dataset.sys === A3_STATE.system));
    
    const sVault = document.getElementById('m-sidereal-vault');
    const viewToggle = document.getElementById('m-view-toggle');
    
    if (A3_STATE.system === 'sidereal') {
        sVault.classList.remove('m-hidden');
        document.querySelectorAll('.m-ayan-tabs .m-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.ayan === A3_STATE.ayanamsa));
        
        if (A3_STATE.method === 'davison' && A3_STATE.domus_mode === 'cusp') {
            viewToggle.style.display = 'flex';
            document.getElementById('view-knob').classList.toggle('right', A3_STATE.view === 'lagna');
            document.getElementById('label-view-zod').classList.toggle('active', A3_STATE.view === 'zodiac');
            document.getElementById('label-view-lagna').classList.toggle('active', A3_STATE.view === 'lagna');
        } else {
            viewToggle.style.display = 'none';
        }
    } else {
        sVault.classList.add('m-hidden');
        viewToggle.style.display = 'none';
    }

    const isTableMode = (A3_STATE.domus_mode === 'domain' || (A3_STATE.system === 'sidereal' && A3_STATE.view === 'lagna'));
    document.getElementById('m-a3-cards-container').style.display = isTableMode ? 'none' : 'flex';
    document.getElementById('m-a3-table-container').style.display = isTableMode ? 'block' : 'none';
}

window.switchA3Method = function() { 
    const u = new URL(window.location.href); 
    const nextMethod = A3_STATE.method === 'composite' ? 'davison' : 'composite';
    u.searchParams.set('method', nextMethod);
    u.searchParams.delete('mode'); 
    if (nextMethod === 'composite') u.searchParams.set('view', 'zodiac'); 
    window.location.href = u.toString(); 
};

// 🚀 [수복 2]: Anti 모드 스위칭 시 URL 파라미터를 정확히 변경하고 리로드
window.switchA3Mode = function() {
    if (A3_STATE.method !== 'composite') return;
    const u = new URL(window.location.href);
    const nextMode = (A3_STATE.mode === 'anti') ? 'normal' : 'anti';
    u.searchParams.set('mode', nextMode);
    window.location.href = u.toString();
}

window.switchA3DomusMode = function() { 
    const u = new URL(window.location.href); 
    const nextMode = A3_STATE.domus_mode === 'cusp' ? 'domain' : 'cusp';
    u.searchParams.set('domus_mode', nextMode);
    if (nextMode === 'domain') u.searchParams.set('view', 'zodiac'); 
    window.location.href = u.toString(); 
};
window.switchA3View = function() { 
    const u = new URL(window.location.href); 
    u.searchParams.set('view', A3_STATE.view === 'zodiac' ? 'lagna' : 'zodiac');
    window.location.href = u.toString(); 
};
window.switchA3System = function(sys) { 
    const u = new URL(window.location.href); 
    u.searchParams.set('system', sys); 
    if (sys !== 'sidereal') { 
        u.searchParams.delete('ayanamsa'); 
        u.searchParams.delete('view'); 
    } 
    window.location.href = u.toString(); 
};
window.switchA3Ayanamsa = function(ayan) { const u = new URL(window.location.href); u.searchParams.set('ayanamsa', ayan); window.location.href = u.toString(); };

// 🚀 [수복 1]: 백엔드 API가 기대하는 파라미터는 mode가 아니라 anti=on/off 임!
async function fetchAndRenderA3() {
    let h_sys = window.WorldSettings ? window.WorldSettings.getHouseCode() : (localStorage.getItem('tetramegistus_house') || 'P');
    let orbValue = parseFloat(localStorage.getItem('tetramegistus_orb')) || 1.5;
    
    // 모바일 상태(mode)를 백엔드가 알아듣는 파라미터(anti)로 번역
    const antiParam = (A3_STATE.mode === 'anti') ? 'on' : 'off';
    
    let url = `/api/astro/ordinatio/resting?method=${A3_STATE.method}&anti=${antiParam}&system=${A3_STATE.system}&ayanamsa=${A3_STATE.ayanamsa}&view=${A3_STATE.view}&h_sys=${h_sys}&fixed_star_orb=${orbValue}`;

    try {
        let response = await fetch(url);
        if (!response.ok) {
            url = `/api/astro/ordinatio/reading?method=${A3_STATE.method}&anti=${antiParam}&system=${A3_STATE.system}&ayanamsa=${A3_STATE.ayanamsa}&view=${A3_STATE.view}&h_sys=${h_sys}&fixed_star_orb=${orbValue}`;
            response = await fetch(url);
        }
        
        if (!response.ok) return;

        const resData = await response.json();
        A3_STATE.data = resData;

        A3_STATE.allPlanets = {};
        if (resData.planets) {
            A3_STATE.allPlanets = { ...resData.planets };
        }
        if (resData.contents) {
            Object.values(resData.contents).forEach(house => {
                if (house.planets) {
                    house.planets.forEach(p => { A3_STATE.allPlanets[p.name] = p; });
                }
            });
        }

        if (resData.planets) {
            const ascKey = Object.keys(resData.planets).find(k => k.toLowerCase().includes('ascendant'));
            const mcKey = Object.keys(resData.planets).find(k => k.toLowerCase().includes('midheaven'));
            if (ascKey) document.getElementById('val-asc').textContent = resData.planets[ascKey].dms || "-";
            if (mcKey) document.getElementById('val-mc').textContent = resData.planets[mcKey].dms || "-";
        } else if (resData.meta) {
            document.getElementById('val-asc').textContent = resData.meta.asc || "-";
            document.getElementById('val-mc').textContent = resData.meta.mc || "-";
        }

        if (typeof renderOrdinatioChart === 'function') {
            renderOrdinatioChart(resData);
        } else if (typeof drawChart === 'function') {
            drawChart(resData);
        }

        const housesData = resData.houses || resData.data || resData.domus;
        if (!housesData) return;

        const isTableMode = (A3_STATE.domus_mode === 'domain' || (A3_STATE.system === 'sidereal' && A3_STATE.view === 'lagna'));
        if (isTableMode) {
            renderA3Table(housesData);
        } else {
            renderA3Cards(housesData);
        }

    } catch (e) { console.error("[A3] Render Error:", e); }
}

function renderA3Cards(data) {
    const container = document.getElementById('m-a3-cards-container');
    container.innerHTML = "";
    
    const housesArray = Array.isArray(data) ? data : (data.domus || []);
    if (!housesArray.length) return;

    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    housesArray.forEach(d => {
        let titleName = d.label || `House ${d.house_num}`;
        if (A3_STATE.system === 'sidereal' && A3_STATE.view === 'lagna' && d.lagna_info) {
            titleName = d.lagna_info.label;
        }

        let rulers = Array.isArray(d.ruler) ? d.ruler : (d.ruler ? d.ruler.split(',').map(r => r.trim()) : []);
        let toastHTML = `<strong style="color:#49dce1; font-size:1.1em; margin-bottom: 5px; display: inline-block;">${titleName}</strong>`;
        
        if (rulers.length > 0) {
            toastHTML += `<div style="border-top: 1px dashed rgba(73, 220, 225, 0.3); padding-top: 8px; width: 100%; text-align: center;">`;
            let rLines = rulers.map(r => {
                let pKey = Object.keys(A3_STATE.allPlanets).find(k => k.toLowerCase().includes(r.toLowerCase()));
                let pInfo = pKey ? A3_STATE.allPlanets[pKey] : null;
                if (pInfo) {
                    let rDignity = pInfo.dignity && pInfo.dignity !== '-' ? ` | <span style="color:#fff;"></span> ${pInfo.dignity}` : '';
                    return `<strong style="color:#49dce1;">${r}</strong><br><span style="color:#fff;"></span> ${pInfo.dms || pInfo.position || '-'}${rDignity}`;
                }
                return `<strong style="color:#49dce1;">${r}</strong>`;
            });
            toastHTML += rLines.join(`<div style="height: 8px;"></div>`);
            toastHTML += `</div>`;
        }
        const encodedToast = encodeURIComponent(toastHTML).replace(/'/g, "%27");

        let starsHTML = "";
        const angleMap = {1: 'Ascendant', 4: 'Immum Coeli', 7: 'Descendant', 10: 'Midheaven'};
        const angleKey = angleMap[d.house_num];
        
        if (A3_STATE.view !== 'lagna' && angleKey && A3_STATE.data.angles_fs && A3_STATE.data.angles_fs[angleKey]) {
            starsHTML = `<div class="fs-container">`;
            A3_STATE.data.angles_fs[angleKey].forEach(star => {
                const sToast = encodeURIComponent(`<strong style="color:#49dce1;">${star.name}</strong><br><span style="color:#fff;"></span> ${star.position} | <span style="color:#fff;"></span> ${star.orb}°`).replace(/'/g, "%27");
                const safeName = star.name.replace(/"/g, '&quot;'); 
                starsHTML += `<span class="fs-icon fs-${star.tier.toLowerCase()}" data-starname="${safeName}" data-startoast="${sToast}"></span>`;
            });
            starsHTML += `</div>`;
        }

        const duGlow = ELEMENT_MAP[d.duad] || "";
        const doGlow = ELEMENT_MAP[d.dodeca] || "";
        const deGlow = PLANET_GLOW_MAP[d.decan] || "";
        const boGlow = PLANET_GLOW_MAP[d.bound] || "";
        
        let dignitiesHTML = `
            <div class="m-dignities">
                <div class="m-dig-col"><span class="m-dig-lbl">DUAD</span><span class="m-glow-slot ${duGlow}">${d.duad || "-"}</span></div>
                <div class="m-dig-col"><span class="m-dig-lbl">DOD.</span><span class="m-glow-slot ${doGlow}">${d.dodeca || "-"}</span></div>
                <div class="m-dig-col"><span class="m-dig-lbl">DECAN</span><span class="m-glow-slot ${deGlow}">${d.decan || "-"}</span></div>
                <div class="m-dig-col"><span class="m-dig-lbl">BOUND</span><span class="m-glow-slot ${boGlow}">${d.bound || "-"}</span></div>
            </div>`;

        let sabianText = "-";
        const infoColorClass = d.is_anaretic ? 'text-anaretic' : '';
        const metaFlex = starsHTML ? 'style="justify-content: flex-end;"' : 'style="display:none;"';

        const html = `
            <div class="m-figura-card">
                <div class="m-card-header">
                    <span class="m-card-title">${titleName}</span>
                    <span class="m-card-info ${infoColorClass}" onclick="showA3Toast(decodeURIComponent('${encodedToast}'))" style="cursor: pointer; border-bottom: 1px dotted currentColor; padding-bottom: 2px;">${d.dms || "-"}</span>
                </div>
                <div class="m-card-meta" ${metaFlex}>
                    ${starsHTML}
                </div>
                ${dignitiesHTML}
                <div class="m-card-sabian" id="sabian-card-${d.house_num}">${sabianText}</div>
            </div>`;
        
        container.insertAdjacentHTML('beforeend', html);
        renderAsyncSabian(`card-${d.house_num}`, d.sabian_index, lang);
    });
}

function renderA3Table(data) {
    const tableEl = document.querySelector('.m-a10-table');
    const wrapperEl = document.getElementById('m-a3-table-container');
    const thead = document.getElementById('m-a3-thead');
    const tbody = document.getElementById('m-a3-tbody');
    const colgroup = document.getElementById('m-a3-colgroup');
    
    thead.innerHTML = "";
    tbody.innerHTML = "";
    
    const housesArray = Array.isArray(data) ? data : (data.domus || []);

    const renderItems = (items) => {
        if (!items || items.length === 0) return "-";
        return items.map(item => {
            let dmsStr = item.dms || item.position || "-";
            let itemToast = `<strong style="color:#49dce1; font-size:1.1em;">${item.name}</strong><br><span style="color:#fff;"></span> ${dmsStr}`;
            if (item.dignity && item.dignity !== '-') itemToast += ` | <span style="color:#fff;"></span> ${item.dignity}`;
            if (item.is_anaretic) itemToast += `<br><span class="text-anaretic">! ANARETIC !</span>`;
            
            const enc = encodeURIComponent(itemToast).replace(/'/g, "%27");
            const colorClass = item.is_anaretic ? 'text-anaretic' : '';
            return `<span class="${colorClass}" style="cursor:pointer; border-bottom:1px dotted #555;" onclick="showA3Toast(decodeURIComponent('${enc}'))">${item.name}</span>`;
        }).join('<span style="color:#555;">, </span>');
    };

    if (A3_STATE.system === 'sidereal' && A3_STATE.view === 'lagna') {
        colgroup.innerHTML = `<col style="width: 35%;"><col style="width: 65%;">`;
        tableEl.classList.add('m-lagna-table');
        wrapperEl.classList.add('m-lagna-wrapper');
        
        thead.innerHTML = `<tr><th>Lagna</th><th>Information</th></tr>`;
        housesArray.forEach(d => {
            if (!d.lagna_info) return;
            const html = `
                <tr>
                    <td style="color:#fff; font-weight:bold; width: 120px;">${d.lagna_info.label}</td>
                    <td style="color:#49dce1; text-align:center;">${d.lagna_info.position_str || d.lagna_info.dms || "-"}</td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', html);
        });
    } else {
        // 🚀 [수복 2]: Composite 모드일 경우 Hermetic 컬럼 완전 소거
        const isDavison = (A3_STATE.method === 'davison');
        
        if (isDavison) {
            colgroup.innerHTML = `
                <col style="width: 70px;">  
                <col style="width: 150px;"> 
                <col style="width: 100px;">  
                <col style="width: 150px;">  
                <col style="width: 150px;">  
                <col style="width: 150px;">  
            `;
            thead.innerHTML = `<tr><th>House</th><th>Info</th><th>Range</th><th>Planets</th><th>Asteroids</th><th>Hermetic</th></tr>`;
        } else {
            // Composite 모드는 Hermetic 컬럼 제외 (총 5열)
            colgroup.innerHTML = `
                <col style="width: 70px;">  
                <col style="width: 150px;"> 
                <col style="width: 100px;">  
                <col style="width: 150px;">  
                <col style="width: 150px;">  
            `;
            thead.innerHTML = `<tr><th>House</th><th>Info</th><th>Range</th><th>Planets</th><th>Asteroids</th></tr>`;
        }
        
        tableEl.classList.remove('m-lagna-table');
        wrapperEl.classList.remove('m-lagna-wrapper');
        
        housesArray.forEach(d => {
            const ord = (d.house_num%10==1&&d.house_num!=11)?'st':(d.house_num%10==2&&d.house_num!=12)?'nd':(d.house_num%10==3&&d.house_num!=13)?'rd':'th';
            const houseLabel = `${d.house_num}${ord} House`;
            
            const contents = A3_STATE.data.contents ? A3_STATE.data.contents[d.house_num] : {planets:[], asteroids:[], hermetic:[]};
            const infoColorClass = d.is_anaretic ? 'text-anaretic' : '';

            // 🚀 컴포지트면 빈 문자열, 데이비슨이면 해당 데이터 렌더링
            const hermeticTd = isDavison ? `<td class="m-table-cell-content">${renderItems(contents.hermetic)}</td>` : "";

            const html = `
                <tr>
                    <td style="color:#fff; font-weight:bold;">${houseLabel}</td>
                    <td class="${infoColorClass}" style="color:#49dce1;">${d.dms || "-"}</td>
                    <td style="color:#fff;">${d.range_str || "-"}</td>
                    <td class="m-table-cell-content">${renderItems(contents.planets)}</td>
                    <td class="m-table-cell-content">${renderItems(contents.asteroids)}</td>
                    ${hermeticTd}
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', html);
        });
    }
}

function showA3Toast(htmlContent) {
    const toast = document.getElementById('m-a3-toast');
    if (!toast) return;
    toast.innerHTML = `<div style="display: block; width: 100%; text-align: center; line-height: 1.5;">${htmlContent}</div>`;
    toast.classList.remove('m-toast-hidden');
    if (a3ToastTimer) clearTimeout(a3ToastTimer);
    a3ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 4000);
}

window.triggerStar = function(event, starName) {
    const popover = document.getElementById('fs-popover');
    if (!popover) return;
    
    const cleanName = starName.trim();
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
            <div class="fs-title" style="font-size: 1.1rem; font-weight: 900; border-bottom: 1px solid #49dce1; padding-bottom: 8px; margin-bottom: 12px; color: #49dce1; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
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

    popover.onclick = function() { this.style.display = 'none'; this.classList.remove('active'); };
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
            if (!A3_STATE.sabianDefs) A3_STATE.sabianDefs = {};
            A3_STATE.sabianDefs[index] = { [lang]: d.text };
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
    if (!A3_STATE.data) { alert("Manifestation Error: Data not loaded."); throw new Error("No Data"); }

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
        sys_tab: A3_STATE.system, ayanamsa: A3_STATE.ayanamsa,
        h_sys: h_sys, fixed_star_orb: orb,
        view_mode: A3_STATE.view, language: localStorage.getItem('tetramegistus_lang') || 'en',
        method: A3_STATE.method, mode: A3_STATE.mode
    };

    let compilerId = 'a3';
    if (A3_STATE.domus_mode === 'domain') compilerId = 'a3_domain';
    else if (A3_STATE.view === 'lagna') compilerId = 'a3_lagna';

    const payload = { seed_id: seedId, stage: 'albedo', target_name: targetName, metadata: metadata };

    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) return true; 
        else throw new Error("Manifestation Failed");
    } catch (e) {}
};