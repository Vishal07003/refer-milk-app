/**
 * Formats a product quantity into a human-readable representation.
 * Handles products with specific package size in name (e.g., Pure Desi Ghee 500ml),
 * backend product_unit/plan_unit, integers vs decimals, etc.
 *
 * @param {object} item { product_name, name, quantity, product_unit, unit }
 * @returns {string} e.g. "1 Unit (500ml)", "2 Units", "1 L", "500 ml"
 */
export const formatProductQuantity = (item = {}) => {
  const rawQty = parseFloat(item.quantity ?? 1);
  const formattedQty = Number.isInteger(rawQty) ? String(rawQty) : rawQty.toFixed(1);
  const pName = (item.product_name || item.name || '').trim();
  const lowerName = pName.toLowerCase();
  const rawUnit = (item.product_unit || item.plan_unit || item.unit || '').trim().toLowerCase();

  // If package size is indicated in product name (e.g., "Pure Desi Ghee 500ml", "Paneer 200g")
  const pkgMatch = pName.match(/(\d+\s*(?:ml|l|g|kg))/i);
  if (pkgMatch) {
    const pkgSize = pkgMatch[1].replace(/\s+/, '');
    const unitLabel = rawQty > 1 ? 'Units' : 'Unit';
    return `${formattedQty} ${unitLabel} (${pkgSize})`;
  }

  if (rawUnit === 'ml' || rawUnit.includes('milli')) {
    return `${formattedQty} ml`;
  }
  if (rawUnit === 'l' || rawUnit.includes('litre') || rawUnit.includes('liter')) {
    return `${formattedQty} L`;
  }
  if (rawUnit === 'kg' || rawUnit.includes('kilo')) {
    return `${formattedQty} kg`;
  }
  if (rawUnit === 'g' || rawUnit.includes('gram')) {
    return `${formattedQty} g`;
  }
  if (rawUnit === 'piece' || rawUnit.includes('pc') || rawUnit.includes('pack')) {
    return `${formattedQty} ${rawQty > 1 ? 'Packs' : 'Pack'}`;
  }

  // If product name indicates milk and no specific unit is set
  if (lowerName.includes('milk')) {
    return `${formattedQty} L`;
  }

  // Fallback to unit display if available, else Unit/Units
  if (rawUnit) {
    return `${formattedQty} ${rawUnit}`;
  }

  return `${formattedQty} ${rawQty > 1 ? 'Units' : 'Unit'}`;
};
