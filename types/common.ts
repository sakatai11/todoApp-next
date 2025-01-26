// TodoHookTypeでも静的に参照
export type EditDataProps = {
  editId: string | null;
  setEditId: (id: string | null) => void;
};

// 制約あり（より型安全）
export type updateStatusAndCategoryHooks<T extends EditDataProps> = T & {
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
