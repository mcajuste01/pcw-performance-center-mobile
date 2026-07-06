import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, RefreshCw, Download } from "lucide-react";

function QRImage({ value, size = 220 }) {
  const encoded = encodeURIComponent(value);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=0a0a0a&color=ffffff&format=png&margin=2`;
  return (
    <img src={url} alt="QR Code" width={size} height={size}
      className="rounded-xl" style={{ imageRendering: "pixelated" }} />
  );
}

function Countdown({ expiresAt }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct  = (remaining / 300) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <circle cx="28" cy="28" r="24" fill="none"
            stroke={pct > 30 ? "#8b3dff" : "#dc2626"} strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white font-mono">
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500">expires</p>
    </div>
  );
}

export default function QRCheckIn({ user }) {
  const [open, setOpen]               = useState(false);
  const [sessionType, setSessionType] = useState("fundamentals");
  const [token, setToken]             = useState(null);
  const [expiresAt, setExpiresAt]     = useState(null);
  const timerRef                      = useRef(null);

  const generateToken = () => {
    const nonce = Math.random().toString(36).slice(2, 8).toUpperCase();
    const date  = new Date().toISOString().split("T")[0];
    const raw   = `pcw-checkin|${sessionType}|${date}|${nonce}`;
    const expiry = Date.now() + 5 * 60 * 1000;
    setToken(raw);
    setExpiresAt(expiry);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(generateToken, 5 * 60 * 1000);
  };

  useEffect(() => {
    if (open) generateToken();
    return () => clearTimeout(timerRef.current);
  }, [open, sessionType]);

  const handleDownload = () => {
    if (!token) return;
    const encoded = encodeURIComponent(token);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encoded}&bgcolor=0a0a0a&color=ffffff&format=png&margin=4`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `pcw-checkin-${sessionType}-${new Date().toLocaleDateString()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" style={{ borderColor: "#8b3dff", color: "#8b3dff" }}>
          <QrCode className="w-4 h-4 mr-1.5" /> QR Check-In
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)" }}>
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <QrCode className="w-4 h-4 text-purple-400" />
            Session QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Session Type</p>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fundamentals">Fundamentals</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="open_mat">Open Mat</SelectItem>
                <SelectItem value="competition_prep">Competition Prep</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {token && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative p-3 rounded-2xl"
                style={{ background: "#0a0a0a", border: "1px solid rgba(139,61,255,0.3)", boxShadow: "0 0 30px rgba(139,61,255,0.1)" }}>
                <QRImage value={token} size={200} />
                {["top-0 left-0","top-0 right-0","bottom-0 left-0","bottom-0 right-0"].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-5 h-5 rounded-sm`}
                    style={{
                      borderTop: i < 2 ? "2px solid #8b3dff" : "none",
                      borderBottom: i >= 2 ? "2px solid #8b3dff" : "none",
                      borderLeft: i % 2 === 0 ? "2px solid #8b3dff" : "none",
                      borderRight: i % 2 === 1 ? "2px solid #8b3dff" : "none",
                    }} />
                ))}
              </div>

              <div className="flex items-center gap-6">
                <Countdown expiresAt={expiresAt} />
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Session</p>
                  <p className="text-sm font-semibold text-white capitalize mt-0.5">
                    {sessionType.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 text-center max-w-xs">
                Trainees scan this with the PCW app to check in. Code refreshes every 5 minutes.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={generateToken}
              style={{ borderColor: "#444", color: "#888" }}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}
              style={{ borderColor: "#8b3dff", color: "#8b3dff" }}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}