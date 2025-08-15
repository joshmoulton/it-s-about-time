import React from 'react';

interface SmartImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function SmartImg({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  style,
  ...rest
}: SmartImgProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? undefined : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={className}
      style={{
        maxInlineSize: "100%",
        blockSize: "auto",
        ...style,
      }}
      {...rest}
    />
  );
}