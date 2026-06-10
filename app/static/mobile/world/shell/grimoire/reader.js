let sheetToDelete = null;
let rawExcelBlob = null; 
let isEditMode = false;
let luckysheetDataCache = null; 

document.addEventListener('DOMContentLoaded', async () => {
    
    // 🚀 [최종 결계: JS 메모리 직접 주입]
    // 모바일 캔버스가 CSS를 무시하는 현상을 막기 위해, 폰트 파일을 JS 엔진 메모리에 직접 때려 박습니다.
    try {
        const consolasFont = new FontFace("Consolas", "url('/static/fonts/Consolas.ttf')");
        await consolasFont.load();
        document.fonts.add(consolasFont);
    } catch(e) {
        console.warn("Font injection bypassed or failed.", e);
    }

    // 1. 폰트 장전이 확인되면 그제야 초기 데이터 로드 시작
    loadRealExcelData();

    // 2. 삭제 모달 취소 버튼 연동
    const btnModalNo = document.getElementById('btn-modal-no');
    if (btnModalNo) btnModalNo.addEventListener('click', closeDeleteModal);
    
    const tabsWrapper = document.getElementById('m-sheet-tabs');
    const btnScrollLeft = document.getElementById('m-btn-scroll-left');
    const btnScrollRight = document.getElementById('m-btn-scroll-right');

    if (tabsWrapper) {
        btnScrollLeft?.addEventListener('click', () => { tabsWrapper.scrollBy({ left: -200, behavior: 'smooth' }); });
        btnScrollRight?.addEventListener('click', () => { tabsWrapper.scrollBy({ left: 200, behavior: 'smooth' }); });
    }

    const btnRearrange = document.getElementById('m-btn-rearrange');
    if (btnRearrange) {
        btnRearrange.addEventListener('click', async () => {
            const saveOverlay = document.getElementById('m-save-loading-overlay');
            try {
                btnRearrange.style.opacity = '0.5';
                if (saveOverlay) {
                    const overlayText = saveOverlay.querySelector('p');
                    if (overlayText) overlayText.textContent = "Rearranging Archive... 🔮";
                    saveOverlay.style.display = 'flex';
                }
                const res = await fetch(`/api/grimoire/rearrange/${window.GRIMOIRE_STAGE}/${window.GRIMOIRE_IDX}`, { method: 'POST' });
                if (res.ok) loadRealExcelData(); 
                else alert("Failed to rearrange sheets.");
            } catch (e) {
                alert("Network error.");
            } finally {
                btnRearrange.style.opacity = '1';
                if (saveOverlay) {
                    saveOverlay.style.display = 'none';
                    const overlayText = saveOverlay.querySelector('p');
                    if (overlayText) overlayText.textContent = "Recompiling Archive... 🔮";
                }
            }
        });
    }

    const btnEdit = document.getElementById('m-btn-edit-mode');
    const btnSave = document.getElementById('m-btn-save-edit');
    const btnExit = document.getElementById('m-btn-exit-edit');
    
    if (btnEdit && btnSave && btnExit) {
        btnEdit.addEventListener('click', enterEditMode);
        btnExit.addEventListener('click', exitEditMode);
        btnSave.addEventListener('click', saveEditData);
    }
});

async function loadRealExcelData() {
    const workspace = document.getElementById('m-excel-workspace');
    workspace.style.display = 'flex'; 
    document.getElementById('m-luckysheet-container').style.display = 'none';

    try {
        const infoRes = await fetch(`/api/grimoire/info/${window.GRIMOIRE_STAGE}/${window.GRIMOIRE_IDX}`);
        if (infoRes.ok) {
            const info = await infoRes.json();
            const titleEl = document.querySelector('.m-excel-title');
            if (titleEl) titleEl.textContent = `🔮 ${info.target_name}`;
        }

        const res = await fetch(`/api/grimoire/download/${window.GRIMOIRE_STAGE}/${window.GRIMOIRE_IDX}?t=${Date.now()}`);
        if (!res.ok) throw new Error("Archive not found.");
        
        const arrayBuffer = await res.arrayBuffer();
        rawExcelBlob = new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const file = new File([rawExcelBlob], "archive.xlsx");
        
        LuckyExcel.transformExcelToLucky(file, function(exportJson, luckysheetfile) {
            if (exportJson.sheets == null || exportJson.sheets.length === 0) {
                workspace.innerHTML = "<div class='m-loading-screen'>This archive is empty.</div>";
                return;
            }
            workspace.style.display = 'none'; 
            luckysheetDataCache = exportJson.sheets;
            renderSheetTabs(luckysheetDataCache.map(s => s.name));
            initLuckySheet(luckysheetDataCache, false);
        });
    } catch (e) {
        workspace.innerHTML = `<div class='m-loading-screen' style='color:#ff5252;'>Error: ${e.message}</div>`;
    }
}

function initLuckySheet(sheetsData, editable) {
    if (window.luckysheet) luckysheet.destroy(); 

    document.getElementById('m-luckysheet-container').style.display = 'block';

    // 🚀 [엑셀 셀 데이터 내부 폰트 강제 주입]
    // PC에서 무슨 폰트로 저장되었든 모바일이 무시하지 못하도록 내부 데이터를 Consolas로 싹 덮어씁니다.
    sheetsData.forEach(sheet => {
        if (sheet.celldata) {
            sheet.celldata.forEach(cell => {
                if (cell.v && typeof cell.v === 'object') {
                    cell.v.ff = "Consolas";
                }
            });
        }
    });

    luckysheet.create({
        container: 'm-luckysheet-container', 
        showinfobar: false,
        showtoolbar: editable,
        sheetFormulaBar: editable,
        showsheetbar: false,
        allowEdit: editable,
        enableAddRow: editable,
        enableAddCol: editable,
        data: sheetsData,
        title: 'Grimoire',
        defaultFontFamily: "Consolas", // 🚀 럭키시트 기본 엔진 폰트 교체
        fontList: [                    // 🚀 럭키시트 인식 목록에 강제 추가
            { "fontName": "Consolas", "url": "" }
        ]
    });

    if(sheetsData.length > 0) {
        const activeSheet = sheetsData.find(s => s.status === 1) || sheetsData[0];
        updateTabUI(activeSheet.name);
    }
}

function renderSheetTabs(sheets) {
    const container = document.getElementById('m-sheet-tabs');
    container.innerHTML = '';
    sheets.forEach(sheetName => {
        const tab = document.createElement('div');
        tab.className = 'm-sheet-tab';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = sheetName;
        nameSpan.onclick = () => switchSheet(sheetName);
        tab.appendChild(nameSpan);

        if (sheets.length > 1) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'm-btn-sheet-close';
            closeBtn.innerHTML = '✕';
            closeBtn.onclick = (e) => { e.stopPropagation(); openDeleteModal(sheetName); };
            tab.appendChild(closeBtn);
        }
        container.appendChild(tab);
    });
}

function switchSheet(sheetName) {
    updateTabUI(sheetName);
    if (window.luckysheet) {
        const allSheets = luckysheet.getAllSheets();
        const sheet = allSheets.find(s => s.name === sheetName);
        if (sheet) luckysheet.setSheetActive(sheet.order);
    }
}

function updateTabUI(sheetName) {
    document.querySelectorAll('.m-sheet-tab').forEach(t => {
        t.classList.toggle('active', t.querySelector('span').textContent === sheetName);
    });
}

function openDeleteModal(sheetName) {
    sheetToDelete = sheetName;
    document.getElementById('m-delete-modal-text').textContent = `delete '${sheetName}'?`;
    document.getElementById('m-delete-modal').style.display = 'flex';
    
    document.getElementById('m-btn-modal-yes').onclick = async () => {
        document.getElementById('m-delete-modal').style.display = 'none';
        const saveOverlay = document.getElementById('m-save-loading-overlay');
        try {
            if (saveOverlay) {
                const overlayText = saveOverlay.querySelector('p');
                if (overlayText) overlayText.textContent = "Extinguishing Sheet... 🔮";
                saveOverlay.style.display = 'flex';
            }
            const res = await fetch(`/api/grimoire/delete_sheet/${window.GRIMOIRE_STAGE}/${window.GRIMOIRE_IDX}/${encodeURIComponent(sheetToDelete)}`, { method: 'DELETE' });
            if (res.ok) {
                sheetToDelete = null; loadRealExcelData(); 
            } else alert("Failed to delete sheet.");
        } catch (e) { alert("Network error."); } 
        finally {
            if (saveOverlay) {
                saveOverlay.style.display = 'none';
                const overlayText = saveOverlay.querySelector('p');
                if (overlayText) overlayText.textContent = "Recompiling Archive... 🔮";
            }
        }
    };
}

function closeDeleteModal() {
    sheetToDelete = null; document.getElementById('m-delete-modal').style.display = 'none';
}

function enterEditMode() {
    if (!window.luckysheet) return;
    isEditMode = true;
    document.getElementById('m-btn-edit-mode').style.display = 'none';
    document.getElementById('m-btn-save-edit').style.display = 'flex';
    document.getElementById('m-btn-exit-edit').style.display = 'flex';
    initLuckySheet(luckysheet.getAllSheets(), true);
}

function exitEditMode() {
    isEditMode = false;
    document.getElementById('m-btn-edit-mode').style.display = 'flex';
    document.getElementById('m-btn-save-edit').style.display = 'none';
    document.getElementById('m-btn-exit-edit').style.display = 'none';
    loadRealExcelData();
}

async function saveEditData() {
    if (!isEditMode) return;
    const saveOverlay = document.getElementById('m-save-loading-overlay');
    if (saveOverlay) saveOverlay.style.display = 'flex';

    try {
        if (luckysheet.exitEditMode) luckysheet.exitEditMode();
        
        // 🚀 순수 데이터만 추출해서 전송 (폰트 오염 걱정 없음)
        const payload = { 
            stage: window.GRIMOIRE_STAGE, 
            sheet_data: luckysheet.getAllSheets().map(s => ({ name: s.name, data: s.data })) 
        };
        
        const response = await fetch(`/api/grimoire/edit/${window.GRIMOIRE_IDX}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

        if (response.ok) {
            isEditMode = false;
            document.getElementById('m-btn-edit-mode').style.display = 'flex';
            document.getElementById('m-btn-save-edit').style.display = 'none';
            document.getElementById('m-btn-exit-edit').style.display = 'none';
            loadRealExcelData(); 
        } else {
            alert(`Save Failed: ${(await response.json()).detail}`);
        }
    } catch (error) { alert("Network Error during Save."); } 
    finally { if (saveOverlay) saveOverlay.style.display = 'none'; }
}