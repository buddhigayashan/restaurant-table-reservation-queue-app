import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { OperationFeedback, StaffAccess, StaffButton, StaffChips, StaffDataState, StaffField, StaffScreen, ui } from '@/components/staff/operations-ui';
import { useOperation, useStaffAccess, useStaffRecords } from '@/features/staff-operations/hooks';
import { listenFloorTables } from '@/services/staff/operations-listeners';
import { deleteOperationalTable, saveOperationalTable } from '@/services/tables/staff-operations';
import { tableStatuses, type TableInput } from '@/types/staff-operations';

export default function TableFloorManagementScreen() {
  const access = useStaffAccess();
  const records = useStaffRecords(access.uid, listenFloorTables);
  const task = useOperation();
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<TableInput | null>(null);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selected = records.rows.find(item => item.id === selectedId);
  const rows = records.rows.filter(item => filter === 'All' || item.status === filter).sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }));
  const areas = [...new Set(rows.map(item => item.area))];
  return <StaffScreen title="Tables" active="Tables" right={access.uid ? <StaffButton title="+" outline disabled={task.busy} onPress={() => { setEditingId(undefined); setForm({ tableNumber: '', capacity: 2, area: 'Main Floor', status: 'available' }); }} /> : undefined}>
    <StaffAccess state={access} />{access.uid && <>
      <StaffChips values={['All', ...tableStatuses]} selected={filter} onChange={setFilter} />
      <StaffDataState state={records} empty="No tables yet. Add your first table with +." />
      {!records.loading && !records.error && records.rows.length > 0 && !rows.length && <Text style={ui.muted}>No tables match this status.</Text>}
      {areas.map(area => <View key={area} style={{ gap: 12 }}><View style={ui.row}><Text style={[ui.heading, { flex: 1 }]}>{area}</Text><Text style={ui.small}>{rows.filter(table => table.area === area).length} tables</Text></View><View style={[ui.row, { flexWrap: 'wrap' }]}>{rows.filter(table => table.area === area).map(table => <Pressable key={table.id} accessibilityRole="button" accessibilityLabel={`Table ${table.tableNumber}, ${table.capacity} seats, ${table.status}`} accessibilityState={{ selected: selectedId === table.id }} onPress={() => { setSelectedId(table.id); setConfirmDelete(false); }} style={[ui.date, { width: '30%', minHeight: 100, borderWidth: selectedId === table.id ? 2 : 1, borderColor: '#BBB', justifyContent: 'center' }, table.status === 'occupied' && { backgroundColor: '#111' }]}><Text style={[ui.small, table.status === 'occupied' && { color: '#fff' }]}>● {table.status}</Text><Text style={[ui.heading, table.status === 'occupied' && { color: '#fff' }]}>{table.tableNumber}</Text><Text style={[ui.small, table.status === 'occupied' && { color: '#fff' }]}>{table.capacity} seats</Text></Pressable>)}</View></View>)}
      {selected && <View style={[ui.card, { borderWidth: 1, borderColor: '#DDD' }]}><View style={ui.row}><Text style={[ui.heading, { flex: 1 }]}>Table {selected.tableNumber} · {selected.capacity} seats</Text><Pressable accessibilityRole="button" accessibilityLabel="Close table details" style={ui.icon} onPress={() => setSelectedId('')}><Text>×</Text></Pressable></View><Text style={ui.small}>{selected.area} · {selected.status}</Text>
        {tableStatuses.map(status => <StaffButton key={status} title={`Set ${status}`} outline={status !== 'available'} disabled={task.busy || selected.status === status} onPress={() => task.run(async () => { await saveOperationalTable({ tableNumber: selected.tableNumber, capacity: selected.capacity, area: selected.area, status }, selected.id); return 'Table status updated.'; })} />)}
        <StaffButton title="Edit table" outline disabled={task.busy} onPress={() => { setEditingId(selected.id); setForm({ tableNumber: selected.tableNumber, capacity: selected.capacity, area: selected.area, status: tableStatuses.includes(selected.status as TableInput['status']) ? selected.status as TableInput['status'] : 'available' }); }} />
        <StaffButton title="Delete table" outline disabled={task.busy} onPress={() => setConfirmDelete(true)} />
        {confirmDelete && <><Text style={ui.error}>Delete only this table? Tables in use cannot be deleted.</Text><StaffButton title="Confirm delete" disabled={task.busy} onPress={() => task.run(async () => { await deleteOperationalTable(selected.id); setSelectedId(''); setConfirmDelete(false); return 'Table deleted.'; })} /><StaffButton title="Keep table" outline onPress={() => setConfirmDelete(false)} /></>}
      </View>}
      {form && <View style={ui.card}><Text style={ui.heading}>{editingId ? 'Edit table' : 'Add table'}</Text>
        <StaffField label="Table number" value={form.tableNumber} onChangeText={tableNumber => setForm({ ...form, tableNumber })} editable={!task.busy} />
        <StaffField label="Capacity" value={String(form.capacity || '')} onChangeText={text => setForm({ ...form, capacity: Number(text) })} keyboardType="number-pad" editable={!task.busy} />
        <StaffField label="Area" value={form.area} onChangeText={area => setForm({ ...form, area })} editable={!task.busy} />
        <StaffChips values={[...tableStatuses]} selected={form.status} onChange={status => { if (!task.busy) setForm({ ...form, status: status as TableInput['status'] }); }} />
        <StaffButton title="Save table" disabled={task.busy} onPress={() => task.run(async () => { await saveOperationalTable(form, editingId); setForm(null); return 'Table saved.'; })} /><StaffButton title="Close editor" outline disabled={task.busy} onPress={() => setForm(null)} />
      </View>}
      <OperationFeedback task={task} />
    </>}
  </StaffScreen>;
}

