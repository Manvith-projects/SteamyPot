const variants = {
  primary:
    "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#e23744] to-[#c81f32] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition hover:shadow-red-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e23744] disabled:cursor-not-allowed disabled:opacity-60",
  solid:
    "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#e23744] to-[#c81f32] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition hover:shadow-red-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e23744] disabled:cursor-not-allowed disabled:opacity-60",
  ghost:
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-[#c81f32] border border-[#f1c9cd] transition hover:border-[#e23744] hover:bg-[#fff4f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e23744] disabled:cursor-not-allowed disabled:opacity-60"
};

export default function Button({ children, variant = "primary", ...props }) {
  return (
    <button className={variants[variant]} {...props}>
      {children}
    </button>
  );
}
