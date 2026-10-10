from fastapi import FastAPI

app = FastAPI(
    title="FAIRWAY IQ API",
    description="AI-Powered Golf Analytics Platform",
    version="0.1.0"
)

@app.get("/")
def home():
    return {
        "message": "Welcome to FAIRWAY IQ",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }