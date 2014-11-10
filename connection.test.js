"use strict";

var assert = require("assert")
var mocha = require("mocha")
var sandbox = require("sandboxed-module")

var GoogleTokenOverride
var requestOverride
var Connection = sandbox.require("./connection", {
  requires: {
    gtoken: function () {
      (GoogleTokenOverride || require("gtoken")).apply(this, [].slice.call(arguments))
      GoogleTokenOverride = null
    },
    request: function () {
      (requestOverride || require("request")).apply(this, [].slice.call(arguments))
      requestOverride = null
    }
  }
})

var credentials = require("./keyfile.json")

describe("connection", function () {
  var conn
  var token = "tokentokentoken"

  beforeEach(function () {
    conn = new Connection
  })

  it("should throw error if missing credentials provided", function () {
    assert.throws(function () {
      new Connection({
        credentials: {}
      })
    }, /must contain/)
  })

  describe("connect()", function () {
    it("should execute callback if token is not expired", function (done) {
      conn.token = {
        isExpired: function () {
          return false
        }
      }

      conn.connect(done)
    })

    it("should execute callback once token is fetched", function (done) {
      conn.fetchToken = function (cb) {
        cb()
      }

      conn.connect(done)
    })

    it("should not buffer up token fetch attempts", function (done) {
      conn.fetchToken = function (cb) {
        assert.strictEqual(conn.isConnecting, true)
        cb()
      }

      conn.connect(function () {
        assert.strictEqual(conn.isConnecting, false)
        done()
      })
    })

    it("should store token on instance", function (done) {
      conn.fetchToken = function (cb) {
        cb(null, token)
      }

      conn.connect(function () {
        assert.equal(conn.token, token)
        done()
      })
    })
  })

  describe("createAuthorizedRequest()", function () {
    beforeEach(function () {
      conn.getToken = function (cb) {
        cb(null, token)
      }
    })

    it("should execute callback with token", function (done) {
      conn.createAuthorizedRequest(function (err, authorizedRequest) {
        assert.ifError(err)

        assert.deepEqual(authorizedRequest, {
          headers: {
            Authorization: "Bearer " + token
          }
        })

        done()
      })
    })

    it("should extend provided object with token", function (done) {
      var originalRequest = {
        a: "b",
        c: "d"
      }

      conn.createAuthorizedRequest(originalRequest, function (err, authorizedRequest) {
        assert.ifError(err)

        assert.deepEqual(authorizedRequest, {
          a: "b",
          c: "d",
          headers: {
            Authorization: "Bearer " + token
          }
        })

        // originalRequest wasn't modified:
        assert(!originalRequest.headers)

        done()
      })
    })
  })

  describe("fetchServiceAccountToken()", function () {
    var conn
    var scopes = ["something", "somethingelse"]

    beforeEach(function () {
      conn = new Connection({
        credentials: credentials,
        scopes: scopes
      })
    })

    it("should construct a gtoken object", function (done) {
      GoogleTokenOverride = function (opts) {
        this.getToken = function() {}
        assert.equal(opts.iss, credentials.client_email)
        assert.equal(opts.key, credentials.private_key)
        assert.equal(opts.scope, scopes)
        done()
      }

      conn.fetchServiceAccountToken()
    })

    it("should execute callback with a gtoken", function (done) {
      GoogleTokenOverride = function (opts, cb) {
        this.getToken = function (cb) {
          cb(null, {
            access_token: token,
            expires_in: 200
          })
        }
        setImmediate(cb)
      }

      conn.fetchServiceAccountToken(function (err, token) {
        assert.ifError(err)
        assert.equal(token.constructor.name, "Token")
        done()
      })
    })
  })

  describe("fetchToken()", function () {
    describe("g[ac]e", function () {
      it("should get a token from the metadata server", function (done) {
        requestOverride = function(opts) {
          assert.equal(opts.method.toLowerCase(), "get")
          assert.equal(opts.uri, "http://metadata/computeMetadata/v1/instance/service-accounts/default/token")
          assert.equal(opts.headers["Metadata-Flavor"], "Google")
          assert.strictEqual(opts.json, true)
          done()
        }

        conn.fetchToken()
      })

      it("should create token from response", function (done) {
        requestOverride = function (opts, cb) {
          cb(null, null, {
            access_token: token,
            expires_in: 200
          })
        }

        conn.fetchToken(function (err, token) {
          assert.ifError(err)
          assert.equal(token.constructor.name, "Token")
          done()
        })
      })
    })

    describe("keyfile", function () {
      var conn

      beforeEach(function () {
        conn = new Connection({
          keyFile: "keyfile.json"
        })
      })

      it("should fetch a service account token & parse the keyfile provided", function (done) {
        conn.fetchServiceAccountToken = function (cb) {
          cb()
        }

        conn.fetchToken(function (err) {
          assert.ifError(err)
          assert.deepEqual(conn.credentials, credentials)
          done()
        })
      })
    })

    describe("credentials", function () {
      var conn

      beforeEach(function () {
        conn = new Connection({
          credentials: credentials
        })
      })

      it("should fetch a service account token", function (done) {
        conn.fetchServiceAccountToken = function () {
          done()
        }

        conn.fetchToken(function () {})
      })
    })
  })

  describe("getCredentials()", function () {
    it("should call connect", function (done) {
      conn.connect = function () {
        done()
      }

      conn.getCredentials()
    })

    it("should execute callback with credentials", function (done) {
      conn.connect = function () {
        conn.credentials = {
          fake: "credentials"
        }
        done()
      }

      conn.getCredentials(function (err, credentials) {
        assert.ifError(err)
        assert.deepEqual(credentials, conn.credentials)
        done()
      })
    })

    it("should not reconnect if credentials exist", function (done) {
      var connectCalled = false
      conn.connect = function () {
        connectCalled = true
      }

      conn.credentials = {
        fake: "credentials"
      }

      conn.getCredentials(function (err, credentials) {
        assert.ifError(err)
        assert.deepEqual(credentials, conn.credentials)
        done()
      })
    })
  })

  describe("getToken()", function () {
    it("should call connect", function (done) {
      conn.connect = function () {
        done()
      }

      conn.getToken()
    })

    it("should execute callback with token", function (done) {
      conn.connect = function (cb) {
        conn.token = {
          accessToken: token
        }
        cb()
      }

      conn.getToken(function (err, tkn) {
        assert.ifError(err)
        assert.equal(tkn, token)
        done()
      })
    })
  })
})
