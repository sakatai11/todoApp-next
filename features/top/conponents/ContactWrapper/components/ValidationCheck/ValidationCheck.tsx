import { ValidationCheckProps } from '@/types/form/formData';

const ValidationCheck = ({
  success,
  message,
}: ValidationCheckProps): React.ReactElement => {
  return (
    <p className={'text-sm mb-4 flex justify-center'}>
      {success === true && message}
    </p>
  );
};

export default ValidationCheck;
