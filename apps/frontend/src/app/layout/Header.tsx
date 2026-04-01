import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ThemeToggle } from '../../components/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search' },
] as const;

export function Header() {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

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
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {/* Desktop auth controls */}
            <div className="hidden md:flex md:items-center md:space-x-3">
              {!loading && (
                <>
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {user?.name ||
                          user?.preferredUsername ||
                          user?.email}
                      </span>
                      <button
                        onClick={logout}
                        title="Logout"
                        aria-label="Logout"
                        className="cursor-pointer rounded-md bg-gray-200 p-2 text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={login}
                      title="Login"
                      aria-label="Login"
                      className="cursor-pointer rounded-md bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                        />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
            <ThemeToggle />
            {/* Hamburger button - mobile only */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="cursor-pointer rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 md:hidden"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700 md:hidden">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMenu}
                  className="rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {!loading && (
              <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between px-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user?.name ||
                        user?.preferredUsername ||
                        user?.email}
                    </span>
                    <button
                      onClick={() => {
                        closeMenu();
                        logout();
                      }}
                      title="Logout"
                      aria-label="Logout"
                      className="cursor-pointer rounded-md bg-gray-200 p-2 text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="px-3">
                    <button
                      onClick={() => {
                        closeMenu();
                        login();
                      }}
                      title="Login"
                      aria-label="Login"
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                        />
                      </svg>
                      <span>Login</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
