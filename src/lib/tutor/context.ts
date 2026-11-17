import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { getEntitlements, type PlanId } from '@/lib/membership';
import { accessiblePage } from './policy';

type Db = SupabaseClient<Database>;
export async function currentPlan(sb: Db, userId: string): Promise<PlanId> {
  const { data, error } = await sb.from('subscriptions').select('plan,status,expires_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error('Could not check membership. Please try again.');
  return data?.status === 'active' && (!data.expires_at || new Date(data.expires_at).getTime() > Date.now()) ? data.plan : 'free';
}
export async function reserve(admin: Db, userId: string, id: string, feature: 'tutor' | 'cbt', limit: number | null) {
  const { data, error } = await admin.rpc('reserve_tutor_request', { _id: id, _user_id: userId, _feature: feature, _limit: limit });
  if (error) throw new Error('Could not check your allowance. Please try again.');
  return data;
}
export async function pdfContext(sb: Db, admin: Db, userId: string, plan: PlanId, courseId: string | null, query: string, materialId?: string, focusPage?: number) {
  if (!courseId && !materialId) return { text: '', pages: [] as { page: number; content: string; file: string }[] };
  let q = sb.from('course_materials').select('id,course_id,file_name,storage_path').order('created_at', { ascending: false }).limit(materialId ? 1 : 3);
  if (materialId) q = q.eq('id', materialId); else if (courseId) q = q.eq('course_id', courseId);
  const { data: materials, error } = await q;
  if (error) throw new Error('Could not check course material access.');
  if (materialId && (!materials?.length || (courseId && materials[0]?.course_id !== courseId))) throw new Error('This material is not available for this chat.');
  const today = new Date(Date.now() + 3600000).toISOString().slice(0, 10);
  const ceiling = getEntitlements(plan).pagesPerPdfPerDay;
  const pages: { page: number; content: string; file: string }[] = [];
  for (const material of materials ?? []) {
    const { data: usage, error: usageError } = await sb.from('reading_daily_usage').select('pages_read').eq('user_id', userId).eq('usage_date', today).eq('material_id', material.id).maybeSingle();
    if (usageError) throw new Error('Could not check PDF allowance.');
    const read = usage?.pages_read ?? 0;
    if (!read) { if (materialId) throw new Error('Open and read this PDF first, then ask the tutor.'); continue; }
    if (focusPage && !accessiblePage(focusPage, read, ceiling)) throw new Error('This page is outside your current PDF allowance.');
    let cachedQuery = admin.from('tutor_pdf_pages').select('page_number,content').eq('material_id', material.id).limit(300);
    if (ceiling !== null) cachedQuery = cachedQuery.lte('page_number', Math.min(read, ceiling));
    const { data: cached } = await cachedQuery;
    const terms = query.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
    const rank = (text: string) => terms.reduce((n, t) => n + Number(text.toLowerCase().includes(t)), 0);
    let chosen = [...(cached ?? [])].sort((a, b) => (b.page_number === focusPage ? 1000 : rank(b.content)) - (a.page_number === focusPage ? 1000 : rank(a.content))).slice(0, 8);
    if (!chosen.length || (focusPage && !chosen.some(p => p.page_number === focusPage))) {
      const { data: file, error: downloadError } = await admin.storage.from('course-pdfs').download(material.storage_path);
      if (downloadError || !file) throw new Error('Could not read this PDF. Please try again.');
      if (file.size > 50 * 1024 * 1024) throw new Error('This PDF is too large for tutor extraction.');
      const { getDocumentProxy } = await import('unpdf');
      const doc = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()), { maxImageSize: 1000000, isEvalSupported: false });
      try {
        const maxPage = ceiling === null ? doc.numPages : Math.min(doc.numPages, read, ceiling);
        const start = Math.max(1, (focusPage ?? 1) - 3);
        const extracted = [];
        for (let p = start; p <= Math.min(maxPage, start + 11); p++) {
          const page = await doc.getPage(p);
          const content = (await page.getTextContent()).items.map(item => 'str' in item ? item.str : '').join(' ').slice(0, 18000);
          if (content.trim()) extracted.push({ material_id: material.id, page_number: p, content });
        }
        if (extracted.length) {
          const { error: cacheError } = await admin.from('tutor_pdf_pages').upsert(extracted);
          if (cacheError) throw new Error('Could not index the PDF.');
        }
        chosen = extracted.sort((a,b) => (b.page_number === focusPage ? 1000 : rank(b.content)) - (a.page_number === focusPage ? 1000 : rank(a.content))).slice(0, 8);
      } finally { await doc.destroy(); }
    }
    pages.push(...chosen.map(p => ({ page: p.page_number, content: p.content.slice(0, 6500), file: material.file_name })));
  }
  return { pages: pages.slice(0, 12), text: pages.slice(0, 12).map(p => `SOURCE: ${p.file}, page ${p.page}\n${p.content}`).join('\n\n').slice(0, 50000) || 'No readable, authorized PDF excerpts available. Do not claim an answer is from the PDF. Image-only PDFs require text extraction by the administrator.' };
}
