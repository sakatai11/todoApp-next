import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { Status } from '@/types/todos';
import EditModal from '@/features/todo/conponents/Modal/EditModal';

type InputProps = {
  addTodo: () => void;
  setTodoInput: (input: { text: string; status: string }) => void;
  setEditId: (id: string | null) => void;
  todoInput: {
    text: string;
    status: string;
  };
  statusPull: Status[];
  isEditing: boolean;
  error: boolean;
  setError: (error: boolean) => void;
};

const PushContainer = ({
  addTodo,
  setTodoInput,
  setEditId,
  todoInput,
  statusPull,
  isEditing,
  error,
  setError,
}: InputProps) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

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
          input={todoInput}
          error={error}
          modalIsOpen={modalIsOpen}
          statusPull={statusPull}
          setError={setError}
          setEditId={setEditId}
          setInput={setTodoInput}
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
