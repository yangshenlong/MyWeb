---
title: '基于Shader的实时水面效果实现'
description: '深入探讨如何使用Shader Graph和HLSL实现逼真的实时水面渲染效果，包含波浪模拟、反射折射和泡沫效果。'
pubDate: 2024-01-09
heroImage: ../../assets/blog-placeholder-1.jpg
tags: ['Shader', 'Unity', '渲染', 'HLSL']
category: '渲染技术'
---

## 前言

水面效果是游戏渲染中最具挑战性的效果之一。本文将详细介绍如何使用Shader实现高质量的实时水面效果，涵盖从基础的波浪模拟到高级的反射折射和泡沫效果。

## 核心技术点

### 1. 波浪模拟

使用Gerstner波算法来模拟自然的海浪运动：

```hlsl
float3 GerstnerWave(float3 position, float steepness, float wavelength, float speed, float2 direction)
{
    float k = 2.0 * PI / wavelength;
    float c = sqrt(9.8 / k);
    float2 d = normalize(direction);
    float f = k * (dot(d, position.xz) - c * speed * _Time.y);
    float a = steepness / k;

    float3 displacement;
    displacement.x = d.x * a * cos(f);
    displacement.z = d.y * a * cos(f);
    displacement.y = a * sin(f);

    return displacement;
}
```

### 2. 法线计算

通过采样多个Gerstner波并计算导数来得到准确的表面法线：

```hlsl
float3 CalculateNormal(float3 position)
{
    float3 normal = float3(0, 1, 0);

    // 叠加多个波浪
    for(int i = 0; i < 4; i++)
    {
        float steepness = _WaveSteepness[i];
        float wavelength = _WaveLength[i];
        float speed = _WaveSpeed[i];
        float2 direction = _WaveDirection[i];

        float3 wave = GerstnerWave(position, steepness, wavelength, speed, direction);
        normal += wave;
    }

    return normalize(normal);
}
```

### 3. 反射与折射

使用屏幕空间反射（SSR）和GrabPass来实现：

```hlsl
// 反射
fixed4 reflection = tex2D(_ReflectionTex, screenUV);
reflection *= _ReflectionColor;

// 折射
fixed4 refraction = tex2D(_GrabTexture, screenUV + refractionOffset);
refraction *= _RefractionColor;

// 菲涅尔混合
float fresnel = pow(1.0 - saturate(dot(viewDir, normal)), _FresnelPower);
fixed4 finalColor = lerp(refraction, reflection, fresnel);
```

### 4. 泡沫效果

基于波浪高度和法线曲率来生成泡沫：

```hlsl
float Foam(float height, float3 normal)
{
    // 基于高度的泡沫
    float heightFoam = smoothstep(_FoamHeight, _FoamHeight + 0.5, height);

    // 基于法线曲率的泡沫
    float curvatureFoam = 1.0 - saturate(dot(normal, float3(0, 1, 0)));
    curvatureFoam = pow(curvatureFoam, _FoamPower);

    // 噪声纹理
    float2 foamUV = position.xz * _FoamScale + _Time.y * _FoamSpeed;
    float noise = tex2D(_FoamNoise, foamUV).r;

    return heightFoam * curvatureFoam * noise;
}
```

## 性能优化

### 1. LOD系统

根据距离使用不同质量的波浪计算：

```hlsl
if(distance < _LOD1Distance)
{
    // 高质量：8个波浪
    waves = CalculateWaves(8);
}
else if(distance < _LOD2Distance)
{
    // 中等质量：4个波浪
    waves = CalculateWaves(4);
}
else
{
    // 低质量：2个波浪
    waves = CalculateWaves(2);
}
```

### 2. GPU Instancing

对于多个水面实例使用GPU Instancing：

```hlsl
UNITY_INSTANCING_BUFFER_START(Props)
    UNITY_DEFINE_INSTANCED_PROP(float4, _Color)
    UNITY_DEFINE_INSTANCED_PROP(float, _WaveSpeed)
UNITY_INSTANCING_BUFFER_END(Props)
```

## 效果展示

最终实现的效果包含：

- ✅ 真实的波浪运动
- ✅ 高质量的反射和折射
- ✅ 自然的泡沫生成
- ✅ 深度颜色渐变
- ✅ 交互式涟漪

## 总结

通过组合Gerstner波、屏幕空间反射和法线映射技术，我们实现了高质量的实时水面效果。这种方法在保持视觉质量的同时，也能够满足性能要求。

## 参考资料

- [GPU Gems - Chapter 1: Effective Water Simulation](https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch01.html)
- [Unity Shader Graph Water](https://docs.unity3d.com/Packages/com.unity.shadergraph@latest)
- [Screen Space Shaders in Unity](https://docs.unity3d.com/Manual/SL-ScreenShaders.html)
