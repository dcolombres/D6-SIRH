/** Breaks circular imports between ui.js and feature modules. */
let _handler = () => {};

export function setRefreshHandler(fn) {
    _handler = fn;
}

export function refreshUI() {
    _handler();
}
