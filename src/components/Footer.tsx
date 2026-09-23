import React from 'react';
import { useRouter } from '../router/RouterContext';
import { 
  Music, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Sparkles, 
  Instagram, 
  MessageSquare,
  ArrowUpRight
} from 'lucide-react';
import { SaremiLogo } from './common/SaremiLogo';

interface FooterProps {
  onNavigate?: (view: string) => void;
  onOpenBooking: () => void;
  onOpenAuth: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenBooking, onOpenAuth }) => {
  const { navigate } = useRouter();

  const phoneNumberDisplay = '+91 85911 74823';
  const phoneNumberRaw = '918591174823';
  const whatsappUrl = `https://wa.me/${phoneNumberRaw}?text=${encodeURIComponent("Hi Saremi Academy! 👋 I'd like to know more about your music classes.")}`;
  const instagramUrl = 'https://www.instagram.com/saremiacademy';
  const emailAddress = 'info@saremiacademy.online';

  return (
    <footer className="bg-[#121829] text-white border-t border-white/10 pt-16 pb-12 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')} 
                className="cursor-pointer hover:opacity-90 transition-opacity inline-block"
              >
                <div className="bg-white/95 px-3 py-1.5 rounded-xl inline-block shadow-sm">
                  <SaremiLogo size="md" className="h-9 sm:h-10" alt="Saremi Academy" />
                </div>
              </button>
            </div>
            <p className="text-xs text-white/60 leading-relaxed max-w-sm">
              Live, private 1:1 online music mentorship in Vocals, Piano, Guitar, and Tabla. Connecting curious students worldwide with maestro gurus for rigorous, joyful artistic mastery.
            </p>

            {/* Social & Direct Contact Links */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-bold transition-colors"
                title="Chat on WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-[#25D366]" />
                <span className="font-mono">{phoneNumberDisplay}</span>
              </a>

              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 hover:text-pink-200 text-xs font-bold transition-colors group"
                title="Follow @saremiacademy on Instagram"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
                <span>@saremiacademy</span>
              </a>

              <a
                href={`mailto:${emailAddress}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-mono transition-colors"
                title="Send Email"
              >
                <Mail className="w-3.5 h-3.5 text-[#D49A3D]" />
                <span>{emailAddress}</span>
              </a>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs text-[#D49A3D]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rooted in the Solfège tradition: Sa Re Ga Ma Pa Dha Ni</span>
            </div>
          </div>

          {/* Col 2: Academics */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Disciplines & Syllabus</h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <button onClick={() => navigate('/courses')} className="hover:text-[#D49A3D] transition-colors cursor-pointer">
                  All Courses & Curricula
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/pricing')} className="hover:text-[#D49A3D] transition-colors cursor-pointer">
                  Tuition & Packages
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/certifications')} className="hover:text-[#D49A3D] transition-colors cursor-pointer">
                  4-Pillar Graded Diplomas
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/tools')} className="hover:text-[#D49A3D] transition-colors cursor-pointer">
                  Tanpura & Tala Riyaaz Studio
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Programs & Culture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Programs & Heritage</h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <button onClick={() => navigate('/masterclasses')} className="hover:text-[#D49A3D] transition-colors cursor-pointer">
                  Maestro Masterclasses
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/events')} className="hover:text-[#D49A3D] transition-colors cursor-pointer">
                  Concerts & Recitals
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/blog')} className="hover:text-[#D49A3D] transition-colors cursor-pointer">
                  Conservatory Journal
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/about')} className="hover:text-[#D49A3D] transition-colors cursor-pointer">
                  Our Story & Pedagogy
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/shop')} className="hover:text-[#D49A3D] transition-colors cursor-pointer">
                  Instruments & Accessories
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Admissions & Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Admissions & Portals</h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <button onClick={() => navigate('/free-trial')} className="hover:text-[#D49A3D] transition-colors cursor-pointer font-bold text-[#D49A3D]">
                  Book Free 1:1 Diagnostic Trial
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/faq')} className="hover:text-[#D49A3D] transition-colors cursor-pointer">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/contact')} className="hover:text-[#D49A3D] transition-colors cursor-pointer">
                  Contact Admissions Desk
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/app')} className="hover:text-[#D49A3D] transition-colors cursor-pointer">
                  Student Learning Portal
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/admin')} className="text-white/40 hover:text-white/80 transition-colors flex items-center gap-1 cursor-pointer">
                  <Shield className="w-3 h-3" />
                  <span>Staff Admin Panel</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
          <p>© {new Date().getFullYear()} Saremi Academy. Distinctive Indian & Western Classical Conservatory Mentorship.</p>
          <div className="flex flex-wrap items-center gap-4">
            <a 
              href={whatsappUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#25D366] hover:underline font-mono"
            >
              WhatsApp: {phoneNumberDisplay}
            </a>
            <span>•</span>
            <a 
              href={instagramUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-pink-300 hover:underline"
            >
              Instagram: @saremiacademy
            </a>
            <span>•</span>
            <a 
              href={`mailto:${emailAddress}`} 
              className="text-[#D49A3D] hover:underline font-mono"
            >
              {emailAddress}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
