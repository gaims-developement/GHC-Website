import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { apiUrl } from "../config/api";

export default function AbstractParticipationConfirm() {
  const token = useMemo(() => {
    const match = window.location.pathname.match(/\/abstract\/confirm\/([^/?#]+)/);
    return match?.[1] || "";
  }, []);
  const [state, setState] = useState({ loading: true, error: "", submission: null, alreadyConfirmed: false, confirmed: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ loading: false, error: "Invalid participation confirmation link.", submission: null });
      return;
    }
    axios.get(apiUrl(`/api/research/participation/${token}`))
      .then((res) => setState({
        loading: false,
        error: "",
        submission: res.data.submission || null,
        alreadyConfirmed: Boolean(res.data.alreadyConfirmed),
        confirmed: Boolean(res.data.alreadyConfirmed),
      }))
      .catch((err) => setState({
        loading: false,
        error: err.response?.data?.message || "Unable to validate this participation confirmation link.",
        submission: null,
      }));
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(apiUrl(`/api/research/participation/${token}`));
      setState({
        loading: false,
        error: "",
        submission: res.data.submission || state.submission,
        alreadyConfirmed: Boolean(res.data.alreadyConfirmed),
        confirmed: true,
      });
    } catch (err) {
      setState((current) => ({
        ...current,
        error: err.response?.data?.message || "Unable to confirm participation. Please contact the Scientific Committee.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E5F3EF] flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100">
        {state.loading ? (
          <>
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-[#349e81] animate-spin" />
            <h1 className="text-2xl font-bold text-[#1a2b3c]">Checking confirmation link</h1>
          </>
        ) : state.error ? (
          <>
            <XCircle className="w-14 h-14 mx-auto mb-5 text-red-500" />
            <h1 className="text-2xl font-bold text-[#1a2b3c] mb-3">Unable to Confirm</h1>
            <p className="text-gray-500 mb-6">{state.error}</p>
            <a href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#349e81] text-white font-bold">
              <ArrowLeft className="w-4 h-4" /> Return to GHC
            </a>
          </>
        ) : state.confirmed ? (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-5 text-[#349e81]" />
            <h1 className="text-2xl font-bold text-[#1a2b3c] mb-3">
              {state.alreadyConfirmed ? "Participation Already Confirmed" : "Participation Confirmed"}
            </h1>
            <p className="text-gray-500 mb-6">
              Thank you. Your abstract presentation participation has been recorded by the GHC Scientific Committee.
            </p>
            <a href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#349e81] text-white font-bold">
              Return to Homepage
            </a>
          </>
        ) : (
          <>
            <ShieldCheck className="w-16 h-16 mx-auto mb-5 text-[#349e81]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#349e81] mb-2">{state.submission?.abstractCode}</p>
            <h1 className="text-2xl font-bold text-[#1a2b3c] mb-3">Confirm Your Participation</h1>
            <p className="text-gray-600 font-semibold mb-2">{state.submission?.title}</p>
            <p className="text-gray-500 mb-6">
              Please confirm that you intend to participate and present this accepted abstract at Global Healthcare Conclave 2026.
            </p>
            <button
              type="button"
              onClick={confirm}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#349e81] text-white font-bold hover:bg-[#2b836b] disabled:opacity-70"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Participation
            </button>
          </>
        )}
      </div>
    </div>
  );
}
