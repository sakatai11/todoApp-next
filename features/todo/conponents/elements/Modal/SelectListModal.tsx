import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Box from '@mui/material/Box';

type HandleClickProps = {
  selectModalIsOpen: { order: boolean; list: boolean };
  setSelectModalIsOpen: (modal: { order: boolean; list: boolean }) => void;
  setDeleteIsModalOpen: (deleteIsModalOpen: boolean) => void;
};

const SelectListModal = ({
  selectModalIsOpen,
  setSelectModalIsOpen,
  setDeleteIsModalOpen,
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
        bottom: -30,
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
        <Button
          onClick={() =>
            setSelectModalIsOpen({
              ...selectModalIsOpen,
              order: false,
              list: false,
            })
          }
        >
          順番を変える
        </Button>
        <Button
          onClick={() => {
            setDeleteIsModalOpen(true);
            setSelectModalIsOpen({
              ...selectModalIsOpen,
              order: false,
              list: true,
            });
          }}
        >
          リストを削除する
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default SelectListModal;
