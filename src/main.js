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

let user = User.get('sneppy13')
user.wait().then((u) => {

	u.bio = 'Software engineer by day, software engineer by night'
	u.patch().then(() => console.log('patched'))
})
