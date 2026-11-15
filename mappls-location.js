(() => {
  "use strict";
  const API = "https://hb-orders-api.mail-marvelgroup.workers.dev";
  const button = document.getElementById("useCurrentLocation");
  const status = document.getElementById("mapplsLocationStatus");
  if (!button || !status) return;
  const setStatus = (message, kind) => { status.textContent = message; status.style.color = kind === "error" ? "#b00020" : kind === "success" ? "#16803c" : "#777"; };
  const digits = value => String(value || "").replace(/\D/g, "").slice(0, 6);
  button.addEventListener("click", () => {
    if (!navigator.geolocation) { setStatus("This device/browser does not support GPS location.", "error"); return; }
    button.disabled = true; button.textContent = "⏳ Detecting location…";
    setStatus("Please allow location access when your browser asks.", "info");
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const url = new URL(API + "/location/reverse-geocode");
        url.searchParams.set("lat", position.coords.latitude);
        url.searchParams.set("lng", position.coords.longitude);
        const response = await fetch(url.toString(), { method: "GET", cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success || !data.address) throw new Error(data?.message || "Could not find your address.");
        const a = data.address;
        const parts = [a.houseNumber, a.houseName, a.poi, a.street, a.subLocality, a.locality, a.village, a.city, a.district, a.state].filter(Boolean);
        const addressField = document.getElementById("address");
        const pinField = document.getElementById("pincode");
        addressField.value = String(a.formatted_address || "").trim() || [...new Set(parts)].join(", ");
        const pin = digits(a.pincode);
        if (pin) { pinField.value = pin; pinField.dispatchEvent(new Event("input", { bubbles: true })); }
        addressField.dispatchEvent(new Event("input", { bubbles: true }));
        addressField.dispatchEvent(new Event("change", { bubbles: true }));
        if (typeof window.saveCheckout === "function") window.saveCheckout();
        setStatus("✓ Address detected. Please check it and add flat/house details if needed.", "success");
      } catch (error) { setStatus(error.message || "Address lookup failed. Please enter address manually.", "error"); }
      finally { button.disabled = false; button.textContent = "📍 Use My Current Location"; }
    }, error => {
      const messages = { 1: "Location permission denied. Allow location access in browser settings.", 2: "Your location could not be determined. Turn on GPS and try again.", 3: "Location request timed out. Please try again." };
      setStatus(messages[error.code] || "Could not get your location.", "error");
      button.disabled = false; button.textContent = "📍 Use My Current Location";
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  });
})();
