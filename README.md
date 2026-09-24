# Food Ordering System

Full-stack food ordering website using React, Bootstrap, Node.js, Express, MongoDB and JWT.

## Setup

### Backend
cd backend
npm install
Create `.env` from `.env.example`
npm run dev

Backend: http://localhost:5000

### Frontend
cd frontend
npm install
npm run dev

Frontend: http://localhost:5173

## MongoDB
Put your MongoDB Atlas connection string in backend/.env as MONGO_URI.

## Demo admin
Register a normal account first, then change its role to `admin` in MongoDB Atlas, or use the seed endpoint described below.

POST http://localhost:5000/api/auth/seed-admin
Body:
{"name":"Admin","email":"admin@example.com","password":"Admin@123"}

The endpoint creates the admin if it does not exist.
