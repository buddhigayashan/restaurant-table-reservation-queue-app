export function dateValue(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function bookingDates() {
  const today = new Date();
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index);
    return { value: dateValue(date), day: date.toLocaleDateString('en-US', { weekday: 'short' }), number: date.getDate(), month: date.toLocaleDateString('en-US', { month: 'short' }) };
  });
}

export const bookingTimes = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
export function displayTime(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}` : '—';
}
export function displayDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
