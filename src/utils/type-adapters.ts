
import { Database } from '@/integrations/supabase/types';
import { Show, Episode, User } from '@/types';

export type DbShow = Database['public']['Tables']['shows']['Row'];
export type DbEpisode = Database['public']['Tables']['episodes']['Row'];
export type DbUserEpisodeStatus = Database['public']['Tables']['user_episode_status']['Row'];
export type DbUserShowTracking = Database['public']['Tables']['user_show_tracking']['Row'];
export type DbProfile = Database['public']['Tables']['profiles']['Row'];

// Function to adapt database show format to application format
export function adaptDbShowToShow(dbShow: DbShow): Show {
  return {
    id: dbShow.id,
    slug: dbShow.slug || dbShow.id,
    name: dbShow.title,
    totalEpisodes: 0, // This will be filled in by the component if needed
    watchedEpisodes: 0, // This will be filled in by the component if needed
    status: 'not-started', // Default status
    poster: dbShow.poster_url,
    airDate: undefined,
    genres: [], // No genres in the database schema yet
    description: dbShow.description
  };
}

// Function to adapt database episode format to application format
export function adaptDbEpisodeToEpisode(dbEpisode: DbEpisode, watched = false): Episode {
  return {
    id: dbEpisode.id,
    showId: dbEpisode.show_id,
    season: dbEpisode.season_number,
    episode: dbEpisode.episode_number,
    title: dbEpisode.title,
    airDate: dbEpisode.air_date || '',
    watched: watched,
    watchedAt: undefined
  };
}

// Function to adapt Supabase user to application User format
export function adaptSupabaseUser(user: any): User {
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    avatar: user.user_metadata?.avatar_url || undefined
  };
}
