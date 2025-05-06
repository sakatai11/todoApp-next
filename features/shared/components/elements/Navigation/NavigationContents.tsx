import React from 'react';
import IconContents from '@/features/shared/components/elements/Icon/IconContents';
import { UserData } from '@/types/auth/authData';

type NavigationContentsProps = {
  user: UserData;
  initial: string;
};

export const NavigationContents: React.FC<NavigationContentsProps> = ({
  user,
  initial,
}) => {
  return (
    <nav className="absolute right-0 mt-4 bg-blue-200 rounded-lg p-4 shadow-lg flex flex-col items-center z-20">
      {/* メニュー内アイコン */}
      <IconContents initial={initial} />

      {/* メール表示 */}
      <p className="mt-2 text-sd text-black text-center break-words">
        {user.email}
      </p>
      {/* サインアウト */}
      <button
        // onClick={() => signOut({ callbackUrl: '/' })}
        className="mt-3 text-sm text-gray-400 hover:underline"
      >
        サインアウト
      </button>
    </nav>
  );
};

export default NavigationContents;
