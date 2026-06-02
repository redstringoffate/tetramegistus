
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import gzip
import json
from datetime import datetime, timedelta

# 🚀 [PostgreSQL 수복]: 기존 DB 연결 모듈을 호출하여 파놉티콘도 같은 Supabase에 적재합니다.
from core.database import get_db 

# 🔑 [경로 폭탄 해체]: 도커(리눅스) 호환용 동적 경로로 변경
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# app 폴더 바로 아래에 아카이브 폴더 생성
ARCHIVE_DIR = os.path.join(os.path.dirname(CURRENT_DIR), "panopticon_archives") 

def get_pano_db():
    """파놉티콘 전용 커넥션을 반환합니다 (실제로는 메인 Supabase DB를 공유)"""
    return get_db()

def init_panopticon():
    """파놉티콘의 기초 시야망(테이블)을 구축합니다."""
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    
    conn = get_pano_db()
    cursor = conn.cursor()
    
    # 1. 👁️ Supra / Infra 공용 트래픽 로그
    # 🚀 [수복]: AUTOINCREMENT -> SERIAL로 변경, DATETIME -> TIMESTAMP로 변경
    # 🚀 [수복]: ALTER TABLE 꼼수 대신 아예 처음부터 user_id를 포함해서 테이블 창조
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS traffic_logs (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            session_id TEXT NOT NULL,
            is_anima INTEGER DEFAULT 0,
            module TEXT NOT NULL,
            duration INTEGER DEFAULT 0,
            country TEXT DEFAULT 'Other',
            user_id TEXT
        )
    """)
    
    # 2. 📚 Grimoire 연성 로그
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS grimoire_logs (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            compiler_id TEXT NOT NULL
        )
    """)

    # 3. 🕯️ Ritual 발동 로그
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ritual_logs (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ritual_type TEXT NOT NULL,
            user_id TEXT
        )
    """)
    
    conn.commit()
    cursor.close()
    conn.close()

def execute_chronos_ritual():
    """[The Chronos Ritual]: 6개월 이전 데이터를 압축하고 DB에서 삭제합니다."""
    conn = get_pano_db()
    # 🚀 [수복]: RealDictCursor 장착
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    six_months_ago = datetime.now() - timedelta(days=180)
    limit_date_str = six_months_ago.strftime('%Y-%m-%d %H:%M:%S')
    
    # 🚀 [수복]: '?' 기호를 '%s'로 교체
    cursor.execute("SELECT * FROM traffic_logs WHERE timestamp < %s", (limit_date_str,))
    old_data = cursor.fetchall()
    
    if old_data:
        archive_name = f"supra_archive_{six_months_ago.strftime('%Y_%m')}.jsonl.gz"
        archive_path = os.path.join(ARCHIVE_DIR, archive_name)
        
        with gzip.open(archive_path, 'at', encoding='utf-8') as f:
            for row in old_data:
                # 🚀 [수복]: PostgreSQL의 datetime 객체를 JSON 직렬화 가능하도록 문자열 변환
                row_dict = dict(row)
                if 'timestamp' in row_dict and isinstance(row_dict['timestamp'], datetime):
                    row_dict['timestamp'] = row_dict['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
                f.write(json.dumps(row_dict) + '\n')
                
        # 🚀 [수복]: '?' 기호를 '%s'로 교체
        cursor.execute("DELETE FROM traffic_logs WHERE timestamp < %s", (limit_date_str,))
        cursor.execute("DELETE FROM grimoire_logs WHERE timestamp < %s", (limit_date_str,))
        cursor.execute("DELETE FROM ritual_logs WHERE timestamp < %s", (limit_date_str,))
        
        # 🚀 [수복]: PostgreSQL에서는 트랜잭션 내에서 VACUUM 실행이 불가능하므로 제거 (Supabase가 자동 관리함)
        
    conn.commit()
    cursor.close()
    conn.close()
    print("[PANOPTICON] Chronos Ritual Complete. The void is clear.")