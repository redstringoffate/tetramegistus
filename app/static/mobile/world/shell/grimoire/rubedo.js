// 🚀 불발탄이었던 pdfjsLib 워커 설정과 모달 이벤트가 완전히 제거된 순정 상태
// + 🚀 무빙워크(Marquee) 엔진 & 정적 아이콘 분리 완벽 적용
document.addEventListener('DOMContentLoaded', () => {
    renderRubedoArchive();
});

async function renderRubedoArchive() {
    const container = document.getElementById('m-rubedo-archive-list');
    if (!container) return;

    try {
        const res = await fetch('/api/grimoire/list/rubedo');
        const archiveData = await res.json();

        container.innerHTML = ''; 

        if (!archiveData || archiveData.length === 0) {
            container.innerHTML = `<div class="m-empty-grimoire">[ The Grimoire is Empty ]</div>`;
            return;
        }

        archiveData.sort((a, b) => String(a.name).localeCompare(String(b.name)));

        archiveData.forEach(item => {
            const row = document.createElement('div');
            row.className = 'm-archive-row'; 

            // 🌟 [핵심 1]: 무빙워크에 타지 않는 '가만히 있는 아이콘' 독립 생성
            const iconSpan = document.createElement('span');
            iconSpan.className = 'm-archive-icon';

            // 🚀 만약 이름 맨 앞에 이미 ✦, ✧ 등이 붙어있다면 분리해내고, 아니면 기본 ✦ 할당
            let displayName = item.name;
            const iconMatch = displayName.match(/^[✦✧❖⭐✨]\s*/);
            if (iconMatch) {
                iconSpan.textContent = iconMatch[0].trim();
                displayName = displayName.replace(/^[✦✧❖⭐✨]\s*/, '');
            } else {
                iconSpan.textContent = '✦'; 
            }

            // 🚀 [핵심 2]: 글자만 가두는 철창(Wrapper) 생성
            const titleWrapper = document.createElement('div');
            titleWrapper.className = 'm-archive-title-wrapper';

            const downloadUrl = `/api/grimoire/download/rubedo/${item.idx}`; 
            
            const a = document.createElement('a');
            a.href = "#"; 
            a.className = 'm-archive-item';
            a.textContent = displayName; // 순수하게 텍스트만 들어감
            
            a.onclick = (e) => {
                e.preventDefault();
                window.location.href = `/world/grimoire/pdf_reader?idx=${item.idx}`;
            };

            // 철창 안에 '글씨만' 집어넣기
            titleWrapper.appendChild(a);

            const actions = document.createElement('div');
            actions.className = 'm-archive-actions';

            // 🖋️ [이름 변경 버튼]
            const renameBtn = document.createElement('a');
            renameBtn.href = "#";
            renameBtn.className = 'm-btn-action m-btn-edit';
            renameBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
            renameBtn.onclick = async (e) => {
                e.preventDefault();
                const newName = prompt("Enter a new name for this archive:", displayName);
                if (newName && newName.trim() !== "" && newName !== displayName) {
                    try {
                        const renameRes = await fetch(`/api/grimoire/rename/${item.idx}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ new_name: newName.trim() })
                        });
                        if (renameRes.ok) renderRubedoArchive(); 
                        else alert('Failed to rename archive.');
                    } catch (error) {
                        alert('Network error during rename.');
                    }
                }
            };

            // 📥 [다운로드 버튼]
            const dlBtn = document.createElement('a');
            dlBtn.href = downloadUrl;
            dlBtn.download = `${displayName}.pdf`; 
            dlBtn.className = 'm-btn-action m-btn-download';
            dlBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';

            // 💀 [삭제 버튼]
            const delBtn = document.createElement('a');
            delBtn.href = "#";
            delBtn.className = 'm-btn-action m-btn-delete';
            delBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            delBtn.onclick = async (e) => {
                e.preventDefault();
                if (confirm(`Erase the Rubedo archive '${displayName}'?`)) {
                    try {
                        const delRes = await fetch(`/api/grimoire/delete/rubedo/${item.idx}`, { method: 'DELETE' });
                        if (delRes.ok) renderRubedoArchive();
                        else alert('Failed to erase');
                    } catch (error) {
                        alert('Network error during erasure.');
                    }
                }
            };

            actions.appendChild(renameBtn);
            actions.appendChild(dlBtn);
            actions.appendChild(delBtn);
            
            // 🚀 레고 조립: 고정 아이콘 -> 글자 철창 -> 우측 액션버튼 순서로 투입!
            row.appendChild(iconSpan);
            row.appendChild(titleWrapper); 
            row.appendChild(actions);
            container.appendChild(row);

            // 🚀 [무빙워크 발동 로직]
            requestAnimationFrame(() => {
                const wrapperWidth = titleWrapper.clientWidth;
                const textWidth = a.scrollWidth;

                if (textWidth > wrapperWidth) {
                    a.classList.add('marquee-active');
                    
                    const scrollDist = wrapperWidth - textWidth - 5; 
                    a.style.setProperty('--scroll-dist', `${scrollDist}px`);
                    
                    const duration = Math.max(3, Math.abs(scrollDist) / 25);
                    a.style.animationDuration = `${duration}s`;
                }
            });
        });
    } catch (e) {
        container.innerHTML = `<div class="m-empty-grimoire" style="color:#ff5252;">[ Failed to load archives ]</div>`;
    }
}