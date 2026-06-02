// static/world/shell/stage.js

document.addEventListener("DOMContentLoaded", function() {
    // HTML에 심어둔 브릿지에서 Jinja2 변수를 안전하게 가져옵니다.
    const metaData = document.getElementById("stage-meta-data");
    const currentStage = metaData ? metaData.dataset.stage : ""; 
    const activeModule = metaData ? metaData.dataset.activeModule : "";
    
    // ─────────────────────────────────────────────────────────
    // 🔒 1. Module Lock Enforcer (조건 미충족 모듈 잠금)
    // ─────────────────────────────────────────────────────────
    const hasSeed = !!localStorage.getItem('active_seed');
    const hasDavison = !!localStorage.getItem('active_davison');
    
    let isTimeLocked = false;
    if (currentStage === "nigredo") {
        isTimeLocked = localStorage.getItem('nigredo_time_locked') === 'true';
    } else if (currentStage === "albedo") {
        isTimeLocked = localStorage.getItem('albedo_time_locked') === 'true';
    }

    const timeDependentMods = ['a3', 'a4', 'a7', 'a9', 'n3', 'n4', 'n7', 'n9'];
    const modItems = document.querySelectorAll('.mod-item');

    modItems.forEach(item => {
        const modId = item.dataset.modId;
        const wrapper = item.closest('.mod-item-wrapper');
        const tooltip = wrapper.querySelector('.custom-tooltip');
        
        let lockLevel = 0; 
        let lockReason = "";

        if (currentStage === 'nigredo' && modId !== 'n1' && !hasSeed) {
            lockLevel = 1; lockReason = "Seed Authority: Data required";
        } else if (currentStage === 'albedo' && modId !== 'a1' && !hasDavison) {
            lockLevel = 1; lockReason = "Coniunctio Missing: Manifest union in A1 first";
        }
        
        if (lockLevel === 0 && timeDependentMods.includes(modId) && isTimeLocked) {
            lockLevel = 2; lockReason = "Time Unknown: Houses & Lots calculations disabled";
        }

        if (lockLevel > 0) {
            item.removeAttribute('href'); 
            
            if (lockLevel === 1) {
                item.classList.add('is-locked');
            } else if (lockLevel === 2) {
                item.classList.add('is-time-locked');
                tooltip.style.color = "#ff5252";
                tooltip.style.borderColor = "#ff5252";
            }
            
            tooltip.innerText = lockReason;
            tooltip.classList.add('active-tooltip');

            if (activeModule === modId) {
                const content = document.querySelector('.module-page-content');
                if (content) content.classList.add('content-locked');
            }
        }
    });

    // ─────────────────────────────────────────────────────────
    // 🚀 2. [Module Radar]: 새 글 발행 시 R1/R2 사이드바에 N 마커 부착
    // ─────────────────────────────────────────────────────────
    if (currentStage === "rubedo") {
        fetch('/api/theory/rubedo/check_new')
            .then(res => res.json())
            .then(data => {
                if (data.new_modules) {
                    Object.keys(data.new_modules).forEach(modId => {
                        if (data.new_modules[modId]) {
                            // 해당 모듈 ID를 가진 사이드바 아이템 스캔
                            const targetMod = document.querySelector(`.mod-item[data-mod-id="${modId}"]`);
                            if (targetMod) {
                                const marker = document.createElement('span');
                                marker.className = 'mod-new-marker';
                                marker.innerText = 'N';
                                targetMod.parentElement.appendChild(marker);
                            }
                        }
                    });
                }
            })
            .catch(err => console.error("Module Radar Failed:", err));
    }

    // ─────────────────────────────────────────────────────────
    // 📜 3. Grimoire Inscription Ritual (PDF 저장 의식 및 애니메이션)
    // ─────────────────────────────────────────────────────────
    const inscribeBtn = document.getElementById('btn-inscribe');
    const overlay = document.getElementById('inscribe-overlay');
    const fillBar = document.getElementById('inscribe-fill');
    const percentageText = document.getElementById('inscribe-percentage');
    const doneText = document.getElementById('inscribe-done');
    const statusText = document.getElementById('inscribe-status');
    const barContainer = document.getElementById('inscribe-bar-container');

    const isMember = document.cookie.includes('session_user_id=');
    const isAllowedModule = /^(n[2-9]|a([2-9]|10)|c1)$/.test(activeModule);
    const isContentLocked = document.querySelector('.content-locked') !== null;

    if (isMember && isAllowedModule && !isContentLocked && inscribeBtn) {
        inscribeBtn.style.display = 'block';
    }

    if (inscribeBtn) {
        inscribeBtn.addEventListener('click', async () => {
            if (typeof window.saveToGrimoire === 'function') {
                try {
                    await window.saveToGrimoire(); 
                } catch (e) {
                    console.error("Grimoire Inscription Failed:", e);
                    return; 
                }
            } else {
                console.warn("[Grimoire] No save function defined for this module.");
            }

            inscribeBtn.style.display = 'none'; 
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
                                inscribeBtn.style.display = 'block';
                                
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
});