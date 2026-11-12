function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    requestId: res.req?.id || undefined
  });
}

function errorResponse(res, message = 'An error occurred', statusCode = 500, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    requestId: res.req?.id || undefined
  });
}

module.exports = {
  successResponse,
  errorResponse
};
