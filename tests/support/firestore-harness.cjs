/* global __dirname */
// Real service modules, mocked Firebase boundary. No network or real data writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

function harness(seed = {}, signedIn = 'staff', shared) {
  const data = shared?.data || structuredClone(seed);
  const auth = { currentUser: signedIn ? { uid: signedIn, email: `${signedIn}@example.com` } : null };
  const modules = {};
  const sequence = shared?.sequence || { value: 0 };
  const listeners = shared?.listeners || new Set();
  const ref = (name, id) => ({ id, path: `${name}/${id}` });
  const snapshot = reference => ({ id: reference.id, ref: reference, exists: () => data[reference.path] !== undefined, data: () => data[reference.path] });
  const find = q => Object.keys(data).filter(key => key.startsWith(`${q.name}/`) && (!q.filter || (q.filter.op === 'in' ? q.filter.value.includes(data[key][q.filter.field]) : data[key][q.filter.field] === q.filter.value))).map(key => snapshot(ref(q.name, key.split('/')[1])));
  const sdk = {
    collection: (_, name) => name,
    doc: (first, name, id) => typeof first === 'string' ? ref(first, String(++sequence.value).padStart(20, 'a')) : ref(name, id),
    getDoc: async reference => snapshot(reference),
    getDocs: async query => { const docs = find(typeof query === 'string' ? { name: query } : query); return { docs, size: docs.length }; },
    query: (name, filter) => ({ name, filter }), where: (field, op, value) => ({ field, op, value }),
    serverTimestamp: () => 'server-time', Timestamp: { now: () => 'client-time' },
    arrayUnion: value => ({ arrayUnion: value }),
    runTransaction: async (_, action) => {
      const writes = [];
      const apply = (reference, values, merge) => {
        const updated = merge ? { ...data[reference.path], ...values } : { ...values };
        for (const [key, value] of Object.entries(values)) if (value && typeof value === 'object' && 'arrayUnion' in value) updated[key] = [...(data[reference.path]?.[key] || []), value.arrayUnion];
        data[reference.path] = updated;
      };
      const result = await action({ get: async reference => { assert.equal(writes.length, 0, 'Firestore reads must precede writes'); return snapshot(reference); },
        set: (reference, values, options) => writes.push(() => apply(reference, values, options?.merge)),
        update: (reference, values) => writes.push(() => apply(reference, values, true)),
        delete: reference => writes.push(() => { delete data[reference.path]; }),
      });
      writes.forEach(write => write()); listeners.forEach(emit => emit()); return result;
    },
    onSnapshot: (query, next) => {
      const emit = () => { if (query.path) next(snapshot(query)); else { const docs = find(typeof query === 'string' ? { name: query } : query); next({ docs, size: docs.length }); } };
      listeners.add(emit); emit(); return () => listeners.delete(emit);
    },
    setDoc: async (reference, values) => { data[reference.path] = values; listeners.forEach(emit => emit()); },
  };
  function load(relative) {
    const filename = path.resolve(__dirname, '..', '..', relative);
    if (modules[filename]) return modules[filename].exports;
    const module = { exports: {} }; modules[filename] = module;
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })(name => {
      if (name === 'firebase/firestore') return sdk;
      if (name === 'firebase/auth') return { createUserWithEmailAndPassword: async (_, email) => { auth.currentUser = { uid: email.split('@')[0], email }; return { user: auth.currentUser }; }, deleteUser: async () => { auth.currentUser = null; }, updateProfile: async (user, values) => Object.assign(user, values), EmailAuthProvider: { credential: (email, password) => ({ email, password }) }, reauthenticateWithCredential: async () => {}, updatePassword: async () => {}, signOut: async () => { auth.currentUser = null; }, signInWithEmailAndPassword: async (_, email) => { auth.currentUser = { uid: email.split('@')[0], email }; return { user: auth.currentUser }; }, sendPasswordResetEmail: async () => {} };
      if (name === '@/config/firebase') return { auth, db: {} };
      if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
      if (name.startsWith('.')) return load(path.relative(path.resolve(__dirname, '..', '..'), path.resolve(path.dirname(filename), `${name}.ts`)));
      throw new Error(`Unexpected import: ${name}`);
    }, module, module.exports);
    return module.exports;
  }
  return { data, auth, load, client: uid => harness({}, uid, { data, listeners, sequence }) };
}
module.exports = { harness };
