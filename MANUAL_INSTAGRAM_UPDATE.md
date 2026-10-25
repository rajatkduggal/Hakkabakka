# HakkaBakka: Manual Instagram homepage update (phone-friendly)

Use this publishing form on your phone. It updates **only** `content-feed.json`; it does not change the menu, design, prices, cart, or payment code.

## Open the update form

1. Open this link while signed in to GitHub: https://github.com/rajatkduggal/Hakkabakka/actions/workflows/publish-manual-instagram-post.yml
2. Tap **Run workflow**. If you do not see it immediately, open the workflow page and look for the **Run workflow** button.
3. Fill the four required fields:
   - **Image URL:** a direct, public HTTPS image URL. It must open the image itself, not an Instagram post page.
   - **Instagram URL:** the published post/Reel link, such as `https://www.instagram.com/p/POSTCODE/`.
   - **Caption:** short text to display on the homepage (up to 120 characters).
   - **Post type:** choose IMAGE, CAROUSEL_ALBUM, or REEL.
   - **Alt text:** optional short image description.
4. Tap **Run workflow** to publish.
5. Open the **Actions** tab and check the latest run. When it shows a green check, open https://www.hakkabakka.in/ and refresh. The website may take a few minutes to update; browser cache can last up to 15 minutes.

## Important image URL note

The image URL and Instagram post URL are different. Pasting the Instagram post URL into the Image URL field will not work. Use a stable, public direct image URL ending in an image format (for example .jpg or .png), or a public image-host URL that serves the image directly. Do not use temporary/private links.

## What this does

- Adds the new post to the top of `latestPosts`.
- Keeps up to the six newest posts.
- Prevents the same Instagram permalink from being duplicated.
- Preserves the other content-feed fields.
- Commits only `content-feed.json`; no site design, menu, prices, cart, or payment files are changed.
- Uses GitHub Actions permissions, so no GitHub token or Instagram API secret is placed in the public website.

If you have trouble finding a direct image URL, send the image and Instagram post link for help before publishing.
