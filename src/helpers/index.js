export const successResponse = (req, res, data) => res.send(data)

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
