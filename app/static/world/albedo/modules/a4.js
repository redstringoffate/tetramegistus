/* static/world/albedo/modules/a4.js — v3.0 Final: Persistence & Connection */

// Glow Maps
const ELEMENT_MAP_A4 = {
    "♈︎": "glow-fire", "♌︎": "glow-fire", "♐︎": "glow-fire",
    "♉︎": "glow-earth", "♍︎": "glow-earth", "♑︎": "glow-earth",
    "♊︎": "glow-air", "♎︎": "glow-air", "♒︎": "glow-air",
    "♋︎": "glow-water", "♏︎": "glow-water", "♓︎": "glow-water"
};

const PLANET_GLOW_MAP_A4 = {
    "♄": "glow-saturn", "♃": "glow-jupiter", "♂": "glow-mars",
    "☉": "glow-sun", "♀": "glow-venus", "☿": "glow-mercury", "☽": "glow-moon"
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log("[FIGURA] Initializing A4 Module...");

    // 🚀 [핵심 추가]: 데이터 증발 방지 (세션 복구)
    await ensureDataIntegrity();

    // UI 초기화
    const params = new URLSearchParams(window.location.search);
    const schema = params.get('lot_schema') || 'paulus'; 
    
    document.querySelectorAll('.sys-tab').forEach(btn => {
        if (btn.dataset.schema === schema) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    // 렌더링 시작
    await fetchAndRenderFigura();
});

/**
 * 🛠️ [Persistence]: 로컬 데이터를 서버 메모리에 동기화
 */
async function ensureDataIntegrity() {
    let localData = null;
    try { 
        localData = JSON.parse(localStorage.getItem('active_davison')); 
    } catch (e) {}

    // 데이터가 있으면 서버로 전송 (세션 예열)
    if (localData && localData.seed1 && localData.seed2) {
        try {
            await fetch('/api/astro/coagulatio/sync-active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localData)
            });
            console.log("[FIGURA] Data Synced to Station.");
        } catch (e) {
            console.error("[FIGURA] Sync Failed:", e);
        }
    } else {
        console.warn("[FIGURA] No local data found. Redirect recommended.");
    }
}

async function fetchAndRenderFigura() {
    const params = new URLSearchParams(window.location.search);
    const schema = params.get('lot_schema') || 'paulus';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    
    // 하우스 시스템 결정
    let h_sys = params.get('h_sys');
    if (!h_sys) {
        if (window.WorldSettings && window.WorldSettings.getHouseCode) h_sys = window.WorldSettings.getHouseCode();
        else {
            const savedHouse = localStorage.getItem('tetramegistus_house');
            const houseMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
            h_sys = houseMap[savedHouse] || 'P';
        }
    }

    try {
        // 🚀 [연결]: 신설된 라우터 호출
        const res = await fetch(`/api/astro/figura/reading?lot_schema=${schema}&h_sys=${h_sys}`);
        
        if (!res.ok) return; 
        const data = await res.json();

        if (data.error) {
            console.error("[FIGURA] Server Error:", data.error);
            // 데이터가 없으면 UI에 표시하거나 재시도 유도 가능
            return;
        }

        // 1. Sect Update
        const sectEl = document.getElementById('sect-val');
        if(sectEl && data.meta) sectEl.textContent = `${data.meta.sect}`;

        // 2. Data Rendering
        updateTable('lots-body', data.lots, lang);
        updateTable('vertex-body', data.vertex, lang);

        const syzRow = document.querySelector('#syzygy-body tr[data-key="Syzygy"]');
        if (syzRow && data.syzygy) {
            syzRow.cells[0].textContent = data.syzygy.name || "Syzygy"; 
            await fillRowCells(syzRow, data.syzygy.data, lang);
        }

    } catch (e) {
        console.error("[FIGURA] Render Error:", e);
    }
}

async function updateTable(tbodyId, dataObj, lang) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody || !dataObj) return;

    for (const [key, info] of Object.entries(dataObj)) {
        const row = tbody.querySelector(`tr[data-key="${key}"]`);
        if (row) {
            await fillRowCells(row, info, lang);
        }
    }
}

async function fillRowCells(row, info, lang) {
    if (!info) return;

    // 1. Position
    const infoCell = row.cells[1];
    if (infoCell) {
        infoCell.textContent = info.dms || "-";
        infoCell.style.color = "#49dce1";
    }

    // 2. House
    const houseCell = row.cells[2];
    if (houseCell) {
        houseCell.textContent = info.house || "-";
        houseCell.style.color = "#fff";
    }

    // 3. Codes
    if (row.cells[3]) applyGlow(row.cells[3], info.duad, ELEMENT_MAP_A4);
    if (row.cells[4]) applyGlow(row.cells[4], info.dodeca, ELEMENT_MAP_A4);
    if (row.cells[5]) applyGlow(row.cells[5], info.decan, PLANET_GLOW_MAP_A4);
    if (row.cells[6]) applyGlow(row.cells[6], info.bound, PLANET_GLOW_MAP_A4);

    // 4. Sabian
    const sabianCell = row.cells[7];
    if (sabianCell) {
        if (info.sabian_index !== undefined || info.sabian !== undefined) {
            const idx = info.sabian_index !== undefined ? info.sabian_index : info.sabian;
            try {
                const sRes = await fetch(`/api/theory/sabian/render/${idx}?lang=${lang}`);
                if (sRes.ok) {
                    const sData = await sRes.json();
                    sabianCell.textContent = sData.text;
                    sabianCell.title = sData.text;
                }
            } catch(e) { sabianCell.textContent = "-"; }
        } else {
            sabianCell.textContent = "-";
        }
    }
}

function applyGlow(cell, symbol, map) {
    if (!cell) return;
    cell.textContent = symbol || "-";
    
    // Reset classes
    cell.className = cell.className.replace(/\bglow-\w+\b/g, "").trim();
    
    // Force Center Alignment (N2 Style)
    cell.classList.add("cell-center"); 

    if (!symbol || symbol === "-") return;
    
    const key = symbol.trim();
    if (map[key]) {
        cell.classList.add(map[key]);
    }
}

// Global Switcher
window.switchLotSchema = function(schema) {
    const url = new URL(window.location.href);
    url.searchParams.set('lot_schema', schema);
    window.location.href = url.toString();
};

/* ─────────────────────────────────────────────────────────────
   4. GRIMOIRE MANIFESTATION (A4 -> Archive)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    const params = new URLSearchParams(window.location.search);
    const sys = params.get('system') || 'tropical';
    const ayan = params.get('ayanamsa') || 'lahiri';
    
    // 🚀 A4 핵심: URL에서 lot_schema (paulus/valens) 획득
    const schema = params.get('lot_schema') || 'paulus'; 

    let h_sys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    // 로컬스토리지에서 현재 활성화된 시드 정보 가져오기 (A3/A2 벤치마킹)
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

    // 🚀 쓸데없는 사족 제거! A3 및 N4 최종버전과 완벽하게 동일하게 원본 시드 이름만 타겟으로 지정
    const targetName = (s1Name && s2Name) ? `${s1Name} & ${s2Name}` : "Unknown Coniunctio";

    const compilerId = 'a4';

    const payload = {
        seed_id: seedId,
        stage: 'Albedo', // 🚀 대소문자 고정 (새로운 소문자 폴더 파지는 현상 방지)
        target_name: targetName,
        language: lang,
        metadata: {
            sys_tab: sys,
            ayanamsa: ayan,
            h_sys: h_sys,
            lot_schema: schema
        }
    };

    try {
        console.log(`[GRIMOIRE] Manifesting A4 Archive using [ ${compilerId} ]...`, payload);
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();

        if (res.ok) {
            console.log(`[GRIMOIRE] Archive [${targetName}] Saved Successfully!`);
            return true; // 성공 시 UI 버튼 스피너 등을 제어할 수 있도록 true 반환
        } else {
            alert(`Manifestation Failed: ${result.detail || result.error || 'Unknown Error'}`);
            throw new Error(result.detail || result.error);
        }
    } catch (e) {
        console.error("[GRIMOIRE] Manifestation Error:", e);
        alert("Network Error during Grimoire Save.");
        throw e;
    }
};