import { useState } from 'react';
import { uploadPaper } from '../services/api';

const departments = ['CSE', 'ECE', 'EE', 'ME', 'CE', 'IT', 'MCA', 'MBA'];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
const examTypes = ['MST1', 'MST2', 'EST'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2017 }, (_, i) => currentYear - i);

const UploadPaper = () => {
  const [formData, setFormData] = useState({
    department: '',
    subjectName: '',
    semester: '',
    examType: '',
    year: '',
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      setMessage({ text: 'Only PDF files are allowed.', type: 'error' });
      e.target.value = '';
      return;
    }
    setPdfFile(file);
    setMessage({ text: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    if (!formData.department || !formData.subjectName || !formData.semester || !formData.examType || !formData.year) {
      setMessage({ text: 'Please fill all fields.', type: 'error' });
      return;
    }

    if (!pdfFile) {
      setMessage({ text: 'Please select a PDF file.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: '', type: '' });

      const data = new FormData();
      data.append('department', formData.department);
      data.append('subjectName', formData.subjectName);
      data.append('semester', formData.semester);
      data.append('examType', formData.examType);
      data.append('year', formData.year);
      data.append('pdfFile', pdfFile);

      await uploadPaper(data);

      setMessage({
        text: 'Paper submitted successfully and waiting for admin approval.',
        type: 'success',
      });

      // Reset form
      setFormData({
        department: '',
        subjectName: '',
        semester: '',
        examType: '',
        year: '',
      });
      setPdfFile(null);
      // Reset file input
      const fileInput = document.getElementById('pdfFile');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Upload failed. Please try again.';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Question Paper</h1>
      <p className="text-gray-600 mb-6">
        Upload a previous year question paper. It will be reviewed by admin before becoming public.
      </p>

      {message.text && (
        <div
          className={`p-4 rounded mb-6 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
          <input
            type="text"
            name="subjectName"
            value={formData.subjectName}
            onChange={handleChange}
            placeholder="e.g., Data Structures"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <select
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Select Semester</option>
            {semesters.map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
          <select
            name="examType"
            value={formData.examType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Select Exam Type</option>
            {examTypes.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Select Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PDF File</label>
          <input
            type="file"
            id="pdfFile"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Only PDF files allowed. Max size: 10MB.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded text-white font-medium ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? 'Uploading...' : 'Upload Paper'}
        </button>
      </form>
    </div>
  );
};

export default UploadPaper;
