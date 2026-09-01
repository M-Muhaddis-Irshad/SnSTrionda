'use client';

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Products</h1>
        <button className="px-4 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition">
          Add Product
        </button>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="text-gray-400 text-center py-12">
          <p>Products management interface coming soon...</p>
          <p className="text-xs mt-2">Manage inventory, pricing, and product details</p>
        </div>
      </div>
    </div>
  );
}
