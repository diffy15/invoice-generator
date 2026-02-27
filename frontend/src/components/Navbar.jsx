import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiFileText, FiUsers,
  FiPackage, FiSettings, FiDollarSign, FiBarChart2, FiMenu, FiX
} from 'react-icons/fi';

const navItems = [
  { name: 'Dashboard',  path: '/',          icon: FiHome       },
  { name: 'Quotations', path: '/quotations', icon: FiFileText   },
  { name: 'Invoices',   path: '/invoices',   icon: FiFileText   },
  { name: 'Payments',   path: '/payments',   icon: FiDollarSign },
  { name: 'Reports',    path: '/reports',    icon: FiBarChart2  },
  { name: 'Clients',    path: '/clients',    icon: FiUsers      },
  { name: 'Products',   path: '/products',   icon: FiPackage    },
  { name: 'Company',    path: '/company',    icon: FiSettings   },
];

const Navbar = () => {
  const location    = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: 'linear-gradient(90deg, #B0D8C0 0%, #C0E8D0 50%, #B8DEC8 100%)',
        borderBottom: '1px solid #9CCBB0',
        boxShadow: '0 1px 8px rgba(80,160,110,0.15)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="p-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.7)' }}
            >
              <FiDollarSign className="text-green-800 text-xl" />
            </div>
            <span className="text-green-900 text-lg font-bold tracking-tight">
              Strategic<span className="text-green-700">Knights</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ name, path, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={
                    active
                      ? { background: 'rgba(255,255,255,0.6)', color: '#14532d', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }
                      : { color: '#1a5c36' }
                  }
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon className="text-base flex-shrink-0" />
                  {name}
                </Link>
              );
            })}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#1a5c36' }}
          >
            {open ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-3 pb-3 pt-1 space-y-0.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.5)', background: '#C4E8D4' }}
        >
          {navItems.map(({ name, path, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={
                  active
                    ? { background: 'rgba(255,255,255,0.55)', color: '#14532d' }
                    : { color: '#1a5c36' }
                }
              >
                <Icon className="text-base flex-shrink-0" />
                {name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;