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
import type { AdminUser } from '@/types/auth/authData';
import Image from 'next/image';

type AdminWrapperProps = {
  users: AdminUser[];
};

const AdminWrapper = ({ users }: AdminWrapperProps) => {
  return (
    <Box p={2}>
      <Box textAlign="center" my={4}>
        <Typography variant="h2" fontSize={24} fontWeight={'bold'}>
          管理者用のページ
        </Typography>
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
              <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
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
