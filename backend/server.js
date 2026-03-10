require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const productRoutes = require('./routes/productRoutes');
const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const companyRoutes = require('./routes/companyRoutes');
const categoryRoutes = require('./routes/categories');
const quotationRoutes = require('./routes/quotations');

const app = express();

/* ── CORS ── */
const cors = require('cors');
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://invoice-generator-frontend.netlify.app',
  'https://invoice.strategicknights.com',
  'https://vocal-flan-6fd44b.netlify.app'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  maxAge: 86400
}));

/* ── Middleware ── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use((req, res, next) => { console.log(`${req.method} ${req.path}`); next(); });

/* ── Routes ── */
app.use('/api/products', productRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/quotations', quotationRoutes);

/* ── Health check ── */
app.get('/', (req, res) => res.json({ success: true, message: 'API running', env: process.env.NODE_ENV }));

/* ── Error handling ── */
app.use(notFound);
app.use(errorHandler);

/* ── Start: connect DB first, then listen ── */
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} · ${process.env.NODE_ENV}`);
  });
}).catch(err => {
  console.error('DB connection failed:', err);
  process.exit(1);
});