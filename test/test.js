const assert = require('assert');
const chai = require('chai'); // https://www.chaijs.com/
var expect = chai.expect;
const CookiePot = require('../index');
let pot;
const { inspect } = require('util');

beforeEach(function () {
    pot = new CookiePot();
});

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

const header4 = `server-timing: edge; dur=178`;

const header5 = `server-timing: edge; dur=178
set-cookie: AUTH=123; path=/; secure; httponly
set-cookie: Newone=amaze`;

const requestResponse1 = {
    headers: {
        'date': 'Wed, 01 Dec 2021 10:23:43 GMT',
        'content-type': 'text/html;charset=UTF-8',
        'content-length': '362212',
        'set-cookie': [
            'id=2a9;Path=/;Expires=Tue, 21-Dec-2021 12:01:46 UTC;HTTPOnly;HttpOnly;Secure',
            'HASH=f5c8;Path=/;Expires=Thu, 01-Dec-2022 10:23:42 UTC',
            'X-TOKEN=pjb;Path=/;Secure',
            '.AspNetCore.Antiforgery.nUm79WDWtTU=xyz;Path=/;Secure',
            'UX=value1;Path=/;Expires=Fri, 31-Dec-2021 10:23:42 UTC',
            'UX=value2;Path=/;Expires=Fri, 31-Dec-2021 10:23:42 UTC',
            'LANG=de;Path=/;Expires=Thu, 30-Nov-2051 18:15:12 UTC',
            'LANG=de;Path=/;Expires=Thu, 01-Dec-2022 10:23:42 UTC',
            'AUTH=;Path=/;Expires=Wed, 01-Dec-2021 10:23:42 UTC',
        ],
    },
};

const requestResponse2 = {
    headers: {
        'date': 'Wed, 01 Dec 2021 10:23:43 GMT',
        'content-type': 'text/html;charset=UTF-8',
        'content-length': '362212',
    },
};

class MockHeaders {
    constructor(headers) {
        this.headersMap = new Map(Object.entries(headers));
    }

    get(name) {
        return this.headersMap.get(name);
    }

    set(name, value) {
        this.headersMap.set(name, value);
    }

    entries() {
        return this.headersMap.entries();
    }

    [Symbol.iterator]() {
        return this.entries();
    }
}

const headersData1 = {
    'content-type': 'text/html; charset=utf-8',
    'set-cookie': '__Host-X-PROFILE-CSRF-SECRET=twD; Max-Age=300; Path=/; Secure; SameSite=Strict',
};

const nativeFetchMockHeaders1 = new MockHeaders(headersData1);

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
        pot.deposit(header1);
        const cookieString1 = pot.deposit(header2);
        expect(cookieString1).to.contain('LoginCookie=cwZ1');
        expect(cookieString1).to.contain('Newone=amaze');
    });

    it('should not have a leading space in cookie name', function () {
        pot.deposit(header1);
        const cookieString = pot.deposit(header2);
        expect(cookieString).to.not.contain('  Get=CLEAR');
    });

    it('replaces existing cookie with latest value', function () {
        pot.deposit(header1);
        const cookieString = pot.deposit(header2);
        expect(cookieString).to.contain('AUTH=not_authorised');
        expect(cookieString).to.not.contain('AUTH=C_r-j');
    });

    it('deletes existing cookie with empty value', function () {
        const cookieString1 = pot.deposit(header1);
        expect(cookieString1).to.contain('AUTH=C_r-j');
        const cookieString2 = pot.deposit(header3);
        expect(cookieString2).to.not.contain('AUTH=');
    });

    it('handles a header that does not set a cookie', function () {
        const cookieString = pot.deposit(header4);
        expect(cookieString).to.equal('');
    });

    it('handles a request response', function () {
        const cookieString = pot.deposit(requestResponse1);
        expect(cookieString).to.contain('X-TOKEN=pjb;');
    });

    it('handles a request response that contains no set-cookie headers', function () {
        const cookieString = pot.deposit(requestResponse2);
        expect(cookieString).to.equal('');
    });

    it('can get a cookie value', function () {
        pot.deposit(requestResponse1);
        const token = pot.getCookie('X-TOKEN');
        expect(token).to.equal('pjb');
    });

    it('can get a cookie value by partial cookie name', function () {
        pot.deposit(requestResponse1);
        const token = pot.getCookie('Antiforgery');
        expect(token).to.equal('xyz');
    });

    it('can have separate pots', function () {
        pot.deposit(requestResponse1);
        const token = pot.getCookie('Antiforgery');
        expect(token).to.equal('xyz');
        const pot2 = new CookiePot();
        pot2.deposit(header3);
        expect(pot2.getCookie('Antiforgery')).to.equal('');
        expect(pot2.getCookie('Newone')).to.equal('amaze');
        expect(pot.getCookie('Antiforgery')).to.equal('xyz');
        expect(pot.getCookie('Newone')).to.equal('');
    });

    it('can build a pot from a cookie string', function () {
        const cookieString = pot.deposit(requestResponse1);
        const pot2 = new CookiePot();
        pot2.buildPotFromCookieString(cookieString);
        expect(pot2.cookieString).to.equal(cookieString);
        expect(pot2.getCookie('X-TOKEN')).to.equal('pjb');
    });

    it('can cope with set cookie header responses that do not end with a semi colon', function () {
        const cookieString = pot.deposit(header5);
        expect(cookieString).to.contain('Newone=amaze');
    });

    it('can set a new cookie', function () {
        pot.deposit(header1);
        pot.setCookie('new', 'power=5');
        expect(pot.cookieString).to.contain('new=power=5');
    });

    it('can overwrite an existing cookie', function () {
        pot.deposit(header1);
        expect(pot.cookieString).to.contain('LoginCookie=cwZ1');
        pot.setCookie('LoginCookie', 'abcd');
        expect(pot.cookieString).to.not.contain('LoginCookie=cwZ1');
        expect(pot.cookieString).to.contain('LoginCookie=abcd');
    });

    it('can delete a cookie', function () {
        pot.deposit(header1);
        expect(pot.cookieString).to.contain('LoginCookie=cwZ1');
        pot.setCookie('LoginCookie', '');
        expect(pot.cookieString).to.not.contain('LoginCookie');
    });

    it('can set cookies from the request header string', function () {
        const requestHeader = `Accept-Language
	en-GB,en;q=0.5
Connection
	keep-alive
Cookie
	VIS_ID=123; _abck=234~0~YAAQ/0; SessionCookie=345; MY_COOKIE=PCY; amaze=34=34; last=1
	1
Host
	www.example.com
Sec-Fetch-Dest
	image`;
        pot.addPossibleCookies(requestHeader);
        expect(pot.cookieString).to.contain('VIS_ID=123');
        expect(pot.cookieString).to.contain('SessionCookie=345');
        expect(pot.cookieString).to.contain('MY_COOKIE=PCY');
        expect(pot.cookieString).to.contain('amaze=34=34');
        expect(pot.cookieString).to.contain('last=1');
        expect(pot.cookieString).to.not.contain('q=0.5');
    });

    it('can handle a node fetch response - simulate pass in of response.headers', function () {
        pot.deposit(nativeFetchMockHeaders1);
        expect(pot.cookieString).to.contain('__Host-X-PROFILE-CSRF-SECRET=twD');
    });

    it('can handle a node fetch response - simulate pass in of response', function () {
        pot.deposit({ headers: nativeFetchMockHeaders1 });
        expect(pot.cookieString).to.contain('__Host-X-PROFILE-CSRF-SECRET=twD');
    });
});
