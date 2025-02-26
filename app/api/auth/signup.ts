import { NextResponse, NextRequest } from 'next/server';
import { authData } from '@/types/auth/authData';

export async function POST(req: NextRequest) {
  try {
    const body: authData = await req.json();
    const { userName, email } = body;

    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/auth/callback/custom`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName, email }),
      },
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json(
      {
        error: 'Authentication failed',
      },
      { status: response.status },
    );
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
