# app/gate/transitions.py

from fastapi import APIRouter, Request, HTTPException, Response
from fastapi.responses import JSONResponse, HTMLResponse
from pathlib import Path
import urllib.parse
import json
import psycopg2
from psycopg2.extras import RealDictCursor

# 🔑 [v26 수복]: DB_PATH 소각, get_db 소환 
from core.database import get_db
from core.auth.master_keys import generate_new_code
from core.storage.local import save_me, delete_me

router = APIRouter()

BASE_DIR = Path(__file__).parent
RITUAL_HTML = BASE_DIR / "ritual.html"
RITUAL_JS = BASE_DIR / "ritual.js"

# 🔑 [Unified Cleaner]: 쿠키 오염(따옴표) 제거 로직 
def get_clean_cookie(request: Request, name: str):
    val = request.cookies.get(name)
    if not val: return None
    return val.replace('"', '').strip()

@router.get("/gate/ritual.html")
def ritual_page():
    return HTMLResponse(RITUAL_HTML.read_text(encoding="utf-8")) # 

@router.get("/gate/ritual.js")
def ritual_js():
    return Response(
        RITUAL_JS.read_text(encoding="utf-8"),
        media_type="application/javascript"
    ) # 

@router.post("/gate/recovery")
async def recovery(request: Request, response: Response):
    """
    🔑 [RITUAL]: 로컬 데이터의 완전한 파괴 및 서버 기억 강림
    16자리 코드를 통해 전생의 기억을 서버로 불러오며, 단순한 복구가 아닌 로컬 잔재의 전면적인 파괴를 집행합니다.
    """
    data = await request.json() # 
    input_code = data.get("code", "").strip() # 

    if not input_code or len(input_code) != 16:
        raise HTTPException(status_code=400, detail="A valid 16-digit code is required.") # 

    formatted_code = "-".join([input_code[i:i+4] for i in range(0, 16, 4)]) # 
    
    # 🚀 [PostgreSQL 연결 및 커서 생성]
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # SQLite의 '?' 기호를 PostgreSQL의 '%s'로 치환 
        cursor.execute("SELECT * FROM users WHERE master_key = %s", (formatted_code,))
        user = cursor.fetchone()
        
        if user:
            email = user["email"]
            
            # 1. 🔑 [The Great Migration & Destruction]: 브라우저의 기억 수거 후 소각
            raw_date = get_clean_cookie(request, "temp_birth_date") # 
            raw_time = get_clean_cookie(request, "temp_birth_time") # 
            raw_loc = get_clean_cookie(request, "temp_location") # 

            if raw_date:
                clean_date = urllib.parse.unquote(raw_date) # 
                clean_time = urllib.parse.unquote(raw_time or "12:00:00") # 
                clean_loc = urllib.parse.unquote(raw_loc or "Unknown") # 
                
                # PostgreSQL 대응: ON CONFLICT를 피하고 명시적인 덮어쓰기 로직으로 안정성 강화
                cursor.execute("SELECT id FROM natal_charts WHERE user_id = %s AND name = '[me]'", (email,))
                existing_me = cursor.fetchone()

                if existing_me:
                    cursor.execute("""
                        UPDATE natal_charts 
                        SET birth_date = %s, birth_time = %s, location = %s 
                        WHERE id = %s
                    """, (clean_date, clean_time, clean_loc, existing_me["id"]))
                else:
                    cursor.execute("""
                        INSERT INTO natal_charts (user_id, name, birth_date, birth_time, location, is_seed)
                        VALUES (%s, '[me]', %s, %s, %s, 1)
                    """, (email, clean_date, clean_time, clean_loc))

            conn.commit()

            # 🚨 [의식의 핵심]: 서버 기억 덮어쓰기 직후 남은 로컬 쓰레기(extra_seeds)를 강제 파쇄합니다.
            response.delete_cookie(key="extra_seeds", path="/")

            # 2. 🔑 [Identity Anchor]: 창조자 네이털 각인 
            response.set_cookie(key="temp_birth_date", value="1992-06-01", max_age=2592000, path="/") # 
            response.set_cookie(key="temp_birth_time", value="09:30:00", max_age=2592000, path="/") # 
            response.set_cookie(key="temp_location", value="Seoul", max_age=2592000, path="/") # 

            new_key = generate_new_code() # 
            # SQLite의 '?' 기호를 PostgreSQL의 '%s'로 치환 
            cursor.execute("UPDATE users SET master_key = %s WHERE id = %s", (new_key, user["id"]))
            conn.commit()
            
            # 3. 🔑 [Session Authority]: 세션 부여 
            response.set_cookie(key="session_user_id", value=email, max_age=2592000, path="/", httponly=False, samesite="lax") # 
            
            save_me({
                "id": user["id"], "email": email, "role": user["role"], 
                "birth": user["birth"], "location": user["location"]
            }) # 

            return {"ok": True, "type": "ADMIN" if user["role"] == "ADAM" else "USER"} # 
        else:
            raise HTTPException(status_code=403, detail="Invalid master key.") # 
    finally:
        cursor.close()
        conn.close()

@router.post("/gate/logout")
async def logout(request: Request, response: Response):
    """
    🔑 [HARD SOFT LOGOUT]: 로그아웃 직전 서버의 기억을 로컬 쿠키로 강제 환원 
    """
    session_user_id = get_clean_cookie(request, "session_user_id") # 
    
    if session_user_id:
        try:
            conn = get_db()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(%s)", (session_user_id,))
            user = cursor.fetchone()
            
            if user and user["birth"]:
                birth_parts = user["birth"].split(" ") # 
                response.set_cookie(key="temp_birth_date", value=birth_parts[0], max_age=2592000, path="/") # 
                response.set_cookie(key="temp_birth_time", value=birth_parts[1] if len(birth_parts)>1 else "12:00:00", max_age=2592000, path="/") # 
                response.set_cookie(key="temp_location", value=urllib.parse.quote(user["location"]), max_age=2592000, path="/") # 
            cursor.close()
            conn.close()
        except Exception: 
            pass

    delete_me() # 
    response.delete_cookie(key="session_user_id", path="/") # 
    return {"ok": True, "message": "Session ended. Memory restored to vessel."} # 

@router.post("/gate/reincarnate")
def reincarnate(response: Response):
    """🔑 REINCARNATE: 완전한 파쇄 및 태초 회귀 (백엔드 철통 도살 배지 주입)"""
    # 1. 서버 전역 영혼 인메모리 파괴
    delete_me()
    
    # 2. 브라우저에 잔존하는 모든 종류의 영혼 및 로컬 트래킹 식별표를 서버 권한으로 완전 소멸
    response.delete_cookie(key="session_user_id", path="/")
    response.delete_cookie(key="temp_birth_date", path="/")
    response.delete_cookie(key="temp_birth_time", path="/")
    response.delete_cookie(key="temp_location", path="/")
    response.delete_cookie(key="extra_seeds", path="/")
    
    # 파놉티콘 관측 식별표까지 전부 소각합니다.
    response.delete_cookie(key="pano_session", path="/")
    response.delete_cookie(key="pano_referrer", path="/")
    response.delete_cookie(key="pano_tz", path="/")
    
    # 3. 브라우저가 캐시 장부를 바탕으로 강제 정착하지 못하도록 철저히 무력화
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    return {"ok": True, "message": "The vessel is purged and returned to absolute emptiness."}