const Paper = require('../models/Paper');
const { getGridFSBucket } = require('../config/db');
const { Readable } = require('stream');

// @desc    Upload a paper (Student - no auth needed)
// @route   POST /api/papers/upload
const uploadPaper = async (req, res) => {
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

    const readableStream = Readable.from(req.file.buffer);
    readableStream.pipe(uploadStream);

    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error.message);
      return res.status(500).json({ message: 'Error uploading file' });
    });

    uploadStream.on('finish', async () => {
      try {
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
        console.error('Paper creation error:', error.message);
        res.status(500).json({ message: 'Error saving paper details' });
      }
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all approved papers (Public)
// @route   GET /api/papers
const getApprovedPapers = async (req, res) => {
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
};

// @desc    Get all pending papers (Admin)
// @route   GET /api/papers/pending
const getPendingPapers = async (req, res) => {
  try {
    const papers = await Paper.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(papers);
  } catch (error) {
    console.error('Get pending papers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all papers - all statuses (Admin)
// @route   GET /api/papers/all
const getAllPapers = async (req, res) => {
  try {
    const papers = await Paper.find().sort({ createdAt: -1 });
    res.json(papers);
  } catch (error) {
    console.error('Get all papers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve a paper (Admin)
// @route   PUT /api/papers/:id/approve
const approvePaper = async (req, res) => {
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
};

// @desc    Reject a paper (Admin)
// @route   PUT /api/papers/:id/reject
const rejectPaper = async (req, res) => {
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
};

// @desc    Delete a paper (Admin)
// @route   DELETE /api/papers/:id
const deletePaper = async (req, res) => {
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
};

// @desc    View PDF (stream)
// @route   GET /api/papers/:id/view
const viewPdf = async (req, res) => {
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
      res.status(404).json({ message: 'PDF file not found' });
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('View PDF error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Download PDF
// @route   GET /api/papers/:id/download
const downloadPdf = async (req, res) => {
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
      res.status(404).json({ message: 'PDF file not found' });
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Download PDF error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  uploadPaper,
  getApprovedPapers,
  getPendingPapers,
  getAllPapers,
  approvePaper,
  rejectPaper,
  deletePaper,
  viewPdf,
  downloadPdf,
};
