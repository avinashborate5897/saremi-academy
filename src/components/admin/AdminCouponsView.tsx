import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Percent,
  Trash2,
  DollarSign
} from 'lucide-react';
import {
  subscribeToCoupons,
  saveCoupon,
  recordAuditLog
} from '../../lib/adminFirestoreService';
import { Coupon } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminCouponsView: React.FC = () => {
  const { user: currentAdmin, role } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    usageLimit: 100,
    usedCount: 0,
    isActive: true,
    minOrderValue: 2000
  });

  useEffect(() => {
    const unsub = subscribeToCoupons(setCoupons);
    return () => unsub();
  }, []);

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;

    const id = newCoupon.id || `coupon_${newCoupon.code.toUpperCase()}`;
    const couponData: Coupon = {
      id,
      code: newCoupon.code.toUpperCase().trim(),
      discountType: newCoupon.discountType || 'percentage',
      discountValue: newCoupon.discountValue || 10,
      validFrom: new Date().toISOString(),
      validUntil: newCoupon.validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
      usageLimit: newCoupon.usageLimit || 100,
      usedCount: newCoupon.usedCount || 0,
      isActive: newCoupon.isActive !== false,
      minOrderValue: newCoupon.minOrderValue || 0
    };

    await saveCoupon(couponData);
    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: role || 'admin'
      },
      'Created Coupon Code',
      'coupon',
      id,
      `Created coupon "${couponData.code}" (${couponData.discountValue}${couponData.discountType === 'percentage' ? '%' : ' INR'} OFF)`
    );

    setShowModal(false);
    setNewCoupon({
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
      minOrderValue: 2000
    });
  };

  const handleToggleActive = async (coupon: Coupon) => {
    const updated = { ...coupon, isActive: !coupon.isActive };
    await saveCoupon(updated);
    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: role || 'admin'
      },
      'Updated Coupon Status',
      'coupon',
      coupon.id,
      `Toggled coupon "${coupon.code}" active status to ${updated.isActive}`
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative min-w-[200px] sm:min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coupon codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon Code</span>
        </button>
      </div>

      {/* Coupon Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 font-mono font-black text-sm border border-amber-200">
                  {coupon.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    coupon.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {coupon.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-serif font-extrabold text-slate-900">
                  {coupon.discountValue}
                  {coupon.discountType === 'percentage' ? '%' : ' INR'} OFF
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Min order: ₹{coupon.minOrderValue || 0}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Redemptions:</span>
                  <span className="font-bold text-slate-900">
                    {coupon.usedCount} / {coupon.usageLimit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Expires:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(coupon.validUntil).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleToggleActive(coupon)}
                className={`text-xs font-bold ${
                  coupon.isActive ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'
                }`}
              >
                {coupon.isActive ? 'Disable Code' : 'Enable Code'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-lg font-bold text-slate-900">Create Discount Coupon</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Coupon Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAREMI2026"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Discount Type</label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed INR (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={newCoupon.usageLimit}
                    onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={newCoupon.minOrderValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newCoupon.validUntil}
                  onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
