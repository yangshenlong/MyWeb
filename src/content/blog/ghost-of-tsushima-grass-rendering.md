---
title: "对马岛之魂草地渲染复刻：从UE到Niagara的完整实现"
description: "深入解析如何在Unreal Engine中复刻《对马岛之魂》的震撼草地开场场景。涵盖Blender资产制作、GameTools烘焙、UE材质WPO处理、Niagara风场系统等完整技术栈。"
pubDate: "2025-01-25"
tags: ["Unreal Engine", "Niagara", "Shader", "植被渲染", "对马岛之魂", "GameTools", "WPO"]
category: "技术美术"
author: "xgg000303"
pinned: true
pinnedOrder: 1
heroImage: "/images/grass/Camera.0237.png"
---

## 引言

这是一篇鸽了很久的文章。最近开始尝试在UE中去复刻《对马岛之魂》开幕的那个震撼场景。

![参考图](/images/grass/Camera.0237.png)

### 个人简介

在正式开始之前，先简单介绍一下自己。我正在努力申请技术美术岗位的实习，如果有大佬愿意捞一下就太好了！

- **邮箱**：xgg000303@163.com
- **个人网站**：https://guaguaworld.vercel.app/
- **B站复刻视频**：[观看演示](https://t.bilibili.com/1161455501564706839)

## 技术综述

渲染草地的方式非常多。在GDC和业界分享中，有两个经典的演讲：

- **[《战神中的互动式风和植被》](https://www.youtube.com/watch?v=MKX45_riWQA)** - Santa Monica Studio
- **[《对马岛之魂中的程序生成草地》](https://www.youtube.com/watch?v=Ibe1JBF5i5Y)** - Sucker Punch

国内也有许多优秀的实践文章：

- **[《利用GPU实现无尽草地的实时渲染》](https://zhuanlan.zhihu.com/p/29632347)**
- **[《UE中实现对马岛之魂的程序化草地渲染》](https://zhuanlan.zhihu.com/p/647997882)**

作为一个还在学习阶段的小白，我将根据自己的经验，分享一下复刻过程中的技术细节。

## 技术栈

| 工具              | 用途                                 |
| ----------------- | ------------------------------------ |
| **Unreal Engine** | Material、Landscape、Niagara粒子系统 |
| **Blender**       | 建模、GameTools数据烘焙、着色器      |

## DCC阶段：资产制作

在DCC阶段，我们需要完成以下工作：

1. **制作草叶模型**并通过AOVs打包albedo、normal、roughness、metallic等信息
2. **使用GameTools将草叶的PivotPoint的xy烘焙到UV2通道**
3. **将随机值与归一化高度值烘焙到UV3通道**
4. **膨胀纹理岛屿**，避免远处草叶产生黑边

### 烘焙PivotPoint的Position到UV中

![烘焙位置信息](/images/grass/position.png)

#### 为什么可以用UV存储位置数据？

在Blender中，UV默认是float32的全精度类型，这让我们可以利用两个float32来存储很大的数字，而不仅仅是作为[0-1]的UV映射。

核心逻辑是将每个草叶的Pivot Point手动移动到特定位置，记录其xy值，然后赋值到UV2中。

#### GameTools烘焙核心代码

GameTools是Blender社区的一个强大脚本，其烘焙逻辑核心如下：

```python
# 1) 获取物体的世界坐标位置
eval_obj_source_mat = eval_obj_source.matrix_world
eval_obj_source_loc = eval_obj_source_mat.to_translation()

# 2) 应用单位缩放和轴向反转
signed_axis = mathutils.Vector((
    -1.0 if settings.unit_invert_x else 1.0,
    -1.0 if settings.unit_invert_y else 1.0,
    -1.0 if settings.unit_invert_z else 1.0
))
signed_scale = signed_axis * settings.unit_scale  # 默认 100.0
vector_to_bake = eval_obj_source_loc * signed_scale

# 3) 根据分量通道提取对应的值
if data_layer.component == "X":
    data_to_bake = vector_to_bake.x
elif data_layer.component == "Y":
    data_to_bake = vector_to_bake.y
elif data_layer.component == "Z":
    data_to_bake = vector_to_bake.z

# 4) 创建顶点属性并写入数据
if data_layer.ID not in eval_mesh.attributes:
    eval_mesh.attributes.new(name=data_layer.ID, type='FLOAT', domain='CORNER')

attr = eval_mesh.attributes[data_layer.ID]
data_loop_ids = [data_to_bake] * len(eval_mesh.loops)
attr.data.foreach_set('value', data_loop_ids)
```

**GameTools面板配置：**

- **Channel Mode**: `POSITION`
- **Reference Mode**: `REL_WORLD`
- **Component**: 选择 X/Y
- **UV Channel**: UV2

### UV3通道：随机值 + 归一化高度

![随机值烘焙示意](/images/grass/random.png)

| 通道  | 存储内容         | 用途                         |
| ----- | ---------------- | ---------------------------- |
| **U** | 随机值 (0-1)     | 草叶的随机旋转/变形偏移      |
| **V** | 归一化高度 (0-1) | 草根=0，草尖=1，用于渐变着色 |

**GameTools面板配置：**

- **U通道**：Data=`RANDOM`，Rand Mode=`OBJECT`
- **V通道**：Data=`MASK`，Type=`LINEAR`，Axis=`Z`，Normalize=✅

### 纹理膨胀（Mip Flooding）

![Mip Flooding示例](/images/grass/mip_flood_example.gif)

在GDC 2019的演讲中，Sucker Punch分享了一种优化贴图磁盘占用的技术——**Mip Flooding**，可将贴图文件大小减少约30%。

#### 核心原理

1. 生成完整的Mipmap链
2. 将所有Mip级别堆叠回原分辨率
3. 利用PNG压缩对大块纯色区域的高效压缩

#### 效果对比

| 纹理类型         | 原始大小 | 优化后大小 | 减少比例 |
| ---------------- | -------- | ---------- | -------- |
| Fern 2K Albedo   | 2.31 MB  | 1.08 MB    | **53%**  |
| Fern Long Height | 4.79 MB  | 2.18 MB    | **54%**  |

同时，如果albedo等贴图存在alpha，UE采样时会取周围4个像素插值，在高mipmap情况下会出现黑边问题。膨胀纹理岛屿可以解决这个问题。

## UE材质阶段：WPO处理

这是最复杂也最有趣的部分——在材质中重建草叶在局部空间的位置和旋转，然后通过World Position Offset实现动态效果。

### WPO整体流程

![WPO流程图](/images/grass/mermaid-diagram.png)

### 一、数据准备阶段

#### 1.1 实例在世界空间中的位置

```hlsl
float3 LocalOrigin = float3(0.0, 0.0, 0.0);
float3 ClumpPosition = mul(float4(LocalOrigin, 1.0), Parameters.Primitive.LocalToWorld).xyz;
```

#### 1.2 Pivot点的坐标

```hlsl
// 从 UV2 读取烘焙的 Pivot 数据
float2 BakedPivotData = TexCoord[1].xy;

// 重建局部空间中的 Pivot 点
float3 CardPivotLocalPosition = float3(BakedPivotData.x, BakedPivotData.y, 0.0);

// 转换到世界空间
float3 CardPivotWorldPosition = TransformLocalToAbsoluteWorld(CardPivotLocalPosition);
```

#### 1.3 随机值和归一化高度

```hlsl
float2 VertexDataUV = TexCoord[2].xy;

float GrassRandom = VertexDataUV.x;  // U: 随机值
float GrassHeight = VertexDataUV.y;  // V: 归一化高度 (0.0=根部, 1.0=顶部)
```

### 二、参数采样阶段

#### 2.1 从参数纹理获取草地参数

```hlsl
float3 OffsetPosition = PivotLS * RandomnessStrength;
float3 SampleWorldPos = PivotWS + OffsetPosition;
float2 SampleUV = SampleWorldPos.xy / ParameterMapSize;
float4 ParameterData = ParameterMap.SampleLevel(MapSampler, SampleUV, 0);
```

| 通道  | 存储内容     | 用途                     |
| ----- | ------------ | ------------------------ |
| **R** | Clump方向X   | 控制草丛的倒伏方向       |
| **G** | Clump方向Y   | 控制草丛的倒伏方向       |
| **B** | 缩放变化系数 | 让草的高度有随机变化     |
| **A** | 弯曲变化系数 | 让草的弯曲程度有随机变化 |

#### 2.2 从风场RT获取风力数据

这是系统中最复杂的部分之一——需要同时获取当前帧和上一帧的风力数据，以解决**动态模糊和TAA鬼影**问题。

```hlsl
float2 WindUV = SamplePos / WindMapScale;
float4 WindData = WindRT.SampleLevel(WindSampler, WindUV, 0);

// 帧选择逻辑
#if RENDERING_PREVIOUS_FRAME_TRANSFORM
    SelectedWindXY = float2(WindData.b, WindData.a);  // 上一帧
#else
    SelectedWindXY = float2(WindData.r, WindData.g);  // 当前帧
#endif
```

**为什么需要两帧数据？**

对于WPO变形的草，引擎的默认矩阵认为草根本没动。我们需要显式地告诉引擎草在上一帧真正的样子，以正确计算速度。

### 三、风力调制

#### 3.1 风力方向调制

草叶是扁平的，风从正面吹来时受力最大，从侧面吹来时几乎不受影响：

```hlsl
float3 NormalizedWind = normalize(RawWindXYZ);
float FacingAlignment = abs(dot(NormalizedWind, CardBaseForwardVector));
float3 AlignedWind = RawWindXYZ * FacingAlignment;
ModulatedWindVector = lerp(RawWindXYZ, AlignedWind, NormalModulation);
```

#### 3.2 高度与刚性遮罩

实现"根部硬、梢部软"的效果：

```hlsl
float Mask = GrassHeight - RigidityOffset;
Mask = saturate(Mask);
Mask = pow(Mask, RigidityFalloff);
float3 WindModulatedVector = ScaledWind * Mask;
```

### 四、方向定向系统

![草团簇示意图](/images/grass/Clump.png)

```hlsl
// 添加Clump倒伏方向
float2 ScaledDir = ClumpDirection.rg * InheritFromClump;
float3 ClumpOrientationVec = float3(ScaledDir.x, ScaledDir.y, 0.0);
float OrientationMask = pow(GrassHeight, RigidityFalloff);
float3 FinalClumpOffset = ClumpOrientationVec * OrientationMask;

// 地形对齐
float3 InstanceUpDir = normalize(mul(float3(0, 0, 1), (float3x3)Parameters.Primitive.LocalToWorld));
float3 WorldUp = float3(0, 0, 1);
float3 BaseUpVector = lerp(WorldUp, InstanceUpDir, OrientToLandscape);
float3 TiltedUpVector = BaseUpVector + ClumpOrientedVector;
float3 CardBaseUpVector = normalize(TiltedUpVector);
```

### 五、面向相机系统

![面向相机处理示意](/images/grass/facing.png)

```hlsl
// 获取视图向量
float3 WorldCameraDir = mul(float3(0.0, 0.0, 1.0), (float3x3)Parameters.ViewToWorld);
float3 ProjectedDir = WorldCameraDir * float3(1.0, 1.0, 0.0);

// 应用受限面向相机矩阵（仅在XY平面旋转）
float3 LocalViewDir;
LocalViewDir.x = dot(ViewVector2D, CardBaseForwardVector);
LocalViewDir.y = dot(ViewVector2D, CardBaseRightVector);
LocalViewDir.z = 0.0;
```

### 六、弯曲系统

![弯曲处理示意](/images/grass/bend.png)

使用圆弧参数方程来弯曲草叶：

```hlsl
const float BendAmountScaled = BendAmount * 0.01;
const float Offset = max(0.0, BendOffsetHeight);

if (abs(BendAmountScaled) > 0.00001)
{
    const float InverseBendAmount = 1.0 / BendAmountScaled;
    const float WPOTheta = max(0.0, CameraFacingOffset.z - Offset) * BendAmountScaled;
    const float WPOBendOffset = CameraFacingOffset.x - InverseBendAmount;

    // 计算弯曲后的法线
    outWSNormal.x = sin(WPOTheta);
    outWSNormal.z = cos(WPOTheta);

    // 计算弯曲后的位置
    outWPO.z = min(CameraFacingOffset.z - Offset, -WPOBendOffset * outWSNormal.x) + Offset;
    outWPO.x = (WPOBendOffset * outWSNormal.z) + InverseBendAmount;
}
```

### 七、最终变换

```hlsl
// 旋转到自定义基底
float3 RotatedPosition = (InLocalPosition.x * CardForwardVector) +
                         (InLocalPosition.y * CardRightVector) +
                         (InLocalPosition.z * CardUpVector);

// 多重缩放
float3 FinalLocalPosition = RotatedPosition * ResultScale * FinalScaleMultiplier;

// 转换到世界空间
float3 FinalWorldPosition = SelectedPivotWS + FinalLocalPosition;

// WPO输出
float3 WPOOffset = FinalWorldPosition - AbsoluteWorldPosition;
return WPOOffset;
```

## Niagara风场系统

为什么不使用简单的Panner Texture？如果纹理发生旋转，远处草地采样到的纹理会出现跳变，导致草地疯狂抖动。

Sucker Punch使用类似Niagara的"风精灵"方案，比较简单且易于实现。

### 核心HLSL实现

```hlsl
// 初始化
float2 AccumulatedWind = float2(0.0, 0.0);
const float HalfTileWidth = inTileWidth * 0.5;
float2 Offsets[] = {
    float2(-HalfTileWidth, -HalfTileWidth),
    float2(-HalfTileWidth, HalfTileWidth),
    float2(HalfTileWidth, -HalfTileWidth),
    float2(HalfTileWidth, HalfTileWidth)
};

// 获取网格单元索引
int CellX, CellY, NumCellX, NumCellY = 0;
inWindGrid2D.ExecutionIndexToGridIndex(CellX, CellY);
inWindGrid2D.GetNumCells(NumCellX, NumCellY);

const float2 CellUV = float2((float)CellX / (float)NumCellX, (float)CellY / (float)NumCellY);
const float2 CellPosition = (CellUV * inTileWidth);

// 遍历所有粒子
for (int ParticleIndex = 0; ParticleIndex < inParticles; ParticleIndex++)
{
    const int ParticleOffsetIndex = ParticleIndex * inDataSetPerParticle;

    // 获取粒子参数
    float4 ParticleParams1, ParticleParams2, ParticleParams3;
    inWindParticles.Get(ParticleOffsetIndex, ParticleParams1);
    inWindParticles.Get(ParticleOffsetIndex + 1, ParticleParams2);
    inWindParticles.Get(ParticleOffsetIndex + 2, ParticleParams3);

    if (ParticleParams2.w < 0.0001) { continue; }

    const float2 DeltaPos = ParticleParams1.xy - CellPosition;
    if (ParticleParams3.x == 0) { continue; }

    const float2 Wind = ParticleParams1.zw * ParticleParams2.x;
    if (dot(Wind, Wind) < 0.1) { return; }

    // 四次渲染实现平铺
    for (int i = 0; i < 4; i++)
    {
        const float2 DeltaOffsetPos = DeltaPos + Offsets[i];

        const float ParticleForwardGradient = 1.0 - saturate(abs(dot(ParticleForwardAxis, DeltaOffsetPos)) * InvParticleRadius);
        const float ParticleRightGradient = 1.0 - saturate(abs(dot(ParticleRightAxis, DeltaOffsetPos)) * InvParticleRadius);

        float ParticleMask = pow(ParticleForwardGradient, 2) * ParticleRightGradient * ParticleParams2.w;
        if (ParticleMask < 0.0001) { continue; }

        // 样条平滑
        ParticleMask = ParticleMask < 0.5 ? 4.0 * ParticleMask * ParticleMask * ParticleMask : 1.0 - pow(-2.0 * ParticleMask + 2.0, 3.0) / 2.0;

        AccumulatedWind += Wind * ParticleMask * inGust;
    }
}

// 添加湍流
float4 TurbulenceSample = float4(0.0, 0.0, 0.0, 0.0);
inTextureSample.SampleTexture2D(inTurbulenceOffset + CellUV, 0, TurbulenceSample);
AccumulatedWind += (TurbulenceSample.xy - 0.5) * inTurbulenceAmount;

// 添加全局推力
AccumulatedWind += (inWindDirection * inWindForce) * inPush * 0.01;

outWind = AccumulatedWind;
```

### 风场系统核心逻辑解析

#### 1. 空间划分与网格化

风场系统采用2D网格将地形划分为多个小单元：

- **并行计算**：每个网格单元独立处理
- **局部性**：风力影响限制在局部区域

#### 2. 盒式遮罩与距离场

```hlsl
const float ParticleForwardGradient = 1.0 - saturate(abs(dot(ParticleForwardAxis, DeltaOffsetPos)) * InvParticleRadius);
const float ParticleRightGradient = 1.0 - saturate(abs(dot(ParticleRightAxis, DeltaOffsetPos)) * InvParticleRadius);
```

构建椭圆形影响区域，粒子位于中心时影响最大。

#### 3. 平铺策略（4次渲染）

```hlsl
float2 Offsets[] = {
    float2(-HalfTileWidth, -HalfTileWidth),  // 左下
    float2(-HalfTileWidth, HalfTileWidth),   // 左上
    float2(HalfTileWidth, -HalfTileWidth),   // 右下
    float2(HalfTileWidth, HalfTileWidth)     // 右上
};
```

**关键设计**：Render Target放置在4个渲染结果的交点位置，确保采样始终连续。

## 未来探索方向

### Nanite植被

目前还是实验阶段：

- [Nanite Foliage官方文档](https://dev.epicgames.com/documentation/en-us/unreal-engine/nanite-foliage)
- [Unreal 5植被笔记](https://medium.com/@shinsoj/notes-on-foliage-in-unreal-5-3522b6eb159f)

### PCG植被

PCG（程序化内容生成）或许是不得不拓展的部分，准备后续研究PCG植被演示案例。

## 总结

复刻《对马岛之魂》草地渲染的过程涉及：

1. **Blender资产制作**：建模、GameTools数据烘焙
2. **UE材质系统**：WPO处理、面向相机、弯曲系统
3. **Niagara粒子**：四方连续风场Render Target
4. **优化技术**：Mip Flooding、距离剔除

这个项目让我深入理解了游戏植被渲染的核心技术，也体会到了Sucker Punch和Santa Monica Studio在技术实现上的精妙设计。

## 参考资料

- [GDC 2019: Interactive Wind and Vegetation in God of War](https://www.youtube.com/watch?v=MKX45_riWQA)
- [GDC 2019: Procedural Grass in Ghost of Tsushima](https://www.youtube.com/watch?v=Ibe1JBF5i5Y)
- [GameTools - Blender插件](https://github.com/GhislainGir/GameTools)
- [Landscape Quick Start Guide in Unreal Engine](https://dev.epicgames.com/documentation/en-us/unreal-engine/landscape-quick-start-guide-in-unreal-engine)
