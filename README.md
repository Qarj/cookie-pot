# cookie-pot

Cookie jar style helper function for node HTTP requests

# Usage

```js
const pot = require('cookie-pot');

let cookiePot = pot.deposit(responseHeader1String);
cookiePot = pot.deposit(responseHeader2String, cookiePot);
cookiePot = pot.deposit(responseHeader3String, cookiePot);
```

The cookie-pot will

-   merge in new cookies from the response header strings
-   update the values of existing cookies
-   remove cookies if the value is set to the empty string

The `cookiePot` string can be used for the `cookie` request header verbatim.
