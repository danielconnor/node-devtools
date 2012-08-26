module.exports = {
  parseMethod: function(method) {
    // the method name is always in the form {Component}.{Method}
    // so to get the component we split by '.'
    var parts = method.split(".");

    return {
      component: parts[0],
      method: parts[1]
    };
  }
};