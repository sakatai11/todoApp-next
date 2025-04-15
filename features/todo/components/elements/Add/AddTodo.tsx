'use client';
import { useTodoContext } from '@/features/todo/contexts/TodoContext';
import { Button, TextField, Box } from '@mui/material';
import AddBoxIcon from '@mui/icons-material/AddBox';

type AddTodoProps = {
  status: string;
};

const AddTodo = ({ status }: AddTodoProps) => {
  const { todoHooks } = useTodoContext();
  const {
    input,
    error,
    addTodoOpenStatus,
    addTodo,
    setInput,
    setError,
    setAddTodoOpenStatus,
  } = todoHooks;

  // このAddTodoコンポーネントが開いているかどうかを判定
  const isOpen = addTodoOpenStatus === status;

  const handleAddTodo = async () => {
    const errorFlag = await addTodo();
    if (errorFlag) {
      // 成功した場合は閉じる
      setAddTodoOpenStatus(null);
    }
    // エラーの場合は開いたままにする
  };

  return (
    <Box
      sx={{
        width: '100%',
        marginTop: 4,
      }}
    >
      {isOpen ? (
        <>
          <TextField
            id="outlined-basic"
            label="TODOを入力"
            variant="outlined"
            multiline
            rows={4}
            sx={{
              marginBottom: '10px',
              width: '100%',
            }}
            value={input.text}
            error={error.listPushArea}
            helperText={error.listPushArea && '入力してください'}
            onChange={(e) =>
              setInput({ ...input, text: e.target.value, status: status })
            }
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Button variant="outlined" fullWidth onClick={handleAddTodo}>
              追加する
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                borderColor: '#8a8a8a',
                color: '#8a8a8a',
              }}
              onClick={() => {
                setAddTodoOpenStatus(null);
                setInput({ ...input, text: '', status: '' });
                setError({ ...error, listPushArea: false });
              }}
            >
              戻る
            </Button>
          </Box>
        </>
      ) : (
        <Button
          variant="contained"
          fullWidth
          endIcon={<AddBoxIcon />}
          onClick={() => {
            // 別のAddTodoを開く前に入力値をリセット
            setInput({ ...input, text: '', status: '' });
            setAddTodoOpenStatus(status);
            setError({ ...error, listPushArea: false });
          }}
        >
          TODOを追加する
        </Button>
      )}
    </Box>
  );
};

export default AddTodo;
