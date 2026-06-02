// app/static/mobile/world/rubedo/godmode_lv3/godmode_lv3.js

const GodUI = {
    data: null,
    tokenRemaining: 0,
    evictionTimer: null,

    async init() {
        try {
            const res = await fetch('/api/godmode/tree', { credentials: 'include' });
            
            if (res.status === 401) {
                this.evictGod(); 
                return;
            }
            if (!res.ok) return;
            
            this.data = await res.json();
            this.populateSidebar(); 
            
            const now = Date.now();
            let expiry = localStorage.getItem('gm_token_expiry');
            if (!expiry || parseInt(expiry) <= now) {
                expiry = now + 7200 * 1000;
                localStorage.setItem('gm_token_expiry', expiry);
            }
            this.startHiddenEvictionTimer();
        } catch (e) {
            console.error("The void is silent:", e);
        }
    },

    startHiddenEvictionTimer() {
        const now = Date.now();
        let expiry = localStorage.getItem('gm_token_expiry');
        this.tokenRemaining = Math.floor((parseInt(expiry) - now) / 1000);
        if (this.evictionTimer) clearInterval(this.evictionTimer);
        
        this.evictionTimer = setInterval(() => {
            if (this.tokenRemaining > 0) this.tokenRemaining--;
            else { clearInterval(this.evictionTimer); this.evictGod(); }
        }, 1000);
    },

    evictGod() {
        let modal = document.getElementById('token-evict-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'token-evict-modal';
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:99999;';
            modal.innerHTML = `
                <div style="background:#111; width: 80%; max-width: 320px; text-align:center; padding: 40px 20px; border: 1px solid #ff5050; border-radius: 8px; box-shadow: 0 0 20px rgba(255,80,80,0.4); font-family: ui-monospace, monospace;">
                    <div style="font-size:1.2rem; color:#ff5050; font-weight:bold; margin-bottom:15px;">💀 Evicting...</div>
                    <div style="color:#aaa; font-size:0.8rem;">Your connection has been severed.</div>
                </div>`;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        setTimeout(() => window.location.href = '/world/nigredo', 2000);
    },

    populateSidebar() {
        const sub = document.getElementById('r2-symbol-sub');
        if (!sub || !this.data || !this.data.r2.symbol) return;
        const zodiacOrder = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
        
        const sidebarHTML = zodiacOrder
            .filter(sign => this.data.r2.symbol.hasOwnProperty(sign.toLowerCase())) 
            .map(sign => `<div class="tree-folder" onclick="GodUI.showBrowser('r2', '${sign}'); GodUI.scrollToEditor();">📁 ${sign.toUpperCase()}</div>`)
            .join('');
        sub.innerHTML = sidebarHTML;
    },

    toggleEdit() { const t = document.getElementById('edit-tree'); if(t) t.style.display = t.style.display === 'none' ? 'block' : 'none'; },
    toggleDelete() { const t = document.getElementById('delete-tree'); if(t) t.style.display = t.style.display === 'none' ? 'block' : 'none'; },
    toggleFolder(id) { const el = document.getElementById(id); if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; },

    scrollToEditor() {
        document.getElementById('editor-zone').scrollIntoView({ behavior: 'smooth' });
    },

    showBrowser(module, subPath, mode = 'EDIT') {
        const main = document.getElementById('editor-zone');
        let articles = [];

        if (module === 'r1') articles = subPath === 'archivum' ? [...this.data.r1.archivum] : [...this.data.r1.hermeticum];
        else if (module === 'r2') articles = subPath === 'sign' ? [...this.data.r2.sign] : (this.data.r2.symbol[subPath] ? [...this.data.r2.symbol[subPath]] : []);

        const modeColor = mode === 'DELETE' ? '#ff5050' : '#3cff8f';
        const headerText = `${module.toUpperCase()} | ${subPath.toUpperCase()} <span style="color:${modeColor}; font-size:0.6em; margin-left: 10px;">[${mode}]</span>`;

        if (!articles || articles.length === 0) {
            main.innerHTML = `<div class="browser-header">${headerText}</div><div class="tree-empty" style="color: #666;">[ the void is empty ]</div>`;
            this.scrollToEditor();
            return;
        }

        if (module === 'r2' && subPath === 'sign') {
            const zodiacOrder = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
            articles.sort((a, b) => {
                let idxA = zodiacOrder.indexOf(a.id.toLowerCase());
                let idxB = zodiacOrder.indexOf(b.id.toLowerCase());
                if (idxA === -1) idxA = 999; if (idxB === -1) idxB = 999;
                return idxA - idxB;
            });
        }

        let listHTML = '';
        if (mode === 'DELETE') {
            listHTML = articles.map(art => `
                <div class="delete-item-wrapper">
                    <div class="entity-title" style="color: #888;">📄 ${art.id}</div>
                    <div class="delete-x" onclick="DeleteUI.confirm('${module}', '${subPath}/${art.id}')">✖</div>
                </div>
            `).join('');
        } else {
            listHTML = articles.map(art => `
                <div class="entity-item">
                    <div class="entity-title" onclick="GodUI.toggleLangs('${module}-${subPath}-${art.id}')">📄 ${art.id}</div>
                    <div id="langs-${module}-${subPath}-${art.id}" class="entity-langs" style="display:none;">
                        <div class="lang-bullet" onclick="GodUI.goToEditor('${module}', '${subPath}/${art.id}', 'en', 'EDIT')"> • en (English)</div>
                        <div class="lang-bullet" onclick="GodUI.goToEditor('${module}', '${subPath}/${art.id}', 'ko', 'EDIT')"> • ko (Korean)</div>
                    </div>
                </div>
            `).join('');
        }

        main.innerHTML = `<div class="browser-header">${headerText}</div><div class="browser-list">${listHTML}</div>`;
        this.scrollToEditor();
    },

    toggleLangs(uid) { const el = document.getElementById(`langs-${uid}`); if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; },
    goToEditor(module, path, lang, mode) { window.location.href = `/world/rubedo/godmode_lv3/editor?module=${module}&path=${path}&lang=${lang}&mode=${mode}`; }
};

// ----------------------------------------------------------------------
// 🚀 [Lv3: 모바일 터치 기반 핀 매니지먼트 (상하 화살표 로직 탑재)]
// ----------------------------------------------------------------------
const PinUI = {
    targetUndo: null, currentAddType: null,

    toggle() {
        const tree = document.getElementById('pin-tree');
        tree.style.display = tree.style.display === 'none' ? 'block' : 'none';
        if (tree.style.display === 'block') this.render();
    },

    render() {
        if (!GodUI.data || !GodUI.data.r1) return;
        this.renderList('hermeticum');
        this.renderList('archivum');
    },

    renderList(type) {
        const listEl = document.getElementById(`pin-list-${type}`);
        const countEl = document.getElementById(`pin-count-${type}`);
        const btnEl = document.getElementById(`btn-add-pin-${type}`);

        let pins = GodUI.data.r1[type].filter(a => a.pinned).sort((a, b) => (a.pin_order || 0) - (b.pin_order || 0));

        countEl.innerText = pins.length;
        btnEl.disabled = pins.length >= 5;

        // 🚀 드래그 핸들 대신 상하 이동 화살표(pin-controls)로 대체
        listEl.innerHTML = pins.map((p, idx) => `
            <div class="pin-item" data-id="${p.id}" data-type="${type}">
                <div class="pin-controls">
                    <span class="pin-up" onclick="PinUI.moveUp('${type}', ${idx})">▲</span>
                    <span class="pin-down" onclick="PinUI.moveDown('${type}', ${idx})">▼</span>
                </div>
                <span class="pin-title" title="${p.title || p.id}">${p.title || p.id}</span>
                <span class="pin-delete" onclick="PinUI.askUndo('${type}', '${p.id}')">✖</span>
            </div>
        `).join('');
    },

    // 🚀 모바일 전용 배열 위치 스와핑 함수 (위로 이동)
    async moveUp(type, idx) {
        if (idx <= 0) return; // 이미 맨 위면 무시
        let pins = GodUI.data.r1[type].filter(a => a.pinned).sort((a, b) => (a.pin_order || 0) - (b.pin_order || 0));
        
        let tempOrder = pins[idx].pin_order;
        pins[idx].pin_order = pins[idx - 1].pin_order;
        pins[idx - 1].pin_order = tempOrder;
        
        this.renderList(type);
        await this.syncBackend(type);
    },

    // 🚀 모바일 전용 배열 위치 스와핑 함수 (아래로 이동)
    async moveDown(type, idx) {
        let pins = GodUI.data.r1[type].filter(a => a.pinned).sort((a, b) => (a.pin_order || 0) - (b.pin_order || 0));
        if (idx >= pins.length - 1) return; // 이미 맨 아래면 무시
        
        let tempOrder = pins[idx].pin_order;
        pins[idx].pin_order = pins[idx + 1].pin_order;
        pins[idx + 1].pin_order = tempOrder;
        
        this.renderList(type);
        await this.syncBackend(type);
    },

    openAddModal(type) {
        if (GodUI.data.r1[type].filter(a => a.pinned).length >= 5) return;
        this.currentAddType = type;
        const listEl = document.getElementById('pin-search-list');
        const unpinned = GodUI.data.r1[type].filter(a => !a.pinned);
        
        if (unpinned.length === 0) listEl.innerHTML = `<div style="color:#555; text-align:center; padding:20px;">the void is empty.</div>`;
        else {
            listEl.innerHTML = unpinned.map(p => `<div class="pin-search-item" onclick="PinUI.addPin('${p.id}')">📄 ${p.title || p.id}</div>`).join('');
        }
        document.getElementById('pin-add-overlay').style.display = 'flex';
    },

    closeAddModal() { document.getElementById('pin-add-overlay').style.display = 'none'; },

    async addPin(id) {
        const type = this.currentAddType;
        const target = GodUI.data.r1[type].find(a => a.id === id);
        if(target) {
            target.pinned = true;
            target.pin_order = GodUI.data.r1[type].filter(a => a.pinned).length;
        }
        this.closeAddModal();
        this.render();
        await this.syncBackend(type);
    },

    askUndo(type, id) {
        this.targetUndo = { type, id };
        document.getElementById('pin-undo-overlay').style.display = 'flex';
    },

    closeUndoModal() {
        this.targetUndo = null;
        document.getElementById('pin-undo-overlay').style.display = 'none';
    },

    async confirmUndo() {
        if (!this.targetUndo) return;
        const { type, id } = this.targetUndo;
        const target = GodUI.data.r1[type].find(a => a.id === id);
        if(target) target.pinned = false;
        
        this.closeUndoModal();
        this.render();
        await this.syncBackend(type);
    },

    async syncBackend(type) {
        const pinnedIds = GodUI.data.r1[type].filter(a => a.pinned).sort((a,b) => a.pin_order - b.pin_order).map(a => a.id);
        const fd = new FormData(); fd.append('subpath', type); fd.append('pins', JSON.stringify(pinnedIds));
        
        try {
            const res = await fetch('/api/godmode/update_pins', { method: 'POST', body: fd, credentials: 'include' });
            if (res.status === 401) { GodUI.evictGod(); return; }
        } catch(e) { console.error("Pin sync failed."); }
    }
};

// --- [삭제 및 생성 UI 유지] ---

const DeleteUI = {
    targetPath: "", timer: null,
    confirm(module, path) {
        this.targetPath = `${module}/${path}`;
        const overlay = document.getElementById('delete-overlay');
        const actions = document.getElementById('delete-actions');
        const input = document.getElementById('delete-otp-input');
        const label = document.getElementById('delete-label');
        const footer = document.getElementById('delete-footer');

        label.innerText = "Will you delete this scroll?";
        actions.style.display = "flex";
        input.style.display = "none";
        footer.style.display = "none";
        input.value = "";
        overlay.style.display = 'flex';
    },
    proceed() {
        document.getElementById('delete-actions').style.display = "none";
        const input = document.getElementById('delete-otp-input');
        document.getElementById('delete-label').innerText = "enter google authenticator code";
        input.style.display = "block";
        document.getElementById('delete-footer').style.display = "block";
        input.focus();

        this.timer = setTimeout(() => this.hide(), 10000);
        input.onkeydown = (e) => { if (e.key === 'Enter') this.execute(); if (e.key === 'Escape') this.hide(); };
    },
    async execute() {
        const otp = document.getElementById('delete-otp-input').value.trim();
        if (!otp) return;
        if (this.timer) clearTimeout(this.timer);
        
        const fd = new FormData(); fd.append('target_path', this.targetPath); fd.append('otp_code', otp);

        try {
            const res = await fetch('/api/godmode/delete', { method: 'POST', body: fd, credentials: 'include' });
            if (res.status === 401) { GodUI.evictGod(); return; }
            if (!res.ok) {
                let errorMsg = "System error during eradication.";
                try { const err = await res.json(); errorMsg = err.detail || err.message || errorMsg; } catch(e) {}
                alert(`[ERROR]: ${errorMsg}`);
                document.getElementById('delete-otp-input').value = ""; 
                this.timer = setTimeout(() => this.hide(), 10000); return;
            }
            
            const data = await res.json();
            if (data.status === 'success') {
                alert(data.message);
                const savedPath = this.targetPath; 
                this.hide(); await GodUI.init(); 
                const parts = savedPath.split('/');
                GodUI.showBrowser(parts[0], parts[1], 'DELETE');
            } else {
                alert(data.message);
                document.getElementById('delete-otp-input').value = ""; 
                this.timer = setTimeout(() => this.hide(), 10000);
            }
        } catch (err) { alert("System error during eradication."); this.hide(); }
    },
    hide() {
        if (this.timer) clearTimeout(this.timer);
        document.getElementById('delete-overlay').style.display = 'none';
        this.targetPath = "";
        const input = document.getElementById('delete-otp-input');
        if(input) input.value = "";
    }
};

const CreateUI = {
    selectedLocation: "",
    open() {
        this.selectedLocation = "";
        document.getElementById('create-step-1').style.display = 'block';
        document.getElementById('create-step-2').style.display = 'none';
        document.getElementById('create-warning').style.opacity = '0';
        document.getElementById('create-index-input').value = "";
        document.getElementById('create-index-input').disabled = false;
        document.querySelector('.create-submit-btn').style.pointerEvents = 'auto';
        document.querySelector('.create-box').classList.remove('ritual-freeze');
        document.getElementById('create-overlay').style.display = 'flex';
    },
    selectLocation(loc) {
        this.selectedLocation = loc;
        document.getElementById('create-step-1').style.display = 'none';
        document.getElementById('create-step-2').style.display = 'block';
        const input = document.getElementById('create-index-input');
        input.focus();
        input.onkeydown = (e) => { if (e.key === 'Enter') this.confirm(); if (e.key === 'Escape') this.goBack(); };
    },
    goBack() {
        this.selectedLocation = "";
        document.getElementById('create-warning').style.opacity = '0';
        document.getElementById('create-index-input').value = "";
        document.getElementById('create-step-2').style.display = 'none';
        document.getElementById('create-step-1').style.display = 'block';
    },
    async confirm() { 
        const indexName = document.getElementById('create-index-input').value.trim();
        const warningEl = document.getElementById('create-warning');
        if (!indexName) return;

        const existingData = GodUI.data.r1[this.selectedLocation] || [];
        if (existingData.some(art => art.id.toLowerCase() === indexName.toLowerCase())) {
            warningEl.innerText = "the same article already exists.";
            warningEl.style.color = "#ff5050"; warningEl.style.opacity = '1';
        } else {
            warningEl.innerText = "manifesting the new scroll...";
            warningEl.style.color = "#3cff8f"; warningEl.style.opacity = '1';
            
            document.getElementById('create-index-input').disabled = true;
            document.querySelector('.create-submit-btn').style.pointerEvents = 'none';
            document.querySelector('.create-box').classList.add('ritual-freeze');

            const fd = new FormData(); fd.append('subpath', this.selectedLocation); fd.append('entry_id', indexName);
            try {
                const res = await fetch('/api/godmode/create', { method: 'POST', body: fd, credentials: 'include' });
                if (res.status === 401) { GodUI.evictGod(); return; }
                if (!res.ok) {
                    let errorMsg = "The system failed to carve the data.";
                    try { const err = await res.json(); errorMsg = err.detail || err.message || errorMsg; } catch(e) {}
                    alert(`[ERROR]: ${errorMsg}`); this.open(); return;
                }
                const data = await res.json();
                if (data.status === 'success') GodUI.goToEditor('r1', `${this.selectedLocation}/${indexName}`, 'en', 'WRITE');
                else { alert(data.message); this.open(); }
            } catch (err) { alert("System network error."); this.open(); }
        }
    },
    hide() { document.getElementById('create-overlay').style.display = 'none'; }
};

GodUI.init();