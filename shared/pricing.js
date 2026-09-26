// Pricing helpers shared by the site and the booking server.

/** The minimum-pickup option, shaped like a load (no truck volume). */
export function minimumLoad(pricing) {
  return pricing.minimum ? { ...pricing.minimum, fraction: 0.06, cubicYards: null, minimum: true } : null;
}

export function getLoad(pricing, id) {
  return pricing.loads.find((l) => l.id === id) || (pricing.minimum?.id === id ? minimumLoad(pricing) : null);
}

export function formatPrice(pricing, load) {
  if (!load || typeof load.price !== "number") return null;
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: pricing.currency || "USD",
    maximumFractionDigits: 0,
  }).format(load.price);
  return money;
}

/** Customer-facing price line for a load: "From $X" or the on-site fallback. */
export function priceLine(pricing, load) {
  const money = formatPrice(pricing, load);
  if (!money) return { amount: null, label: "Priced on-site", note: "Confirmed before we load" };
  if (load.minimum || load.id === "minimum") return { amount: money, label: money, note: "Minimum pickup — a few small items" };
  return {
    amount: money,
    label: pricing.priceMode === "from" ? `From ${money}` : money,
    note: pricing.priceMode === "from" ? "Starting price for this load" : "Flat price for this load",
  };
}

export function formatYards(n) {
  if (typeof n !== "number") return "";
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, "");
}
