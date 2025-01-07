'use client';

import { useState } from 'react';
import { Button, TextField, Box } from '@mui/material';
import AddBoxIcon from '@mui/icons-material/AddBox';

type ListAddProps = {
  status: string;
  error: { addListNull: boolean; addListSame: boolean };
  addList: () => Promise<boolean>;
  setInput: (status: string) => void;
  setError: (error: { addListNull: boolean; addListSame: boolean }) => void;
};

const ListAdd = ({
  status,
  error,
  addList,
  setInput,
  setError,
}: ListAddProps) => {
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
            value={status}
            error={error.addListNull || error.addListSame}
            helperText={
              error.addListNull
                ? 'リスト名を入力してください'
                : error.addListSame
                  ? '同じリスト名が存在します'
                  : null
            }
            onChange={(e) => setInput(e.target.value)}
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
                setInput('');
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
