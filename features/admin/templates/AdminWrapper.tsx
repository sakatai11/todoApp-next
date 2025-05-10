'use client';
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
} from '@mui/material';
import { UserData } from '@/types/auth/authData';
import Image from 'next/image';

type AdminWrapperProps = {
  users: UserData[];
};

const AdminWrapper = ({ users }: AdminWrapperProps) => {
  return (
    <Box p={2}>
      <Box textAlign="center" mb={2}>
        <Typography variant="h4">Admin Page</Typography>
        <Typography>管理者用のページです。</Typography>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Created At</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Image</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.createdAt.toDate().toLocaleString()}</TableCell>
              <TableCell>{user.name || '-'}</TableCell>
              <TableCell>
                {user.image ? (
                  <Image src={user.image} alt={user.name || ''} width={50} />
                ) : (
                  '-'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
export default AdminWrapper;
