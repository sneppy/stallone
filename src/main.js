import { Stallone } from './'

let api = new Stallone({
	baseURL: 'http://sneppy.host:5000/api/v1',
	authorize: (req) => {

		const accessToken = window.localStorage.getItem('access_token')
		if (accessToken)
		{
			req.header('Authorization', 'Bearer ' + accessToken)
		}
	}
})

class User extends api.Model {}

let App = Vue.defineComponent({
	template: `<div>
		<h1>Hello, {{ me.username || me.nickname }}!</h1>
		<p>email: {{ me.email }}</p>
	</div>`,

	setup() {

		let me = User.get('me')
		Vue.watchEffect(() => console.log(me.username || me.nickname))

		return { me }
	}
})

Vue.createApp(App).mount('#App')
