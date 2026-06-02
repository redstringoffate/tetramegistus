# app/world/nigredo/routes.py
import os
import urllib.parse
import re

from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from world.registry import STAGE_MAP
from api.astrology import get_seed_from_request

from core.database import get_db
from psycopg2.extras import RealDictCursor

# 📱 [추가]: 모바일 판별 함수 (순환 참조 방지를 위해 라우터에 독립 선언)
def is_mobile(request: Request) -> bool:
    user_agent = request.headers.get("user-agent", "").lower()
    return bool(re.search(r"mobile|android|iphone|ipad|ipod", user_agent))

# 🔑 경로 설정 (도커/리눅스 호환용 동적 경로로 수복)
# 현재 파일(routes.py) 기준으로 3단계 위로 올라가서 app 폴더를 찾습니다.
CURRENT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
DB_PATH = os.path.join(PROJECT_ROOT, "tetramegistus.db")
UI_PATH = os.path.join(CURRENT_DIR, "ui")

templates = Jinja2Templates(directory=UI_PATH)

router = APIRouter(prefix="/world/nigredo", tags=["nigredo"])

# 🔑 [Unified Cleaner]: 쿠키 따옴표 및 인코딩 정제 함수
def get_clean_cookie(request: Request, name: str):
    val = request.cookies.get(name)
    if not val: return None
    # 따옴표 제거 및 URL 디코딩 수행
    clean_val = val.replace('"', '').strip()
    return urllib.parse.unquote(clean_val)

# ─────────────────────────────
# 1. Nigredo Main Index
# ─────────────────────────────
@router.get("")
async def nigredo_index(request: Request, module: str = None):
    user_data = None
    session_user_id = get_clean_cookie(request, "session_user_id")
    is_time_locked = False # 🚀 3차 락 신호 초기화

    current_active = get_seed_from_request(request)
    if current_active:
        user_data = current_active
        # 생시가 "Unknown" 문자열이거나 is_time_unknown 플래그가 1이면 잠금 활성화
        b_time = str(current_active.get('birth_time', ''))
        if "Unknown" in b_time or current_active.get('is_time_unknown') == 1:
            is_time_locked = True
    
    # 2순위: DB에서 사용자 정보 확인 (Station 데이터가 없을 경우 대비)
    elif session_user_id:
        try:
            # 🚀 PostgreSQL 연결 및 RealDictCursor 장착
            conn = get_db()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # 🚀 SQLite의 '?' 대신 PostgreSQL의 '%s' 를 사용합니다.
            cursor.execute(
                "SELECT * FROM users WHERE LOWER(email) = LOWER(%s)", 
                (session_user_id,)
            )
            user_row = cursor.fetchone()
            
            if user_row:
                user_data = dict(user_row)
                user_data['birth_date'] = user_row['birth'] 
                user_data['birth_time'] = user_row.get('birth_time')
                user_data['city'] = user_row['location']
                
                if not user_data.get('birth_time') or user_data['birth_time'] == "Unknown":
                    is_time_locked = True
                    
            cursor.close()
            conn.close()
        except Exception as e: 
            print(f"--- [DB ERROR]: {e} ---")

    # 3순위: 쿠키(비회원) 정보 확인
    if not user_data or not user_data.get('birth_date'):
        local_birth = get_clean_cookie(request, "temp_birth_date") 
        local_time = get_clean_cookie(request, "temp_birth_time")
        local_city = get_clean_cookie(request, "temp_location")
        
        if local_birth:
            user_data = {
                "email": session_user_id or "GUEST_SEED",
                "birth_date": local_birth,
                "birth_time": local_time,
                "city": local_city if local_city else None
            }
            if not local_time or local_time == "Unknown":
                is_time_locked = True

    # 🔑 [Gate Logic]: 잠금 상태 결정
    # 1차 락: 시드 데이터 자체가 없을 경우
    is_locked = not user_data or not user_data.get('birth_date')
    
    # Nigredo는 합일 개념이 없으므로 2차 락(is_union_locked)은 항상 False

    # 📦 백엔드에서 넘겨줄 데이터(Context)를 하나의 변수로 묶습니다.
    context = {
        "request": request,
        "stage": "nigredo",
        "is_locked": is_locked,
        "is_union_locked": False, 
        "is_time_locked": is_time_locked,
        "modules": STAGE_MAP.get("nigredo", []),
        "active_module": module,
        "user": user_data or {"email": session_user_id, "birth_date": None, "city": None}
    }

    # 📱 [모바일 분기]: 모바일이면 모바일 전용 shell/stage.html 렌더링
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/nigredo/index.html", context)

    # 💻 [PC 분기]: 기존 PC용 렌더링
    return templates.TemplateResponse("world/shell/stage.html", context)

# ─────────────────────────────
# 2. Append Seed Page (+)
# ─────────────────────────────
@router.get("/append")
async def append_seed_page(request: Request):
    if is_mobile(request):
        return templates.TemplateResponse(
            "mobile/world/nigredo/modules/append.html", 
            {"request": request, "stage": "nigredo"}
        )
        
    return templates.TemplateResponse(
        "world/nigredo/modules/append.html", 
        {"request": request, "stage": "nigredo"}
    )

# ─────────────────────────────
# 3. Edit Seed Page (*)
# ─────────────────────────────
# 🚀 PC의 패스 방식(/edit/35)과 모바일의 쿼리 방식(/edit?id=35)을 모두 허용!
@router.get("/edit")
@router.get("/edit/{seed_id}")
async def edit_seed_page(request: Request, seed_id: str = None, id: str = None):
    # PC에서 온 seed_id가 있으면 그걸 쓰고, 없으면 모바일에서 온 id를 씁니다.
    target_id = seed_id or id 

    if not target_id:
        return RedirectResponse(url="/world/nigredo?module=n1")

    if is_mobile(request):
        return templates.TemplateResponse(
            "mobile/world/nigredo/modules/edit.html", 
            {"request": request, "stage": "nigredo", "seed_id": target_id}
        )
        
    return templates.TemplateResponse(
        "world/nigredo/modules/edit.html", 
        {"request": request, "stage": "nigredo", "seed_id": target_id}
    )
