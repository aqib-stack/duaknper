export function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-pink-600" />
        <p className="mt-4 text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
