export const CALL_API = Symbol('Call API')

export default store => next => action => {
  const callAPI = action[CALL_API]
  if (typeof callAPI === 'undefined') {
    return next(action)
  }
  return next(action) // TODO: implement something
}
