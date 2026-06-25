import os
import csv
from app.core.database import get_db

def ingest_geonames_data():
    print("🌌 [Ingestion Protocol]: 세계 지도 매트릭스 재구축을 시작합니다...")
    
    file_path = "data/cities5000.txt"
    if not os.path.exists(file_path):
        print(f"💀 [ERROR]: {file_path} 파일을 찾을 수 없습니다.")
        return

    conn = get_db()
    cursor = conn.cursor()

    # 1. 오염된 옛 테이블을 완전히 소멸시키고 인구수(population)를 포함해 창조
    cursor.execute("DROP TABLE IF EXISTS world_cities;")
    cursor.execute("""
        CREATE TABLE world_cities (
            id SERIAL PRIMARY KEY,
            city_name TEXT NOT NULL,
            state_name TEXT,
            country_code TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            timezone TEXT NOT NULL,
            population BIGINT DEFAULT 0
        )
    """)
    
    insert_query = """
        INSERT INTO world_cities (city_name, state_name, country_code, lat, lng, timezone, population)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    
    batch_data = []
    count = 0

    # 🚨 [핵심 수복]: quoting=csv.QUOTE_NONE을 적용해 따옴표로 인한 열 밀림 현상 원천 차단
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter='\t', quoting=csv.QUOTE_NONE)
        
        for row in reader:
            if len(row) < 18:
                continue
            
            city_name = row[2] 
            country_code = row[8]
            state_name = row[10] # 이제 밀리지 않고 정확히 안착합니다.
            
            try:
                lat = float(row[4])
                lng = float(row[5])
                population = int(row[14]) if row[14].isdigit() else 0
            except ValueError:
                continue
                
            timezone = row[17]
            if not timezone:
                continue
                
            batch_data.append((city_name, state_name, country_code, lat, lng, timezone, population))
            count += 1
            
            if len(batch_data) >= 1000:
                cursor.executemany(insert_query, batch_data)
                conn.commit()
                print(f"   ... {count}개의 도시 좌표 주입 완료")
                batch_data = []

    if batch_data:
        cursor.executemany(insert_query, batch_data)
        conn.commit()

    cursor.close()
    conn.close()
    print(f"✅ [SUCCESS]: 총 {count}개의 초정밀 도시 DB(State, Population 포함)가 복구되었습니다!")

if __name__ == "__main__":
    ingest_geonames_data()