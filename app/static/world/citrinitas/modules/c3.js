// app/static/world/citrinitas/modules/c3.js

const C3 = {
    state: { passage: null },

    init() {
        // 1. 현재 주소창의 경로(pathname)를 가져옵니다. (예: /world/citrinitas/modules/c3_nefesh)
        const currentPath = window.location.pathname;
        
        // 2. 경로에서 어떤 영혼 단계인지 추출합니다.
        const match = currentPath.match(/c3_(nefesh|ruach|neshamah|chayah|yechidah)/);
        
        if (match) {
            this.state.passage = match[1]; // 추출된 이름 (예: 'nefesh')
        }
        
        this.syncUI();
    },

    syncUI() {
        // 3. 현재 접속 중인 passage와 일치하는 버튼에 'active' 클래스를 부여합니다.
        document.querySelectorAll('.passage-btn').forEach(btn => {
            // 버튼의 data-tooltip 값(Nefesh, Ruach 등)을 소문자로 변환하여 비교
            const btnPassage = btn.getAttribute('data-tooltip').toLowerCase();
            
            if (btnPassage === this.state.passage) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => C3.init());