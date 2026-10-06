/* global __dirname */
// Static route/JSX checks complement physical navigation tests; no Firebase calls.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const files = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(item => item.isDirectory() ? files(path.join(directory, item.name)) : [path.join(directory, item.name)]);
const routes = files(path.join(root, 'src/app')).filter(file => file.endsWith('.tsx') && !file.endsWith('_layout.tsx'));
const routeName = file => '/' + path.relative(path.join(root, 'src/app'), file).replaceAll('\\', '/').replace(/\([^/]+\)\//g, '').replace(/\.tsx$/, '').replace(/(^|\/)index$/, '');
test('every screen route is implemented or an explicit redirect; route URLs are unique', () => {
  assert.equal(new Set(routes.map(routeName)).size, routes.length);
  for (const file of routes) { const text = fs.readFileSync(file, 'utf8'); assert.doesNotMatch(text, /return null;|Architecture placeholder|Module Test Launcher|isTestData/, file); assert.match(text, /export default/, file); }
});
test('every literal customer, staff and kitchen navigation destination has a route', () => {
  const existing = new Set(routes.map(routeName));
  for (const file of files(path.join(root, 'src')).filter(file => /\.tsx?$/.test(file))) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) { if (ts.isStringLiteral(node) && /^\/(customer|staff|kitchen)(\/|$)/.test(node.text)) assert.ok(existing.has(node.text), `${file}: ${node.text}`); ts.forEachChild(node, visit); }
    visit(source);
  }
});
test('normal entry is onboarding and legacy explore cannot display the Expo demo', () => {
  assert.match(read('src/app/(starter)/index.tsx'), /Redirect href="\/customer\/onboarding"/);
  assert.match(read('src/app/(starter)/explore.tsx'), /Redirect href="\/"/);
  assert.match(read('src/app/customer/onboarding.tsx'), /router.replace\('\/customer\/login'\)/);
});
test('custom headers have no native stack header and back controls use safe destinations', () => {
  for (const file of files(path.join(root, 'src/app')).filter(file => file.endsWith('_layout.tsx'))) assert.match(fs.readFileSync(file, 'utf8'), /headerShown: false/, file);
  for (const file of ['src/features/customer/components/ui.tsx', 'src/components/staff/operations-ui.tsx', 'src/components/vimandya/module-ui.tsx']) assert.doesNotMatch(read(file), /router.back\(/);
  assert.match(read('src/app/staff/reservation-details.tsx'), /title="Reservation details"/);
  assert.match(read('src/app/staff/profile.tsx'), /fallback=.*roleDestination/);
});
test('public screens have no bottom navigation; each shared shell renders it once', () => {
  for (const name of ['onboarding', 'login', 'sign-up', 'reset-password']) assert.doesNotMatch(read(`src/app/customer/${name}.tsx`), /<(?:Screen|ModuleScreen)[^>]*active=/);
  assert.doesNotMatch(read('src/app/staff/login.tsx'), /<ModuleScreen[^>]*active=/);
  for (const file of ['src/features/customer/components/ui.tsx', 'src/components/common/operations-ui.tsx', 'src/components/staff/operations-ui.tsx', 'src/components/vimandya/module-ui.tsx']) { assert.equal((read(file).match(/<AppNavigation /g) || []).length, 1); assert.match(read(file), /SafeAreaView/); assert.match(read(file), /KeyboardAvoidingView/); assert.match(read(file), /keyboardShouldPersistTaps="handled"/); }
});
test('notification links use the receiving route parameter names and historical bookings are reachable', () => {
  assert.match(read('src/app/customer/notifications.tsx'), /params: \{ id: notice.reservationId \}/);
  assert.match(read('src/app/customer/notifications.tsx'), /params: \{ entryId: notice.queueEntryId \}/);
  assert.match(read('src/app/customer/my-bookings.tsx'), /pathname: '\/customer\/booking-confirmation'/);
});
