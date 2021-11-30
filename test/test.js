const assert = require('assert');
const pot = require('../index');
const chai = require('chai'); // https://www.chaijs.com/
var expect = chai.expect;

describe('Hello', function () {
    it('says hello', function () {
        assert.equal(pot.world(), 'hello');
    });

    it('contains ell', function () {
        expect(pot.world()).to.contain('ell');
    });
});

const header1 = `server-timing: edge; dur=178
set-cookie: LoginCookie=cwZ1; expires=Wed, 30 Nov 2022 00:00:00 GMT; path=/; secure
set-cookie: Soft=hqv%2; expires=Wed, 30 Nov 2022 21:46:49 GMT; path=/
set-cookie: Anon=Id=22-f.f&Is=False; expires=Thu, 30 Nov 2051 00:00:00 GMT; path=/; secure
set-cookie: AUTH=C_r-j; path=/; secure; httponly
set-cookie: Get=CLEAR; path=/; secure
set-cookie: _abc=123~0/+=~-1; Domain=.example.com; Path=/; Expires=Wed, 30 Nov 2022 21:46:50 GMT; Max-Age=31536000; Secure`;

describe('cookie-pot', function () {
    it('finds a cookie name', function () {
        expect(pot.deposit(header1)).to.contain('LoginCookie=');
    });
});
