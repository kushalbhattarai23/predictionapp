import React, { useState } from 'react';
import { QAList, QACard } from '../types';
import { KanbanList } from './KanbanList';
import { useUpdateCard, useCreateList } from '../hooks/useQAData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  lists: QAList[];
  cards: QACard[];
  boardId: string;
  onCardClick: (card: QACard) => void;
  onCreateCard: (listId: string) => void;
}

export const KanbanBoard: React.FC<Props> = ({ lists, cards, boardId, onCardClick, onCreateCard }) => {
  const updateCard = useUpdateCard();
  const createList = useCreateList();
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [draggedCard, setDraggedCard] = useState<QACard | null>(null);

  const handleDrop = (listId: string) => {
    if (!draggedCard || draggedCard.list_id === listId) return;
    updateCard.mutate(
      { id: draggedCard.id, boardId, list_id: listId },
      { onSuccess: () => toast.success('Card moved') }
    );
    setDraggedCard(null);
  };

  const handleAddList = () => {
    if (!newListTitle.trim()) return;
    createList.mutate(
      { board_id: boardId, title: newListTitle.trim(), position: lists.length },
      {
        onSuccess: () => { setNewListTitle(''); setAddingList(false); toast.success('List added'); },
      }
    );
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
      {lists.map((list) => (
        <KanbanList
          key={list.id}
          list={list}
          cards={cards.filter((c) => c.list_id === list.id)}
          onCardClick={onCardClick}
          onCreateCard={() => onCreateCard(list.id)}
          onDragStart={setDraggedCard}
          onDrop={() => handleDrop(list.id)}
          isDragOver={false}
        />
      ))}
      <div className="min-w-[280px] flex-shrink-0">
        {addingList ? (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <Input
              placeholder="List title..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddList}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingList(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => setAddingList(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add List
          </Button>
        )}
      </div>
    </div>
  );
};
