import { Stallone } from './'

let mock = new Stallone({
	baseURL: 'https://jsonplaceholder.typicode.com'
})

export class User extends mock.Model {
	static _dirname = 'users'
}

export class Post extends mock.Model {
	static _dirname = 'posts'
	
	get author() {

		return User.get(this._data.userId)
	}
}

export class Comment extends mock.Model {
	static dirname = 'comments'

	get author() {

		// TODO: Just a proposal
		return User.where({
			email: this._data.email
		}).first()
	}

	get post() {

		return Post.get(this._data.postId)
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
		
		<p>Post #{{ post.id }}@{{ post._path }}, created by {{ post.id && post.userId.username }}</p>

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
