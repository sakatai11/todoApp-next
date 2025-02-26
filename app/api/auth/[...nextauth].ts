import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/app/libs/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const options: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'custom',
      name: 'Custom',
      credentials: {
        userName: { label: 'User Name', type: 'text' },
        email: { label: 'Email', type: 'email' },
      },
      authorize: async (credentials) => {
        const { userName, email } = credentials || {};

        // 認証情報の検証
        if (userName && email) {
          await saveUserToFirestore({ id: email, userName, email });
          return { id: email, name: userName, email };
        }
        return null;
      },
    }),
  ],
};

// firestoreに保存
async function saveUserToFirestore(user: {
  id: string;
  userName: string;
  email: string;
}) {
  const userRef = doc(collection(db, 'users'), user.id);
  await setDoc(
    userRef,
    {
      id: user.id,
      name: user.userName,
      email: user.email,
    },
    { merge: true },
  );
}

export default NextAuth(options);
