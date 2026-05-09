from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import PyPDF2
from groq import Groq
import io

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Database
users_db = {"testuser": {"password": "password123", "tokens": 100}}
client = Groq(api_key="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")

class LoginRequest(BaseModel):
    username: str
    password: str

class ChatRequest(BaseModel):
    username: str
    message: str
    context: str

@app.post("/login")
async def login(req: LoginRequest):
    user = users_db.get(req.username)
    if user and user["password"] == req.password:
        return {"username": req.username, "tokens": user["tokens"]}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/upload")
async def upload_pdf(username: str, file: UploadFile = File(...)):
    if username not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    content = await file.read()
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
    text = "".join([page.extract_text() for page in pdf_reader.pages])
    
    # Generate Summary
    completion = client.chat.completions.create(
    model="llama-3.1-8b-instant",  # Updated model name
    messages=[{"role": "user", "content": f"Summarize this: {text[:4000]}"}]
)
    summary = completion.choices[0].message.content
    return {"summary": summary, "full_text": text[:8000]} # Truncated for demo

@app.post("/chat")
async def chat(req: ChatRequest):
    user = users_db.get(req.username)
    if user["tokens"] <= 0:
        raise HTTPException(status_code=403, detail="Out of tokens")
    
    # Deduct token
    users_db[req.username]["tokens"] -= 1
    
    prompt = f"Context: {req.context}\n\nQuestion: {req.message}"
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {
        "reply": completion.choices[0].message.content,
        "remaining_tokens": users_db[req.username]["tokens"]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)