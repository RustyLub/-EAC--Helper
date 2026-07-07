import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'ai-studio-discordbot-22529366-86d9-4e0a-b3a7-91f2f41a1dff',
  });
}

export const db = getFirestore();
