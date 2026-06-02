/* static/mobile/world/citrinitas/modules/c1_edit_list.js */

(function() {
    window.m_initC1EditList = function() {
        const wrapper = document.getElementById('m-c1-edit-list-wrapper');
        if (!wrapper) return;

        let rawData = [];
        try {
            const d = localStorage.getItem('c1_data');
            if (d) {
                const parsed = JSON.parse(d);
                rawData = parsed.data ? parsed.data : parsed;
                if (!Array.isArray(rawData)) rawData = [];
            }
        } catch(e) {}

        if (rawData.length === 0) {
            wrapper.innerHTML = '<div class="m-c1-no-data">No data manifested yet.</div>';
            return;
        }

        wrapper.innerHTML = '';

        const fmtCoords = (lat, lng) => {
            if (lat == null || lng == null) return "Unknown";
            const latStr = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
            const lngStr = `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'W'}`;
            return `${latStr}, ${lngStr}`;
        };

        const getDetailsHTML = (item) => {
            const fmt = (d) => {
                if(!d) return '<div style="color:#ff4444;">Invalid Data</div>';
                const isUnk = d.is_time_unknown || d.time_unknown || d.unknown;
                const timeStr = isUnk ? "Unknown" : (d.birth_time ? d.birth_time.substring(0, 5) : "??:??");
                let locStr = d.location || "Unknown";
                if(locStr === "Manual Entry") locStr = `Manual (${fmtCoords(d.lat, d.lng)})`;
                const dateStr = d.birth_date || `${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`;
                const tzStr = d.timezone >= 0 ? `+${d.timezone}` : d.timezone;
                return `
                    <div class="m-c1-detail-row"><span class="m-c1-detail-label">DATE :</span><span>${dateStr} ${timeStr}</span></div>
                    <div class="m-c1-detail-row"><span class="m-c1-detail-label">LOC  :</span><span>${locStr} (UTC${tzStr})</span></div>
                `;
            };

            try {
                if (item.type === 'natal') {
                    const target = item.payload ? item.payload : item;
                    return fmt(target);
                } else if (item.type === 'conjunction') {
                    const payload = item.payload || {};
                    const p1 = payload.seed1 || payload.p1 || item.p1;
                    const p2 = payload.seed2 || payload.p2 || item.p2;
                    if (!p1 || !p2) return '<div style="color:#ff4444;">Corrupted Conjunction Data</div>';
                    return `
                        <div style="color:#49dce1; margin-bottom:5px;">[ PERSON 1 ]</div>${fmt(p1)}
                        <div style="color:#49dce1; margin:10px 0 5px 0;">[ PERSON 2 ]</div>${fmt(p2)}
                    `;
                }
            } catch(err) { return '<div style="color:#ff4444;">Data Corrupted</div>'; }
            return '<div>Unknown Format</div>';
        };

        rawData.forEach((item, i) => {
            const el = document.createElement('div');
            el.className = 'm-c1-list-item';
            const displayType = item.type === 'conjunction' ? 'CONJUNCTION' : 'NATAL';

            el.innerHTML = `
                <div class="m-c1-item-header">
                    <div class="m-c1-item-info">
                        <span class="m-c1-item-idx">${i + 1}.</span>
                        <div style="display:flex; flex-direction:column;">
                            <span class="m-c1-item-name">${item.name || "Unknown"}</span>
                            <span class="m-c1-item-type">[${displayType}]</span>
                        </div>
                    </div>
                    <div class="m-c1-item-actions">
                        <button class="m-c1-btn-action m-c1-btn-edit">EDIT</button>
                        <button class="m-c1-btn-action m-c1-btn-del">DEL</button>
                    </div>
                </div>
                <div class="m-c1-item-details">${getDetailsHTML(item)}</div>
            `;

            el.querySelector('.m-c1-item-info').onclick = () => el.classList.toggle('expanded');
            el.querySelector('.m-c1-btn-del').onclick = (e) => { e.stopPropagation(); m_c1_delete(item.id); };
            el.querySelector('.m-c1-btn-edit').onclick = (e) => { e.stopPropagation(); m_c1_edit(item.id); };
            wrapper.appendChild(el);
        });
    };

    window.m_c1_delete = function(id) {
        if (confirm("Erase this data from existence?")) {
            try {
                let parsed = JSON.parse(localStorage.getItem('c1_data'));
                let isObject = !Array.isArray(parsed);
                let arr = isObject ? (parsed.data || []) : parsed;
                arr = arr.filter(d => d.id !== id);
                if (isObject) parsed.data = arr; else parsed = arr;
                localStorage.setItem('c1_data', JSON.stringify(parsed));
                
                let config = JSON.parse(localStorage.getItem('c1_config'));
                if (config && config.entities && config.entities[id]) {
                    delete config.entities[id];
                    localStorage.setItem('c1_config', JSON.stringify(config));
                }
                m_initC1EditList(); 
            } catch(e){}
        }
    };

    window.m_c1_edit = async function(id) {
        let rawData = [];
        try {
            const parsed = JSON.parse(localStorage.getItem('c1_data'));
            rawData = parsed.data ? parsed.data : parsed;
        } catch(e){}
        
        const item = rawData.find(d => d.id === id);
        if (!item) return;

        const targetType = item.type === 'conjunction' ? 'add_conj' : 'add_natal';
        
        if (window.m_c1_openModal) {
            sessionStorage.setItem('m_c1_editing_id', item.id);
            // 🚀 [해결]: 무조건 true (Edit 모드) 플래그를 넘겨준다
            await window.m_c1_openModal(targetType, true);
        }
    };
})();