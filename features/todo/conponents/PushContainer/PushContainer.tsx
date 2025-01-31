'use client';

import React, { useState } from 'react';
import { Button, Box } from '@mui/material';
// import { PushContainerType } from '@/types/conponents';
import { useTodoContext } from '@/features/todo/contexts/TodoContext';
// import { TodoHookType } from '@/types/todos';
import EditModal from '@/features/todo/conponents/elements/Modal/EditModal';

const PushContainer = React.memo(() => {
  // const { addTodo, setInput, setEditId, setError, error, input } = todoHooks;
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
          // input={input}
          // error={error.listPushArea}
          modalIsOpen={modalIsOpen}
          // statusPull={listHooks.lists}
          // setError={(pushError) =>
          //   setError({ ...error, listPushArea: pushError })
          // }
          // setEditId={setEditId}
          // setInput={setInput}
          setModalIsOpen={setModalIsOpen}
          // addTodo={addTodo}
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
});
PushContainer.displayName = 'PushContainer';

export default PushContainer;
