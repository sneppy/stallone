# Stallone

> An elegant and intuitive library to create REST clients.

Installation
------------

You can install the library using npm:

```console
$ npm install --save @sneppy/stallone
```

Or simply download and include it with a script tag:

```
<script src="https://unpkg.com/@sneppy/stallone"></script>
```

> Stallone was designed to be used in a browser enviornment, and it uses `XMLHttpRequests` under the hood.
> To use it in a Node environment you will need a third-party library such as [xhr2](https://www.npmjs.com/package/xhr2).

Basic usage
-----------

First, create a new instance of `Stallone`:

```javascript
import { Stallone } from '@sneppy/stallone'

let config = {
	baseURL: 'https://localhost:8080/api'
}
let api = new Stallone(config)
```

The constructor accepts a configuration object. This object should define at least the `baseURL` property, which is the base URL of the API endpoints.

Stallone uses ES6 classes to build the client. You need to declare a class for each type of resource:

```javascript
class User extends api.Model {}
class Post extends api.Model {}
```

All classes must extend `api.Model`.

We can fetch an entity using `Model.get(...keys)`:

```javascript
let user = User.get(2) // GET https://localhost:8080/api/user/2
let post = Post.get('my-first-post') // GET https://localhost:8080/api/post/my-first-post
```

By default, it will send a `GET` request at `<baseURL>/<lowercase classname>/key0/key1/..../keyN`. This can be changed by overriding the static method `Model._path(keys)`, as explained later.

Stallone expects the server to send back data of the entity. If the data is nested, it will not work properly:

```json
{
	"data": {
		"username": "...",
		"email": "..."
		// BAD
	},
	"created_at": "...",
	"updated_at": "..."
}
```

The return value of `Model.get(...keys)` is an instance of that model, which we'll call entity. Once the entity data is loaded, we can access its properties using a familiar syntax:

```
console.log(user.email)
console.log(post['title'])
```

However, since the request is asynchronous, the entity data may be not available right away. If you want yo wait for the data to load, you can use `Model.wait(event)`:

```javascript
User.get('sneppy').wait().then((u) => console.log(`Hello, ${u.username}!`))
```

This method returns a JavaScript `Promise` that resolves whenever the entity record is loaded, created, updated or deleted. To filter this events, you may provide an optional argument and specify what type of event you want to wait for:

```javascript
User.get('sneppy').wait('read').then((u) => console.log(`Hello, ${u.username}!`))
```

One nice feature of Stallone is that separate requests to the same resource share the same record. In fact, if you load the same user again the entity will be pre-filled with the data from the previous call:

```javascript
User.get('sneppy').wait().then(() => console.log(User.get('sneppy').username))
```

Many entities may share the same record under the hood.

Stallone provides the method `Model.create(data)` to create a new entity:

```javascript
let post = Post.create({
	author: 1,
	title: 'My first post',
	body: 'Lorem ipsum ...'
}) // POST https://localhost:8080/api/post {author: 1, title: 'My first post', body: 'Lorem ipsum ...'}
```

This sends a `POST` request to `<baseURL>/<lowercase classname>` and returns the entity created. It expects the server to respond with the data of the created entity.

Like before, the request is asynchronous and we may want to wait for it to finish using `wait`:

```javascript
post.wait('create').then((p) => console.log(`created post "${p.title}"`))
```

An entity can be deleted using either the static method `Model.delete(...keys)` or the instance method `Model.delete()`:

```javascript
Post.delete('my-first-post') // DELETE https://localhost:8080/api/post/my-first-post
// or
Post.get('my-first-post').wait().then((p) => p.delete()) // DELETE https://localhost:8080/api/post/<post.id>
```

The former sends a single `DELETE` request using the provided key; the latter is recommended if the entity is already loaded.

Note that in the second case, the request is potentially sent to a different endpoint. By default, Stallone associates each entity with a relative endpoint, equal to `<lowercase classname>/<'id' property of the entity>`.

This default behavior can be changed by overriding the instance `Model._path()` method (not to be confused with the static method), as explained later.

Unlike `get` and `create`, both forms of `delete` return a `Promise` that resolves when the entity is deleted:

```javascript
post.delete().then(() => console.log('deleted'))
```

Note that other entities that share the same record may listen for such an event using `wait`:

```javascript
otherPost.wait('delete').then(() => closePage())
```

Updating an entity in Stallone is as simple as changing the local entity and then calling `Model.patch()`:

```javascript
user.username = 'stallion'
user.email = 'stallion@sneppy.com'
user.patch() // PATCH https://localhost:8080/api/user/<user.id> {username: 'stallion', email: 'stallion@sneppy.com'}
```

Stallone is smart enough to figure out what properties were modified and send a `PATCH` request with those changes. The server should send back any property that has been further modified by the request, though in general it can simply send back the data of the entity.

Like `delete`, it returns a `Promise` that resolves when the request has finished.

> Note that, due to the architecture of Stallone, the local changes made to an entity are immediately reflected on all other entities that share the same record.

Vue integration
---------------

Stallone knows how to work with Vue.

All records are reactive, meaning that any change will immediately be reflected in the DOM:

```html
<template>
	<div>
		<p>Welcome, {{ user.username }}!</p>
		<p>email: {{ user.email }}</p>

		<form @submit.prevent="updateUser">
			<input type="text" v-model="user.username" placeholder="username"/>
			<input type="email" v-model="user.username" placeholder="email"/>
			<button>Update info</button>
		</form>
	</div>
</template>

<script>
export default {
	setup() {

		let user = User.get('me')

		const updateUser = () => user.patch()

		return { user, updateUser }
	}
}
</script>
```

In addition, changes will be reflected on all entities that share the same record. For instance, if the user changes its profile picture this change will be visible everywhere automatically.

Stallone detects automatically if Vue is installed. In the future it may be possible to explicitly disable this feature.

> When including Stallone directly with a script tag, make sure it is included after Vue
