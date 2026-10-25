# HakkaBakka: Manual Instagram website updates (mobile-friendly)

This workflow updates **only** `content-feed.json`. It does not change the website design, menu, prices, cart, payment code, or Instagram account.

## Every time you want to add Instagram posts

1. Publish the post on Instagram (or use a post that is already published).
2. Copy the public Instagram post/reel link. It should start with `https://www.instagram.com/`.
3. Get the image's direct HTTPS URL. It must be a direct image URL, not a normal Instagram page URL. If you do not have one, send the image in ChatGPT and ask for help preparing a hosted image link; do not use a temporary/private link.
4. Open this file on your phone: https://github.com/rajatkduggal/Hakkabakka/blob/main/content-feed.json
5. Tap the pencil **Edit this file** (sign in to GitHub if asked).
6. Replace the JSON content with the template below, filling in the values. Keep the JSON punctuation and double quotes.
7. Scroll down to **Commit changes**, enter a short message such as `Add latest Instagram post`, and commit directly to `main`.
8. Wait for GitHub Pages to publish, then open https://www.hakkabakka.in/ and refresh. Check **Latest from HakkaBakka**.

## One-post template

Replace the example values; do not leave placeholders:

```json
{
  "latestPosts": [
    {
      "image": "https://YOUR-DIRECT-IMAGE-URL.jpg",
      "permalink": "https://www.instagram.com/p/YOUR_POST_CODE/",
      "mediaType": "IMAGE",
      "caption": "Your approved caption excerpt",
      "timestamp": "2026-10-25T10:00:00Z",
      "alt": "Short description of the Instagram post"
    }
  ],
  "todaysSpecial": null,
  "chefSpecial": null,
  "offers": [],
  "announcements": [],
  "reels": []
}
```

- `image`: direct HTTPS image URL. The homepage will not show a regular Instagram page URL as an image.
- `permalink`: the real published Instagram post/reel URL.
- `mediaType`: use `IMAGE`, `CAROUSEL_ALBUM`, or `REEL`.
- `caption`: short excerpt (the website displays up to 120 characters).
- `timestamp`: use the actual post date/time in ISO format.
- `alt`: short accessible image description.

## Multiple posts

Add more objects inside the `latestPosts` array separated by commas. Keep the newest post first. The homepage shows up to six.

## Safety notes

- Never put passwords, access tokens, private customer information, or payment details in this file.
- Do not change other website files for a routine post update.
- If you cannot obtain a direct image URL, do not guess one. Send the post image and its public Instagram link for help.
- If the page shows old content, refresh after a few minutes; browser cache can last up to 15 minutes.
