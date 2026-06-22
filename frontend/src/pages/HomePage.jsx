import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          📄 PaperVault
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Your one-stop repository for previous year question papers.
        </p>
        <p className="text-gray-500 mb-8">
          Find MST1, MST2, and EST papers from different departments and semesters.
          Help your juniors by uploading papers you have!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/papers"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700 transition-colors"
          >
            Browse Papers
          </Link>
          <Link
            to="/upload"
            className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700 transition-colors"
          >
            Upload a Paper
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">🔍 Find Papers</h3>
            <p className="text-sm text-gray-600">
              Search and filter papers by department, semester, exam type, and year.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">📤 Upload Papers</h3>
            <p className="text-sm text-gray-600">
              Upload question papers directly. No registration needed.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">✅ Quality Checked</h3>
            <p className="text-sm text-gray-600">
              Every paper is reviewed by admin before it goes public.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
