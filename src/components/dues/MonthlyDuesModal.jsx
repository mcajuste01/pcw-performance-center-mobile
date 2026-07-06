import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2 } from "lucide-react";

export default function MonthlyDuesModal({ user, month, onClose }) {
  const [confirming, setConfirming] = useState(false);
  const monthLabel = new Date(month + "-01T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await base44.entities.MonthlyDues.create({
        trainee_id: user.id,
        trainee_name: user.full_name,
        month,
        paid: true,
        paid_date: new Date().toISOString().slice(0, 10),
        confirmed_by: user.id,
      });
      onClose();
    } catch (e) {
      console.error("Dues confirm failed:", e);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" style={{ background: "#111", borderColor: "#1f1f1f" }}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(139,61,255,0.15)" }}
            >
              <CreditCard className="w-5 h-5" style={{ color: "#8b3dff" }} />
            </div>
            <DialogTitle className="text-white">Monthly Dues Verification</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            It's the 5th of {monthLabel}. Please verify that you've paid your monthly training dues.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-gray-300">
            Hi {user.full_name?.split(" ")[0]}, it's time to confirm your dues for {monthLabel}. Have
            you submitted your monthly payment?
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={confirming}>
            Not yet
          </Button>
          <Button onClick={handleConfirm} disabled={confirming} className="gap-2">
            {confirming ? (
              "Confirming..."
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Yes, I've paid
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}