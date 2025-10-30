
'use client';

import { initializeFirebase } from './server-init';

// IMPORTANT: DO NOT MODIFY THIS FILE beyond what is necessary to make it work.
// The initializeFirebase function is now in server-init.ts to allow server-side usage.

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

// We still export initializeFirebase for client-side use, but it's defined elsewhere.
export { initializeFirebase, getSdks } from './server-init';
