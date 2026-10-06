# Firebase configuration

Copy the root .env.example to .env and fill in the six values from Firebase
Console > Project settings > General > Your apps > Web app > SDK setup and
configuration > Config. Copy the exact registered Web App values:

| Environment variable | firebaseConfig property |
| --- | --- |
| EXPO_PUBLIC_FIREBASE_API_KEY | apiKey |
| EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN | authDomain |
| EXPO_PUBLIC_FIREBASE_PROJECT_ID | projectId |
| EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET | storageBucket |
| EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | messagingSenderId |
| EXPO_PUBLIC_FIREBASE_APP_ID | appId |

Do not use measurementId, databaseURL, or a service-account key for these values.
.env is ignored by Git. EXPO_PUBLIC values are bundled into the client app and
are public identifiers, not private credentials.

Import app, auth, and db from '@/config/firebase' in future services.
app.ts validates the environment and reuses the default Firebase app.
auth.ts uses AsyncStorage persistence on Android/iOS; auth.web.ts uses Firebase
browser persistence. Use this central module instead of initializing Auth in
other files. index.ts obtains the default Firestore database client.
For a named Firestore database, its ID must be configured separately.

Restart Expo after filling or changing .env. Missing values produce a clear configuration error when the module is imported. Production services use this shared configuration; individual screens do not initialize Firebase.

Customer and staff authentication, guarded Firestore operations and realtime listeners are implemented in the service directories. This configuration module itself creates no collections or test records. No Admin SDK or service-account credentials are included. Firestore rule hardening and integrated physical device testing are documented in `docs/final-route-audit.md`.
