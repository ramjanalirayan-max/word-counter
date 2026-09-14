import React, { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { authClient } from '../utils/authClient';
import { UserProfile } from '../types';

interface ContactAdminSectionProps {
  currentUser: UserProfile | null;
  onToast?: (msg: string) => void;
}

const ISSUE_CATEGORIES = [
  'Website Problem / Bug',
  'Voice / Accent Quality',
  'Audio Export Issue',
  'Sign In / Account Issue',
  'Feature Suggestion',
  'Other Inquiry',
];

export const ContactAdminSection: React.FC<ContactAdminSectionProps> = ({
  currentUser,
  onToast,
}) => {
  const [senderEmail, setSenderEmail] = useState(currentUser?.email || '');
  const [senderName, setSenderName] = useState(currentUser?.name || '');
  const [selectedCategory, setSelectedCategory] = useState(ISSUE_CATEGORIES[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Update email if currentUser changes
  React.useEffect(() => {
    if (currentUser?.email && !senderEmail) {
      setSenderEmail(currentUser.email);
    }
    if (currentUser?.name && !senderName) {
      setSenderName(currentUser.name);
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = senderEmail.trim();
    const msgTrimmed = message.trim();

    if (!emailTrimmed) {
      setErrorMessage('Please provide your email address so the admin can reply to you.');
      return;
    }
    if (!msgTrimmed) {
      setErrorMessage('Please describe the problem or feedback you would like to share.');
      return;
    }

    const subject = customSubject.trim()
      ? `[${selectedCategory}] ${customSubject.trim()}`
      : selectedCategory;

    try {
      setLoading(true);
      const res = await authClient.sendContactMessage(
        emailTrimmed,
        msgTrimmed,
        subject,
        senderName.trim() || undefined
      );

      setSuccessMessage(
        'Your message has been sent directly to Admin Ramjan Ali. Thank you for your feedback!'
      );
      setMessage('');
      setCustomSubject('');
      if (onToast) {
        onToast('Message sent to Admin Ramjan Ali successfully!');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const mailtoSubject = encodeURIComponent(
    `[Website Feedback] ${customSubject.trim() || selectedCategory}`
  );
  const mailtoBody = encodeURIComponent(
    `Name: ${senderName || 'Anonymous'}\nSender Email: ${senderEmail || 'Not specified'}\nCategory: ${selectedCategory}\n\nMessage:\n${message}`
  );
  const directMailtoUrl = `mailto:ramjanalirayan@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <section
      id="contact-admin-section"
      className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all"
    >
      {/* Header Banner */}
      <div className="bg-stone-900 text-white p-5 sm:p-6 border-b border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Contact Admin
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 uppercase tracking-wider">
                  Support &amp; Feedback
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                ওয়েবসাইটে কোনো সমস্যা বা মতামত থাকলে অ্যাডমিন রামজান আলীকে সরাসরি ইমেইল বা মেসেজ পাঠান।
              </p>
            </div>
          </div>

          <a
            href={directMailtoUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 text-xs font-medium border border-stone-700 transition-colors w-fit shrink-0 cursor-pointer"
            title="Open default email client to mail ramjanalirayan@gmail.com"
          >
            <span>Open in Gmail / Mail App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Form Body */}
      <div className="p-5 sm:p-6">
        {successMessage && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-emerald-950 mb-0.5">
                Message Sent Successfully!
              </div>
              <p>{successMessage}</p>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
              >
                Send another message
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sender Email */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Your Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
              <span className="text-[10px] text-stone-600 mt-1 block">
                The admin will respond to this email address.
              </span>
            </div>

            {/* Sender Name */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Your Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Shakil Ahmed / John"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
              <span className="text-[10px] text-stone-600 mt-1 block">
                Helps us know how to address you.
              </span>
            </div>
          </div>

          {/* Category Chips */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              Topic / Issue Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ISSUE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold shadow-2xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Subject Line */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Short Subject / Summary (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Australian accent sound not clear on mobile..."
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          {/* Message Area */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Message / Describe the Issue *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Please describe what problem you are facing or what suggestions you have for the website..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white leading-relaxed resize-y min-h-[100px]"
            />
            <div className="flex justify-between items-center text-[10px] text-stone-600 mt-1">
              <span>Be as detailed as possible to help us quickly solve the problem.</span>
              <span>{message.length} characters</span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <ShieldAlert className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Messages are securely delivered to the studio admin dashboard.</span>
            </div>

            <button
              type="submit"
              disabled={loading || !senderEmail.trim() || !message.trim()}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Send to Admin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
