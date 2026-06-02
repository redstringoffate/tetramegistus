/* static/world/albedo/modules/a8_settings.js */

window.initA8Settings = function() {
    console.log("[A8] Settings Module Loaded.");
    
    const container = document.getElementById('a8-settings-list');
    
    // 🚀 [Airtight Fix]: 완벽한 디폴트(기본값) 상태 정의
    // 개발자님이 원하신 대로 4개 기둥(Main, Davison, A, B)을 모두 기본 활성화합니다.
    const DEFAULT_ENTITIES = {
        'composite': { active: true, subs: ['main'] },
        'davison': { active: true, subs: ['tropical'] },
        'seed': { active: true, subs: ['tropical'] },
        'partner': { active: true, subs: ['tropical'] }
    };

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

    // 1. Config Load (안전한 병합 로직)
    let currentPrefs = {};
    try {
        const saved = localStorage.getItem('tetramegistus_a8_prefs');
        if (saved) currentPrefs = JSON.parse(saved);
    } catch(e) {}

    // a8.js의 다른 설정(sortMode 등)을 보호하면서, entities 부분만 디폴트와 병합하여 강제 세팅합니다.
    let config = { 
        ...currentPrefs, 
        entities: { ...JSON.parse(JSON.stringify(DEFAULT_ENTITIES)), ...(currentPrefs.entities || {}) } 
    };

    // 2. Render Loop
    container.innerHTML = '';

    ENTITIES.forEach(meta => {
        const conf = config.entities[meta.id];
        
        // Composite의 경우 과거 찌꺼기 방어를 위해 필터링
        if (meta.id === 'composite') {
            conf.subs = conf.subs.filter(s => ['main', 'anti'].includes(s));
            if (conf.subs.length === 0) conf.subs = ['main'];
        }
        
        const row = document.createElement('div');
        row.className = 'a8-setting-item';

        const header = document.createElement('div');
        header.className = 'a8-setting-header';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'a8-setting-title';
        titleDiv.textContent = meta.label;

        const toggleBtn = document.createElement('div');
        toggleBtn.className = 'a8-toggle-wrapper';
        toggleBtn.innerHTML = `
            <span class="a8-toggle-label ${!conf.active ? 'active' : ''}">OFF</span>
            <div class="a8-track ${conf.active ? 'on' : ''}"><div class="a8-knob"></div></div>
            <span class="a8-toggle-label ${conf.active ? 'active' : ''}">ON</span>
        `;
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = `a8-options-area ${conf.active ? '' : 'disabled'}`;

        toggleBtn.onclick = () => {
            conf.active = !conf.active;
            
            const tk = toggleBtn.querySelector('.a8-track');
            const lbs = toggleBtn.querySelectorAll('.a8-toggle-label');
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

        header.appendChild(titleDiv);
        header.appendChild(toggleBtn);
        row.appendChild(header);

        const optsToUse = (meta.id === 'composite') ? SUB_OPTS.composite : SUB_OPTS.common;
        const group = document.createElement('div');
        group.className = 'a8-btn-group';
        
        optsToUse.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = `a8-opt-btn ${conf.subs.includes(opt.id) ? 'active' : ''}`;
            btn.textContent = opt.label;
            
            btn.onclick = () => {
                if (conf.subs.includes(opt.id)) {
                    if(conf.subs.length > 1) { 
                        conf.subs = conf.subs.filter(s => s !== opt.id);
                        btn.classList.remove('active');
                    }
                } else {
                    conf.subs.push(opt.id);
                    btn.classList.add('active');
                }
                saveConfig();
            };
            group.appendChild(btn);
        });
        
        optionsDiv.appendChild(group);
        row.appendChild(optionsDiv);
        container.appendChild(row);
    });

    // 🚀 [초기화 밀봉]: 설정창이 렌더링되자마자 이 병합된(올바른 디폴트가 적용된) 상태를 로컬 스토리지에 1회 강제 저장합니다.
    saveConfig();

    function saveConfig() {
        localStorage.setItem('tetramegistus_a8_prefs', JSON.stringify(config));
    }
};