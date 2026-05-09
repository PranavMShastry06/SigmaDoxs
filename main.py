from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import PyPDF2
from groq import Groq
import io
import os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()
print("ENV CHECK:")
print(os.getenv("GROQ_API_KEY"))
# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dynamic Users Database

users_db = {}

# GROQ CLIENT

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# MODELS

class LoginRequest(BaseModel):
    username: str
    password: str

class ChatRequest(BaseModel):
    username: str
    message: str
    context: str

# LOGIN

@app.post("/login")
async def login(req: LoginRequest):

    # AUTO CREATE USER
    # ANY USERNAME/PASSWORD ACCEPTED

    if req.username not in users_db:

        users_db[req.username] = {
            "password": req.password,
            "tokens": 100
        }

    return {
        "username": req.username,
        "tokens": users_db[req.username]["tokens"]
    }

# PDF UPLOAD

@app.post("/upload")
async def upload_pdf(
    username: str,
    file: UploadFile = File(...)
):

    if username not in users_db:

        users_db[username] = {
            "password": "",
            "tokens": 100
        }

    content = await file.read()

    pdf_reader = PyPDF2.PdfReader(
        io.BytesIO(content)
    )

    text = ""

    for page in pdf_reader.pages:

        extracted = page.extract_text()

        if extracted:
            text += extracted

    # AI SUMMARY

    completion = client.chat.completions.create(

        model="llama-3.1-8b-instant",

        messages=[
            {
                "role": "user",
                "content": f"Summarize this PDF:\n\n{text[:4000]}"
            }
        ]

    )

    summary = completion.choices[0].message.content

    return {
        "summary": summary,
        "full_text": text[:8000]
    }

# CHAT

@app.post("/chat")
async def chat(req: ChatRequest):

    if req.username not in users_db:

        users_db[req.username] = {
            "password": "",
            "tokens": 100
        }

    if users_db[req.username]["tokens"] <= 0:

        raise HTTPException(
            status_code=403,
            detail="Out of tokens"
        )

    # TOKEN DEDUCTION

    users_db[req.username]["tokens"] -= 1

    prompt = f"""
    Context:
    {req.context}

    Question:
    {req.message}
    """

    completion = client.chat.completions.create(

        model="llama-3.1-8b-instant",

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]

    )

    reply = completion.choices[0].message.content

    return {
        "reply": reply,
        "remaining_tokens": users_db[req.username]["tokens"]
    }

# RUN

if __name__ == "__main__":

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )