# cookie-pot

![Tests](https://github.com/Qarj/cookie-pot/workflows/Tests/badge.svg)
![Publish to npmjs](https://github.com/Qarj/cookie-pot/workflows/Publish%20to%20npmjs/badge.svg)

Cookie jar style helper function for Node.js HTTP requests to assist test and development of services.

## Usage

```js
const CookiePot = require('cookie-pot');

const pot = new CookiePot();

const cookieString = pot.deposit(response1);
pot.deposit(response2);
pot.deposit(response3);

const updatedCookieString = pot.cookieString;
```

CookiePot will

-   merge in new cookies from the response header strings
-   update the values of existing cookies
-   remove cookies if the value is set to the empty string

The cookie string string returned by the `deposit()` method and the `cookieString` property can be used for the `Cookie` request header verbatim.

To get a single cookie value from the cookiePot

```js
const myCookie = pot.getCookie('myCookie');
```

If an exact match is not found, CookiePot will return the first cookie that includes the given name.

To clear the contents of the cookie pot

```js
pot.clear();
```

A cookie pot can be built from an existing cookie string (will wipe the existing content)

```js
const cookieString = 'id=2a9; X-TOKEN=pjb; .AspNetCore.Antiforgery.nUm79WDWtTU=xyz; LANG=de';
const pot = new CookiePot();
pot.buildPotFromCookieString(cookieString);
```

To set or overwrite a cookie value

```js
pot.setCookie('myCookie', '123');
```

To remove a cookie, set it to the empty string

```js
pot.setCookie('myCookie', '');
```

To build a cookie pot from request headers copied and pasted from the browser

```js
const requestHeader = `Accept-Language
    en-GB,en;q=0.5
Cookie
    VIS_ID=123; _abck=234~0~YAAQ/0; SessionCookie=345; MY_COOKIE=PCY; amaze=34=34; last=1
    1
Host
    www.example.com`;
pot.addPossibleCookies(requestHeader);
```

## Supported responses

CookiePot currently understands response header strings that look like

```lang-text
content-length: 29384
setcookie: mycookie=123; expires=Wed, 30 Nov 2022 00:00:00 GMT; path=/; secure
setcookie: LANG=en; expires=Wed, 30 Nov 2022 00:00:00 GMT;
```

CookiePot also understands request responses that includes a headers key that looks like (as returned by Axios)

```js
    headers: {
        'date': 'Wed, 01 Dec 2021 10:23:43 GMT',
        'content-type': 'text/html;charset=UTF-8',
        'content-length': '362212',
        'set-cookie': [
            'id=2a9;Path=/;Expires=Tue, 21-Dec-2021 12:01:46 UTC;HttpOnly;Secure',
            'HASH=f5c8;Path=/;Expires=Thu, 01-Dec-2022 10:23:42 UTC',
        ],
    },
```

## Axios example

```js
const axios = require('axios');
const CookiePot = require('cookie-pot');

login();

async function login() {
    const url = `https://www.example.com/Account/SignIn`;
    const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.4472.114 Safari/537.36';

    let options;
    let response;
    options = { headers: { 'User-Agent': userAgent } };
    response = await axios.get(url, options);
    let pot = new CookiePot();
    pot.deposit(response);

    const requestVerificationToken = pot.getCookie('Antiforgery');
    const signinPayload = `Form.Email=username%40example.com&Form.Password=pass123&Form.RememberMe=true&__RequestVerificationToken=${requestVerificationToken}&Form.RememberMe=true`;
    options = {
        data: signinPayload,
        method: 'POST',
        headers: {
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': pot.cookieString,
        },
        maxRedirects: 0,
        validateStatus: (status) => {
            return status >= 200 && status < 400;
        },
    };
    response = await axios(url, options);
    pot.deposit(response);
}
```

With Axios in addition to setting `maxRedirects: 0` you have to supply a `validateStatus` function that returns true for 3xx status codes otherwise Axios will throw an error.

## SuperAgent example

```js
const superagent = require('superagent');
const CookiePot = require('cookie-pot');

login();

async function login() {
    const url = `https://www.example.com/Account/SignIn`;
    const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.4472.114 Safari/537.36';

    let response;
    let pot = new CookiePot();
    response = await superagent.get(url).set('User-Agent', userAgent);
    pot.deposit(response);

    const requestVerificationToken = pot.getCookie('Antiforgery');
    const signinPayload = `Form.Email=username%40example.com&Form.Password=pass123&Form.RememberMe=true&__RequestVerificationToken=${requestVerificationToken}&Form.RememberMe=true`;
    try {
        response = await superagent
            .post(url)
            .redirects(0)
            .set('User-Agent', userAgent)
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Cookie', pot.cookieString)
            .send(signinPayload);
    } catch (error) {
        response = error.response;
    }
    pot.deposit(response);
}
```

With SuperAgent you set `redirects(0)` so you can see the 3xx response headers, but it will also throw an error. You have to catch the error and get the response from the error object.

## node-fetch example

```js
import CookiePot from 'cookie-pot';
import fetch from 'node-fetch';

login();

async function login() {
    const url = `https://www.example.com/Account/SignIn`;
    const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.4472.114 Safari/537.36';

    let options;
    let response;
    options = { headers: { 'User-Agent': userAgent } };
    response = await fetch(url, options);
    let pot = new CookiePot();
    pot.deposit(response.headers.raw());

    const requestVerificationToken = pot.getCookie('Antiforgery');
    const signinPayload = `Form.Email=username%40example.com&Form.Password=pass123&Form.RememberMe=true&__RequestVerificationToken=${requestVerificationToken}&Form.RememberMe=true`;
    options = {
        method: 'POST',
        headers: {
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': pot.cookieString,
        },
        body: signinPayload,
        redirect: 'manual',
    };
    response = await fetch(url, options);
    pot.deposit(response.headers.raw());
}
```

To install `node-fetch`, put `"type": "module"` in your `package.json` and run `npm install node-fetch`.

To stop `node-fetch` following redirects, set `redirect: 'manual'` in the options.

## native node fetch (v18+) example

```js
import CookiePot from 'cookie-pot';

login();

async function login() {
    const url = `https://www.example.com/Account/SignIn`;
    const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36';

    let options;
    let response;
    options = { headers: { 'User-Agent': userAgent } };
    response = await fetch(url, options);
    let pot = new CookiePot();
    pot.deposit(response);

    const requestVerificationToken = pot.getCookie('Antiforgery');
    const signinPayload = `Form.Email=example%40example.com&Form.Password=pass123&Form.RememberMe=true&__RequestVerificationToken=${requestVerificationToken}&Form.RememberMe=true`;
    options = {
        method: 'POST',
        headers: {
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': pot.cookieString,
        },
        body: signinPayload,
        redirect: 'manual',
    };
    response = await fetch(url, options);
    if (response.status !== 302) {
        console.log(`Login failed: ${response.status} ${response.statusText}`);
        return;
    }
    console.log(`Login successful: ${response.status} ${response.statusText}`);
    pot.deposit(response);
    console.log(pot.cookieString);
}
```

## got example

```js
import CookiePot from 'cookie-pot';
import got from 'got';

login();

async function login() {
    const signinUrl = `https://www.example.com/Account/SignIn`;
    const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.4472.114 Safari/537.36';

    let response;
    response = await got(signinUrl, { headers: { 'User-Agent': userAgent } });
    let pot = new CookiePot();
    pot.deposit(response);

    const requestVerificationToken = pot.getCookie('Antiforgery');
    const signinPayload = `Form.Email=username%40example.com&Form.Password=pass123&Form.RememberMe=true&__RequestVerificationToken=${requestVerificationToken}&Form.RememberMe=true`;
    response = await got.post(signinUrl, {
        headers: {
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': pot.cookieString,
        },
        body: signinPayload,
        followRedirect: false,
    });
    pot.deposit(response.headers);
}
```

To install `got`, put `"type": "module"` in your `package.json` and run `npm install got`.

To stop `got` following redirects, set `followRedirect: false` in the options.
