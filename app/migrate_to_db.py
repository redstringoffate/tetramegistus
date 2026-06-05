# app/migrate_to_db.py

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# 🚀 아이디에 .vniccmcvxpgfylwdygqu 가 붙은 완벽한 IPv4 우회 주소입니다.
db_url = "postgresql://postgres.vniccmcvxpgfylwdygqu:4times0325tetra@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

# 직통 연결
conn = psycopg2.connect(db_url)
cursor = conn.cursor(cursor_factory=RealDictCursor)

# ... (아래 코드는 기존과 100% 동일) ...

THEORY_DIR = os.path.join(CURRENT_DIR, "data", "theory")

def process_and_insert(module, subpath, entry_id, index_dir, en_dir, ko_dir):
    json_path = os.path.join(index_dir, f"{entry_id}.json")
    if not os.path.exists(json_path): return
    
    with open(json_path, "r", encoding="utf-8-sig") as f:
        meta = json.load(f)
        
    title_en = meta.get("title_en", "")
    title_ko = meta.get("title_ko", "")
    status = meta.get("status", "draft")
    pinned = meta.get("pinned", False)
    pin_order = meta.get("pin_order", None)
    
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

    cursor.execute("""
        INSERT INTO theory_scrolls 
        (module, subpath, entry_id, title_en, title_ko, content_en, content_ko, status, pinned, pin_order)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (module, subpath, entry_id, title_en, title_ko, content_en, content_ko, status, pinned, pin_order))
    print(f"✅ Migrated: [{module}] {subpath} / {entry_id}")

print("🚀 마이그레이션 시작...")

for sub in ["hermeticum", "archivum"]:
    idx_dir = os.path.join(THEORY_DIR, sub, "index")
    if os.path.exists(idx_dir):
        for f in os.listdir(idx_dir):
            if f.endswith(".json"):
                eid = f.replace(".json", "")
                process_and_insert("r1", sub, eid, idx_dir, os.path.join(THEORY_DIR, sub, "en"), os.path.join(THEORY_DIR, sub, "ko"))

idx_dir = os.path.join(THEORY_DIR, "sabian", "sign", "index")
if os.path.exists(idx_dir):
    for f in os.listdir(idx_dir):
        if f.endswith(".json"):
            eid = f.replace(".json", "")
            process_and_insert("r2", "sign", eid, idx_dir, os.path.join(THEORY_DIR, "sabian", "sign", "en"), os.path.join(THEORY_DIR, "sabian", "sign", "ko"))

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