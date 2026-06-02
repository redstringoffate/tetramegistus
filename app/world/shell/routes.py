# app/world/shell/routes.py

from fastapi import APIRouter, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
import os
import re
import urllib.parse
from psycopg2.extras import RealDictCursor

# 🔑 [v26 수복]: DB_PATH 소각, get_db 소환[cite: 7]
from core.database import get_db
from core.auth.admin import ADAM_EMAIL 

router = APIRouter(
    prefix="/world",
    tags=["world-shell"]
)

def is_mobile(request: Request) -> bool:
    user_agent = request.headers.get("user-agent", "").lower()
    return bool(re.search(r"mobile|android|iphone|ipad|ipod", user_agent))

# 🔑 경로 정제 (로컬 개발 환경과 프로덕션 환경 모두 대응)
CURRENT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UI_PATH = os.path.join(CURRENT_DIR, "ui")
templates = Jinja2Templates(directory=UI_PATH)

# ─────────────────────────────
# World-level Pages (HTML)
# ─────────────────────────────

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """
    모든 진입의 시작점. 
    이미 세션이 있다면 본류(Nigredo)로, 없다면 로그인 게이트로 인도합니다.
    """
    if request.cookies.get("session_user_id"):
        return RedirectResponse(url="/world/nigredo")
        
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/login.html", {"request": request})
    return templates.TemplateResponse("world/shell/login.html", {"request": request})

@router.get("/mypage", response_class=HTMLResponse)
async def mypage_page(request: Request):
    """
    [me] 클릭 시 진입하는 마이페이지
    """
    user_id = request.cookies.get("session_user_id")
    if not user_id:
        return RedirectResponse(url="/world/login")
    
    context = {
        "request": request,
        "user_id": user_id,
        "stage": "shell" 
    }
    
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/mypage.html", context)
    return templates.TemplateResponse("world/shell/mypage.html", context)

@router.get("/anamnesis", response_class=HTMLResponse)
async def anamnesis_page(request: Request):
    raw_user_id = request.cookies.get("session_user_id")
    if not raw_user_id:
        return RedirectResponse(url="/world/login")

    user_id = raw_user_id.strip('"').strip()
    master_key = "XXXX-XXXX-XXXX-XXXX" 
    
    # 🚀 [PostgreSQL 연결]
    try:
        conn = get_db()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT master_key FROM users WHERE LOWER(email) = LOWER(%s)", (user_id,))
        user = cursor.fetchone()
        
        if user and user["master_key"]:
            master_key = user["master_key"]
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"--- [CORE ERROR]: Failed to load master key for {user_id}: {e} ---")

    context = {
        "request": request,
        "user_id": user_id,
        "user_master_key": master_key,
        "stage": "shell"
    }

    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/anamnesis.html", context)
    return templates.TemplateResponse("world/shell/anamnesis.html", context)

# ─────────────────────────────────────────────────────────
# Grimoire Archive (바이너리 박제 시대의 내비게이터)
# ─────────────────────────────────────────────────────────

@router.get("/grimoire", response_class=HTMLResponse)
async def world_grimoire_main(request: Request):
    user_id = request.cookies.get("session_user_id")
    if not user_id: return RedirectResponse(url="/world/login")
    
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/grimoire.html", {"request": request})
    return templates.TemplateResponse("world/shell/grimoire.html", {"request": request})

@router.get("/grimoire/reader", response_class=HTMLResponse)
async def grimoire_reader_page(request: Request, stage: str, idx: str):
    user_id = request.cookies.get("session_user_id")
    if not user_id: return RedirectResponse(url="/world/login")
    
    display_name = f"Unknown Archive ({idx})"
    # 🚀 [PostgreSQL 연결]
    try:
        conn = get_db()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT target_name FROM grimoire_archives WHERE id = %s AND user_id = %s", (idx, user_id))
        row = cursor.fetchone()
        if row:
            display_name = row["target_name"]
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"--- [READER ERROR]: Failed to load name from DB: {e} ---")
    
    context = {
        "request": request,
        "stage": stage.lower(),         
        "idx": idx,                     
        "display_name": display_name    
    }
    
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/grimoire/reader.html", context)
    return templates.TemplateResponse("world/shell/grimoire/reader.html", context)

@router.get("/grimoire/pdf_reader", response_class=HTMLResponse)
async def grimoire_pdf_reader_page(request: Request, idx: str):
    """ Grimoire: Rubedo PDF Fullscreen Reader """
    user_id = request.cookies.get("session_user_id")
    if not user_id: return RedirectResponse(url="/world/login")
    
    context = {
        "request": request,
        "stage": "rubedo", # PDF는 무조건 Rubedo 소속이므로 하드코딩
        "idx": idx
    }
    
    if is_mobile(request):
        # 🚀 아까 새로 만든 독립형 풀스크린 모바일 HTML로 연결!
        return templates.TemplateResponse("mobile/world/shell/grimoire/pdf_reader.html", context)
        
    # PC에서도 접근할 경우를 대비한 Fallback (임시로 기존 reader에 연결하거나 동일하게 pdf_reader 생성)
    return templates.TemplateResponse("world/shell/grimoire/pdf_reader.html", context)

# 🚀 [수복]: 스테이지별 목록 페이지 (중복 코드를 제거하고 통합 관리 가능)
@router.get("/grimoire/{stage}", response_class=HTMLResponse)
async def world_grimoire_stage(request: Request, stage: str):
    user_id = request.cookies.get("session_user_id")
    if not user_id: return RedirectResponse(url="/world/login")
    
    valid_stages = ["nigredo", "albedo", "citrinitas", "rubedo"]
    current_stage = stage.lower()
    
    if current_stage not in valid_stages:
        return RedirectResponse(url="/world/grimoire")
        
    context = {
        "request": request, 
        "stage": current_stage
    }
    
    if is_mobile(request):
        return templates.TemplateResponse(f"mobile/world/shell/grimoire/{current_stage}.html", context)
    return templates.TemplateResponse(f"world/shell/grimoire/{current_stage}.html", context)

@router.get("/grimoire/nigredo", response_class=HTMLResponse)
async def grimoire_nigredo_page(request: Request):
    """ Grimoire: Nigredo Archive """
    user_id = request.cookies.get("session_user_id")
    if not user_id:
        return RedirectResponse(url="/world/login")
    
    context = {"request": request, "stage": "shell"}
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/grimoire/nigredo.html", context)
    return templates.TemplateResponse("world/shell/grimoire/nigredo.html", context)

@router.get("/grimoire/albedo", response_class=HTMLResponse)
async def grimoire_albedo_page(request: Request):
    """ Grimoire: Albedo Archive """
    user_id = request.cookies.get("session_user_id")
    if not user_id:
        return RedirectResponse(url="/world/login")
    
    context = {"request": request, "stage": "shell"}
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/grimoire/albedo.html", context)
    return templates.TemplateResponse("world/shell/grimoire/albedo.html", context)

@router.get("/grimoire/citrinitas", response_class=HTMLResponse)
async def grimoire_citrinitas_page(request: Request):
    """ Grimoire: Citrinitas Archive """
    user_id = request.cookies.get("session_user_id")
    if not user_id:
        return RedirectResponse(url="/world/login")
    
    context = {"request": request, "stage": "shell"}
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/grimoire/citrinitas.html", context)
    return templates.TemplateResponse("world/shell/grimoire/citrinitas.html", context)

@router.get("/grimoire/rubedo", response_class=HTMLResponse)
async def grimoire_rubedo_page(request: Request):
    """ Grimoire: Rubedo Archive """
    user_id = request.cookies.get("session_user_id")
    if not user_id:
        return RedirectResponse(url="/world/login")
    
    context = {"request": request, "stage": "shell"}
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/grimoire/rubedo.html", context)
    return templates.TemplateResponse("world/shell/grimoire/rubedo.html", context)

@router.get("/logout")
async def logout():
    """
    세션을 파기하고 비로그인 상태의 시작점인 Nigredo로 추방합니다.
    """
    response = RedirectResponse(url="/world/nigredo", status_code=303)
    response.delete_cookie(key="session_user_id", path="/")
    return response

@router.get("/inquiries", response_class=HTMLResponse)
async def inquiries_page(request: Request):
    """
    문의 및 피드백 페이지
    """
    context = {"request": request, "stage": "shell"}
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/inquiries.html", context)
    return templates.TemplateResponse("world/shell/inquiries.html", context)

