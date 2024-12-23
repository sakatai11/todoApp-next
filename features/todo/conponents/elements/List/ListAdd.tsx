'use client';

import { useState } from 'react';
import { Button, TextField, Box } from '@mui/material';
import AddBoxIcon from '@mui/icons-material/AddBox';

type ListAddProps = {
  status: string;
  error: boolean;
  addList: () => void;
  setInput: (status: string) => void;
  setError: (error: boolean) => void;
};

const ListAdd = ({
  status,
  error,
  addList,
  setInput,
  setError,
}: ListAddProps) => {
  const [addBtn, setAddBtn] = useState(false);

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
            error={!status ? error : undefined}
            helperText={!status && error ? 'リストを入力してください' : null}
            onChange={(e) => setInput(e.target.value)}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                addList();
                if (status) {
                  setAddBtn(false);
                }
              }}
            >
              追加する
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                borderColor: '#8a8a8a',
                color: '#8a8a8a',
              }}
              onClick={() => setAddBtn(false)}
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
            setError(false);
          }}
        >
          リストを追加する
        </Button>
      )}
    </Box>
  );
};

export default ListAdd;
