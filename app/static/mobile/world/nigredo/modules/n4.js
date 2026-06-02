/* static/mobile/world/nigredo/modules/n4.js - Mobile Card Architecture */

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

const MobileN4 = {
    async init() {
        const params = new URLSearchParams(window.location.search);
        const schema = params.get('lot_schema') || 'paulus'; 
        
        // 상단 시스템 탭 활성화 처리
        document.querySelectorAll('.m-sys-tab').forEach(btn => {
            if (btn.dataset.schema === schema) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        await this.fetchAndRenderArcana(schema);
    },

    async fetchAndRenderArcana(schema) {
        const params = new URLSearchParams(window.location.search);
        const lang = localStorage.getItem('tetramegistus_lang') || 'en';
        
        let h_sys = params.get('h_sys');
        if (!h_sys) {
            const savedHouse = localStorage.getItem('tetramegistus_house'); 
            const houseMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
            h_sys = houseMap[savedHouse] || 'P';
        }

        try {
            const res = await fetch(`/api/astro/arcana/reading?lot_schema=${schema}&h_sys=${h_sys}`);
            if (!res.ok) return; 
            const data = await res.json();
            if (data.error) return;

            // 1. Sect Update
            const sectEl = document.getElementById('m-sect-val');
            if(sectEl) sectEl.textContent = `${data.meta.sect}`;

            // 2. Data Rendering (Card UI)
            await this.updateCards(data.lots, lang);
            await this.updateCards(data.vertex, lang);

            if (data.syzygy) {
                const syzCard = document.querySelector('.m-arcana-card[data-key="Syzygy"]');
                if (syzCard) {
                    syzCard.querySelector('.m-card-title').textContent = data.syzygy.name || "Syzygy"; 
                    await this.fillCardCells(syzCard, data.syzygy.data, lang);
                }
            }

        } catch (e) {
            console.error("[ARCANA] Mobile Render Error:", e);
        }
    },

    async updateCards(dataObj, lang) {
        for (const [key, info] of Object.entries(dataObj)) {
            const card = document.querySelector(`.m-arcana-card[data-key="${key}"]`);
            if (card) {
                await this.fillCardCells(card, info, lang);
            }
        }
    },

    async fillCardCells(card, info, lang) {
        card.querySelector('.m-card-info').textContent = info.dms;
        card.querySelector('.m-card-house').textContent = info.house;

        this.applyGlow(card.querySelector('.m-duad'), info.duad, ELEMENT_MAP_N4);
        this.applyGlow(card.querySelector('.m-dod'), info.dodeca, ELEMENT_MAP_N4);
        this.applyGlow(card.querySelector('.m-decan'), info.decan, PLANET_GLOW_MAP_N4);
        this.applyGlow(card.querySelector('.m-bd'), info.bound, PLANET_GLOW_MAP_N4);

        const sabianCell = card.querySelector('.m-card-sabian');
        if (info.sabian !== undefined) {
            try {
                const sRes = await fetch(`/api/theory/sabian/render/${info.sabian}?lang=${lang}`);
                if (sRes.ok) {
                    const sData = await sRes.json();
                    sabianCell.textContent = sData.text;
                }
            } catch(e) { sabianCell.textContent = "-"; }
        }
    },

    applyGlow(cell, symbol, map) {
        if (!cell) return;
        cell.textContent = symbol || "-";
        cell.className = cell.className.replace(/\bglow-\w+\b/g, "").trim(); 
        if (!symbol || symbol === "-") return;
        
        const key = symbol.trim();
        if (map[key]) {
            cell.classList.add(map[key]);
        }
    }
};

window.switchLotSchema = function(schema) {
    const url = new URL(window.location.href);
    url.searchParams.set('lot_schema', schema);
    window.location.href = url.toString();
};

/* ─────────────────────────────────────────────────────────────
   GRIMOIRE MANIFESTATION (N4 -> Archive)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    const params = new URLSearchParams(window.location.search);
    const sys = params.get('system') || 'tropical';
    const ayan = params.get('ayanamsa') || 'lahiri';
    const schema = params.get('lot_schema') || 'paulus'; 

    let h_sys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    const activeSeed = JSON.parse(localStorage.getItem('active_seed')) || {};
    const seedId = activeSeed.id || activeSeed.idx || "unknown"; 
    const targetName = activeSeed.name || "Unknown";

    const compilerId = 'n4';

    const payload = {
        seed_id: seedId,
        stage: 'Nigredo',
        target_name: targetName,
        language: lang,
        metadata: { sys_tab: sys, ayanamsa: ayan, h_sys: h_sys, lot_schema: schema },
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
            console.log(`[GRIMOIRE] Archive [${targetName}] Saved Successfully!`);
            return true; 
        } else {
            alert(`Manifestation Failed: ${result.detail || result.error || 'Unknown Error'}`);
            throw new Error(result.detail || result.error);
        }
    } catch (e) {
        alert("Network Error during Grimoire Save.");
        throw e;
    }
};

document.addEventListener('DOMContentLoaded', () => MobileN4.init());