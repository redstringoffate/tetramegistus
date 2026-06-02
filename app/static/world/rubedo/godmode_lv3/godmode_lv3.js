// app/static/world/rubedo/godmode_lv3/godmode_lv3.js

const GodUI = {
    data: null,
    
    // 🚀 God Token 방어막 변수
    tokenRemaining: 0,
    evictionTimer: null,

    async init() {
        try {
            // 백엔드 트리 데이터 요청 (쿠키 동봉)
            const res = await fetch('/api/godmode/tree', { credentials: 'include' });
            
            // 🚨 [수복]: 무조건 쫒아내지 말고, 진짜 인증 만료(401)일 때만 추방!
            if (res.status === 401) {
                this.evictGod(); 
                return;
            }
            
            if (!res.ok) {
                console.error("Failed to load tree data.");
                return;
            }
            
            this.data = await res.json();
            this.populateSidebar(); 
            
            // 프론트 타이머 동기화
            const now = Date.now();
            let expiry = localStorage.getItem('gm_token_expiry');
            if (!expiry || parseInt(expiry) <= now) {
                expiry = now + 7200 * 1000;
                localStorage.setItem('gm_token_expiry', expiry);
            }
            
            // 보이지 않는 추방 타이머 가동
            this.startHiddenEvictionTimer();
            
        } catch (e) {
            console.error("The void is silent:", e);
        }
    },

    // 보이지 않는 추방 타이머 엔진
    startHiddenEvictionTimer() {
        const now = Date.now();
        let expiry = localStorage.getItem('gm_token_expiry');
        
        this.tokenRemaining = Math.floor((parseInt(expiry) - now) / 1000);
        
        if (this.evictionTimer) clearInterval(this.evictionTimer);
        
        this.evictionTimer = setInterval(() => {
            if (this.tokenRemaining > 0) {
                this.tokenRemaining--;
            } else {
                clearInterval(this.evictionTimer);
                this.evictGod(); // 만료 시 강제 추방
            }
        }, 1000);
    },

    // 강제 추방 로직 (Nigredo로 쫓아냄)
    evictGod() {
        let modal = document.getElementById('token-evict-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'token-evict-modal';
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:99999;';
            modal.innerHTML = `
                <div style="background:#111; width: 320px; text-align:center; padding: 40px 20px; border: 1px solid #ff5050; border-radius: 8px; box-shadow: 0 0 20px rgba(255,80,80,0.4); font-family: 'Cascadia Code', Consolas, monospace;">
                    <div style="font-size:1.5rem; color:#ff5050; font-weight:bold; margin-bottom:15px; animation: pulseWarning 1s infinite;">
                        💀 Evicting...
                    </div>
                    <div style="color:#aaa; font-size:0.9rem;">Your connection to the void has been severed.</div>
                </div>
            `;
            const style = document.createElement('style');
            style.innerHTML = `@keyframes pulseWarning { 0% { opacity: 1; text-shadow: 0 0 5px rgba(255, 80, 80, 0.5); } 50% { opacity: 0.5; text-shadow: none; } 100% { opacity: 1; text-shadow: 0 0 5px rgba(255, 80, 80, 0.5); } }`;
            document.head.appendChild(style);
            
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';

        // 2초 뒤에 Nigredo 홈으로 강제 리다이렉트
        setTimeout(() => {
            window.location.href = '/world/nigredo';
        }, 2000);
    },

    // R2 Symbol 좌측 사이드바 렌더링
    populateSidebar() {
        const sub = document.getElementById('r2-symbol-sub');
        if (!sub || !this.data || !this.data.r2.symbol) return;
        
        const zodiacOrder = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
        
        const sidebarHTML = zodiacOrder
            .filter(sign => this.data.r2.symbol.hasOwnProperty(sign.toLowerCase())) 
            .map(sign => {
                const upperSign = sign.toUpperCase();
                return `<div class="tree-folder" onclick="GodUI.showBrowser('r2', '${sign}')">📁 ${upperSign}</div>`;
            })
            .join('');

        sub.innerHTML = sidebarHTML;
    },

    toggleEdit() {
        const tree = document.getElementById('edit-tree');
        if(tree) tree.style.display = tree.style.display === 'none' ? 'block' : 'none';
    },

    toggleDelete() {
        const tree = document.getElementById('delete-tree');
        if(tree) tree.style.display = tree.style.display === 'none' ? 'block' : 'none';
    },

    toggleFolder(id) {
        const el = document.getElementById(id);
        if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    },

    // 우측 브라우저 렌더링
    showBrowser(module, subPath, mode = 'EDIT') {
        const main = document.getElementById('editor-zone');
        let articles = [];

        if (module === 'r1') {
            articles = subPath === 'archivum' ? [...this.data.r1.archivum] : [...this.data.r1.hermeticum];
        } else if (module === 'r2') {
            articles = subPath === 'sign' ? [...this.data.r2.sign] : (this.data.r2.symbol[subPath] ? [...this.data.r2.symbol[subPath]] : []);
        }

        const modeColor = mode === 'DELETE' ? '#ff5050' : '#3cff8f';
        const headerText = `${module.toUpperCase()} | ${subPath.toUpperCase()} <span style="color:${modeColor}; font-size:0.6em; margin-left: 10px;">[${mode}]</span>`;

        if (!articles || articles.length === 0) {
            main.innerHTML = `<div class="browser-header">${headerText}</div><div class="tree-empty" style="color: #666;">[ the void is empty ]</div>`;
            return;
        }

        if (module === 'r2' && subPath === 'sign') {
            const zodiacOrder = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
            articles.sort((a, b) => {
                let idxA = zodiacOrder.indexOf(a.id.toLowerCase());
                let idxB = zodiacOrder.indexOf(b.id.toLowerCase());
                if (idxA === -1) idxA = 999;
                if (idxB === -1) idxB = 999;
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

        main.innerHTML = `
            <div class="browser-header">${headerText}</div>
            <div class="browser-list">${listHTML}</div>
        `;
    },

    toggleLangs(uid) {
        const el = document.getElementById(`langs-${uid}`);
        if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    },

    goToEditor(module, path, lang, mode) {
        window.location.href = `/world/rubedo/godmode_lv3/editor?module=${module}&path=${path}&lang=${lang}&mode=${mode}`;
    }
};

const DeleteUI = {
    targetPath: "",
    timer: null,

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
        const label = document.getElementById('delete-label');
        const footer = document.getElementById('delete-footer');
        
        label.innerText = "enter google authenticator code";
        input.style.display = "block";
        footer.style.display = "block";
        input.focus();

        this.timer = setTimeout(() => {
            console.warn("[SYSTEM]: Deletion aborted due to silence.");
            this.hide();
        }, 10000);

        input.onkeydown = (e) => {
            if (e.key === 'Enter') this.execute();
            if (e.key === 'Escape') this.hide();
        };
    },

    async execute() {
        const otp = document.getElementById('delete-otp-input').value.trim();
        if (!otp) return;

        if (this.timer) clearTimeout(this.timer);
        
        const fd = new FormData();
        fd.append('target_path', this.targetPath);
        fd.append('otp_code', otp);

        try {
            const res = await fetch('/api/godmode/delete', { method: 'POST', body: fd, credentials: 'include' });
            
            // 🚨 [수복]: 401 권한 에러일 때만 쫒아냄!
            if (res.status === 401) { 
                GodUI.evictGod(); 
                return; 
            }
            
            // 기타 서버 에러(500)나 잘못된 요청(400)은 추방하지 않고 팝업으로 원인 안내
            if (!res.ok) {
                let errorMsg = "System error during eradication.";
                try {
                    const err = await res.json();
                    errorMsg = err.detail || err.message || errorMsg;
                } catch(e) {}
                
                alert(`[ERROR]: ${errorMsg}`);
                
                // 입력창 비우고 다시 타이머 가동 (쫓아내지 않음)
                document.getElementById('delete-otp-input').value = ""; 
                this.timer = setTimeout(() => {
                    this.hide();
                }, 10000);
                return;
            }
            
            const data = await res.json();

            if (data.status === 'success') {
                alert(data.message);

                const savedPath = this.targetPath; 
                this.hide();
                await GodUI.init(); 
                
                const parts = savedPath.split('/');
                const module = parts[0];
                const subPath = parts[1]; 
                
                GodUI.showBrowser(module, subPath, 'DELETE');
            } else {
                alert(data.message);
                document.getElementById('delete-otp-input').value = ""; 
                
                this.timer = setTimeout(() => {
                    this.hide();
                }, 10000);
            }
        } catch (err) {
            console.error("Eradication failed:", err);
            alert("System error during eradication.");
            this.hide();
        }
    },

    hide() {
        if (this.timer) clearTimeout(this.timer);
        document.getElementById('delete-overlay').style.display = 'none';
        this.targetPath = "";
        const input = document.getElementById('delete-otp-input');
        if(input) input.value = "";
    }
};

GodUI.init();

const CreateUI = {
    selectedLocation: "",

    open() {
        this.selectedLocation = "";
        document.getElementById('create-step-1').style.display = 'block';
        document.getElementById('create-step-2').style.display = 'none';
        document.getElementById('create-warning').style.opacity = '0';
        
        const input = document.getElementById('create-index-input');
        const submitBtn = document.querySelector('.create-submit-btn');
        
        input.value = "";
        
        input.disabled = false;
        submitBtn.style.pointerEvents = 'auto';
        document.body.style.cursor = 'default';
        const createBox = document.querySelector('.create-box');
        if(createBox) createBox.classList.remove('ritual-freeze');

        document.getElementById('create-overlay').style.display = 'flex';
    },

    selectLocation(loc) {
        this.selectedLocation = loc;
        document.getElementById('create-step-1').style.display = 'none';
        document.getElementById('create-step-2').style.display = 'block';
        
        const input = document.getElementById('create-index-input');
        input.focus();

        input.onkeydown = (e) => {
            if (e.key === 'Enter') this.confirm();
            if (e.key === 'Escape') this.goBack();
        };
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
        const isDuplicate = existingData.some(art => art.id.toLowerCase() === indexName.toLowerCase());

        if (isDuplicate) {
            warningEl.innerText = "the same article already exists.";
            warningEl.style.color = "#ff5050";
            warningEl.style.opacity = '1';
        } else {
            warningEl.innerText = "manifesting the new scroll...";
            warningEl.style.color = "#3cff8f";
            warningEl.style.opacity = '1';
            
            const input = document.getElementById('create-index-input');
            const submitBtn = document.querySelector('.create-submit-btn');
            input.disabled = true;
            submitBtn.style.pointerEvents = 'none';
            document.body.style.cursor = 'wait';
            document.querySelector('.create-box').classList.add('ritual-freeze');

            const fd = new FormData();
            fd.append('subpath', this.selectedLocation);
            fd.append('entry_id', indexName);

            try {
                const res = await fetch('/api/godmode/create', { method: 'POST', body: fd, credentials: 'include' });
                
                // 🚨 [수복]: 401 권한 에러일 때만 쫒아냄!
                if (res.status === 401) { 
                    GodUI.evictGod(); 
                    return; 
                }

                if (!res.ok) {
                    let errorMsg = "The system failed to carve the data.";
                    try {
                        const err = await res.json();
                        errorMsg = err.detail || err.message || errorMsg;
                    } catch(e) {}
                    
                    alert(`[ERROR]: ${errorMsg}`);
                    this.open(); 
                    return;
                }
                
                const data = await res.json();

                if (data.status === 'success') {
                    GodUI.goToEditor('r1', `${this.selectedLocation}/${indexName}`, 'en', 'WRITE');
                } else {
                    alert(data.message);
                    this.open(); 
                }
            } catch (err) {
                console.error("Creation failed:", err);
                alert("System network error.");
                this.open();
            }
        }
    },

    hide() {
        document.getElementById('create-overlay').style.display = 'none';
    }
};

// =========================================
// [ Lv3: Pin Management System ]
// =========================================
const PinUI = {
    targetUndo: null,
    currentAddType: null,
    draggedRow: null,

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

        let pins = GodUI.data.r1[type]
            .filter(a => a.pinned)
            .sort((a, b) => (a.pin_order || 0) - (b.pin_order || 0));

        countEl.innerText = pins.length;
        btnEl.disabled = pins.length >= 5;

        listEl.innerHTML = pins.map((p, idx) => `
            <div class="pin-item" draggable="true" data-id="${p.id}" data-type="${type}">
                <span class="pin-drag-handle">＝</span>
                <span class="pin-title" title="${p.title || p.id}">${p.title || p.id}</span>
                <span class="pin-delete" onclick="PinUI.askUndo('${type}', '${p.id}')">✖</span>
            </div>
        `).join('');

        this.bindDragEvents(listEl, type);
    },

    bindDragEvents(listEl, type) {
        const items = listEl.querySelectorAll('.pin-item');
        items.forEach(item => {
            item.addEventListener('dragstart', () => {
                this.draggedRow = item;
                setTimeout(() => item.style.opacity = '0.4', 0);
            });
            
            item.addEventListener('dragend', () => {
                setTimeout(() => {
                    this.draggedRow.style.opacity = '1';
                    this.draggedRow = null;
                    this.saveOrder(type); 
                }, 0);
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(listEl, e.clientY);
                if (afterElement == null) {
                    listEl.appendChild(this.draggedRow);
                } else {
                    listEl.insertBefore(this.draggedRow, afterElement);
                }
            });
        });
    },

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.pin-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else { return closest; }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    async saveOrder(type) {
        const listEl = document.getElementById(`pin-list-${type}`);
        const newIds = [...listEl.querySelectorAll('.pin-item')].map(el => el.getAttribute('data-id'));
        
        newIds.forEach((id, idx) => {
            const target = GodUI.data.r1[type].find(a => a.id === id);
            if(target) target.pin_order = idx;
        });

        await this.syncBackend(type);
    },

    openAddModal(type) {
        if (GodUI.data.r1[type].filter(a => a.pinned).length >= 5) return;
        this.currentAddType = type;
        const listEl = document.getElementById('pin-search-list');
        
        const unpinned = GodUI.data.r1[type].filter(a => !a.pinned);
        
        if (unpinned.length === 0) {
            listEl.innerHTML = `<div style="color:#555; text-align:center; padding:20px;">the void is empty.</div>`;
        } else {
            listEl.innerHTML = unpinned.map(p => `
                <div class="pin-search-item" onclick="PinUI.addPin('${p.id}')">📄 ${p.title || p.id}</div>
            `).join('');
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
        const pinnedIds = GodUI.data.r1[type].filter(a => a.pinned)
                                             .sort((a,b) => a.pin_order - b.pin_order)
                                             .map(a => a.id);
        const fd = new FormData();
        fd.append('subpath', type);
        fd.append('pins', JSON.stringify(pinnedIds));
        
        try {
            const res = await fetch('/api/godmode/update_pins', { method: 'POST', body: fd, credentials: 'include' });
            // 🚨 [수복]: 여기도 마찬가지로 401일 때만 추방
            if (res.status === 401) { GodUI.evictGod(); return; }
        } catch(e) { console.error("Pin sync failed."); }
    }
};