"use strict";

var assert = require("assert")
var index = require("./")
var mocha = require("mocha")

describe("authorize", function () {
  var auth = index({})

  it("should return function", function () {
    assert.equal(typeof auth, "function")
  })

  it("should return getCredentials function", function () {
    assert.equal(typeof auth.getCredentials, "function")
  })

  it("should return getToken function", function () {
    assert.equal(typeof auth.getToken, "function")
  })
})