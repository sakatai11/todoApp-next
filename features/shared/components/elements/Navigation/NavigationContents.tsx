'use client';

import React from 'react';
import IconContents from '@/features/shared/components/elements/Icon/IconContents';
import SignOutModal from '@/features/shared/components/elements/Modal/SignOutModal';
import { NavigationContentsProps } from '@/types/components';
import { authSignOut } from '@/app/(auth)/_signOut/signOut';
import { Box, Typography, Button } from '@mui/material';

export const NavigationContents: React.FC<NavigationContentsProps> = ({
  user,
  initial,
  modalIsOpen,
  setModalIsOpen,
  onCloseNav,
}) => {
  return (
    <>
      <Box
        component="nav"
        sx={{
          position: 'absolute',
          right: 0,
          mt: 2,
          bgcolor: '#a5d7ff',
          borderRadius: 1,
          p: 2,
          boxShadow: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        {/* メニュー内アイコン */}
        <IconContents initial={initial} />

        {/* メール表示 */}
        <Typography
          variant="body2"
          color="textPrimary"
          align="center"
          sx={{ mt: 1, wordBreak: 'break-word' }}
        >
          {user.email}
        </Typography>

        {/* サインアウト */}
        <Button
          variant="text"
          size="small"
          sx={{ mt: 1 }}
          onClick={() => setModalIsOpen(true)}
        >
          サインアウト
        </Button>
      </Box>

      {modalIsOpen && (
        <SignOutModal
          modalIsOpen={modalIsOpen}
          setModalIsOpen={setModalIsOpen}
          onSignOut={async () => {
            await authSignOut();
            setModalIsOpen(false);
            onCloseNav();
          }}
        />
      )}
    </>
  );
};

export default NavigationContents;
