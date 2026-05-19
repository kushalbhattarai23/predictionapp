
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { UniverseEpisode } from '@/hooks/useUniverseEpisodes';
import { useEpisodeStatus } from '@/hooks/useEpisodeStatus';
import { useIsMobile } from '@/hooks/use-mobile';

interface EpisodeTableRowProps {
  episode: UniverseEpisode;
}

export const EpisodeTableRow: React.FC<EpisodeTableRowProps> = ({ episode }) => {
  const { toggleWatchStatus, isUpdating } = useEpisodeStatus();
  const isMobile = useIsMobile();

  const handleWatchToggle = () => {
    toggleWatchStatus({
      episodeId: episode.id,
      currentStatus: episode.watched
    });
  };

  return (
    <TableRow className={`${episode.watched ? 'bg-green-50/50' : 'bg-gray-50/30'} hover:bg-blue-50/50 transition-colors`}>
      <TableCell className="font-medium text-blue-600 px-2 sm:px-4">
        <div className="truncate max-w-[120px] sm:max-w-none" title={episode.show?.title || 'Unknown Show'}>
          {episode.show?.title || 'Unknown Show'}
        </div>
        {isMobile && (
          <div className="text-xs text-muted-foreground mt-1">
            S{episode.season_number}
          </div>
        )}
      </TableCell>
      
      {!isMobile && (
        <TableCell className="text-center text-sm font-medium">
          S{episode.season_number}
        </TableCell>
      )}
      
      <TableCell className="text-center font-medium px-2">
        {episode.episode_number}
      </TableCell>
      
      <TableCell className="font-medium px-2 sm:px-4">
        <div className="truncate max-w-[150px] sm:max-w-none" title={episode.title}>
          {episode.title}
        </div>
        {isMobile && episode.air_date && (
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(episode.air_date).toLocaleDateString()}
          </div>
        )}
      </TableCell>
      
      {!isMobile && (
        <TableCell className="text-center text-sm">
          {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}
        </TableCell>
      )}
      
      <TableCell className="text-center">
        {episode.watched ? (
          <div className="flex items-center justify-center">
            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
          </div>
        )}
      </TableCell>
      
      <TableCell className="text-center px-2 sm:px-4">
        <Button
          size="sm"
          variant={episode.watched ? "outline" : "default"}
          onClick={handleWatchToggle}
          disabled={isUpdating}
          className={`text-xs sm:text-sm transition-colors ${
            episode.watched 
              ? "border-red-200 text-red-600 hover:bg-red-50" 
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {episode.watched ? 'Mark Unwatched' : 'Mark Watched'}
        </Button>
      </TableCell>
    </TableRow>
  );
};
