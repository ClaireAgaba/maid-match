import { useEffect, useState } from 'react';
import { locationAPI } from '../services/api';

/**
 * useLiveLocationUpdater
 *
 * On mount, asks for browser geolocation and posts the current coordinates to
 * the appropriate backend endpoint based on user.user_type. Returns a simple
 * status string: 'idle' | 'updating' | 'ok' | 'error'.
 */
export function useLiveLocationUpdater(user) {
  const [status, setStatus] = useState('idle');
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [placeName, setPlaceName] = useState(null); // human-friendly label

  useEffect(() => {
    if (!user) return;
    if (!('geolocation' in navigator)) return;

    setStatus('updating');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nextCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setCoords(nextCoords);

        try {
          const payload = {
            current_latitude: nextCoords.lat,
            current_longitude: nextCoords.lng,
          };

          if (user.user_type === 'maid') {
            await locationAPI.updateMaid(payload);
          } else if (user.user_type === 'homeowner') {
            await locationAPI.updateHomeowner(payload);
          } else if (user.user_type === 'cleaning_company') {
            await locationAPI.updateCleaningCompany(payload);
          } else if (user.user_type === 'home_nurse') {
            await locationAPI.updateHomeNurse(payload);
          }

          // Best-effort reverse geocode to a suburb / area name for display.
          try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${nextCoords.lat}&lon=${nextCoords.lng}&zoom=16&addressdetails=1`;
            const resp = await fetch(url, {
              headers: {
                'Accept': 'application/json',
              },
            });
            if (resp.ok) {
              const data = await resp.json();
              const addr = data.address || {};
              const prettyName =
                addr.suburb ||
                addr.neighbourhood ||
                addr.village ||
                addr.town ||
                addr.city ||
                data.display_name ||
                null;
              if (prettyName) {
                setPlaceName(prettyName);
              }
            }
          } catch (geoErr) {
            // Non-fatal; we still have coordinates.
            console.warn('Reverse geocode failed', geoErr);
          }
          setStatus('ok');
        } catch (e) {
          console.error('Failed to update live location', e);
          setStatus('error');
        }
      },
      (err) => {
        console.warn('Geolocation error', err);
        setStatus('error');
      },
      { enableHighAccuracy: true }
    );
  }, [user?.user_type]);

  return { status, coords, placeName };
}
