# 🌿 CalmCampus

> An AI-powered student mental wellness platform designed to provide emotional support, mood tracking, journaling, and access to mental health resources in a safe, private, and accessible environment.

---

## 📖 Overview

Mental health challenges among university students are becoming increasingly common, yet many students hesitate to seek help because of stigma, limited access to counsellors, or lack of awareness.

CalmCampus aims to bridge this gap by combining artificial intelligence with modern web technologies to create a supportive digital companion that students can access anytime.

The platform provides secure authentication, AI-assisted conversations, mood tracking, journaling, and institutional support while allowing counsellors and administrators to manage resources effectively.

---

## ✨ Features

### 👤 Authentication

- Secure user registration
- Email verification
- Login with JWT Authentication
- HttpOnly Cookie Authentication
- Refresh Token Rotation
- Password Reset via Email
- Logout

---

### 😊 Mood Tracking

- Daily mood check-ins
- Mood history
- Mood trends
- Emotional insights

---

### 📖 Journal

- Private journal entries
- Secure storage
- Personal reflection history

---

### 🤖 AI Chat Assistant

- Empathetic conversations
- Emotional support
- Guided reflection
- Student-focused responses
- Context-aware interactions

---

### 📊 Dashboard

Students can view:

- Recent moods
- Journal activity
- AI conversations
- Personal wellness statistics

---

### 🏫 Institution Support

- Institution registration
- Institution management
- Student affiliation
- Counsellor assignment

---

### 👨‍💼 Admin Dashboard

- User management
- Institution management
- Platform oversight
- Analytics

---

## 🛠 Tech Stack

### Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Radix UI
- shadcn/ui

---

### Backend

- Django
- Django REST Framework
- SimpleJWT
- Python

---

### Database

- PostgreSQL

---

### AI

- Google Gemini API

---

### Authentication

- JWT
- Refresh Tokens
- HttpOnly Cookies

---

### Deployment

Frontend

- Vercel

Backend

- Render

---

### Email Service

- Resend

---

## 📂 Project Structure

```
CalmCampus
│
├── client/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── public/
│
├── server/
│   ├── auth_app/
│   ├── api/
│   ├── middleware/
│   ├── serializers/
│   ├── models/
│   └── settings.py
│
└── README.md
```

---

## 🔐 Authentication Flow

```
User
   │
   ▼
Login
   │
   ▼
Backend validates credentials
   │
   ▼
JWT Access Token generated
JWT Refresh Token generated
   │
   ▼
Stored as HttpOnly Cookies
   │
   ▼
Protected API Requests
   │
   ▼
Access Token expires
   │
   ▼
Refresh Token issues new Access Token
```

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/Emmanuelodey2/Calmcampus.git
```

```bash
cd Calmcampus
```

---

## Frontend Setup

```bash
cd client
```

Install dependencies

```bash
npm install
```

Create environment variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Run development server

```bash
npm run dev
```

---

## Backend Setup

Navigate to the backend

```bash
cd server
```

Create virtual environment

```bash
python -m venv venv
```

Activate virtual environment

Windows

```bash
venv\Scripts\activate
```

Mac/Linux

```bash
source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run migrations

```bash
python manage.py migrate
```

Create superuser

```bash
python manage.py createsuperuser
```

Run server

```bash
python manage.py runserver
```

---

## Environment Variables

### Backend

```env
SECRET_KEY=

DEBUG=True

DATABASE_URL=

ALLOWED_HOSTS=

FRONTEND_BASE_URL=

GEMINI_API_KEY=

RESEND_API_KEY=

DEFAULT_FROM_EMAIL=

AUTH_COOKIE_SECURE=False

AUTH_COOKIE_SAMESITE=Lax
```

---

### Frontend

```env
NEXT_PUBLIC_API_URL=
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/signup/` | Register |
| POST | `/api/auth/login/` | Login |
| POST | `/api/auth/logout/` | Logout |
| POST | `/api/auth/verify-email/` | Verify Email |
| POST | `/api/auth/request-password-reset/` | Request Password Reset |
| POST | `/api/auth/reset-password/` | Reset Password |

---

## Security

- JWT Authentication
- Refresh Tokens
- HttpOnly Cookies
- Password Hashing
- Email Verification
- Password Reset Tokens
- Protected API Routes
- CORS Configuration
- CSRF Protection where applicable

---

## Future Improvements

- Voice conversations with AI
- Emotion detection
- AI-powered wellness recommendations
- Appointment booking with counsellors
- Crisis support resources
- Anonymous community discussions
- Mobile application
- Push notifications
- Analytics dashboard
- Machine learning for personalized wellness insights

---

## Screenshots

> Screenshots coming soon.

---

## License

This project is licensed under the MIT License.

---

## Author

**Emmanuel Odey**

Computer Science Student | Full Stack Developer

GitHub: https://github.com/Emmanuelodey2

---

## Acknowledgements

- Django
- Django REST Framework
- Next.js
- React
- PostgreSQL
- Tailwind CSS
- Radix UI
- shadcn/ui
- Google Gemini
- Resend
- Vercel
- Render
