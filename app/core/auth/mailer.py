# app/core/auth/mailer.py

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage

def send_anamnesis_email(target_email: str, code: str, mode: str = "signup", subject_alt: str = None):
    """
    [User Auth]: 일반 사용자 가입 및 비밀번호 찾기 메일 발송
    """
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    
    # 🔒 [.env]에서 시스템 발송 계정 정보를 인양합니다. 
    SENDER_EMAIL = os.getenv("MAIL_SENDER")
    SENDER_PASSWORD = os.getenv("MAIL_PASSWORD")

    message = MIMEMultipart()
    # 🚀 [변경]: 발신자 이름을 더 공식적인 'Tetramegistus System'으로 포장
    message["From"] = f"Tetramegistus System <{SENDER_EMAIL}>"
    message["To"] = target_email
    
    # 🚀 [추가]: 유저가 '답장'을 누르면 허공(noreply)으로 날아가게 만드는 결계
    message["Reply-To"] = "noreply@tetramegistus.com" 
    
    message["Subject"] = subject_alt if subject_alt else "[Tetramegistus] Anamnesis"

    # 🔑 모드별 데이터 매핑 (이미지 원형 복구)
    if mode == "signup":
        msg = "Once again, you recur."
        label = "VERIFICATION CODE"
        status_log = "STATUS: RECURSION_SEQUENCE_INITIATED"
        code_color = "#03eafc" # 명확한 HEX 값 사용 (rgb 대신)
    elif mode == "forgot":
        msg = "Recall the origin. Your memory is restored."
        label = "TEMPORARY PASSWORD"
        status_log = "STATUS: MEMORY_OVERWRITE_SUCCESS"
        code_color = "#03eafc"
    elif mode == "inquiry":
        msg = "New data transmitted from the manifest world."
        label = "" 
        status_log = "SOURCE: INQUIRY_FORM"
        code_color = "#7CFF9B"
    else:
        msg = ""
        label = ""
        status_log = "STATUS: AUTH_SEQUENCE_COMPLETE"
        code_color = "#03eafc"

    # 🌑 메일 클라이언트 호환성을 극대화한 테이블 레이아웃 (들여쓰기 강제 고정)
    html_body = f"""
    <html>
    <body style="margin: 0; padding: 0; background-color: #000000;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000; font-family: 'JetBrains Mono', 'Courier New', monospace;">
            <tr>
                <td style="padding: 60px 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="border-left: 2px solid #1a1a1a;">
                        <tr>
                            <td style="padding-left: 25px; padding-bottom: 50px; font-size: 11px; color: #444444; letter-spacing: 1px;">
                                {msg}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-left: 55px; padding-bottom: 60px;">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    {f'<tr><td style="font-size: 10px; color: #222222; letter-spacing: 2px; padding-bottom: 15px;">{label}</td></tr>' if label else ''}
                                    <tr>
                                        <td style="font-size: 16px; color: {code_color}; letter-spacing: 4px; font-weight: bold;">
                                            {code}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-left: 35px; font-size: 9px; color: #222222; letter-spacing: 2px;">
                                {status_log}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    message.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls() 
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(message)
        return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False
    
def send_resurrection_email(target_email: str, code: str):
    """
    [Admin Auth]: God Mode 진입용 Resurrection 코드 발송
    """
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    
    # 🔒 [.env]에서 시스템 발송 계정 정보를 인양합니다. 
    SENDER_EMAIL = os.getenv("MAIL_SENDER")
    SENDER_PASSWORD = os.getenv("MAIL_PASSWORD")

    message = MIMEMultipart()
    message["From"] = f"Tetramegistus System <{SENDER_EMAIL}>"
    message["To"] = target_email
    message["Subject"] = "[Tetramegistus] Resurrection"

    html_body = f"""
    <html>
    <body style="margin: 0; padding: 0; background-color: #000000;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000; font-family: 'JetBrains Mono', 'Consolas', 'Courier New', monospace;">
            <tr>
                <td style="padding: 60px 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="border-left: 2px solid #1a1a1a;">
                        <tr>
                            <td style="padding-left: 25px; padding-bottom: 50px; font-size: 11px; color: #ffffff; letter-spacing: 1px;">
                                The cycle repeats; gateway opens.
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 0 60px 55px;">
                                <div style="font-size: 10px; color: #666666; letter-spacing: 2px; margin-bottom: 15px;">MASTER ACCESS CODE</div>
                                <div style="font-size: 20px; color: #7CFF9B; letter-spacing: 6px; font-weight: bold;">{code}</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-left: 35px; color: #444444; font-size: 9px; letter-spacing: 2px;">
                                SOURCE: RESURRECTION_PROTOCOL
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    message.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(message)
        return True
    except Exception as e:
        print(f"[MAIL ERROR]: {e}")
        return False
    
# app/core/auth/mailer.py

def send_breach_alert_email(attempted_password: str):
    """
    [Admin Alert]: 프라임 노드 침입 시도 경고 (동적 레이블 수복)
    """
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SENDER_EMAIL = os.getenv("MAIL_SENDER")
    SENDER_PASSWORD = os.getenv("MAIL_PASSWORD")
    ADMIN_RECEIVER = os.getenv("ADMIN_RECEIVER")

    # 🎭 [수복]: "PATH:"로 시작하는 경우 레이블을 'Access Path'로 변경
    is_path = attempted_password.startswith("PATH:")
    label = "Access Path" if is_path else "Attempted Password"
    display_val = attempted_password.replace("PATH:", "") if is_path else attempted_password

    message = MIMEMultipart()
    message["From"] = f"Tetramegistus Security <{SENDER_EMAIL}>"
    message["To"] = ADMIN_RECEIVER
    message["Subject"] = "💀 [SYSTEM ALERT] Prime Node Breach Attempt"

    html_body = f"""
    <html>
    <body style="margin: 0; padding: 0; background-color: #000000;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000; font-family: 'JetBrains Mono', monospace;">
            <tr>
                <td style="padding: 60px 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="border-left: 2px solid #ff4b4b;">
                        <tr>
                            <td style="padding-left: 25px; padding-bottom: 30px; font-size: 14px; color: #ff4b4b; letter-spacing: 2px; font-weight: bold;">
                                SECURITY BREACH ATTEMPT
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-left: 25px; padding-bottom: 40px; font-size: 11px; color: #aaaaaa; letter-spacing: 1px;">
                                {label}: <span style="color: #ff4b4b;">{display_val}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-left: 35px; font-size: 9px; color: #444444; letter-spacing: 2px;">
                                STATUS: FAILED_UNAUTHORIZED_ACCESS
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    message.attach(MIMEText(html_body, "html"))
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(message)
    except Exception as e:
        print(f"[MAIL ERROR - BREACH ALERT]: {e}")

def send_admin_login_success_email():
    """
    [Admin Alert]: 프라임 노드 접속 성공 알림
    """
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SENDER_EMAIL = os.getenv("MAIL_SENDER")
    SENDER_PASSWORD = os.getenv("MAIL_PASSWORD")
    ADMIN_RECEIVER = os.getenv("ADMIN_RECEIVER")

    message = MIMEMultipart()
    message["From"] = f"Tetramegistus Security <{SENDER_EMAIL}>"
    message["To"] = ADMIN_RECEIVER
    message["Subject"] = "✨ [SYSTEM INFO] Prime Node Login Success"

    html_body = f"""
    <html>
    <body style="margin: 0; padding: 0; background-color: #000000;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000; font-family: 'JetBrains Mono', monospace;">
            <tr>
                <td style="padding: 60px 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="border-left: 2px solid #7CFF9B;">
                        <tr>
                            <td style="padding-left: 25px; padding-bottom: 30px; font-size: 14px; color: #7CFF9B; letter-spacing: 2px; font-weight: bold;">
                                PRIME NODE ACCESSED
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-left: 25px; padding-bottom: 40px; font-size: 11px; color: #aaaaaa; letter-spacing: 1px;">
                                The core system has been accessed successfully.
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-left: 35px; font-size: 9px; color: #444444; letter-spacing: 2px;">
                                STATUS: LOGIN_SUCCESSFUL
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    message.attach(MIMEText(html_body, "html"))
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(message)
    except Exception as e:
        print(f"[MAIL ERROR - LOGIN SUCCESS]: {e}")

def send_inquiry_to_admin(user_email: str, category: str, content: str, image_files: list = None):
    """
    [Admin Alert]: 유저가 보낸 문의사항을 무조건 관리자(ADMIN_RECEIVER)에게 전송.
    """
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    
    SENDER_EMAIL = os.getenv("MAIL_SENDER")
    SENDER_PASSWORD = os.getenv("MAIL_PASSWORD")
    ADMIN_RECEIVER = os.getenv("ADMIN_RECEIVER") # 🚀 도착지는 무조건 관리자!

    message = MIMEMultipart()
    message["From"] = f"Tetramegistus System <{SENDER_EMAIL}>"
    message["To"] = ADMIN_RECEIVER # 🚀 관리자에게 쏜다!
    message["Reply-To"] = user_email # 🚀 관리자가 답장 누르면 유저 메일로 자동 연결!
    message["Subject"] = f"[Tetramegistus] {category} from a User"

    html_content = content.replace('\n', '<br>')
    
    html_body = f"""
    <html>
    <body style="margin: 0; padding: 0; background-color: #000000;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000; font-family: 'JetBrains Mono', monospace;">
            <tr>
                <td style="padding: 60px 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="border-left: 2px solid #7CFF9B;">
                        <tr>
                            <td style="padding-left: 25px; padding-bottom: 30px; font-size: 14px; color: #7CFF9B; letter-spacing: 2px; font-weight: bold;">
                                INCOMING TRANSMISSION (INQUIRY)
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-left: 25px; padding-bottom: 20px; font-size: 12px; color: #aaaaaa;">
                                <strong>Category:</strong> <span style="color: #fff;">{category}</span><br><br>
                                <strong>Sender (Reply-To):</strong> <span style="color: #03eafc;">{user_email}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-left: 25px; padding-bottom: 40px; font-size: 13px; color: #dddddd; line-height: 1.6;">
                                {html_content}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    message.attach(MIMEText(html_body, "html"))

    # 이미지 첨부 처리
    if image_files:
        for img_name, img_data in image_files:
            try:
                image_part = MIMEImage(img_data, name=img_name)
                message.attach(image_part)
            except Exception as e:
                print(f"[MAIL ATTACH ERROR]: {e}")

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(message)
        return True
    except Exception as e:
        print(f"[MAIL ERROR - INQUIRY]: {e}")
        return False