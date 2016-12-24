const testsContext = require.context('../test/core', true, /UtilSpec\.js$/);
testsContext.keys().forEach(testsContext);
