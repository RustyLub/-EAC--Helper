import { readFileSync } from 'node:fs';
import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

if (getApps().length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (!projectId || projectId === 'YOUR_FIREBASE_PROJECT_ID') {
    throw new Error('[Firebase] FIREBASE_PROJECT_ID is missing. Set your Firebase project ID in .env.');
  }
  if (!serviceAccountJson && !credentialsPath) {
    throw new Error('[Firebase] Credentials are missing. Set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON file path or provide FIREBASE_SERVICE_ACCOUNT in .env.');
  }
  if (serviceAccountJson || credentialsPath) {
    let serviceAccount: Record<string, unknown>;
    try {
      const rawCredentials = serviceAccountJson || readFileSync(credentialsPath!, 'utf8');
      serviceAccount = JSON.parse(rawCredentials) as Record<string, unknown>;
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Missing required service-account fields.');
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`[Firebase] Service-account credentials are unreadable or invalid: ${detail}. Check GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT.`);
    }
    initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]), projectId });
  } else {
    initializeApp({ projectId });
  }
}

export const db = getFirestore();
