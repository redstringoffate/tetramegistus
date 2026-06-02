/* static/mobile/world/rubedo/modules/r1.js */

const R1 = {
    state: { sort: 'chrono', isArchivum: false, articles: [], archivumArticles: [], currentLang: 'en' },
    entryTime: 0, 
    currentArticleId: null, 
    langInterval: null,

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

    formatTime(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return "";
        const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
        if (match) {
            return `${match[1]} ${match[2]}`;
        }
        return dateStr;
    },

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

        if (!isBackgroundUpdate) this.restoreModuleUI();
        
        let html = '';
        const targetArray = this.state.isArchivum ? this.state.archivumArticles : this.state.articles;
        const lang = this.state.currentLang;

        const sorted = [...targetArray].sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            if (this.state.sort === 'chrono') return (new Date(b.date) - new Date(a.date));
            const tA = (lang === 'ko' ? a.title_ko : a.title_en) || a.title;
            const tB = (lang === 'ko' ? b.title_ko : b.title_en) || b.title;
            return tA.localeCompare(tB);
        });

        sorted.forEach(art => {
            const sub = this.state.isArchivum ? 'archivum' : 'hermeticum';
            const displayTitle = (lang === 'ko' ? art.title_ko : art.title_en) || art.title || art.id;
            const displayDate = this.formatTime(art.date);
            const isNew = this.isArticleNew(art.date);
            
            const markerHTML = isNew ? `<span class="r1-new-marker">N</span>` : '';
            const iconChar = art.pinned ? '❖' : '✧'; 
            
            html += `<div class="${art.pinned ? 'r1-row sticky-pinned' : 'r1-row'}" onclick="R1.loadArticle('${sub}', '${art.id}', true)">
                ${markerHTML}
                <span class="row-icon">${iconChar}</span>
                <div class="row-text-group">
                    <span class="row-title">${displayTitle}</span>
                    <span class="row-meta">${displayDate}</span>
                </div>
            </div>`;
        });
        listContainer.innerHTML = html;
    },

    async loadArticle(category, entryId, pushState = true) {
        try {
            const res = await fetch(`/api/theory/${category}/${entryId}`);
            if (!res.ok) throw new Error("Fetch failed");
            let data = await res.json();
            
            if (pushState) this.updateURL(entryId);
            this.sendDurationPulse(); 
            this.currentArticleId = entryId;
            this.entryTime = Date.now();
            this.renderArticle(data);
        } catch (e) { console.error("Load fail.", e); }
    },

    renderArticle(data) {
        const sysContainer = document.querySelector('.r1-hermeticum-system'); 
        if (!sysContainer) return;

        document.querySelector('.r1-main-title').style.display = 'none';
        document.querySelector('.r1-option-vault').style.display = 'none';
        document.querySelector('.r1-list-viewport').style.display = 'none';

        let viewer = document.getElementById('r1-article-viewer');
        if (!viewer) {
            viewer = document.createElement('div');
            viewer.id = 'r1-article-viewer';
            sysContainer.appendChild(viewer); 
        }

        // 🚀 [복원]: Grimoire 세이브 제한 조건문 계산 로직
        const combinedContent = ((data.content_en || "") + (data.content_ko || "") + (data.content || "")).toLowerCase();
        const isGrimoireBanned = combinedContent.includes('#nogrimoire');
        const isLoggedIn = document.cookie.includes('session_user_id');

        // 🚀 [복원]: 로그인 상태 및 금지 태그가 없을 때만 SVG 아이콘 주입
        let downloadBtnHTML = '';
        if (isLoggedIn && !isGrimoireBanned) {
            downloadBtnHTML = `
                <button class="grimoire-pdf-btn" onclick="R1.triggerPDFDownload('${this.currentArticleId}')" title="Inscribe to Grimoire">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </button>
            `;
        }
        
        // 🚀 [수정]: 현재 설정된 언어를 가져와서 제목과 본문을 동적으로 할당
        const lang = this.state.currentLang;
        const displayTitle = (lang === 'ko' ? data.title_ko : data.title_en) || data.title;
        const displayContent = (lang === 'ko' ? data.content_ko : data.content_en) || data.content;

        viewer.innerHTML = `
            ${downloadBtnHTML}
            <div class="content-wrapper-${lang}" style="padding: 10px 5px;">
                <h1 class="article-view-title">${displayTitle}</h1>
                <div class="article-body-content">${displayContent}</div>
            </div>
            <div class="article-footer-zone">
                <button class="article-return-btn" onclick="R1.returnToList()">◄ RETURN</button>
            </div>
        `;
        viewer.style.display = 'block';
        
        const mainContentEl = document.querySelector('.page-content');
        if(mainContentEl) mainContentEl.scrollTop = 0;
    },

    // 🚀 [복원]: Grimoire 다운로드 트리거 세션 파트
    async triggerPDFDownload(baseId) {
        const viewer = document.getElementById('r1-article-viewer');
        if (!viewer) return;

        const contentNode = viewer.querySelector('.content-wrapper-en');
        const htmlContent = contentNode.innerHTML;
        const defaultFileName = `${baseId}_en`;
        let finalName = defaultFileName;

        try {
            const checkRes = await fetch(`/api/grimoire/check_name/rubedo?name=${defaultFileName}`);
            const checkData = await checkRes.json();

            if (checkData.exists) {
                const wantsToRename = confirm(`"${defaultFileName}" already exists in your Grimoire.\nSave as a different name?`);
                if (wantsToRename) {
                    const newName = prompt("Enter new name for the Grimoire archive:", defaultFileName);
                    if (!newName) return; 
                    finalName = newName;
                }
            }
            await this.runInscriptionRitual(finalName, htmlContent);
        } catch (e) {
            alert("Failed to communicate with the Grimoire core.");
        }
    },

    // 🚀 [복원]: 프로그레스 오버레이 애니메이션 구동 프로세스
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
                body: JSON.stringify({ target_name: fileName, stage: 'rubedo', html_content: html })
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
            } else { throw new Error("Alchemy rejected."); }
        } catch (e) {
            if (overlay) overlay.style.display = 'none';
            alert("Failed to inscribe PDF.");
        }
    },

    finishInscriptionRitual() {
        const overlay = document.getElementById('inscribe-overlay');
        const fillBar = document.getElementById('inscribe-fill');
        const percentageText = document.getElementById('inscribe-percentage');

        setTimeout(() => {
            if (overlay) overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay) overlay.style.display = 'none';
                if (fillBar) fillBar.style.width = '0%';
                if (percentageText) percentageText.textContent = '0%';
            }, 500); 
        }, 1500); 
    },

    returnToList() {
        this.updateURL(null); 
        this.renderList();
    },

    restoreModuleUI() {
        this.sendDurationPulse(); 
        document.querySelector('.r1-main-title').style.display = ''; 
        document.querySelector('.r1-option-vault').style.display = '';
        document.querySelector('.r1-list-viewport').style.display = '';
        const viewer = document.getElementById('r1-article-viewer');
        if (viewer) viewer.style.display = 'none';
    },

    sendDurationPulse() {
        if (!this.currentArticleId || !this.entryTime) return;
        const durationSec = Math.floor((Date.now() - this.entryTime) / 1000);
        fetch('/api/godmode/pulse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true, 
            body: JSON.stringify({ module: `R1_${this.currentArticleId}`, duration: durationSec })
        }).catch(e => console.log('Pulse failed', e));
        this.entryTime = 0; 
        this.currentArticleId = null;
    }
};

document.addEventListener('DOMContentLoaded', () => { R1.init(); });