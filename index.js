let length = 0;
let pos = 0;
let text = '';

function deposit(header, pot = []) {
    length = header.length;
    pos = 0;
    text = header;

    while (pos < length) {
        if (!eatLenient('set-cookie: ')) {
            break;
        }
        let name = eatName();
        eatEquals();
        let value = eatValue();
        eatSemicolon();
        pot.push({ name, value });
    }
    console.log(pot);

    return buildCookieString(pot);
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

function eatName() {
    let name = '';
    while (pos < length) {
        if (text[pos] === '=') {
            return name;
        }
        name += text[pos];
        pos += 1;
    }
    throw 'Cookie name must end with an equals sign.';
}

function eatEquals() {
    if (text[pos] === '=') {
        pos += 1;
        return;
    }
    throw 'Expected equals sign.';
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
    throw 'Cookie value must end with a semicolon.';
}

function eatSemicolon() {
    if (text[pos] === ';') {
        pos += 1;
        return;
    }
    throw 'Expected semicolon.';
}

function buildCookieString(pot) {
    let cookieString = '';
    for (const cookie of pot) {
        cookieString += cookie.name + '=' + cookie.value + '; ';
    }
    if (cookieString.length > 0) {
        cookieString = cookieString.substring(0, cookieString.length - 2);
    }
    console.log(cookieString);
    return cookieString;
}

function world() {
    return 'hello';
}

module.exports = {
    deposit,
    world,
};
