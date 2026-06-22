const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Readable } = require('stream');

// ============================================================
// Express App Setup
// ============================================================
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// MongoDB Connection (cached across warm invocations)
// ============================================================
let isConnected = false;
let gridFSBucket = null;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
    });

    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Initialize GridFS bucket
    gridFSBucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
      bucketName: 'papers',
    });

    console.log('GridFS Bucket initialized');
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

const getGridFSBucket = () => {
  if (!gridFSBucket) {
    throw new Error('GridFS Bucket not initialized. Call connectDB first.');
  }
  return gridFSBucket;
};

// ============================================================
// Mongoose Model — Paper
// ============================================================
const paperSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    subjectName: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    examType: {
      type: String,
      required: [true, 'Exam type is required'],
      enum: ['MST1', 'MST2', 'EST'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    pdfFileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'PDF file is required'],
    },
    pdfName: {
      type: String,
      required: [true, 'PDF file name is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in warm starts
const Paper = mongoose.models.Paper || mongoose.model('Paper', paperSchema);

// ============================================================
// Middleware — JWT Auth Protection
// ============================================================
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// ============================================================
// Multer Config — Memory storage for GridFS upload
// ============================================================
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit (Netlify function response limit is 6MB)
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// ============================================================
// Middleware — Ensure DB connection before every request
// ============================================================
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// ============================================================
// Routes — Auth
// ============================================================

// @desc    Admin login
// @route   POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check against environment variables
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// Routes — Papers (Public)
// ============================================================

// @desc    Upload a paper (Student - no auth needed)
// @route   POST /api/papers/upload
app.post('/api/papers/upload', upload.single('pdfFile'), async (req, res) => {
  try {
    const { department, subjectName, semester, examType, year } = req.body;

    // Validate required fields
    if (!department || !subjectName || !semester || !examType || !year) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    // Upload to GridFS
    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: 'application/pdf',
    });

    // Use a promise to wait for upload completion
    await new Promise((resolve, reject) => {
      const readableStream = Readable.from(req.file.buffer);
      readableStream.pipe(uploadStream);

      uploadStream.on('error', (error) => {
        console.error('GridFS upload error:', error.message);
        reject(error);
      });

      uploadStream.on('finish', () => {
        resolve();
      });
    });

    const paper = await Paper.create({
      department,
      subjectName,
      semester: Number(semester),
      examType,
      year: Number(year),
      pdfFileId: uploadStream.id,
      pdfName: req.file.originalname,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Paper submitted successfully and waiting for admin approval.',
      paper,
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all approved papers (Public)
// @route   GET /api/papers
app.get('/api/papers', async (req, res) => {
  try {
    const { department, semester, examType, year, search } = req.query;

    const filter = { status: 'approved' };

    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (examType) filter.examType = examType;
    if (year) filter.year = Number(year);
    if (search) {
      filter.subjectName = { $regex: search, $options: 'i' };
    }

    const papers = await Paper.find(filter).sort({ createdAt: -1 });
    res.json(papers);
  } catch (error) {
    console.error('Get papers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    View PDF (buffer response — no streaming in serverless)
// @route   GET /api/papers/:id/view
app.get('/api/papers/:id/view', async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    const bucket = getGridFSBucket();

    // In serverless, we collect the stream into a buffer
    const chunks = [];
    const downloadStream = bucket.openDownloadStream(paper.pdfFileId);

    await new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk) => chunks.push(chunk));
      downloadStream.on('error', (error) => {
        console.error('PDF stream error:', error.message);
        reject(error);
      });
      downloadStream.on('end', () => resolve());
    });

    const buffer = Buffer.concat(chunks);

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${paper.pdfName}"`);
    res.set('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('View PDF error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Download PDF
// @route   GET /api/papers/:id/download
app.get('/api/papers/:id/download', async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    const bucket = getGridFSBucket();

    // Collect stream into buffer for serverless response
    const chunks = [];
    const downloadStream = bucket.openDownloadStream(paper.pdfFileId);

    await new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk) => chunks.push(chunk));
      downloadStream.on('error', (error) => {
        console.error('PDF download error:', error.message);
        reject(error);
      });
      downloadStream.on('end', () => resolve());
    });

    const buffer = Buffer.concat(chunks);

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${paper.pdfName}"`);
    res.set('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('Download PDF error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// Routes — Papers (Admin Protected)
// ============================================================

// @desc    Get all pending papers (Admin)
// @route   GET /api/papers/pending
app.get('/api/papers/pending', protect, async (req, res) => {
  try {
    const papers = await Paper.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(papers);
  } catch (error) {
    console.error('Get pending papers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all papers - all statuses (Admin)
// @route   GET /api/papers/all
app.get('/api/papers/all', protect, async (req, res) => {
  try {
    const papers = await Paper.find().sort({ createdAt: -1 });
    res.json(papers);
  } catch (error) {
    console.error('Get all papers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Approve a paper (Admin)
// @route   PUT /api/papers/:id/approve
app.put('/api/papers/:id/approve', protect, async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    paper.status = 'approved';
    await paper.save();

    res.json({ message: 'Paper approved successfully', paper });
  } catch (error) {
    console.error('Approve error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Reject a paper (Admin)
// @route   PUT /api/papers/:id/reject
app.put('/api/papers/:id/reject', protect, async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    paper.status = 'rejected';
    await paper.save();

    res.json({ message: 'Paper rejected', paper });
  } catch (error) {
    console.error('Reject error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a paper (Admin)
// @route   DELETE /api/papers/:id
app.delete('/api/papers/:id', protect, async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    // Delete file from GridFS
    try {
      const bucket = getGridFSBucket();
      await bucket.delete(paper.pdfFileId);
    } catch (gridError) {
      console.error('GridFS delete error:', gridError.message);
    }

    // Delete paper document
    await Paper.findByIdAndDelete(req.params.id);

    res.json({ message: 'Paper deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// Health Check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PaperVault API is running (serverless)' });
});

// ============================================================
// Error handling middleware
// ============================================================
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: 'Internal server error' });
});

// ============================================================
// Export as Netlify Function
// ============================================================
module.exports.handler = serverless(app);
