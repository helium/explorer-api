export const successResponse = (req, res, data, code = 200, meta) =>
  res.send({
    code,
    data,
    success: true,
    ...(meta !== undefined && { meta }),
  })

export const errorResponse = (
  req,
  res,
  errorMessage = 'Something went wrong',
  code = 500,
  errors = [],
) =>
  res.status(code).json({
    code,
    errorMessage,
    errors,
    data: null,
    success: false,
  })

export const validateFields = (object, fields) => {
  const errors = []
  fields.forEach((f) => {
    if (!(object && object[f])) {
      errors.push(f)
    }
  })
  return errors.length ? `${errors.join(', ')} are required fields.` : ''
}
