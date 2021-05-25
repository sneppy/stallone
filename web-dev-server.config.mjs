import replace from '@rollup/plugin-replace'
import { fromRollup } from '@web/dev-server-rollup'

export default {
	plugins: [
		fromRollup(replace)({
			preventAssignment: true,
			'process.env.NODE_ENV': JSON.stringify('development')
		})
	],
	nodeResolve: true,
	debug: true,
	watch: true,
	hostname: '0.0.0.0',
	port: 3000
}