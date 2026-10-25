#!/usr/bin/env python3
"""Fetch approved recent Instagram professional-account media into content-feed.json."""
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

TOKEN = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "").strip()
ACCOUNT_ID = os.environ.get("INSTAGRAM_ACCOUNT_ID", "").strip()
GRAPH_VERSION = os.environ.get("META_GRAPH_VERSION", "v23.0").strip()

if not TOKEN or not ACCOUNT_ID:
    sys.exit("Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID GitHub Actions secret.")

fields = "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url"
params = urllib.parse.urlencode({"fields": fields, "limit": 12, "access_token": TOKEN})
url = f"https://graph.facebook.com/{GRAPH_VERSION}/{urllib.parse.quote(ACCOUNT_ID)}/media?{params}"
request = urllib.request.Request(url, headers={"User-Agent": "HakkaBakkaWebsiteFeed/1.0"})
try:
    with urllib.request.urlopen(request, timeout=20) as response:
        data = json.loads(response.read().decode("utf-8"))
except Exception as exc:
    sys.exit(f"Instagram Graph API request failed: {exc}")

if data.get("error"):
    sys.exit("Instagram Graph API error: " + str(data["error"].get("message", "unknown error")))

posts = []
for item in data.get("data", []):
    media_type = str(item.get("media_type", "")).upper()
    image = item.get("media_url") if media_type in ("IMAGE", "CAROUSEL_ALBUM") else item.get("thumbnail_url")
    permalink = item.get("permalink", "")
    if not image or not str(image).startswith("https://") or not str(permalink).startswith("https://www.instagram.com/"):
        continue
    posts.append({
        "image": image,
        "permalink": permalink,
        "mediaType": "REEL" if media_type == "VIDEO" else media_type,
        "caption": str(item.get("caption", ""))[:120],
        "timestamp": item.get("timestamp", ""),
        "alt": "HakkaBakka Instagram update"
    })
    if len(posts) >= 6:
        break

if not posts:
    sys.exit("API returned no eligible media; existing website feed was not changed.")

payload = {
    "latestPosts": posts,
    "todaysSpecial": None,
    "chefSpecial": None,
    "offers": [],
    "announcements": [],
    "reels": [],
    "updatedAt": datetime.now(timezone.utc).isoformat()
}
with open("content-feed.json", "w", encoding="utf-8") as file:
    json.dump(payload, file, ensure_ascii=False, indent=2)
    file.write("\n")
print(f"Updated content-feed.json with {len(posts)} Instagram posts.")
