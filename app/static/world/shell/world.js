/* ─────────────────────────────────────────────────────────────
   🌍 [Terra Protocol]: 기기 시간대를 통한 국가 역추적 쿠키 주입 (PC)
───────────────────────────────────────────────────────────── */
(function() {
    if (!document.cookie.includes('pano_tz=')) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";
        // 1년(31536000초) 동안 유효한 타임존 쿠키를 구워 백엔드 파놉티콘과 공명합니다.
        document.cookie = `pano_tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; sameSite=lax;`;
    }
})();

// static/world/shell/world.js

/* ─────────────────────────────
   🚀 [Stateless Protocol]: 
   모든 점성학 API 요청에 Local Storage 데이터를 포스트잇(Header)으로 강제 부착합니다.
───────────────────────────── */
(function() {
    const originalFetch = window.fetch;
    // ... 이하 기존 코드들 그대로 유지 ...
    window.fetch = async function() {
        let [resource, config] = arguments;
        
        // 점성학 API(/api/astro/)로 가는 요청일 때만 작동합니다.
        if (typeof resource === 'string' && (resource.includes('/api/astro/') || resource.includes('/api/grimoire/'))) {
            config = config || {};
            config.headers = config.headers || {};
            
            // 로컬 스토리지에서 Nigredo(1인)와 Albedo(2인) 데이터를 꺼냅니다.
            const activeSeed = localStorage.getItem('active_seed');
            const activeDavison = localStorage.getItem('active_davison');
            
            // HTTP Header라는 안전한 봉투에 데이터를 담아서 서버로 보냅니다.
            if (activeSeed) config.headers['X-Active-Seed'] = encodeURIComponent(activeSeed);
            if (activeDavison) config.headers['X-Albedo-Seed'] = encodeURIComponent(activeDavison);
        }
        return originalFetch.apply(this, [resource, config]);
    };
})();

/* ─────────────────────────────
   Global Settings Protocol
───────────────────────────── */

const WorldSettings = {
    get: function(key, defaultVal) {
        return localStorage.getItem(`tetramegistus_${key}`) || defaultVal;
    },
    set: function(key, val) {
        localStorage.setItem(`tetramegistus_${key}`, val);
    },
    getHouseCode: function() {
        const val = this.get('house', 'placidus');
        return { 'placidus': 'P', 'koch': 'K', 'whole': 'W' }[val] || 'P';
    }
};

document.addEventListener("DOMContentLoaded", function() {
    ['lang', 'orb', 'house'].forEach(key => {
        const saved = WorldSettings.get(key, null);
        if (saved) {
            const radio = document.querySelector(`input[name="${key}"][value="${saved}"]`);
            if (radio) radio.checked = true;
        }
    });

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

    // 🚀 [신규 추가]: 24시간 내 발행된 Rubedo 글 글로벌 스캔
    fetch('/api/theory/rubedo/check_new')
        .then(res => res.json())
        .then(data => {
            if (data.has_new) {
                const rubedoTab = document.querySelector('.stage-iv');
                if (rubedoTab) {
                    const marker = document.createElement('span');
                    marker.className = 'stage-new-marker';
                    marker.innerText = 'N';
                    rubedoTab.appendChild(marker);
                }
            }
        })
        .catch(err => console.error("Global Radar Failed:", err));
});

/* ─────────────────────────────
   Stage navigation
───────────────────────────── */

document.querySelectorAll(".stage-buttons .stage").forEach(function (el) {
    el.addEventListener("click", function () {
        let stage = null;

        if (el.classList.contains("stage-i")) stage = "nigredo";
        else if (el.classList.contains("stage-ii")) stage = "albedo";
        else if (el.classList.contains("stage-iii")) stage = "citrinitas";
        else if (el.classList.contains("stage-iv")) stage = "rubedo";

        if (!stage) return;

        window.location.href = "/world/" + stage;
    });
});

/* ─────────────────────────────
   Reincarnate (ctrl + shift + 9)
───────────────────────────── */

const overlay = document.getElementById("reincarnate-overlay");
const yesBtn = document.getElementById("reincarnate-yes");
const noBtn = document.getElementById("reincarnate-no");

function openReincarnate() {
    overlay.style.display = "flex";
}

function closeReincarnate() {
    overlay.style.display = "none";
}

document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.shiftKey && e.code === "Digit9") {
        e.preventDefault();
        openReincarnate();
    }
});

if (yesBtn) {
    // 🚀 [수복]: async 함수로 변경
    yesBtn.addEventListener("click", async function () { 
        yesBtn.disabled = true;
        if(noBtn) noBtn.disabled = true;
        yesBtn.innerText = "...";

        // 🚀 [핵심]: 쿠키(식별표)가 삭제되기 전에 파놉티콘에 '환생' 기록부터 쏩니다!
        try {
            await fetch('/api/godmode/pulse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ module: 'REINCARNATION', duration: 0, country: 'Other' })
            });
        } catch (e) {
            console.error("[Omniscience] The void failed to record the reincarnation.");
        }

        setTimeout(async () => {
            // 기록을 무사히 남긴 뒤에 기억(로컬/쿠키)을 지웁니다.
            localStorage.clear();
            sessionStorage.clear();

            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });

            try {
                await fetch("/gate/reincarnate", { method: "POST" });
            } catch (error) {
                console.error("The void remains silent, but the traces are purged.");
            }

            window.location.href = "/";
        }, 3000);
    });
}

if (noBtn) {
    noBtn.addEventListener("click", function () {
        closeReincarnate();
    });
}

/* ─────────────────────────────
   👁️ Panopticon Heartbeat Protocol
───────────────────────────── */
(function() {
    let sessionStartTime = Date.now();
    let totalAccumulatedTime = 0;

    function getModuleName() {
        // 1. URL 모듈 파라미터 확인 (?module=n1)
        const urlParams = new URLSearchParams(window.location.search);
        let modName = urlParams.get('module');
        if (modName) return modName.toUpperCase();

        // 2. Stage HTML의 메타데이터 확인
        const meta = document.getElementById("stage-meta-data");
        if (meta && meta.dataset.activeModule) return meta.dataset.activeModule.toUpperCase();
        
        // 3. 둘 다 없으면 URL 경로로 판별
        let path = window.location.pathname;
        if (path === "/" || path.includes("prima-materia")) return "PRIMA_MATERIA";
        if (path.includes("/login")) return "LOGIN";
        
        // C2, C3 등의 특수 모듈 경로 처리
        if (path.includes("/c2_aleph")) return "C2_ALEPH";
        if (path.includes("/c2_mem")) return "C2_MEM";
        if (path.includes("/c2_shin")) return "C2_SHIN";
        if (path.includes("/c3_ruach")) return "C3_RUACH";
        if (path.includes("/c3_nefesh")) return "C3_NEFESH";
        if (path.includes("/c3_chayah")) return "C3_CHAYAH";
        if (path.includes("/c3_yechidah")) return "C3_YECHIDAH";
        
        // 그 외 기본 경로명 정리
        let cleanPath = path.replace(/\//g, '_').replace(/^_|_$/g, '').toUpperCase();
        return cleanPath || "UNKNOWN";
    }

    function sendPulse() {
        const currentDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
        const totalDuration = totalAccumulatedTime + currentDuration;

        // 1초 미만의 허수(새로고침 등)는 버림
        if (totalDuration < 1) return; 

        const payload = JSON.stringify({
            module: getModuleName(),
            duration: totalDuration,
            country: "Other" // 🌐 국가는 백엔드 IP 분석으로 대체
        });

        // 🚀 브라우저 닫힘/이동 시 가장 신뢰도 높은 sendBeacon API 활용
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/godmode/pulse', blob);
        
        totalAccumulatedTime = 0;
        sessionStartTime = Date.now();
    }

    // 탭을 닫거나 다른 페이지로 이동할 때
    window.addEventListener('beforeunload', sendPulse);
    
    // 모바일 탭 전환, 브라우저 최소화 등 방어 로직
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            sendPulse();
        } else {
            sessionStartTime = Date.now();
        }
    });
})();