'use client';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Orders</h1>
        <button className="px-4 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition">
          Export
        </button>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="text-gray-400 text-center py-12">
          <p>Orders management interface coming soon...</p>
          <p className="text-xs mt-2">Displaying all orders with filters and actions</p>
        </div>
      </div>
    </div>
  );
}
