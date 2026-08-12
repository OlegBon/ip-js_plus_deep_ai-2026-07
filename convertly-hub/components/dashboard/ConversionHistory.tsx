import React from 'react';

const mockConversions = [
  { id: 1, fileName: 'report.docx', type: 'DOCX → PDF', date: '2026-08-11', status: 'Completed' },
  { id: 2, fileName: 'profile-pic.jpg', type: 'JPG → PNG', date: '2026-08-11', status: 'Completed' },
  { id: 3, fileName: 'invoice.pdf', type: 'PDF → DOCX', date: '2026-08-10', status: 'Failed' },
  { id: 4, fileName: 'company-logo.png', type: 'PNG → JPG', date: '2026-08-09', status: 'Completed' },
  { id: 5, fileName: 'draft.docx', type: 'DOCX → PDF', date: '2026-08-09', status: 'In Progress' },
];

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

const ConversionHistory = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">File Name</th>
              <th scope="col" className="px-6 py-3">Type</th>
              <th scope="col" className="px-6 py-3">Date</th>
              <th scope="col" className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockConversions.map((conversion) => (
              <tr key={conversion.id} className="bg-white border-b">
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
    </div>
  );
};

export default ConversionHistory;
