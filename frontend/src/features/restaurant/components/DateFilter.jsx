import { MdDateRange } from 'react-icons/md';

const DateFilter = ({ dateFilter, onDateFilterChange }) => {
  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' }
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <MdDateRange className="text-lg text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2">
        {dateOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onDateFilterChange(option.value)}
            className={`btn btn-sm ${
              dateFilter === option.value 
                ? 'btn-secondary' 
                : 'btn-outline btn-secondary'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateFilter; 