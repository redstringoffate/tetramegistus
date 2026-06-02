let selectedFiles = [];
const MAX_FILES = 5;

// DOM이 로드되면 이벤트 리스너 부착
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('inquiry-images');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const newFiles = Array.from(e.target.files);
            
            // 5개 초과 검증
            if (selectedFiles.length + newFiles.length > MAX_FILES) {
                alert(`You can only upload up to ${MAX_FILES} images.`);
                fileInput.value = ''; // 초기화
                return;
            }

            selectedFiles = selectedFiles.concat(newFiles);
            renderFileList();
            fileInput.value = ''; // 같은 파일을 다시 추가할 수 있도록 비워줌
        });
    }
});

// 파일명 UI 렌더링
function renderFileList() {
    const container = document.getElementById('image-file-list');
    container.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <span>- ${file.name}</span>
            <span class="remove-file" onclick="removeFile(${index})">x</span>
        `;
        container.appendChild(item);
    });
}

// x 누르면 파일 삭제
window.removeFile = function(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
};

// 메일 전송
window.sendInquiry = async function() {
    const category = document.getElementById('inquiry-category').value;
    const email = document.getElementById('user-email').value;
    const content = document.getElementById('inquiry-content').value;
    const statusMsg = document.getElementById('status-msg');
    const sendBtn = document.getElementById('send-btn');
    
    if (!email.trim() || !content.trim()) {
        alert("Please provide both an email and a message.");
        return;
    }

    sendBtn.disabled = true;
    sendBtn.innerText = "sending...";

    try {
        const formData = new FormData();
        formData.append('category', category);
        formData.append('email', email);
        formData.append('content', content);

        // 🚀 선택된 파일들을 FormData에 순회하며 담기
        selectedFiles.forEach((file) => {
            formData.append('images', file); // FastAPI에서 'images'로 받게 됨
        });

        const response = await fetch('/api/auth/send-inquiry', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            statusMsg.style.opacity = '1';
            
            setTimeout(() => {
                statusMsg.style.opacity = '0';
                
                // 폼 초기화
                document.getElementById('user-email').value = '';
                document.getElementById('inquiry-content').value = '';
                document.getElementById('count').innerText = '0';
                
                // 파일 리스트 초기화
                selectedFiles = [];
                renderFileList();

                sendBtn.disabled = false;
                sendBtn.innerText = "send";
            }, 3000);
        } else {
            alert("Failed to reach the void. Please try again.");
            sendBtn.disabled = false;
            sendBtn.innerText = "send";
        }
    } catch (error) {
        console.error("Transmission error:", error);
        alert("A technical error occurred.");
        sendBtn.disabled = false;
        sendBtn.innerText = "send";
    }
};