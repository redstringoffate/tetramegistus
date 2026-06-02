/* static/mobile/world/citrinitas/modules/c1_settings.js */

(function() {
    console.log("⚙ [C1 Settings] Mobile Tabula Engine Activation.");

    let dataList = [];
    let config = { entities: {} };
    let rawDataObj = null; 

    window.initC1Settings = function() {
        const container = document.getElementById('m-c1-settings-list');
        if (!container) return;
        
        loadData();
        renderSettingsList(container);
        bindConfirmButton(); 
    };

    function loadData() {
        const rawData = localStorage.getItem('c1_data');
        const rawConfig = localStorage.getItem('c1_config');
        
        if (rawData) {
            try {
                const parsed = JSON.parse(rawData);
                if (!Array.isArray(parsed) && parsed.data) {
                    rawDataObj = parsed; 
                    dataList = parsed.data;
                } else {
                    rawDataObj = null;
                    dataList = Array.isArray(parsed) ? parsed : [];
                }
            } catch(e) { dataList = []; }
        }
        
        config = rawConfig ? JSON.parse(rawConfig) : { entities: {} };
    }

    // 🚀 [핵심 해결]: 로딩 스크린 UX 최적화 (의도적 딜레이 적용)
    function bindConfirmButton() {
        const confirmBtn = document.getElementById('m-c1-btn-confirm');
        if (!confirmBtn) return;
        
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        
        newBtn.onclick = () => {
            // 1. 모달창 조용히 닫기 (c1.js의 중복 렌더링 우회)
            const overlay = document.getElementById('m-c1-modal-overlay');
            if (overlay) overlay.style.display = 'none';

            // 2. 로딩 스크린 강제 점등
            const loader = document.getElementById('m-c1-loading');
            if (loader) loader.classList.add('active');

            // 3. 브라우저가 로딩 UI를 그릴 시간을 충분히 확보 (0.6초 딜레이)
            setTimeout(() => {
                // 4. 무거운 Tabula 테이블 렌더링 실행
                if (window.rebuildC1Table) window.rebuildC1Table();
                
                // 5. 렌더링 완료 후 로딩 스크린 서서히 끄기 (0.2초 추가 여운)
                setTimeout(() => {
                    if (loader) loader.classList.remove('active');
                }, 200);
            }, 600);
        };
    }

    function renderSettingsList(container) {
        container.innerHTML = '';
        
        const OPTS_NATAL = [
            { id: 'asteroids', label: 'Asteroids' }, { id: 'tropical', label: 'Tropical' },
            { id: 'sidereal', label: 'Sidereal' }, { id: 'draconic', label: 'Draconic' },
            { id: 'ketunic', label: 'Ketunic' }, { id: 'arabic', label: 'Arabic Lots' }
        ];
        const OPTS_COMP = [{ id: 'comp_main', label: 'Main' }, { id: 'comp_anti', label: 'Anti' }];
        const OPTS_DAVI = [
            { id: 'davi_ast', label: 'Asteroids' }, { id: 'davi_tro', label: 'Tropical' },
            { id: 'davi_sid', label: 'Sidereal' }, { id: 'davi_dra', label: 'Draconic' },
            { id: 'davi_ket', label: 'Ketunic' }, { id: 'davi_lot', label: 'Arabic' }
        ];

        if (dataList.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#666; padding:20px; font-size:0.8rem;">No data manifested yet.</div>';
            return;
        }

        dataList.forEach((item, index) => {
            if (!config.entities[item.id]) config.entities[item.id] = { active: false, subs: [] };
            const conf = config.entities[item.id];

            const row = document.createElement('div');
            row.className = 'm-c1-setting-item';
            row.dataset.id = item.id; 

            const header = document.createElement('div');
            header.className = 'm-c1-setting-header';
            
            const dragHandle = document.createElement('div');
            dragHandle.className = 'm-drag-handle';
            dragHandle.innerHTML = '≡';
            bindTouchDrag(dragHandle, row, container);

            const titleDiv = document.createElement('div');
            titleDiv.className = 'm-c1-setting-title-box';
            titleDiv.innerHTML = `
                <div class="m-c1-setting-title"><span class="m-row-idx">${index+1}.</span> ${item.name}</div>
                <div class="m-c1-setting-type">[${item.type.toUpperCase()}]</div>
            `;
            
            const toggleBtn = document.createElement('div');
            toggleBtn.className = 'm-toggle-wrapper';
            toggleBtn.innerHTML = `
                <span class="m-toggle-label ${!conf.active ? 'active' : ''}">HIDE</span>
                <div class="m-track ${conf.active ? 'on' : ''}"><div class="m-knob"></div></div>
                <span class="m-toggle-label ${conf.active ? 'active' : ''}">SHOW</span>
            `;
            
            const optionsDiv = document.createElement('div');
            optionsDiv.className = `m-c1-options-area ${conf.active ? '' : 'disabled'}`;

            toggleBtn.onclick = () => {
                conf.active = !conf.active;
                const tk = toggleBtn.querySelector('.m-track');
                const lbs = toggleBtn.querySelectorAll('.m-toggle-label');
                
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
                optionsDiv.appendChild(createStrip(item.id, OPTS_NATAL, conf.subs, 'grid-3'));
            } else if (item.type === 'conjunction') {
                const rowComp = document.createElement('div');
                rowComp.className = 'm-c1-sub-row';
                rowComp.innerHTML = '<div class="m-c1-sub-label">Composite</div>';
                rowComp.appendChild(createStrip(item.id, OPTS_COMP, conf.subs, 'grid-2'));
                optionsDiv.appendChild(rowComp);

                const rowDavi = document.createElement('div');
                rowDavi.className = 'm-c1-sub-row';
                rowDavi.innerHTML = '<div class="m-c1-sub-label">Davison</div>';
                rowDavi.appendChild(createStrip(item.id, OPTS_DAVI, conf.subs, 'grid-3'));
                optionsDiv.appendChild(rowDavi);
            }

            row.appendChild(optionsDiv);
            container.appendChild(row);
        });
    }

    function bindTouchDrag(handle, row, container) {
        let draggedItem = null;

        handle.addEventListener('touchstart', function(e) {
            draggedItem = row;
            row.classList.add('dragging');
            e.preventDefault(); 
        }, { passive: false });

        handle.addEventListener('touchmove', function(e) {
            if (!draggedItem) return;
            e.preventDefault(); 
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!target) return;

            const targetRow = target.closest('.m-c1-setting-item');
            if (targetRow && targetRow !== draggedItem) {
                const draggedRect = draggedItem.getBoundingClientRect();
                const targetRect = targetRow.getBoundingClientRect();
                
                if (draggedRect.top < targetRect.top) targetRow.after(draggedItem);
                else targetRow.before(draggedItem);
            }
        }, { passive: false });

        handle.addEventListener('touchend', function(e) {
            if (!draggedItem) return;
            draggedItem.classList.remove('dragging');
            draggedItem = null;
            
            const newOrderIds = Array.from(container.children).map(child => child.dataset.id);
            const newDataList = [];
            newOrderIds.forEach(id => {
                const item = dataList.find(d => d.id === id);
                if (item) newDataList.push(item);
            });
            
            dataList = newDataList;
            saveDataList();

            Array.from(container.children).forEach((child, idx) => {
                const idxSpan = child.querySelector('.m-row-idx');
                if (idxSpan) idxSpan.textContent = `${idx + 1}.`;
            });
        });
    }

    function createStrip(id, options, activeSubs, gridClass) {
        const group = document.createElement('div');
        group.className = `m-c1-btn-group ${gridClass}`;
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = `m-c1-opt-btn ${activeSubs.includes(opt.id) ? 'active' : ''}`;
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

    function saveDataList() {
        let payload = dataList;
        if (rawDataObj) {
            rawDataObj.data = dataList;
            payload = rawDataObj;
        }
        localStorage.setItem('c1_data', JSON.stringify(payload));
    }

    function saveConfig() {
        localStorage.setItem('c1_config', JSON.stringify(config));
    }
})();