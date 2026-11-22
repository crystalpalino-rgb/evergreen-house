#!/usr/bin/env python3
"""Export Crystal's 2026-11-22 photographs into the slots the brief names.

Centre crop to the slot ratio, resize down only (never upscale), jpg plus webp.
Source files live in /home/team/shared/uploads/, output in public/images/.
"""
import os
from PIL import Image

UP = "/home/team/shared/uploads"
JPG_CAP = 350 * 1024
WEBP_CAP = 250 * 1024
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "images")

# (source, out name, target w, target h, jpg q, webp q)
JOBS = [
    ("vintage-christmas-banner-wide.png", "vintage-christmas-hero-v2", 2000, 667, 82, 80),
    ("stocking-men-banner-wide.png", "stocking-men-hero-v2", 2000, 667, 82, 80),
    ("stocking-teen-boys-banner-wide.png", "stocking-teen-boys-hero-v2", 2000, 667, 82, 80),
    ("stocking-teen-girls-banner-wide.png", "stocking-teen-girls-hero-v2", 2000, 667, 82, 80),
    ("timeless-bedroom-banner-wide.png", "timeless-bedroom-hero-v2", 2000, 667, 82, 80),
    ("vintage-christmas-edit-main.png", "vintage-christmas-card-v2", 1000, 1250, 82, 80),
    ("timeless-bedroom-edit-main.png", "timeless-bedroom-card-v2", 1000, 1250, 82, 80),
    ("stocking-men-edit-main.png", "stocking-men-card-v2", 1000, 1250, 82, 80),
    ("stocking-teen-boys-edit-main.png", "stocking-teen-boys-card-v2", 1000, 1250, 82, 80),
    ("stocking-teen-girls-edit-main.png", "stocking-teen-girls-card-v2", 1000, 1250, 82, 80),
]


def centre_crop(im, tw, th):
    target = tw / th
    w, h = im.size
    if w / h > target:  # too wide, trim sides
        nw = int(round(h * target))
        left = (w - nw) // 2
        return im.crop((left, 0, left + nw, h))
    nh = int(round(w / target))  # too tall, trim top and bottom
    top = (h - nh) // 2
    return im.crop((0, top, w, top + nh))


for src, name, tw, th, jq, wq in JOBS:
    im = Image.open(os.path.join(UP, src))
    im = im.convert("RGB")
    sw, sh = im.size
    if tw > sw or th > sh:
        raise SystemExit(f"refusing to upscale {src}: {sw}x{sh} -> {tw}x{th}")
    out = centre_crop(im, tw, th).resize((tw, th), Image.LANCZOS)
    jpg = os.path.join(OUT, name + ".jpg")
    webp = os.path.join(OUT, name + ".webp")
    # Step quality down until the file is inside its byte budget (jpg 350 KB,
    # webp 250 KB), so no slot ships over budget.
    q = jq
    while True:
        out.save(jpg, "JPEG", quality=q, optimize=True, progressive=True)
        if os.path.getsize(jpg) <= JPG_CAP or q <= 62:
            break
        q -= 2
    q = wq
    while True:
        out.save(webp, "WEBP", quality=q, method=6)
        if os.path.getsize(webp) <= WEBP_CAP or q <= 60:
            break
        q -= 2
    print(f"{name}.jpg {tw}x{th} {os.path.getsize(jpg)}B | {name}.webp {os.path.getsize(webp)}B  <- {src} {sw}x{sh}")
