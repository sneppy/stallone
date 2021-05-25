import { Stallone } from './'

let mock = new Stallone({
	baseURL: 'https://jsonplaceholder.typicode.com'
})

class User extends mock.Model {
	static _path(keys) {

		return '/' + ['users', ...keys].join('/')
	}
}

let App = Vue.defineComponent({
	template: `<div>
		<p>Vue will react when user is created</p>
		<h1>Hello, {{ me.username || me.nickname }}@{{ me._path }}!</h1>
		<p>email: {{ me.email }}</p>
	</div>`,

	setup() {

		let me = User.create({
			username: 'sneppy',
			email: 'sneppy@google.com'
		})
		me.wait().then((u) => console.log(User.get(u.id).username))

		return { me }
	}
})

Vue.createApp(App).mount('#App')
