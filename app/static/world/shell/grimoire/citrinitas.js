/* static/world/shell/grimoire/citrinitas.js */

document.addEventListener('DOMContentLoaded', () => {
    renderCitrinitasArchive();
});

async function renderCitrinitasArchive() {
    const container = document.getElementById('citrinitas-archive-list');
    if (!container) return;

    try {
        // 🚀 [API Fetch]: Citrinitas 스테이지의 아카이브 목록 요청
        const res = await fetch('/api/grimoire/list/citrinitas');
        const archiveData = await res.json();

        container.innerHTML = ''; 

        // 1. 데이터가 없을 때
        if (!archiveData || archiveData.length === 0) {
            container.innerHTML = `<div class="empty-grimoire">[ The Grimoire is Empty ]</div>`;
            return;
        }

        // 2. 데이터 정렬 (알파벳/이름 순 정렬)
        archiveData.sort((a, b) => String(a.name).localeCompare(String(b.name)));

        // 3. 데이터가 있을 때 목록 렌더링
        archiveData.forEach(item => {
            const row = document.createElement('div');
            row.className = 'archive-row';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '8px 0';
            row.style.borderBottom = '1px solid #333';

            // 🚀 [수정]: albedo.js와 동일한 규격의 URL로 변경
            const a = document.createElement('a');
            const readerUrl = `/world/grimoire/reader?stage=citrinitas&idx=${item.idx}`; 
            
            a.href = readerUrl; 
            a.className = 'archive-item';
            a.textContent = item.name; 
            
            a.onclick = (e) => {
                e.preventDefault();
                window.location.href = readerUrl; 
            };

            const actions = document.createElement('div');
            actions.className = 'archive-actions';
            actions.style.display = 'flex';
            actions.style.gap = '10px';

            // 다운로드 버튼
            const dlBtn = document.createElement('a');
            dlBtn.href = `/api/grimoire/download/citrinitas/${item.idx}`;
            dlBtn.className = 'action-btn download-btn';
            dlBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';

            // 삭제 버튼
            const delBtn = document.createElement('a');
            delBtn.href = "#";
            delBtn.className = 'action-btn delete-btn';
            delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            delBtn.onclick = async (e) => {
                e.preventDefault();
                if (confirm(`Erase the Citrinitas archive '${item.name}'?`)) {
                    try {
                        const delRes = await fetch(`/api/grimoire/delete/citrinitas/${item.idx}`, { method: 'DELETE' });
                        if (delRes.ok) renderCitrinitasArchive();
                        else alert('Failed to erase: ' + (await delRes.json()).detail);
                    } catch (error) {
                        console.error(error);
                        alert('Network error during erasure.');
                    }
                }
            };

            actions.appendChild(dlBtn);
            actions.appendChild(delBtn);
            row.appendChild(a);
            row.appendChild(actions);
            container.appendChild(row);
        });
    } catch (e) {
        console.error("Failed to load Citrinitas archives", e);
        container.innerHTML = `<div class="empty-grimoire">[ Failed to load archives ]</div>`;
    }
}