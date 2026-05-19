
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Film, Star, Play, Plus, Search } from 'lucide-react';

const MoviesApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('watchlist');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700 dark:text-blue-300 mb-2">
            Movies Tracker
          </h1>
          <p className="text-gray-700 dark:text-gray-300">Track your movie watchlist and ratings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
            <TabsTrigger value="watchlist" className="text-xs sm:text-sm">
              <Film className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Watchlist</span>
            </TabsTrigger>
            <TabsTrigger value="watched" className="text-xs sm:text-sm">
              <Play className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Watched</span>
            </TabsTrigger>
            <TabsTrigger value="ratings" className="text-xs sm:text-sm">
              <Star className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Ratings</span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="text-xs sm:text-sm">
              <Search className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Discover</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="watchlist" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">Your Watchlist</h2>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Movie
              </Button>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Placeholder cards */}
              {[1, 2, 3].map((i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="aspect-[2/3] bg-gray-200 rounded-lg mb-4"></div>
                    <CardTitle className="text-lg">Movie Title {i}</CardTitle>
                    <p className="text-sm text-gray-600">2024 • Action, Drama</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">Mark Watched</Button>
                      <Button size="sm" variant="outline" className="flex-1">Remove</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="watched" className="space-y-6">
            <h2 className="text-xl font-semibold">Watched Movies</h2>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 sm:p-8 shadow-lg text-center">
              <p className="text-lg text-gray-600 dark:text-gray-300">No watched movies yet. Start watching some movies!</p>
            </div>
          </TabsContent>

          <TabsContent value="ratings" className="space-y-6">
            <h2 className="text-xl font-semibold">Your Ratings</h2>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 sm:p-8 shadow-lg text-center">
              <p className="text-lg text-gray-600 dark:text-gray-300">Rate some movies to see your ratings here!</p>
            </div>
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            <h2 className="text-xl font-semibold">Discover Movies</h2>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 sm:p-8 shadow-lg text-center">
              <p className="text-lg text-gray-600 dark:text-gray-300">Movie discovery features coming soon!</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MoviesApp;
