'use client';
import { useState } from 'react';
import { useTodoContext } from '@/features/todo/contexts/TodoContext';
import { Button, TextField, Box } from '@mui/material';
import AddBoxIcon from '@mui/icons-material/AddBox';

const ListAdd = () => {
  const { listHooks } = useTodoContext();
  const { input, error, addList, setInput, setError } = listHooks;

  const [addBtn, setAddBtn] = useState(false);

  const handleAddList = async () => {
    const errorFlag = await addList();
    if (errorFlag) {
      setAddBtn(false);
    } else {
      setAddBtn(true);
    }
  };

  return (
    <Box>
      {addBtn ? (
        <>
          <TextField
            id="outlined-basic"
            label="リスト名を入力"
            variant="outlined"
            size="small"
            sx={{
              marginBottom: '10px',
              width: '100%',
            }}
            value={input.status}
            error={error.addListNull || error.addListSame}
            helperText={
              error.addListNull
                ? 'リスト名を入力してください'
                : error.addListSame
                  ? '同じリスト名が存在します'
                  : null
            }
            onChange={(e) => setInput({ status: e.target.value })}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Button variant="outlined" fullWidth onClick={handleAddList}>
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
                setAddBtn(false);
                setInput({ status: '' });
              }}
            >
              戻る
            </Button>
          </Box>
        </>
      ) : (
        <Button
          variant="outlined"
          fullWidth
          endIcon={<AddBoxIcon color="primary" />}
          onClick={() => {
            setAddBtn(true);
            setError({ addListNull: false, addListSame: false });
          }}
        >
          リストを追加する
        </Button>
      )}
    </Box>
  );
};

export default ListAdd;
