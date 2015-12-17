/**
 * Optional monoid.
 *
 * @param v A value
 * @returns {Function}
 */
export function optional(v) {
  return (attr, dflt) => {
    if (!attr) return v
    if (dflt && v) return v[attr] || dflt
    if (dflt) return dflt
    if (v) return optional(v[attr])
    else return optional()
  }
}
