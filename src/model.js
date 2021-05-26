import { Record } from './record'
import { arrify, getPropertyDescriptor, isEmpty } from './util'

/**
 * Return a Model class bound to
 * the given api
 * 
 * @param {Pony} api the api bound to the Model type
 */
export const Model = (api, { defaultMaxAge = 60000 } = {}) => {

	/**
	 * 
	 */
	const inlineEntities = (data) => {

		for (let prop in data)
		{
			if (data[prop] instanceof Model)
			{
				// Replace with its primary key
				data[prop] = data[prop]._pk
			}
			
			// Inline nested entities?
		}

		// Return modified data
		return data
	}

	/**
	 * Return the actual class
	 */
	return class Model {
		/** The maximum amount of time a record of this type is considered fresh */
		static _maxAge = defaultMaxAge

		/**
		 * Construct a new entity
		 * 
		 * @param {Record} record the record associated with this entity
		 */
		constructor(record) {

			// The dynamic type of the model
			const ModelType = this.constructor

			// Return a proxy with custom getter and setter
			return new Proxy(this, {
				/**
				 * Custom setter
				 */
				get: (target, prop, receiver) => {

					switch (prop)
					{
						case '_model': return ModelType
						case '_target': return target
						case '_record': return record
						case '_data': return record.data

						default:
						{
							let desc
							
							if (Reflect.has(ModelType, prop))
							{
								const RequiredType = Reflect.get(ModelType, prop)

								if (RequiredType.prototype instanceof Model)
								{
									if (!record.data)
									{
										return null
									}
									
									if (!(prop in record.data))
									{
										console.error(`'${prop}' is not a property of ${ModelType.name}`)
									}

									return RequiredType.get(...arrify(Reflect.get(record.data, prop)))
								}
								// TODO: Collections
							}

							if (Reflect.has(target, prop, receiver))
							{
								return Reflect.get(target, prop, receiver)
							}
							else if (record.data && Reflect.has(record.data, prop))
							{
								return Reflect.get(record.data, prop)
							}

							return undefined
						}
					}
				},

				/**
				 * Custom setter
				 */
				set: (target, prop, value, receiver) => {

					switch (prop)
					{
						default:
						{
							let desc

							if ((desc = getPropertyDescriptor(target, prop)) && (desc.writable || desc.set))
							{
								return Reflect.set(target, prop, value, receiver)
							}
							else if ((desc = getPropertyDescriptor(record.data, prop)) && desc.writable)
							{
								// Set value on record
								record.patch({
									[prop]: value
								})

								return true
							}

							return false
						}
					}
				}
			})
		}

		/**
		 * Return the primary key of the entity.
		 * Defaults to its id property
		 * 
		 * @return {Array}
		 */
		get _pk() {

			return arrify(this.id)
		}

		/**
		 * Return the URI at which to fetch,
		 * update or delete this entity
		 */
		get _path() {

			// Use id property
			return this.constructor._path(this._pk)
		}

		/**
		 * Commits changes made to the object by
		 * sending a PATCH request to the entity's
		 * URI with the object of patches
		 */
		async patch() {

			const patches = this._record.getPatches()

			if (!isEmpty(patches))
			{
				await this._record.updateAsync(async (rec) => {

					// Send patch request
					let req = api.Request('PATCH', this._path)
					let [ data, status ] = await req(inlineEntities(patches))

					// Update data
					Object.assign(rec.data, data)
					rec.status = status
				})

				// Then clear patches
				this._record.clearPatches()

				return 'update'
			}

			return this
		}

		/**
		 * Delete this entity
		 */
		async delete() {
			
			await this._record.updateAsync(async (rec) => {

				// Send delete request
				let req = api.Request('DELETE', this._path)
				let [ data, status ] = await req()

				// Reset data
				rec.data = data
				rec.status = status

				return 'delete'
			})

			return this
		}

		/**
		 * Return a promise that resolves successfully
		 * when the object is updated with a 2xx or 3xx
		 * HTTP status
		 * 
		 * @param {string|null} event the type of the event to listen for
		 */
		wait(event = null) {

			return new Promise((resolve, reject) => {

				this._record.listen((rec, ev) => {

					if (!event || event === ev)
					{
						if (rec.status >= 200 && rec.status < 400)
						{
							resolve(this)
						}
						else 
						{
							reject(this)
						}
					}

					return true
				})
			})
		}

		/**
		 * The name used in the relative path.
		 */
		static get _dirname() {

			return this.name.toLowerCase()
		}

		/**
		 * Return the URI at which to find an entity
		 * of this type identified by a composite key
		 * 
		 * @param {Array} keys a list of keys that uniquely identify an entity of this type
		 */
		static _path(keys) {

			return '/' + [this._dirname, ...keys].join('/')
		}

		/**
		 * Fetch an entity of this type identified by
		 * one or more keys
		 * 
		 * @param {Array} keys a list of keys that uniquely identify an entity of this type
		 */
		static get(...keys) {

			// Get path
			let path = this._path(keys)

			// Get existing or create a new one
			let record = api.store.get(path) || api.store.set(path, new Record())
			let entity = new this(record)

			// Fetch record data
			record.updateAsync(async (rec) => {

				if (!rec.updatedAt || !this._maxAge || Date.now() - rec.updatedAt > this._maxAge)
				{
					// Send request to server
					let req = api.Request('GET', path)
					let [ data, status ] = await req()

					// Set data and status
					rec.data = data
					rec.status = status

					// Store record
					api.store.set(entity._path, record)
					
					return 'read'
				}

				// Don't update
				return false
			})

			return entity
		}

		/**
		 * Create a new entity of this type
		 * 
		 * @param {*} data entity creation data
		 */
		static create(data) {

			// Get creation path
			// TODO: Have it separate?
			let path = this._path([])

			// Create record and entity
			let record = new Record()
			let entity = new this(record)
			
			// Update record, then store entity
			record.updateAsync(async (rec) => {

				// Send request to server
				let req = api.Request('POST', path)
				let [ data_, status ] = await req(inlineEntities(data))

				// Set data and status
				rec.data = data_
				rec.status = status

				// If update is successful, store record
				api.store.set(entity._path, record)

				return 'create'
			})

			return entity
		}

		/**
		 * Static method used to delete an entity
		 * identified by one or more keys
		 * 
		 * @param {Array} keys a list of keys that uniquely identify an entity of this type
		 * @return {Promise} a promise that resolves when entity is deleted
		 */
		static async delete(...keys) {

			// Get delete path
			let path = this._path(keys)

			// Attempt to delete the entity
			let req = api.Request('DELETE', path)
			return await req()
		}
	}
}