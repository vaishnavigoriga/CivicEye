# Deploy CivicEye for free (MongoDB Atlas + Render)

Result: one public link such as `https://civiceye.onrender.com` serving the app and the API together. Allow about
30 minutes. Free-tier terms change, so confirm limits on the providers' pricing pages.

**How it works.** In production the backend also serves the built frontend (`frontend/dist`), so the site and API share
one origin. This is required because sessions use `SameSite=Lax` cookies. A split setup (for example Vercel for the
frontend and another host for the API) would break login.

## 1. Database: MongoDB Atlas (free M0)

1. Sign up at <https://www.mongodb.com/atlas> and create a **free (M0) cluster**. Pick a region near you.
2. **Database Access** → *Add New Database User* → username + a strong password (save it).
3. **Network Access** → *Add IP Address* → **Allow access from anywhere (`0.0.0.0/0`)**. Render's free tier does not
   have a fixed IP address, so this is needed. The database user's password is what protects it.
4. **Database** → *Connect* → *Drivers* → copy the connection string. It looks like
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`.
   Put your password in place of `<password>` and add the database name before the `?`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/civiceye?retryWrites=true&w=majority`.
   (If the password has special characters such as `@` or `#`, URL-encode them.)

## 2. Hosting: Render (free web service)

1. Make sure the code is on GitHub (it is: `vaishnavigoriga/CivicEye`).
2. Sign up at <https://render.com> with GitHub.
3. **New +** → **Blueprint** → select the `CivicEye` repository. Render reads [render.yaml](../render.yaml).
4. Render asks for the secret values:

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | the Atlas connection string from step 1.4 |
   | `ADMIN_EMAIL` | the email you will log in with as administrator |
   | `ADMIN_PASSWORD` | a strong passphrase, **12+ characters** |
   | `GEMINI_API_KEY` | your Gemini key (optional; leave empty for labelled simulated mode) |

   `JWT_SECRET` is generated for you. Demo data and conservative rate limits are already set in `render.yaml`.
5. Click **Apply / Create**. The first build takes roughly 5 to 10 minutes. When it finishes, Render shows your URL.

## 3. Check it

- Open `https://<your-service>.onrender.com/api/health`. It should say `"status":"healthy"` and `"database":"connected"`.
- Open the main URL. Register a citizen, then log in with your admin email in a private window to reach **Admin Console**.
- Put the link in your README, your hackathon submission and your video description.

## Free-tier things to know

- **Cold starts.** A free Render service sleeps after a period of inactivity and takes about 30 to 60 seconds to wake.
  Open the link a minute before showing it to anyone.
- **Uploaded files are temporary.** Photos, voice recordings and resolution evidence are stored on the server's disk,
  which is wiped on every redeploy and restart. Reports and users persist (they are in Atlas), but their images may
  disappear. Fine for a demo; for lasting use you would add cloud file storage.
- **Your Gemini key is spent by visitors.** Anyone can register and file reports. Limits in `render.yaml` help (5 new
  accounts per IP per hour, 10 AI calls per hour per user), but monitor usage, and rotate or remove the key after the
  event. Leaving `GEMINI_API_KEY` empty keeps the whole app free but in labelled simulated mode.
- **Public registration is open.** There is no email verification. Do not publish the admin password.

## Updating the live site

Push to GitHub: Render rebuilds and redeploys `main` automatically (`autoDeploy: true`). To change a secret, edit it in
Render → your service → *Environment*; it restarts.

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails on `tsc` or `vite` | Check the build log. The build command installs dev dependencies (`--include=dev`); keep that |
| `MONGO_URI is not set` / cannot connect | Check the string, that `0.0.0.0/0` is allowed in Atlas Network Access, and URL-encode special password characters |
| Admin login fails | `ADMIN_EMAIL` / `ADMIN_PASSWORD` must be set (password 12+ chars). The admin is created at startup only if that email does not exist yet |
| Blank page or 404 on refresh | The frontend must be built during deploy (see build command). Check the build log for the frontend step |
| Everything works, but AI says "AI analysis was not available" | Wrong or missing `GEMINI_API_KEY`, or the model name changed. Run `npm run ai:smoke` locally with the same key |
| Login works and then logs out | Make sure you opened the site over `https://` on the single Render URL, not an old copy elsewhere |

## Other free hosts

Any host that runs a Node 20 web service and lets you set environment variables works the same way (for example
Railway or Fly.io; their free allowances differ). Use the same build and start commands as `render.yaml`.
