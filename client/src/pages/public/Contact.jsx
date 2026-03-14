import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent]  = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    toast.success('Message sent! We\'ll respond within 24 hours.');
    setTimeout(() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }, 3000);
  };

  return (
    <div className="min-h-screen pt-20" style={{ background: 'var(--bg-base)' }}>
      <div className="border-b border-subtle-t py-10" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-3">Get in Touch</p>
          <h1 className="font-display text-4xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Contact Us</h1>
          <p className="text-sub text-sm">Our concierge team is available 24 hours a day, 7 days a week</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          {[
            { icon: MapPin, title: 'Address',     lines: ['1 Sable Drive, Sandton', 'Johannesburg, 2196', 'South Africa'] },
            { icon: Phone,  title: 'Telephone',   lines: ['+27 11 555 0100', '+27 11 555 0101 (Reservations)'] },
            { icon: Mail,   title: 'Email',       lines: ['info@sablegrand.co.za', 'reservations@sablegrand.co.za'] },
            { icon: Clock,  title: 'Hours',       lines: ['Check-in: 14:00 SAST', 'Check-out: 11:00 SAST', 'Front Desk: 24/7'] },
          ].map(({ icon: Icon, title, lines }) => (
            <div key={title} className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold-50 dark:bg-gold-900/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-gold-600 dark:text-gold-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-base mb-1">{title}</p>
                {lines.map(l => <p key={l} className="text-sm text-muted">{l}</p>)}
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 card card-body">
          <h2 className="font-display text-xl font-semibold mb-6 text-base">Send a Message</h2>
          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="font-semibold text-base">Message Sent!</p>
              <p className="text-sm text-muted">We'll be in touch shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Full Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required className="form-input" placeholder="Thabo Nkosi" />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required className="form-input" placeholder="you@example.co.za" />
                </div>
              </div>
              <div>
                <label className="form-label">Subject</label>
                <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  required className="form-input" placeholder="Reservation enquiry, special request…" />
              </div>
              <div>
                <label className="form-label">Message</label>
                <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  required rows={5} className="form-input resize-none" placeholder="How can we assist you?" />
              </div>
              <button type="submit" className="btn-gold gap-2">
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
