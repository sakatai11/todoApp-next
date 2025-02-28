import { PrevState } from '@/types/form/formData';
import { messageType } from '@/data/form';

const NameField = ({
  success,
  message,
  option,
}: PrevState): React.ReactElement => {
  return (
    <div className="mb-4">
      <label
        htmlFor="name"
        className={`mb-2 block text-sm font-medium text-gray-600 ${
          (success === false &&
            (message === messageType.password ||
              message === messageType.passwordAndmail)) ||
          option === 'password'
            ? 'text-red-600'
            : ''
        }`}
      >
        Password
        <span
          className={`mx-2 inline-block text-[10px] leading-3 ${
            (success === false &&
              (message === messageType.password ||
                message === messageType.passwordAndmail)) ||
            option === 'password'
              ? 'text-red-600'
              : ''
          }`}
        >
          {(success === false &&
            (message === messageType.password ||
              message === messageType.passwordAndmail)) ||
          option === 'password'
            ? message === messageType.password
              ? messageType.password
              : messageType.password
            : null}
        </span>
      </label>
      <input
        type="password"
        id="password"
        name="password"
        className={'mt-1 w-full rounded-md border bg-[#F3F7FB] p-2'}
        disabled={success}
      />
    </div>
  );
};

export default NameField;
