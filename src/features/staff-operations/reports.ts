import type { StaffReservation, OperationalQueueEntry, FloorTable } from '@/types/staff-operations';
export function operationalReport(reservations: StaffReservation[], queue: OperationalQueueEntry[], tables: FloorTable[], days: number, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1);
  const date = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  const rows = reservations.filter(item => item.date >= date(start) && item.date <= date(now));
  const guests = rows.filter(item => !['cancelled', 'no_show'].includes(item.status)).reduce((sum, item) => sum + item.partySize, 0);
  const noShows = rows.filter(item => item.status === 'no_show').length;
  const completed = rows.filter(item => item.status === 'completed').length;
  const queued = queue.filter(item => (item.joinedAtMillis || 0) >= start.getTime() && (item.joinedAtMillis || 0) <= now.getTime());
  const peak = Array.from({ length: 24 }, (_, hour) => ({ hour, guests: rows.filter(item => Number(item.time.split(':')[0]) === hour && !['cancelled', 'no_show'].includes(item.status)).reduce((sum, item) => sum + item.partySize, 0) })).filter(item => item.guests > 0);
  const trends = Array.from({ length: days }, (_, index) => { const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index); const entries = queued.filter(item => item.joinedAtMillis && date(new Date(item.joinedAtMillis)) === date(day)); return { date: date(day), estimate: entries.length ? Math.round(entries.reduce((sum, item) => sum + item.estimatedWaitMinutes, 0) / entries.length) : null }; });
  return { total: rows.length, guests, noShowRate: rows.length ? Math.round(noShows / rows.length * 100) : null, turnover: tables.length ? Number((completed / tables.length).toFixed(1)) : null, averageEstimate: queued.length ? Math.round(queued.reduce((sum, item) => sum + item.estimatedWaitMinutes, 0) / queued.length) : null, peak, trends };
}
