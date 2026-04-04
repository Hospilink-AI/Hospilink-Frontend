// Mock for react-native-maps on web — prevents crash
import React from "react";
import { View } from "react-native";

const Mock = ({ children, ...props }) => React.createElement(View, props, children);
Mock.displayName = "MapMock";

export default Mock;
export const MapView = Mock;
export const Marker = Mock;
export const Polyline = Mock;
export const Callout = Mock;
export const Circle = Mock;
export const Polygon = Mock;
export const Overlay = Mock;
export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = null;