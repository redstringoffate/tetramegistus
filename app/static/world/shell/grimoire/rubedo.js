/* static/world/shell/grimoire/rubedo.js */

document.addEventListener('DOMContentLoaded', () => {
    renderRubedoArchive();
});

async function renderRubedoArchive() {
    const container = document.getElementById('rubedo-archive-list');
    if (!container) return;

    try {
        // 🚀 [API Fetch]: Rubedo 스테이지의 PDF 아카이브 목록 요청
        const res = await fetch('/api/grimoire/list/rubedo');
        const archiveData = await res.json();

        container.innerHTML = ''; 

        // 1. 데이터가 없을 때
        if (!archiveData || archiveData.length === 0) {
            container.innerHTML = `<div class="empty-grimoire">[ The Grimoire is Empty ]</div>`;
            return;
        }

        // 2. 데이터 정렬 (알파벳/이름 순 정렬)
        archiveData.sort((a, b) => String(a.name).localeCompare(String(b.name)));

        // 3. 데이터 렌더링
        archiveData.forEach(item => {
            const row = document.createElement('div');
            row.className = 'archive-row';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '8px 0';
            row.style.borderBottom = '1px solid #333';

            // 🚀 PDF 열람 (새 탭에서 뷰어로 열림)
            const a = document.createElement('a');
            const downloadUrl = `/api/grimoire/download/rubedo/${item.idx}`; 
            
            a.href = downloadUrl; 
            a.target = "_blank"; // PDF는 브라우저 네이티브 뷰어로 바로 열리도록 설정
            a.className = 'archive-item';
            a.textContent = item.name; 

            const actions = document.createElement('div');
            actions.className = 'archive-actions';
            actions.style.display = 'flex';
            actions.style.gap = '10px';

            // 🖋️ [이름 변경 버튼]
            const renameBtn = document.createElement('a');
            renameBtn.href = "#";
            renameBtn.className = 'action-btn edit-btn';
            renameBtn.title = "Rename Archive";
            renameBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
            renameBtn.onclick = async (e) => {
                e.preventDefault();
                const newName = prompt("Enter a new name for this archive:", item.name);
                if (newName && newName.trim() !== "" && newName !== item.name) {
                    try {
                        const renameRes = await fetch(`/api/grimoire/rename/${item.idx}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ new_name: newName.trim() })
                        });
                        if (renameRes.ok) renderRubedoArchive(); // 성공 시 리스트 리로드
                        else alert('Failed to rename archive.');
                    } catch (error) {
                        console.error(error);
                        alert('Network error during rename.');
                    }
                }
            };

            // 📥 [다운로드 버튼]
            const dlBtn = document.createElement('a');
            dlBtn.href = downloadUrl;
            dlBtn.download = `${item.name}.pdf`; // 강제 다운로드 속성
            dlBtn.className = 'action-btn download-btn';
            dlBtn.title = "Download PDF";
            dlBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

            // 💀 [삭제 버튼]
            const delBtn = document.createElement('a');
            delBtn.href = "#";
            delBtn.className = 'action-btn delete-btn';
            delBtn.title = "Erase Archive";
            delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
            delBtn.onclick = async (e) => {
                e.preventDefault();
                if (confirm(`Erase the Rubedo archive '${item.name}'?`)) {
                    try {
                        const delRes = await fetch(`/api/grimoire/delete/rubedo/${item.idx}`, { method: 'DELETE' });
                        if (delRes.ok) renderRubedoArchive();
                        else alert('Failed to erase: ' + (await delRes.json()).detail);
                    } catch (error) {
                        console.error(error);
                        alert('Network error during erasure.');
                    }
                }
            };

            actions.appendChild(renameBtn);
            actions.appendChild(dlBtn);
            actions.appendChild(delBtn);
            row.appendChild(a);
            row.appendChild(actions);
            container.appendChild(row);
        });
    } catch (e) {
        console.error("Failed to load Rubedo archives", e);
        container.innerHTML = `<div class="empty-grimoire">[ Failed to load archives ]</div>`;
    }
}