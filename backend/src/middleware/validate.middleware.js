const { errorResponse } = require('../utils/response');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      const formattedErrors = err.errors?.map(e => ({
        field: e.path.join('.'),
        message: e.message
      })) || [{ message: err.message }];

      return errorResponse(res, 'Validation error', 400, formattedErrors);
    }
  };
}

module.exports = validate;
