import { Collection } from "./collection"
import { makeModel } from "./model"
import { makeRequest } from "./request"
import { InMemoryStore } from "./store"

/**
 * An elegant and intuitive REST client.
 */
export class Stallone {
    /**
     * Construct a new instance of Pony
     *
     * @param {Object} config - Object used to configure the cient.
     * @param {String|URL} config.baseURL - The base URL for all API endpoints.
     *  Can be either a URL object, a absolute URL string or a relative path
     *  (e.g. "api/v1").
     * @param {Function|null} config.authorize - A callback used to authorize
     *  HTTP requests. The callback receives an object that provides an
     *  interface to define request headers. Can be `null`.
     * @param {Object} config.store - An object used to store and cache API
     *  records. Must provide a `set(key, value)` and `get(key)` endpoints.
     */
    constructor({ baseURL, authorize = null, store = InMemoryStore() }) {
        /** Endpoints base URL. */
        this.baseURL = baseURL
        /** Authorize callback. */
        this.authorizeCb = authorize
        /** Request dispatcher. */
        this.Request = makeRequest(this)
        /** Store used to store records. */
        this.store = store
        /** The base class of all models. */
        this.Model = makeModel(this)
        /** Returns a collection bound to a certain model. */
        this.Collection = Collection(this)
    }
}
