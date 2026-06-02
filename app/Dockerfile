# app/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# ─────────────────────────────
# Dependencies
# ─────────────────────────────

# 1. 먼저 requirements.txt 파일만 복사합니다. 
# (소스 코드가 바뀌어도 라이브러리가 그대로면 빌드 속도를 높이기 위함입니다)
COPY requirements.txt .

# 2. 복사된 파일을 읽어서 라이브러리를 설치합니다.
RUN pip install --no-cache-dir -r requirements.txt

# ─────────────────────────────
# App source
# ─────────────────────────────

# 3. 이제 나머지 소스 코드(main.py, gate 등)를 복사합니다.
COPY . /app

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]