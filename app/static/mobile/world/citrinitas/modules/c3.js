// static/mobile/world/citrinitas/modules/c3.js

const C3 = {
    state: { passage: null },

    init() {
        // 현재 주소창의 경로(pathname) 가져오기
        const currentPath = window.location.pathname;
        
        // 경로에서 어떤 영혼 단계인지 추출
        const match = currentPath.match(/c3_(nefesh|ruach|neshamah|chayah|yechidah)/);
        
        if (match) {
            this.state.passage = match[1]; 
        }
        
        this.syncUI();
    },

    syncUI() {
        // 현재 접속 중인 passage와 일치하는 버튼에 'active' 클래스 부여
        document.querySelectorAll('.m-passage-btn').forEach(btn => {
            const btnPassage = btn.getAttribute('data-passage');
            
            if (btnPassage === this.state.passage) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => C3.init());