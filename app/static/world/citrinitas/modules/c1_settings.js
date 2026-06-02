/* C1 SYSTEM SETTINGS LOGIC - v5.0 Dynamic Column Trigger + Drag & Drop Fix */

window.initC1Settings = function() {
    console.log("[C1] Settings Module Loaded.");
    
    if (!document.getElementById('c1-settings-style')) {
        const style = document.createElement('style');
        style.id = 'c1-settings-style';
        style.innerHTML = `
            #c1-settings-list::-webkit-scrollbar { display: none !important; }
            #c1-settings-list { -ms-overflow-style: none !important; scrollbar-width: none !important; }
            
            .c1-drag-handle { cursor: grab; font-size: 1.2rem; color: #666; margin-right: 12px; transition: color 0.2s; user-select: none; }
            .c1-drag-handle:hover { color: #49dce1; }
            .c1-drag-handle:active { cursor: grabbing; color: #fff; }
            .c1-setting-item.dragging { opacity: 0.4; border: 1px dashed #49dce1 !important; transform: scale(0.98); }
            .c1-setting-item { transition: transform 0.2s, opacity 0.2s; }
        `;
        document.head.appendChild(style);
    }

    const container = document.getElementById('c1-settings-list');
    
    // 🚀 [해결 1]: 맨 밑에 [CONFIRM] 버튼에 가려지지 않도록 넉넉한 하단 여백 추가
    container.style.paddingBottom = '80px'; 
    
    const rawData = localStorage.getItem('c1_data');
    const rawConfig = localStorage.getItem('c1_config');
    
    let dataList = [];
    if (rawData) {
        try {
            const parsed = JSON.parse(rawData);
            dataList = parsed.data ? parsed.data : (Array.isArray(parsed) ? parsed : []);
        } catch(e) { dataList = []; }
    }
    
    let config = rawConfig ? JSON.parse(rawConfig) : { entities: {} };

    const OPTS_NATAL = [
        { id: 'asteroids', label: 'Asteroids' },
        { id: 'tropical', label: 'Tropical' },
        { id: 'sidereal', label: 'Sidereal' },
        { id: 'draconic', label: 'Draconic' },
        { id: 'ketunic', label: 'Ketunic' },
        { id: 'arabic', label: 'Arabic Lots' }
    ];

    const OPTS_COMP = [
        { id: 'comp_main', label: 'Main' },
        { id: 'comp_anti', label: 'Anti' }
    ];

    const OPTS_DAVI = [
        { id: 'davi_ast', label: 'Asteroids' },
        { id: 'davi_tro', label: 'Tropical' },
        { id: 'davi_sid', label: 'Sidereal' },
        { id: 'davi_dra', label: 'Draconic' },
        { id: 'davi_ket', label: 'Ketunic' },
        { id: 'davi_lot', label: 'Arabic Lots' }
    ];

    container.innerHTML = '';
    
    dataList.forEach((item, index) => {
        if (!config.entities[item.id]) {
            config.entities[item.id] = { active: false, subs: [] };
        }
        const conf = config.entities[item.id];

        const row = document.createElement('div');
        row.className = 'c1-setting-item';
        row.dataset.index = index;

        const header = document.createElement('div');
        header.className = 'c1-setting-header';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        
        const dragHandle = document.createElement('div');
        dragHandle.innerHTML = '≡';
        dragHandle.className = 'c1-drag-handle';
        
        // 🚀 [해결 2]: 마우스를 '누를 때'만 드래그 켜기 (mouseleave 증발 버그 차단)
        dragHandle.addEventListener('mousedown', () => { row.draggable = true; });
        dragHandle.addEventListener('mouseup', () => { row.draggable = false; });

        const titleDiv = document.createElement('div');
        titleDiv.style.flex = '1';
        titleDiv.innerHTML = `<span style="color:#666; margin-right:5px;">${index+1}.</span><span class="c1-setting-title">${item.name}</span> <span class="c1-setting-type">[${item.type.toUpperCase()}]</span>`;
        
        const toggleBtn = document.createElement('div');
        toggleBtn.className = 'c1-toggle-wrapper';
        toggleBtn.innerHTML = `
            <span class="c1-toggle-label ${!conf.active ? 'active' : ''}">HIDE</span>
            <div class="c1-track ${conf.active ? 'on' : ''}"><div class="c1-knob"></div></div>
            <span class="c1-toggle-label ${conf.active ? 'active' : ''}">SHOW</span>
        `;
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = `c1-options-area ${conf.active ? '' : 'disabled'}`;

        toggleBtn.onclick = () => {
            conf.active = !conf.active;
            const tk = toggleBtn.querySelector('.c1-track');
            const lbs = toggleBtn.querySelectorAll('.c1-toggle-label');
            if (conf.active) {
                tk.classList.add('on');
                lbs[0].classList.remove('active'); lbs[1].classList.add('active');
                optionsDiv.classList.remove('disabled');
            } else {
                tk.classList.remove('on');
                lbs[0].classList.add('active'); lbs[1].classList.remove('active');
                optionsDiv.classList.add('disabled');
            }
            saveConfig();
        };

        header.appendChild(dragHandle);
        header.appendChild(titleDiv);
        header.appendChild(toggleBtn);
        row.appendChild(header);

        if (item.type === 'natal') {
            optionsDiv.appendChild(createStrip(item.id, OPTS_NATAL, conf.subs));
        } 
        else if (item.type === 'conjunction') {
            const rowComp = document.createElement('div');
            rowComp.className = 'c1-sub-row';
            rowComp.innerHTML = '<div class="c1-sub-label">Composite</div>';
            rowComp.appendChild(createStrip(item.id, OPTS_COMP, conf.subs));
            optionsDiv.appendChild(rowComp);

            const rowDavi = document.createElement('div');
            rowDavi.className = 'c1-sub-row';
            rowDavi.innerHTML = '<div class="c1-sub-label">Davison</div>';
            rowDavi.appendChild(createStrip(item.id, OPTS_DAVI, conf.subs));
            optionsDiv.appendChild(rowDavi);
        }

        row.appendChild(optionsDiv);
        container.appendChild(row);

        // 드래그 시작
        row.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            setTimeout(() => row.classList.add('dragging'), 0);
        });

        // 드래그 종료 시 초기화 (마우스가 핸들을 벗어나도 안전하게 해제)
        row.addEventListener('dragend', () => {
            row.draggable = false; 
            row.classList.remove('dragging');
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'move';
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = index;

            if (fromIndex !== toIndex && !isNaN(fromIndex)) {
                const movedItem = dataList.splice(fromIndex, 1)[0];
                dataList.splice(toIndex, 0, movedItem);

                let newPayload = dataList;
                if (rawData) {
                    try {
                        const parsed = JSON.parse(rawData);
                        if (parsed.expiry) {
                            parsed.data = dataList;
                            newPayload = parsed;
                        }
                    } catch(err) {}
                }
                localStorage.setItem('c1_data', JSON.stringify(newPayload));

                window.initC1Settings();
                if (window.rebuildC1Table) window.rebuildC1Table();
                if (window.refreshGrid) window.refreshGrid();
            }
        });
    });

    function createStrip(id, options, activeSubs) {
        const group = document.createElement('div');
        group.className = 'c1-btn-group';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = `c1-opt-btn ${activeSubs.includes(opt.id) ? 'active' : ''}`;
            btn.textContent = opt.label;
            
            btn.onclick = () => {
                const conf = config.entities[id];
                if (conf.subs.includes(opt.id)) {
                    conf.subs = conf.subs.filter(s => s !== opt.id);
                    btn.classList.remove('active');
                } else {
                    conf.subs.push(opt.id);
                    btn.classList.add('active');
                }
                saveConfig();
            };
            group.appendChild(btn);
        });
        return group;
    }

    function saveConfig() {
        localStorage.setItem('c1_config', JSON.stringify(config));
        if (window.rebuildC1Table) window.rebuildC1Table();
        if (window.refreshGrid) window.refreshGrid();
    }
};