import { Link } from 'react-router-dom';

import { ThemeToggle } from '../../components/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user, isAuthenticated, loading, login, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link
              to="/"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Smart Novel
            </Link>
            <nav className="hidden space-x-4 md:flex">
              <Link
                to="/"
                className="text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Home
              </Link>
              <Link
                to="/search"
                className="text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Search
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {!loading && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {user?.email}
                    </span>
                    <button
                      onClick={logout}
                      className="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={login}
                    className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    Login
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        {/* Mobile Navigation */}
        <nav className="mt-4 flex space-x-4 md:hidden">
          <Link
            to="/"
            className="text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Home
          </Link>
          <Link
            to="/search"
            className="text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
