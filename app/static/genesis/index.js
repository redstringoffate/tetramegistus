// static/genesis/index.js

/* ─────────────────────────────
   Prima Materia entry logic
───────────────────────────── */

// 🚀 [추가]: prima-materia.net 진입 시 무조건 발송 (리다이렉트 통신 증발 방지)
fetch('/api/godmode/pulse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ module: 'PRIMA_MATERIA', duration: 0 })
}).catch(e => console.log('Pulse error', e));

// 이미 [me]가 있으면 바로 world로 보냄
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
		window.location.href = "/form/me"
	})
}
