const { declare } = require('@babel/helper-plugin-utils');
const { types } = require('@babel/core');

function getName(key) {
  if (types.isIdentifier(key)) {
    return key.name;
  }
  return key.value.toString();
}

module.exports = declare((api) => {
  api.assertVersion(7);

  return {
    name: "mtk-remove-vite-inject",
    visitor: {
      AssignmentExpression(path, state) {
        const { node } = path;
        const { opts } = state;
        if (types.isSpreadElement(node)) return;
        const includeKV = opts?.includeKV;
        const keys = includeKV.map((item) => item[0]);
        const values = includeKV.map((item) => item[1]);

        if (node.type === 'AssignmentExpression') {
          const left = node.left;
          const right = node.right;
          if (left && right) {
            const property = left.property;
            if (!property) return;
            const type = property.type;

            let fullKey = '[';
            if (type === 'MemberExpression') {
              if (types.isIdentifier(property.object)) {
                fullKey += property.object.name;
                if (types.isIdentifier(property.property)) {
                  const tag = property.property.name;
                  fullKey += `.${tag}]`;
                }
              }
            }
            const idx = keys.findIndex(k => k === fullKey);
            const idv = values.findIndex(k => k === right.value);
            if (idx > -1 && idv > -1 && idx === idv) {
              path.remove();
            }
          }
        }
      },

      ObjectProperty(path, state) {
        const { node } = path;
        const { opts } = state;
        if (types.isSpreadElement(node)) return;
        const includeKV = opts?.includeKV;
        const keys = includeKV.map((item) => item[0]);
        const values = includeKV.map((item) => item[1]);

        if (node.computed) {
          const type = node.key.type;
          // console.log('remove-name-computed', type);
          let fullKey = '[';
          if (type === 'MemberExpression') {
            if (types.isIdentifier(node.key.object)) {
              fullKey += node.key.object.name;
              if (types.isIdentifier(node.key.property)) {
                const tag = node.key.property.name;
                fullKey += `.${tag}]`;
              }
            }
          }
          const idx = keys.findIndex(k => k === fullKey);
          const idv = values.findIndex(k => k === node.value.value);
          if (idx > -1 && idv > -1 && idx === idv) {
            // console.log('remove', fullKey);
            path.remove();
          }
        } else {
          const name = getName(node.key);
          const valueType = node.value.type;
          const idx = keys.findIndex(k => k === name);
          const idv = values.findIndex(k => k === valueType);
          if (idx > -1 && idv > -1 && idx === idv) {
            // console.log('remove', name);
            path.remove();
          }
        }
      },
    }
  };
});
