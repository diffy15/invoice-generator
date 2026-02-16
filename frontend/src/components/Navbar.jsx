import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiFileText, 
  FiUsers, 
  FiPackage, 
  FiSettings, 
  FiDollarSign 
} from 'react-icons/fi';

const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: FiHome },
    { name: 'Quotations', path: '/quotations', icon: FiFileText },
    { name: 'Invoices', path: '/invoices', icon: FiFileText },
    { name: 'Clients', path: '/clients', icon: FiUsers },
    { name: 'Products', path: '/products', icon: FiPackage },
    { name: 'Company', path: '/company', icon: FiSettings },
  ];
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-green-600 p-2 rounded-lg">
              <FiDollarSign className="text-white text-xl" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Strategic<span className="text-green-600">Knights</span>
            </span>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
                    ${active 
                      ? 'bg-green-50 text-green-700 font-semibold' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`text-lg ${active ? 'text-green-600' : ''}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg
                  ${active 
                    ? 'bg-green-50 text-green-700 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`text-lg ${active ? 'text-green-600' : ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;