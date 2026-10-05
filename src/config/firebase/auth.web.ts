import { getAuth } from 'firebase/auth';

import { app } from './app';

// Web uses Firebase's browser persistence instead of native AsyncStorage.
export const auth = getAuth(app);
