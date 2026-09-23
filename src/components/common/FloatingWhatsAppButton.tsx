import React, { useState } from 'react';
import { MessageCircle, Phone, Sparkles, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FloatingWhatsAppButton: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const phoneNumberDisplay = '+91 85911 74823';
  const phoneNumberRaw = '918591174823';
  const whatsappUrl = `https://wa.me/${phoneNumberRaw}?text=${encodeURIComponent("Hi Saremi Academy! 👋 I would like to inquire about live 1:1 music classes and book a free demo.")}`;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[999] flex flex-col items-end gap-2.5 select-none">
      {/* Expanded Quick Message Popup / Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-72 sm:w-80 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden text-left text-gray-800"
          >
            {/* Header */}
            <div className="bg-[#075E54] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-inner">
                  <MessageCircle className="w-6 h-6 fill-white" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075E54] rounded-full" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white leading-tight">Saremi Admissions</h4>
                  <p className="text-[11px] text-emerald-200">Online • Typically replies instantly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Close WhatsApp chat popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body Mock Bubble */}
            <div className="p-4 bg-[#ECE5DD]/40 space-y-3">
              <div className="bg-white p-3 rounded-2xl rounded-tl-xs shadow-xs text-xs text-gray-700 leading-relaxed border border-gray-100">
                <p className="font-semibold text-gray-900 mb-1">Namaste! 👋 Welcome to Saremi Academy.</p>
                <p>Looking for live 1:1 online classes in Vocals, Piano, Guitar, or Tabla? Let's chat directly on WhatsApp!</p>
                <span className="block text-[10px] text-gray-400 text-right mt-1 font-mono">Admissions Desk</span>
              </div>

              {/* Direct WhatsApp Action Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Start WhatsApp Chat</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </a>

              <div className="text-center pt-1">
                <span className="text-[11px] text-gray-500 font-mono">Direct: {phoneNumberDisplay}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Button & Tooltip Row */}
      <div className="flex items-center gap-2.5">
        {/* Desktop Mini Badge */}
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-emerald-100 text-xs font-bold text-gray-800 cursor-pointer hover:bg-white transition-colors"
            onClick={() => setIsExpanded(true)}
          >
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span>Chat on WhatsApp</span>
          </motion.div>
        )}

        {/* Circular WhatsApp Floating Button */}
        <button
          type="button"
          onClick={() => {
            // If already open, clicking closes it; otherwise opens expanded drawer or directly lands on wa.me if double clicked
            setIsExpanded(!isExpanded);
          }}
          className="relative w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(37,211,102,0.45)] hover:shadow-[0_12px_28px_rgba(37,211,102,0.6)] transition-all duration-300 cursor-pointer group"
          aria-label="Toggle WhatsApp Contact"
          title="Chat with Saremi Academy on WhatsApp (+91 85911 74823)"
        >
          {/* Animated pulsing wave */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-35 animate-ping pointer-events-none" />

          {/* Main WhatsApp Icon */}
          <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white group-hover:scale-110 transition-transform" />

          {/* Online green indicator dot */}
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </span>
        </button>
      </div>
    </div>
  );
};
