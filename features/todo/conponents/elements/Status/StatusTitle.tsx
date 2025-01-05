'use client';

import { Box, IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SelectListModal from '@/features/todo/conponents/elements/Modal/SelectListModal';
import DeleteModal from '@/features/todo/conponents/elements/Modal/DeleteModal';
import { useState, useEffect, useRef } from 'react';

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

const StatusTitle = ({
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

  const modalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const textFieldRef = useRef<HTMLDivElement>(null);
  // const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // `textFieldRef` が参照する要素の子要素から `input` を取得
      // const inputElement = textFieldRef.current?.querySelector('input');

      // if (inputElement) {
      //   console.log('Input element ID:', inputElement.value); // `value` を表示
      // }

      // クリックイベントがセレクトモーダル外で発生した場合
      if (
        modalRef.current &&
        !modalRef.current.contains(target) &&
        !deleteModalRef.current
      ) {
        console.log('Click detected outside, updating state...');
        setSelectModalIsOpen((prevState) => ({
          ...prevState,
          order: false,
          list: false,
          rename: false,
        }));
      }

      if (textFieldRef.current?.contains(target) === true) {
        setTextRename(true);
        setInput({ status: title });
        console.log('setTextRename called with true');
      } else if (textFieldRef.current?.contains(target) === false) {
        setTextRename(false);
        setInput({ status: '' });
        // isEditing = false;
        console.log('setTextRename called with false');
      }
    };

    // 画面をクリックした際に handleClickOutside 関数を実行
    document.addEventListener('mousedown', handleClickOutside);
    // コンポーネントがアンマウントされた時にhandleClickOutside 関数を実行。クリーンアップ関数。
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modalRef, deleteModalRef, textFieldRef, setInput]);

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
            value={status}
            // ref={inputRef}
            onChange={(e) => {
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
            setTextRename={(value) => {
              setTextRename(value);
              if (value) {
                console.log(value);
                // inputRef.current?.focus();
              }
            }}
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
};

export default StatusTitle;
