/** Makes the object reactive */
let reactive = (x) => x

/** Used to mark an object property as non-reactive */
let markRaw = (x) => x

try
{
	// Import vue dependencies
	// TODO: A better way to force dynamic imports?
	const pkgName = 'vue'
	({ markRaw, reactive } = import(pkgName))
}
catch (err)
{
	if (err instanceof ReferenceError && window.Vue)
	{
		markRaw = window.Vue.markRaw
		reactive = window.Vue.reactive
	}
	else
	{
		console.warn('Vue not detected. Make sure to include Vue before Stallone.')
	}
}

export { reactive, markRaw }
