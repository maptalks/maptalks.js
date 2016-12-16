const testsContext = require.context('../test', true, /\.js$/);
testsContext.keys().forEach(testsContext);
