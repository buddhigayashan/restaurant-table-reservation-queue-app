import { Text, View } from 'react-native';
import { Action, Feedback, LiveState, OperationalScreen, ui } from '@/components/common/operations-ui';
import { useLiveRecords, useOperation } from '@/features/kitchen/hooks/use-operations';
import { listenKitchenReservations } from '@/services/reservations/kitchen';
import { acknowledgeKitchenAlert, generateLargePartyAlerts, listenKitchenAlerts } from '@/services/notifications/kitchen-alerts';
export default function AlertsScreen() {
    const state = useLiveRecords(listenKitchenAlerts);
    const reservations = useLiveRecords(listenKitchenReservations);
    const operation = useOperation();
    return <OperationalScreen area="kitchen" active="Alerts">
    <Text style={ui.title}>Alerts</Text>
    <Action title="Check upcoming large groups" disabled={operation.loading || reservations.loading || !!reservations.error} onPress={() => operation.run(() => generateLargePartyAlerts(reservations.rows))}/>
    <Feedback message={operation.error || reservations.error}/>
    <LiveState state={state} empty="No kitchen alerts."/>
    {state.rows.filter(alert => !alert.acknowledged).map(alert => <View key={alert.id} style={[ui.card, { backgroundColor: alert.severity === 'high' ? '#EAEAEA' : '#F5F5F5' }]}>
        <Text style={ui.name}>{alert.title}</Text>
        <Text style={ui.small}>{alert.type.replace(/_/g, ' ')} · {alert.severity} · Unacknowledged</Text>
        <Text style={ui.muted}>{alert.message}</Text>
        <Text style={ui.small}>{alert.createdAtMillis ? new Date(alert.createdAtMillis).toLocaleString() : 'Saving…'}</Text>
        <Action title="Acknowledge" disabled={operation.loading} onPress={() => operation.run(() => acknowledgeKitchenAlert(alert.id))}/>
        </View>)}
    <Text style={ui.small}>ACKNOWLEDGED</Text>
    {state.rows.filter(alert => alert.acknowledged).map(alert => <View key={alert.id} style={ui.card}>
        <Text style={ui.name}>{alert.title}</Text>
        <Text style={ui.muted}>{alert.message}</Text>
        <Text style={ui.small}>{alert.type.replace(/_/g, ' ')} · {alert.createdAtMillis ? new Date(alert.createdAtMillis).toLocaleString() : ''} · Acknowledged</Text>
        </View>)}
  </OperationalScreen>;
}
