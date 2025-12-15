import React from 'react';

const Snowfall: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <style>{`
        .snowflake {
          position: absolute;
          top: -10px;
          color: #FFF;
          font-size: 1em;
          font-family: Arial, sans-serif;
          text-shadow: 0 0 5px #000;
          animation: fall linear forwards;
        }
        @keyframes fall {
          to { transform: translateY(105vh); }
        }
      `}</style>
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="snowflake opacity-60"
          style={{
            left: `${Math.random() * 100}vw`,
            animationDuration: `${Math.random() * 5 + 5}s`,
            animationDelay: `${Math.random() * 5}s`,
            fontSize: `${Math.random() * 10 + 10}px`
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};

export default Snowfall;
