'use client';

import React from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import { Box, Typography, Button, Paper } from '@mui/material';

type ErrorDisplayProps = {
  message: string;
  onRetry?: () => void;
};

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ p: 4, minHeight: '50vh' }}
    >
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'error.light',
          width: 64,
          height: 64,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <ErrorIcon sx={{ fontSize: 40, color: '#fff' }} />
      </Paper>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>
        エラーが発生しました
      </Typography>
      <Typography
        variant="body1"
        sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}
      >
        {message}
      </Typography>
      <Button variant="contained" color="primary" onClick={handleRetry}>
        再読み込み
      </Button>
    </Box>
  );
}
