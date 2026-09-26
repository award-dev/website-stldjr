// Pricing helpers shared by the site and the booking server.

export function getLoad(pricing, id) {
  return pricing.loads.find((l) => l.id === id) || null;
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
  return {
    amount: money,
    label: pricing.priceMode === "from" ? `From ${money}` : money,
    note: pricing.priceMode === "from" ? "Starting price for this load" : "Flat price for this load",
  };
}

export function formatYards(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, "");
}
