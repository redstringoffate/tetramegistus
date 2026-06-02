# app/world/albedo/routes.py
import os
import urllib.parse
import re

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from world.registry import STAGE_MAP
from api.astrology import get_seed_from_request

# 🚀 [PostgreSQL 수복]: DB 엔진 교체
from core.database import get_db

# 📱 [추가]: 모바일 감지 함수 (순환 참조 방지용 독립 선언)
def is_mobile(request: Request) -> bool:
    user_agent = request.headers.get("user-agent", "").lower()
    return bool(re.search(r"mobile|android|iphone|ipad|ipod", user_agent))

# 🔑 경로 설정 동기화 (도커/리눅스 호환 동적 경로로 수복)
CURRENT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)

UI_PATH = os.path.join(CURRENT_DIR, "ui")

templates = Jinja2Templates(directory=UI_PATH)
router = APIRouter(prefix="/world/albedo", tags=["albedo"])

# 🔑 [Unified Cleaner]: 쿠키 따옴표 및 인코딩 정제
def get_clean_cookie(request: Request, name: str):
    val = request.cookies.get(name)
    if not val: return None
    clean_val = val.replace('"', '').strip()
    return urllib.parse.unquote(clean_val)

@router.get("")
async def albedo_index(request: Request, module: str = None):
    session_user_id = get_clean_cookie(request, "session_user_id")
    has_companion = False
    has_davison = False
    is_time_locked = False # 🚀 3차 락: 생시 미상 잠금 신호

    # 🏛️ [Case A]: 회원 상태 (DB 권위 확인)
    if session_user_id:
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            # 1. Companion Check (me 외 시드 존재 여부)
            cursor.execute("SELECT COUNT(*) FROM natal_charts WHERE user_id = %s AND name != '[me]' AND is_active = 1", (session_user_id,))
            if cursor.fetchone()[0] > 0: has_companion = True
            
            # 2. Union Check (Davison 시드 존재 여부)
            # 🚀 [폭탄 해체]: is_time_unknown ➔ is_unknown_time 으로 변경!
            cursor.execute("SELECT is_unknown_time FROM natal_charts WHERE user_id = %s AND has_body = 0 AND is_active = 1 LIMIT 1", (session_user_id,))
            row = cursor.fetchone()
            if row:
                has_davison = True
                if row[0] == 1: is_time_locked = True
                
            cursor.close()
            conn.close()
        except Exception as e: 
            print(f"--- [ALBEDO DB ERROR]: {e} ---")
            
    # 🏛️ [Case B]: 비회원 상태 (Station 및 Cookie 확인)
    else:
        has_companion = get_clean_cookie(request, "has_companion") == "true"
        # 🚀 [수복]: Station에 현재 안착된 시드를 직접 대조 (정확도 극대화)
        current_union = get_seed_from_request(request)
        if current_union:
            has_davison = True
            # 데이비슨 계산 시 심어둔 is_time_unknown: 1 확인
            if current_union.get('is_unknown_time') == 1:
                is_time_locked = True
        else:
            has_davison = get_clean_cookie(request, "active_davison") is not None

    # 🔑 [Gate Logic]: 삼중 잠금 체계 확립
    is_locked = not has_companion      # 1차: 동반자 없음 (A1~A8 전체 락)
    is_union_locked = not has_davison  # 2차: 합일 미수행 (A1 제외 전체 락)
    # is_time_locked                     3차: 생시 미상 (A3, A4 개별 락)

    # 📦 백엔드에서 뷰(View)로 넘겨줄 데이터 패키징
    context = {
        "request": request,
        "stage": "albedo",
        "is_locked": is_locked,
        "is_union_locked": is_union_locked,
        "is_time_locked": is_time_locked,
        "modules": STAGE_MAP.get("albedo", []),
        "active_module": module,
    }

    # 📱 [모바일 분기]: 모바일이면 모바일 전용 shell/stage.html 렌더링
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/albedo/index.html", context)

    # 💻 [PC 분기]: 기존 PC용 렌더링
    return templates.TemplateResponse("world/shell/stage.html", context)