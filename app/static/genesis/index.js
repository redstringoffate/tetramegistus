// static/genesis/index.js

/* ─────────────────────────────
   Prima Materia entry logic
───────────────────────────── */

// 🚀 prima-materia.net 진입 시 무조건 발송 (리다이렉트 통신 증발 방지)
fetch('/api/godmode/pulse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ module: 'PRIMA_MATERIA', duration: 0 })
}).catch(e => console.log('Pulse error', e));

// 🚀 [원상 복구 완료]: 개발자님이 의심하셨던 삭제된 코드 100% 롤백
(function () {
    const me = localStorage.getItem("tetramegistus.me")
    if (me) {
        window.location.href = "/world"
    }
})()

/* ─────────────────────────────
   Form New Vessel button
───────────────────────────── */

const formBtn = document.getElementById("form-me")

if (formBtn) {
    formBtn.addEventListener("click", function () {
        // 🚀 [도메인 단절 버그 픽스]: 빈손으로 본진에 가는 걸 막기 위해, 시드를 작성할 때 무조건 본진 도메인으로 사출시킵니다.
        window.location.href = "https://tetramegistus.com/form/me"
    })
}