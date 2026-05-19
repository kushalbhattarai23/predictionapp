
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrivateUniverses } from './PrivateUniverses';
import { PublicUniverses } from './PublicUniverses';

export const Universes: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">TV Show Universes</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Explore and manage your TV show universes
        </p>
      </div>

      <Tabs defaultValue="my-universes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-universes">My Universes</TabsTrigger>
          <TabsTrigger value="public-universes">Public Universes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-universes">
          <PrivateUniverses />
        </TabsContent>
        
        <TabsContent value="public-universes">
          <PublicUniverses />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Universes;
