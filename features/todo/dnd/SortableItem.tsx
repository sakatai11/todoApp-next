import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';

type SortableItemProps = {
  id: string;
  children: React.ReactNode;
};

const SortableItem = ({ id, children }: SortableItemProps) => {
  const { setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    children && (
      <Box ref={setNodeRef} style={style}>
        {children}
      </Box>
    )
  );
};

export default SortableItem;
