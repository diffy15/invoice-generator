require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const productRoutes = require('./routes/productRoutes');
const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const companyRoutes = require('./routes/companyRoutes');
const categoryRoutes = require('./routes/categories');

const app = express();

/* -------------------- CORS -------------------- */
const allowedOrigins = [
  'http://localhost:3000',
  'https://invoice-generator-frontend.netlify.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- ROUTES -------------------- */
app.use('/api/products', productRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/categories', categoryRoutes);

/* -------------------- HEALTH CHECK -------------------- */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Invoice Generator API is running',
    environment: process.env.NODE_ENV
  });
});

/* -------------------- ERROR HANDLING -------------------- */
app.use(notFound);
app.use(errorHandler);

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);

  try {
    await connectDB();
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
});
