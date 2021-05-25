/** Makes the object reactive */
let reactive = (x) => x

/** Used to mark an object property as non-reactive */
let markRaw = (x) => x

try
{
	// Try and import Vue
	({ markRaw, reactive } = require('vue'))
}
catch (err)
{
	if (err instanceof ReferenceError)
	{
		// `require` is not defined
		if (window.Vue)
		{
			// If Vue is defined globally
			reactive = Vue.reactive
			markRaw = Vue.markRaw
		}
		else
		{
			// Vue not defined globally
			console.log('Vue not detected. Make sure to load Vue before Stallone')
		}
	}
	else
	{
		// Vue dependency not found
		console.log('Vue not detected')
	}
}

export { markRaw, reactive }
