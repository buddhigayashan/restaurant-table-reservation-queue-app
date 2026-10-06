import { palette, accentCard } from '@/constants/restaurant-theme';
import { StatusBadge } from '@/components/common/status-badge';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Action, Feedback, LiveState, OperationalScreen, ui } from '@/components/common/operations-ui';
import { useLiveRecords, useOperation } from '@/features/kitchen/hooks/use-operations';
import { listenQueue, updateQueue } from '@/services/queue/management';
import { listenTables } from '@/services/tables/management';
export default function QueueManagementScreen() {
    const state = useLiveRecords(listenQueue);
    const tables = useLiveRecords(listenTables);
    const operation = useOperation();
    const [tableId, setTableId] = useState('');
    const [cancelId, setCancelId] = useState<string | null>(null);
    const called = state.rows.find(entry => entry.status === 'called');
    const next = called || state.rows[0];
    return <OperationalScreen area="staff" active="Queue">
    <View style={[ui.row, { justifyContent: 'space-between' }]}>
    <Text style={ui.title}>Live queue</Text>
    <Action title="+ Walk-in" onPress={() => router.push('/staff/walk-in-registration')}/>
    </View>
    <Text style={ui.muted}>Live updates · {state.rows.length} active entries</Text>
    <LiveState state={state} empty="The queue is empty. Customer entries will appear here when available."/>
    <Feedback message={operation.error}/>
    {next && <View style={ui.card}>
        <Text style={ui.small}>NEXT UP</Text>
        <Text style={ui.name}>{next.customerName} · party of {next.partySize}</Text>
        <Text style={ui.small}>{next.status}{next.tableNumber ? ` · Table ${next.tableNumber}` : ''}</Text>
      {!called ? <Action title="Call next customer" disabled={operation.loading || !!state.error} onPress={() => operation.run(() => updateQueue('call'))}/> : <>
        <Text style={ui.small}>Assign an available table (optional)</Text>
            <LiveState state={tables} empty="No tables configured. You may seat without assigning a table."/>
        <View style={[ui.row, { flexWrap: 'wrap' }]}>
            <Pressable style={[ui.chip, !tableId && ui.selected]} onPress={() => setTableId('')}>
            <Text style={{ color: !tableId ? palette.white : palette.cocoa }}>No table</Text>
            </Pressable>{tables.rows.filter(table => table.status === 'available' && table.capacity >= called.partySize).map(table => <Pressable key={table.id} style={[ui.chip, tableId === table.id && ui.selected]} onPress={() => setTableId(table.id)}>
                <Text style={{ color: tableId === table.id ? palette.white : palette.cocoa }}>{table.tableNumber} · {table.capacity}</Text>
                </Pressable>)}</View>
        <Action title="Seat Now" disabled={operation.loading || !!state.error} onPress={() => operation.run(async () => { await updateQueue('seat', called.id, tableId || undefined); setTableId(''); })}/>
      </>}
    </View>}
    <View style={[ui.row, { justifyContent: 'space-between' }]}>
    <Text style={ui.name}>Waiting list</Text>
    <Text style={ui.small}>Queue order</Text>
    </View>
    {state.rows.map((entry, index) => <View key={entry.id} style={[ui.card, accentCard(entry.status)]}>
        <View style={ui.row}>
        <View style={ui.party}>
        <Text style={{ color: palette.white }}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
        <Text style={ui.name}>{entry.customerName}</Text>
        <Text style={ui.small}>Party of {entry.partySize} · ~{entry.estimatedWaitMinutes} min</Text><StatusBadge status={entry.status} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Cancel queue entry for ${entry.customerName}`} disabled={operation.loading} onPress={() => setCancelId(entry.id)}>
        <Text style={ui.small}>Remove</Text>
        </Pressable>
        </View>{cancelId === entry.id && <>
            <Text style={ui.muted}>Cancel this queue entry?</Text>
            <Action title="Confirm cancellation" disabled={operation.loading} onPress={() => operation.run(async () => { await updateQueue('cancel', entry.id); setCancelId(null); })}/>
            <Action title="Keep entry" outline onPress={() => setCancelId(null)}/>
            </>}</View>)}
  </OperationalScreen>;
}
