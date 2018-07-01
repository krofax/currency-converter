const currencyCacheName = 'currency-static-v3';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(currencyCacheName).then(cache => {
      cache.add('https://free.currencyconverterapi.com/api/v5/currencies');
      return cache.addAll([
        '/currency_converter/main.html',
        'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css',
        '/currency_converter/scripts/app.js',
        '/currency_converter/css/styles.css',
        //'/currency_converter/imgs/favicon.ico',
        'https://code.jquery.com/jquery-3.2.1.slim.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js',
        'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js',
        'https://cdn.jsdelivr.net/npm/idb@2.1.3/lib/idb.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.css',
      ]);
    })
  );
});



//deleting old sw on activate

self.addEventListener('activate', event => {
  // delete any caches that aren't in currencyCacheName
  // which will get rid of surrency-static-v2
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key != currencyCacheName) {
          return caches.delete(key);
        }
      })
    )).then(() => {
      console.log('V3 now ready to handle fetches!');
    })
  );
});


self.addEventListener('fetch', event => {
  event.respondWith(
    // Fetch data from cache
    caches.match(event.request).then((response) => {
      // Check cache but fall back to network
      return response || fetch(event.request);
    })
  );
});
