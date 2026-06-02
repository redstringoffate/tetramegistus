/* static/world/shell/grimoire/albedo.js */

document.addEventListener('DOMContentLoaded', () => {
    renderAlbedoArchive();
});

async function renderAlbedoArchive() {
    const container = document.getElementById('albedo-archive-list');
    if (!container) return;

    try {
        // 🚀 [API Fetch]: Albedo 스테이지의 아카이브 목록 요청
        const res = await fetch('/api/grimoire/list/albedo');
        const archiveData = await res.json();

        container.innerHTML = ''; 

        // 1. 데이터가 없을 때
        if (!archiveData || archiveData.length === 0) {
            container.innerHTML = `<div class="empty-grimoire">[ The Grimoire is Empty ]</div>`;
            return;
        }

        // 2. 데이터 정렬 (Albedo 융합 시드 ID 기준)
        archiveData.sort((a, b) => {
            const idA = parseInt(a.idx, 10);
            const idB = parseInt(b.idx, 10);
            
            // 숫자로 된 ID일 경우 숫자 크기로 비교
            if (!isNaN(idA) && !isNaN(idB)) {
                return idA - idB; 
            }
            // 문자열 ID일 경우 알파벳 순으로 비교
            return String(a.idx).localeCompare(String(b.idx));
        });

        // 3. 데이터가 있을 때 (동적 리스트 생성)
        archiveData.forEach(item => {
            const row = document.createElement('div');
            row.className = 'archive-row';

            // [A] 아카이브 이름 (클릭 시 리더기로 이동, stage=albedo)
            const a = document.createElement('a');
            a.href = `/world/grimoire/reader?stage=albedo&idx=${item.idx}`; 
            a.className = 'archive-item';
            a.textContent = item.name;

            // [B] 액션 버튼 컨테이너
            const actions = document.createElement('div');
            actions.className = 'archive-actions';

            // 📥 다운로드 버튼 (Albedo 전용)
            const dlBtn = document.createElement('button');
            dlBtn.className = 'btn-grimoire-action btn-download';
            dlBtn.title = "Download Archive";
            dlBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
            dlBtn.onclick = (e) => {
                e.preventDefault();
                // 다운로드 API 호출
                window.location.href = `/api/grimoire/download/albedo/${item.idx}`;
            };

            // 🗑️ 삭제 버튼 (Albedo 아카이브 전체 삭제)
            const delBtn = document.createElement('button');
            delBtn.className = 'btn-grimoire-action btn-delete';
            delBtn.title = "Erase Entire Archive";
            delBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            delBtn.onclick = async (e) => {
                e.preventDefault();
                if (confirm(`Erase the entire Albedo archive for '${item.name}'?\nThis will remove all synthesis module data saved for this connection.`)) {
                    try {
                        const delRes = await fetch(`/api/grimoire/delete/albedo/${item.idx}`, { method: 'DELETE' });
                        if (delRes.ok) {
                            renderAlbedoArchive(); // 성공 시 리스트 다시 불러오기
                        } else {
                            const errData = await delRes.json();
                            alert('Failed to erase: ' + errData.detail);
                        }
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
        console.error("Failed to load archive list:", e);
        container.innerHTML = `<div class="empty-grimoire" style="color:#ff5252;">[ System Error: Connection Failed ]</div>`;
    }
}