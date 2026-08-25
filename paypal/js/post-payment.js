// Handle events after PayPal payment completed
// This is one simple script, include main page with top level

var reginfo = undefined;
var order_state = undefined;

// Check localStorage is available
// Copy from https://developer.mozilla.org/
function localStorageAvailable() {
  let storage;
  try {
    storage = window['localStorage'];
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      e.name === "QuotaExceededError" &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage &&
      storage.length !== 0
    );
  }
}

function showError(msg) {
    const errbox = document.getElementById('error-box');
    errbox.innerText = msg;
    errbox.classList.remove('invisible');
}

function clearError(msg) {
    document.getElementById('error-box').classList.add('invisible');
}

function loadItemData (name) {
    try {
        const data = window.localStorage.getItem(name);
        if (data) {
            return JSON.parse(data);
        }
    }
    catch (err) {
        console.log(err);
    }
}

function storeItemData (name, obj) {
    try {
        if (typeof obj === 'undefined')
            window.localStorage.removeItem(name);
        else
            window.localStorage.setItem(name, JSON.stringify(obj));
    }
    catch (err) {
        console.log(err);
    }
}

function setOrderState(ordinfo) {
    const invoices = loadItemData('INVINFO');

    const invbtn = document.getElementById('invoice-button');
    const invitems = document.getElementById('invoice-states');
    const orditems = document.getElementById('order-states');
    const grpnote = document.getElementById('group-license-hint');

    const invstate = ordinfo && ordinfo.pk && invoices && invoices.find(
        (inv) => inv.id === ordinfo.pk) ? 1 : 0;
    const ordstate =
        ordinfo && ordinfo.pk && ordinfo.done && ordinfo.order_id ? 2 :
        ordinfo && ordinfo.pk && ordinfo.done ? 3 :
        ordinfo && ordinfo.pk ? 1 : 0;
    order_state = ordstate;

    orditems.children.forEach((el) => el.classList.add('d-none'));
    invitems.children.forEach((el) => el.classList.add('d-none'));
    grpnote.classList.add('d-none');

    invbtn.href = invstate ? 'checkout.html' ? 'checkout.html#section-invoices';
    invbtn.innerText = invstate ? 'Download PDF Invoice' ? 'Request PDF Invoice';

    orditems.children[ordstate].classList.remove('d-node');
    invitems.children[invstate].classList.remove('d-node');

    if (ordstate === 2 &&
        reginfo.lictype && reginfo.lictype.toLowerCase() === 'group')
        grpnote.classList.remove('d-none');
}

// Refresh page by checking order state
function refreshOrderState() {
    const url = 'https://api.dashingsoft.com/product/pay/event/';
    const ordinfo = loadItemData('ORDINFO');

    const req = new Request(url);
    const headers = new Headers();
    const method = 'POST';

    const formData = new FormData();
    formData.append("regemail", reginfo.regemail);
    formData.append("regname", reginfo.regname);
    formData.append("regproduct", reginfo.regproduct);
    formData.append("created", reginfo.timestamp);
    if (ordinfo && ordinfo.pk)
        formData.append("pk", ordinfo.pk);

    fetch(req, {
        method: method,
        mode: "cors",
        headers: headers,
        body: formData,
    })
        .then((res) => {
            if (res.ok)
                return res.json();
            throw new Error(res.statusText);
        })

        .then((data) => {
            const pk = data.pk;
            if (!pk || pk === -1) {
                // Not found
                storeItemData('ORDINFO');
                setOrderState();
            }
            else {
                storeItemData('ORDINFO', data);
                setOrderState(data);
            }
        })

        .catch((err) => {
            showError(err.toString())
        })
}

window.addEventListener('DOMContentLoaded', () => {
    if (!localStorageAvailable()) {
        errbox.classList.remove('invisible');
    }
    else {
        reginfo = loadItemData( 'REGINFO' );

        document.getElementById('reginfo-box').innerText = [
            `License Type:     ${reginfo.lictype}`,
            `License To:       ${reginfo.regname}`,
            `Bind Product:     ${reginfo.regproduct}`,
            `Shipping Email:   ${reginfo.regemail}`,
        ].join('\n');

        document.querySelectorAll('b[name="shipping-email"]').forEach(
            (el) => el.innerText = reginfo.regemail
        );

        document.getElementById('refresh-button').addEventListener(
            'click', (e) => {
                clearError();
                refreshOrderState();
            });
        document.getElementById('invoice-button').addEventListener(
            'click', (e) => {
                clearError();
                if (!order_state) {
                    showError(`Can't request invoice when order state is Waiting`);
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

        refreshOrderState();
    }
});
