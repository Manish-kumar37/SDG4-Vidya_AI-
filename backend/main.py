"""
main.py — Vidya AI backend.

A small FastAPI service that:
1. Takes a student's profile (learning style, level, language, bandwidth)
2. Builds an adaptive system prompt via prompt_builder.py
3. Calls an LLM (IBM watsonx.ai Granite, or Groq as a fallback)
4. Returns the tutor's reply

Deployed on Render as a standalone Python web service. The Next.js frontend
(deployed separately on Vercel) calls this over HTTPS.
"""

import os
import time
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

from prompt_builder import build_system_prompt, build_evaluation_note

load_dotenv()

app = FastAPI(title="Vidya AI Backend")
import os

print("RUNNING FILE:", __file__)
@app.get("/debug")
def debug():
    return {
        "file": __file__,
        "cwd": os.getcwd(),
    }
# ---- CORS ----
# Allow your deployed frontend + local dev. Add your real Vercel URL once you
# have it (or set ALLOWED_ORIGINS as a comma-separated env var on Render).
default_origins = [
    "http://localhost:3000",
    "https://sdg-4-vidya-ai.vercel.app",
]
env_origins = os.environ.get("ALLOWED_ORIGINS", "")
allowed_origins = default_origins + [o.strip() for o in env_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Turn(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class TutorRequest(BaseModel):
    message: str
    style: str = "reading_writing"
    level: str = "beginner"
    language: str = "en"
    lowBandwidth: bool = False
    lastAnswerCorrect: Optional[bool] = None
    history: list[Turn] = []


# ---- IBM watsonx.ai (Granite) ----
_watsonx_token_cache = {"token": None, "expires_at": 0}


def get_watsonx_token(api_key: str) -> str:
    now = time.time()
    if _watsonx_token_cache["token"] and _watsonx_token_cache["expires_at"] > now:
        return _watsonx_token_cache["token"]

    res = requests.post(
        "https://iam.cloud.ibm.com/identity/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": api_key,
        },
        timeout=20,
    )
    if not res.ok:
        raise RuntimeError(f"Failed to get IBM IAM token: {res.text}")
    data = res.json()
    _watsonx_token_cache["token"] = data["access_token"]
    _watsonx_token_cache["expires_at"] = now + data.get("expires_in", 3600) - 60
    return data["access_token"]


def call_watsonx(system_prompt: str, history: list, user_message: str) -> str:
    api_key = os.environ["WATSONX_API_KEY"]
    project_id = os.environ["WATSONX_PROJECT_ID"]
    base_url = os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
    model_id = os.environ.get("WATSONX_MODEL_ID", "ibm/granite-3-3-8b-instruct")

    token = get_watsonx_token(api_key)

    prompt_parts = [f"<|system|>\n{system_prompt}"]
    for turn in history:
        tag = "user" if turn.role == "user" else "assistant"
        prompt_parts.append(f"<|{tag}|>\n{turn.content}")
    prompt_parts.append(f"<|user|>\n{user_message}")
    prompt_parts.append("<|assistant|>\n")
    prompt = "\n".join(prompt_parts)

    res = requests.post(
        f"{base_url}/ml/v1/text/generation?version=2023-05-29",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
        json={
            "model_id": model_id,
            "project_id": project_id,
            "input": prompt,
            "parameters": {
                "decoding_method": "greedy",
                "max_new_tokens": 700,
                "temperature": 0.6,
                "repetition_penalty": 1.1,
            },
        },
        timeout=60,
    )
    if not res.ok:
        raise RuntimeError(f"watsonx error: {res.text}")
    data = res.json()
    return data["results"][0]["generated_text"].strip()


# ---- Groq fallback (OpenAI-compatible, free tier, easy to demo) ----
def call_groq(system_prompt: str, history: list, user_message: str) -> str:
    api_key = os.environ["GROQ_API_KEY"]
    model = os.environ.get("GROQ_MODEL_ID", "llama-3.3-70b-versatile")

    messages = [{"role": "system", "content": system_prompt}]
    for turn in history:
        role = "user" if turn.role == "user" else "assistant"
        messages.append({"role": role, "content": turn.content})
    messages.append({"role": "user", "content": user_message})

    res = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        json={"model": model, "messages": messages, "temperature": 0.6, "max_tokens": 700},
        timeout=60,
    )
    if not res.ok:
        raise RuntimeError(f"Groq error: {res.text}")
    data = res.json()
    return data["choices"][0]["message"]["content"].strip()


@app.get("/")
def health():
    return {"status": "ok", "service": "vidya-ai-backend"}


@app.get("/api/image-search")
def image_search(query: str):
    """Proxies Unsplash's free image API so students can pull real photos
    into their notebook without needing their own API key, and so the key
    itself never has to live in frontend code."""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Missing 'query'.")

    access_key = os.environ.get("UNSPLASH_ACCESS_KEY")
    if not access_key:
        raise HTTPException(
            status_code=500,
            detail="Image search isn't configured yet — add UNSPLASH_ACCESS_KEY in the backend's environment variables.",
        )

    res = requests.get(
        "https://api.unsplash.com/search/photos",
        params={"query": query, "per_page": 9, "orientation": "squarish"},
        headers={"Authorization": f"Client-ID {access_key}"},
        timeout=20,
    )
    if not res.ok:
        raise HTTPException(status_code=500, detail=f"Image search failed: {res.text}")

    data = res.json()
    results = [
        {
            "id": r["id"],
            "thumbUrl": r["urls"]["small"],
            "fullUrl": r["urls"]["regular"],
            "alt": r.get("alt_description") or query,
            "credit": r["user"]["name"],
            "creditUrl": r["user"]["links"]["html"],
        }
        for r in data.get("results", [])
    ]
    return {"results": results}


@app.post("/api/tutor")
def tutor(req: TutorRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Missing 'message'.")

    system_prompt = build_system_prompt(
        req.style, req.level, req.language, req.lowBandwidth
    )
    if req.lastAnswerCorrect is not None:
        system_prompt += f"\n\nSESSION NOTE: {build_evaluation_note(req.lastAnswerCorrect)}"

    provider = os.environ.get("LLM_PROVIDER", "watsonx")
    trimmed_history = req.history[-10:]

    try:
        if provider == "groq":
            reply = call_groq(system_prompt, trimmed_history, req.message)
        else:
            reply = call_watsonx(system_prompt, trimmed_history, req.message)
    except Exception as e:
        print(f"Tutor call failed: {e}")
        raise HTTPException(status_code=500, detail="The tutor couldn't respond right now. Check your API keys in Render's environment variables.")

    return {"reply": reply}
