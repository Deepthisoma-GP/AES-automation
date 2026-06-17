// Thin fetch wrapper around the FastAPI backend (proxied at /api by Vite).

async function request(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // dashboard
  dashboard: () => request("/dashboard"),

  // frameworks
  frameworks: () => request("/frameworks"),
  framework: (id) => request(`/frameworks/${id}`),
  createFramework: (framework) =>
    request("/frameworks", { method: "POST", body: JSON.stringify({ framework }) }),
  updateFramework: (id, framework) =>
    request(`/frameworks/${id}`, { method: "PUT", body: JSON.stringify({ framework }) }),
  frameworkAction: (id, action) =>
    request(`/frameworks/${id}/action`, { method: "POST", body: JSON.stringify({ action }) }),
  template: (id) => request(`/frameworks/${id}/template`),
  sampleData: (id) => request(`/frameworks/${id}/sample-data`),
  validate: (id, rows) =>
    request(`/frameworks/${id}/validate`, { method: "POST", body: JSON.stringify({ rows }) }),
  run: (id, rows) =>
    request(`/frameworks/${id}/run`, { method: "POST", body: JSON.stringify({ rows }) }),
  insights: (id) => request(`/frameworks/${id}/insights`),

  // data sources & discovery
  dataSources: () => request("/data-sources"),
  addDataSource: (ds) => request("/data-sources", { method: "POST", body: JSON.stringify(ds) }),
  discoveries: () => request("/discoveries"),
  runDiscovery: (payload) =>
    request("/discoveries/run", { method: "POST", body: JSON.stringify(payload) }),
  acceptDiscovery: (id, payload) =>
    request(`/discoveries/${id}/accept`, { method: "POST", body: JSON.stringify(payload) }),

  // runs
  runs: () => request("/runs"),
  runResult: (id) => request(`/runs/${id}`),
  latestRun: (fid) => request(`/runs/latest/${fid}`),

  // admin
  reset: () => request("/admin/reset", { method: "POST" }),
};
