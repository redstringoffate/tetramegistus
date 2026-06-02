document.addEventListener("DOMContentLoaded", () => {
    const materiaCore = document.getElementById("materia-core");
    const gateway = document.getElementById("ritual-gateway");
    const keyIcon = document.getElementById("key-icon");
    const entryZone = document.getElementById("pc-like-entry-zone");
    const segments = document.querySelectorAll(".core-segment");
    
    let touchTimer = null;
    const RITUAL_DURATION = 8000;
    const clankSound = new Audio('/static/sounds/clank.mp3');

    // 🚀 [버그 픽스]: 롱 터치 시 텍스트가 하이라이트(드래그) 되면서 터치 이벤트가 끊기는 현상 원천 차단
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    // ──────────────────────────────────────────
    // 1. 의식 발동 및 취소 로직 (오리지널 복구)
    // ──────────────────────────────────────────
    document.body.addEventListener("touchstart", (e) => {
        // 버튼이나 입력 박스를 터치한 경우는 의식 중단 안 함
        if (e.target.id === "form-me" || e.target.classList.contains("core-segment")) return;
        
        // 이미 의식이 끝나서 열쇠가 나온 상태면 무시
        if (!gateway.classList.contains("hidden-element")) return;

        materiaCore.classList.remove("침식_취소");
        materiaCore.classList.add("침식_진행중");
        
        touchTimer = setTimeout(manifestKey, RITUAL_DURATION);
    }, { passive: false });

    // 손가락을 떼거나 화면 밖으로 나가거나 스크롤하면 즉시 의식 취소
    document.body.addEventListener("touchend", cancelRitual);
    document.body.addEventListener("touchmove", cancelRitual);
    document.body.addEventListener("touchcancel", cancelRitual);

    function cancelRitual() {
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
            materiaCore.classList.remove("침식_진행중");
            materiaCore.classList.add("침식_취소");
        }
    }

    function manifestKey() {
        touchTimer = null;
        materiaCore.classList.add("hidden-element");
        gateway.classList.remove("hidden-element");
        clankSound.play().catch(e => console.log("Audio play prevented"));
        setTimeout(() => { keyIcon.classList.add("revealed"); }, 100);
    }

    // ──────────────────────────────────────────
    // 2. 열쇠 상호작용 및 4분할 입력창 개방 (오리지널)
    // ──────────────────────────────────────────
    keyIcon.addEventListener("click", () => {
        keyIcon.classList.add("activated"); // 열쇠 빛남 효과
        
        setTimeout(() => {
            entryZone.classList.add("revealed");
            if (segments.length > 0) segments[0].focus(); // 첫 번째 칸에 자동 포커스
        }, 500);
    });

    // ──────────────────────────────────────────
    // 3. 멀티 인풋 자동 포커싱 및 데이터 수집 (오리지널)
    // ──────────────────────────────────────────
    segments.forEach((input, index) => {
        // 1. 입력 시 자동 다음 칸 이동
        input.addEventListener("input", (e) => {
            // 영문/숫자만 남김
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
            
            // 4자리가 꽉 차면 다음 칸으로
            if (e.target.value.length === 4) {
                if (index < segments.length - 1) {
                    segments[index + 1].focus();
                }
            }
        });

        // 2. 백스페이스/엔터 키 핸들링
        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && e.target.value.length === 0) {
                // 칸이 비어있을 때 백스페이스 누르면 이전 칸으로
                if (index > 0) {
                    segments[index - 1].focus();
                }
            } else if (e.key === "Enter") {
                // 어느 칸에서든 엔터 누르면 제출 시도
                submitCompositeCode();
            }
        });
    });

    // ──────────────────────────────────────────
    // 4. 최종 코드 병합 및 API 호출 (실패 시 팝업 후 Dissolve 연출)
    // ──────────────────────────────────────────
    function submitCompositeCode() {
        let fullCode = "";
        segments.forEach(input => fullCode += input.value);
        
        // 데이터 정제
        const finalCode = fullCode.trim();
        
        if (finalCode.length === 16) {
            // PC판 공통 API 호출 로직 연결
            fetch('/gate/recovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: finalCode })
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    window.location.replace("/world/nigredo");
                } else {
                    alert("Invalid master key."); // 🚀 원래 있던 팝업 유지
                    dissolveToGenesis(); // 🚀 확인 누르는 순간 디졸브 발동
                }
            })
            .catch(() => {
                alert("Ritual failed.");
                dissolveToGenesis();
            });
        } else {
            alert("A valid 16-digit code (4x4) is required.");
            dissolveToGenesis(); // 16자리 다 안 채우고 엔터 쳤을 때도 팝업 후 복귀
        }
    }

    // 🚀 [신규]: 몰입감을 깨지 않고 태초의 화면으로 스르륵 돌아가는 연출
    function dissolveToGenesis() {
        // 1. 현재 열쇠와 입력창 영역을 1.5초에 걸쳐 서서히 어둠 속으로 녹임
        gateway.style.transition = "opacity 1.5s ease";
        gateway.style.opacity = "0";

        setTimeout(() => {
            // 2. 완전히 투명해지면 화면에서 물리적으로 숨김
            gateway.classList.add("hidden-element");
            gateway.style.opacity = ""; // 인라인 스타일 초기화
            
            // 3. 다시 의식을 치를 수 있도록 열쇠와 인풋 박스 상태 완전 초기화 (새 출발)
            keyIcon.classList.remove("revealed", "activated");
            entryZone.classList.remove("revealed");
            segments.forEach(input => input.value = "");
            if (segments.length > 0) segments[0].blur(); // 모바일 키보드 내림
            
            // 4. Prima Materia 타이틀과 Form 버튼을 다시 서서히 등장시킴
            materiaCore.classList.remove("hidden-element", "침식_진행중");
            materiaCore.classList.add("침식_취소"); 
            
        }, 1500); // 1.5초 동안 서서히 사라진 후 실행
    }

    // ──────────────────────────────────────────
    // 5. 🚀 Form New Vessel 진입 의식 (Passive 5s + Active 2s Crack)
    // ──────────────────────────────────────────
    const formBtn = document.getElementById("form-me");
    const title = document.querySelector("#materia-core h1");
    const core = document.getElementById("materia-core"); 

    if (formBtn && title) {
        // 🚀 CSS Crack 효과(::before, ::after)가 글자를 쪼갤 수 있도록, 원본 글자를 data-text 속성에 복사해 둠
        title.setAttribute("data-text", title.innerText);

        formBtn.addEventListener("click", function(e) {
            e.preventDefault(); // 즉시 이동 차단

            // 1. 버튼 상태 굳히기
            this.classList.add("pressed");
            this.style.pointerEvents = "none"; 
            this.innerText = "Shattering...";

            // 2. 제목 대각선 갈라짐(Crack) + 전체 화면 암전/섬광(Flash) 발동
            title.classList.add("cracked");
            core.classList.add("cracked-flash");

            // 3. 2초(2000ms) 동안 화면이 박살난 상태를 감상하게 둔 뒤 다음 세계로 진입
            setTimeout(() => {
                window.location.href = '/form/me';
            }, 2000);
        });
    }
}); // <-- DOMContentLoaded 닫는 괄호