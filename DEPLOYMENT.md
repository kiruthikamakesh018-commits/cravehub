# Deployment

## MongoDB Atlas
Create a cluster, database user and allow network access. Put the connection string in backend/.env.

## Backend
Deploy the `backend` folder to a Node-compatible host. Set:
MONGO_URI
JWT_SECRET
PORT (if required by host)

## Frontend
Deploy the `frontend` folder to a static/Vite-compatible host. Set:
VITE_API_URL=https://YOUR-BACKEND-URL/api

Then run `npm run build` for the production build.
