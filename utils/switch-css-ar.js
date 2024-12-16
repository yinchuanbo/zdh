const postcssLogical = require("postcss-logical");
const rtlcss = require("rtlcss");
const postcss = require("postcss");

async function RTLConverter(csscode) {
  const plugins = [
    postcssLogical(),
    {
      postcssPlugin: "strip-dir-selector",
      Once(root) {
        root.walkRules((rule) => {
          rule.selector = rule.selector.replace(
            /\[dir=['"]?rtl['"]?\]\s*/g,
            ""
          );
        });
      },
    },
  ];
  plugins.push(rtlcss());
  const postCSSResult = await postcss(plugins).process(csscode, {
    from: undefined,
  });
  return postCSSResult.css;
}

module.exports = RTLConverter;
