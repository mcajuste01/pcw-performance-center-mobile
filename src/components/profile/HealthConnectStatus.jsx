import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Activity, CheckCircle2, XCircle, RefreshCw, Smartphone, Globe, Clock, Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

const isNativePlatform = () => {
  try {
    return typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

export default function HealthConnectStatus({ userId }) {
  const isNative = isNativePlatform();
  const [connection, setConnection] = useState(null);
  const [latestSummary, setLatestSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      try {
        const [connRes, sumRes] = await Promise.all([
          base44.entities.WearableConnection.filter({
            trainee_id: userId,
            provider: "health_connect",
          }),
          base44.entities.WearableReadinessSummary.filter(
            { trainee_id: userId },
            "-summary_date",
            1
          ),
        ]);
        const conns = toArray(connRes);
        const sums = toArray(sumRes);
        setConnection(conns[0] || null);
        setLatestSummary(sums[0] || null);
      } catch {
        // Non-fatal
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const isConnected = connection?.status === "connected";
  const lastSynced = connection?.last_synced_at
    ? new Date(connection.last_synced_at).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const score = latestSummary?.readiness_score;
  const scoreColor = score >= 75 ? "#10b981" : score >= 55 ? "#f59e0b" : "#dc2626";

  return (
    <Card className="border-gray-800 bg-[#050505]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Health Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Visual indicator */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: isConnected ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
              border: `2px solid ${isConnected ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            {loading ? (
              <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
            ) : isConnected ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            ) : (
              <XCircle className="w-7 h-7 text-gray-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-white">Health Connect</p>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                style={{
                  background: isConnected ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                  color: isConnected ? "#10b981" : "#6b7280",
                }}
              >
                {loading ? "Checking…" : isConnected ? "Active" : "Inactive"}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                {isNative ? <Smartphone className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {isNative ? "Native" : "Web"}
              </span>
            </div>

            <div className="mt-1.5 space-y-0.5">
              {isConnected ? (
                <>
                  {lastSynced && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last sync: {lastSynced}
                    </p>
                  )}
                  {isNative && (
                    <p className="text-xs text-emerald-400/70 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Auto-syncing every 10 minutes
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-500">
                  Connect in Performance Lab to auto-sync health data
                </p>
              )}
            </div>
          </div>

          {/* Latest readiness score */}
          {score != null && (
            <div className="text-center flex-shrink-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${scoreColor}15` }}
              >
                <span className="text-lg font-bold" style={{ color: scoreColor }}>
                  {score}
                </span>
              </div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wide mt-1">Readiness</p>
            </div>
          )}
        </div>

        <Link
          to={createPageUrl("PerformanceLab")}
          className="block mt-3 text-xs text-center text-gray-500 hover:text-purple-400 transition-colors"
        >
          Manage in Performance Lab →
        </Link>
      </CardContent>
    </Card>
  );
}