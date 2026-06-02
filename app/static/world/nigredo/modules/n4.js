/* static/world/nigredo/modules/n4.js — v2.0 Static Bind */

// Glow Maps (N2 Same Logic)
const ELEMENT_MAP_N4 = {
    "♈︎": "glow-fire", "♌︎": "glow-fire", "♐︎": "glow-fire",
    "♉︎": "glow-earth", "♍︎": "glow-earth", "♑︎": "glow-earth",
    "♊︎": "glow-air", "♎︎": "glow-air", "♒︎": "glow-air",
    "♋︎": "glow-water", "♏︎": "glow-water", "♓︎": "glow-water"
};

const PLANET_GLOW_MAP_N4 = {
    "♄": "glow-saturn", "♃": "glow-jupiter", "♂": "glow-mars",
    "☉": "glow-sun", "♀": "glow-venus", "☿": "glow-mercury", "☽": "glow-moon"
};

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    // 🔑 [수정]: 디폴트 스키마를 Paulus로 변경
    const schema = params.get('lot_schema') || 'paulus'; 
    
    document.querySelectorAll('.sys-tab').forEach(btn => {
        if (btn.dataset.schema === schema) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    await fetchAndRenderArcana();
});

async function fetchAndRenderArcana() {
    const params = new URLSearchParams(window.location.search);
    const schema = params.get('lot_schema') || 'paulus';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';
    
    // 🔑 [수복]: 하우스 시스템 결정 로직 강화 (URL 우선 -> 없으면 LocalStorage 직접 조회)
    let h_sys = params.get('h_sys');

    if (!h_sys) {
        // world.js 로딩을 기다리지 않고 직접 저장소 확인
        const savedHouse = localStorage.getItem('tetramegistus_house'); // 'placidus', 'whole', 'koch'
        const houseMap = {
            'placidus': 'P',
            'whole': 'W',
            'koch': 'K'
        };
        // 저장된 값이 있으면 매핑하고, 없으면 기본값 'P'
        h_sys = houseMap[savedHouse] || 'P';
    }

    try {
        // API 요청에 h_sys를 확실하게 포함
        const res = await fetch(`/api/astro/arcana/reading?lot_schema=${schema}&h_sys=${h_sys}`);
        
        if (!res.ok) return; 
        const data = await res.json();

        if (data.error) {
            console.error("[ARCANA] Server Error:", data.error);
            return;
        }

        // 1. Sect Update
        const sectEl = document.getElementById('sect-val');
        if(sectEl) sectEl.textContent = `${data.meta.sect}`;

        // 2. Data Rendering
        updateTable('lots-body', data.lots, lang);
        updateTable('vertex-body', data.vertex, lang);

        const syzRow = document.querySelector('#syzygy-body tr[data-key="Syzygy"]');
        if (syzRow && data.syzygy) {
            syzRow.cells[0].textContent = data.syzygy.name || "Syzygy"; 
            await fillRowCells(syzRow, data.syzygy.data, lang);
        }

    } catch (e) {
        console.error("[ARCANA] Render Error:", e);
    }
}
// 🔑 공통 테이블 업데이트 함수 (HTML에 박혀있는 tr을 찾아서 채움)
async function updateTable(tbodyId, dataObj, lang) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    for (const [key, info] of Object.entries(dataObj)) {
        // data-key 속성으로 해당 행 찾기
        const row = tbody.querySelector(`tr[data-key="${key}"]`);
        if (row) {
            await fillRowCells(row, info, lang);
        }
    }
}

// 🔑 셀 채우기 로직 (N2 스타일 적용)
async function fillRowCells(row, info, lang) {
    // Cells: 0:Name, 1:Info, 2:House, 3:Duad, 4:Dod, 5:Decan, 6:Bd, 7:Sabian
    
    // 1. Info (Position)
    const infoCell = row.cells[1];
    infoCell.textContent = info.dms;
    infoCell.style.color = "#49dce1"; // Cyan Highlight

    // 2. House
    const houseCell = row.cells[2];
    houseCell.textContent = info.house;
    houseCell.style.color = "#fff";

    // 3. Codes (Glow Effects)
    applyGlow(row.cells[3], info.duad, ELEMENT_MAP_N4);
    applyGlow(row.cells[4], info.dodeca, ELEMENT_MAP_N4);
    applyGlow(row.cells[5], info.decan, PLANET_GLOW_MAP_N4);
    applyGlow(row.cells[6], info.bound, PLANET_GLOW_MAP_N4);

    // 4. Sabian Symbol
    const sabianCell = row.cells[7];
    if (info.sabian !== undefined) {
        try {
            const sRes = await fetch(`/api/theory/sabian/render/${info.sabian}?lang=${lang}`);
            if (sRes.ok) {
                const sData = await sRes.json();
                sabianCell.textContent = sData.text;
                sabianCell.title = sData.text;
            }
        } catch(e) { sabianCell.textContent = "-"; }
    }
}

function applyGlow(cell, symbol, map) {
    if (!cell) return;
    cell.textContent = symbol || "-";
    cell.className = cell.className.replace(/\bglow-\w+\b/g, "").trim(); // Reset glows
    if (!symbol || symbol === "-") return;
    
    const key = symbol.trim();
    // N2와 동일하게 클래스 추가
    cell.classList.add("cell-center"); // 중앙 정렬 보장
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
   4. GRIMOIRE MANIFESTATION (N4 -> Archive)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    const params = new URLSearchParams(window.location.search);
    const sys = params.get('system') || 'tropical';
    const ayan = params.get('ayanamsa') || 'lahiri';
    const schema = params.get('lot_schema') || 'paulus'; 

    let h_sys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    // 🚀 [완벽 수복]: idx가 아닌 고유 식별자 'id'를 최우선으로 가져오도록 우선순위 역전!
    const activeSeed = JSON.parse(localStorage.getItem('active_seed')) || {};
    const seedId = activeSeed.id || activeSeed.idx || "unknown"; 
    const targetName = activeSeed.name || "Unknown";

    const compilerId = 'n4';

    const payload = {
        seed_id: seedId,
        stage: 'Nigredo', // 🚀 대소문자 고정 유지
        target_name: targetName,
        language: lang,
        metadata: {
            sys_tab: sys,
            ayanamsa: ayan,
            h_sys: h_sys,
            lot_schema: schema
        },
        seed: activeSeed 
    };

    try {
        console.log(`[GRIMOIRE] Manifesting N4 Archive using [ ${compilerId} ]...`, payload);
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
            alert(`Manifestation Failed: ${result.detail || result.error || 'Unknown Error'}`);
            throw new Error(result.detail || result.error);
        }
    } catch (e) {
        console.error("[GRIMOIRE] Manifestation Error:", e);
        alert("Network Error during Grimoire Save.");
        throw e;
    }
};