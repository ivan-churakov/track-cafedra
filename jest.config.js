const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom", // 👈 нужно для React
  transform: {
    ...tsJestTransformCfg,
  },
  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react-jsx", // 👈 важно! позволяет парсить JSX в TSX
      },
    },
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"], // подключаем jest-dom
  moduleNameMapper: {
    // игнорируем импорты css, изображений и т.д.
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^.+\\.(png|jpg|jpeg|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
    "^next/link$": "next/dist/client/link.js",
    "^next/router$": "next/dist/client/router.js"
  },
};
