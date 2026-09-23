import React from 'react';
import { Lock, RefreshCw, AlertTriangle, Calendar, Clock, Award, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { StudentSubscriptionStatus } from '../../types';

interface ExpiredAccessLockProps {
  subscriptionStatus?: StudentSubscriptionStatus;
  title?: string;
  resourceName?: string;
  onRenew?: () => void;
  compact?: boolean;
}

export const ExpiredAccessLock: React.FC<ExpiredAccessLockProps> = ({
  subscriptionStatus,
  title = "Restricted Access",
  resourceName = "this conservatory resource",
  onRenew,
  compact = false
}) => {
  if (compact) {
    return (
      <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-base text-gray-900">
              Your package has expired. Renew your plan to continue learning.
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              Active enrollment is required to access {resourceName}. Past classes & attendance history remain preserved.
            </p>
          </div>
        </div>

        {onRenew && (
          <button
            onClick={onRenew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Renew Package</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-amber-200 shadow-xl text-center max-w-2xl mx-auto my-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 space-y-6">
        {/* Lock Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner ring-8 ring-amber-50">
          <Lock className="w-8 h-8" />
        </div>

        {/* Primary Message */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 inline-block">
            Subscription Term Expired
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Your package has expired. Renew your plan to continue learning.
          </h3>
          <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
            Live 1:1 sessions, interactive classroom access, premium curriculum modules, and Tanpura practice studio are locked. Your historical lessons, attendance records, and payment receipts are safely preserved.
          </p>
        </div>

        {/* Package Summary Ledger */}
        {subscriptionStatus && (
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-left grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Purchase Date</span>
              <strong className="text-gray-800 block truncate">
                {new Date(subscriptionStatus.purchaseDate).toLocaleDateString()}
              </strong>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Expiry Date</span>
              <strong className="text-rose-600 block truncate">
                {new Date(subscriptionStatus.expiryDate).toLocaleDateString()}
              </strong>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Duration</span>
              <strong className="text-gray-800 block truncate">{subscriptionStatus.packageDuration}</strong>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Status</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 inline-block">
                {subscriptionStatus.status}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Session Usage</span>
              <strong className="text-gray-800">
                {subscriptionStatus.usedSessions} Used / {subscriptionStatus.totalSessions} Total Sessions
              </strong>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Remaining Credits</span>
              <strong className="text-rose-600">
                {subscriptionStatus.remainingSessions} Sessions Remaining
              </strong>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRenew && (
            <button
              onClick={onRenew}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-xl cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Renew Package</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
