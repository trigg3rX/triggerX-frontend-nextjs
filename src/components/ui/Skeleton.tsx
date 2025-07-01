import React from "react";

/**
 * Skeleton loading component.
 *
 * Props:
 * - width: width of each skeleton block (default: 100%)
 * - height: height of each skeleton block (default: 20)
 * - borderRadius: border radius of each block (default: 8)
 * - className: extra classes for each block
 * - style: extra style for each block
 * - rows: number of rows in the skeleton grid (optional)
 * - columns: number of columns in the skeleton grid (optional)
 */
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
  rows?: number;
  columns?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  className = "",
  style = {},
  rows,
  columns,
}) => {
  if (rows && columns) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div className="flex gap-2" key={rowIdx}>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div
                key={colIdx}
                className={`animate-pulse bg-white/10 border border-white/10 opacity-5 ${className}`}
                style={{
                  width,
                  height,
                  borderRadius,
                  ...style,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      className={`animate-pulse bg-white/10 border border-white/10 opacity-5 ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

export default Skeleton;
