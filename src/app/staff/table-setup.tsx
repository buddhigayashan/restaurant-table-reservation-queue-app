import { palette, statusTone } from '@/constants/restaurant-theme';
import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { StaffScreen, StaffButton, StaffDataState, StaffChips, OperationFeedback, ui } from '@/components/staff/operations-ui';
import { useStaffAccess, useStaffRecords, useOperation } from '@/features/staff-operations/hooks';
import { listenFloorTables } from '@/services/staff/operations-listeners';
import { saveTableLayout } from '@/services/staff/restaurant';
import type { LayoutItem } from '@/features/staff-operations/restaurant';
export default function TableSetupScreen() {
  const access = useStaffAccess(); const state = useStaffRecords(access.uid, listenFloorTables); const task = useOperation();
  const [draft, setDraft] = useState<LayoutItem[] | null>(null); const [selected, setSelected] = useState('');
  const layout = draft || state.rows.map((table, index) => ({ id: table.id, row: table.layoutRow ?? Math.floor(index / 4), column: table.layoutColumn ?? index % 4, shape: table.shape || 'square' as const }));
  const current = layout.find(item => item.id === selected);
  const change = (values: Partial<LayoutItem>) => setDraft(layout.map(item => item.id === selected ? { ...item, ...values } : item));
  return <StaffScreen title="Table Setup - Floor Layout" back><Text style={ui.small}>{state.rows.length} tables - {state.rows.reduce((sum, table) => sum + table.capacity, 0)} seats</Text><StaffDataState state={state} empty="Add tables to arrange your floor." />
    {Array.from({ length: Math.max(1, ...layout.map(item => item.row + 1)) }, (_, row) => <View key={row} style={ui.row}>{Array.from({ length: 4 }, (_, column) => { const item = layout.find(table => table.row === row && table.column === column); const table = state.rows.find(table => table.id === item?.id); return <Pressable key={column} accessibilityRole="button" accessibilityLabel={table ? `Arrange table ${table.tableNumber}` : 'Empty floor position'} disabled={!table || task.busy} onPress={() => setSelected(table!.id)} style={[ui.card, { backgroundColor: table ? statusTone(table.status).background : palette.cream }, { flex: 1, padding: 5, minHeight: 70, justifyContent: 'center', borderWidth: 1, borderColor: selected === item?.id ? palette.cocoa : palette.border, borderRadius: item?.shape === 'round' ? 35 : 12 }]}><Text style={[ui.small, { textAlign: 'center', color: table ? statusTone(table.status).foreground : palette.muted }]}>{table ? `${table.tableNumber}\n${table.capacity} seats` : ''}</Text></Pressable>; })}</View>)}
    {current && <View style={ui.card}><Text style={ui.heading}>Arrange selected table</Text><Text style={ui.small}>Row {current.row + 1}, column {current.column + 1}. Each table needs a separate position.</Text><StaffChips values={['square', 'round']} selected={current.shape} onChange={shape => { if (!task.busy) change({ shape: shape as LayoutItem['shape'] }); }} />{([['Up', -1, 0], ['Down', 1, 0], ['Left', 0, -1], ['Right', 0, 1]] as const).map(([name, row, column]) => <StaffButton key={name} title={name} outline disabled={task.busy || current.row + row < 0 || current.row + row > 49 || current.column + column < 0 || current.column + column > 3 || layout.some(item => item.id !== current.id && item.row === current.row + row && item.column === current.column + column)} onPress={() => change({ row: current.row + row, column: current.column + column })} />)}<StaffButton title="Edit table / seats" outline onPress={() => router.push('/staff/table-floor-management')} /></View>}
    <StaffButton title="+ Add table" outline onPress={() => router.push('/staff/table-floor-management')} /><StaffButton title="Reset unsaved changes" outline disabled={task.busy || !draft} onPress={() => setDraft(null)} /><OperationFeedback task={task} /><StaffButton title="Save Layout" disabled={task.busy || !layout.length || state.loading || !!state.error} onPress={() => task.run(async () => { await saveTableLayout(layout); setDraft(null); return 'Floor layout saved.'; })} />
  </StaffScreen>;
}
