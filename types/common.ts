// TodoHookTypeでも静的に参照
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

// Hooks型の共有部分のコンポーネント化
export type BaseHookType<TInput, TError> = {
  input: TInput;
  error: TError;
  setInput: (input: TInput) => void;
  setError: (error: TError) => void;
};

// statusのプルダウンの型
export type StatusType = {
  category: string;
};

// 制約あり（より型安全）
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
