# Mappls GPS Address Autofill

The delivery checkout uses the existing Cloudflare Worker `hakkabakka-platform-api` at:

`GET /api/location/reverse?lat=<latitude>&lon=<longitude>`

The Worker calls the Mappls Reverse Geocoding REST API server-side using the Cloudflare secret `MAPPLS_API_KEY`. The Static Key must never be added to GitHub or browser JavaScript.

The platform Worker retains the existing `GEOAPIFY_API_KEY` fallback for older clients. Mappls is used first when `MAPPLS_API_KEY` is configured.

The checkout button requests browser GPS permission, fills the delivery address and PIN code when returned, and asks the customer to verify the address and add any missing flat/house details.

Mappls API allocation must be Active in the Mappls Console, and the key's restrictions must permit the server-side request.