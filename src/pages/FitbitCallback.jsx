import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function FitbitCallback() {
  const [status, setStatus] = useState('processing');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        setStatus('error');
        setTimeout(() => navigate(createPageUrl("Profile")), 3000);
        return;
      }

      if (code) {
        try {
          const user = await base44.auth.me();
          const result = await base44.functions.fitbit_oauth_callback({ code, user_id: user.id });
          
          if (result.success) {
            setStatus('success');
            setTimeout(() => navigate(createPageUrl("Profile")), 2000);
          } else {
            setStatus('error');
            setTimeout(() => navigate(createPageUrl("Profile")), 3000);
          }
        } catch (err) {
          setStatus('error');
          setTimeout(() => navigate(createPageUrl("Profile")), 3000);
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
         style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <Card className="border-gray-800 max-w-md w-full" style={{ background: '#0f0f0f' }}>
        <CardContent className="p-12 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: '#8b3dff' }} />
              <h2 className="text-2xl font-bold text-white mb-2">Connecting Fitbit...</h2>
              <p className="text-gray-400">Please wait while we set up your connection</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#8b3dff' }} />
              <h2 className="text-2xl font-bold text-white mb-2">Successfully Connected!</h2>
              <p className="text-gray-400">Redirecting to your profile...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#dc2626' }} />
              <h2 className="text-2xl font-bold text-white mb-2">Connection Failed</h2>
              <p className="text-gray-400">Please try again later</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}