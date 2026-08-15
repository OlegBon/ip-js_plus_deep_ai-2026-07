"use client";

import React, { useState, useMemo } from 'react';
import Search from '../ui/Search';
import Pagination from '../ui/Pagination';
import { Button } from '../ui/Button';

type Conversion = {
  id: number;
  fileName: string;
  type: string;
  date: string;
  status: 'Completed' | 'Failed' | 'In Progress';
};

const mockConversions: Conversion[] = [
  { id: 1, fileName: 'report.docx', type: 'DOCX → PDF', date: '2026-08-11', status: 'Completed' },
  { id: 2, fileName: 'profile-pic.jpg', type: 'JPG → PNG', date: '2026-08-11', status: 'Completed' },
  { id: 3, fileName: 'invoice.pdf', type: 'PDF → DOCX', date: '2026-08-10', status: 'Failed' },
  { id: 4, fileName: 'company-logo.png', type: 'PNG → JPG', date: '2026-08-09', status: 'Completed' },
  { id: 5, fileName: 'draft.docx', type: 'DOCX → PDF', date: '2026-08-09', status: 'In Progress' },
  { id: 6, fileName: 'presentation.pptx', type: 'PPTX → PDF', date: '2026-08-12', status: 'Completed' },
  { id: 7, fileName: 'datasheet.xlsx', type: 'XLSX → CSV', date: '2026-08-12', status: 'Completed' },
  { id: 8, fileName: 'archive.zip', type: 'ZIP → TAR.GZ', date: '2026-08-11', status: 'Failed' },
];

const ITEMS_PER_PAGE = 5;

const StatusBadge = ({ status }: { status: string }) => {
  const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
  let statusClasses = '';
  switch (status) {
    case 'Completed':
      statusClasses = 'bg-green-100 text-green-800';
      break;
    case 'Failed':
      statusClasses = 'bg-red-100 text-red-800';
      break;
    case 'In Progress':
      statusClasses = 'bg-yellow-100 text-yellow-800';
      break;
    default:
      statusClasses = 'bg-gray-100 text-gray-800';
  }
  return <span className={`${baseClasses} ${statusClasses}`}>{status}</span>;
}

type SortConfig = { key: keyof Conversion; direction: 'ascending' | 'descending'; } | null;

const ConversionHistory = () => {
  const [conversions, setConversions] = useState(mockConversions);
  const [selected, setSelected] = useState<number[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredConversions = useMemo(() =>
    conversions.filter(conversion =>
      conversion.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversion.type.toLowerCase().includes(searchTerm.toLowerCase())
    ), [conversions, searchTerm]);

  const sortedConversions = useMemo(() => {
    let sortableItems = [...filteredConversions];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredConversions, sortConfig]);

  const paginatedConversions = sortedConversions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(sortedConversions.length / ITEMS_PER_PAGE);

  const requestSort = (key: keyof Conversion) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const renderSortArrow = (key: keyof Conversion) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
    }
    return null;
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Select all visible (paginated) items
      const allIds = paginatedConversions.map(c => c.id);
      setSelected(prevSelected => [...new Set([...prevSelected, ...allIds])]);
    } else {
      // Deselect all visible (paginated) items
      const pageIds = paginatedConversions.map(c => c.id);
      setSelected(selected.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(item => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleOpenConfirmModal = () => setIsConfirmModalOpen(true);
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  const handleDeleteSelected = () => {
    setConversions(conversions.filter(c => !selected.includes(c.id)));
    handleCloseConfirmModal();
    setSelected([]);
  };
  
  const isPageSelected = useMemo(() => {
    const pageIds = paginatedConversions.map(c => c.id);
    return pageIds.length > 0 && pageIds.every(id => selected.includes(id));
  }, [paginatedConversions, selected]);

  return (
    <>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <Search
              placeholder="Search files..."
              onSearch={(query) => {
                setSearchTerm(query);
                setCurrentPage(1);
              }}
              className="w-full max-w-xs"
            />
            {selected.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">{selected.length} item(s) selected</span>
                <Button 
                  onClick={handleOpenConfirmModal}
                  variant="secondary"
                >
                  Delete
                </Button>
                <Button>
                  Download
                </Button>
              </div>
            )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="p-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={isPageSelected}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('fileName')}>
                    <div className="flex items-center gap-1">File Name {renderSortArrow('fileName')}</div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('type')}>
                    <div className="flex items-center gap-1">Type {renderSortArrow('type')}</div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('date')}>
                    <div className="flex items-center gap-1">Date {renderSortArrow('date')}</div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('status')}>
                    <div className="flex items-center gap-1">Status {renderSortArrow('status')}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedConversions.map((conversion) => (
                <tr key={conversion.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="w-4 p-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(conversion.id)}
                        onChange={() => handleSelectOne(conversion.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{conversion.fileName}</td>
                  <td className="px-6 py-4">{conversion.type}</td>
                  <td className="px-6 py-4">{conversion.date}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={conversion.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleDeleteSelected}
        title="Delete Conversions"
        message={`Are you sure you want to delete ${selected.length} selected item(s)? This action cannot be undone.`}
      />
    </>
  );
};

export default ConversionHistory;
