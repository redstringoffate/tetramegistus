pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('m-pdf-canvas-container');
    const titleEl = document.getElementById('m-pdf-title');

    try {
        // 1. 백엔드에서 문서의 진짜 이름을 가져옴 (엑셀 리더기와 동일한 방식)
        const infoRes = await fetch(`/api/grimoire/info/${window.GRIMOIRE_STAGE}/${window.GRIMOIRE_IDX}`);
        if (infoRes.ok) {
            const info = await infoRes.json();
            titleEl.textContent = "🌌 " + info.target_name;
        }

        // 2. PDF 파일 다운로드 및 파싱
        const url = `/api/grimoire/download/${window.GRIMOIRE_STAGE}/${window.GRIMOIRE_IDX}`;
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        container.innerHTML = ''; // 로딩 텍스트 삭제

        // 🚀 기기 해상도(DPI)를 가져와 최소 2.5배 뻥튀기
        const pixelRatio = Math.max(window.devicePixelRatio || 1, 2.5);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);

            // 화면에 보일 CSS 크기
            const baseViewport = page.getViewport({ scale: 1.0 });
            const cssScale = (window.innerWidth - 20) / baseViewport.width; 
            const cssViewport = page.getViewport({ scale: cssScale });

            // 캔버스에 그릴 물리적 픽셀 크기 (초고해상도)
            const renderViewport = page.getViewport({ scale: cssScale * pixelRatio });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = renderViewport.width;
            canvas.height = renderViewport.height;
            
            canvas.style.width = `${cssViewport.width}px`;
            canvas.style.height = `${cssViewport.height}px`;
            canvas.style.marginBottom = "15px";
            canvas.style.borderRadius = "4px";
            canvas.style.boxShadow = "0 0 15px rgba(224, 0, 0, 0.4)"; 

            container.appendChild(canvas);

            await page.render({
                canvasContext: context,
                viewport: renderViewport
            }).promise;
        }
    } catch (err) {
        console.error("PDF Rendering Error:", err);
        container.innerHTML = `<div style="color:#ff5252; margin-top:40%; text-align:center;">Error rendering PDF.<br>The document may be corrupted.</div>`;
    }
});