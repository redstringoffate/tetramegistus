document.addEventListener('DOMContentLoaded', () => {
    renderAlbedoArchive();
});

async function renderAlbedoArchive() {
    const container = document.getElementById('m-albedo-archive-list');
    if (!container) return;

    try {
        const res = await fetch('/api/grimoire/list/albedo');
        const archiveData = await res.json();

        container.innerHTML = ''; 

        if (!archiveData || archiveData.length === 0) {
            container.innerHTML = `<div class="m-empty-grimoire">[ The Grimoire is Empty ]</div>`;
            return;
        }

        archiveData.sort((a, b) => {
            const idA = parseInt(a.idx, 10);
            const idB = parseInt(b.idx, 10);
            if (!isNaN(idA) && !isNaN(idB)) return idA - idB; 
            return String(a.idx).localeCompare(String(b.idx));
        });

        archiveData.forEach(item => {
            const row = document.createElement('div');
            row.className = 'm-archive-row';

            // 🌟 고정 아이콘
            const iconSpan = document.createElement('span');
            iconSpan.className = 'm-archive-icon';
            let displayName = item.name;
            const iconMatch = displayName.match(/^[✦✧❖⭐✨]\s*/);
            if (iconMatch) {
                iconSpan.textContent = iconMatch[0].trim();
                displayName = displayName.replace(/^[✦✧❖⭐✨]\s*/, '');
            } else {
                iconSpan.textContent = '✦'; 
            }

            const titleWrapper = document.createElement('div');
            titleWrapper.className = 'm-archive-title-wrapper';

            const a = document.createElement('a');
            a.href = `/world/grimoire/reader?stage=albedo&idx=${item.idx}`; 
            a.className = 'm-archive-item';
            a.textContent = displayName;
            titleWrapper.appendChild(a);

            const actions = document.createElement('div');
            actions.className = 'm-archive-actions';

            const dlBtn = document.createElement('button');
            dlBtn.className = 'm-btn-action m-btn-download';
            dlBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
            dlBtn.onclick = (e) => {
                e.preventDefault();
                window.location.href = `/api/grimoire/download/albedo/${item.idx}`;
            };

            const delBtn = document.createElement('button');
            delBtn.className = 'm-btn-action m-btn-delete';
            delBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            delBtn.onclick = async (e) => {
                e.preventDefault();
                if (confirm(`Erase the entire Albedo archive for '${displayName}'?`)) {
                    try {
                        const delRes = await fetch(`/api/grimoire/delete/albedo/${item.idx}`, { method: 'DELETE' });
                        if (delRes.ok) renderAlbedoArchive(); 
                        else alert('Failed to erase');
                    } catch (error) {
                        alert('Network error during erasure.');
                    }
                }
            };

            actions.appendChild(dlBtn);
            actions.appendChild(delBtn);
            
            row.appendChild(iconSpan);
            row.appendChild(titleWrapper);
            row.appendChild(actions);
            container.appendChild(row);

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
        container.innerHTML = `<div class="m-empty-grimoire" style="color:#ff5252;">[ System Error: Connection Failed ]</div>`;
    }
}