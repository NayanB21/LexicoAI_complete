export default function EndVivaModal({ isOpen, onCancel, onConfirm, attemptedCount }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-white">End viva early?</h3>
        <p className="mt-2 text-sm text-gray-300">
          You have answered {attemptedCount} question{attemptedCount === 1 ? '' : 's'}.
          Your progress will be saved and scored based on attempted questions only.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
          >
            Continue Viva
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white hover:from-rose-500 hover:to-orange-500"
          >
            End & Save
          </button>
        </div>
      </div>
    </div>
  );
}
