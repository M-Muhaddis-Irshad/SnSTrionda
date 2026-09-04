"use client";

// =============================================================================
// Shared user list for /admin/users (all roles) and /admin/customers
// (CUSTOMER-only). Consumes the real backend module at /api/admin/users:
//   GET   /api/admin/users?page&limit&role&search
//   PATCH /api/admin/users/:userId/role    (self-demotion is blocked server-side)
// The User model has no isActive/banned field, so there is deliberately no
// status toggle here — the schema decision comes first.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Search, Users as UsersIcon, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { fetchAdminUsers, updateAdminUserRole } from "@/lib/admin-api";
import Modal, {
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
  fieldErrorCls,
} from "@/app/admin/media/components/Modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  emailVerified: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { orders: number };
}

const PAGE_SIZE = 20;
const ROLES = ["CUSTOMER", "ADMIN"];

const ROLE_BADGES: Record<string, string> = {
  ADMIN: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  CUSTOMER: "bg-gray-800 text-gray-300 border-gray-700",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UserTable({ mode }: { mode: "customers" | "users" }) {
  const currentUser = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>({ total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Role-change modal state
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const isSelf = editing?.id === currentUser?.id;

  const load = useCallback(
    async (targetPage: number, role: string, query: string) => {
      try {
        setLoading(true);
        setError("");
        const res = await fetchAdminUsers({
          page: targetPage,
          limit: PAGE_SIZE,
          role: mode === "customers" ? "CUSTOMER" : role || undefined,
          search: query.trim() || undefined,
        });
        setRows(res.data || []);
        setPagination(
          res.pagination || {
            total: 0,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        );
        setPage(targetPage);
      } catch (err: any) {
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [mode]
  );

  // Search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, roleFilter, search), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  function openRoleModal(user: AdminUser) {
    setEditing(user);
    setNewRole(user.role);
    setFormError("");
  }

  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setFormError("");
    setSaving(true);
    try {
      await updateAdminUserRole(editing.id, newRole);
      setEditing(null);
      await load(page, roleFilter, search);
    } catch (err: any) {
      // Surfaces the server-side self-demotion guard (400) clearly.
      setFormError(err.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  const filterSelect =
    mode === "users" ? (
      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className={inputCls + " sm:w-48"}
      >
        <option value="">All roles</option>
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r === "CUSTOMER" ? "Customers" : "Admins"}
          </option>
        ))}
      </select>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search by name, email or phone…`}
            className={inputCls + " pl-9"}
          />
        </div>
        {filterSelect}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-gray-400 text-center py-16">
            <Loader2 size={24} className="mx-auto mb-3 animate-spin text-gray-600" />
            Loading users…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-gray-400 text-center py-16">
            <UsersIcon size={32} className="mx-auto mb-3 text-gray-600" />
            <p>No users found{search || roleFilter ? " for the current filters" : " yet"}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-800/60 hover:bg-gray-800/40 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white text-sm shrink-0 uppercase">
                          {(user.name || user.email).charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">
                            {user.name || "—"}
                            {user.id === currentUser?.id && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-white text-black font-semibold align-middle">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {user.phone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${
                          ROLE_BADGES[user.role] || "text-gray-400 border-gray-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {user._count?.orders ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => openRoleModal(user)}
                          aria-label={`Change role of ${user.name || user.email}`}
                          title="Change role"
                          className="p-2 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Page {page} of {pagination.totalPages} · {pagination.total} users
          </span>
          <div className="flex gap-2">
            <button
              disabled={!pagination.hasPrev}
              onClick={() => load(page - 1, roleFilter, search)}
              className="px-3 py-1.5 bg-gray-800 rounded disabled:opacity-40 hover:bg-gray-700 transition"
            >
              ← Prev
            </button>
            <button
              disabled={!pagination.hasNext}
              onClick={() => load(page + 1, roleFilter, search)}
              className="px-3 py-1.5 bg-gray-800 rounded disabled:opacity-40 hover:bg-gray-700 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Role change modal ── */}
      {editing && (
        <Modal
          title={`Change role — ${editing.name || editing.email}`}
          onClose={() => {
            if (!saving) setEditing(null);
          }}
        >
          <form onSubmit={handleSaveRole} className="space-y-4">
            {isSelf && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs px-3 py-2 rounded">
                This is your own account. The backend blocks removing your own
                ADMIN role to prevent self-lockout.
              </div>
            )}
            <div>
              <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                Role
              </label>
              <select
                className={inputCls}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === "CUSTOMER" ? "Customer" : "Admin"}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1.5">
                Current role: {editing.role}
              </p>
            </div>

            {formError && <p className={fieldErrorCls}>{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className={btnSecondaryCls}
                onClick={() => setEditing(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimaryCls}>
                {saving ? "Saving…" : "Save Role"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
