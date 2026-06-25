# app/core/database.py

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# 🔑 로컬 절대 경로를 소각하고, .env의 환경 변수를 소환합니다.
load_dotenv()

# 환경변수에서 로드
DB_URL = os.getenv("DATABASE_URL")

import psycopg2

def get_db():
    # IPv4 네트워크를 완벽하게 통과하는 최종 풀러 주소입니다.
    # 비밀번호 자리에 4times0325tetra 만 정확히 넣었습니다.
    dsn = "postgresql://postgres.vniccmcvxpgfylwdygqu:4times0325tetra@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
    return psycopg2.connect(dsn)

def init_db():
    conn = get_db()
    # PostgreSQL에서는 반드시 cursor를 통해 명령을 실행해야 합니다.
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            role TEXT,
            birth TEXT,
            location TEXT,
            verification_code TEXT,
            master_key TEXT UNIQUE,
            is_active INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP WITH TIME ZONE
        )
    """)

    # 2. 🏛️ 통합 차트 테이블 (Natal + Composite)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS natal_charts (
            id SERIAL PRIMARY KEY,
            idx INTEGER NOT NULL,              
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            birth_date TEXT NOT NULL,          
            birth_time TEXT NOT NULL,          
            location TEXT,
            lat REAL,
            lng REAL,
            timezone TEXT,                     
            is_unknown_time INTEGER DEFAULT 0, 
            has_body INTEGER DEFAULT 1,        
            parent_idx_1 INTEGER,              
            parent_idx_2 INTEGER,              
            is_seed INTEGER DEFAULT 1,
            is_active INTEGER DEFAULT 1,       
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (email) ON DELETE CASCADE
        )
    """)

    # 3. Grimoire Archives (바이너리 박제 기반 수복판)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS grimoire_archives (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            stage TEXT NOT NULL,             
            target_name TEXT NOT NULL,
            compiler_id TEXT NOT NULL,
            archive_fossil TEXT NOT NULL,      
            is_pinned INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (email) ON DELETE CASCADE
        )
    """)

    # 4. World Cities (전 세계 도시 좌표 및 타임존 DB)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS world_cities (
            id SERIAL PRIMARY KEY,
            city_name TEXT NOT NULL,
            state_name TEXT,
            country_code TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            timezone TEXT NOT NULL,
            population BIGINT DEFAULT 0  -- ✨ 인구수 컬럼 추가!
        )
    """)

    # 5. 아담(Adam Kadmon) 초기화 및 [me] Anchor 설정 (기존 4번 항목)
    from app.core.auth.admin import ADAM_EMAIL
    INIT_ADMIN_PW = "19920601"
    INIT_MASTER_KEY = "7777-7777-7777-7777"

    # 🔑 파라미터 바인딩이 SQLite의 '?'에서 PostgreSQL의 '%s'로 변경됩니다.
    cursor.execute("SELECT * FROM users WHERE email = %s", (ADAM_EMAIL,))
    if not cursor.fetchone():
        # 유저 생성
        cursor.execute("""
            INSERT INTO users (email, password, role, birth, location, master_key, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, 9)
        """, (ADAM_EMAIL, INIT_ADMIN_PW, "ADAM", "1992-06-01 09:30:00", "Seoul", INIT_MASTER_KEY))
        
        # ⚓ [me] Anchor
        cursor.execute("""
            INSERT INTO natal_charts (
                idx, user_id, name, birth_date, birth_time, location, 
                lat, lng, timezone, is_unknown_time, has_body, is_seed, is_active
            )
            VALUES (0, %s, '[me]', '1992-06-01', '09:30:00', 'Seoul', 37.5665, 126.9780, '9', 0, 1, 1, 1)
        """, (ADAM_EMAIL,))

    # 강제 업데이트 로직
    cursor.execute("UPDATE users SET location = 'Seoul, Korea' WHERE email = %s", (ADAM_EMAIL,))
    cursor.execute("UPDATE natal_charts SET location = 'Seoul, Korea' WHERE user_id = %s AND idx = 0", (ADAM_EMAIL,))

    conn.commit()
    cursor.close()
    conn.close()
    print(f"--- [SUCCESS]: PostgreSQL Database Manifested with v26 Absolute Structure ---")

if __name__ == "__main__":
    init_db()

def delete_user_entire_data(email: str):
    """[THE PURGE]: 특정 영혼의 모든 DB 레코드(시드, 마도서, 본체)를 소멸시킵니다."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        # PostgreSQL에서는 '%s'를 사용합니다.
        cursor.execute("DELETE FROM natal_charts WHERE user_id = %s", (email,))
        cursor.execute("DELETE FROM grimoire_archives WHERE user_id = %s", (email,))
        cursor.execute("DELETE FROM users WHERE email = %s", (email,))
        
        conn.commit()
        return True
    except Exception as e:
        print(f"💀 [PURGE ERROR]: Failed to eradicate {email}. Reason: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()
