## Fabric Warpvas

[English](README.md) | [中文](README.cn.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.3-green.svg)

### 项目介绍

这个JavaScript库可以帮助你在`Fabric.js`上高效构建图像变形工具。

### 安装方法

```shell
npm install fabric fabric-warpvas
# or
pnpm add fabric fabric-warpvas
```

注意：`Fabric.js`作为该库的 peer 依赖，需要同时被安装，当前版本对应需要v6版本及以上。

### 核心功能

- **快速搭建图像扭曲工具**：提供`FabricWarpvas`类，可以基于`fabric.Canvas`对象快速搭建可交互的图像变形编辑工具。

- **内置扭曲和透明变形效果**：提供了两种常见的变形效果，图像扭曲和透视变形。

  <div style="display: flex; justify-content: center;">
    <img src="https://raw.githubusercontent.com/huanjinliu/fabric-warpvas/master/docs/resources/gifs/warp.gif" alt="warp" />
    <img src="https://raw.githubusercontent.com/huanjinliu/fabric-warpvas/master/docs/resources/gifs/perspective.gif" alt="perspective" />
  </div>

- **辅助显示效果**：提供选项以在变形图像上添加分隔线和分割点等辅助显示效果，以协助观察图像变形效果。

- **抗锯齿控制**：提供选项以启用或禁用变形图像渲染时的抗锯齿功能，以获得更平滑的视觉效果。

- **控制输入输出尺寸**：提供选项以控制变形图像的输入和输出尺寸，更好地控制生成质量和处理效率。

- **自定义交互元素样式**：内置变形效果皆对外提供入口配置自定义元素样式。

- **自定义变形效果**：提供`AbstractMode`类，基于该类可以创建自定义变形效果。

### 使用方式

访问[在线文档](https://huanjinliu.github.io/fabric-warpvas/)查看详细教程和代码示例。

### 许可证

此项目使用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

### 联系方式

huanjinliu - [huanjin.liu@foxmail.com](mailto:huanjin.liu@foxmail.com)
