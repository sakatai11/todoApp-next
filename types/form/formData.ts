export type FormData = {
  email: string;
  password: string;
};

export type PrevState = {
  success?: boolean;
  option?: string;
  message?: string;
};

export type ValidationParams = PrevState & {
  fieldType?: 'password' | 'email';
};

export type ValidationCheckProps = Omit<PrevState, 'option'>;
