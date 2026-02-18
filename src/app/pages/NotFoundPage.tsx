import { Link } from 'react-router';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        <h1
          className="text-[80px] md:text-[120px] tracking-[-0.022em] text-[#1d1d1f] mb-4"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          404
        </h1>
        <p className="text-[28px] text-[#86868b] mb-12" style={{ fontFamily: 'var(--font-text)' }}>
          Page not found
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#0066cc] text-white rounded-full text-[17px] hover:bg-[#0077ed] transition-colors"
          style={{ fontFamily: 'var(--font-text)' }}
        >
          <Home className="w-5 h-5" />
          Back to Projects
        </Link>
      </div>
    </div>
  );
}
