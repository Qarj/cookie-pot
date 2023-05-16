class CookiePot {
    constructor() {
        this.pot = [];
        this.length = 0;
        this.pos = 0;
        this.text = '';
    }

    addPossibleCookies(headers) {
        headers = headers.replace(/\s/g, ' ');
        const fragments = headers.split(' ');
        for (let fragment of fragments) {
            if (!fragment.includes('=')) continue;

            // remove final semicolon
            if (fragment[fragment.length - 1] === ';') fragment = fragment.slice(0, -1);

            // only final character can be a semicolon
            if (fragment.includes(';')) continue;

            // cookie value can contain an equals, but if the last character is an equals, it's not a cookie request header
            const equals = fragment.split('=');
            if (equals.length === 1 && fragment[fragment.length - 1] === '=') continue;

            // only split the fragment on the first equals
            fragment = fragment.split('=');
            const name = fragment.shift();
            const value = fragment.join('=');

            this.setCookie(name, value);
        }
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
            this.#eatWhitespace();
            let name = this.#eatName();
            this.#eatEquals();
            let value = this.#eatValue();
            this.pot.push({ name, value });
            this.#eatSemicolon();
        }
    }

    clear() {
        this.length = 0;
        this.pos = 0;
        this.text = '';
        this.pot = [];
    }

    deposit(headers) {
        headers = this.#normaliseHeaders(headers);

        this.length = headers.length;
        this.pos = 0;
        this.text = headers;

        while (this.pos < this.length) {
            if (!this.#eatLenient('set-cookie:')) {
                break;
            }
            this.#eatWhitespace();
            let name = this.#eatName();
            this.#eatEquals();
            let value = this.#eatValue();
            this.#eatSemicolon();
            this.#potPush(name, value);
        }

        return this.#buildCookieString();
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

    setCookie(name, value) {
        this.#potPush(name, value);
    }

    get cookieString() {
        return this.#buildCookieString();
    }

    #normaliseHeaders(headers) {
        const type = typeof headers;
        if (type === 'string') {
            return headers;
        }
        if (type === 'object') {
            return this.#normaliseObjectHeaders(headers);
        }
        throw `Headers object of ${type} is not supported.`;
    }

    #normaliseObjectHeaders(response) {
        if (response.hasOwnProperty('headers')) {
            return this.#stringifyRequestResponseHeaders(response.headers);
        } else if (hasHeadersSymbol(response)) {
            return this.#stringifyRequestResponseHeaders(response[getHeadersSymbol(response)]);
        } else return this.#stringifyRequestResponseHeaders(response);
    }

    #stringifyRequestResponseHeaders(headers) {
        let stringified = '';
        if (headers.hasOwnProperty('set-cookie')) {
            const setCookie = headers['set-cookie'];
            for (const cookie of setCookie) {
                stringified += 'set-cookie: ' + cookie;
            }
        }
        if (typeof headers.entries === 'function') {
            // native fetch
            for (const [key, value] of headers.entries()) {
                stringified += `${key}: ${value}\n`;
            }
        }

        return stringified;
    }

    #potPush(name, value) {
        let newPot = [];
        let pushedAlready = false;
        for (const cookie of this.pot) {
            if (cookie.name === name) {
                newPot = this.#pushValue(newPot, name, value);
                pushedAlready = true;
            } else {
                newPot.push(cookie);
            }
        }
        if (!pushedAlready) {
            newPot = this.#pushValue(newPot, name, value);
        }
        this.pot = newPot;
    }

    #pushValue(_pot, name, value) {
        if (value.length > 0) {
            _pot.push({ name, value });
        }
        return _pot;
    }

    #eatLenient(target) {
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

    #eatWhitespace() {
        while (this.pos < this.length) {
            if (this.text[this.pos] === ' ') {
                this.pos += 1;
            } else {
                return;
            }
        }
    }

    #eatName() {
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

    #eatEquals() {
        if (this.text[this.pos] === '=') {
            this.pos += 1;
            return;
        }
        throw `Expected equals sign at position ${this.pos}.`;
    }

    #eatValue() {
        let value = '';
        while (this.pos < this.length) {
            if (this.text[this.pos] === ';') {
                return value;
            }
            value += this.text[this.pos];
            this.pos += 1;
        }
        return value; // end of string
    }

    #eatSemicolon() {
        // optional
        if (this.text[this.pos] === ';') {
            this.pos += 1;
            return;
        }
        return;
    }

    #buildCookieString() {
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

function hasHeadersSymbol(obj) {
    const symbols = Object.getOwnPropertySymbols(obj);
    for (const symbol of symbols) {
        if (symbol.description === 'headers') {
            return true;
        }
    }
    return false;
}

function getHeadersSymbol(obj) {
    const symbols = Object.getOwnPropertySymbols(obj);
    for (const symbol of symbols) {
        if (symbol.description === 'headers') {
            return symbol;
        }
    }
    return null;
}

module.exports = CookiePot;
