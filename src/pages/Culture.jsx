import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Users, Target } from "lucide-react";

export default function Culture() {
  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8" style={{ color: '#8b3dff' }} />
            PCW Culture & Expectations
          </h1>
          <p className="text-gray-400">Professional standards for all Performance Center trainees</p>
        </div>

        <div className="space-y-6">
          {/* Respect & Safety First */}
          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} />
                Respect & Safety First
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p>PCW maintains a professional, safe environment for all trainees and staff.</p>
              <div className="p-4 rounded-lg border border-red-800 bg-red-900/20">
                <p className="font-semibold text-red-300 mb-2">Zero Tolerance Policy:</p>
                <ul className="list-disc list-inside space-y-1 text-red-200">
                  <li>Harassment of any kind</li>
                  <li>Bullying or intimidation</li>
                  <li>Discrimination</li>
                  <li>Hazing</li>
                  <li>Abuse (physical, verbal, or emotional)</li>
                </ul>
              </div>
              <p className="text-yellow-300 font-semibold">
                If you ever feel unsafe or uncomfortable, report immediately to a coach or leadership. Safety comes before everything.
              </p>
            </CardContent>
          </Card>

          {/* Be Coachable */}
          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" style={{ color: '#8b3dff' }} />
                Be Coachable
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p>Coachability is a requirement at all tiers.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Listen:</strong> Pay attention during instruction</li>
                <li><strong>Apply:</strong> Implement what you're taught</li>
                <li><strong>Ask Questions:</strong> Respectfully seek clarification</li>
                <li><strong>Be Willing to Improve:</strong> Accept feedback and work on weaknesses</li>
              </ul>
              <p className="text-sm text-gray-400 italic">
                Your willingness to learn and grow is more important than natural talent.
              </p>
            </CardContent>
          </Card>

          {/* Represent PCW Everywhere */}
          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: '#c0c0c0' }} />
                Represent PCW Everywhere
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p>Whether in the gym, at shows, online, or in the community, you represent PCW.</p>
              <div className="space-y-2">
                <p><strong>In the Gym:</strong> Maintain professionalism, work ethic, and respect</p>
                <p><strong>At Shows:</strong> Present your best self in and out of the ring</p>
                <p><strong>Online:</strong> Social media conduct reflects on PCW—be professional</p>
                <p><strong>In the Community:</strong> Treat others with respect and dignity</p>
              </div>
              <p className="text-sm text-gray-400 italic">
                Your actions outside the Performance Center matter just as much as what happens inside it.
              </p>
            </CardContent>
          </Card>

          {/* Gear Expectations */}
          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white">Gear Expectations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div>
                <p className="font-semibold text-white mb-2">Required:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Knee pads</li>
                  <li>Athletic shoes</li>
                  <li>Athletic clothing (shorts/pants, shirt)</li>
                  <li>Water bottle</li>
                  <li>Towel</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white mb-2">Strongly Recommended (as you progress):</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Wrestling boots</li>
                  <li>Elbow pads</li>
                  <li>Wrist supports</li>
                  <li>Mouthguard (optional but recommended)</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg border border-gray-800" style={{ background: '#0a0a0a' }}>
                <p className="text-sm text-gray-400">
                  <strong className="text-white">Note:</strong> Gear upgrades should never be a barrier to entry. 
                  Coaches will guide you on when it's time to invest in additional equipment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}