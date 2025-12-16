import { useEffect, useState } from 'react';
import { locationAPI } from '../services/api';
import { detectCurrentLocation, geolocationErrorToMessage } from '../utils/location';

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
  const [errorMessage, setErrorMessage] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    setAttempt((n) => n + 1);
  };

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setStatus('updating');
    setErrorMessage(null);

    (async () => {
      try {
        const { coords: nextCoords, placeName: prettyName } = await detectCurrentLocation({
          enableHighAccuracy: true,
          timeoutMs: 15000,
          maximumAgeMs: 0,
          reverseGeocode: true,
        });

        if (!mounted) return;
        setCoords({ lat: nextCoords.lat, lng: nextCoords.lng });
        if (prettyName) setPlaceName(prettyName);

        const payload = {
          current_latitude: nextCoords.lat,
          current_longitude: nextCoords.lng,
        };
        if (prettyName) {
          payload.location_label = prettyName;
        }

        if (user.user_type === 'maid') {
          await locationAPI.updateMaid(payload);
        } else if (user.user_type === 'homeowner') {
          await locationAPI.updateHomeowner(payload);
        } else if (user.user_type === 'cleaning_company') {
          await locationAPI.updateCleaningCompany(payload);
        } else if (user.user_type === 'home_nurse') {
          await locationAPI.updateHomeNurse(payload);
        }

        if (!mounted) return;
        setStatus('ok');
      } catch (err) {
        console.warn('Geolocation error', err);
        if (!mounted) return;
        setErrorMessage(geolocationErrorToMessage(err));
        setStatus('error');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.user_type, attempt]);

  return { status, coords, placeName, errorMessage, retry };
}
