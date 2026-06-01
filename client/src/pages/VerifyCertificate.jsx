import axios from "axios";
import { BadgeCheck, Search, ShieldX } from "lucide-react";
import { useEffect, useState } from "react";
import { apiUrl } from "../config/api";

function VerifyCertificate() {
  const params = new URLSearchParams(window.location.search);
  const [code, setCode] = useState(params.get("code") || params.get("id") || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const verify = async (event) => {
    event?.preventDefault();
    if (!code.trim()) return;
    setError("");
    setResult(null);
    try {
      const response = await axios.get(apiUrl(`/api/certificates/verify?code=${encodeURIComponent(code.trim())}`));
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Certificate could not be verified.");
    }
  };

  useEffect(() => {
    if (code) queueMicrotask(verify);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-[#F7FBFF] px-5 py-16 text-[#081B33]">
      <section className="mx-auto max-w-2xl rounded-3xl border border-[#0D47A1]/10 bg-white p-8 shadow-xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0D47A1]">GHC Verification</p>
        <h1 className="mt-3 font-['Sora'] text-3xl font-bold">Verify Certificate</h1>
        <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={verify}>
          <input className="min-h-12 flex-1 rounded-2xl border border-[#0D47A1]/15 px-4" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Certificate ID or verification code" />
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D47A1] px-5 font-bold text-white"><Search size={18} /> Verify</button>
        </form>
        {error && <div className="mt-6 rounded-2xl bg-red-50 p-4 text-red-700">{error}</div>}
        {result && (
          <article className={`mt-6 rounded-2xl p-5 ${result.valid ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
            {result.valid ? <BadgeCheck size={26} /> : <ShieldX size={26} />}
            <h2 className="mt-3 text-xl font-bold">{result.valid ? "Certificate is valid" : "Certificate is revoked"}</h2>
            <p className="mt-2">{result.certificate?.recipientName}</p>
            <p className="text-sm">{result.certificate?.certificateId}</p>
          </article>
        )}
      </section>
    </main>
  );
}

export default VerifyCertificate;
