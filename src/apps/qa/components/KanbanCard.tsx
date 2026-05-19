import React from 'react';
import { QACard } from '../types';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';

interface Props {
  card: QACard;
  onClick: () => void;
  onDragStart: () => void;
}

const severityColor: Record<string, string> = {
  Critical: 'bg-destructive text-destructive-foreground',
  High: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  Medium: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  Low: 'bg-green-500/20 text-green-700 dark:text-green-300',
};

const priorityColor: Record<string, string> = {
  P1: 'bg-destructive/20 text-destructive',
  P2: 'bg-orange-500/20 text-orange-600',
  P3: 'bg-blue-500/20 text-blue-600',
  P4: 'bg-muted text-muted-foreground',
};

export const KanbanCard: React.FC<Props> = ({ card, onClick, onDragStart }) => {
  return (
    <div
      className="bg-card border rounded-md p-3 cursor-pointer hover:shadow-md transition-shadow space-y-2"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <p className="text-sm font-medium leading-tight">{card.title}</p>
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${severityColor[card.severity] || ''}`}>
          {card.severity}
        </Badge>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColor[card.priority] || ''}`}>
          {card.priority}
        </Badge>
        {card.bug_type !== 'bug' && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{card.bug_type}</Badge>
        )}
        {card.module && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{card.module}</Badge>
        )}
      </div>
      {(card.due_date || card.assigned_to) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {card.due_date && (
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{card.due_date}</span>
          )}
          {card.assigned_to && (
            <span className="flex items-center gap-1"><User className="h-3 w-3" />Assigned</span>
          )}
        </div>
      )}
    </div>
  );
};
