const testsContext = require.context('../test/geojson', true, /\.js$/);
testsContext.keys().forEach(testsContext);
