/**
 * Extracts and normalizes pagination parameters from a request query string.
 * Returns an object ready to spread into Prisma findMany options.
 *
 * Usage:
 *   const { skip, take, page, limit } = paginate(req.query);
 *   const items = await prisma.product.findMany({ skip, take });
 */
const paginate = (query, defaults = {}) => {
  const maxLimit = defaults.maxLimit || 100;
  const defaultLimit = defaults.limit || 20;
  const defaultPage = 1;

  const page = Math.max(1, parseInt(query.page, 10) || defaultPage);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(query.limit, 10) || defaultLimit)
  );
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
};

module.exports = paginate;
