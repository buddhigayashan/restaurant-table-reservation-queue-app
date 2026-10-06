// Shared visual tokens only. No application state or Firebase behavior lives here.
export const palette = {
  cream: '#FFF8F0', sand: '#F4E8D8', terracotta: '#C96B43', olive: '#3F5A46', gold: '#D4A24C', cocoa: '#2B2118', white: '#FFFFFF', muted: '#6E6258',
  primary: '#A84F2E', primarySoft: '#FBE8DF', border: '#E6D8C9', input: '#FFFCF8',
  success: '#365C40', successSoft: '#E8F0E5', warning: '#80591F', warningSoft: '#FBF0D6', danger: '#963F3E', dangerSoft: '#F9E8E4',
  info: '#38636A', infoSoft: '#E8F0F0', disabled: '#E7DED4', onDarkMuted: '#EADFD3', overlay: 'rgba(43,33,24,0.72)', transparent: 'transparent',
} as const;
export const space = { xs: 4, sm: 8, md: 12, card: 16, page: 20, lg: 24, xl: 32 } as const;
export const radius = { chip: 12, input: 14, card: 18, button: 16, hero: 26, round: 999 } as const;
export const typography = { caption: 12, body: 14, label: 15, subtitle: 18, title: 26, hero: 32, display: 64 } as const;
export const cardShadow = { shadowColor: palette.cocoa, shadowOpacity: 0.045, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 } as const;
export const visual = {
  screen: { flex: 1, backgroundColor: palette.cream },
  card: { backgroundColor: palette.white, borderRadius: radius.card, padding: space.card, borderWidth: 1, borderColor: palette.border, ...cardShadow },
  input: { backgroundColor: palette.input, borderRadius: radius.input, borderWidth: 1, borderColor: palette.border, minHeight: 52, color: palette.cocoa },
  button: { backgroundColor: palette.primary, minHeight: 52, borderRadius: radius.button, padding: space.card },
  outline: { backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border },
} as const;
export function statusTone(status: string) {
  if (['available', 'confirmed', 'called', 'seated', 'completed', 'active', 'table_ready', 'booking_confirmed'].includes(status)) return { foreground: palette.success, background: palette.successSoft };
  if (['reserved', 'pending', 'waiting', 'no_show', 'warning', 'medium', 'rush', 'large_group'].includes(status)) return { foreground: palette.warning, background: palette.warningSoft };
  if (['cancelled', 'cancellation', 'danger', 'high', 'inactive'].includes(status)) return { foreground: palette.danger, background: palette.dangerSoft };
  if (status === 'occupied') return { foreground: palette.primary, background: palette.primarySoft };
  if (['arrived', 'cleaning', 'info', 'booking_changed', 'reservation_changed', 'reservation_change', 'queue_update'].includes(status)) return { foreground: palette.info, background: palette.infoSoft };
  return { foreground: palette.muted, background: palette.sand };
}
export function accentCard(status: string) { const tone = statusTone(status); return { borderLeftWidth: 3, borderLeftColor: tone.foreground }; }
export function statusChip(status: string) { const tone = statusTone(status); return { color: tone.foreground, backgroundColor: tone.background }; }
