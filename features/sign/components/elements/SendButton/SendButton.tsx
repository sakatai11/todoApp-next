import { Box, Button } from '@mui/material';

type PendingProps = {
  isPending: boolean;
  pathname: string;
};

const SendButton = ({
  isPending,
  pathname,
}: PendingProps): React.ReactElement => {
  const signup = pathname.includes('signup');

  // ボタンラベルを決定: サインアップ時は「登録する」、それ以外（サインイン）は「サインイン」
  const label = isPending ? '認証中' : signup ? '登録する' : 'サインイン';
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Button type="submit" variant="contained" disabled={isPending}>
        {label}
      </Button>
    </Box>
  );
};

export default SendButton;
