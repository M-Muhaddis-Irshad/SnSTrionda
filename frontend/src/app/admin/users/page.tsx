"use client";

import UserTable from "./components/UserTable";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Users</h1>
        <p className="text-sm text-gray-500 mt-1">
          All accounts — manage roles (customers &amp; admins). You cannot
          demote your own account.
        </p>
      </div>
      <UserTable mode="users" />
    </div>
  );
}
