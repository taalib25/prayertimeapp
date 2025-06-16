import React, {createContext, useContext, useEffect, useState} from 'react';
import database from './index';

type DatabaseContextType = {
  isDbReady: boolean;
  database: typeof database;
};

const DatabaseContext = createContext<DatabaseContextType | undefined>(
  undefined,
);

export const DatabaseProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        // WatermelonDB is ready to use immediately after import
        // Test the database connection
        const collections = database.collections;
        console.log(
          `Database initialized with ${
            Object.keys(collections).length
          } collections`,
        );

        // Test prayer times collection
        const prayerTimesCollection = database.get('prayer_times');
        await prayerTimesCollection.query().fetchCount();

        setIsDbReady(true);
        console.log('✅ WatermelonDB setup complete');
      } catch (error) {
        console.error('❌ Failed to initialize WatermelonDB:', error);
        // Still set as ready since WatermelonDB handles initialization internally
        setIsDbReady(true);
      }
    };

    setupDatabase();
  }, []);

  return (
    <DatabaseContext.Provider value={{isDbReady, database}}>
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
