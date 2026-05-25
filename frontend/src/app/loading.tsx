export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      {/* Pulse Logo Animation */}
      <div className="relative mb-6">
        <div className="w-16 h-16 bg-gradient-to-tr from-[#FF512F] to-[#DD2476] rounded-2xl flex items-center justify-center animate-pulse shadow-lg">
          <span className="text-white font-bold text-3xl">V</span>
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FF512F] to-[#DD2476] blur-xl opacity-40 rounded-2xl animate-pulse"></div>
      </div>
      <h3 className="text-lg font-semibold text-[#111827] animate-pulse">Loading...</h3>
      <p className="text-sm text-[#6B7280] mt-2 animate-pulse">Please wait while we set things up</p>
    </div>
  );
}
