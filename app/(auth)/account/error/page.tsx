import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Error() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <Typography variant="body1" sx={{ mt: 4, textAlign: 'center' }}>
        このアカウントは現在、アクセスできない状態です。
        <br />
        管理者にお問い合わせください。
      </Typography>
    </Box>
  );
}
