# app/migrate_to_db.py
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# 1. DB 연결 (기존 main.py와 동일한 방식)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(os.path.dirname(CURRENT_DIR), ".env")
load_dotenv(env_path)

db_url = os.environ.get("DATABASE_URL", "")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# 기존
# conn = psycopg2.connect(db_url)

# 수정 (이렇게 하면 특수문자 문제를 완벽히 회피합니다)
from urllib.parse import urlparse
u = urlparse(db_url)
conn = psycopg2.connect(
    host=u.hostname,
    port=u.port,
    user=u.username,
    password=u.password, # 여기는 특수문자 인코딩 없이 그대로 넣어도 파이썬이 알아서 처리합니다
    database=u.path[1:]
)
cursor = conn.cursor(cursor_factory=RealDictCursor)

THEORY_DIR = os.path.join(CURRENT_DIR, "data", "theory")

def process_and_insert(module, subpath, entry_id, index_dir, en_dir, ko_dir):
    # 1. JSON 메타데이터 읽기
    json_path = os.path.join(index_dir, f"{entry_id}.json")
    if not os.path.exists(json_path): return
    
    with open(json_path, "r", encoding="utf-8-sig") as f:
        meta = json.load(f)
        
    title_en = meta.get("title_en", "")
    title_ko = meta.get("title_ko", "")
    status = meta.get("status", "draft")
    pinned = meta.get("pinned", False)
    pin_order = meta.get("pin_order", None)
    
    # 2. 본문 HTML 읽기
    content_en = ""
    en_path = os.path.join(en_dir, f"{entry_id}.html")
    if os.path.exists(en_path):
        with open(en_path, "r", encoding="utf-8") as f:
            content_en = f.read()
            
    content_ko = ""
    ko_path = os.path.join(ko_dir, f"{entry_id}.html")
    if os.path.exists(ko_path):
        with open(ko_path, "r", encoding="utf-8") as f:
            content_ko = f.read()

    # 3. DB에 꽂아넣기
    cursor.execute("""
        INSERT INTO theory_scrolls 
        (module, subpath, entry_id, title_en, title_ko, content_en, content_ko, status, pinned, pin_order)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (module, subpath, entry_id, title_en, title_ko, content_en, content_ko, status, pinned, pin_order))
    print(f"✅ Migrated: [{module}] {subpath} / {entry_id}")

print("🚀 마이그레이션 시작...")

# [R1] Hermeticum & Archivum 이관
for sub in ["hermeticum", "archivum"]:
    idx_dir = os.path.join(THEORY_DIR, sub, "index")
    if os.path.exists(idx_dir):
        for f in os.listdir(idx_dir):
            if f.endswith(".json"):
                eid = f.replace(".json", "")
                process_and_insert("r1", sub, eid, idx_dir, os.path.join(THEORY_DIR, sub, "en"), os.path.join(THEORY_DIR, sub, "ko"))

# [R2] Sabian Sign 이관
idx_dir = os.path.join(THEORY_DIR, "sabian", "sign", "index")
if os.path.exists(idx_dir):
    for f in os.listdir(idx_dir):
        if f.endswith(".json"):
            eid = f.replace(".json", "")
            process_and_insert("r2", "sign", eid, idx_dir, os.path.join(THEORY_DIR, "sabian", "sign", "en"), os.path.join(THEORY_DIR, "sabian", "sign", "ko"))

# [R2] Sabian Symbol 이관
signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
for sign in signs:
    idx_dir = os.path.join(THEORY_DIR, "sabian", "symbol", sign, "index")
    if os.path.exists(idx_dir):
        for f in os.listdir(idx_dir):
            if f.endswith(".json"):
                eid = f.replace(".json", "")
                process_and_insert("r2", sign, eid, idx_dir, os.path.join(THEORY_DIR, "sabian", "symbol", sign, "en"), os.path.join(THEORY_DIR, "sabian", "symbol", sign, "ko"))

conn.commit()
cursor.close()
conn.close()
print("🎉 마이그레이션 완수! Supabase를 확인하세요.")