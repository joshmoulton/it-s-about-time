import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
const Footer = () => {
  return <footer id="contact" className="py-6 px-4 border-t border-border relative" style={{
    backgroundImage: `url('/lovable-uploads/b10f012a-6279-4c66-984a-e1eac45701fe.png')`,
    backgroundSize: 'cover',
    backgroundPosition: 'top',
    backgroundRepeat: 'no-repeat'
  }}>
      <div className="container mx-auto">
        <div className="flex flex-row md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center">
            <img alt="Weekly Wizdom" className="w-full h-auto max-w-36" src="/lovable-uploads/9890ade4-e2c5-4060-95e0-654169856510.png" />
          </div>
          
          <div className="flex flex-col gap-3">
            <a href="https://x.com/WeeklyWizdom" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>X (Twitter)</span>
            </a>
            <a href="https://www.tiktok.com/@weekly_wizdom" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.849-1.292-1.75-1.292-3.044C16.449.567 15.882 0 15.155 0h-2.921c-.727 0-1.295.567-1.295 1.294v11.632a3.743 3.743 0 0 1-3.739 3.739 3.743 3.743 0 0 1-3.739-3.739 3.743 3.743 0 0 1 3.739-3.739c.367 0 .718.053 1.048.152V6.407a6.685 6.685 0 0 0-1.048-.082C3.335 6.325 0 9.66 0 13.525S3.335 20.725 7.2 20.725s7.2-3.335 7.2-7.2V7.492a8.954 8.954 0 0 0 4.921 1.487v-2.934c0-.727-.567-1.294-1.294-1.294a1.8 1.8 0 0 1-1.706-1.189z" />
              </svg>
              <span>TikTok</span>
            </a>
            <a href="https://www.instagram.com/weeklywizdom" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.40z" />
              </svg>
              <span>Instagram</span>
            </a>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center gap-6 text-white/80 text-sm">
          <Link to="/terms" className="hover:text-white transition-colors duration-200">
            Terms & Conditions
          </Link>
          <Link to="/privacy" className="hover:text-white transition-colors duration-200">
            Privacy Policy
          </Link>
        </div>
        
        <div className="border-t border-white/20 mt-6 pt-6 text-center text-white/80">
          <p>&copy; 2025 Weekly Wizdom. All rights reserved.</p>
        </div>
        
        
      </div>
    </footer>;
};
export default Footer;