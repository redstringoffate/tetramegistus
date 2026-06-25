# app/api/cities.py

from fastapi import APIRouter, Query, HTTPException
import psycopg2.extras
from app.core.database import get_db

router = APIRouter()

@router.get("/api/cities")
def search_cities(q: str = Query("", description="도시 이름 검색어")):
    """
    유저가 입력한 검색어(q)를 기반으로 세계 도시 DB를 탐색합니다.
    검색어가 없으면 빈 배열을 반환합니다.
    """
    if not q or len(q) < 2:
        return []

    conn = get_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # ILIKE를 통해 대소문자 구분 없이 검색 (예: 'seo' 입력 시 'Seoul' 검색)
        search_pattern = f"%{q}%"
        
        # 이전 테이블 구조에 맞춰 population 대신 city_name 기준으로 정렬합니다.
        # 프론트엔드 UI에 보여줄 'label' (예: Seoul, Korea) 문자열을 DB 단에서 조립해서 줍니다.
        cursor.execute("""
            SELECT 
                city_name AS city, 
                state_name AS state, 
                country_code AS country, 
                lat, 
                lng, 
                timezone AS tz,
                -- 복잡한 숫자 주소 빼고 깔끔하게 '도시, 국가' 렌더링
                city_name || ', ' || country_code AS label
            FROM world_cities
            WHERE city_name ILIKE %s
            -- 글자 수가 짧은 주요 도시가 무조건 먼저 오도록 정렬 전략 수정!
            ORDER BY LENGTH(city_name) ASC, city_name ASC
            LIMIT 20
        """, (search_pattern,))
        
        results = cursor.fetchall()
        return results

    except Exception as e:
        print(f"💀 [CITY SEARCH ERROR]: {e}")
        raise HTTPException(status_code=500, detail="Database engine error.")
    finally:
        cursor.close()
        conn.close()