import React, { useCallback } from 'react';
import { Button, Box, Typography, TextField } from '@mui/material';
import { ModalPropType } from '@/types/components';
import { jstFormattedDate } from '@/features/utils/dateUtils';
import Modal from '@mui/material/Modal';
import CloseIcon from '@mui/icons-material/Close';
import StatusPullList from '@/features/todo/components/elements/Status/StatusPullList';
import { useTodoContext } from '@/features/todo/contexts/TodoContext';

const EditModal = React.memo(
  ({ todo, id, modalIsOpen, setModalIsOpen }: ModalPropType) => {
    const { todoHooks, listHooks } = useTodoContext();
    const { addTodo, setInput, setEditId, setError, saveTodo, error, input } =
      todoHooks;

    const statusPull = listHooks.lists;
    const isPushContainer = id === 'pushContainer' ? true : false;

    const handleClose = useCallback(() => {
      setModalIsOpen(false);
      setError({ listPushArea: false, listModalArea: false }); // エラーリセット
      setEditId(null);
      setInput({ text: '', status: '' }); // リセットする
    }, [setModalIsOpen, setError, setEditId, setInput]);

    return (
      <Modal
        open={modalIsOpen}
        onClose={handleClose}
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
              maxWidth: 650,
              width: '100%',
              boxShadow: 24,
              boxSizing: 'border-box',
              ...(isPushContainer ? { p: 4 } : { px: 4, pt: 2.5, pb: 4 }),
              position: 'relative',
            }}
          >
            {todo?.updateTime && (
              <Typography
                component="span"
                color="#9e9e9e"
                fontSize="12px"
                paddingBottom="8px"
                display="block"
              >
                編集日時：{jstFormattedDate(todo.updateTime)}
              </Typography>
            )}
            <TextField
              id="modal-modal-text"
              variant="outlined"
              type="text"
              fullWidth
              value={input.text}
              error={
                !input.text
                  ? isPushContainer
                    ? error.listPushArea
                    : error.listModalArea
                  : false
              }
              helperText={
                !input.text && (error.listPushArea || error.listModalArea)
                  ? '内容を入力してください'
                  : null
              }
              multiline
              rows={9}
              onChange={(e) => setInput({ ...input, text: e.target.value })}
            />
            <StatusPullList
              // statusプルダウン
              pullDownList={statusPull}
              input={{ ...input, status: input.status }} // input.statusを渡す
              error={isPushContainer ? error.listPushArea : error.listModalArea}
              setInput={(statusInput) =>
                setInput({ ...input, status: statusInput.status })
              }
            />
            <CloseIcon
              sx={{
                position: 'absolute',
                top: '-27px',
                right: 0,
                color: '#FFF',
                cursor: 'pointer',
              }}
              onClick={handleClose}
            />
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                marginTop: 3,
              }}
            >
              <Button
                variant="contained"
                sx={{ display: 'block' }}
                onClick={() => {
                  if (isPushContainer) {
                    addTodo();
                  } else {
                    saveTodo();
                  }

                  if (input.text && input.status) {
                    setModalIsOpen(false);
                  }
                }}
              >
                {isPushContainer ? '追加' : '保存'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    );
  },
);

EditModal.displayName = 'EditModal';

export default EditModal;
