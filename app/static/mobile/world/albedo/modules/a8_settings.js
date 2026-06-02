/* static/mobile/world/albedo/modules/a8_settings.js - Mobile Settings Engine */

(function() {
    console.log("⚙ [A8 Settings] Mobile Engine Standby.");

    const ENTITIES = [
        { id: 'composite', label: 'COMPOSITE' },
        { id: 'davison',   label: 'DAVISON' },
        { id: 'seed',      label: 'PARENT A' },
        { id: 'partner',   label: 'PARENT B' }
    ];

    const SUB_OPTS = {
        'composite': [
            { id: 'main', label: 'Main' },
            { id: 'anti', label: 'Anti' }
        ],
        'common': [ 
            { id: 'minor_asteroids', label: 'Asteroids' },
            { id: 'tropical', label: 'Tropical' },
            { id: 'sidereal', label: 'Sidereal' },
            { id: 'draconic', label: 'Draconic' },
            { id: 'ketunic', label: 'Ketunic' },
            { id: 'arabic_lots', label: 'Arabic Lots' }
        ]
    };

    const DEFAULT_CFG = {
        'composite': { active: true, subs: ['main'] },
        'davison':   { active: true, subs: ['tropical'] },
        'seed':      { active: true, subs: ['tropical'] },
        'partner':   { active: true, subs: ['tropical'] }
    };

    function getA8Config() {
        const raw = localStorage.getItem('m_a8_config');
        if (!raw) {
            localStorage.setItem('m_a8_config', JSON.stringify(DEFAULT_CFG));
            return JSON.parse(JSON.stringify(DEFAULT_CFG));
        }
        return JSON.parse(raw);
    }

    function saveA8Config(config) {
        localStorage.setItem('m_a8_config', JSON.stringify(config));
        if (window.A8_STATE) {
            window.A8_STATE.config = config;
        }
    }

    window.renderA8SettingsUI = function() {
        // 🚀 [수복 3]: a8.html과 a8_settings.html에 중복된 ID가 있을 경우 모달 내부의 엘리먼트를 우선 타겟팅
        let container = document.querySelector('#m-a8-settings-modal #m-a8-settings-list');
        if (!container) container = document.getElementById('m-a8-settings-list');
        
        if (!container) {
            console.warn("[A8] Waiting for Settings Modal to attach...");
            return;
        }

        container.innerHTML = ''; 
        const currentConfig = getA8Config();

        ENTITIES.forEach(entity => {
            const conf = currentConfig[entity.id] || { active: false, subs: [] };
            
            const item = document.createElement('div');
            item.className = `m-a8-setting-item ${conf.active ? 'active-node' : ''}`;

            const header = document.createElement('div');
            header.className = 'm-a8-setting-header';
            header.innerHTML = `<div class="m-a8-setting-title">${entity.label}</div>`;

            const toggle = document.createElement('div');
            toggle.className = `m-toggle-switch ${conf.active ? 'enabled' : ''}`;
            toggle.innerHTML = `<div class="m-toggle-knob ${conf.active ? 'right' : ''}"></div>`;
            
            toggle.onclick = (e) => {
                e.stopPropagation();
                conf.active = !conf.active;
                
                if (conf.active && (!conf.subs || conf.subs.length === 0)) {
                    conf.subs = (entity.id === 'composite') ? ['main'] : ['tropical'];
                }
                
                saveA8Config(currentConfig);
                window.renderA8SettingsUI(); 
            };

            header.appendChild(toggle);
            item.appendChild(header);

            const optionsArea = document.createElement('div');
            optionsArea.className = `m-a8-options-area ${conf.active ? '' : 'disabled-area'}`;

            const btnGroup = document.createElement('div');
            const opts = (entity.id === 'composite') ? SUB_OPTS.composite : SUB_OPTS.common;
            
            btnGroup.className = `m-a8-btn-group ${opts.length === 2 ? 'grid-2' : 'grid-3'}`;
            
            opts.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = `m-a8-opt-btn ${conf.subs.includes(opt.id) ? 'active' : ''}`;
                btn.textContent = opt.label;
                
                btn.onclick = (e) => {
                    e.stopPropagation();
                    if (!conf.active) return; 

                    if (conf.subs.includes(opt.id)) {
                        if (conf.subs.length > 1) { 
                            conf.subs = conf.subs.filter(s => s !== opt.id);
                            btn.classList.remove('active');
                        }
                    } else {
                        conf.subs.push(opt.id);
                        btn.classList.add('active');
                    }
                    saveA8Config(currentConfig);
                };
                btnGroup.appendChild(btn);
            });
            
            optionsArea.appendChild(btnGroup);
            item.appendChild(optionsArea);
            container.appendChild(item);
        });
    };

    // 혹시 늦게 렌더링될 경우를 대비해 약간의 딜레이 후 초기 실행
    setTimeout(() => {
        window.renderA8SettingsUI();
    }, 50);

})();