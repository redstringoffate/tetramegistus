# app/world/rubedo/routes.py

import os
import re # 📱 [추가]: 모바일 판별을 위한 정규식 모듈

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from world.registry import STAGE_MAP

# 📱 [추가]: 모바일 감지 함수 (순환 참조 방지용 독립 선언)
def is_mobile(request: Request) -> bool:
    user_agent = request.headers.get("user-agent", "").lower()
    return bool(re.search(r"mobile|android|iphone|ipad|ipod", user_agent))

# 🔑 절대 경로 설정 동기화 (도커/리눅스 호환용 동적 경로로 수복)
CURRENT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UI_PATH = os.path.join(CURRENT_DIR, "ui")
templates = Jinja2Templates(directory=UI_PATH)

router = APIRouter(
	prefix="/world/rubedo",
	tags=["rubedo"]
)

@router.get("")
async def rubedo_index(request: Request, module: str = None):
    # 1. 현재 접속한 유저의 쿠키 확인
    current_user = request.cookies.get("session_user_id")
    
    # 2. 공개된 공식 관리자 계정 명시
    admin_email = "admin@tetramegistus.com"
    
    # 3. 일치하면 관리자(God) 권한 부여
    is_admin = False
    if current_user and current_user == admin_email:
        is_admin = True

    # 📦 백엔드 데이터 패키징
    context = {
        "request": request,
        "stage": "rubedo",
        "modules": STAGE_MAP.get("rubedo", []),
        "active_module": module,
        "is_admin": is_admin  # 🚀 프론트엔드로 관리자 여부 전달
    }

    # 📱 [모바일 분기]
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/rubedo/index.html", context)
        
    # 💻 [PC 분기]
    return templates.TemplateResponse("world/shell/stage.html", context)


@router.get("/godmode_lv3")
async def god_mode_sanctuary(request: Request):
    # 1. 관리자 계정 여부 확인
    current_user = request.cookies.get("session_user_id")
    admin_email = "admin@tetramegistus.com" 
    
    # 2. God Token 존재 여부 확인
    god_token = request.cookies.get("god_token")
    
    # 🛡️ 결계: 관리자도 아니고 토큰도 없으면 404로 위장하여 차단
    if current_user != admin_email or not god_token:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not Found")

    # 📦 백엔드 데이터 패키징
    context = {
        "request": request,
        "stage": "rubedo",
        "is_god_mode": True # 사이드바 등을 숨기기 위한 플래그
    }

    # 📱 [모바일 분기]
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/rubedo/godmode_lv3/godmode_lv3.html", context)
        
    # 💻 [PC 분기]
    return templates.TemplateResponse("world/rubedo/godmode_lv3.html", context)


@router.get("/godmode_lv3/editor")
async def god_mode_editor(
    request: Request, 
    module: str = "new", 
    path: str = "", 
    lang: str = "en", 
    mode: str = "WRITE"
):
    # 1. 기존과 동일한 권한 결계
    current_user = request.cookies.get("session_user_id")
    god_token = request.cookies.get("god_token")
    if current_user != "admin@tetramegistus.com" or not god_token:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not Found")

    # 📦 백엔드 데이터 패키징
    context = {
        "request": request,
        "module": module,
        "path": path,
        "lang": lang,
        "mode": mode
    }

    # 📱 [모바일 분기]
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/rubedo/godmode_lv3/godmode_editor.html", context)
        
    # 💻 [PC 분기]
    return templates.TemplateResponse("world/rubedo/godmode_editor.html", context)