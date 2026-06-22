const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadPaper,
  getApprovedPapers,
  getPendingPapers,
  getAllPapers,
  approvePaper,
  rejectPaper,
  deletePaper,
  viewPdf,
  downloadPdf,
} = require('../controllers/paperController');

// Multer config — store in memory for GridFS upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// Public routes
router.post('/upload', upload.single('pdfFile'), uploadPaper);
router.get('/', getApprovedPapers);
router.get('/:id/view', viewPdf);
router.get('/:id/download', downloadPdf);

// Admin protected routes
router.get('/pending', protect, getPendingPapers);
router.get('/all', protect, getAllPapers);
router.put('/:id/approve', protect, approvePaper);
router.put('/:id/reject', protect, rejectPaper);
router.delete('/:id', protect, deletePaper);

module.exports = router;
