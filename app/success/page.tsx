import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const id = params?.id;

  if (!id) {
    return notFound();
  }

  const { data: request, error } = await supabase
    .from("refund_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Request Not Found</h1>
          <p className="text-gray-500 mb-6">We couldn't find a refund request with that ID.</p>
          <Link href="/">
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition">
              Go Back
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Request Submitted Successfully
          </h1>
          <p className="text-sm text-gray-500">
            Your refund request has been saved securely to our system.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-8">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-3">
            Submission Summary
          </h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-500 shrink-0">Reference ID</span>
              <span className="font-mono text-indigo-600 font-medium text-right break-all">{request.id}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-500 shrink-0">Full Name</span>
              <span className="font-medium text-gray-900 text-right">{request.full_name}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-500 shrink-0">Email</span>
              <span className="font-medium text-gray-900 text-right">{request.email}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-500 shrink-0">Booking Ref</span>
              <span className="font-medium text-gray-900 text-right">{request.booking_ref}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-500 shrink-0">Booking Date</span>
              <span className="font-medium text-gray-900 text-right">{request.booking_date}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-500 shrink-0">Reason</span>
              <span className="font-medium text-gray-900 text-right">{request.refund_reason}</span>
            </div>

            {request.additional_details && (
              <div className="pt-3 border-t border-gray-100 mt-2">
                <span className="block text-gray-500 mb-2 font-medium">Additional Details</span>
                <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                  {request.additional_details}
                </p>
              </div>
            )}

            {request.file_url && (
              <div className="pt-3 border-t border-gray-100 mt-2">
                <span className="block text-gray-500 mb-2 font-medium">Attached Document</span>
                {request.file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                  <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden bg-white">
                    <img src={request.file_url} alt="Attachment" className="max-h-60 w-full object-contain bg-gray-50" />
                    <a href={request.file_url} target="_blank" rel="noreferrer" className="block text-center text-xs text-indigo-600 hover:text-indigo-800 bg-gray-50 py-2 border-t border-gray-200 transition">
                      Open Image in New Tab ↗
                    </a>
                  </div>
                ) : (
                  <a href={request.file_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1 font-medium bg-indigo-50 p-2 rounded w-fit transition">
                    View Attachment ↗
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <Link href="/">
          <button className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 transition shadow-sm">
            Submit Another Request
          </button>
        </Link>
      </div>
    </div>
  );
}