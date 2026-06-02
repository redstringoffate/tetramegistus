# 1. 빠르고 가벼운 파이썬 3.11 슬림 이미지 사용
FROM python:3.11-slim

# 2. 시스템 환경 변수 설정 (파이썬 출력 버퍼링 방지)
ENV PYTHONUNBUFFERED=1

# 🔥 [수복] WeasyPrint가 그리모아 PDF 연성에 필요한 리눅스 그래픽 핵심 부품들 강제 설치
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# 3. 캡슐 내부의 작업 폴더 지정
WORKDIR /code

# 4. 의존성 라이브러리 목록 복사 및 설치
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 5. 앱 소스코드 전체 복사
COPY ./app /code/app

# 6. 클라우드(Railway) 환경에 맞춰 서버 가동
# Railway가 주는 PORT 환경변수를 유동적으로 받아서 실행합니다.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

# Force rebuild