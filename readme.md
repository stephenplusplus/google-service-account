# google-service-account

> Make authenticated requests using a [Google service account][gsa].

This maintains an active Google service account token, allowing you to make server-to-server requests. It will automatically re-fetch a new token if a previous one expires.

To make a valid connection, you just attach an `Authorization` property to your outgoing request's `headers` object. This module returns that object.


## Install
```sh
$ npm install --save google-service-account
```


## Use
> *error handling omitted*

```js
var request = require("request")

var authorize = require("google-service-account")({
  keyFile: "path/to/keyfile.json"
})

authorize(function (err, headers) {
  request({
    method: "GET",
    uri: "https://www.googleapis.com/pubsub/v1beta1/subscriptions",
    headers: headers
  }, function () {
    // Request callback.
  })
})
```

Each time you invoke `authorize()`, a new token may be fetched if necessary. Be sure to call it each time you make an outgoing request.

If the example above looked a little verbose for you, you may also use the `authorize` function for its extending functionality:

```js
authorize({
  method: "GET",
  uri: "https://www.googleapis.com/pubsub/v1beta1/subscriptions"
}, function (err, requestObject) {
  request(requestObject, function () {
    // Request callback.
  })
})
```

If even *that* gets tiresome, you can always write up a quick helper for your app:

```js
function makeAuthorizedRequest(opts, cb) {
  authorize(opts, function (err, requestObject) {
    request(requestObject, cb)
  })
}
// ...later...
makeAuthorizedRequest({
  method: "GET",
  uri: "https://www.googleapis.com/pubsub/v1beta1/subscriptions"
}, function(err, response) {
  // Request callback.
})
```

## API

### var authorize = require("google-service-account")(options)

#### options

**One of the following is required:**

##### options.credentials
- Type: `Object`

The contents of a JSON key file downloaded from the [Google Developers Console][console].

##### options.keyFile
- Type: `String`

Path to a JSON key file downloaded from the [Google Developers Console][console].

##### options.scopes
- Type: `Array`

The scopes your request requires.

### authorize([options,] callback)
- Type: `Function`

Invoke this method every time you need a valid token. It will handle requesting a new token if necessary, and will return it to your callback as part of an HTTP request headers object:
```
{
  headers: {
    Authorization: "..token.."
  }
}
```

#### options
- (optional)
- Type: `Object`

The object you pass in here will be extended with the token object in the format above.

#### callback
- Type: `Function`

The callback function receives a HTTP request `headers` object, containing a valid token.

### authorize.getCredentials()

Invoke this method to get the credentials object, containing the client_email, client_id, etc.

### authorize.getToken()

Invoke this method to get only the value of a token.

[console]: https://console.developers.google.com
[gsa]: https://developers.google.com/accounts/docs/OAuth2ServiceAccount