import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  lazy?: boolean;
  quality?: number;
  sizes?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  lazy = true,
  quality = 75,
  sizes,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  // Generate optimized src URLs
  const generateSrcSet = (baseSrc: string) => {
    if (!width) return undefined;
    
    const sizes = [width, width * 2, width * 3];
    return sizes
      .map(size => `${baseSrc}?w=${size}&q=${quality} ${size}w`)
      .join(', ');
  };

  const optimizedSrc = width && height 
    ? `${src}?w=${width}&h=${height}&q=${quality}&fit=crop`
    : `${src}?q=${quality}`;

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  // Placeholder component
  const PlaceholderComponent = () => (
    <div 
      className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      {placeholder ? (
        <span className="text-gray-400 text-sm">{placeholder}</span>
      ) : (
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      )}
    </div>
  );

  // Error component
  const ErrorComponent = () => (
    <div 
      className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-center">
        <svg 
          className="w-8 h-8 text-gray-400 mx-auto mb-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
        <span className="text-gray-500 text-xs">Failed to load</span>
      </div>
    </div>
  );

  if (error) {
    return <ErrorComponent />;
  }

  if (!isInView) {
    return <PlaceholderComponent />;
  }

  return (
    <div className="relative">
      {!isLoaded && <PlaceholderComponent />}
      <img
        ref={imgRef}
        src={optimizedSrc}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy && !priority ? 'lazy' : 'eager'}
        decoding="async"
        style={{
          position: isLoaded ? 'static' : 'absolute',
          top: isLoaded ? 'auto' : 0,
          left: isLoaded ? 'auto' : 0,
        }}
      />
    </div>
  );
};

// Hook for preloading critical images
export const useImagePreloader = () => {
  const preloadImage = (src: string, priority = false) => {
    if (priority || ('connection' in navigator && (navigator as any).connection?.effectiveType !== 'slow-2g')) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }
  };

  return { preloadImage };
};