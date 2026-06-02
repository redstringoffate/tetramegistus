/* static/mobile/world/albedo/modules/a4.js - Mobile Card Architecture */

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

const MobileA4 = {
    async init() {
        console.log("[FIGURA] Initializing Mobile A4 Module...");
        
        await this.ensureDataIntegrity();

        const params = new URLSearchParams(window.location.search);
        const schema = params.get('lot_schema') || 'paulus'; 
        
        document.querySelectorAll('.m-sys-tab').forEach(btn => {
            if (btn.dataset.schema === schema) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        await this.fetchAndRenderFigura(schema);
    },

    async ensureDataIntegrity() {
        let localData = null;
        try { 
            localData = JSON.parse(localStorage.getItem('active_davison')); 
        } catch (e) {}

        if (localData && localData.seed1 && localData.seed2) {
            try {
                await fetch('/api/astro/coagulatio/sync-active', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(localData)
                });
            } catch (e) { console.error("[FIGURA] Sync Failed:", e); }
        }
    },

    async fetchAndRenderFigura(schema) {
        const params = new URLSearchParams(window.location.search);
        const lang = localStorage.getItem('tetramegistus_lang') || 'en';
        
        let h_sys = params.get('h_sys');
        if (!h_sys) {
            const savedHouse = localStorage.getItem('tetramegistus_house'); 
            const houseMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
            h_sys = houseMap[savedHouse] || 'P';
        }

        try {
            // 🚀 A4 전용: Figura API 엔드포인트 호출
            const res = await fetch(`/api/astro/figura/reading?lot_schema=${schema}&h_sys=${h_sys}`);
            if (!res.ok) return; 
            const data = await res.json();
            
            if (data.error) return;

            // 1. Sect Update
            const sectEl = document.getElementById('m-sect-val');
            if(sectEl && data.meta) sectEl.textContent = `${data.meta.sect}`;

            // 2. Data Rendering (Card UI)
            await this.updateCards(data.lots, lang);
            await this.updateCards(data.vertex, lang);

            if (data.syzygy) {
                const syzCard = document.querySelector('.m-figura-card[data-key="Syzygy"]');
                if (syzCard) {
                    syzCard.querySelector('.m-card-title').textContent = data.syzygy.name || "Syzygy"; 
                    await this.fillCardCells(syzCard, data.syzygy.data, lang);
                }
            }

        } catch (e) {
            console.error("[FIGURA] Mobile Render Error:", e);
        }
    },

    async updateCards(dataObj, lang) {
        if (!dataObj) return;
        for (const [key, info] of Object.entries(dataObj)) {
            const card = document.querySelector(`.m-figura-card[data-key="${key}"]`);
            if (card) {
                await this.fillCardCells(card, info, lang);
            }
        }
    },

    async fillCardCells(card, info, lang) {
        if (!info) return;

        card.querySelector('.m-card-info').textContent = info.dms || "-";
        card.querySelector('.m-card-house').textContent = info.house || "-";

        this.applyGlow(card.querySelector('.m-duad'), info.duad, ELEMENT_MAP_A4);
        this.applyGlow(card.querySelector('.m-dod'), info.dodeca, ELEMENT_MAP_A4);
        this.applyGlow(card.querySelector('.m-decan'), info.decan, PLANET_GLOW_MAP_A4);
        this.applyGlow(card.querySelector('.m-bd'), info.bound, PLANET_GLOW_MAP_A4);

        const sabianCell = card.querySelector('.m-card-sabian');
        if (info.sabian_index !== undefined || info.sabian !== undefined) {
            const idx = info.sabian_index !== undefined ? info.sabian_index : info.sabian;
            try {
                const sRes = await fetch(`/api/theory/sabian/render/${idx}?lang=${lang}`);
                if (sRes.ok) {
                    const sData = await sRes.json();
                    sabianCell.textContent = sData.text;
                }
            } catch(e) { sabianCell.textContent = "-"; }
        } else {
            sabianCell.textContent = "-";
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
   GRIMOIRE MANIFESTATION (A4 -> Archive)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    const params = new URLSearchParams(window.location.search);
    const sys = params.get('system') || 'tropical';
    const ayan = params.get('ayanamsa') || 'lahiri';
    const schema = params.get('lot_schema') || 'paulus'; 

    let h_sys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

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

    const targetName = (s1Name && s2Name) ? `${s1Name} & ${s2Name}` : "Unknown Coniunctio";
    const compilerId = 'a4';

    const payload = {
        seed_id: seedId,
        stage: 'Albedo',
        target_name: targetName,
        language: lang,
        metadata: { sys_tab: sys, ayanamsa: ayan, h_sys: h_sys, lot_schema: schema }
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

document.addEventListener('DOMContentLoaded', () => MobileA4.init());