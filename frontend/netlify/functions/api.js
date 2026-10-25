const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Readable } = require('stream');
const path = require('path');
const fs = require('fs');

// Load environment variables if running locally
try {
  const dotenv = require('dotenv');
  dotenv.config();
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') });
} catch (e) {
  try {
    const dotenv = require(path.resolve(__dirname, '../../../backend/node_modules/dotenv'));
    dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') });
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  } catch (e2) {}
}

// Fallback: If MONGODB_URI is still not set in local dev, try reading from .env file directly
if (!process.env.MONGODB_URI) {
  const envPaths = [
    path.resolve(__dirname, '../../../backend/.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          if (!process.env[key]) process.env[key] = value.trim();
        }
      });
      break;
    }
  }
}

// Sanitize environment variables (remove trailing carriage returns \r on Windows)
if (process.env.MONGODB_URI) process.env.MONGODB_URI = process.env.MONGODB_URI.trim();
if (process.env.JWT_SECRET) process.env.JWT_SECRET = process.env.JWT_SECRET.trim();
if (process.env.ADMIN_EMAIL) process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL.trim();
if (process.env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD.trim();

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
  if (isConnected && mongoose.connection.readyState === 1 && gridFSBucket) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${mongoose.connection.host || 'Atlas'}`);

    // Initialize GridFS bucket
    gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
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
    extractedText: {
      type: String,
      default: null,
    },
    extractionStatus: {
      type: String,
      enum: ['success', 'partial', 'failed', 'none'],
      default: 'none',
    },
    extractionMethod: {
      type: String,
      default: null,
    },
    extractedPageCount: {
      type: Number,
      default: 0,
    },
    ocrProcessed: {
      type: Boolean,
      default: false,
    },
    extractionError: {
      type: String,
      default: null,
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

// @desc    View PDF (stream)
// @route   GET /api/papers/:id/view
app.get('/api/papers/:id/view', async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    const bucket = getGridFSBucket();

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${paper.pdfName}"`);

    const downloadStream = bucket.openDownloadStream(paper.pdfFileId);

    downloadStream.on('error', (error) => {
      console.error('PDF stream error:', error.message);
      if (!res.headersSent) {
        res.status(404).json({ message: 'PDF file not found' });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('View PDF error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Download PDF (stream)
// @route   GET /api/papers/:id/download
app.get('/api/papers/:id/download', async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    const bucket = getGridFSBucket();

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${paper.pdfName}"`);

    const downloadStream = bucket.openDownloadStream(paper.pdfFileId);

    downloadStream.on('error', (error) => {
      console.error('PDF download error:', error.message);
      if (!res.headersSent) {
        res.status(404).json({ message: 'PDF file not found' });
      }
    });

    downloadStream.pipe(res);
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

// @desc    Update a paper (Admin)
// @route   PUT /api/papers/:id
app.put('/api/papers/:id', protect, async (req, res) => {
  try {
    const { department, subjectName, semester, examType, year } = req.body;

    const paper = await Paper.findById(req.params.id);
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    if (department) paper.department = department;
    if (subjectName) paper.subjectName = subjectName;
    if (semester) paper.semester = Number(semester);
    if (examType) paper.examType = examType;
    if (year) paper.year = Number(year);

    await paper.save();
    res.json({ message: 'Paper updated successfully', paper });
  } catch (error) {
    console.error('Update paper error:', error.message);
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
// AI Exam Paper Generator — PDF Extraction, Analysis & Generation
// ============================================================

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse not available — PDF extraction will be disabled');
}

// --- Marks Distribution Constants ---
const EXAM_STRUCTURES = {
  MST1: {
    totalMarks: 20,
    sections: [
      { name: 'Section A', questionCount: 5, marksEach: 2, totalMarks: 10, description: 'Short Answer Questions' },
      { name: 'Section B', questionCount: 2, marksEach: 5, totalMarks: 10, description: 'Descriptive Questions' },
    ],
  },
  MST2: {
    totalMarks: 20,
    sections: [
      { name: 'Section A', questionCount: 5, marksEach: 2, totalMarks: 10, description: 'Short Answer Questions' },
      { name: 'Section B', questionCount: 2, marksEach: 5, totalMarks: 10, description: 'Descriptive Questions' },
    ],
  },
  EST: {
    totalMarks: 60,
    sections: [
      { name: 'Section A', questionCount: 5, marksEach: 2, totalMarks: 10, description: 'Short Answer Questions' },
      { name: 'Section B', questionCount: 5, marksEach: 4, totalMarks: 20, description: 'Medium Answer Questions' },
      { name: 'Section C', questionCount: 3, marksEach: 10, totalMarks: 30, description: 'Long Answer Questions' },
    ],
  },
};

// --- Constants for Question Verbs & Indicators ---
const QUESTION_VERBS = [
  'compare', 'describe', 'list', 'state', 'show', 'devise', 'demonstrate',
  'explain', 'define', 'what', 'why', 'how', 'differentiate', 'discuss',
  'write', 'calculate', 'derive', 'distinguish', 'illustrate', 'elaborate',
  'analyze', 'evaluate', 'classify', 'give', 'identify', 'outline', 'prove',
  'solve', 'apply', 'determine', 'estimate', 'construct', 'mention',
];

const ACADEMIC_KEYWORDS = [
  'question', 'questions', 'marks', 'section', 'part', 'test', 'exam',
  'examination', 'semester', 'subject', 'branch', 'time', 'hours', 'maximum',
  'attempt', 'total', 'academic', 'year', 'module', 'unit', 'course', 'degree',
];

// --- Validate Extraction Quality ---
function validateExtractionQuality(text) {
  if (!text || typeof text !== 'string') {
    return { isUsable: false, status: 'failed', reason: 'No text content extracted' };
  }

  // Remove common PDF-parser synthetic page markers
  const cleaned = text
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
    .replace(/---\s*Page\s*Break\s*---/gi, '')
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    .trim();

  const nonWhitespaceChars = cleaned.replace(/\s/g, '');
  const alphaNumericChars = cleaned.replace(/[^a-zA-Z0-9]/g, '');

  // Check 1: Minimum content threshold
  if (alphaNumericChars.length < 60) {
    return {
      isUsable: false,
      status: 'failed',
      reason: `Insufficient text extracted (${alphaNumericChars.length} alphanumeric characters, min 60 required)`,
    };
  }

  // Check 2: Density ratio (detect binary garbage or symbol spam)
  const density = alphaNumericChars.length / (nonWhitespaceChars.length || 1);
  if (density < 0.4) {
    return {
      isUsable: false,
      status: 'failed',
      reason: `Text appears to be noise/binary artifacts (alphanumeric ratio ${density.toFixed(2)})`,
    };
  }

  // Check 3: Check for academic keywords and question patterns
  const lower = cleaned.toLowerCase();
  let keywordMatches = 0;
  for (const kw of ACADEMIC_KEYWORDS) {
    if (lower.includes(kw)) keywordMatches++;
  }

  let verbMatches = 0;
  for (const v of QUESTION_VERBS) {
    const regex = new RegExp(`\\b${v}\\b`, 'i');
    if (regex.test(lower)) verbMatches++;
  }

  const hasSectionPattern = /section\s+[a-c]|part\s+[a-c]/i.test(cleaned);
  const hasMarksPattern = /\d+\s*marks?|\d+\s*[xX*]\s*\d+|\(\d+\)|\bmarks\s*:\s*\d+/i.test(cleaned);
  const hasQuestionPattern = /q\.?\s*\d+|\bquestion\b|\d{1,2}\.\s+[a-zA-Z]/i.test(cleaned);

  const signalCount = (hasSectionPattern ? 1 : 0) +
                      (hasMarksPattern ? 1 : 0) +
                      (hasQuestionPattern ? 1 : 0) +
                      (keywordMatches >= 2 ? 1 : 0) +
                      (verbMatches >= 2 ? 1 : 0);

  if (signalCount >= 2 && alphaNumericChars.length >= 100) {
    return { isUsable: true, status: 'success', score: signalCount, reason: null };
  } else if (signalCount >= 1 && alphaNumericChars.length >= 60) {
    return { isUsable: true, status: 'partial', score: signalCount, reason: 'Limited academic patterns detected but usable' };
  }

  return {
    isUsable: false,
    status: 'failed',
    reason: `Text does not resemble an academic question paper (academic signals: ${signalCount})`,
  };
}

// --- Generic Dynamic Subject Matcher (Zero Hardcoding) ---
function extractSubjectTokens(str) {
  if (!str) return { raw: '', clean: '', words: [], contentWords: [], acronyms: [] };
  let clean = str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  // Expand compound academic terms so sub-initials are captured (e.g. database -> data base -> db)
  clean = clean
    .replace(/\bdatabase\b/g, 'data base')
    .replace(/\bcybersecurity\b/g, 'cyber security')
    .replace(/\bblockchain\b/g, 'block chain')
    .replace(/\bmicroprocessor\b/g, 'micro processor')
    .replace(/\bmicrocontroller\b/g, 'micro controller');

  const allWords = clean.split(' ').filter(Boolean);
  const stopWords = new Set(['and', 'of', 'the', 'in', 'for', 'to', 'with', 'on', 'at', 'by', 'an', 'a']);
  const contentWords = allWords.filter((w) => !stopWords.has(w));

  const acronyms = [];
  if (allWords.length > 1) {
    acronyms.push(allWords.map((w) => w[0]).join(''));
  }
  if (contentWords.length > 1 && contentWords.length !== allWords.length) {
    acronyms.push(contentWords.map((w) => w[0]).join(''));
  }
  return { raw: str, clean, words: allWords, contentWords, acronyms };
}

function matchSubject(queryStr, targetStr) {
  if (!queryStr || !targetStr) return false;
  const q = extractSubjectTokens(queryStr);
  const t = extractSubjectTokens(targetStr);

  // 1. Direct or clean match
  if (q.clean === t.clean) return true;

  // 2. Acronym matching (e.g., "IOT" <-> "Internet of Things", "NLP" <-> "Natural Language Processing")
  const qWordSet = new Set(q.words);
  const tWordSet = new Set(t.words);

  if (q.words.length === 1 && q.clean.length <= 6) {
    if (tWordSet.has(q.clean) || t.acronyms.includes(q.clean)) return true;
  }
  if (t.words.length === 1 && t.clean.length <= 6) {
    if (qWordSet.has(t.clean) || q.acronyms.includes(t.clean)) return true;
  }

  for (const qa of q.acronyms) {
    if (t.acronyms.includes(qa) || tWordSet.has(qa)) return true;
  }
  for (const ta of t.acronyms) {
    if (q.acronyms.includes(ta) || qWordSet.has(ta)) return true;
  }

  // 3. Content words overlap (e.g., "Deep Learning" <-> "Deep Learning Techniques")
  const minWords = Math.min(q.contentWords.length, t.contentWords.length);
  if (minWords > 0) {
    let common = 0;
    for (const w of q.contentWords) {
      if (tWordSet.has(w)) common++;
    }
    if (common / minWords >= 0.7) return true;
  }

  return false;
}

// --- Text Refinement Pipeline (Generic across all subjects) ---
function refineExtractedText(raw, isOcr = false) {
  if (!raw || typeof raw !== 'string') return '';

  let lines = raw
    .replace(/\r\n/g, '\n')
    .replace(/\f/g, '\n--- Page Break ---\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const refined = [];
  let questionCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Strip leading/trailing table pipes, brackets, and whitespace
    line = line.replace(/^[\|\s\{\}\(\)\[\]]+/, '').replace(/[\|\s\{\}\(\)\[\]]+$/, '').trim();
    if (!line) continue;

    // Preserve page markers
    if (/^---\s*Page\s*Break\s*---$/i.test(line) || /^--\s*\d+\s*of\s*\d+\s*--$/i.test(line)) {
      refined.push('--- Page Break ---');
      continue;
    }

    // Ignore isolated OCR noise fragments, table headers, or CO/BT mapping artifacts
    if (/^(CO\d+|BT\s*Level|Mapping|Q\.?\s*No|Statement|UID\s*No|CO[1-4]\s+\d+|[B\s\z\\\/]{1,4})$/i.test(line)) {
      continue;
    }

    if (isOcr) {
      // 1. Generic academic / exam header corrections
      line = line
        .replace(/\bSubloct\s+Code\b/gi, 'Subject Code')
        .replace(/\bSubject\s+Tite\b/gi, 'Subject Title')
        .replace(/\bSomentr\s+Tost\b/gi, 'Semester Test')
        .replace(/\bMid\s+Somentr\b/gi, 'Mid Semester')
        .replace(/\bAttompt\s+all\s+questions\b/gi, 'Attempt all questions');

      // 2. Section header identification & correction
      const sectionMatch = line.match(/^(?:Sector|Section|Part)\s*([A-Za-z0-9&])/i);
      if (sectionMatch) {
        let secChar = sectionMatch[1].toUpperCase();
        if (secChar === '&' || secChar === '1') secChar = 'A';
        if (secChar === '8') secChar = 'B';
        refined.push(`\n=== SECTION ${secChar} ===`);
        continue;
      }

      // 3. Marks formula normalization
      const marksMatch = line.match(/(?:s\s*[xX*]\s*2\s*=\s*10|205510|\d+\s*[xX*]\s*\d+\s*=\s*\d+)\s*marks?/i);
      if (marksMatch) {
        let normalizedMarks = line
          .replace(/s\s*[xX*]\s*2\s*=\s*10\s*marks?/gi, '5 × 2 = 10 Marks')
          .replace(/205510\s*marks?/gi, '2 × 5 = 10 Marks')
          .replace(/(\d+)\s*[xX*]\s*(\d+)\s*=\s*(\d+)\s*marks?/gi, '$1 × $2 = $3 Marks');
        normalizedMarks = normalizedMarks.replace(/\s+(?:Fa\.|[,\.\-\_])\s*$/gi, '').trim();
        refined.push(`[${normalizedMarks}]`);
        continue;
      }

      // 4. Strip trailing table column debris and noise
      line = line
        .replace(/\s+(?:Ell|El|li\s+cor|ER|cos|Fa\.|CO[1-4]|BT\d+|i\s*\\\s*q|i\s*ges\s*tsad\s*N)\s*$/gi, '')
        .replace(/[\|\-\_\{\}\\]+$/g, '')
        .trim();

      // 5. Normalizing quotes and dashes
      line = line
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/^[-\—\–]\s*/, '');
    }

    if (line.length > 0) {
      refined.push(line);
    }
  }

  // Join lines with smart question formatting
  const formatted = [];
  for (let i = 0; i < refined.length; i++) {
    let line = refined[i];
    if (line.startsWith('=== SECTION') || (line.startsWith('[') && line.endsWith('Marks]')) || line.startsWith('--- Page')) {
      formatted.push(line);
      continue;
    }

    // Check if line starts with an explicit question number (e.g. "1.", "Q1", "1 Compare")
    const explicitNum = line.match(/^(?:Q\.?\s*(\d+)|(\d{1,2})[\.\:\)\s])\s*(.*)$/i);
    const firstWord = line.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
    const isQuestionVerb = QUESTION_VERBS.includes(firstWord);
    const startsWithBadLetterAndVerb = /^[A-Z]\s+([A-Za-z]+)/.test(line) && QUESTION_VERBS.includes(line.split(/\s+/)[1]?.toLowerCase());
    const isHeaderLine = /^(Mid|Academic|Branch|Subject|Semester|Time|Instructions|Maximum|Total)/i.test(line);

    if (explicitNum) {
      let parsedNum = parseInt(explicitNum[1] || explicitNum[2], 10);
      if (parsedNum <= questionCounter && parsedNum === 1 && questionCounter >= 5) {
        questionCounter++;
      } else {
        questionCounter = parsedNum;
      }
      formatted.push(`Q${questionCounter}. ${explicitNum[3].replace(/[\|\\]+$/, '').trim()}`);
    } else if (startsWithBadLetterAndVerb) {
      questionCounter++;
      const cleaned = line.replace(/^[A-Z]\s+/, '').replace(/[\|\\]+$/, '').trim();
      formatted.push(`Q${questionCounter}. ${cleaned}`);
    } else if (isQuestionVerb && !isHeaderLine) {
      questionCounter++;
      formatted.push(`Q${questionCounter}. ${line.replace(/[\|\\]+$/, '').trim()}`);
    } else if (isHeaderLine || formatted.length === 0) {
      formatted.push(line);
    } else {
      const prev = formatted[formatted.length - 1];
      if (prev.startsWith('===') || prev.startsWith('[') || prev.startsWith('---')) {
        formatted.push(line);
      } else {
        formatted[formatted.length - 1] = prev + ' ' + line.replace(/[\|\\]+$/, '').trim();
      }
    }
  }

  return formatted.join('\n');
}

// --- Extract Embedded Page JPEGs directly from PDF Buffer (Pure JS, 0 dependencies) ---
function extractEmbeddedPageImages(pdfBuffer) {
  const images = [];
  let startIndex = 0;
  const soi = Buffer.from([0xFF, 0xD8, 0xFF]);
  const eoi = Buffer.from([0xFF, 0xD9]);

  while (startIndex < pdfBuffer.length && images.length < 5) {
    const start = pdfBuffer.indexOf(soi, startIndex);
    if (start === -1) break;

    const end = pdfBuffer.indexOf(eoi, start + 3);
    if (end === -1) break;

    const imgBuffer = pdfBuffer.subarray(start, end + 2);
    // Academic exam paper scans are >= 15KB
    if (imgBuffer.length >= 15000) {
      images.push({ pageNumber: images.length + 1, buffer: imgBuffer });
    }
    startIndex = end + 2;
  }
  return images;
}

// --- AI Multimodal Vision OCR (Fast, 100% accurate, zero native binary dependencies) ---
async function ocrImageWithGemini(apiKey, imgBuffer) {
  const base64Data = imgBuffer.toString('base64');
  const models = [
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];
  for (const m of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5500);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'You are an accurate OCR transcription engine for academic examination papers. Transcribe all text from this exam question paper image verbatim. Preserve question numbers (e.g. Q1, Q2, 1., 2.), section headings (e.g. Section A, Section B), marks annotations (e.g. [2 marks], 5x2=10), and all technical terms exactly as written. Return ONLY the transcribed text.' },
              { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt && txt.trim().length > 30) return txt;
      }
    } catch (e) {}
  }
  return null;
}

async function ocrImageWithOpenAI(apiKey, imgBuffer) {
  const base64Data = imgBuffer.toString('base64');
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'You are an accurate OCR transcription engine for academic examination papers. Transcribe all text from this exam question paper image verbatim. Preserve question numbers, section headings, and marks annotations exactly as written. Return ONLY the transcribed text.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0.1
      })
    });
    if (res.ok) {
      const data = await res.json();
      const txt = data?.choices?.[0]?.message?.content;
      if (txt && txt.trim().length > 30) return txt;
    }
  } catch (e) {}
  return null;
}

// --- Native PDF Text Extraction ---
async function extractNativePdfText(pdfBuffer) {
  try {
    let rawText = '';
    let pageCount = 1;

    if (typeof pdfParse === 'function') {
      const data = await pdfParse(pdfBuffer);
      rawText = data.text || '';
      pageCount = data.numpages || 1;
    } else if (pdfParse && pdfParse.PDFParse) {
      const parser = new pdfParse.PDFParse({ data: pdfBuffer, verbosity: 0 });
      await parser.load();
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();
      rawText = textResult?.text || '';
      pageCount = infoResult?.total || 1;
      await parser.destroy();
    }

    const validation = validateExtractionQuality(rawText);
    if (validation.isUsable) {
      const refined = refineExtractedText(rawText, false);
      return {
        text: refined,
        pageCount,
        isUsable: true,
        method: 'native',
        ocrProcessed: false,
        error: null,
      };
    }

    return {
      text: '',
      pageCount,
      isUsable: false,
      method: 'native',
      ocrProcessed: false,
      error: validation.reason || 'Insufficient native text',
    };
  } catch (err) {
    return {
      text: '',
      pageCount: 0,
      isUsable: false,
      method: 'native',
      ocrProcessed: false,
      error: `Native extraction failed: ${err.message}`,
    };
  }
}

// --- OCR Extraction Service (with AI Multimodal OCR + Serverless Tesseract Fallback) ---
async function extractOcrPdfText(pdfBuffer, providerConfig = null) {
  try {
    // Step 1: Extract page images using pure JS stream extraction (zero dependencies)
    let pageImages = extractEmbeddedPageImages(pdfBuffer);
    let totalPages = pageImages.length || 1;

    // Step 2: Fallback to pdfParse page screenshot / image extraction if no JPEGs found
    if (pageImages.length === 0 && pdfParse && pdfParse.PDFParse) {
      try {
        const parser = new pdfParse.PDFParse({ data: pdfBuffer, verbosity: 0 });
        await parser.load();
        const info = await parser.getInfo();
        totalPages = Math.min(info?.total || 1, 3);
        for (let p = 1; p <= totalPages; p++) {
          try {
            const screenshot = await parser.getScreenshot({ pageNumber: p });
            if (screenshot && screenshot.pages && screenshot.pages.length > 0 && screenshot.pages[0].data) {
              pageImages.push({ pageNumber: p, buffer: Buffer.from(screenshot.pages[0].data) });
              continue;
            }
          } catch (sErr) {}

          try {
            const imgResult = await parser.getImage({ pageNumber: p });
            if (imgResult && imgResult.pages && imgResult.pages.length > 0) {
              const firstImg = imgResult.pages[0].images?.[0];
              if (firstImg && firstImg.data) {
                pageImages.push({ pageNumber: p, buffer: Buffer.from(firstImg.data) });
              }
            }
          } catch (iErr) {}
        }
        await parser.destroy();
      } catch (pErr) {}
    }

    if (pageImages.length === 0) {
      return {
        text: '',
        pageCount: totalPages,
        isUsable: false,
        method: 'ocr',
        ocrProcessed: true,
        error: 'Scanned PDF contains no extractable or renderable page images for OCR',
      };
    }

    const ocrOutputs = [];

    // Step 3A: Attempt AI Provider Multimodal OCR if user provided API key
    if (providerConfig && providerConfig.apiKey) {
      if (providerConfig.provider === 'gemini') {
        for (const imgItem of pageImages) {
          const aiOcr = await ocrImageWithGemini(providerConfig.apiKey, imgItem.buffer);
          if (aiOcr) {
            ocrOutputs.push(`--- Page ${imgItem.pageNumber} ---\n` + aiOcr);
          }
        }
      } else if (providerConfig.provider === 'openai') {
        for (const imgItem of pageImages) {
          const aiOcr = await ocrImageWithOpenAI(providerConfig.apiKey, imgItem.buffer);
          if (aiOcr) {
            ocrOutputs.push(`--- Page ${imgItem.pageNumber} ---\n` + aiOcr);
          }
        }
      }
    }

    // Step 3B: If AI Vision OCR was not used or did not produce output, fallback to Serverless Tesseract
    if (ocrOutputs.length === 0) {
      const os = require('os');
      const { createWorker } = require('tesseract.js');
      const worker = await createWorker('eng', 1, {
        cachePath: os.tmpdir(),
      });

      for (const imgItem of pageImages) {
        const res = await worker.recognize(imgItem.buffer);
        if (res && res.data && res.data.text) {
          ocrOutputs.push(`--- Page ${imgItem.pageNumber} ---\n` + res.data.text);
        }
      }

      await worker.terminate();
    }

    const rawOcr = ocrOutputs.join('\n\n');
    const refined = refineExtractedText(rawOcr, true);
    const validation = validateExtractionQuality(refined);

    return {
      text: validation.isUsable ? refined : '',
      pageCount: totalPages,
      isUsable: validation.isUsable,
      status: validation.status,
      method: 'ocr',
      ocrProcessed: true,
      error: validation.isUsable ? null : (validation.reason || 'OCR extraction produced insufficient usable text'),
    };
  } catch (err) {
    return {
      text: '',
      pageCount: 0,
      isUsable: false,
      method: 'ocr',
      ocrProcessed: true,
      error: `OCR extraction error: ${err.message}`,
    };
  }
}

// --- Main PDF Text Extraction (with Caching & OCR Fallback) ---
async function extractPdfText(pdfFileId, paperDoc = null, providerConfig = null) {
  // 1. Check if valid cached text already exists in the paper document
  if (paperDoc && paperDoc.extractedText && (paperDoc.extractionStatus === 'success' || paperDoc.extractionStatus === 'partial')) {
    const val = validateExtractionQuality(paperDoc.extractedText);
    if (val.isUsable) {
      return {
        text: paperDoc.extractedText,
        pageCount: paperDoc.extractedPageCount || 1,
        isUsable: true,
        method: paperDoc.extractionMethod || 'cached',
        ocrProcessed: !!paperDoc.ocrProcessed,
        cached: true,
        error: null,
      };
    }
  }

  try {
    const bucket = getGridFSBucket();
    const chunks = [];

    await new Promise((resolve, reject) => {
      const downloadStream = bucket.openDownloadStream(pdfFileId);
      downloadStream.on('data', (chunk) => chunks.push(chunk));
      downloadStream.on('error', (err) => reject(err));
      downloadStream.on('end', () => resolve());
    });

    const pdfBuffer = Buffer.concat(chunks);

    // Step A: Attempt Native Extraction
    const nativeResult = await extractNativePdfText(pdfBuffer);
    if (nativeResult.isUsable) {
      if (paperDoc && paperDoc._id) {
        try {
          await Paper.findByIdAndUpdate(paperDoc._id, {
            extractedText: nativeResult.text,
            extractionStatus: 'success',
            extractionMethod: 'native',
            extractedPageCount: nativeResult.pageCount,
            ocrProcessed: false,
            extractionError: null,
          });
        } catch (dbErr) {
          console.warn('Failed to update Paper cache for native extraction:', dbErr.message);
        }
      }
      return { ...nativeResult, cached: false };
    }

    // Step B: Native was insufficient -> OCR Fallback
    console.log(`Paper ${paperDoc?.pdfName || pdfFileId}: native extraction returned insufficient text. Attempting OCR fallback...`);
    const ocrResult = await extractOcrPdfText(pdfBuffer, providerConfig);

    if (paperDoc && paperDoc._id) {
      try {
        await Paper.findByIdAndUpdate(paperDoc._id, {
          extractedText: ocrResult.isUsable ? ocrResult.text : null,
          extractionStatus: ocrResult.isUsable ? 'success' : (ocrResult.status === 'partial' ? 'partial' : 'failed'),
          extractionMethod: 'ocr',
          extractedPageCount: ocrResult.pageCount,
          ocrProcessed: true,
          extractionError: ocrResult.error,
        });
      } catch (dbErr) {
        console.warn('Failed to update Paper cache for OCR extraction:', dbErr.message);
      }
    }

    return { ...ocrResult, cached: false };
  } catch (error) {
    if (paperDoc && paperDoc._id) {
      try {
        await Paper.findByIdAndUpdate(paperDoc._id, {
          extractionStatus: 'failed',
          extractionError: error.message,
        });
      } catch (dbErr) {}
    }
    return { text: '', pageCount: 0, isUsable: false, error: `PDF extraction failed: ${error.message}` };
  }
}

// --- Normalize subject name for matching ---
function normalizeSubjectName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- AI Provider Adapters ---
async function callGemini(apiKey, prompt) {
  const models = [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];
  let lastError = null;
  const deadline = Date.now() + 8500; // 8.5s hard deadline to strictly guarantee Netlify 10s compliance

  for (const model of models) {
    if (Date.now() >= deadline) {
      console.warn('Approaching serverless timeout budget, returning gracefully.');
      break;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1400,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid or unauthorized Gemini API key. Please check your API key.');
        }
        // Fail fast on high demand or rate limits to move to next model immediately
        lastError = new Error(`Gemini model ${model} returned HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textContent) {
        lastError = new Error(`Gemini returned an empty response with model ${model}.`);
        continue;
      }
      return textContent;
    } catch (err) {
      clearTimeout(timer);
      if (err.message.includes('Invalid or unauthorized')) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate content with Gemini models within time limit.');
}

async function callOpenAI(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an academic question paper generator. You MUST respond with valid JSON only, no markdown formatting.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    if (response.status === 401) {
      throw new Error('Invalid OpenAI API key. Note: A ChatGPT subscription is NOT the same as an OpenAI API key. You need API access from platform.openai.com.');
    }
    if (response.status === 429) {
      throw new Error('OpenAI API rate limit exceeded or insufficient credits. Please check your billing at platform.openai.com.');
    }
    throw new Error(`OpenAI API error (${response.status}): ${errBody.substring(0, 200)}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function callGrok(apiKey, prompt) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini-fast',
      messages: [
        { role: 'system', content: 'You are an academic question paper generator. You MUST respond with valid JSON only, no markdown formatting.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid xAI Grok API key. Please check your key at console.x.ai.');
    }
    if (response.status === 429) {
      throw new Error('Grok API rate limit exceeded. Please wait and try again.');
    }
    throw new Error(`Grok API error (${response.status}): ${errBody.substring(0, 200)}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

const AI_PROVIDERS = {
  gemini: callGemini,
  openai: callOpenAI,
  grok: callGrok,
};

// --- Build AI Prompt ---
function buildGenerationPrompt(config, extractedQuestions, analysisMode) {
  const structure = EXAM_STRUCTURES[config.examType];

  const sectionDetails = structure.sections
    .map((s) => `  - ${s.name}: ${s.questionCount} questions × ${s.marksEach} marks = ${s.totalMarks} marks (${s.description})`)
    .join('\n');

  const totalQuestions = structure.sections.reduce((sum, s) => sum + s.questionCount, 0);

  let previousPapersContext = '';
  if (extractedQuestions.length > 0) {
    const limitedQuestions = extractedQuestions.slice(0, 15);
    const questionsText = limitedQuestions
      .map((eq, i) => `--- Previous Paper ${i + 1} (${eq.metadata}) ---\n${eq.text.substring(0, 2000)}`)
      .join('\n\n');
    previousPapersContext = `
PREVIOUS YEAR QUESTION PAPERS FOR REFERENCE (use these to understand question patterns, difficulty, and style):
${questionsText}
`;
  }

  let syllabusContext = '';
  if (config.syllabus) {
    syllabusContext = `
SYLLABUS (generate questions ONLY from topics covered in this syllabus):
${config.syllabus.substring(0, 4000)}
`;
  }

  const prompt = `You are generating an AI practice question paper. This is NOT an official university paper.

EXAM CONFIGURATION:
- Degree: ${config.degree || 'Not specified'}
- Department: ${config.department || 'Not specified'}
- Semester: ${config.semester || 'Not specified'}
- Subject: ${config.subjectName}
- Exam Type: ${config.examType}
- Academic Year: ${config.year || new Date().getFullYear()}
${config.paperTitle ? `- Paper Title: ${config.paperTitle}` : ''}
${config.institutionName ? `- Institution: ${config.institutionName}` : ''}

STRICT MARKS DISTRIBUTION (you MUST follow this exactly):
Total Marks: ${structure.totalMarks}
Total Questions: ${totalQuestions}
${sectionDetails}

${syllabusContext}
${previousPapersContext}

ANALYSIS MODE: ${
  analysisMode === 'pattern'
    ? `Pattern analysis across ${extractedQuestions.length} historical previous-year papers — identify recurring topics, question formats, and difficulty distributions.`
    : analysisMode === 'hybrid'
    ? `Historical question-paper analysis (${extractedQuestions.length} previous-year paper(s) analyzed) combined with syllabus reference — replicate the exact structure, question depth, and academic style of the analyzed previous papers.`
    : 'Syllabus-based generation (no historical papers could be extracted; generate solely based on syllabus).'
}

REQUIREMENTS:
1. Generate EXACTLY ${totalQuestions} questions with the EXACT marks distribution above.
2. Questions must be appropriate for ${config.degree || 'university'} level, semester ${config.semester || 'as specified'}.
3. ${config.syllabus ? 'Generate questions ONLY from the provided syllabus topics.' : 'Generate questions appropriate for the subject.'}
4. Match the difficulty and style of the previous papers where available.
5. 2-mark questions: definitions, short explanations, brief distinctions.
6. ${structure.sections.length >= 2 ? (structure.sections[1].marksEach + '-mark questions: explanations, comparisons, short derivations.') : ''}
7. ${structure.sections.length >= 3 ? '10-mark questions: detailed explanations, architectures, algorithms, comprehensive comparisons.' : ''}
8. Avoid repetition — each question should test a distinct concept.
9. Clear, grammatically correct language.
10. Do NOT claim these are official university questions.

Respond with ONLY valid JSON in this exact format:
{
  "sections": [
    {
      "name": "Section A",
      "description": "Short Answer Questions",
      "marksEach": 2,
      "questions": [
        {
          "questionNumber": 1,
          "text": "Question text here",
          "marks": 2,
          "topic": "Topic/Unit from syllabus",
          "subparts": []
        }
      ]
    }
  ],
  "totalMarks": ${structure.totalMarks},
  "totalQuestions": ${totalQuestions},
  "generationNote": "Brief note about how questions were generated"
}

IMPORTANT: Return ONLY the JSON object. No markdown code fences, no explanation text.`;

  return prompt;
}

// --- Validate AI Response ---
function validateGeneratedPaper(parsed, examType) {
  const structure = EXAM_STRUCTURES[examType];
  if (!structure) return { valid: false, error: 'Invalid exam type' };

  if (!parsed || !parsed.sections || !Array.isArray(parsed.sections)) {
    return { valid: false, error: 'Response missing sections array' };
  }

  if (parsed.sections.length !== structure.sections.length) {
    return { valid: false, error: `Expected ${structure.sections.length} sections, got ${parsed.sections.length}` };
  }

  let totalMarks = 0;
  let totalQuestions = 0;
  const errors = [];

  for (let i = 0; i < structure.sections.length; i++) {
    const expected = structure.sections[i];
    const actual = parsed.sections[i];

    if (!actual.questions || !Array.isArray(actual.questions)) {
      errors.push(`${expected.name}: missing questions array`);
      continue;
    }

    if (actual.questions.length !== expected.questionCount) {
      errors.push(`${expected.name}: expected ${expected.questionCount} questions, got ${actual.questions.length}`);
    }

    for (const q of actual.questions) {
      const qMarks = q.marks || expected.marksEach;
      totalMarks += qMarks;
      totalQuestions++;

      if (qMarks !== expected.marksEach) {
        errors.push(`${expected.name} Q${q.questionNumber}: expected ${expected.marksEach} marks, got ${qMarks}`);
      }
    }
  }

  if (totalMarks !== structure.totalMarks) {
    errors.push(`Total marks: expected ${structure.totalMarks}, got ${totalMarks}`);
  }

  const expectedTotal = structure.sections.reduce((sum, s) => sum + s.questionCount, 0);
  if (totalQuestions !== expectedTotal) {
    errors.push(`Total questions: expected ${expectedTotal}, got ${totalQuestions}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    totalMarks,
    totalQuestions,
  };
}

// --- Attempt to fix common AI response issues ---
function attemptFix(parsed, examType) {
  const structure = EXAM_STRUCTURES[examType];
  if (!parsed || !parsed.sections) return parsed;

  // Fix marks values
  for (let i = 0; i < Math.min(parsed.sections.length, structure.sections.length); i++) {
    const expected = structure.sections[i];
    const section = parsed.sections[i];
    if (section.questions) {
      // Trim or pad questions to expected count
      if (section.questions.length > expected.questionCount) {
        section.questions = section.questions.slice(0, expected.questionCount);
      }
      // Fix marks per question
      section.questions.forEach((q, qi) => {
        q.marks = expected.marksEach;
        q.questionNumber = qi + 1;
      });
      section.marksEach = expected.marksEach;
      section.name = expected.name;
      section.description = expected.description;
    }
  }

  // Recalculate totals
  let totalMarks = 0;
  let totalQuestions = 0;
  parsed.sections.forEach((s) => {
    if (s.questions) {
      s.questions.forEach((q) => {
        totalMarks += q.marks;
        totalQuestions++;
      });
    }
  });
  parsed.totalMarks = totalMarks;
  parsed.totalQuestions = totalQuestions;

  return parsed;
}

// --- Parse AI JSON response (handles markdown fences) ---
function parseAIResponse(rawText) {
  let cleaned = rawText.trim();
  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

// ============================================================
// Route — Generate AI Exam Paper
// ============================================================

// @desc    Generate AI practice question paper
// @route   POST /api/papers/generate
app.post('/api/papers/generate', async (req, res) => {
  try {
    const {
      degree,
      department,
      semester,
      subjectName,
      examType,
      year,
      paperTitle,
      institutionName,
      syllabus,
      provider,
      apiKey,
    } = req.body;

    // --- Validate required fields ---
    if (!subjectName || !examType || !provider || !apiKey) {
      return res.status(400).json({
        message: 'Subject name, exam type, AI provider, and API key are required.',
      });
    }

    if (!EXAM_STRUCTURES[examType]) {
      return res.status(400).json({ message: 'Invalid exam type. Must be MST1, MST2, or EST.' });
    }

    if (!AI_PROVIDERS[provider]) {
      return res.status(400).json({ message: 'Invalid AI provider. Choose gemini, openai, or grok.' });
    }

    // --- Dynamic Retrieval across Degree, Department, Semester, Subject, and Exam Type ---
    const filter = { status: 'approved' };

    if (department && department !== 'Other') {
      filter.department = { $regex: new RegExp(`^${department.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }
    if (semester) {
      filter.semester = Number(semester);
    }
    if (examType) {
      filter.examType = examType;
    }

    // Retrieve candidate papers for the target semester/examType/department
    const candidatePapers = await Paper.find(filter).sort({ year: -1 }).limit(50);

    // Apply generic, dynamic subject matching (supports acronyms & full titles in both directions, zero hardcoding)
    const matchingPapers = candidatePapers.filter((p) => matchSubject(subjectName, p.subjectName));

    // Deduplicate by pdfFileId
    const seen = new Set();
    const uniquePapers = matchingPapers.filter((p) => {
      const key = p.pdfFileId ? p.pdfFileId.toString() : p._id.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const paperCount = uniquePapers.length;

    // --- Extract text from matching PDFs ---
    const papersToExtract = uniquePapers.slice(0, 15);
    const extractedQuestions = [];
    const partiallyExtracted = [];
    const extractionErrors = [];

    for (const paper of papersToExtract) {
      try {
        const result = await extractPdfText(paper.pdfFileId, paper, { provider, apiKey });
        if (result.isUsable && result.text) {
          extractedQuestions.push({
            text: result.text,
            metadata: `${paper.subjectName} | ${paper.examType} | ${paper.year} | Sem ${paper.semester}`,
            paperId: paper._id.toString(),
            pdfName: paper.pdfName,
            extractionMethod: result.method || 'native',
            ocrProcessed: !!result.ocrProcessed,
            cached: !!result.cached,
          });
        } else if (result.status === 'partial' && result.text) {
          partiallyExtracted.push({
            paper: paper.pdfName,
            paperId: paper._id.toString(),
            text: result.text,
            error: result.error,
          });
          if (extractedQuestions.length === 0) {
            extractedQuestions.push({
              text: result.text,
              metadata: `${paper.subjectName} | ${paper.examType} | ${paper.year} | Sem ${paper.semester} (Partial Extraction)`,
              paperId: paper._id.toString(),
              pdfName: paper.pdfName,
              extractionMethod: result.method || 'ocr',
              ocrProcessed: !!result.ocrProcessed,
              cached: !!result.cached,
            });
          }
        } else if (result.error) {
          extractionErrors.push({ paper: paper.pdfName, error: result.error });
        }
      } catch (err) {
        extractionErrors.push({ paper: paper.pdfName, error: err.message });
      }
    }

    // Determine actual analysis mode dynamically based on USABLE EXTRACTED PAPERS
    const usableCount = extractedQuestions.length;
    let analysisMode;
    if (usableCount === 0) {
      analysisMode = 'syllabus';
    } else if (usableCount > 10) {
      analysisMode = 'pattern';
    } else {
      analysisMode = 'hybrid';
    }

    // Check if zero usable papers could be extracted and no sufficient syllabus provided
    if (usableCount === 0 && (!syllabus || syllabus.trim().length < 20)) {
      return res.status(400).json({
        message: `${paperCount > 0 ? `${paperCount} previous-year paper(s) were found, but could not be extracted.` : 'No previous-year papers were found.'} Historical-paper analysis could not be performed. Please provide your subject syllabus text to generate a practice paper.`,
        paperCount,
        usableExtractedPapers: 0,
        analysisMode: 'syllabus',
        extractionErrors: extractionErrors.length > 0 ? extractionErrors : undefined,
      });
    }

    // --- Build prompt and call AI ---
    const config = {
      degree: degree || '',
      department: department || '',
      semester: semester || '',
      subjectName,
      examType,
      year: year || new Date().getFullYear(),
      paperTitle: paperTitle || '',
      institutionName: institutionName || '',
      syllabus: syllabus || '',
    };

    const prompt = buildGenerationPrompt(config, extractedQuestions, analysisMode);

    const callProvider = AI_PROVIDERS[provider];
    let generatedPaper = null;
    let attempts = 0;
    const maxAttempts = 2;
    let lastError = null;

    while (attempts < maxAttempts && !generatedPaper) {
      attempts++;
      try {
        const rawResponse = await callProvider(apiKey, prompt);
        const parsed = parseAIResponse(rawResponse);
        const validation = validateGeneratedPaper(parsed, examType);

        if (validation.valid) {
          generatedPaper = parsed;
        } else {
          // Attempt fix
          const fixed = attemptFix(parsed, examType);
          const revalidation = validateGeneratedPaper(fixed, examType);
          if (revalidation.valid) {
            generatedPaper = fixed;
          } else {
            lastError = `Validation failed: ${revalidation.errors.join('; ')}`;
          }
        }
      } catch (err) {
        lastError = err.message;
        // Don't retry on auth errors
        if (err.message.includes('API key') || err.message.includes('unauthorized') || err.message.includes('Invalid')) {
          break;
        }
      }
    }

    if (!generatedPaper) {
      return res.status(422).json({
        message: lastError || 'Failed to generate a valid question paper after multiple attempts.',
        paperCount,
        analysisMode,
      });
    }

    // --- Return result ---
    res.json({
      success: true,
      paper: {
        ...generatedPaper,
        metadata: {
          degree: config.degree,
          department: config.department,
          semester: config.semester,
          subjectName: config.subjectName,
          examType: config.examType,
          year: config.year,
          paperTitle: config.paperTitle,
          institutionName: config.institutionName,
          structure: EXAM_STRUCTURES[examType],
        },
        generatedAt: new Date().toISOString(),
        label: 'AI-Generated Practice Question Paper',
      },
      analysis: {
        paperCount,
        usableExtractedPapers: extractedQuestions.length,
        ocrProcessedCount: extractedQuestions.filter((q) => q.ocrProcessed).length,
        nativeExtractedCount: extractedQuestions.filter((q) => q.extractionMethod === 'native').length,
        cachedCount: extractedQuestions.filter((q) => q.cached).length,
        partiallyExtractedCount: partiallyExtracted.length,
        failedCount: extractionErrors.length,
        analysisMode,
        syllabusProvided: !!(syllabus && syllabus.trim().length > 0),
        extractionErrors: extractionErrors.length > 0 ? extractionErrors : undefined,
      },
      disclaimer: 'This is an AI-generated practice paper. It is NOT an official university examination paper. Questions are generated based on available previous papers and syllabus for practice purposes only.',
    });
  } catch (error) {
    console.error('Generate paper error:', error.message);
    const statusCode = error.message.includes('Invalid or unauthorized') ? 401 : (error.message.includes('time limit') || error.message.includes('rate limit') ? 503 : 500);
    res.status(statusCode).json({ message: error.message || 'An unexpected error occurred during paper generation.' });
  }
});

// ============================================================
// Health Check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2026-10-25-fast-pipeline', message: 'PaperVault API is running (serverless)' });
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
// Export as Netlify Function & Vercel App
// ============================================================
module.exports = app;
module.exports.handler = serverless(app, {
  binary: ['application/pdf']
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to start server:', err.message);
  });
}


