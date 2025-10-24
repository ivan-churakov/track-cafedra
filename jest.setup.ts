import "@testing-library/jest-dom";
import React from "react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) =>
    React.createElement("img", { ...props, alt: props.alt || "mocked next/image" }),
}));
