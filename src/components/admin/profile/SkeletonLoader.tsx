import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
  height?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  className = '', 
  lines = 1, 
  height = 'h-4' 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 dark:bg-gray-700 rounded ${height} ${
            index < lines - 1 ? 'mb-2' : ''
          }`}
        />
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-card dark:bg-slate-800/50 rounded-xl shadow-lg border border-border/50 dark:border-slate-700/50 p-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="flex-1">
          <SkeletonLoader height="h-4" className="w-3/4 mb-2" />
          <SkeletonLoader height="h-3" className="w-1/2" />
        </div>
      </div>
      <SkeletonLoader lines={3} height="h-3" />
    </div>
  );
};

export const GitHubStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="text-center">
          <SkeletonLoader height="h-8" className="w-16 mx-auto mb-2" />
          <SkeletonLoader height="h-3" className="w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
};

export const RepoSkeleton: React.FC = () => {
  return (
    <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border/50 dark:border-slate-700/50 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <SkeletonLoader height="h-5" className="w-3/4 mb-2" />
          <SkeletonLoader height="h-3" className="w-1/2 mb-2" />
          <SkeletonLoader lines={2} height="h-3" />
        </div>
        <div className="flex space-x-2">
          <SkeletonLoader height="h-6" className="w-16" />
          <SkeletonLoader height="h-6" className="w-16" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <SkeletonLoader height="h-4" className="w-20" />
        <SkeletonLoader height="h-4" className="w-16" />
        <SkeletonLoader height="h-4" className="w-24" />
      </div>
    </div>
  );
};

export const LinkedInProfileSkeleton: React.FC = () => {
  return (
    <div className="bg-card dark:bg-slate-800/50 rounded-xl shadow-lg border border-border/50 dark:border-slate-700/50 p-6">
      <div className="flex items-start space-x-4 mb-6">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="flex-1">
          <SkeletonLoader height="h-6" className="w-3/4 mb-2" />
          <SkeletonLoader height="h-4" className="w-1/2 mb-3" />
          <SkeletonLoader lines={3} height="h-3" />
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <SkeletonLoader height="h-5" className="w-1/4 mb-2" />
          <SkeletonLoader lines={2} height="h-3" />
        </div>
        <div>
          <SkeletonLoader height="h-5" className="w-1/4 mb-2" />
          <SkeletonLoader lines={3} height="h-3" />
        </div>
      </div>
    </div>
  );
};

export const ConnectionStatusSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-4 bg-card dark:bg-slate-800/50 rounded-lg border border-border/50 dark:border-slate-700/50">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div>
          <SkeletonLoader height="h-4" className="w-24 mb-1" />
          <SkeletonLoader height="h-3" className="w-16" />
        </div>
      </div>
      <SkeletonLoader height="h-8" className="w-20" />
    </div>
  );
};
