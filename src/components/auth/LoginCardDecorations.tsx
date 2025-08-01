
import React from 'react';

export const LoginCardDecorations: React.FC = () => {
  return (
    <>
      {/* Decorative gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-purple-200/40 to-transparent rounded-full blur-xl" />
    </>
  );
};
