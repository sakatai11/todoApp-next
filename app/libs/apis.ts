import { db } from '@/app/libs/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';

export const getApiRequest = async (pathname: string) => {
  // API エンドポイントのパスをマッピングするオブジェクト
  // キー（string） → ページ名やリソース名
  // 値（string） → 対応する API のエンドポイントパス
  const authUrlMap: Record<string, string> = {
    todo: '/api/info/',
  };

  const authUrl = authUrlMap[pathname];

  if (!authUrl) {
    throw new Error('Invalid pathname: No API endpoint found.');
  }

  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}${authUrl}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    return response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error; // 呼び出し元でエラーハンドリング
  }
};

export const getServerApiRequest = async (email: string) => {
  try {
    // Firestoreのusersコレクションからemailが一致するドキュメントを取得
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);

    // もし1つでも一致するユーザーがいれば存在する
    return !querySnapshot.empty ? true : null;
  } catch (error) {
    console.error('API request error:', error);
    throw error; // 呼び出し元でエラーハンドリング
  }
};

export const getClientUserById = async (id: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', id));

    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('API request error:', error);
    throw error; // 呼び出し元でエラーハンドリング
  }
};
