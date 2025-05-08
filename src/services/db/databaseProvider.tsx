import React, { createContext, useContext, useEffect, useState } from 'react';
import { closeDatabase, initDatabase } from './dbInitalizer';

type DatabaseContextType = {
  isDbReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isDbReady, setIsDbReady] = useState(false);
  
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDatabase();
        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Handle database initialization failure
      }
    };
    
    setupDatabase();
    
    return () => {
      closeDatabase();
    };
  }, []);
  
  return (
    <DatabaseContext.Provider value={{ isDbReady }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};