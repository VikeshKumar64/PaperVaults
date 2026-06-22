import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('adminToken');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
    setIsOpen(false);
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-blue-600" onClick={closeMenu}>
            📄 PaperVault
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-blue-600">
              Home
            </Link>
            <Link to="/papers" className="text-gray-600 hover:text-blue-600">
              Browse Papers
            </Link>
            <Link to="/upload" className="text-gray-600 hover:text-blue-600">
              Upload Paper
            </Link>
            {isLoggedIn ? (
              <>
                <Link to="/admin/dashboard" className="text-gray-600 hover:text-blue-600">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/admin/login"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-600 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link to="/" className="block py-2 text-gray-600 hover:text-blue-600" onClick={closeMenu}>
              Home
            </Link>
            <Link to="/papers" className="block py-2 text-gray-600 hover:text-blue-600" onClick={closeMenu}>
              Browse Papers
            </Link>
            <Link to="/upload" className="block py-2 text-gray-600 hover:text-blue-600" onClick={closeMenu}>
              Upload Paper
            </Link>
            {isLoggedIn ? (
              <>
                <Link to="/admin/dashboard" className="block py-2 text-gray-600 hover:text-blue-600" onClick={closeMenu}>
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-red-500 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/admin/login" className="block py-2 text-blue-600 hover:text-blue-700" onClick={closeMenu}>
                Admin Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
