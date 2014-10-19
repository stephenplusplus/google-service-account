"use strict";

function Token(accessToken, expiry) {
  this.accessToken = accessToken
  this.expiry = expiry
}

Token.prototype.isExpired = function () {
  if (!this.accessToken || !this.expiry) return true
  return new Date().getTime() - this.expiry.getTime() > 0
}

module.exports = Token
