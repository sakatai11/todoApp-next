'use client';
import { Box } from '@mui/material';
import * as Field from './components/Index';
import { signInData } from '@/app/(auth)/_signIn/signIn';
import { signUpData } from '@/app/(auth)/_signUp/signUp';
import { usePathname } from 'next/navigation';
import { useRef, useEffect, useActionState, startTransition } from 'react';
import { PrevState } from '@/types/form/formData';
import { validationMessage } from '@/data/form';

// 初期値
const initialState = {
  success: false,
  option: '',
  message: undefined,
};

const ContactWrapper = () => {
  const pathname = usePathname();
  const formActionHandler = pathname.includes('signup')
    ? signUpData
    : signInData;

  const [formState, formAction, isPending] = useActionState(
    async (
      _prevState: PrevState,
      formData: FormData,
    ): Promise<{
      success: boolean;
      option: string;
      message: validationMessage | undefined;
    }> => {
      try {
        const { success, option, message } = await formActionHandler(
          _prevState,
          formData,
        );

        return {
          success,
          option: option ?? '',
          message: message as validationMessage,
        };
      } catch (e) {
        if (e instanceof Error && e.message === 'NEXT_REDIRECT') {
          // リダイレクトが必要な状態を返す
          return {
            success: true,
            option: '',
            message: undefined,
          };
        }
        throw e; // その他のエラーは再スロー
      }
    },
    initialState,
  ); // 第2引数に初期値を指定

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    startTransition(() => {
      formAction(formData);
    });
  };

  const formRef = useRef<HTMLFormElement>(null);

  // successがtrueになったらフォームをリセット
  useEffect(() => {
    if (formState.success) {
      formRef.current?.reset();
    }
  }, [formState.success]);

  return (
    <div className="min-h-screen flex flex-col justify-center ">
      <Box
        sx={{
          maxWidth: 350,
          width: '100%',
          mx: 'auto',
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <form
          action={formAction}
          onSubmit={handleSubmit}
          ref={formRef}
          className="p-5"
        >
          <Field.MailField
            success={formState.success}
            message={formState.message}
            option={formState.option}
          />
          <Field.PasswordField
            success={formState.success}
            message={formState.message}
            option={formState.option}
          />
          <Field.ValidationCheck
            success={formState.success}
            message={formState.message}
          />
          <Field.SendButton isPending={isPending} />
        </form>
      </Box>
    </div>
  );
};

export default ContactWrapper;
