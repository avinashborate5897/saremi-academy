import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../design-system';
import { Plus, Edit2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { SaremiPackage, LearningMode } from '../../data/pricingData';
import { subscribeToPackages, updatePackage, createPackage, initializePackagesInFirestore } from '../../lib/pricingService';

export const AdminPricingManagement: React.FC = () => {
  const [packages, setPackages] = useState<SaremiPackage[]>([]);
  const [isEditing, setIsEditing] = useState<SaremiPackage | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    initializePackagesInFirestore();
    const unsub = subscribeToPackages(setPackages);
    return () => unsub();
  }, []);

  const handleToggleActive = async (pkg: SaremiPackage) => {
    await updatePackage(pkg.id, { active: !pkg.active });
  };

  const handleToggleBestValue = async (pkg: SaremiPackage) => {
    await updatePackage(pkg.id, { bestValue: !pkg.bestValue });
  };

  const initialFormState: SaremiPackage = {
    id: `pkg_${Date.now()}`,
    name: 'Standard Package',
    learningMode: 'one_to_one',
    sessionsPerMonth: 4,
    durationMonths: 1,
    totalClasses: 4,
    classesPerWeek: 1,
    classDurationMins: 45,
    monthlyDisplayPrice: 0,
    totalPrice: 0,
    priceINR: 0,
    priceUSD: 0,
    tagline: 'Personalized 1:1 Live Mentorship',
    features: ['Live 1:1 Session', 'Practice Studio', 'Homework Feedback'],
    currency: 'INR',
    bestValue: false,
    active: true,
  };

  const [formData, setFormData] = useState<SaremiPackage>(initialFormState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      await updatePackage(isEditing.id, formData);
    } else {
      await createPackage({ ...formData, id: `pkg_${Date.now()}` });
    }
    setShowForm(false);
    setIsEditing(null);
    setFormData(initialFormState);
  };

  const editPackage = (pkg: SaremiPackage) => {
    setFormData(pkg);
    setIsEditing(pkg);
    setShowForm(true);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#121829]">
            Tuition Package Management
          </h2>
          <p className="text-xs text-gray-500">
            Configure authoritative pricing and packages. Changes here reflect instantly on the public pricing page.
          </p>
        </div>

        <Button
          variant="brass"
          size="sm"
          className="text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
          onClick={() => {
            setFormData(initialFormState);
            setIsEditing(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Package
        </Button>
      </div>

      {showForm && (
        <Card variant="default" padding="lg" className="border-2 border-saremi-purple/20 bg-white">
          <h3 className="font-serif text-lg font-bold mb-4">{isEditing ? 'Edit Package' : 'New Package'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Learning Mode</label>
                <select
                  value={formData.learningMode}
                  onChange={(e) => setFormData({ ...formData, learningMode: e.target.value as LearningMode })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="one_to_one">Standard 1:1</option>
                  <option value="group">Group Classes</option>
                  <option value="premium_one_to_one">Premium 1:1</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Sessions per Month</label>
                <select
                  value={formData.sessionsPerMonth}
                  onChange={(e) => setFormData({ ...formData, sessionsPerMonth: Number(e.target.value) as 4 | 8 })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value={4}>4 Sessions</option>
                  <option value={8}>8 Sessions</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Duration (Months)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.durationMonths}
                  onChange={(e) => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Monthly Display Price</label>
                <input
                  type="number"
                  value={formData.monthlyDisplayPrice}
                  onChange={(e) => setFormData({ ...formData, monthlyDisplayPrice: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Total Price</label>
                <input
                  type="number"
                  value={formData.totalPrice}
                  onChange={(e) => setFormData({ ...formData, totalPrice: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Discount Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SAVE 10%"
                  value={formData.discountLabel || ''}
                  onChange={(e) => setFormData({ ...formData, discountLabel: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={formData.bestValue}
                  onChange={(e) => setFormData({ ...formData, bestValue: e.target.checked })}
                  className="rounded text-saremi-purple"
                />
                Mark as "BEST VALUE" (👑)
              </label>
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-saremi-green"
                />
                Active (Visible to public)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save Package</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {packages.sort((a,b) => a.durationMonths - b.durationMonths).map(pkg => (
          <div key={pkg.id} className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${!pkg.active ? 'opacity-60 bg-gray-50' : 'border-gray-200 shadow-sm'}`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                  {pkg.learningMode.replace(/_/g, ' ')}
                </span>
                {pkg.bestValue && <Badge variant="purple" size="sm">BEST VALUE</Badge>}
                {!pkg.active && <Badge variant="secondary" size="sm">INACTIVE</Badge>}
              </div>
              <h4 className="font-serif font-bold text-lg text-gray-900">
                {pkg.durationMonths} Month{pkg.durationMonths > 1 ? 's' : ''} • {pkg.sessionsPerMonth} Sessions/mo
              </h4>
              <div className="text-sm font-medium text-gray-600">
                Total: ₹{pkg.totalPrice.toLocaleString()} (₹{pkg.monthlyDisplayPrice.toLocaleString()}/mo)
              </div>
              {pkg.discountLabel && (
                <div className="text-xs font-bold text-orange-600 mt-1">{pkg.discountLabel}</div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleToggleBestValue(pkg)}>
                {pkg.bestValue ? 'Remove Best Value' : 'Mark Best Value'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleToggleActive(pkg)}>
                {pkg.active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button size="sm" variant="primary" onClick={() => editPackage(pkg)}>
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
