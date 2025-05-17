import { Button, Box, Typography } from '@mui/material';
import Modal from '@mui/material/Modal';
import CloseIcon from '@mui/icons-material/Close';
import { SignOutPropType } from '@/types/components';
import { redirect } from 'next/navigation';

const SignOutModal = ({
  modalIsOpen,
  setModalIsOpen,
  onSignOut,
}: SignOutPropType) => {
  return (
    <>
      <Modal //モーダル
        open={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        aria-labelledby="modal-modal-text"
      >
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Box
            sx={{
              bgcolor: '#FFF',
              width: 'auto',
              boxShadow: 24,
              boxSizing: 'border-box',
              p: 4,
              position: 'relative',
            }}
          >
            <CloseIcon
              // 閉じる
              sx={{
                position: 'absolute',
                top: '-27px',
                right: 0,
                color: '#FFF',
                cursor: 'pointer',
              }}
              onClick={() => setModalIsOpen(false)}
            />
            <Typography variant="h6" sx={{ textAlign: 'center' }}>
              サインアウトしますか？
            </Typography>
            <Box
              sx={{
                width: '280px',
                display: 'flex',
                justifyContent: 'space-around',
                marginTop: 3,
              }}
            >
              <Button
                variant="contained"
                sx={{ maxWidth: '120px ', width: '100%' }}
                onClick={async () => {
                  onSignOut();
                  redirect('/'); // サインアウト後にリダイレクトするURLを指定
                }}
              >
                はい
              </Button>
              <Button
                variant="contained"
                sx={{ maxWidth: '120px ', width: '100%' }}
                onClick={() => {
                  setModalIsOpen(false);
                }}
              >
                いいえ
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default SignOutModal;
