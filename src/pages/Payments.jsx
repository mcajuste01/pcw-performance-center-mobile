import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, X, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};

export default function Payments() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    period_start: '',
    period_end: '',
    status: 'paid',
    notes: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const hasCoachRole = currentUser.roles?.includes('coach') || currentUser.roles?.includes('admin') || currentUser.role === 'admin';
        if (!hasCoachRole) {
          window.location.href = '/';
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: allTrainees = [] } = useQuery({
    queryKey: ['allTrainees'],
    queryFn: async () => {
      const res = await base44.entities.User.list();
      return toArray(res);
    },
    initialData: [],
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await base44.entities.Payment.list('-payment_date');
      return toArray(res);
    },
    initialData: [],
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create({
      ...data,
      trainee_id: selectedTrainee,
      recorded_by: user.id,
      amount: parseFloat(data.amount)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setShowForm(false);
      setSelectedTrainee(null);
      setFormData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        period_start: '',
        period_end: '',
        status: 'paid',
        notes: ''
      });
      toast.success("Payment recorded!");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Payment.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success("Status updated!");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createPaymentMutation.mutate(formData);
  };

  const trainees = allTrainees.filter(t => t.role !== 'admin' && t.role !== 'coach' && !t.roles?.includes('coach'));

  const getTraineeName = (traineeId) => {
    const trainee = allTrainees.find(t => t.id === traineeId);
    return trainee?.wrestling_name || trainee?.full_name || 'Unknown';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'paid': return CheckCircle;
      case 'pending': return Clock;
      case 'overdue': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return { bg: 'bg-green-900', text: 'text-green-300' };
      case 'pending': return { bg: 'bg-yellow-900', text: 'text-yellow-300' };
      case 'overdue': return { bg: 'bg-red-900', text: 'text-red-300' };
      default: return { bg: 'bg-gray-800', text: 'text-gray-400' };
    }
  };

  // Get latest payment for each trainee
  const traineePaymentStatus = trainees.map(trainee => {
    const traineePayments = payments.filter(p => p.trainee_id === trainee.id);
    const latestPayment = traineePayments[0];
    return {
      trainee,
      latestPayment,
      totalPaid: traineePayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0)
    };
  });

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <DollarSign className="w-8 h-8" style={{ color: '#8b3dff' }} />
              Payment Tracking
            </h1>
            <p className="text-gray-400">Track training payments and billing</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} style={{ background: '#8b3dff' }}>
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>

        {/* Payment Form */}
        {showForm && (
          <Card className="border-gray-800 mb-8" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Record New Payment
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-gray-300">Trainee *</Label>
                  <Select value={selectedTrainee || ''} onValueChange={setSelectedTrainee}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Select trainee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {trainees.map(trainee => (
                        <SelectItem key={trainee.id} value={trainee.id}>
                          {trainee.wrestling_name || trainee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-300">Amount ($) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="150.00"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Payment Date *</Label>
                    <Input
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Payment Method</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Billing Period Start</Label>
                    <Input
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Billing Period End</Label>
                    <Input
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300">Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white h-20"
                    placeholder="Additional payment details..."
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                          style={{ borderColor: '#666', color: '#999' }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!selectedTrainee || createPaymentMutation.isPending}
                          style={{ background: '#8b3dff' }}>
                    {createPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Trainee Payment Overview */}
        <Card className="border-gray-800 mb-8" style={{ background: '#0f0f0f' }}>
          <CardHeader>
            <CardTitle className="text-white">Trainee Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {traineePaymentStatus.map(({ trainee, latestPayment, totalPaid }) => {
                const StatusIcon = latestPayment ? getStatusIcon(latestPayment.status) : Clock;
                const statusColors = latestPayment ? getStatusColor(latestPayment.status) : getStatusColor('pending');
                
                return (
                  <div key={trainee.id} className="p-4 rounded-lg border border-gray-800 flex items-center justify-between"
                       style={{ background: '#0a0a0a' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center"
                           style={{ background: 'linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)' }}>
                        <span className="text-white font-bold">
                          {trainee.wrestling_name?.[0]?.toUpperCase() || trainee.full_name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {trainee.wrestling_name || trainee.full_name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          {latestPayment ? (
                            <>
                              <span>Last payment: {new Date(latestPayment.payment_date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>${latestPayment.amount}</span>
                            </>
                          ) : (
                            <span>No payments recorded</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Total Paid</p>
                        <p className="text-xl font-bold text-white">${totalPaid.toFixed(2)}</p>
                      </div>
                      {latestPayment && (
                        <Badge className={`${statusColors.bg} ${statusColors.text} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {latestPayment.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
          <CardHeader>
            <CardTitle className="text-white">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => {
                const StatusIcon = getStatusIcon(payment.status);
                const statusColors = getStatusColor(payment.status);
                
                return (
                  <div key={payment.id} className="p-4 rounded-lg border border-gray-800"
                       style={{ background: '#0a0a0a' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">
                            {getTraineeName(payment.trainee_id)}
                          </h3>
                          <Badge className={`${statusColors.bg} ${statusColors.text} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${payment.amount}
                          </span>
                          <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                          <span className="capitalize">{payment.payment_method}</span>
                          {payment.period_start && payment.period_end && (
                            <span>
                              Period: {new Date(payment.period_start).toLocaleDateString()} - {new Date(payment.period_end).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-gray-500 mt-2">{payment.notes}</p>
                        )}
                      </div>
                      <Select
                        value={payment.status}
                        onValueChange={(status) => updateStatusMutation.mutate({ id: payment.id, status })}
                      >
                        <SelectTrigger className="w-32 bg-gray-900 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
              {payments.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">No payments recorded yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}