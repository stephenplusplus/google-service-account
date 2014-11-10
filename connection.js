"use strict";

var events = require("events")
var extend = require("extend")
var fs = require("fs")
var GoogleToken = require("gtoken")
var request = require("request")
var Token = require("./token")
var util = require("util")

var METADATA_TOKEN_URL = "http://metadata/computeMetadata/v1/instance/service-accounts/default/token"

function Connection(options) {
  if (!(this instanceof Connection)) return new Connection(options)

  events.EventEmitter.call(this)
  this.setMaxListeners(0)

  options = options || {}

  this.credentials = options.credentials
  this.keyFile = options.keyFile
  this.scopes = options.scopes || []

  if (this.credentials && (!this.credentials.client_email || !this.credentials.private_key))
    throw new Error("A credentials object must contain the following keys: client_email, private_key")
}

util.inherits(Connection, events.EventEmitter)

Connection.prototype.connect = function (callback) {
  if (this.token && !this.token.isExpired()) return setImmediate(callback)

  this.once("connected", callback)

  if (this.isConnecting) return

  this.isConnecting = true
  this.fetchToken(function (err, token) {
    this.isConnecting = false
    if (err) return this.emit("connected", err)
    this.token = token
    this.emit("connected")
  }.bind(this))
}

Connection.prototype.createAuthorizedRequest = function (requestOptions, callback) {
  if (typeof requestOptions === "function") {
    callback = requestOptions
    requestOptions = {}
  }

  this.getToken(function (err, token) {
    if (err) return callback(err)

    callback(null, extend(true, {}, requestOptions, {
      headers: {
        Authorization: "Bearer " + token
      }
    }))
  })
}

Connection.prototype.fetchServiceAccountToken = function (callback) {
  var gtoken = new GoogleToken({
    iss: this.credentials.client_email,
    key: this.credentials.private_key,
    scope: this.scopes
  })

  gtoken.getToken(function (err, token) {
    if (err) return callback(err)
    var exp = new Date(gtoken.expires_at)
    callback(null, new Token(token, exp))
  })
}

Connection.prototype.fetchToken = function (callback) {
  if (/*G[AC]E*/!this.keyFile && !this.credentials)
    return request({
      method: "get",
      uri: METADATA_TOKEN_URL,
      headers: {
        "Metadata-Flavor": "Google"
      },
      json: true
    }, function (err, res, body) {
      if (err || !body.access_token) return callback(err)

      var exp = new Date(Date.now() + body.expires_in * 1000)
      callback(null, new Token(body.access_token, exp))
    })

  if (!this.credentials)
    return fs.readFile(this.keyFile, function (err, data) {
      if (err) return callback(err)
      this.credentials = JSON.parse(data)
      this.fetchServiceAccountToken(callback)
    }.bind(this))

  this.fetchServiceAccountToken(callback)
}

Connection.prototype.getCredentials = function (callback) {
  if (this.credentials) return setImmediate(callback, null, this.credentials)

  this.connect(function (err) {
    if (err) return callback(err)
    callback(null, this.credentials)
  }.bind(this))
}

Connection.prototype.getToken = function (callback) {
  this.connect(function (err) {
    if (err) return callback(err)
    callback(null, this.token.accessToken)
  }.bind(this))
}

module.exports = Connection
