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

const header2 = `server-timing: edge; dur=178
set-cookie: AUTH=not_authorised; path=/; secure; httponly
set-cookie: Newone=amaze; path=/; secure`;

const header3 = `server-timing: edge; dur=178
set-cookie: AUTH=; path=/; secure; httponly
set-cookie: Newone=amaze; path=/; secure`;

describe('cookie-pot', function () {
    it('finds a cookie name', function () {
        expect(pot.deposit(header1)).to.contain('LoginCookie=');
    });

    it('finds two cookie names and values seperated corrected', function () {
        expect(pot.deposit(header1)).to.contain('LoginCookie=cwZ1; Soft=hqv%2;');
    });

    it('final value does not end with semicolon', function () {
        const expected =
            'LoginCookie=cwZ1; Soft=hqv%2; Anon=Id=22-f.f&Is=False; AUTH=C_r-j; Get=CLEAR; _abc=123~0/+=~-1';
        expect(pot.deposit(header1)).to.equal(expected);
    });

    it('appends existing cookies to new cookies', function () {
        const pot1 = pot.deposit(header1);
        const pot2 = pot.deposit(header2, pot1);
        expect(pot2).to.contain('LoginCookie=cwZ1');
        expect(pot2).to.contain('Newone=amaze');
    });

    it('should not have a leading space in cookie name', function () {
        const pot1 = pot.deposit(header1);
        const pot2 = pot.deposit(header2, pot1);
        expect(pot2).to.not.contain('  Get=CLEAR');
    });

    it('replaces existing cookie with latest value', function () {
        const pot1 = pot.deposit(header1);
        const pot2 = pot.deposit(header2, pot1);
        expect(pot2).to.contain('AUTH=not_authorised');
        expect(pot2).to.not.contain('AUTH=C_r-j');
    });

    it('deletes existing cookie with empty value', function () {
        const pot1 = pot.deposit(header1);
        expect(pot1).to.contain('AUTH=C_r-j');
        const pot2 = pot.deposit(header3, pot1);
        expect(pot2).to.not.contain('AUTH=');
    });
});
