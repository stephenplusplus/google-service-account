"use strict";

var assert = require("assert")
var Token = require("./token")
var mocha = require("mocha")

describe("token", function () {
  var accessToken = "token"

  it("should store properties", function () {
    var expiry = new Date
    var token = new Token(accessToken, expiry)

    assert.equal(token.accessToken, accessToken)
    assert.equal(token.expiry, expiry)
  })

  describe("isExpired", function () {
    it("should calculate token isn't expired", function () {
      var expiry = new Date(Date.now() + 100000)
      var token = new Token(accessToken, expiry)

      assert.strictEqual(token.isExpired(), false)
    })

    it("should calculate token is expired", function () {
      var expiry = new Date(Date.now() - 100000)
      var token = new Token(accessToken, expiry)

      assert.strictEqual(token.isExpired(), true)
    })
  })
})