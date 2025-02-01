'use client';

import { Box, IconButton } from '@mui/material';
import { useTodoContext } from '@/features/todo/contexts/TodoContext';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useSortable } from '@dnd-kit/sortable';
import SelectListModal from '@/features/todo/conponents/elements/Modal/SelectListModal';
import DeleteModal from '@/features/todo/conponents/elements/Modal/DeleteModal';
import { useState, useEffect, useRef, useCallback, memo } from 'react';

type Prop = {
  id: string;
  title: string;
  listNumber: number;
};

const StatusTitle = memo(({ id, title, listNumber }: Prop) => {
  const [selectModalIsOpen, setSelectModalIsOpen] = useState(false);
  const { listHooks, deleteListHooks, updateStatusAndCategoryHooks } =
    useTodoContext();
  const { lists } = listHooks;
  const { editId: listEdit, editList } = updateStatusAndCategoryHooks;

  const { deleteList } = deleteListHooks;

  const isEditing = id === listEdit; //true

  const { attributes, listeners } = useSortable({ id });

  const [deleteIsModalOpen, setDeleteIsModalOpen] = useState(false);
  const [textRename, setTextRename] = useState(false);
  const [initialTitle, setInitialTitle] = useState(title); // 初期レンダリング実行時のtitleを保存
  const [inputValue, setInputValue] = useState(title); // 入力フィールド内のリアルタイム値
  const [isStatus, setIsStatus] = useState(true); // editListの返却値フラグ

  const modalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const textFieldRef = useRef<HTMLDivElement>(null);

  // 初回レンダリング時にフォーカスを当てる
  useEffect(() => {
    const inputElement = textFieldRef.current?.querySelector('input');
    if (isEditing && inputElement) {
      inputElement.focus();
    }
  }, [isEditing, textRename]); // `isEditing``textRename`がtrueの時に実行

  // SelectListModalの挙動制御
  // useCallbackを使用
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;

    // クリックイベントがセレクトモーダル外で発生した場合
    if (
      modalRef.current &&
      !modalRef.current.contains(target) &&
      !deleteModalRef.current
    ) {
      console.log('Click detected outside, updating state...');
      setSelectModalIsOpen(false);
    }
  }, []);

  useEffect(() => {
    // 画面をクリックした際に handleClickOutside 関数を実行
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // コンポーネントがアンマウントされた時にhandleClickOutside 関数を実行。クリーンアップ関数。
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // リスト名の更新およびバリデーション処理
  const handleBlur = async () => {
    const finalValue = inputValue.trim() || initialTitle;

    console.log(finalValue);
    console.log(initialTitle);

    // finalValue と initialTitle が同じ場合は関数を終了
    if (finalValue === initialTitle) {
      setTextRename(false);
      setInputValue(title);
      return;
    }

    const updateStatus = await editList(id, finalValue, title, initialTitle);
    if (updateStatus) {
      setInitialTitle(finalValue);
      setInputValue(finalValue);
    } else {
      setInputValue(initialTitle);
    }
    setIsStatus(updateStatus);
    setTextRename(false);
  };

  return (
    <Box
      component="div"
      sx={{
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {isEditing && textRename ? (
        <div ref={textFieldRef}>
          <input
            id={`${id}_input`}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value.trim()); // ローカル状態を更新
            }}
            onBlur={handleBlur}
            style={{
              textAlign: 'center',
              outline: 'none',
              border: 'none',
              fontSize: '16px',
            }}
            onFocus={(e) => (e.currentTarget.style.outline = 'none')}
          />
        </div>
      ) : isStatus ? (
        inputValue
      ) : (
        title
      )}

      <IconButton
        {...listeners}
        {...attributes}
        sx={{
          p: 0,
          position: 'absolute',
          top: 0,
          left: 10,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragIndicatorIcon />
      </IconButton>
      <IconButton
        onClick={() => setSelectModalIsOpen(true)}
        sx={{
          p: 0,
          position: 'absolute',
          top: 0,
          right: 10,
        }}
      >
        <MoreVertIcon />
      </IconButton>
      {selectModalIsOpen && (
        <div ref={modalRef}>
          <SelectListModal
            id={id}
            listNumber={listNumber}
            listLength={lists.length}
            setSelectModalIsOpen={setSelectModalIsOpen}
            setDeleteIsModalOpen={setDeleteIsModalOpen}
            setTextRename={setTextRename}
          />
        </div>
      )}

      {deleteIsModalOpen && id && (
        <div ref={deleteModalRef}>
          <DeleteModal
            title={title}
            onDelete={() => {
              console.log('onDelete triggered'); // コンソールログを追加
              if (id) {
                deleteList(id, title);
                setSelectModalIsOpen(false);
              }
            }}
            modalIsOpen={deleteIsModalOpen}
            setModalIsOpen={setDeleteIsModalOpen}
            setSelectModalIsOpen={setSelectModalIsOpen}
          />
        </div>
      )}
    </Box>
  );
});

StatusTitle.displayName = 'StatusTitle';

export default StatusTitle;
