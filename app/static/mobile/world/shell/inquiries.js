let selectedFiles = [];
const MAX_FILES = 5;

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('inquiry-images');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const newFiles = Array.from(e.target.files);
            
            if (selectedFiles.length + newFiles.length > MAX_FILES) {
                alert(`You can only upload up to ${MAX_FILES} images.`);
                fileInput.value = ''; 
                return;
            }

            selectedFiles = selectedFiles.concat(newFiles);
            renderFileList();
            fileInput.value = ''; 
        });
    }
});

function renderFileList() {
    const container = document.getElementById('image-file-list');
    container.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <span class="file-name">- ${file.name}</span>
            <span class="remove-file" onclick="removeFile(${index})">x</span>
        `;
        container.appendChild(item);
    });
}

window.removeFile = function(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
};

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

        selectedFiles.forEach((file) => {
            formData.append('images', file); 
        });

        const response = await fetch('/api/auth/send-inquiry', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            statusMsg.style.opacity = '1';
            
            setTimeout(() => {
                statusMsg.style.opacity = '0';
                
                document.getElementById('user-email').value = '';
                document.getElementById('inquiry-content').value = '';
                document.getElementById('count').innerText = '0';
                
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