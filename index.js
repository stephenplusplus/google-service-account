"use strict";

var Connection = require("./connection")

module.exports = function (options) {
  var connection = new Connection(options)
  var authorize = connection.createAuthorizedRequest.bind(connection)
  authorize.getCredentials = connection.getCredentials.bind(connection)
  authorize.getToken = connection.getToken.bind(connection)
  return authorize
}
