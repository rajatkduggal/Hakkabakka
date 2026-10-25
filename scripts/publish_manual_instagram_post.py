#!/usr/bin/env python3
"""Safely publish one manually supplied Instagram post into content-feed.json."""
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

path = Path("content-feed.json")
try:
    payload = json.loads(path.read_text(encoding="utf-8"))
except Exception as exc:
    print(f"Cannot read content-feed.json: {exc}", file=sys.stderr)
    raise SystemExit(1)

image = os.environ.get("POST_IMAGE_URL", "").strip()
permalink = os.environ.get("POST_PERMALINK", "").strip()
caption = os.environ.get("POST_CAPTION", "").strip()
media_type = os.environ.get("POST_MEDIA_TYPE", "IMAGE").strip().upper()
alt = os.environ.get("POST_ALT", "").strip()

def valid_https(url):
    try:
        p = urlparse(url)
        return p.scheme == "https" and bool(p.netloc)
    except Exception:
        return False

if not valid_https(image):
    raise SystemExit("Image URL must be a direct, public HTTPS image URL.")
if not valid_https(permalink) or urlparse(permalink).hostname not in ("instagram.com", "www.instagram.com"):
    raise SystemExit("Instagram URL must be a public https://www.instagram.com/... link.")
if media_type not in ("IMAGE", "CAROUSEL_ALBUM", "REEL"):
    raise SystemExit("Media type must be IMAGE, CAROUSEL_ALBUM, or REEL.")
if not caption:
    raise SystemExit("Caption cannot be empty.")

posts = payload.get("latestPosts")
if not isinstance(posts, list):
    posts = []
posts = [p for p in posts if isinstance(p, dict) and p.get("permalink") != permalink]
post = {
    "image": image,
    "permalink": permalink,
    "mediaType": media_type,
    "caption": caption[:120],
    "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "alt": (alt or "HakkaBakka Instagram post")[:180],
}
payload["latestPosts"] = [post] + posts
payload["latestPosts"] = payload["latestPosts"][:6]
payload.setdefault("todaysSpecial", None)
payload.setdefault("chefSpecial", None)
payload.setdefault("offers", [])
payload.setdefault("announcements", [])
payload.setdefault("reels", [])
path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Published post to content-feed.json; {len(payload['latestPosts'])} post(s) retained.")
