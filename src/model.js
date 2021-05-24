import { Record } from './record'
import { getPropertyDescriptor, isEmpty } from './util'

/**
 * Return a Model class bound to
 * the given api
 * 
 * @param {Pony} api the api bound to the Model type
 */
export const Model = (api) => {

	/**
	 * Return the actual class
	 */
	return class Model {
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
								// TODO: Check property type
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
		 * Return the URI at which to fetch,
		 * update or delete this entity
		 */
		get _path() {

			// Use id property
			return this.constructor._path([this.id])
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
					let [ data, status ] = await req(patches)

					// Update data
					rec.data = data
					rec.status = status
				})

				// Then clear patches
				this._record.clearPatches()
			}

			return this
		}

		/**
		 * Return a promise that resolves successfully
		 * when the object is updated with a 2xx or 3xx
		 * HTTP status
		 */
		wait() {

			return new Promise((resolve, reject) => {

				this._record.listen((rec) => {

					if (rec.status >= 200 && rec.status < 400)
					{
						resolve(this)
					}
					else 
					{
						reject(this)
					}

					return true
				})
			})
		}

		/**
		 * Return the URI at which to find an entity
		 * of this type identified by a composite key
		 * 
		 * @param {Array} keys a list of keys that uniquely identify an entity of this type
		 */
		static _path(keys) {

			return '/' + [this.name.toLowerCase(), ...keys].join('/')
		}

		/**
		 * Fetch an entity of this type identified by
		 * one or more keys
		 * 
		 * @param {Array} keys a list of keys that uniquely identify an entity of this type
		 * @return {Model}
		 */
		static get(...keys) {

			// Get path
			let path = this._path(keys)

			// Get existing or create a new one
			let record = api.store.get(path) || api.store.set(path, new Record())
			record.updateAsync(async (rec) => {

				// Send request to server
				let req = api.Request('GET', path)
				let [ data, status ] = await req()

				// Set data and status
				rec.data = data
				rec.status = status
			})

			// Create new entity from record
			return new this(record)
		}
	}
}