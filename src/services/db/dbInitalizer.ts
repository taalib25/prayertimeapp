import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let database: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (database) {
    return database;
  }
  
  return initDatabase();
};

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (database) {
    return database;
  }
  
  try {
    database = await SQLite.openDatabase({
      name: 'prayer_app.db',
      location: 'default'
    });
    
    await createTables();
    
    return database;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

async function createTables(): Promise<void> {
  if (!database) throw new Error('Database not initialized');
  
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS prayer_times (
      date TEXT PRIMARY KEY,
      fajr TEXT,
      sunrise TEXT,
      dhuhr TEXT,
      asr TEXT,
      maghrib TEXT,
      isha TEXT
    )
  `);
  

}

export const closeDatabase = async (): Promise<void> => {
  if (database) {
    await database.close();
    database = null;
  }
};