'use client';

import { Box, IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SelectListModal from '@/features/todo/conponents/elements/Modal/SelectListModal';
import DeleteModal from '@/features/todo/conponents/elements/Modal/DeleteModal';
import { useState, useEffect, useRef, useCallback, memo } from 'react';

type Prop = {
  title: string;
  status: string;
  id: string;
  isEditing: boolean;
  editList: (id: string, value: string, title: string) => void;
  deleteList: (id: string, title: string) => void;
  setListEdit: (id: string) => void;
  setInput: (input: { status: string }) => void;
};

const StatusTitle = memo(
  ({
    title,
    status,
    id,
    isEditing,
    editList,
    deleteList,
    setListEdit,
    setInput,
  }: Prop) => {
    const [selectModalIsOpen, setSelectModalIsOpen] = useState({
      order: false,
      list: false,
      rename: false,
    });
    const [deleteIsModalOpen, setDeleteIsModalOpen] = useState(false);
    const [textRename, setTextRename] = useState(false);
    const [inputValue, setInputValue] = useState(status || title); // 初期値を管理

    const modalRef = useRef<HTMLDivElement>(null);
    const deleteModalRef = useRef<HTMLDivElement>(null);
    const textFieldRef = useRef<HTMLDivElement>(null);

    // 初回レンダリング時にフォーカスを当てる
    useEffect(() => {
      const inputElement = textFieldRef.current?.querySelector('input');
      if (isEditing && inputElement) {
        inputElement.focus();
      }
    }, [isEditing]); // `isEditing`がtrueの時に実行

    // 外部からの status 変更を監視して同期
    useEffect(() => {
      setInputValue(status || title);
    }, [status, title]);

    // SelectListModalの挙動制御
    // useCallbackを使用
    const handleClickOutside = useCallback(
      (event: MouseEvent) => {
        const target = event.target as Node;

        // クリックイベントがセレクトモーダル外で発生した場合
        if (
          modalRef.current &&
          !modalRef.current.contains(target) &&
          !deleteModalRef.current
        ) {
          console.log('Click detected outside, updating state...');
          setSelectModalIsOpen({
            order: false,
            list: false,
            rename: false,
          });
        }

        if (textFieldRef.current?.contains(target)) {
          setTextRename(true);
          console.log('setTextRename called with true');
        } else {
          setTextRename(false);
          setInput({ status: '' });
          console.log('setTextRename called with false');
        }
      },
      [setInput],
    );

    useEffect(() => {
      // 画面をクリックした際に handleClickOutside 関数を実行
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        // コンポーネントがアンマウントされた時にhandleClickOutside 関数を実行。クリーンアップ関数。
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [handleClickOutside]);

    console.log(isEditing);

    return (
      <Box
        component="div"
        id={id}
        sx={{
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {textRename && isEditing ? (
          <div ref={textFieldRef}>
            <input
              id={`${id}_input`}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value); // ローカル状態を更新
                editList(id, e.target.value, title);
              }}
              style={{ textAlign: 'center' }}
            />
          </div>
        ) : (
          title
        )}
        <IconButton
          onClick={() =>
            setSelectModalIsOpen({
              ...selectModalIsOpen,
              order: true,
              list: true,
              rename: true,
            })
          }
          sx={{
            position: 'absolute',
            top: 0,
            right: 10,
            p: 0,
          }}
        >
          <MoreVertIcon />
        </IconButton>
        {(selectModalIsOpen.order ||
          selectModalIsOpen.list ||
          selectModalIsOpen.rename) && (
          <div ref={modalRef}>
            <SelectListModal
              id={id}
              selectModalIsOpen={selectModalIsOpen}
              setListEdit={setListEdit}
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
                  setSelectModalIsOpen({ ...selectModalIsOpen, list: false });
                }
              }}
              modalIsOpen={deleteIsModalOpen}
              setModalIsOpen={setDeleteIsModalOpen}
              setSelectModalIsOpen={(listModal) =>
                setSelectModalIsOpen({ ...selectModalIsOpen, list: listModal })
              }
            />
          </div>
        )}
      </Box>
    );
  },
);

StatusTitle.displayName = 'StatusTitle';

export default StatusTitle;
