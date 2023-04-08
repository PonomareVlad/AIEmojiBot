let svg = {};

export default {
    element: {
        enter: (node, parentNode) => {
            if (node.name === "svg") {
                const {width, height} = node?.attributes || {};
                svg = {width, height};
            } else {
                if (node?.attributes?.stroke?.startsWith?.("url")) {
                    delete node.attributes.stroke;
                }
                if (svg?.width && node?.attributes?.width?.endsWith?.("%")) {
                    node.attributes.width = parseInt(svg.width) * parseInt(node.attributes.width.replace("%", "")) / 100;
                }
                if (svg?.height && node?.attributes?.height?.endsWith?.("%")) {
                    node.attributes.height = parseInt(svg.height) * parseInt(node.attributes.height.replace("%", "")) / 100;
                }
            }
        },
        exit: (node, parentNode) => {
            if (node.name === "defs") {
                const index = parentNode.children.indexOf(node);
                if (index > 0) {
                    const items = parentNode.children.splice(index, 1);
                    parentNode.children.unshift(...items);
                }
            }
        }
    }
}
