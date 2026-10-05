import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Action, Feedback, Input, LiveState, OperationalScreen, ui } from '@/components/common/operations-ui';
import { useLiveRecords, useOperation } from '@/features/kitchen/hooks/use-operations';
import { changeTableStatus, listenTables, removeTable, saveTable } from '@/services/tables/management';
import { tableStatuses, type TableInput, type TableRecord } from '@/types/operations';
export default function TableFloorManagementScreen() {
    const state = useLiveRecords(listenTables);
    const operation = useOperation();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [filter, setFilter] = useState('all');
    const [form, setForm] = useState<TableInput>({ tableNumber: '', capacity: 2, status: 'available', area: 'Main Floor' });
    const [capacity, setCapacity] = useState('2');
    const selected = state.rows.find(table => table.id === selectedId);
    function select(table: TableRecord) { setSelectedId(table.id); setForm(table); setCapacity(String(table.capacity)); setEditing(false); setDeleting(false); }
    const areas = [...new Set(state.rows.map(table => table.area))];
    return <OperationalScreen area="staff" active="Tables">
    <View style={[ui.row, { justifyContent: 'space-between' }]}>
    <Text style={ui.title}>Tables</Text>
    <Action title="+ Add" disabled={operation.loading} onPress={() => { setSelectedId(null); setForm({ tableNumber: '', capacity: 2, status: 'available', area: 'Main Floor' }); setCapacity('2'); setEditing(true); setDeleting(false); }}/>
    </View>
    <ScrollFilters value={filter} onChange={setFilter}/>
    <LiveState state={state} empty="No tables. Add your first table."/>
    {areas.map(area => <View key={area} style={{ gap: 12 }}>
        <Text style={ui.small}>{area} · {state.rows.filter(table => table.area === area).length} tables</Text>
        <View style={ui.grid}>{state.rows.filter(table => table.area === area && (filter === 'all' || table.status === filter)).map(table => <Pressable key={table.id} accessibilityRole="button" accessibilityLabel={`Table ${table.tableNumber}, ${table.capacity} seats, ${table.status}`} onPress={() => select(table)} style={[ui.table, table.status === 'occupied' && { backgroundColor: '#111' }, table.id === selectedId && { borderWidth: 2, borderColor: '#111' }]}>
            <Text style={[ui.name, table.status === 'occupied' && { color: '#fff' }]}>{table.tableNumber}</Text>
            <Text style={[ui.small, table.status === 'occupied' && { color: '#DDD' }]}>{table.capacity} seats</Text>
            <Text style={[ui.small, table.status === 'occupied' && { color: '#DDD' }]}>{table.status}</Text>
            </Pressable>)}</View>
        </View>)}
    <Feedback message={operation.error}/>
    {selected && !editing && <View style={ui.card}>
        <Text style={ui.name}>Table {selected.tableNumber} · {selected.capacity} seats</Text>
        <Text style={ui.small}>{selected.area} · Currently {selected.status}</Text>{tableStatuses.map(status => <Action key={status} title={`Set ${status}`} outline={status !== selected.status} disabled={operation.loading || status === selected.status} onPress={() => operation.run(() => changeTableStatus(selected.id, status))}/>)}<Action title="Edit table details" outline disabled={operation.loading} onPress={() => { setForm(selected); setCapacity(String(selected.capacity)); setEditing(true); }}/>
        <Action title="Delete table" outline disabled={operation.loading} onPress={() => setDeleting(true)}/>{deleting && <>
            <Text style={ui.muted}>Delete table {selected.tableNumber}? This cannot be undone.</Text>
            <Action title="Confirm delete" disabled={operation.loading} onPress={() => operation.run(async () => { await removeTable(selected.id); setSelectedId(null); setDeleting(false); })}/>
            <Action title="Keep table" outline onPress={() => setDeleting(false)}/>
            </>}</View>}
    {editing && <View style={ui.card}>
        <Text style={ui.name}>{selectedId ? 'Edit table' : 'Add table'}</Text>
        <Input label="Table number" value={form.tableNumber} editable={!selectedId && !operation.loading} autoCapitalize="characters" onChangeText={value => setForm({ ...form, tableNumber: value })}/>
        <Input label="Capacity" value={capacity} keyboardType="number-pad" editable={!operation.loading} onChangeText={setCapacity}/>
        <Input label="Area" value={form.area} editable={!operation.loading} onChangeText={value => setForm({ ...form, area: value })}/>
        <Action title="Save table" disabled={operation.loading} onPress={() => operation.run(async () => { await saveTable({ ...form, capacity: Number(capacity) }, selectedId || undefined); setEditing(false); })}/>
        <Action title="Close" outline disabled={operation.loading} onPress={() => setEditing(false)}/>
        </View>}
  </OperationalScreen>;
}
function ScrollFilters({ value, onChange }: {
    value: string;
    onChange: (value: string) => void;
}) {
    return <View style={[ui.row, { flexWrap: 'wrap', gap: 6 }]}>{['all', ...tableStatuses].map(status => <Pressable key={status} accessibilityRole="button" accessibilityState={{ selected: value === status }} onPress={() => onChange(status)} style={[ui.chip, value === status && ui.selected]}>
        <Text style={[ui.small, value === status && { color: '#fff' }]}>{status}</Text>
        </Pressable>)}</View>;
}
