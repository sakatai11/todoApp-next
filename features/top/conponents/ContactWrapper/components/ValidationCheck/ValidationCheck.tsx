import { ValidationCheckProps } from '@/types/form/formData';
import { messageType } from '@/data/form';

const ValidationCheck = ({
  success,
  message,
}: ValidationCheckProps): React.ReactElement => {
  const validationMessage = (
    authCheck: boolean | undefined,
    textMessage: string | undefined,
  ) => {
    if (authCheck) {
      return textMessage;
    }

    if (!authCheck && textMessage === undefined) {
      return null;
    }

    return messageType.messagingError;
  };

  return (
    <p
      className={`text-sm mb-4 flex justify-center ${success ? '' : 'text-red-600'}`}
    >
      {validationMessage(success, message)}
    </p>
  );
};

export default ValidationCheck;
