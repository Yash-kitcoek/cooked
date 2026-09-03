export async function firstSuccessful(api, paths, fallback = null) {
  for (const path of paths) {
    try {
      return await api(path);
    } catch (error) {
      if (error?.message) console.debug(`Admin API fallback: ${path} -> ${error.message}`);
    }
  }
  return fallback;
}

export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export function normalizeDashboard(data, complaints = [], problems = []) {
  const source = data && typeof data === 'object' ? data : {};
  const list = asArray(source);
  const fromList = list.reduce((acc, row) => {
    acc.total += Number(row.total ?? 0);
    acc.open += Number(row.open ?? 0);
    acc.in_progress += Number(row.in_progress ?? row.inProgress ?? 0);
    acc.resolved += Number(row.resolved ?? 0);
    acc.overdue += Number(row.overdue ?? 0);
    return acc;
  }, { total: 0, open: 0, in_progress: 0, resolved: 0, overdue: 0 });

  return {
    total: Number(source.total_complaints ?? source.total ?? fromList.total ?? complaints.length),
    open: Number(source.open_complaints ?? source.open ?? fromList.open ?? complaints.filter(c => String(c.status).toLowerCase() === 'open').length),
    in_progress: Number(source.in_progress ?? source.inProgress ?? fromList.in_progress ?? complaints.filter(c => String(c.status).toLowerCase().replaceAll(' ', '_') === 'in_progress').length),
    resolved: Number(source.resolved_complaints ?? source.resolved ?? fromList.resolved ?? complaints.filter(c => ['resolved', 'closed'].includes(String(c.status).toLowerCase())).length),
    overdue: Number(source.overdue ?? fromList.overdue ?? 0),
    core_problems: Number(source.core_problems ?? source.problem_groups ?? source.total_problems ?? problems.length),
    affected_students: Number(source.affected_students ?? source.affected_users ?? 0),
  };
}

export function problemKey(problem) {
  return problem?.id ?? problem?.problem_id ?? problem?.problem_code;
}

export function complaintKey(complaint) {
  return complaint?.id ?? complaint?.complaint_id;
}

export function groupComplaints(complaints = []) {
  const groups = new Map();
  for (const complaint of complaints) {
    const key = complaint.problem_group_id || complaint.problem_id || `complaint:${complaint.id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: complaint.problem_group_id || complaint.problem_id || complaint.id,
        problem_code: complaint.problem_code,
        title: complaint.problem_title || complaint.title || 'Core problem',
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
