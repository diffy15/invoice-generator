import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import CreateInvoice from './pages/CreateInvoice';
import QuotationList from './pages/QuotationList';
import CreateQuotation from './pages/CreateQuotation';
import ClientList from './pages/ClientList';
import ProductList from './pages/ProductList';
import CompanySettings from './pages/CompanySettings';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quotations" element={<QuotationList />} />
            <Route path="/quotations/new" element={<CreateQuotation />} />
            <Route path="/quotations/edit/:id" element={<CreateQuotation />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/new" element={<CreateInvoice />} />
            <Route path="/invoices/edit/:id" element={<CreateInvoice />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/new" element={<ClientList />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/new" element={<ProductList />} />
            <Route path="/company" element={<CompanySettings />} />
          </Routes>
        </main>
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;