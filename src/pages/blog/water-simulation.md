---
title: '基于 Gerstner 波的实时水面渲染'
description: '详解如何实现基于 Gerstner 波理论的真实感水面渲染系统，包含波浪模拟、反射折射和泡沫效果。'
date: 2024-01-10
category: '渲染技术'
tags: ['Water Rendering', 'Gerstner Wave', 'Unity', 'URP']
---

# 基于 Gerstner 波的实时水面渲染

水面渲染是游戏开发中常见的需求，Gerstner 波提供了一种高效且效果逼真的波浪模拟方法。

## Gerstner 波理论

Gerstner 波是一种描述水波运动的数学模型，它能够模拟出真实海洋中波浪的尖峰和圆润波谷。

### 数学基础

Gerstner 波的位移公式：

```
x = x₀ + Σ(QᵢAᵢ * cos(ωᵢ * t - kᵢ * x₀))
z = z₀ + Σ(Aᵢ * sin(ωᵢ * t - kᵢ * x₀))
```

其中：
- A: 波幅
- ω: 角频率
- k: 波数
- Q: 倾斜因子
- t: 时间

## Shader 实现

### 顶点位移

```hlsl
// Gerstner 波参数
struct GerstnerWave {
    float wavelength;  // 波长
    float amplitude;   // 振幅
    float2 direction;  // 方向
    float speed;       // 速度
};

// 计算单个波的位移
float3 CalculateGerstnerWave(float3 position, GerstnerWave wave, float time) {
    float k = 2 * PI / wave.wavelength;
    float c = sqrt(9.8 / k);  // 相速度
    float f = k * (dot(wave.direction, position.xz) - c * wave.speed * time);

    // 水平位移
    float xOffset = wave.direction.x * wave.amplitude * cos(f);
    float zOffset = wave.direction.y * wave.amplitude * cos(f);

    // 垂直位移
    float yOffset = wave.amplitude * sin(f);

    return float3(xOffset, yOffset, zOffset);
}
```

### 多波叠加

```hlsl
// 定义多个波浪
static GerstnerWave waves[3] = {
    {30.0, 1.2, float2(1.0, 0.3), 1.0},
    {20.0, 0.8, float2(0.7, 0.7), 1.2},
    {10.0, 0.4, float2(0.3, 1.0), 1.5}
};

// 在顶点着色器中叠加
float3 finalPosition = position;
for (int i = 0; i < 3; i++) {
    finalPosition += CalculateGerstnerWave(position, waves[i], _Time.y);
}
```

## 视觉效果增强

### 法线计算

基于 Gerstner 波的导数计算法线：

```hlsl
float3 CalculateWaveNormal(float3 position, GerstnerWave wave, float time) {
    float k = 2 * PI / wave.wavelength;
    float c = sqrt(9.8 / k);
    float f = k * (dot(wave.direction, position.xz) - c * wave.speed * time);

    float wa = k * wave.amplitude;

    float3 normal;
    normal.x = -wave.direction.x * wa * cos(f);
    normal.z = -wave.direction.y * wa * cos(f);
    normal.y = 1.0 - wa * sin(f);

    return normalize(normal);
}
```

### 泡沫效果

在波浪陡峭处添加泡沫：

```hlsl
// 计算波浪陡峭度
float steepness = 0;
for (int i = 0; i < 3; i++) {
    steepness += wave.amplitude * k;
}

// 根据陡峭度混合泡沫
float foam = smoothstep(_FoamThreshold, _FoamThreshold + 0.1, steepness);
float3 finalColor = lerp(waterColor, foamColor, foam);
```

### 深度淡出

```hlsl
// 根据深度淡出水面颜色
float depth = LinearEyeDepth(SAMPLE_DEPTH_TEXTURE(_CameraDepthTexture, uv));
float waterDepth = abs(LinearEyeDepth(0, _ProjectionParams) - depth);
float depthFade = saturate(waterDepth / _MaxDepth);

finalColor = lerp(shallowColor, deepColor, depthFade);
```

## 性能优化

### 1. GPU Instancing

对于多个水面，使用 GPU Instancing 减少Draw Call。

### 2. LOD 系统

根据距离切换不同精度的波浪模拟。

### 3. 计算着色器

将波浪计算移到 Compute Shader 中，减少 Fragment Shader 负担。

## 总结

Gerstner 波提供了一种高效且视觉效果出色的水面模拟方案：

- 数学模型简单，易于实现
- 计算开销小，适合实时渲染
- 支持多波叠加，效果丰富
- 可与反射折射、泡沫等效果结合

通过合理的优化，这个系统在移动设备上也能流畅运行。
