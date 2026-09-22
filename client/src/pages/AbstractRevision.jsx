import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UploadCloud, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import { apiUrl } from "../config/api";
import axios from "axios";

export default function AbstractRevision() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [abstractInfo, setAbstractInfo] = useState(null);
  
  const [pdfFile, setPdfFile] = useState(null);

  useEffect(() => {
    // Validate the token and fetch abstract details
    const fetchAbstract = async () => {
      try {
        const response = await axios.get(apiUrl(`/api/research/revision/${token}`));
        setAbstractInfo(response.data.submission);
      } catch (err) {
        setError(err.response?.data?.message || "Invalid or expired revision link.");
      } finally {
        setLoading(false);
      }
    };
    fetchAbstract();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("Please select a new PDF file to upload.");
      return;
    }
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append("pdf", pdfFile);
    
    try {
      await axios.post(apiUrl(`/api/research/revision/${token}`), formData);
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit revision.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600">Validating link...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
            <AlertTriangle size={32} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-800">Invalid Link</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <button onClick={() => navigate('/')} className="mt-6 rounded-full bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-500">
            <CheckCircle size={32} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-800">Revision Submitted</h1>
          <p className="mt-2 text-gray-600">Your updated abstract has been successfully submitted and is now under review.</p>
          <button onClick={() => navigate('/')} className="mt-6 rounded-full bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-['Inter']">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Submit Revision</h1>
          <p className="mt-2 text-gray-500">Upload the updated version of your abstract for review.</p>
        </header>

        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h2 className="font-semibold text-gray-700">Abstract Details</h2>
          <p className="mt-1 text-sm text-gray-600"><strong>Title:</strong> {abstractInfo?.title}</p>
          <p className="text-sm text-gray-600"><strong>Current Version:</strong> v{abstractInfo?.current_version}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Updated Abstract PDF</label>
            <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 transition hover:border-blue-500">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])} required />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF up to 10MB</p>
                {pdfFile && <p className="mt-2 text-sm font-medium text-green-600">Selected: {pdfFile.name}</p>}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Uploading..." : "Submit Revision"}
            {!submitting && <UploadCloud size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}
