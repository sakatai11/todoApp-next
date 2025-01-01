'use client';

import { Box, IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SelectListModal from '@/features/todo/conponents/elements/Modal/SelectListModal';
import DeleteModal from '@/features/todo/conponents/elements/Modal/DeleteModal';
import { useState, useEffect, useRef } from 'react';

type Prop = {
  title: string;
  id: string;
  deleteList: (id: string, title: string) => void;
};

const StatusTitle = ({ title, id, deleteList }: Prop) => {
  const [selectModalIsOpen, setSelectModalIsOpen] = useState({
    order: false,
    list: false,
    rename: false,
  });
  const [deleteIsModalOpen, setDeleteIsModalOpen] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // クリックイベントがセレクトモーダル外で発生した場合
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !deleteModalRef.current
      ) {
        setSelectModalIsOpen({
          ...selectModalIsOpen,
          order: false,
          list: false,
        });
      }
    };
    // 画面をクリックした際に handleClickOutside 関数を実行
    document.addEventListener('mousedown', handleClickOutside);
    // コンポーネントがアンマウントされた時にhandleClickOutside 関数を実行。クリーンアップ関数。
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modalRef, deleteModalRef]);

  return (
    <Box
      component="div"
      sx={{
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {title}
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
      {(selectModalIsOpen.order || selectModalIsOpen.list) && (
        <div ref={modalRef}>
          <SelectListModal
            selectModalIsOpen={selectModalIsOpen}
            setSelectModalIsOpen={setSelectModalIsOpen}
            setDeleteIsModalOpen={setDeleteIsModalOpen}
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
