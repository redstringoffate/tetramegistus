# app/api/theory.py

from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
import json
import os

router = APIRouter(prefix="/api/theory", tags=["theory"])

BASE_DIR = Path(__file__).resolve().parent.parent 
DATA_RENDER_DIR = BASE_DIR / "data" / "render"
DATA_THEORY_DIR = BASE_DIR / "data" / "theory"

# --- [기존 데이터 로더 유지] ---
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
async def get_chayah_dict():
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
        # 🚀 최초 1회 호출 시에만 디스크에서 읽어 메모리에 박제합니다.
        if _SABIAN_DB_CACHE is None:
            file_path = DATA_RENDER_DIR / "sabian.json"
            if not file_path.exists(): 
                return {"text": "Sabian DB Missing"}
            with open(file_path, "r", encoding="utf-8") as f: 
                _SABIAN_DB_CACHE = json.load(f)
        
        # 두 번째 요청부터는 디스크를 아예 건드리지 않고 RAM에서 빛의 속도로 추출합니다.
        symbol_data = _SABIAN_DB_CACHE.get(str(idx), {})
        return {"text": symbol_data.get(lang, symbol_data.get("en", "Unknown"))}
    except Exception: 
        return {"text": "Error"}


# ====================================================================
# 🚀 [수복 완료]: 인코딩(BOM) 폭탄 제거 및 status 값 명시적 반환
# ====================================================================

@router.get("/sabian/sign/{sign_name}")
async def get_sabian_sign(sign_name: str, lang: str = Query("en")):
    try:
        base_dir = DATA_THEORY_DIR / "sabian" / "sign"
        index_file = base_dir / "index" / f"{sign_name}.json"

        if not index_file.exists():
            raise HTTPException(status_code=404, detail="Sign index not found.")

        # 🚀 utf-8-sig로 읽어서 BOM 충돌 완벽 방지
        with open(index_file, 'r', encoding='utf-8-sig') as f:
            meta = json.load(f)

        if meta.get("status") == "draft":
            raise HTTPException(status_code=404, detail=f"The duality of knowledge '{sign_name}' is not yet manifested.")

        target_body = base_dir / lang / f"{sign_name}.html"
        content = ""
        if target_body.exists():
            with open(target_body, 'r', encoding='utf-8-sig') as f:
                content = f.read()

        title = meta.get(f"title_{lang}") or meta.get("title") or sign_name.upper()
        # 🚀 [수복]: 프론트엔드가 다운로드 권한을 검증할 수 있도록 status 값을 리턴
        return {"title": title, "content": content, "status": meta.get("status", "draft")}
    except HTTPException: raise
    except Exception as e: 
        print(f"[THEORY ERROR - SIGN]: {e}")
        raise HTTPException(status_code=404, detail="Content not found")


@router.get("/sabian/symbol/{sign_name}/{degree}")
async def get_sabian_symbol(sign_name: str, degree: str, lang: str = Query("en")):
    try:
        base_dir = DATA_THEORY_DIR / "sabian" / "symbol" / sign_name
        
        # 🚀 7.json과 07.json 모두 유연하게 대응
        index_file = base_dir / "index" / f"{degree}.json"
        if not index_file.exists() and degree.isdigit():
            padded = base_dir / "index" / f"{int(degree):02d}.json"
            if padded.exists():
                index_file = padded
                degree = f"{int(degree):02d}"

        if not index_file.exists():
            raise HTTPException(status_code=404, detail="Symbol index not found.")
        
        # 🚀 utf-8-sig로 읽어서 BOM 충돌 완벽 방지
        with open(index_file, 'r', encoding='utf-8-sig') as f:
            meta = json.load(f)

        if meta.get("status") == "draft":
            raise HTTPException(status_code=404, detail=f"The duality of knowledge '{sign_name} {degree}°' is not yet manifested.")

        target_body = base_dir / lang / f"{degree}.html"
        content = ""
        if target_body.exists():
            with open(target_body, 'r', encoding='utf-8-sig') as f:
                content = f.read()

        title = meta.get(f"title_{lang}") or meta.get("title") or f"{sign_name.capitalize()} {degree}°"
        # 🚀 [수복]: 프론트엔드가 다운로드 권한을 검증할 수 있도록 status 값을 리턴
        return {"title": title, "content": content, "status": meta.get("status", "draft")}
    except HTTPException: raise
    except Exception as e:
        print(f"[THEORY ERROR - SYMBOL]: {e}")
        raise HTTPException(status_code=404, detail="Content not found")
    
import re # (파일 상단에 없으면 꼭 추가해 주세요)

# ====================================================================
# 🚀 1. R1 퍼블릭 트리 스캐너 (10초 캐시 + async 제거로 딜레이 원천 차단)
# ====================================================================
r1_tree_cache = {
    "timestamp": 0,
    "data": {"hermeticum": [], "archivum": []}
}

# 🚨 반드시 'async'를 빼야 합니다! (서버 멈춤 방지)
@router.get("/r1/tree")
def get_r1_public_tree():
    global r1_tree_cache
    
    # 10초 캐시: 글을 쓰자마자 확인하는 상황을 위해 짧게 캐시하지만, 동시 폭격은 완벽히 방어함
    if time.time() - r1_tree_cache["timestamp"] < 10:
        return r1_tree_cache["data"]

    def get_public_articles(subpath):
        index_path = DATA_THEORY_DIR / subpath / "index"
        if not index_path.exists(): 
            return []
        
        articles = []
        for file_path in index_path.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8-sig") as f:
                    meta = json.load(f)
                    if meta.get("status") == "published":
                        meta["id"] = file_path.stem
                        articles.append(meta)
            except Exception:
                pass
                
        articles.sort(key=lambda x: [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', x['id'])])
        return articles

    result = {
        "hermeticum": get_public_articles("hermeticum"),
        "archivum": get_public_articles("archivum") 
    }
    
    r1_tree_cache["timestamp"] = time.time()
    r1_tree_cache["data"] = result
    return result

from datetime import datetime, timedelta, timezone
import json
import os
import time

# 🚀 [최적화]: 60초 메모리 캐시 저장소
radar_cache = {
    "timestamp": 0,
    "data": {"has_new": False, "new_modules": {"r1": False, "r2": False}}
}

# app/api/theory.py

@router.get("/rubedo/check_new")
def check_new_rubedo_articles():
    global radar_cache
    
    if time.time() - radar_cache["timestamp"] < 60:
        return radar_cache["data"]

    try:
        kst = timezone(timedelta(hours=9))
        now_kst = datetime.now(kst)
        threshold = now_kst - timedelta(hours=24)
        
        # 🚀 24시간 전의 시간을 OS가 이해할 수 있는 초 단위 타임스탬프로 변환
        threshold_timestamp = threshold.timestamp() 
        
        new_status = { "r1": False, "r2": False }
        
        def has_new_in_path(base_path):
            if not base_path.exists(): return False
            for root, dirs, files in os.walk(base_path):
                for f in files:
                    if f.endswith(".json"):
                        file_path = os.path.join(root, f)
                        try:
                            # 🚀 OS 메타데이터 검사: 수정된 지 24시간 넘은 파일은 열어보지도 않고 0.001초 컷 스킵!
                            if os.path.getmtime(file_path) < threshold_timestamp:
                                continue
                                
                            with open(file_path, 'r', encoding='utf-8-sig') as file:
                                meta = json.load(file)
                                if meta.get("status") == "published":
                                    date_str = meta.get("date", "")
                                    if "T" in date_str:
                                        pub_date = datetime.fromisoformat(date_str)
                                        if pub_date.tzinfo is None:
                                            pub_date = pub_date.replace(tzinfo=kst)
                                        if pub_date > threshold:
                                            return True
                        except Exception: pass
            return False

        if has_new_in_path(DATA_THEORY_DIR / "hermeticum" / "index") or \
           has_new_in_path(DATA_THEORY_DIR / "archivum" / "index"):
            new_status["r1"] = True
            
        if has_new_in_path(DATA_THEORY_DIR / "sabian"):
            new_status["r2"] = True
        
        result = {
            "has_new": new_status["r1"] or new_status["r2"],
            "new_modules": new_status
        }
        radar_cache["timestamp"] = time.time()
        radar_cache["data"] = result
        
        return result
    except Exception as e:
        print(f"[RADAR ERROR]: {e}")
        return radar_cache["data"]

# ====================================================================
# 🚀 [본문 호출]: 영/한문 제목과 본문을 한 번에 가져옵니다.
# ====================================================================
@router.get("/{category}/{entry_id}")
async def get_theory_content(category: str, entry_id: str):
    try:
        cat_dir = DATA_THEORY_DIR / category
        index_file = cat_dir / "index" / f"{entry_id}.json"

        if not index_file.exists():
            raise HTTPException(status_code=404, detail="Theory index not found.")

        with open(index_file, 'r', encoding='utf-8-sig') as f:
            meta = json.load(f)

        if meta.get("status") != "published":
            raise HTTPException(status_code=404, detail="Article not published.")

        target_en = cat_dir / "en" / f"{entry_id}.html"
        content_en = ""
        if target_en.exists():
            with open(target_en, 'r', encoding='utf-8-sig') as f:
                content_en = f.read()

        target_ko = cat_dir / "ko" / f"{entry_id}.html"
        content_ko = ""
        if target_ko.exists():
            with open(target_ko, 'r', encoding='utf-8-sig') as f:
                content_ko = f.read()

        # 🚀 에디터에 저장된 영/한 제목과 본문을 몽땅 리턴!
        return {
            "title_en": meta.get(f"title_en") or meta.get("title") or entry_id,
            "title_ko": meta.get(f"title_ko") or meta.get("title") or entry_id,
            "content_en": content_en,
            "content_ko": content_ko
        }
    except HTTPException: raise
    except Exception: raise HTTPException(status_code=404, detail="System Error")