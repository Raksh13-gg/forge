import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, 
  Search, 
  Video, 
  FileText, 
  Presentation, 
  Link as LinkIcon,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

export default function MyMaterials() {
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sessRes, matRes] = await Promise.all([
          supabase.from('sessions').select('*').order('date', { ascending: false }),
          supabase.from('materials').select('*')
        ]);

        if (sessRes.data) setSessions(sessRes.data);
        if (matRes.data) setMaterials(matRes.data);
      } catch (err) {
        console.error('Error loading materials:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'recording': return <Video size={18} />;
      case 'slides': return <Presentation size={18} />;
      case 'document': return <FileText size={18} />;
      default: return <LinkIcon size={18} />;
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      // Filter out low-quality test data (single letters or random gibberish)
      const isTestData = s.topic.length < 3 || /^[a-z]+$/i.test(s.topic) && s.topic.length < 5;
      if (isTestData) return false;

      const matchesSearch = s.topic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMonth = selectedMonth === 'all' || s.month_number.toString() === selectedMonth;
      
      const sessionMaterials = materials.filter(m => m.session_id === s.id);
      const hasMatchingMaterial = sessionMaterials.some(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (matchesSearch || hasMatchingMaterial) && matchesMonth;
    });
  }, [sessions, materials, searchQuery, selectedMonth]);

  return (
    <div className="min-h-screen bg-canvas relative pb-20">
      {/* Design System Background Layer */}
      <div className="fixed inset-0 z-0 bg-dot-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] z-0 bg-cosmic-glow pointer-events-none" />

      <div className="relative z-10 p-8 lg:p-12 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-label text-accent-glow font-black tracking-[0.2em] uppercase">Academic Library</span>
            <div className="h-px w-12 bg-border-subtle" />
          </div>
          <h1 className="text-display-lg text-primary tracking-tighter font-black leading-none mb-4">Knowledge Base</h1>
          <p className="text-secondary text-body-lg max-w-xl font-medium leading-relaxed">
            A curated repository of session recordings, technical whitepapers, and module slides for The Forge.
          </p>
        </div>

        {/* Filter Bar - Modern Glassmorphic */}
        <div className="flex flex-col md:flex-row gap-4 mb-12 items-center justify-between bg-surface/40 p-4 rounded-2xl border border-subtle backdrop-blur-xl shadow-raised">
          <div className="relative w-full md:w-[450px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-accent-glow transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search topics, modules or resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-12 bg-surface-inset/60 border-subtle focus:border-accent-glow h-12 text-sm"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-inset/60 border border-subtle">
              <Filter size={14} className="text-tertiary" />
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-primary focus:ring-0 cursor-pointer"
              >
                <option value="all">ALL MODULES</option>
                <option value="1">MONTH 01</option>
                <option value="2">MONTH 02</option>
                <option value="3">MONTH 03</option>
                <option value="4">MONTH 04</option>
                <option value="5">MONTH 05</option>
                <option value="6">MONTH 06</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSessions.map(session => {
              const sessionMaterials = materials.filter(m => m.session_id === session.id);
              return (
                <div key={session.id} className="card group hover:bg-surface-raised/40 transition-all duration-700 hover:-translate-y-2 border-subtle hover:border-accent-glow/30 p-8 flex flex-col h-full shadow-card hover:shadow-raised">
                  <div className="flex justify-between items-start mb-8">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-micro font-black text-tertiary tracking-[0.15em]">
                        <Calendar size={12} className="text-accent-glow" />
                        {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                      </div>
                      <h3 className="text-h3 text-primary font-bold leading-tight group-hover:text-accent-glow transition-colors">
                        {session.topic}
                      </h3>
                    </div>
                    <span className="text-micro font-black px-2.5 py-1 rounded bg-accent-glow/10 text-accent-glow border border-accent-glow/20">M{session.month_number}</span>
                  </div>

                  <div className="space-y-3 mt-auto">
                    {sessionMaterials.length > 0 ? (
                      sessionMaterials.map(mat => (
                        <a 
                          key={mat.id}
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded-xl bg-surface-inset/40 hover:bg-surface-raised/80 border border-subtle/50 hover:border-accent-glow/40 transition-all group/item"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-void flex items-center justify-center text-accent-glow group-hover/item:scale-110 group-hover/item:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all">
                              {getIcon(mat.type)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-primary font-bold tracking-tight line-clamp-1">{mat.title}</span>
                              <span className="text-[10px] text-tertiary uppercase tracking-widest font-black opacity-60">{mat.type}</span>
                            </div>
                          </div>
                          <Download size={14} className="text-tertiary group-hover/item:text-primary transition-transform group-hover/item:translate-y-0.5" />
                        </a>
                      ))
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center bg-surface-inset/20 rounded-2xl border border-dashed border-subtle/50">
                        <div className="w-10 h-10 rounded-full bg-surface-inset flex items-center justify-center text-tertiary/40 mb-3">
                          <BookOpen size={20} />
                        </div>
                        <p className="text-[10px] font-black text-tertiary/60 uppercase tracking-[0.2em]">Pending Repository</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-surface/20 rounded-3xl border border-dashed border-subtle text-center backdrop-blur-sm">
            <div className="w-20 h-20 rounded-3xl bg-surface-raised flex items-center justify-center text-tertiary mb-6 rotate-12">
              <Search size={40} />
            </div>
            <h2 className="text-h2 text-primary font-bold">No assets match your query</h2>
            <p className="text-secondary mt-3 max-w-sm mx-auto font-medium">Try broadening your search or switching to a different academic module.</p>
          </div>
        )}
      </div>
    </div>
  );
}
