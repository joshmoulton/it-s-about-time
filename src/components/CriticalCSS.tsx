// Critical CSS component for immediate styling
export const CriticalCSS = () => {
  return (
    <style>{`
      /* Critical above-the-fold styles for hero section */
      .hero-section {
        min-height: 100vh;
        background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-variant)) 100%);
        display: flex;
        flex-direction: column;
        position: relative;
      }
      
      .hero-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
      }
      
      .hero-text {
        text-align: center;
        color: white;
        max-width: 800px;
        margin: 0 auto;
      }
      
      .hero-title {
        font-size: clamp(2rem, 5vw, 4rem);
        font-weight: 700;
        line-height: 1.1;
        margin-bottom: 1rem;
        font-family: 'Merriweather', serif;
      }
      
      .hero-subtitle {
        font-size: clamp(1rem, 2.5vw, 1.25rem);
        margin-bottom: 2rem;
        opacity: 0.9;
        font-family: 'Inter', sans-serif;
      }
      
      .hero-cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 1rem 2rem;
        background: white;
        color: hsl(var(--primary));
        border-radius: 0.5rem;
        font-weight: 600;
        text-decoration: none;
        font-family: 'Montserrat', sans-serif;
        transition: transform 0.2s ease;
      }
      
      .hero-cta:hover {
        transform: translateY(-2px);
      }
      
      /* Critical navigation styles */
      .nav-header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 50;
        padding: 1rem 2rem;
        
      }
      
      .nav-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 1200px;
        margin: 0 auto;
      }
      
      .nav-logo {
        font-size: 1.5rem;
        font-weight: 700;
        color: white;
        text-decoration: none;
        font-family: 'Merriweather', serif;
      }
      
      .nav-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      /* Loading states */
      .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading-shimmer 1.5s infinite;
      }
      
      @keyframes loading-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      /* Responsive optimizations */
      @media (max-width: 768px) {
        .hero-content {
          padding: 1rem 0.5rem;
        }
        
        .nav-header {
          padding: 0.5rem 1rem;
        }
        
        .hero-cta {
          padding: 0.75rem 1.5rem;
          font-size: 0.9rem;
        }
      }
      
      /* Performance optimizations */
      * {
        box-sizing: border-box;
      }
      
      img {
        max-width: 100%;
        height: auto;
        display: block;
      }
      
    `}</style>
  );
};