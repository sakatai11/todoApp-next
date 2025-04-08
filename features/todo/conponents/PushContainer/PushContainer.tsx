'use client';
import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { useTodoContext } from '@/features/todo/contexts/TodoContext';
import EditModal from '@/features/todo/conponents/elements/Modal/EditModal';

const PushContainer = () => {
  const { todoHooks } = useTodoContext();
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  const isEditing = todoHooks.editId !== null;

  return (
    <Box
      sx={{
        marginTop: 8,
        display: 'flex',
        justifyContent: 'center',
        gap: 5,
        alignItems: 'center',
      }}
    >
      {!isEditing && (
        <EditModal
          id="pushContainer"
          modalIsOpen={modalIsOpen}
          setModalIsOpen={setModalIsOpen}
        />
      )}
      <Button
        variant="contained"
        onClick={() => {
          setModalIsOpen(true);
        }}
      >
        新規作成
      </Button>
    </Box>
  );
};
PushContainer.displayName = 'PushContainer';

export default PushContainer;
