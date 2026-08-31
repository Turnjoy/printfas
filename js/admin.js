import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config.js";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const statuses = ["received", "processing", "printing", "ready", "out_for_delivery", "completed"];
const labels = {
  received: "Received",
  processing: "Processing",
  printing: "Printing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  completed: "Completed"
};

let quoteOrderId = null;
let messageOrderId = null;

const el = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function badge(text, type = "blue") {
  const styles = {
    blue: "bg-blue-50 text-[var(--brand-primary)]",
    red: "bg-red-50 text-red-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-800",
    slate: "bg-slate-100 text-slate-700"
  };
  return `<span class="inline-flex rounded-md px-2 py-1 text-xs font-black ${styles[type]}">${text}</span>`;
}

function getAddOnSummary(addOns) {
  if (!Array.isArray(addOns) || !addOns.length) return "";
  return addOns
    .map((item) => `${item.name ?? "Add-on"} (${item.units ?? 1})`)
    .join(", ");
}

function getOrderFiles(order) {
  if (Array.isArray(order.file_paths) && order.file_paths.length) return order.file_paths;
  return order.file_path ? [{ name: "Print file", path: order.file_path }] : [];
}

async function requireAdmin() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", sessionData.session.user.id)
    .single();
  return profile?.role === "admin";
}

async function showAdmin() {
  el("loginPanel").classList.add("hidden");
  el("adminPanel").classList.remove("hidden");
  el("logoutBtn").classList.remove("hidden");
  await loadOrders();
}

async function loadOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    el("ordersBody").innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-red-700">${error.message}</td></tr>`;
    return;
  }

  el("ordersBody").innerHTML = (data ?? []).map((order) => {
    const deliveryText = order.delivery_option === "delivery"
      ? `DELIVERY: ${order.delivery_address ?? "No address"}`
      : "PICKUP";
    const addOnSummary = getAddOnSummary(order.add_ons);
    const files = getOrderFiles(order);
    return `
      <tr>
        <td class="px-4 py-4 align-top">
          <p class="font-black">${escapeHtml(order.order_ref)}</p>
          <p class="text-xs text-slate-500">${new Date(order.created_at).toLocaleString()}</p>
          <p class="text-xs text-slate-500">${escapeHtml(order.customer_email ?? "")}</p>
        </td>
        <td class="px-4 py-4 align-top">
          <p class="font-bold">${escapeHtml(order.service_type)}</p>
          <p class="text-xs text-slate-500">${order.pages_per_document ?? 1} page(s) x ${order.copies ?? order.quantity ?? 1} copy/copies = ${order.quantity ?? 1} total ${order.is_custom_quote ? "Custom quote" : ""}</p>
          ${addOnSummary ? `<p class="mt-1 text-xs text-slate-600">Add-ons: ${escapeHtml(addOnSummary)}</p>` : ""}
          ${order.customer_note ? `<p class="mt-1 text-xs text-slate-600">Note: ${escapeHtml(order.customer_note)}</p>` : ""}
        </td>
        <td class="px-4 py-4 align-top">${badge(escapeHtml(deliveryText), order.delivery_option === "delivery" ? "amber" : "slate")}</td>
        <td class="px-4 py-4 align-top">
          ${badge(order.payment_status.toUpperCase(), order.payment_status === "paid" ? "green" : "red")}
          <p class="mt-2 font-black">${naira.format(Number(order.amount ?? 0))}</p>
        </td>
        <td class="px-4 py-4 align-top">
          <select data-status="${order.id}" class="rounded-md border border-slate-300 px-2 py-2 text-sm">
            ${statuses.map((status) => `<option value="${status}" ${status === order.order_status ? "selected" : ""}>${labels[status]}</option>`).join("")}
          </select>
        </td>
        <td class="px-4 py-4 align-top">
          <div class="flex flex-wrap gap-2">
            ${files.length ? files.map((file, index) => `
              <button data-download="${order.id}" data-file-path="${escapeHtml(file.path)}" class="rounded-md bg-[var(--brand-primary)] px-3 py-2 text-xs font-bold text-white">Download ${files.length > 1 ? index + 1 : "File"}</button>
            `).join("") : `<button class="rounded-md bg-[var(--brand-primary)] px-3 py-2 text-xs font-bold text-white opacity-40" disabled>Download File</button>`}
            <button data-quote="${order.id}" data-ref="${order.order_ref}" class="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold">Send Quote</button>
            <button data-message="${order.id}" data-ref="${order.order_ref}" class="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold">Message</button>
          </div>
          <p class="mt-2 text-xs text-slate-500">${order.downloaded_at ? `Downloaded ${new Date(order.downloaded_at).toLocaleString()}` : "Not downloaded"}</p>
        </td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="6" class="px-4 py-6 text-slate-500">No orders yet.</td></tr>`;
}

function openMessage(orderId, ref) {
  messageOrderId = orderId;
  el("messageOrderLabel").textContent = ref;
  el("adminMessage").value = "";
  el("messageResult").classList.add("hidden");
  el("messageResult").textContent = "";
  el("messageModal").classList.remove("hidden");
  el("messageModal").classList.add("flex");
}

async function sendMessage(event) {
  event.preventDefault();
  const message = el("adminMessage").value.trim();
  if (!messageOrderId || !message) return;
  const { error } = await supabase
    .from("order_messages")
    .insert({ order_id: messageOrderId, sender_role: "admin", message });
  if (error) {
    alert(error.message);
    return;
  }
  el("messageResult").textContent = "Message sent to the customer's order inbox.";
  el("messageResult").classList.remove("hidden");
  el("adminMessage").value = "";
}

async function login(event) {
  event.preventDefault();
  el("loginError").classList.add("hidden");
  const { error } = await supabase.auth.signInWithPassword({
    email: el("adminEmail").value,
    password: el("adminPassword").value
  });
  if (error) {
    el("loginError").textContent = error.message;
    el("loginError").classList.remove("hidden");
    return;
  }
  if (await requireAdmin()) {
    await showAdmin();
  } else {
    await supabase.auth.signOut();
    el("loginError").textContent = "This account is not configured as a PRINTFAS admin.";
    el("loginError").classList.remove("hidden");
  }
}

async function downloadFile(orderId, filePath) {
  const { data, error } = await supabase.functions.invoke("download-and-mark", {
    body: { orderId, filePath }
  });
  if (error) {
    alert(error.message);
    return;
  }
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  await loadOrders();
}

async function updateStatus(orderId, status) {
  const { error } = await supabase.from("orders").update({ order_status: status }).eq("id", orderId);
  if (error) alert(error.message);
}

function openQuote(orderId, ref) {
  quoteOrderId = orderId;
  el("quoteOrderLabel").textContent = ref;
  el("quoteAmount").value = "";
  el("quoteResult").classList.add("hidden");
  el("quoteResult").innerHTML = "";
  el("quoteModal").classList.remove("hidden");
  el("quoteModal").classList.add("flex");
}

async function saveQuote(event) {
  event.preventDefault();
  const amount = Number(el("quoteAmount").value);
  if (!quoteOrderId || !amount) return;
  const { data: order } = await supabase
    .from("orders")
    .select("customer_email")
    .eq("id", quoteOrderId)
    .single();

  const { error } = await supabase
    .from("orders")
    .update({ amount, payment_status: "pending" })
    .eq("id", quoteOrderId);
  if (error) {
    alert(error.message);
    return;
  }
  if (order?.customer_email) {
    const { data: checkout, error: checkoutError } = await supabase.functions.invoke("create-checkout", {
      body: { orderId: quoteOrderId, email: order.customer_email, amount }
    });
    if (!checkoutError && checkout?.authorization_url) {
      const mailto = `mailto:${order.customer_email}?subject=${encodeURIComponent("PRINTFAS quote payment link")}&body=${encodeURIComponent(`Hello, your PRINTFAS quote is ${naira.format(amount)}. Pay here: ${checkout.authorization_url}`)}`;
      el("quoteResult").innerHTML = `Quote saved. <a class="font-bold underline" href="${mailto}">Open email with payment link</a>`;
      el("quoteResult").classList.remove("hidden");
      await loadOrders();
      return;
    }
  }
  el("quoteResult").textContent = "Quote saved. No customer email was available for a payment link.";
  el("quoteResult").classList.remove("hidden");
  await loadOrders();
}

function bindEvents() {
  el("loginForm").addEventListener("submit", login);
  el("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    location.reload();
  });
  el("refreshBtn").addEventListener("click", loadOrders);
  el("closeQuoteBtn").addEventListener("click", () => {
    el("quoteModal").classList.add("hidden");
    el("quoteModal").classList.remove("flex");
  });
  el("closeMessageBtn").addEventListener("click", () => {
    el("messageModal").classList.add("hidden");
    el("messageModal").classList.remove("flex");
  });
  el("quoteForm").addEventListener("submit", saveQuote);
  el("messageForm").addEventListener("submit", sendMessage);
  el("ordersBody").addEventListener("click", (event) => {
    const downloadId = event.target.dataset.download;
    const quoteId = event.target.dataset.quote;
    const messageId = event.target.dataset.message;
    if (downloadId) downloadFile(downloadId, event.target.dataset.filePath);
    if (quoteId) openQuote(quoteId, event.target.dataset.ref);
    if (messageId) openMessage(messageId, event.target.dataset.ref);
  });
  el("ordersBody").addEventListener("change", (event) => {
    const orderId = event.target.dataset.status;
    if (orderId) updateStatus(orderId, event.target.value);
  });
}

bindEvents();
if (await requireAdmin()) {
  await showAdmin();
}
