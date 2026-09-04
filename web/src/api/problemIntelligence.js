/**
 * Staff Problem Intelligence API.
 *
 * Primary endpoint: GET /staff/problems/:id/intelligence
 * Fallback: GET /staff/problems/:id
 *
 * The fallback keeps the page useful against the currently verified backend
 * while the optional Hugging Face intelligence endpoint is being wired in.
 */
export async function getProblemIntelligence(api, problemId) {
  if (!problemId) throw new Error('Problem id is required.');

  // The verified backend currently exposes /staff/problems/:id, while the
  // optional Hugging Face intelligence endpoint is not deployed yet. Avoid
  // intentionally generating a 404 in the browser console. Once the backend
  // route is deployed, set VITE_ENABLE_AI_INTELLIGENCE=true.
  if (import.meta.env.VITE_ENABLE_AI_INTELLIGENCE === 'true') {
    try {
      const intelligence = await api(`/staff/problems/${encodeURIComponent(problemId)}/intelligence`);
      return { ...intelligence, __source: 'intelligence' };
    } catch (error) {
      const detail = await api(`/staff/problems/${encodeURIComponent(problemId)}`);
      return { ...detail, __source: 'problem-detail', __intelligenceError: error?.message || '' };
    }
  }

  const detail = await api(`/staff/problems/${encodeURIComponent(problemId)}`);
  return { ...detail, __source: 'problem-detail' };
}

export function intelligenceAttachmentUrl(attachment) {
  return attachment?.download_path || attachment?.url || null;
}
