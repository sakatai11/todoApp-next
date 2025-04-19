import { Box, Button } from '@mui/material';

type PendingProps = {
  isPending: boolean;
};

const SendButton = ({ isPending }: PendingProps): React.ReactElement => {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Button type="submit" variant="contained" disabled={isPending}>
        {isPending ? '認証中' : '登録する'}
      </Button>
    </Box>
  );
};

export default SendButton;
