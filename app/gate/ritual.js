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

yesBtn.onclick = async () => {
    yesBtn.disabled = true;
    if (noBtn) noBtn.disabled = true;
    confirmText.textContent = "purifying...";
    bufferView.style.color = "#ff4b4b";

    try {
        // 백엔드에게 쿠키 도살 명령 하강
        const res = await fetch("/gate/reincarnate", { method: "POST" });
        const result = await res.json();

        if (result.ok) {
            // 환생 의식 성공 로그 pulse 각인
            fetch('/api/godmode/pulse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({ module: 'REINCARNATION', duration: 0 })
            }).catch(e => console.log('Pulse error', e));

            // 🚀 [핵심 수복]: 미들웨어의 간섭을 우회하기 위해 딜레이 없이 
            // '소개 도메인(prima-materia.net)' 주소로 즉시 브라우저 로케이션을 리플레이스(Replace) 사출시킵니다.
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace("https://prima-materia.net");
        }
    } catch (e) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("https://prima-materia.net");
    }
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