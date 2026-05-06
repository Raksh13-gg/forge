import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useSearch } from '../contexts/SearchContext';
import { 
  Plus, 
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
  ArrowUpRight,
  Trash2,
  AlertCircle
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

export default function Materials() {
  const { globalSearchQuery, setGlobalSearchQuery } = useSearch();
  const [sessionsWithMaterials, setSessionsWithMaterials] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [months, setMonths] = useState([]); // stores { number, name }
  
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('slides');
  const [newUrl, setNewUrl] = useState('');
  const [newSessionId, setNewSessionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // stores material object
  
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
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const uniqueMonths = [...new Set(data.map(s => s.month_number))]
          .sort((a,b) => b - a)
          .map(m => ({ number: m, name: monthNames[m-1] }));
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

  const handleDeleteMaterial = async (id) => {
    setDeleting(true);
    const { error } = await supabase.from('materials').delete().eq('id', id);
    setDeleting(false);
    
    if (!error) {
      setConfirmDelete(null);
      setToast('Resource removed from the library.');
      setTimeout(() => setToast(null), 4000);
      fetchMaterials();
    }
  };

  const filteredData = useMemo(() => {
    return sessionsWithMaterials.filter(session => {
      const monthMatch = selectedMonth === 'All' || session.month_number.toString() === selectedMonth;
      const searchMatch = 
        session.topic.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
        session.materials.some(m => m.title.toLowerCase().includes(globalSearchQuery.toLowerCase()));
      return monthMatch && searchMatch;
    });
  }, [sessionsWithMaterials, selectedMonth, globalSearchQuery]);

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
        <CustomSelect 
          label="Month"
          value={selectedMonth}
          onChange={setSelectedMonth}
          options={[
            { value: 'All', label: 'All Time' },
            ...months.map(m => ({ value: m.number.toString(), label: m.name }))
          ]}
        />
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
          <button className="btn-secondary px-8" onClick={() => { setGlobalSearchQuery(''); setSelectedMonth('All'); }}>Reset Explorer</button>
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
                  <div 
                    key={mat.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-surface-raised/40 border border-subtle hover:bg-surface-raised hover:border-accent-glow/30 transition-all group/item"
                  >
                    <a 
                      href={mat.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 overflow-hidden flex-1"
                    >
                      <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center group-hover/item:scale-110 transition-transform">
                        {getIconForType(mat.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-bold text-primary truncate group-hover/item:text-accent-glow transition-colors">{mat.title}</p>
                        <p className="text-micro text-tertiary uppercase font-bold tracking-widest opacity-60 mt-0.5">{mat.type}</p>
                      </div>
                    </a>
                    <div className="flex items-center gap-2">
                       <a href={mat.url} target="_blank" rel="noopener noreferrer" className="p-2 text-tertiary hover:text-primary transition-colors">
                          <ArrowUpRight size={14} />
                       </a>
                       <button 
                        onClick={() => setConfirmDelete(mat)}
                        className="p-2 text-tertiary hover:text-danger-fg transition-colors opacity-0 group-hover/item:opacity-100"
                       >
                          <Trash2 size={14} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-void/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-surface-raised border border-danger-border/30 rounded-[2.5rem] p-10 max-w-[480px] w-full animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-danger-fg opacity-20" />
              
              <div className="flex flex-col items-center text-center">
                 <div className="w-20 h-20 rounded-3xl bg-danger-bg/20 flex items-center justify-center text-danger-fg mb-8 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                    <AlertCircle size={40} />
                 </div>
                 <h2 className="text-display-xs text-primary font-black tracking-tighter mb-4">Purge Resource?</h2>
                 <p className="text-secondary text-sm font-medium leading-relaxed mb-10 px-4">
                    You are about to remove <span className="text-primary font-bold">"{confirmDelete.title}"</span>. This action is irreversible and the resource will be detached from the session ledger.
                 </p>
                 
                 <div className="flex gap-4 w-full">
                    <button 
                      onClick={() => setConfirmDelete(null)} 
                      className="btn-secondary flex-1 h-12 font-bold"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleDeleteMaterial(confirmDelete.id)}
                      disabled={deleting}
                      className="btn-primary flex-1 h-12 bg-danger-fg text-white font-black shadow-xl"
                    >
                      {deleting ? 'Purging...' : 'Confirm Purge'}
                    </button>
                 </div>
              </div>
           </div>
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
                <CustomSelect 
                  value={newSessionId}
                  onChange={setNewSessionId}
                  options={allSessions.map(s => ({ value: s.id.toString(), label: `${s.date} — ${s.topic}` }))}
                />
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
                  <CustomSelect 
                    value={newType}
                    onChange={setNewType}
                    options={[
                      { value: 'slides', label: 'Presentation' },
                      { value: 'recording', label: 'Video Recording' },
                      { value: 'document', label: 'PDF / Document' },
                      { value: 'link', label: 'Web Link' }
                    ]}
                  />
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
