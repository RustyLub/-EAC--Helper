import { existsSync } from 'node:fs';
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
  if (credentialsPath && !existsSync(credentialsPath)) {
    throw new Error(`[Firebase] Service-account file was not found: ${credentialsPath}. Check GOOGLE_APPLICATION_CREDENTIALS in .env.`);
  }

  if (serviceAccountJson) {
    let serviceAccount: Record<string, unknown>;
    try {
      serviceAccount = JSON.parse(serviceAccountJson) as Record<string, unknown>;
    } catch {
      throw new Error('[Firebase] FIREBASE_SERVICE_ACCOUNT must contain valid service-account JSON.');
    }
    initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]), projectId });
  } else {
    initializeApp({ projectId });
  }
}

export const db = getFirestore();
