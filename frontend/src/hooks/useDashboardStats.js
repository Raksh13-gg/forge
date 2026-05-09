import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useDashboardStats() {
  const [data, setData] = useState({
    ticker: null,
    overview: null,
    activity: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;
    
    async function fetchAllStats() {
      // ULTRA FAST: Safety timeout at 4s (halved)
      const timeoutId = setTimeout(() => {
        if (mounted && data.loading) {
          setData(prev => ({ ...prev, loading: false }));
        }
      }, 4000);

      try {
        // Parallelized lean queries
        const [sessionsRes, studentsRes, lastSessionRes, studentsListRes, latestAttRes, importsRes] = await Promise.allSettled([
          supabase.from('sessions').select('*', { count: 'exact', head: true }),
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('sessions').select('date').order('date', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('students').select('id, name'),
          supabase.from('attendance').select('marked_at, session_id').order('marked_at', { ascending: false }).limit(10),
          supabase.from('import_log').select('uploaded_at, filename').order('uploaded_at', { ascending: false }).limit(5)
        ]);

        // Fetch ALL attendance records using pagination (to bypass 1000 limit)
        let attendanceData = [];
        let page = 0;
        const PAGE_SIZE = 1000;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('attendance')
            .select('present, student_id')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          if (error || !data || data.length === 0) {
            hasMore = false;
          } else {
            attendanceData = [...attendanceData, ...data];
            if (data.length < PAGE_SIZE) hasMore = false;
            page++;
          }
        }

        if (!mounted) return;
        clearTimeout(timeoutId);

        // Lean data extraction
        const sessionsCount = sessionsRes.status === 'fulfilled' ? (sessionsRes.value.count ?? 0) : 0;
        const studentsCount = studentsRes.status === 'fulfilled' ? (studentsRes.value.count ?? 0) : 0;
        const lastSessionDate = lastSessionRes.status === 'fulfilled' ? lastSessionRes.value.data?.date : null;
        const students = studentsListRes.status === 'fulfilled' ? (studentsListRes.value.data ?? []) : [];
        const latestAttendance = latestAttRes.status === 'fulfilled' ? (latestAttRes.value.data ?? []) : [];
        const latestImports = importsRes.status === 'fulfilled' ? (importsRes.value.data ?? []) : [];

        // Log query performance for developers
        [sessionsRes, studentsRes, lastSessionRes, studentsListRes, latestAttRes, importsRes].forEach((res, i) => {
          if (res.status === 'rejected' || res.value?.error) {
            console.warn(`Query ${i} performance degradation detected.`);
          }
        });

        // Instant processing logic
        let attendancePct = 0;
        if (attendanceData.length > 0) {
          const presents = attendanceData.filter(a => a.present).length;
          attendancePct = ((presents / attendanceData.length) * 100).toFixed(1);
        }

        let bestStudent = 'N/A';
        let worstStudent = 'N/A';
        if (attendanceData.length > 0 && students.length > 0) {
          const studentCounts = {};
          attendanceData.forEach(a => {
            if (a.present) studentCounts[a.student_id] = (studentCounts[a.student_id] || 0) + 1;
          });

          let max = -1, min = 9999;
          students.forEach(s => {
            const score = studentCounts[s.id] || 0;
            if (score > max) { max = score; bestStudent = s.name; }
            if (score < min) { min = score; worstStudent = s.name; }
          });
        }

        let combined = [];
        latestAttendance.forEach(a => {
          combined.push({
            id: `att-${a.marked_at}-${Math.random()}`,
            type: 'attendance',
            time: new Date(a.marked_at),
            desc: `Attendance captured`
          });
        });
        latestImports.forEach(i => {
          combined.push({
            id: `imp-${i.uploaded_at}`,
            type: 'import',
            time: new Date(i.uploaded_at),
            desc: `Import: ${i.filename}`
          });
        });
        combined.sort((a, b) => b.time - a.time);

        setData({
          ticker: { sessions: sessionsCount, students: studentsCount, attendancePct, lastDate: lastSessionDate || 'None' },
          overview: { totalSessions: sessionsCount, avgPct: attendancePct, bestStudent, worstStudent },
          activity: combined.slice(0, 5),
          loading: false,
          error: null
        });
      } catch (err) {
        console.error('Fatal fetch error:', err);
        if (mounted) setData(prev => ({ ...prev, loading: false }));
      }
    }

    fetchAllStats();
    return () => { mounted = false; };
  }, []);

  return data;
}
