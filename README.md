# Bluff Adda 🃏

A sleek, fast web application for playing the classic Bluff (Cheat / I Doubt It / Challenge) card game.

- **Bluff · One Device**: Pass-and-play around a physical table with privacy veil screens. Works offline on any browser.
- **Bluff · Own Phones**: Real-time multiplayer where everyone plays from their own phone using a 4-letter room code (backed by Vercel serverless + Upstash Redis).
- **Sandbox Mode**: Freely deal cards to practice or play custom house rules.

---

## Deployment Options

### Option 1: Deploy to Vercel (Recommended for Online Multiplayer)

1. Push this project to GitHub.
2. Go to [Vercel](https://vercel.com/new) and import the repository:
   - **Framework Preset**: Other
   - **Build Command**: None (leave empty)
   - **Output Directory**: `.` (root)
3. In your Vercel project dashboard:
   - Navigate to **Storage** (or Marketplace) -> Add **Upstash Redis**.
   - Connect it to your project (it automatically sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`).
4. Redeploy or trigger a build. Share your link with friends!

### Option 2: Deploy to GitHub Pages (Static Hosting)

1. In your GitHub repository settings, go to **Pages**.
2. Under **Build and deployment**, select **Deploy from a branch** -> branch `main` -> `/ (root)`.
3. Save. Your site will be live at `https://<username>.github.io/<repo-name>/`.
> **Note**: GitHub Pages supports **Bluff · One Device** and **Sandbox Mode** out of the box. For online multiplayer across different phones, connect to a Vercel backend.

---

## Local Development

Test locally with the Vercel CLI:
```bash
npm install -g vercel
vercel dev
```
Or open `index.html` directly in any web browser for local pass-and-play.
