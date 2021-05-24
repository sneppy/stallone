import { Request } from './request'
import { Model } from './model'
import { InlineStore } from './store'
import { noop } from './util'

/**
 * An elegant and intuitive REST client.
 */
export class Stallone {
	/**
	 * Construct a new instance of Pony
	 * 
	 * @param {Object} config configuration object
	 * @param {string|URL} config.baseURL the base URL for all API endpoints
	 * @param {Function} config.authorize the base URL for all API endpoints
	 * @param {*} config.store a custom store to use
	 */
	constructor({ baseURL, authorize = noop, store = InlineStore() }) {

		/** Endpoints base URL */
		this.baseURL = baseURL

		/** Request dispatcher */
		this.Request = Request({ baseURL, authorize })

		/** Store used to store records */
		this.store = store

		/** The base class of all models */
		this.Model = Model(this)
	}
}
