import { useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { Status } from '@/types/todos';

type PullDownType = {
  pullDownList: Status[];
  input: { status: string };
  error: boolean;
  setInput: (input: { status: string }) => void;
};

const StatusPullList = ({
  pullDownList,
  input,
  error,
  setInput,
}: PullDownType) => {
  const [label, setLabel] = useState(input.status);

  // console.log(setInput);
  return (
    <Autocomplete
      disablePortal
      options={pullDownList}
      getOptionLabel={(option) => option.category}
      sx={{ width: '100%', marginTop: 3 }}
      onChange={(_, newValue) => {
        // _はeventの略
        if (newValue) {
          setInput({ ...input, status: newValue.category });
          setLabel(newValue.category);
          console.log(newValue.category);
        }
      }}
      renderInput={(options) => (
        <TextField
          {...options}
          label={label}
          error={!label && error}
          helperText={
            !input.status && error ? 'ステータスを選択してください' : null
          }
        />
      )}
    />
  );
};

export default StatusPullList;
