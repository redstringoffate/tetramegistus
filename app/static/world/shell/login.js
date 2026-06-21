// static/world/shell/login.js

/* =========================================================
   1. 원본 로직 유지 (CSS 격리 완료)
========================================================= */

// 🚀 [추가됨]: Ritual 전용 Pulse 발송 함수
function sendRitualPulse(keyword) {
    fetch('/api/godmode/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: keyword, duration: 0, country: "Other" })
    }).catch(e => console.error("[Omniscience] Pulse failed:", e));
}

function collectSeedsDirectly() {
    const extraSeeds = [];
    const invalidKeys = [
        "me", "active_seed", "active_davison", "current_seed_idx",
        "current_seed_text", "session", "session_user_id", "tetramegistus.me",
        "nigredo_time_locked", "albedo_time_locked", "albedo_s1_idx", "albedo_s2_idx"
    ];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (invalidKeys.includes(key) || key.startsWith("temp_") || key.startsWith("albedo_")) continue;

        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.birth_date && data.name) {
                extraSeeds.push({
                    name: data.name,
                    birth_date: data.birth_date,
                    birth_time: (!data.birth_time || data.birth_time === "00:00") ? "12:00:00" : data.birth_time,
                    location: data.location || "Unknown",
                    lat: data.lat, lng: data.lng, timezone: data.timezone, is_unknown_time: data.is_unknown_time,
                    _local_idx: (data.idx !== undefined && data.idx !== null) ? Number(data.idx) : 999
                });
            }
        } catch (e) { continue; }
    }

    extraSeeds.sort((a, b) => a._local_idx - b._local_idx);
    extraSeeds.forEach(seed => delete seed._local_idx);
    return extraSeeds;
}

async function handleInitialSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const pw = document.getElementById('password').value;
    const errorDiv = document.getElementById('password-error');
    
    if (pw.length < 8) {
        errorDiv.textContent = "password must be at least 8-digits";
        return;
    }
    errorDiv.textContent = "";

    try {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', pw);

        const response = await fetch('/api/auth/login', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.status === "success") {
            // 🚀 [수복 핵심]: 로그인 성공 시, PC/모바일 불문하고 브라우저에 남아있던 오염된 기억을 즉시 소각합니다.
            localStorage.removeItem('tetramegistus.me');
            localStorage.removeItem('active_seed');

            // 🚀 [추가됨]: 로그인 성공 시, 이스터에그(Hidden) 가입을 통한 첫 각성인지 확인
            if (result.is_hidden_anamnesis) {
                sendRitualPulse('ANAMNESIS_HIDDEN');
                // 펄스가 서버에 기록될 틈(300ms)을 준 뒤 이동
                setTimeout(() => {
                    window.location.href = result.redirect || "/world/nigredo";
                }, 300);
            } else {
                window.location.href = result.redirect || "/world/nigredo";
            }
        } else if (result.status === "anamnesis") {
            initiateAnamnesis();
        } else {
            errorDiv.textContent = result.message || "Invalid memory.";
            errorDiv.style.opacity = "1";
            setTimeout(() => { errorDiv.style.opacity = "0"; }, 3000);
        }
    } catch (err) {
        errorDiv.textContenzt = "Connection failed.";
        errorDiv.style.opacity = "1";
        setTimeout(() => { errorDiv.style.opacity = "0"; }, 3000);
        console.error(err);
    }
}

function initiateAnamnesis() {
    document.getElementById('auth-main').classList.add('dimmed');
    document.getElementById('anamnesis-layer').style.display = 'block';
    document.getElementById('verify-code').focus();
    
    // 🚀 [추가됨]: 사용자가 Anamnesis 진입 (코드 입력창 오픈)
    sendRitualPulse('ANAMNESIS_GATE');
}

async function submitVerification() {
    const email = document.getElementById('email').value;
    const code = document.getElementById('verify-code').value;
    const anamnesisLayer = document.getElementById('anamnesis-layer');

    if (!code) return;

    const seedsToMigrate = collectSeedsDirectly();

    try {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('code', code);
        formData.append('extra_seeds_json', JSON.stringify(seedsToMigrate));

        const response = await fetch('/api/auth/verify', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.status === "success") {
            
            // 🚀 [추가됨]: 가입 성공 시 Normal인지 Hidden인지 분류하여 Pulse 전송
            if (result.anamnesis_type === "hidden") {
                sendRitualPulse('ANAMNESIS_HIDDEN');
            } else {
                sendRitualPulse('ANAMNESIS_NORMAL');
            }

            anamnesisLayer.style.opacity = "0";
            anamnesisLayer.style.pointerEvents = "none";

            setTimeout(() => {
                const overlay = document.createElement("div");
                overlay.className = "migration-success-overlay";

                const veil = document.createElement("div");
                veil.className = "migration-success-veil";

                const text = document.createElement("div");
                text.className = "migration-success-text";
                text.textContent = "verification successful";

                overlay.appendChild(veil);
                overlay.appendChild(text);
                document.body.appendChild(overlay);

                setTimeout(() => { text.style.opacity = "1"; }, 100);

                setTimeout(() => {
                    window.location.replace("/world/nigredo");
                }, 1500);

            }, 800);

        } else {
            const input = document.getElementById('verify-code');
            input.style.borderColor = "#ff4b4b";
            input.value = "";
            input.placeholder = "invalid memory";
            
            setTimeout(() => {
                input.style.borderColor = "#7CFF9B";
                input.placeholder = "enter verification code";
            }, 1500);
        }
    } catch (err) {
        console.error("Verification failed:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const verifyCodeInput = document.getElementById('verify-code');
    if (verifyCodeInput) {
        verifyCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitVerification();
        });
    }
});

function togglePopup(id, show) {
    document.getElementById(id).style.display = show ? 'block' : 'none';
    document.getElementById('popup-blur').style.display = show ? 'block' : 'none';
}

async function sendResetEmail() {
    const email = document.getElementById('reset-email').value;
    if(!email) return;

    try {
        const formData = new FormData();
        formData.append('email', email);
        const response = await fetch('/api/auth/forgot-password', { method: 'POST', body: formData });
        const result = await response.json();
        alert(result.message);
        togglePopup('forgot-popup', false);
    } catch (err) {
        console.error(err);
    }
}

/* =========================================================
   🚀 [ GOD MODE LV4: STEALTH PROTOCOL ]
========================================================= */
let gm4State = 'IDLE';
let gm4Timer = null;
let gm4CodeStr = '';
let gm4Payload = {};

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'Digit7') {
        e.preventDefault();
        startGodMode4PinListen();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const gm4Input = document.getElementById('gm4-input');
    if(gm4Input) {
        gm4Input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (gm4State === 'AWAIT_6DIGIT') submitGm4Code();
                else if (gm4State === 'AWAIT_OTP') submitGm4Otp();
            }
            if (e.key === 'Escape') hideGm4();
        });
    }
});

function startGodMode4PinListen() {
    gm4State = 'AWAIT_PIN';
    gm4CodeStr = '';
    console.log("--- [SYSTEM]: The Void is watching. ---");

    const listener = (e) => {
        if (gm4State !== 'AWAIT_PIN') {
            document.removeEventListener('keydown', listener);
            return;
        }
        
        // 🚀 [수정]: Enter 키를 눌러야만 검증을 시작합니다.
        if (e.key === 'Enter') {
            e.preventDefault();
            document.removeEventListener('keydown', listener);
            verifyGm4Pin(gm4CodeStr); 
            return;
        }

        // 숫자 입력 시 문자열에 추가 (Enter 치기 전까지 계속 모음)
        if (e.key.length === 1 && /[0-9]/.test(e.key)) {
            gm4CodeStr += e.key;
        }
    };

    document.addEventListener('keydown', listener);

    if (gm4Timer) clearTimeout(gm4Timer);
    gm4Timer = setTimeout(() => {
        if (gm4State === 'AWAIT_PIN') {
            gm4State = 'IDLE';
            document.removeEventListener('keydown', listener);
            console.warn("[SYSTEM]: The gateway closed due to silence.");
        }
    }, 5000); // 🚀 [보너스]: 엔터 칠 시간 확보를 위해 타이머를 4초에서 5초로 약간 늘렸습니다.
}

async function verifyGm4Pin(pin) {
    try {
        const fd = new FormData();
        fd.append('secret_pin', pin);
        const res = await fetch('/api/auth/lv4/verify_pin', { method: 'POST', body: fd });
        
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'success') {
                console.log("--- [SYSTEM]: First layer breached. ---");
                gm4Payload.pin = pin; 
                showGm4CodePrompt();
            } else {
                console.warn("--- [SYSTEM]: The Void rejects your offering. ---");
            }
        }
    } catch(e) { console.warn("--- [SYSTEM]: The Void is silent. ---"); }
}

function showGm4CodePrompt() {
    gm4State = 'AWAIT_6DIGIT';
    const overlay = document.getElementById('gm4-overlay');
    const input = document.getElementById('gm4-input');
    const title = document.getElementById('gm4-title');
    
    overlay.classList.remove('closing');
    overlay.style.display = 'flex';
    title.innerText = "enter 6-digit code";
    input.value = "";
    input.focus();

    startGm4Timer();
}

function submitGm4Code() {
    const val = document.getElementById('gm4-input').value.trim();
    if (!val) return;
    gm4Payload.code = val;
    showGm4OtpPrompt(); 
}

function showGm4OtpPrompt() {
    gm4State = 'AWAIT_OTP';
    const input = document.getElementById('gm4-input');
    const title = document.getElementById('gm4-title');
    
    title.innerText = "enter google authenticator";
    input.value = "";
    input.focus();

    startGm4Timer();
}

async function submitGm4Otp() {
    const val = document.getElementById('gm4-input').value.trim();
    if (!val) return;

    if (gm4Timer) clearTimeout(gm4Timer);
    const status = document.getElementById('gm4-status');
    status.innerText = "verifying resonance...";
    
    const fd = new FormData();
    fd.append('secret_pin', gm4Payload.pin); 
    fd.append('code_6digit', gm4Payload.code);
    fd.append('otp', val);

    try {
        const res = await fetch('/api/auth/lv4/awaken', { method: 'POST', body: fd });
        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
            status.innerText = "clearance granted. transitioning...";
            setTimeout(() => {
                alert("GOD MODE LV4: Anamnesis Success!\nAdmin password has been initialized.");
                window.location.replace("/world/nigredo");
            }, 500);
        } else {
            status.innerText = data.message || "the void remains silent.";
            setTimeout(() => hideGm4(), 2000);
        }
    } catch (err) {
        status.innerText = "the void is silent.";
        setTimeout(() => hideGm4(), 2000);
    }
}

function startGm4Timer() {
    if (gm4Timer) clearTimeout(gm4Timer);
    gm4Timer = setTimeout(() => { 
        console.warn("[SYSTEM]: The gateway closed due to hesitation.");
        hideGm4(); 
    }, 12000);
}

function hideGm4() {
    if (gm4Timer) clearTimeout(gm4Timer);
    gm4State = 'IDLE';
    gm4Payload = {};
    
    const overlay = document.getElementById('gm4-overlay');
    overlay.classList.add('closing');
    
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('closing');
        document.getElementById('gm4-input').value = "";
        document.getElementById('gm4-status').innerText = "";
    }, 2000);
}