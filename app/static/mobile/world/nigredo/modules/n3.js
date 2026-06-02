/* static/mobile/world/nigredo/modules/n3.js - Mobile N3 Engine (DOMUS) */

const N3_STATE = {
    system: 'tropical',
    ayanamsa: 'lahiri',
    mode: 'cusp',    
    view: 'zodiac',  
    data: {},
    sabianDefs: null
};

const PLANET_GLOW_MAP = { "♄": "glow-saturn", "♃": "glow-jupiter", "♂": "glow-mars", "☉": "glow-sun", "♀": "glow-venus", "☿": "glow-mercury", "☽": "glow-moon", "☋": "glow-ketu", "☊": "glow-rahu" };
const ELEMENT_MAP = { "♈︎": "glow-fire", "♌︎": "glow-fire", "♐︎": "glow-fire", "♉︎": "glow-earth", "♍︎": "glow-earth", "♑︎": "glow-earth", "♊︎": "glow-air", "♎︎": "glow-air", "♒︎": "glow-air", "♋︎": "glow-water", "♏︎": "glow-water", "♓︎": "glow-water" };

let FS_MEANINGS = {};
let n3ToastTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
    loadN3StateFromUrl();
    await ensureDataIntegrity();
    await loadFixedStarMeanings();
    
    updateN3UIState();
    await fetchAndRenderN3();

    document.addEventListener('click', (e) => {
        const starIcon = e.target.closest('.fs-icon');
        if (starIcon) {
            e.stopPropagation();
            const sName = starIcon.dataset.starname;
            const sToast = starIcon.dataset.startoast;
            if (sToast) showN3Toast(decodeURIComponent(sToast));
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

function loadN3StateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('system')) N3_STATE.system = params.get('system');
    if (params.has('ayanamsa')) N3_STATE.ayanamsa = params.get('ayanamsa');
    if (params.has('mode')) N3_STATE.mode = params.get('mode');
    if (params.has('view')) N3_STATE.view = params.get('view');
}

function updateN3UIState() {
    document.getElementById('mode-knob').classList.toggle('right', N3_STATE.mode === 'domain');
    document.getElementById('label-mode-cusp').classList.toggle('active', N3_STATE.mode === 'cusp');
    document.getElementById('label-mode-domain').classList.toggle('active', N3_STATE.mode === 'domain');

    document.querySelectorAll('.m-connected-tabs > .m-tab[data-sys]').forEach(btn => btn.classList.toggle('active', btn.dataset.sys === N3_STATE.system));
    
    const sVault = document.getElementById('m-sidereal-vault');
    const viewToggle = document.getElementById('m-view-toggle');
    
    if (N3_STATE.system === 'sidereal') {
        sVault.classList.remove('m-hidden');
        document.querySelectorAll('.m-ayan-tabs .m-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.ayan === N3_STATE.ayanamsa));
        
        if (N3_STATE.mode === 'cusp') {
            viewToggle.style.display = 'flex';
            document.getElementById('view-knob').classList.toggle('right', N3_STATE.view === 'lagna');
            document.getElementById('label-view-zod').classList.toggle('active', N3_STATE.view === 'zodiac');
            document.getElementById('label-view-lagna').classList.toggle('active', N3_STATE.view === 'lagna');
        } else {
            viewToggle.style.display = 'none';
        }
    } else {
        sVault.classList.add('m-hidden');
        viewToggle.style.display = 'none';
    }

    const isTableMode = (N3_STATE.mode === 'domain' || (N3_STATE.system === 'sidereal' && N3_STATE.view === 'lagna'));
    document.getElementById('m-n3-cards-container').style.display = isTableMode ? 'none' : 'flex';
    document.getElementById('m-n3-table-container').style.display = isTableMode ? 'block' : 'none';
}

window.switchN3Mode = function() { 
    const u = new URL(window.location.href); 
    const nextMode = N3_STATE.mode === 'cusp' ? 'domain' : 'cusp';
    u.searchParams.set('mode', nextMode);
    if (nextMode === 'domain') {
        u.searchParams.set('view', 'zodiac');
    }
    window.location.href = u.toString(); 
};
window.switchN3View = function() { 
    const u = new URL(window.location.href); 
    u.searchParams.set('view', N3_STATE.view === 'zodiac' ? 'lagna' : 'zodiac');
    window.location.href = u.toString(); 
};
window.switchN3System = function(sys) { 
    const u = new URL(window.location.href); 
    u.searchParams.set('system', sys); 
    if (sys !== 'sidereal') { 
        u.searchParams.delete('ayanamsa'); 
        u.searchParams.delete('view'); 
    } 
    window.location.href = u.toString(); 
};
window.switchN3Ayanamsa = function(ayan) { const u = new URL(window.location.href); u.searchParams.set('ayanamsa', ayan); window.location.href = u.toString(); };

async function fetchAndRenderN3() {
    let h_sys = window.WorldSettings ? window.WorldSettings.getHouseCode() : (localStorage.getItem('tetramegistus_house') || 'P');
    let orbValue = parseFloat(localStorage.getItem('tetramegistus_orb')) || 1.5;
    
    let url = `/api/astro/domus/resting?system=${N3_STATE.system}&ayanamsa=${N3_STATE.ayanamsa}&mode=${N3_STATE.mode}&view=${N3_STATE.view}&h_sys=${h_sys}&fixed_star_orb=${orbValue}`;

    try {
        let response = await fetch(url);
        if (!response.ok) {
            url = `/api/astro/domus/reading?system=${N3_STATE.system}&ayanamsa=${N3_STATE.ayanamsa}&mode=${N3_STATE.mode}&view=${N3_STATE.view}&h_sys=${h_sys}&fixed_star_orb=${orbValue}`;
            response = await fetch(url);
        }
        
        if (!response.ok) return;

        const resData = await response.json();
        N3_STATE.data = resData;

        if (resData.planets) {
            const ascKey = Object.keys(resData.planets).find(k => k.toLowerCase().includes('ascendant'));
            const mcKey = Object.keys(resData.planets).find(k => k.toLowerCase().includes('midheaven'));
            if (ascKey) document.getElementById('val-asc').textContent = resData.planets[ascKey].dms || "-";
            if (mcKey) document.getElementById('val-mc').textContent = resData.planets[mcKey].dms || "-";
        } else if (resData.meta) {
            document.getElementById('val-asc').textContent = resData.meta.asc || "-";
            document.getElementById('val-mc').textContent = resData.meta.mc || "-";
        }

        if (typeof renderDomusChart === 'function') {
            renderDomusChart(resData);
        } else if (typeof drawChart === 'function') {
            drawChart(resData);
        }

        const housesData = resData.houses || resData.data || resData.domus;
        if (!housesData) return;

        const isTableMode = (N3_STATE.mode === 'domain' || (N3_STATE.system === 'sidereal' && N3_STATE.view === 'lagna'));
        if (isTableMode) {
            renderN3Table(housesData);
        } else {
            renderN3Cards(housesData);
        }

    } catch (e) { console.error("[N3] Render Error:", e); }
}

function renderN3Cards(data) {
    const container = document.getElementById('m-n3-cards-container');
    container.innerHTML = "";
    
    const housesArray = Array.isArray(data) ? data : (data.domus || []);
    if (!housesArray.length) return;

    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    housesArray.forEach(d => {
        let titleName = d.label || `House ${d.house_num}`;
        if (N3_STATE.system === 'sidereal' && N3_STATE.view === 'lagna' && d.lagna_info) {
            titleName = d.lagna_info.label;
        }

        let rulers = Array.isArray(d.ruler) ? d.ruler : (d.ruler ? d.ruler.split(',').map(r => r.trim()) : []);
        let toastHTML = `<strong style="color:#7CFF9B; font-size:1.1em; margin-bottom: 5px; display: inline-block;">${titleName}</strong>`;
        
        if (rulers.length > 0) {
            toastHTML += `<div style="border-top: 1px dashed rgba(124, 255, 155, 0.3); padding-top: 8px; width: 100%; text-align: center;">`;
            let rLines = rulers.map(r => {
                let pKey = N3_STATE.data.planets ? Object.keys(N3_STATE.data.planets).find(k => k.toLowerCase().includes(r.toLowerCase())) : null;
                let pInfo = pKey ? N3_STATE.data.planets[pKey] : null;
                if (pInfo) {
                    let rDignity = pInfo.dignity && pInfo.dignity !== '-' ? ` | <span style="color:#fff;"></span> ${pInfo.dignity}` : '';
                    return `<strong style="color:#7CFF9B;">${r}</strong><br><span style="color:#fff;"></span> ${pInfo.dms || '-'}${rDignity}`;
                }
                return `<strong style="color:#7CFF9B;">${r}</strong>`;
            });
            toastHTML += rLines.join(`<div style="height: 8px;"></div>`);
            toastHTML += `</div>`;
        }
        const encodedToast = encodeURIComponent(toastHTML).replace(/'/g, "%27");

        let starsHTML = "";
        const angleMap = {1: 'Ascendant', 4: 'Immum Coeli', 7: 'Descendant', 10: 'Midheaven'};
        const angleKey = angleMap[d.house_num];
        
        if (N3_STATE.view !== 'lagna' && angleKey && N3_STATE.data.angles_fs && N3_STATE.data.angles_fs[angleKey]) {
            starsHTML = `<div class="fs-container">`;
            N3_STATE.data.angles_fs[angleKey].forEach(star => {
                const sToast = encodeURIComponent(`<strong style="color:#7CFF9B;">${star.name}</strong><br><span style="color:#fff;"></span> ${star.position} | <span style="color:#fff;"></span> ${star.orb}°`).replace(/'/g, "%27");
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
                    <span class="m-card-info ${infoColorClass}" onclick="showN3Toast(decodeURIComponent('${encodedToast}'))" style="cursor: pointer; border-bottom: 1px dotted currentColor; padding-bottom: 2px;">${d.dms || "-"}</span>
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

function renderN3Table(data) {
    const tableEl = document.querySelector('.m-a10-table');
    const wrapperEl = document.getElementById('m-n3-table-container');
    const thead = document.getElementById('m-n3-thead');
    const tbody = document.getElementById('m-n3-tbody');
    const colgroup = document.getElementById('m-n3-colgroup');
    
    thead.innerHTML = "";
    tbody.innerHTML = "";
    
    const housesArray = Array.isArray(data) ? data : (data.domus || []);

    const renderItems = (items) => {
        if (!items || items.length === 0) return "-";
        return items.map(item => {
            let dmsStr = item.dms || item.position || "-";
            let itemToast = `<strong style="color:#7CFF9B; font-size:1.1em;">${item.name}</strong><br><span style="color:#fff;"></span> ${dmsStr}`;
            if (item.dignity && item.dignity !== '-') itemToast += ` | <span style="color:#fff;"></span> ${item.dignity}`;
            if (item.is_anaretic) itemToast += `<br><span class="text-anaretic">! ANARETIC !</span>`;
            
            const enc = encodeURIComponent(itemToast).replace(/'/g, "%27");
            const colorClass = item.is_anaretic ? 'text-anaretic' : '';
            return `<span class="${colorClass}" style="cursor:pointer; border-bottom:1px dotted #555;" onclick="showN3Toast(decodeURIComponent('${enc}'))">${item.name}</span>`;
        }).join('<span style="color:#555;">, </span>');
    };

    if (N3_STATE.system === 'sidereal' && N3_STATE.view === 'lagna') {
        colgroup.innerHTML = `<col style="width: 35%;"><col style="width: 65%;">`;
        tableEl.classList.add('m-lagna-table');
        wrapperEl.classList.add('m-lagna-wrapper');
        
        thead.innerHTML = `<tr><th>Lagna</th><th>Information</th></tr>`;
        housesArray.forEach(d => {
            if (!d.lagna_info) return;
            const html = `
                <tr>
                    <td style="color:#fff; font-weight:bold;">${d.lagna_info.label}</td>
                    <td style="color:#7CFF9B; text-align:center;">${d.lagna_info.position_str || d.lagna_info.dms || "-"}</td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', html);
        });
    } else {
        colgroup.innerHTML = `
            <col style="width: 70px;">  
            <col style="width: 150px;"> 
            <col style="width: 100px;">  
            <col style="width: 150px;">  
            <col style="width: 150px;">  
            <col style="width: 150px;">  
        `;
        tableEl.classList.remove('m-lagna-table');
        wrapperEl.classList.remove('m-lagna-wrapper');

        thead.innerHTML = `<tr><th>House</th><th>Info</th><th>Range</th><th>Planets</th><th>Asteroids</th><th>Hermetic</th></tr>`;
        
        housesArray.forEach(d => {
            const ord = (d.house_num%10==1&&d.house_num!=11)?'st':(d.house_num%10==2&&d.house_num!=12)?'nd':(d.house_num%10==3&&d.house_num!=13)?'rd':'th';
            const houseLabel = `${d.house_num}${ord} House`;
            
            const contents = N3_STATE.data.contents ? N3_STATE.data.contents[d.house_num] : {planets:[], asteroids:[], hermetic:[]};
            const infoColorClass = d.is_anaretic ? 'text-anaretic' : '';

            const html = `
                <tr>
                    <td style="color:#fff; font-weight:bold;">${houseLabel}</td>
                    <td class="${infoColorClass}" style="color:#7CFF9B;">${d.dms || "-"}</td>
                    <td style="color:#fff;">${d.range_str || "-"}</td>
                    <td class="m-table-cell-content">${renderItems(contents.planets)}</td>
                    <td class="m-table-cell-content">${renderItems(contents.asteroids)}</td>
                    <td class="m-table-cell-content">${renderItems(contents.hermetic)}</td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', html);
        });
    }
}

function showN3Toast(htmlContent) {
    const toast = document.getElementById('m-n3-toast');
    if (!toast) return;
    
    // 🚀 [수복]: CSS flex 속성이 줄바꿈을 일으키지 못하게 div 블록으로 완전히 묶어버림
    toast.innerHTML = `<div style="display: block; width: 100%; text-align: center; line-height: 1.5;">${htmlContent}</div>`;
    
    toast.classList.remove('m-toast-hidden');
    if (n3ToastTimer) clearTimeout(n3ToastTimer);
    n3ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 4000);
}

window.triggerStar = function(event, starName) {
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
            <div class="fs-title" style="font-size: 1.1rem; font-weight: 900; border-bottom: 1px solid #7CFF9B; padding-bottom: 8px; margin-bottom: 12px; color: #7CFF9B; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
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
            if (!N3_STATE.sabianDefs) N3_STATE.sabianDefs = {};
            N3_STATE.sabianDefs[index] = { [lang]: d.text };
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

window.saveToGrimoire = async function() {
    if (!N3_STATE.data) { alert("Manifestation Error: Data not loaded."); throw new Error("No Data"); }

    const activeSeed = JSON.parse(localStorage.getItem('active_seed'));
    const targetName = activeSeed ? activeSeed.name : "Unknown_Seed";
    const seedId = activeSeed ? activeSeed.id : "unknown"; 

    let h_sys = window.WorldSettings ? window.WorldSettings.getHouseCode() : (localStorage.getItem('tetramegistus_house') || 'P');
    let orb = localStorage.getItem('tetramegistus_orb') || '1.0';

    const metadata = {
        sys_tab: N3_STATE.system, ayanamsa: N3_STATE.ayanamsa,
        h_sys: h_sys, fixed_star_orb: orb,
        view_mode: N3_STATE.view, language: localStorage.getItem('tetramegistus_lang') || 'en'
    };

    let compilerId = 'n3';
    if (N3_STATE.mode === 'domain') compilerId = 'n3_domain';
    else if (N3_STATE.view === 'lagna') compilerId = 'n3_lagna';

    const payload = { seed_id: seedId, stage: 'nigredo', target_name: targetName, metadata: metadata, seed: activeSeed };

    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) return true; 
        else throw new Error("Manifestation Failed");
    } catch (e) {}
};