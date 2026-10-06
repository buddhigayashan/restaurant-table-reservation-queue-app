export type OpeningDay = { enabled: boolean; open: string; close: string };
export type RestaurantSettings = { openingHours: OpeningDay[]; bookingIntervalMinutes: number; maxPartySize: number; closedDates: string[] };
export const defaultRestaurantSettings: RestaurantSettings = { openingHours: Array.from({ length: 7 }, () => ({ enabled: true, open: '17:00', close: '21:30' })), bookingIntervalMinutes: 30, maxPartySize: 20, closedDates: [] };
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export function validateRestaurantSettings(settings: RestaurantSettings) {
  if (!Array.isArray(settings.openingHours) || !Array.isArray(settings.closedDates) || settings.openingHours.length !== 7 || ![15, 30, 60].includes(settings.bookingIntervalMinutes) || !Number.isInteger(settings.maxPartySize) || settings.maxPartySize < 1 || settings.maxPartySize > 20) throw new Error('Choose valid hours, a booking interval and a maximum party size from 1 to 20.');
  for (const day of settings.openingHours) if (!day || typeof day.enabled !== 'boolean' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.open) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.close) || minutes(day.open) >= minutes(day.close)) throw new Error('Enter opening and closing times as HH:mm, with closing after opening.');
  for (const date of settings.closedDates) { const parsed = new Date(`${date}T12:00:00`); if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}` !== date) throw new Error('Enter valid closed dates as YYYY-MM-DD.'); }
}
export function bookingSlots(settings: RestaurantSettings, date: string) {
  const day = settings.openingHours[new Date(`${date}T12:00:00`).getDay()];
  if (!day?.enabled || settings.closedDates.includes(date)) return [];
  const slots: string[] = [];
  for (let value = minutes(day.open); value < minutes(day.close); value += settings.bookingIntervalMinutes) slots.push(`${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`);
  return slots;
}
export function checkBookingPolicy(settings: RestaurantSettings, input: { date: string; time: string; partySize: number }) {
  if (input.partySize > settings.maxPartySize) throw new Error(`The restaurant accepts parties up to ${settings.maxPartySize}.`);
  if (!bookingSlots(settings, input.date).includes(input.time)) throw new Error('This date or time is not open for booking. Choose another slot.');
}
export type LayoutItem = { id: string; row: number; column: number; shape: 'round' | 'square' };

export function decodeRestaurantSettings(data?: Record<string, unknown>): RestaurantSettings {
  if (!data) return structuredSettings();
  const settings = { openingHours: data.openingHours, bookingIntervalMinutes: data.bookingIntervalMinutes, maxPartySize: data.maxPartySize, closedDates: data.closedDates } as RestaurantSettings;
  validateRestaurantSettings(settings); return settings;
}
function structuredSettings() { return { ...defaultRestaurantSettings, openingHours: defaultRestaurantSettings.openingHours.map(day => ({ ...day })), closedDates: [] }; }
