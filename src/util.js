/** Callable that returns first argument as-is */
export const identity = (x) => x

/** Returns true if iterable object is empty */
export const isEmpty = (x) => {
    for (let _ in x) {
        return false
    }

    return true
}

/** Returns true if is object */
export const isObject = (obj) => obj === Object(obj)

/** Returns true if object is iterable */
export const isIterable = (obj) =>
    obj != null && typeof obj[Symbol.iterator] === "function"

/** Merge all arguments in a flat array */
export const arrify = (...args) => [].concat.apply([], args)

/**
 * Get the closest property descriptor along
 * the prototype chain. Returns undefined if
 * no such property is found
 *
 * @param {Object} obj object to inspect
 * @param {string|Symbol} prop property to find
 * @return {PropertyDescriptor|undefined}
 */
export const getPropertyDescriptor = (obj, prop) => {
    return obj
        ? Object.getOwnPropertyDescriptor(obj, prop) ||
              getPropertyDescriptor(Object.getPrototypeOf(obj), prop)
        : undefined
}
