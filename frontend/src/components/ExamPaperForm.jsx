import { useState } from 'react';

const departments = ['CSE', 'ECE', 'EE', 'ME', 'CE', 'IT', 'MCA', 'MBA', 'BCA', 'AI & ML', 'Data Science', 'Other'];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
const examTypes = ['MST1', 'MST2', 'EST'];
const degrees = ['BCA', 'MCA', 'B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'MBA', 'BBA', 'Other'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2017 + 1 }, (_, i) => currentYear + 1 - i);

const EXAM_INFO = {
  MST1: { totalMarks: 20, description: 'Section A: 5 × 2 marks = 10 | Section B: 2 × 5 marks = 10', questions: 7 },
  MST2: { totalMarks: 20, description: 'Section A: 5 × 2 marks = 10 | Section B: 2 × 5 marks = 10', questions: 7 },
  EST: { totalMarks: 60, description: 'Section A: 5 × 2 marks = 10 | Section B: 5 × 4 marks = 20 | Section C: 3 × 10 marks = 30', questions: 13 },
};

const PROVIDER_INFO = {
  gemini: {
    label: 'Google Gemini',
    placeholder: 'Enter your Gemini API key',
    help: 'Get your API key from aistudio.google.com. Free tier available.',
    icon: '✨',
  },
  openai: {
    label: 'OpenAI',
    placeholder: 'Enter your OpenAI API key (sk-...)',
    help: 'Get your API key from platform.openai.com. Note: A ChatGPT Plus subscription is NOT the same as an API key. API usage is billed separately.',
    icon: '🤖',
  },
  grok: {
    label: 'xAI Grok',
    placeholder: 'Enter your xAI API key',
    help: 'Get your API key from console.x.ai. Usage charges apply.',
    icon: '⚡',
  },
};

const ExamPaperForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    degree: '',
    department: '',
    semester: '',
    subjectName: '',
    examType: '',
    year: '',
    paperTitle: '',
    institutionName: '',
    syllabus: '',
    provider: 'gemini',
    apiKey: '',
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.subjectName.trim()) newErrors.subjectName = 'Subject name is required';
    if (!formData.examType) newErrors.examType = 'Exam type is required';
    if (!formData.provider) newErrors.provider = 'AI provider is required';
    if (!formData.apiKey.trim()) newErrors.apiKey = 'API key is required';

    // Syllabus validation is context-dependent (server handles the 10-paper rule),
    // but warn if empty
    if (!formData.syllabus.trim()) {
      newErrors.syllabus = 'Syllabus is strongly recommended. It may be required if fewer than 10 matching papers exist in the database.';
    }

    setErrors(newErrors);
    // Only block on truly required fields
    const blocking = ['subjectName', 'examType', 'provider', 'apiKey'];
    return !blocking.some((k) => newErrors[k]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const selectedExam = EXAM_INFO[formData.examType];
  const selectedProvider = PROVIDER_INFO[formData.provider];

  return (
    <form onSubmit={handleSubmit} className="space-y-6" id="exam-paper-form">
      {/* Academic Details Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📚 Academic Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Degree */}
          <div>
            <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">
              Degree
            </label>
            <select
              id="degree"
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select Degree (Optional)</option>
              {degrees.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department / Branch
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select Department (Optional)</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Subject Name */}
          <div>
            <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-1">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subjectName"
              name="subjectName"
              value={formData.subjectName}
              onChange={handleChange}
              placeholder="e.g., Natural Language Processing"
              className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.subjectName ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.subjectName && (
              <p className="text-red-500 text-xs mt-1">{errors.subjectName}</p>
            )}
          </div>

          {/* Semester */}
          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select Semester (Optional)</option>
              {semesters.map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* Exam Type */}
          <div>
            <label htmlFor="examType" className="block text-sm font-medium text-gray-700 mb-1">
              Exam Type <span className="text-red-500">*</span>
            </label>
            <select
              id="examType"
              name="examType"
              value={formData.examType}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                errors.examType ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Select Exam Type</option>
              {examTypes.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            {errors.examType && (
              <p className="text-red-500 text-xs mt-1">{errors.examType}</p>
            )}
          </div>

          {/* Year */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <select
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select Year (Optional)</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Paper Title */}
          <div>
            <label htmlFor="paperTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Paper Title (Optional)
            </label>
            <input
              type="text"
              id="paperTitle"
              name="paperTitle"
              value={formData.paperTitle}
              onChange={handleChange}
              placeholder="e.g., End Semester Examination 2026"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Institution Name */}
          <div>
            <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700 mb-1">
              Institution Name (Optional)
            </label>
            <input
              type="text"
              id="institutionName"
              name="institutionName"
              value={formData.institutionName}
              onChange={handleChange}
              placeholder="e.g., University Name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Exam structure info */}
        {selectedExam && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800">
              📝 {formData.examType} — Total: {selectedExam.totalMarks} marks | {selectedExam.questions} questions
            </p>
            <p className="text-xs text-blue-600 mt-1">{selectedExam.description}</p>
          </div>
        )}
      </div>

      {/* Syllabus Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
          📖 Enter Your Subject Syllabus
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          Paste your syllabus including unit names, topics, and subtopics. This helps generate relevant questions.
        </p>
        <textarea
          id="syllabus"
          name="syllabus"
          value={formData.syllabus}
          onChange={handleChange}
          rows={8}
          placeholder={`Example:\nUnit 1: Introduction to NLP\n- Tokenization, Stemming, Lemmatization\n- POS Tagging, Named Entity Recognition\n\nUnit 2: Language Models\n- N-gram models, Perplexity\n- Neural Language Models, Word Embeddings`}
          className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
            errors.syllabus ? 'border-amber-400' : 'border-gray-300'
          }`}
        />
        {errors.syllabus && (
          <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
            ⚠️ {errors.syllabus}
          </p>
        )}
      </div>

      {/* AI Provider Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🤖 AI Provider & API Key
        </h3>

        <div className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select AI Provider <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, provider: key, apiKey: '' }));
                    setShowApiKey(false);
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.provider === key
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-lg">{info.icon}</span>
                  <span className="ml-2 font-medium text-sm">{info.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              {selectedProvider?.label} API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                id="apiKey"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                placeholder={selectedProvider?.placeholder}
                className={`w-full border rounded-lg px-3 py-2.5 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.apiKey ? 'border-red-400' : 'border-gray-300'
                }`}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.apiKey && (
              <p className="text-red-500 text-xs mt-1">{errors.apiKey}</p>
            )}
            <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
              <span>ℹ️</span>
              <span>{selectedProvider?.help}</span>
            </p>
          </div>

          {/* Privacy notice */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
            <p className="font-medium mb-1">🔒 Privacy & Security</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Your API key is sent only to the selected AI provider via our secure server.</li>
              <li>Your key is never stored, logged, or saved in any database.</li>
              <li>Selected paper text and syllabus content will be sent to the AI provider for processing.</li>
              <li>API usage charges from the provider may apply.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        id="generate-paper-btn"
        className={`w-full py-3.5 rounded-xl text-white font-semibold text-lg transition-all ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl active:scale-[0.98]'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating Paper — This may take 15-30 seconds...
          </span>
        ) : (
          '🎯 Generate Practice Paper'
        )}
      </button>
    </form>
  );
};

export default ExamPaperForm;
