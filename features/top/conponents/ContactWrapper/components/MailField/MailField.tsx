import { TextField } from '@mui/material';
import { PrevState } from '@/types/form/formData';
import {
  getValidationStatus,
  getErrorMessage,
} from '@/app/utils/validationUtils';

const EmailField = ({
  success,
  message,
  option,
}: PrevState): React.ReactElement => {
  const isError = getValidationStatus({
    success,
    message,
    option,
    fieldType: 'email',
  });
  const errorMessage = getErrorMessage({ message, fieldType: 'email' });

  return (
    <div className="mb-6">
      <label
        htmlFor="email"
        className={`mb-2 block text-sm font-medium text-gray-600 ${
          isError ? 'text-red-600' : ''
        }`}
      >
        Email
        {isError && (
          <span className="mx-2 inline-block text-[10px] leading-3 text-red-600">
            {errorMessage}
          </span>
        )}
      </label>
      <TextField
        id="email"
        type="email"
        name="email"
        label=""
        size="small"
        fullWidth
        error={isError}
        disabled={success}
      />
    </div>
  );
};

export default EmailField;
