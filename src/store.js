import { identity } from './util'
import { reactive } from './vue'

/**
 * Return a new unique name for the store
 * 
 * @return {string}
 */
const getStoreUniqueName = () => {

	let name = '$store'
	let idx = 0
	
	// Get unique name
	for (; name + idx in window; idx += 1);

	return name + idx
}

/**
 * @param {Object} options
 * @param {Function} options.h a hash function used to hash the keys
 */
export const InlineStore = ({ h = identity } = {}) => {

	/** The object used to store records */
	let records = {}

	/**
	 * Fetch a record using the key
	 * 
	 * @param {*} key key that uniquely identifies a record
	 * @return {*}
	 */
	const get = (key) => {

		let m = h(key)
		return records[m]
	}

	/**
	 * Create or update a record
	 * 
	 * @param {*} key a key that uniquely identifies a record
	 * @param {*} value the value of the record
	 * @param {*}
	 */
	const set = (key, value) => {

		let m = h(key)
		records[m] = value
		return records[m]
	}
	
	// TODO: Show store only in debug
	if (true)
	{
		window[getStoreUniqueName()] = records
	}

	return { get, set }
}
