import { useEffect, useState } from 'react';
import { defaultRestaurantSettings } from '@/features/staff-operations/restaurant';
import { listenRestaurantSettings } from '@/services/staff/restaurant';
export function useRestaurantSettings() {
  const [state, setState] = useState({ settings: defaultRestaurantSettings, loading: true, error: '' });
  useEffect(() => listenRestaurantSettings(settings => setState({ settings, loading: false, error: '' }), error => setState(current => ({ ...current, loading: false, error: error.message }))), []);
  return state;
}
