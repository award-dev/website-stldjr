// Booking/quote payload validation. Errors are keyed by field and written
// for customers, because the UI shows them verbatim.

const clean = (v, max = 200) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "");
const cleanBlock = (v, max = 2000) => (typeof v === "string" ? v.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim().slice(0, max) : "");

export const PROPERTY_TYPES = ["house", "apartment", "condo", "business", "construction", "other"];
export const STAIRS = ["none", "some", "many"];
export const CARRY = ["close", "medium", "far"];

export function validateBooking(input, { serviceIds, loadIds, requireSlot = true, maxPhotos = 10 }) {
  const errors = {};
  const b = input && typeof input === "object" ? input : {};

  const service = clean(b.service, 40);
  if (!serviceIds.includes(service)) errors.service = "Choose what you need done.";

  const load = clean(b.load, 40);
  if (!loadIds.includes(load)) errors.load = "Choose a load size.";

  const address = clean(b.address, 160);
  if (!/\d/.test(address) || address.length < 5) errors.address = "Enter the street address, including the house number.";
  const city = clean(b.city, 80);
  if (city.length < 2) errors.city = "Enter the city.";
  const zip = clean(b.zip, 10);
  if (!/^\d{5}(-\d{4})?$/.test(zip)) errors.zip = "Enter a 5-digit ZIP code.";
  const propertyType = clean(b.propertyType, 20);
  if (!PROPERTY_TYPES.includes(propertyType)) errors.propertyType = "Choose a property type.";

  const description = cleanBlock(b.description, 2000);
  if (description.length < 3) errors.description = "Tell us a little about what's going.";

  const stairs = STAIRS.includes(b.stairs) ? b.stairs : "none";
  const carry = CARRY.includes(b.carry) ? b.carry : "close";

  const name = clean(b.name, 80);
  if (name.length < 2) errors.name = "Enter your name.";
  const phoneDigits = clean(b.phone, 30).replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (phoneDigits.length !== 10) errors.phone = "Enter a 10-digit phone number.";
  const email = clean(b.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Enter an email address we can send your confirmation to.";

  let date = null;
  let windowId = null;
  if (requireSlot) {
    date = clean(b.date, 10);
    windowId = clean(b.windowId, 20);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !windowId) errors.slot = "Choose a day and arrival window.";
  }

  const photos = Array.isArray(b.photos) ? b.photos.filter((p) => typeof p === "string" && /^[A-Za-z0-9-]{8,64}$/.test(p)).slice(0, maxPhotos) : [];

  const value = {
    service,
    load,
    address,
    city,
    zip: zip.slice(0, 5),
    propertyType,
    description,
    items: cleanBlock(b.items, 1000),
    demolitionDetails: cleanBlock(b.demolitionDetails, 1000),
    access: cleanBlock(b.access, 600),
    stairs,
    carry,
    special: cleanBlock(b.special, 600),
    name,
    phone: phoneDigits,
    email,
    date,
    windowId,
    photos,
    acceptedTerms: b.acceptedTerms === true,
  };
  if (requireSlot && !value.acceptedTerms) errors.acceptedTerms = "Please confirm you've read how pricing works.";

  return { ok: Object.keys(errors).length === 0, errors, value };
}

export function formatPhone(digits) {
  return digits && digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : digits;
}
