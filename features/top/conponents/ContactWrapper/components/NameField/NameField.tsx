import { PrevState } from '@/types/email/formData';
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
            (message === messageType.name ||
              message === messageType.nameAndmail)) ||
          option === 'name'
            ? 'text-red-600'
            : ''
        }`}
      >
        Name
        <span
          className={`mx-2 inline-block text-[10px] leading-3 ${
            (success === false &&
              (message === messageType.name ||
                message === messageType.nameAndmail)) ||
            option === 'name'
              ? 'text-red-600'
              : ''
          }`}
        >
          {(success === false &&
            (message === messageType.name ||
              message === messageType.nameAndmail)) ||
          option === 'name'
            ? messageType.name
            : null}
        </span>
      </label>
      <input
        type="text"
        id="name"
        name="name"
        className={'mt-1 w-full rounded-md border bg-[#F3F7FB] p-2'}
        disabled={success}
      />
    </div>
  );
};

export default NameField;
