import {
  initializeApp,
  cert,
  getApps,
  ServiceAccount,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// サービスアカウントの設定
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

if (
  !serviceAccount.projectId ||
  !serviceAccount.privateKey ||
  !serviceAccount.clientEmail
) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT is missing required fields');
}

// Firebase Admin の初期化（既存のインスタンスがない場合のみ実行）
const firebaseAdminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({ credential: cert(serviceAccount) });

export default firebaseAdminApp;
export const adminDB = getFirestore(firebaseAdminApp);
