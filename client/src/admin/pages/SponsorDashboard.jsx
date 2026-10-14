import DelegateQrScanner from "../components/DelegateQrScanner";

const formatTime = (value) => (value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "");

const describeSponsorScan = ({ delegate, result, scannedAt }) =>
  result === "scanned"
    ? { tone: "success", title: "✓ Scanned successfully", detail: `${delegate.fullName} (${delegate.registrationId})` }
    : {
        tone: "warning",
        title: "Already scanned — please send them to the next booth",
        detail: `${delegate.fullName} (${delegate.registrationId}) was scanned here at ${formatTime(scannedAt)}`,
      };

function SponsorDashboard({ api, user }) {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>{user?.name || "Sponsor"}</h1>
          <p>Scan each delegate's QR code once. A delegate who has already been scanned at this booth cannot be scanned again.</p>
        </div>
      </div>
      <DelegateQrScanner
        api={api}
        endpoint="/api/delegates/sponsor-scan"
        title="Scan Delegate"
        submitLabel="Scan"
        describeResult={describeSponsorScan}
      />
    </div>
  );
}

export default SponsorDashboard;
