# cookie-pot

[![GitHub Super-Linter](https://github.com/Qarj/cookie-pot/workflows/Lint%20Code%20Base/badge.svg)](https://github.com/marketplace/actions/super-linter)
![Tests](https://github.com/Qarj/cookie-pot/workflows/Tests/badge.svg)
![Publish to npmjs](https://github.com/Qarj/cookie-pot/workflows/Publish%20to%20npmjs/badge.svg)

Cookie jar style helper function for Node.js HTTP requests

## Usage

```js
const CookiePot = require('cookie-pot');

const pot = new CookiePot();

let cookieString = pot.deposit(response1);
pot.deposit(response2);
pot.deposit(response3);

pot.getCookieString();
```

CookiePot will

-   merge in new cookies from the response header strings
-   update the values of existing cookies
-   remove cookies if the value is set to the empty string

The `cookieString` string returned by the `deposit` and `getCookieString` methods can be used for the `cookie` request header verbatim.

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

const pot = new CookiePot();

const signinUrl = `https://www.example.com/Account/SignIn`;
const signinPage = await axios.get(signinUrl);

pot.deposit(signinPage);

const requestVerificationToken = pot.getCookie('Antiforgery');
const signinPayload = `email=example%40example.com&Password=12345&__RequestVerificationToken=${requestVerificationToken}`;

const signinResponse = await axios.post(signinUrl, signinPayload, {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': pot.getCookieString(),
    },
    maxRedirects: 0,
    validateStatus: (status) => {
        return status >= 200 && status < 400;
    },
});

pot.deposit(signinResponse);
```
