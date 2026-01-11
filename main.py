from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import torch

from model_loader import load_model, preprocess_image

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once
MODEL_PATH = "./model/hybrid_lesion_best.pth"
model = load_model(MODEL_PATH)

CLASSES = [
    "AKIEC","BCC","BEN_OTH","BKL","DF","INF",
    "MAL_OTH","MEL","NV","SCCKA","VASC"
]

@app.get("/")
def home():
    return {"status": "running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    img_bytes = await file.read()
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    tensor_img = preprocess_image(image)

    with torch.no_grad():
        outputs = model(tensor_img)
        probs = torch.softmax(outputs, dim=1)
        conf, pred = torch.max(probs, dim=1)

    return {
        "class_name": CLASSES[pred.item()],
        "confidence": float(conf.item())
    }
