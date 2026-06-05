# app/api/theory.py

from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
import json
import os
import time
import re
from datetime import datetime, timedelta, timezone

import psycopg2
from psycopg2.extras import RealDictCursor
from core.database import get_db  # 🚀 DB 통신을 위한 심장부 연결

router = APIRouter(prefix="/api/theory", tags=["theory"])

BASE_DIR = Path(__file__).resolve().parent.parent 
DATA_RENDER_DIR = BASE_DIR / "data" / "render"

# --- [기존 데이터 로더 유지 (UI 렌더링용 정적 자산)] ---
@router.get("/fixedstar/meanings")
async def get_fixed_star_meanings():
    try:
        file_path = DATA_RENDER_DIR / "fixed_stars_meanings.json"
        if not file_path.exists(): return {} 
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception: return {}

@router.get("/citrinitas/aleph")
async def get_aleph_dict():
    try:
        file_path = DATA_RENDER_DIR / "c2_aleph.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

@router.get("/citrinitas/mem")
async def get_mem_dict():
    try:
        file_path = DATA_RENDER_DIR / "c2_mem.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

@router.get("/citrinitas/shin")
async def get_shin_dict():
    try:
        file_path = DATA_RENDER_DIR / "c2_shin.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

@router.get("/citrinitas/ruach")
async def get_ruach_dict():
    try:
        file_path = DATA_RENDER_DIR / "c3_ruach.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

@router.get("/citrinitas/nefesh")
async def get_nefesh_dict():
    try:
        file_path = DATA_RENDER_DIR / "c3_nefesh.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

@router.get("/citrinitas/chayah")
async def get_chayah_dict():
    try:
        file_path = DATA_RENDER_DIR / "c3_chayah.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

@router.get("/citrinitas/neshamah_core")
async def get_neshamah_core_dict():
    try:
        file_path = DATA_RENDER_DIR / "c3_neshamah_core.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

@router.get("/citrinitas/neshamah_c1")
async def get_neshamah_c1_dict():
    try:
        file_path = DATA_RENDER_DIR / "c3_neshamah_c1.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

@router.get("/citrinitas/neshamah_c2")
async def get_neshamah_c2_dict():
    try:
        file_path = DATA_RENDER_DIR / "c3_neshamah_c2.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

@router.get("/citrinitas/neshamah_c3")
async def get_neshamah_c3_dict():
    try:
        file_path = DATA_RENDER_DIR / "c3_neshamah_c3.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

@router.get("/citrinitas/neshamah_c4")
async def get_neshamah_c4_dict():
    try:
        file_path = DATA_RENDER_DIR / "c3_neshamah_c4.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

@router.get("/citrinitas/neshamah_c5")
async def get_neshamah_c5_dict():
    try:
        file_path = DATA_RENDER_DIR / "c3_neshamah_c5.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

@router.get("/citrinitas/yechidah")
async def get_yechidah_dict():
    try:
        file_path = DATA_RENDER_DIR / "c3_yechidah.json"
        if not file_path.exists(): return {"error": "Not Found"}
        with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {"error": str(e)}

# ====================================================================
# 🪐 [인메모리 수복]: 디스크 폭격 방지용 전역 사비안 캐시 저장소
# ====================================================================
_SABIAN_DB_CACHE = None

@router.get("/sabian/render/{idx}")
def get_sabian_summary(idx: int, lang: str = "en"):
    global _SABIAN_DB_CACHE
    try:
        if _SABIAN_DB_CACHE is None:
            file_path = DATA_RENDER_DIR / "sabian.json"
            if not file_path.exists(): 
                return {"text": "Sabian DB Missing"}
            with open(file_path, "r", encoding="utf-8") as f: 
                _SABIAN_DB_CACHE = json.load(f)
        
        symbol_data = _SABIAN_DB_CACHE.get(str(idx), {})
        return {"text": symbol_data.get(lang, symbol_data.get("en", "Unknown"))}
    except Exception: 
        return {"text": "Error"}


# ====================================================================
# 🚀 [DB 연동 수복]: 파일 시스템을 버리고 PostgreSQL에서 직접 가져옵니다.
# ====================================================================

@router.get("/sabian/sign/{sign_name}")
async def get_sabian_sign(sign_name: str, lang: str = Query("en")):
    try:
        conn = get_db()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM theory_scrolls WHERE module='r2' AND subpath='sign' AND entry_id=%s", (sign_name,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Sign index not found.")
        if row.get("status") == "draft":
            raise HTTPException(status_code=404, detail=f"The duality of knowledge '{sign_name}' is not yet manifested.")

        title = row.get(f"title_{lang}") or row.get("title_en") or sign_name.upper()
        content = row.get(f"content_{lang}") or ""
        
        return {"title": title, "content": content, "status": row.get("status", "draft")}
    except HTTPException: raise
    except Exception as e: 
        print(f"[THEORY ERROR - SIGN]: {e}")
        raise HTTPException(status_code=404, detail="Content not found")


@router.get("/sabian/symbol/{sign_name}/{degree}")
async def get_sabian_symbol(sign_name: str, degree: str, lang: str = Query("en")):
    try:
        conn = get_db()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 🚀 7과 07 모두 매칭될 수 있도록 유연한 조회 로직
        alt_degree = f"{int(degree):02d}" if degree.isdigit() else degree
        
        cursor.execute("""
            SELECT * FROM theory_scrolls 
            WHERE module='r2' AND subpath=%s AND (entry_id=%s OR entry_id=%s)
        """, (sign_name, degree, alt_degree))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Symbol index not found.")
        if row.get("status") == "draft":
            raise HTTPException(status_code=404, detail=f"The duality of knowledge '{sign_name} {degree}°' is not yet manifested.")

        title = row.get(f"title_{lang}") or row.get("title_en") or f"{sign_name.capitalize()} {degree}°"
        content = row.get(f"content_{lang}") or ""
        
        return {"title": title, "content": content, "status": row.get("status", "draft")}
    except HTTPException: raise
    except Exception as e:
        print(f"[THEORY ERROR - SYMBOL]: {e}")
        raise HTTPException(status_code=404, detail="Content not found")


# ====================================================================
# 🚀 1. R1 퍼블릭 트리 스캐너 (DB 기반 자연 정렬)
# ====================================================================
r1_tree_cache = {
    "timestamp": 0,
    "data": {"hermeticum": [], "archivum": []}
}

@router.get("/r1/tree")
def get_r1_public_tree():
    global r1_tree_cache
    
    if time.time() - r1_tree_cache["timestamp"] < 10:
        return r1_tree_cache["data"]

    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM theory_scrolls WHERE module='r1' AND status='published'")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    articles_h = []
    articles_a = []
    
    for row in rows:
        meta = {
            "id": row['entry_id'],
            "title": row['title_ko'] if row['title_ko'] else (row['title_en'] if row['title_en'] else row['entry_id']),
            "title_en": row['title_en'],
            "title_ko": row['title_ko'],
            "status": row['status'],
            "pinned": row['pinned'],
            "pin_order": row['pin_order']
        }
        if row['subpath'] == 'hermeticum':
            articles_h.append(meta)
        elif row['subpath'] == 'archivum':
            articles_a.append(meta)

    # 자연 정렬 로직
    def sort_key(x):
        return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', x['id'])]
        
    articles_h.sort(key=sort_key)
    articles_a.sort(key=sort_key)

    result = {
        "hermeticum": articles_h,
        "archivum": articles_a
    }
    
    r1_tree_cache["timestamp"] = time.time()
    r1_tree_cache["data"] = result
    return result


# ====================================================================
# 🚀 N-Marker 레이더 (24시간 내 신규 글 감지 - 초고속 DB 쿼리)
# ====================================================================
radar_cache = {
    "timestamp": 0,
    "data": {"has_new": False, "new_modules": {"r1": False, "r2": False}}
}

@router.get("/rubedo/check_new")
def check_new_rubedo_articles():
    global radar_cache
    
    if time.time() - radar_cache["timestamp"] < 60:
        return radar_cache["data"]

    try:
        conn = get_db()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 🚀 끔찍하게 느렸던 디스크 파일 순회를 단 한 줄의 SQL로 파괴!
        # 최근 24시간 내에 생성된 '발행(published)' 글이 있는지 검사합니다.
        cursor.execute("""
            SELECT DISTINCT module FROM theory_scrolls 
            WHERE status = 'published' AND created_at >= NOW() - INTERVAL '24 hours'
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        new_r1 = any(r['module'] == 'r1' for r in rows)
        new_r2 = any(r['module'] == 'r2' for r in rows)

        result = {
            "has_new": new_r1 or new_r2,
            "new_modules": {"r1": new_r1, "r2": new_r2}
        }
        radar_cache["timestamp"] = time.time()
        radar_cache["data"] = result
        return result
    except Exception as e:
        print(f"[RADAR ERROR]: {e}")
        return radar_cache["data"]


# ====================================================================
# 🚀 [본문 호출]: 영/한문 제목과 본문을 DB에서 한 번에 가져옵니다.
# ====================================================================
@router.get("/{category}/{entry_id}")
async def get_theory_content(category: str, entry_id: str):
    try:
        conn = get_db()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM theory_scrolls WHERE module='r1' AND subpath=%s AND entry_id=%s", (category, entry_id))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Theory index not found.")
        if row.get("status") != "published":
            raise HTTPException(status_code=404, detail="Article not published.")

        return {
            "title_en": row.get("title_en") or row.get("entry_id"),
            "title_ko": row.get("title_ko") or row.get("entry_id"),
            "content_en": row.get("content_en") or "",
            "content_ko": row.get("content_ko") or ""
        }
    except HTTPException: raise
    except Exception: raise HTTPException(status_code=404, detail="System Error")