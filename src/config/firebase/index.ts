import { getFirestore } from 'firebase/firestore';

import { app } from './app';

export { app } from './app';
export { auth } from './auth';

// Obtaining a client does not create collections or write documents.
export const db = getFirestore(app);
