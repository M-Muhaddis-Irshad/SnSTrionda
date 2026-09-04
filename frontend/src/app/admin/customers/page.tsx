"use client";

import UserTable from "../users/components/UserTable";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Customers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customer accounts with their order counts — same directory as Users,
          filtered to the CUSTOMER role.
        </p>
      </div>
      <UserTable mode="customers" />
    </div>
  );
}
