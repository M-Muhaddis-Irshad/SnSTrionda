import "dotenv/config";

declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};

// =============================================================================
// Order Security Verification Test
// Tests all 6 scenarios for the secured order endpoints
// =============================================================================

const API_URL = process.env.API_URL || 'http://localhost:5000';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err: any) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${err.message}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// ── Setup: Get tokens and order data ──

async function main() {
  console.log("═══ Order Security Verification ═══\n");

  // 1. Login as admin
  console.log("── Setup ──");
  const adminRes = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  });
  const adminData = await adminRes.json();
  const adminToken = adminData.accessToken || adminData.data?.accessToken;
  if (!adminToken) {
    console.log("  DEBUG admin response:", JSON.stringify(adminData).substring(0, 300));
    throw new Error("No admin token received");
  }
  console.log(`  Admin token obtained: ${adminToken.substring(0, 20)}...`);

  // 2. Register a test customer
  const custEmail = `security-test-${Date.now()}@test.com`;
  const regRes = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: custEmail,
      password: "TestPass123!",
      firstName: "Security",
      lastName: "Tester",
    }),
  });
  const regData = await regRes.json();
  const custToken = regData.accessToken || regData.data?.accessToken;
  const custId = regData.user?.id || regData.data?.user?.id;
  if (!custToken) {
    console.log("  DEBUG register response:", JSON.stringify(regData).substring(0, 300));
    throw new Error("No customer token received");
  }
  console.log(`  Customer created: ${custEmail} (id: ${custId})`);

  // 3. Get an existing order to test against
  const ordersRes = await fetch(`${API_URL}/api/admin/orders`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const ordersData = await ordersRes.json();
  const testOrder = ordersData.data[0];
  const orderNumber = testOrder.orderNumber;
  const orderUserEmail = testOrder.user.email;
  console.log(`  Test order: ${orderNumber} (owner email: ${orderUserEmail})`);

  // ── Test 1: GET /api/orders/:orderNumber with NO email ──
  console.log("\n── Test 1: Public endpoint, NO email param → expect 400 ──");
  await test("GET /api/orders/:orderNumber with no email → 400", async () => {
    const res = await fetch(`${API_URL}/api/orders/${orderNumber}`);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // ── Test 2: GET /api/orders/:orderNumber with WRONG email ──
  console.log("\n── Test 2: Public endpoint, WRONG email → expect 404 ──");
  await test("GET /api/orders/:orderNumber with wrong email → 404", async () => {
    const res = await fetch(
      `${API_URL}/api/orders/${orderNumber}?email=wrong@example.com`
    );
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  // ── Test 3: GET /api/orders/:orderNumber with CORRECT email ──
  console.log("\n── Test 3: Public endpoint, CORRECT email → expect 200 ──");
  await test("GET /api/orders/:orderNumber with correct email → 200", async () => {
    const res = await fetch(
      `${API_URL}/api/orders/${orderNumber}?email=${encodeURIComponent(orderUserEmail)}`
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.data.orderNumber === orderNumber, "Order number mismatch");
  });

  // ── Test 4: GET /api/orders/mine/:orderNumber with NO token ──
  console.log("\n── Test 4: /api/orders/mine/:orderNumber, NO token → expect 401 ──");
  await test("GET /api/orders/mine/:orderNumber with no token → 401", async () => {
    const res = await fetch(`${API_URL}/api/orders/mine/${orderNumber}`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // ── Test 5: GET /api/orders/mine/:orderNumber with WRONG user's token ──
  console.log("\n── Test 5: /api/orders/mine/:orderNumber, WRONG user → expect 404 ──");
  await test("GET /api/orders/mine/:orderNumber with wrong user token → 404", async () => {
    const res = await fetch(`${API_URL}/api/orders/mine/${orderNumber}`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  // ── Test 6: GET /api/orders/mine/:orderNumber with CORRECT owner token ──
  // We need to find an order owned by the admin to test this properly.
  // The test order is owned by test-cust, not admin. Let's find an admin-owned order.
  console.log("\n── Test 6: /api/orders/mine/:orderNumber, CORRECT owner → expect 200 ──");

  // Find an order owned by admin from the admin orders list
  let adminOwnedOrder: string | null = null;
  for (const o of ordersData.data) {
    if (o.user.email === (process.env.ADMIN_EMAIL)) {
      adminOwnedOrder = o.orderNumber;
      break;
    }
  }

  if (adminOwnedOrder) {
    await test("GET /api/orders/mine/:orderNumber with correct owner token → 200", async () => {
      const res = await fetch(`${API_URL}/api/orders/mine/${adminOwnedOrder}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert(data.data.orderNumber === adminOwnedOrder, "Order number mismatch");
    });
  } else {
    // No admin-owned order found — create one as the test customer and view it
    console.log("  (No admin-owned order, creating a test order as customer)");
    // Get a valid product variant with stock > 0
    const prodRes = await fetch(`${API_URL}/api/products`);
    const prodData = await prodRes.json();
    let product: any = null;
    let variant: any = null;
    for (const p of prodData.data) {
      for (const v of p.variants) {
        if (v.stockQuantity > 0) {
          product = p;
          variant = v;
          break;
        }
      }
      if (variant) break;
    }
    assert(product && variant, "No product with stock available");

    // Create order as customer
    const createRes = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
        shippingAddress: {
          fullName: "Security Tester",
          phone: "03001234567",
          addressLine1: "123 Test Street",
          city: "Lahore",
          province: "Punjab",
        },
        paymentMethod: "COD",
        email: custEmail,
      }),
    });
    assert(createRes.status === 201, `Order creation failed: ${createRes.status}`);
    const createData = await createRes.json();
    const newOrderNumber = createData.data.orderNumber;
    console.log(`  Created order: ${newOrderNumber}`);

    await test("GET /api/orders/mine/:orderNumber with correct owner token → 200", async () => {
      const res = await fetch(`${API_URL}/api/orders/mine/${newOrderNumber}`, {
        headers: { Authorization: `Bearer ${custToken}` },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert(data.data.orderNumber === newOrderNumber, "Order number mismatch");
      assert(data.data.userId === custId, "UserId mismatch — wrong order returned");
    });

    // Also verify that viewing this new order with the WRONG token fails
    await test("GET /api/orders/mine/:newOrder with wrong user → still 404", async () => {
      const res = await fetch(`${API_URL}/api/orders/mine/${newOrderNumber}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(res.status === 404, `Expected 404, got ${res.status}`);
    });
  }

  // ── Summary ──
  console.log(`\n═══ Results: ${passed} passed, ${failed} failed ═══`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
