import { Button } from './Button';

interface CursorPaginationProps {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  disabled?: boolean;
}

export function CursorPagination({
  page,
  totalPages,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  disabled = false,
}: CursorPaginationProps) {
  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <Button
        variant="secondary"
        size="sm"
        onClick={onPrevious}
        disabled={!canGoPrevious || disabled}
      >
        Previous
      </Button>
      <span className="text-sm text-text-secondary">
        Page {page} of {totalPages}
      </span>
      <Button variant="secondary" size="sm" onClick={onNext} disabled={!canGoNext || disabled}>
        Next
      </Button>
    </div>
  );
}
