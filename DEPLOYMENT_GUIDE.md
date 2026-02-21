# Deployment Guide: Sehat Safe

This guide explains how to deploy the **Frontend** (Vite + React) on **Vercel** and the **Backend** (Node.js + Express) on **Render**.

## Pre-Deployment Preparation (Already Done)
- Unused `.env.local` has been deleted, and `VITE_API_URL` was moved to the main `.env` file.
- The Backend's CORS configuration has been updated to accept requests from an environment variable (`FRONTEND_URL`), so it will work seamlessly once deployed.

---

## 🚀 Part 1: Deploy Backend on Render

1. Go to [Render](https://render.com/) and sign in.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Fill in the deployment settings:
    - **Name**: `sehat-safe-backend` (or similar)
    - **Root Directory**: `server` (Important: This tells Render to look inside the `server` folder).
    - **Environment**: `Node`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npm start`
5. Scroll down to **Advanced** -> **Environment Variables** and add the following from your local `server/.env` file:
    - `MONGODB_URI`: (Your production MongoDB URI, usually MongoDB Atlas, not localhost).
    - `GEMINI_API_KEY`: `AIzaSyDpVD4ak3AQczhEAW4EjJ3549iiE-UyLFQ`
    - `CREDENTIALS_SECRET`: `change_this_to_a_complex_secret_string`
    - `FRONTEND_URL`: Leave this blank for now, or put `*` temporarily. You will update this after you deploy the frontend.
6. Click **Create Web Service**. Wait for the build to finish.
7. **Copy your deployed Backend URL** (e.g., `https://sehat-safe-xyz.onrender.com`).

---

## 🚀 Part 2: Deploy Frontend on Vercel

1. Go to [Vercel](https://vercel.com/) and sign in.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Ensure the **Framework Preset** is set to **Vite**.
5. The **Root Directory** should be `./` (the main folder).
6. In **Environment Variables**, add the variables from your local `.env` file!
    - `VITE_FIREBASE_API_KEY`
    - `VITE_FIREBASE_AUTH_DOMAIN`
    - `VITE_FIREBASE_PROJECT_ID`
    - `VITE_FIREBASE_STORAGE_BUCKET`
    - `VITE_FIREBASE_MESSAGING_SENDER_ID`
    - `VITE_FIREBASE_APP_ID`
    - `VITE_FIREBASE_MEASUREMENT_ID`
    - **IMPORTANT**: Set `VITE_API_URL` to the **Render Backend URL** you copied in Part 1.
7. Click **Deploy** and wait for it to finish.
8. **Copy your deployed Frontend URL** (e.g., `https://sehat-safe.vercel.app`).

---

## 🔗 Part 3: Connecting Them Together

Now that both are deployed, you need to tell the backend to allow requests from the deployed frontend.

1. Go back to your **Render Web Service** dashboard.
2. Go to **Environment** settings.
3. Find or add the `FRONTEND_URL` environment variable.
4. Set its value to your **deployed Vercel URL** (e.g., `https://sehat-safe.vercel.app` - *do not include a trailing slash*).
5. Save changes. Render might automatically redeploy or restart the service to apply the new variable.

**Done! Your app should now be fully functional.**
