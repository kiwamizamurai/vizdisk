import Lottie from 'lottie-react';
import type React from 'react';
import animationData from '@/assets/simple-spinner.json';

interface LoadingAnimationProps {
  size?: number;
  message?: string;
  className?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  size = 150,
  message = 'Loading...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-6 ${className}`}>
      <div style={{ width: size, height: size }}>
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: size, height: size }}
        />
      </div>
      {message && (
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">{message}</p>
          <div className="flex items-center justify-center space-x-1">
            <div
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingAnimation;
