import { identity } from "./util"

/**
 * @param {Object} config - Object to configure the store.
 * @param {Function} config.hash - The hash function used to hash the record
 *  keys.
 */
export const InMemoryStore = ({ hash = identity } = {}) => {
    /** The object used to store records. */
    let records = {}

    /**
     * Fetch a record using the key.
     *
     * @param {*} key - The key that uniquely identifies the record.
     * @return {*} The stored value.
     */
    const get = (key) => {
        const h = hash(key)
        return records[h]
    }

    /**
     * Create or update a record.
     *
     * @param {*} key - The key that uniquely identifies the record.
     * @param {*} value - The value of the record.
     * @return {*} The stored record.
     */
    const set = (key, value) => {
        let h = hash(key)
        records[h] = value
        return records[h]
    }

    return { get, set }
}
