import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-800 ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-gray-800 rounded-lg p-4 space-y-3" style={{ background: '#0f0f0f' }}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-gray-800 rounded-lg"
             style={{ background: '#0a0a0a' }}>
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}