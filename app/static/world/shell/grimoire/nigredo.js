/* static/world/shell/grimoire/nigredo.js */

document.addEventListener('DOMContentLoaded', () => {
    renderNigredoArchive();
});

async function renderNigredoArchive() {
    const container = document.getElementById('nigredo-archive-list');
    if (!container) return;

    try {
        // 백엔드에서 실제 저장된 목록 가져오기
        const res = await fetch('/api/grimoire/list/nigredo');
        const archiveData = await res.json();

        container.innerHTML = ''; 

        // 1. 데이터가 없을 때
        if (!archiveData || archiveData.length === 0) {
            container.innerHTML = `<div class="empty-grimoire">[ The Grimoire is Empty ]</div>`;
            return;
        }

        // 🚀 2. 데이터 정렬 (Priority: [me] First -> then numeric order)
        archiveData.sort((a, b) => {
            // 1. [me] 라는 이름을 가진 아카이브는 서열과 상관없이 무조건 최상단(-1)으로 보냄
            if (a.name === '[me]') return -1;
            if (b.name === '[me]') return 1;

            const idA = parseInt(a.idx, 10);
            const idB = parseInt(b.idx, 10);
            
            // 2. 둘 다 숫자라면 숫자 크기로 비교 (예: 1 -> 2 -> 10 순서)
            if (!isNaN(idA) && !isNaN(idB)) {
                return idA - idB; 
            }
            
            // 3. 숫자가 아닌 식별자가 섞여있다면 알파벳 순으로 정렬
            return String(a.idx).localeCompare(String(b.idx));
        });

        // 3. 데이터가 있을 때 (동적 리스트 생성)
        archiveData.forEach(item => {
            const row = document.createElement('div');
            row.className = 'archive-row';

            // [A] 아카이브 이름 (클릭 시 리더기로 이동)
            const a = document.createElement('a');
            a.href = `/world/grimoire/reader?stage=nigredo&idx=${item.idx}`; 
            a.className = 'archive-item';
            a.textContent = item.name;

            // [B] 액션 버튼 컨테이너
            const actions = document.createElement('div');
            actions.className = 'archive-actions';

            // 📥 다운로드 버튼
            const dlBtn = document.createElement('button');
            dlBtn.className = 'btn-grimoire-action btn-download';
            dlBtn.title = "Download Archive";
            dlBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
            dlBtn.onclick = (e) => {
                e.preventDefault();
                // 다운로드 API 호출
                window.location.href = `/api/grimoire/download/nigredo/${item.idx}`;
            };

            // 🗑️ 삭제 버튼 (전체 아카이브 삭제)
            const delBtn = document.createElement('button');
            delBtn.className = 'btn-grimoire-action btn-delete';
            delBtn.title = "Erase Entire Archive";
            delBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            delBtn.onclick = async (e) => {
                e.preventDefault();
                if (confirm(`Erase the entire Nigredo archive for '${item.name}'?\nThis will remove all module data saved for this seed.`)) {
                    try {
                        const delRes = await fetch(`/api/grimoire/delete/nigredo/${item.idx}`, { method: 'DELETE' });
                        if (delRes.ok) {
                            renderNigredoArchive(); // 성공 시 리스트 다시 불러오기
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