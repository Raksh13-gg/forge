import { useState, useRef, useEffect } from 'react';
import * as xlsx from 'xlsx';
import { 
  Upload, FileText, CheckCircle, AlertCircle, ArrowRight, BrainCircuit,
  Database, Table as TableIcon, ChevronRight, ChevronLeft, Loader2, Calendar, Users, X, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { inferSheetSchema, inferMissingDates } from '../lib/aiAttendanceParser';
import { useAuth } from '../contexts/AuthContext';

export default function BulkAttendance() {
  const { profile, user } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  
  // Step 1 state
  const fileInputRef = useRef(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  
  // Step 2 state
  const [selectedSheets, setSelectedSheets] = useState([]);
  
  // Step 3 state
  const [isInferring, setIsInferring] = useState(false);
  const [schema, setSchema] = useState(null);
  const [userContext, setUserContext] = useState('');
  const [parsedData, setParsedData] = useState([]);
  
  // Step 4 state
  const [conflicts, setConflicts] = useState([]);
  const [resolution, setResolution] = useState({}); // date -> 'overwrite' | 'skip'
  
  // Step 5 state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [allHeaders, setAllHeaders] = useState([]);
  const [allColDates, setAllColDates] = useState({}); // header -> YYYY-MM-DD
  const [manualUsnColumn, setManualUsnColumn] = useState('');
  const [manualNameColumn, setManualNameColumn] = useState('');
  const [manualDateColumns, setManualDateColumns] = useState([]);
  const [studentMap, setStudentMap] = useState({}); // USN -> ID
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [autoFillConfig, setAutoFillConfig] = useState({ startDate: '', activeDays: [] });

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Convert Excel serial number or ambiguous date string to YYYY-MM-DD
  const parseExcelHeaderDate = (raw) => {
    if (!raw && raw !== 0) return null;
    // Excel serial number (e.g. 46238)
    if (typeof raw === 'number' && raw > 40000 && raw < 60000) {
      const d = new Date(Math.round((raw - 25569) * 86400 * 1000));
      return d.toISOString().split('T')[0];
    }
    const s = raw.toString().trim();
    // Try formats: DD/MM/YY, DD/MM/YYYY, DD-MM-YY, DD-MM-YYYY, YYYY-MM-DD
    const patterns = [
      { re: /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2})$/, fn: (m) => `20${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` },
      { re: /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/, fn: (m) => `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` },
      { re: /^(\d{4})-(\d{2})-(\d{2})$/, fn: (m) => `${m[1]}-${m[2]}-${m[3]}` },
    ];
    for (const { re, fn } of patterns) {
      const m = s.match(re);
      if (m) {
        try { const d = new Date(fn(m)); if (!isNaN(d)) return d.toISOString().split('T')[0]; } catch {}
      }
    }
    return null;
  };

  // Apply auto-fill when config or columns change
  useEffect(() => {
    if (!autoFillConfig.startDate || autoFillConfig.activeDays.length === 0 || manualDateColumns.length === 0) return;
    
    const updated = [...manualDateColumns];
    let current = new Date(autoFillConfig.startDate);
    
    updated.forEach((col, idx) => {
      // Find the next valid day according to activeDays
      while (!autoFillConfig.activeDays.includes(current.getDay().toString())) {
        current.setDate(current.getDate() + 1);
      }
      col.date = current.toISOString().split('T')[0];
      // Increment for the next column
      current.setDate(current.getDate() + 1);
    });
    
    setManualDateColumns(updated);
  }, [autoFillConfig.startDate, autoFillConfig.activeDays.join(',')]);

  // Fetch students for mapping when USN column is selected
  useEffect(() => {
    if (!manualUsnColumn || parsedData.length === 0) return;
    
    async function syncStudents() {
      const usns = Array.from(new Set(parsedData.map(row => 
        (row[manualUsnColumn] || '').toString().trim().toUpperCase()
      ).filter(Boolean)));

      if (usns.length === 0) return;

      const { data } = await supabase
        .from('students')
        .select('id, usn')
        .in('usn', usns);
      
      const map = {};
      data?.forEach(s => map[s.usn.toUpperCase()] = s.id);
      setStudentMap(map);
    }
    
    syncStudents();
  }, [manualUsnColumn, parsedData]);

  // Helper to format date reliably for Supabase
  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const wb = xlsx.read(buffer, { type: 'array' });
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      setStep(2);
    } catch (err) {
      setError('Failed to parse file. Make sure it is a valid .csv or .xlsx');
    }
  };

  // Smart sheet parser — keeps original header names, detects date columns separately
  const parseSheetSmart = (sheet) => {
    const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // Find the header row
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
      const rowLower = rawRows[i].map(c => (c || '').toString().toLowerCase());
      const isHeader = rowLower.some(c =>
        c === 'usn' || c.includes('usn') ||
        c === 'name' ||
        c === 'attendance' ||
        c.includes('email') ||
        c === 'sl no' || c === 'roll'
      );
      if (isHeader) { headerRowIdx = i; break; }
    }

    const dayRow = headerRowIdx > 0 ? rawRows[headerRowIdx - 1] : [];
    const nameCounts = {};
    const colDates = {}; // header string -> YYYY-MM-DD
    const NON_DATE_COLS = ['name','email','usn','sl no','sl. no.','sno','branch_code','admission_number','n8n invite links','joined the batch','pre assessment score(20)','post assessment score(100)'];

    const headers = rawRows[headerRowIdx].map((h, idx) => {
      // Convert Excel serial number to YYYY-MM-DD string right away
      let base;
      if (typeof h === 'number' && h > 40000 && h < 60000) {
        base = new Date(Math.round((h - 25569) * 86400 * 1000)).toISOString().split('T')[0];
      } else {
        base = (h || '').toString().trim();
      }

      if (!base || base === '0') base = `Column ${idx + 1}`;

      // Track if this header is a date (n8n sheet style)
      const parsedDate = parseExcelHeaderDate(h);
      if (parsedDate && !NON_DATE_COLS.includes(base.toLowerCase())) {
        // Use YYYY-MM-DD as the canonical header for date columns
        const uniqueKey = colDates[parsedDate] !== undefined ? `${parsedDate}_${idx}` : parsedDate;
        colDates[uniqueKey] = parsedDate;
        return uniqueKey;
      }

      // Deduplicate non-date headers (e.g. repeated "Attendance" columns)
      if (nameCounts[base] === undefined) {
        nameCounts[base] = 0;
        return base;
      } else {
        nameCounts[base]++;
        const dayLabel = dayRow[idx] ? ` (${dayRow[idx]})` : ` (${nameCounts[base] + 1})`;
        return `${base}${dayLabel}`;
      }
    });

    const data = [];
    for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (row.every(c => c === '' || c === null || c === undefined)) continue;
      const obj = {};
      headers.forEach((h, idx) => { if (h) obj[h] = row[idx] !== undefined ? row[idx] : ''; });
      if (Object.values(obj).some(v => v !== '')) data.push(obj);
    }

    return { headers: headers.filter(Boolean), data, colDates };
  };

  const proceedToAI = async () => {
    if (selectedSheets.length === 0) {
      setError('Please select at least one sheet.');
      return;
    }
    setError(null);
    setStep(3);
    setIsInferring(true);
    setManualMode(false);

    let combinedData = [];
    let combinedHeaders = new Set();
    let combinedColDates = {};
    for (const s of selectedSheets) {
      const { headers, data, colDates } = parseSheetSmart(workbook.Sheets[s]);
      headers.forEach(h => combinedHeaders.add(h));
      combinedData = combinedData.concat(data);
      Object.assign(combinedColDates, colDates);
    }
    setParsedData(combinedData);
    const headers = Array.from(combinedHeaders);
    setAllHeaders(headers);
    setAllColDates(combinedColDates);

    try {
      const inferred = await inferSheetSchema(headers, combinedData.slice(0, 5));
      // Merge pre-parsed dates from colDates into the AI schema
      if (inferred?.dateColumns) {
        inferred.dateColumns = inferred.dateColumns.map(col => {
          if (combinedColDates[col.header]) {
            return { ...col, date: combinedColDates[col.header], needsInference: false };
          }
          return col;
        });
        // Also add any colDates columns that AI may have missed
        const aiHeaders = new Set(inferred.dateColumns.map(c => c.header));
        Object.entries(combinedColDates).forEach(([h, date]) => {
          if (!aiHeaders.has(h)) {
            inferred.dateColumns.push({ header: h, date, needsInference: false });
          }
        });
      }
      setSchema(inferred);
    } catch (err) {
      // AI failed — auto-populate manual mode from what we already parsed
      console.warn('AI failed, switching to manual mode:', err.message);
      setManualMode(true);
      setError(null);
      setSchema(null);
      // Auto-detect USN and name columns from header names
      const usnCol = headers.find(h => h.toLowerCase() === 'usn') || '';
      const nameCol = headers.find(h => h.toLowerCase() === 'name') || '';
      setManualUsnColumn(usnCol);
      setManualNameColumn(nameCol);

      // Auto-populate all date columns that were already parsed
      const autoDateCols = Object.entries(combinedColDates)
        .map(([header, date]) => ({ header, date, needsInference: false }))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (autoDateCols.length > 0) {
        setManualDateColumns(autoDateCols);
      }

      // If we successfully detected USN + at least some dates, skip manual UI entirely
      if (usnCol && autoDateCols.length > 0) {
        const autoSchema = {
          usnColumn: usnCol,
          nameColumn: nameCol || null,
          dateColumns: autoDateCols
        };
        setSchema(autoSchema);
        setManualMode(false); // bypass manual UI, go straight to schema review
      } else {
        setManualMode(true); // only show manual UI if we couldn't detect anything
      }
    } finally {
      setIsInferring(false);
    }
  };

  const resolveMissingDates = async () => {
    if (!userContext.trim()) {
      setError('Please provide some context about the class schedule.');
      return;
    }
    setIsInferring(true);
    setError(null);
    try {
      const updatedSchema = await inferMissingDates(schema, userContext);
      setSchema(updatedSchema);
    } catch (err) {
      // AI failed for date inference — switch to manual date entry
      console.warn('AI date inference failed, switching to manual date entry:', err.message);
      setManualMode(true);
      setError(null);
    } finally {
      setIsInferring(false);
    }
  };

  // Build schema from manual inputs and proceed
  const proceedFromManual = () => {
    if (!manualUsnColumn) {
      setError('Please select the Student ID (USN) column.');
      return;
    }
    if (manualDateColumns.length === 0) {
      setError('Please add at least one attendance column.');
      return;
    }
    const invalidCols = manualDateColumns.filter(c => !c.date);
    if (invalidCols.length > 0) {
      setError(`Please provide dates for all attendance columns: ${invalidCols.map(c=>c.header).join(', ')}`);
      return;
    }
    setSchema({
      usnColumn: manualUsnColumn,
      nameColumn: manualNameColumn || null,
      dateColumns: manualDateColumns.map(c => ({ ...c, needsInference: false }))
    });
    setManualMode(false);
    setError(null);
  };

  const addManualDateColumn = (header) => {
    if (!header || manualDateColumns.find(c => c.header === header)) return;
    setManualDateColumns(prev => [...prev, { header, date: '' }]);
  };

  const updateManualDate = (header, date) => {
    setManualDateColumns(prev => prev.map(c => c.header === header ? { ...c, date } : c));
  };

  const removeManualDateColumn = (header) => {
    setManualDateColumns(prev => prev.filter(c => c.header !== header));
  };

  const proceedToConflicts = async () => {
    if (schema.dateColumns.some(d => d.needsInference || !d.date)) {
      setError("Please resolve missing dates before continuing.");
      return;
    }
    
    setStep(4);
    setError(null);
    try {
      // Find all unique dates to be imported
      const datesToImport = [...new Set(schema.dateColumns.map(d => formatDate(d.date)))];
      
      // Query Supabase for existing sessions on these dates
      const { data: existingSessions, error: err } = await supabase
        .from('sessions')
        .select('date')
        .in('date', datesToImport);
        
      if (err) throw err;
      
      const existingDates = existingSessions.map(s => s.date);
      setConflicts(existingDates);
      
      // Default to skip
      const initialResolution = {};
      existingDates.forEach(d => initialResolution[d] = 'skip');
      setResolution(initialResolution);
      
    } catch (err) {
      setError("Failed to check for duplicate sessions: " + err.message);
    }
  };

  // Smart name extractor: uses schema.nameColumn, then scans headers for name-like columns
  const extractName = (row, allRowHeaders) => {
    if (schema?.nameColumn && row[schema.nameColumn] !== undefined)
      return row[schema.nameColumn].toString().trim();
    // Fallback: scan for column whose name suggests it's a name field
    const nameLike = allRowHeaders.find(h => {
        const l = h.toLowerCase();
        return l === 'name' || l === 'student name' || l === 'full name' || l === 'student';
      });
      if (nameLike && row[nameLike]) return row[nameLike].toString().trim();
      return null;
    };

    const handleImport = async () => {
      setIsImporting(true);
      setError(null);
      try {
        const markedBy = profile?.display_name || user?.user_metadata?.display_name || user?.email || 'system';
        const rowHeaders = allHeaders;

        // 1. Build candidate student list from CSV
        const usnSet = new Set();
        const candidateStudents = [];
        
        parsedData.forEach(row => {
          const usn = row[schema.usnColumn]?.toString().trim();
          if (!usn || usnSet.has(usn.toUpperCase())) return;
          
          const name = schema.nameColumn ? row[schema.nameColumn]?.toString().trim() : '';
          const branch = (row['branch_code'] || row['Branch'] || 'CI').toString().trim();
          const admNo = (row['admission_number'] || row['Admission Number'] || '').toString().trim();
          
          usnSet.add(usn.toUpperCase());
          candidateStudents.push({ 
            usn: usn.toUpperCase(), 
            name: name || usn, 
            branch_code: branch, 
            batch: 'Main',
            ...(admNo ? { admission_number: admNo } : {}) 
          });
        });

        if (candidateStudents.length === 0) throw new Error('No valid USNs found in the spreadsheet.');

        // 2. Upsert all students to ensure they exist
        console.log(`Syncing ${candidateStudents.length} students...`);
        const { error: upsertErr } = await supabase
          .from('students')
          .upsert(candidateStudents, { onConflict: 'usn' });

        if (upsertErr) {
          console.warn('Bulk upsert failed, attempting individual sync:', upsertErr.message);
          // Fallback: Try individual inserts for students who don't exist
          for (const stu of candidateStudents) {
            const { error: insErr } = await supabase.from('students').upsert(stu, { onConflict: 'usn' });
            if (insErr) console.warn(`Failed to sync student ${stu.usn}:`, insErr.message);
          }
        }

        // 3. Build USN->ID map by fetching all students
        const { data: allStudents, error: fetchError } = await supabase
          .from('students')
          .select('id, usn');
        
        if (fetchError) throw new Error('Failed to fetch student mapping: ' + fetchError.message);

        const studentIdMap = {};
        allStudents.forEach(s => { studentIdMap[s.usn.toUpperCase()] = s.id; });
        console.log(`Mapped ${Object.keys(studentIdMap).length} students for attendance linking.`);

        const skippedUsns = [];
        
        // 4. Process Sessions & Attendance
        const datesToImport = schema.dateColumns.filter(d => {
          const fd = formatDate(d.date);
          if (!conflicts.includes(fd)) return true;
          return resolution[fd] === 'overwrite';
        });

        let totalRecords = 0;

        for (const col of datesToImport) {
          const formattedDate = formatDate(col.date);
          const month = new Date(formattedDate).getMonth() + 1;

          const { data: sessionData, error: sessErr } = await supabase
            .from('sessions')
            .upsert({ 
              date: formattedDate, 
              topic: `Session on ${formattedDate}`, 
              month_number: month, 
              duration_hours: 2, 
              session_type: 'offline' 
            }, { onConflict: 'date' })
            .select('id')
            .single();
          
          if (sessErr) throw sessErr;

          const attendancePayload = [];
          parsedData.forEach(row => {
            const usn = row[schema.usnColumn]?.toString().trim().toUpperCase();
            const studentId = studentIdMap[usn];
            
            if (!studentId) {
              if (usn && !skippedUsns.includes(usn)) skippedUsns.push(usn);
              return;
            }

            const val = (row[col.header] ?? '').toString().trim();
            const absentMarkers = ['0', 'false', 'absent', 'a', 'no', '.', '-', ''];
            const isPresent = !absentMarkers.includes(val.toLowerCase());
            
            attendancePayload.push({ 
              student_id: studentId, 
              session_id: sessionData.id, 
              present: isPresent, 
              marked_by: markedBy 
            });
          });

          if (attendancePayload.length > 0) {
            const { error: attErr } = await supabase
              .from('attendance')
              .upsert(attendancePayload, { onConflict: 'student_id,session_id' });
            if (attErr) throw attErr;
            totalRecords += attendancePayload.length;
          }
        }

        setImportResult({ 
          sessions: datesToImport.length, 
          records: totalRecords, 
          skipped: skippedUsns 
        });
        setStep(5);
      } catch (err) {
        console.error('Import process error:', err);
        setError('Import failed: ' + err.message + (err.details ? ' (' + err.details + ')' : ''));
      } finally {
        setIsImporting(false);
      }
    };

  const ProgressSteps = () => (
    <div className="flex items-center gap-4 mb-10">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            step === s ? 'bg-accent-glow text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 
            step > s ? 'bg-success-fg text-white' : 'bg-surface-raised text-tertiary border border-subtle'
          }`}>
            {step > s ? <CheckCircle size={16} /> : s}
          </div>
          {s < 4 && <div className={`w-12 h-px ${step > s ? 'bg-success-fg' : 'bg-subtle'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 px-6">
      <div className="mb-10 mt-6">
        <div className="flex items-center gap-3 mb-2">
          <BrainCircuit size={32} className="text-accent-glow" />
          <h1 className="text-display-md text-primary">AI Bulk Attendance</h1>
        </div>
        <p className="text-body-lg text-secondary">Upload Excel/CSV files and let AI map your data automatically.</p>
      </div>

      <ProgressSteps />

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-danger-bg border border-danger-border flex items-center gap-3 text-danger-fg animate-in shake duration-300">
          <AlertCircle size={20} className="shrink-0" />
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
            if (droppedFile) handleFileUpload({ target: { files: [droppedFile] } });
          }}
          className="card border-2 border-dashed border-subtle hover:border-accent-glow hover:bg-accent-glow/5 cursor-pointer transition-all flex flex-col items-center justify-center py-20 px-10 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-surface-raised flex items-center justify-center text-tertiary mb-6 group-hover:scale-110 group-hover:text-accent-glow transition-all shadow-sm">
            <Upload size={32} />
          </div>
          <h2 className="text-display-xs text-primary mb-2">Click or drag Excel/CSV</h2>
          <p className="text-body text-tertiary text-center max-w-sm">
            Supported formats: .xlsx, .xls, .csv
          </p>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, .xlsx, .xls" className="hidden" />
        </div>
      )}

      {/* STEP 2: SHEET SELECTION */}
      {step === 2 && (
        <div className="card p-8">
          <h3 className="text-xl font-bold text-primary mb-6">Select Sheets to Import</h3>
          <div className="space-y-3 mb-8">
            {sheetNames.map(name => (
              <label key={name} className="flex items-center gap-3 p-4 border border-subtle rounded-xl cursor-pointer hover:bg-surface-inset/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedSheets.includes(name)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedSheets([...selectedSheets, name]);
                    else setSelectedSheets(selectedSheets.filter(n => n !== name));
                  }}
                  className="w-5 h-5 rounded border-subtle text-accent-glow focus:ring-accent-glow"
                />
                <TableIcon size={18} className="text-tertiary" />
                <span className="text-sm font-medium text-secondary">{name}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between">
             <button onClick={() => setStep(1)} className="btn-secondary"><ChevronLeft size={18}/> Back</button>
             <button onClick={proceedToAI} disabled={isInferring} className="btn-primary">
                {isInferring ? <Loader2 size={18} className="animate-spin" /> : <>Next <ChevronRight size={18}/></>}
             </button>
          </div>
        </div>
      )}

      {/* STEP 3: MANUAL FALLBACK MODE */}
      {step === 3 && manualMode && (
        <div className="card p-8 space-y-6">
          <div className="flex items-center gap-4 border-b border-subtle pb-6">
            <div className="w-12 h-12 rounded-2xl bg-surface-raised flex items-center justify-center border border-subtle">
              <TableIcon size={24} className="text-accent-glow" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary">Column Mapping</h3>
              <p className="text-sm text-tertiary">Select the correct columns from your spreadsheet to import data.</p>
            </div>
          </div>

          {/* USN, Name, Attendance Column Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-tertiary uppercase tracking-widest">Student ID / USN Column</label>
              <select
                value={manualUsnColumn}
                onChange={e => setManualUsnColumn(e.target.value)}
                className="input w-full"
              >
                <option value="">-- Select USN Column --</option>
                {allHeaders.map(h => {
                  const parsed = parseExcelHeaderDate(h);
                  const display = parsed ? `${h} (${parsed})` : h;
                  return <option key={h} value={h}>{display}</option>;
                })}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-tertiary uppercase tracking-widest">Student Name Column <span className="text-tertiary/50">(optional)</span></label>
              <select
                value={manualNameColumn}
                onChange={e => setManualNameColumn(e.target.value)}
                className="input w-full"
              >
                <option value="">-- Select Name Column --</option>
                {allHeaders.filter(h => h !== manualUsnColumn).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-tertiary uppercase tracking-widest">Attendance Columns</label>
              <select
                onChange={e => { addManualDateColumn(e.target.value); e.target.value = ''; }}
                className="input w-full"
                defaultValue=""
              >
                <option value="">-- Add Attendance Column --</option>
                {allHeaders.filter(h => !manualDateColumns.find(c => c.header === h) && h !== manualUsnColumn && h !== manualNameColumn).map(h => {
                  const parsed = parseExcelHeaderDate(h);
                  const display = parsed ? `${parsed} (${h})` : h;
                  return <option key={h} value={h}>{display}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Batch Date Auto-Fill */}
          <div className="p-6 bg-accent-glow/5 border border-accent-glow/20 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-accent-glow">
              <Zap size={18} />
              <h4 className="text-sm font-bold uppercase tracking-widest">Batch Date Auto-Fill</h4>
            </div>
            <p className="text-xs text-tertiary">Select a start date and the days of the week your classes occur. We will automatically assign dates to your selected columns!</p>
            <div className="flex flex-wrap items-end gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-tertiary uppercase">Start Date</label>
                <input 
                  type="date" 
                  value={autoFillConfig.startDate}
                  onChange={e => setAutoFillConfig({...autoFillConfig, startDate: e.target.value})}
                  className="input text-sm w-40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-tertiary uppercase">Class Days</label>
                <div className="flex gap-1.5">
                  {['1','2','3','4','5','6','0'].map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        const days = autoFillConfig.activeDays.includes(d) 
                          ? autoFillConfig.activeDays.filter(day => day !== d)
                          : [...autoFillConfig.activeDays, d];
                        setAutoFillConfig({...autoFillConfig, activeDays: days});
                      }}
                      className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all border ${autoFillConfig.activeDays.includes(d) ? 'bg-accent-glow text-white border-accent-glow shadow-sm' : 'bg-surface-raised text-tertiary border-subtle'}`}
                    >
                      {['M','T','W','T','F','S','S'][d === '0' ? 6 : Number(d)-1]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {manualDateColumns.length > 0 && (
            <div className="space-y-6">
              <div className="border border-subtle rounded-xl overflow-hidden divide-y divide-subtle">
                {manualDateColumns.map(col => (
                  <div key={col.header} className="px-4 py-3 flex items-center gap-4 bg-surface-raised">
                    <span className="text-sm font-medium text-secondary flex-1 truncate">{col.header}</span>
                    <input
                      type="date"
                      value={col.date}
                      onChange={e => updateManualDate(col.header, e.target.value)}
                      className="input w-44 text-sm"
                    />
                    <button onClick={() => removeManualDateColumn(col.header)} className="text-tertiary hover:text-danger-fg transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Data Preview Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-tertiary uppercase tracking-widest">Live Preview</label>
                    <span className="text-[10px] text-tertiary font-bold uppercase opacity-40 italic">Verifying USN & Data interpretation</span>
                  </div>
                  <button 
                    onClick={() => setShowFullPreview(!showFullPreview)}
                    className="text-[10px] font-bold text-accent-glow uppercase tracking-widest hover:underline"
                  >
                    {showFullPreview ? 'Show Less (5)' : `Show All (${parsedData.length})`}
                  </button>
                </div>
                <div className="border border-subtle rounded-2xl overflow-hidden bg-surface-raised/30 overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-raised border-b border-subtle sticky top-0 z-10">
                        <th className="px-5 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest bg-surface-raised">Student (USN)</th>
                        {manualDateColumns.map(col => {
                           let headerDisplay = col.header;
                           if (!isNaN(Number(col.header)) && Number(col.header) > 40000) {
                             const d = new Date(Math.round((Number(col.header) - 25569) * 86400 * 1000));
                             headerDisplay = d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
                           } else if (col.date) {
                             const d = new Date(col.date);
                             if (!isNaN(d)) headerDisplay = d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
                           }
                           return (
                             <th key={col.header} className="px-5 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest whitespace-nowrap bg-surface-raised">
                               {headerDisplay}
                             </th>
                           );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle/50">
                      {(showFullPreview ? parsedData : parsedData.slice(0, 5)).map((row, i) => {
                        const usn = (row[manualUsnColumn] || '').toString().trim().toUpperCase();
                        const studentId = studentMap[usn];
                        return (
                          <tr key={i} className="hover:bg-surface-raised/50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className={`text-sm font-bold ${studentId ? 'text-primary' : 'text-danger-fg'}`}>
                                  {usn || 'EMPTY'}
                                </span>
                                <span className="text-[10px] text-tertiary font-medium">
                                  {studentId ? 'Found in DB' : 'Not Linked'}
                                </span>
                              </div>
                            </td>
                            {manualDateColumns.map(col => {
                              const rawVal = row[col.header]?.toString().trim() || '';
                              const absentMarkers = ['0', 'FALSE', 'ABSENT', 'A', 'NO', '.', '-', ''];
                              const isPresent = !absentMarkers.includes(rawVal.toUpperCase());
                              return (
                                <td key={col.header} className="px-5 py-4">
                                  <div className="flex flex-col gap-1">
                                    <span className={`pill ${isPresent ? 'bg-success-bg/20 text-success-fg border-success-border/30' : 'bg-danger-bg/20 text-danger-fg border-danger-border/30'} px-2 py-1 text-[10px] font-bold border w-fit`}>
                                      {isPresent ? 'PRESENT' : 'ABSENT'}
                                    </span>
                                    <span className="text-[9px] text-tertiary font-medium italic opacity-60">
                                      Value: "{rawVal || 'EMPTY'}"
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

            <div className="flex justify-between pt-4 border-t border-subtle">
              <button onClick={() => setStep(2)} className="btn-secondary"><ChevronLeft size={18}/> Back</button>
              <button onClick={proceedFromManual} className="btn-primary">Review Conflicts <ChevronRight size={18}/></button>
            </div>
          </div>
        )}

      {/* STEP 3: AI SCHEMA INFERENCE */}
      {step === 3 && schema && !manualMode && (
        <div className="card p-8 space-y-8">
          <div className="flex items-center gap-4 bg-accent-glow/5 border border-accent-glow/20 p-5 rounded-2xl">
            <BrainCircuit size={28} className="text-accent-glow" />
            <div>
              <h3 className="text-lg font-bold text-primary">AI Schema Detection</h3>
              <p className="text-sm text-tertiary">Gemini has analyzed your spreadsheet structure.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-surface-inset rounded-xl border border-subtle flex justify-between items-center">
               <span className="text-sm text-tertiary font-bold tracking-widest uppercase">Student Identifier Column</span>
               <span className="text-sm font-bold text-primary px-3 py-1 bg-surface-raised border border-subtle rounded-lg shadow-sm">{schema.usnColumn || 'NOT FOUND'}</span>
            </div>
            
            <div className="border border-subtle rounded-xl overflow-hidden">
               <div className="px-6 py-4 bg-surface-inset/50 border-b border-subtle flex justify-between items-center">
                  <span className="text-sm text-tertiary font-bold tracking-widest uppercase flex items-center gap-2"><Calendar size={16}/> Attendance Columns</span>
                  <span className="text-xs font-bold text-accent-glow">{schema.dateColumns.length} Found</span>
               </div>
               <div className="divide-y divide-subtle max-h-60 overflow-y-auto custom-scrollbar">
                  {schema.dateColumns.map((col, idx) => (
                    <div key={idx} className="px-6 py-3 flex justify-between items-center bg-surface-raised">
                      <span className="text-sm font-medium text-secondary">{col.header}</span>
                      {col.needsInference || !col.date ? (
                        <span className="text-xs font-bold px-2 py-1 bg-warning-bg text-warning-fg rounded border border-warning-border">Missing Date</span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-1 bg-success-bg text-success-fg rounded border border-success-border">{col.date}</span>
                      )}
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Missing Dates Resolution */}
          {schema.dateColumns.some(d => d.needsInference || !d.date) && (
            <div className="bg-surface-inset/50 p-6 rounded-2xl border border-warning-border/50">
               <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-2"><AlertCircle size={16} className="text-warning-fg"/> Resolve Missing Dates</h4>
               <p className="text-xs text-tertiary mb-4">Some columns don't have explicit dates in their headers. Describe the class schedule (e.g. "Classes started on May 1st and happen every Tuesday and Thursday")</p>
               <textarea 
                  value={userContext}
                  onChange={e => setUserContext(e.target.value)}
                  className="w-full input min-h-[100px] mb-4"
                  placeholder="Enter context here..."
               />
               <button onClick={resolveMissingDates} disabled={isInferring} className="btn-secondary w-full border-accent-glow/50 text-accent-glow hover:bg-accent-glow/10">
                 {isInferring ? <Loader2 size={16} className="animate-spin mx-auto"/> : 'Let AI Infer Dates'}
               </button>
               <button onClick={() => setManualMode(true)} className="btn-secondary w-full mt-2 text-tertiary hover:text-secondary">
                 Enter dates manually instead
               </button>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-subtle">
             <button onClick={() => setStep(2)} className="btn-secondary"><ChevronLeft size={18}/> Back</button>
             <button 
                onClick={proceedToConflicts} 
                disabled={schema.dateColumns.some(d => d.needsInference || !d.date)}
                className="btn-primary"
             >
                Review Conflicts <ChevronRight size={18}/>
             </button>
          </div>
        </div>
      )}

      {/* STEP 4: CONFLICT RESOLUTION */}
      {step === 4 && (
        <div className="card p-8">
           <div className="mb-8">
             <h3 className="text-xl font-bold text-primary mb-2">Duplicate Detection</h3>
             <p className="text-sm text-tertiary">We checked the database for the dates you are importing.</p>
           </div>
           
           {conflicts.length === 0 ? (
             <div className="p-8 text-center bg-success-bg/20 rounded-2xl border border-success-border/50 mb-8">
                <CheckCircle size={32} className="text-success-fg mx-auto mb-3" />
                <h4 className="text-lg font-bold text-success-fg">All Clear!</h4>
                <p className="text-sm text-success-fg/70">No existing sessions conflict with your import.</p>
             </div>
           ) : (
             <div className="space-y-4 mb-8">
               <div className="p-4 bg-warning-bg/20 border border-warning-border/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-warning-fg">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">We found {conflicts.length} dates that already exist. Choose whether to skip them or overwrite the existing records.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const newRes = {};
                        conflicts.forEach(d => newRes[d] = 'skip');
                        setResolution(newRes);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-surface-raised border border-subtle text-xs font-bold text-tertiary hover:text-primary transition-all"
                    >
                      Skip All
                    </button>
                    <button 
                      onClick={() => {
                        const newRes = {};
                        conflicts.forEach(d => newRes[d] = 'overwrite');
                        setResolution(newRes);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-danger-fg text-white text-xs font-bold shadow-sm hover:opacity-90 transition-all"
                    >
                      Overwrite All
                    </button>
                  </div>
                </div>
               
               <div className="border border-subtle rounded-xl overflow-hidden divide-y divide-subtle">
                 {conflicts.map(date => (
                   <div key={date} className="p-4 bg-surface-raised flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Calendar size={18} className="text-secondary"/>
                         <span className="font-bold text-primary">{date}</span>
                      </div>
                      <div className="flex bg-surface-inset border border-subtle rounded-lg p-1">
                         <button 
                           onClick={() => setResolution({...resolution, [date]: 'skip'})}
                           className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${resolution[date] === 'skip' ? 'bg-surface-raised text-primary shadow-sm' : 'text-tertiary hover:text-secondary'}`}
                         >Skip</button>
                         <button 
                           onClick={() => setResolution({...resolution, [date]: 'overwrite'})}
                           className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${resolution[date] === 'overwrite' ? 'bg-danger-fg text-white shadow-sm' : 'text-tertiary hover:text-secondary'}`}
                         >Overwrite</button>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
           )}

          <div className="flex justify-between pt-4 border-t border-subtle">
             <button onClick={() => setStep(3)} className="btn-secondary"><ChevronLeft size={18}/> Back</button>
             <button onClick={handleImport} disabled={isImporting} className="btn-primary px-8">
                {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18}/>}
                {isImporting ? 'Processing...' : 'Run Import'}
             </button>
          </div>
        </div>
      )}

      {/* STEP 5: SUCCESS */}
      {step === 5 && (
        <div className="card flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500 px-8">
          <div className="w-20 h-20 rounded-full bg-success-bg flex items-center justify-center text-success-fg mb-8 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-display-sm text-primary mb-4 text-center">Upload Successful!</h2>
          <div className="flex gap-8 mb-10">
            <div className="text-center">
              <div className="text-display-xs text-primary tabular-nums">{importResult?.sessions}</div>
              <div className="text-label text-tertiary uppercase">Sessions Saved</div>
            </div>
            <div className="w-px h-12 bg-subtle" />
            <div className="text-center">
              <div className="text-display-xs text-primary tabular-nums">{importResult?.records}</div>
              <div className="text-label text-tertiary uppercase">Total Records</div>
            </div>
          </div>

          {importResult?.skipped?.length > 0 && (
            <div className="w-full max-w-lg mb-8 p-5 rounded-2xl bg-warning-bg/20 border border-warning-border/50">
              <div className="flex items-center gap-2 text-warning-fg font-bold text-sm mb-3">
                <AlertCircle size={16} />
                {importResult.skipped.length} USN(s) could not be linked
              </div>
              <p className="text-xs text-tertiary mb-3">These students were in the CSV but could not be created or matched in the database. Their attendance was NOT imported:</p>
              <div className="flex flex-wrap gap-2">
                {importResult.skipped.map(usn => (
                  <span key={usn} className="px-2 py-1 bg-surface-raised border border-subtle rounded text-xs font-mono text-secondary">{usn}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={() => { setStep(1); setWorkbook(null); setSelectedSheets([]); setSchema(null); }} className="btn-secondary">
              Upload Another
            </button>
            <button onClick={() => window.location.href = '/dashboard'} className="btn-primary">
              Go to Dashboard <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
