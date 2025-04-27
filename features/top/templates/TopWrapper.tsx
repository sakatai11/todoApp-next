import Link from 'next/link';
import { LinkSection } from '@/types/markdown/markdownData';
import { Box, Typography, Link as MuiLink, Stack } from '@mui/material';

type TopWrapperProps = {
  data: LinkSection[];
};

const TopWrapper = ({ data }: TopWrapperProps) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      p={2}
    >
      {data.map((section, index) => (
        <Box key={index} textAlign="center">
          <Typography variant="h2" fontWeight="bold" fontSize={22} mb={2}>
            {section.title}
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            {section.links.map(({ name, href }) => (
              <MuiLink
                component={Link}
                href={href}
                key={name}
                color="primary"
                underline="hover"
              >
                {name}
              </MuiLink>
            ))}
          </Stack>
        </Box>
      ))}
    </Box>
  );
};

export default TopWrapper;
