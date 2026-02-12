import React from 'react';

// TodoHookTypeでも動的に参照
export type EditDataProps = {
  editId: string | null;
  setEditId: (id: string | null) => void;
};

// modalの型のコンポーネント化
export type IsModalBaseType = {
  modalIsOpen: boolean;
  setModalIsOpen: (modalIsOpen: boolean) => void;
};

export type IsModalWithSelectType = {
  setSelectModalIsOpen?: (selectModal: boolean) => void;
};

export type IsModalWithDeleteType = {
  setDeleteIsModalOpen: (deleteIsModalOpen: boolean) => void;
};

// Hooks型の共通プロパティをコンポーネント化
export type BaseHookType<TInput, TError> = {
  input: TInput;
  validationError: TError;
  setInput: React.Dispatch<React.SetStateAction<TInput>>;
  setValidationError: React.Dispatch<React.SetStateAction<TError>>;
};

// statusのプルダウンの型
export type StatusType = {
  category: string;
};

export type UpdateStatusAndCategoryHooks<T extends EditDataProps> = T & {
  editList: (
    id: string,
    value: string,
    title: string,
    initialTitle: string,
  ) => Promise<boolean>;
};

export type DeleteListHooks = {
  deleteList: (id: string, title: string) => void;
};
