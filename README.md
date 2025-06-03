## MVCraft

**MVCraft** is back-end API framework based on MVC *(Model-Controller-View)* architecture model. It provides many built-in features, such as: parsers (cookies, body etc). It has been created to allow developers to create APIs much faster with less code and modules!


## 1. Installation

`npm install mvcraft@latest`

## 2. Set up your project

```js
import { App } from 'mvcraft'

const config = {
	port: process.env.PORT,
	maxBodySize: 1024,
	connectionTimeout: 10000 // Send timeout handler after 10s if no response
}

const Server = App(config) 
...
Server.Run(port => console.log(`Server is running on ${port} port`)) 
// Server is running on 3000 port by default if not provided in config
```

## 3. Controllers
Controller is basically function that handles an endpoint. However it has many more features described later that allows easy scaling.
```js
import { App, Controller } from 'mvcraft'
const Server = App()

const GreetingController = Controller('/greet', 'GET', (methods) => {
	const { SetHeader, Response } = methods

	SetHeader('Content-Type', 'text/plain')
	Response(200, 'Hello!')
})

Server.AddController(GreetingController.Build())

Server.Run(callback)
```
**Methods** is object argument that provides you all necessary utilities, such as Response for sending data, Content for gathering data (such as query, parameters, path, body etc).

## 4. Views

For more complex endpoints, such as */sign-in* where responses may be different, based on authorization etc you can define **view**. 
```js
import { App, Controller, View } from 'mvcraft'

const Server = App()

const GreetingView = View('GreetingView', (name) => {
	return { 
		success: true,
		message: `Hello there, ${name}!`
	}
})

const GreetingController = Controller('/greet', 'GET', (methods) => {
	const { Content, SetHeader, Response } = methods

	SetHeader('Content-Type', 'application/json')

	const { name } = Content().query.name || 'John doe'
	/* Content() returns object containing:
		 -query params
		 -path params
		 -headers (sent and received)
		 -cookies
		 -path 
		 -method
		 -body
	*/
	Response(200, 'GreetingView', name)
	/* In this case GreetingView will be replaced by its view output and name is passed as third argument to view handler */
})

Server.AddView(GreetingView)
Server.AddController(GreetingController.Build())

Server.Run(callback)

```
Also MVCraft is automatically converting data to JSON if you provide content-type application/json header and if you receive body with content-type application/json header it also parses it automatically for you!

## 5. Services

If you have some functions that are used very often and you don't want to import it all over and over you can create services. They will be available in every controller and endpoints!
```js
import { App, Controller, Service } from 'mvcraft'

const Server = App()

const UserView = ('UserView', (user) => {

	if(!user) return { success: false, message: 'User not found' }
	return { success: true, data: user }
})

const UserController = ('/user/:id', 'GET', (methods) => {
	const { Content, SetHeader, Response, Execute } = methods

	SetHeader('Content-Type', 'application/json')
	
	const { id } = Content().params.id
	
	const user = await Execute('GetUser', id)
	// You access service by its name and you can provide parameters to it
	
	if(!user) return Response(404, 'UserView')
	Response(200, 'UserView', user)
})

const GetUserService = ('GetUser', async (id) => {
	const user = await // your code logic goes here...
	return user
})

Server.AddService(GetUserService)
Server.AddView(UserView)
Server.AddController(UserController.Build())

Server.Run(callback)
```

## 6. Endpoints

If you want to scale your project you can use controller not only as a single route handler but as a "container" for multiple endpoints!
```js
...
	const UserController = ('/user/:endpoint', '*', ({ Endpoint, End }) => 
		Endpoint('sign-in', 'POST', ({ Response }) => {
			...
			Response(200, 'Signed in!')
		})
	
		Endpoint('sign-up', 'POST', ({ Response }) => {
			...
			Response(200, 'Signed up!')
		})

		Endpoint('info', 'GET', ({ Response }) => {
			...
			Response(200, 'UserView', userData)
		})
		
		End()
		//IMPORTANT! You must provide End() after all endpoints declaration
	})
...
```

## 7. Error handling

**MVCraft**  provides built-in error handling system that prevents your app from crashing. It sends responses for scenarios such as: path not found, body payload is too large or any other unhandled error. You can modify it and set your custom responses easily.
```js
...
const UserController = ('/user/:endpoint', '*', (methods) => {
	// Here is some unhandled error example
	throw new Error('custom_error')
})

UserController.Handle(('custom_error', ({ Response }, err) => { 
	Response(500, ...)
})
// You can also provide "default" handler for any uncaught errors
UserController.Handle('*', ({ Response }, err) => {
	console.log(err)
	Response(500, ...)
})
...
```
This *Handle* function will also get errors from services or endpoints used in UserController which means you don't have to write all the time try / catch in your code!


```