let length = 0;
let pos = 0;
let text = '';

function deposit(headers, cookieString = '') {
    let pot = buildPotFromCookieString(cookieString);

    headers = normaliseHeaders(headers);

    length = headers.length;
    pos = 0;
    text = headers;

    while (pos < length) {
        if (!eatLenient('set-cookie:')) {
            break;
        }
        eatWhitespace();
        let name = eatName();
        eatEquals();
        let value = eatValue();
        eatSemicolon();
        pot = potPush(pot, name, value);
    }

    return buildCookieString(pot);
}

function normaliseHeaders(headers) {
    type = typeof headers;
    if (type === 'string') {
        return headers;
    }
    if (type === 'object') {
        return normaliseOjbectHeaders(headers);
    }
    throw `Headers object of ${type} is not supported.`;
}

function normaliseOjbectHeaders(headers) {
    if (headers.hasOwnProperty('headers')) {
        return stringifyRequestResponseHeaders(headers);
    }
    throw 'Headers object is unknown and not supported.';
}

function stringifyRequestResponseHeaders(headers) {
    stringified = '';
    if (headers.headers.hasOwnProperty('set-cookie')) {
        const setCookie = headers.headers['set-cookie'];
        for (const cookie of setCookie) {
            stringified += 'set-cookie: ' + cookie;
        }
    }
    return stringified;
}

function potPush(pot, name, value) {
    let newPot = [];
    pushedAlready = false;
    for (const cookie of pot) {
        if (cookie.name === name) {
            newPot = pushValue(newPot, name, value);
            pushedAlready = true;
        } else {
            newPot.push(cookie);
        }
    }
    if (!pushedAlready) {
        newPot = pushValue(newPot, name, value);
    }
    return newPot;
}

function pushValue(pot, name, value) {
    if (value.length > 0) {
        pot.push({ name, value });
    }
    return pot;
}

function buildPotFromCookieString(cookieString) {
    if (cookieString.length > 1) {
        cookieString += ';';
    }
    text = cookieString;
    length = text.length;
    pos = 0;

    let pot = [];
    while (pos < length) {
        eatWhitespace();
        let name = eatName();
        eatEquals();
        let value = eatValue();
        pot.push({ name, value });
        eatSemicolon();
    }
    return pot;
}

function eatLenient(target) {
    while (pos < length) {
        let current = text.substring(pos, pos + target.length);
        if (current === target) {
            pos += target.length;
            return true;
        }
        pos += 1;
    }
    return false;
}

function eatWhitespace() {
    while (pos < length) {
        if (text[pos] === ' ') {
            pos += 1;
        } else {
            return;
        }
    }
}

function eatName() {
    let name = '';
    while (pos < length) {
        if (text[pos] === '=') {
            return name;
        }
        name += text[pos];
        pos += 1;
    }
    throw `Cookie name must end with an equals sign at position ${pos}.`;
}

function eatEquals() {
    if (text[pos] === '=') {
        pos += 1;
        return;
    }
    throw `Expected equals sign at position ${pos}.`;
}

function eatValue() {
    let value = '';
    while (pos < length) {
        if (text[pos] === ';') {
            return value;
        }
        value += text[pos];
        pos += 1;
    }
    throw `Cookie value must end with a semicolon at position ${pos}.`;
}

function eatSemicolon() {
    if (text[pos] === ';') {
        pos += 1;
        return;
    }
    throw `Expected semicolon at position ${pos}.`;
}

function buildCookieString(pot) {
    let cookieString = '';
    for (const cookie of pot) {
        cookieString += cookie.name + '=' + cookie.value + '; ';
    }
    if (cookieString.length > 0) {
        cookieString = cookieString.substring(0, cookieString.length - 2);
    }
    return cookieString;
}

function world() {
    return 'hello';
}

module.exports = {
    deposit,
    world,
};
