/** Callable that does nothing */
export const noop = () => {}

/** Callable that returns first argument as-is */
export const identity = (x) => x

/** Returns true if iterable object is empty */
export const isEmpty = (x) => {

	for (let _ in x)
	{
		return false
	}

	return true
}

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
		? Object.getOwnPropertyDescriptor(obj, prop) || getPropertyDescriptor(Object.getPrototypeOf(obj), prop)
		: undefined
}
