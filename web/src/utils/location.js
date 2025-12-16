export function geolocationErrorToMessage(err) {
  const code = err?.code;

  if (code === 'insecure_context') {
    return 'Location requires a secure connection (HTTPS).';
  }

  if (code === 'not_supported') {
    return 'Geolocation is not supported on this device/browser.';
  }

  if (typeof code === 'number') {
    if (code === 1) return 'Location permission was denied. If you already allowed it in Safari, also check macOS System Settings → Privacy & Security → Location Services → Safari Websites (must be ON), then reload and try again.';
    if (code === 2) return 'Location is unavailable. Please check GPS / network and try again.';
    if (code === 3) return 'Location request timed out. Please try again.';
  }

  return 'Unable to get your location. Please enable location services or enter manually.';
}

function getCapacitorGeolocationPlugin() {
  const cap = typeof window !== 'undefined' ? window.Capacitor : null;
  const plugins = cap?.Plugins || cap?.plugins || null;
  return plugins?.Geolocation || null;
}

function normalizeGeolocationError(err) {
  const code = err?.code;
  if (typeof code === 'number') return err;

  const msg = String(err?.message || '').toLowerCase();
  if (msg.includes('permission') && msg.includes('denied')) {
    return { ...err, code: 1 };
  }
  if (msg.includes('timeout')) {
    return { ...err, code: 3 };
  }
  return { ...err, code: 2 };
}

async function reverseGeocodeNominatim(lat, lng, timeoutMs) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
    const resp = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller?.signal,
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const addr = data?.address || {};

    return (
      addr.suburb ||
      addr.neighbourhood ||
      addr.village ||
      addr.town ||
      addr.city ||
      addr.county ||
      data?.display_name ||
      null
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function detectCurrentLocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeoutMs = 15000,
    maximumAgeMs = 0,
    reverseGeocode = true,
    reverseGeocodeTimeoutMs = 8000,
  } = options;

  if (typeof window === 'undefined') {
    throw new Error('Location not available');
  }

  const capGeo = getCapacitorGeolocationPlugin();

  // Browser geolocation generally requires a secure context (HTTPS), but
  // Capacitor provides native geolocation even when the webview origin is not
  // considered a secure context.
  if (!capGeo && typeof window.isSecureContext === 'boolean' && !window.isSecureContext) {
    const e = new Error('Insecure context');
    e.code = 'insecure_context';
    throw e;
  }

  if (!('geolocation' in navigator)) {
    if (!capGeo) {
      const e = new Error('Geolocation not supported');
      e.code = 'not_supported';
      throw e;
    }
  }

  let coords;
  if (capGeo?.getCurrentPosition) {
    try {
      const perm = capGeo.checkPermissions ? await capGeo.checkPermissions() : null;
      if (perm?.location === 'denied' || perm?.coarseLocation === 'denied') {
        const e = new Error('Permission denied');
        e.code = 1;
        throw e;
      }
      if (perm?.location === 'prompt' || perm?.coarseLocation === 'prompt') {
        await capGeo.requestPermissions();
      }

      const pos = await capGeo.getCurrentPosition({ enableHighAccuracy, timeout: timeoutMs });
      coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
    } catch (e) {
      throw normalizeGeolocationError(e);
    }
  } else {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy,
        timeout: timeoutMs,
        maximumAge: maximumAgeMs,
      });
    });

    coords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
  }

  let placeName = null;
  if (reverseGeocode) {
    try {
      placeName = await reverseGeocodeNominatim(coords.lat, coords.lng, reverseGeocodeTimeoutMs);
    } catch (e) {
      placeName = null;
    }
  }

  return { coords, placeName };
}
