const mongoose = require('mongoose');

let gridFSBucket;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Initialize GridFS bucket after connection
    gridFSBucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
      bucketName: 'papers',
    });

    console.log('GridFS Bucket initialized');
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const getGridFSBucket = () => {
  if (!gridFSBucket) {
    throw new Error('GridFS Bucket not initialized. Call connectDB first.');
  }
  return gridFSBucket;
};

module.exports = { connectDB, getGridFSBucket };
