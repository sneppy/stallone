# Stallone

> An elegant and intuitive library to create REST clients.

How to use the library
----------------------

Install the library via npm:

```console
$ npm install @sneppy/ponyjs --save
```

Import it and create a new instance:

```javascript
import { Pony } from '@sneppy/ponyjs'

let api = new Pony({
	baseURL: 'http://localhost:8080/api' // API base URL
})
```

Declare one or more models:

```javascript
class User extends api.Model {}
class Post extends api.Model {}
```

Fetch a user using its username:

```javascript
let user = User.get('sneppy') // GET <baseURL>/user/sneppy
```

Wait for server to respond:

```javascript
user.wait().then((u) => console.log(u.username))
```

Change some properties and update:

```javascript
u.username = 'snoopy'
u.patch().wait((u) => console.log('patched ' + u.username)) // PATCH <baseURL>/user/<user.id> { username: 'snoopy' }
```

Advanced usage
--------------

WIP
