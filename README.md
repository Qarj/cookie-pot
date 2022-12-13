# cookie-pot

[![GitHub Super-Linter](https://github.com/Qarj/cookie-pot/workflows/Lint%20Code%20Base/badge.svg)](https://github.com/marketplace/actions/super-linter)
![Tests](https://github.com/Qarj/cookie-pot/workflows/Tests/badge.svg)
![Publish to npmjs](https://github.com/Qarj/cookie-pot/workflows/Publish%20to%20npmjs/badge.svg)

Cookie jar style helper function for Node.js HTTP requests

## Usage

```js
const pot = require('cookie-pot');

let cookieString = pot.deposit(response1);
pot.deposit(response2);
pot.deposit(response3);

pot.getCookieString();
```

The cookie-pot will

-   merge in new cookies from the response header strings
-   update the values of existing cookies
-   remove cookies if the value is set to the empty string

The `cookiePot` string can be used for the `cookie` request header verbatim.

To get a single cookie value from the cookiePot

```js
const myCookie = pot.getCookie('myCookie');
```

If an exact match is not found, cookie-pot will return the first cookie that includes the given name.

To clear the contents of the cookie pot

```js
pot.clear();
```

## Supported responses

cookie-pot currently understands response header strings that look like

```lang-text
content-length: 29384
setcookie: mycookie=123; expires=Wed, 30 Nov 2022 00:00:00 GMT; path=/; secure
setcookie: LANG=en; expires=Wed, 30 Nov 2022 00:00:00 GMT;
```

cookie-pot also understands request responses that includes a headers key that looks like

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

Known to work with

-   axios
