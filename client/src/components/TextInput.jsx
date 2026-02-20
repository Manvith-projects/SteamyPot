const base = "block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#e23744] focus:ring-2 focus:ring-[#f7c4c9] transition";

export default function TextInput({ label, type = "text", ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      <input type={type} className={base} {...props} />
    </label>
  );
}
