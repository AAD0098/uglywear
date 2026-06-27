/**
 * Standardized API response helpers.
 * Ensures every endpoint returns a consistent JSON shape.
 */
class ApiResponse {
  static success(res, data = null, statusCode = 200) {
    const body = { success: true };
    if (data !== null) {
      body.data = data;
    }
    return res.status(statusCode).json(body);
  }

  static created(res, data = null) {
    return ApiResponse.success(res, data, 201);
  }

  static paginated(res, { data, page, limit, total }) {
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  static noContent(res) {
    return res.status(204).end();
  }
}

module.exports = ApiResponse;
