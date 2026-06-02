# app/core/auth/admin.py

import pyotp

# 🔑 관리자(아담)의 고유 식별 이메일
# 모든 DB 조회 및 권한 체크의 기준이 됩니다.
ADAM_EMAIL = "admin@tetramegistus.com"

# 2단계 물리 보안 (나중에 사용할 OTP 키)
# 이 키는 본인의 Google Authenticator 앱에 등록할 용도입니다.
ADMIN_OTP_SECRET = "TETRA_SECRET_KEY_7777" 
totp = pyotp.TOTP(ADMIN_OTP_SECRET)

def is_admin(email: str) -> bool:
    """입력된 이메일이 아담(관리자)인지 확인"""
    if not email:
        return False
    return email.strip().lower() == ADAM_EMAIL.lower()

def verify_admin_otp(input_otp: str) -> bool:
    """실시간 OTP 번호 검증 (추후 확장용)"""
    return totp.verify(input_otp)

# ⚠️ 이전의 ADMIN_CODE와 ADAM_IDENTITY는 이제 DB(database.py의 seed_admin)로 이전되었습니다.
# 따라서 이 파일에서는 제거하거나 참조하지 않습니다.