import jsQR from "jsqr";
import { Camera, CameraOff, ScanLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const SCAN_INTERVAL_MS = 150;
const SAME_CODE_COOLDOWN_MS = 4000;

// Short confirmation tone: high for success, low for problems.
const beep = (ok) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audio = new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = ok ? 880 : 220;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + (ok ? 0.15 : 0.35));
    osc.onended = () => audio.close();
  } catch {
    // Sound is optional.
  }
};

const formatTime = (value) => (value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "");

// Attendance check-in is the default; other screens (e.g. sponsor booths) pass their own endpoint and messages.
const describeCheckIn = ({ delegate, result: status }) =>
  status === "marked"
    ? { tone: "success", title: `✓ ${delegate.fullName}`, detail: `${delegate.registrationId} — marked present` }
    : { tone: "warning", title: `${delegate.fullName} is already checked in`, detail: `${delegate.registrationId} — marked present at ${formatTime(delegate.attendedAt)}` };

function DelegateQrScanner({
  api,
  onCheckedIn,
  endpoint = "/api/delegates/check-in",
  title = "QR Check-in",
  submitLabel = "Check in",
  describeResult = describeCheckIn,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const busyRef = useRef(false);
  const lastCodeRef = useRef({ code: "", at: 0 });
  const [active, setActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameras, setCameras] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [result, setResult] = useState(null);
  const [manualCode, setManualCode] = useState("");

  const submitCode = useCallback(async (code) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const response = await api.post(endpoint, { code });
      onCheckedIn?.(response.data.delegate);
      const next = describeResult(response.data);
      setResult(next);
      beep(next.tone === "success");
    } catch (err) {
      setResult({ tone: "error", title: "Not recognised", detail: err.response?.data?.message || "Could not check this QR code. Please try again." });
      beep(false);
    } finally {
      busyRef.current = false;
    }
  }, [api, onCheckedIn, endpoint, describeResult]);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return;
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const found = jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" });
    const code = found?.data?.trim();
    if (!code) return;
    const now = Date.now();
    if (code === lastCodeRef.current.code && now - lastCodeRef.current.at < SAME_CODE_COOLDOWN_MS) return;
    lastCodeRef.current = { code, at: now };
    submitCode(code);
  }, [submitCode]);

  const start = useCallback(async (requestedDeviceId = deviceId) => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser cannot access a camera. Use Chrome, Edge, Safari or Firefox over https (or localhost).");
      return;
    }
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: requestedDeviceId ? { deviceId: { exact: requestedDeviceId } } : { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();
      setActive(true);
      timerRef.current = setInterval(scanFrame, SCAN_INTERVAL_MS);
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter((d) => d.kind === "videoinput"));
      const activeId = stream.getVideoTracks()[0]?.getSettings?.().deviceId;
      if (activeId) setDeviceId(activeId);
    } catch (err) {
      stop();
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access for this site in the browser's address bar, then try again."
          : err?.name === "NotFoundError"
          ? "No camera was found on this device."
          : `Could not start the camera (${err?.message || err?.name || "unknown error"}).`
      );
    }
  }, [deviceId, scanFrame, stop]);

  useEffect(() => stop, [stop]);

  const toneStyles = {
    success: { background: "#ecfdf5", border: "#6ee7b7", color: "#065f46" },
    warning: { background: "#fffbeb", border: "#fcd34d", color: "#92400e" },
    error: { background: "#fef2f2", border: "#fca5a5", color: "#991b1b" },
  };

  return (
    <section className="admin-panel">
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <ScanLine size={20} /> {title}
        </h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {active && cameras.length > 1 && (
            <select
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                start(e.target.value);
              }}
              aria-label="Choose camera"
            >
              {cameras.map((camera, index) => (
                <option key={camera.deviceId || index} value={camera.deviceId}>{camera.label || `Camera ${index + 1}`}</option>
              ))}
            </select>
          )}
          {active ? (
            <button className="admin-secondary-button" type="button" onClick={stop}><CameraOff size={16} /> Stop Camera</button>
          ) : (
            <button className="admin-primary-button" type="button" onClick={() => start()}><Camera size={16} /> Open Scanner</button>
          )}
        </div>
      </div>

      <div style={{ display: active ? "block" : "none", position: "relative", maxWidth: "480px", margin: "0 auto 0.75rem", borderRadius: "0.75rem", overflow: "hidden", background: "#000" }}>
        <video ref={videoRef} muted playsInline style={{ width: "100%", display: "block" }} />
        <div style={{ position: "absolute", inset: "15%", border: "3px solid rgba(255,255,255,0.85)", borderRadius: "0.75rem", pointerEvents: "none" }} />
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {cameraError && <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{cameraError}</p>}

      {result && (
        <div
          role="status"
          style={{
            padding: "0.85rem 1rem",
            borderRadius: "0.75rem",
            border: `2px solid ${toneStyles[result.tone].border}`,
            background: toneStyles[result.tone].background,
            color: toneStyles[result.tone].color,
            marginBottom: "0.75rem",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{result.title}</div>
          <div style={{ fontSize: "0.85rem" }}>{result.detail}</div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const code = manualCode.trim();
          if (code) submitCode(code);
          setManualCode("");
        }}
        style={{ display: "flex", gap: "0.5rem" }}
      >
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Handheld scanner: click here and scan"
          aria-label="QR code value"
          style={{ flex: 1, minWidth: 0, padding: "0.55rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
        />
        <button className="admin-secondary-button" type="submit">{submitLabel}</button>
      </form>
    </section>
  );
}

export default DelegateQrScanner;
