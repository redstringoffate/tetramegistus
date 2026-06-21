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
from starlette.concurrency import run_in_threadpool

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
def _verify_soul_db(email):
    """동기 DB 작업을 비동기 루프에서 분리하기 위한 헬퍼 함수"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    finally:
        conn.close()

@app.middleware("http")
async def enforce_purge_logout(request: Request, call_next):
    path = request.url.path
    if path.startswith("/static") or path.startswith("/favicon"):
        return await call_next(request)

    raw_cookie = request.cookies.get("session_user_id")
    if raw_cookie:
        session_email = urllib.parse.unquote(raw_cookie.replace('"', '').strip())
        current_time = time.time()
        
        if session_email not in _VALID_SOULS_CACHE or (current_time - _VALID_SOULS_CACHE[session_email] > 300):
            try:
                # 🚀 서버 심장(Event Loop)이 멈추지 않도록 별도 스레드에서 DB 조회
                user = await run_in_threadpool(_verify_soul_db, session_email)

                if user:
                    _VALID_SOULS_CACHE[session_email] = current_time 
                else:
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
    
    # 🚀 [Routes 심화 수복]: 1. 카톡/광고 URL 파라미터 우선 2. HTTP Referer 후순위
    q_ref = request.query_params.get("ref") or request.query_params.get("utm_source")
    h_ref = request.headers.get("referer", "")
    final_ref = q_ref if q_ref else h_ref
        
    if not final_ref or "tetramegistus.com" in final_ref or "prima-materia.net" in final_ref:
        final_ref = "direct"
        
    response.set_cookie(key="pano_referrer", value=final_ref, max_age=31536000, path="/")
    return response

@app.middleware("http")
async def anti_retrograde_gate(request: Request, call_next):
    path = request.url.path
    host = request.headers.get("host", "").lower()
    
    if path.startswith("/static") or path.startswith("/favicon.ico"):
        return await call_next(request)

    # 🚀 [www 서브도메인 완전 수복 결계]
    if host.startswith("www."):
        naked_host = host[4:]
        query_string = request.url.query
        target_url = f"https://{naked_host}{path}"
        if query_string:
            target_url += f"?{query_string}"
        return RedirectResponse(url=target_url)

    # 🚨 [좀비 쿠키 엑소시즘]: prima-materia.net으로 튕겨왔을 때 잔존 쿠키 완전 암살
    if "prima-materia" in host:
        # 1. 환생(Reincarnate) 신호 시: 모든 기억 소각
        if request.query_params.get("purge") == "true":
            response = RedirectResponse(url="https://prima-materia.net")
            for c in ["session_user_id", "temp_birth_date", "temp_birth_time", "temp_location", "extra_seeds"]:
                response.delete_cookie(key=c, path="/", domain="prima-materia.net")
                response.delete_cookie(key=c, path="/", domain=".prima-materia.net")
                response.delete_cookie(key=c, path="/")
            return response
        
        # 2. 로그아웃(Logout) 신호 시: 로그인 세션만 정밀 타격하여 암살
        if request.query_params.get("logout") == "true":
            response = RedirectResponse(url="https://prima-materia.net")
            response.delete_cookie(key="session_user_id", path="/", domain="prima-materia.net")
            response.delete_cookie(key="session_user_id", path="/", domain=".prima-materia.net")
            response.delete_cookie(key="session_user_id", path="/")
            return response

    # ... (기존의 query_params 및 has_sync_params 로직 이하 그대로 유지) ...
    query_params = request.query_params
    has_sync_params = any(k in query_params for k in ["_s_id", "_t_b", "_t_l", "_p_s", "_p_r"])

    if "tetramegistus" in host and has_sync_params:
        # 🚀 [Safari ITP 격파]: 302 리다이렉트 쿠키 암살을 막기 위해 브릿지 HTML을 렌더링합니다.
        html_content = f"""
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"></head><body style="background:#000;">
        <script>
            const params = new URLSearchParams(window.location.search);
            
            // 🚀 [이중 인코딩 격파]: 파이썬이 넘겨준 쿠키 문자열의 포장을 한 번 더 벗겨냅니다.
            const dec = (val) => val ? decodeURIComponent(val) : "";
            const setC = (k, v) => document.cookie = k + "=" + encodeURIComponent(v) + "; path=/; max-age=31536000;";
            
            if (params.get('_s_id')) setC('session_user_id', dec(params.get('_s_id')));
            if (params.get('_t_b')) setC('temp_birth_date', dec(params.get('_t_b')));
            if (params.get('_t_l')) setC('temp_location', dec(params.get('_t_l')));
            if (params.get('_t_t')) setC('temp_birth_time', dec(params.get('_t_t')));
            if (params.get('_t_lat')) setC('temp_lat', dec(params.get('_t_lat')));
            if (params.get('_t_lng')) setC('temp_lng', dec(params.get('_t_lng')));
            if (params.get('_t_tz')) setC('temp_tz', dec(params.get('_t_tz')));
            
            if (params.get('_p_s')) setC('pano_session', params.get('_p_s'));
            if (params.get('_p_r')) setC('pano_referrer', params.get('_p_r'));
            if (params.get('_p_tz')) setC('pano_tz', params.get('_p_tz'));

            // n1.js가 헤매지 않도록 디코딩된 깨끗한 데이터를 로컬 스토리지에 안착
            if (params.get('_t_b')) {{
                const me = {{
                    id: 0, idx: 0, name: "[me]",
                    birth_date: dec(params.get('_t_b')),
                    birth_time: dec(params.get('_t_t')) || "00:00:00",
                    location: dec(params.get('_t_l')) || "Unknown",
                    lat: parseFloat(dec(params.get('_t_lat'))) || 0,
                    lng: parseFloat(dec(params.get('_t_lng'))) || 0,
                    timezone: dec(params.get('_t_tz')) || "9.0",
                    is_unknown_time: 0, has_body: 1, is_seed: 1
                }};
                localStorage.setItem('tetramegistus.me', JSON.stringify(me));
            }}
            
            window.location.replace("{path}");
        </script>
        </body></html>
        """
        from fastapi.responses import HTMLResponse
        return HTMLResponse(content=html_content)

    session_id = request.cookies.get("session_user_id")
    local_memory = request.cookies.get("temp_birth_date")
    local_loc = request.cookies.get("temp_location")
    has_soul = session_id is not None or local_memory is not None

    if path.startswith("/world"):
        # 🚀 [Rubedo 이론 보관소 개방 결계]: R1, R2(Rubedo)로 들어오는 자만 예외로 통과시킵니다.
        is_public_archive = path.startswith("/world/rubedo")
        
        # 🚀 [타 스테이지 추방]: 영혼이 없는데 Rubedo가 아닌 곳(I, II, III 탭)을 찌르면 대문으로 강제 사출!
        if not has_soul and not is_public_archive:
            response = RedirectResponse(url="https://prima-materia.net")
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response
            
        elif "tetramegistus" not in host:
            from urllib.parse import urlencode
            sync_data = {}
            if session_id: sync_data["_s_id"] = session_id
            if local_memory: sync_data["_t_b"] = local_memory
            if local_loc: sync_data["_t_l"] = local_loc
            
            # 🚀 잃어버린 좌표와 시간 파라미터 확실하게 적재
            if request.cookies.get("temp_birth_time"): sync_data["_t_t"] = request.cookies.get("temp_birth_time")
            if request.cookies.get("temp_lat"): sync_data["_t_lat"] = request.cookies.get("temp_lat")
            if request.cookies.get("temp_lng"): sync_data["_t_lng"] = request.cookies.get("temp_lng")
            if request.cookies.get("temp_tz"): sync_data["_t_tz"] = request.cookies.get("temp_tz")
            
            if request.cookies.get("pano_session"): sync_data["_p_s"] = request.cookies.get("pano_session")
            if request.cookies.get("pano_referrer"): sync_data["_p_r"] = request.cookies.get("pano_referrer")
            if request.cookies.get("pano_tz"): sync_data["_p_tz"] = request.cookies.get("pano_tz")
            
            query_str = urlencode(sync_data)
            target_url = f"https://tetramegistus.com{path}"
            if query_str: target_url += f"?{query_str}"
            return RedirectResponse(url=target_url)

    if (path == "/" or path == "/prima-materia") and has_soul:
        if "tetramegistus" not in host:
            from urllib.parse import urlencode
            sync_data = {}
            if session_id: sync_data["_s_id"] = session_id
            if local_memory: sync_data["_t_b"] = local_memory
            if local_loc: sync_data["_t_l"] = local_loc
            
            # 🚀 [추가] 잃어버린 시간과 좌표 밀수출
            if request.cookies.get("temp_birth_time"): sync_data["_t_t"] = request.cookies.get("temp_birth_time")
            if request.cookies.get("temp_lat"): sync_data["_t_lat"] = request.cookies.get("temp_lat")
            if request.cookies.get("temp_lng"): sync_data["_t_lng"] = request.cookies.get("temp_lng")
            if request.cookies.get("temp_tz"): sync_data["_t_tz"] = request.cookies.get("temp_tz")
            if request.cookies.get("temp_birth"): sync_data["_t_full"] = request.cookies.get("temp_birth")
            
            query_str = urlencode(sync_data)
            target_url = "https://tetramegistus.com/world/nigredo"
            if query_str: target_url += f"?{query_str}"
            return RedirectResponse(url=target_url)
        else:
            return RedirectResponse(url="https://tetramegistus.com/world/nigredo")
        
    response = await call_next(request)
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

# 🚀 [Terra 수복]: 프론트에서 넘어온 타임존을 국가명으로 정밀 번역합니다.
def get_country_from_tz(tz_str):
    if not tz_str: return "Other"
    tz = tz_str.lower()
    if "seoul" in tz: return "South Korea"
    if "america" in tz or "us/" in tz: return "United States"
    if "tokyo" in tz: return "Japan"
    if "shanghai" in tz or "chongqing" in tz: return "China"
    if "london" in tz: return "United Kingdom"
    if "paris" in tz: return "France"
    if "berlin" in tz: return "Germany"
    if "india" in tz or "calcutta" in tz: return "India"
    if "sydney" in tz or "melbourne" in tz: return "Australia"
    if "toronto" in tz or "vancouver" in tz: return "Canada"
    return "Other"

@app.post("/api/godmode/pulse")
def panopticon_pulse(request: Request, data: dict):
    """프론트엔드에서 모듈을 벗어날 때 체류 시간과 방문 기록을 던져주는 API"""
    session_user_id = request.cookies.get("session_user_id")
    pano_session = getattr(request.state, "pano_session", request.cookies.get("pano_session"))
    
    if not pano_session:
        return JSONResponse(content={"status": "ignored"})
        
    is_anima = 1 if session_user_id else 0
    module_name = data.get("module", "UNKNOWN")
    duration = data.get("duration", 0) 
    
    # 🚀 Cloudflare 헤더 혹은 쿠키에서 국가/referrer 추출 (중복 로직 통합)
    country = request.headers.get("cf-ipcountry", get_country_from_tz(request.cookies.get("pano_tz", "Other")))
    referrer = request.cookies.get("pano_referrer", "direct")
    
    conn = get_pano_db()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO traffic_logs (session_id, user_id, is_anima, module, duration, country, referrer) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (pano_session, session_user_id, is_anima, module_name, duration, country, referrer)
        )
        conn.commit()
        cursor.close()
    finally:
        conn.close() # 🔥 에러가 나도 무조건 닫아서 서버 굳음(무한 로딩) 완벽 차단
        
    return JSONResponse(content={"status": "recorded"})

def log_prima_materia_visit(request: Request):
    """🚀 [수복]: Prima Materia 전용 백엔드 직접 트래킹 함수"""
    pano_session = getattr(request.state, "pano_session", request.cookies.get("pano_session"))
    session_user_id = request.cookies.get("session_user_id")
    is_anima = 1 if session_user_id else 0

    if pano_session:
        try:
            country = request.headers.get("cf-ipcountry", "Other")
            referrer = request.cookies.get("pano_referrer", request.headers.get("referer", "direct"))
            
            conn = get_pano_db()
            try:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO traffic_logs (session_id, user_id, is_anima, module, duration, country, referrer) VALUES (%s, %s, %s, 'PRIMA_MATERIA', 0, %s, %s)",
                    (pano_session, session_user_id, is_anima, country, referrer)
                )
                conn.commit()
                cursor.close()
            finally:
                conn.close() # 🔥 여기도 무조건 DB 닫기
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

@app.get("/features")
def features_page(request: Request):
    # 📱 [모바일 분기] 모바일 접속이면 모바일 템플릿 서빙
    if is_mobile(request):
        return templates.TemplateResponse("mobile/genesis/templates/features.html", {"request": request})
        
    # 💻 [PC 분기] PC 접속이면 기본 템플릿 서빙
    return templates.TemplateResponse("genesis/templates/features.html", {"request": request})

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

import base64
from fastapi.responses import Response, FileResponse

# 🚀 [무한 로딩 파괴 & 칠흑 아이콘]: 완벽한 규격의 '검은 사각형' SVG
BLACK_VOID_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="#000000"/></svg>"""

@app.get("/favicon.ico", include_in_schema=False)
async def favicon(request: Request):
    host = request.headers.get("host", "").lower()
    referer = request.headers.get("referer", "").lower()
    
    # 🚀 [완벽 분리 결계]: prima-materia 도메인이거나, tetramegistus 도메인의 대문 구역인 경우
    if "prima-materia" in host or "form/me" in referer or "login" in referer or request.url.path in ["/", "/form/me"]:
        # 브라우저에게 정상적인(Status 200) '검은색 이미지'를 주어 삥글이 로딩을 즉시 끝냅니다.
        return Response(content=BLACK_VOID_SVG, media_type="image/svg+xml")
        
    # 오직 /world 내부(엔진)에서 요청했을 때만 T 아이콘을 내려줍니다.
    target = os.path.join(STATIC_PATH, "world/shell/favicon.ico")
    if os.path.exists(target):
        return FileResponse(target)
        
    return Response(content=BLACK_VOID_SVG, media_type="image/svg+xml")

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

from fastapi.responses import Response

# app/main.py 최하단 장부 함수들 수정

@app.get("/robots.txt", include_in_schema=False)
def get_robots_txt(request: Request):
    host = request.headers.get("host", "").lower()
    
    # 1. 대문(Prima Materia)의 로봇 규약
    if "prima-materia" in host:
        content = """User-agent: *
Allow: /
Sitemap: https://prima-materia.net/sitemap.xml
"""
    # 2. 본진(Tetramegistus)의 로봇 규약
    else:
        content = """User-agent: *
Allow: /
Allow: /login
Allow: /form/me
Allow: /features
Disallow: /api/godmode/
Sitemap: https://tetramegistus.com/sitemap.xml
"""
    return Response(content=content, media_type="text/plain")

@app.get("/sitemap.xml", include_in_schema=False)
def get_sitemap_xml(request: Request):
    host = request.headers.get("host", "").lower()

    # 1. 구글봇이 대문(Prima Materia)으로 접속했을 때 주는 명부
    if "prima-materia" in host:
        content = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://prima-materia.net/</loc>
        <lastmod>2026-06-04</lastmod>
        <changefreq>monthly</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>
"""
        return Response(content=content, media_type="application/xml")

    # 2. 구글봇이 본진(Tetramegistus)으로 접속했을 때 주는 명부
    content = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://tetramegistus.com/features</loc>
        <lastmod>2026-06-04</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>https://tetramegistus.com/login</loc>
        <lastmod>2026-06-04</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://tetramegistus.com/form/me</loc>
        <lastmod>2026-06-04</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>
"""
    return Response(content=content, media_type="application/xml")

# 🚀 [www & Googlebot 소프트 404 철통 방어 결계]
@app.get("/sitemap.xml/", include_in_schema=False)
def get_sitemap_xml_trailing_slash(request: Request):
    return get_sitemap_xml(request)