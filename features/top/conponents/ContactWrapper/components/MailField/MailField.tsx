import { PrevState } from '@/types/email/formData';
import { messageType } from '@/data/form';

const MailField = ({
  success,
  message,
  option,
}: PrevState): React.ReactElement => {
  return (
    <div className="mb-4">
      <label
        htmlFor="email"
        className={`mb-2 block text-sm font-medium text-gray-600 ${
          (success === false &&
            (message === messageType.mail ||
              message === messageType.nameAndmail ||
              message === messageType.addressError)) ||
          option === 'email'
            ? 'text-red-600'
            : ''
        }`}
      >
        Email
        <span
          className={`mx-2 inline-block text-[10px] leading-3 ${
            (success === false &&
              (message === messageType.mail ||
                message === messageType.nameAndmail ||
                message === messageType.addressError)) ||
            option === 'email'
              ? 'text-red-600'
              : ''
          }`}
        >
          {(success === false &&
            (message === messageType.mail ||
              message === messageType.nameAndmail ||
              message === messageType.addressError)) ||
          option === 'email'
            ? message === messageType.mail
              ? messageType.mail
              : message === messageType.addressError
                ? messageType.addressError
                : messageType.mail
            : null}
        </span>
      </label>
      <input
        type="email"
        id="email"
        name="email"
        className={'mt-1 w-full rounded-md border bg-[#F3F7FB] p-2'}
        disabled={success}
      />
    </div>
  );
};

export default MailField;
