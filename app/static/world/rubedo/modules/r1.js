/* static/world/rubedo/modules/r1.js */

const R1 = {
    state: { sort: 'chrono', isArchivum: false, articles: [], archivumArticles: [], currentLang: 'en' },
    entryTime: 0, // 🚀 글 체류 시간 타이머
    currentArticleId: null, // 🚀 현재 읽고 있는 글 제목

    async init() {
        this.state.currentLang = this.getLang();
        
        this.updateStateFromURL();
        await this.fetchPublicTree();
        this.syncUI();

        const params = new URLSearchParams(window.location.search);
        const articleId = params.get('article');
        if (articleId) {
            const category = this.state.isArchivum ? 'archivum' : 'hermeticum';
            await this.loadArticle(category, articleId, false);
        } else {
            this.renderList();
        }

        window.onpopstate = () => {
            this.updateStateFromURL();
            this.syncUI();
            const p = new URLSearchParams(window.location.search);
            const aId = p.get('article');
            if (aId) {
                const cat = this.state.isArchivum ? 'archivum' : 'hermeticum';
                this.loadArticle(cat, aId, false);
            } else {
                this.restoreModuleUI();
            }
        };

        setInterval(() => {
            const detectedLang = this.getLang();
            if (this.state.currentLang !== detectedLang) {
                this.state.currentLang = detectedLang;
                if (!document.getElementById('r1-article-viewer') || document.getElementById('r1-article-viewer').style.display === 'none') {
                    this.renderList(true);
                }
            }
        }, 300);
    },

    // 🚀 [수복]: 시간 정밀도 절삭기 (정규식으로 소수점 완벽 제거 및 YYYY-MM-DD HH:mm:ss 포맷)
    formatTime(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return "";
        const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
        if (match) {
            return `${match[1]} ${match[2]}`; // "2026-05-08 00:16:00" 형식으로 반환
        }
        return dateStr;
    },

    // 🚀 24시간 이내 새 글 판별기
    isArticleNew(dateStr) {
        if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('T')) return false;
        const pubDate = new Date(dateStr).getTime();
        const now = Date.now();
        return (now - pubDate) < (24 * 60 * 60 * 1000);
    },

    getLang() {
        if (typeof WorldSettings !== 'undefined') {
            return WorldSettings.get('lang', 'en');
        } else {
            const docLang = document.documentElement.lang || '';
            const cookies = document.cookie || '';
            if (docLang.includes('ko') || cookies.includes('lang=ko')) return 'ko';
            return 'en';
        }
    },

    async fetchPublicTree() {
        try {
            const res = await fetch('/api/theory/r1/tree');
            if (res.ok) {
                const data = await res.json();
                this.state.articles = data.hermeticum || [];
                this.state.archivumArticles = data.archivum || [];
            }
        } catch(e) { console.error("Void fetch failed.", e); }
    },

    updateStateFromURL() {
        const params = new URLSearchParams(window.location.search);
        this.state.sort = params.get('sort') || 'chrono';
        this.state.isArchivum = (params.get('view') === 'archivum');
    },

    updateURL(articleId = null) {
        const url = new URL(window.location.href);
        url.searchParams.set('sort', this.state.sort);
        if (this.state.isArchivum) url.searchParams.set('view', 'archivum');
        else url.searchParams.delete('view');

        if (articleId) url.searchParams.set('article', articleId);
        else url.searchParams.delete('article');

        history.pushState(null, '', url);
    },

    switchSort() {
        this.state.sort = (this.state.sort === 'chrono') ? 'alpha' : 'chrono';
        this.updateURL(null);
        this.syncUI();
        this.renderList();
    },

    toggleArchivum() {
        this.state.isArchivum = !this.state.isArchivum;
        this.updateURL(null);
        this.syncUI();
        this.renderList();
    },

    syncUI() {
        const knob = document.getElementById('r1-sort-knob');
        if (knob) knob.classList.toggle('right', (this.state.sort === 'alpha'));
        const folder = document.getElementById('archivum-folder');
        if (folder) folder.classList.toggle('active-archivum', this.state.isArchivum);
    },

    renderList(isBackgroundUpdate = false) {
        const listContainer = document.getElementById('r1-article-list');
        if (!listContainer) return;

        if (!isBackgroundUpdate) {
            this.restoreModuleUI();
        }
        
        let html = '';
        const targetArray = this.state.isArchivum ? this.state.archivumArticles : this.state.articles;
        const lang = this.state.currentLang;

        // 🚀 1. Archivum 폴더 스캔 및 마커 부여
        const folder = document.getElementById('archivum-folder');
        if (folder) {
            const hasNewArchivum = this.state.archivumArticles.some(a => this.isArticleNew(a.date));
            let marker = document.getElementById('archivum-new-marker');
            
            if (hasNewArchivum) {
                if (!marker) {
                    marker = document.createElement('span');
                    marker.id = 'archivum-new-marker';
                    marker.className = 'r1-new-marker';
                    marker.innerText = 'N';
                    folder.appendChild(marker);
                }
            } else {
                if (marker) marker.remove();
            }
        }

        const pinned = targetArray
            .filter(a => a.pinned)
            .sort((a, b) => (a.pin_order || 0) - (b.pin_order || 0));

        const unpinned = targetArray
            .filter(a => !a.pinned)
            .sort((a, b) => {
                if (this.state.sort === 'chrono') {
                    return (b.date ? new Date(b.date) : 0) - (a.date ? new Date(a.date) : 0);
                }
                const titleA = (lang === 'ko' ? a.title_ko : a.title_en) || a.title || a.id || "";
                const titleB = (lang === 'ko' ? b.title_ko : b.title_en) || b.title || b.id || "";
                return titleA.localeCompare(titleB);
            });

        const sorted = [...pinned, ...unpinned];
        let pinCount = 0; 

        sorted.forEach(art => {
            const sub = this.state.isArchivum ? 'archivum' : 'hermeticum';
            const displayTitle = (lang === 'ko' ? art.title_ko : art.title_en) || art.title || art.id;
            
            // 🚀 2. 개별 글(Row) N 마커 판별 및 시간 절삭 
            const displayDate = this.formatTime(art.date);
            const isNew = this.isArticleNew(art.date);
            const markerHTML = isNew ? `<span class="r1-new-marker">N</span>` : '';
            
            const isPinned = art.pinned;
            const rowClass = isPinned ? 'r1-row sticky-pinned' : 'r1-row';
            const iconClass = isPinned ? 'row-icon pinned-icon' : 'row-icon';
            const iconChar = isPinned ? '❖' : '✧'; 
            
            const stickyStyle = isPinned ? `style="top: ${(pinCount + 1) * 45}px;"` : '';
            if (isPinned) pinCount++;

            html += `<div class="${rowClass}" ${stickyStyle} onclick="R1.loadArticle('${sub}', '${art.id}', true)">
                ${markerHTML}
                <span class="${iconClass}">${iconChar}</span><span class="row-title">${displayTitle}</span><span class="row-meta">${displayDate}</span>
            </div>`;
        });

        for (let i = 0; i < (20 - sorted.length); i++) {
            html += `<div class="r1-row empty-row"><span class="row-title"></span></div>`;
        }
        listContainer.innerHTML = html;
        if (!isBackgroundUpdate) listContainer.scrollTop = 0;
    },

    async loadArticle(category, entryId, pushState = true) {
        try {
            const res = await fetch(`/api/theory/${category}/${entryId}`);
            if (!res.ok) throw new Error("Fetch failed");
            let data = await res.json();
            
            let enTitle = data.title_en || data.title || entryId;
            let koTitle = data.title_ko || data.title || entryId;
            let enContent = data.content_en || data.content || "";
            let koContent = data.content_ko || data.content || "";

            if (!data.content_ko && data.content) {
                const resKo = await fetch(`/api/theory/${category}/${entryId}?lang=ko`);
                if (resKo.ok) {
                    const dataKo = await resKo.json();
                    koTitle = dataKo.title || entryId;
                    koContent = dataKo.content || "";
                }
            }

            const finalData = { 
                key: entryId, 
                title_en: enTitle, 
                title_ko: koTitle, 
                content_en: enContent, 
                content_ko: koContent 
            };

            if (pushState) this.updateURL(entryId);
            
            // 🚀 [글 진입 시점]: 이전 글 정산 및 새 글 조회수 발송
            this.sendDurationPulse(); 
            this.currentArticleId = entryId;
            
            // 🚀 [강제 전송 옵션]: 브라우저가 통신을 임의로 끊지 못하도록 강제합니다.
            fetch('/api/godmode/pulse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin', // 쿠키 누락 방지
                keepalive: true,            // 광속 이탈 시 통신 증발 방지
                body: JSON.stringify({ module: `R1_${entryId}`, duration: 0 })
            }).catch(e => console.log('Traffic pulse failed', e));
            
            this.entryTime = Date.now();

            this.renderArticle(finalData);
        } catch (e) { console.error("Scroll fail.", e); }
    },

    renderArticle(data) {
        const sysContainer = document.querySelector('.r1-hermeticum-system'); 
        if (!sysContainer) return;

        const mainTitle = document.querySelector('.r1-main-title');
        const optionVault = document.querySelector('.r1-option-vault');
        const listViewport = document.querySelector('.r1-list-viewport');

        if (mainTitle) mainTitle.style.display = 'none';
        if (optionVault) optionVault.style.display = 'none';
        if (listViewport) listViewport.style.display = 'none';

        let viewer = document.getElementById('r1-article-viewer');
        if (!viewer) {
            viewer = document.createElement('div');
            viewer.id = 'r1-article-viewer';
            sysContainer.appendChild(viewer); 
        }

        const combinedContent = (data.content_en + data.content_ko).toLowerCase();
        const isGrimoireBanned = combinedContent.includes('#nogrimoire');
        const isLoggedIn = document.cookie.includes('session_user_id');

        let downloadBtnHTML = '';
        if (isLoggedIn && !isGrimoireBanned) {
            downloadBtnHTML = `
                <button class="grimoire-pdf-btn" onclick="R1.triggerPDFDownload('${data.key}')" title="Inscribe to Grimoire">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </button>
            `;
        }

        viewer.innerHTML = `
            ${downloadBtnHTML}
            <div class="content-wrapper-en" style="padding: 20px;">
                <h1 class="article-view-title">${data.title_en}</h1>
                <hr class="article-view-hr">
                <div class="article-body-content">${data.content_en}</div>
            </div>
            <div class="content-wrapper-ko" style="padding: 20px; display: none;">
                <h1 class="article-view-title">${data.title_ko}</h1>
                <hr class="article-view-hr">
                <div class="article-body-content">${data.content_ko}</div>
            </div>
            
            <div class="article-footer-zone">
                <button class="article-return-btn" onclick="R1.returnToList()">◄ RETURN</button>
            </div>
        `;
        viewer.style.display = 'block';
        window.scrollTo(0, 0);

        this.syncViewerLanguage();
        if (this.langInterval) clearInterval(this.langInterval);
        this.langInterval = setInterval(() => this.syncViewerLanguage(), 300);
    },

    async triggerPDFDownload(baseId) {
        const viewer = document.getElementById('r1-article-viewer');
        if (!viewer) return;

        let currentLang = 'en';
        let contentNode = viewer.querySelector('.content-wrapper-en');
        
        const koWrap = viewer.querySelector('.content-wrapper-ko');
        if (koWrap && koWrap.style.display === 'block') {
            currentLang = 'ko';
            contentNode = koWrap;
        }

        const htmlContent = contentNode.innerHTML;
        const defaultFileName = `${baseId}_${currentLang}`;
        let finalName = defaultFileName;

        try {
            const checkRes = await fetch(`/api/grimoire/check_name/rubedo?name=${defaultFileName}`);
            const checkData = await checkRes.json();

            if (checkData.exists) {
                const wantsToRename = confirm(`"${defaultFileName}" already exists in your Grimoire.\nWould you like to save as a different name?`);
                if (wantsToRename) {
                    const newName = prompt("Enter new name for the Grimoire archive:", defaultFileName);
                    if (!newName) return; 
                    finalName = newName;
                }
            }

            await this.runInscriptionRitual(finalName, htmlContent);

        } catch (e) {
            console.error("Grimoire insight failed.", e);
            alert("Failed to communicate with the Grimoire core.");
        }
    },

    async runInscriptionRitual(fileName, html) {
        const overlay = document.getElementById('inscribe-overlay');
        const fillBar = document.getElementById('inscribe-fill');
        const percentageText = document.getElementById('inscribe-percentage');
        
        if (overlay) {
            overlay.style.display = 'flex';
            setTimeout(() => overlay.style.opacity = '1', 10);
        }

        try {
            const res = await fetch('/api/grimoire/save/pdf/r1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_name: fileName,
                    stage: 'rubedo',
                    html_content: html
                })
            });

            if (res.ok) {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.floor(Math.random() * 15) + 5; 
                    if (progress > 100) progress = 100;
                    
                    if (fillBar) fillBar.style.width = `${progress}%`;
                    if (percentageText) percentageText.textContent = `${progress}%`;
                    
                    if (progress === 100) {
                        clearInterval(interval);
                        this.finishInscriptionRitual();
                    }
                }, 50);
            } else {
                throw new Error("Alchemy rejected by the server.");
            }
        } catch (e) {
            console.error("Alchemy failed", e);
            if (overlay) overlay.style.display = 'none';
            alert("Failed to inscribe PDF. The Prima Materia was rejected.");
        }
    },

    finishInscriptionRitual() {
        const statusText = document.getElementById('inscribe-status');
        const barContainer = document.getElementById('inscribe-bar-container');
        const doneText = document.getElementById('inscribe-done');
        const overlay = document.getElementById('inscribe-overlay');
        const fillBar = document.getElementById('inscribe-fill');
        const percentageText = document.getElementById('inscribe-percentage');

        if (statusText) statusText.style.opacity = '0';
        if (barContainer) barContainer.style.opacity = '0';
        if (doneText) doneText.style.opacity = '1';

        setTimeout(() => {
            if (overlay) overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay) overlay.style.display = 'none';
                
                if (fillBar) fillBar.style.width = '0%';
                if (percentageText) percentageText.textContent = '0%';
                if (statusText) statusText.style.opacity = '1';
                if (barContainer) barContainer.style.opacity = '1';
                if (doneText) doneText.style.opacity = '0';
            }, 500); 
        }, 1500); 
    },

    syncViewerLanguage() {
        const viewer = document.getElementById('r1-article-viewer');
        if (!viewer) return;
        
        const lang = this.getLang();
        const isKo = lang.startsWith('ko');
        
        const enWrap = viewer.querySelector('.content-wrapper-en');
        const koWrap = viewer.querySelector('.content-wrapper-ko');
        
        if (isKo) {
            if (enWrap && enWrap.style.display !== 'none') enWrap.style.display = 'none';
            if (koWrap && koWrap.style.display !== 'block') koWrap.style.display = 'block';
        } else {
            if (enWrap && enWrap.style.display !== 'block') enWrap.style.display = 'block';
            if (koWrap && koWrap.style.display !== 'none') koWrap.style.display = 'none';
        }
    },

    returnToList() {
        this.updateURL(null); 
        this.renderList();
    },

    restoreModuleUI() {
        this.sendDurationPulse(); // 🚀 [추가] 메인 리스트로 돌아올 때 체류 시간 정산
        
        const mainTitle = document.querySelector('.r1-main-title');
        const optionVault = document.querySelector('.r1-option-vault');
        const listViewport = document.querySelector('.r1-list-viewport');
        
        if (mainTitle) mainTitle.style.display = ''; 
        if (optionVault) optionVault.style.display = '';
        if (listViewport) listViewport.style.display = '';

        const viewer = document.getElementById('r1-article-viewer');
        if (viewer) viewer.style.display = 'none';
        
        if (this.langInterval) clearInterval(this.langInterval);
    },

    sendDurationPulse() {
        if (!this.currentArticleId || !this.entryTime) return;

        const durationSec = Math.floor((Date.now() - this.entryTime) / 1000);
        if (durationSec <= 0) return;

        console.log(`[Omniscience] R1 Sub-article closed. Sending duration: ${durationSec}s for R1_${this.currentArticleId}`);

        fetch('/api/godmode/pulse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true, 
            body: JSON.stringify({
                module: `R1_${this.currentArticleId}`,
                duration: durationSec
            })
        }).catch(e => console.log('Duration pulse failed', e));

        this.entryTime = 0; 
        this.currentArticleId = null;
    }
}; // <-- 기존 R1 객체 닫는 괄호

// 🚀 [추가] 사용자가 브라우저 탭을 꺼버릴 때를 대비한 방어 로직
window.addEventListener('beforeunload', () => {
    R1.sendDurationPulse();
});

R1.init();