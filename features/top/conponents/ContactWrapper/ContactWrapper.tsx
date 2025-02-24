'use client';
import * as Field from './components/Index';
import { createContactData } from '@/app/_action/contact';
import { useRef, useEffect, useActionState, startTransition } from 'react';
import { PrevState } from '@/types/email/formData';
import { validationMessage } from '@/data/form';
// import { sendMessage } from '@/data/accounts';

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
      const { success, option, message } = await createContactData(
        _prevState,
        formData,
      );
      return { success, option: option ?? '', message };
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
    <div>
      <form action={formAction} onSubmit={handleSubmit} ref={formRef}>
        <Field.NameField
          success={formState.success}
          message={formState.message}
          option={formState.option}
        />
        <Field.MailField
          success={formState.success}
          message={formState.message}
          option={formState.option}
        />
        <Field.SendButton isPending={isPending} />
      </form>
    </div>
  );
};

export default ContactWrapper;
