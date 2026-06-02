# app/main.py

import sys
import os
import uuid
from dotenv import load_dotenv

# 1. 🔑 경로 절대 고정 로직 (클라우드/도커 호환용으로 수복)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# .env 파일 로드 (Docker에서는 환경변수를 직접 주입하므로 에러 무시 설정)
env_path = os.path.join(PROJECT_ROOT, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

from fastapi import FastAPI, Request, Response
from fastapi.responses import RedirectResponse, FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from core.database import init_db, get_db
from core.panopticon import init_panopticon, get_pano_db

# --- Routers Import ---
from gate.transitions import router as gate_router
from api.cities import router as cities_router
from api.auth import router as auth_api_router
from api.natal import router as natal_api_router
from api.astrology import router as astro_api_router # 🔑 [수복]: 신규 연산 API 추가
from api.theory import router as theory_router # 🔑 [수복]: 사비안 엔진 임포트
from api.grimoire import router as grimoire_api_router
from api.godmode import router as godmode_api_router

from world.shell.routes import router as world_router
from world.nigredo.routes import router as nigredo_router
from world.albedo.routes import router as albedo_router
from world.citrinitas.routes import router as citrinitas_router
from world.rubedo.routes import router as rubedo_router

import asyncio
from api.auth import start_resurrection_protocol # 🚀 공장에서 스위치 가져오기

import re # 📱 [모바일]: 정규식 모듈 임포트
import urllib.parse

def is_mobile(request: Request) -> bool:
    """📱 접속한 기기가 모바일(스마트폰/태블릿)인지 판별합니다."""
    user_agent = request.headers.get("user-agent", "").lower()
    # 안드로이드, 아이폰, 아이패드, 혹은 모바일 키워드가 포함되어 있으면 True 반환
    return bool(re.search(r"mobile|android|iphone|ipad|ipod", user_agent))

app = FastAPI() # 기존에 있는 app 선언 코드

# ==========================================
# 💀 [Ghost Exorcism] 삭제된 유저 강제 로그아웃 (Guest 강등)
# ==========================================
@app.middleware("http")
async def enforce_purge_logout(request: Request, call_next):
    path = request.url.path
    if path.startswith("/static") or path.startswith("/favicon"):
        return await call_next(request)

    raw_cookie = request.cookies.get("session_user_id")
    if raw_cookie:
        session_email = urllib.parse.unquote(raw_cookie.replace('"', '').strip())
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s", (session_email,))
        user = cursor.fetchone()
        conn.close()

        # 💀 DB에서는 소멸(Purge)되었는데 브라우저에 쿠키만 남은 상태 감지
        if not user:
            # API 호출 중이었다면 401 에러로 차단
            if path.startswith("/api/"):
                response = JSONResponse(
                    status_code=401, 
                    content={"status": "error", "message": "Soul has been returned to the void."}
                )
                response.delete_cookie("session_user_id", path="/")
                return response
            
            # 일반 페이지 이동 중이었다면, 로컬 스토리지는 절대 건드리지 않고 쿠키만 날림
            else:
                purge_html = f"""
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"></head>
                <body style="background:#000;">
                    <script>
                        // 1. 오직 로그인 증표(쿠키)만 파괴하여 비회원(Guest)으로 강등
                        document.cookie = "session_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                        
                        // 🚀 로컬 스토리지(localStorage)는 절대 건드리지 않습니다!
                        
                        // 2. 알림 후 메인이 아닌 '현재 보던 페이지'로 자연스럽게 회귀
                        alert("Your soul has been returned to the Void. Reverting to Guest mode.");
                        window.location.href = "{path}"; 
                    </script>
                </body>
                </html>
                """
                response = HTMLResponse(content=purge_html)
                response.delete_cookie("session_user_id", path="/")
                return response

    return await call_next(request)

# ─────────────────────────────
# 👁️ 파놉티콘의 눈 (Global Session Middleware)
# ─────────────────────────────
@app.middleware("http")
async def panopticon_tracker(request: Request, call_next):
    """사이트에 들어오는 모든 영혼에게 관측용 식별표를 부여합니다."""
    response = await call_next(request)
    
    # 이미 식별표가 있거나, 단순 정적 파일(css, js, 이미지) 요청이면 패스
    if "pano_session" in request.cookies or request.url.path.startswith("/static"):
        return response
        
    # 새로운 영혼이라면 1년짜리 고유 식별표 발급
    pano_session = str(uuid.uuid4())
    response.set_cookie(key="pano_session", value=pano_session, max_age=31536000, path="/")
    return response

# ─────────────────────────────
# 🛡️ [수복]: 역행 방지 무결성 결계 (Anti-Retrograde Middleware)
# ─────────────────────────────
@app.middleware("http")
async def anti_retrograde_gate(request: Request, call_next):
    path = request.url.path
    
    # 정적 파일 및 파비콘은 결계 제외
    if path.startswith("/static") or path.startswith("/favicon.ico"):
        return await call_next(request)
        
    # 영혼 감지 (세션 또는 로컬 쿠키 존재 여부)
    session_id = request.cookies.get("session_user_id")
    local_memory = request.cookies.get("temp_birth_date")
    has_soul = session_id is not None or local_memory is not None
    
    # 🚨 [결계 1]: Reincarnate 등으로 기억이 소멸되었는데 뒤로가기로 월드에 난입하려는 경우
    if path.startswith("/world") and not has_soul:
        response = RedirectResponse(url="/prima-materia")
        # 브라우저에게 이 페이지의 모든 캐시를 파기하라고 명령 (뒤로가기 원천 봉쇄)
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        return response

    # 🚨 [결계 2]: me 시드가 이미 생성되어 기억이 충만한데 뒤로가기로 최초 진입창에 역행하려는 경우
    # 🚀 [수복]: /login 경로는 비회원이 로그인을 위해 진입해야 하므로 역행 튕겨내기 대상에서 제외합니다!
    if (path == "/" or path == "/prima-materia") and has_soul:
        return RedirectResponse(url="/world/nigredo")
        
    # 기본 요청 진행
    response = await call_next(request)
    
    # 🚨 [결계 3]: 월드 내부의 모든 페이지 응답에 캐시 불허 헤더 강제 주입
    if path.startswith("/world"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        
    return response

STATIC_PATH = os.path.join(CURRENT_DIR, "static")
UI_PATH = os.path.join(CURRENT_DIR, "ui")

init_db() 
init_panopticon()

app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static") #
templates = Jinja2Templates(directory=UI_PATH)

# --- Router Registration ---
app.include_router(auth_api_router) #
app.include_router(cities_router)   #
app.include_router(natal_api_router) #
app.include_router(astro_api_router) # 🔑 [수복]: 이제 /api/astro 경로가 엔진에 연결됨
app.include_router(theory_router)    # 🔑 [수복]: 이제 /api/theory 경로가 정식으로 개통됨

app.include_router(gate_router)
app.include_router(world_router)
app.include_router(nigredo_router)
app.include_router(albedo_router)
app.include_router(citrinitas_router)
app.include_router(rubedo_router)

app.include_router(grimoire_api_router)
app.include_router(godmode_api_router)

@app.on_event("startup")
async def startup_event():
    # 서버 켜지자마자 백그라운드에서 자정 체크 루프 가동
    asyncio.create_task(start_resurrection_protocol())
    print("--- [SUCCESS]: Resurrection Protocol Engaged ---")

@app.post("/api/godmode/pulse")
async def panopticon_pulse(request: Request, data: dict):
    """프론트엔드에서 모듈을 벗어날 때 체류 시간과 방문 기록을 던져주는 API"""
    session_user_id = request.cookies.get("session_user_id")
    pano_session = getattr(request.state, "pano_session", request.cookies.get("pano_session"))
    
    if not pano_session:
        return JSONResponse(content={"status": "ignored"})
        
    is_anima = 1 if session_user_id else 0
    module_name = data.get("module", "UNKNOWN")
    duration = data.get("duration", 0) 
    country = data.get("country", "Other") 
    
    conn = get_pano_db()
    # 🚀 [PostgreSQL 수복]: cursor 사용 및 ? -> %s 교체
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO traffic_logs (session_id, user_id, is_anima, module, duration, country) VALUES (%s, %s, %s, %s, %s, %s)",
        (pano_session, session_user_id, is_anima, module_name, duration, country)
    )
    conn.commit()
    cursor.close()
    conn.close()
        
    return JSONResponse(content={"status": "recorded"})

def log_prima_materia_visit(request: Request):
    """🚀 [수복]: Prima Materia 전용 백엔드 직접 트래킹 함수"""
    pano_session = getattr(request.state, "pano_session", request.cookies.get("pano_session"))
    session_user_id = request.cookies.get("session_user_id")
    is_anima = 1 if session_user_id else 0

    if pano_session:
        try:
            conn = get_pano_db()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO traffic_logs (session_id, user_id, is_anima, module, duration, country) VALUES (%s, %s, %s, 'PRIMA_MATERIA', 0, 'Other')",
                (pano_session, session_user_id, is_anima)
            )
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"[TRACKING ERROR]: {e}")

# ─────────────────────────────
# 🛡️ 리다이렉션 루프 방어 및 영혼 감지 (Revised)
# ─────────────────────────────

def has_soul(request: Request):
    """
    🔑 [Soul Detection]: 세션(회원) 혹은 로컬 메모리(비회원 기억) 존재 여부 확인
    이 로직이 로그아웃 후에도 사용자를 world에 머물게 하는 핵심입니다.
    """
    session_id = request.cookies.get("session_user_id")
    local_memory = request.cookies.get("temp_birth_date")
    return session_id is not None or local_memory is not None

@app.get("/")
def entry(request: Request):
    # 기억이 있다면 Genesis(entry.html) 대신 Nigredo로 가이드
    if has_soul(request):
        return RedirectResponse(url="/world/nigredo")
    
    log_prima_materia_visit(request)
    
    # 🚀 [핵심 수정]: 없는 파일(mobile/entry.html) 대신, 우리가 만든 진짜 모바일 첫 화면으로 연결!
    if is_mobile(request):
        return templates.TemplateResponse("mobile/genesis/templates/index.html", {"request": request})
    
    # 💻 [PC 분기]: 기존 PC용 entry.html 렌더링
    return templates.TemplateResponse("entry.html", {"request": request})

@app.get("/login")
def login_page(request: Request):
    if request.cookies.get("session_user_id"):
        return RedirectResponse(url="/world/nigredo")
        
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/login.html", {"request": request})
        
    return templates.TemplateResponse("world/shell/login.html", {"request": request})


@app.get("/prima-materia")
def prima_materia(request: Request):
    if has_soul(request):
        return RedirectResponse(url="/world/nigredo")
    
    log_prima_materia_visit(request)        
    
    # 📱 [모바일 분기]
    if is_mobile(request):
        return templates.TemplateResponse("mobile/genesis/templates/index.html", {"request": request})
        
    # 💻 [PC 분기]
    return templates.TemplateResponse("genesis/templates/index.html", {"request": request})

@app.get("/form/me")
def form_me(request: Request):
    has_date = request.cookies.get("temp_birth_date")
    has_location = request.cookies.get("temp_location")
    is_location_valid = has_location and has_location.strip().lower() != "unknown"

    if has_date and is_location_valid:
        return RedirectResponse(url="/world/nigredo")
    
    # 📱 [모바일 분기]
    if is_mobile(request):
        return templates.TemplateResponse("mobile/genesis/templates/form_me.html", {"request": request})
        
    # 💻 [PC 분기]
    return templates.TemplateResponse("genesis/templates/form_me.html", {"request": request})

@app.get("/world")
def world_hub():
    return RedirectResponse("/world/nigredo")

@app.get("/favicon.ico", include_in_schema=False)
async def favicon(request: Request):
    target = os.path.join(STATIC_PATH, "world/shell/favicon.ico")
    if os.path.exists(target):
        return FileResponse(target)
    return Response(status_code=204)

@app.get("/world/nigredo/akashic")
async def akashic_records_view(request: Request):
    # 🛡️ 관리자 권한(God Token) 체크
    if not request.cookies.get("god_token"):
        # 토큰 없으면 Nigredo 메인으로 튕겨냄
        return RedirectResponse(url="/world/nigredo?auth=required")
        
    # 🚀 규격에 맞는 파일 경로: ui/world/nigredo/modules/akashic.html
    return templates.TemplateResponse("world/nigredo/modules/akashic.html", {
        "request": request,
        "stage": "nigredo",
        "module_id": "akashic"
    })

@app.get("/world/panopticon")
async def panopticon_view(request: Request):
    # 보안 결계: pano_token 쿠키가 있어야만 진입 가능
    if not request.cookies.get("pano_token"):
        return RedirectResponse(url="/world/anamnesis")
        
    return templates.TemplateResponse("world/shell/panopticon.html", {
        "request": request,
        "stage": "panopticon"
    })