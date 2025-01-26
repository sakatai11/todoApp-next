// TodoHookTypeでも静的に参照
export type EditDataProps = {
  editId: string | null;
  setEditId: (id: string | null) => void;
};

export type updateStatusAndCategoryHooks<T> = T & {
  editList: (
    id: string,
    value: string,
    title: string,
    initialTitle: string,
  ) => Promise<boolean>;
};

export type deleteListHooks = {
  deleteList: (id: string, title: string) => void;
};
