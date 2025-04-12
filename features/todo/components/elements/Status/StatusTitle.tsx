'use client';
import { Box, IconButton } from '@mui/material';
import { useTodoContext } from '@/features/todo/contexts/TodoContext';
import SwipeOutlinedIcon from '@mui/icons-material/SwipeOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useSortable } from '@dnd-kit/sortable';
import SelectListModal from '@/features/todo/components/elements/Modal/SelectListModal';
import DeleteModal from '@/features/todo/components/elements/Modal/DeleteModal';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StatusTitlePropType } from '@/types/components';

const StatusTitle = React.memo(
  ({ id, title, listNumber }: StatusTitlePropType) => {
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
    // useCallbackを使用
    const handleBlur = useCallback(async () => {
      const finalValue = inputValue.trim() || initialTitle;

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
    }, [id, title, initialTitle, inputValue, editList]);

    return (
      <Box
        component="div"
        sx={{
          textAlign: 'left',
          position: 'relative',
          paddingBottom: 2.5,
          fontSize: '18px',
          '&:after': {
            content: '""',
            display: 'block',
            width: '88px',
            height: '4px',
            backgroundColor: '#99ccff', // 横棒の色
            borderRadius: '4px',
            position: 'absolute',
            bottom: 0, // 横棒の位置調整
            left: 0,
          },
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
                textAlign: 'left',
                width: '255px',
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
            p: '4px',
            position: 'absolute',
            top: -34,
            left: -30,
            background: '#99ccff',
            cursor: 'grab',
            '&:active': { cursor: 'grabbing' },
            '&:hover': { backgroundColor: '#dedede' },
          }}
        >
          <SwipeOutlinedIcon
            sx={{
              fontSize: 20,
              color: '#fff',
            }}
          />
        </IconButton>
        <IconButton
          onClick={() => setSelectModalIsOpen(true)}
          sx={{
            p: 0,
            position: 'absolute',
            top: 0,
            right: 0,
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
  },
);

StatusTitle.displayName = 'StatusTitle';

export default StatusTitle;
