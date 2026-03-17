const data = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: { type: "Point", coordinates: [91.14478, 29.658272] },
            properties: { type: 1 },
        },
    ],
};

const style = [
    {
        filter: ["==", "$type", "Point"],
        renderPlugin: {
            type: "native-point",
            dataConfig: {
                type: "native-point",
            },
        },
        symbol: {
            markerSize: 30,
            markerFill: "#f00",
            markerOpacity: 0.5,
        },
    },
];

module.exports = {
    style,
    data,
    sceneConfig: {
        environment: {
            enable: true,
            mode: 1,
            level: 0,
            brightness: 0.915,
        },
        postProcess: {
            enable: true,
            antialias: {
                enable: true,
            },
            bloom: {
                enable: true,
                threshold: 0,
                factor: 1,
                radius: 0.02,
            },
            ssr: {
                enable: true,
            },
            outline: {
                enable: true,
            },
        },
        weather: {
            currentType: "fog",
            enable: true,
            fog: {
                enable: true,
                start: 2,
                end: 90,
                color: [
                    0.8117647058823529, 0.8117647058823529, 0.8117647058823529,
                ],
            },
        },
        shadow: {
            type: "esm",
            enable: true,
            quality: "high",
            opacity: 0.5,
            color: [0, 0, 0],
            blurOffset: 1,
        },
        ground: {
            enable: true,
            renderPlugin: {
                type: "fill",
            },
            symbol: {
                polygonFill: [
                    0.803921568627451, 0.803921568627451, 0.803921568627451, 1,
                ],
                polygonOpacity: 1,
            },
        },
    },
};
