# SETU AI — PRODUCTION DEPLOYMENT GUIDE

## 1. Environment Configuration

### Required Environment Variables (`server/.env`)
```ini
PORT=5000
NODE_ENV=production
CLIENT_URL=https://setu-ai.vercel.app
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/setu_ai?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-production-jwt-key-min-32-chars
GEMINI_API_KEY=your-production-google-gemini-api-key
DEMO_MODE=false
```

---

## 2. Production Build Verification

### Backend Verification:
```bash
cd server
npm install --production=false
npm run build      # Verifies TypeScript compilation with zero errors
npm test           # Executes 80-case automated test suite
npm start          # Boots Express production server on PORT
```

### Frontend Verification:
```bash
cd client
npm install
npm run build      # Produces code-split production bundle in dist/
npm run preview    # Previews production static asset build
```

---

## 3. Recommended Production Topologies
* **Backend API**: Render, Railway, AWS ECS / App Runner, or Google Cloud Run.
* **Frontend Web App**: Vercel, Netlify, or Cloudflare Pages.
* **Database**: MongoDB Atlas M10+ with Vector Search index enabled on `embedding` (768-dim cosine).
