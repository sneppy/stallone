import { Stallone } from "./vue"
import {
    createApp,
    defineComponent,
} from "./node_modules/vue/dist/vue.esm-bundler"

let mock = new Stallone({
    baseURL: "https://jsonplaceholder.typicode.com",
})

export class User extends mock.Model {
    static _dirname = "users"
}

export class Post extends mock.Model {
    static _dirname = "posts"

    get author() {
        return User.get(this._data.userId)
    }

    get comments() {
        return mock.Collection(Comment).get(this._path + "/comments")
    }
}

export class Comment extends mock.Model {
    static _dirname = "comments"

    get author() {
        // TODO: Just a proposal
        return User.where({
            email: this._data.email,
        }).first()
    }

    get post() {
        return Post.get(this._data.postId)
    }
}

// eslint-disable-next-line no-undef
let App = defineComponent({
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

		<p>There are {{ post.id && post.comments.length }} comments</p>

		<div v-for="comment in post.comments" v-if="post.id">
			<p>{{ comment.body }}</p>
		</div>
	</div>`,

    setup() {
        let me = User.create({
            username: "sneppy",
            email: "sneppy@google.com",
        })
        let post = Post.get(1)
        post.wait().then((p) => console.log(p._record))
        const updateUser = () => me.patch()
        return { me, post, updateUser }
    },
})

// eslint-disable-next-line no-undef
createApp(App).mount("#App")
