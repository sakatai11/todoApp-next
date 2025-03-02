import { IconButton } from '@mui/material';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { PrevState } from '@/types/form/formData';
import { useState } from 'react';
import {
  getValidationStatus,
  getErrorMessage,
} from '@/app/utils/validationUtils';

const PasswordField = ({
  success,
  message,
  option,
}: PrevState): React.ReactElement => {
  const isError = getValidationStatus({
    success,
    message,
    option,
    fieldType: 'password',
  });

  const errorMessage = getErrorMessage({
    message,
    option,
    fieldType: 'password',
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  return (
    <div className="mb-4">
      <label
        htmlFor="password"
        className={`mb-2 block text-sm font-medium text-gray-600 ${
          isError ? 'text-red-600' : ''
        }`}
      >
        Password
        {isError && (
          <span className="mx-2 inline-block text-[10px] leading-3 text-red-600">
            {errorMessage}
          </span>
        )}
      </label>
      <OutlinedInput
        id="password"
        type={showPassword ? 'text' : 'password'}
        name="password"
        label=""
        size="small"
        fullWidth
        error={isError}
        disabled={success}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label={
                showPassword ? 'hide the password' : 'display the password'
              }
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              onMouseUp={handleMouseUpPassword}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        }
      />
    </div>
  );
};

export default PasswordField;
