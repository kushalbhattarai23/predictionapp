import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQALists, useQACards, useBoardById } from '../hooks/useQAData';
import { KanbanBoard } from '../components/KanbanBoard';
import { CardModal } from '../components/CardModal';
import { BugForm } from '../components/BugForm';
import { QACard } from '../types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: lists = [] } = useQALists(boardId);
  const { data: cards = [] } = useQACards(boardId);
  const { data: currentBoard } = useBoardById(boardId);
  const workspaceId = currentBoard?.workspace_id;

  const [selectedCard, setSelectedCard] = useState<QACard | null>(null);
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugFormListId, setBugFormListId] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterModule, setFilterModule] = useState('');

  const filteredCards = cards.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSeverity && c.severity !== filterSeverity) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    if (filterModule && c.module !== filterModule) return false;
    return true;
  });

  const handleCreateCard = (listId: string) => {
    setBugFormListId(listId);
    setShowBugForm(true);
  };

  // When a card is updated in the modal, reflect it
  const displayCard = selectedCard ? (cards.find(c => c.id === selectedCard.id) || selectedCard) : null;

  if (!boardId) return null;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search cards..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input placeholder="Filter severity..." value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="w-32" />
        <Input placeholder="Filter priority..." value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-32" />
        <Input placeholder="Filter module..." value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="w-36" />
      </div>

      <KanbanBoard
        lists={lists}
        cards={filteredCards}
        boardId={boardId}
        onCardClick={setSelectedCard}
        onCreateCard={handleCreateCard}
      />

      <CardModal
        card={displayCard}
        lists={lists}
        boardId={boardId}
        workspaceId={workspaceId}
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
      />

      <BugForm
        open={showBugForm}
        onClose={() => setShowBugForm(false)}
        boardId={boardId}
        listId={bugFormListId}
      />
    </div>
  );
};

export default BoardPage;
