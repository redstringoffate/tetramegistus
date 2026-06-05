// gate/ritual.js

let mode = null;
let buffer = "";

/* ─────────────────────────────
   Create ritual overlay dynamically (원본 스타일 보존)
───────────────────────────── */
const overlay = document.createElement("div");
overlay.id = "ritual-overlay";
overlay.style.cssText = `
  position: fixed;
  bottom: 36px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 420px;
  text-align: center;
  display: none;
  pointer-events: none;
  z-index: 9999;
  font-family: "JetBrains Mono", Consolas, monospace;
`;

const prompt = document.createElement("div");
prompt.style.cssText = `
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: #666;
  margin-bottom: 6px;
  text-transform: lowercase;
`;

const bufferView = document.createElement("div");
bufferView.style.cssText = `
  font-size: 1.05rem;
  letter-spacing: 0.22em;
  color: rgb(3, 234, 252); 
  min-height: 1.4em;
  white-space: pre;
  text-shadow: 0 0 10px rgba(3, 234, 252, 0.5);
`;

const confirmBox = document.createElement("div");
confirmBox.style.cssText = `
  display: none;
  margin-top: 14px;
  pointer-events: auto;
`;

const confirmText = document.createElement("p");
confirmText.textContent = "reincarnate?";
confirmText.style.cssText = `
  font-size: 0.75rem;
  color: #777;
  margin-bottom: 6px;
`;

const yesBtn = document.createElement("button");
yesBtn.textContent = "yes";
const noBtn = document.createElement("button");
noBtn.textContent = "no";

[yesBtn, noBtn].forEach(btn => {
  btn.style.cssText = `
    background: #111;
    color: #aaa;
    border: 1px solid #444;
    margin: 0 6px;
    padding: 4px 12px;
    font-size: 0.7rem;
    font-family: inherit;
    cursor: pointer;
  `;
});

confirmBox.append(confirmText, yesBtn, noBtn);
overlay.append(prompt, bufferView, confirmBox);
document.body.appendChild(overlay);

/* ─────────────────────────────
   Helpers (원본 로직 유지)
───────────────────────────── */
function reset() {
  mode = null;
  buffer = "";
  overlay.style.display = "none";
  confirmBox.style.display = "none";
  bufferView.textContent = "";
  bufferView.style.color = "rgb(3, 234, 252)";
  prompt.textContent = "";

  // 🚀 취소 시 SEO 텍스트 다시 보이게 복구
  const seo = document.getElementById("seo-footer");
  if (seo) seo.style.visibility = "visible";
}

function bakeMigrationSeeds() {
    const extraSeeds = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== "me" && key !== "session" && !key.startsWith("ally-")) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data.birth_date) {
                    extraSeeds.push({
                        name: key,
                        birth_date: data.birth_date,
                        birth_time: data.birth_time || "12:00:00",
                        location: data.location || "Unknown"
                    });
                }
            } catch (e) { continue; }
        }
    }
    if (extraSeeds.length > 0) {
        document.cookie = `extra_seeds=${encodeURIComponent(JSON.stringify(extraSeeds))}; path=/; samesite=lax`;
    }
}

/* ─────────────────────────────
   🔑 Reincarnate Ritual Execution (최소 수복)
───────────────────────────── */

// app/gate/ritual.js 내부 yesBtn.onclick 전체 교체

yesBtn.onclick = async (e) => {
    // 🚀 [폼 제출 강제 방어]
    if (e) e.preventDefault();

    yesBtn.disabled = true;
    if (typeof noBtn !== 'undefined' && noBtn) noBtn.disabled = true;
    confirmText.textContent = "purifying...";
    bufferView.style.color = "#ff4b4b";

    const purgeAndRedirect = () => {
        // 1. 기기 로컬 스토리지 파괴
        localStorage.clear();
        sessionStorage.clear();
        
        // 2. 🚀 프론트엔드 쿠키 완전 도살 (백엔드 오류 시 1차 방어선)
        const cookies = document.cookie.split(";");
        const domain = window.location.hostname;
        const mainDomain = domain.split('.').length > 2 ? domain.split('.').slice(-2).join('.') : domain;

        for (let i = 0; i < cookies.length; i++) {
            const name = cookies[i].split("=")[0].trim();
            document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
            document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + domain + ";";
            document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=." + mainDomain + ";";
        }
        
        // 3. 미들웨어 간섭 원천 차단: 본진 도메인으로 다이렉트 사출
        window.location.replace("https://prima-materia.net/?purge=true");
    };

    try {
        // 백엔드 쿠키 도살 명령
        await fetch("/gate/reincarnate", { method: "POST" });
        
        // 환생 로그 핑 전송
        fetch('/api/godmode/pulse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({ module: 'REINCARNATION', duration: 0 })
        }).catch(e => console.log('Pulse error', e));
    } catch (err) {
        console.error("Void fetch failed, forcing client purge.", err);
    }

    // 🚀 오류 유무와 상관없이 1.5초 뒤 무조건 정화 후 사출
    setTimeout(purgeAndRedirect, 1500);
};

noBtn.onclick = () => { reset(); };

/* ─────────────────────────────
   Key handling (원본 단축키 보존)
───────────────────────────── */
document.addEventListener("keydown", async function (e) {
  // 시스템 환생 (Ctrl+Shift+9)
  if (e.ctrlKey && e.shiftKey && e.key === "9") {
    e.preventDefault();
    mode = "reincarnate";
    overlay.style.display = "block";
    confirmBox.style.display = "block";
    prompt.textContent = "system ritual";
    bufferView.textContent = "";

    // 🚀 의식 진행 중 SEO 텍스트 숨김
    const seo = document.getElementById("seo-footer");
    if (seo) seo.style.visibility = "hidden";
    return;
  }

  // 마스터 키 복구/강림 (Ctrl+Shift+8)
  if (e.ctrlKey && e.shiftKey && e.code === "Digit8") {
    e.preventDefault();
    mode = "recovery";
    buffer = "";
    overlay.style.display = "block";
    confirmBox.style.display = "none";
    prompt.textContent = "enter 16-digit master key";
    bufferView.textContent = "";

    // 🚀 의식 진행 중 SEO 텍스트 숨김
    const seo = document.getElementById("seo-footer");
    if (seo) seo.style.visibility = "hidden";
    return;
  }

  if (!mode) return;

  if (mode === "recovery") {
    if (e.key === "Backspace") {
      buffer = buffer.slice(0, -1);
    }
    else if (e.key === "Enter") {
      bakeMigrationSeeds();

      const res = await fetch("/gate/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "code": buffer.replace(/-/g, "") })
      });

      const result = await res.json();

      if (result.ok) {
        // 🚀 [추가]: 16자리 마스터키 우회(Bypass) 성공 핑 발송
        fetch('/api/godmode/pulse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({ module: 'RITUAL_BYPASS', duration: 0 })
        }).catch(e => console.log('Pulse error', e));

        bufferView.style.color = "#fff";
        prompt.textContent = "access granted";
        // 복구/강림 시에는 즉시 Nigredo 입장
        setTimeout(() => { window.location.href = "/world/nigredo" }, 800);
      } else {
        bufferView.style.color = "#ff4b4b";
        prompt.textContent = "invalid master key";
        setTimeout(() => { reset() }, 1200);
      }
      return;
    }
    else if (/^[a-zA-Z0-9]$/.test(e.key)) {
      let raw = buffer.replace(/-/g, "").toUpperCase();
      if (raw.length >= 16) return;
      raw += e.key.toUpperCase();
      const chunks = raw.match(/.{1,4}/g);
      buffer = chunks ? chunks.join("-") : raw;
    }
    bufferView.textContent = buffer;
  }
});