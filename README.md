# Vidya AI — An AI Tutor for Every Kind of Student

Built for the **IBM SkillsBuild × 1M1B × AICTE "AI for Sustainability"** virtual
internship. Topic: **UN SDG 4 — Quality Education**.

## The idea

Most AI tutoring demos are just a chatbot wrapped around a big LLM. Vidya is
built around one insight: **"quality education for all" fails on four axes at
once** — learning style, language, disability, and internet access — and a
single generic chatbot doesn't solve any of them. So Vidya is an agent that:

1. **Diagnoses** how a student learns (VARK model: Visual / Auditory /
   Reading-Writing / Kinesthetic) with a 60-second quiz.
2. **Re-shapes every explanation** to match that style, via a prompt-
   engineering "pedagogy engine" (`backend/prompt_builder.py`) — the same
   underlying model teaches very differently depending on the learner.
3. **Checks understanding** after every answer with one quick question, and
   **auto-adjusts difficulty** up or down based on the response.
4. **Removes access barriers**: replies in English, Hindi, or Gujarati; has a
   Low-Bandwidth Mode; a Dyslexia-friendly mode; a High-Contrast mode; and a
   built-in text-to-speech "Listen" button on every reply.
5. **Reports progress** in plain language a teacher or parent can download.
6. **My Notebook** — a drag-and-drop study page where a student writes
   notes, searches free stock photos (via Unsplash), drags them into place,
   and downloads the whole page as a PDF — a digital scrapbook for students
   without printers, magazines, or craft supplies.

The visual design carries the theme too: **Notebook mode** (paper, ink blue)
and **Slate mode** (chalkboard, high contrast) are two literal skins a
student can switch between — the two kinds of classrooms this project
is trying to bridge.

## Architecture — two separate deployments

This project is split into a **Python AI backend** (Render) and a **Next.js
frontend** (Vercel) that talks to it over HTTPS. This is deliberate, not just
a technical detail worth mentioning in your submission: it means the AI
agent is a standalone service that could be reused by any frontend (a mobile
app, a WhatsApp bot, another school's portal), not locked into one UI.

```
vidya-ai/
├── backend/                 # Python — deploy to Render
│   ├── main.py               # FastAPI app, the actual AI agent server
│   ├── prompt_builder.py     # pedagogy engine — adapts prompts per student
│   ├── requirements.txt
│   ├── render.yaml           # one-click Render blueprint
│   └── .env.example
│
└── frontend/                 # Next.js — deploy to Vercel
    ├── app/                   # pages, layout, styles
    ├── components/            # quiz, chat UI, dashboard
    └── .env.example
```

## Part 1 — Deploy the Python backend to Render

1. Push this whole repo to GitHub.
2. Go to https://render.com → **New +** → **Web Service** → connect your repo.
3. Render should detect `backend/render.yaml`. If it asks you to configure
   manually instead, set:
   - **Root directory**: `backend`
   - **Runtime**: Python 3
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (Render dashboard → Environment):

   **Option A — Groq (fastest to demo, free, no IBM setup)**
   ```
   LLM_PROVIDER=groq
   GROQ_API_KEY=your-groq-key       # from console.groq.com
   GROQ_MODEL_ID=llama-3.3-70b-versatile
   ```

   **Option B — IBM watsonx.ai + Granite (stronger tie-in to IBM SkillsBuild)**
   ```
   LLM_PROVIDER=watsonx
   WATSONX_API_KEY=your-ibm-cloud-api-key
   WATSONX_PROJECT_ID=your-watsonx-project-id
   WATSONX_URL=https://us-south.ml.cloud.ibm.com
   WATSONX_MODEL_ID=ibm/granite-3-3-8b-instruct
   ```

   **Optional — enables the Notebook's image search:**
   ```
   UNSPLASH_ACCESS_KEY=your-unsplash-key   # free at unsplash.com/developers
   ```

5. Once deployed, Render gives you a URL like
   `https://vidya-ai-backend.onrender.com`. Test it by visiting that URL —
   you should see `{"status": "ok", ...}`.

   > Free Render web services "sleep" after inactivity and take ~30-50
   > seconds to wake up on the first request. That's normal — just mention
   > it if you're live-demoing and the first message feels slow.

## Part 2 — Deploy the Next.js frontend to Vercel

1. In the same repo, go to vercel.com → **Add New Project** → import the
   repo, but set **Root Directory** to `frontend`.
2. Add one environment variable in Vercel:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://vidya-ai-backend.onrender.com
   ```
   (use your actual Render URL from Part 1, no trailing slash)
3. Deploy. Your frontend calls the Render backend for every tutor message.
4. Once you have your real Vercel URL, add it to `ALLOWED_ORIGINS` in
   Render's environment variables so the backend accepts requests from it,
   e.g. `ALLOWED_ORIGINS=https://your-project.vercel.app`.

## Running both locally

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# edit .env with your GROQ_API_KEY (or watsonx keys)
uvicorn main:app --reload --port 8000
```

**Frontend** (in a second terminal):
```bash
cd frontend
npm install
cp .env.example .env.local
# leave NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
npm run dev
```

Visit http://localhost:3000 — it will call your local FastAPI server at
http://localhost:8000.

## Ideas for extending this (good talking points for your submission deck)

- Add a teacher-facing view showing a whole class's diagnostic-style
  distribution.
- Add a small cache (e.g. Redis on Render) for common explanations, to cut
  API cost/latency for low-bandwidth users.
- Add speech-to-text input, not just text-to-speech output.
- Expand language support — `prompt_builder.py` treats language as one
  config value, so adding a language is a one-line change.
