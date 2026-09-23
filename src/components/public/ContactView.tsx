import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, CheckCircle, Send, MessageSquare, Instagram } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { SEOHead } from '../SEOHead';

export const ContactView: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Admissions Inquiry',
    message: ''
  });
  const [sent, setSent] = useState(false);

  const phoneNumberDisplay = '+91 85911 74823';
  const phoneNumberRaw = '918591174823';
  const whatsappUrl = `https://wa.me/${phoneNumberRaw}?text=${encodeURIComponent("Hi Saremi Academy! 👋 I would like to make an admissions inquiry.")}`;
  const instagramUrl = 'https://www.instagram.com/saremiacademy';
  const emailAddress = 'info@saremiacademy.online';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left space-y-10">
      <SEOHead
        title="Contact Admissions Desk & Global Support"
        description="Get in touch with Saremi Academy admissions counselors, faculty coordinators, and technical support. Live chat, phone, and inquiry desk."
        canonicalPath="/contact"
      />

      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="brass">Admissions Desk</Badge>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#121829]">
          Connect With Our Academic Advisors
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Have questions regarding syllabus placement, instrument selection, or international scheduling? Our counselors are here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <Card variant="default" padding="lg" className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#121829]">Direct Contact</h3>

            <div className="space-y-3.5 text-xs text-gray-700">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#8C6428] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900">Official Admissions Email</strong>
                  <a href={`mailto:${emailAddress}`} className="text-[#8C6428] font-mono hover:underline">
                    {emailAddress}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#8C6428] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900">Admissions & WhatsApp Hotline</strong>
                  <a href={`tel:+${phoneNumberRaw}`} className="text-gray-900 font-bold font-mono hover:underline block">
                    {phoneNumberDisplay}
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#25D366] font-bold hover:underline mt-0.5"
                  >
                    <MessageSquare className="w-3 h-3 fill-[#25D366]" />
                    <span>Open Live WhatsApp Chat</span>
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Instagram className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900">Official Instagram</strong>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-700 font-bold hover:underline"
                  >
                    @saremiacademy
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#8C6428] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900">Admissions Desk Hours</strong>
                  <span className="text-gray-500 font-mono">Mon – Sat • 9:00 AM – 9:00 PM IST (GMT +5:30)</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#8C6428] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900">Conservatory Administrative Hub</strong>
                  <span className="text-gray-500">
                    Saremi House, Heritage Arts District, Bandra West, Mumbai 400050, India
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md" className="bg-[#FAF8F5] border-[#D49A3D] space-y-2 text-xs">
            <strong className="text-gray-900 font-bold block">Need Urgent Tech Assistance?</strong>
            <p className="text-gray-600">
              If your 1:1 session is starting in less than 30 minutes and you have audio setup questions, message our live concierge via WhatsApp.
            </p>
          </Card>
        </div>

        {/* Inquiry Form */}
        <div className="lg:col-span-7">
          <Card variant="default" padding="lg">
            {sent ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#121829]">Inquiry Dispatched</h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  Thank you for reaching out. An academic counselor will contact you via WhatsApp or email within 4 business hours.
                </p>
                <Button variant="brass" size="sm" onClick={() => setSent(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-[#121829]">Send an Admissions Message</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Sen"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#D49A3D] bg-white min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. vikram@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#D49A3D] bg-white min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">WhatsApp / Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#D49A3D] bg-white min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Topic</label>
                    <select
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#D49A3D] bg-white min-h-[44px]"
                    >
                      <option>Admissions Inquiry</option>
                      <option>Syllabus & Grading Placement</option>
                      <option>Tuition & International Payment</option>
                      <option>Masterclass Booking</option>
                      <option>Technical & Audio Support</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-gray-700 font-bold mb-1">Your Message or Questions *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us about your musical interests, prior experience, or preferred class times..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#D49A3D] bg-white"
                  />
                </div>

                <Button variant="brass" size="lg" type="submit" className="w-full text-xs font-bold">
                  <span>Submit Inquiry to Admissions Desk</span>
                  <Send className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
