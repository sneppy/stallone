import { Record } from './record'
import { arrify, isIterable, isObject } from './util'

/**
 * Return or fetch the entity
 */
const loadEntity = (ModelType, keyOrData) => {

	if (isObject(keyOrData) && !isIterable(keyOrData))
	{
		return new ModelType(new Record(keyOrData))
	}
	else
	{
		return ModelType.get(...arrify(keyOrData))
	}
}

/**
 * Bound the collection type to the given
 * instance
 */
export const Collection = (api, { defaultMaxAge = 15000 } = {}) => {

	/**
	 * This returns a collection bound to the
	 * specified model type
	 * 
	 * @param {typeof Model} ModelType
	 * @param {Object} options
	 * @param {number|null} maxAge the record max age
	 * @return {Collection}
	 */
	return (ModelType, { maxAge = defaultMaxAge } = {}) => {

		/**
		 * A collection is a set of entities of
		 * the same type
		 */
		return class Collection {
			/**
			 * Construct a new collection from a record.
			 * The record should hold a list of keys used
			 * to fetch the entities, or the entities' data
			 * itself.
			 * 
			 * @param {Record} record
			 */
			constructor(record) {
	
				return new Proxy(this, {
					/**
					 * Custom getter
					 */
					get: (target, prop, receiver) => {

						switch (prop)
						{
							case '_record': return record
							case '_data': return record.data

							default:
							{
								if (Reflect.has(target, prop))
								{
									return Reflect.get(target, prop, receiver)
								}
								else if (record.data && Reflect.has(record.data, prop))
								{
									const keyOrData = Reflect.get(record.data, prop)
									return loadEntity(ModelType, keyOrData)
								}

								return undefined
							}
						}
					}
				})
			}

			/**
			 * Return the number of entities in this
			 * collection
			 */
			get length() {

				return this._data && this._data.length
			}

			/**
			 * Return the first entity
			 */
			first() {

				return this[0]
			}

			/**
			 * Return an iterator over the entities in
			 * this collection
			 */
			*[Symbol.iterator]() {

				if (!this._data)
				{
					// Don't yield anything
					return
				}
				
				if (!isIterable(this._data))
				{
					console.error('Endpoint did not return a list of keys')
					return
				}

				for (let keyOrData of this._data)
				{
					yield loadEntity(ModelType, keyOrData)
				}
			}

			/**
			 * Replicate Array.forEach behavior
			 */
			forEach(callbackfn, thisArg) {
				
				let idx = 0

				for (let entity of this)
				{
					callbackfn.call(thisArg, entity, idx++, this)
				}
			}

			/**
			 * Replicate Array.map behavior
			 * 
			 * @return {Array}
			 */
			map(callbackfn, thisArg) {
				
				let arr = []
				let idx = 0

				for (let entity of this)
				{
					arr.push(callbackfn.call(thisArg, entity, idx++, this))
				}
				
				return arr
			}

			/**
			 * Replicate Array.reduce behavior
			 */
			reduce(callbackfn, ...args) {
				
				if (args.length)
				{
					// With initial value
					let [ accum ] = args
					let idx = 0

					for (let entity of this)
					{
						accum = callbackfn(accum, entity, idx++, this)
					}
				}
				else
				{
					// Without initial value
					let accum
					let idx = 0

					for (let entity of this)
					{
						accum = idx++ === 0 ? entity : callbackfn(accum, entity, idx, this)
					}
				}
			}

			/**
			 * @see Model.wait
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
					})
				})
			}

			/**
			 * Fetch a collection at the given path
			 * 
			 * @param {string} path path realative to base URL
			 * @return {Collection}
			 */
			static get(path) {

				// Get or create new record and collection
				let record = api.store.get(path) || api.store.set(path, new Record())
				let collection = new this(record)

				record.updateAsync(async (rec) => {

					if (!rec.updatedAt || !maxAge || Date.now() - rec.updatedAt > maxAge)
					{
						// Send request to server
						let req = new api.Request('GET', path)
						let [ data, status ] = await req()

						// Update record
						rec.data = data
						rec.status = status

						return 'read'
					}

					return false
				})

				return collection
			}

			/**
			 * A simple helper that translates to
			 * a get call with the path of the entity
			 * 
			 * @param {Model} entity the entity to which the collection belongs
			 * @return {Collection}
			 */
			static in(entity) {

				return this.get([entity._path, ModelType._dirname].join('/'))
			}
		}
	}
}