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
	console.log('Vue not detected')
}

export { markRaw, reactive }
