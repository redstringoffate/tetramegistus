# 🌌 Tetramegistus

**Tetramegistus** is an open-source astrological engine that merges ancient astrological systems with modern cloud computing.

## 📜 Vision
This project aims to liberate astrological data from closed, "black-box" environments. We provide a transparent, verifiable engine where the underlying logic and calculations of astrological data—such as Sabian symbols—are fully open to the public and the community.

## 🛠️ Tech Stack
- **Engine**: Python, FastAPI
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Docker, Railway
- **UI/UX**: Glassmorphism, Custom CSS Grids

## ⚖️ Core Modules
- **Nigredo**: Natal Chart rendering
- **Albedo**: Composite and Davison charts
- **Grimoire **: A sophisticated system for manifesting astrological data into PDF and Excel formats.

## 🚀 How to Manifest (Deployment)
This project is containerized for seamless deployment.

1. **Environment Setup**: Create a `.env` file and configure the following variables:
   ```text
   DATABASE_URL=your_postgresql_url
   ADMIN_EMAIL=admin@tetramegistus.com
   OTP_SECRET=your_otp_secret

2. Docker Build:
  docker build -t tetramegistus .
  docker run -p 8000:8000 tetramegistus

⚖️ Ethics & Transparency
Tetramegistus stands against the monopolization of knowledge. All source code is transparently available for anyone to audit and contribute. We encourage community growth but strictly oppose the use of this engine for commercial exploitation that distorts the essence of astrology.

Created by Redstringoffate
2. 
