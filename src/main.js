import { Stallone } from './'

let mock = new Stallone({
	baseURL: 'https://jsonplaceholder.typicode.com'
})

class User extends mock.Model {
	static _path(keys) {

		return '/' + ['users', ...keys].join('/')
	}
}

class Post extends mock.Model {
	static userId = User

	static _path(keys) {

		return '/' + ['posts', ...keys].join('/')
	}
}

let App = Vue.defineComponent({
	template: `<div>
		<p>Vue will react when user is created</p>
		<h1>Hello, {{ me.username || me.nickname }}@{{ me._path }}!</h1>
		<p>email: {{ me.email }}</p>
		<p>record data: {{ me._data }}</p>
		<p>record timestamp: {{ me._record._updatedAt }}</p>

		<form @submit.prevent="updateUser">
			<input type="text" v-model="me.username" placeholder="username"/>
			<input type="email" v-model="me.email" placeholder="email"/>
			<button>Update info</button>
		</form>

		<h2>{{ post.title }}</h2>
		
		<p>Post #{{ post.id }}, created by {{ post.userId.username }}</p>

		<pre v-html="post.body"></pre>
	</div>`,

	setup() {

		let me = User.create({
			username: 'sneppy',
			email: 'sneppy@google.com'
		})
		let post = Post.get(1)

		const updateUser = () => me.patch()

		return { me, post, updateUser }
	}
})

Vue.createApp(App).mount('#App')
