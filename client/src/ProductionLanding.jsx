import React from "react";
import { createRoot } from "react-dom/client";

function ProductionLanding() {
  return (
    <main className="anna-celebration" aria-labelledby="anna-message">
      <div className="anna-celebration__glow anna-celebration__glow--one" />
      <div className="anna-celebration__glow anna-celebration__glow--two" />
      <div className="anna-celebration__confetti" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <section className="anna-celebration__card">
        <p className="anna-celebration__eyebrow">A wonderful new beginning</p>
        <span className="anna-celebration__sparkle" aria-hidden="true">✦</span>
        <h1 id="anna-message">
          Congratulations, Anna,<br />
          on getting your new job!
        </h1>
        <p className="anna-celebration__note">Wishing you every success in this exciting next chapter.</p>
      </section>
      <style>{`
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body { margin: 0; }
        .anna-celebration {
          align-items: center;
          background: radial-gradient(circle at 50% 0%, #fffdf7 0, #f6ecd5 42%, #e8d2a8 100%);
          color: #47351d;
          display: flex;
          font-family: Georgia, "Times New Roman", serif;
          justify-content: center;
          min-height: 100svh;
          overflow: hidden;
          padding: 24px;
          position: relative;
          text-align: center;
        }
        .anna-celebration__card {
          background: rgba(255, 253, 247, .72);
          border: 1px solid rgba(167, 123, 45, .28);
          border-radius: 28px;
          box-shadow: 0 22px 70px rgba(98, 66, 19, .18), inset 0 1px rgba(255,255,255,.9);
          max-width: 720px;
          padding: clamp(48px, 9vw, 88px) clamp(28px, 8vw, 82px);
          position: relative;
          z-index: 1;
        }
        .anna-celebration__eyebrow {
          color: #9a6b22;
          font-family: Arial, sans-serif;
          font-size: .72rem;
          font-weight: 700;
          letter-spacing: .18em;
          margin: 0 0 18px;
          text-transform: uppercase;
        }
        .anna-celebration__sparkle { color: #b77a1c; display: block; font-size: 2.25rem; margin-bottom: 16px; }
        .anna-celebration h1 { font-size: clamp(2.35rem, 6.1vw, 4.8rem); font-weight: 500; letter-spacing: -.045em; line-height: 1.08; margin: 0; }
        .anna-celebration__note { color: #755d37; font-family: Arial, sans-serif; font-size: clamp(.98rem, 2vw, 1.1rem); line-height: 1.6; margin: 28px auto 0; max-width: 420px; }
        .anna-celebration__glow { background: #d5a148; border-radius: 50%; filter: blur(2px); opacity: .18; position: absolute; }
        .anna-celebration__glow--one { height: 340px; left: -140px; top: -120px; width: 340px; }
        .anna-celebration__glow--two { bottom: -155px; height: 390px; right: -160px; width: 390px; }
        .anna-celebration__confetti i { background: #b8832a; border-radius: 99px; height: 11px; opacity: .62; position: absolute; transform: rotate(35deg); width: 4px; }
        .anna-celebration__confetti i:nth-child(1) { left: 12%; top: 17%; }
        .anna-celebration__confetti i:nth-child(2) { background:#fff8e7; left: 22%; top: 75%; transform:rotate(-20deg); }
        .anna-celebration__confetti i:nth-child(3) { left: 83%; top: 19%; transform:rotate(-40deg); }
        .anna-celebration__confetti i:nth-child(4) { background:#8d6a32; left: 91%; top: 66%; }
        .anna-celebration__confetti i:nth-child(5) { background:#fff8e7; left: 7%; top: 52%; transform:rotate(-48deg); }
        .anna-celebration__confetti i:nth-child(6) { left: 72%; top: 84%; transform:rotate(11deg); }
        @media (max-width: 480px) { .anna-celebration { padding: 16px; } .anna-celebration__card { border-radius: 22px; } }
      `}</style>
    </main>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(<ProductionLanding />);
