import { useState, useEffect } from 'react';
import { getApprovedPapers } from '../services/api';
import PaperCard from '../components/PaperCard';

const departments = ['CSE', 'ECE', 'EE', 'ME', 'CE', 'IT', 'MCA', 'MBA'];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
const examTypes = ['MST1', 'MST2', 'EST'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2017 }, (_, i) => currentYear - i);

const BrowsePapers = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [examType, setExamType] = useState('');
  const [year, setYear] = useState('');
  const [search, setSearch] = useState('');

  const fetchPapers = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (department) params.department = department;
      if (semester) params.semester = semester;
      if (examType) params.examType = examType;
      if (year) params.year = year;
      if (search) params.search = search;

      const { data } = await getApprovedPapers(params);
      setPapers(data);
    } catch (err) {
      setError('Failed to load papers. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [department, semester, examType, year]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPapers();
  };

  const clearFilters = () => {
    setDepartment('');
    setSemester('');
    setExamType('');
    setYear('');
    setSearch('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Browse Question Papers</h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by subject name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Semesters</option>
          {semesters.map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>

        <select
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Exam Types</option>
          {examTypes.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      {(department || semester || examType || year || search) && (
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:underline mb-4"
        >
          Clear all filters
        </button>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading papers...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : papers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No papers found. Try adjusting your filters.
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{papers.length} paper(s) found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {papers.map((paper) => (
              <PaperCard key={paper._id} paper={paper} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BrowsePapers;
