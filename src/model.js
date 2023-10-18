import { Record } from "./record"
import { arrify, getPropertyDescriptor, isEmpty } from "./util"

/**
 * Return a Model class bound to the given client.
 *
 * @param {Stallone} api - the client to create a Model factory for.
 */
export const makeModel = (api, { defaultMaxAge = 15000 } = {}) => {
    /**
     * Iterate over the given object and replace any instance of Model with its
     * primary key.
     *
     * @param {Object|Array} data - The data to inline.
     * @param {boolean} shallow - If true, does not inline entities nested in
     *  arrays or objects of the objects.
     * @return {Object} The modified data.
     */
    const inlineEntities = (data, shallow = false) => {
        let data_ = { ...data }
        for (let prop in data) {
            if (data_[prop] instanceof api.Model) {
                // Replace entity with its primary key
                data_[prop] = data_[prop]._pk
            } else if (shallow || data_[prop] === null) {
                continue
            } else if (typeof data_[prop] === "object") {
                data_[prop] = inlineEntities(data_[prop], shallow)
            }
        }

        // Return modified data
        return data_
    }

    // Return the factory
    return class Model {
        /**
         * The maximum amount of time a record of this type is considered
         * fresh.
         */
        static _maxAge = defaultMaxAge

        /**
         * Construct a new entity.
         *
         * @param {Record} record - The record associated with this entity
         */
        constructor(record) {
            // The runtime type of the model
            const ModelType = this.constructor
            // Return a proxy with custom getter and setter
            return new Proxy(this, {
                get: (target, prop, receiver) => {
                    switch (prop) {
                        case "_model":
                            return ModelType
                        case "_target":
                            return target
                        case "_record":
                            return record
                        case "_data":
                            return record.data

                        default:
                            if (Reflect.has(ModelType, prop)) {
                                const RequiredType = Reflect.get(
                                    ModelType,
                                    prop,
                                )
                                // Entity contains a foreign key, resolve it to an actual entity
                                if (RequiredType.prototype instanceof Model) {
                                    if (!record.data) {
                                        // TODO: Null or empty entity?
                                        return null
                                    }

                                    if (!(prop in record.data)) {
                                        console.error(
                                            `'${prop}' is not a property of ${ModelType.name}`,
                                        )
                                    }

                                    // Fetch the entity
                                    return RequiredType.get(
                                        ...arrify(
                                            Reflect.get(record.data, prop),
                                        ),
                                    )
                                }
                                // TODO: Collections
                            }

                            if (Reflect.has(target, prop, receiver)) {
                                // Return method or getter of entity
                                return Reflect.get(target, prop, receiver)
                            } else if (
                                record.data &&
                                Reflect.has(record.data, prop)
                            ) {
                                // Return property of entity
                                return Reflect.get(record.data, prop)
                            }

                            // Property not found
                            return undefined
                    }
                },
                set: (target, prop, value, receiver) => {
                    switch (prop) {
                        default: {
                            let desc
                            if (
                                (desc = getPropertyDescriptor(target, prop)) &&
                                (desc.writable || desc.set)
                            ) {
                                // Set a property of the entity class
                                return Reflect.set(
                                    target,
                                    prop,
                                    value,
                                    receiver,
                                )
                            } else if (
                                (desc = getPropertyDescriptor(
                                    record.data,
                                    prop,
                                )) &&
                                desc.writable
                            ) {
                                // Set a property of the entity
                                record.patch({
                                    [prop]: value,
                                })

                                return true
                            }

                            return false
                        }
                    }
                },
            })
        }

        /**
         * Return the primary key of the entity. Defaults to its id property.
         *
         * @return {Array} The primary key of the entity.
         */
        get _pk() {
            // Try some common names used for resource identifiers
            return arrify(this.id || this.uid || this.uuid)
        }

        /**
         * Return the path at which to fetch, update or delete this entity.
         *
         * The path is always relative to the API base URL.
         *
         * @return {String} The path of the entity.
         */
        get _path() {
            // Use id property
            return this.constructor._path(this._pk)
        }

        /**
         * Commit changes made to the object by ending a PATCH request to the
         * entity's URI.
         *
         * @returns {Promise} A promise that resolves with the entity itself.
         */
        async patch() {
            // Get the set of properties that changes and their current value
            const patches = this._record.getPatches()
            if (!isEmpty(patches)) {
                await this._record.updateAsync(async (rec) => {
                    // Send patch request
                    let req = api.Request("PATCH", this._path)
                    let [data, status] = await req(inlineEntities(patches))

                    // Update data
                    Object.assign(rec.data, data)
                    rec.status = status
                })

                // Then clear patches
                this._record.clearPatches()
                return "update"
            }
            return this
        }

        /**
         * Delete this entity.
         *
         * Sends a DELETE request to the API.
         *
         * @returns {Promise} A promise that resolves with the entity itself.
         */
        async delete() {
            await this._record.updateAsync(async (rec) => {
                // Send delete request
                let req = api.Request("DELETE", this._path)
                let [data, status] = await req()

                // Reset data
                rec.data = data
                rec.status = status
                return "delete"
            })
            return this
        }

        /**
         * Return a promise that resolves successfully when the object is
         * created, updated or deleted.
         *
         * @param {String|null} event the type of the event to listen for. If
         *  `null`, subscribe to all events.
         * @return {Promise} A promise that resolves with the entity when the
         *  event is triggered.
         */
        wait(event = null) {
            return new Promise((resolve, reject) => {
                // Data may be immdediately available
                let status = this._record.status
                if (
                    (event === "ready" || !event) &&
                    status !== null &&
                    status >= 200 &&
                    status < 400
                ) {
                    // Resolve immediately
                    resolve(this)
                }

                // Subscribe to record events
                this._record.listen((rec, ev) => {
                    if (!event || event === "ready" || event === ev) {
                        if (rec.status >= 200 && rec.status < 400) {
                            resolve(this)
                        } else {
                            reject(this)
                        }
                    }

                    // Return true to pop event
                    return true
                })
            })
        }

        /**
         * The name used in the relative path.
         *
         * By default, this is equal to the name of the class, lowercase. When
         * the code is optimized the name of the class may be mangled, which
         * might lead to unexpected behavior. Therefore, it's recommended that
         * the user overrides this property.
         */
        static get _dirname() {
            return this.name.toLowerCase()
        }

        /**
         * Return the path at which to find an entity of this type identified
         * by a composite key.
         *
         * The path is always relative to the API's base URL.
         *
         * @param {Array} keys - A list of keys that uniquely identify an entity
         *  of this type.
         * @returns {String} The path of the resource.
         */
        static _path(keys) {
            return "/" + [this._dirname, ...keys].join("/")
        }

        /**
         * Fetch an entity of this type identified by the given key.
         *
         * @param {Array} key - A list of keys that uniquely identify an entity
         *  of this type.
         * @param {Object} options - Options applied to the fetch operation.
         * @param {Boolean} options.forceUpdate - Force update of the resource.
         */
        static get(key, { forceUpdate = false } = {}) {
            // Get path
            const path = this._path(arrify(key))
            // Get existing record or create a new one
            let record =
                api.store.get(path) || api.store.set(path, new Record())
            let entity = new this(record)
            // Fetch record data
            record.updateAsync(async (rec) => {
                if (
                    forceUpdate ||
                    !rec.updatedAt ||
                    !this._maxAge ||
                    Date.now() - rec.updatedAt > this._maxAge
                ) {
                    // Send request to server
                    let req = api.Request("GET", path)
                    let [data, status] = await req()

                    // Set data and status
                    rec.data = data
                    rec.status = status

                    // Store record
                    api.store.set(entity._path, record)
                    return "ready"
                }

                // Don't update
                return false
            })
            return entity
        }

        /**
         * Create a new entity of this type
         *
         * @param {*} data Data sent to create the entity.
         */
        static create(data) {
            // Get creation path
            const path = this._path([])
            // Create record and entity
            let record = new Record()
            let entity = new this(record)
            // Update record, then store entity
            record.updateAsync(async (rec) => {
                // Send request to server
                let req = api.Request("POST", path)
                let [payload, status] = await req(inlineEntities(data))

                // Set data and status
                rec.data = payload
                rec.status = status

                // If update is successful, store record
                api.store.set(entity._path, record)
                return "create"
            })
            return entity
        }

        /**
         * Static method used to delete an entity identified by the given key.
         *
         * @param {Array} keys a list of keys that uniquely identify an entity
         *  of this type.
         * @return {Promise} a promise that resolves when entity is deleted.
         */
        static async delete(keys) {
            // Get delete path
            let path = this._path(arrify(keys))

            // Attempt to delete the entity
            let req = api.Request("DELETE", path)
            return await req()
        }
    }
}
