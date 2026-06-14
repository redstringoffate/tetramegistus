from app.core.database import get_db

def create_reviewer():
    conn = get_db()
    cursor = conn.cursor()
    try:
        # 일반 USER 권한의 심사관용 계정 주입
        cursor.execute("""
            INSERT INTO users (email, password, role, master_key, is_active)
            VALUES (%s, %s, %s, %s, %s)
        """, ('reviewer@void.com', 'dummy_pw', 'USER', '1111-2222-3333-4444', 1))
        
        conn.commit()
        print("✅ [SUCCESS]: 구글 심사관용 더미 계정(USER 권한)이 DB에 성공적으로 주입되었습니다!")
        print("제출용 마스터키: 1111-2222-3333-4444")
    except Exception as e:
        print(f"💀 [ERROR]: 생성 실패. 이유: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_reviewer()