// Main component
export {default as MonthlyChallengeContent} from './MonthlyChallengeContent';

// Individual component exports
export {CompactChallengeCard} from './CompactChallengeCard';
export {default as EditModal} from './EditModal';
export {default as MonthView} from './MonthView';
export {default as PaginationIndicator} from './PaginationIndicator';

// Context exports for direct usage
export {
  MonthlyTaskProvider,
  useMonthlyTask,
} from '../../contexts/MonthlyTaskContext';
