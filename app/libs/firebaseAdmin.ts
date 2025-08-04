import {
  initializeApp,
  cert,
  getApps,
  ServiceAccount,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Firebase Admin の初期化
let firebaseAdminApp;

// テスト環境やエミュレーター環境では認証情報不要
const isEmulatorMode =
  process.env.NODE_ENV === 'test' ||
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true';

if (getApps().length > 0) {
  firebaseAdminApp = getApps()[0];
} else if (isEmulatorMode) {
  // エミュレーター環境での初期化（認証情報不要）
  firebaseAdminApp = initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'todoapp-test',
  });
} else {
  // 本番環境での初期化（認証情報必要）
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

  firebaseAdminApp = initializeApp({ credential: cert(serviceAccount) });
}
const adminDB = getFirestore(firebaseAdminApp);
// サーバー側の認証インスタンスを取得
const adminAuth = getAuth(firebaseAdminApp);

export { firebaseAdminApp, adminDB, adminAuth };
