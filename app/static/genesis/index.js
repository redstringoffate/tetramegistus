// static/genesis/index.js

// 🚀 prima-materia.net 진입 시 무조건 발송 (리다이렉트 통신 증발 방지)
fetch('/api/godmode/pulse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ module: 'PRIMA_MATERIA', duration: 0 })
}).catch(e => console.log('Pulse error', e));

/* 🚀 [무한 핑퐁 버그 파괴 완료]
백엔드(main.py)가 허락해서 대문(/)에 랜딩했다는 것은 
이 유저의 쿠키(영혼)가 완벽히 정화되었다는 뜻입니다.
이 상태에서 로컬 스토리지에 데이터가 남아있다면 그것은 무한 루프를 일으키는 좀비이므로 즉시 소각합니다.
*/
(function () {
    const me = localStorage.getItem("tetramegistus.me");
    if (me) {
        console.log("Exorcising zombie local storage...");
        localStorage.removeItem("tetramegistus.me");
    }
})();

const formBtn = document.getElementById("form-me")
if (formBtn) {
    formBtn.addEventListener("click", function () {
        window.location.href = "https://tetramegistus.com/form/me"
    })
}