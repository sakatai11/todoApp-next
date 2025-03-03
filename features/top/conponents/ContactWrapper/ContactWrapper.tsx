'use client';
import { Box } from '@mui/material';
import * as Field from './components/Index';
import { signupData } from '@/app/_action/action';
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
  const [formState, formAction, isPending] = useActionState(
    async (
      _prevState: PrevState,
      formData: FormData,
    ): Promise<{
      success: boolean;
      option: string;
      message: validationMessage | undefined;
    }> => {
      const { success, option, message } = await signupData(
        _prevState,
        formData,
      );
      return {
        success,
        option: option ?? '',
        message: message as validationMessage,
      };
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
