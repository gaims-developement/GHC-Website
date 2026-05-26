import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

function NotFound() {
  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', fontFamily: "'Syne', sans-serif", color: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden', position: 'relative' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .nf-glow {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 600px; height: 400px;
          background: radial-gradient(ellipse, rgba(255,61,127,0.18) 0%, rgba(192,38,211,0.1) 40%, transparent 70%);
          pointer-events: none;
        }
        .nf-404 {
          font-size: clamp(7rem, 18vw, 14rem);
          font-weight: 800; letter-spacing: -6px; line-height: 1;
          background: linear-gradient(135deg, rgba(255,107,157,0.2), rgba(192,38,211,0.15));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -58%);
          user-select: none; pointer-events: none;
        }
        .nf-content {
          position: relative; text-align: center; padding: 32px;
        }
        .nf-kicker {
          display: inline-block;
          padding: 6px 16px; border-radius: 100px;
          background: rgba(255,61,127,0.12);
          border: 1px solid rgba(255,61,127,0.25);
          font-size: 12px; font-weight: 600; letter-spacing: 0.15em;
          text-transform: uppercase; color: #ff6b9d;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 28px;
        }
        .nf-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800; letter-spacing: -1.5px;
        }
        .nf-body {
          margin-top: 16px; font-size: 16px; color: rgba(255,255,255,0.45);
          font-family: 'DM Sans', sans-serif; line-height: 1.6;
          max-width: 380px; margin-left: auto; margin-right: auto;
        }
        .nf-btn {
          display: inline-flex; align-items: center; gap: 8px;
          margin-top: 36px; padding: 14px 28px; border-radius: 100px;
          background: linear-gradient(135deg, #ff6b9d, #ff3d7f);
          color: #fff; font-size: 14px; font-weight: 600;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 8px 30px rgba(255,61,127,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .nf-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(255,61,127,0.5); }
      `}</style>

      <div className="nf-glow" />
      <div className="nf-404">404</div>

      <div className="nf-content">
        <div className="nf-kicker">Error 404</div>
        <h1 className="nf-title">Page not found</h1>
        <p className="nf-body">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="nf-btn">
          Back to Home <ArrowRight size={16} />
        </Link>
      </div>

    </div>
  )
}

export default NotFound