class CookiePot {
    constructor() {
        this.pot = [];
        this.length = 0;
        this.pos = 0;
        this.text = '';
    }

    clear() {
        this.length = 0;
        this.pos = 0;
        this.text = '';
        this.pot = [];
    }

    deposit(headers) {
        headers = this.normaliseHeaders(headers);

        this.length = headers.length;
        this.pos = 0;
        this.text = headers;

        while (this.pos < this.length) {
            if (!this.eatLenient('set-cookie:')) {
                break;
            }
            this.eatWhitespace();
            let name = this.eatName();
            this.eatEquals();
            let value = this.eatValue();
            this.eatSemicolon();
            this.potPush(name, value);
        }

        return this.buildCookieString();
    }

    getCookie(name) {
        for (const cookie of this.pot) {
            if (cookie.name === name) {
                return cookie.value;
            }
        }
        for (const cookie of this.pot) {
            if (cookie.name.includes(name)) {
                return cookie.value;
            }
        }

        return '';
    }

    getCookieString() {
        return this.buildCookieString();
    }

    normaliseHeaders(headers) {
        const type = typeof headers;
        if (type === 'string') {
            return headers;
        }
        if (type === 'object') {
            return this.normaliseObjectHeaders(headers);
        }
        throw `Headers object of ${type} is not supported.`;
    }

    normaliseObjectHeaders(headers) {
        if (headers.hasOwnProperty('headers')) {
            return this.stringifyRequestResponseHeaders(headers);
        }
        throw 'Headers object is unknown and not supported.';
    }

    stringifyRequestResponseHeaders(headers) {
        let stringified = '';
        if (headers.headers.hasOwnProperty('set-cookie')) {
            const setCookie = headers.headers['set-cookie'];
            for (const cookie of setCookie) {
                stringified += 'set-cookie: ' + cookie;
            }
        }
        return stringified;
    }

    potPush(name, value) {
        let newPot = [];
        let pushedAlready = false;
        for (const cookie of this.pot) {
            if (cookie.name === name) {
                newPot = this.pushValue(newPot, name, value);
                pushedAlready = true;
            } else {
                newPot.push(cookie);
            }
        }
        if (!pushedAlready) {
            newPot = this.pushValue(newPot, name, value);
        }
        this.pot = newPot;
    }

    pushValue(_pot, name, value) {
        if (value.length > 0) {
            _pot.push({ name, value });
        }
        return _pot;
    }

    buildPotFromCookieString(cookieString) {
        if (cookieString.length > 1) {
            cookieString += ';';
        }
        this.text = cookieString;
        this.length = this.text.length;
        this.pos = 0;

        this.pot = [];
        while (this.pos < this.length) {
            this.eatWhitespace();
            let name = this.eatName();
            this.eatEquals();
            let value = this.eatValue();
            this.pot.push({ name, value });
            this.eatSemicolon();
        }
    }

    eatLenient(target) {
        while (this.pos < this.length) {
            let current = this.text.substring(this.pos, this.pos + target.length);
            if (current === target) {
                this.pos += target.length;
                return true;
            }
            this.pos += 1;
        }
        return false;
    }

    eatWhitespace() {
        while (this.pos < this.length) {
            if (this.text[this.pos] === ' ') {
                this.pos += 1;
            } else {
                return;
            }
        }
    }

    eatName() {
        let name = '';
        while (this.pos < this.length) {
            if (this.text[this.pos] === '=') {
                return name;
            }
            name += this.text[this.pos];
            this.pos += 1;
        }
        throw `Cookie name must end with an equals sign at position ${this.pos}.`;
    }

    eatEquals() {
        if (this.text[this.pos] === '=') {
            this.pos += 1;
            return;
        }
        throw `Expected equals sign at position ${this.pos}.`;
    }

    eatValue() {
        let value = '';
        while (this.pos < this.length) {
            if (this.text[this.pos] === ';') {
                return value;
            }
            value += this.text[this.pos];
            this.pos += 1;
        }
        throw `Cookie value must end with a semicolon at position ${this.pos}.`;
    }

    eatSemicolon() {
        if (this.text[this.pos] === ';') {
            this.pos += 1;
            return;
        }
        throw `Expected semicolon at position ${this.pos}.`;
    }

    buildCookieString() {
        let cookieString = '';
        for (const cookie of this.pot) {
            cookieString += cookie.name + '=' + cookie.value + '; ';
        }
        if (cookieString.length > 0) {
            cookieString = cookieString.substring(0, cookieString.length - 2);
        }
        return cookieString;
    }

    world() {
        return 'hello';
    }
}

module.exports = CookiePot;
