'use client';

import { Snackbar, Alert } from '@mui/material';
import { useError } from '@/features/todo/contexts/ErrorContext';

export const ErrorSnackbar = () => {
  const { error, clearError } = useError();

  return (
    <Snackbar
      open={!!error}
      autoHideDuration={5000}
      onClose={clearError}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="error" onClose={clearError} sx={{ width: '100%' }}>
        {error}
      </Alert>
    </Snackbar>
  );
};
