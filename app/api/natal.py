# app/api/natal.py

import os
import json
import urllib.parse
from fastapi import APIRouter, Request, HTTPException
import psycopg2
from psycopg2.extras import RealDictCursor

# 🔑 [v26 수복]: DB_PATH 소각, get_db 소환 [cite: 9]
from core.database import get_db
from core.models import get_next_index  # 🔑 인덱스 로직 로드
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api/natal", tags=["natal"])

class NatalSchema(BaseModel):
    name: str
    birth_date: str    # YYYY-MM-DD
    birth_time: str    # HH:MM or HH:MM:SS
    location: str
    is_unknown_time: bool
    # 🔑 [수복]: 수동 좌표 저장을 위한 필드 추가 (Spatial Integrity)
    lat: Optional[float] = None
    lng: Optional[float] = None
    # 🚀 [수복 핵심 1]: 프론트에서 넘어오는 timezone 데이터를 유실 없이 받기 위해 스키마에 추가
    timezone: Optional[str] = None

def normalize_date(date_str: str) -> str:
    """오염된 날짜 포맷(YYYY-M-D)을 YYYY-MM-DD로 정정"""
    try:
        parts = date_str.split('-')
        if len(parts) == 3:
            return f"{parts[0]}-{int(parts[1]):02d}-{int(parts[2]):02d}"
    except:
        pass
    return date_str

@router.get("/list", response_model=List[Dict[str, Any]])
async def get_natal_list(request: Request):
    """비회원 쿠키 브릿지 및 DB 리스트 통합 (is_active 필터링)"""
    session_user_id = request.cookies.get("session_user_id")

    if not session_user_id:
        raw_date = request.cookies.get("temp_birth_date")
        raw_time = request.cookies.get("temp_birth_time")
        raw_loc = request.cookies.get("temp_location")

        if raw_date and raw_time and raw_loc:
            try:
                date_part = normalize_date(urllib.parse.unquote(raw_date).strip())
                time_part = urllib.parse.unquote(raw_time).strip()
                location = urllib.parse.unquote(raw_loc).strip()
                
                if not location or location.lower() == "unknown":
                    return []

                if time_part != "Unknown" and len(time_part) == 5:
                    time_part += ":00"

                return [{
                    "id": "GUEST",
                    "idx": 0,
                    "user_id": "GUEST",
                    "name": "[me]",
                    "birth_date": date_part,
                    "birth_time": time_part,
                    "location": location,
                    "is_unknown_time": 1 if time_part == "Unknown" else 0,
                    "is_seed": 1,
                    "is_active": 1
                }]
            except Exception:
                return []
        return []

    try:
        # 🚀 [PostgreSQL 연결 및 커서 생성]
        conn = get_db()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 🔑 [Active Only]: 현재 활성화된 시드만 idx 순으로 정렬
        # SQLite의 '?' 기호를 PostgreSQL의 '%s'로 치환 
        cursor.execute("""
            SELECT * FROM natal_charts 
            WHERE user_id = %s AND is_active = 1
            ORDER BY idx ASC
        """, (session_user_id,))
        
        rows = cursor.fetchall()
        
        # PostgreSQL의 datetime, date 객체를 ISO 문자열로 변환하여 JSON 직렬화 에러 방지
        for row in rows:
            for key, value in row.items():
                if hasattr(value, 'isoformat'):
                    row[key] = value.isoformat()
        
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"--- [DB ERROR]: {e} ---")
        return []
    finally:
        # 🔑 연결 종료 보장
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@router.post("/create")
async def create_seed(data: NatalSchema, request: Request):
    """신규 시드 생성 (n1 Unique Guard 및 Spatial Guard 적용)"""
    session_user_id = request.cookies.get("session_user_id")
    if not session_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 🛡️ [Spatial Guard]: "Location Omitted" 등 부실 데이터 원천 차단
    invalid_locs = ["location omitted", "unknown", ""]
    if not data.location or data.location.strip().lower() in invalid_locs:
        raise HTTPException(status_code=400, detail="Point of Emergence required.")

    final_time = "Unknown" if data.is_unknown_time else data.birth_time
    if not data.is_unknown_time and len(final_time) == 5:
        final_time += ":00"

    try:
        conn = get_db()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. 🔑 [n1 Unique Name Guard]: 현재 활성화된(is_active=1) 시드 중 이름 중복 금지
        cursor.execute("""
            SELECT idx FROM natal_charts 
            WHERE user_id = %s AND name = %s AND is_active = 1
        """, (session_user_id, data.name.strip()))
        
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail=f"Seed '{data.name}' already manifest in n1.")

        # 2. 🔑 [Sequential Assignment]: 다음 영구 인덱스 확보
        new_idx = get_next_index(cursor, session_user_id)

        # 3. 🔑 [Minimalist Repair]: 좌표(lat, lng) 및 timezone을 포함한 정밀 저장 [cite: 56]
        # 🚀 [수복 핵심 2]: INSERT 쿼리에 timezone 파라미터 추가 
        cursor.execute("""
            INSERT INTO natal_charts (idx, user_id, name, birth_date, birth_time, location, lat, lng, timezone, is_unknown_time, is_seed, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1, 1)
        """, (
            new_idx, session_user_id, data.name.strip(), normalize_date(data.birth_date), 
            final_time, data.location, data.lat, data.lng, data.timezone, 1 if data.is_unknown_time else 0
        ))
        
        conn.commit()
        return {"status": "success", "idx": new_idx}
    except HTTPException:
        if 'conn' in locals():
            conn.rollback()
        raise
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@router.post("/update/{idx}")
async def update_seed(idx: int, data: NatalSchema, request: Request):
    """영구 인덱스(idx) 기준 수정 (좌표 정보 갱신 포함)"""
    session_user_id = request.cookies.get("session_user_id")
    final_time = "Unknown" if data.is_unknown_time else data.birth_time
    if not data.is_unknown_time and len(final_time) == 5:
        final_time += ":00"

    try:
        conn = get_db()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # 🔑 [수복 핵심 3]: 수정 시에도 lat, lng와 함께 timezone을 갱신하도록 쿼리 보강
        cursor.execute("""
            UPDATE natal_charts 
            SET name = %s, birth_date = %s, birth_time = %s, location = %s, lat = %s, lng = %s, timezone = %s, is_unknown_time = %s
            WHERE user_id = %s AND idx = %s AND is_active = 1
        """, (
            data.name, normalize_date(data.birth_date), final_time, 
            data.location, data.lat, data.lng, data.timezone, 1 if data.is_unknown_time else 0, session_user_id, idx
        ))
        conn.commit()

        # 🚀 [추가됨]: Grimoire Registry 동기화 로직 [cite: 54]
        # N1에서 개명 시, Grimoire의 엑셀 폴더(Archive) 이름도 즉시 변경되도록 장부 갱신
        if session_user_id:
            registry_path = os.path.join("app", "data", "user_data", session_user_id, "grimoire", "registry.json")
            if os.path.exists(registry_path):
                try:
                    with open(registry_path, 'r', encoding='utf-8') as f:
                        registry_data = json.load(f)
                    
                    # 현재 idx가 장부에 존재한다면, 새 이름으로 덮어쓰기
                    str_idx = str(idx)
                    if str_idx in registry_data:
                        registry_data[str_idx] = data.name.strip()
                        with open(registry_path, 'w', encoding='utf-8') as f:
                            json.dump(registry_data, f, ensure_ascii=False, indent=4)
                except Exception as e:
                    print(f"--- [REGISTRY SYNC ERROR]: {e} ---")

        return {"status": "success"}
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@router.delete("/delete/{idx}")
async def delete_seed(idx: int, request: Request):
    """[Source: 23] Null Preservation: 인덱스 자리를 비워두는 논리적 소멸 [cite: 23]"""
    session_user_id = request.cookies.get("session_user_id")
    if idx == 0:
        raise HTTPException(status_code=403, detail="Anchor [me] cannot be extinguished.")

    try:
        conn = get_db()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            UPDATE natal_charts 
            SET is_active = 0 
            WHERE user_id = %s AND idx = %s
        """, (session_user_id, idx))
        
        conn.commit()
        return {"status": "success", "message": f"Index {idx} returned to the void."}
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
    
@router.get("/detail/{idx}")
async def get_seed_detail(idx: int, request: Request):
    """[수복]: 프론트엔드가 Edit 페이지 진입 시 데이터를 낚아채갈 수 있도록 개통"""
    session_user_id = request.cookies.get("session_user_id")
    if not session_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        conn = get_db()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 🔑 본인의 소유이며 살아있는(is_active=1) 시드만 조회
        cursor.execute("""
            SELECT * FROM natal_charts 
            WHERE user_id = %s AND idx = %s AND is_active = 1
        """, (session_user_id, idx))
        
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Seed has returned to the void.")
            
        # PostgreSQL datetime 처리
        row_dict = dict(row)
        for key, value in row_dict.items():
             if hasattr(value, 'isoformat'):
                 row_dict[key] = value.isoformat()
                 
        return row_dict
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()