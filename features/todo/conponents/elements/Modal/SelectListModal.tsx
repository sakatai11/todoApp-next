import React from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Box from '@mui/material/Box';
// import { useLists } from '@/features/todo/hooks/useLists';

type HandleClickProps = {
  id: string;
  listNumber: number;
  listLength: number;
  setListEdit: (id: string) => void;
  setSelectModalIsOpen: (selectModal: boolean) => void;
  setDeleteIsModalOpen: (deleteIsModalOpen: boolean) => void;
  setTextRename: (textRename: boolean) => void;
  handleButtonMove: (id: string, direction: 'right' | 'left') => void;
};

const SelectListModal = ({
  id,
  listNumber,
  listLength,
  setListEdit,
  setSelectModalIsOpen,
  setDeleteIsModalOpen,
  setTextRename,
  handleButtonMove,
}: HandleClickProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        '& > *': {
          m: 1,
        },
        position: 'absolute',
        right: -140,
        bottom: -120,
        zIndex: 99,
      }}
    >
      <ButtonGroup
        orientation="vertical"
        aria-label="Vertical button group"
        variant="text"
        color="inherit"
        sx={{
          backgroundColor: '#FFF',
          boxShadow:
            '0px 3px 3px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12)',
          color: 'rgba(0, 0, 0, 0.54)',
        }}
      >
        {listNumber === 1 && (
          <Button
            onClick={() => {
              handleButtonMove(id, 'right');
              setSelectModalIsOpen(false);
            }}
          >
            1つ右へ移動する
          </Button>
        )}
        {listNumber === listLength && (
          <Button
            onClick={() => {
              handleButtonMove(id, 'left');
              setSelectModalIsOpen(false);
            }}
          >
            1つ左へ移動する
          </Button>
        )}
        {listNumber > 1 && listNumber < listLength && (
          <>
            <Button
              onClick={() => {
                handleButtonMove(id, 'left');
                setSelectModalIsOpen(false);
              }}
            >
              1つ左へ移動する
            </Button>
            <Button
              onClick={() => {
                handleButtonMove(id, 'right');
                setSelectModalIsOpen(false);
              }}
            >
              1つ右へ移動する
            </Button>
          </>
        )}
        <Button
          onClick={() => {
            setDeleteIsModalOpen(true);
            setSelectModalIsOpen(true);
          }}
        >
          リストを削除する
        </Button>
        <Button
          onClick={() => {
            console.log('rename');
            setSelectModalIsOpen(false);
            setTextRename(true);
            setListEdit(id);
          }}
        >
          リスト名を変える
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default SelectListModal;
