let currency = document.getElementById("currency");
let from = document.getElementById("from");
let to = document.getElementById("to");
let final = document.getElementById("final");
let convert = document.getElementById("convert");
let indexdb = idb.open('currency-convertion-rates-to-usd', 1, upgradeDB => {
    // Note: we don't use 'break' in this switch statement,
    // the fall-through behaviour is what we want.
    switch (upgradeDB.oldVersion) {
        case 0:
            upgradeDB.createObjectStore('rates-to-usd-0');
    }
});

const currencyRatesStore = {
    get(key) {
        return indexdb.then(db => {
            return db.transaction('rates-to-usd-0')
                .objectStore('rates-to-usd-0').get(key);
        });
    },
    set(key, val) {
        return indexdb.then(db => {
            const tx = db.transaction('rates-to-usd-0', 'readwrite');
            tx.objectStore('rates-to-usd-0').put(val, key);
            return tx.complete;
        });
    },
    delete(key) {
        return indexdb.then(db => {
            const tx = db.transaction('rates-to-usd-0', 'readwrite');
            tx.objectStore('rates-to-usd-0').delete(key);
            return tx.complete;
        });
    },
    clear() {
        return indexdb.then(db => {
            const tx = db.transaction('rates-to-usd-0', 'readwrite');
            tx.objectStore('rates-to-usd-0').clear();
            return tx.complete;
        });
    },
    keys() {
        return indexdb.then(db => {
            const tx = db.transaction('rates-to-usd-0');
            const keys = [];
            const store = tx.objectStore('rates-to-usd-0');

            // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
            // openKeyCursor isn't supported by Safari, so we fall back
            (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
                if (!cursor) return;
                keys.push(cursor.key);
                cursor.continue();
            });

            return tx.complete.then(() => keys);
        });
    }
};


convert.onclick = (event) => {
    let key = `${from.value}_${to.value}`;
    let currency_value = (+currency.value || 0);
    fetch(`https://free.currencyconverterapi.com/api/v5/convert?q=${key}&compact=ultra`)
        .then(response => {
            return response.json(); // Transform the data into json
        })
        .then(response => {
            final.value = response[key] * currency_value;
        }).catch(error => {
            if (confirm(`Error loading conversion rate, do you want to use the pre-cached rates?`))
                Promise.all([currencyRatesStore.get(from.value), currencyRatesStore.get(to.value)]).then(([from_conversion_rate, to_conversion_rate]) => {
                    if (!from_conversion_rate) {
                        alert(`${from.options[from.selectedIndex].text} not yet cahed in IndexDB FOR offline use... `);
                        return;
                    }
                    if (!to_conversion_rate) {
                        alert(`${to.options[to.selectedIndex].text} not yet cahed in IndexDB FOR offline use... `);
                        return;
                    }
                    final.value = (+from_conversion_rate / +to_conversion_rate) * currency_value;
                });
        });
};


fetch('https://free.currencyconverterapi.com/api/v5/currencies')
    .then((response) => {
        return response.json(); // Transform the data into json
    })
    .then(response => {
        Object.entries(response.results).forEach(([key, value]) => {
            let fromOption = new Option(`${value.currencyName} (${value.currencySymbol})`, key);
            let toOption = new Option(`${value.currencyName} (${value.currencySymbol})`, key);
            from.add(fromOption);
            to.add(toOption);
        });
        return response;
    })
    .then(response => {
        const convertionRates = [];

        //https://www.bennadel.com/blog/3201-exploring-recursive-promises-in-javascript.htm
        let promise = Object.entries(response.results).reduce(
            function reducer(promiseChain, currency) {
                var nextLinkInChain = promiseChain.then( () => {
                    [key, value] = currency;
                    let key_USD = `${key}_USD`;
                    return fetch(`https://free.currencyconverterapi.com/api/v5/convert?q=${key_USD}&compact=ultra`)
                        .then(response => {
                            return response.json(); // Transform the data into json
                        })
                        .then(response => {
                            console.log(`successfully loaded ${response[key_USD]} => ${key}`);
                            let usd_rate = {
                                rate: response[key_USD],
                                id: key
                            };
                            convertionRates.push(usd_rate);
                            return usd_rate;
                        }).catch(response => {
                            console.log(`error loading ${key}`);
                            let usd_rate = {
                                rate: null,
                                id: key
                            };
                            convertionRates.push(usd_rate);
                            return usd_rate;
                        })
                });
                return (nextLinkInChain);
            },
            Promise.resolve() // Start the promise chain.
        );

        return promise.then(() => {
            return convertionRates;
        });
    })
    .then((convertionRates) => {
        console.log(convertionRates)
        //save to indexedb
        convertionRates.forEach(_rate => {
            let savedRate = currencyRatesStore.get(_rate.id);
            if (savedRate) {
                if (_rate.rate && savedRate != _rate.rate)
                    currencyRatesStore.set(_rate.id, _rate.rate);
            } else
                currencyRatesStore.set(_rate.id, _rate.rate);
        });
    });

//register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => {
        console.log("Service Worker Registered");
    }).catch(() => {
        console.log("Oooops! Service Worker Registered Failed");
    });
}
