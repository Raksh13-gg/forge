import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  BrainCircuit,
  Database,
  Table as TableIcon,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { suggestMapping, TARGET_FIELDS } from '../lib/csvMapper';

export default function UploadCSV() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview/Confirm
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [isAiMapping, setIsAiMapping] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  // -------------------------------------------------------------
  // Step 1: File Upload & Parsing
  // -------------------------------------------------------------
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      processFile(selectedFile);
    } else {
      setError("Please upload a valid CSV file.");
    }
  };

  const processFile = (selectedFile) => {
    setFile(selectedFile);
    setError(null);
    
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setError("The CSV file appears to be empty.");
          return;
        }
        setCsvData(results.data);
        setCsvHeaders(Object.keys(results.data[0]));
        setStep(2);
      },
      error: (err) => {
        setError("Error parsing CSV: " + err.message);
      }
    });
  };

  // -------------------------------------------------------------
  // Step 2: Mapping Logic
  // -------------------------------------------------------------
  const handleMapChange = (targetKey, csvHeader) => {
    setMapping(prev => ({ ...prev, [targetKey]: csvHeader }));
  };

  const handleAiAutoMap = async () => {
    setIsAiMapping(true);
    setError(null);
    try {
      const suggested = await suggestMapping(csvHeaders);
      // Filter out any suggestions that aren't actually in our target fields
      const filteredMapping = {};
      TARGET_FIELDS.forEach(field => {
        if (suggested[field.key] && csvHeaders.includes(suggested[field.key])) {
          filteredMapping[field.key] = suggested[field.key];
        }
      });
      setMapping(filteredMapping);
    } catch (err) {
      setError("AI mapping failed. Please map columns manually.");
    } finally {
      setIsAiMapping(false);
    }
  };

  const validateMapping = () => {
    const missingRequired = TARGET_FIELDS.filter(f => f.required && !mapping[f.key]);
    if (missingRequired.length > 0) {
      setError(`Please map all required fields: ${missingRequired.map(f => f.label).join(', ')}`);
      return false;
    }
    return true;
  };

  const proceedToPreview = () => {
    if (validateMapping()) {
      setStep(3);
    }
  };

  // -------------------------------------------------------------
  // Step 3: Import Logic
  // -------------------------------------------------------------
  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    
    try {
      // Transform data based on mapping
      const studentsToImport = csvData.map(row => {
        const student = {};
        Object.entries(mapping).forEach(([targetKey, csvHeader]) => {
          student[targetKey] = row[csvHeader]?.trim();
        });
        return student;
      });

      // Insert into students table (Upsert on USN)
      const { data, error: importError } = await supabase
        .from('students')
        .upsert(studentsToImport, { onConflict: 'usn' })
        .select();

      if (importError) throw importError;

      setImportResult({
        count: data.length,
        total: csvData.length
      });
      setStep(4);
    } catch (err) {
      console.error("Import error:", err);
      setError("Import failed: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // -------------------------------------------------------------
  // Render Helpers
  // -------------------------------------------------------------
  
  const ProgressSteps = () => (
    <div className="flex items-center gap-4 mb-10">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            step === s ? 'bg-accent-glow text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 
            step > s ? 'bg-success-fg text-white' : 'bg-surface-raised text-tertiary border border-subtle'
          }`}>
            {step > s ? <CheckCircle size={16} /> : s}
          </div>
          {s < 3 && <div className={`w-12 h-px ${step > s ? 'bg-success-fg' : 'bg-subtle'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-display-md text-primary mb-2">Import Students</h1>
        <p className="text-body-lg text-secondary">Upload a CSV file to add or update student records in bulk.</p>
      </div>

      <ProgressSteps />

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-danger-bg border border-danger-border flex items-center gap-3 text-danger-fg animate-in shake duration-300">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div 
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-accent-glow', 'bg-accent-glow/5'); }}
          onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-accent-glow', 'bg-accent-glow/5'); }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-accent-glow', 'bg-accent-glow/5');
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile && droppedFile.type === 'text/csv') processFile(droppedFile);
          }}
          className="card border-2 border-dashed border-subtle hover:border-accent-glow hover:bg-accent-glow/5 cursor-pointer transition-all flex flex-col items-center justify-center py-20 px-10 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-surface-raised flex items-center justify-center text-tertiary mb-6 group-hover:scale-110 group-hover:text-accent-glow transition-all">
            <Upload size={32} />
          </div>
          <h2 className="text-display-xs text-primary mb-2">Click or drag CSV file</h2>
          <p className="text-body text-tertiary text-center max-w-sm">
            Standard student list CSV with headers for Name, USN, Email, etc.
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />
        </div>
      )}

      {/* STEP 2: MAPPING */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-glow/10 flex items-center justify-center text-accent-glow">
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <h3 className="text-h3 text-primary">Column Mapping</h3>
                  <p className="text-sm text-tertiary mt-0.5">Link your CSV columns to our database fields.</p>
                </div>
              </div>
              <button 
                onClick={handleAiAutoMap}
                disabled={isAiMapping}
                className="btn-secondary border-accent-glow/30 hover:border-accent-glow/50 text-accent-glow"
              >
                {isAiMapping ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                {isAiMapping ? 'AI Mapping...' : 'Auto-Map with AI'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {TARGET_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-label text-secondary uppercase tracking-wider flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-danger-fg text-xs">*</span>}
                    </label>
                    {mapping[field.key] && (
                      <span className="text-[10px] font-bold text-success-fg flex items-center gap-1">
                        <CheckCircle size={10} /> MAPPED
                      </span>
                    )}
                  </div>
                  <select 
                    value={mapping[field.key] || ''}
                    onChange={(e) => handleMapChange(field.key, e.target.value)}
                    className="input w-full appearance-none cursor-pointer"
                  >
                    <option value="">-- Select CSV Column --</option>
                    {csvHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-subtle flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">
                <ChevronLeft size={18} />
                Back
              </button>
              <button onClick={proceedToPreview} className="btn-primary">
                Preview Data
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="card p-0 overflow-hidden">
            <div className="p-8 border-b border-subtle flex items-center justify-between bg-surface-raised/30">
              <div>
                <h3 className="text-h3 text-primary">Data Preview</h3>
                <p className="text-sm text-tertiary mt-0.5">Showing {Math.min(csvData.length, 5)} of {csvData.length} records to be imported.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold">IMPORTING TO</p>
                  <p className="text-sm text-accent-glow font-medium">Students Table</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent-glow/10 flex items-center justify-center text-accent-glow">
                  <Database size={20} />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-inset">
                    {TARGET_FIELDS.filter(f => mapping[f.key]).map(f => (
                      <th key={f.key} className="px-6 py-4 text-label text-tertiary uppercase tracking-wider border-b border-subtle">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {csvData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      {TARGET_FIELDS.filter(f => mapping[f.key]).map(f => (
                        <td key={f.key} className="px-6 py-4 text-sm text-secondary font-medium whitespace-nowrap">
                          {row[mapping[f.key]]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-surface-raised/20 border-t border-subtle flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">
                <ChevronLeft size={18} />
                Edit Mapping
              </button>
              <button 
                onClick={handleImport} 
                disabled={isImporting}
                className="btn-primary min-w-[160px]"
              >
                {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {isImporting ? 'Importing...' : `Confirm Import (${csvData.length} Rows)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS */}
      {step === 4 && (
        <div className="card flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full bg-success-bg flex items-center justify-center text-success-fg mb-8 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-display-sm text-primary mb-4 text-center">Import Successful!</h2>
          <div className="flex gap-8 mb-10">
            <div className="text-center">
              <div className="text-display-xs text-white tabular-nums">{importResult?.count}</div>
              <div className="text-label text-tertiary uppercase">Processed</div>
            </div>
            <div className="w-px h-12 bg-subtle" />
            <div className="text-center">
              <div className="text-display-xs text-white tabular-nums">{importResult?.total}</div>
              <div className="text-label text-tertiary uppercase">Total Rows</div>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setStep(1)} className="btn-secondary">
              Upload Another
            </button>
            <button onClick={() => window.location.href = '/dashboard'} className="btn-primary">
              Go to Dashboard
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
