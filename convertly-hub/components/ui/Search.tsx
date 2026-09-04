import * as React from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch: (query: string) => void;
  debounce?: number;
  value?: string;
  onValueChange?: (query: string) => void;
}

const Search: React.FC<SearchProps> = ({
  className,
  onSearch,
  debounce = 300,
  value,
  onValueChange,
  autoComplete = 'off',
  ...props
}) => {
  const [uncontrolledQuery, setUncontrolledQuery] = React.useState('');
  const query = value ?? uncontrolledQuery;

  React.useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(query);
    }, debounce);

    return () => {
      clearTimeout(handler);
    };
  }, [query, debounce, onSearch]);

  return (
    <div className={twMerge(clsx('relative', className))}>
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        autoComplete={autoComplete}
        value={query}
        onChange={(e) => {
          const nextQuery = e.target.value;
          if (value === undefined) setUncontrolledQuery(nextQuery);
          onValueChange?.(nextQuery);
        }}
        className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-10 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        {...props}
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            if (value === undefined) setUncontrolledQuery('');
            onValueChange?.('');
          }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 rounded p-1 text-gray-500 -translate-y-1/2 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default Search;
