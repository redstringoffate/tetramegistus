// app/static/mobile/world/rubedo/godmode_lv3/godmode_editor.js

const EditorUI = {
    savedRange: null, 
    activeTd: null,
    
    recentColors: (() => {
        try {
            let colors = JSON.parse(localStorage.getItem('gm_recent_colors'));
            if (Array.isArray(colors) && colors.length > 0) return colors;
        } catch(e) {}
        return ['#ff5050', '#0088ff', '#3cff8f', '#ffff00', '#ff8800', '#9900ff', '#ffffff', '#000001'];
    })(),
    
    editorHistory: [],
    historyStep: -1,
    historyTimeout: null,

    articleTree: null,
    expandedFolders: new Set(),
    activeLinkFolder: null,
    activeLinkFile: null,

    tokenRemaining: 0,
    tokenTimer: null,

    async init() {
        this.bindEvents();
        await this.loadContent(); 
        this.startAutoSave();
        this.updateQuickPaintButton(); 
        
        const now = Date.now();
        let expiry = localStorage.getItem('gm_token_expiry');
        if (!expiry || parseInt(expiry) <= now) {
            expiry = now + 7200 * 1000;
            localStorage.setItem('gm_token_expiry', expiry);
        }
        
        this.tokenRemaining = Math.max(0, Math.floor((parseInt(expiry) - now) / 1000));
        this.startTokenTimer(); 
        
        setTimeout(() => this.saveHistory(), 200); 
    },

    startTokenTimer() {
        this.updateTokenDisplay();
        if (this.tokenTimer) clearInterval(this.tokenTimer);
        this.tokenTimer = setInterval(() => {
            if (this.tokenRemaining > 0) {
                this.tokenRemaining--;
                this.updateTokenDisplay();
            } else {
                clearInterval(this.tokenTimer);
                this.evictGod(); 
            }
        }, 1000);
    },

    updateTokenDisplay() {
        const timerEl = document.getElementById('god-token-timer');
        if (!timerEl) return;
        
        const h = Math.floor(this.tokenRemaining / 3600).toString().padStart(2, '0');
        const m = Math.floor((this.tokenRemaining % 3600) / 60).toString().padStart(2, '0');
        const s = (this.tokenRemaining % 60).toString().padStart(2, '0');
        
        timerEl.innerText = `God Token ${h}:${m}:${s}`;
        
        if (this.tokenRemaining <= 300) timerEl.classList.add('warning');
        else timerEl.classList.remove('warning');
    },

    async extendGodToken() {
        let modal = document.getElementById('token-extend-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'token-extend-modal';
            modal.className = 'gm-modal-overlay';
            modal.innerHTML = `<div class="gm-modal-box" style="text-align:center;"><div style="font-size:1.2rem; color:#00f7ff; animation: tokenExtending 1.5s infinite;">✨ Extending Token...</div></div>`;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';

        try {
            const response = await fetch('/api/godmode/extend_token', { method: 'POST', credentials: 'include' });
            if (!response.ok) throw new Error();
            await new Promise(resolve => setTimeout(resolve, 1200));
            const newExpiry = Date.now() + 7200 * 1000;
            localStorage.setItem('gm_token_expiry', newExpiry);
            this.tokenRemaining = 7200; 
            this.updateTokenDisplay();
            modal.style.display = 'none';
        } catch(e) {
            alert("Failed to extend token.");
            modal.style.display = 'none';
        }
    },

    evictGod() {
        window.location.href = '/world/nigredo';
    },

    saveSelection() {
        const sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const contentArea = document.getElementById('editor-content');
            if (contentArea && contentArea.contains(range.commonAncestorContainer)) {
                this.savedRange = range;
            }
        }
    },

    restoreSelection() {
        if (this.savedRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.savedRange);
        }
    },

    async loadContent() {
        const module = document.getElementById('meta-module').content;
        const path = document.getElementById('meta-path').content;
        const lang = document.getElementById('meta-lang').content;
        try {
            const res = await fetch(`/api/godmode/load?module=${module}&path=${path}&lang=${lang}`, { credentials: 'include' });
            const data = await res.json();
            if (data.status === 'success') {
                document.getElementById('editor-title').innerText = data.title || "";
                document.getElementById('editor-content').innerHTML = data.content || "";
            }
        } catch (e) { console.error("Load failed:", e); }
    },

    openDocInfo() {
        document.getElementById('doc-info-modal').style.display = 'flex';
    },
    
    closeDocInfo() {
        document.getElementById('doc-info-modal').style.display = 'none';
    },

    bindEvents() {
        const titleArea = document.getElementById('editor-title');
        const contentArea = document.getElementById('editor-content');
        
        contentArea.addEventListener('keyup', () => { this.saveSelection(); this.updateToolbarState(); });
        contentArea.addEventListener('touchend', () => { setTimeout(() => { this.saveSelection(); this.updateToolbarState(); }, 100); });
        
        titleArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); contentArea.focus(); }
        });

        contentArea.addEventListener('input', () => {
            clearTimeout(this.historyTimeout);
            this.historyTimeout = setTimeout(() => this.saveHistory(), 400);
        });

        // 모바일 롱프레스(Context Menu) 시 테이블 메뉴 호출
        contentArea.addEventListener('contextmenu', (e) => {
            const td = e.target.closest('td') || e.target.closest('th');
            if (td) {
                e.preventDefault(); 
                EditorUI.showTableContextMenu(td);
            }
        });

        document.addEventListener('click', (e) => {
            if(!e.target.closest('.gm-dropdown-menu') && !e.target.closest('.tool-btn') && !e.target.closest('td')) {
                document.querySelectorAll('.gm-dropdown-menu').forEach(m => m.remove());
            }
        });

        document.addEventListener('selectionchange', () => {
            EditorUI.updateToolbarState();
            const linkBtn = document.getElementById('btn-link');
            if (!linkBtn || !contentArea) return;
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (selection.toString().trim().length > 0 && contentArea.contains(range.commonAncestorContainer)) {
                    linkBtn.classList.remove('tool-disabled');
                    return;
                }
            }
            linkBtn.classList.add('tool-disabled');
        });

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const title = btn.getAttribute('title');
                if (!title) return;
                const cmd = title.toLowerCase();
                
                e.preventDefault();
                EditorUI.restoreSelection();
                
                if (['bold', 'italic', 'underline', 'strikethrough'].includes(cmd)) {
                    document.execCommand(cmd, false, null);
                    document.getElementById('editor-content').focus();
                    EditorUI.saveSelection(); 
                    EditorUI.saveHistory();
                    EditorUI.updateToolbarState(); 
                }
                
                if (cmd.includes('align')) {
                    const alignOptions = [
                        { label: '⬅️ Align Left', cmdVal: 'justifyLeft' },
                        { label: '↔️ Align Center', cmdVal: 'justifyCenter' },
                        { label: '➡️ Align Right', cmdVal: 'justifyRight' }
                    ];
                    EditorUI.showDropdown(alignOptions);
                }

                if (cmd.includes('spacing')) {
                    const spacingOptions = [
                        { label: '1.0 (Compact)', val: '1.0' },
                        { label: '1.5 (Standard)', val: '1.5' },
                        { label: '2.0 (Wide)', val: '2.0' }
                    ];
                    EditorUI.showDropdown(spacingOptions.map(opt => ({
                        label: opt.label,
                        action: () => EditorUI.setLineHeight(opt.val)
                    })));
                }

                if (cmd === 'list') {
                    const listOptions = [
                        { label: '• Bullet List', cmdVal: 'insertUnorderedList' },
                        { label: '1. Number List', cmdVal: 'insertOrderedList' }
                    ];
                    EditorUI.showDropdown(listOptions.map(opt => ({
                        label: opt.label,
                        action: () => {
                            EditorUI.restoreSelection();
                            document.execCommand(opt.cmdVal, false, null);
                            EditorUI.saveHistory();
                        }
                    })));
                }

                if (cmd.includes('text color')) EditorUI.showColorModal('foreColor');
                if (cmd.includes('background color') || cmd.includes('highlight')) EditorUI.showColorModal('hiliteColor');
                if (cmd.includes('special') || cmd.includes('symbol')) EditorUI.showSymbolModal();
                
                if (cmd === 'link') EditorUI.showLinkModal();

                if (cmd === 'insert image') {
                    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
                    input.onchange = async (e) => await EditorUI.uploadAsset(e.target.files[0], 'image'); input.click();
                }
                if (cmd === 'attach file') {
                    const input = document.createElement('input'); input.type = 'file';
                    input.onchange = async (e) => await EditorUI.uploadAsset(e.target.files[0], 'file'); input.click();
                }
                if (cmd.includes('chart')) EditorUI.showChartModal(); 
            });
        });

        document.getElementById('font-family-select').addEventListener('change', (e) => {
            EditorUI.restoreSelection();
            document.execCommand('fontName', false, e.target.value);
            EditorUI.saveHistory();
        });

        document.getElementById('font-size-select').addEventListener('change', (e) => {
            EditorUI.restoreSelection();
            document.execCommand('fontSize', false, '7');
            document.getElementById('editor-content').querySelectorAll('font[size="7"]').forEach(f => {
                f.removeAttribute('size');
                f.style.fontSize = e.target.value;
            });
            EditorUI.saveHistory();
        });

        contentArea.addEventListener('click', (e) => {
            const cellPaintBtn = document.getElementById('btn-cell-paint');
            const quickBtn = document.getElementById('btn-quick-paint');
            if(!cellPaintBtn) return;

            const isCell = e.target.closest('td') || e.target.closest('th');
            if (isCell) {
                cellPaintBtn.style.display = 'inline-block';
                if(this.recentColors.length > 0 && quickBtn) quickBtn.style.display = 'inline-block';
                EditorUI.activeTd = isCell;
            } else {
                cellPaintBtn.style.display = 'none';
                if(quickBtn) quickBtn.style.display = 'none';
            }
        });

        const cellPaintBtn = document.getElementById('btn-cell-paint');
        if (cellPaintBtn) {
            cellPaintBtn.addEventListener('click', () => EditorUI.showColorModal('cellColor'));
        }
    },

    setLineHeight(val) {
        document.execCommand('formatBlock', false, 'div'); 
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        let node = sel.anchorNode;
        if (node.nodeType === 3) node = node.parentElement;
        const block = node.closest('p, div, td, th, li');
        if (block && block.id !== 'editor-content') block.style.lineHeight = val;
        this.saveHistory();
    },

    showDropdown(options) {
        document.querySelectorAll('.gm-dropdown-menu').forEach(m => m.remove());
        const menu = document.createElement('div');
        menu.className = 'gm-dropdown-menu';
        
        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'gm-dropdown-item';
            item.innerText = opt.label;
            item.onclick = () => { 
                if(opt.cmdVal) {
                    EditorUI.restoreSelection();
                    document.execCommand(opt.cmdVal, false, null);
                    EditorUI.saveHistory();
                } else if(opt.action) {
                    opt.action();
                }
                menu.remove(); 
            };
            menu.appendChild(item);
        });
        document.body.appendChild(menu);
    },

    async showLinkModal() {
        let modal = document.getElementById('link-ritual-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'link-ritual-modal';
        modal.className = 'gm-modal-overlay';
        document.body.appendChild(modal);

        modal.innerHTML = `
            <div class="gm-modal-box" style="display:flex; flex-direction:column;">
                <div style="font-size:1.1rem; margin-bottom:15px; text-align:center; color:#0088ff; font-weight:bold;">🔗 Hyperlink</div>
                <div id="link-tree-container" style="flex:1; overflow-y:auto; background:#000; border:1px solid #555; padding:10px; border-radius:4px; margin-bottom:15px; min-height: 250px;">
                    <div style="text-align:center; color:#555; margin-top:20px;">Scanning...</div>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <button id="link-cancel" style="background:transparent; border:1px solid #ff5050; color:#ff5050; padding:8px 15px; border-radius:4px;">Cancel</button>
                    <button id="link-confirm" style="background:#0088ff; border:none; color:#fff; padding:8px 15px; font-weight:bold; border-radius:4px;">Apply</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';

        document.getElementById('link-cancel').onclick = () => modal.style.display = 'none';
        document.getElementById('link-confirm').onclick = () => {
            if (this.activeLinkFile) {
                this.restoreSelection();
                document.execCommand('createLink', false, this.activeLinkFile);
                this.saveHistory(); 
                modal.style.display = 'none';
            }
        };

        if (!this.articleTree) {
            try {
                const res = await fetch('/api/godmode/tree', { credentials: 'include' });
                this.articleTree = await res.json();
            } catch (e) { return; }
        }
        
        this.expandedFolders = new Set(['r1', 'r2']); 
        this.activeLinkFolder = null;
        this.activeLinkFile = null;
        this.renderLinkTree();
    },

    renderLinkTree() {
        const container = document.getElementById('link-tree-container');
        if (!container || !this.articleTree) return;
        
        let html = '';
        const t = this.articleTree;
        const fCls = (path) => `link-folder ${this.activeLinkFolder === path ? 'active' : ''}`;
        const iCls = (url) => `link-file ${this.activeLinkFile === url ? 'active' : ''}`;

        html += `<div class="${fCls('r1')}" data-toggle="r1">📁 R1</div>`;
        if (this.expandedFolders.has('r1')) {
            html += `<div class="link-indent">`;
            html += `<div class="${fCls('r1/archivum')}" data-toggle="r1/archivum">📁 Archivum</div>`;
            if (this.expandedFolders.has('r1/archivum') && t.r1.archivum) {
                html += `<div class="link-indent">`;
                t.r1.archivum.forEach(f => {
                    const url = `/world/rubedo?module=r1&path=archivum/${f.id}`;
                    html += `<div class="${iCls(url)}" data-url="${url}">📄 ${f.title || f.id}</div>`;
                });
                html += `</div>`;
            }

            if (t.r1.hermeticum) {
                t.r1.hermeticum.forEach(f => {
                    const url = `/world/rubedo?module=r1&path=hermeticum/${f.id}`;
                    html += `<div class="${iCls(url)}" data-url="${url}">📄 ${f.title || f.id}</div>`;
                });
            }
            html += `</div>`;
        }
        container.innerHTML = html;

        container.querySelectorAll('.link-folder').forEach(el => {
            el.onclick = () => {
                const path = el.getAttribute('data-toggle');
                if (this.expandedFolders.has(path)) this.expandedFolders.delete(path);
                else this.expandedFolders.add(path);
                this.activeLinkFolder = path;
                this.renderLinkTree(); 
            };
        });

        container.querySelectorAll('.link-file').forEach(el => {
            el.onclick = () => {
                this.activeLinkFile = el.getAttribute('data-url');
                this.renderLinkTree(); 
            };
        });
    },

    // 🚀 [복구]: 4원소 팔레트 완벽 부활 및 모달 로직
    showColorModal(mode) {
        let modal = document.getElementById('color-picker-modal');
        if (modal) modal.remove(); 

        modal = document.createElement('div');
        modal.id = 'color-picker-modal';
        modal.className = 'gm-modal-overlay';
        document.body.appendChild(modal);

        const renderPalettes = () => this.recentColors.map(c => `<div class="color-swatch" style="background-color:${c};" data-color="${c}"></div>`).join('');
        const title = mode === 'foreColor' ? 'Text Color' : (mode === 'hiliteColor' ? 'Background Color' : 'Cell Paint');

        modal.innerHTML = `
            <div class="gm-modal-box">
                <div style="font-size:1.1rem; margin-bottom:15px; text-align:center; color:#0088ff; font-weight:bold;">🎨 ${title}</div>
                <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center;">
                    <input type="color" id="native-color" value="#ffffff" style="width:40px; height:40px; padding:0; border:none; background:none;">
                    <input type="text" id="hex-input" placeholder="#FFFFFF" style="width:40%; background:#000; border:1px solid #555; color:#fff; padding:8px; text-align:center;">
                    <button id="color-confirm" class="color-confirm-btn">Apply</button>
                </div>
                <div style="font-size:0.8rem; color:#aaa; margin-bottom:8px;">Recent Palette</div>
                <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:8px; margin-bottom:15px;" id="color-grid">
                    ${renderPalettes()}
                </div>
                
                <hr style="border:0; border-top:1px solid #0088ff; margin:15px 0; opacity:0.5;">
                <div style="font-size:0.8rem; color:#aaa; margin-bottom:8px;">Alchemical Elements</div>
                <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                    <div class="color-swatch" style="background-color:#FFB8AA;" data-color="#FFB8AA" title="Fire"></div>
                    <div class="color-swatch" style="background-color:#FEFF8E;" data-color="#FEFF8E" title="Earth"></div>
                    <div class="color-swatch" style="background-color:#A7F6FC;" data-color="#A7F6FC" title="Water"></div>
                    <div class="color-swatch" style="background-color:#f5f5f5;" data-color="#f5f5f5" title="Air"></div>
                </div>

                <button id="color-cancel" class="color-cancel-btn">Close</button>
            </div>
        `;
        modal.style.display = 'flex';

        const nativePicker = document.getElementById('native-color');
        const hexInput = document.getElementById('hex-input');

        nativePicker.addEventListener('input', (e) => { hexInput.value = e.target.value.toUpperCase(); });
        
        // 🚀 Recent Palette 및 Alchemical Elements 색상 클릭 시 Hex 창에 동기화
        modal.querySelectorAll('.color-swatch').forEach(sw => {
            sw.onclick = () => { hexInput.value = sw.getAttribute('data-color').toUpperCase(); };
        });

        document.getElementById('color-confirm').onclick = () => {
            let hex = hexInput.value.trim();
            if (!hex.startsWith('#')) hex = '#' + hex;
            if (hex.length !== 7) return; 
            if (hex === '#000000') hex = '#000001'; 
            
            this.recentColors = [hex, ...this.recentColors.filter(c => c.toLowerCase() !== hex.toLowerCase())].slice(0, 8);
            localStorage.setItem('gm_recent_colors', JSON.stringify(this.recentColors));

            EditorUI.restoreSelection();
            if (mode === 'cellColor' && EditorUI.activeTd) {
                EditorUI.activeTd.style.backgroundColor = hex;
            } else {
                document.execCommand(mode, false, hex);
            }
            this.updateQuickPaintButton(); 
            this.saveHistory(); 
            modal.style.display = 'none';
        };
        document.getElementById('color-cancel').onclick = () => modal.style.display = 'none';
    },

    showSymbolModal() {
        let modal = document.getElementById('symbol-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'symbol-modal';
        modal.className = 'gm-modal-overlay';
        document.body.appendChild(modal);
        
        const categories = [
            { title: "🌌 Zodiac", symbols: ['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎'] },
            { title: "🪐 Planets", symbols: ['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇','☊','☋'] },
            { title: "🔮 Alchemy", symbols: ['🜂','🜄','🜁','🜃','🜔','🜍','※','☆','★','○','●','◎','△','▲','▽','▼'] }
        ];
        
        let html = `<div style="font-size:1.1rem; margin-bottom:10px; text-align:center; color:#0088ff; font-weight:bold;">✨ Symbols</div>`;
        categories.forEach(cat => {
            html += `<div class="sym-category-title" style="margin: 10px 0 5px 0;">${cat.title}</div>
                     <div class="sym-grid">${cat.symbols.map(s => `<div class="sym-btn">${s}</div>`).join('')}</div>`;
        });

        modal.innerHTML = `
            <div class="gm-modal-box">
                ${html}
                <button id="sym-close" class="color-cancel-btn" style="margin-top:20px;">Close</button>
            </div>
        `;
        modal.style.display = 'flex';
        document.getElementById('sym-close').onclick = () => modal.style.display = 'none';
        
        modal.querySelector('.gm-modal-box').addEventListener('click', (e) => {
            if(e.target.classList.contains('sym-btn')) {
                EditorUI.restoreSelection();
                document.execCommand('insertText', false, e.target.innerText);
                this.saveHistory(); 
                modal.style.display = 'none';
            }
        });
    },

    showTableContextMenu(td) {
        this.activeTd = td; 
        document.querySelectorAll('.gm-dropdown-menu').forEach(m => m.remove());
        
        const menu = document.createElement('div');
        menu.className = 'gm-dropdown-menu';
        menu.innerHTML = `
            <div class="gm-dropdown-item" style="color:#00f7ff;" onclick="EditorUI.tableOp('row-above')">⬆️ Add Row Above</div>
            <div class="gm-dropdown-item" style="color:#00f7ff;" onclick="EditorUI.tableOp('row-below')">⬇️ Add Row Below</div>
            <div class="gm-dropdown-item" style="color:#3cff8f;" onclick="EditorUI.tableOp('col-left')">⬅️ Add Col Left</div>
            <div class="gm-dropdown-item" style="color:#3cff8f;" onclick="EditorUI.tableOp('col-right')">➡️ Add Col Right</div>
            <div style="height:1px; background:#333; margin:5px 0;"></div>
            <div class="gm-dropdown-item" style="color:#ff5050;" onclick="EditorUI.tableOp('del-row')">❌ Delete Row</div>
            <div class="gm-dropdown-item" style="color:#ff5050;" onclick="EditorUI.tableOp('del-col')">❌ Delete Col</div>
        `;
        document.body.appendChild(menu);
    },

    tableOp(action) {
        const td = this.activeTd;
        if (!td) return;
        const tr = td.parentElement;
        const table = tr.closest('table');
        const tbody = table.querySelector('tbody') || table;
        const cIdx = Array.from(tr.children).indexOf(td); 

        if (action === 'row-above' || action === 'row-below') {
            const newTr = document.createElement('tr');
            Array.from(tr.children).forEach(() => {
                const newTd = document.createElement('td');
                newTd.style.cssText = td.style.cssText; newTd.innerHTML = '<br>'; 
                newTr.appendChild(newTd);
            });
            if (action === 'row-above') tr.before(newTr); else tr.after(newTr);
        }
        
        if (action === 'col-left' || action === 'col-right') {
            Array.from(tbody.children).forEach(row => {
                const newTd = document.createElement('td');
                newTd.style.cssText = td.style.cssText; newTd.innerHTML = '<br>';
                const targetTd = row.children[cIdx] || row.lastElementChild;
                if (targetTd) {
                    if (action === 'col-left') targetTd.before(newTd); else targetTd.after(newTd);
                }
            });
        }

        if (action === 'del-row') { tr.remove(); if (tbody.children.length === 0) table.remove(); }
        if (action === 'del-col') {
            Array.from(tbody.children).forEach(row => {
                const targetTd = row.children[cIdx];
                if (targetTd) targetTd.remove();
            });
            if (tr.children.length === 0) table.remove();
        }
        EditorUI.saveHistory(); 
    },

    showChartModal() {
        let modal = document.getElementById('chart-ritual-modal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'chart-ritual-modal';
        modal.className = 'gm-modal-overlay';
        modal.innerHTML = `
            <div class="gm-modal-box">
                <div style="font-size:1.1rem; margin-bottom:20px; text-align:center; color:#0088ff; font-weight:bold;">📊 Insert Table</div>
                <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                    <label style="color:#aaa;">Columns:</label>
                    <input type="number" id="chart-cols" value="3" min="1" max="10" style="width:60px; background:#000; border:1px solid #555; color:#fff; padding:5px; text-align:center;">
                </div>
                <div style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                    <label style="color:#aaa;">Rows:</label>
                    <input type="number" id="chart-rows" value="3" min="1" max="20" style="width:60px; background:#000; border:1px solid #555; color:#fff; padding:5px; text-align:center;">
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <button id="chart-cancel" class="color-cancel-btn" style="width:45%; padding:10px;">Cancel</button>
                    <button id="chart-confirm" class="color-confirm-btn" style="width:45%; padding:10px;">Insert</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('chart-cancel').onclick = () => modal.style.display = 'none';
        document.getElementById('chart-confirm').onclick = () => {
            const cols = parseInt(document.getElementById('chart-cols').value) || 3;
            const rows = parseInt(document.getElementById('chart-rows').value) || 3;
            EditorUI.restoreSelection(); 
            
            let tableHtml = `<br><table border="1" style="width:100%; border-collapse:collapse; margin:15px 0;"><tbody>`;
            for(let r=0; r<rows; r++) {
                tableHtml += '<tr>';
                for(let c=0; c<cols; c++) tableHtml += `<td style="padding:10px; border:1px solid #ccc;"><br></td>`;
                tableHtml += '</tr>';
            }
            tableHtml += `</tbody></table><p><br></p>`;
            document.execCommand('insertHTML', false, tableHtml);
            this.saveHistory(); 
            modal.style.display = 'none';
        };
        modal.style.display = 'flex';
    },

    async switchLang(targetLang) {
        const currentLang = document.getElementById('meta-lang').content;
        if (currentLang === targetLang) return; 
        document.getElementById('save-status').innerText = 'Saving...';
        await this.saveProgress(false);
        const module = document.getElementById('meta-module').content;
        const path = document.getElementById('meta-path').content;
        window.location.href = `/world/rubedo/godmode_lv3/editor?module=${module}&path=${path}&lang=${targetLang}&mode=EDIT`;
    },

    async manualSave() {
        document.getElementById('save-status').innerText = 'Saving...';
        await this.saveProgress(false);
        document.getElementById('save-status').innerText = 'Saved ' + new Date().toLocaleTimeString();
    },

    showModal(text, onYes, onNo) {
        document.getElementById('modal-text').innerText = text;
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('modal-btn-yes').onclick = () => { overlay.style.display = 'none'; onYes(); };
        document.getElementById('modal-btn-no').onclick = () => { overlay.style.display = 'none'; onNo(); };
        overlay.style.display = 'flex';
    },

    promptReturn() {
        this.showModal("Will you save your progress?", 
            async () => { await this.saveProgress(false); window.location.href = '/world/rubedo/godmode_lv3'; }, 
            () => { window.location.href = '/world/rubedo/godmode_lv3'; }
        );
    },

    promptPost() {
        this.showModal("Will you post this scroll?", 
            async () => { await this.saveProgress(true); setTimeout(() => window.location.href = '/world/rubedo/godmode_lv3', 500); },
            () => {}
        );
    },

    startAutoSave() {
        setInterval(() => {
            document.getElementById('save-status').innerText = 'Saving...';
            this.saveProgress(false).then(() => {
                document.getElementById('save-status').innerText = new Date().toLocaleTimeString();
            });
        }, 60000); 
    },

    isSaving: false,

    async saveProgress(isPost) {
        if (this.isSaving) return false;
        this.isSaving = true;

        const title = document.getElementById('editor-title').innerText.trim();
        const content = document.getElementById('editor-content').innerHTML;
        const module = document.getElementById('meta-module').content;
        const path = document.getElementById('meta-path').content;
        const lang = document.getElementById('meta-lang').content;

        const fd = new FormData();
        fd.append('module', module); fd.append('path', path); fd.append('lang', lang);
        fd.append('title', title); fd.append('content', content); fd.append('is_post', isPost);

        try {
            const res = await fetch('/api/godmode/save', { method: 'POST', body: fd, credentials: 'include' });
            this.isSaving = false; 
            return res.ok;
        } catch (e) { 
            this.isSaving = false; 
            return false; 
        }
    },

    async uploadAsset(file, type) {
        if (!file) return;
        const module = document.getElementById('meta-module').content;
        const path = document.getElementById('meta-path').content;
        const fd = new FormData();
        fd.append('module', module); fd.append('path', path); fd.append('file', file);

        try {
            const res = await fetch('/api/godmode/upload', { method: 'POST', body: fd, credentials: 'include' });
            const data = await res.json();
            if (data.status === 'success') {
                if (type === 'image') {
                    const imgHtml = `<img src="${data.url}" alt="image" style="max-width: 100%; border-radius: 4px; margin: 10px 0;">`;
                    document.execCommand('insertHTML', false, imgHtml);
                } else {
                    const fileHtml = `<a href="${data.url}" target="_blank" style="color:#0088ff; margin:5px 0;">📁 ${data.name}</a>`;
                    document.execCommand('insertHTML', false, fileHtml);
                }
                this.saveHistory(); 
            } else alert("Upload failed: " + data.message);
        } catch (err) {}
    },

    updateQuickPaintButton() {
        const quickBtn = document.getElementById('btn-quick-paint');
        if (!quickBtn || this.recentColors.length === 0) return;
        const lastColor = this.recentColors[0]; 
        quickBtn.style.backgroundColor = lastColor;
        
        quickBtn.onclick = () => {
            if (this.activeTd) {
                this.activeTd.style.backgroundColor = lastColor;
                const cellPaintBtn = document.getElementById('btn-cell-paint');
                if (cellPaintBtn) cellPaintBtn.style.display = 'none';
                quickBtn.style.display = 'none';
                this.saveHistory();
            }
        };
    },

    updateToolbarState() {
        const commandMap = { 'Bold': 'bold', 'Italic': 'italic', 'Underline': 'underline', 'Strikethrough': 'strikethrough'};
        const contentArea = document.getElementById('editor-content');
        if (!contentArea) return;
        
        const sel = window.getSelection();
        if (sel.rangeCount > 0 && contentArea.contains(sel.getRangeAt(0).commonAncestorContainer)) {
            for (const [title, cmd] of Object.entries(commandMap)) {
                const btn = document.querySelector(`.tool-btn[title="${title}"]`);
                if (btn) {
                    try {
                        if (document.queryCommandState(cmd)) btn.classList.add('active-tool');
                        else btn.classList.remove('active-tool');
                    } catch (e) {}
                }
            }
        }
    },

    saveHistory() {
        const contentArea = document.getElementById('editor-content');
        if (!contentArea) return;
        const content = contentArea.innerHTML;
        if (this.historyStep >= 0 && this.editorHistory[this.historyStep] === content) return;
        if (this.historyStep < this.editorHistory.length - 1) this.editorHistory = this.editorHistory.slice(0, this.historyStep + 1);
        this.editorHistory.push(content);
        if (this.editorHistory.length > 50) this.editorHistory.shift(); 
        else this.historyStep++;
    },

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            document.getElementById('editor-content').innerHTML = this.editorHistory[this.historyStep];
            this.updateToolbarState(); 
        }
    },

    redo() {
        if (this.historyStep < this.editorHistory.length - 1) {
            this.historyStep++;
            document.getElementById('editor-content').innerHTML = this.editorHistory[this.historyStep];
            this.updateToolbarState(); 
        }
    }
}; 

window.onload = () => EditorUI.init();