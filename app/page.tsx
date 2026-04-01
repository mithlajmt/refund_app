"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const REFUND_REASONS = [
  "Property Issue",
  "Booking Error",
  "Personal Reasons",
  "Other",
];

function isOutside90Days(dateStr) {
  if (!dateStr) return false;
  const booking = new Date(dateStr);
  const today = new Date();
  const diffMs = today - booking;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 90;
}

export default function RefundForm() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    bookingRef: "",
    bookingDate: "",
    reason: "",
    details: "",
    file: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const outside90 = isOutside90Days(form.bookingDate);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!form.bookingRef.trim()) e.bookingRef = "Booking reference is required";
    if (!form.bookingDate) e.bookingDate = "Booking date is required";
    if (!form.reason) e.reason = "Please select a reason";
    if (!form.details.trim()) e.details = "Please provide additional details";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, file }));
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });

      const res = await fetch("/api/submit-refund", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Submission failed");
      const data = await res.json();

      const params = new URLSearchParams({
        fullName: form.fullName,
        email: form.email,
        bookingRef: form.bookingRef,
        bookingDate: form.bookingDate,
        reason: form.reason,
        details: form.details,
        id: data.id || "",
      });

      router.push(`/success?${params.toString()}`);
    } catch (err) {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-indigo-500 uppercase mb-1">
            Guest Services
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Refund Request</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Fill in the details below and we'll review your request promptly.
          </p>
        </div>

        {/* 90-day warning banner */}
        {outside90 && (
          <div className="mb-6 flex gap-3 items-start bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl px-4 py-3 text-sm">
            <span className="mt-0.5 text-yellow-500">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L1.5 13.5h13L8 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="8" cy="11.5" r="0.6" fill="currentColor" />
              </svg>
            </span>
            <span>
              Your booking is outside the standard refund window. Your request
              will be reviewed on a case-by-case basis.
            </span>
          </div>
        )}

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5"
        >
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${errors.fullName ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                }`}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                }`}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Booking Reference + Date (2 col) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Reference <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="bookingRef"
                value={form.bookingRef}
                onChange={handleChange}
                placeholder="BK-123456"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${errors.bookingRef ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
              />
              {errors.bookingRef && (
                <p className="text-xs text-red-500 mt-1">{errors.bookingRef}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                name="bookingDate"
                value={form.bookingDate}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${errors.bookingDate ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
              />
              {errors.bookingDate && (
                <p className="text-xs text-red-500 mt-1">{errors.bookingDate}</p>
              )}
            </div>
          </div>

          {/* Refund Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refund Reason <span className="text-red-400">*</span>
            </label>
            <select
              name="reason"
              value={form.reason}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${errors.reason ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                }`}
            >
              <option value="">Select a reason</option>
              {REFUND_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.reason && (
              <p className="text-xs text-red-500 mt-1">{errors.reason}</p>
            )}
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Details <span className="text-red-400">*</span>
            </label>
            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              rows={4}
              placeholder="Please describe your issue in detail..."
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none ${errors.details ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                }`}
            />
            {errors.details && (
              <p className="text-xs text-red-500 mt-1">{errors.details}</p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supporting Document{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div
              onClick={() => fileRef.current.click()}
              className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition"
            >
              {fileName ? (
                <p className="text-sm text-indigo-600 font-medium">{fileName}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    Click to upload a photo or document
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    JPG, PNG, PDF up to 10MB
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <p className="text-sm text-red-500 text-center">{errors.submit}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Refund Request"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Submissions are reviewed within 2–3 business days.
        </p>
      </div>
    </div>
  );
}