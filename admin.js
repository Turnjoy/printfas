// PRINTFAS Admin Dashboard
// Admin authentication and order management

// Supabase Configuration - set via window.__PRINTFAS_CONFIG__ when a real project is configured.
const SUPABASE_URL = (window.__PRINTFAS_CONFIG__ && window.__PRINTFAS_CONFIG__.supabaseUrl) || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = (window.__PRINTFAS_CONFIG__ && window.__PRINTFAS_CONFIG__.supabaseAnonKey) || 'placeholder-key';

// Initialize Supabase
const supabase = (window.supabase && typeof window.supabase.createClient === 'function' && SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'placeholder-key')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!supabase) {
  console.warn('Supabase is not configured. Admin dashboard will remain in demo mode until real credentials are provided.');
}

// Global state
let currentUser = null;
let currentOrders = [];
let selectedOrder = null;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const adminEmail = document.getElementById('adminEmail');
const ordersTableBody = document.getElementById('ordersTableBody');
const emptyState = document.getElementById('emptyState');
const statusFilter = document.getElementById('statusFilter');
const refreshBtn = document.getElementById('refreshBtn');
const orderModal = document.getElementById('orderModal');
const orderModalContent = document.getElementById('orderModalContent');
const closeOrderModal = document.getElementById('closeOrderModal');
const quoteModal = document.getElementById('quoteModal');
const closeQuoteModal = document.getElementById('closeQuoteModal');
const quoteForm = document.getElementById('quoteForm');
const adminThemeToggle = document.getElementById('adminThemeToggle');
const adminThemeSun = document.getElementById('adminThemeSun');
const adminThemeMoon = document.getElementById('adminThemeMoon');
const resumeDrawer = document.getElementById('resumeInfoDrawer');
const resumeInfoContent = document.getElementById('resumeInfoContent');
const copyResumeTextBtn = document.getElementById('copyResumeText');
const printResumeBtn = document.getElementById('printResumeBtn');
const closeResumeDrawerBtn = document.getElementById('closeResumeDrawer');

function getSavedTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  if (adminThemeSun && adminThemeMoon) {
    adminThemeSun.classList.toggle('hidden', !isDark);
    adminThemeMoon.classList.toggle('hidden', isDark);
  }
}

if (adminThemeToggle) {
  adminThemeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(nextTheme);
  });
}

// Check for existing session
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        await verifyAdminRole();
    } else {
        showLogin();
    }
}

// Verify user has admin role
async function verifyAdminRole() {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, email')
            .eq('id', currentUser.id)
            .single();

        if (error || !profile || profile.role !== 'admin') {
            await supabase.auth.signOut();
            showLogin();
            return;
        }

        adminEmail.textContent = profile.email;
        showDashboard();
        loadOrders();
    } catch (error) {
        console.error('Error verifying admin role:', error);
        await supabase.auth.signOut();
        showLogin();
    }
}

// Show login section
function showLogin() {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
}

// Show dashboard section
function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    
    loginText.textContent = 'Signing in...';
    loginSpinner.classList.remove('hidden');
    loginError.classList.add('hidden');
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        currentUser = data.user;
        await verifyAdminRole();
    } catch (error) {
        console.error('Login error:', error);
        loginError.classList.remove('hidden');
        loginText.textContent = 'Sign In';
        loginSpinner.classList.add('hidden');
    }
});

// Handle logout
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    showLogin();
});

// Load orders from database
async function loadOrders() {
    try {
        const filterValue = statusFilter.value;
        let query = supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (filterValue) {
            query = query.eq('order_status', filterValue);
        }

        const { data: orders, error } = await query;

        if (error) throw error;

        currentOrders = orders;
        renderOrders();
        updateStats();
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function buildResumeText(resumeData) {
    if (!resumeData) return 'No resume information supplied.';

    return Object.entries(resumeData)
        .map(([key, value]) => `${key.replace(/_/g, ' ').toUpperCase()}: ${value || 'N/A'}`)
        .join('\n');
}

function openResumeDrawer(orderId) {
    const order = currentOrders.find((item) => item.id === orderId);
    if (!order || !order.resume_data) return;

    const resumeText = buildResumeText(order.resume_data);
    resumeInfoContent.innerHTML = `
        <div class="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p class="text-sm text-slate-500 dark:text-slate-300">Order</p>
            <p class="text-lg font-bold text-slate-900 dark:text-white">${order.order_ref}</p>
        </div>
        <pre id="resumeInfoText" class="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">${resumeText}</pre>
    `;

    if (resumeDrawer) {
        resumeDrawer.classList.remove('translate-x-full');
        resumeDrawer.classList.add('translate-x-0');
    }
}

function closeResumeDrawer() {
    if (resumeDrawer) {
        resumeDrawer.classList.add('translate-x-full');
        resumeDrawer.classList.remove('translate-x-0');
    }
}

if (closeResumeDrawerBtn) {
    closeResumeDrawerBtn.addEventListener('click', closeResumeDrawer);
}

if (copyResumeTextBtn) {
    copyResumeTextBtn.addEventListener('click', async () => {
        const resumeText = document.getElementById('resumeInfoText')?.textContent || '';
        try {
            await navigator.clipboard.writeText(resumeText);
            copyResumeTextBtn.textContent = 'Copied';
            setTimeout(() => {
                copyResumeTextBtn.textContent = 'Copy All as Text';
            }, 1200);
        } catch (error) {
            console.error('Copy failed:', error);
            alert('Unable to copy resume info.');
        }
    });
}

if (printResumeBtn) {
    printResumeBtn.addEventListener('click', () => {
        window.print();
    });
}

// Render orders table
function renderOrders() {
    if (currentOrders.length === 0) {
        ordersTableBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    ordersTableBody.innerHTML = currentOrders.map(order => {
        const hasResume = order.service_type === 'ATS FRIENDLY CV' || !!order.resume_data;

        return `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-semibold text-gray-800">${order.order_ref}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                ${order.service_type}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div class="flex items-center">
                    <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    ${(order.files || []).length} file${(order.files || []).length !== 1 ? 's' : ''}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="delivery-badge ${order.delivery_option === 'pickup' ? 'delivery-pickup' : 'delivery-delivery'} status-badge">
                    ${order.delivery_option === 'pickup' ? 'PICKUP' : 'DELIVERY'}
                </span>
                ${order.delivery_address ? `<div class="text-xs text-gray-500 mt-1">${order.delivery_address.substring(0, 30)}...</div>` : ''}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                ₦${Number(order.amount || 0).toLocaleString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge status-${order.order_status}">
                    ${(order.order_status || '').replace('_', ' ').toUpperCase()}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${order.payment_status === 'paid' ? 'status-completed' : 'status-received'}">
                    ${(order.payment_status || '').toUpperCase()}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex flex-wrap gap-2">
                    <button onclick="viewOrder('${order.id}')" class="text-brand hover:text-brand-secondary font-semibold">
                        View
                    </button>
                    ${hasResume ? `
                        <button onclick="viewResumeInfo('${order.id}')" class="text-indigo-600 hover:text-indigo-700 font-semibold">
                            View Resume Info
                        </button>
                    ` : ''}
                    ${order.payment_status === 'pending' && order.is_custom_quote ? `
                        <button onclick="openQuoteModal('${order.id}')" class="text-green-600 hover:text-green-700 font-semibold">
                            Quote
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

// Update statistics
function updateStats() {
    const totalOrders = currentOrders.length;
    const pendingOrders = currentOrders.filter(o => o.order_status === 'received').length;
    const processingOrders = currentOrders.filter(o => o.order_status === 'processing' || o.order_status === 'printing').length;
    const completedOrders = currentOrders.filter(o => o.order_status === 'completed').length;

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('processingOrders').textContent = processingOrders;
    document.getElementById('completedOrders').textContent = completedOrders;
}

// View order details
window.viewOrder = async function(orderId) {
    selectedOrder = currentOrders.find(o => o.id === orderId);
    
    if (!selectedOrder) return;

    orderModalContent.innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-500">Order Reference</p>
                    <p class="font-bold text-lg">${selectedOrder.order_ref}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Created</p>
                    <p class="font-semibold">${new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Service Type</p>
                    <p class="font-semibold">${selectedOrder.service_type}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Upload Channel</p>
                    <p class="font-semibold">${selectedOrder.upload_channel.toUpperCase()}</p>
                </div>
            </div>

            <div>
                <p class="text-sm text-gray-500 mb-2">Delivery Information</p>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-semibold">${selectedOrder.delivery_option === 'pickup' ? 'Store Pickup' : 'Doorstep Delivery'}</span>
                        <span class="delivery-badge ${selectedOrder.delivery_option === 'pickup' ? 'delivery-pickup' : 'delivery-delivery'} status-badge">
                            ${selectedOrder.delivery_option === 'pickup' ? 'PICKUP' : 'DELIVERY'}
                        </span>
                    </div>
                    ${selectedOrder.delivery_address ? `
                        <p class="text-sm text-gray-600">${selectedOrder.delivery_address}</p>
                    ` : `
                        <p class="text-sm text-gray-600">15 Akiogun Road, New Market, Opposite Item7go, Victoria Island</p>
                    `}
                    <p class="text-sm text-gray-500 mt-2">Delivery Fee: ₦${selectedOrder.delivery_fee.toLocaleString()}</p>
                </div>
            </div>

            <div>
                <p class="text-sm text-gray-500 mb-2">Files (${selectedOrder.files.length})</p>
                <div class="space-y-2">
                    ${selectedOrder.files.map((file, index) => `
                        <div class="bg-gray-50 rounded-lg p-4">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800">${file.name}</p>
                                    <p class="text-sm text-gray-500">${file.pages} pages × ${file.copies} copies</p>
                                </div>
                                <button onclick="downloadFile('${selectedOrder.id}', '${file.name}')" class="btn-primary text-white px-3 py-1 rounded text-sm font-semibold hover:bg-brand-secondary transition">
                                    Download
                                </button>
                            </div>
                            ${file.instructions ? `
                                <div class="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                                    <span class="font-semibold">Instructions:</span> ${file.instructions}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div>
                <p class="text-sm text-gray-500 mb-2">Order Status</p>
                <div class="flex items-center space-x-4">
                    <select id="statusUpdate" class="p-2 border rounded-lg focus:outline-none focus:border-brand">
                        <option value="received" ${selectedOrder.order_status === 'received' ? 'selected' : ''}>Received</option>
                        <option value="processing" ${selectedOrder.order_status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="printing" ${selectedOrder.order_status === 'printing' ? 'selected' : ''}>Printing</option>
                        <option value="ready" ${selectedOrder.order_status === 'ready' ? 'selected' : ''}>Ready</option>
                        <option value="out_for_delivery" ${selectedOrder.order_status === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
                        <option value="completed" ${selectedOrder.order_status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                    <button onclick="updateOrderStatus('${selectedOrder.id}')" class="btn-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-secondary transition">
                        Update Status
                    </button>
                </div>
            </div>

            <div class="border-t pt-4">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-sm text-gray-500">Payment Status</p>
                        <span class="status-badge ${selectedOrder.payment_status === 'paid' ? 'status-completed' : 'status-received'}">
                            ${selectedOrder.payment_status.toUpperCase()}
                        </span>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-500">Total Amount</p>
                        <p class="text-2xl font-bold text-brand">₦${selectedOrder.amount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            ${selectedOrder.downloaded_at ? `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p class="text-sm text-blue-800">
                        <span class="font-semibold">Files Downloaded:</span> ${new Date(selectedOrder.downloaded_at).toLocaleString()}
                        <br>
                        <span class="text-xs">3-hour deletion timer started</span>
                    </p>
                </div>
            ` : ''}
        </div>
    `;

    orderModal.classList.add('active');
};

// Close order modal
closeOrderModal.addEventListener('click', () => {
    orderModal.classList.remove('active');
});

// Download file
window.downloadFile = async function(orderId, fileName) {
    try {
        const { data, error } = await supabase.functions.invoke('download-and-mark', {
            body: {
                orderId: orderId,
                fileName: fileName
            }
        });

        if (error) throw error;

        // Open download URL in new tab
        window.open(data.downloadUrl, '_blank');
        
        // Refresh orders to show updated downloaded_at
        await loadOrders();
        
        // Refresh modal content
        viewOrder(orderId);
    } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading file. Please try again.');
    }
};

// Update order status
window.updateOrderStatus = async function(orderId) {
    const newStatus = document.getElementById('statusUpdate').value;
    
    try {
        const { error } = await supabase
            .from('orders')
            .update({ order_status: newStatus })
            .eq('id', orderId);

        if (error) throw error;

        await loadOrders();
        viewOrder(orderId);
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating order status. Please try again.');
    }
};

// Open quote modal
window.openQuoteModal = function(orderId) {
    selectedOrder = currentOrders.find(o => o.id === orderId);
    
    if (!selectedOrder) return;

    document.getElementById('quoteOrderRef').value = selectedOrder.order_ref;
    document.getElementById('quoteEmail').value = 'customer@example.com'; // You'd need to store customer email in the order
    document.getElementById('quoteAmount').value = selectedOrder.amount;
    document.getElementById('quoteNotes').value = '';
    
    quoteModal.classList.add('active');
};

// Close quote modal
closeQuoteModal.addEventListener('click', () => {
    quoteModal.classList.remove('active');
});

// Handle quote form submission
quoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const quotedAmount = parseFloat(document.getElementById('quoteAmount').value);
    const notes = document.getElementById('quoteNotes').value;
    
    try {
        // Update order with quoted amount
        const { error: updateError } = await supabase
            .from('orders')
            .update({ 
                amount: quotedAmount,
                is_custom_quote: true 
            })
            .eq('id', selectedOrder.id);

        if (updateError) throw updateError;

        // Call create-checkout function to generate payment link
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
            body: {
                orderId: selectedOrder.id,
                email: document.getElementById('quoteEmail').value,
                amount: quotedAmount
            }
        });

        if (checkoutError) throw checkoutError;

        // In a real implementation, you would send this link via email
        alert(`Quote sent successfully! Payment link: ${checkoutData.authorization_url}`);
        
        quoteModal.classList.remove('active');
        await loadOrders();
    } catch (error) {
        console.error('Error sending quote:', error);
        alert('Error sending quote. Please try again.');
    }
});

window.viewResumeInfo = function(orderId) {
    const order = currentOrders.find((item) => item.id === orderId);
    if (!order || !order.resume_data) return;
    openResumeDrawer(orderId);
};

// Status filter change
statusFilter.addEventListener('change', loadOrders);

// Refresh button
refreshBtn.addEventListener('click', loadOrders);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === orderModal) {
        orderModal.classList.remove('active');
    }
    if (e.target === quoteModal) {
        quoteModal.classList.remove('active');
    }
});

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  applyTheme(getSavedTheme());
  if (supabase) {
    checkSession();
  } else {
    showLogin();
  }
});

// Listen for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        await verifyAdminRole();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        showLogin();
    }
});
