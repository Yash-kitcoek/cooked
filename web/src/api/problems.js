// Student problem discovery uses the dedicated student-safe /problems API.
// /complaints remains intentionally scoped to the authenticated student.
export async function listStudentProblems(api, params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      search.set(key, value);
    }
  }
  const suffix = search.toString() ? `?${search.toString()}` : '';
  const data = await api(`/problems${suffix}`);
  return Array.isArray(data) ? data : data?.items || data?.results || [];
}

export async function getStudentProblem(api, problemId) {
  return api(`/problems/${encodeURIComponent(problemId)}`);
}

export async function reportStudentProblem(api, problemId) {
  return api(`/problems/${encodeURIComponent(problemId)}/report`, { method: 'POST' });
}

export async function suggestSimilarProblems(api, { title, description, department, limit = 5 }) {
  const search = new URLSearchParams({ title, description: description || '', limit: String(limit) });
  if (department) search.set('department', department);
  const data = await api(`/problems/similar?${search.toString()}`);
  return Array.isArray(data) ? data : data?.items || data?.results || [];
}

// Kept for backwards compatibility with older components.
export function groupStudentComplaints(complaints = []) {
  const groups = new Map();
  for (const complaint of complaints) {
    const key = complaint.problem_group_id || complaint.problem_id || `complaint:${complaint.id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: complaint.problem_group_id || complaint.problem_id || complaint.id,
        problem_code: complaint.problem_code,
        title: complaint.problem_title || complaint.title || 'Problem group',
        description: complaint.problem_description || complaint.description || '',
        department: complaint.department,
        priority: complaint.priority,
        status: complaint.status,
        complaint_count: 0,
        complaints: [],
      });
    }
    const group = groups.get(key);
    group.complaint_count += 1;
    group.complaints.push(complaint);
  }
  return [...groups.values()];
}
