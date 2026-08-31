export const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
export const PAYSTACK_PUBLIC_KEY = "pk_test_REPLACE_WITH_PAYSTACK_PUBLIC_KEY";

export const BUSINESS = {
  name: "PRINTFAS",
  poweredBy: "Corporate PC Ltd",
  tagline: "Express Document Printing",
  address: "15 Akiogun Road, New Market, Opposite Item7go, Victoria Island / Oniru, Lagos",
  shortAddress: "15 Akiogun Road, New Market, Opposite Item7go, Victoria Island",
  email: "printfas@corporatepcltd.com",
  whatsapp: "2348000000000",
  bankAccounts: [
    { bank: "FCMB", number: "2008391004", name: "Corporate PC Ltd" },
    { bank: "First Bank", number: "2015124252", name: "Corporate PC Ltd" }
  ]
};

export const SERVICES = [
  { name: "A4 Photocopy Black and White", price: 100, custom: false },
  { name: "A4 Print Black and White", price: 400, custom: false },
  { name: "A4 Photocopy Coloured", price: 200, custom: false },
  { name: "A4 Print Coloured", price: 500, custom: false },
  { name: "A3 Photocopy Black and White", price: 200, custom: false },
  { name: "A3 Print Black and White", price: 800, custom: false },
  { name: "A3 Photocopy Coloured", price: 400, custom: false },
  { name: "A3 Print Coloured", price: 1000, custom: false },
  { name: "Scanning Per Page", price: 500, custom: false },
  { name: "A4 Laminating", price: 1000, custom: false },
  { name: "A3 Laminating", price: 1500, custom: false },
  { name: "ID Laminating", price: 500, custom: false },
  { name: "A4 Bind (1-100 Pages)", price: 1000, custom: false },
  { name: "A4 Bind (101-200 Pages)", price: 2500, custom: false },
  { name: "A4 Bind (201-400 Pages)", price: 3000, custom: false },
  { name: "A3 Bind (1-100 Pages)", price: 2000, custom: false },
  { name: "A3 Bind (101-200 Pages)", price: 3000, custom: false },
  { name: "Passport Photo (8pcs 35 x 45mm)", price: 2000, custom: false },
  { name: "Passport Photo (Visa)", price: 2000, custom: false },
  { name: "Full Picture Printing (4 x 6 inches)", price: 2000, custom: false },
  { name: "Typing Per Page", price: 1000, custom: false },
  { name: "Quotation Typing", price: 1000, custom: false },
  { name: "CV (Curriculum Vitae)", price: 1000, custom: false },
  { name: "Document Editing (Without Printing)", price: 500, custom: false },
  { name: "Graphic Design", price: 3000, custom: false },
  { name: "Invoice Design", price: 2000, custom: false },
  { name: "ID Card Design & Print", price: 4000, custom: false },
  { name: "ID Card Print (B&W Back)", price: 3000, custom: false },
  { name: "ID Card Print (Colored Back)", price: 6000, custom: false },
  { name: "Change of Ownership", price: 3000, custom: false },
  { name: "Online Registration", price: 5000, custom: false },
  { name: "Result Checking", price: 1000, custom: false },
  { name: "Binding Material", price: 200, custom: false },
  { name: "Letterhead Design", price: 2000, custom: false },
  { name: "A4 Printing Back & Front (B&W)", price: 600, custom: false },
  { name: "A4 Printing Back & Front (Coloured)", price: 800, custom: false },
  { name: "A3 Printing Back & Front (B&W)", price: 1200, custom: false },
  { name: "A3 Printing Back & Front (Coloured)", price: 1600, custom: false },
  { name: "Flex/Sticker", price: 0, custom: true },
  { name: "Brochure", price: 0, custom: true },
  { name: "Flyer", price: 0, custom: true },
  { name: "Other Custom Job", price: 0, custom: true }
];

export const ADD_ON_SERVICES = [
  { id: "photocopy", name: "Photocopy after printing", price: 100, pricedPerPage: true, sizes: ["A4", "A3"] },
  { id: "a4-laminate", name: "A4 Laminating", price: 1000, pricedPerPage: true, sizes: ["A4"] },
  { id: "a3-laminate", name: "A3 Laminating", price: 1500, pricedPerPage: true, sizes: ["A3"] },
  { id: "a4-bind", name: "A4 Binding", price: 1000, pricedPerPage: false, sizes: ["A4"] },
  { id: "a3-bind", name: "A3 Binding", price: 2000, pricedPerPage: false, sizes: ["A3"] }
];

export const DELIVERY_FEE = 2500;
