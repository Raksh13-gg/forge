import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Plus, 
  ExternalLink, 
  Presentation, 
  Video, 
  FileText, 
  Link as LinkIcon, 
  BookOpen, 
  X, 
  CheckCircle2,
  Calendar,
  Filter,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function Materials() {
  const [sessionsWithMaterials, setSessionsWithMaterials] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [months, setMonths] = useState([]);
  
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('slides');
  const [newUrl, setNewUrl] = useState('');
  const [newSessionId, setNewSessionId] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [toast, setToast] = useState(null);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('sessions')
        .select('*, materials(*)')
        .order('date', { ascending: false });
        
      if (data) {
        const filtered = data.filter(s => s.materials && s.materials.length > 0);
        setSessionsWithMaterials(filtered);
        setAllSessions(data);
        const uniqueMonths = [...new Set(data.map(s => s.month_number))].sort((a,b) => b - a);
        setMonths(uniqueMonths);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleAddMaterial = async () => {
    if (!newSessionId || !newTitle || !newUrl) return;
    let finalUrl = newUrl;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;

    setSaving(true);
    const { error } = await supabase
      .from('materials')
      .insert({ session_id: newSessionId, title: newTitle, type: newType, url: finalUrl });
      
    setSaving(false);
    if (!error) {
      setIsModalOpen(false);
      setNewTitle('');
      setNewUrl('');
      setToast('Resource successfully added to session ledger.');
      setTimeout(() => setToast(null), 4000);
      fetchMaterials();
    }
  };

  const filteredData = useMemo(() => {
    return sessionsWithMaterials.filter(session => {
      const monthMatch = selectedMonth === 'All' || session.month_number.toString() === selectedMonth;
      const searchMatch = 
        session.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.materials.some(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
      return monthMatch && searchMatch;
    });
  }, [sessionsWithMaterials, selectedMonth, searchQuery]);

  const getIconForType = (type) => {
    switch (type) {
      case 'slides': return <Presentation size={18} className="text-accent-glow" />;
      case 'recording': return <Video size={18} className="text-success-fg" />;
      case 'document': return <FileText size={18} className="text-info-fg" />;
      default: return <LinkIcon size={18} className="text-secondary" />;
    }
  };

  return (
    <div className="pb-32 max-w-7xl mx-auto px-6 animate-in fade-in duration-700">
      
      {/* ── Header Area */}
      <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="relative">
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-accent-glow blur-[100px] opacity-10 pointer-events-none" />
          <h1 className="text-display-md text-primary font-black tracking-tighter leading-none mb-4">Resource Library</h1>
          <p className="text-body-lg text-secondary font-medium tracking-tight">Curated educational assets and session recordings.</p>
        </div>

        <button 
          onClick={() => { setIsModalOpen(true); if(allSessions.length > 0 && !newSessionId) setNewSessionId(allSessions[0].id); }} 
          className="btn-primary h-14 px-8 rounded-2xl bg-white text-void font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-all"
        >
          <Plus size={18} className="mr-2" /> Add Material
        </button>
      </div>

      {/* ── Filter Bar */}
      <div className="flex flex-col md:flex-row gap-5 mb-12 z-20 relative">
        <div className="flex items-center gap-3 bg-surface-raised/40 backdrop-blur-xl border border-subtle p-2 rounded-2xl shadow-lg w-full md:w-auto">
          <div className="flex items-center px-4 py-2 gap-2 text-micro text-tertiary font-black uppercase tracking-widest border-r border-subtle/50">
            <Filter size={14} /> Month
          </div>
          <select 
            className="bg-transparent text-sm font-bold text-primary px-4 py-2 focus:outline-none cursor-pointer"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            <option value="All">All Time</option>
            {months.map(m => (
              <option key={m} value={m}>Month {m}</option>
            ))}
          </select>
        </div>
        
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-accent-glow transition-colors" />
          <input 
            type="text" 
            placeholder="Search topics, filenames, or keywords..."
            className="w-full bg-surface-raised/40 backdrop-blur-xl border border-subtle rounded-2xl h-14 pl-14 pr-6 text-sm text-primary focus:outline-none focus:border-accent-glow/50 transition-all placeholder:text-tertiary/60"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card h-64 animate-pulse opacity-50" />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="card h-[400px] flex flex-col items-center justify-center p-16 text-center border-dashed group">
          <div className="w-20 h-20 rounded-[2rem] bg-surface-raised border border-subtle flex items-center justify-center mx-auto mb-8 opacity-40 group-hover:opacity-100 transition-all">
            <BookOpen size={36} className="text-tertiary" />
          </div>
          <h3 className="text-display-xs text-secondary mb-3 font-black tracking-tight">Empty Library</h3>
          <p className="text-body text-tertiary max-w-sm mb-8 leading-relaxed">No matching resources found for your current filters.</p>
          <button className="btn-secondary px-8" onClick={() => { setSearchQuery(''); setSelectedMonth('All'); }}>Reset Explorer</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredData.map(session => (
            <div key={session.id} className="card p-0 flex flex-col hover:border-accent-glow/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent-glow to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />
              
              <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-micro text-tertiary font-black tracking-[0.2em] uppercase opacity-60 flex items-center gap-2">
                    <Calendar size={12} /> {session.date}
                  </span>
                  <span className="text-micro text-accent-glow font-black tracking-widest uppercase">MONTH {session.month_number}</span>
                </div>
                <h3 className="text-xl font-black text-primary mb-6 leading-tight group-hover:text-accent-glow transition-colors">{session.topic}</h3>
              </div>
              
              <div className="px-8 pb-8 flex flex-col gap-3 mt-auto">
                {session.materials.map(mat => (
                  <a 
                    key={mat.id} 
                    href={mat.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl bg-surface-raised/40 border border-subtle hover:bg-surface-raised hover:border-accent-glow/30 transition-all group/item"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center group-hover/item:scale-110 transition-transform">
                        {getIconForType(mat.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-bold text-primary truncate group-hover/item:text-accent-glow transition-colors">{mat.title}</p>
                        <p className="text-micro text-tertiary uppercase font-bold tracking-widest opacity-60 mt-0.5">{mat.type}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-tertiary group-hover/item:text-primary transition-all group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300 bg-void/80 backdrop-blur-md">
          <div className="bg-surface-raised border border-default rounded-[2.5rem] shadow-2xl p-10 max-w-[540px] w-full animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-accent-glow via-indigo-500 to-accent-glow" />
            
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-glow/20 border border-accent-glow/30 flex items-center justify-center text-accent-glow">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-2xl font-black text-primary tracking-tight">New Resource</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-tertiary hover:text-primary transition-colors p-2">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-micro text-tertiary uppercase font-black tracking-widest ml-1">Target Session</label>
                <select 
                  className="input w-full bg-void/50 h-12"
                  value={newSessionId}
                  onChange={e => setNewSessionId(e.target.value)}
                >
                  {allSessions.map(s => (
                    <option key={s.id} value={s.id} className="bg-surface-raised">{s.date} — {s.topic}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-micro text-tertiary uppercase font-black tracking-widest ml-1">Asset Title</label>
                <input 
                  type="text" 
                  className="input w-full h-12" 
                  placeholder="e.g. Master Class Recording"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-micro text-tertiary uppercase font-black tracking-widest ml-1">Asset Category</label>
                  <select 
                    className="input w-full bg-void/50 h-12"
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                  >
                    <option value="slides">Presentation</option>
                    <option value="recording">Video Recording</option>
                    <option value="document">PDF / Document</option>
                    <option value="link">Web Link</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-micro text-tertiary uppercase font-black tracking-widest ml-1">URL / Link</label>
                  <input 
                    type="url" 
                    className="input w-full h-12" 
                    placeholder="https://drive.google.com/..."
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-subtle/50">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary h-12 px-8 font-bold">Cancel</button>
              <button 
                onClick={handleAddMaterial} 
                disabled={saving || !newTitle || !newUrl} 
                className="btn-primary h-12 px-10 bg-white text-void font-black shadow-xl disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Add to Ledger'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-50 w-80 p-5 bg-surface-raised/80 backdrop-blur-2xl border border-default rounded-2xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-bottom-10 duration-500">
          <div className="w-10 h-10 rounded-xl bg-success-bg/30 border border-success-border/30 flex items-center justify-center text-success-fg">
             <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-sm font-black text-primary tracking-tight">Success</p>
            <p className="text-[11px] text-secondary mt-1 font-medium leading-relaxed">{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
