# book-away Speech Worker

Stateless Cloudflare Worker that proxies audio to **Google Cloud Speech-to-Text V2 API** and returns the transcript. Used by the Vercel-hosted Next.js frontend for high-accuracy, Norwegian-capable voice transcription.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) | 3.x |
| Google Cloud account | — |
| Cloudflare account | — |

---

## 1. Google Cloud Setup

1. Create (or select) a GCP project at https://console.cloud.google.com
2. Enable the **Cloud Speech-to-Text API**:
   ```
   https://console.cloud.google.com/apis/library/speech.googleapis.com
   ```
3. Create an **API key** (Credentials → Create Credentials → API key)
   - Restrict it to the **Cloud Speech-to-Text API** for security
4. Note down your **Project ID** (top of the GCP console)

---

## 2. Cloudflare Setup

```bash
# Install dependencies
cd cloudflare-worker
npm install

# Login to Cloudflare
npx wrangler login
```

### Set secrets (run once)

```bash
# Your Google Cloud API key
npx wrangler secret put GOOGLE_SPEECH_API_KEY

# Your GCP project ID (e.g. "my-project-123456")
npx wrangler secret put GOOGLE_CLOUD_PROJECT_ID

# A strong random secret shared with Vercel
# Generate one: openssl rand -hex 32
npx wrangler secret put WORKER_API_KEY

# Your Vercel production URL (for CORS)
# e.g. https://book-away.vercel.app
# Use * only for local dev
npx wrangler secret put ALLOWED_ORIGIN
```

---

## 3. Deploy

```bash
npm run deploy
```

Note the deployed URL (e.g. `https://book-away-speech.<your-subdomain>.workers.dev`) — you will need it for Vercel.

---

## 4. Vercel Environment Variables

Add these in your Vercel project dashboard (Settings → Environment Variables):

| Variable | Value |
|---|---|
| `CLOUDFLARE_WORKER_URL` | `https://book-away-speech.<subdomain>.workers.dev` |
| `CLOUDFLARE_WORKER_API_KEY` | Same value you set as `WORKER_API_KEY` in Cloudflare |

---

## 5. Local Development

```bash
# Start worker locally (uses .dev.vars for secrets)
npm run dev
```

Create a `.dev.vars` file (gitignored):
```
GOOGLE_SPEECH_API_KEY=your_key_here
GOOGLE_CLOUD_PROJECT_ID=your_project_id
WORKER_API_KEY=local_dev_secret
ALLOWED_ORIGIN=http://localhost:3000
```

In your Next.js `.env.local`:
```
CLOUDFLARE_WORKER_URL=http://localhost:8787
CLOUDFLARE_WORKER_API_KEY=local_dev_secret
```

---

## Supported Languages

Pass `language` field in the form-data:

| Code | Language |
|---|---|
| `nb-NO` | Norwegian Bokmål |
| `nn-NO` | Norwegian Nynorsk |
| `en-US` | English (US) |
| `en-GB` | English (UK) |

---

## API Reference

**POST** `/`

| Field | Type | Description |
|---|---|---|
| `audio` | `File` | Audio file (WebM/Opus, MP4, WAV — auto-detected) |
| `language` | `string` | BCP-47 language code (default: `en-US`) |

**Headers:**
- `Authorization: Bearer <WORKER_API_KEY>`

**Response:**
```json
{ "transcript": "transcribed text here" }
```

