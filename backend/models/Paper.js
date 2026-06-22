const mongoose = require('mongoose');

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

module.exports = mongoose.model('Paper', paperSchema);
