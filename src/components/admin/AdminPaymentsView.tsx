import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Shield,
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  subscribeToAllOrders,
  updateOrderStatus
} from '../../lib/firestoreService';
import {
  recordAuditLog,
  exportToCSV
} from '../../lib/adminFirestoreService';
import { Order, OrderStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminPaymentsView: React.FC = () => {
  const { user: currentAdmin, role } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');

  // Refund Modal
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);

  useEffect(() => {
    const unsub = subscribeToAllOrders(setOrders);
    return () => unsub();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const customer = o.customerName || '';
    const email = o.customerEmail || '';
    const rzpId = o.razorpayPaymentId || o.razorpayOrderId || o.id || '';

    const matchesSearch =
      customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rzpId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterPaymentStatus === 'all' ||
      (filterPaymentStatus === 'paid' && o.paymentStatus === 'paid') ||
      (filterPaymentStatus === 'unpaid' && o.paymentStatus === 'unpaid') ||
      (filterPaymentStatus === 'refunded' && o.paymentStatus === 'refunded');

    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const rows = filteredOrders.map((o) => ({
      OrderID: o.id,
      Customer: o.customerName,
      Email: o.customerEmail,
      AmountINR: o.total,
      PaymentStatus: o.paymentStatus,
      OrderStatus: o.status,
      RazorpayPaymentID: o.razorpayPaymentId || 'N/A',
      Date: o.createdAt
    }));
    exportToCSV('saremi_payments_ledger', rows);
  };

  const handleOpenRefund = (order: Order) => {
    setRefundOrder(order);
    setRefundAmount(order.total);
    setRefundReason('');
  };

  const handleExecuteRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrder || !refundReason) return;

    // Process refund audit and update order status
    await updateOrderStatus(refundOrder.id, 'cancelled', `Refunded: ₹${refundAmount} - ${refundReason}`);
    
    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: role || 'admin'
      },
      'Processed Payment Refund',
      'payment',
      refundOrder.id,
      `Authorized refund of ₹${refundAmount} for Order ${refundOrder.id} (${refundOrder.customerEmail}). Reason: ${refundReason}`,
      {
        originalAmount: refundOrder.total,
        refundAmount,
        razorpayPaymentId: refundOrder.razorpayPaymentId
      }
    );

    alert(`✅ Refund of ₹${refundAmount} initiated for order ${refundOrder.id}. Audit log recorded.`);
    setRefundOrder(null);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer, email, payment ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <option value="all">All Payment Statuses ({orders.length})</option>
            <option value="paid">Settled / Paid (Razorpay)</option>
            <option value="unpaid">Pending / Unpaid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Ledger</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Order / Razorpay ID</th>
                <th className="py-3.5 px-4">Student & Contact</th>
                <th className="py-3.5 px-4">Purchased Package / Items</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPaid = order.paymentStatus === 'paid';
                  const isRefunded = order.paymentStatus === 'refunded' || order.status === 'cancelled';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 text-[11px]">{order.id}</div>
                        {order.razorpayPaymentId && (
                          <div className="text-[10px] font-mono text-emerald-600 truncate max-w-[140px]">
                            rzp: {order.razorpayPaymentId}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <div className="text-[11px] text-slate-500">{order.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {order.items.map((it) => it.title).join(', ') || 'Music Mentorship Package'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-serif font-extrabold text-slate-900 text-sm">
                          ₹{order.total.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            isRefunded
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isPaid && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          <span>{isRefunded ? 'Refunded' : isPaid ? 'Settled (Razorpay)' : 'Pending'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isPaid && !isRefunded && (
                          <button
                            onClick={() => handleOpenRefund(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 font-bold text-[11px] transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Refund</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      {refundOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-600" />
                <span>Process Customer Refund</span>
              </h3>
              <button onClick={() => setRefundOrder(null)} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteRefund} className="space-y-3 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900">
                <strong className="block font-bold mb-0.5">Order ID: {refundOrder.id}</strong>
                <p className="text-[11px]">
                  Customer: {refundOrder.customerName} ({refundOrder.customerEmail})
                </p>
                <p className="text-[11px] font-bold mt-1">
                  Original Order Total: ₹{refundOrder.total.toLocaleString('en-IN')}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Refund Amount (INR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={refundOrder.total}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Refund *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Schedule mismatch / Student requested cancellation within guarantee window"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefundOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm"
                >
                  Authorize Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
