"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const REFUND_REASONS = [
  "Property Issue",
  "Booking Error",
  "Personal Reasons",
  "Other",
];

function isOutside90Days(dateStr: string) {
  if (!dateStr) return false;

  const booking = new Date(dateStr);
  const today = new Date();

  booking.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = (today.getTime() - booking.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 90;
}

export default function RefundForm() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [form, setForm] = useState<{
    full_name: string;
    email: string;
    booking_ref: string;
    booking_date: string;
    refund_reason: string;
    additional_details: string;
    file: File | null;
  }>({
    full_name: "",
    email: "",
    booking_ref: "",
    booking_date: "",
    refund_reason: "",
    additional_details: "",
    file: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const outside90 = isOutside90Days(form.booking_date);
  const isFutureDate = form.booking_date && form.booking_date > new Date().toISOString().split("T")[0];

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.full_name.trim()) e.full_name = "Full name is required";

    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";

    if (!form.booking_ref.trim())
      e.booking_ref = "Booking reference is required";

    if (!form.booking_date) {
      e.booking_date = "Booking date is required";
    }

    if (!form.refund_reason)
      e.refund_reason = "Please select a reason";

    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    setErrors((prev) => ({ ...prev, file: "" }));

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, file: "File must be under 10MB" }));
        e.target.value = "";
        return;
      }

      setForm((prev) => ({ ...prev, file }));
      setFileName(file.name);
      
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setForm((prev) => ({ ...prev, file: null }));
    setFileName("");
    setFilePreview(null);
    if (fileRef.current) (fileRef.current as HTMLInputElement).value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);

    try {
      let fileUrl = null;

      // ✅ 1. Upload file (if exists)
      if (form.file) {
        const fileName = `${Date.now()}-${form.file.name}`;

        const { data, error } = await supabase.storage
          .from("refund-files")
          .upload(fileName, form.file);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from("refund-files")
          .getPublicUrl(fileName);

        fileUrl = publicUrlData.publicUrl;
      }

      // ✅ 2. Insert into database
      const { data, error } = await supabase
        .from("refund_requests")
        .insert([
          {
            full_name: form.full_name,
            email: form.email,
            booking_ref: form.booking_ref,
            booking_date: form.booking_date,
            refund_reason: form.refund_reason,
            additional_details: form.additional_details,
            file_url: fileUrl,
          },
        ])
        .select();

      if (error) throw error;

      // ✅ 3. Redirect to success page with ID
      const newId = data?.[0]?.id;
      if (newId) {
        router.push(`/success?id=${newId}`);
      } else {
        throw new Error("Failed to retrieve insert ID");
      }

    } catch (err) {
      console.error(err);
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
        {outside90 && !isFutureDate && (
          <div className="mb-6 flex gap-3 items-start bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl px-4 py-3 text-sm">
            <span className="mt-0.5 text-yellow-500">
              ⚠️
            </span>
            <span>
              Your booking is outside the standard refund window. Your request
              will be reviewed on a case-by-case basis.
            </span>
          </div>
        )}

        {/* Future date warning banner */}
        {isFutureDate && (
          <div className="mb-6 flex gap-3 items-start bg-blue-50 border border-blue-300 text-blue-800 rounded-xl px-4 py-3 text-sm">
            <span className="mt-0.5 text-blue-500">
              ℹ️
            </span>
            <span>
              Date is from a future date.
            </span>
          </div>
        )}

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5"
        >
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${errors.full_name ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                }`}
            />
            {errors.full_name && (
              <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>
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

          {/* Booking Reference + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Reference <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="booking_ref"
                value={form.booking_ref}
                onChange={handleChange}
                placeholder="BK-123456"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${errors.booking_ref ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
              />
              {errors.booking_ref && (
                <p className="text-xs text-red-500 mt-1">{errors.booking_ref}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                name="booking_date"
                value={form.booking_date}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${errors.booking_date ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                  }`}
              />
              {errors.booking_date && (
                <p className="text-xs text-red-500 mt-1">{errors.booking_date}</p>
              )}
            </div>
          </div>

          {/* Refund Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refund Reason <span className="text-red-400">*</span>
            </label>
            <select
              name="refund_reason"
              value={form.refund_reason}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${errors.refund_reason ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"
                }`}
            >
              <option value="">Select a reason</option>
              {REFUND_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.refund_reason && (
              <p className="text-xs text-red-500 mt-1">{errors.refund_reason}</p>
            )}
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Details <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="additional_details"
              value={form.additional_details}
              onChange={handleChange}
              rows={4}
              placeholder="Please describe your issue in detail..."
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none border-gray-300 bg-gray-50"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supporting Document{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {filePreview ? (
              <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-white h-48 flex items-center justify-center group mb-1 shadow-sm">
                <img src={filePreview} alt="Preview" className="h-full w-full object-contain" />
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-red-500 rounded-full p-2 transition shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100"
                  title="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : fileName ? (
              <div className="flex items-center justify-between w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-4 mb-1">
                <p className="text-sm text-indigo-600 font-medium truncate pr-4">{fileName}</p>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-gray-400 hover:text-red-500 transition shrink-0"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  if (fileRef.current) (fileRef.current as HTMLInputElement).click();
                }}
                className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition mb-1"
              >
                <p className="text-sm text-gray-500">
                  Click to upload a photo or document
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, PDF up to 10MB
                </p>
              </div>
            )}
            
            {errors.file && (
              <p className="text-xs text-red-500 mt-1">{errors.file}</p>
            )}
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