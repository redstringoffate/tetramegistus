// static/mobile/world/shell/anamnesis.js

document.addEventListener("DOMContentLoaded", () => {
    const resetBtn = document.getElementById('m-reset-trigger');
    const masterCode = document.querySelector('.m-master-code');
    const codeWarning = document.querySelector('.m-code-warning');
    
    // 🚀 [수복]: 에러 메시지 노출 후 3초 뒤 자동 소각 프로토콜
    function showClearableError(msg, isSuccess = false) {
        const errorDiv = document.getElementById('m-pw-error');
        if (!errorDiv) return;
        
        errorDiv.innerText = msg;
        errorDiv.style.color = isSuccess ? "rgb(3, 234, 252)" : "#ff4444";
        
        // 에러 상황일 때만 3초 뒤 자동 클리어 (성공 시에는 어차피 1.5초 뒤 페이지 reload)
        if (!isSuccess) {
            setTimeout(() => {
                // 3초 사이에 다른 에러 메시지로 바뀌지 않았다면 안전하게 소각
                if (errorDiv.innerText === msg) {
                    errorDiv.innerText = "";
                }
            }, 3000);
        }
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            const currentPw = document.getElementById('m-current-pw').value;
            const newPw = document.getElementById('m-new-pw').value;

            if (!currentPw || !newPw) {
                showClearableError("Error: Null values detected.");
                return;
            }

            if (newPw.length < 8) {
                showClearableError("Error: Input sequence too short (min 8).");
                return;
            }

            // 다중 연타 블락
            resetBtn.disabled = true;
            resetBtn.innerText = "Resetting...";
            resetBtn.style.opacity = "0.5";

            try {
                const formData = new FormData();
                formData.append('current_pw', currentPw);
                formData.append('new_pw', newPw);

                const response = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.status === "success") {
                    showClearableError(result.message, true);
                    
                    document.getElementById('m-current-pw').value = "";
                    document.getElementById('m-new-pw').value = "";

                    setTimeout(() => {
                        window.location.reload(); 
                    }, 1500);

                } else {
                    showClearableError(result.message);
                    resetBtn.disabled = false;
                    resetBtn.innerText = "Reset";
                    resetBtn.style.opacity = "1";
                }
            } catch (err) {
                showClearableError("Error: Connection to core lost.");
                console.error(err);
                
                resetBtn.disabled = false;
                resetBtn.innerText = "Reset";
                resetBtn.style.opacity = "1";
            }
        });
    }

    // 🚀 [신규 수복]: 16자리 코드 터치 앤 홀드 프로토콜 (누르면 노출, 떼면 소각)
    if (masterCode && codeWarning) {
        const reveal = () => codeWarning.classList.add('visible');
        const conceal = () => codeWarning.classList.remove('visible');

        // 손가락이 닿았을 때
        masterCode.addEventListener('touchstart', (e) => {
            reveal();
        }, { passive: true });

        // 손가락을 뗐거나, 화면 밖으로 이탈하거나, 드래그 취소되었을 때 원상복구
        masterCode.addEventListener('touchend', conceal);
        masterCode.addEventListener('touchcancel', conceal);
        masterCode.addEventListener('touchmove', conceal);
    }
});