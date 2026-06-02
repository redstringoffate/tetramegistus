# app/api/auth.py

import secrets
import string
import psycopg2   # 🚀 [수복]: PostgreSQL 에러 처리용
from psycopg2.extras import RealDictCursor # 🚀 [수복]: dict 형태로 뼈대 변환
import urllib.parse
import json
import smtplib
import asyncio
import pyotp
import os

from fastapi import APIRouter, Form, UploadFile, File, HTTPException, Request, Response, BackgroundTasks, Form
from fastapi.responses import JSONResponse
from core.database import get_db
from core.auth.mailer import send_anamnesis_email, send_breach_alert_email, send_admin_login_success_email, send_inquiry_to_admin
from core.auth.master_keys import generate_new_code 
from typing import List, Optional
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import datetime, timedelta, timezone
from core.auth.mailer import send_resurrection_email

async def purge_unawakened_soul(email: str):
    """[THE PURGE]: 24시간 내 로그인하지 않은 이스터에그 영혼 소멸"""
    await asyncio.sleep(86400)
    conn = get_db()
    # 🚀 [수복]: RealDictCursor 사용
    cursor = conn.cursor(cursor_factory=RealDictCursor) 
    
    try:
        # 🚀 [수복]: cursor.execute와 %s 사용
        cursor.execute("SELECT is_active FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if user and int(user["is_active"]) == 0:
            cursor.execute("DELETE FROM users WHERE email = %s", (email,))
            cursor.execute("DELETE FROM natal_charts WHERE user_id = %s", (email,))
            conn.commit()
            print(f"💀 [THE PURGE]: Unawakened soul '{email}' eradicated.")
    except Exception as e:
        print(f"[PURGE ERROR]: {e}")
    finally:
        cursor.close()
        conn.close()

router = APIRouter(prefix="/api/auth", tags=["auth"])

verification_cache = {}

def get_clean_cookie(request: Request, name: str):
    val = request.cookies.get(name)
    if not val: return None
    clean_val = val.replace('"', '').strip()
    return urllib.parse.unquote(clean_val)

def generate_temp_password(length=8):
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))

@router.post("/login")
async def login(response: Response, background_tasks: BackgroundTasks, email: str = Form(...), password: str = Form(...)):
    email_lower = email.strip().lower()

    # 🔒 .env에서 기밀 이메일 호출
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").lower()
    ADMIN_FAKE_EMAIL = os.getenv("MAIL_SENDER", "").lower()

    # 🎭 1. 실제 어드민 이메일 보호 (페이크 노드 접근 차단)
    if email_lower == ADMIN_FAKE_EMAIL and ADMIN_FAKE_EMAIL:
        print(f"🎭 [SYSTEM ALERT]: Decoy breach attempt detected.")
        background_tasks.add_task(send_breach_alert_email, password)
        return {"status": "fail", "message": "Incorrect memory."}

    # --- 여기서부터 DB 검증 로직 시작 ---
    conn = get_db()
    # 🚀 [수복]: SQLite의 row_factory 대신 PostgreSQL의 RealDictCursor 사용
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # 🚀 [수복]: '?' 대신 '%s' 사용
    cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(%s)", (email_lower,))
    user = cursor.fetchone()
    
    # DB에 계정이 존재할 경우
    if user:
        if str(user["password"]) == str(password):
            is_hidden = (int(user["is_active"]) == 0)
            
            now_kst = datetime.now(timezone(timedelta(hours=9))).strftime('%Y-%m-%d %H:%M:%S')
            update_conn = get_db()
            update_cursor = update_conn.cursor()
            # 🚀 [수복]: 여기도 '?' 대신 '%s'
            update_cursor.execute("UPDATE users SET is_active = 1, last_login = %s WHERE email = %s", (now_kst, email_lower,))
            update_conn.commit()
            update_cursor.close()
            update_conn.close()

            if email_lower == ADMIN_EMAIL and ADMIN_EMAIL:
                print(f"✨ [SYSTEM INFO]: Prime Node accessed successfully.")
                background_tasks.add_task(send_admin_login_success_email)

            response.set_cookie(key="session_user_id", value=user["email"], max_age=2592000, path="/", httponly=False)
            if user["birth"]:
                birth_parts = user["birth"].split(" ")
                response.set_cookie(key="temp_birth_date", value=birth_parts[0], max_age=2592000, path="/")
                if len(birth_parts) > 1:
                    response.set_cookie(key="temp_birth_time", value=birth_parts[1], max_age=2592000, path="/")
                response.set_cookie(key="temp_location", value=urllib.parse.quote(user["location"]), max_age=2592000, path="/")
                
            cursor.close()
            conn.close()
            return {
                "status": "success",
                "message": "Memory restored.",
                "is_hidden_anamnesis": is_hidden
            }

            # 정상 세션/쿠키 발급
            # 🚀 [수복]: max_age=2592000 (30일) 추가
            response.set_cookie(key="session_user_id", value=user["email"], max_age=2592000, path="/", httponly=False)
            if user["birth"]:
                birth_parts = user["birth"].split(" ")
                response.set_cookie(key="temp_birth_date", value=birth_parts[0], max_age=2592000, path="/")
                if len(birth_parts) > 1:
                    response.set_cookie(key="temp_birth_time", value=birth_parts[1], max_age=2592000, path="/")
                response.set_cookie(key="temp_location", value=urllib.parse.quote(user["location"]), max_age=2592000, path="/")
                
            return {
                "status": "success",
                "message": "Memory restored.",
                "is_hidden_anamnesis": is_hidden # 🚀 프론트엔드로 전달
            }
            
        # 💀 비밀번호 불일치 (로그인 실패)
        else:
            if email_lower == ADMIN_EMAIL and ADMIN_EMAIL:
                print(f"💀 [SYSTEM ALERT]: Unauthorized breach attempt on Prime Node.")
                background_tasks.add_task(send_breach_alert_email, password)
                return {"status": "fail", "message": "admin account cannot be faltered"}
            return {"status": "fail", "message": "Incorrect memory."}
            
    # DB에 아예 계정이 존재하지 않는 경우 (회원가입 시퀀스)
    else:
        if email_lower == ADMIN_EMAIL and ADMIN_EMAIL:
            print(f"💀 [SYSTEM ALERT]: Manifestation attempt on missing Prime Node.")
            background_tasks.add_task(send_breach_alert_email, password)
            return {"status": "fail", "message": "admin account cannot be faltered"}

        # 일반 유저 미가입 시퀀스 (정상 가입 로직)
        verify_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
        verification_cache[email_lower] = {"code": verify_code, "password": password}
        background_tasks.add_task(send_anamnesis_email, email_lower, verify_code, mode="signup")
        return {"status": "anamnesis", "message": "Unknown soul. Verification initiated."}

# --- 2. VERIFY (The Great Migration - 인덱스 신뢰 및 이관 수복) ---
@router.post("/verify")
async def verify_anamnesis(
    request: Request, 
    response: Response, 
    email: str = Form(...), 
    code: str = Form(...),
    extra_seeds_json: str = Form("[]") 
):
    email = email.strip().lower()
    cache = verification_cache.get(email)
    
    if not cache or str(cache["code"]) != str(code):
        return {"status": "fail", "message": "Invalid or expired verification code."}

    # 1. 기초 데이터 수거
    temp_date = get_clean_cookie(request, "temp_birth_date")
    temp_location = get_clean_cookie(request, "temp_location") or "Unknown"
    temp_time = get_clean_cookie(request, "temp_birth_time") or "09:30:00"
    
    new_master_key = generate_new_code()
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # A. 유저 본체 생성 (🚀 %s 교체)
        now_kst = datetime.now(timezone(timedelta(hours=9))).strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("""
            INSERT INTO users (email, password, birth, location, master_key, is_active, last_login) 
            VALUES (%s, %s, %s, %s, %s, 1, %s)
        """, (email, cache["password"], f"{temp_date} {temp_time}", temp_location, new_master_key, now_kst))

        all_seeds = []
        try:
            extra_seeds = json.loads(extra_seeds_json)
            all_seeds = [s for s in extra_seeds if s.get('name') not in ['[me]', 'tetramegistus.me']]
        except:
            pass

        # ⚓ 0순위: [me] Anchor 각인 
        if temp_date:
            # 🚀 [수복]: INSERT OR REPLACE 대신, 깔끔하게 지우고 다시 쓰는 방식으로 호환성 확보
            cursor.execute("DELETE FROM natal_charts WHERE user_id = %s AND idx = 0", (email,))
            cursor.execute("""
                INSERT INTO natal_charts 
                (idx, user_id, name, birth_date, birth_time, location, is_seed, is_active)
                VALUES (0, %s, '[me]', %s, %s, %s, 1, 1)
            """, (email, temp_date, temp_time, temp_location))

        # 🔑 시드 각인
        for i, seed in enumerate(all_seeds):
            s_name = seed.get('name')
            s_date = seed.get('birth_date')
            s_idx = seed.get('idx') if seed.get('idx') is not None else (i + 1)
            raw_time = seed.get('birth_time') or "12:00:00"
            s_time = f"{raw_time}:00" if len(raw_time) == 5 else raw_time

            if s_name and s_date:
                # 🚀 [수복]: INSERT OR IGNORE 대신 PostgreSQL 표준인 ON CONFLICT DO NOTHING 사용
                cursor.execute("""
                    INSERT INTO natal_charts 
                    (idx, user_id, name, birth_date, birth_time, location, is_seed, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s, 1, 1)
                    ON CONFLICT DO NOTHING
                """, (s_idx, email, s_name.strip(), s_date, s_time, seed.get('location', 'Unknown')))

        conn.commit()

        response.set_cookie(key="session_user_id", value=email, max_age=2592000, path="/", httponly=False)
        if email in verification_cache: 
            del verification_cache[email]
            
        return {
            "status": "success", 
            "message": "Manifestation complete. Welcome.",
            "anamnesis_type": "normal" 
        }

    # 🚀 [수복]: sqlite3 에러를 psycopg2 에러로 교체!
    except psycopg2.IntegrityError:
        conn.rollback()
        return {"status": "fail", "message": "This email is already manifested."}
    except Exception as e:
        conn.rollback()
        return {"status": "fail", "message": f"Manifestation Error: {str(e)}"}
    finally:
        cursor.close()
        conn.close()

# --- 3. PASSWORD MANAGEMENT (Easter Egg: Forgotten Path) ---
@router.post("/forgot-password")
async def forgot_password(request: Request, background_tasks: BackgroundTasks, email: str = Form(...)):
    email = email.strip().lower()

    # 🔒 .env에서 기밀 이메일 호출
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").lower()
    ADMIN_FAKE_EMAIL = os.getenv("MAIL_SENDER", "").lower() # MAIL_SENDER 재활용

    # 🛡️ 1. 실제 어드민 보호 및 알림 전송 (이 부분에 추가)
    if email == ADMIN_EMAIL and ADMIN_EMAIL:
        print(f"💀 [SYSTEM ALERT]: Breach attempt on Prime Node via Forgot Password.")
        background_tasks.add_task(send_breach_alert_email, "PATH: Password Forgotten Protocol")
        return {"status": "fail", "message": "admin account cannot be faltered"}

    # 🎭 2. 페이크 계정 보호 (알림 형식 통일)
    if email == ADMIN_FAKE_EMAIL and ADMIN_FAKE_EMAIL:
        background_tasks.add_task(send_breach_alert_email, "PATH: Decoy Node Recovery Attempt")
        return {"status": "success", "message": "Temporary memory sent."}

    # --- 여기서부터 기존 로직 진행 ---
    temp_pw = generate_temp_password()
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    
    if user:
        # 기존 회원: 비번 교체
        cursor.execute("UPDATE users SET password = %s WHERE email = %s", (temp_pw, email))
        conn.commit()
        cursor.close()
        conn.close()
        background_tasks.add_task(send_anamnesis_email, email, temp_pw, mode="forgot")
        return {"status": "success", "message": "Temporary memory sent."}
    else:
        # 🔑 [이스터에그 수복]: 미가입 유저 즉시 생성 (v10 규격 준수)
        # 쿠키에서 현재 사용자의 기초 정보를 낚아챔
        temp_date = get_clean_cookie(request, "temp_birth_date") or "1992-06-01"
        temp_location = get_clean_cookie(request, "temp_location") or "Seoul"
        temp_time = get_clean_cookie(request, "temp_birth_time") or "09:30:00"
        new_master_key = generate_new_code()
        
        try:
            # 🚀 [수복]: cursor.execute와 %s
            cursor.execute("""
                INSERT INTO users (email, password, birth, location, master_key, is_active) 
                VALUES (%s, %s, %s, %s, %s, 0)
            """, (email, temp_pw, f"{temp_date} {temp_time}", temp_location, new_master_key))
            
            cursor.execute("""
                INSERT INTO natal_charts (idx, user_id, name, birth_date, birth_time, location, is_seed, is_active)
                VALUES (0, %s, '[me]', %s, %s, %s, 1, 1)
            """, (email, temp_date, temp_time, temp_location))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            background_tasks.add_task(send_anamnesis_email, email, temp_pw, mode="forgot")
            background_tasks.add_task(purge_unawakened_soul, email) 
            return {"status": "success", "message": "Temporary memory sent."}
        except Exception as e:
            conn.rollback()
            cursor.close()
            conn.close()
            return {"status": "fail", "message": f"Ritual failed: {str(e)}"}

# --- 4. MASTER BYPASS & RESET ---
@router.post("/master-bypass")
async def master_bypass(response: Response, master_key: str = Form(...)):
    master_key = master_key.strip()
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT * FROM users WHERE master_key = %s", (master_key,))
    user = cursor.fetchone()
    
    if user:
        new_key = generate_new_code()
        try:
            now_kst = datetime.now(timezone(timedelta(hours=9))).strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute("UPDATE users SET master_key = %s, last_login = %s WHERE id = %s", (new_key, now_kst, user["id"]))
            conn.commit()
            
            response.set_cookie(key="session_user_id", value=user["email"], max_age=2592000, path="/", httponly=False)
            return {"status": "success", "message": "Bypass successful."}
        finally:
            cursor.close()
            conn.close()
    else:
        cursor.close()
        conn.close()
        return {"status": "fail", "message": "Invalid master key."}

@router.post("/reset-password")
async def reset_password(request: Request, current_pw: str = Form(...), new_pw: str = Form(...)):
    user_id = get_clean_cookie(request, "session_user_id")
    if not user_id: raise HTTPException(status_code=401)
    
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM users WHERE email = %s", (user_id,))
    user = cursor.fetchone()
    
    if not user or str(user["password"]) != str(current_pw):
        cursor.close()
        conn.close()
        return {"status": "fail", "message": "Memory mismatch."}
    try:
        updated_master_key = generate_new_code()
        cursor.execute("UPDATE users SET password = %s, master_key = %s WHERE id = %s", (new_pw, updated_master_key, user["id"]))
        conn.commit()
        return {"status": "success", "message": "Password changed."}
    finally:
        cursor.close()
        conn.close()

@router.post("/send-inquiry")
async def handle_inquiry(
    category: str = Form(...),
    email: str = Form(...),
    content: str = Form(...),
    images: List[UploadFile] = File(default=[])
):
    # 🚀 핵심: 모든 문의는 무조건 SMTP 로그인 계정인 MAIL_SENDER 본인에게 쏜다!
    SENDER_EMAIL = os.getenv("MAIL_SENDER")
    
    msg = MIMEMultipart()
    msg["From"] = f"Tetramegistus System <{SENDER_EMAIL}>"
    msg["To"] = SENDER_EMAIL  # 🚀 수신자를 MAIL_SENDER(본진)로 고정
    msg["Reply-To"] = email    # 🚀 답장하면 유저에게 가도록 설정
    msg["Subject"] = f"[Inquiry - {category}] from {email}"

    # 본문 작성
    body = f"User Email: {email}\nCategory: {category}\n\n{content}"
    msg.attach(MIMEText(body, "plain"))
    
    # 이미지 첨부 (기존 로직 동일)
    for img in images:
        if img and img.filename:
            file_bytes = await img.read()
            part = MIMEApplication(file_bytes, Name=img.filename)
            part.add_header('Content-Disposition', 'attachment', filename=img.filename)
            msg.attach(part)
            
    # 발송
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(SENDER_EMAIL, os.getenv("MAIL_PASSWORD"))
            server.send_message(msg)
        return {"status": "success"}
    except Exception as e:
        print(f"Error: {e}")
        return {"status": "fail"}

# --- Global Resurrection State ---
# 이 변수가 서버 메모리에 상주하며 오늘 자정의 마스터 코드를 보관합니다.
DAILY_RESURRECTION_CODE = None 
ADMIN_TARGET = os.getenv("ADMIN_RECEIVER")
KST = timezone(timedelta(hours=9))

async def start_resurrection_protocol():
    """
    [RESURRECTION PROTOCOL]: 매일 자정 KST 기준 6자리 코드를 생성 및 발송합니다.
    """
    global DAILY_RESURRECTION_CODE
    
    # 🚀 [Initial Ritual]
    if DAILY_RESURRECTION_CODE is None:
        DAILY_RESURRECTION_CODE = "".join([str(secrets.randbelow(10)) for _ in range(6)])
        try:
            send_resurrection_email(ADMIN_TARGET, DAILY_RESURRECTION_CODE)
            print(f"[RESURRECTION]: Initial code {DAILY_RESURRECTION_CODE} manifested.")
        except Exception as e:
            print(f"[RESURRECTION ERROR]: Initial send failed: {e}")

    while True:
        now = datetime.now(KST)
        
        tomorrow = now + timedelta(days=1)
        next_midnight = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 0, 0, 0, tzinfo=KST)
        
        wait_seconds = (next_midnight - now).total_seconds()
        print(f"[RESURRECTION]: Next ritual scheduled in {wait_seconds:.0f}s")
        
        await asyncio.sleep(wait_seconds)
        
        # 🕯️ [Daily Ritual]: 자정 정각 코드 갱신
        DAILY_RESURRECTION_CODE = "".join([str(secrets.randbelow(10)) for _ in range(6)])
        
        # 🚀 [결계 수복]: 메일 발송이 실패하더라도 백그라운드 루프가 죽지 않도록 보호
        try:
            send_resurrection_email(ADMIN_TARGET, DAILY_RESURRECTION_CODE)
            print(f"[RESURRECTION]: Daily code {DAILY_RESURRECTION_CODE} Manifested.")
        except Exception as e:
            print(f"[RESURRECTION ERROR]: Daily send failed, but the loop survives. Reason: {e}")
        
        await asyncio.sleep(1)

# 🔒 [.env]에서 OTP 비밀키를 가져옵니다. 
OTP_SECRET = os.getenv("OTP_SECRET")

def verify_google_otp(user_code: str):
    """
    Google Authenticator 앱의 6자리 숫자를 검증함
    """
    totp = pyotp.TOTP(OTP_SECRET)
    return totp.verify(user_code) # 맞으면 True 반환

# 🚀 [신규]: 1차 결계(이메일 코드) 단독 검증 API
@router.post("/verify-resurrection")
async def verify_resurrection(email_code: str = Form(...)):
    global DAILY_RESURRECTION_CODE
    
    # 코드가 틀리면 즉시 실패 응답
    if str(email_code) != str(DAILY_RESURRECTION_CODE):
        return {"status": "fail", "message": "The key has withered."}
        
    return {"status": "success"}

@router.post("/unlock-god-mode")
async def unlock_god_mode(
    request: Request,
    response: Response,
    layer1_key: str = Form(...),  # 888
    email_code: str = Form(...),  # Resurrection Code
    otp_code: str = Form(...)     # Google Authenticator Code
):
    # 1. 1차 결계 키(888) 대조
    if layer1_key != os.getenv("LAYER1_KEY"):
        return {"status": "fail", "message": "The void remains silent."}

    # 2. 이메일 자정 코드 확인
    global DAILY_RESURRECTION_CODE
    if str(email_code) != str(DAILY_RESURRECTION_CODE):
        return {"status": "fail", "message": "The key has withered."}

    # 3. Google OTP 확인
    if not verify_google_otp(otp_code):
        return {"status": "fail", "message": "The stars are not aligned."}

    # 4. 🔓 모든 결계 통과 시 God Token 생성 및 발급
    god_token = secrets.token_urlsafe(32)
    
    content = {
        "status": "success", 
        "message": "WRITE MODE UNLOCKED",
        "effect": "rendering_green_glow"
    }
    res = JSONResponse(content=content)
    
    # 🚀 진짜 토큰 발급!
    res.set_cookie(
        key="god_token",
        value=god_token,
        httponly=True,   # 자바스크립트 접근 차단
        max_age=7200,    # 2시간 수명
        samesite="lax",
        secure=False     # 로컬 테스트용이므로 반드시 False
    )
    
    return res

@router.post("/verify-akashic-layer1")
async def verify_akashic_layer1(request: Request, pin: str = Form(...)):
    """[Lv1]: 1차 결계 확인 (프론트 노출 방지용 사전 검증)"""
    current_user = request.cookies.get("session_user_id")
    if current_user != os.getenv("ADMIN_EMAIL"):
        return JSONResponse(status_code=403, content={"status": "error"})
        
    if pin != os.getenv("AKASHIC_PIN"):
        return JSONResponse(status_code=403, content={"status": "error"})
        
    return JSONResponse(content={"status": "success"})

@router.post("/unlock-akashic")
async def unlock_akashic(
    request: Request,
    response: Response,
    layer1_key: str = Form(...), 
    email_code: str = Form(...),
    otp_code: str = Form(...)     
):
    """[Lv1: Akashic Records] 진입을 위한 3중 결계 해제"""
    
    # 1. 1차 결계 키 대조 (환경변수 검증)
    if layer1_key != os.getenv("AKASHIC_PIN"):
        return {"status": "fail", "message": "The void remains silent."}

    # 2. 이메일 자정 코드 확인
    global DAILY_RESURRECTION_CODE
    if str(email_code) != str(DAILY_RESURRECTION_CODE):
        return {"status": "fail", "message": "The key has withered."}

    # 3. Google OTP 확인 
    if not verify_google_otp(otp_code):
        return {"status": "fail", "message": "The stars are not aligned."}

    # 4. 🔓 모든 결계 통과 시 God Token 생성 및 발급
    import secrets
    god_token = secrets.token_urlsafe(32)
    
    content = {
        "status": "success", 
        "message": "AKASHIC RECORDS UNLOCKED",
        "effect": "rendering_red_void" 
    }
    res = JSONResponse(content=content)
    
    res.set_cookie(
        key="god_token",
        value=god_token,
        httponly=True,   
        max_age=7200,    
        samesite="lax",
        secure=False     
    )
    
    print(f"✨ [GOD MODE RITUAL]: LV1 AKASHIC RECORDS GRANTED TO ADMIN.")
    return res

@router.post("/verify-layer1")
async def verify_layer1(layer1_key: str = Form(...)):
    # 🔒 서버만이 읽을 수 있는 .env의 진짜 키와 비교
    if layer1_key == os.getenv("LAYER1_KEY"):
        return {"status": "success"}
    
    return {"status": "fail", "message": "The void rejects your offering."}

# ---------------------------------------------------------
# 👁️ [Lv4: Resurrection] - Anamnesis (auth.py 맨 아래에 추가)
# ---------------------------------------------------------

@router.post("/lv4/verify_pin")
async def verify_gm4_pin(secret_pin: str = Form(...)):
    if secret_pin != os.getenv("GM4_STEALTH_PIN"):
        return JSONResponse(status_code=403, content={"status": "error"})
    return JSONResponse(content={"status": "success"})

@router.post("/lv4/awaken")
async def awaken_gm4(
    secret_pin: str = Form(...),
    code_6digit: str = Form(...),
    otp: str = Form(...)
):
    # 1차: 스텔스 핀 검증
    if secret_pin != os.getenv("GM4_STEALTH_PIN"):
        return JSONResponse(status_code=403, content={"status": "error"})

    # 2차: 매일 자정에 발송되는 공용 코드 대조 (auth.py 안에 있으니 바로 사용 가능!)
    if str(code_6digit) != str(DAILY_RESURRECTION_CODE):
        return JSONResponse(status_code=403, content={"status": "error", "message": "invalid memory."})

    # 3차: 구글 OTP 검증 (auth.py에 이미 import 되어 있음)
    totp = pyotp.TOTP(os.getenv("OTP_SECRET"))
    if not totp.verify(otp):
        return JSONResponse(status_code=403, content={"status": "error", "message": "resonance failed."})

    # 🔓 결계 해제 완료: 아담 카드몬(어드민) 비밀번호 초기화
    init_pw = os.getenv("INIT_ADMIN_PW")
    admin_email = os.getenv("ADMIN_EMAIL")

    try:
        now_kst = datetime.now(timezone(timedelta(hours=9))).strftime('%Y-%m-%d %H:%M:%S')
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password = %s, last_login = %s WHERE email = %s", (init_pw, now_kst, admin_email))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[GM4 DB ERROR]: {e}")
        
    # 강제 세션 & God Token 주입
    import uuid # (uuid만 없다면 함수 안에서 살짝 불러줍니다)
    new_god_token = str(uuid.uuid4())
    
    response = JSONResponse(content={"status": "success", "message": "Anamnesis Complete."})
    response.set_cookie(key="session_user_id", value=admin_email, httponly=False, max_age=86400, path="/")
    response.set_cookie(key="god_token", value=new_god_token, httponly=True, max_age=7200, path="/")

    print(f"✨ [GOD MODE RITUAL]: LV4 ANAMNESIS SUCCESSFUL. ADMIN RESET.")
    return response

# ---------------------------------------------------------
# 👁️ [Lv2: Omniscience] - Panopticon Access
# ---------------------------------------------------------

@router.post("/verify-pano-pin")
async def verify_pano_pin(request: Request, pin: str = Form(...)):
    """1차 결계: 4자리 스텔스 PIN 확인 (틀리면 403 리턴하여 조용히 무시되도록 함)"""
    current_user = request.cookies.get("session_user_id")
    if current_user != os.getenv("ADMIN_EMAIL"):
        return JSONResponse(status_code=403, content={"status": "error"})
        
    if pin != os.getenv("PANOPTICON_PIN"):
        return JSONResponse(status_code=403, content={"status": "error"})
        
    return JSONResponse(content={"status": "success"})

@router.post("/unlock-panopticon")
async def unlock_panopticon(
    request: Request,
    pin: str = Form(...),
    email_code: str = Form(...)
):
    """2차 결계: 자정 이메일 일회용 코드 확인 및 토큰 발급"""
    current_user = request.cookies.get("session_user_id")
    if current_user != os.getenv("ADMIN_EMAIL"):
        return JSONResponse(status_code=403, content={"status": "error"})

    if pin != os.getenv("PANOPTICON_PIN"):
        return JSONResponse(status_code=403, content={"status": "error"})

    global DAILY_RESURRECTION_CODE
    if str(email_code) != str(DAILY_RESURRECTION_CODE):
        return JSONResponse(status_code=403, content={"status": "error"})

    # 파놉티콘 전용 결계 쿠키 (pano_token) 발급
    import uuid
    pano_token = str(uuid.uuid4())
    
    response = JSONResponse(content={"status": "success", "message": "Omniscience Unlocked"})
    response.set_cookie(key="pano_token", value=pano_token, httponly=True, max_age=7200, path="/")
    
    print(f"✨ [PANOPTICON RITUAL]: LV2 OMNISCIENCE GRANTED TO ADMIN.")
    return response