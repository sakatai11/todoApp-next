import { PrevState } from '@/types/email/formData';
import { defaultMessage, messageType } from '@/data/form';

const ContentField = ({
  success,
  message,
  option,
}: PrevState): React.ReactElement => {
  return (
    <div className="mb-4">
      <label
        htmlFor="content"
        className={`mb-2 block text-sm font-medium text-gray-600 ${
          (success === false &&
            (message === defaultMessage.errorMessage ||
              message === messageType.content ||
              message === messageType.nameAndcontent ||
              message === messageType.mailAndcontent)) ||
          option === 'content'
            ? 'text-red-600'
            : ''
        }`}
      >
        Content
        <span className="mx-2 inline-block rounded-xl bg-skyblue p-1 text-[10px] leading-3 text-white">
          必須
        </span>
        <span
          className={`mx-2 inline-block text-[10px] leading-3 ${
            (success === false &&
              (message === defaultMessage.errorMessage ||
                message === messageType.content ||
                message === messageType.nameAndcontent ||
                message === messageType.mailAndcontent)) ||
            option === 'content'
              ? 'text-red-600'
              : ''
          }`}
        >
          {(success === false &&
            (message === defaultMessage.errorMessage ||
              message === messageType.content ||
              message === messageType.nameAndcontent ||
              message === messageType.mailAndcontent)) ||
          option === 'content'
            ? messageType.content
            : null}
        </span>
      </label>
      <textarea
        id="content"
        name="content"
        rows={6}
        className={'mt-1 w-full rounded-md border bg-[#F3F7FB] p-2'}
        disabled={success && message === 'お問い合わせを受け付けました'}
      ></textarea>
    </div>
  );
};

export default ContentField;
