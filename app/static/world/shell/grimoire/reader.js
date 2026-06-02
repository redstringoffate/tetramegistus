let sheetToDelete = null;
let rawExcelBlob = null; 
let isEditMode = false;
let luckysheetDataCache = null; // 파싱된 데이터를 들고 있는 캐시

document.addEventListener('DOMContentLoaded', () => {
    // 1. 초기 데이터 로드
    loadRealExcelData();

    // 2. 삭제 모달 취소 버튼 연동
    const btnModalNo = document.getElementById('btn-modal-no');
    if (btnModalNo) {
        btnModalNo.addEventListener('click', closeDeleteModal);
    }
    
    // 3. 🚀 시트 탭 좌우 스크롤 화살표 연동
    const tabsWrapper = document.getElementById('sheet-tabs');
    const btnScrollLeft = document.getElementById('btn-scroll-left');
    const btnScrollRight = document.getElementById('btn-scroll-right');

    if (tabsWrapper) {
        btnScrollLeft?.addEventListener('click', () => {
            tabsWrapper.scrollBy({ left: -300, behavior: 'smooth' });
        });
        btnScrollRight?.addEventListener('click', () => {
            tabsWrapper.scrollBy({ left: 300, behavior: 'smooth' });
        });
    }

    // 4. 시트 번호 재정렬 (Rearrange) 로직
    const btnRearrange = document.getElementById('btn-rearrange');
    if (btnRearrange) {
        btnRearrange.addEventListener('click', async () => {
            const saveOverlay = document.getElementById('save-loading-overlay');
            
            try {
                // 버튼 시각적 피드백 및 로딩 오버레이 ON
                btnRearrange.style.opacity = '0.5';
                if (saveOverlay) {
                    // 로딩 화면의 텍스트를 Rearrange 용도로 잠깐 변경
                    const overlayText = saveOverlay.querySelector('p');
                    if (overlayText) overlayText.textContent = "Rearranging Grimoire Archive... 🔮";
                    saveOverlay.style.display = 'flex';
                }
                
                const res = await fetch(`/api/grimoire/rearrange/${window.GRIMOIRE_STAGE}/${window.GRIMOIRE_IDX}`, { 
                    method: 'POST' 
                });
                
                if (res.ok) {
                    console.log("[GRIMOIRE] Sheets rearranged successfully.");
                    loadRealExcelData(); // 순서가 바뀌었으므로 리로드
                } else {
                    alert("Failed to rearrange sheets.");
                }
            } catch (e) {
                console.error(e);
                alert("Network error during rearrange.");
            } finally {
                // 로딩 오버레이 OFF 및 버튼 복구
                btnRearrange.style.opacity = '1';
                if (saveOverlay) {
                    saveOverlay.style.display = 'none';
                    // 텍스트를 원래 Save 용도로 원복
                    const overlayText = saveOverlay.querySelector('p');
                    if (overlayText) overlayText.textContent = "Recompiling Grimoire Archive... 🔮";
                }
            }
        });
    }

    // 5. 에디트 모드 컨트롤러 연동
    const btnEdit = document.getElementById('btn-edit-mode');
    const btnSave = document.getElementById('btn-save-edit');
    const btnExit = document.getElementById('btn-exit-edit');
    
    if (btnEdit && btnSave && btnExit) {
        btnEdit.addEventListener('click', enterEditMode);
        btnExit.addEventListener('click', exitEditMode);
        btnSave.addEventListener('click', saveEditData);
    }
});

// 🚀 백엔드에서 엑셀을 다운받아 바로 Luckysheet 캐시로 변환
async function loadRealExcelData() {
    const workspace = document.getElementById('excel-workspace');
    workspace.style.display = 'block'; // 로딩바 표시
    document.getElementById('luckysheet-container').style.display = 'none';

    try {
        // 🚀 1. 진정한 이름(DB) 불러와서 유령(Jinja2) 덮어쓰기
        const infoRes = await fetch(`/api/grimoire/info/${window.GRIMOIRE_STAGE}/${window.GRIMOIRE_IDX}`);
        if (infoRes.ok) {
            const info = await infoRes.json();
            // 화면 상단의 타이틀을 DB의 실제 이름으로 강제 교체!
            const titleEl = document.querySelector('.excel-title');
            if (titleEl) titleEl.textContent = `🔮 Grimoire Reader : ${info.target_name}`;
        }

        // 🚀 2. 엑셀 다운로드 (Baking)
        const res = await fetch(`/api/grimoire/download/${window.GRIMOIRE_STAGE}/${window.GRIMOIRE_IDX}?t=${Date.now()}`);
        if (!res.ok) throw new Error("이 마도서는 삭제되었거나 존재하지 않는 유령 링크입니다. (메뉴판이 낡았습니다!)");
        
        const arrayBuffer = await res.arrayBuffer();
        rawExcelBlob = new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        
        const file = new File([rawExcelBlob], "archive.xlsx");
        
        LuckyExcel.transformExcelToLucky(file, function(exportJson, luckysheetfile) {
            if (exportJson.sheets == null || exportJson.sheets.length === 0) {
                workspace.innerHTML = "<div class='loading-screen'>This archive is empty.</div>";
                return;
            }
            
            workspace.style.display = 'none'; // 로딩 종료
            luckysheetDataCache = exportJson.sheets;
            
            // 커스텀 탭 생성
            const sheetNames = luckysheetDataCache.map(s => s.name);
            renderSheetTabs(sheetNames);
            
            // 🚀 초기 렌더링은 무조건 Read-Only (수정 불가, 툴바 없음)
            initLuckySheet(luckysheetDataCache, false);
        });

    } catch (e) {
        console.error(e);
        workspace.innerHTML = `<div class='loading-screen' style='color:#ff5252;'>Error: ${e.message}</div>`;
    }
}

// 🚀 Luckysheet 통합 렌더러 (Read/Edit 상태 스위치)
function initLuckySheet(sheetsData, editable) {
    if (window.luckysheet) {
        luckysheet.destroy(); 
    }

    luckysheet.create({
        container: 'luckysheet-container',
        showinfobar: false,
        showtoolbar: editable,       // Edit 모드일 때만 상단 메뉴바 등장
        sheetFormulaBar: editable,   // Edit 모드일 때만 수식 입력줄 등장
        showsheetbar: false,         // 하단 기본 탭은 항상 숨김 (우리 커스텀 탭을 쓰기 위해)
        allowEdit: editable,         // 🚀 핵심: 읽기 전용 컨트롤
        enableAddRow: editable,
        enableAddCol: editable,
        data: sheetsData,
        title: 'Grimoire',
        fontList: [
            {"fontName": "Consolas"},
            {"fontName": "Arial"},
            {"fontName": "Times New Roman"},
            {"fontName": "Tahoma"},
            {"fontName": "Verdana"}
        ]
    });
    
    document.getElementById('luckysheet-container').style.display = 'block';

    // 렌더링 직후 첫 번째 시트가 활성화된 것처럼 탭 UI 업데이트
    if(sheetsData.length > 0) {
        const activeSheet = sheetsData.find(s => s.status === 1) || sheetsData[0];
        updateTabUI(activeSheet.name);
    }
}

// 하단 커스텀 탭 렌더링
function renderSheetTabs(sheets) {
    const container = document.getElementById('sheet-tabs');
    container.innerHTML = '';

    sheets.forEach(sheetName => {
        const tab = document.createElement('div');
        tab.className = 'sheet-tab';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = sheetName;
        nameSpan.onclick = () => switchSheet(sheetName);

        tab.appendChild(nameSpan);

        if (sheets.length > 1) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn-sheet-close';
            closeBtn.textContent = 'x';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                openDeleteModal(sheetName);
            };
            tab.appendChild(closeBtn);
        }

        container.appendChild(tab);
    });
}

// 커스텀 탭 클릭 시, 내부 Luckysheet 화면 전환
function switchSheet(sheetName) {
    updateTabUI(sheetName);
    if (window.luckysheet) {
        const allSheets = luckysheet.getAllSheets();
        const sheet = allSheets.find(s => s.name === sheetName);
        if (sheet) {
            luckysheet.setSheetActive(sheet.order);
        }
    }
}

function updateTabUI(sheetName) {
    document.querySelectorAll('.sheet-tab').forEach(t => {
        t.classList.toggle('active', t.querySelector('span').textContent === sheetName);
    });
}

function openDeleteModal(sheetName) {
    sheetToDelete = sheetName;
    document.getElementById('delete-modal-text').textContent = `delete '${sheetName}'?`;
    document.getElementById('delete-modal').style.display = 'flex';
    
    document.getElementById('btn-modal-yes').onclick = async () => {
        // 1. 확인 버튼을 누르면 기존 삭제 모달은 즉시 숨김
        document.getElementById('delete-modal').style.display = 'none';
        
        const saveOverlay = document.getElementById('save-loading-overlay');
        
        try {
            // 🚀 2. 로딩 오버레이 텍스트 변경 및 출력
            if (saveOverlay) {
                const overlayText = saveOverlay.querySelector('p');
                if (overlayText) overlayText.textContent = "Extinguishing Sheet... 🔮";
                saveOverlay.style.display = 'flex';
            }

            const res = await fetch(`/api/grimoire/delete_sheet/${window.GRIMOIRE_STAGE}/${window.GRIMOIRE_IDX}/${encodeURIComponent(sheetToDelete)}`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                sheetToDelete = null; // 초기화
                loadRealExcelData();  // 파일이 갱신되었으므로 다시 로드
            } else {
                alert("Failed to delete sheet.");
            }
        } catch (e) {
            console.error(e);
            alert("Network error.");
        } finally {
            // 🚀 3. 통신 종료 후 로딩 오버레이 끄고 텍스트 원복
            if (saveOverlay) {
                saveOverlay.style.display = 'none';
                const overlayText = saveOverlay.querySelector('p');
                if (overlayText) overlayText.textContent = "Recompiling Grimoire Archive... 🔮";
            }
        }
    };
}

function closeDeleteModal() {
    sheetToDelete = null;
    document.getElementById('delete-modal').style.display = 'none';
}

// ✏️ EDIT 버튼 누를 때
function enterEditMode() {
    if (!window.luckysheet) return;
    isEditMode = true;
    
    document.getElementById('btn-edit-mode').style.display = 'none';
    document.getElementById('btn-save-edit').style.display = 'inline-block';
    document.getElementById('btn-exit-edit').style.display = 'inline-block';
    
    // 현재 보고 있던 데이터를 가져와서 Edit 모드(editable=true)로 즉시 재시작
    const currentData = luckysheet.getAllSheets();
    initLuckySheet(currentData, true);
}

// ❌ EXIT 버튼 누를 때 (저장 안하고 롤백)
function exitEditMode() {
    isEditMode = false;
    
    document.getElementById('btn-edit-mode').style.display = 'inline-block';
    document.getElementById('btn-save-edit').style.display = 'none';
    document.getElementById('btn-exit-edit').style.display = 'none';
    
    // 원본 데이터를 다시 불러와서 읽기 전용으로 되돌림
    loadRealExcelData();
}

// 💾 SAVE 버튼 누를 때
async function saveEditData() {
    if (!isEditMode) return;

    // 🚀 1. 세이브 로딩 화면 ON
    const saveOverlay = document.getElementById('save-loading-overlay');
    if (saveOverlay) saveOverlay.style.display = 'flex';

    try {
        if (luckysheet.exitEditMode) {
            luckysheet.exitEditMode();
        }

        const rawSheets = luckysheet.getAllSheets();
        
        const cleanSheetData = rawSheets.map(sheet => ({
            name: sheet.name,
            data: sheet.data 
        }));
        
        const payload = {
            stage: window.GRIMOIRE_STAGE,
            sheet_data: cleanSheetData
        };

        const response = await fetch(`/api/grimoire/edit/${window.GRIMOIRE_IDX}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // alert("Grimoire Archive Saved Successfully! 🔮"); // (팝업은 이제 귀찮으니 생략하거나 유지)
            isEditMode = false;
            
            document.getElementById('btn-edit-mode').style.display = 'inline-block';
            document.getElementById('btn-save-edit').style.display = 'none';
            document.getElementById('btn-exit-edit').style.display = 'none';
            
            loadRealExcelData(); 
        } else {
            const err = await response.json();
            alert(`Save Failed: ${err.detail || 'Unknown Error'}`);
        }
    } catch (error) {
        console.error("Save Protocol Error:", error);
        alert("Network Error during Save.");
    } finally {
        // 🚀 2. 통신이 끝났으므로 로딩 화면 무조건 OFF (성공이든 실패든)
        if (saveOverlay) saveOverlay.style.display = 'none';
    }
}