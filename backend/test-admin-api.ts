import "dotenv/config";

declare const process: {
  env: Record<string, string | undefined>;
};

// Test admin API endpoints
const API = process.env.API_URL
  ? `${process.env.API_URL}/api`
  : "http://localhost:5000/api";

let TOKEN = "";

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    }),
  });

  const data = await res.json();

  TOKEN = data.accessToken;

  console.log("✅ Login successful, role:", data.user.role);
}

async function testEndpoint(name: string, method: string, path: string, body?: any) {
  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  console.log(`\n--- ${name} ---`);
  console.log(`Status: ${res.status}`);
  if (res.ok) {
    // Truncate large responses
    const str = JSON.stringify(data, null, 2);
    console.log(str.length > 500 ? str.substring(0, 500) + "..." : str);
  } else {
    console.log("Error:", data.error);
  }
  return { res, data };
}

async function testUnauthorized() {
  const res = await fetch(`${API}/admin/dashboard/stats`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  console.log("\n--- Unauthorized Access Test ---");
  console.log(`Status: ${res.status} (expected 401)`);
  console.log("Result:", res.status === 401 ? "PASS ✅" : "FAIL ❌");
}

async function testNonAdmin() {
  // Register a customer
  const regRes = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `test-customer-${Date.now()}@test.com`,
      password: "testpass123",
      firstName: "Test",
      lastName: "Customer",
    }),
  });
  const regData = await regRes.json();

  // Try admin endpoint with customer token
  const res = await fetch(`${API}/admin/dashboard/stats`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${regData.accessToken}`,
    },
  });
  const data = await res.json();
  console.log("\n--- Non-Admin Access Test ---");
  console.log(`Status: ${res.status} (expected 403)`);
  console.log("Result:", res.status === 403 ? "PASS ✅" : "FAIL ❌");
}

async function main() {
  try {
    await login();

    // Test auth gate
    await testUnauthorized();
    await testNonAdmin();

    // Dashboard stats
    await testEndpoint("Dashboard Stats", "GET", "/admin/dashboard/stats");

    // List orders
    const ordersRes = await testEndpoint("List Orders", "GET", "/admin/orders");

    // If there's an order, test detail + status update
    if (ordersRes.data.data && ordersRes.data.data.length > 0) {
      const orderId = ordersRes.data.data[0].id;
      await testEndpoint("Get Order Detail", "GET", `/admin/orders/${orderId}`);
      await testEndpoint("Update Order Status", "PATCH", `/admin/orders/${orderId}/status`, {
        status: "CONFIRMED",
      });
    } else {
      console.log("\n⚠️  No orders to test — skipping order detail/status update");
    }

    // List products
    const productsRes = await testEndpoint("List Products (Admin)", "GET", "/admin/products");

    // Create test product
    const createRes = await testEndpoint("Create Product", "POST", "/admin/products", {
      name: "Test Admin Product",
      description: "Created via admin API test",
      basePrice: 9999,
      categoryId: productsRes.data.data?.[0]?.categoryId || undefined,
      isCustomizable: false,
      variants: [
        { size: "M", color: "Black", sku: `TEST-${Date.now()}`, stockQuantity: 10 },
      ],
    });

    if (createRes.data.data) {
      const productId = createRes.data.data.id;
      // Edit
      await testEndpoint("Update Product", "PUT", `/admin/products/${productId}`, {
        name: "Test Admin Product (Updated)",
        basePrice: 8999,
      });
      // Delete (deactivate)
      await testEndpoint("Delete Product", "DELETE", `/admin/products/${productId}`);
    }

    // Categories
    await testEndpoint("List Categories", "GET", "/admin/categories");

    console.log("\n✅ All admin API tests complete!");
  } catch (err: any) {
    console.error("Test failed:", err.message);
  }
}

main();
