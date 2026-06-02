# app/core/auth/master_keys.py

import secrets
import string
import sqlite3

def generate_new_code():
    """16자리 마스터 코드 생성 (XXXX-XXXX-XXXX-XXXX)"""
    pool = string.ascii_uppercase + string.digits
    chunks = [''.join(secrets.choice(pool) for _ in range(4)) for _ in range(4)]
    return "-".join(chunks)

def renew_user_master_key(db_path, email):
    """사용된 키를 폐기하고 새로운 키를 DB에 즉시 각인함"""
    new_key = generate_new_code()
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("UPDATE users SET master_key = ? WHERE email = ?", (new_key, email))
        conn.commit()
        return new_key
    finally:
        conn.close()