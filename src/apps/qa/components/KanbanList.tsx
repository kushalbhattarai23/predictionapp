import React, { useState } from 'react';
import { QAList, QACard } from '../types';
import { KanbanCard } from './KanbanCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Props {
  list: QAList;
  cards: QACard[];
  onCardClick: (card: QACard) => void;
  onCreateCard: () => void;
  onDragStart: (card: QACard) => void;
  onDrop: () => void;
  isDragOver: boolean;
}

export const KanbanList: React.FC<Props> = ({ list, cards, onCardClick, onCreateCard, onDragStart, onDrop }) => {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`min-w-[280px] max-w-[280px] flex-shrink-0 bg-muted/30 rounded-lg flex flex-col ${dragOver ? 'ring-2 ring-primary' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(); }}
    >
      <div className="p-3 font-semibold text-sm flex items-center justify-between border-b border-border/50">
        <span>{list.title}</span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{cards.length}</span>
      </div>
      <div className="p-2 flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {cards.sort((a, b) => a.position - b.position).map((card) => (
          <KanbanCard key={card.id} card={card} onClick={() => onCardClick(card)} onDragStart={() => onDragStart(card)} />
        ))}
      </div>
      <div className="p-2 border-t border-border/50">
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={onCreateCard}>
          <Plus className="h-3 w-3 mr-1" /> Add Card
        </Button>
      </div>
    </div>
  );
};
