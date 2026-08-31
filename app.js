// PRINTFAS Client Application
// Main application logic for file upload, pricing, and order management

const PRINTFAS_PRICELIST = [
  { id: 'a4_bw_copy', name: 'A4 PHOTOCOPY BLACK AND WHITE', price: 100, unit: 'page', category: 'A4', type: 'standard' },
  { id: 'a4_bw_print', name: 'A4 PRINT BLACK AND WHITE', price: 400, unit: 'page', category: 'A4', type: 'standard' },
  { id: 'a4_col_copy', name: 'A4 PHOTOCOPY COLOURED', price: 200, unit: 'page', category: 'A4', type: 'standard' },
  { id: 'a4_col_print', name: 'A4 PRINT COLOURED', price: 500, unit: 'page', category: 'A4', type: 'standard' },
  { id: 'a4_bf_bw', name: 'A4 PRINTING BACK & FRONT (B&W)', price: 600, unit: 'page', category: 'A4', type: 'standard' },
  { id: 'a4_bf_col', name: 'A4 PRINTING BACK & FRONT (COLOURED)', price: 800, unit: 'page', category: 'A4', type: 'standard' },
  { id: 'a3_bw_copy', name: 'A3 PHOTOCOPY BLACK AND WHITE', price: 200, unit: 'page', category: 'A3', type: 'standard' },
  { id: 'a3_bw_print', name: 'A3 PRINT BLACK AND WHITE', price: 800, unit: 'page', category: 'A3', type: 'standard' },
  { id: 'a3_col_copy', name: 'A3 PHOTOCOPY COLOURED', price: 400, unit: 'page', category: 'A3', type: 'standard' },
  { id: 'a3_col_print', name: 'A3 PRINT COLOURED', price: 1000, unit: 'page', category: 'A3', type: 'standard' },
  { id: 'a3_bf_bw', name: 'A3 PRINTING BACK & FRONT (B&W)', price: 1200, unit: 'page', category: 'A3', type: 'standard' },
  { id: 'a3_bf_col', name: 'A3 PRINTING BACK & FRONT (COLOURED)', price: 1600, unit: 'page', category: 'A3', type: 'standard' },
  { id: 'lam_id', name: 'ID LAMINATING', price: 500, unit: 'item', category: 'ID', type: 'addon' },
  { id: 'lam_a4', name: 'A4 LAMINATING', price: 1000, unit: 'page', category: 'A4', type: 'addon' },
  { id: 'lam_a3', name: 'A3 LAMINATING', price: 1500, unit: 'page', category: 'A3', type: 'addon' },
  { id: 'bind_mat', name: 'BINDING MATERIAL', price: 200, unit: 'item', category: 'General', type: 'addon' },
  { id: 'bind_a4_100', name: 'A4 BIND (1-100 PAGES)', price: 1000, unit: 'copy', category: 'A4', type: 'addon' },
  { id: 'bind_a4_200', name: 'A4 BIND (101-200 PAGES)', price: 2500, unit: 'copy', category: 'A4', type: 'addon' },
  { id: 'bind_a4_400', name: 'A4 BIND (201-400 PAGES)', price: 3000, unit: 'copy', category: 'A4', type: 'addon' },
  { id: 'bind_a3_100', name: 'A3 BIND (1-100 PAGES)', price: 2000, unit: 'copy', category: 'A3', type: 'addon' },
  { id: 'bind_a3_200', name: 'A3 BIND (101-200 PAGES)', price: 3000, unit: 'copy', category: 'A3', type: 'addon' },
  { id: 'pass_35x45', name: 'PASSPORT PHOTO (8pcs 35 x 45mm)', price: 2000, unit: 'set', category: 'Photo', type: 'standard' },
  { id: 'pass_visa', name: 'PASSPORT PHOTO (VISA)', price: 2000, unit: 'set', category: 'Photo', type: 'standard' },
  { id: 'pic_4x6', name: 'FULL PICTURE PRINTING (4 x 6 inches)', price: 2000, unit: 'photo', category: 'Photo', type: 'standard' },
  { id: 'ats_cv', name: 'ATS FRIENDLY CV', price: 5000, unit: 'doc', category: 'Service', type: 'form_required' },
  { id: 'scan_page', name: 'SCANNING PER PAGE', price: 500, unit: 'page', category: 'Service', type: 'standard' },
  { id: 'type_page', name: 'TYPING PER PAGE', price: 1000, unit: 'page', category: 'Service', type: 'standard' },
  { id: 'type_quote', name: 'QUOTATION TYPING', price: 1000, unit: 'doc', category: 'Service', type: 'standard' },
  { id: 'type_cv', name: 'CV (CURRUCULUM VITAE)', price: 1000, unit: 'doc', category: 'Service', type: 'standard' },
  { id: 'doc_edit', name: 'DOCUMENT EDITING (WITHOUT PRINTING)', price: 500, unit: 'doc', category: 'Service', type: 'standard' },
  { id: 'gfx_design', name: 'GRAPHIC DESIGN', price: 3000, unit: 'design', category: 'Service', type: 'standard' },
  { id: 'inv_design', name: 'INVOICE DESIGN', price: 2000, unit: 'design', category: 'Service', type: 'standard' },
  { id: 'lh_design', name: 'LETTERHEAD DESIGN', price: 2000, unit: 'design', category: 'Service', type: 'standard' },
  { id: 'id_design_print', name: 'ID CARD DESIGN & PRINT', price: 4000, unit: 'card', category: 'ID', type: 'standard' },
  { id: 'id_print_bw', name: 'ID CARD PRINT (B&W BACK)', price: 3000, unit: 'card', category: 'ID', type: 'standard' },
  { id: 'id_print_col', name: 'ID CARD PRINT (COLORED BACK)', price: 6000, unit: 'card', category: 'ID', type: 'standard' },
  { id: 'chg_ownership', name: 'CHANGE OF OWNERSHIP', price: 3000, unit: 'service', category: 'Service', type: 'standard' },
  { id: 'online_reg', name: 'ONLINE REGISTRATION', price: 5000, unit: 'service', category: 'Service', type: 'standard' },
  { id: 'res_check', name: 'RESULT CHECKING', price: 1000, unit: 'service', category: 'Service', type: 'standard' },
  { id: 'custom_flex', name: 'FLEX/STICKER', price: 0, unit: 'quote', category: 'Custom', type: 'custom' },
  { id: 'custom_brochure', name: 'BROCHURE', price: 0, unit: 'quote', category: 'Custom', type: 'custom' },
  { id: 'custom_flyer', name: 'FLYER', price: 0, unit: 'quote', category: 'Custom', type: 'custom' },
  { id: 'custom_other', name: 'OTHER CUSTOM JOB', price: 0, unit: 'quote', category: 'Custom', type: 'custom' }
];

const SUPABASE_URL = (window.__PRINTFAS_CONFIG__ && window.__PRINTFAS_CONFIG__.supabaseUrl) || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = (window.__PRINTFAS_CONFIG__ && window.__PRINTFAS_CONFIG__.supabaseAnonKey) || 'placeholder-key';

const BUSINESS_INFO = {
  name: "PRINTFAS",
  bankAccounts: [
    { bank: "FCMB", number: "2008391004", name: "Corporate PC Ltd" },
    { bank: "First Bank", number: "2015124252", name: "Corporate PC Ltd" }
  ]
};

const supabaseClient = (window.supabase && typeof window.supabase.createClient === 'function' && SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'placeholder-key')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!supabaseClient) {
  console.warn('Supabase is not configured. The storefront will run in demo mode without database submission.');
}

let selectedService = null;
let uploadedFiles = [];
let finishingOptions = {};
let deliveryFee = 0;
let totalAmount = 0;
let resumeData = null;

const atsCvForm = document.getElementById('atsCvForm');
const atsCvModal = document.getElementById('atsCvModal');
const serviceSelect = document.getElementById('serviceSelect');

function populateServiceDropdown() {
  if (!serviceSelect) return;

  serviceSelect.innerHTML = PRINTFAS_PRICELIST.map((item) => `
    <option value="${item.id}">${item.name} ${item.price > 0 ? `- ₦${item.price.toLocaleString()}` : '- Quote required'}</option>
  `).join('');

  serviceSelect.addEventListener('change', (event) => {
    const value = event.target.value;
    const picked = PRINTFAS_PRICELIST.find((service) => service.id === value) || null;
    selectedService = picked ? {
      id: picked.id,
      name: picked.name,
      price: picked.price,
      size: picked.category === 'A4' ? 'a4' : picked.category === 'A3' ? 'a3' : 'none',
      type: picked.type
    } : null;

    if (selectedService && selectedService.id === 'ats_cv') {
      openAtsCvModal();
    }

    updateFinishingOptions();
    calculateTotal();
  });
}

function getSavedTheme() {
  const saved = localStorage.getItem('theme');
  console.log('Saved theme from localStorage:', saved);
  if (saved === 'dark' || saved === 'light') return saved;

  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  console.log('System prefers dark:', systemPrefersDark);
  return systemPrefersDark ? 'dark' : 'light';
}

function applyTheme(theme) {
  console.log('Applying theme:', theme);
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  console.log('Dark class on html:', document.documentElement.classList.contains('dark'));
  console.log('Dark class on body:', document.body.classList.contains('dark'));

  const themeToggleSun = document.getElementById('themeToggleSun');
  const themeToggleMoon = document.getElementById('themeToggleMoon');
  
  console.log('Sun icon found:', !!themeToggleSun, 'Moon icon found:', !!themeToggleMoon);
  
  if (themeToggleSun && themeToggleMoon) {
    themeToggleSun.classList.toggle('hidden', !isDark);
    themeToggleMoon.classList.toggle('hidden', isDark);
  }
}

function bindThemeToggle() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  console.log('Dark mode toggle button found:', !!darkModeToggle);
  if (!darkModeToggle) {
    console.error('Dark mode toggle button not found!');
    return;
  }

  darkModeToggle.addEventListener('click', () => {
    console.log('Dark mode toggle clicked');
    const currentIsDark = document.documentElement.classList.contains('dark');
    console.log('Current dark state:', currentIsDark);
    const nextTheme = currentIsDark ? 'light' : 'dark';
    console.log('Switching to:', nextTheme);
    applyTheme(nextTheme);
  });
}

function initPriceListDarkMode() {
  const priceListDarkModeToggle = document.getElementById('priceListDarkModeToggle');
  const priceListSunIcon = document.getElementById('priceListSunIcon');
  const priceListMoonIcon = document.getElementById('priceListMoonIcon');
  const priceListContent = document.getElementById('priceListContent');

  if (!priceListDarkModeToggle || !priceListContent) return;

  const savedMode = localStorage.getItem('priceListDarkMode');
  if (savedMode === 'true') {
    priceListContent.classList.add('dark');
    if (priceListSunIcon) priceListSunIcon.classList.remove('hidden');
    if (priceListMoonIcon) priceListMoonIcon.classList.add('hidden');
  }

  priceListDarkModeToggle.addEventListener('click', () => {
    priceListContent.classList.toggle('dark');
    const isDark = priceListContent.classList.contains('dark');
    if (priceListSunIcon) priceListSunIcon.classList.toggle('hidden', !isDark);
    if (priceListMoonIcon) priceListMoonIcon.classList.toggle('hidden', isDark);
    localStorage.setItem('priceListDarkMode', String(isDark));
  });
}

function openAtsCvModal() {
  if (!atsCvModal) return;
  atsCvModal.classList.remove('hidden');
  atsCvModal.classList.add('flex');
}

function closeAtsCvModal() {
  if (!atsCvModal) return;
  atsCvModal.classList.add('hidden');
  atsCvModal.classList.remove('flex');
}

function validateResumeFields() {
  const required = [
    'full_name',
    'phone',
    'email',
    'location',
    'target_job_title',
    'linkedin_url',
    'portfolio_link',
    'work_experience',
    'education',
    'skills',
    'references'
  ];

  const form = atsCvForm;
  if (!form) return false;

  return required.every((field) => {
    const fieldEl = form.querySelector(`[name="${field}"]`);
    return fieldEl && String(fieldEl.value || '').trim().length > 0;
  });
}

function buildResumePayload() {
  if (!atsCvForm) return null;

  const formData = new FormData(atsCvForm);
  const payload = {};
  formData.forEach((value, key) => {
    if (key === 'resume_file') return;
    payload[key] = String(value).trim();
  });

  const resumeFile = document.getElementById('resumeFile');
  if (resumeFile && resumeFile.files && resumeFile.files[0]) {
    payload.resume_file_name = resumeFile.files[0].name;
  }

  return payload;
}

async function detectPdfPageCount(file) {
  if (!file || !file.name || !file.name.toLowerCase().endsWith('.pdf')) {
    return 1;
  }

  try {
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib || !pdfjsLib.getDocument) {
      return 1;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages || 1;
  } catch (error) {
    console.warn('Unable to auto-detect PDF page count for', file.name, error);
    return 1;
  }
}

if (atsCvForm) {
  atsCvForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateResumeFields()) {
      alert('Please complete all ATS CV form fields before continuing.');
      return;
    }

    resumeData = buildResumePayload();
    closeAtsCvModal();
    calculateTotal();
  });
}

const closeAtsModalBtn = document.getElementById('closeAtsModal');
if (closeAtsModalBtn) {
  closeAtsModalBtn.addEventListener('click', closeAtsCvModal);
}

function updateFinishingOptions() {
  const finishingOptions = document.querySelectorAll('.finishing-option');

  if (!selectedService || selectedService.size === 'none') {
    finishingOptions.forEach((opt) => {
      opt.disabled = true;
      const wrapper = opt.closest('label');
      if (wrapper) wrapper.classList.add('opacity-50', 'cursor-not-allowed');
    });
    return;
  }

  finishingOptions.forEach((opt) => {
    const optSize = opt.dataset.size;
    if (optSize === selectedService.size) {
      opt.disabled = false;
      const wrapper = opt.closest('label');
      if (wrapper) wrapper.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
      opt.disabled = true;
      opt.checked = false;
      const wrapper = opt.closest('label');
      if (wrapper) wrapper.classList.add('opacity-50', 'cursor-not-allowed');
    }
  });
}

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileQueue = document.getElementById('fileQueue');
const fileList = document.getElementById('fileList');
const largeFileNotice = document.getElementById('largeFileNotice');

if (dropZone) {
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(event.dataTransfer.files);
  });
}

if (fileInput) {
  fileInput.addEventListener('change', (event) => {
    handleFiles(event.target.files);
  });
}

if (document.getElementById('addAnotherFile')) {
  document.getElementById('addAnotherFile').addEventListener('click', () => fileInput.click());
}

async function handleFiles(files) {
  const maxSize = 25 * 1024 * 1024;
  let hasLargeFile = false;
  const newFiles = [];

  for (const file of Array.from(files)) {
    if (file.size > maxSize) {
      hasLargeFile = true;
    }

    const detectedPages = await detectPdfPageCount(file);
    newFiles.push({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2),
      pages: detectedPages,
      copies: 1,
      instructions: ''
    });
  }

  uploadedFiles.push(...newFiles);

  if (hasLargeFile && largeFileNotice) {
    largeFileNotice.classList.remove('hidden');
  }

  renderFileQueue();
  calculateTotal();
}

function renderFileQueue() {
  if (!fileQueue || !fileList) return;

  if (uploadedFiles.length === 0) {
    fileQueue.classList.add('hidden');
    return;
  }

  fileQueue.classList.remove('hidden');
  fileList.innerHTML = '';

  uploadedFiles.forEach((fileData, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'bg-gray-50 dark:bg-slate-800 rounded-lg p-4 border dark:border-slate-700';
    fileItem.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <div class="flex-1">
          <div class="font-semibold text-gray-800 dark:text-white">${fileData.name}</div>
          <div class="text-sm text-gray-500 dark:text-slate-300">${fileData.size} MB</div>
          <div class="text-xs text-blue-600 dark:text-blue-300">Auto-detected: ${fileData.pages} page(s)</div>
        </div>
        <button type="button" class="text-red-500 hover:text-red-700" onclick="removeFile(${index})">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label class="block text-xs text-gray-600 dark:text-slate-300 mb-1">Pages</label>
          <input type="number" min="1" value="${fileData.pages}" onchange="updateFileData(${index}, 'pages', this.value)" class="w-full p-2 border rounded text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700">
        </div>
        <div>
          <label class="block text-xs text-gray-600 dark:text-slate-300 mb-1">Copies</label>
          <input type="number" min="1" value="${fileData.copies}" onchange="updateFileData(${index}, 'copies', this.value)" class="w-full p-2 border rounded text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700">
        </div>
      </div>
      <div>
        <label class="block text-xs text-gray-600 dark:text-slate-300 mb-1">Admin Instructions</label>
        <input type="text" placeholder="Leave blank to print all pages by default" value="${fileData.instructions}" onchange="updateFileData(${index}, 'instructions', this.value)" class="w-full p-2 border rounded text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700">
      </div>
    `;
    fileList.appendChild(fileItem);
  });
}

window.removeFile = function(index) {
  uploadedFiles.splice(index, 1);
  renderFileQueue();
  calculateTotal();
};

window.updateFileData = function(index, field, value) {
  uploadedFiles[index][field] = field === 'pages' || field === 'copies' ? parseInt(value) : value;
  calculateTotal();
};

document.querySelectorAll('.finishing-option').forEach((opt) => {
  opt.addEventListener('change', () => {
    calculateTotal();
  });
});

document.querySelectorAll('input[name="delivery"]').forEach((radio) => {
  radio.addEventListener('change', (event) => {
    const deliveryAddress = document.getElementById('deliveryAddress');
    if (event.target.value === 'delivery') {
      deliveryAddress.classList.remove('hidden');
      deliveryFee = 1000;
    } else {
      deliveryAddress.classList.add('hidden');
      deliveryFee = 0;
    }
    calculateTotal();
  });
});

document.querySelectorAll('input[name="payment"]').forEach((radio) => {
  radio.addEventListener('change', (event) => {
    const bankDetails = document.getElementById('bankDetails');
    if (event.target.value === 'bank') {
      bankDetails.classList.remove('hidden');
      renderBankAccounts();
    } else {
      bankDetails.classList.add('hidden');
    }
  });
});

function renderBankAccounts() {
  const bankAccountsList = document.getElementById('bankAccountsList');
  if (!bankAccountsList) return;

  bankAccountsList.innerHTML = BUSINESS_INFO.bankAccounts.map((account) => `
    <div class="flex justify-between">
      <span class="text-gray-600 dark:text-slate-300">${account.bank}:</span>
      <span class="font-mono font-semibold text-gray-800 dark:text-white">${account.number}</span>
    </div>
  `).join('') + `
    <div class="text-gray-600 dark:text-slate-300 text-xs mt-2">Account Name: ${BUSINESS_INFO.bankAccounts[0].name}</div>
  `;
}

function calculateTotal() {
  let filesCost = 0;
  let finishingCost = 0;

  if (selectedService && selectedService.id === 'ats_cv') {
    totalAmount = selectedService.price;
    document.getElementById('filesCost').textContent = '₦0';
    document.getElementById('finishingCost').textContent = '₦0';
    document.getElementById('deliveryCost').textContent = '₦0';
    document.getElementById('totalCost').textContent = `₦${totalAmount.toLocaleString()}`;
    return;
  }

  if (selectedService) {
    uploadedFiles.forEach((file) => {
      filesCost += selectedService.price * file.pages * file.copies;
    });
  }

  document.querySelectorAll('.finishing-option:checked').forEach((opt) => {
    if (!opt.disabled) {
      finishingCost += parseInt(opt.dataset.price, 10);
    }
  });

  totalAmount = filesCost + finishingCost + deliveryFee;

  document.getElementById('filesCost').textContent = `₦${filesCost.toLocaleString()}`;
  document.getElementById('finishingCost').textContent = `₦${finishingCost.toLocaleString()}`;
  document.getElementById('deliveryCost').textContent = `₦${deliveryFee.toLocaleString()}`;
  document.getElementById('totalCost').textContent = `₦${totalAmount.toLocaleString()}`;
}

document.getElementById('submitOrder').addEventListener('click', async () => {
  if (!selectedService) {
    alert('Please select a service');
    return;
  }

  if (selectedService.id === 'ats_cv') {
    if (!resumeData || !validateResumeFields()) {
      alert('Please complete the ATS CV information before placing this order.');
      openAtsCvModal();
      return;
    }
  }

  if (selectedService.id !== 'ats_cv' && uploadedFiles.length === 0) {
    alert('Please upload at least one file');
    return;
  }

  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;

  if (!fullName || !email || !phone) {
    alert('Please fill in all contact information');
    return;
  }

  const deliveryOption = document.querySelector('input[name="delivery"]:checked').value;
  const deliveryAddress = deliveryOption === 'delivery' ? document.getElementById('addressInput').value : null;
  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

  if (deliveryOption === 'delivery' && !deliveryAddress) {
    alert('Please enter your delivery address');
    return;
  }

  const submitBtn = document.getElementById('submitOrder');
  const submitText = document.getElementById('submitText');
  const submitSpinner = document.getElementById('submitSpinner');

  submitBtn.disabled = true;
  submitText.textContent = 'Processing...';
  submitSpinner.classList.remove('hidden');

  try {
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert([{
        service_type: selectedService.name,
        is_custom_quote: false,
        upload_channel: 'web',
        files: uploadedFiles.map((fileData) => ({
          name: fileData.name,
          pages: fileData.pages,
          copies: fileData.copies,
          instructions: (fileData.instructions || '').trim() || 'Print all pages by default'
        })),
        delivery_option: deliveryOption,
        delivery_address: deliveryAddress,
        delivery_fee: deliveryFee,
        amount: totalAmount,
        payment_status: 'pending',
        order_status: 'received',
        resume_data: selectedService.id === 'ats_cv' ? resumeData : null
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderRef = order.order_ref;
    const uploadPromises = uploadedFiles.map(async (fileData) => {
      const timestamp = Date.now();
      const filePath = `orders/${orderRef}/${timestamp}_${fileData.name}`;
      const { error: uploadError } = await supabaseClient.storage.from('print-jobs').upload(filePath, fileData.file);
      if (uploadError) throw uploadError;

      const normalizedInstructions = (fileData.instructions || '').trim();

      return {
        name: fileData.name,
        path: filePath,
        pages: fileData.pages,
        copies: fileData.copies,
        instructions: normalizedInstructions || 'Print all pages by default'
      };
    });

    const uploadedFileData = await Promise.all(uploadPromises);

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ files: uploadedFileData })
      .eq('id', order.id);

    if (updateError) throw updateError;

    if (paymentMethod === 'paystack') {
      const { data: checkoutData, error: checkoutError } = await supabaseClient.functions.invoke('create-checkout', {
        body: {
          orderId: order.id,
          email,
          amount: totalAmount
        }
      });

      if (checkoutError) throw checkoutError;
      window.location.href = checkoutData.authorization_url;
    } else {
      showSuccessModal(orderRef);
    }
  } catch (error) {
    console.error('Order submission error:', error);
    alert('Error submitting order. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitText.textContent = 'Submit Order';
    submitSpinner.classList.add('hidden');
  }
});

function showSuccessModal(orderRef) {
  document.getElementById('orderRef').textContent = orderRef;
  document.getElementById('successModal').classList.remove('hidden');
  document.getElementById('successModal').classList.add('flex');
}

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('successModal').classList.add('hidden');
  document.getElementById('successModal').classList.remove('flex');
  location.reload();
});

document.getElementById('trackOrder').addEventListener('click', async () => {
  const orderRef = document.getElementById('orderRefInput').value.trim();

  if (!orderRef) {
    alert('Please enter an order reference');
    return;
  }

  try {
    const { data: order, error } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('order_ref', orderRef)
      .single();

    if (error || !order) {
      alert('Order not found');
      return;
    }

    renderTrackingResult(order);
  } catch (error) {
    console.error('Tracking error:', error);
    alert('Error tracking order. Please try again.');
  }
});

function renderTrackingResult(order) {
  const trackingResult = document.getElementById('trackingResult');
  const trackingContent = document.getElementById('trackingContent');

  const statusSteps = [
    { key: 'received', label: 'Received' },
    { key: 'processing', label: 'Processing' },
    { key: 'printing', label: 'Printing' },
    { key: 'ready', label: 'Ready' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'completed', label: 'Completed' }
  ];

  const currentStatusIndex = statusSteps.findIndex((step) => step.key === order.order_status);

  let expiredWarning = '';
  if (order.downloaded_at) {
    const downloadedTime = new Date(order.downloaded_at);
    const expirationTime = new Date(downloadedTime.getTime() + 3 * 60 * 60 * 1000);
    if (new Date() > expirationTime) {
      expiredWarning = `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <p class="text-yellow-800 font-semibold">⚠️ File Access Expired</p>
          <p class="text-yellow-700 text-sm mt-1">The 3-hour download window has expired. Please contact support to re-upload your files.</p>
          <a href="https://wa.me/2348000000000?text=Re-upload request for order ${order.order_ref}" class="inline-block mt-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition">
            Contact Support
          </a>
        </div>
      `;
    }
  }

  trackingContent.innerHTML = `
    <div class="mb-6">
      <div class="flex justify-between items-center mb-4">
        <div>
          <p class="text-sm text-gray-500">Order Reference</p>
          <p class="font-bold text-lg">${order.order_ref}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-500">Status</p>
          <span class="status-badge text-white px-3 py-1 rounded-full text-sm font-semibold">${(order.order_status || '').replace('_', ' ').toUpperCase()}</span>
        </div>
      </div>

      <div class="flex justify-between items-center mb-4">
        <div>
          <p class="text-sm text-gray-500">Payment Status</p>
          <p class="font-semibold">${(order.payment_status || '').toUpperCase()}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-500">Total Amount</p>
          <p class="font-bold text-brand">₦${Number(order.amount || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>

    <div class="mb-6">
      <h4 class="font-semibold text-gray-800 mb-3">Order Progress</h4>
      <div class="flex justify-between items-center">
        ${statusSteps.map((step, index) => {
          const isCompleted = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          return `
            <div class="step-indicator ${isCompleted ? 'completed' : ''} flex flex-col items-center flex-1">
              <div class="w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'} ${isCurrent ? 'ring-4 ring-blue-200' : ''}">
                ${isCompleted ? '✓' : index + 1}
              </div>
              <span class="text-xs mt-2 ${isCurrent ? 'font-semibold text-brand' : 'text-gray-500'}">${step.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="mb-6">
      <h4 class="font-semibold text-gray-800 mb-3">Order Details</h4>
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gray-500">Service</p>
            <p class="font-semibold">${order.service_type || 'Service'}</p>
          </div>
          <div>
            <p class="text-gray-500">Delivery</p>
            <p class="font-semibold">${order.delivery_option === 'pickup' ? 'Store Pickup' : 'Doorstep Delivery'}</p>
          </div>
          ${order.delivery_address ? `
            <div class="col-span-2">
              <p class="text-gray-500">Delivery Address</p>
              <p class="font-semibold">${order.delivery_address}</p>
            </div>
          ` : ''}
        </div>

        <div class="mt-4">
          <p class="text-gray-500 text-sm mb-2">Files (${(order.files || []).length})</p>
          <div class="space-y-2">
            ${(order.files || []).map((file) => `
              <div class="flex justify-between items-center bg-white p-2 rounded">
                <span class="text-sm">${file.name}</span>
                <span class="text-xs text-gray-500">${file.pages} pages × ${file.copies} copies</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    ${expiredWarning}
  `;

  trackingResult.classList.remove('hidden');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('ServiceWorker registration successful'))
      .catch((error) => console.log('ServiceWorker registration failed:', error));
  });
}

window.addEventListener('DOMContentLoaded', () => {
  applyTheme(getSavedTheme());
  populateServiceDropdown();
  bindThemeToggle();
  initPriceListDarkMode();
  updateFinishingOptions();
  calculateTotal();
});
