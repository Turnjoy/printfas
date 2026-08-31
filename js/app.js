import { ADD_ON_SERVICES, BUSINESS, DELIVERY_FEE, PAYSTACK_PUBLIC_KEY, SERVICES, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config.js";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const statusLabels = {
  received: "Received",
  processing: "Processing",
  printing: "Printing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  completed: "Completed"
};
const statusFlow = ["received", "processing", "printing", "ready", "out_for_delivery", "completed"];

let deferredInstallPrompt = null;
let fileQueue = [];
let uploadedFiles = [];
let activeOrder = null;
let largeFileNames = [];

const el = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initStaticContent() {
  el("whatsappLink").href = `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent("Hello PRINTFAS, I want to submit a file for printing.")}`;
  el("emailLink").href = `mailto:${BUSINESS.email}?subject=${encodeURIComponent("PRINTFAS file submission")}`;
  el("bankList").innerHTML = BUSINESS.bankAccounts.map((account) => `
    <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p class="font-black text-slate-950">${account.bank}</p>
      <p class="text-lg font-black text-[var(--brand-primary)]">${account.number}</p>
      <p class="text-sm text-slate-500">${account.name}</p>
    </div>
  `).join("");
  el("serviceType").innerHTML = SERVICES.map((service) => `
    <option value="${service.name}">${service.name}${service.custom ? " - Quote" : ` - ${naira.format(service.price)}`}</option>
  `).join("");
  el("priceList").innerHTML = SERVICES.map((service) => `
    <div class="flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <span class="text-sm font-bold text-slate-800">${service.name}</span>
      <span class="shrink-0 text-sm font-black ${service.custom ? "text-amber-700" : "text-[var(--brand-primary)]"}">${service.custom ? "Get quote" : naira.format(service.price)}</span>
    </div>
  `).join("");
  el("addOnServices").innerHTML = ADD_ON_SERVICES.map((service) => `
    <label data-addon-card="${service.id}" class="rounded-md border border-slate-200 p-4">
      <input type="checkbox" name="addOnService" value="${service.id}" class="mr-2 accent-[var(--brand-primary)]">
      <span class="font-bold">${service.name}</span>
      <p class="mt-1 text-sm text-slate-500">${naira.format(service.price)} ${service.pricedPerPage ? "per printed page" : "per copy"}</p>
    </label>
  `).join("");
}

function getSelectedService() {
  return SERVICES.find((service) => service.name === el("serviceType").value) ?? SERVICES[0];
}

function getDeliveryOption() {
  return document.querySelector("input[name='delivery']:checked")?.value ?? "pickup";
}

function getServiceSize(service) {
  if (!service || !service.name) return null;
  const normalized = service.name.toUpperCase();
  if (normalized.includes("A3")) return "A3";
  if (normalized.includes("A4")) return "A4";
  return null;
}

function getAllowedAddOns(service) {
  const size = getServiceSize(service);
  if (!size) return ADD_ON_SERVICES.filter((addOn) => addOn.id === "photocopy");

  const explicitAllowed = new Set(["photocopy"]);
  if (size === "A4") {
    explicitAllowed.add("a4-laminate");
    explicitAllowed.add("a4-bind");
  }
  if (size === "A3") {
    explicitAllowed.add("a3-laminate");
    explicitAllowed.add("a3-bind");
  }

  return ADD_ON_SERVICES.filter((addOn) => explicitAllowed.has(addOn.id));
}

function updateAddOnAvailability(service) {
  const allowedIds = new Set(getAllowedAddOns(service).map((addOn) => addOn.id));

  document.querySelectorAll("input[name='addOnService']").forEach((input) => {
    const allowed = allowedIds.has(input.value);
    const card = input.closest("[data-addon-card]");
    input.disabled = !allowed;
    if (!allowed) input.checked = false;
    card?.classList.toggle("opacity-40", !allowed);
    card?.classList.toggle("bg-slate-100", !allowed);
    card?.setAttribute("aria-disabled", String(!allowed));
  });
}

function getTotalFilePages() {
  return fileQueue.reduce((sum, item) => sum + Math.max(1, Number(item.pages || 1)), 0);
}

function getSelectedAddOns(totalPrintUnits, copies, fileCount) {
  const selectedIds = Array.from(document.querySelectorAll("input[name='addOnService']:checked"))
    .map((input) => input.value);

  return ADD_ON_SERVICES
    .filter((service) => selectedIds.includes(service.id))
    .map((service) => {
      const units = service.pricedPerPage ? totalPrintUnits : copies * Math.max(1, fileCount);
      return {
        id: service.id,
        name: service.name,
        price: service.price,
        pricedPerPage: service.pricedPerPage,
        units,
        amount: service.price * units
      };
    });
}

function calculateTotal() {
  const service = getSelectedService();
  updateAddOnAvailability(service);
  const pagesPerDocument = getTotalFilePages();
  const copies = Math.max(1, Number(el("quantity").value || 1));
  const quantity = pagesPerDocument * copies;
  const addOns = getSelectedAddOns(pagesPerDocument * copies, copies, fileQueue.length);
  const addOnTotal = addOns.reduce((sum, item) => sum + item.amount, 0);
  const hasConfiguredFiles = fileQueue.length > 0;
  const deliveryFee = hasConfiguredFiles && getDeliveryOption() === "delivery" ? DELIVERY_FEE : 0;
  const custom = service.custom;
  const printSubtotal = custom || !hasConfiguredFiles ? 0 : service.price * quantity;
  const subtotal = custom || !hasConfiguredFiles ? 0 : printSubtotal + addOnTotal;
  const total = subtotal + deliveryFee;
  const pageLabel = quantity === 1 ? "page" : "pages";
  const addOnNote = addOns.length
    ? ` + add-ons ${naira.format(addOnTotal)}`
    : "";

  el("quoteBadge").classList.toggle("hidden", !custom);
  el("sheetCount").textContent = `${quantity.toLocaleString()} printed ${pageLabel}`;
  el("totalAmount").textContent = custom && hasConfiguredFiles ? "Quote required" : naira.format(total);
  el("priceNote").textContent = !fileQueue.length
    ? "Add one or more files and enter each page count to calculate your print price."
    : custom
    ? "Submit your request and PRINTFAS will send a custom quote before payment."
    : `${pagesPerDocument.toLocaleString()} page(s) across ${fileQueue.length} file(s) x ${copies.toLocaleString()} copy/copies = ${quantity.toLocaleString()} printed ${pageLabel}. Print ${naira.format(printSubtotal)}${addOnNote} + delivery ${naira.format(deliveryFee)}.`;
  el("paystackBtn").disabled = !activeOrder || custom || total <= 0;
  return { service, pagesPerDocument, copies, quantity, addOns, addOnTotal, deliveryFee, total, custom };
}

function generateOrderRef() {
  return `PF-${Math.floor(1000 + Math.random() * 9000)}`;
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeStorageName(fileName, index) {
  const safeName = fileName
    .replace(/[^a-z0-9.\-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${String(index + 1).padStart(2, "0")}-${safeName || "file"}`;
}

async function uploadToBucket(file, path) {
  if (!file) return null;
  if (file.size > 25 * 1024 * 1024) return null;
  const { error } = await supabase.storage.from("print-jobs").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

function renderFileQueue() {
  el("fileQueue").innerHTML = fileQueue.map((item) => `
    <div class="grid gap-3 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_130px_auto] sm:items-center">
      <div class="min-w-0">
        <p class="truncate font-bold text-slate-900">${escapeHtml(item.file.name)}</p>
        <p class="text-sm text-slate-500">${formatFileSize(item.file.size)}</p>
      </div>
      <label class="block">
        <span class="text-xs font-bold text-slate-700">Pages</span>
        <input data-file-pages="${item.id}" type="number" min="1" value="${item.pages}" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[var(--brand-primary)]">
      </label>
      <button type="button" data-remove-file="${item.id}" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700">Remove</button>
    </div>
  `).join("");
  el("fileState").textContent = fileQueue.length
    ? `${fileQueue.length} file(s) ready. Enter page count for each file.`
    : "PDF, images, Word, and PowerPoint. Max 25MB per file.";
  calculateTotal();
}

function showOrderResult(html) {
  el("orderResult").innerHTML = html;
  el("orderResult").classList.remove("hidden");
}

async function submitOrder(event) {
  event.preventDefault();
  const pricing = calculateTotal();
  const deliveryOption = getDeliveryOption();
  const deliveryAddress = el("deliveryAddress").value.trim();

  if (!fileQueue.length && !largeFileNames.length) {
    alert("Please add at least one file for this order.");
    return;
  }

  if (deliveryOption === "delivery" && !deliveryAddress) {
    alert("Please enter the delivery address.");
    return;
  }

  el("submitOrderBtn").disabled = true;
  el("submitOrderBtn").textContent = "Creating...";

  try {
    const orderRef = generateOrderRef();
    if (fileQueue.length) {
      el("fileState").textContent = `Uploading ${fileQueue.length} file(s)...`;
      uploadedFiles = [];
      for (const [index, item] of fileQueue.entries()) {
        const path = `orders/${orderRef}/${safeStorageName(item.file.name, index)}`;
        const uploadedPath = await uploadToBucket(item.file, path);
        if (uploadedPath) {
          uploadedFiles.push({
            name: item.file.name,
            size: item.file.size,
            pages: Math.max(1, Number(item.pages || 1)),
            path: uploadedPath
          });
        }
      }
      el("fileState").textContent = `${uploadedFiles.length} file(s) uploaded for ${orderRef}.`;
    }

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_ref: orderRef,
        customer_name: el("customerName").value.trim(),
        customer_email: el("customerEmail").value.trim(),
        service_type: pricing.service.name,
        quantity: pricing.quantity,
        pages_per_document: pricing.pagesPerDocument,
        copies: pricing.copies,
        add_ons: pricing.addOns,
        customer_note: el("orderNote").value.trim() || null,
        is_custom_quote: pricing.custom,
        upload_channel: largeFileNames.length ? "whatsapp" : "web",
        file_path: uploadedFiles[0]?.path ?? null,
        file_paths: uploadedFiles,
        delivery_option: deliveryOption,
        delivery_address: deliveryOption === "delivery" ? deliveryAddress : null,
        delivery_fee: pricing.deliveryFee,
        amount: pricing.total,
        payment_status: pricing.custom ? "quoted" : "pending",
        order_status: "received"
      })
      .select()
      .single();

    if (error) throw error;
    activeOrder = data;
    calculateTotal();
    el("proofBtn").disabled = false;
    showOrderResult(`
      <p class="font-black">Order created: ${data.order_ref}</p>
      <p class="mt-1">Save this reference for tracking. ${pricing.custom ? "A PRINTFAS admin will confirm your quote." : "Tap Build & Pay to choose bank transfer or card payment."}</p>
      ${largeFileNames.length ? `<p class="mt-2"><a class="font-bold underline" href="${largeFileWhatsappUrl(data.order_ref)}">Send large file(s) on WhatsApp</a></p>` : ""}
    `);
  } catch (error) {
    alert(error.message ?? "Unable to create order.");
  } finally {
    el("submitOrderBtn").disabled = false;
    el("submitOrderBtn").textContent = "Create Order";
  }
}

async function payWithPaystack() {
  if (!activeOrder) return;
  const pricing = calculateTotal();
  const email = el("customerEmail").value.trim();

  try {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { orderId: activeOrder.id, email, amount: pricing.total }
    });
    if (error) throw error;

    if (data?.authorization_url) {
      window.location.href = data.authorization_url;
      return;
    }

    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(pricing.total * 100),
      ref: activeOrder.order_ref,
      callback: () => trackOrder(activeOrder.order_ref),
      onClose: () => {}
    });
    handler.openIframe();
  } catch (error) {
    alert(error.message ?? "Unable to start Paystack payment.");
  }
}

function showPaymentOptions() {
  if (!activeOrder) return;
  el("paymentPanel").classList.remove("hidden");
  el("paymentPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function attachProof() {
  if (!activeOrder) return;
  const proof = el("proofInput").files?.[0];
  if (!proof) {
    alert("Choose a receipt file first.");
    return;
  }
  el("proofBtn").disabled = true;
  el("proofBtn").textContent = "Uploading...";
  try {
    const extension = proof.name.includes(".") ? proof.name.split(".").pop() : "file";
    const proofPath = await uploadToBucket(proof, `proofs/${Date.now()}-${crypto.randomUUID()}.${extension}`);
    const { error } = await supabase.from("orders").update({ proof_path: proofPath }).eq("id", activeOrder.id);
    if (error) throw error;
    showOrderResult(`<p class="font-black">Proof attached to ${activeOrder.order_ref}</p><p class="mt-1">PRINTFAS will confirm your bank transfer.</p>`);
  } catch (error) {
    alert(error.message ?? "Unable to attach proof.");
  } finally {
    el("proofBtn").disabled = false;
    el("proofBtn").textContent = "Attach Proof";
  }
}

async function trackOrder(refFromArg) {
  const ref = (refFromArg || el("trackRef").value).trim().toUpperCase();
  if (!ref) return;
  const { data: rows, error } = await supabase.rpc("track_order", { lookup_ref: ref });
  const data = rows?.[0];
  const { data: messages } = await supabase.rpc("get_order_messages", { lookup_ref: ref });

  if (error || !data) {
    el("trackerResult").innerHTML = `<p class="rounded-md bg-red-50 p-3 text-red-700">Order not found. Check the reference and try again.</p>`;
    return;
  }

  const currentIndex = statusFlow.indexOf(data.order_status);
  const expired = data.downloaded_at && Date.now() - new Date(data.downloaded_at).getTime() > 3 * 60 * 60 * 1000;
  el("trackerResult").innerHTML = `
    <div class="rounded-md border border-slate-200 p-3">
      <div class="flex items-center justify-between gap-3">
        <strong>${data.order_ref}</strong>
        <span class="rounded-md bg-blue-50 px-2 py-1 text-xs font-black text-[var(--brand-primary)]">${data.delivery_option === "delivery" ? "DELIVERY" : "PICKUP"}</span>
      </div>
      <ol class="mt-4 space-y-2">
        ${statusFlow.map((status, index) => `
          <li class="flex items-center gap-2 ${index <= currentIndex ? "text-[var(--brand-primary)]" : "text-slate-400"}">
            <span class="h-2.5 w-2.5 rounded-full ${index <= currentIndex ? "bg-[var(--brand-primary)]" : "bg-slate-300"}"></span>
            ${statusLabels[status]}
          </li>
        `).join("")}
      </ol>
      ${expired ? `<div class="mt-4 rounded-md bg-amber-50 p-3 text-amber-800">The 3-hour print file window has expired. Please create a new upload or contact PRINTFAS for re-upload support.</div>` : ""}
    </div>
  `;
  el("inboxResult").innerHTML = `
    <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
      <h3 class="font-black text-slate-900">Inbox</h3>
      ${(messages ?? []).length ? messages.map((item) => `
        <article class="mt-3 rounded-md bg-white p-3 ring-1 ring-slate-200">
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs font-black uppercase text-[var(--brand-primary)]">${escapeHtml(item.sender_role)}</span>
            <time class="text-xs text-slate-500">${new Date(item.created_at).toLocaleString()}</time>
          </div>
          <p class="mt-2 text-slate-700">${escapeHtml(item.message)}</p>
        </article>
      `).join("") : `<p class="mt-2 text-slate-500">No admin messages yet.</p>`}
    </div>
  `;
}

function largeFileWhatsappUrl(orderRef = "") {
  const text = `Hello PRINTFAS, my order reference is ${orderRef}. I need to send file(s) above 25MB for printing.`;
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`;
}

function addSelectedFiles(files) {
  uploadedFiles = [];
  const incoming = Array.from(files ?? []);
  if (!incoming.length) {
    renderFileQueue();
    return;
  }

  const seenNames = new Set(fileQueue.map((item) => item.file.name.toLowerCase()));
  incoming.forEach((file) => {
    const key = file.name.toLowerCase();
    if (file.size > 25 * 1024 * 1024) {
      if (!largeFileNames.includes(file.name)) largeFileNames.push(file.name);
      return;
    }
    if (seenNames.has(key)) return;
    fileQueue.push({
      id: crypto.randomUUID(),
      file,
      pages: 1
    });
    seenNames.add(key);
  });

  renderFileQueue();
  if (largeFileNames.length) {
    el("fileState").innerHTML = `${fileQueue.length} file(s) ready. <a class="font-bold text-green-700 underline" href="${largeFileWhatsappUrl()}" target="_blank" rel="noopener">Send ${largeFileNames.length} large file(s) through WhatsApp</a>.`;
  }
}

function setupFileInput() {
  const dropZone = el("dropZone");
  const fileInput = el("fileInput");
  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("border-[var(--brand-primary)]", "bg-blue-50");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("border-[var(--brand-primary)]", "bg-blue-50");
  });
  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("border-[var(--brand-primary)]", "bg-blue-50");
    addSelectedFiles(event.dataTransfer.files);
  });
  fileInput.addEventListener("change", () => {
    addSelectedFiles(fileInput.files);
    fileInput.value = "";
  });
  el("fileQueue").addEventListener("input", (event) => {
    const fileId = event.target.dataset.filePages;
    const item = fileQueue.find((queuedFile) => queuedFile.id === fileId);
    if (!item) return;
    item.pages = Math.max(1, Number(event.target.value || 1));
    uploadedFiles = [];
    calculateTotal();
  });
  el("fileQueue").addEventListener("click", (event) => {
    const fileId = event.target.dataset.removeFile;
    if (!fileId) return;
    fileQueue = fileQueue.filter((queuedFile) => queuedFile.id !== fileId);
    uploadedFiles = [];
    renderFileQueue();
  });
}

function setupPwa() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    el("installBtn").classList.remove("hidden");
  });
  el("installBtn").addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    el("installBtn").classList.add("hidden");
  });
}

function bindEvents() {
  el("orderForm").addEventListener("submit", submitOrder);
  el("paystackBtn").addEventListener("click", showPaymentOptions);
  el("cardPayBtn").addEventListener("click", payWithPaystack);
  el("proofBtn").addEventListener("click", attachProof);
  el("trackBtn").addEventListener("click", () => trackOrder());
  el("serviceType").addEventListener("change", calculateTotal);
  el("quantity").addEventListener("input", calculateTotal);
  document.querySelectorAll("input[name='addOnService']").forEach((checkbox) => {
    checkbox.addEventListener("change", calculateTotal);
  });
  document.querySelectorAll("input[name='delivery']").forEach((radio) => {
    radio.addEventListener("change", () => {
      el("deliveryAddress").classList.toggle("hidden", getDeliveryOption() !== "delivery");
      calculateTotal();
    });
  });
}

initStaticContent();
setupPwa();
setupFileInput();
bindEvents();
calculateTotal();
