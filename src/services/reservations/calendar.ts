import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export async function addBookingToCalendar(booking: { id: string; date: string; time: string; partySize: string }) {
  if (Platform.OS === 'web') throw new Error('Open this booking on your phone to add it to a calendar.');
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) throw new Error('Calendar access needs the installed app. You can still view this booking in My Bookings.');
  // Import only after the tap and runtime check: Expo Go cannot load this SDK 57 native module.
  const Calendar = await import('expo-calendar');
  const permission = await Calendar.requestCalendarPermissions(Platform.OS === 'ios');
  if (!permission.granted) throw new Error('Calendar permission was not granted. Your reservation is still confirmed.');
  const start = new Date(`${booking.date}T${booking.time}:00`);
  if (!Number.isFinite(start.getTime())) throw new Error('This booking has no valid calendar date.');
  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const calendar = Platform.OS === 'ios' ? Calendar.getDefaultCalendarSync() : calendars.find(item => item.allowsModifications);
  if (!calendar) throw new Error('No writable calendar is available on this device.');
  const event = await calendar.createEvent({ title: `Restaurant reservation · ${booking.partySize} guests`, startDate: start, endDate: new Date(start.getTime() + 90 * 60000), notes: `Reservation reference: ${booking.id}`, alarms: [{ relativeOffset: -30 }] });
  return event.id;
}
