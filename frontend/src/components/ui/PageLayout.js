import Navbar from "./Navbar";

export default function PageLayout({
  children,
  title,
  subtitle,
  actions,
  className = "",
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main
        className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${className}`}
      >
        {(title || actions) && (
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && (
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm sm:text-base text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-3 flex-wrap">
                {actions}
              </div>
            )}
          </div>
        )}

        {children}
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
          <p>
            Campus Drinking Water Management System &bull; The Empty Bottle
            Problem
          </p>
        </div>
      </footer>
    </div>
  );
}

