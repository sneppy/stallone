/**
 * Join the given path and the base URL.
 *
 * @param {String} path - The path of the resource.
 * @param {String|URL} base - The base URL.
 * @return {String|URL} The resource URL.
 */
function makeURL(path, base) {
    if (base instanceof URL) {
        return new URL(path, base)
    } else {
        return [base.replace(/\/+$/, ""), path.replace(/^\/+/, "")].join("/")
    }
}

/**
 * Set the appropriate "Content-Type" header and jsonify unsupported objects.
 *
 * @param {*} data - Any type of data to encode.
 * @param {Object} headers - Mutable object that contains the request headers.
 * @return {*} Encoded data.
 */
function encodeData(data, headers) {
    /** Set the content-type if not already set */
    const defaultContentType = (contentType) => {
        headers["Content-Type"] = headers["Content-Type"] || contentType
    }

    if (data instanceof Document) {
        defaultContentType("text/html; charset=UTF-8")
    } else if (data instanceof FormData) {
        defaultContentType("multipart/form-data; charset=UTF-8")
    } else if (data instanceof URLSearchParams) {
        defaultContentType("application/x-www-form-urlencoded; charset=UTF-8")
    } else if (data instanceof Blob || data instanceof ArrayBuffer) {
        if (!headers["Content-Type"]) {
            console.warn("No 'Content-Type' header for binary data")
        }
    } else if (data instanceof String || typeof data === "string") {
        defaultContentType("text/plain; charset=UTF-8")
    } else if (data) {
        // Assume JSON payload
        defaultContentType("application/json; charset=UTF-8")
        return JSON.stringify(data)
    }

    // Return data as-is
    return data
}

/**
 * @param {String} payload - The raw payload of the response.
 * @param {String} contentType - value of the "Content-Type" reseponse header,
 *  if any.
 * @return {String|Object} Decoded data.
 */
function decodeData(data, contentType) {
    if (!contentType) {
        // Return data as-is
        console.warn("No 'Content-Type' response header found")
        return data
    }

    // Get media type string
    let [mediaType] = contentType.split(";")
    switch (mediaType) {
        case "application/json":
            // TODO: Catch JSON parsing errors
            return JSON.parse(data)

        // Return as text and let user decode
        default:
            return data
    }
}

/**
 * Create a new request factory.
 *
 * @param {Stallone} client - The client we are building the request for.
 */
export const makeRequest = (client) => {
    /**
     * Create a request and return a function to dispatch it.
     *
     * @param {String} method - A valid HTTP method (e.g. "GET", "POST", etc.)
     * @param {String} path - The Path of the resource (relative to the base
     *  URL).
     * @return {Function} A function to dispatch the request.
     */
    return function Request(method, path) {
        // TODO: Check method is valid
        // Build URL string
        let url = client.baseURL ? makeURL(path, client.baseURL) : path
        let headers = {}

        /**
         * Send the request and return a promise that resolves with the response
         * and the HTTP status.
         *
         * @param {*} data - The data to send with the request. Can be `null`.
         * @return {Promise} Promise that resolves with the response payload and
         *  HTTP status.
         */
        const dispatch = (data) =>
            new Promise((resolve, reject) => {
                // Encode request payload now, this sets the correct headers as well
                const payload = encodeData(data, headers)

                // Create HTTP request
                let xhr = new XMLHttpRequest()
                xhr.open(method, url)
                for (let header in headers) {
                    // Set headers
                    xhr.setRequestHeader(header, headers[header])
                }

                // Called when request state changes
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === xhr.DONE) {
                        // Request is completed, get response payload
                        let payload = null
                        if (method !== "HEAD") {
                            // Ignore response if method is HEAD
                            payload = decodeData(
                                xhr.responseText,
                                xhr.getResponseHeader("Content-Type"),
                            )
                        }

                        if (xhr.status < 400) {
                            resolve([payload, xhr.status])
                        } else {
                            reject([payload, xhr.status])
                        }
                    }
                }

                // Encode the request payload and send
                xhr.send(payload)
            })

        /**
         * Add or replace a request header.
         *
         * @param {String|Object} header - Name of the header or object that
         *  contains multiple header definitions.
         * @param {String|null} value - If `header` is a string must be the
         *  value of the header.
         */
        dispatch.header = (header, value = null) => {
            if (typeof header === "string") {
                // Append or replace single header
                headers[header] = value
            } else {
                // Append all headers
                headers = { ...headers, ...header }
            }
        }

        // If the client set a authorize callback, call it now
        if (client.authorizeCb) {
            client.authorizeCb(dispatch)
        }

        return dispatch
    }
}
