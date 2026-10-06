import { palette } from '@/constants/restaurant-theme';
import { SymbolView } from 'expo-symbols';
export function Icon({ name, size = 20, color = palette.cocoa }: { name: 'back' | 'person' | 'mail' | 'phone' | 'lock' | 'bell' | 'check' | 'calendar' | 'home' | 'clock' | 'tables' | 'walk-in' | 'settings' | 'alert' | 'edit' | 'close' | 'chevron' | 'restaurant'; size?: number; color?: string }) {
  const names = {
    back: { ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' },
    person: { ios: 'person', android: 'person', web: 'person' },
    mail: { ios: 'envelope', android: 'mail', web: 'mail' },
    phone: { ios: 'phone', android: 'call', web: 'call' },
    lock: { ios: 'lock', android: 'lock', web: 'lock' },
    bell: { ios: 'bell', android: 'notifications', web: 'notifications' },
    check: { ios: 'checkmark', android: 'check', web: 'check' },
    calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
    home: { ios: 'house', android: 'home', web: 'home' },
    clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
    tables: { ios: 'table.furniture', android: 'table_restaurant', web: 'table_restaurant' },
    'walk-in': { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' },
    settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
    alert: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
    edit: { ios: 'pencil', android: 'edit', web: 'edit' },
    close: { ios: 'xmark', android: 'close', web: 'close' },
    chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
    restaurant: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  } as const;
  return <SymbolView name={names[name]} size={size} tintColor={color} />;
}
