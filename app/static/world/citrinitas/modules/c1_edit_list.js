/* C1 EDIT LIST LOGIC CONTROLLER (Enhanced with Tooltips) */

window.initC1EditList = function() {
    console.log("[C1] Edit List Module Loaded.");
    
    const container = document.getElementById('c1-edit-list-container');
    const tooltipEl = document.getElementById('c1-list-tooltip');
    
    // 1. Fetch Data
    const rawData = localStorage.getItem('c1_data');
    const data = rawData ? JSON.parse(rawData) : [];

    // 2. Empty State
    if (data.length === 0) {
        container.innerHTML = '<div class="c1-no-data">No data manifested yet.</div>';
        return;
    }

    // ── Tooltip Helper Functions ──

    // 좌표 포맷팅 (예: 36.29° N, 128.12° E)
    function formatCoords(lat, lng) {
        const latStr = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
        const lngStr = `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'W'}`;
        return `${latStr}, ${lngStr}`;
    }

    // 데이터 타입별 툴팁 텍스트 생성
    function getTooltipText(item) {
        // 개별 데이터 포맷팅 함수
        const fmt = (d) => {
            let locStr = d.location;
            if (d.location === "Manual Entry") {
                locStr = `Manual (${formatCoords(d.lat, d.lng)})`;
            }
            // 시간 포맷 (HH:mm:ss -> HH:mm)
            const timeShort = d.birth_time ? d.birth_time.substring(0, 5) : "??:??";
            return `${d.birth_date}, ${timeShort}; ${locStr}`;
        };

        if (item.type === 'natal') {
            return fmt(item);
        } else if (item.type === 'conjunction') {
            // 두 줄로 표시 (Person 1 \n Person 2)
            return `P1: ${fmt(item.p1)}\nP2: ${fmt(item.p2)}`;
        }
        return "Unknown Data Type";
    }

    // ── Render List Items ──
    container.innerHTML = ''; // Clear container first

    data.forEach((item, i) => {
        const displayName = item.name;
        // 🌟 "CONJUNCTION" 전체 표기
        const displayType = item.type === 'conjunction' ? 'CONJUNCTION' : 'NATAL';
        
        // DOM 요소 생성 (이벤트 리스너 부착을 위해 innerHTML 대신 createElement 사용)
        const itemEl = document.createElement('div');
        itemEl.className = 'c1-list-item';
        itemEl.innerHTML = `
            <div class="c1-item-info">
                <span class="c1-item-index">${i+1}.</span>
                <div style="display:flex; flex-direction:column;">
                    <span class="c1-item-name">${displayName}</span>
                    <span class="c1-item-type">[${displayType}]</span>
                </div>
            </div>
            <div class="c1-item-actions">
                <button class="c1-btn-edit">EDIT</button>
                <button class="c1-btn-del">DEL</button>
            </div>
        `;

        // 버튼 이벤트 연결
        itemEl.querySelector('.c1-btn-edit').onclick = (e) => { e.stopPropagation(); c1_edit(item.id); };
        itemEl.querySelector('.c1-btn-del').onclick = (e) => { e.stopPropagation(); c1_delete(item.id); };

        // 🌟 툴팁 이벤트 리스너 (Hover)
        itemEl.addEventListener('mousemove', (e) => {
            tooltipEl.textContent = getTooltipText(item);
            tooltipEl.style.display = 'block';
            // 마우스 커서 옆에 위치시킴
            tooltipEl.style.left = (e.clientX + 15) + 'px';
            tooltipEl.style.top = (e.clientY + 10) + 'px';
        });

        itemEl.addEventListener('mouseleave', () => {
            tooltipEl.style.display = 'none';
        });

        container.appendChild(itemEl);
    });
};