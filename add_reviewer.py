from app.core.database import get_db

def inject_reviewer_seed():
    conn = get_db()
    cursor = conn.cursor()
    reviewer_email = 'reviewer@void.com'
    
    try:
        # 1. 심사관 계정이 존재하는지 혹시 모르니 확인
        cursor.execute("SELECT * FROM users WHERE email = %s", (reviewer_email,))
        if not cursor.fetchone():
            print("⚠️ [WARNING]: 심사관 계정이 users 테이블에 없습니다. add_reviewer.py를 먼저 실행하세요.")
            return

        # 2. 이미 [me] 시드가 박혀있는지 확인 (중복 방지)
        cursor.execute("SELECT * FROM natal_charts WHERE user_id = %s AND idx = 0", (reviewer_email,))
        if cursor.fetchone():
            print("✅ [INFO]: 심사관 계정에 이미 [me] 시드가 존재합니다. 심사 준비 완료!")
            return

        # 3. ⚓ [me] Anchor 강제 주입 (Adam 초기화 로직과 동일하게 적용)
        # 구글 본사가 있는 미국 캘리포니아(Mountain View) 좌표로 세팅해 두면 더 자연스럽습니다.
        cursor.execute("""
            INSERT INTO natal_charts (
                idx, user_id, name, birth_date, birth_time, location, 
                lat, lng, timezone, is_unknown_time, has_body, is_seed, is_active
            )
            VALUES (0, %s, '[me]', '1990-01-01', '12:00:00', 'Mountain View, USA', 37.3861, -122.0839, '-8', 0, 1, 1, 1)
        """, (reviewer_email,))
        
        conn.commit()
        print("🚀 [SUCCESS]: 구글 심사관 계정(reviewer@void.com)에 [me] 시드가 성공적으로 이식되었습니다!")
        print("이제 구글 심사관이 로그인하면 Prima Materia(첫 셋업)를 건너뛰고 바로 Nigredo(대시보드)로 진입합니다.")

    except Exception as e:
        print(f"💀 [ERROR]: [me] 시드 주입 실패. 이유: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    inject_reviewer_seed()