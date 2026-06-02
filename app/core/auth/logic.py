# app/core/auth/logic.py
from core.database import get_db

def finalize_user_registration(email: str, temp_data: dict):
    """
    헌법 1.1조: 가입 시 쿠키(temp_data)를 DB에 영구 기록한다.
    """
    conn = get_db()
    cursor = conn.cursor()
    
    # 쿠키에서 가져온 정보를 DB에 업데이트
    cursor.execute("""
        UPDATE users 
        SET birth = ?, location = ? 
        WHERE email = ?
    """, (temp_data.get('birth'), temp_data.get('location'), email))
    
    conn.commit()
    conn.close()