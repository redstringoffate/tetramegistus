# app/world/citrinitas/routes.py

import os
import re  # 📱 [추가]: 모바일 판별을 위한 정규식 모듈

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from world.registry import STAGE_MAP

# 📱 [추가]: 모바일 감지 함수 (순환 참조 방지용 독립 선언)
def is_mobile(request: Request) -> bool:
    user_agent = request.headers.get("user-agent", "").lower()
    return bool(re.search(r"mobile|android|iphone|ipad|ipod", user_agent))

# 🔑 절대 경로 설정 동기화 (도커/리눅스 호환용 동적 경로로 수복)
# 현재 파일(routes.py)을 기준으로 3단계 위로 올라가서 app 폴더를 찾습니다.
CURRENT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UI_PATH = os.path.join(CURRENT_DIR, "ui")
templates = Jinja2Templates(directory=UI_PATH)

router = APIRouter(
	prefix="/world/citrinitas",
	tags=["citrinitas"]
)

@router.get("")
async def citrinitas_index(request: Request, module: str = None):
    # 📦 백엔드 데이터 패키징
    context = {
        "request": request,
        "stage": "citrinitas",
        "modules": STAGE_MAP.get("citrinitas", []),
        "active_module": module
    }
    
    # 📱 [모바일 분기]
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/citrinitas/index.html", context)
        
    # 💻 [PC 분기]
    return templates.TemplateResponse("world/shell/stage.html", context)


# 🟡 C2: Hora Occulta 서브 모듈 라우터 (Aleph, Mem, Shin)
@router.get("/modules/c2_{ritual_name}")
async def render_c2_module(request: Request, ritual_name: str):
    context = {"request": request}
    
    # 📱 [모바일 분기]: f-string 문자열의 앞부분에 'mobile'을 붙여줍니다.
    if is_mobile(request):
        return templates.TemplateResponse(
            f"mobile/world/citrinitas/modules/c2_{ritual_name}.html",
            context
        )
        
    # 💻 [PC 분기]
    return templates.TemplateResponse(
        f"world/citrinitas/modules/c2_{ritual_name}.html",
        context
    )


# 🔵 C3: Illuminatio (Nefesh, Ruach, Neshamah, Chayah, Yechidah) - 디자인 유지형 라우터
@router.get("/modules/c3_{passage_name}")
async def render_c3_module(request: Request, passage_name: str):
    # 📦 백엔드 데이터 패키징
    context = {
        "request": request,
        "stage": "citrinitas",
        "modules": STAGE_MAP.get("citrinitas", []),
        "active_module": f"c3_{passage_name}" # 👈 예: c3_nefesh
    }
    
    # 📱 [모바일 분기]
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/stage.html", context)
        
    # 💻 [PC 분기]
    return templates.TemplateResponse("world/shell/stage.html", context)