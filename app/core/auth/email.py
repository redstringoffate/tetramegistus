import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ⚠️ 여기에 지메일 정보와 '앱 비밀번호'를 넣으세요.
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "당신의계정@gmail.com" 
SENDER_PASSWORD = "abcd efgh ijkl mnop" # 16자리 앱 비밀번호

def send_verification_email(receiver_email: str, code: str):
    message = MIMEMultipart()
    message["From"] = f"Tetramegistus <{SENDER_EMAIL}>"
    message["To"] = receiver_email
    message["Subject"] = "[Tetramegistus] Verification Code"

    body = f"Your 6-digit verification code is: {code}"
    message.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls() # 보안 연결
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(message)
        print(f"Email sent to {receiver_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False