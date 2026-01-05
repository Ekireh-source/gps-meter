'use client';

interface StatusIndicatorProps {
  status: 'ON' | 'OFF';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function StatusIndicator({
  status,
  size = 'md',
  showLabel = true,
}: StatusIndicatorProps) {
  const color = status === 'ON' ? 'green' : 'red';
  const bgColor = status === 'ON' ? 'bg-green-500' : 'bg-red-500';
  const textColor = status === 'ON' ? 'text-green-600' : 'text-red-600';
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${bgColor} ${sizeClasses[size]} rounded-full border-2 border-white shadow-sm`}
        aria-label={`Status: ${status}`}
      />
      {showLabel && (
        <span className={`text-sm font-medium ${textColor}`}>
          {status}
        </span>
      )}
    </div>
  );
}

