let svg = {};

export default {
    element: {
        enter: (node, parentNode) => {
            switch (node.name) {

                case "svg":
                    let {width, height, viewBox} = node?.attributes || {};
                    if (viewBox) [width, height] = viewBox.split(" ").splice(2);
                    svg = {width, height};
                    break;

                case "defs":
                    const index = parentNode.children.indexOf(node);
                    if (index > 0) {
                        const items = parentNode.children.splice(index, 1);
                        parentNode.children.unshift(...items);
                    }
                    break;

                case "animate":
                    if (!node.attributes) break;
                    if (!node.attributes.from || !node.attributes.to) {
                        if (!node.attributes.values) break;
                        const values = node.attributes.values.split(";");
                        const [from] = values;
                        const [to] = values.reverse();
                        if (!node.attributes.from) node.attributes.from = parseFloat(from.trim());
                        if (!node.attributes.to) node.attributes.to = parseFloat(to.trim());
                    }
                    break;

                default:
                    if (node?.attributes?.stroke?.startsWith?.("url")) {
                        delete node.attributes.stroke;
                    }
                    if (svg?.width && node?.attributes?.width?.endsWith?.("%")) {
                        node.attributes.width = parseInt(svg.width) * parseInt(node.attributes.width.replace("%", "")) / 100;
                    }
                    if (svg?.height && node?.attributes?.height?.endsWith?.("%")) {
                        node.attributes.height = parseInt(svg.height) * parseInt(node.attributes.height.replace("%", "")) / 100;
                    }
                    break;

            }
        }
    }
}
