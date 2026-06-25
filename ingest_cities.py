import os
import csv
from app.core.database import get_db

def ingest_geonames_data():
    print("🌌 [Ingestion Protocol]: world_cities 매트릭스 동기화를 시작합니다...")
    
    file_path = "data/cities5000.txt"
    
    if not os.path.exists(file_path):
        print(f"💀 [ERROR]: {file_path} 파일을 찾을 수 없습니다.")
        print("data 폴더를 만들고 텍스트 파일을 넣었는지 확인하십시오.")
        return

    conn = get_db()
    cursor = conn.cursor()

    # 기존 찌꺼기 데이터가 있다면 싹 밀어버리고 초기화 (안전장치)
    cursor.execute("TRUNCATE TABLE world_cities RESTART IDENTITY;")
    
    insert_query = """
        INSERT INTO world_cities (city_name, state_name, country_code, lat, lng, timezone)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    batch_data = []
    count = 0

    # GeoNames 데이터는 탭(\t)으로 구분된 TSV 파일입니다.
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter='\t')
        
        for row in reader:
            # 유효하지 않은 짧은 행은 건너뜀
            if len(row) < 18:
                continue
            
            # GeoNames 컬럼 매핑 (row[2]는 특수문자가 배제된 영어 ASCII 이름)
            city_name = row[2] 
            country_code = row[8]
            state_name = row[10] # 미국(NY, CA 등) 외에는 숫자 코드가 들어올 수도 있음
            
            try:
                lat = float(row[4])
                lng = float(row[5])
            except ValueError:
                continue
                
            timezone = row[17]
            
            # 타임존이 비어있는 더미 데이터는 엔진에 치명적이므로 필터링
            if not timezone:
                continue
                
            batch_data.append((city_name, state_name, country_code, lat, lng, timezone))
            count += 1
            
            # 1,000개씩 묶어서 DB에 전송 (과부하 방지 및 속도 최적화)
            if len(batch_data) >= 1000:
                cursor.executemany(insert_query, batch_data)
                conn.commit()
                print(f"   ... {count}개의 도시 좌표 주입 완료")
                batch_data = []

    # 남은 잔여 데이터 주입
    if batch_data:
        cursor.executemany(insert_query, batch_data)
        conn.commit()
        print(f"   ... {count}개의 도시 좌표 주입 완료")

    cursor.close()
    conn.close()
    print(f"✅ [SUCCESS]: 총 {count}개의 세계 도시 데이터가 Supabase 우주에 성공적으로 박제되었습니다!")

if __name__ == "__main__":
    ingest_geonames_data()