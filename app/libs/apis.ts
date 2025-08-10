import { adminDB } from '@/app/libs/firebaseAdmin';

export const getServerApiRequest = async (email: string) => {
  try {
    // Firestoreのusersコレクションからemailが一致するドキュメントを取得
    const querySnapshot = await adminDB
      .collection('users')
      .where('email', '==', email)
      .get();

    // もし1つでも一致するユーザーがいれば存在する
    return !querySnapshot.empty ? true : null;
  } catch (error) {
    console.error('API request error:', error);
    throw error; // 呼び出し元でエラーハンドリング
  }
};
