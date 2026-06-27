export default function ResponsiveTable({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto -mx-4 sm:mx-0 ${className}`}>
      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
        {children}
      </div>
    </div>
  );
}
