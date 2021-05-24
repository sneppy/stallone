/**
 * Set the appropriate "Content-Type" header
 * and jsonifie unsupported objects
 * 
 * @param {*} data any type of data to prepare
 * @param {Object} headers set of headers
 * @return {string|FormData|URLSearchParams|Blob|ArrayBuffer|Document} processed data
 */
const prepareData = (data, headers) => {

	/** Set the content-type if not already set */
	const defaultContentType = (contentType) => {
		
		headers['Content-Type'] = headers['Content-Type'] || contentType
	}

	if (data instanceof Document)
	{
		defaultContentType('text/html; charset=UTF-8')
	}
	else if (data instanceof FormData)
	{
		defaultContentType('multipart/form-data; charset=UTF-8')
	}
	else if (data instanceof URLSearchParams)
	{
		defaultContentType('application/x-www-form-urlencoded; charset=UTF-8')
	}
	else if (data instanceof Blob || data instanceof ArrayBuffer)
	{
		if (!headers['Content-Type'])
		{
			console.warn('No "Content-Type" header for binary data')
		}
	}
	else if (data instanceof String || typeof data === 'string')
	{
		defaultContentType('text/plain; charset=UTF-8')
	}
	else if (data)
	{
		// Assume JSON payload
		defaultContentType('application/json; charset=UTF-8')
		return JSON.stringify(data)
	}

	// Return data as-is
	return data
}

/**
 * @param {string} data response text data
 * @param {string} contentType value of the "Content-Type" reseponse header
 * @return {string|Object} decoded data
 */
const decodeData = (data, contentType) => {

	if (!contentType)
	{
		console.warn('No "Content-Type" response header found')
		return data
	}

	// Get media type string
	let [ mediaType, charset ] = contentType.split(';')

	switch (mediaType)
	{
		case 'application/json':
		{
			// TODO: Try-catch block here
			return JSON.parse(data)
		}

		// Return as text and let user decode
		default: return data
	}
}

/**
 * Create a new request factory
 * 
 * @param {Object} config
 * @param {string|URL} config.baseURL the base URL
 * @param {Function} config.authorize a function used to authorize the request
 */
export const Request = ({ baseURL, authorize = null }) => {

	/**
	 * Create a request and return a method
	 * to dispatch it
	 * 
	 * @param {string} method valid HTTP method
	 * @param {string|URL} path path relative to the base URL
	 */
	return function Request(method, path) {
		
		/** Request URL */
		let url = new URL(baseURL + path)

		/** Request headers */
		let headers = {}

		/**
		 * Send the request and return a promise
		 * that resolves with the response and the
		 * HTTP status
		 * 
		 * @param {*} data the data to send with the request
		 */
		let dispatcher = (data) => {

			/** The actual payload sent */
			let payload = prepareData(data, headers)

			return new Promise((resolve, reject) => {

				// TODO: We can replace XHR maybe
				// Create XHR
				let xhr = new XMLHttpRequest()
				xhr.open(method, url)

				// Set headers
				for (let header in headers)
				{
					xhr.setRequestHeader(header, headers[header])
				}

				// Called when ready state changes
				xhr.onreadystatechange = () => {

					if (xhr.readyState === xhr.DONE)
					{
						// Decode data
						let res = decodeData(xhr.responseText, xhr.getResponseHeader('Content-Type'))

						if (xhr.status < 400)
						{
							resolve([ res, xhr.status ])
						}
						else
						{
							reject([ res, xhr.status ])
						}
					}
				}

				// Send with data
				xhr.send(payload)
			})
		}

		/** Set request header */
		dispatcher.header = function (header, value) {

			if (typeof name === 'string')
			{
				// Append or replace single header
				headers[header] = value
			}
			else
			{
				// Append all headers
				headers = { ...headers, ...header }
			}

			return this
		}

		/** Append to request URL query */
		dispatcher.query = function (query) {

			for (let name in query)
			{
				url.searchParams.append(name, query[name])
			}

			return this
		}

		if (authorize)
		{
			// Authorize request
			authorize(dispatcher)
		}

		return dispatcher
	}
}