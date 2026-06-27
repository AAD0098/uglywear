/**
 * Factory that generates standard CRUD service methods for any Prisma model.
 * Eliminates duplicated data-access boilerplate across controllers.
 *
 * Usage:
 *   const productService = createCrudService(prisma.product);
 *   const products = await productService.findMany({ where: { isActive: true } });
 */
const AppError = require("./AppError");

const createCrudService = (model) => ({
  async findMany(options = {}) {
    return model.findMany(options);
  },

  async findById(id, options = {}) {
    const record = await model.findUnique({ where: { id }, ...options });
    if (!record) {
      throw AppError.notFound("Record not found");
    }
    return record;
  },

  async create(data, options = {}) {
    return model.create({ data, ...options });
  },

  async update(id, data, options = {}) {
    const record = await model.findUnique({ where: { id } });
    if (!record) {
      throw AppError.notFound("Record not found");
    }
    return model.update({ where: { id }, data, ...options });
  },

  async delete(id) {
    const record = await model.findUnique({ where: { id } });
    if (!record) {
      throw AppError.notFound("Record not found");
    }
    return model.delete({ where: { id } });
  },

  async count(where = {}) {
    return model.count({ where });
  },
});

module.exports = createCrudService;
