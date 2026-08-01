"""
Local GPU hair try-on sidecar for Peluquería Nowi.

Uses Stable Diffusion inpainting on CUDA to edit the hair region.
Start:  .\\.venv\\Scripts\\python.exe -m uvicorn server:app --host 127.0.0.1 --port 7860
Health: GET http://127.0.0.1:7860/health
Edit:   POST http://127.0.0.1:7860/v1/edit  (multipart: image + hairstyle_slug|prompt)
"""

from __future__ import annotations

import io
import os
from functools import lru_cache
from typing import Optional

import numpy as np
import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image, ImageDraw, ImageFilter

APP_HOST = os.environ.get("LOCAL_HAIR_HOST", "127.0.0.1")
APP_PORT = int(os.environ.get("LOCAL_HAIR_PORT", "7860"))
MODEL_ID = os.environ.get(
    "LOCAL_HAIR_MODEL",
    # Public (non-gated) SD1.5 inpaint — good quality on RTX 3060 12GB.
    "runwayml/stable-diffusion-inpainting",
)
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

SLUG_PROMPTS = {
    "low-fade": (
        "professional barbershop portrait, clean low fade haircut, short tapered sides, "
        "neat top hair, photorealistic, natural lighting"
    ),
    "mid-fade": (
        "professional barbershop portrait, mid fade haircut, balanced contrast sides, "
        "textured top, photorealistic"
    ),
    "high-fade": (
        "professional barbershop portrait, high fade haircut, tight sides, "
        "strong contrast, short top, photorealistic"
    ),
    "french-crop": (
        "professional barbershop portrait, french crop haircut, textured fringe, "
        "short sides, photorealistic"
    ),
    "buzz-cut": (
        "professional barbershop portrait, even buzz cut, very short uniform hair, "
        "photorealistic scalp texture"
    ),
    "pompadour": (
        "professional barbershop portrait, classic pompadour hairstyle, volume on top, "
        "tapered sides, photorealistic"
    ),
    "slick-back": (
        "professional barbershop portrait, slicked back hairstyle, polished top, "
        "controlled sides, photorealistic"
    ),
    "curly-crop": (
        "professional barbershop portrait, curly crop haircut, natural curls on top, "
        "shaped fringe, photorealistic"
    ),
}

NEGATIVE = (
    "deformed face, extra limbs, bad anatomy, blurry, low quality, cartoon, anime, "
    "text, watermark, sunglasses, hat, helmet, wrong identity, plastic skin"
)

app = FastAPI(title="Nowi Local Hair Try-On", version="1.0.0")


def hair_mask(size: tuple[int, int]) -> Image.Image:
    """Soft crown mask: edit hair, preserve face/identity as much as possible."""
    w, h = size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    # Upper head ellipse — covers typical hair mass on a headshot.
    draw.ellipse(
        (int(w * 0.12), int(h * -0.05), int(w * 0.88), int(h * 0.52)),
        fill=255,
    )
    # Soften edges so the inpaint blends.
    return mask.filter(ImageFilter.GaussianBlur(radius=max(8, w // 40)))


@lru_cache(maxsize=1)
def get_pipe():
    from diffusers import StableDiffusionInpaintPipeline

    if DEVICE != "cuda":
        raise RuntimeError(
            "CUDA GPU required. This sidecar will not run a useful demo on CPU."
        )

    pipe = StableDiffusionInpaintPipeline.from_pretrained(
        MODEL_ID,
        torch_dtype=DTYPE,
        safety_checker=None,
        requires_safety_checker=False,
        token=False,  # avoid stale/invalid HF credentials causing 401s
    )
    pipe = pipe.to(DEVICE)
    pipe.enable_attention_slicing()
    try:
        pipe.enable_vae_slicing()
    except Exception:
        pass
    return pipe


@app.on_event("startup")
def warmup() -> None:
    # Fail fast on boot if GPU/model cannot load.
    print(f"[local-hair] device={DEVICE} model={MODEL_ID}")
    if DEVICE == "cuda":
        print(f"[local-hair] gpu={torch.cuda.get_device_name(0)}")
    get_pipe()
    print("[local-hair] pipeline ready")


@app.get("/health")
def health():
    ok = DEVICE == "cuda"
    return {
        "ok": ok,
        "device": DEVICE,
        "cuda": torch.cuda.is_available(),
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "model": MODEL_ID,
    }


@app.post("/v1/edit")
async def edit(
    image: UploadFile = File(...),
    hairstyle_slug: Optional[str] = Form(None),
    prompt: Optional[str] = Form(None),
    strength: float = Form(0.72),
    steps: int = Form(28),
    guidance: float = Form(7.0),
):
    if DEVICE != "cuda":
        raise HTTPException(503, "CUDA GPU required")

    raw = await image.read()
    if not raw:
        raise HTTPException(400, "empty image")

    try:
        src = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, f"invalid image: {exc}") from exc

    # Work at 512 for SD2 inpaint VRAM comfort on 3060.
    side = 512
    src = src.resize((side, side), Image.Resampling.LANCZOS)
    mask = hair_mask(src.size)

    slug = (hairstyle_slug or "").strip().lower()
    text = (prompt or "").strip() or SLUG_PROMPTS.get(
        slug,
        "professional barbershop portrait, stylish modern haircut, photorealistic",
    )
    # Keep identity cue in the prompt.
    full_prompt = (
        f"{text}, same person, preserve face identity, preserve skin tone, "
        "only change the hair"
    )

    pipe = get_pipe()
    generator = torch.Generator(device=DEVICE).manual_seed(
        abs(hash(slug or text)) % (2**31)
    )

    with torch.inference_mode():
        result = pipe(
            prompt=full_prompt,
            negative_prompt=NEGATIVE,
            image=src,
            mask_image=mask,
            num_inference_steps=int(np.clip(steps, 10, 50)),
            guidance_scale=float(np.clip(guidance, 1.0, 15.0)),
            strength=float(np.clip(strength, 0.35, 0.95)),
            generator=generator,
        ).images[0]

    buf = io.BytesIO()
    result.save(buf, format="JPEG", quality=92)
    return Response(content=buf.getvalue(), media_type="image/jpeg")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=APP_HOST, port=APP_PORT)
