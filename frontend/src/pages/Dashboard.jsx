import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import { 
  FiFileText, 
  FiCheckCircle, 
  FiClock, 
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
  FiArrowRight
} from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      const response = await invoiceAPI.getInvoiceStats();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: FiDollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Invoices',
      value: stats?.totalInvoices || 0,
      icon: FiFileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Paid Invoices',
      value: stats?.paidInvoices || 0,
      icon: FiCheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Amount',
      value: formatCurrency(stats?.pendingAmount || 0),
      icon: FiClock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Received Amount',
      value: formatCurrency(stats?.receivedAmount || 0),
      icon: FiTrendingUp,
      color: 'bg-primary-500',
      textColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Unpaid Invoices',
      value: stats?.unpaidInvoices || 0,
      icon: FiAlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your business overview.</p>
      </div>
      
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold ${card.textColor}`}>
                    {card.value}
                  </p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`text-2xl ${card.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create New Invoice */}
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <Link
              to="/invoices/new"
              className="flex items-center justify-between p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <FiFileText className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Create New Invoice</p>
                  <p className="text-sm text-gray-600">Generate a new invoice for clients</p>
                </div>
              </div>
              <FiArrowRight className="text-primary-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/clients/new"
              className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 p-2 rounded-lg">
                  <FiFileText className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Add New Client</p>
                  <p className="text-sm text-gray-600">Register a new client</p>
                </div>
              </div>
              <FiArrowRight className="text-green-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/products/new"
              className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <FiFileText className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Add New Product/Service</p>
                  <p className="text-sm text-gray-600">Add to your service catalog</p>
                </div>
              </div>
              <FiArrowRight className="text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalRevenue > 0 
                    ? Math.round((stats?.receivedAmount / stats?.totalRevenue) * 100)
                    : 0
                  }%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {formatCurrency(stats?.receivedAmount || 0)} / {formatCurrency(stats?.totalRevenue || 0)}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paid</span>
                <span className="font-semibold text-green-600">{stats?.paidInvoices || 0} invoices</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Partial</span>
                <span className="font-semibold text-blue-600">{stats?.partialInvoices || 0} invoices</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unpaid</span>
                <span className="font-semibold text-red-600">{stats?.unpaidInvoices || 0} invoices</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;