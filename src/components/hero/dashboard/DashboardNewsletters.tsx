import { Mail, Clock } from "lucide-react";

const DashboardNewsletters = () => {
  const newsletters = [
    { 
      title: 'Crypto in 401(k)s?', 
      preview: 'Latest regulatory updates on crypto retirement plans', 
      date: 'Jul 18', 
      readTime: '5 min read',
      isNew: true 
    },
    { 
      title: 'Newsletter Sneak Peek', 
      preview: 'Exclusive insights from our premium research team', 
      date: 'Jul 16', 
      readTime: '5 min read',
      isNew: false 
    },
    { 
      title: 'Market Weekly Recap', 
      preview: 'Top performing assets and key market movements', 
      date: 'Jul 15', 
      readTime: '4 min read',
      isNew: false 
    },
    { 
      title: 'Trading Psychology', 
      preview: 'How emotions affect your trading decisions', 
      date: 'Jul 12', 
      readTime: '6 min read',
      isNew: false 
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Mail className="h-5 w-5 text-brand-primary" />
          Newsletter
          <div className="bg-brand-primary/20 rounded-full px-2 py-1 border border-brand-primary/30">
            <span className="text-brand-secondary text-xs font-medium">📧</span>
          </div>
        </h4>
      </div>
      
      <div className="space-y-3 flex-1 overflow-hidden">
        {newsletters.map((newsletter, index) => (
          <div key={index} className="bg-slate-800/80 rounded-xl p-4 border border-slate-600/60 hover:border-brand-primary/40 transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
            <div className="flex items-start justify-between mb-2">
              <h5 className="text-white font-medium text-sm group-hover:text-brand-secondary transition-colors">
                {newsletter.title}
              </h5>
              {newsletter.isNew && (
                <span className="bg-brand-secondary/20 text-brand-secondary text-xs px-2 py-1 rounded-full font-semibold">
                  New
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs mb-3 leading-relaxed">
              {newsletter.preview}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{newsletter.readTime}</span>
              </div>
              <span>{newsletter.date}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <button className="w-full bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-secondary text-sm font-medium py-3 rounded-xl transition-all duration-200 border border-brand-primary/30 hover:border-brand-primary/50">
          View All Newsletters
        </button>
      </div>
    </div>
  );
};

export default DashboardNewsletters;