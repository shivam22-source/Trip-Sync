const { clean } = require("xss-clean/lib/xss");

const setRequestProperty = (req, key, value) => {
  try {
    req[key] = value;
  } catch (error) {
    // Express 5 exposes req.query as a getter-only property on the prototype.
  }

  if (req[key] !== value) {
    Object.defineProperty(req, key, {
      value,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }
};

const xssClean = () => (req, res, next) => {
  if (req.body) {
    setRequestProperty(req, "body", clean(req.body));
  }

  if (req.query) {
    setRequestProperty(req, "query", clean(req.query));
  }

  if (req.params) {
    setRequestProperty(req, "params", clean(req.params));
  }

  next();
};

module.exports = xssClean;
