import os
import io
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
from groq import Groq
from dotenv import load_dotenv

# 1. Load API Keys
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI()

# 2. Critical: CORS Middleware
# This allows your frontend (Live Server) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Simple In-Memory Database
# In a real app, you'd use PostgreSQL or MongoDB
users_db = {}

@app.post("/login")
async def login(username: str = Form(...)):
    # Initialize user if they don't exist
    if username not in users_db:
        users_db[username] = {
            "tokens": 100, 
            "context": ""  # This stores the PDF text
        }
    return {"username": username, "tokens": users_db[username]["tokens"]}

@app.post("/upload")
async def upload(username: str = Form(...), file: UploadFile = File(...)):
    if username not in users_db:
        raise HTTPException(status_code=404, detail="User not identified")
    
    try:
        # Read the PDF
        content = await file.read()
        pdf_reader = PdfReader(io.BytesIO(content))
        
        # Extract text from all pages
        full_text = ""
        for page in pdf_reader.pages:
            full_text += page.extract_text() + " "
        
        # Store context (capped to stay within LLM limits)
        users_db[username]["context"] = full_text[:10000] 
        return {"message": "Neural context initialized"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(username: str = Form(...), message: str = Form(...)):
    user = users_db.get(username)
    if not user:
        raise HTTPException(status_code=404, detail="User session expired")
    
    if user["tokens"] < 10:
        raise HTTPException(status_code=403, detail="Insufficient tokens")

    try:
        # Call Groq AI (Llama 3)
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system", 
                    "content": f"You are Sigma AI. Use this document context to answer: {user['context']}"
                },
                {"role": "user", "content": message}
            ]
        )
        
        # Deduct tokens and return response
        user["tokens"] -= 10
        ai_response = completion.choices[0].message.content
        
        return {
            "response": ai_response, 
            "tokens": user["tokens"]
        }
    except Exception as e:
        return {"response": "AI Core Error: " + str(e), "tokens": user["tokens"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)