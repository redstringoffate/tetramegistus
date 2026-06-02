// app/static/world/rubedo/godmode_lv3/godmode_editor.js

const EditorUI = {
    savedRange: null, 
    activeTd: null,
    isDragging: false,
    startTd: null,
    
    recentColors: (() => {
        try {
            let colors = JSON.parse(localStorage.getItem('gm_recent_colors'));
            if (Array.isArray(colors) && colors.length > 0) return colors;
        } catch(e) { console.warn("Corrupted color cache cleared."); }
        return ['#ff5050', '#0088ff', '#3cff8f', '#ffff00', '#ff8800', '#9900ff', '#ffffff', '#000001'];
    })(),
    
    editorHistory: [],
    historyStep: -1,
    historyTimeout: null,

    isResizing: false,
    resizeTarget: null,
    startCoords: { x: 0, y: 0, w: 0, h: 0 },

    articleTree: null,
    expandedFolders: new Set(),
    activeLinkFolder: null,
    activeLinkFile: null,

    // God Token 상태 변수
    tokenRemaining: 0,
    tokenTimer: null,
    linkTooltip: null, 

    async init() {
        let tooltip = document.getElementById('gm-link-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'gm-link-tooltip';
            tooltip.style.cssText = 'position:absolute; display:none; background:#111; border:1px solid #0088ff; color:#00f7ff; padding:6px 12px; border-radius:6px; font-family:"Cascadia Code", monospace; font-size:12px; z-index:10000; pointer-events:none; box-shadow:0 4px 15px rgba(0,0,0,0.8); white-space:nowrap; transition: opacity 0.1s ease; opacity:0;';
            document.body.appendChild(tooltip);
        }
        this.linkTooltip = tooltip;

        this.bindEvents();
        await this.loadContent(); 
        this.startAutoSave();
        this.updateQuickPaintButton(); 
        
        // 🚀 [신규] 진짜 절대시간 타이머 엔진 세팅
        const now = Date.now();
        let expiry = localStorage.getItem('gm_token_expiry');
        
        // expiry 정보가 없거나, 이미 과거 시간인데도 이 페이지가 열렸다면
        // 백엔드에서 갓 토큰을 새로 줬다는 뜻이므로 시간을 2시간 뒤로 세팅함
        if (!expiry || parseInt(expiry) <= now) {
            expiry = now + 7200 * 1000;
            localStorage.setItem('gm_token_expiry', expiry);
        }
        
        // 남은 시간(초) 정확하게 계산
        this.tokenRemaining = Math.floor((parseInt(expiry) - now) / 1000);
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
        
        if (this.tokenRemaining <= 300) {
            timerEl.classList.add('warning');
        } else {
            timerEl.classList.remove('warning');
        }
    },

    async extendGodToken() {
        let modal = document.getElementById('token-extend-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'token-extend-modal';
            modal.className = 'gm-modal-overlay';
            modal.innerHTML = `
                <div class="gm-modal-box" style="width: 320px; text-align:center; padding: 40px 20px;">
                    <div style="font-size:1.5rem; color:#00f7ff; font-weight:bold; margin-bottom:15px; animation: tokenExtending 1.5s infinite;">
                        ✨ Extending God Token...
                    </div>
                    <div style="color:#aaa; font-size:0.9rem;">Communing with the void to preserve your session.</div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';

        try {
            // 🚀 쿠키 전송을 보장하는 credentials: 'include' 필수 적용
            const response = await fetch('/api/godmode/extend_token', { 
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) throw new Error("Token extension rejected");
            
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            // 🚀 성공 시 로컬 스토리지의 절대시간을 2시간(7200초) 뒤로 갱신!
            const newExpiry = Date.now() + 7200 * 1000;
            localStorage.setItem('gm_token_expiry', newExpiry);
            this.tokenRemaining = 7200; 
            this.updateTokenDisplay();
            
            modal.style.display = 'none';
        } catch(e) {
            alert("Failed to extend token. The void is unresponsive.");
            modal.style.display = 'none';
        }
    },

    evictGod() {
        const timerEl = document.getElementById('god-token-timer');
        if (timerEl) {
            timerEl.innerText = "Token Expired";
            timerEl.classList.add('warning');
        }

        let modal = document.getElementById('token-evict-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'token-evict-modal';
            modal.className = 'gm-modal-overlay';
            modal.innerHTML = `
                <div class="gm-modal-box" style="width: 320px; text-align:center; padding: 40px 20px; border-color: #ff5050; box-shadow: 0 0 20px rgba(255,80,80,0.4);">
                    <div style="font-size:1.5rem; color:#ff5050; font-weight:bold; margin-bottom:15px; animation: tokenPulseWarning 1s infinite;">
                        💀 Evicting...
                    </div>
                    <div style="color:#aaa; font-size:0.9rem;">Your connection to the void has been severed.</div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';

        setTimeout(() => {
            window.location.href = '/world/nigredo';
        }, 2000);
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

    bindEvents() {
        const titleArea = document.getElementById('editor-title');
        const contentArea = document.getElementById('editor-content');
        
        contentArea.addEventListener('keyup', (e) => { 
            this.saveSelection(); 
            this.updateToolbarState(); 
            
            // 🚀 [신규] 좌우 방향키 조작 시 가로(Side) 스크롤 자동 추적
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    const node = sel.anchorNode;
                    const td = node.nodeType === 3 ? node.parentElement.closest('td, th') : node.closest('td, th');
                    if (td) {
                        // inline: 'nearest' 속성이 가로 스크롤을 최단 거리로 당겨줍니다.
                        td.scrollIntoView({ inline: 'nearest', block: 'nearest' });
                    }
                }
            }
        });
        contentArea.addEventListener('mouseup', () => { this.saveSelection(); this.updateToolbarState(); });
        contentArea.addEventListener('mouseleave', () => this.saveSelection());

        titleArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); contentArea.focus(); }
        });

        contentArea.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                const sel = window.getSelection();
                if (!sel.rangeCount) return;
                const node = sel.anchorNode;
                const td = node.nodeType === 3 ? node.parentElement.closest('td, th') : node.closest('td, th');
                
                if (td) {
                    const tr = td.closest('tr');
                    const cIdx = Array.from(tr.children).indexOf(td);
                    const targetTr = e.key === 'ArrowUp' ? tr.previousElementSibling : tr.nextElementSibling;
                    if (targetTr) {
                        e.preventDefault(); 
                        const targetTd = targetTr.children[cIdx] || targetTr.lastElementChild;
                        if (targetTd) {
                            targetTd.focus();
                            const newRange = document.createRange();
                            newRange.selectNodeContents(targetTd);
                            newRange.collapse(false);
                            sel.removeAllRanges();
                            sel.addRange(newRange);
                            targetTd.scrollIntoView({ block: 'nearest'});
                        }
                    }
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) EditorUI.redo();
                else EditorUI.undo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                EditorUI.redo();
                return;
            }
        });

        contentArea.addEventListener('input', () => {
            clearTimeout(this.historyTimeout);
            this.historyTimeout = setTimeout(() => this.saveHistory(), 400);
        });

        contentArea.addEventListener('mousemove', (e) => {
            if (this.linkTooltip && this.linkTooltip.style.display === 'block') {
                this.linkTooltip.style.left = (e.pageX + 15) + 'px';
                this.linkTooltip.style.top = (e.pageY + 15) + 'px';
            }

            if (this.isResizing) return; 

            const td = e.target.closest('td, th');
            if (td && !this.isDragging) {
                const rect = td.getBoundingClientRect();
                const isLeftEdge = e.clientX - rect.left < 8;
                const isTopEdge = e.clientY - rect.top < 8;
                const isRightEdge = rect.right - e.clientX < 8;
                const isBottomEdge = rect.bottom - e.clientY < 8;

                if (isRightEdge) td.style.cursor = 'col-resize'; 
                else if (isBottomEdge) td.style.cursor = 'row-resize'; 
                else if (isLeftEdge || isTopEdge) td.style.cursor = 'cell'; 
                else td.style.cursor = 'text'; 
            }
        });

        contentArea.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; 
            const td = e.target.closest('td, th');
            
            if (!td) {
                if (!e.ctrlKey && !e.metaKey) {
                    document.querySelectorAll('.void-cell-selected').forEach(el => el.classList.remove('void-cell-selected'));
                }
                return;
            }

            const rect = td.getBoundingClientRect();
            const isLeftEdge = e.clientX - rect.left < 8;
            const isTopEdge = e.clientY - rect.top < 8;
            const isRightEdge = rect.right - e.clientX < 8;
            const isBottomEdge = rect.bottom - e.clientY < 8;

            if (isRightEdge || isBottomEdge) {
                this.isResizing = true;
                this.resizeTarget = { td: td, type: isRightEdge ? 'col' : 'row' };
                this.startCoords = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height };
                e.preventDefault();
                return;
            }

            const tbody = td.closest('tbody');
            const tr = td.closest('tr');
            const cIdx = Array.from(tr.children).indexOf(td);

            if (!e.ctrlKey && !e.metaKey) {
                document.querySelectorAll('.void-cell-selected').forEach(el => el.classList.remove('void-cell-selected'));
            }

            if (isLeftEdge) { 
                Array.from(tr.children).forEach(c => c.classList.add('void-cell-selected'));
                this.isDragging = false; 
                e.preventDefault();
                return;
            } else if (isTopEdge) { 
                Array.from(tbody.children).forEach(row => {
                    if (row.children[cIdx]) row.children[cIdx].classList.add('void-cell-selected');
                });
                this.isDragging = false;
                e.preventDefault();
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                td.classList.toggle('void-cell-selected');
                this.isDragging = false; 
                e.preventDefault();
                return;
            }

            this.isDragging = true;
            this.startTd = td;
        });

        const getCellCoords = (td) => {
            return { r: Array.from(td.closest('tbody').children).indexOf(td.closest('tr')), c: Array.from(td.closest('tr').children).indexOf(td) };
        };

        contentArea.addEventListener('mouseover', (e) => {
            const a = e.target.closest('a');
            if (a && this.linkTooltip) {
                const href = a.getAttribute('href');
                if (href) {
                    let displayText = href;
                    try {
                        if (href.startsWith('/world/rubedo?')) {
                            const params = new URLSearchParams(href.split('?')[1]);
                            const mod = (params.get('module') || '').toUpperCase();
                            if (mod === 'R1') {
                                const p = params.get('path') || '';
                                displayText = `[R1] ${p.replace('/', ' ➔ ')}`;
                            } else if (mod === 'R2') {
                                const mode = params.get('mode');
                                const sign = params.get('sign') || '';
                                const SignFormatted = sign.charAt(0).toUpperCase() + sign.slice(1);
                                if (mode === 'sign') displayText = `[R2] Sign ➔ ${SignFormatted}`;
                                else if (mode === 'symbol') displayText = `[R2] Symbol ➔ ${SignFormatted} ${params.get('num')}`;
                            }
                        } else if (href.startsWith('/static/uploads/')) {
                            const parts = href.split('/');
                            displayText = `📁 Attached File: ${parts[parts.length-1]}`;
                        }
                    } catch(err) {}
                    
                    this.linkTooltip.innerHTML = `🔗 ${displayText}`;
                    this.linkTooltip.style.display = 'block';
                    this.linkTooltip.style.opacity = '1';
                }
            } else if (this.linkTooltip) {
                this.linkTooltip.style.display = 'none';
                this.linkTooltip.style.opacity = '0';
            }

            if (!this.isDragging || !this.startTd) return;
            const td = e.target.closest('td, th');
            
            if (td && td.closest('table') === this.startTd.closest('table')) {
                if (td === this.startTd) return; 

                this.startTd.classList.add('void-cell-selected');

                const sCoords = getCellCoords(this.startTd);
                const cCoords = getCellCoords(td);
                const rMin = Math.min(sCoords.r, cCoords.r);
                const rMax = Math.max(sCoords.r, cCoords.r);
                const cMin = Math.min(sCoords.c, cCoords.c);
                const cMax = Math.max(sCoords.c, cCoords.c);

                td.closest('tbody').querySelectorAll('tr').forEach((row, r) => {
                    Array.from(row.children).forEach((cell, c) => {
                        if (r >= rMin && r <= rMax && c >= cMin && c <= cMax) cell.classList.add('void-cell-selected');
                        else cell.classList.remove('void-cell-selected');
                    });
                });
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isResizing || !this.resizeTarget) return;

            if (this.resizeTarget.type === 'col') {
                const newWidth = this.startCoords.w + (e.clientX - this.startCoords.x);
                if (newWidth > 20) this.resizeTarget.td.style.width = `${newWidth}px`;
            } else {
                const newHeight = this.startCoords.h + (e.clientY - this.startCoords.y);
                if (newHeight > 20) this.resizeTarget.td.parentElement.style.height = `${newHeight}px`;
            }
        });

        document.addEventListener('mouseup', () => { 
            this.isDragging = false; 
            this.isResizing = false;
            this.resizeTarget = null;
        });

        contentArea.addEventListener('contextmenu', (e) => {
            const td = e.target.closest('td') || e.target.closest('th');
            if (td) {
                e.preventDefault(); 
                EditorUI.showTableContextMenu(e.pageX, e.pageY, td);
            }
        });

        document.addEventListener('click', (e) => {
            if(!e.target.closest('.gm-dropdown-menu') && !e.target.closest('.tool-btn')) {
                document.querySelectorAll('.gm-dropdown-menu').forEach(m => m.remove());
            }
            const tableMenu = document.getElementById('table-context-menu');
            if (tableMenu) tableMenu.style.display = 'none';
        });

        document.addEventListener('selectionchange', () => {
            EditorUI.updateToolbarState();

            const linkBtn = document.getElementById('btn-link');
            const contentArea = document.getElementById('editor-content');
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
                
                if (['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript'].includes(cmd)) {
                    const selectedCells = document.querySelectorAll('.void-cell-selected');
                    
                    if (selectedCells.length > 0) {
                        document.getElementById('editor-content').focus();
                        selectedCells.forEach(cell => {
                            const sel = window.getSelection();
                            const range = document.createRange();
                            range.selectNodeContents(cell);
                            sel.removeAllRanges();
                            sel.addRange(range);
                            document.execCommand(cmd, false, null);
                        });
                        window.getSelection().removeAllRanges();
                    } else {
                        document.execCommand(cmd, false, null);
                        document.getElementById('editor-content').focus();
                        EditorUI.saveSelection(); 
                    }
                    
                    EditorUI.saveHistory();
                    EditorUI.updateToolbarState(); 
                }
                
                if (cmd.includes('align')) {
                    const alignOptions = [
                        { label: '⬅️ Align Left', cmdVal: 'justifyLeft' },
                        { label: '↔️ Align Center', cmdVal: 'justifyCenter' },
                        { label: '➡️ Align Right', cmdVal: 'justifyRight' },
                        { label: '🔠 Justify (양쪽 정렬)', cmdVal: 'justifyFull' }
                    ];

                    EditorUI.showDropdown(e.target, alignOptions.map(opt => ({
                        label: opt.label,
                        action: () => {
                            EditorUI.restoreSelection();
                            const selectedCells = document.querySelectorAll('.void-cell-selected');
                            if (selectedCells.length > 0) {
                                document.getElementById('editor-content').focus();
                                selectedCells.forEach(cell => {
                                    const sel = window.getSelection();
                                    const range = document.createRange();
                                    range.selectNodeContents(cell);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                    document.execCommand(opt.cmdVal, false, null);
                                });
                                window.getSelection().removeAllRanges();
                            } else {
                                document.execCommand(opt.cmdVal, false, null);
                                document.getElementById('editor-content').focus();
                                EditorUI.saveSelection();
                            }
                            EditorUI.saveHistory();
                        }
                    })));
                }

                if (cmd.includes('spacing')) {
                    const spacingOptions = [
                        { label: '1.0 (Compact)', val: '1.0' },
                        { label: '1.5 (Standard)', val: '1.5' },
                        { label: '2.0 (Wide)', val: '2.0' }
                    ];

                    EditorUI.showDropdown(e.target, spacingOptions.map(opt => ({
                        label: opt.label,
                        action: () => {
                            EditorUI.restoreSelection();
                            const selectedCells = document.querySelectorAll('.void-cell-selected');
                            if (selectedCells.length > 0) {
                                document.getElementById('editor-content').focus();
                                selectedCells.forEach(cell => {
                                    const sel = window.getSelection();
                                    const range = document.createRange();
                                    range.selectNodeContents(cell);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                    EditorUI.setLineHeight(opt.val);
                                });
                                window.getSelection().removeAllRanges();
                            } else {
                                EditorUI.setLineHeight(opt.val);
                            }
                        }
                    })));
                }

                // 🚀 [신규] 리스트(Bullet) 드롭다운 로직 추가
                if (cmd === 'list') {
                    const listOptions = [
                        { label: '• Unordered List (기호)', cmdVal: 'insertUnorderedList' },
                        { label: '1. Ordered List (숫자)', cmdVal: 'insertOrderedList' }
                    ];

                    EditorUI.showDropdown(e.target, listOptions.map(opt => ({
                        label: opt.label,
                        action: () => {
                            EditorUI.restoreSelection();
                            document.execCommand(opt.cmdVal, false, null);
                            document.getElementById('editor-content').focus();
                            EditorUI.saveSelection();
                            EditorUI.saveHistory();
                        }
                    })));
                }

                if (cmd.includes('text color')) EditorUI.showColorModal('foreColor');
                if (cmd.includes('background color') || cmd.includes('highlight')) EditorUI.showColorModal('hiliteColor');
                if (cmd.includes('special') || cmd.includes('symbol')) EditorUI.showSymbolModal();
                
                if (cmd === 'link' || cmd === 'insert link') {
                    const sel = window.getSelection();
                    if (sel.toString().trim().length === 0) {
                        alert("Please select the text you want to link first.");
                        return;
                    }
                    EditorUI.showLinkModal();
                }

                if (cmd === 'insert image') {
                    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
                    input.onchange = async (e) => await EditorUI.uploadAsset(e.target.files[0], 'image'); input.click();
                }
                if (cmd === 'attach file') {
                    const input = document.createElement('input'); input.type = 'file';
                    input.onchange = async (e) => await EditorUI.uploadAsset(e.target.files[0], 'file'); input.click();
                }
                if (cmd === 'insert chart (table)') EditorUI.showChartModal(); 
            });
        });

        document.getElementById('font-family-select').addEventListener('change', (e) => {
            EditorUI.restoreSelection();
            const fontName = e.target.value;
            const selectedCells = document.querySelectorAll('.void-cell-selected');

            if (selectedCells.length > 0) {
                document.getElementById('editor-content').focus();
                selectedCells.forEach(cell => {
                    const sel = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(cell);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    document.execCommand('fontName', false, fontName);
                });
                window.getSelection().removeAllRanges();
            } else {
                document.execCommand('fontName', false, fontName);
                document.getElementById('editor-content').focus();
                EditorUI.saveSelection();
            }
            EditorUI.saveHistory();
        });

        document.getElementById('font-size-select').addEventListener('change', (e) => {
            EditorUI.restoreSelection();
            const fontSize = e.target.value; 
            const selectedCells = document.querySelectorAll('.void-cell-selected');

            const applySizeCommand = () => {
                document.execCommand('fontSize', false, '7');
                document.getElementById('editor-content').querySelectorAll('font[size="7"]').forEach(f => {
                    f.removeAttribute('size');
                    f.style.fontSize = fontSize;
                });
            };

            if (selectedCells.length > 0) {
                document.getElementById('editor-content').focus();
                selectedCells.forEach(cell => {
                    const sel = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(cell);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    applySizeCommand();
                });
                window.getSelection().removeAllRanges();
            } else {
                applySizeCommand();
                document.getElementById('editor-content').focus();
                EditorUI.saveSelection();
            }
            EditorUI.saveHistory();
        });

        contentArea.addEventListener('mouseup', (e) => {
            const cellPaintBtn = document.getElementById('btn-cell-paint');
            const quickBtn = document.getElementById('btn-quick-paint');
            if(!cellPaintBtn) return;

            const selectedCells = document.querySelectorAll('.void-cell-selected');
            const isCell = e.target.closest('td') || e.target.closest('th');

            if (isCell || selectedCells.length > 0) {
                cellPaintBtn.style.display = 'inline-block';
                if(this.recentColors.length > 0 && quickBtn) quickBtn.style.display = 'inline-block';
                if (isCell) EditorUI.activeTd = isCell;
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

        const contentArea = document.getElementById('editor-content');
        if (node.id === 'editor-content') {
            const range = sel.getRangeAt(0);
            Array.from(contentArea.children).forEach(child => {
                if (range.intersectsNode(child)) child.style.lineHeight = val;
            });
        } else {
            const block = node.closest('p, div, td, th, li');
            if (block && block.id !== 'editor-content') block.style.lineHeight = val;
        }
        document.getElementById('editor-content').focus();
        this.saveSelection();
        this.saveHistory();
    },

    showDropdown(targetBtn, options) {
        document.querySelectorAll('.gm-dropdown-menu').forEach(m => m.remove());
        const rect = targetBtn.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'gm-dropdown-menu';
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 5}px`;
        
        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'gm-dropdown-item';
            item.innerText = opt.label;
            item.onclick = () => { opt.action(); menu.remove(); };
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
            <div class="gm-modal-box" style="width: 480px; display:flex; flex-direction:column;">
                <div style="font-size:1.2rem; margin-bottom:15px; text-align:center; color:#0088ff; font-weight:bold;">🔗 Manifest Hyperlink</div>
                <div id="link-tree-container" style="flex:1; overflow-y:auto; background:#000; border:1px solid #555; padding:15px; border-radius:4px; margin-bottom:15px; min-height: 350px; max-height: 450px; font-family:'Cascadia Code'; font-size:14px;">
                    <div style="text-align:center; color:#555; margin-top:50px;">Scanning the Akashic Records...</div>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <button id="link-cancel" style="background:transparent; border:1px solid #ff5050; color:#ff5050; padding:8px 15px; cursor:pointer; border-radius:4px;">Cancel</button>
                    <button id="link-confirm" style="background:#0088ff; border:none; color:#fff; padding:8px 15px; cursor:pointer; font-weight:bold; border-radius:4px;">Apply Link</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';

        document.getElementById('link-cancel').onclick = () => modal.style.display = 'none';
        document.getElementById('link-confirm').onclick = () => {
            if (this.activeLinkFile) {
                this.restoreSelection();
                document.execCommand('createLink', false, this.activeLinkFile);
                document.getElementById('editor-content').focus();
                EditorUI.saveSelection();
                EditorUI.saveHistory(); 
                modal.style.display = 'none';
            } else {
                alert("Please select a target document from the tree.");
            }
        };

        if (!this.articleTree) {
            try {
                const res = await fetch('/api/godmode/tree', { credentials: 'include' });
                this.articleTree = await res.json();
            } catch (e) {
                document.getElementById('link-tree-container').innerHTML = `<div style="color:#ff5050; text-align:center; margin-top:50px;">Failed to scan records.</div>`;
                return;
            }
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
        const expanded = this.expandedFolders;
        const actFol = this.activeLinkFolder;
        const actFile = this.activeLinkFile;

        const fCls = (path) => `link-folder ${actFol === path ? 'active' : ''}`;
        const iCls = (url) => `link-file ${actFile === url ? 'active' : ''}`;

        html += `<div class="${fCls('r1')}" data-toggle="r1">📁 R1</div>`;
        if (expanded.has('r1')) {
            html += `<div class="link-indent">`;
            html += `<div class="${fCls('r1/archivum')}" data-toggle="r1/archivum">📁 Archivum</div>`;
            if (expanded.has('r1/archivum') && t.r1.archivum) {
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

        html += `<div class="${fCls('r2')}" data-toggle="r2" style="margin-top:10px;">📁 R2</div>`;
        if (expanded.has('r2')) {
            html += `<div class="link-indent">`;
            html += `<div class="${fCls('r2/sign')}" data-toggle="r2/sign">📁 Sign</div>`;
            if (expanded.has('r2/sign') && t.r2.sign) {
                html += `<div class="link-indent">`;
                t.r2.sign.forEach(f => {
                    const url = `/world/rubedo?module=r2&mode=sign&sign=${f.id}`;
                    html += `<div class="${iCls(url)}" data-url="${url}">📄 ${f.title || f.id}</div>`;
                });
                html += `</div>`;
            }
            
            html += `<div class="${fCls('r2/symbol')}" data-toggle="r2/symbol">📁 Symbol</div>`;
            if (expanded.has('r2/symbol') && t.r2.symbol) {
                html += `<div class="link-indent">`;
                const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
                signs.forEach(s => {
                    html += `<div class="${fCls(`r2/symbol/${s}`)}" data-toggle="r2/symbol/${s}">📁 ${s.charAt(0).toUpperCase() + s.slice(1)}</div>`;
                    if (expanded.has(`r2/symbol/${s}`) && t.r2.symbol[s]) {
                        html += `<div class="link-indent">`;
                        t.r2.symbol[s].forEach(f => {
                            const url = `/world/rubedo?module=r2&mode=symbol&sign=${s}&num=${f.id}`;
                            html += `<div class="${iCls(url)}" data-url="${url}">📄 ${f.title || f.id}</div>`;
                        });
                        html += `</div>`;
                    }
                });
                html += `</div>`;
            }
            html += `</div>`;
        }
        
        container.innerHTML = html;

        container.querySelectorAll('.link-folder').forEach(el => {
            el.onclick = () => {
                const path = el.getAttribute('data-toggle');
                if (this.expandedFolders.has(path)) {
                    this.expandedFolders.delete(path);
                } else {
                    this.expandedFolders.add(path);
                }
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

    showColorModal(mode) {
        let modal = document.getElementById('color-picker-modal');
        if (modal) modal.remove(); 

        modal = document.createElement('div');
        modal.id = 'color-picker-modal';
        modal.className = 'gm-modal-overlay';
        document.body.appendChild(modal);

        const renderPalettes = () => {
            return this.recentColors.map(c => `<div class="color-swatch" style="background-color:${c};" data-color="${c}"></div>`).join('');
        };

        const title = mode === 'foreColor' ? 'Text Color' : (mode === 'hiliteColor' ? 'Background Color' : 'Cell Paint');

        modal.innerHTML = `
            <div class="gm-modal-box" style="width: 320px;">
                <div style="font-size:1.1rem; margin-bottom:15px; text-align:center; color:#0088ff; font-weight:bold;">🎨 ${title}</div>
                <div style="display:flex; gap:15px; margin-bottom:15px; align-items:center; background:#1a1a1a; padding:12px; border-radius:6px; border:1px solid #333;">
                    <div id="color-preview" style="width:60px; height:60px; border-radius:4px; border:1px solid #555; background-color:#ffffff; box-shadow:inset 0 0 5px rgba(0,0,0,0.5);"></div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:8px; font-size:12px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="color:#ff5050; font-weight:bold; width:12px;">R</span>
                            <input type="range" id="r-slider" min="0" max="255" value="255" style="flex:1; cursor:pointer;">
                            <input type="number" id="r-num" min="0" max="255" value="255" style="width:45px; background:#000; color:#fff; border:1px solid #444; padding:3px; text-align:center; font-family:'Cascadia Code';">
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="color:#3cff8f; font-weight:bold; width:12px;">G</span>
                            <input type="range" id="g-slider" min="0" max="255" value="255" style="flex:1; cursor:pointer;">
                            <input type="number" id="g-num" min="0" max="255" value="255" style="width:45px; background:#000; color:#fff; border:1px solid #444; padding:3px; text-align:center; font-family:'Cascadia Code';">
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="color:#0088ff; font-weight:bold; width:12px;">B</span>
                            <input type="range" id="b-slider" min="0" max="255" value="255" style="flex:1; cursor:pointer;">
                            <input type="number" id="b-num" min="0" max="255" value="255" style="width:45px; background:#000; color:#fff; border:1px solid #444; padding:3px; text-align:center; font-family:'Cascadia Code';">
                        </div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center;">
                    <input type="color" id="native-color" value="#ffffff" title="OS Default Picker" style="width:35px; height:35px; padding:0; border:none; cursor:pointer; background:none;">
                    <input type="text" id="hex-input" placeholder="#FFFFFF" style="width:40%; background:#000; border:1px solid #555; color:#fff; padding:8px; font-family:'Cascadia Code'; text-transform:uppercase; text-align:center;">
                    <button id="color-confirm" class="color-confirm-btn" style="width:30%;">Apply</button>
                </div>
                <div style="font-size:0.8rem; color:#aaa; margin-bottom:8px;">Recent Palette</div>
                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; margin-bottom:15px;" id="color-grid">
                    ${renderPalettes()}
                </div>
                <hr style="border:0; border-top:1px solid #3cff8f; margin:15px 0; opacity:0.5;">
                <div style="font-size:0.8rem; color:#aaa; margin-bottom:8px;">Alchemical Elements</div>
                <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                    <div class="color-swatch swatch-fire" data-color="#FFB8AA" title="Fire"></div>
                    <div class="color-swatch swatch-earth" data-color="#FEFF8E" title="Earth"></div>
                    <div class="color-swatch swatch-water" data-color="#A7F6FC" title="Water"></div>
                    <div class="color-swatch swatch-air" data-color="#f5f5f5" title="Air"></div>
                </div>
                <button id="color-cancel" class="color-cancel-btn">Close</button>
            </div>
        `;

        modal.style.display = 'flex';

        const nativePicker = document.getElementById('native-color');
        const hexInput = document.getElementById('hex-input');
        const preview = document.getElementById('color-preview');
        const rS = document.getElementById('r-slider'), rN = document.getElementById('r-num');
        const gS = document.getElementById('g-slider'), gN = document.getElementById('g-num');
        const bS = document.getElementById('b-slider'), bN = document.getElementById('b-num');

        const rgbToHex = (r, g, b) => {
            const hex = (x) => {
                const h = parseInt(x).toString(16);
                return h.length === 1 ? "0" + h : h;
            };
            return ("#" + hex(r) + hex(g) + hex(b)).toUpperCase();
        };

        const hexToRgb = (hex) => {
            let h = hex.replace('#', '');
            if(h.length === 3) h = h.split('').map(x => x + x).join('');
            const num = parseInt(h, 16);
            return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
        };

        const syncUI = (source, value) => {
            let hex = "#FFFFFF";
            let rgb = {r: 255, g: 255, b: 255};

            if (source === 'rgb') {
                rgb = { r: rN.value, g: gN.value, b: bN.value };
                hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            } else {
                if(!value || value === "undefined") value = "#FFFFFF";
                if(!value.startsWith('#')) value = '#' + value; 
                hex = value.toUpperCase();
                rgb = hexToRgb(hex);
            }

            if (source !== 'rgb') {
                rS.value = rN.value = rgb.r;
                gS.value = gN.value = rgb.g;
                bS.value = bN.value = rgb.b;
            }
            
            if (source !== 'hex') hexInput.value = hex;
            if (source !== 'native') nativePicker.value = hex;
            preview.style.backgroundColor = hex;
        };

        [rS, gS, bS].forEach(el => el.addEventListener('input', (e) => {
            document.getElementById(e.target.id.replace('slider', 'num')).value = e.target.value;
            syncUI('rgb');
        }));
        
        [rN, gN, bN].forEach(el => el.addEventListener('input', (e) => {
            let val = parseInt(e.target.value) || 0;
            if (val > 255) val = 255; if (val < 0) val = 0;
            e.target.value = val;
            document.getElementById(e.target.id.replace('num', 'slider')).value = val;
            syncUI('rgb');
        }));

        nativePicker.addEventListener('input', (e) => syncUI('native', e.target.value));
        
        hexInput.addEventListener('input', (e) => {
            let val = e.target.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (val.length === 7) syncUI('hex', val);
        });

        const getHexColor = (el) => {
            if (el.getAttribute('data-color')) return el.getAttribute('data-color');
            const style = window.getComputedStyle(el);
            const rgb = style.backgroundColor;
            const rgbMatch = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!rgbMatch) return "#FFFFFF"; 
            return rgbToHex(rgbMatch[1], rgbMatch[2], rgbMatch[3]);
        };

        modal.querySelectorAll('.color-swatch').forEach(sw => {
            sw.onclick = () => syncUI('swatch', getHexColor(sw));
        });

        const applyColor = () => {
            let hex = hexInput.value.trim();
            if (!hex.startsWith('#')) hex = '#' + hex;
            if (hex.length !== 7) return; 
            if (hex === '#000000') hex = '#000001'; 
            
            this.recentColors = [hex, ...this.recentColors.filter(c => c && typeof c === 'string' && c.toLowerCase() !== hex.toLowerCase())].slice(0, 8);
            localStorage.setItem('gm_recent_colors', JSON.stringify(this.recentColors));

            EditorUI.restoreSelection();
            
            if (mode === 'cellColor') {
                const selectedCells = document.querySelectorAll('.void-cell-selected');
                if (selectedCells.length > 0) {
                    selectedCells.forEach(td => {
                        td.style.backgroundColor = hex; 
                        td.classList.remove('void-cell-selected'); 
                    });
                } else if (EditorUI.activeTd) {
                    EditorUI.activeTd.style.backgroundColor = hex;
                }
            } else {
                document.execCommand(mode, false, hex);
                document.getElementById('editor-content').focus();
                EditorUI.saveSelection();
            }
            
            this.updateQuickPaintButton(); 
            this.saveHistory(); 
            modal.style.display = 'none';
        };

        document.getElementById('color-confirm').onclick = applyColor;
        document.getElementById('color-cancel').onclick = () => modal.style.display = 'none';
        
        if (this.recentColors.length > 0) {
            syncUI('swatch', this.recentColors[0]);
        } else {
            syncUI('hex', '#FFFFFF');
        }
    },

    showSymbolModal() {
        let modal = document.getElementById('symbol-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'symbol-modal';
        modal.className = 'gm-modal-overlay';
        document.body.appendChild(modal);
        
        const categories = [
            {
                title: "🌌 Zodiac Symbols",
                symbols: ['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎']
            },
            {
                title: "🪐 Planet Symbols (inc. Nodes)",
                symbols: ['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇','☊','☋']
            },
            {
                title: "🔮 Mystic & Alchemical Symbols",
                symbols: ['🜂','🜄','🜁','🜃','🜔','🜍','※','☆','★','○','●','◎','◇','◆','□','■','△','▲','▽','▼']
            },
            {
                title: "🔣 Etc. (Math & Punctuation)",
                symbols: ['—','→','←','↑','↓','↔','«','»','“','”','‘','’','±','×','÷','∞','≈','≠','≤','≥','°','′','″','℃','£','€','¥','¢','©','®','™','†','‡']
            }
        ];
        
        let modalContentHtml = `<div style="font-size:1.2rem; margin-bottom:15px; text-align:center; color:#0088ff; font-weight:bold; position:sticky; top:0; background:#111; padding-bottom:10px; border-bottom:1px solid #333; z-index:10;">✨ Manifest Symbols</div>`;
        
        categories.forEach(cat => {
            modalContentHtml += `
                <div class="sym-category-title">${cat.title}</div>
                <div class="sym-grid">
                    ${cat.symbols.map(s => `<div class="sym-btn">${s}</div>`).join('')}
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="gm-modal-box" style="width: 480px; max-height: 80vh; overflow-y:auto; padding: 20px 30px;">
                ${modalContentHtml}
                <button id="sym-close" style="margin-top:20px; width:100%; background:transparent; border:1px solid #ff5050; color:#ff5050; padding:10px; cursor:pointer; border-radius:4px; font-weight:bold; position:sticky; bottom:-10px; background:#111;">Close</button>
            </div>
        `;

        modal.style.display = 'flex';
        document.getElementById('sym-close').onclick = () => modal.style.display = 'none';
        
        modal.querySelector('.gm-modal-box').addEventListener('click', (e) => {
            if(e.target.classList.contains('sym-btn')) {
                EditorUI.restoreSelection();
                document.execCommand('insertText', false, e.target.innerText);
                document.getElementById('editor-content').focus();
                EditorUI.saveSelection(); 
                EditorUI.saveHistory(); 
                modal.style.display = 'none';
            }
        });
    },

    showTableContextMenu(x, y, td) {
        this.activeTd = td; 
        let menu = document.getElementById('table-context-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'table-context-menu';
            menu.className = 'gm-dropdown-menu';
            document.body.appendChild(menu);
        }

        const selectedCells = document.querySelectorAll('.void-cell-selected');
        const hasRange = selectedCells.length > 1;

        menu.innerHTML = `
            <div class="gm-dropdown-item" style="color:#00f7ff; font-weight:bold;" onclick="EditorUI.tableOp('clone-table')">📋 Clone Chart (표 복제)</div>
            <div style="height:1px; background:#333; margin:5px 0;"></div>
            ${hasRange ? `<div class="gm-dropdown-item" style="color:#3cff8f; font-weight:bold;" onclick="EditorUI.tableOp('merge-range')">🌌 Merge Selected Range</div><div style="height:1px; background:#333; margin:5px 0;"></div>` : ''}
            <div class="gm-dropdown-item" onclick="EditorUI.tableOp('split-h')">🗂️ Split Cell (Horiz)</div>
            <div class="gm-dropdown-item" onclick="EditorUI.tableOp('split-v')">🗄️ Split Cell (Vert)</div>
            <div style="height:1px; background:#333; margin:5px 0;"></div>
            <div class="gm-dropdown-item" onclick="EditorUI.tableOp('row-above')">⬆️ Insert Row Above</div>
            <div class="gm-dropdown-item" onclick="EditorUI.tableOp('row-below')">⬇️ Insert Row Below</div>
            <div style="height:1px; background:#333; margin:5px 0;"></div>
            <div class="gm-dropdown-item" onclick="EditorUI.tableOp('col-left')">⬅️ Insert Col Left</div>
            <div class="gm-dropdown-item" onclick="EditorUI.tableOp('col-right')">➡️ Insert Col Right</div>
            <div style="height:1px; background:#333; margin:5px 0;"></div>
            <div class="gm-dropdown-item" style="color:#ff5050;" onclick="EditorUI.tableOp('del-row')">❌ Delete Row</div>
            <div class="gm-dropdown-item" style="color:#ff5050;" onclick="EditorUI.tableOp('del-col')">❌ Delete Col</div>
        `;
        menu.style.left = `${x}px`; menu.style.top = `${y}px`; menu.style.display = 'flex';
    },

    tableOp(action) {
        const td = this.activeTd;
        if (!td) return;
        const tr = td.parentElement;
        const table = tr.closest('table');
        const tbody = table.querySelector('tbody') || table;
        const cIdx = Array.from(tr.children).indexOf(td); 

        if (action === 'clone-table') {
            const clonedTable = table.cloneNode(true);
            clonedTable.querySelectorAll('.void-cell-selected').forEach(cell => cell.classList.remove('void-cell-selected'));
            
            const spacer = document.createElement('p');
            spacer.innerHTML = '<br>';
            
            table.after(spacer);
            spacer.after(clonedTable);
            EditorUI.saveHistory();
            return;
        }

        const getTableMatrix = (table) => {
            const matrix = [];
            Array.from(table.rows).forEach((tr, r) => {
                if (!matrix[r]) matrix[r] = [];
                let c = 0;
                Array.from(tr.children).forEach(td => {
                    while (matrix[r][c]) c++;
                    const rs = td.rowSpan || 1;
                    const cs = td.colSpan || 1;
                    for (let i = 0; i < rs; i++) {
                        for (let j = 0; j < cs; j++) {
                            if (!matrix[r+i]) matrix[r+i] = [];
                            matrix[r+i][c+j] = td;
                        }
                    }
                    c += cs;
                });
            });
            return matrix;
        };

        let cells = Array.from(document.querySelectorAll('.void-cell-selected'));
        if (cells.length === 0 && td) cells = [td];

        if (action === 'split-h') {
            const tableGroups = new Map();
            cells.forEach(c => {
                const tbl = c.closest('table');
                if(!tableGroups.has(tbl)) tableGroups.set(tbl, new Set());
                tableGroups.get(tbl).add(c);
            });

            tableGroups.forEach((targetSet, table) => {
                const matrix = getTableMatrix(table);
                
                const rowCounts = {};
                targetSet.forEach(td => {
                    let lastRow = -1;
                    for(let r=0; r<matrix.length; r++) {
                        if (matrix[r].includes(td)) lastRow = Math.max(lastRow, r);
                    }
                    if (lastRow !== -1) {
                        rowCounts[lastRow] = (rowCounts[lastRow] || 0) + 1;
                    }
                });

                Object.keys(rowCounts).forEach(rIdx => {
                    const count = rowCounts[rIdx];
                    const expandedThisRound = new Set();
                    matrix[rIdx].forEach(cell => {
                        if (cell && !targetSet.has(cell) && !expandedThisRound.has(cell)) {
                            cell.rowSpan = (cell.rowSpan || 1) + count;
                            expandedThisRound.add(cell);
                        }
                    });
                });

                const trGroups = new Map();
                targetSet.forEach(td => {
                    const tr = td.parentElement;
                    if(!trGroups.has(tr)) trGroups.set(tr, []);
                    trGroups.get(tr).push(td);
                });

                trGroups.forEach((tdList, tr) => {
                    const newTr = document.createElement('tr');
                    tdList.forEach(td => {
                        const newTd = document.createElement('td');
                        newTd.style.cssText = td.style.cssText;
                        newTd.innerHTML = '<br>';
                        newTr.appendChild(newTd);
                    });
                    tr.after(newTr);
                });
            });
            cells.forEach(c => c.classList.remove('void-cell-selected'));
            EditorUI.saveHistory();
            return;
        }

        if (action === 'split-v') {
            const tableGroups = new Map();
            cells.forEach(c => {
                const tbl = c.closest('table');
                if(!tableGroups.has(tbl)) tableGroups.set(tbl, new Set());
                tableGroups.get(tbl).add(c);
            });

            tableGroups.forEach((targetSet, table) => {
                const matrix = getTableMatrix(table);
                
                const colCounts = {};
                targetSet.forEach(td => {
                    let lastCol = -1;
                    for(let r=0; r<matrix.length; r++) {
                        for(let c=0; c<matrix[r].length; c++) {
                            if (matrix[r][c] === td) lastCol = Math.max(lastCol, c);
                        }
                    }
                    if (lastCol !== -1) {
                        colCounts[lastCol] = (colCounts[lastCol] || 0) + 1;
                    }
                });

                Object.keys(colCounts).forEach(col => {
                    const count = colCounts[col];
                    const expandedThisRound = new Set();
                    matrix.forEach(row => {
                        const cell = row[col];
                        if (cell && !targetSet.has(cell) && !expandedThisRound.has(cell)) {
                            cell.colSpan = (cell.colSpan || 1) + count;
                            expandedThisRound.add(cell);
                        }
                    });
                });

                targetSet.forEach(td => {
                    const newTd = document.createElement('td');
                    newTd.style.cssText = td.style.cssText;
                    newTd.innerHTML = '<br>';
                    td.after(newTd);
                });
            });
            cells.forEach(c => c.classList.remove('void-cell-selected'));
            EditorUI.saveHistory();
            return;
        }

        if (action === 'merge-range') {
            if (cells.length < 2) return;
            
            let anchor = cells[0]; 
            let rowSet = new Set();
            cells.forEach(c => rowSet.add(c.parentElement));
            
            anchor.rowSpan = rowSet.size;
            anchor.colSpan = Math.ceil(cells.length / rowSet.size); 
            
            let html = '';
            cells.forEach(c => {
                if (c !== anchor) {
                    html += c.innerHTML === '<br>' ? '' : ' ' + c.innerHTML;
                    c.remove();
                }
            });
            anchor.innerHTML = anchor.innerHTML === '<br>' ? html || '<br>' : anchor.innerHTML + html;
            cells.forEach(c => c.classList.remove('void-cell-selected'));
            EditorUI.saveHistory(); 
            return;
        }

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
        let chartModal = document.getElementById('chart-ritual-modal');
        if (!chartModal) {
            chartModal = document.createElement('div');
            chartModal.id = 'chart-ritual-modal';
            chartModal.className = 'gm-modal-overlay';
            chartModal.innerHTML = `
                <div class="gm-modal-box" style="width: 340px;">
                    <div style="font-size:1.2rem; margin-bottom:20px; text-align:center; color:#0088ff; font-weight:bold;">📊 Chart Manifestation</div>
                    <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                        <label style="color:#aaa;">Columns (가로 칸 수):</label>
                        <input type="number" id="chart-cols" value="3" min="1" max="20" style="width:70px; background:#000; border:1px solid #555; color:#fff; padding:5px; text-align:center;">
                    </div>
                    <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                        <label style="color:#aaa;">Rows (세로 줄 수):</label>
                        <input type="number" id="chart-rows" value="3" min="1" max="50" style="width:70px; background:#000; border:1px solid #555; color:#fff; padding:5px; text-align:center;">
                    </div>
                    <div style="margin-bottom:25px;">
                        <label style="display:block; margin-bottom:8px; color:#aaa;">Border Style (테두리 구조):</label>
                        <select id="chart-border" style="width:100%; background:#000; border:1px solid #555; color:#fff; padding:8px;">
                            <option value="solid">Visible Grid (일반 표)</option>
                            <option value="hidden">Invisible Matrix (투명 정렬)</option>
                        </select>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <button id="chart-cancel" style="background:transparent; border:1px solid #ff5050; color:#ff5050; padding:8px 15px; cursor:pointer; border-radius:4px;">Cancel</button>
                        <button id="chart-confirm" style="background:#0088ff; border:none; color:#fff; padding:8px 15px; cursor:pointer; font-weight:bold; border-radius:4px;">Manifest</button>
                    </div>
                </div>
            `;
            document.body.appendChild(chartModal);

            document.getElementById('chart-cancel').onclick = () => chartModal.style.display = 'none';
            document.getElementById('chart-confirm').onclick = () => {
                const cols = parseInt(document.getElementById('chart-cols').value) || 3;
                const rows = parseInt(document.getElementById('chart-rows').value) || 3;
                const border = document.getElementById('chart-border').value;
                EditorUI.insertCustomChart(cols, rows, border);
                chartModal.style.display = 'none';
            };
        }
        chartModal.style.display = 'flex';
    },

    insertCustomChart(cols, rows, borderType) {
        document.getElementById('editor-content').focus(); 
        this.restoreSelection(); 
        
        const isVisible = borderType === 'solid';
        const tableBorder = isVisible ? '1' : '0';
        const cellStyle = isVisible ? 'padding:10px; border:1px solid #ccc;' : 'padding:10px; border:none;';
        
        let tableHtml = `<br><table border="${tableBorder}" style="width:100%; border-collapse:collapse; margin:15px 0;"><tbody>`;
        for(let r=0; r<rows; r++) {
            tableHtml += '<tr>';
            for(let c=0; c<cols; c++) tableHtml += `<td style="${cellStyle}"><br></td>`;
            tableHtml += '</tr>';
        }
        tableHtml += `</tbody></table><p><br></p>`;
        document.execCommand('insertHTML', false, tableHtml);
        this.saveHistory(); 
    },

    toggleSidebar() {
        const sidebar = document.getElementById('right-sidebar');
        const handleBtn = document.getElementById('sidebar-toggle-btn');
        sidebar.classList.toggle('collapsed');
        handleBtn.innerText = sidebar.classList.contains('collapsed') ? '◀' : '▶'; 
    },

    async switchLang(targetLang) {
        const currentLang = document.getElementById('meta-lang').content;
        if (currentLang === targetLang) return; 
        const statusEl = document.getElementById('save-status');
        statusEl.innerText = 'Saving...'; statusEl.style.color = '#0088ff';
        await this.saveProgress(false);
        const module = document.getElementById('meta-module').content;
        const path = document.getElementById('meta-path').content;
        window.location.href = `/world/rubedo/godmode_lv3/editor?module=${module}&path=${path}&lang=${targetLang}&mode=EDIT`;
    },

    async manualSave() {
        const statusEl = document.getElementById('save-status');
        statusEl.innerText = 'Saving...'; statusEl.style.color = '#0088ff';
        await this.saveProgress(false);
        statusEl.innerText = 'Saved ' + new Date().toLocaleTimeString();
        statusEl.style.color = '#ccc'; 
    },

    showModal(text, onYes, onNo) {
        document.getElementById('modal-text').innerText = text;
        const overlay = document.getElementById('modal-overlay');
        const btnYes = document.getElementById('modal-btn-yes');
        const btnNo = document.getElementById('modal-btn-no');
        btnYes.onclick = () => { overlay.style.display = 'none'; onYes(); };
        btnNo.onclick = () => { overlay.style.display = 'none'; onNo(); };
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

    // 🚀 [신규] 중복 저장 충돌 방지용 Lock 변수 추가 (EditorUI 객체 상단 부근 아무데나 추가하셔도 됩니다)
    isSaving: false,

    async saveProgress(isPost) {
        // 🚀 [수복] 이미 저장이 진행 중이면, 다른 저장 요청(자동저장 등)은 튕겨냅니다.
        if (this.isSaving) return false;
        this.isSaving = true;

        const title = document.getElementById('editor-title').innerText.trim();
        const content = document.getElementById('editor-content').innerHTML;
        const module = document.getElementById('meta-module').content;
        const path = document.getElementById('meta-path').content;
        const lang = document.getElementById('meta-lang').content;

        const draftKey = `draft_${module}_${path}_${lang}`;

        try { localStorage.setItem(draftKey, JSON.stringify({title, content})); } catch(e) {}
        
        const fd = new FormData();
        fd.append('module', module); fd.append('path', path); fd.append('lang', lang);
        fd.append('title', title); fd.append('content', content); fd.append('is_post', isPost);

        try {
            const res = await fetch('/api/godmode/save', { 
                method: 'POST', body: fd, credentials: 'include' 
            });
            const data = await res.json();
            if (data.status === 'success') { localStorage.removeItem(draftKey); }
            
            this.isSaving = false; // 🚀 결계 해제
            return data.status === 'success';
        } catch (e) { 
            this.isSaving = false; // 🚀 결계 해제
            return false; 
        }
    },

    async uploadAsset(file, type) {
        if (!file) return;
        const statusEl = document.getElementById('save-status');
        statusEl.innerText = 'Uploading...'; statusEl.style.color = '#0088ff';

        const module = document.getElementById('meta-module').content;
        const path = document.getElementById('meta-path').content;
        const fd = new FormData();
        fd.append('module', module); fd.append('path', path); fd.append('file', file);

        try {
            const res = await fetch('/api/godmode/upload', { 
                method: 'POST', 
                body: fd,
                credentials: 'include'
            });
            const data = await res.json();
            if (data.status === 'success') {
                if (type === 'image') {
                    const imgHtml = `<img src="${data.url}" alt="image" style="max-width: 100%; border-radius: 4px; margin: 10px 0;">`;
                    document.execCommand('insertHTML', false, imgHtml);
                } else {
                    const fileHtml = `<a href="${data.url}" target="_blank" style="display:inline-block; padding:8px 15px; background:#f0f8ff; border:1px solid #0088ff; border-radius:4px; text-decoration:none; color:#0088ff; font-family:sans-serif; margin:5px 0;">📁 ${data.name}</a>`;
                    document.execCommand('insertHTML', false, fileHtml);
                }
                EditorUI.saveHistory(); 
                statusEl.innerText = 'Upload complete.';
            } else {
                alert("Upload failed: " + data.message); statusEl.innerText = 'Idle';
            }
        } catch (err) { statusEl.innerText = 'Upload failed.'; }
    },

    updateQuickPaintButton() {
        const quickBtn = document.getElementById('btn-quick-paint');
        if (!quickBtn || this.recentColors.length === 0) return;
        
        const lastColor = this.recentColors[0]; 
        quickBtn.style.backgroundColor = lastColor;
        if (this.activeTd || document.querySelectorAll('.void-cell-selected').length > 0) {
            quickBtn.style.display = 'inline-block';
        }
        
        quickBtn.onclick = () => this.applyColorDirectly(lastColor);
    },

    applyColorDirectly(hex) {
        const selectedCells = document.querySelectorAll('.void-cell-selected');
        
        if (selectedCells.length > 0) {
            selectedCells.forEach(td => {
                td.style.backgroundColor = hex;
                td.classList.remove('void-cell-selected');
            });
        } else if (this.activeTd) {
            this.activeTd.style.backgroundColor = hex;
        }
        
        const cellPaintBtn = document.getElementById('btn-cell-paint');
        if (cellPaintBtn) cellPaintBtn.style.display = 'none';
        
        const quickBtn = document.getElementById('btn-quick-paint');
        if (quickBtn) quickBtn.style.display = 'none';
        
        this.saveHistory(); 
    },

    updateToolbarState() {
        const commandMap = {
            'Bold': 'bold',
            'Italic': 'italic',
            'Underline': 'underline',
            'Strikethrough': 'strikethrough',
            'Superscript': 'superscript',
            'Subscript': 'subscript'
        };

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

            try {
                const currentFont = document.queryCommandValue('fontName');
                const fontSelect = document.getElementById('font-family-select');
                if (fontSelect && currentFont) {
                    const cleanFont = currentFont.replace(/['"]/g, '');
                    let found = false;
                    for (let i = 0; i < fontSelect.options.length; i++) {
                        if (fontSelect.options[i].value.toLowerCase() === cleanFont.toLowerCase()) {
                            fontSelect.selectedIndex = i;
                            found = true;
                            break;
                        }
                    }
                    if (!found) fontSelect.selectedIndex = -1; 
                }
            } catch(e) {}

            try {
                const node = sel.anchorNode;
                const element = node.nodeType === 3 ? node.parentElement : node;
                
                if (element && element !== contentArea) {
                    const computedStyle = window.getComputedStyle(element);
                    const pxSize = parseFloat(computedStyle.fontSize);
                    if (!isNaN(pxSize)) {
                        const ptSize = Math.round(pxSize * 0.75) + 'pt';
                        const sizeSelect = document.getElementById('font-size-select');
                        if (sizeSelect) {
                            let found = false;
                            for (let i = 0; i < sizeSelect.options.length; i++) {
                                if (sizeSelect.options[i].value === ptSize) {
                                    sizeSelect.selectedIndex = i;
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) sizeSelect.selectedIndex = -1; 
                        }
                    }
                }
            } catch(e) {}

        } else {
            for (const title of Object.keys(commandMap)) {
                const btn = document.querySelector(`.tool-btn[title="${title}"]`);
                if (btn) btn.classList.remove('active-tool');
            }
            const fontSelect = document.getElementById('font-family-select');
            if (fontSelect) fontSelect.selectedIndex = -1;
            const sizeSelect = document.getElementById('font-size-select');
            if (sizeSelect) sizeSelect.selectedIndex = -1;
        }
    },

    saveHistory() {
        const contentArea = document.getElementById('editor-content');
        if (!contentArea) return;
        const content = contentArea.innerHTML;
        
        if (this.historyStep >= 0 && this.editorHistory[this.historyStep] === content) return;

        if (this.historyStep < this.editorHistory.length - 1) {
            this.editorHistory = this.editorHistory.slice(0, this.historyStep + 1);
        }

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