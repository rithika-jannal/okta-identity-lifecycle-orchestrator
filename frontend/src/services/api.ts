import {
  users as initialUsers,
  simulations as initialSimulations,
  drift as initialDrift,
  auditEvents as initialAudit,
} from "./mock-data";
import type {
  AuditEvent,
  DriftItem,
  Simulation,
  SimulationKind,
  User,
  Impact,
} from "./types";
import { apiFetch, ENDPOINTS, API_BASE_URL } from "../lib/api-client";

function lifecycleResult(kind: SimulationKind, user: User, summary: string): Simulation {
  return {
    id: user.id,
    kind,
    subject: user.name,
    subjectEmail: user.email,
    summary,
    risk: "LOW",
    riskScore: user.riskScore,
    requiresApproval: false,
    status: "EXECUTED",
    createdAt: new Date().toISOString(),
    delta: { granted: [], revoked: [], unchanged: user.groups },
    impact: { groups: user.groups.length, apps: user.apps.length, privileged: 0, notes: [] },
  };
}

// In-memory mock store (used as fallback or in standalone demo mode)
let currentUsers: User[] = [...initialUsers];
let currentSimulations: Simulation[] = [...initialSimulations];
let currentDrift: DriftItem[] = [...initialDrift];
let currentAudit: AuditEvent[] = [...initialAudit];

const delay = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeUser(u: any): User {
  return {
    id: u.id || u.userId || u.employeeId || "",
    name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown User",
    email: u.email || "",
    title: u.title || u.role || "Team Member",
    department: u.department || "General",
    manager: u.manager || "—",
    location: u.location || "Global",
    status: (u.status as User["status"]) || "ACTIVE",
    riskScore: typeof u.riskScore === "number" ? u.riskScore : 20,
    groups: Array.isArray(u.groups) ? u.groups : [],
    apps: Array.isArray(u.apps) ? u.apps : [],
    lastLogin: u.lastLogin || new Date().toISOString(),
    startDate: u.startDate || "2024-01-01",
  };
}

// ── GET /api/users ────────────────────────────────────────────────
export async function getUsers(): Promise<User[]> {
  const remote = await apiFetch<User[]>(ENDPOINTS.users);
  if (remote && Array.isArray(remote)) {
    return remote.map((u: any) => ({
      id: u.id || u.userId || u.employeeId || `usr_${Math.floor(100 + Math.random() * 900)}`,
      name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown User",
      email: u.email || "",
      title: u.title || u.role || "Team Member",
      department: u.department || "General",
      manager: u.manager || "—",
      location: u.location || "Global",
      status: (u.status as User["status"]) || "ACTIVE",
      riskScore: typeof u.riskScore === "number" ? u.riskScore : 20,
      groups: Array.isArray(u.groups) ? u.groups : [],
      apps: Array.isArray(u.apps) ? u.apps : [],
      lastLogin: u.lastLogin || new Date().toISOString(),
      startDate: u.startDate || "2024-01-01",
    }));
  }
  await delay();
  return [...currentUsers];
}

// ── GET /api/users/{id} ───────────────────────────────────────────
export async function getUser(id: string): Promise<User | undefined> {
  const remote = await apiFetch<User>(ENDPOINTS.user(id));
  if (remote) {
    const u: any = remote;
    return {
      id: u.id || u.userId || u.employeeId || id,
      name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown User",
      email: u.email || "",
      title: u.title || u.role || "Team Member",
      department: u.department || "General",
      manager: u.manager || "—",
      location: u.location || "Global",
      status: (u.status as User["status"]) || "ACTIVE",
      riskScore: typeof u.riskScore === "number" ? u.riskScore : 20,
      groups: Array.isArray(u.groups) ? u.groups : [],
      apps: Array.isArray(u.apps) ? u.apps : [],
      lastLogin: u.lastLogin || new Date().toISOString(),
      startDate: u.startDate || "2024-01-01",
    };
  }
  await delay();
  return currentUsers.find((u) => u.id === id);
}


// ── POST /api/lifecycle/joiner ────────────────────────────────────
export async function createJoiner(data: {
  name: string;
  email: string;
  department: string;
  title: string;
  manager: string;
  location: string;
  startDate: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}): Promise<Simulation> {
  const nameParts = data.name.trim().split(" ");
  const firstName = data.firstName || nameParts[0] || "";
  const lastName = data.lastName || nameParts.slice(1).join(" ") || firstName;
  const payload = {
    ...data,
    employeeId: data.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    firstName,
    lastName,
    role: data.role || data.title,
  };
  const remote = await apiFetch<User>(ENDPOINTS.joiner, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (remote) {
    const result = lifecycleResult("JOINER", normalizeUser(remote), "User created and activated in Okta");
    currentSimulations = [result, ...currentSimulations];
    return result;
  }
  await delay(100);
  const newSim: Simulation = {
    id: `sim_${Math.floor(1000 + Math.random() * 9000)}`,
    kind: "JOINER",
    subject: data.name,
    subjectEmail: data.email,
    summary: `New hire, ${data.title} (${data.department}) — starts ${data.startDate}`,
    risk: "LOW",
    riskScore: 18,
    requiresApproval: false,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    delta: {
      granted: [`okta-${data.department.toLowerCase().replace(/\s+/g, "")}-all`, "google-workspace-user"],
      revoked: [],
      unchanged: [],
    },
    impact: {
      groups: 2,
      apps: 3,
      privileged: 0,
      notes: ["Birthright baseline matched automatically for department."],
    },
  };
  currentSimulations = [newSim, ...currentSimulations];
  return newSim;
}

// ── PUT /api/lifecycle/mover/{id} ─────────────────────────────────
export async function moveUser(
  id: string,
  data: { department: string; title: string; manager: string; role?: string }
): Promise<Simulation> {
  const payload = {
    ...data,
    role: data.role || data.title,
  };
  const remote = await apiFetch<User>(ENDPOINTS.mover(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (remote) {
    const result = lifecycleResult("MOVER", normalizeUser(remote), `User moved to ${data.department}`);
    currentSimulations = [result, ...currentSimulations];
    return result;
  }
  await delay(100);
  const user = currentUsers.find((u) => u.id === id);
  const newSim: Simulation = {
    id: `sim_${Math.floor(1000 + Math.random() * 9000)}`,
    kind: "MOVER",
    subject: user?.name || id,
    subjectEmail: user?.email || "",
    summary: `Transfer to ${data.department} as ${data.title}`,
    risk: "HIGH",
    riskScore: 72,
    requiresApproval: true,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    delta: {
      granted: [`okta-${data.department.toLowerCase().replace(/\s+/g, "")}-all`],
      revoked: [`okta-${(user?.department || "").toLowerCase().replace(/\s+/g, "")}-all`],
      unchanged: ["okta-mfa-enforced", "zoom-standard"],
    },
    impact: {
      groups: 4,
      apps: 3,
      privileged: 1,
      notes: ["SoD review recommended for target department entitlements."],
    },
  };
  currentSimulations = [newSim, ...currentSimulations];
  return newSim;
}

// ── POST /api/lifecycle/leaver/{id} ───────────────────────────────
export async function leaveUser(
  id: string,
  data?: { reason?: string; effectiveDate?: string }
): Promise<Simulation> {
  const remote = await apiFetch<User>(ENDPOINTS.leaver(id), {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
  if (remote) {
    const result = lifecycleResult("LEAVER", normalizeUser(remote), "User deactivated in Okta");
    currentSimulations = [result, ...currentSimulations];
    return result;
  }
  await delay(100);
  const user = currentUsers.find((u) => u.id === id);
  const newSim: Simulation = {
    id: `sim_${Math.floor(1000 + Math.random() * 9000)}`,
    kind: "LEAVER",
    subject: user?.name || id,
    subjectEmail: user?.email || "",
    summary: `Deprovision request: ${data?.reason || "Offboarding"}`,
    risk: "CRITICAL",
    riskScore: 89,
    requiresApproval: true,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    delta: {
      granted: [],
      revoked: user?.groups || ["all-assigned-groups"],
      unchanged: [],
    },
    impact: {
      groups: user?.groups.length || 3,
      apps: user?.apps.length || 2,
      privileged: (user?.riskScore || 0) > 50 ? 1 : 0,
      notes: ["Immediate session termination across all downstream SSO federations."],
    },
  };
  currentSimulations = [newSim, ...currentSimulations];
  return newSim;
}

// ── GET /api/impact/{id} ──────────────────────────────────────────
export async function getImpact(id: string, action: string): Promise<Impact> {
  const remote = await apiFetch<Impact>(`${ENDPOINTS.impact(id)}?action=${encodeURIComponent(action)}`);
  if (remote) return remote;
  await delay();
  const user = currentUsers.find((u) => u.id === id);
  return {
    groups: user?.groups.length || 3,
    apps: user?.apps.length || 2,
    privileged: (user?.riskScore || 0) > 60 ? 1 : 0,
    notes: [`Action '${action}' affects active SSO credentials and group bindings.`],
  };
}

// ── POST /api/what-if ─────────────────────────────────────────────
export async function simulate(data: {
  userId: string;
  action: string;
  targetRole?: string;
}): Promise<Simulation> {
  const remote = await apiFetch<{
    userId: string;
    proposedAction: "ACTIVATE" | "SUSPEND" | "UNSUSPEND" | "DEACTIVATE";
    currentStatus: string;
    expectedStatus: string;
    affectedGroups: string[];
    affectedApplications: string[];
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    reasons: string[];
  }>(ENDPOINTS.whatIf, {
    method: "POST",
    body: JSON.stringify({ userId: data.userId, action: data.action }),
  });
  if (remote) {
    const simulation: Simulation = {
      id: `whatif-${remote.userId}`,
      kind: "WHATIF",
      subject: remote.userId,
      subjectEmail: "",
      summary: `${remote.proposedAction} simulation: ${remote.currentStatus} -> ${remote.expectedStatus}`,
      risk: remote.riskLevel,
      riskScore: remote.riskLevel === "HIGH" ? 78 : remote.riskLevel === "MEDIUM" ? 48 : 24,
      requiresApproval: remote.riskLevel === "HIGH",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      delta: {
        granted: remote.proposedAction === "ACTIVATE" ? remote.affectedApplications : [],
        revoked: remote.proposedAction === "DEACTIVATE" ? remote.affectedApplications : [],
        unchanged: remote.affectedGroups,
      },
      impact: {
        groups: remote.affectedGroups.length,
        apps: remote.affectedApplications.length,
        privileged: remote.riskLevel === "HIGH" ? 1 : 0,
        notes: remote.reasons,
      },
    };
    currentSimulations = [simulation, ...currentSimulations];
    return simulation;
  }
  throw new Error("What-If simulation did not return a result");
}

// ── POST /api/approval/{simulationId}/approve ─────────────────────
export async function approve(simulationId: string): Promise<Simulation | null> {
  const remote = await apiFetch<Simulation>(ENDPOINTS.approve(simulationId), {
    method: "POST",
  });
  if (remote) return remote;
  await delay(80);
  const sim = currentSimulations.find((s) => s.id === simulationId);
  if (sim) {
    sim.status = "APPROVED";
    currentAudit = [
      {
        id: `aud_${Math.floor(1000 + Math.random() * 9000)}`,
        at: new Date().toISOString(),
        actor: "admin@northwind.io",
        action: "SIMULATION_APPROVED",
        target: `${sim.id} · ${sim.subject}`,
        result: "SUCCESS",
        risk: sim.risk,
        detail: `Simulation ${sim.id} approved by security reviewer.`,
      },
      ...currentAudit,
    ];
  }
  return sim || null;
}

// ── POST /api/approval/{simulationId}/reject ──────────────────────
export async function reject(simulationId: string): Promise<Simulation | null> {
  const remote = await apiFetch<Simulation>(ENDPOINTS.reject(simulationId), {
    method: "POST",
  });
  if (remote) return remote;
  await delay(80);
  const sim = currentSimulations.find((s) => s.id === simulationId);
  if (sim) {
    sim.status = "REJECTED";
    currentAudit = [
      {
        id: `aud_${Math.floor(1000 + Math.random() * 9000)}`,
        at: new Date().toISOString(),
        actor: "admin@northwind.io",
        action: "SIMULATION_REJECTED",
        target: `${sim.id} · ${sim.subject}`,
        result: "FAILED",
        risk: sim.risk,
        detail: `Simulation ${sim.id} rejected due to policy constraint.`,
      },
      ...currentAudit,
    ];
  }
  return sim || null;
}

// ── POST /api/execution/{simulationId} ────────────────────────────
export async function execute(simulationId: string): Promise<Simulation | null> {
  const remote = await apiFetch<Simulation>(ENDPOINTS.execute(simulationId), {
    method: "POST",
  });
  if (remote) return remote;
  await delay(100);
  const sim = currentSimulations.find((s) => s.id === simulationId);
  if (sim) {
    sim.status = "EXECUTED";
  }
  return sim || null;
}

// ── GET /api/drift ────────────────────────────────────────────────
export async function getDrift(): Promise<DriftItem[]> {
  const remote = await apiFetch<DriftItem[]>(ENDPOINTS.drift);
  if (remote) return remote;
  await delay();
  return [...currentDrift];
}

// ── POST /api/drift/{id}/remediate ────────────────────────────────
export async function remediateDrift(id: string): Promise<DriftItem | null> {
  const remote = await apiFetch<DriftItem>(ENDPOINTS.remediateDrift(id), {
    method: "POST",
  });
  if (remote) return remote;
  await delay(100);
  const item = currentDrift.find((d) => d.id === id);
  if (item) {
    item.status = "REMEDIATED";
  }
  return item || null;
}

// ── GET /api/audit ────────────────────────────────────────────────
export async function getAudit(): Promise<AuditEvent[]> {
  const remote = await apiFetch<AuditEvent[]>(ENDPOINTS.audit);
  if (remote) return remote;
  await delay();
  return [...currentAudit];
}

// ── GET /api/users/export ─────────────────────────────────────────
export async function exportUsers(): Promise<string> {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.usersExport}`);
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    return await res.text();
  }
  await delay();
  const header = "ID,Name,Email,Department,Title,Status,RiskScore\n";
  const rows = currentUsers
    .map(
      (u) =>
        `"${u.id}","${u.name}","${u.email}","${u.department}","${u.title}","${u.status}",${u.riskScore}`
    )
    .join("\n");
  return header + rows;
}
