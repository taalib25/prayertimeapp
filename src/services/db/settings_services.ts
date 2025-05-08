import {getDatabase} from './dbInitalizer';

/**
 * Save a setting
 */
export const saveSetting = async (
  key: string,
  value: string,
): Promise<void> => {
  try {
    const db = await getDatabase();

    await db.executeSql('REPLACE INTO settings (key, value) VALUES (?, ?)', [
      key,
      value,
    ]);

    return Promise.resolve();
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    return Promise.reject(error);
  }
};

/**
 * Get a setting value
 */
export const getSetting = async (key: string): Promise<string | null> => {
  try {
    const db = await getDatabase();

    const [results] = await db.executeSql(
      'SELECT value FROM settings WHERE key = ?',
      [key],
    );

    if (results.rows.length > 0) {
      return results.rows.item(0).value;
    }
    return null;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return Promise.reject(error);
  }
};

/**
 * Get multiple settings at once
 */
export const getSettings = async (
  keys: string[],
): Promise<Record<string, string>> => {
  try {
    const db = await getDatabase();
    const placeholders = keys.map(() => '?').join(',');

    const [results] = await db.executeSql(
      `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
      keys,
    );

    const settings: Record<string, string> = {};
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      settings[row.key] = row.value;
    }

    return settings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return Promise.reject(error);
  }
};
