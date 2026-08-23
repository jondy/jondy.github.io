const pubemail_patterns = [
    '@qq.', '@163.', '@126.', '@139.',
    '@sohu.', '@sina.', '@foxmail.',
    '@gmail.', '@outlook.', '@hotmail.',
    '@icloud.', '@me.', '@mac.',
    '@naver.', '@yahoo.', '@google.',
    '@mail.ru', '@duck.com',
    '@proton.me', '@protonmail.com',
];

const email_patterns = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 33 ! - 44 ,
// 45 -
// 46 .
// 47 /
// 58 : - 64 @
// 5B [ - 5E ^
// 5F _
// 60 `
// 7B { - 7E ~
const invalid_name_patterns = /[!-,/:-@[-^`{-~]/;


function loadRegInfo(expired) {
    try {
        const data = window.localStorage.getItem( 'REGINFO');
        if (typeof data === 'string') {
            if (typeof expired === 'number'
                && reginfo.timestamp
                && Date.now() > reginfo.timestamp + expired) {
                window.localStorage.clear();
            }
            return JSON.parse(data);
        }
    } catch ( err ) {
        console.log(`Load reginfo failed: ${err.toString()}`);
    }
}

function storeRegInfo(reginfo, errbox) {
    try {
        reginfo.timestamp = Date.now();
        window.localStorage.setItem('REGINFO', JSON.stringify(reginfo));
        return true;
    }
    catch ( err ) {
        errbox
            ? errbox(err.toString())
            : console.log(`Store reginfo failed: ${err.toString()}`);
    }
    return false;
}

function isPublicEmail(email) {
    return pubemail_patterns.some((x) => email.indexOf(x) > 0);
}

function checkRegistrationInfo(reginfo, errcb)
{
    const name = reginfo.regname;
    const product = reginfo.regproduct;
    const email = reginfo.regemail;
    const lictype = reginfo.lictype ? reginfo.lictype.toUpperCase() : '';

    const showError = errcb ? errcb : (msg) => {
        console.log(`Registration Info Validation Error: ${msg}`);
    };

    if (typeof name !== 'undefined') {

        if (name.length === 0) {
            showError(`License To is required`);
            return false;
        }

        if (name.length < 6) {
            showError(`Invalid "${name}", License To need >= 6 chars`);
            return false;
        }

        if (name.length > 80) {
            showError(`Invalid "${name}", License To should <= 80 chars`);
            return false;
        }

        const i = name.search(invalid_name_patterns);
        if (i !== -1) {
            showError(`License To includes invalid char "${name[i]}"`);
            return false;
        }

    }

    if (typeof product !== 'undefined') {

        if (product.length === 0) {
            showError(`Bind Product is required`);
            return false;
        }

        if (product.length < 6) {
            showError(`Invalid "${product}", Bind Product need >= 6 chars`);
            return false;
        }

        if (product.length > 60) {
            showError(`Product "${product}", Bind Product should <= 60 chars`);
            return false;
        }

        const i = product.search(invalid_name_patterns);
        if (i !== -1) {
            showError(`Bind Product includes invalid char "${product[i]}"`);
            return false;
        }

    }

    if (typeof email !== 'undefined') {

        if (email.length === 0) {
            showError(`Shipping email is required`);
            return false;
        }

        if (!email_patterns.test(email)) {
            showError(`Invalid email "${email}"`);
            return false;
        }

        if ((lictype === 'CI' || lictype === 'GROUP') && isPublicEmail(email)) {
            showError(`Invalid "${email}" for ${lictype} License, only enterprise email works`);
            return false;
        }
    }

    return true;
}
