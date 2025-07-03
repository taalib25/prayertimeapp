// Simple test to verify the cache key generation for monthly data
const testData = [
  {
    monthLabel: 'January',
    year: 2024,
    zikr: {current: 10, total: 100},
    quran: {current: 5, total: 30},
    fajr: {current: 15, total: 31},
    isha: {current: 20, total: 31},
  },
  {
    monthLabel: 'February',
    year: 2024,
    zikr: {current: 12, total: 100},
    quran: {current: 8, total: 30},
    fajr: {current: 18, total: 29},
    isha: {current: 22, total: 29},
  },
];

// Test old cache key generation (problematic)
const oldCacheKey = `monthly-data-${JSON.stringify(testData).slice(0, 50)}`;
console.log('Old cache key:', oldCacheKey);

// Test new cache key generation (fixed)
const dataHash = testData
  .map(
    month =>
      `${month.monthLabel}-${month.year}-${month.zikr.current}-${month.quran.current}-${month.fajr.current}-${month.isha.current}`,
  )
  .join('|');
const newCacheKey = `monthly-data-${dataHash}`;
console.log('New cache key:', newCacheKey);

// Simulate Quran data change
const updatedTestData = JSON.parse(JSON.stringify(testData));
updatedTestData[1].quran.current = 10; // Change February Quran from 8 to 10

// Test old cache key with updated data
const oldCacheKeyUpdated = `monthly-data-${JSON.stringify(
  updatedTestData,
).slice(0, 50)}`;
console.log('Old cache key after update:', oldCacheKeyUpdated);
console.log('Old keys match:', oldCacheKey === oldCacheKeyUpdated);

// Test new cache key with updated data
const updatedDataHash = updatedTestData
  .map(
    month =>
      `${month.monthLabel}-${month.year}-${month.zikr.current}-${month.quran.current}-${month.fajr.current}-${month.isha.current}`,
  )
  .join('|');
const newCacheKeyUpdated = `monthly-data-${updatedDataHash}`;
console.log('New cache key after update:', newCacheKeyUpdated);
console.log('New keys match:', newCacheKey === newCacheKeyUpdated);
