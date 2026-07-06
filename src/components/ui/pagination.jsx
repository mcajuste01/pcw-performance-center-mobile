import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  const maxVisible = 5;
  
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{ borderColor: '#666', color: '#999' }}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {start > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            style={{ borderColor: '#666', color: '#999' }}
          >
            1
          </Button>
          {start > 2 && <span className="text-gray-500">...</span>}
        </>
      )}

      {pages.map(page => (
        <Button
          key={page}
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page)}
          style={page === currentPage ? {
            background: '#8b3dff',
            borderColor: '#8b3dff',
            color: '#fff'
          } : { borderColor: '#666', color: '#999' }}
        >
          {page}
        </Button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-gray-500">...</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            style={{ borderColor: '#666', color: '#999' }}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{ borderColor: '#666', color: '#999' }}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}