// GitHub theme for prism-react-renderer
const githubTheme = {
  plain: {
    color: "#24292e",
    backgroundColor: "#ffffff"
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: {
        color: "#6a737d",
        fontStyle: "italic" as const
      }
    },
    {
      types: ["namespace"],
      style: {
        opacity: 0.7
      }
    },
    {
      types: ["string", "attr-value"],
      style: {
        color: "#032f62"
      }
    },
    {
      types: ["punctuation", "operator"],
      style: {
        color: "#24292e"
      }
    },
    {
      types: ["entity", "url", "symbol", "number", "boolean", "variable", "constant", "property", "regex", "inserted"],
      style: {
        color: "#005cc5"
      }
    },
    {
      types: ["atrule", "keyword", "attr-name", "selector"],
      style: {
        color: "#d73a49"
      }
    },
    {
      types: ["function", "deleted", "tag"],
      style: {
        color: "#6f42c1"
      }
    },
    {
      types: ["function-variable"],
      style: {
        color: "#6f42c1"
      }
    },
    {
      types: ["tag", "selector", "keyword"],
      style: {
        color: "#d73a49"
      }
    }
  ]
};

export default githubTheme;
