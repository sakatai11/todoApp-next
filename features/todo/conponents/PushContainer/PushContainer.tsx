'use client';

import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { PushContainerType } from '@/types/conponents';
// import { TodoHookType } from '@/types/todos';
import EditModal from '@/features/todo/conponents/elements/Modal/EditModal';

const PushContainer = ({
  todoHooks,
  statusPull,
  isEditing,
}: PushContainerType) => {
  const { addTodo, setInput, setEditId, setError, error, input } = todoHooks;

  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

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
          input={input}
          error={error.listPushArea}
          modalIsOpen={modalIsOpen}
          statusPull={statusPull}
          setError={(pushError) =>
            setError({ ...error, listPushArea: pushError })
          }
          setEditId={setEditId}
          setInput={setInput}
          setModalIsOpen={setModalIsOpen}
          addTodo={addTodo}
        />
      )}
      <Button
        variant="contained"
        onClick={(e) => {
          console.log(e);
          setModalIsOpen(true);
        }}
      >
        新規作成
      </Button>
    </Box>
  );
};

export default PushContainer;
