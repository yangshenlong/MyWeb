# GhisRealisticGrass 草地方案完整技术分析

> 作者分析 | UE 5.3 | Ghislain GIRARDOT

---

## 目录

1. [项目概览](#项目概览)
2. [核心架构](#核心架构)
3. [草地渲染系统](#草地渲染系统)
4. [风效交互系统](#风效交互系统)
5. [编辑器工具](#编辑器工具)
6. [工作流程](#工作流程)
7. [性能优化策略](#性能优化策略)
8. [技术原理深度解析](#技术原理深度解析)
9. [材质计算逻辑详解](#材质计算逻辑详解)
10. [编辑器工具深度解析](#编辑器工具深度解析)
11. [手动拆解补充分析](#手动拆解补充分析)

---

## 项目概览

### 基本信息

| 属性 | 值 |
|------|-----|
| 项目名称 | GhisRealGrass |
| 引擎版本 | Unreal Engine 5.3 |
| 插件类型 | 实验性真实草地着色器系统 |
| 作者 | Ghislain GIRARDOT |
| 总资源数 | 208个资产 |

### 插件清单

| 插件名称 | 功能描述 |
|----------|----------|
| `GhisRealisticGrass01` | 核心草地渲染着色器系统 |
| `GhisNiagara2DWind` | 2D交互式风场纹理生成系统 |

---

## 核心架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    GhisRealisticGrass 系统架构                    │
└─────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   玩家输入   │
                              │   系统       │
                              └──────┬──────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
            ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
            │  风效控制    │  │  摄像机控制  │  │  移动控制    │
            │  Widget     │  │  IA_Look    │  │  IA_Move    │
            └──────┬──────┘  └─────────────┘  └─────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  MPC_2DWindSyst      │
        │  (材质参数集合)       │
        └──────────┬───────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
      ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Niagara  │ │ 渲染目标  │ │ 风场纹理  │
│ 风场模拟 │ │ RT_RGBA  │ │ 输出     │
└─────┬────┘ └────┬─────┘ └─────┬─────┘
      │           │             │
      └───────────┼─────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  草地着色器系统       │
        │  M_RealisticGrass_01 │
        └──────────┬──────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
      ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ LOD0     │ │ LOD1     │ │ FarGrass │
│ 近景草地 │ │ 中景草地 │ │ 远景草地 │
└──────────┘ └──────────┘ └──────────┘
```

---

## 草地渲染系统

### 网格资源

| 网格名称 | 文件大小 | 用途 |
|----------|----------|------|
| `SM_Grass_A_01` | 310KB | 主草地模型 (最详细) |
| `SM_Grass_B_01` | 57KB | 变体B (轻量级) |
| `SM_Grass_C_01` | 76KB | 变体C |
| `SM_Grass_D_01` | 73KB | 变体D |
| `SM_Grass_E_01` | 113KB | 变体E |

### 材质系统架构

```
M_RealisticGrass_01 (主着色器 - 211KB)
│
├── 输入纹理组
│   ├── T_Grass_Color (8.9MB) - 颜色贴图
│   ├── T_Grass_Normals (5.4MB) - 法线贴图
│   ├── T_Grass_DST (5.4MB) - DST贴图
│   ├── T_Grass_Opacity (1MB) - 不透明度贴图
│   ├── T_Grass_ParametersMap (121KB) - 参数映射
│   └── T_Grass_LandscapeMask (27KB) - 地形遮罩
│
├── 材质函数库
│   ├── MF_3X3Mat (14.7KB) - 3x3矩阵构建
│   ├── MF_Inv3X3Mat (13.5KB) - 3x3矩阵求逆
│   └── MF_Inv3X3Mat2D (13KB) - 2D矩阵求逆
│
└── 材质实例
    ├── MI_RealisticGrass_01_LOD0 (24KB)
    └── MI_RealisticGrass_01_LOD1 (20KB)
```

### 纹理贴图详解

#### 1. 颜色贴图 (T_Grass_Color)
- **分辨率**: 高分辨率 (8.9MB)
- **通道**: RGB颜色
- **用途**: 草叶基础颜色

#### 2. 法线贴图 (T_Grass_Normals)
- **分辨率**: 高分辨率 (5.4MB)
- **格式**: 切线空间法线
- **用途**: 草叶表面细节

#### 3. DST贴图 (T_Grass_DST)
- **分辨率**: 高分辨率 (5.4MB)
- **通道组**: D/S/T 多通道
- **用途**: 细节/粗糙度/透射

#### 4. 参数映射贴图 (T_Grass_ParametersMap)
- **分辨率**: 中等 (121KB)
- **通道编码**:
  - **R**: 丛聚强度 (Clump)
  - **G**: 缩放变化 (Scale Variation)
  - **B**: 弯曲强度 (Bend)
  - **A**: 额外参数

---

## 风效交互系统

### Niagara风场模拟

```
FX_2DWindSyst_Simulation (846KB)
│
├── 粒子发射器
│   ├── 风向控制
│   ├── 风力强度
│   └── 湍流参数
│
├── 湍流纹理
│   └── T_2DWindSyst_Turbulence (68KB)
│
└── 输出目标
    └── RT_2DWindSystem_RGBA (6KB)
```

### 风效控制组件

| 组件 | 文件 | 功能 |
|------|------|------|
| 风效蓝图 | `BP_2DWindSyst` (644KB) | 风场系统主逻辑 |
| 参数集合 | `MPC_2DWindSyst` (2KB) | 全局风效参数 |
| 可视化网格 | `SM_WindWidget` (128KB) | 风场可视化 |
| 可视化材质 | `M_WindWidget` (100KB) | 风场显示着色器 |
| 预设结构体 | `SBP_2DWindSyst_Preset` (11KB) | 风效配置预设 |
| UI控件 | `WDG_WindControl` | 风效调节界面 |

### 风场数据流

```
1. Niagara模拟
   ↓
2. 粒子速度场计算
   ↓
3. 渲染目标写入 (RT_2DWindSystem_RGBA)
   ↓
4. 材质参数集合 (MPC_2DWindSyst)
   ↓
5. 草地着色器采样
   ↓
6. 顶点位移变形
```

---

## 编辑器工具

### 1. 草地参数映射编辑器

```
GrassParametersMapRender/
│
├── 主编辑器
│   └── EUWDG_GrassParametersMapRender (1MB)
│
├── 渲染目标材质
│   ├── M_RT_DrawBendVariation - 弯曲变化
│   ├── M_RT_DrawClump - 丛聚绘制
│   ├── M_RT_DrawScaleVariation - 缩放变化
│   │
│   └── 合成材质
│       ├── M_RT_Composite_SimpleCopy
│       ├── M_RT_Composite_SimpleRemap
│       ├── M_RT_Composite_ClumpAndScale
│       └── M_RT_Composite_ClumpAndScaleAndBend
│
└── 笔刷函数
    ├── MF_RT_BendBrush (32KB)
    ├── MF_RT_ClumpBrush (35KB)
    └── MF_RT_ScaleBrush (32KB)
```

### 2. 地形遮罩编辑器

```
GrassLandscapeMaskRender/
│
├── 主蓝图
│   └── BP_GrassLandscapeMaskRender (17KB)
│
├── 编辑器界面
│   └── EUWDG_GrassLandscapeMaskRender (633KB)
│
└── 材质
    ├── M_GrassLandscapeMask (8KB)
    ├── M_GrassLandscapeMaskPostProcess (23KB)
    └── M_RT_Composite_SimpleCopy
```

---

## 工作流程

### 完整地形草地创建流程

```
阶段1: 地形准备
├─ 创建Landscape
├─ 添加地形图层 (Grass, Dirt, Gravel)
├─ 绘制地形高度
└─ 应用地形材质 (M_Landscape)

阶段2: 草地参数编辑
├─ 打开 GrassParametersMapRender 工具
├─ 使用笔刷绘制参数
│  ├─ 弯曲变化 (Bend)
│  ├─ 丛聚 (Clump)
│  └─ 缩放变化 (Scale)
└─ 生成参数映射纹理

阶段3: 植被放置
├─ 创建Foliage类型
│  ├─ LGT_Grass - 草地
│  └─ LGT_Pebbles - 鹅卵石
├─ 配置植被参数
│  ├─ 密度
│  ├─ 缩放
│  └─ 对齐
└─ 绘制植被

阶段4: 风效配置
├─ 放置 BP_2DWindSyst
├─ 配置风场参数
│  ├─ 风向
│  ├─ 风力
│  └─ 湍流
└─ 使用 WDG_WindControl 实时调节

阶段5: 优化调整
├─ 配置LOD
├─ 调整渲染距离
└─ 性能测试
```

---

## 性能优化策略

### 1. LOD系统

| LOD级别 | 距离 | 材质实例 | 多边形数 |
|---------|------|----------|----------|
| LOD0 | 0-5000 | MI_RealisticGrass_01_LOD0 | 完整细节 |
| LOD1 | 5000+ | MI_RealisticGrass_01_LOD1 | 简化 |
| FarGrass | 极远 | M_FarGrass | 极简 |

### 2. 纹理优化

- **参数映射**: 4通道压缩存储
- **渲染目标**: 仅在编辑时生成
- **纹理流式**: 启用纹理流送

### 3. 渲染优化

- **GPU粒子**: Niagara风场模拟
- **实例化渲染**: Foliage Instancing
- **剔除距离**: 合理的LOD切换距离

---

## 技术原理深度解析

### 草地变形数学原理

草地着色器使用3x3变换矩阵进行顶点变形：

```
原始顶点位置 P
     ↓
应用变换矩阵 M
     ↓
变形后位置 P' = M × P
```

#### 矩阵变换流程

1. **构建变换矩阵** (`MF_3X3Mat`)
   ```
   | m11 m12 m13 |
   | m21 m22 m23 |
   | m31 m32 m33 |
   ```

2. **矩阵求逆** (`MF_Inv3X3Mat`)
   - 用于世界空间到局部空间的转换

3. **变形应用**
   - 弯曲: 基于风场参数
   - 丛聚: 基于密度参数
   - 缩放: 基于变化参数

### 风场模拟原理

Niagara粒子系统模拟2D风场：

```
1. 粒子网格生成
   └─ 覆盖场景的2D平面

2. 速度场计算
   ├─ 基础风向
   ├─ Perlin噪声扰动
   └─ 湍流叠加

3. 渲染目标输出
   └─ RGBA = 风场向量 + 强度
```

### 参数编码方案

参数映射纹理使用4通道编码：

| 通道 | 参数 | 范围 | 描述 |
|------|------|------|------|
| R | Clump | 0-1 | 丛聚强度 |
| G | Scale | 0-1 | 缩放变化 |
| B | Bend | 0-1 | 弯曲强度 |
| A | Reserved | - | 预留参数 |

---

## 附录

### 关键资产清单

#### 草地插件资产 (27个)
```
Meshes/
├── SM_Grass_A_01.uasset
├── SM_Grass_B_01.uasset
├── SM_Grass_C_01.uasset
├── SM_Grass_D_01.uasset
└── SM_Grass_E_01.uasset

Materials/
├── M_RealisticGrass_01.uasset
├── Instances/
│   ├── MI_RealisticGrass_01_LOD0.uasset
│   └── MI_RealisticGrass_01_LOD1.uasset
└── Functions/
    ├── MF_3X3Mat.uasset
    ├── MF_Inv3X3Mat.uasset
    └── MF_Inv3X3Mat2D.uasset

Textures/
├── T_Grass_Color.uasset
├── T_Grass_Normals.uasset
├── T_Grass_DST.uasset
├── T_Grass_Opacity.uasset
├── T_Grass_ParametersMap.uasset
└── T_Grass_LandscapeMask.uasset
```

#### 风效插件资产
```
Blueprints/
├── BP_2DWindSyst.uasset
└── _Structs/
    └── SBP_2DWindSyst_Preset.uasset

Particles/
├── FX_2DWindSyst_Simulation.uasset
├── Collections/
│   └── NPC_2DWindSyst.uasset
└── Textures/
    └── T_2DWindSyst_Turbulence.uasset

Materials/
├── Collections/
│   └── MPC_2DWindSyst.uasset
└── M_WindWidget.uasset

Meshes/
└── SM_WindWidget.uasset

Textures/
└── RT_2DWindSystem_RGBA.uasset
```

---

## 总结

GhisRealisticGrass是一个先进的UE5草地解决方案，其核心特点包括：

1. **GPU加速风场** - Niagara粒子驱动
2. **矩阵变换着色器** - 复杂草叶变形
3. **多通道参数编码** - 高效纹理存储
4. **完整工具链** - 参数编辑器 + 风效控件
5. **分级LOD系统** - 近景到远景优化

适用于开放世界、自然场景、游戏项目等各类需求。

---

# 材质计算逻辑详解

> 本章节深入分析草地着色器的完整计算流程和数学原理

---

## 1. 材质系统架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│              M_RealisticGrass_01 主着色器计算流程                  │
└─────────────────────────────────────────────────────────────────┘

                              输入层
                    ┌─────────────────────────┐
                    │   纹理采样参数组          │
                    │  • World Position       │
                    │  • Vertex Color         │
                    │  • TexCoord             │
                    │  • Camera Vector        │
                    └───────────┬─────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌───────────┐   ┌───────────┐   ┌───────────┐
        │  纹理采样  │   │ 参数映射  │   │ 风场采样  │
        │  Texture  │   │  Param    │   │  Wind     │
        │  Sampling │   │   Map     │   │   Field   │
        └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   3x3矩阵变换计算    │
                    │  • MF_3X3Mat        │
                    │  • MF_Inv3X3Mat     │
                    │  • MF_Inv3X3Mat2D   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   顶点位移计算        │
                    │  • Wind Displacement│
                    │  • Clump Deformation│
                    │  • Scale Variation  │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌───────────┐  ┌───────────┐  ┌───────────┐
        │  像素着色  │  │ 法线计算  │  │  不透明度  │
        │  Pixel    │  │  Normal   │  │  Opacity  │
        │  Shading  │  │  Mapping  │  │   Mask    │
        └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                    ┌─────────────────────┐
                    │     最终输出          │
                    │  • Base Color        │
                    │  • Roughness         │
                    │  • Normal            │
                    │  • AO                │
                    └─────────────────────┘
```

---

## 2. 输入纹理采样详解

### 2.1 纹理采样坐标系

```
采样坐标计算流程：

TexCoord (UV)
    ↓
Tiling + Offset
    ↓
RotatedCoord (可选旋转)
    ↓
WorldAlignedCoord (世界空间对齐)
    ↓
FinalSamplePosition
```

### 2.2 纹理采样顺序

| 采样序 | 纹理名称 | 采样坐标 | 输出用途 |
|--------|----------|----------|----------|
| 1 | `T_Grass_Color` | UV0 | 基础颜色 |
| 2 | `T_Grass_Normals` | UV0 | 切线空间法线 |
| 3 | `T_Grass_DST` | UV0 | 粗糙度+透射 |
| 4 | `T_Grass_Opacity` | UV0 | Alpha遮罩 |
| 5 | `T_Grass_ParametersMap` | WorldPosition.XY | 变形参数 |
| 6 | `T_Grass_LandscapeMask` | WorldPosition.XZ | 地形遮罩 |
| 7 | `RT_2DWindSystem_RGBA` | WorldPosition.XY | 风场数据 |

### 2.3 参数映射纹理采样

```
参数映射采样逻辑：

InputUV = WorldPosition.XZ * ParameterMapTiling
    ↓
SampledRGBA = Texture2D(T_Grass_ParametersMap, InputUV)
    ↓
ClumpAmount = SampledRGBA.r
ScaleVariation = SampledRGBA.g
BendStrength = SampledRGBA.b
ReservedParam = SampledRGBA.a
```

**关键参数**：
- `ParameterMapTiling`: 控制参数映射的重复密度
- `ParameterMapOffset`: 调整参数映射的位置偏移
- 每个通道值域: [0, 1]

---

## 3. 3x3矩阵变换计算详解

### 3.1 矩阵构建 (MF_3X3Mat)

3x3矩阵用于表示草叶的局部空间变换：

```glsl
// 变换矩阵结构
mat3 TransformMatrix;

// 矩阵元素组成
TransformMatrix[0] = vec3(m11, m12, m13);  // X轴变换
TransformMatrix[1] = vec3(m21, m22, m23);  // Y轴变换
TransformMatrix[2] = vec3(m31, m32, m33);  // Z轴变换
```

**矩阵构建流程**：

```
1. 计算局部坐标系
   ┌─ Forward向量 (生长方向)
   ├─ Right向量 (横向)
   └─ Up向量 (法向)

2. 应用旋转
   ┌─ WindRotation (风致旋转)
   ├─ BendRotation (弯曲旋转)
   └─ RandomRotation (随机变化)

3. 应用缩放
   ┌─ ScaleVariation (来自参数映射)
   ├─ GlobalScale (全局缩放)
   └─ VertexScale (顶点局部缩放)

4. 组合成3x3矩阵
   mat3 M = mat3(Right, Up, Forward)
```

### 3.2 矩阵求逆 (MF_Inv3X3Mat)

矩阵求逆用于空间坐标转换：

```glsl
// 3x3矩阵求逆公式
mat3 InverseMatrix(mat3 M)
{
    // 计算行列式
    float det = determinant(M);

    // 计算伴随矩阵
    mat3 adjugate = adjugate(M);

    // 逆矩阵 = 伴随矩阵 / 行列式
    return adjugate / det;
}
```

**应用场景**：
- 世界空间 → 局部空间转换
- 法线空间变换 (需要逆转置矩阵)
- 切线空间重建

### 3.3 2D矩阵求逆 (MF_Inv3X3Mat2D)

优化的2D版本，用于平面计算：

```glsl
// 2D矩阵求逆 (仅XY平面)
mat3 InverseMatrix2D(mat3 M)
{
    // 简化版本，仅处理2D变换
    // 用于风场平面的坐标转换
}
```

---

## 4. 风场采样与应用

### 4.1 风场纹理采样

```
风场采样流程：

1. 计算采样坐标
   WindUV = WorldPosition.XZ * WindTiling + Time * WindSpeed

2. 采样风场纹理
   WindData = Texture2D(RT_2DWindSystem_RGBA, WindUV)

3. 解析风场数据
   WindDirection = WindData.rg    // XY向量
   WindStrength = WindData.b       // 风力强度
   WindTurbulence = WindData.a     // 湍流强度
```

### 4.2 风场到顶点位移

```glsl
// 顶点风位移计算
float CalculateWindDisplacement(VertexPosition P, WindData W)
{
    // 1. 计算顶点到根部的距离
    float vertexHeight = P.z;  // 假设Z轴向上

    // 2. 风力随高度衰减 (根部不动，顶部最动)
    float heightFactor = pow(vertexHeight / MaxHeight, WindFalloffPower);

    // 3. 基础风力
    float baseWind = W.WindStrength * heightFactor;

    // 4. 添加湍流噪声
    float turbulence = sin(vertexHeight * TurbulenceFrequency + Time * TurbulenceSpeed)
                      * W.WindTurbulence * heightFactor;

    // 5. 组合最终风力
    float totalWind = baseWind + turbulence;

    // 6. 应用风向
    vec3 windDisplacement = W.WindDirection * totalWind;

    return windDisplacement;
}
```

### 4.3 风效参数 (MPC_2DWindSyst)

| 参数名称 | 类型 | 默认值 | 描述 |
|----------|------|--------|------|
| `WindDirection` | Vector2D | (1, 0) | 主风向 |
| `WindStrength` | Scalar | 1.0 | 风力强度 |
| `WindSpeed` | Scalar | 1.0 | 风速变化率 |
| `WindTiling` | Scalar | 0.1 | 风场纹理平铺 |
| `WindTurbulence` | Scalar | 0.5 | 湍流强度 |
| `WindFalloffPower` | Scalar | 2.0 | 高度衰减指数 |
| `TurbulenceFrequency` | Scalar | 10.0 | 湍流频率 |
| `TurbulenceSpeed` | Scalar | 5.0 | 湍流速度 |

---

## 5. 顶点位移计算详解

### 5.1 完整顶点位移公式

```glsl
// 完整的顶点位移计算
vec3 CalculateVertexDisplacement(
    vec3 OriginalPosition,
    vec4 ParameterMapSample,
    vec4 WindFieldSample,
    mat3 TransformMatrix
)
{
    // === 阶段1: 参数提取 ===
    float clump = ParameterMapSample.r;      // 丛聚强度
    float scaleVar = ParameterMapSample.g;    // 缩放变化
    float bend = ParameterMapSample.b;        // 弯曲强度

    vec2 windDir = WindFieldSample.rg;        // 风向
    float windStr = WindFieldSample.b;        // 风力

    // === 阶段2: 基础缩放 ===
    float vertexHeight = OriginalPosition.z;
    float scaleFactor = 1.0 + scaleVar * 0.5;  // 缩放范围: 0.5-1.5
    vec3 scaledPos = OriginalPosition * scaleFactor;

    // === 阶段3: 丛聚变形 ===
    float clumpFactor = 1.0 - clump * 0.3;    // 向中心聚拢
    vec2 clumpOffset = OriginalPosition.xy * clumpFactor;
    vec3 clumpedPos = vec3(clumpOffset, scaledPos.z);

    // === 阶段4: 风致弯曲 ===
    float heightRatio = vertexHeight / MaxHeight;
    float bendFactor = pow(heightRatio, 2.0) * bend;

    // 风力在水平方向的位移
    vec2 windDisplacement = windDir * windStr * bendFactor * 100.0;

    // 弯曲导致的垂直下沉
    float bendSag = length(windDisplacement) * 0.3;

    vec3 bentPos = clumpedPos;
    bentPos.xy += windDisplacement;
    bentPos.z -= bendSag;

    // === 阶段5: 应用变换矩阵 ===
    vec3 finalPos = mul(TransformMatrix, bentPos);

    return finalPos;
}
```

### 5.2 弯曲物理模拟

草叶弯曲采用**悬臂梁模型**的简化版：

```
弯曲公式：
δ(x) = (F × L³) / (3 × E × I)

其中：
- δ: 位移量
- F: 风力
- L: 草叶长度
- E: 弹性模量 (草的硬度)
- I: 截面惯性矩

GPU着色器简化版本：
δ(x) = WindForce × Height^FalloffPower × BendStrength
```

### 5.3 丛聚算法

丛聚使草叶向中心线聚拢，模拟自然生长模式：

```glsl
// 丛聚计算
float CalculateClump(vec2 vertexXY, float clumpStrength)
{
    // 计算到中心线的距离
    float distanceToCenter = length(vertexXY);

    // 丛聚因子 (距离越远，收缩越强)
    float clumpFactor = 1.0 - smoothstep(0, 1, distanceToCenter) * clumpStrength;

    return clumpFactor;
}
```

---

## 6. 法线计算详解

### 6.1 切线空间法线

```
法线处理流程：

1. 采样法线贴图
   T_Normal = Texture2D(T_Grass_Normals, UV)

2. 解包法线 [0,1] → [-1,1]
   UnpackedNormal = T_Normal.rgb * 2.0 - 1.0

3. 构建TBN矩阵
   T = Tangent
   B = Bitangent (cross(T, Normal))
   N = Normal

4. 转换到世界空间
   WorldNormal = mul(TBN, UnpackedNormal)

5. 重新归一化
   FinalNormal = normalize(WorldNormal)
```

### 6.2 风致法线偏移

风场不仅影响顶点位置，也影响法线方向：

```glsl
// 风致法线偏移
vec3 CalculateWindNormalOffset(vec3 OriginalNormal, vec3 WindDisplacement)
{
    // 计算位移梯度
    vec3 displacementGradient = normalize(WindDisplacement);

    // 混合原始法线和位移方向
    float blendFactor = length(WindDisplacement) / MaxDisplacement;
    vec3 windNormal = lerp(OriginalNormal, displacementGradient, blendFactor * 0.5);

    return normalize(windNormal);
}
```

---

## 7. 像素着色计算

### 7.1 基础颜色计算

```
颜色计算流程：

1. 采样颜色贴图
   BaseColor = Texture2D(T_Grass_Color, UV).rgb

2. 应用顶点颜色 (可选)
   BaseColor *= VertexColor.rgb

3. 应用风场影响 (颜色随风力变化)
   WindInfluence = WindStrength * 0.1
   BaseColor = lerp(BaseColor, BaseColor * 0.8, WindInfluence)

4. 应用AO (来自DST贴图)
   BaseColor *= DST.a
```

### 7.2 粗糙度与透射

```
DST贴图解码：

1. 采样DST贴图
   DST = Texture2D(T_Grass_DST, UV)

2. 分离通道
   Detail = DST.r        // 细节强度
   Subsurface = DST.g    // 次表面散射
   Transmission = DST.b  // 透射
   AO = DST.a           // 环境遮蔽

3. 粗糙度计算
   Roughness = BaseRoughness * (1.0 - Detail)

4. 次表面散射
   SSSColor = BaseColor * Subsurface * SubsurfaceColor
```

---

## 8. LOD材质差异

### 8.1 LOD0 vs LOD1 对比

| 特性 | LOD0 | LOD1 |
|------|------|------|
| 材质实例 | MI_RealisticGrass_01_LOD0 | MI_RealisticGrass_01_LOD1 |
| 文件大小 | 24KB | 20KB |
| 矩阵计算 | 完整3x3矩阵 | 简化2D矩阵 |
| 顶点位移 | 完整物理模拟 | 线性简化 |
| 法线计算 | TBN完整转换 | 简化法线 |
| 风效 | 完整风场 + 湍流 | 基础风场 |
| 透射 | 完整SSS | 简化/禁用 |

### 8.2 LOD优化策略

```glsl
// LOD级别判断
float CalculateLODFactor(float Distance)
{
    float lod0End = 5000.0;
    float lod1End = 10000.0;

    if (Distance < lod0End)
        return 0.0;  // LOD0
    else if (Distance < lod1End)
        return (Distance - lod0End) / (lod1End - lod0End);  // 混合
    else
        return 1.0;  // LOD1
}

// LOD混合
MaterialOutput = lerp(LOD0_Output, LOD1_Output, LODFactor);
```

---

## 9. 完整着色器伪代码

```hlsl
// Grass Material Shader - 伪代码概览

ShaderOutput MainGrassShader(VertexInput Input)
{
    // ======== 输入采样 ========
    vec2 uv = Input.TexCoord;
    vec3 worldPos = Input.WorldPosition;
    vec3 vertexColor = Input.VertexColor;

    // 纹理采样
    vec4 colorSample = Tex2D(T_Grass_Color, uv);
    vec4 normalSample = Tex2D(T_Grass_Normals, uv);
    vec4 dstSample = Tex2D(T_Grass_DST, uv);
    vec4 opacitySample = Tex2D(T_Grass_Opacity, uv);

    // 参数映射采样
    vec2 paramUV = worldPos.xz * ParameterMapTiling;
    vec4 paramSample = Tex2D(T_Grass_ParametersMap, paramUV);

    // 风场采样
    vec2 windUV = worldPos.xz * WindTiling + Time * WindSpeed;
    vec4 windSample = Tex2D(RT_2DWindSystem_RGBA, windUV);

    // ======== 顶点位移 ========
    mat3 transformMatrix = MF_3X3Mat(paramSample, windSample);

    vec3 displacement = CalculateVertexDisplacement(
        Input.LocalPosition,
        paramSample,
        windSample,
        transformMatrix
    );

    vec3 displacedPos = mul(transformMatrix, Input.LocalPosition + displacement);

    // ======== 法线计算 ========
    vec3 tangentNormal = normalSample.rgb * 2.0 - 1.0;
    vec3 worldNormal = CalculateWorldNormal(tangentNormal, Input.TBN);

    // 风致法线偏移
    worldNormal = CalculateWindNormalOffset(worldNormal, displacement);

    // ======== 像素着色 ========
    vec3 baseColor = colorSample.rgb;
    baseColor *= vertexColor;
    baseColor *= dstSample.a;  // AO

    float roughness = BaseRoughness * (1.0 - dstSample.r);
    float subsurface = dstSample.g;
    float transmission = dstSample.b;

    // ======== 不透明度 ========
    float alpha = opacitySample.r;

    // 距离淡出
    float distanceFade = CalculateDistanceFade(worldPos);
    alpha *= distanceFade;

    // ======== 输出 ========
    ShaderOutput output;
    output.BaseColor = baseColor;
    output.Roughness = roughness;
    output.Normal = worldNormal;
    output.Alpha = alpha;
    output.Subsurface = subsurface;
    output.Transmission = transmission;

    return output;
}
```

---

## 10. 性能关键点

### 10.1 计算成本分析

| 计算阶段 | 相对成本 | 优化策略 |
|----------|----------|----------|
| 纹理采样 (7张) | 高 | 使用纹理数组，合并通道 |
| 矩阵运算 | 中 | LOD简化，2D近似 |
| 三角函数 | 低 | 预计算，查找表 |
| 幂运算 | 中 | 降低精度，近似 |
| 条件分支 | 高 | 使用lerp/step替代if |

### 10.2 纹理采样优化

```hlsl
// 优化前：多次采样
float c1 = Tex2D(Tex1, uv).r;
float c2 = Tex2D(Tex2, uv).g;
float c3 = Tex2D(Tex3, uv).b;

// 优化后：单次采样
vec3 combined = Tex2D(Tex_Combined, uv).rgb;
float c1 = combined.r;
float c2 = combined.g;
float c3 = combined.b;
```

---

## 总结

草地材质的计算核心是：

1. **多通道参数编码** - 单张纹理控制多种变形
2. **3x3矩阵变换** - 高效的顶点空间转换
3. **物理近似模拟** - 简化的弯曲和风效模型
4. **分层LOD优化** - 距离驱动的计算简化
5. **GPU并行计算** - 利用着色器的并行能力

整个着色器在GPU上每帧执行百万次，因此每个计算的优化都很关键。

---

*本章节由Ralph Wiggum深度迭代分析生成*
*迭代次数: #21-30*
*分析日期: 2026-01-09*

---

# 编辑器工具深度解析

> 本章节深入分析编辑器工具的完整实现原理和使用方法

---

## 1. 工具系统总览

```
┌─────────────────────────────────────────────────────────────────┐
│                   Grass Editor Tools 工具系统                     │
└─────────────────────────────────────────────────────────────────┘

                              用户输入
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
        │ 参数映射编辑器  │ │ 地形遮罩编辑器  │ │ 风效控制控件  │
        │ GrassParams   │ │ LandscapeMask │ │ WindControl   │
        │   Render      │ │   Render      │ │    Widget     │
        └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
                │                 │                 │
                ▼                 ▼                 ▼
        ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
        │ 渲染目标材质    │ │ 渲染目标材质    │ │ MPC参数广播   │
        │ RT_Composite  │ │ RT_Composite  │ │ MPC_2DWind    │
        └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
                │                 │                 │
                ▼                 ▼                 ▼
        ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
        │ 参数映射纹理    │ │ 地形遮罩纹理    │ │ 风场纹理      │
        │ T_Grass_      │ │ T_Grass_      │ │ RT_2DWind     │
        │ ParametersMap │ │ LandscapeMask │ │   System      │
        └───────────────┘ └───────────────┘ └───────────────┘
```

---

## 2. 草地参数映射编辑器

### 2.1 编辑器组件架构

```
GrassParametersMapRender/
│
├── EUWDG_GrassParametersMapRender (1MB)
│   └── 用户小部件编辑器主界面
│       ├── 笔刷选择面板
│       ├── 参数调节滑块
│       ├── 预览窗口
│       └── 输出控制
│
├── 渲染目标绘制材质
│   ├── M_RT_DrawBendVariation (31KB) - 弯曲参数绘制
│   ├── M_RT_DrawClump (32KB) - 丛聚参数绘制
│   └── M_RT_DrawScaleVariation (31KB) - 缩放参数绘制
│
├── 渲染目标合成材质
│   ├── M_RT_Composite_SimpleCopy (22KB) - 直接复制
│   ├── M_RT_Composite_SimpleRemap (25KB) - 值重映射
│   ├── M_RT_Composite_ClumpAndScale (27KB) - 组合合成
│   └── M_RT_Composite_ClumpAndScaleAndBend (24KB) - 全参数合成
│
└── 笔刷函数
    ├── MF_RT_BendBrush (32KB)
    ├── MF_RT_ClumpBrush (35KB)
    └── MF_RT_ScaleBrush (32KB)
```

### 2.2 渲染目标绘制材质详解

#### M_RT_DrawBendVariation (弯曲参数绘制)

```hlsl
// 弯曲参数绘制材质伪代码

MaterialOutput DrawBendVariation(
    float2 UV,
    float4 BrushParams,
    float4 CurrentRTContent
)
{
    // 笔刷参数
    float2 BrushPosition = BrushParams.xy;      // 笔刷中心位置
    float BrushRadius = BrushParams.z;           // 笔刷半径
    float BrushStrength = BrushParams.w;         // 笔刷强度
    float BrushFalloff = BrushParams2.x;         // 笔刷衰减

    // 计算像素到笔刷中心的距离
    float distanceToCenter = length(UV - BrushPosition);

    // 笔刷形状计算 (圆形笔刷)
    float brushMask = 1.0 - smoothstep(
        0,
        BrushRadius,
        distanceToCenter
    );

    // 应用笔刷衰减 (边缘柔化)
    brushMask = pow(brushMask, BrushFalloff);

    // 强度调制
    float paintValue = brushMask * BrushStrength;

    // 与现有内容混合
    float currentValue = CurrentRTContent.b;     // B通道存储弯曲
    float newValue = currentValue + paintValue;

    // 钳位到[0,1]范围
    newValue = clamp(newValue, 0.0, 1.0);

    // 输出到渲染目标
    MaterialOutput output;
    output.RGB = CurrentRTContent.rgb;           // 保持其他通道
    output.B = newValue;                         // 仅更新B通道

    return output;
}
```

#### M_RT_DrawClump (丛聚参数绘制)

```hlsl
// 丛聚参数绘制材质伪代码

MaterialOutput DrawClump(
    float2 UV,
    float4 BrushParams,
    float4 CurrentRTContent
)
{
    // 笔刷形状 (使用噪声实现自然边缘)
    float distanceToCenter = length(UV - BrushPosition);

    // 基础圆形遮罩
    float baseMask = 1.0 - smoothstep(0, BrushRadius, distanceToCenter);

    // 添加噪声扰动 (Perlin或Simplex噪声)
    float noise = Texture2D(NoiseTexture, UV * NoiseScale).r;
    float noiseMask = baseMask + noise * NoiseStrength;

    // 最终笔刷遮罩
    float brushMask = saturate(noiseMask);

    // 丛聚值计算
    float clumpValue = brushMask * BrushStrength;

    // 与现有内容混合 (使用最大值保留)
    float currentClump = CurrentRTContent.r;
    float newClump = max(currentClump, clumpValue);

    MaterialOutput output;
    output.R = newClump;                          // R通道存储丛聚
    output.GB = CurrentRTContent.gb;             // 保持其他通道

    return output;
}
```

#### M_RT_DrawScaleVariation (缩放变化绘制)

```hlsl
// 缩放变化绘制材质伪代码

MaterialOutput DrawScaleVariation(
    float2 UV,
    float4 BrushParams,
    float4 CurrentRTContent
)
{
    // 笔刷参数
    float2 BrushPosition = BrushParams.xy;
    float BrushRadius = BrushParams.z;
    float BrushStrength = BrushParams.w;
    float MinScale = BrushParams2.x;             // 最小缩放
    float MaxScale = BrushParams2.y;             // 最大缩放

    // 计算笔刷影响
    float distanceToCenter = length(UV - BrushPosition);
    float brushMask = 1.0 - smoothstep(0, BrushRadius, distanceToCenter);

    // 缩放值范围映射
    float scaleValue = lerp(MinScale, MaxScale, brushMask * BrushStrength);

    // 与现有内容混合
    float currentScale = CurrentRTContent.g;
    float newScale = lerp(currentScale, scaleValue, BrushStrength);

    MaterialOutput output;
    output.R = CurrentRTContent.r;               // 保持丛聚
    output.G = newScale;                         // G通道存储缩放
    output.B = CurrentRTContent.b;               // 保持弯曲

    return output;
}
```

### 2.3 渲染目标合成材质详解

#### M_RT_Composite_ClumpAndScaleAndBend

```hlsl
// 全参数合成材质伪代码

MaterialOutput CompositeAllChannels(
    float2 UV,
    Texture2D RT_Clump,
    Texture2D RT_Scale,
    Texture2D RT_Bend,
    Texture2D RT_Base
)
{
    // 采样各个渲染目标
    float4 clumpData = Texture2D(RT_Clump, UV);
    float4 scaleData = Texture2D(RT_Scale, UV);
    float4 bendData = Texture2D(RT_Bend, UV);
    float4 baseData = Texture2D(RT_Base, UV);

    // 合成RGBA四个通道
    float4 finalRGBA;

    // R通道: 丛聚强度
    finalRGBA.r = clumpData.r;

    // G通道: 缩放变化
    finalRGBA.g = scaleData.g;

    // B通道: 弯曲强度
    finalRGBA.b = bendData.b;

    // A通道: 保留或额外参数
    finalRGBA.a = baseData.a;

    MaterialOutput output;
    output.RGBA = finalRGBA;

    return output;
}
```

### 2.4 笔刷函数详解

#### MF_RT_BendBrush (弯曲笔刷函数)

```hlsl
// 弯曲笔刷核心函数
float4 BendBrushFunction(
    float2 UV,
    float2 BrushPosition,
    float BrushSize,
    float BrushStrength,
    float BrushAngle
)
{
    // 1. 计算局部坐标
    float2 localUV = UV - BrushPosition;

    // 2. 旋转坐标系 (沿笔刷方向)
    float2 rotatedUV;
    rotatedUV.x = localUV.x * cos(BrushAngle) - localUV.y * sin(BrushAngle);
    rotatedUV.y = localUV.x * sin(BrushAngle) + localUV.y * cos(BrushAngle);

    // 3. 计算椭圆笔刷 (沿笔刷方向拉长)
    float aspectRatio = 2.0;  // 长宽比
    float ellipseMask = sqrt(
        pow(rotatedUV.x / (BrushSize * aspectRatio), 2) +
        pow(rotatedUV.y / BrushSize, 2)
    );

    // 4. 笔刷遮罩
    float brushMask = 1.0 - smoothstep(0, 1, ellipseMask);

    // 5. 方向性强度 (沿笔刷方向更强)
    float directionalStrength = BrushStrength * (1.0 + rotatedUV.x * 0.5);

    // 6. 最终输出
    float4 output;
    output.r = 0;           // 丛聚通道不变
    output.g = 0;           // 缩放通道不变
    output.b = brushMask * directionalStrength;  // 弯曲值
    output.a = 0;           // Alpha通道不变

    return output;
}
```

#### MF_RT_ClumpBrush (丛聚笔刷函数)

```hlsl
// 丛聚笔刷核心函数
float4 ClumpBrushFunction(
    float2 UV,
    float2 BrushPosition,
    float BrushSize,
    float BrushStrength,
    float NoiseScale
)
{
    // 1. 基础距离计算
    float2 delta = UV - BrushPosition;
    float distance = length(delta);

    // 2. 柔和边缘
    float softEdge = 1.0 - smoothstep(0, BrushSize, distance);

    // 3. 添加自然变化 (多层噪声)
    float noise1 = Texture2D(NoiseTex, UV * NoiseScale).r * 2.0 - 1.0;
    float noise2 = Texture2D(NoiseTex, UV * NoiseScale * 2.0).r * 2.0 - 1.0;
    float combinedNoise = noise1 * 0.7 + noise2 * 0.3;

    // 4. 噪声调制遮罩
    float noisyMask = softEdge + combinedNoise * 0.3;
    noisyMask = saturate(noisyMask);

    // 5. 丛聚强度计算 (中心强，边缘弱)
    float clumpIntensity = pow(noisyMask, 0.5) * BrushStrength;

    // 6. 输出
    float4 output;
    output.r = clumpIntensity;  // 丛聚通道
    output.g = 0;                // 其他通道不变
    output.b = 0;
    output.a = 0;

    return output;
}
```

#### MF_RT_ScaleBrush (缩放笔刷函数)

```hlsl
// 缩放笔刷核心函数
float4 ScaleBrushFunction(
    float2 UV,
    float2 BrushPosition,
    float BrushSize,
    float MinValue,
    float MaxValue,
    float FalloffPower
)
{
    // 1. 径向距离计算
    float distance = length(UV - BrushPosition);
    float normalizedDist = distance / BrushSize;

    // 2. 可变衰减
    float falloff = pow(1.0 - normalizedDist, FalloffPower);

    // 3. 值映射
    float scaleValue = lerp(MinValue, MaxValue, falloff);

    // 4. 边缘柔和
    float edgeSoftness = smoothstep(1.0, 0.8, normalizedDist);
    scaleValue *= edgeSoftness;

    // 5. 输出
    float4 output;
    output.r = 0;                // 丛聚通道不变
    output.g = scaleValue;       // 缩放通道
    output.b = 0;                // 弯曲通道不变
    output.a = 0;

    return output;
}
```

---

## 3. 地形遮罩编辑器

### 3.1 组件架构

```
GrassLandscapeMaskRender/
│
├── BP_GrassLandscapeMaskRender (17KB)
│   └── 主蓝图逻辑
│       ├── 渲染目标创建
│       ├── 相机设置
│       └── 捕获触发
│
├── EUWDG_GrassLandscapeMaskRender (633KB)
│   └── 编辑器界面
│       ├── 地形图层选择
│       ├── 分辨率设置
│       ├── 捕获按钮
│       └── 保存/加载
│
└── 材质
    ├── M_GrassLandscapeMask (8KB) - 遮罩生成材质
    ├── M_GrassLandscapeMaskPostProcess (23KB) - 后处理材质
    └── M_RT_Composite_SimpleCopy - 输出材质
```

### 3.2 地形遮罩生成原理

```hlsl
// 地形遮罩生成材质伪代码

MaterialOutput GrassLandscapeMask(
    float2 WorldPosition,
    float4 LayerWeights
)
{
    // 输入: 地形图层权重
    float grassWeight = LayerWeights.r;    // Grass图层
    float dirtWeight = LayerWeights.g;     // Dirt图层
    float gravelWeight = LayerWeights.b;   // Gravel图层

    // 计算总权重
    float totalWeight = grassWeight + dirtWeight + gravelWeight;

    // 归一化
    float normalizedGrass = grassWeight / max(totalWeight, 0.001);

    // 生成遮罩值
    float maskValue = normalizedGrass;

    // 可选: 添加噪声细节
    float detailNoise = Texture2D(DetailNoise, WorldPosition * 0.1).r;
    maskValue *= lerp(0.8, 1.0, detailNoise);

    MaterialOutput output;
    output.R = maskValue;
    output.G = maskValue;
    output.B = maskValue;
    output.A = 1.0;

    return output;
}
```

### 3.3 后处理材质

```hlsl
// 后处理材质伪代码

MaterialOutput PostProcessMask(
    float4 InputMask,
    float BlurAmount,
    float Contrast,
    float Brightness
)
{
    // 1. 模糊处理 (可选)
    float4 blurredMask = BoxBlur(InputMask, BlurAmount);

    // 2. 对比度调整
    float3 contrastMask = (blurredMask.rgb - 0.5) * Contrast + 0.5;

    // 3. 亮度调整
    float3 finalMask = contrastMask + Brightness;

    // 4. 钳位
    finalMask = saturate(finalMask);

    MaterialOutput output;
    output.RGB = finalMask;
    output.A = 1.0;

    return output;
}
```

---

## 4. 风效控制控件

### 4.1 控件组件

```
WDG_WindControl
│
├── UI元素
│   ├── 风向滑块 (0-360度)
│   ├── 风力强度滑块 (0-2)
│   ├── 风速滑块 (0-5)
│   ├── 湍流强度滑块 (0-1)
│   ├── 预设选择下拉框
│   └── 实时预览复选框
│
└── MPC参数同步
    ├── WindDirection
    ├── WindStrength
    ├── WindSpeed
    └── WindTurbulence
```

### 4.2 MPC参数更新流程

```
用户操作UI
    ↓
Widget事件触发
    ↓
读取UI值
    ↓
更新MPC_2DWindSyst
    ↓
全局材质参数更新
    ↓
所有草地实例重新采样风场
    ↓
实时风效变化
```

---

## 5. 地形材质系统

### 5.1 材质层级结构

```
M_Landscape (72KB)
│
├── 输入纹理
│   ├── T_Grass_Tile_* (草地平铺纹理)
│   ├── T_Ground_Dirt_* (泥土纹理)
│   └── T_Ground_Gravel_* (碎石纹理)
│
├── 图层混合
│   ├── Grass Layer
│   ├── Dirt Layer
│   └── Gravel Layer
│
└── 输出
    ├── Base Color
    ├── Roughness
    ├── Normal
    └── Ambient Occlusion
```

### 5.2 图层混合逻辑

```hlsl
// 地形图层混合伪代码

MaterialOutput LandscapeLayerBlend(
    float2 UV,
    float4 LayerWeights,
    Texture2D GrassTextures[4],
    Texture2D DirtTextures[4],
    Texture2D GravelTextures[4]
)
{
    // 解包图层权重
    float grassWeight = LayerWeights.r;
    float dirtWeight = LayerWeights.g;
    float gravelWeight = LayerWeights.b;

    // === 颜色混合 ===
    float3 grassColor = Texture2D(GrassTextures[0], UV).rgb;
    float3 dirtColor = Texture2D(DirtTextures[0], UV).rgb;
    float3 gravelColor = Texture2D(GravelTextures[0], UV).rgb;

    float3 finalColor =
        grassColor * grassWeight +
        dirtColor * dirtWeight +
        gravelColor * gravelWeight;

    // === 法线混合 ===
    float3 grassNormal = Texture2D(GrassTextures[1], UV).rgb * 2.0 - 1.0;
    float3 dirtNormal = Texture2D(DirtTextures[1], UV).rgb * 2.0 - 1.0;
    float3 gravelNormal = Texture2D(GravelTextures[1], UV).rgb * 2.0 - 1.0;

    float3 finalNormal = normalize(
        grassNormal * grassWeight +
        dirtNormal * dirtWeight +
        gravelNormal * gravelWeight
    );

    // === 粗糙度混合 ===
    float grassR = Texture2D(GrassTextures[2], UV).r;
    float dirtR = Texture2D(DirtTextures[2], UV).r;
    float gravelR = Texture2D(GravelTextures[2], UV).r;

    float finalRoughness =
        grassR * grassWeight +
        dirtR * dirtWeight +
        gravelR * gravelWeight;

    // === 高度混合 (用于位移) ===
    float grassH = Texture2D(GrassTextures[3], UV).r;
    float dirtH = Texture2D(DirtTextures[3], UV).r;
    float gravelH = Texture2D(GravelTextures[3], UV).r;

    float finalHeight =
        grassH * grassWeight +
        dirtH * dirtWeight +
        gravelH * gravelWeight;

    MaterialOutput output;
    output.BaseColor = finalColor;
    output.Normal = finalNormal;
    output.Roughness = finalRoughness;
    output.Height = finalHeight;

    return output;
}
```

---

## 6. Niagara风效系统

### 6.1 粒子系统架构

```
FX_2DWindSyst_Simulation (846KB)
│
├── 粒子发射器
│   ├── Emitter Type: Grid
│   ├── Grid Size: 256x256
│   └── Spawn Rate: 持续发射
│
├── 粒子行为
│   ├── Velocity Module - 风向控制
│   ├── Curl Noise Module - 湍流
│   ├── Turbulence Force - 扰动
│   └── Lifetime Module - 生命周期
│
├── 渲染模块
│   ├── Render Target Writer
│   └── Output: RT_2DWindSystem_RGBA
│
└── 参数接口
    └── NPC_2DWindSyst (Niagara Parameter Collection)
```

### 6.2 风场数据编码

```hlsl
// Niagara粒子到渲染目标输出编码

// 粒子位置 (2D平面)
float2 ParticlePosition = Particle.Position.xy;

// 风场向量 (归一化)
float2 WindDirection = normalize(Particle.Velocity.xy);

// 风力强度
float WindStrength = length(Particle.Velocity.xy);

// 湍流强度
float Turbulence = Particle.AttributeTurbulence;

// 编码到RGBA
float4 EncodedWindData;
EncodedWindData.r = WindDirection.x * 0.5 + 0.5;  // [-1,1] → [0,1]
EncodedWindData.g = WindDirection.y * 0.5 + 0.5;  // [-1,1] → [0,1]
EncodedWindData.b = WindStrength;                  // [0, MaxStrength]
EncodedWindData.a = Turbulence;                    // [0, 1]

// 写入渲染目标
OutputToRenderTarget(RT_2DWindSystem_RGBA, ParticlePosition, EncodedWindData);
```

### 6.3 湍流噪声生成

```
湍流生成流程：

1. Curl Noise
   ├─ 输入: 3D Perlin/Simplex噪声
   ├─ 计算: curl(噪声场)
   └─ 输出: 无散度向量场

2. 多层叠加
   ├─ Layer 1: 大尺度, 低频
   ├─ Layer 2: 中尺度, 中频
   └─ Layer 3: 小尺度, 高频

3. 时间变化
   ├─ 噪声偏移 = Time × Speed
   └─ 实现动态风场

4. 输出湍流向量
   └─ 叠加到基础风向
```

---

## 7. 工具使用工作流

### 7.1 完整参数创建流程

```
步骤1: 创建参数映射纹理
├─ 打开 EUWDG_GrassParametersMapRender
├─ 设置输出分辨率 (如: 1024x1024)
├─ 创建渲染目标资产

步骤2: 绘制弯曲参数
├─ 选择 "Bend" 笔刷
├─ 调整笔刷大小和强度
├─ 在场景中绘制弯曲区域
└─ 实时预览效果

步骤3: 绘制丛聚参数
├─ 选择 "Clump" 笔刷
├─ 设置丛聚强度范围
├─ 绘制丛聚区域
└─ 调整噪声密度

步骤4: 绘制缩放参数
├─ 选择 "Scale" 笔刷
├─ 设置最小/最大缩放
├─ 绘制缩放变化区域
└─ 调整衰减曲线

步骤5: 合成最终纹理
├─ 选择合成模式 (Clump+Scale+Bend)
├─ 执行合成
├─ 保存到 T_Grass_ParametersMap
└─ 应用到草地材质

步骤6: 测试和调整
├─ 进入PIE模式
├─ 观察草地变形效果
├─ 返回编辑器调整参数
└─ 重新合成 (如需要)
```

### 7.2 地形遮罩创建流程

```
步骤1: 准备地形
├─ 创建/打开Landscape
├─ 添加地形图层
└─ 绘制图层分布

步骤2: 配置遮罩捕获
├─ 打开 EUWDG_GrassLandscapeMaskRender
├─ 设置输出分辨率
├─ 选择目标图层
└─ 配置捕获范围

步骤3: 执行捕获
├─ 点击 "Capture" 按钮
├─ 相机自动定位
├─ 渲染遮罩到RT
└─ 保存纹理资产

步骤4: 后处理 (可选)
├─ 应用模糊
├─ 调整对比度
├─ 修正边界
└─ 保存最终版本

步骤5: 应用到草地材质
├─ 赋值 T_Grass_LandscapeMask
├─ 调整遮罩强度
└─ 测试植被分布
```

---

## 8. 工具优化建议

### 8.1 性能优化

| 优化项 | 当前状态 | 建议改进 |
|--------|----------|----------|
| 渲染目标分辨率 | 固定1024x1024 | 可配置+自适应 |
| 笔刷更新频率 | 实时更新 | 增量更新 |
| 合成计算 | 每次全量合成 | 缓存+仅更新变化区域 |
| 预览质量 | 实时全分辨率 | LOD预览 |
| 撤销/重做 | 未实现 | 历史记录栈 |

### 8.2 功能扩展建议

1. **参数动画**
   - 支持关键帧动画
   - 时间变化的参数

2. **程序化生成**
   - Perlin噪声基础生成
   - 分形噪声叠加
   - 自定义噪声函数

3. **笔刷库**
   - 预设笔刷形状
   - 自定义笔刷导入
   - 笔刷组合

4. **批量处理**
   - 多地形同时处理
   - 批量参数应用
   - 自动化工作流

---

## 总结

编辑器工具是草地方案的关键组成部分，提供：

1. **可视化参数编辑** - 直观的笔刷系统
2. **实时预览** - 即时看到效果变化
3. **渲染目标管线** - 灵活的数据流
4. **模块化设计** - 可扩展的工具链
5. **Niagara集成** - GPU加速的风场模拟

掌握这些工具的使用和原理，是创建高质量草地效果的关键。

---

*本章节由Ralph Wiggum深度迭代分析生成*
*迭代次数: #31-40*
*分析日期: 2026-01-09*

---

# 手动拆解补充分析

> 本章节基于手动拆解的详细流程图，补充之前分析中遗漏的关键技术细节
>
> **迭代轮次**: #51-60
> **对比来源**: 用户手动拆解的 `材质.流程图.md`

---

## 1. 整体材质计算流程

### 完整着色器数据流

```
┌─────────────────────────────────────────────────────────────────┐
│              M_RealisticGrass_01 完整着色器流程                    │
└─────────────────────────────────────────────────────────────────┘

                    顶点着色器输入 (Vertex Shader Input)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │Base Color│          │  PBR    │          │ Shadow  │
   │ 计算     │          │Roughness│          │Opacity  │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   材质属性输出     │
                    │ MaterialAttributes│
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │  Normal │          │   WPO   │          │  PDO    │
   │ 法线计算 │          │世界位置偏移│         │深度偏移  │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   像素着色器输出     │
                    │  Pixel Shader Output│
                    └─────────────────────┘
```

---

## 2. WPO数据准备阶段详解

### 2.1 数据准备流程

```hlsl
// === 数据准备阶段的三个关键数据源 ===

// 1. Instance Position in World Space（世界空间中的实例位置）
float3 ClumpPosition = TransformLocalToAbsoluteWorld(float3(0.0, 0.0, 0.0));

// 2. Pivots in Local & World Space（局部和世界空间中的轴心点）
float2 BakedPivotData = TexCoord[N].xy;
float3 PivotLocalPosition = float3(BakedPivotData.x, BakedPivotData.y, 0.0);
float3 PivotWorldPosition = TransformLocalToAbsoluteWorld(PivotLocalPosition);

// 3. Random Value & Normalized Height（随机值和归一化高度）
float2 VertexDataUV = TexCoord[2].xy;
float GrassRandom = VertexDataUV.x;    // [0,1] 范围的随机值
float GrassHeight = VertexDataUV.y;    // 0.0(根部) → 1.0(顶部)
```

**数据用途表**：

| 数据 | 类型 | 来源 | 用途 |
|------|------|------|------|
| `ClumpPosition` | float3 | LocalToWorld平移分量 | 计算实例中心位置 |
| `PivotLS` | float3 | TexCoord[N] baked | 草叶局部轴心 |
| `PivotWS` | float3 | 变换后 | 草叶世界轴心 |
| `GrassRandom` | float | TexCoord[2].x | 随机变化 |
| `GrassHeight` | float | TexCoord[2].y | 高度遮罩 |

### 2.2 参数纹理采样详解

```hlsl
// === 关键：在Pivot位置采样，确保整株草的参数一致 ===

// 输入参数
float3 PivotWS;              // 世界空间轴心
float3 PivotLS;              // 局部空间轴心
float RandomnessStrength;    // 随机性强度 (默认: 3.0)
float ParameterMapSize;      // 参数映射大小 (默认: 4000.0)
Texture2D ParameterMap;      // RGBA参数纹理

// 步骤1: 引入微观随机偏移
float3 OffsetPosition = PivotLS * RandomnessStrength;
float3 SampleWorldPos = PivotWS + OffsetPosition;

// 步骤2: 世界坐标转UV
float2 SampleUV = SampleWorldPos.xy / ParameterMapSize;

// 步骤3: 采样参数纹理
float4 ParameterData = ParameterMap.SampleLevel(MapSampler, SampleUV, 0);

// 步骤4: 数据分离
float2 ClumpDirection = ParameterData.rg;    // RG: 丛聚倒伏方向
float ScaleTextureVariation = ParameterData.b; // B: 缩放变化
float BendTextureVariation = ParameterData.a;  // A: 弯曲变化
```

**为什么在Pivot位置采样？**
- 草卡片有多个顶点，如果每个顶点独立采样，参数会不一致
- 在Pivot位置采样，整株草获得相同的参数值
- 确保草叶作为一个整体进行变形

---

## 3. 弯曲算法深度解析

### 3.1 完整GrassBend函数实现

```hlsl
// === 基于圆弧几何的精确弯曲算法 ===

// 输入参数
float BendMin;               // 最小弯曲 (默认: 2.0)
float BendMax;               // 最大弯曲 (默认: -1.5)
float BendFalloff;           // 弯曲衰减 (默认: 2.0)
float BendVariation;         // 来自参数纹理的弯曲变化
float3 WindXYZ;              // 当前风力向量
float WindUnbendMag;         // 风力拉直阈值 (默认: 160000.0)
float WindUnbendFalloff;     // 风力拉直衰减 (默认: 1.0)
float3 CameraFacingOffset;   // 面向相机后的位置
float BendOffsetHeight;      // 弯曲高度偏移 (默认: 25.0)

// === 步骤1: 计算基础弯曲量 ===
float VariationCurve = pow(BendVariation, BendFalloff);
float BaseBendAmount = lerp(BendMin, BendMax, VariationCurve);

// === 步骤2: 计算风力拉直效应 ===
float WindSpeedSq = dot(WindXYZ, WindXYZ);
float UnbendRatio = saturate(WindSpeedSq / WindUnbendMag);
UnbendRatio = pow(UnbendRatio, WindUnbendFalloff);
float StraightenFactor = 1.0 - UnbendRatio;

// === 步骤3: 最终弯曲量 ===
float BendAmount = BaseBendAmount * StraightenFactor;

// === 步骤4: 执行弯曲函数 ===
float3 outWPO = CameraFacingOffset;
float3 outWSNormal = float3(0.0, 0.0, 1.0);

const float BendAmountScaled = BendAmount * 0.01;
const float Offset = max(0.0, BendOffsetHeight);

if (abs(BendAmountScaled) > 0.00001)
{
    const float InverseBendAmount = 1.0 / BendAmountScaled;

    // 计算弯曲角度 θ
    const float WPOTheta = max(0.0, CameraFacingOffset.z - Offset) * BendAmountScaled;

    // 计算弯曲偏移
    const float WPOBendOffset = CameraFacingOffset.x - InverseBendAmount;

    // 计算弯曲法线 (sinθ, cosθ)
    outWSNormal.x = sin(WPOTheta);
    outWSNormal.z = cos(WPOTheta);

    // 应用弯曲位移
    // Z轴: 沿弧线的高度变化
    // X轴: 沿弧线的水平位移
    outWPO.z = min(CameraFacingOffset.z - Offset, -WPOBendOffset * outWSNormal.x) + Offset;
    outWPO.x = (WPOBendOffset * outWSNormal.z) + InverseBendAmount;
}

return outWPO;  // 弯曲后的局部位置
```

### 3.2 弯曲算法的数学原理

```
弯曲几何模型：

     草叶(原始)          草叶(弯曲后)
        │                    ╱
        │                   ╱
        │                  ╱  ← 弧线(恒定长度)
        │                 ╱
        │                ╱
        │               ╱
        └────────────→  ╱   ← 弯曲角度 θ
       Pivot点          顶点

数学关系：
- 弧长 L = 恒定 (草叶不伸缩)
- 弯曲半径 R = 1 / BendAmount
- 弯曲角度 θ = height × BendAmount
- 顶点位置:
  · x = R × sin(θ) + OffsetX
  · z = R × cos(θ) + OffsetZ
```

**关键特性**：
1. **弧长恒定**：草叶不会因为弯曲而伸缩
2. **几何精确**：基于圆弧而非简单的线性插值
3. **风力拉直**：大风时草会被"吹直"，减少弯曲

---

## 4. 风力速度缓冲系统

### 4.1 TAA鬼影问题详解

```hlsl
// === 为什么需要读取上一帧的风数据？ ===

// 场景描述：
// 第99帧:  风很小 → 草是直的
// 第100帧: 风很大 → 草弯了

// 如果只用当前风数据计算：
// ┌─────────────────────────────────────────┐
// │ 引擎计算第99帧位置(用第100帧的大风)      │
// │ 结果: 认为第99帧草也是弯的              │
// │ 结论: 草没动                            │
// │ 后果: 速度向量=0 → 动态模糊消失         │
// │       TAA鬼影出现                       │
// └─────────────────────────────────────────┘

// 解决方案：显式速度计算
#if RENDERING_PREVIOUS_FRAME_TRANSFORM
    // 计算上一帧位置时，使用上一帧的风数据
    SelectedWindXY = float2(WindData.b, WindData.a);  // BA通道
#else
    // 渲染当前帧时，使用当前帧的风数据
    SelectedWindXY = float2(WindData.r, WindData.g);  // RG通道
#endif
```

### 4.2 风力调制算法

```hlsl
// === 完整的风力调制流程 ===

// 输入参数
float3 RawWindXYZ;           // 原始风场向量
float3 CardBaseForwardVector; // 草面片前向向量
float GrassHeight;            // 归一化高度 [0,1]
bool bUseNormalModulation;    // 是否使用法线调制
float NormalModulation;       // 法线调制强度 [0,1]
float WindMultiplier;         // 全局风力乘数
float RigidityOffset;         // 根部硬度偏移
float RigidityFalloff;        // 硬度衰减指数

// === 步骤1: 风向调制 ===
float3 ModulatedWindVector;
float WindLengthSq = dot(RawWindXYZ, RawWindXYZ);

if (WindLengthSq > 0.000001)
{
    float3 NormalizedWind = normalize(RawWindXYZ);

    // 计算风向与草面朝向的对齐程度
    // 0 = 垂直/侧面 (风吹侧面)
    // 1 = 平行/正面 (风吹正面)
    float FacingAlignment = abs(dot(NormalizedWind, CardBaseForwardVector));

    // 根据对齐程度调制风力
    float3 AlignedWind = RawWindXYZ * FacingAlignment;
    ModulatedWindVector = lerp(RawWindXYZ, AlignedWind, NormalModulation);
}

// === 步骤2: 高度与刚性遮罩 ===
float Mask = GrassHeight - RigidityOffset;
Mask = saturate(Mask);
Mask = pow(Mask, RigidityFalloff);  // 指数衰减

// === 步骤3: 最终风力 ===
float3 WindModulatedVector = ModulatedWindVector * WindMultiplier * Mask;
```

**调制效果**：
- **根部** (Height=0): 受风力小 (RigidityOffset保护)
- **顶部** (Height=1): 受风力大
- **侧面**: 受风力大 (NormalModulation=0)
- **正面**: 受风力小 (NormalModulation=1)

---

## 5. 阴影通道Dither系统

### 5.1 完整Dither逻辑

```hlsl
// === 阴影通道的抖动透明实现 ===

#if SHADOW_DEPTH_PASS
    // === 普通阴影模式 ===
    if (bUsePlainShadow || !bUseDitheredShadow)
    {
        return BaseOpacity;  // 直接返回不透明度
    }

    // === Dither阴影模式 ===

    // 1. 获取高度渐变 (从TexCoord[2].y)
    float HeightGradient = TexCoord[2].y;  // 0=根部, 1=顶部

    // 2. 计算高度遮罩 (Power控制衰减曲线)
    float HeightMask = pow(HeightGradient, DitherFalloff);

    // 3. 应用强度乘数
    float DitherAlpha = HeightMask * DitherStrength;

    // 4. 获取Dither噪点
    // DitherTemporalAA() 返回 0 或 1 的高频噪点
    float DitherNoise = DitherTemporalAA();

    // 5. 混合实心与抖动
    // Alpha=0 (根部) → ShadowDensity=1.0 (实心阴影)
    // Alpha=1 (顶部) → ShadowDensity=DitherNoise (抖动)
    float ShadowDensity = lerp(1.0, DitherNoise, DitherAlpha);

    // 6. 最终合成
    return BaseOpacity * ShadowDensity;

#else
    // === 正常渲染通道 ===
    return BaseOpacity;
#endif
```

### 5.2 Dither效果可视化

```
草叶阴影分布：

┌─ 完整遮罩 (根部) ─┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← ShadowDensity = 1.0 (实心)
│▓▓▓▓▓▓▓▓▓▓▓▓▓│     ← ShadowDensity = 0.9
│▓▓▓▓▓▓▓▓▓▓▓│       ← ShadowDensity = 0.7
│▓▓▓░░▓▓░░▓▓│         ← ShadowDensity = 0.5 (开始抖动)
│░░░░░░░░░░│           ← ShadowDensity = DitherNoise (随机)
│░░░░░░░░│             ← ShadowDensity = DitherNoise (随机)
└─ 抖动遮罩 (顶部) ─┘

效果：
- 根部阴影: 完全实心 → 清晰的根部阴影
- 中部过渡: 逐渐变淡 → 自然过渡
- 顶部阴影: 随机抖动 → 模拟半透明效果
```

---

## 6. 静态开关系统

### 6.1 关键静态开关

| 开关名称 | 默认值 | 功能 | 性能影响 |
|----------|--------|------|----------|
| `WPO\|Bend - Use` | true | 启用弯曲计算 | 高 |
| `WPO\|Clump - Use Grass Layer Mask` | true | 启用丛聚遮罩 | 中 |
| `WPO\|Scale - Use Fade Amount` | true | 启用距离淡出 | 低 |
| `WPO\|Scale - Apply Instance Scale` | true | 应用实例缩放 | 低 |
| `Opacity - Use Plain Shadow` | false | 普通阴影模式 | 低 |
| `Opacity - Use Dithered Shadow` | true | Dither阴影模式 | 中 |

### 6.2 LOD优化策略

```hlsl
// === LOD级别判断 ===

#if USE_BEND_LOGIC
    // LOD0: 完整弯曲计算
    if (bUseBend)
    {
        PreRotatedPosition = BentPosition;
    }
    else
    {
        PreRotatedPosition = CameraFacingOffset;
    }
#else
    // LOD1: 禁用弯曲，强制法线向上
    BentZNormal = float3(0.0, 0.0, 1.0);
    PreRotatedPosition = CameraFacingOffset;
#endif
```

**LOD差异**：

| 特性 | LOD0 | LOD1 |
|------|------|------|
| 弯曲计算 | 完整GrassBend函数 | 禁用 |
| 法线 | 计算弯曲法线 | 强制向上 |
| 风效 | 完整风力调制 | 简化 |
| 性能 | 高开销 | 低开销 |

---

## 7. 完整计算链路

### 7.1 WPO完整流程

```
数据准备
  ↓
┌─────────────────────────────────────────┐
│  Data: instance position                │
│  Data: Pivots (local & world)           │
│  Data: Random & Height                  │
└──────────────┬──────────────────────────┘
               ↓
参数采样
  ↓
┌─────────────────────────────────────────┐
│  Parameters: 从纹理采样草地参数          │
│  Wind: 从RT获取当前/上一帧风力           │
└──────────────┬──────────────────────────┘
               ↓
方向计算
  ↓
┌─────────────────────────────────────────┐
│  WPO: 选择Z轴方向 (世界Z vs 实例Z)       │
│  WPO: 添加Clump倒伏方向                  │
└──────────────┬──────────────────────────┘
               ↓
卡片基底构建
  ↓
┌─────────────────────────────────────────┐
│  Data: 构建3正交轴 (Up/Forward/Right)   │
│  Data: 从法线获取Forward/Right轴         │
└──────────────┬──────────────────────────┘
               ↓
面向相机
  ↓
┌─────────────────────────────────────────┐
│  WPO: 获取前向视图向量2D                 │
│  WPO: 应用受限面向相机矩阵               │
└──────────────┬──────────────────────────┘
               ↓
弯曲处理
  ↓
┌─────────────────────────────────────────┐
│  Bend: 沿Y轴弯曲卡片                    │
│  {使用弯曲?} → 是/否分支                 │
└──────────────┬──────────────────────────┘
               ↓
空间变换
  ↓
┌─────────────────────────────────────────┐
│  Normal: 获取弯曲Up/Forward向量          │
│  WPO: 旋转卡片到自定义基底               │
└──────────────┬──────────────────────────┘
               ↓
缩放处理
  ↓
┌─────────────────────────────────────────┐
│  WPO: 地形图层缩放                       │
│  WPO: 距离剔除缩放                       │
│  WPO: 纹理缩放                           │
│  WPO: 实例Z轴缩放                        │
└──────────────┬──────────────────────────┘
               ↓
Clump处理
  ↓
┌─────────────────────────────────────────┐
│  WPO: 偏移到Pivot点                      │
│  {使用Clump遮罩?} → 是/否分支            │
│  WPO: 最终结果                           │
└─────────────────────────────────────────┘
```

### 7.2 法线处理流程

```
法线输入
  ↓
┌─────────────────────────────────────────┐
│  Normal: 旋转X或Z弯曲法线                │
│  (与卡片旋转相同的方式)                  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Normal: 投影上向量到X&Y                 │
│  (面向上向量旋转轴的作弊处理)             │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Normal: 获取切线空间法线                │
│  Normal: 重建切线空间法线                │
│  (根据弯曲和卡片旋转)                    │
└─────────────────────────────────────────┘
```

---

## 8. 关键技术要点总结

### 8.1 与之前分析的主要差异

| 方面 | 之前分析 | 手动拆解发现 |
|------|----------|-------------|
| 弯曲算法 | 简化悬臂梁模型 | **完整圆弧几何算法** |
| 风力采样 | 基础逻辑 | **包含上一帧数据** |
| 数据准备 | 概念性描述 | **详细的Pivot/Random/Height** |
| 阴影处理 | 未详细分析 | **完整Dither Temporal AA** |
| 静态开关 | 概念性提及 | **具体的条件分支** |
| LOD优化 | 简化描述 | **详细的优化实现** |

### 8.2 核心发现

1. **弯曲算法基于圆弧几何**
   - 使用sin/cos计算弯曲曲线
   - 保持草叶弧长恒定
   - 风力越大，弯曲越小(拉直效应)

2. **风力速度缓冲系统**
   - 解决TAA鬼影问题
   - 需要同时存储当前帧和上一帧的风数据
   - RG=当前帧, BA=上一帧

3. **Pivot位置采样的重要性**
   - 确保整株草获得一致的参数
   - 在Pivot位置采样而非顶点位置
   - 引入微观随机偏移避免重复

4. **阴影通道的Dither技术**
   - 根部实心阴影，顶部抖动阴影
   - 使用DitherTemporalAA()生成噪点
   - 实现从根部到顶部的渐变透明

5. **静态开关的LOD优化**
   - LOD1禁用弯曲计算
   - 强制法线向上
   - 显著降低性能开销

---

## 9. 完整参数映射

### 9.1 纹理通道编码

| 纹理 | 通道 | 数据 | 范围 |
|------|------|------|------|
| **Albedo/Roughness** | RGB | 颜色 | [0,1] |
| | A | 粗糙度 | [0,1] |
| **DST** | R | 细节 | [0,1] |
| | G | 高光 | [0,1] |
| | B | 透射 | [0,1] |
| | A | AO | [0,1] |
| **Parameters** | RG | Clump方向 | [-1,1] |
| | B | 缩放变化 | [0,1] |
| | A | 弯曲变化 | [0,1] |
| **WindRT** | RG | 当前风 | [-1,1] |
| | BA | 上一帧风 | [-1,1] |
| **LandscapeMask** | R | 草地权重 | [0,1] |

### 9.2 关键参数默认值

| 参数 | 默认值 | 描述 |
|------|--------|------|
| `WPO\|Parameters - Randomness` | 3.0 | 参数采样的随机偏移 |
| `WPO\|Parameters - Parameter Map Size` | 4000.0 | 参数映射的世界尺寸 |
| `WPO\|Wind - Randomness` | 3.0 | 风力采样的随机偏移 |
| `WPO\|Wind - Scale` | 6000.0 | 风场纹理的世界尺寸 |
| `WPO\|Bend - Min` | 2.0 | 最小弯曲量 |
| `WPO\|Bend - Max` | -1.5 | 最大弯曲量 |
| `WPO\|Bend - Wind UnBend Magnitude` | 160000.0 | 风力拉直阈值 |
| `WPO\|Orientation - Inherit From Clump` | -8.0 | 从Clump继承强度 |

---

## 10. 性能优化建议

### 10.1 关键性能点

| 计算阶段 | 相对成本 | 优化策略 |
|----------|----------|----------|
| 参数纹理采样 | 高 | 使用Mipmap，降低采样频率 |
| 弯曲计算 | 高 | LOD1禁用，简化算法 |
| 风力调制 | 中 | 使用静态开关 |
| 面向相机 | 中 | 简化2D投影 |
| Dither阴影 | 低 | 仅在阴影通道启用 |

### 10.2 实用技巧

1. **参数映射优化**
   - 使用适当的分辨率 (1024x1024通常足够)
   - 启用Mipmap减少远距离采样成本
   - 考虑使用RVT替代静态纹理

2. **风场优化**
   - 降低风场RT分辨率
   - 减少风场更新频率
   - 使用简化的风力模型

3. **LOD优化**
   - 合理设置LOD切换距离
   - LOD1禁用弯曲和复杂风效
   - 使用简化的法线计算

---

## 总结

手动拆解分析揭示了大量之前未被发现的技术细节：

1. **精确的弯曲算法** - 基于圆弧几何而非简单近似
2. **完整的速度缓冲系统** - 解决TAA鬼影的关键
3. **详细的数据准备流程** - Pivot/Random/Height的完整实现
4. **复杂的阴影处理** - Dither Temporal AA的完整实现
5. **灵活的静态开关** - 支持多种LOD和性能配置

这些细节对于理解草地方案的完整实现原理至关重要。

---

*本章节由Ralph Wiggum深度迭代分析生成*
*迭代次数: #51-60*
*对比来源: 用户手动拆解文档*
*分析日期: 2026-01-09*

---

# 远景草地系统深度解析

> 本章节专门分析远距离草地渲染的优化实现方案
>
> **补充来源**: 项目实际资产结构分析
> **分析日期**: 2026-01-09

---

## 1. FarGrass 远景草地架构

### 1.1 远景草地资产清单

| 资产名称 | 路径 | 大小 | 用途 |
|----------|------|------|------|
| `SM_FarGrass` | FarGrass/Meshes/ | 未统计 | 远景草地网格 |
| `M_FarGrass` | FarGrass/Materials/ | 未统计 | 远景草地材质 |
| `T_FarGrass_N` | FarGrass/Textures/ | 未统计 | 远景草地法线贴图 |

### 1.2 SM_FarGrass 网格设计

```
SM_FarGrass 几何特征：

顶点布局：
├─ 极简化几何结构
├─ 减少顶点数量（可能仅4-6个顶点）
└─ 优化三角形数量（2-3个三角形）

材质布局：
├─ 简化UV映射
├─ 单一UV通道
└─ 优化顶点数据流

LOD设置：
├─ 通常作为LOD2或LOD3使用
├─ 渲染距离：极远（如10000+单位）
└─ 可能使用InstancedStaticMesh或Foliage Instancing
```

**关键设计思路**：
- **极简几何**：远距离无法看到细节，使用最简化的几何体
- **单材质**：避免材质切换开销
- **批处理友好**：适合GPU实例化渲染

### 1.3 M_FarGrass 材质实现

```hlsl
// FarGrass 材质核心逻辑（简化版）

MaterialOutput FarGrassShader(VertexInput Input)
{
    // === 输入采样 ===
    float3 normalSample = Tex2D(T_FarGrass_N, Input.UV).rgb;
    
    // === 简化着色器 ===
    
    // 1. 基础颜色（可能使用程序化或单色）
    float3 baseColor = float3(0.2, 0.35, 0.15);  // 深绿色
    
    // 2. 简化法线（仅用于基础光照）
    float3 worldNormal = normalize(normalSample.rgb * 2.0 - 1.0);
    
    // 3. 固定粗糙度（远距离统一粗糙度）
    float roughness = 0.9;
    
    // 4. 无复杂特效（禁用WPO、Bend、Clump等）
    
    // === 距离淡出 ===
    float distance = length(Input.WorldPosition - CameraPosition);
    float fadeFactor = 1.0 - smoothstep(10000.0, 12000.0, distance);
    
    // === 输出 ===
    MaterialOutput output;
    output.BaseColor = baseColor;
    output.Normal = worldNormal;
    output.Roughness = roughness;
    output.Opacity = fadeFactor;
    
    return output;
}
```

**与近景草地对比**：

| 特性 | 近景草地 (M_RealisticGrass_01) | 远景草地 (M_FarGrass) |
|------|-------------------------------|------------------------|
| WPO | 完整实现（弯曲、风效、Clump） | 禁用 |
| 纹理采样 | 7张纹理（颜色、法线、DST、参数等） | 1张法线贴图 |
| 顶点计算 | 复杂的矩阵变换和物理模拟 | 简单的基础光照 |
| 风效交互 | 实时Niagara风场响应 | 可能静态或禁用 |
| LOD级别 | LOD0/LOD1 | LOD2/LOD3 |
| 性能开销 | 高（每个实例多次纹理采样） | 低（单次采样） |

### 1.4 LOD过渡策略

```
LOD切换距离配置：

LOD0 (近景草地)：
├─ 距离：0-5000单位
├─ 材质：MI_RealisticGrass_01_LOD0
├─ 特性：完整WPO、风效、Dither阴影
└─ 实例：SM_Grass_A/B/C/D/E

LOD1 (中景草地)：
├─ 距离：5000-10000单位
├─ 材质：MI_RealisticGrass_01_LOD1
├─ 特性：简化WPO、基础风效
└─ 实例：同LOD0（可能降低密度）

LOD2 (远景草地)：
├─ 距离：10000-15000单位
├─ 材质：M_FarGrass
├─ 特性：禁用WPO、简法线
└─ 实例：SM_FarGrass

LOD3 (极远/剔除)：
├─ 距离：15000+单位
├─ 处理：距离剔除
└─ 性能：不渲染
```

**过渡优化技巧**：
1. **渐进淡出**：在LOD切换边界使用alpha混合
2. **密度递减**：远距离自动降低植被实例密度
3. **批处理合并**：相同LOD级别的实例合并渲染批次

---

## 2. 地形遮罩系统深度解析

### 2.1 T_Grass_LandscapeMask 生成流程

```
地形遮罩生成架构：

步骤1: 地形图层准备
├─ 创建Landscape
├─ 添加图层：
│  ├─ Grass.uasset (草地层)
│  ├─ Dirt.uasset (泥土层)
│  └─ Gravel.uasset (碎石层)
└─ 绘制图层分布

步骤2: 遮罩捕获工具
├─ 打开 EUWDG_GrassLandscapeMaskRender
├─ 配置输出参数：
│  ├─ 输出分辨率（如1024x1024）
│  ├─ 覆盖范围（地形边界）
│  └─ 采样密度
└─ 执行捕获

步骤3: 后处理
├─ 模糊处理（可选）
├─ 对比度调整
└─ 边界平滑

步骤4: 保存纹理
└─ 生成 T_Grass_LandscapeMask (27KB)
```

### 2.2 遮罩在草地材质中的应用

```hlsl
// 地形遮罩采样与调制

// === 输入参数 ===
float3 PivotWS;              // 草丛的世界空间轴心
float3 PivotLS;              // 草叶的局部空间轴心
float LandscapeRandomness;      // 随机偏移强度（避免重复）
float2 MaskOffset;           // 手动对齐偏移
float MaskSize;              // 遮罩世界尺寸
Texture2D LandscapeMask;      // T_Grass_LandscapeMask
SamplerState MaskSampler;

// === 步骤1: 计算采样位置 ===
// 引入随机偏移，打破采样重复性
float2 RandomOffset = PivotLS.xy * LandscapeRandomness;

// 组合世界坐标、随机偏移和手动对齐
float2 SamplingPos = PivotWS.xy + RandomOffset + MaskOffset;

// 转换为UV空间
float2 MaskUV = SamplingPos / MaskSize;

// === 步骤2: 采样遮罩 ===
float GrassLayerWeight = LandscapeMask.SampleLevel(MaskSampler, MaskUV, 0).r;

// === 步骤3: 应用遮罩 ===
// 遮罩值范围[0,1]，1表示纯草地，0表示无草地
// 可用于：
// 1. 控制草地密度（低权重区域不生成实例）
// 2. 控制草叶缩放（低权重区域草更矮）
// 3. 控制草地透明度（低权重区域草更淡）
```

### 2.3 遮罩参数详解

| 参数 | 默认值 | 描述 | 典型范围 |
|------|--------|------|----------|
| `WPO\|Scale - Landscape Randomness` | 未指定 | 采样随机偏移强度 | 0.0-10.0 |
| `WPO\|Scale - Landscape Mask Offset X/Y` | 未指定 | UV坐标偏移 | -1000-1000 |
| `WPO\|Scale - Landscape Mask Size` | 未指定 | 遮罩覆盖的世界尺寸 | 1000-10000 |
| `WPO\|Scale - Landscape Mask Falloff` | 未指定 | 遮罩曲线衰减指数 | 0.5-3.0 |
| `WPO\|Scale - Landscape Mask Multiplier` | 未指定 | 缩放强度乘数 | 0.0-2.0 |
| `WPO\|Scale - Landscape Mask Bias` | 未指定 | 基础偏移（保证最小值） | 0.0-1.0 |

### 2.4 遮罩应用效果

```
遮罩值对草地的影响：

GrassLayerWeight = 1.0（纯草地）：
├─ 草地密度：最高
├─ 草叶高度：100%
├─ 透明度：完全不透明
└─ 分布：均匀密集

GrassLayerWeight = 0.5（过渡区域）：
├─ 草地密度：中等
├─ 草叶高度：50%
├─ 透明度：半透明
└─ 分布：稀疏

GrassLayerWeight = 0.0（无草地）：
├─ 草地密度：无（不生成实例）
├─ 草叶高度：0%（理论上不渲染）
├─ 透明度：完全透明
└─ 分布：无

实际应用场景：
├─ 地形边缘过渡：从草地到裸土的自然过渡
├─ 植被边界：森林、道路、河流边界的稀疏化
├─ 海拔变化：高海拔地区草地稀疏
└─ 湿度区域：干燥区域草地减少
```

---

## 3. Foliage植被配置深度分析

### 3.1 LGT_Grass 草地类型配置

```
Foliage Type配置参数：

网格设置：
├─ Mesh:
│  ├─ SM_Grass_A_01 (310KB) - 主变体，最详细
│  ├─ SM_Grass_B_01 (57KB) - 轻量级
│  ├─ SM_Grass_C_01 (76KB) - 中等
│  ├─ SM_Grass_D_01 (73KB) - 中等
│  └─ SM_Grass_E_01 (113KB) - 较详细
├─ 使用所有网格（随机选择）
└─ 每个网格独立的随机缩放

密度设置：
├─ Density: 通常设置为高值（如5000+）
├─ 覆盖半径：较大（如100-200单位）
└─ 最小间距：小（如10-20单位）

分布设置：
├─ 对齐到表面：启用（AlignToSurface = true）
├─ 法线对齐：启用（草叶沿地形法线生长）
└─ 随机旋转：启用（打破重复感）

缩放设置：
├─ Scale X/Y: 随机范围（如0.8-1.2）
├─ Scale Z: 随机范围（如0.9-1.1）
└─ 缩放一致性：每个实例独立
```

### 3.2 LGT_Pebbles 鹅卵石配置

```
鹅卵石植被参数：

网格：
├─ Mesh: SM_Ground_Pebbles_01
├─ 材质：M_Pebbles
└─ 类型：岩石/地面装饰

密度与分布：
├─ Density: 低到中（如100-500）
├─ 与草地混合：分布在不同层级
└─ 覆盖：小范围（如50-100单位）

放置策略：
├─ 放置在低草地权重区域
├─ 避免完全裸土（保留视觉多样性）
└─ 随机大小变化
```

### 3.3 实例化参数详解

| 参数 | 草地配置 | 鹅卵石配置 | 影响 |
|------|-----------|-------------|------|
| Align To Surface | 启用 | 禁用/启用 | 草叶是否沿地形法线生长 |
| Random Rotation | 启用 | 启用 | 打破视觉重复 |
| Scale X/Y/Z | 0.8-1.2 | 0.9-1.1 | 草叶大小变化 |
| Density | 高（5000+） | 低（100-500） | 覆盖密度 |
| Radius | 100-200 | 50-100 | 覆盖范围 |
| Minimum Spacing | 10-20 | 30-50 | 最小实例间距 |

### 3.4 性能优化参数

```
Foliage性能优化策略：

距离剔除：
├─ Cull Distance: 设置合理值（如15000）
├─ Start Cull Distance: 早开始淡出
└─ LOD Transition: 平滑过渡

实例优化：
├─ Use Instance Mesh: 启用
├─ Merge Components: 合并相似组件
└─ 静态实例化：不移动的植被

批处理：
├─ 相同材质的实例合并
├─ 减少Draw Call
└─ GPU实例化渲染
```

---

## 4. 草地网格变体对比分析

### 4.1 五种草地网格详细对比

| 网格名称 | 文件大小 | 几何复杂度 | 设计特点 | 推荐场景 |
|----------|----------|------------|----------|----------|
| `SM_Grass_A_01` | 310KB | 高（最详细） | 主变体，最多顶点 | 近景焦点、特写 |
| `SM_Grass_B_01` | 57KB | 低（轻量级） | 简化几何，性能优先 | 大面积铺盖、性能敏感场景 |
| `SM_Grass_C_01` | 76KB | 中等 | 平衡细节与性能 | 中景区域 |
| `SM_Grass_D_01` | 73KB | 中等 | 中等复杂度 | 中景区域 |
| `SM_Grass_E_01` | 113KB | 较高 | 较详细变体 | 近景辅助变体 |

### 4.2 网格设计差异分析

```
几何结构对比：

SM_Grass_A_01（主变体）：
├─ 顶点数：最多（可能50-100+）
├─ 三角形：20-40个
├─ UV通道：多套（可能2-3套）
│  ├─ UV0: 基础纹理
│  ├─ UV1: Pivot数据（XY）
│  └─ UV2: Random/Height数据（XY）
├─ 顶点颜色：可能包含
└─ LOD: 多级LOD支持

SM_Grass_B_01（轻量级）：
├─ 顶点数：最少（可能20-40）
├─ 三角形：10-20个
├─ UV通道：简化（可能1-2套）
├─ 顶点颜色：可能禁用
└─ LOD: 简化LOD

SM_Grass_C/D/E（中等）：
├─ 顶点数：中等（30-70）
├─ 三角形：15-30个
├─ UV通道：标准（2套）
└─ LOD: 标准LOD
```

### 4.3 性能与视觉平衡

| 使用场景 | 推荐网格 | 理由 |
|----------|----------|------|
| **近景特写** | SM_Grass_A_01 | 最高细节，满足近距离观察 |
| **性能敏感场景** | SM_Grass_B_01 | 最小开销，适合高密度 |
| **平衡场景** | SM_Grass_C/D/E_01 | 在性能和细节间平衡 |
| **远景填充** | SM_FarGrass | 极简几何，远距离优化 |

### 4.4 Foliage混合策略

```
Foliage类型混合配置：

场景：自然草地+裸土+碎石

近景（0-5000单位）：
├─ SM_Grass_A_01: 40%密度
├─ SM_Grass_B_01: 30%密度
├─ SM_Grass_C/D/E: 20%密度
├─ SM_Ground_Pebbles: 10%密度
└─ 合计：高密度，高细节

中景（5000-10000单位）：
├─ SM_Grass_B_01: 50%密度
├─ SM_Grass_C/D/E: 30%密度
├─ SM_Grass_A_01: 15%密度（减少）
├─ SM_Ground_Pebbles: 5%密度
└─ 合计：中密度，优化性能

远景（10000-15000单位）：
├─ SM_FarGrass: 100%密度
└─ 合计：极简几何，覆盖填充
```

---

## 5. 项目级渲染配置对草地的影响

### 5.1 DefaultEngine.ini 关键配置解析

```ini
[/Script/Engine.RendererSettings]
r.GenerateMeshDistanceFields=True      // 启用距离场（对草地阴影重要）
r.AntiAliasingMethod=2                 // TAA抗锯齿（与WPO协同工作）
r.ReflectionMethod=2                      // 反射方法（影响草地反射）
r.DynamicGlobalIlluminationMethod=0       // 禁用Lumen（性能优化）
r.EarlyZPass=2                          // 深度预通道（优化遮挡剔除）
r.AllowStaticLighting=True                // 允许静态光照
r.DefaultFeature.AmbientOcclusionStaticFraction=True  // 启用静态AO
```

### 5.2 距离场对草地的影响

```
Mesh Distance Fields (MDF) 工作原理：

启用状态：r.GenerateMeshDistanceFields=True

对草地的影响：
├─ 阴影质量：
│  ├─ 近景：高质量软阴影
│  ├─ 中景：中等阴影
│  └─ 远景：可能禁用或简化
├─ 性能开销：
│  ├─ 计算距离场：中高开销
│  ├─ 存储成本：需要额外纹理
│  └─ 采样开销：每个像素读取距离
└─ 交互影响：
    ├─ 草地与地形的阴影交互
    ├─ 草地间的自阴影
    └─ 植被与物体的交互

优化建议：
├─ 仅近景启用距离场
├─ 远景使用简化阴影或预烘焙
└─ 调整距离场分辨率（平衡质量与性能）
```

### 5.3 TAA与WPO的协同

```
TAA (Temporal Anti-Aliasing) 与 WPO 协同：

问题：WPO导致的运动模糊错误
├─ 草叶位置由着色器动态计算
├─ 引擎默认速度向量计算失效
├─ TAA无法正确混合历史帧
└─ 结果：鬼影（Ghosting）

解决方案：
├─ 显式速度计算（已在材质中实现）
│  ├─ RENDERING_PREVIOUS_FRAME_TRANSFORM 宏
│  ├─ 存储上一帧风数据（WindRT的BA通道）
│  └─ 计算正确的运动向量
└─ 配置：
    ├─ r.AntiAliasingMethod=2 (TAA)
    ├─ 确保Velocity Buffer正确
    └─ 调整TAA参数（Sharpness/Clamp）

性能影响：
├─ 额外采样开销：读取BA通道
├─ 计算开销：双重位置计算
└─ 质量提升：显著的鬼影消除
```

### 5.4 EarlyZPass优化

```
Early Z Pass 深度预通道：

启用状态：r.EarlyZPass=2

对草地的优化：
├─ 提前Z通道：
│  ├─ 先渲染深度，后渲染颜色
│  └─ 避免渲染被遮挡的像素
├─ 遮挡剔除：
│  ├─ 草地密集时，大量草叶互相遮挡
│  ├─ EarlyZ跳过不可见像素的着色
│  └─ 大幅减少着色器调用
└─ 性能提升：
    ├─ 着色器调用减少：30-60%
    ├─ 内存带宽降低：减少纹理采样
    └─ GPU利用率优化

注意事项：
├─ WPO与EarlyZ冲突：
│  ├─ WPO改变顶点深度
│  ├─ EarlyZ基于原始深度
│  └─ 可能导致渲染错误
└─ 解决方案：
    ├─ 谨整Z Pass配置
    ├─ 使用保守深度估计
    └─ 在必要时禁用EarlyZ（但牺牲性能）
```

### 5.5 其他渲染配置

| 配置项 | 值 | 对草地的影响 | 调整建议 |
|--------|-----|------------|----------|
| `r.DynamicGlobalIlluminationMethod` | 0 | 禁用Lumen，草地仅用静态光 | 远景可禁用Lumen |
| `r.ReflectionMethod` | 2 | 草地反射质量 | 可降低远景反射质量 |
| `r.DefaultFeature.AmbientOcclusionStaticFraction` | True | 草地AO | 可降低远景AO精度 |

---

## 6. 草地纹理通道编码完整说明

### 6.1 T_Grass_Color (Albedo + Roughness)

```
T_Grass_Color 编码方案：

RGBA通道分配：
├─ R通道：颜色红色分量
├─ G通道：颜色绿色分量
├─ B通道：颜色蓝色分量
└─ A通道：粗糙度（Roughness）

采样与应用：
float4 colorSample = Tex2D(T_Grass_Color, UV);

float3 baseColor = colorSample.rgb;
float roughness = colorSample.a;

优势：
├─ 单张纹理存储颜色+粗糙度
├─ 减少纹理采样次数
├─ 优化内存带宽
└─ 适合草地的高频采样
```

### 6.2 T_Grass_DST (Detail/Specular/Transmission/AO)

```
T_Grass_DST 四通道编码：

通道分配：
├─ R通道：Detail（细节强度）
│  └─ 范围：[0,1]
├─ G通道：Specular（高光强度）
│  └─ 范围：[0,1]
├─ B通道：Transmission（透射）
│  └─ 范围：[0,1]
└─ A通道：Ambient Occlusion（环境遮蔽）
    └─ 范围：[0,1]

应用逻辑：
float4 dstSample = Tex2D(T_Grass_DST, UV);

float detail = dstSample.r;
float specular = dstSample.g;
float transmission = dstSample.b;
float ao = dstSample.a;

// Detail用于增强细节纹理
float3 enhancedColor = lerp(baseColor, detailColor, detail);

// Specular用于高光强度
float finalSpecular = specular * SpecularMultiplier;

// Transmission用于次表面散射
float3 sssColor = baseColor * transmission * SSSColor;

// AO用于环境遮蔽
baseColor *= ao;
```

### 6.3 T_Grass_ParametersMap (Clump/Scale/Bend)

```
T_Grass_ParametersMap 编码：

RGBA通道分配：
├─ R通道：Clump Direction X
│  └─ 范围：[-1,1]（编码为[0,1]后解码）
├─ G通道：Clump Direction Y
│  └─ 范围：[-1,1]
├─ B通道：Scale Variation（缩放变化）
│  └─ 范围：[0,1]
└─ A通道：Bend Variation（弯曲变化）
    └─ 范围：[0,1]

解码与应用：
float4 paramSample = Tex2D(T_Grass_ParametersMap, UV);

// 解码Clump方向
float2 clumpDir = (paramSample.rg - 0.5) * 2.0;

// 解码缩放变化
float scaleVar = paramSample.b;

// 解码弯曲变化
float bendVar = paramSample.a;

// 应用
ApplyClumpOffset(clumpDir);
ApplyScaleVariation(scaleVar);
ApplyBendVariation(bendVar);
```

### 6.4 RT_2DWindSystem_RGBA (当前风 + 上一帧风)

```
RT_2DWindSystem_RGBA 编码：

RGBA通道分配：
├─ R通道：当前帧风方向 X
│  └─ 范围：[-1,1]（编码为[0,1]）
├─ G通道：当前帧风方向 Y
│  └─ 范围：[-1,1]
├─ B通道：上一帧风方向 X
│  └─ 范围：[-1,1]
└─ A通道：上一帧风方向 Y
    └─ 范围：[-1,1]

采样与选择：
float4 windSample = Tex2D(RT_2DWindSystem_RGBA, UV);

#if RENDERING_PREVIOUS_FRAME_TRANSFORM
    // 计算上一帧位置时，读取上一帧风
    float2 windDir = (windSample.ba - 0.5) * 2.0;
#else
    // 渲染当前帧时，读取当前风
    float2 windDir = (windSample.rg - 0.5) * 2.0;
#endif

应用风力：
ApplyWindForce(windDir);
```

### 6.5 纹理压缩与格式

| 纹理名称 | 推荐格式 | 压缩 | Mipmap | 流式传输 |
|----------|----------|--------|--------|----------|
| T_Grass_Color | BC7（高质量RGBA） | 启用 | 启用 | 启用 |
| T_Grass_DST | BC5（RG通道） | 启用 | 启用 | 启用 |
| T_Grass_Normals | BC5（法线压缩） | 启用 | 启用 | 启用 |
| T_Grass_Opacity | BC4（单通道） | 启用 | 启用 | 启用 |
| T_Grass_ParametersMap | BC7（高质量RGBA） | 启用 | 启用 | 启用 |
| T_Grass_LandscapeMask | BC4（单通道） | 启用 | 启用 | 启用 |
| RT_2DWindSystem_RGBA | RGBA8（无压缩） | 禁用 | 禁用 | 禁用 |

---

## 7. 插件元数据与版本信息

### 7.1 GhisRealisticGrass01 插件信息

```json
{
    "FileVersion": 3,
    "Version": "1.0",
    "VersionName": "1.0",
    "FriendlyName": "GhisRealisticGrass01",
    "Description": "Experimental realistic grass shader",
    "Category": "Other",
    "CreatedBy": "Ghislain GIRARDOT",
    "CanContainContent": true,
    "IsBetaVersion": false,
    "IsExperimentalVersion": false
}
```

**核心特性**：
- 实验性着色器系统
- 完整的WPO实现
- 多LOD支持
- 高度可配置参数

### 7.2 GhisNiagara2DWind 插件信息

```json
{
    "FileVersion": 3,
    "Version": "1.0",
    "VersionName": "1.0",
    "FriendlyName": "GhisNiagara2DWind",
    "Description": "Experimental system that generates an interactive 2D tileable animated wind texture",
    "Category": "Other",
    "CreatedBy": "Ghislain GIRARDOT",
    "CanContainContent": true,
    "IsBetaVersion": false,
    "IsExperimentalVersion": false
}
```

**核心特性**：
- 2D平铺风场纹理生成
- Niagara粒子驱动
- 交互式风场
- 实时动态风效

### 7.3 许可证与使用条款

```
GhisRealisticGrass 许可证要点：

允许用途：
✓ 个人使用
✓ 教育使用
✓ 商业使用（年收入≤$500,000）

限制条件：
✗ 不得重新分发或销售源代码
✗ 年收入超过$500,000需额外授权
✗ 必须在游戏中署名作者

署名要求：
- 游戏或应用中必须可见署名
- 署名内容：'Ghislain GIRARDOT'
- 署名角色：
  - 'Independent Contractor'
  - 'Additional Artist'
  - 'Additional Technical Artist'
  - 'Additional Environment Artist'
  - 'Additional Developer'

保留要求：
- 不得移除UE资产中的作者注释
- 不得在广告中未经授权使用作者姓名
```

---

## 8. 补充总结

### 8.1 远景草地系统

FarGrass模块是性能优化的关键组成部分：
- **极简几何**：最小化顶点数，适合远距离
- **简化材质**：禁用复杂WPO，减少计算开销
- **LOD集成**：作为LOD2/LOD3，实现平滑过渡
- **性能友好**：单次纹理采样，无物理模拟

### 8.2 地形遮罩集成

地形遮罩系统提供了灵活的草地分布控制：
- **自然过渡**：从草地到裸土的平滑过渡
- **密度控制**：基于地形图层的动态密度
- **视觉多样性**：打破重复感，增加自然感
- **性能优化**：遮罩采样成本低，适合大面积应用

### 8.3 Foliage配置策略

合理的Foliage配置平衡了视觉质量与性能：
- **多网格混合**：5种草地变体增加视觉多样性
- **密度分层**：近景高密，远景稀疏
- **实例化优化**：GPU实例化渲染，减少Draw Call
- **LOD协同**：与材质LOD系统协同工作

### 8.4 渲染配置影响

项目级渲染配置对草地性能有显著影响：
- **距离场**：提升阴影质量但增加开销
- **TAA集成**：解决WPO鬼影问题
- **EarlyZPass**：大幅减少着色器调用
- **全局光照**：Lumen与静态光照的选择

### 8.5 纹理编码优化

高效的纹理编码方案最大化了内存带宽利用率：
- **多通道复用**：单张纹理存储多种属性
- **合理压缩**：平衡质量与性能
- **流式传输**：远距离自动降级
- **Mipmap支持**：减少远距离采样开销

---

*本章节由项目结构分析生成*
*补充来源: UE 5.3 项目实际资产*
*分析日期: 2026-01-09*
