
import * as React from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch: (query: string) => void;
  debounce?: number;
}

const Search: React.FC<SearchProps> = ({
  className,
  onSearch,
  debounce = 300,
  ...props
}) => {
  const [query, setQuery] = React.useState('');

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
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-4 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        {...props}
      />
    </div>
  );
};

export default Search;
