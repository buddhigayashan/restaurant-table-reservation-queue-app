import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { authorizeOperation, requireOperationsStaff } from './operations-access';
import { decodeRestaurantSettings, validateRestaurantSettings, type LayoutItem, type RestaurantSettings } from '@/features/staff-operations/restaurant';
export function listenRestaurantSettings(next: (settings: RestaurantSettings) => void, fail: (error: Error) => void) {
  return onSnapshot(doc(db, 'restaurantSettings', 'general'), snapshot => { try { next(decodeRestaurantSettings(snapshot.data())); } catch (error) { fail(error as Error); } }, fail);
}
export async function saveRestaurantSettings(settings: RestaurantSettings) {
  validateRestaurantSettings(settings);
  const staff = await requireOperationsStaff();
  await runTransaction(db, async tx => {
    const profile = await authorizeOperation(tx, staff.uid);
    if (profile.role !== 'manager') throw new Error('Manager access is required.');
    tx.set(doc(db, 'restaurantSettings', 'general'), { ...settings, closedDates: [...new Set(settings.closedDates)].sort(), updatedAt: serverTimestamp() });
  });
}
export async function saveTableLayout(items: LayoutItem[]) {
  if (!items.length || items.length > 100 || new Set(items.map(item => item.id)).size !== items.length || new Set(items.map(item => `${item.row}:${item.column}`)).size !== items.length) throw new Error('Each table needs a unique position.');
  for (const item of items) if (!item.id || item.id.includes('/') || !Number.isInteger(item.row) || !Number.isInteger(item.column) || item.row < 0 || item.row > 49 || item.column < 0 || item.column > 3 || !['round', 'square'].includes(item.shape)) throw new Error('Choose valid table positions and shapes.');
  const staff = await requireOperationsStaff();
  await runTransaction(db, async tx => {
    const profile = await authorizeOperation(tx, staff.uid);
    if (profile.role !== 'manager') throw new Error('Manager access is required.');
    const tables = await Promise.all(items.map(item => tx.get(doc(db, 'tables', item.id))));
    if (tables.some(table => !table.exists())) throw new Error('A table was removed. Reload the layout.');
    items.forEach((item, index) => tx.update(tables[index].ref, { layoutRow: item.row, layoutColumn: item.column, shape: item.shape, updatedAt: serverTimestamp() }));
  });
}
