export type AppRole = 'customer' | 'manager' | 'staff' | 'kitchen';

export function roleDestination(role: AppRole) {
  return role === 'customer' ? '/customer/home' : role === 'kitchen' ? '/kitchen/upcoming-reservations' : '/staff/dashboard';
}

export function canOpenArea(role: AppRole | null, area: 'customer' | 'staff' | 'kitchen', route: string) {
  if (!role) return false;
  if (area === 'customer') return role === 'customer';
  if (area === 'kitchen') return ['kitchen', 'manager', 'staff'].includes(role);
  if (['account-management', 'restaurant-settings', 'table-setup', 'reports-analytics'].includes(route)) return role === 'manager';
  if (route === 'profile') return role !== 'customer';
  return role === 'manager' || role === 'staff';
}
