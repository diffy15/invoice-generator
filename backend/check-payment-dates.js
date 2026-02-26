require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('./invoice-backend/models/Invoice');

async function checkPayments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');
    
    // Find invoices with payment history
    const invoices = await Invoice.find({ 
      'paymentHistory.0': { $exists: true } 
    }).limit(5);
    
    console.log(`Found ${invoices.length} invoices with payments\n`);
    
    invoices.forEach(inv => {
      console.log(`Invoice: ${inv.invoiceNumber}`);
      inv.paymentHistory.forEach((payment, idx) => {
        console.log(`  Payment ${idx + 1}:`);
        console.log(`    Amount: ₹${payment.amount}`);
        console.log(`    Date (raw): ${payment.paymentDate}`);
        console.log(`    Date (UTC): ${payment.paymentDate.toUTCString()}`);
        console.log(`    Date (IST): ${payment.paymentDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        console.log('');
      });
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkPayments();