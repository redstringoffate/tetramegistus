/* ─────────────────────────────
   🚀 [Stateless Protocol]: 
   모든 점성학 API 요청에 Local Storage 데이터를 포스트잇(Header)으로 강제 부착합니다.
───────────────────────────── */
(function() {
    const originalFetch = window.fetch;
    window.fetch = async function() {
        let [resource, config] = arguments;
        
        // 점성학 API(/api/astro/)와 Grimoire(/api/grimoire/) 요청일 때만 작동합니다.
        if (typeof resource === 'string' && (resource.includes('/api/astro/') || resource.includes('/api/grimoire/'))) {
            config = config || {};
            config.headers = config.headers || {};
            
            const activeSeed = localStorage.getItem('active_seed');
            const activeDavisonRaw = localStorage.getItem('active_davison');
            
            if (activeSeed) {
                config.headers['X-Active-Seed'] = encodeURIComponent(activeSeed);
            }
            
            // 🚀 [궁극 수복]: 431 에러를 방지하면서도 하우스/랏 연산에 필수적인 '합성된 시간/좌표' 정보를 함께 보냅니다!
            if (activeDavisonRaw) {
                try {
                    const parsed = JSON.parse(activeDavisonRaw);
                    
                    // 무거운 배열은 버리고, 핵심 유전자와 Davison의 시간/위치 나침반만 추출
                    const compressedSeed = {
                        seed1: parsed.seed1,
                        seed2: parsed.seed2,
                        lat: parsed.lat,
                        lng: parsed.lng,
                        timezone: parsed.timezone,
                        birth_date: parsed.birth_date,
                        birth_time: parsed.birth_time,
                        is_unknown_time: parsed.is_unknown_time,
                        name: parsed.name
                    };
                    config.headers['X-Albedo-Seed'] = encodeURIComponent(JSON.stringify(compressedSeed));
                } catch(e) {
                    // 파싱 실패 시 원본 강제 주입 (Fall-back)
                    config.headers['X-Albedo-Seed'] = encodeURIComponent(activeDavisonRaw);
                }
            }
        }
        return originalFetch.apply(this, [resource, config]);
    };
})();

/* ─────────────────────────────
   📱 Global Settings Protocol (Mobile)
───────────────────────────── */
const WorldSettings = {
    get: function(key, defaultVal) {
        try { return localStorage.getItem(`tetramegistus_${key}`) || defaultVal; } 
        catch(e) { return defaultVal; }
    },
    set: function(key, val) {
        try { localStorage.setItem(`tetramegistus_${key}`, val); } catch(e) {}
    },
    getHouseCode: function() {
        const val = this.get('house', 'placidus');
        return { 'placidus': 'P', 'koch': 'K', 'whole': 'W' }[val] || 'P';
    }
};

// 🚀 [세팅창 토글]
window.toggleSettings = function() {
    const normalSidebar = document.getElementById('sidebar-normal');
    const settingsSidebar = document.getElementById('sidebar-settings');
    const btnSettings = document.getElementById('btn-settings');

    if (!settingsSidebar || !normalSidebar || !btnSettings) return;

    if (settingsSidebar.classList.contains('hidden-sidebar')) {
        normalSidebar.classList.add('hidden-sidebar');
        settingsSidebar.classList.remove('hidden-sidebar');
        btnSettings.classList.add('active'); 
    } else {
        settingsSidebar.classList.add('hidden-sidebar');
        normalSidebar.classList.remove('hidden-sidebar');
        btnSettings.classList.remove('active'); 
    }
};

// 🚀 [아코디언 토글 프로토콜 심화 수복]
window.toggleAccordion = function(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const arrow = target.previousElementSibling.querySelector('.acc-arrow');

    // 브라우저가 최종 계산한 현재 display 상태를 판정 (CSS default none 추적)
    const isHidden = window.getComputedStyle(target).display === 'none';

    if (isHidden) {
        target.style.display = 'block';
        if (arrow) arrow.style.transform = 'rotate(0deg)'; // 아래를 향함 (열림)
    } else {
        target.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(-90deg)'; // 오른쪽을 향함 (닫힘)
    }
};

document.addEventListener("DOMContentLoaded", () => {
    
    // 🚀 [세팅 초기화 및 기본값(DEF) 적용]
    const defaultSettings = { 'lang': 'en', 'orb': '1.0', 'house': 'placidus' };
    
    ['lang', 'orb', 'house'].forEach(key => {
        // 로컬스토리지에 없으면 defaultSettings 값 사용
        const saved = WorldSettings.get(key, defaultSettings[key]);
        const radio = document.querySelector(`input[name="${key}"][value="${saved}"]`);
        if (radio) radio.checked = true;
    });

    // 🚀 [세팅 변경 핸들러]
    document.querySelectorAll('#sidebar-settings input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            WorldSettings.set(this.name, this.value);
            if (this.name === 'house') {
                const url = new URL(window.location.href);
                url.searchParams.set('h_sys', WorldSettings.getHouseCode());
                window.location.href = url.toString();
            } else {
                location.reload();
            }
        });
    });

    // ==========================================
    // 기존 미닫이문 및 의식(Ritual) 로직
    // ==========================================
    const drawer = document.getElementById("mobile-drawer");
    const tHandle = document.getElementById("t-handle");
    const container = document.getElementById("stage-container"); 
    const dimmer = document.getElementById("ritual-dimmer");
    
    // Reincarnate Elements
    const reincarnateOverlay = document.getElementById("reincarnate-overlay");
    const btnYes = document.getElementById("reincarnate-yes");
    const btnNo = document.getElementById("reincarnate-no");
    
    let isDrawerOpen = false;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    const drawerWidth = 260; 

    // 💀 9초 의식(Ritual) 타이머 변수
    let pressTimer = null;
    let isRitualComplete = false;
    const RITUAL_DURATION = 9000; // 9초

    if (!tHandle || !drawer) return;

    tHandle.addEventListener("touchstart", (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        drawer.style.transition = 'none'; 
        
        isRitualComplete = false;
        tHandle.classList.add("charging");
        if (dimmer) dimmer.classList.add("charging");

        pressTimer = setTimeout(() => {
            isRitualComplete = true;
            cancelRitual(); 
            if (reincarnateOverlay) reincarnateOverlay.classList.remove("hidden-element"); 
        }, RITUAL_DURATION);

    }, { passive: false });

    document.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        let deltaX = currentX - startX;

        if (Math.abs(deltaX) > 10) cancelRitual();

        let translateX;
        if (!isDrawerOpen) {
            if (deltaX > 0) deltaX = 0; 
            translateX = drawerWidth + deltaX; 
            if (translateX < 0) translateX = 0;
        } else {
            if (deltaX < 0) deltaX = 0; 
            translateX = deltaX;
            if (translateX > drawerWidth) translateX = drawerWidth;
        }
        drawer.style.transform = `translateX(${translateX}px)`;
    }, { passive: false });

    document.addEventListener("touchend", (e) => {
        if (!isDragging) return;
        isDragging = false;
        drawer.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
        
        if (!isRitualComplete) cancelRitual();

        let deltaX = currentX - startX;
        
        if (Math.abs(deltaX) < 10) {
            if (isDrawerOpen) closeDrawer();
            else openDrawer();
            return;
        }

        if (!isDrawerOpen) {
            if (deltaX < -50) openDrawer(); 
            else closeDrawer();             
        } else {
            if (deltaX > 50) closeDrawer(); 
            else openDrawer();              
        }
    });

    document.addEventListener("touchcancel", cancelRitual);

    function cancelRitual() {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
        tHandle.classList.remove("charging");
        if (dimmer) dimmer.classList.remove("charging");
    }

    if (container) {
        container.addEventListener("click", () => {
            if (isDrawerOpen) closeDrawer();
        });
    }

    function openDrawer() {
        isDrawerOpen = true;
        drawer.style.transform = `translateX(0px)`;
    }

    function closeDrawer() {
        isDrawerOpen = false;
        drawer.style.transform = `translateX(${drawerWidth}px)`;
    }

    // =========================================================
    // 💀 Reincarnate 서버 연동
    // =========================================================
    if (btnNo && reincarnateOverlay) {
        btnNo.addEventListener("click", () => {
            reincarnateOverlay.classList.add("hidden-element");
        });
    }

    if (btnYes) {
        btnYes.addEventListener("click", async () => { 
            btnYes.disabled = true;
            if(btnNo) btnNo.disabled = true;
            btnYes.innerText = "...";

            try {
                await fetch('/api/godmode/pulse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ module: 'REINCARNATION', duration: 0, country: 'Other' })
                });
            } catch (e) {
                console.error("[Omniscience] failed to record.");
            }

            setTimeout(async () => {
                localStorage.clear();
                sessionStorage.clear();
                document.cookie.split(";").forEach(function(c) { 
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                });

                try {
                    await fetch("/gate/reincarnate", { method: "POST" });
                } catch (error) {}

                window.location.replace("/prima-materia"); 
            }, 3000); 
        });
    }
});

/* ==========================================
   🚀 Global Radar Protocol (전역 N 마커 감지기) - 궁극 완전체 버전
========================================== */
const GlobalRadar = {
    async init() {
        try {
            // 🚀 [API 방어전]: 단일 API에 의존하지 않고, 가능한 모든 엔드포인트를 찔러서 데이터를 박긁어옵니다.
            const fetchJson = async (url) => {
                try {
                    const r = await fetch(url);
                    if (r.ok) return await r.json();
                } catch(e) {}
                return null;
            };

            const [r1Pub, r2Pub, sabianPub, godTree] = await Promise.all([
                fetchJson('/api/theory/r1/tree'),
                fetchJson('/api/theory/r2/tree'),
                fetchJson('/api/theory/sabian/tree'),
                fetchJson('/api/godmode/tree') // 어드민 토큰이 있으면 무조건 여기서 완벽한 트리를 확보합니다!
            ]);

            // JSON을 끝까지 파고들어 date만 전부 추출하는 마법의 재귀 함수
            const getAllDates = (obj) => {
                let dates = [];
                const traverse = (current) => {
                    if (!current || typeof current !== 'object') return;
                    if (current.date) dates.push(current.date);
                    for (const key in current) {
                        if (Object.prototype.hasOwnProperty.call(current, key)) {
                            traverse(current[key]);
                        }
                    }
                };
                traverse(obj);
                return dates;
            };

            // 끌어모은 모든 데이터를 R1과 R2로 분류하여 융합
            const datesR1 = [
                ...getAllDates(r1Pub),
                ...getAllDates(godTree ? godTree.r1 : null)
            ];

            const datesR2 = [
                ...getAllDates(r2Pub),
                ...getAllDates(sabianPub),
                ...getAllDates(godTree ? godTree.r2 : null)
            ];

            const hasNewR1 = datesR1.some(d => this.isNew(d));
            const hasNewR2 = datesR2.some(d => this.isNew(d));

            // 📱 모바일 UI 마커 부착 프로토콜
            if (hasNewR1 || hasNewR2) {
                this.attachMarker('.m-stage-iv', 'tab-marker'); // 상단 탭
            }
            if (hasNewR1) {
                // 🚀 [UI 방어전]: 대소문자 무시(i) + a태그 href까지 추적해서 무조건 찾아냅니다.
                this.attachMarker('.m-mod-item[data-module="r1" i], a[href*="module=r1" i].m-mod-item', 'drawer-marker');
            }
            if (hasNewR2) {
                this.attachMarker('.m-mod-item[data-module="r2" i], a[href*="module=r2" i].m-mod-item', 'drawer-marker');
            }
        } catch(e) {
            console.log("Global Radar signal lost.", e);
        }
    },
    
    isNew(dateStr) {
        if (!dateStr) return false;
        const postDate = new Date(dateStr).getTime();
        if (isNaN(postDate)) return false; 
        return (Date.now() - postDate) < (24 * 60 * 60 * 1000);
    },
    
    attachMarker(selector, typeClass) {
        // 🚀 [UI 방어전]: 화면에 숨겨진 모바일 서랍이 여러 개일 수 있으므로 querySelectorAll로 '전부' 찾아서 붙입니다.
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el.querySelector('.m-global-n-marker')) return; // 이미 있으면 패스
            
            el.style.position = 'relative'; 
            const marker = document.createElement('span');
            marker.className = `m-global-n-marker ${typeClass}`;
            marker.innerText = 'N';
            el.appendChild(marker);
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    GlobalRadar.init();
});

/* ─────────────────────────────────────────────────────────────
   🔒 [최종 수복] Time/Data Missing Mobile Drawer & Grimoire Control
   ───────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    const stageStr = window.location.pathname;
    
    // 1. 상태 변수 추출 (PC판 로직 이식)
    const hasSeed = !!localStorage.getItem('active_seed');
    const hasDavison = !!localStorage.getItem('active_davison');
    let isTimeLocked = false;
    
    if (stageStr.includes('/nigredo')) {
        isTimeLocked = localStorage.getItem('nigredo_time_locked') === 'true';
    } else if (stageStr.includes('/albedo')) {
        isTimeLocked = localStorage.getItem('albedo_time_locked') === 'true';
    }

    const timeDependentMods = ['n3', 'n4', 'n7', 'n9', 'a3', 'a4', 'a7', 'a9'];
    
    const urlParams = new URLSearchParams(window.location.search);
    const contentDiv = document.getElementById('m-global-mod-content');
    const htmlMod = contentDiv ? contentDiv.dataset.activeModule : null;
    
    const rawMod = urlParams.get('module') || htmlMod;
    const currentMod = rawMod ? rawMod.toLowerCase() : null;

    // 🚀 2. 모바일 서랍(Drawer) 메뉴 아이템 잠금 처리
    document.querySelectorAll('.m-mod-item').forEach(item => {
        const modId = item.dataset.modId ? item.dataset.modId.toLowerCase() : (item.dataset.module ? item.dataset.module.toLowerCase() : ''); 
        
        let lockLevel = 0;
        
        // 1단계: 기본 시드(데이터) 없음
        if (stageStr.includes('/nigredo') && modId !== 'n1' && !hasSeed) lockLevel = 1;
        else if (stageStr.includes('/albedo') && modId !== 'a1' && !hasDavison) lockLevel = 1;
        
        // 2단계: 시간 미상
        if (lockLevel === 0 && timeDependentMods.includes(modId) && isTimeLocked) lockLevel = 2;

        if (lockLevel > 0) {
            item.addEventListener('click', (e) => {
                e.preventDefault(); 
                e.stopPropagation();
                if (lockLevel === 1) alert("Coniunctio Missing: Manifest union in A1 first");
                if (lockLevel === 2) alert("TIME UNKNOWN\nCalculation is locked.");
            });
            
            // 시각적 잠금 처리
            if (lockLevel === 1) {
                item.style.opacity = '0.15';
                item.style.filter = 'grayscale(1)';
            }
            if (lockLevel === 2) {
                item.classList.add('is-time-locked');
                item.style.opacity = '0.3';
                item.style.borderLeft = '2px solid rgba(255, 82, 82, 0.4)';
            }
        }
    });
    

    // 🚀 3. 메인 콘텐츠(화면) 자체 암막 처리 (PC의 content-locked 이식)
    let isCurrentModuleLocked = false;
    if (stageStr.includes('/nigredo') && currentMod !== 'n1' && currentMod && !hasSeed) isCurrentModuleLocked = true;
    else if (stageStr.includes('/albedo') && currentMod !== 'a1' && currentMod && !hasDavison) isCurrentModuleLocked = true;

    // 🚀 [수복]: C3 모듈은 생시 락(Lock)에서 무조건 제외시킵니다!
    if (currentMod && currentMod.startsWith('c3')) isCurrentModuleLocked = false;

    if (isCurrentModuleLocked && contentDiv) {
        // 별도의 CSS 추가 없이 PC와 똑같은 암막 효과를 JS로 강제 주입합니다.

        contentDiv.style.filter = 'grayscale(1)';
        contentDiv.style.opacity = '0.1';
        contentDiv.style.pointerEvents = 'none';
        contentDiv.style.userSelect = 'none';
        contentDiv.style.transition = 'opacity 0.4s ease';
    }

    // 시간 미상 전용 자물쇠 락 처리 (기존 로직 유지)
    if (!isCurrentModuleLocked && isTimeLocked && currentMod && timeDependentMods.includes(currentMod)) {
        const lockOverlay = document.getElementById('m-global-time-lock');
        if (contentDiv) contentDiv.style.display = 'none';
        if (lockOverlay) lockOverlay.classList.remove('m-hidden');
    }

    // 🚀 4. [전역 그리모어]: 보안 결계(회원/시드) 검증 및 애니메이션
    if (currentMod) {
        const btn = document.getElementById('m-global-grimoire-btn');
        const overlay = document.getElementById('inscribe-overlay');
        const fillBar = document.getElementById('inscribe-fill');
        const percentageText = document.getElementById('inscribe-percentage');
        const doneText = document.getElementById('inscribe-done');
        const statusText = document.getElementById('inscribe-status');
        const barContainer = document.getElementById('inscribe-bar-container');
        
        if (btn) {
            const isMember = document.cookie.includes('session_user_id=');
            const noGrimoire = currentMod === 'n1' || currentMod === 'a1' || currentMod.startsWith('c2') || currentMod.startsWith('c3') || currentMod.startsWith('r')
            const isTimeLockedModule = isTimeLocked && timeDependentMods.includes(currentMod);

            // 암막 락(isCurrentModuleLocked)이 걸린 상태여도 저장 버튼이 뜨지 않도록 방어 추가
            if (isMember && !isCurrentModuleLocked && !noGrimoire && !isTimeLockedModule) {
                btn.style.setProperty('display', 'block', 'important'); 
            } else {
                btn.style.setProperty('display', 'none', 'important');
            }

            if (!btn.hasAttribute('data-bound')) {
                btn.setAttribute('data-bound', 'true');
                
                btn.addEventListener('click', async () => {
                    if (typeof window.saveToGrimoire === 'function') {
                        try {
                            const success = await window.saveToGrimoire();
                            if (!success) return; 
                        } catch (e) {
                            console.error("Grimoire Inscription Failed:", e);
                            return; 
                        }
                    } else {
                        console.warn("[Grimoire] No save function defined.");
                        return;
                    }

                    // 애니메이션 의식(Ritual) 시작
                    btn.style.display = 'none'; 
                    overlay.style.display = 'flex';     
                    
                    requestAnimationFrame(() => {
                        overlay.style.opacity = '1';
                        
                        let progress = 0;
                        const duration = 1500; 
                        const interval = 20;
                        const step = (100 / (duration / interval));

                        const loading = setInterval(() => {
                            progress += step;
                            const currentProgress = Math.min(progress, 100);
                            
                            fillBar.style.width = `${currentProgress}%`;
                            percentageText.textContent = `${Math.floor(currentProgress)}%`;

                            if (progress >= 100) {
                                clearInterval(loading);
                                
                                statusText.style.opacity = '0';
                                barContainer.style.opacity = '0';
                                doneText.style.opacity = '1';
                                
                                setTimeout(() => {
                                    overlay.style.opacity = '0';
                                    setTimeout(() => {
                                        overlay.style.display = 'none';
                                        btn.style.display = 'block';
                                        
                                        fillBar.style.width = '0%';
                                        percentageText.textContent = '0%';
                                        statusText.style.opacity = '1';
                                        barContainer.style.opacity = '1';
                                        doneText.style.opacity = '0';
                                    }, 400);
                                }, 1200);
                            }
                        }, interval);
                    });
                });
            }
        }
    }
});

/* ─────────────────────────────────────────────────────────────
   🔮 [궁극 전역 수복]: 모바일 무반응 프리징 격파용 전역 로딩 프로토콜 (CSS 분리형)
   ───────────────────────────────────────────────────────────── */
(function() {
    // 1. DOM에 뼈대만 깔끔하게 주입
    const createGlobalLoader = () => {
        if (document.getElementById('m-global-nexus-loader')) return;

        const loader = document.createElement('div');
        loader.id = 'm-global-nexus-loader';
        
        loader.innerHTML = `
            <div class="spinner-core"></div>
            <div class="loader-text">TRANSMUTING MATRIX...</div>
        `;

        document.body.appendChild(loader);
    };

    // 2. CSS 클래스 토글 방식의 장막 활성화 트리거
    const triggerGlobalLock = () => {
        const loader = document.getElementById('m-global-nexus-loader');
        if (loader) {
            loader.classList.add('is-active');
        }
    };

    // 3. 클릭 감시 및 결계 발동
    document.addEventListener('DOMContentLoaded', () => {
        createGlobalLoader();

        document.addEventListener('click', (e) => {
            const targetLink = e.target.closest('a');
            const targetMod = e.target.closest('.m-mod-item');
            const targetTab = e.target.closest('.m-tab, .m-stage-tab');

            if (targetLink || targetMod || targetTab) {
                // 뒤로가기 방지용 자물쇠에 걸린 상태면 스킵
                if (targetMod && (targetMod.classList.contains('is-time-locked') || targetMod.style.opacity === '0.15')) {
                    return;
                }

                const href = targetLink ? targetLink.getAttribute('href') : null;
                
                if (!href || (!href.startsWith('#') && !href.startsWith('javascript'))) {
                    triggerGlobalLock();
                }
            }
        });
    });

    // 브라우저 뒤로가기(BFCache) 시 켜져 있는 로딩 장막 해제
    window.addEventListener('pageshow', (event) => {
        const loader = document.getElementById('m-global-nexus-loader');
        if (loader && event.persisted) {
            loader.classList.remove('is-active');
        }
    });
})();