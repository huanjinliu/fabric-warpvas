## Fabric Warpvas

[English](README.md) | [中文](README.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

### Introduction

This JavaScript library helps you efficiently build image warping tools on `Fabric.js`.

### Installation

```shell
npm install fabric fabric-warpvas
# or
pnpm add fabric fabric-warpvas
```

Note: `Fabric.js` is required as a peer dependency (v6+).

### Features

- **Quick Setup Warp Tool**: Provides `FabricWarpvas` class to rapidly build interactive image warping tools based on `fabric.Canvas`.

- **Built-in Warp Effects**: Offers two common warping effects - image distortion and perspective transformation.

  <div style="display: flex; justify-content: center;">
    <img src="https://raw.githubusercontent.com/huanjinliu/fabric-warpvas/master/docs/resources/gifs/warp.gif" alt="warp" style="width: 33%" />
    <img src="https://raw.githubusercontent.com/huanjinliu/fabric-warpvas/master/docs/resources/gifs/perspective.gif" alt="perspective" style="width: 33%" />
  </div>

- **Visual Guides**: Options to add grid lines and control points for better warping visualization.

- **Anti-aliasing Control**: Toggle anti-aliasing for smoother rendered output.

- **Resolution Management**: Control input/output dimensions for optimal quality and performance.

- **Customizable Styles**: Built-in effects support custom styling parameters.

- **Extensible Architecture**: Provides `AbstractMode` class for creating custom warping effects.

### Usage

Visit [online documentation](https://huanjinliu.github.io/fabric-warpvas/) for detailed tutorials and code examples.

### License

MIT License - see [LICENSE](LICENSE) file for details.

### Contact

huanjinliu - [huanjin.liu@foxmail.com](mailto:huanjin.liu@foxmail.com)
