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

# main.py의 load_dotenv(env_path) 바로 아랫줄에 추가
db_url = os.environ.get("DATABASE_URL", "")
if db_url.startswith("postgres://"):
    os.environ["DATABASE_URL"] = db_url.replace("postgres://", "postgresql://", 1)

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

import time

# 🪐 [세션 캐시] 매번 DB를 찌르는 병목을 막기 위한 인메모리 저장소
_VALID_SOULS_CACHE = {}

# ==========================================
# 💀 [Ghost Exorcism] 삭제된 유저 강제 로그아웃 (Guest 강등) - 최적화 버전
# ==========================================
@app.middleware("http")
async def enforce_purge_logout(request: Request, call_next):
    path = request.url.path
    if path.startswith("/static") or path.startswith("/favicon"):
        return await call_next(request)

    raw_cookie = request.cookies.get("session_user_id")
    if raw_cookie:
        session_email = urllib.parse.unquote(raw_cookie.replace('"', '').strip())
        
        current_time = time.time()
        
        # 🚀 1. 캐시 확인: 최근 5분(300초) 이내에 확인된 유저면 DB 쿼리 완전 스킵 (0ms)
        if session_email not in _VALID_SOULS_CACHE or (current_time - _VALID_SOULS_CACHE[session_email] > 300):
            try:
                # 🚀 2. 캐시가 없거나 만료되었을 때만 딱 1번 DB에 물어봄
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM users WHERE email = %s", (session_email,))
                user = cursor.fetchone()
                conn.close()

                if user:
                    _VALID_SOULS_CACHE[session_email] = current_time # 유효 영혼 캐싱
                else:
                    # DB에서 삭제된 유저 처리 (기존 로직)
                    if path.startswith("/api/"):
                        response = JSONResponse(
                            status_code=401, 
                            content={"status": "error", "message": "Soul has been returned to the void."}
                        )
                        response.delete_cookie("session_user_id", path="/")
                        return response
                    else:
                        purge_html = f"""
                        <!DOCTYPE html>
                        <html>
                        <head><meta charset="utf-8"></head>
                        <body style="background:#000;">
                            <script>
                                document.cookie = "session_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                                alert("Your soul has been returned to the Void. Reverting to Guest mode.");
                                window.location.href = "{path}"; 
                            </script>
                        </body>
                        </html>
                        """
                        response = HTMLResponse(content=purge_html)
                        response.delete_cookie("session_user_id", path="/")
                        return response
            except Exception as e:
                print(f"[AUTH DB ERROR]: {e}")
                # DB 장애 시 튕겨내지 않고 통과 (캐싱은 안함)

    return await call_next(request)

# ─────────────────────────────
# 👁️ 파놉티콘의 눈 (Global Session Middleware)
# ─────────────────────────────
@app.middleware("http")
async def panopticon_tracker(request: Request, call_next):
    """사이트에 들어오는 모든 영혼에게 관측용 식별표를 부여합니다."""
    response = await call_next(request)
    
    if "pano_session" in request.cookies or request.url.path.startswith("/static"):
        return response
        
    pano_session = str(uuid.uuid4())
    response.set_cookie(key="pano_session", value=pano_session, max_age=31536000, path="/")
    
    # 🚀 [Routes 수복]: 영혼이 처음 접속할 때 타고 들어온 외부 포털 주소를 박제합니다.
    ref = request.headers.get("referer", "direct")
    if "tetramegistus.com" in ref or "prima-materia.net" in ref:
        ref = "direct"
        
    response.set_cookie(key="pano_referrer", value=ref, max_age=31536000, path="/")
    return response

# ─────────────────────────────
# 🛡️ [최종 수복]: 크로스 도메인 영혼 동기화 및 역행 방지 결계
# ─────────────────────────────
@app.middleware("http")
async def anti_retrograde_gate(request: Request, call_next):
    path = request.url.path
    host = request.headers.get("host", "").lower()
    
    # 1. 정적 파일 및 파비콘은 보안 결계 대상에서 완전 제외
    if path.startswith("/static") or path.startswith("/favicon.ico"):
        return await call_next(request)

    # 🚀 [밀수 레이어 A]: 타 도메인에서 넘어오는 영혼 동기화 파라미터 감지
    query_params = request.query_params
    has_sync_params = any(k in query_params for k in ["_s_id", "_t_b", "_t_l"])

    # 🪐 [테트라메기스투스 본진] 진입 시 도메인 장벽을 깨고 쿠키를 강제 이식합니다.
    if "tetramegistus" in host and has_sync_params:
        # 주소창 뒤의 지저분한 파라미터들을 흔적 없이 세탁한 깨끗한 본진 주소로 리다이렉트
        response = RedirectResponse(url=f"https://tetramegistus.com{path}")
        
        # 넘어온 데이터들을 테트라메기스투스 도메인의 정식 쿠키로 복제 정착
        if "_s_id" in query_params:
            response.set_cookie(key="session_user_id", value=query_params["_s_id"], max_age=31536000, path="/")
        if "_t_b" in query_params:
            response.set_cookie(key="temp_birth_date", value=query_params["_t_b"], max_age=31536000, path="/")
        if "_t_l" in query_params:
            response.set_cookie(key="temp_location", value=query_params["_t_l"], max_age=31536000, path="/")
        return response

    # 2. 현재 도메인 기준의 영혼 존재 여부 판별
    session_id = request.cookies.get("session_user_id")
    local_memory = request.cookies.get("temp_birth_date")
    local_loc = request.cookies.get("temp_location")
    has_soul = session_id is not None or local_memory is not None

    # 🚨 [결계 1]: 심층 월드(/world) 제어 구역 처리
    if path.startswith("/world"):
        if not has_soul:
            # 영혼이 아예 없다면 소개 사이트의 루트 관문으로 완전 추방
            response = RedirectResponse(url="https://prima-materia.net")
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response
        elif "tetramegistus" not in host:
            # 🚀 [밀수 레이어 B]: 관문 도메인에 생성된 영혼을 본진 도메인으로 안전하게 포워딩
            from urllib.parse import urlencode
            sync_data = {}
            if session_id: sync_data["_s_id"] = session_id
            if local_memory: sync_data["_t_b"] = local_memory
            if local_loc: sync_data["_t_l"] = local_loc
            
            query_str = urlencode(sync_data)
            target_url = f"https://tetramegistus.com{path}"
            if query_str:
                target_url += f"?{query_str}"
            return RedirectResponse(url=target_url)

    # 🚨 [결계 2]: 기억이 충만한 영혼이 관문(/) 주소로 기웃거릴 때 본진으로 강제 텔레포트
    if (path == "/" or path == "/prima-materia") and has_soul:
        if "tetramegistus" not in host:
            from urllib.parse import urlencode
            sync_data = {}
            if session_id: sync_data["_s_id"] = session_id
            if local_memory: sync_data["_t_b"] = local_memory
            if local_loc: sync_data["_t_l"] = local_loc
            
            query_str = urlencode(sync_data)
            target_url = "https://tetramegistus.com/world/nigredo"
            if query_str:
                target_url += f"?{query_str}"
            return RedirectResponse(url=target_url)
        else:
            return RedirectResponse(url="https://tetramegistus.com/world/nigredo")
        
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
    
    # 🚀 [Terra / Routes 핵심 수복]: Cloudflare 헤더 및 쿠키에서 실제 데이터를 추출합니다.
    country = request.headers.get("cf-ipcountry", "Other")
    referrer = request.cookies.get("pano_referrer", "direct")
    
    conn = get_pano_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO traffic_logs (session_id, user_id, is_anima, module, duration, country, referrer) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (pano_session, session_user_id, is_anima, module_name, duration, country, referrer)
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
            # 🚀 [Terra / Routes 핵심 수복]
            country = request.headers.get("cf-ipcountry", "Other")
            referrer = request.cookies.get("pano_referrer", request.headers.get("referer", "direct"))
            
            conn = get_pano_db()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO traffic_logs (session_id, user_id, is_anima, module, duration, country, referrer) VALUES (%s, %s, %s, 'PRIMA_MATERIA', 0, %s, %s)",
                (pano_session, session_user_id, is_anima, country, referrer)
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
    host = request.headers.get("host", "").lower()

    # 1. 엔진(tetramegistus.com)으로 직접 접속한 경우 -> 바로 내부로 진입
    if "tetramegistus" in host:
        return RedirectResponse(url="/world/nigredo")

    # 2. 소개 페이지(prima-materia.net)로 접속했는데 이미 기억(Soul)이 있는 경우
    if has_soul(request):
        return RedirectResponse(url="https://tetramegistus.com/world/nigredo")
    
    # 3. 아무것도 모르는 뉴비가 소개 페이지(prima-materia.net)로 들어온 경우
    log_prima_materia_visit(request)
    
    # 📱 [모바일 분기]
    if is_mobile(request):
        return templates.TemplateResponse("mobile/genesis/templates/index.html", {"request": request})
    
    # 💻 [PC 분기] - 스크린샷에 나온 올바른 템플릿 명으로 매칭하여 결계를 완성합니다.
    return templates.TemplateResponse("genesis/templates/index.html", {"request": request})

@app.get("/login")
def login_page(request: Request):
    if request.cookies.get("session_user_id"):
        return RedirectResponse(url="/world/nigredo")
        
    if is_mobile(request):
        return templates.TemplateResponse("mobile/world/shell/login.html", {"request": request})
        
    return templates.TemplateResponse("world/shell/login.html", {"request": request})


@app.get("/prima-materia")
def prima_materia(request: Request):
    # 🚀 뒤에 /prima-materia 라는 지저분한 접미사를 남기지 않고, 
    # 깨끗한 독립 도메인 주소로 영혼을 리다이렉트하여 정화합니다.
    return RedirectResponse(url="https://prima-materia.net")

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