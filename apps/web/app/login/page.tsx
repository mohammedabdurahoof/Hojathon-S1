import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 border border-slate-800 bg-slate-900/80 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-indigo-600 items-center justify-center font-bold text-white text-xl mb-3 shadow-lg shadow-indigo-500/30">
            AI
          </div>
          <h2 className="text-2xl font-bold text-white">Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">Access the AI Remedial Learning Platform</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="student@remedial.edu"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              defaultValue="student@remedial.edu"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              defaultValue="password123"
            />
          </div>

          <Link
            href="/dashboard"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center shadow-lg shadow-indigo-600/30"
          >
            Sign In to Dashboard
          </Link>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Demo login: student@remedial.edu | teacher@remedial.edu
        </div>
      </div>
    </div>
  );
}
