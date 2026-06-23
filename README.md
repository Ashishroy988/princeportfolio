# Prince Yadav Portfolio

A professional dark-theme MERN portfolio for a video editor.

## Run Locally

```bash
npm run install:all
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

## MongoDB

Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.
The contact form and admin portfolio edits save to MongoDB when it is connected.
In production, `MONGODB_URI` is required for admin text, video, photo, and resume changes to stay after a restart or redeploy.

## Admin Login

Set these in `server/.env` before sharing the admin page:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password
ADMIN_TOKEN_SECRET=change-this-long-random-secret
```


Open `http://localhost:5173/admin` to login and manage the portfolio.

For videos, photos, and resume files: upload the file in Cloudinary first, copy the Cloudinary URL, then paste that URL in the admin panel.
