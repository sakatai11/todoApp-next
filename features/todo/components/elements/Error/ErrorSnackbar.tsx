'use client';

import { Snackbar, Alert, Button, Box } from '@mui/material';
import { useError } from '@/features/todo/contexts/ErrorContext';

export const ErrorSnackbar = () => {
  const { error, clearError } = useError();

  const handleReload = () => {
    clearError();
    window.location.reload();
  };

  return (
    <Snackbar
      open={!!error}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      onClose={(event, reason) => {
        if (reason !== 'clickaway') {
          clearError();
        }
      }}
    >
      <Alert
        severity="error"
        onClose={clearError}
        sx={{
          width: '100%',
          minWidth: '300px',
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>{error}</Box>
          <Box sx={{ textAlign: 'center' }}>
            <Button
              color="inherit"
              size="small"
              onClick={handleReload}
              sx={{
                backgroundColor: 'white',
                color: '#d32f2f',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
                width: 140,
              }}
            >
              再読み込み
            </Button>
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
};
