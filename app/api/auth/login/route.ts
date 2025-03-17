// api/auth/login/route/ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthData } from '@/types/auth/authData';
import { signInWithEmailAndPassword } from 'firebase/auth';
// import { clientAuth } from '@/app/libs/firebase';

export async function POST(req: NextRequest) {
  const body = await req.json(); // JSONデータを取得
  const { email, password }: AuthData = body;

  try {
    const userCredential = await signInWithEmailAndPassword(
      clientAuth,
      email,
      password,
    );
    const user = userCredential.user;
    if (user.uid) {
      const accessToken = await user.getIdToken();
      return NextResponse.json(
        { id: user.uid, email: user.email, accessToken: accessToken },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error('Error add list:', error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 500 });
  }
}
