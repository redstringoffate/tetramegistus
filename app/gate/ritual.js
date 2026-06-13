// gate/ritual.js

// 🚀 [수복]: IIFE(즉시 실행 함수)로 감싸서 다른 파일과의 변수 충돌을 완벽 차단
(function() {
    let mode = null;
    let buffer = "";

    // 변수명을 overlay에서 ritualOverlay로 변경하여 충돌 방지
    const ritualOverlay = document.createElement("div");
    ritualOverlay.id = "ritual-overlay";
    ritualOverlay.style.cssText = `
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
    ritualOverlay.append(prompt, bufferView, confirmBox);
    document.body.appendChild(ritualOverlay);

    function reset() {
      mode = null;
      buffer = "";
      ritualOverlay.style.display = "none";
      confirmBox.style.display = "none";
      bufferView.textContent = "";
      bufferView.style.color = "rgb(3, 234, 252)";
      prompt.textContent = "";

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

    yesBtn.onclick = async (e) => {
        if (e) e.preventDefault();

        yesBtn.disabled = true;
        if (typeof noBtn !== 'undefined' && noBtn) noBtn.disabled = true;
        confirmText.textContent = "purifying...";
        bufferView.style.color = "#ff4b4b";

        const purgeAndRedirect = () => {
            localStorage.clear();
            sessionStorage.clear();
            
            const cookies = document.cookie.split(";");
            const domain = window.location.hostname;
            const mainDomain = domain.split('.').length > 2 ? domain.split('.').slice(-2).join('.') : domain;

            for (let i = 0; i < cookies.length; i++) {
                const name = cookies[i].split("=")[0].trim();
                document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
                document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + domain + ";";
                document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=." + mainDomain + ";";
            }
            window.location.replace("https://prima-materia.net/?purge=true");
        };

        try {
            await fetch("/gate/reincarnate", { method: "POST" });
            fetch('/api/godmode/pulse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({ module: 'REINCARNATION', duration: 0 })
            }).catch(e => console.log('Pulse error', e));
        } catch (err) {
            console.error("Void fetch failed, forcing client purge.", err);
        }

        setTimeout(purgeAndRedirect, 1500);
    };

    noBtn.onclick = () => { reset(); };

    document.addEventListener("keydown", async function (e) {
      if (e.ctrlKey && e.shiftKey && e.key === "9") {
        e.preventDefault();
        mode = "reincarnate";
        ritualOverlay.style.display = "block";
        confirmBox.style.display = "block";
        prompt.textContent = "system ritual";
        bufferView.textContent = "";

        const seo = document.getElementById("seo-footer");
        if (seo) seo.style.visibility = "hidden";
        return;
      }

      if (e.ctrlKey && e.shiftKey && e.code === "Digit8") {
        e.preventDefault();
        mode = "recovery";
        buffer = "";
        ritualOverlay.style.display = "block";
        confirmBox.style.display = "none";
        prompt.textContent = "enter 16-digit master key";
        bufferView.textContent = "";

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
            fetch('/api/godmode/pulse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({ module: 'RITUAL_BYPASS', duration: 0 })
            }).catch(e => console.log('Pulse error', e));

            bufferView.style.color = "#fff";
            prompt.textContent = "access granted";
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
})();