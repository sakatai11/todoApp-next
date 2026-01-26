import { Autocomplete, TextField } from '@mui/material';
import { PullDownPropsType } from '@/types/components';

const StatusPullList = ({
  pullDownList,
  input,
  validationError,
  setInput,
}: PullDownPropsType) => {
  return (
    <Autocomplete
      disablePortal
      options={pullDownList}
      getOptionLabel={(option) => option.category}
      sx={{ width: '100%', marginTop: 3 }}
      onChange={(_, newValue) => {
        // _はeventの略
        if (newValue) {
          setInput((prev) => ({ ...prev, status: newValue.category }));
        }
      }}
      renderInput={(options) => (
        <TextField
          {...options}
          label={input.status}
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
