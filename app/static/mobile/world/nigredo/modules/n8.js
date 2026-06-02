/* static/mobile/world/nigredo/modules/n8.js */

const TROPICAL_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const ELEMENT_CYCLE = ['elem-fire', 'elem-earth', 'elem-air', 'elem-water'];

const AYANAMSAS = [
    { id: 'lahiri', label: 'Lahiri' }, { id: 'raman', label: 'Raman' },
    { id: 'kp', label: 'KP' }, { id: 'fagan-bradley', label: 'Fagan' },
    { id: 'yukteswar', label: 'Yukteswar' }
];

let N8_STATE = {
    ayanamsa: 'lahiri',
    dichotomy: 'traditional',
    lang: localStorage.getItem('tetramegistus_lang') || 'ko',
    sabianSymbols: null,
    codexData: null,
    arabicDefs: null,
    asteroidDefs: null,
    isRendering: false
};

let n8ToastTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
    loadStateFromUrl();
    updateUI();
    bindControls();
    bindGlobalInteractions(); 
    
    generateStaticRows();
    await ensureSession();

    await Promise.all([
        fetchSabianSymbols(),
        fetchArabicDefinitions(),
        fetchAsteroidDefinitions(),
        fetchCodexData()
    ]);
});

// --- [ UI Controls & URL Sync ] ---
window.showToggleTooltip = function(id, leftText, rightText, isLeft) {
    const tooltip = document.getElementById(id);
    if(tooltip) { tooltip.textContent = isLeft ? leftText : rightText; tooltip.style.opacity = '1'; }
};
window.hideToggleTooltip = function(id) {
    const tooltip = document.getElementById(id);
    if(tooltip) tooltip.style.opacity = '0';
};

function loadStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('ayanamsa')) N8_STATE.ayanamsa = params.get('ayanamsa');
    if (params.has('dichotomy')) N8_STATE.dichotomy = params.get('dichotomy');
}

function updateUrl() {
    const url = new URL(window.location);
    url.searchParams.set('module', 'n8');
    url.searchParams.set('ayanamsa', N8_STATE.ayanamsa);
    url.searchParams.set('dichotomy', N8_STATE.dichotomy);
    window.history.pushState({}, '', url);
}

window.switchN8Dichotomy = function() {
    if (N8_STATE.isRendering) return;
    N8_STATE.dichotomy = (N8_STATE.dichotomy === 'traditional') ? 'modern' : 'traditional';
    updateUrl();
    updateUI();
    fetchCodexData();
};

function bindControls() {
    const bar = document.getElementById('n8-ayanamsa-bar');
    if(bar) {
        bar.innerHTML = '';
        AYANAMSAS.forEach(a => {
            const btn = document.createElement('button');
            btn.className = 'm-tab';
            btn.dataset.aya = a.id; 
            if(N8_STATE.ayanamsa === a.id) btn.classList.add('active');
            btn.textContent = a.label;
            btn.onclick = (e) => {
                if (N8_STATE.isRendering) return;
                e.stopPropagation(); 
                N8_STATE.ayanamsa = a.id; 
                updateUrl(); 
                updateUI();
                fetchCodexData();
            };
            bar.appendChild(btn);
        });
    }
}

function updateUI() {
    const knob = document.getElementById('n8-dicho-knob');
    if (N8_STATE.dichotomy === 'traditional') {
        if(knob) knob.style.left = '2px';
        document.getElementById('n8-label-trad').classList.add('active');
        document.getElementById('n8-label-mod').classList.remove('active');
    } else {
        if(knob) knob.style.left = '22px'; 
        document.getElementById('n8-label-trad').classList.remove('active');
        document.getElementById('n8-label-mod').classList.add('active');
    }

    document.querySelectorAll('#n8-ayanamsa-bar .m-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.aya === N8_STATE.ayanamsa);
    });
}

// 로딩 애니메이션 강제 삭제
function showLoader() { }
function hideLoader() { }

// --- [ 🚀 Toast & Popup System (Multi-Feedback) ] ---
function bindGlobalInteractions() {
    document.addEventListener('click', (e) => {
        const cell = e.target.closest('.codex-item');
        if (cell && cell.dataset.item) {
            e.stopPropagation();
            const item = JSON.parse(decodeURIComponent(cell.dataset.item));
            const type = cell.dataset.type;
            triggerItemFeedback(item, type);
        } else {
            const popover = document.getElementById('m-n8-popover');
            if (popover && popover.classList.contains('active')) {
                popover.classList.remove('active');
            }
        }
    });
}

function triggerItemFeedback(item, type) {
    let nameColor = '#06F8FF'; 
    if (type === 'asteroid') nameColor = '#54FF5F';
    if (type === 'lot') nameColor = '#FC09CA';

    let toastHtml = `<div style="font-weight:bold; color:${nameColor}; margin-bottom:4px; font-size:1.1em; text-transform:uppercase;">${item.name}</div>`;
    
    let rawDms = item.dms || "";

    // 1. Lord 추출
    let isDay = /\[Day Lord\]/i.test(rawDms);
    let isHour = /\[Hour Lord\]/i.test(rawDms);
    rawDms = rawDms.replace(/\[Day Lord\]/gi, '').replace(/\[Hour Lord\]/gi, '');

    // 2. 🚀 [핵심 수복]: 별자리 Info 크로스 렌더링 버그 완전 해결 (구분자 대통합 파서)
    let extractedStarInfos = [];
    if (rawDms.includes('★')) {
        // 백엔드가 '|', ':', '★' 중 무엇을 섞어 썼든 전부 '★' 하나로 통일하고 빈칸을 날림
        let tokens = rawDms.replace(/[|:]/g, '★').split('★').map(t => t.trim()).filter(t => t !== '');
        
        // 토큰 구조는 이제 무조건 [행성도수, 별1이름, 별1도수, 별2이름, 별2도수...] 로 평탄화됨
        if (tokens.length > 0) {
            rawDms = tokens[0]; // 1) 첫 번째 덩어리는 찌꺼기 없는 순수 달(행성) 도수
            
            // 2) 나머지는 2개씩(이름-도수) 짝지어서 완벽하게 복원
            for (let i = 1; i < tokens.length; i += 2) {
                let starName = tokens[i];
                let starDms = tokens[i+1] || "";
                extractedStarInfos.push(`★ ${starName} : ${starDms}`);
            }
        }
    }

    // 3. 예쁜 Lord 태그 렌더링
    if (isDay && isHour) toastHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord] [Hour Lord]</strong><br>`;
    else if (isDay) toastHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord]</strong><br>`;
    else if (isHour) toastHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Hour Lord]</strong><br>`;

    // 4. 메인 인포메이션 조립 (행성 DMS | 위계 | 룰러)
    let infoArr = [];
    if (rawDms) infoArr.push(rawDms);
    if (item.dignity && item.dignity !== '-') infoArr.push(item.dignity);
    if (item.ruler && item.ruler !== '-') infoArr.push(`Lord: ${item.ruler}`);
    
    if (infoArr.length > 0) {
        toastHtml += `<div style="color:#ddd; font-size:0.85rem; margin-bottom:6px; margin-top:4px;">${infoArr.join(' | ')}</div>`;
    }

    // 5. 🚀 [수복]: 하단 고정성 리스트에 구출한 별자리 Info 주입
    if (item.fixed_stars && item.fixed_stars.length > 0) {
        toastHtml += `<div style="border-top:1px solid #333; margin-top:6px; padding-top:6px; text-align:center; display:inline-block; width:100%; box-sizing:border-box;">`;
        
        item.fixed_stars.forEach(star => {
            const sName = star.star_name || star.name || "Unknown Star";
            const sOrb = star.orb !== undefined ? star.orb.toFixed(2) : "0.00";
            
            // 엔진이 넘겨준 기본 필드 확인
            let sInfo = star.meaning_ko || star.meaning || star.nature || "";
            
            // 필드가 비어있다면 아까 백업해둔 텍스트에서 현재 별자리 이름을 검색해서 뜯어냄
            if (!sInfo) {
                let found = extractedStarInfos.find(t => t.toLowerCase().includes(sName.toLowerCase()));
                if (found) {
                    // 예: "★ Aldebaran : 부와 명예" -> "부와 명예" 추출
                    let regex = new RegExp(`★?\\s*${sName}[\\s\\-\\:\\(]*`, 'i');
                    let infoPart = found.replace(regex, '').replace(/\)$/, '').trim();
                    if (infoPart) sInfo = infoPart;
                }
            }
            
            // 정보가 존재할 경우 DDS Green 색상으로 감싸서 삽입
            const infoStr = sInfo ? ` | <span style="color:#999999;">${sInfo}</span>` : "";
            
            toastHtml += `<div style="font-size:0.75rem; color:#aaa; margin-bottom:3px; line-height:1.2;">
                <span style="color:#fff; font-weight:bold;">*${sName}</span>${infoStr} | Orb: ${sOrb}°
            </div>`;
        });
        toastHtml += `</div>`;
    }

    showN8Toast(toastHtml);

    // 6. Popover (Lot/Asteroid 의미 해설 팝업 동시 띄우기)
    let meaning = null;
    if (type === 'asteroid' && N8_STATE.asteroidDefs && N8_STATE.asteroidDefs[item.name]) {
        meaning = N8_STATE.asteroidDefs[item.name][N8_STATE.lang] || N8_STATE.asteroidDefs[item.name]['en'];
    } else if (type === 'lot' && N8_STATE.arabicDefs && N8_STATE.arabicDefs[item.name]) {
        meaning = N8_STATE.arabicDefs[item.name].meaning[N8_STATE.lang] || N8_STATE.arabicDefs[item.name].meaning['en'];
    }

    if (meaning) {
        showN8Popup(item.name, meaning);
    }
}

function showN8Toast(html) {
    const toast = document.getElementById('m-n8-toast');
    if (!toast) return;
    toast.innerHTML = html;
    if (toast.classList.contains('m-toast-hidden')) toast.classList.remove('m-toast-hidden');
    if (n8ToastTimer) clearTimeout(n8ToastTimer);
    n8ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 4000);
}

function showN8Popup(title, text) {
    const popover = document.getElementById('m-n8-popover');
    if (!popover) return;
    popover.innerHTML = `
        <div style="font-weight:bold; margin-bottom:10px; color:#7CFF9B; border-bottom:1px solid #7CFF9B; padding-bottom:5px; text-transform:uppercase; text-align:center;">
            ${title}
        </div>
        <div style="line-height:1.5; font-size:0.85rem; color:#ddd; text-align:center;">
            ${text.replace(/\\n/g, '<br>')}
        </div>
    `;
    popover.classList.add('active');
}


// --- [ Data Fetching & Rendering ] ---
async function ensureSession() {
    try {
        let seed = JSON.parse(localStorage.getItem('current_seed')) || JSON.parse(localStorage.getItem('active_seed'));
        if (seed) await fetch('/api/astro/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seed) });
    } catch (e) { }
}

async function fetchSabianSymbols() {
    try {
        const res = await fetch('/api/astro/theory/sabian/definitions'); 
        if(res.ok) { N8_STATE.sabianSymbols = await res.json(); renderSabianSymbols(); }
    } catch (e) { }
}

async function fetchArabicDefinitions() {
    try {
        const res = await fetch('/api/astro/theory/arabic/definitions');
        if(res.ok) N8_STATE.arabicDefs = await res.json();
    } catch(e) { }
}

async function fetchAsteroidDefinitions() {
    try {
        const res = await fetch('/api/astro/theory/asteroids/definitions');
        if(res.ok) N8_STATE.asteroidDefs = await res.json();
    } catch(e) { }
}

function generateStaticRows() {
    const tbody = document.getElementById('n8-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    for (let i = 0; i < 360; i++) {
        const signIdx = Math.floor(i / 30);
        const degree = (i % 30) + 1;
        const elemClass = ELEMENT_CYCLE[signIdx % 4];

        const tr = document.createElement('tr');
        tr.dataset.absDeg = i; 
        if (degree === 30) tr.classList.add('sign-boundary');

        tr.innerHTML = `
            <td class="sticky-col ${elemClass}">${TROPICAL_SIGNS[signIdx]} ${degree}</td>
            <td class="col-minor-asteroids">-</td>
            <td class="col-tropical">-</td>
            <td class="col-sidereal">-</td>
            <td class="col-draconic">-</td>
            <td class="col-ketunic">-</td>
            <td class="col-arabic-lots">-</td>
            <td class="col-sabian-symbol">...</td>
        `;
        tbody.appendChild(tr);
    }
}

function renderSabianSymbols() {
    if (!N8_STATE.sabianSymbols) return;
    for (let i = 0; i < 360; i++) {
        const row = document.querySelector(`tr[data-abs-deg="${i}"] .col-sabian-symbol`);
        if (row && N8_STATE.sabianSymbols[i]) {
            const sym = N8_STATE.sabianSymbols[i];
            row.textContent = sym[N8_STATE.lang] || sym['en'];
        }
    }
}

async function fetchCodexData() {
    N8_STATE.isRendering = true;
    try {
        const hSys = localStorage.getItem('tetramegistus_house') === 'whole' ? 'W' : (localStorage.getItem('tetramegistus_house') === 'koch' ? 'K' : 'P');
        let orbValue = parseFloat(localStorage.getItem('tetramegistus_orb')) || 1.5; 

        const res = await fetch(`/api/astro/codex/reading?ayanamsa=${N8_STATE.ayanamsa}&dichotomy=${N8_STATE.dichotomy}&orb=${orbValue}&h_sys=${hSys}`);
        const json = await res.json();
        
        if (json.grid) {
            N8_STATE.codexData = json.grid;
            handleTimeUnknownUI(json.meta && json.meta.is_time_unknown === 1);
            renderCodexGrid();
        }
    } catch (e) { }
    N8_STATE.isRendering = false;
}

function handleTimeUnknownUI(isUnknown) {
    const displayStyle = isUnknown ? 'none' : 'table-cell';
    document.querySelectorAll('.col-arabic-lots').forEach(td => td.style.display = displayStyle);
    const th = document.getElementById('th-arabic-lots');
    if (th) th.style.display = displayStyle;
}

function renderCodexGrid() {
    if (!N8_STATE.codexData) return;

    N8_STATE.codexData.forEach((row, i) => {
        const tr = document.querySelector(`tr[data-abs-deg="${i}"]`);
        if (!tr) return;

        renderCell(tr.querySelector('.col-minor-asteroids'), row.minor_asteroids, 'asteroid');
        renderCell(tr.querySelector('.col-tropical'), row.tropical, 'planet');
        renderCell(tr.querySelector('.col-sidereal'), row.sidereal, 'planet');
        renderCell(tr.querySelector('.col-draconic'), row.draconic, 'planet');
        renderCell(tr.querySelector('.col-ketunic'), row.ketunic, 'planet');
        renderArabicCell(tr.querySelector('.col-arabic-lots'), row.arabic_lots);

        ['tropical', 'sidereal', 'draconic', 'ketunic'].forEach(sys => {
            const hField = `${sys}_h`;
            const cell = tr.querySelector(`.col-${sys}`);
            cell.className = `col-${sys}`; 
            if (row[hField]) cell.classList.add(`bg-house-${row[hField]}`);
        });

        updateSabianLine(tr.querySelector('.sticky-col'), row);
    });
}

function renderCell(td, items, type) {
    td.innerHTML = ''; 
    if (!items || items.length === 0) { td.innerHTML = '-'; return; }
    
    td.innerHTML = items.map(item => {
        const className = item.css || 'p-minor'; 
        const itemData = encodeURIComponent(JSON.stringify(item));

        return `<div class="codex-item ${className}" data-item="${itemData}" data-type="${type}">
                    ${item.text}<span class="star-marker">${item.html_suffix || ''}</span>
                </div>`;
    }).join('');
}

function renderArabicCell(td, items) {
    td.innerHTML = '';
    if (!items || items.length === 0) { td.innerHTML = '-'; return; }

    td.innerHTML = items.map(item => {
        const def = N8_STATE.arabicDefs ? N8_STATE.arabicDefs[item.name] : null;
        const colorClass = def ? def.category : 'white'; 
        const itemData = encodeURIComponent(JSON.stringify(item));
        
        return `<div class="codex-item lot-item ${colorClass}" data-item="${itemData}" data-type="lot">${item.text}</div>`;
    }).join('');
}

function updateSabianLine(td, row) {
    const oldLine = td.querySelector('.sabian-line-box');
    if(oldLine) oldLine.remove();

    const isWholeHouse = (localStorage.getItem('tetramegistus_house') === 'whole');
    const getValid = (items) => items ? (isWholeHouse ? items.filter(i => !(i.css||'').includes('p-cusp') && !(i.text||'').toLowerCase().includes('cusp')) : items) : [];

    const hasMajor = (getValid(row.tropical).length > 0 || getValid(row.sidereal).length > 0 || getValid(row.draconic).length > 0 || getValid(row.ketunic).length > 0);
    const hasMinor = (getValid(row.minor_asteroids).length > 0 || getValid(row.arabic_lots).length > 0);

    if (!hasMajor && !hasMinor) return;

    const lineBox = document.createElement('div');
    lineBox.className = 'sabian-line-box';
    if (hasMajor) lineBox.innerHTML += `<div class="s-line-thick"></div>`;
    if (hasMinor) lineBox.innerHTML += `<div class="s-line-thin"></div>`;
    td.appendChild(lineBox);
}

/* ─────────────────────────────────────────────────────────────
   X. GRIMOIRE MANIFESTATION (N8 Codex Tenebris -> Archive)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    const activeSeed = JSON.parse(localStorage.getItem('active_seed'));
    if (!activeSeed) {
        showN8Toast('<div style="color:#FF4444; font-weight:bold;">SYSTEM ERROR</div><div>No active seed found.</div>');
        return false;
    }

    const targetName = activeSeed.name || "Unknown_Seed";
    const seedId = activeSeed.id || activeSeed.idx || "unknown";
    const currentLang = localStorage.getItem('tetramegistus_lang') || 'ko';
    const params = new URLSearchParams(window.location.search);
    const hSys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    const arabicRuler = localStorage.getItem('tetramegistus_arabic_ruler') || 'traditional'; 
    const compilerId = `n8_${currentLang}`;

    const payload = {
        seed_id: seedId,        
        stage: 'Nigredo',       
        target_name: targetName,
        language: currentLang,
        metadata: {
            ayanamsa: N8_STATE.ayanamsa,
            h_sys: hSys,
            arabic_ruler: arabicRuler
        },
        seed: activeSeed 
    };

    try {
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        
        if (res.ok) {
            const saveBtn = document.querySelector('.btn-save-grimoire');
            if (saveBtn) {
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '✔ Archived';
                saveBtn.classList.add('success');
                setTimeout(() => {
                    saveBtn.innerHTML = originalText;
                    saveBtn.classList.remove('success');
                }, 3000);
            } else {
                showN8Toast('<div style="color:#7CFF9B; font-weight:bold;">GRIMOIRE</div><div>Archive Saved Successfully!</div>');
            }
            return true; 
        } else {
            showN8Toast(`<div style="color:#FF4444; font-weight:bold;">MANIFESTATION FAILED</div><div>${result.detail || result.error}</div>`);
            throw new Error(result.detail || result.error); 
        }
    } catch (e) {
        showN8Toast('<div style="color:#FF4444; font-weight:bold;">NETWORK ERROR</div><div>Error occurred during Grimoire Save.</div>');
        throw e;
    }
};