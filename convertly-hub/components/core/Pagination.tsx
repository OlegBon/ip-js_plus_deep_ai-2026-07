"use client";

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    onPageChange(1);
  };

  const handleLast = () => {
    onPageChange(totalPages);
  };
  
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-gray-700">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleFirst}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
        >
          First
        </button>
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={handleLast}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default Pagination;
