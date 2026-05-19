
import React from 'react';
import { AdminMovieImport } from '@/components/admin/AdminMovieImport';
import RequireAdmin from '@/components/Auth/RequireAdmin';

export const AdminMovieImportPage: React.FC = () => {
  return (
    <RequireAdmin>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Import Movies</h1>
          <p className="text-muted-foreground">Upload a CSV file to import movie data.</p>
        </div>
        
        <AdminMovieImport />
      </div>
    </RequireAdmin>
  );
};

export default AdminMovieImportPage;
