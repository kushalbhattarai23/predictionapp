
export interface AppModule {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  routes: AppRoute[];
  enabled: boolean;
}

export interface AppRoute {
  path: string;
  name: string;
  component: React.ComponentType;
  icon?: string;
}

export interface AppConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  routes: {
    path: string;
    name: string;
    icon: string;
  }[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

// TV Show Types
export interface Show {
  id: string;
  slug: string;
  name: string;
  totalEpisodes: number;
  watchedEpisodes: number;
  status: 'watching' | 'completed' | 'not-started';
  poster?: string;
  airDate?: string;
  genres?: string[];
  description?: string;
}

export interface Episode {
  id: string;
  showId: string;
  season: number;
  episode: number;
  title: string;
  airDate: string;
  watched: boolean;
  watchedAt?: string;
}

export interface Universe {
  id: string;
  slug: string;
  name: string;
  description?: string;
  showIds: string[];
  isPrivate: boolean;
  createdBy: string;
}

// Finance Types
export interface Wallet {
  id: string;
  slug: string;
  name: string;
  balance: number;
  currency: string;

}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  walletId: string;
  date: string;
  description?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
}

export interface Transfer {
  id: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  date: string;
  description?: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}
