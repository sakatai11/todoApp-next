import { useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { PullDownPropsType } from '@/types/components';

const StatusPullList = ({
  pullDownList,
  input,
  validationError,
  setInput,
}: PullDownPropsType) => {
  const [label, setLabel] = useState(input.status);

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
        }
      }}
      renderInput={(options) => (
        <TextField
          {...options}
          label={label}
          error={!input.status && validationError}
          helperText={
            !input.status && validationError
              ? 'ステータスを選択してください'
              : null
          }
        />
      )}
    />
  );
};

export default StatusPullList;
