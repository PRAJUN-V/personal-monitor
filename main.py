from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

app = FastAPI()

templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse(
        request=request, 
        name="index.html", 
        context={"title": "Personal Monitor", "message": "Welcome to your FastAPI dashboard!"}
    )

@app.get("/api")
async def api_root():
    return {"message": "Hello World"}
