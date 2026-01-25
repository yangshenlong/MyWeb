---
title: "使用 Niagara Neighbor Grid 3D 与 HLSL 实现高性能粒子碰撞"
description: "深入解析如何使用 Niagara Neighbor Grid 3D 接口与 HLSL 自定义节点实现 GPU 粒子碰撞检测系统，包含完整的实现流程与性能优化技巧"
pubDate: "2025-01-25"
tags: ["Unreal Engine", "Niagara", "HLSL", "GPU Compute", "粒子系统", "碰撞检测"]
category: "游戏开发"
author: "不想秃头的呱呱"
---

<style>
/* 文章专属样式 */
.article-banner {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 16px;
  padding: 2em;
  margin: 2em 0;
  position: relative;
  overflow: hidden;
}

.article-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #a855f7, #6366f1);
  background-size: 200% 100%;
  animation: gradientMove 3s ease infinite;
}

@keyframes gradientMove {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.info-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5em;
  margin: 1.5em 0;
}

.info-card-title {
  display: flex;
  align-items: center;
  gap: 0.5em;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.75em;
}

.info-card-title svg {
  color: rgba(99, 102, 241, 0.7);
}

.code-flow {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 1.5em;
  margin: 2em 0;
  overflow-x: auto;
}

.code-flow pre {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  font-family: 'Space Mono', 'Fira Code', monospace;
  font-size: 0.8em;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
}

.key-concept {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0.05));
  border-left: 3px solid rgba(99, 102, 241, 0.5);
  border-radius: 8px;
  padding: 1.25em;
  margin: 1.5em 0;
}

.key-concept-title {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5em;
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.key-concept-title::before {
  content: '💡';
}

.ta-takeaway {
  background: rgba(34, 197, 94, 0.08);
  border-left: 3px solid #22c55e;
  border-radius: 8px;
  padding: 1.25em;
  margin: 1.5em 0;
}

.ta-takeaway-title {
  font-weight: 600;
  color: #86efac;
  margin-bottom: 0.5em;
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.ta-takeaway-title::before {
  content: '💡';
  font-size: 0.9em;
}

.shader-scene {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(251, 146, 60, 0.05));
  border: 1px solid rgba(251, 146, 60, 0.2);
  border-radius: 12px;
  padding: 1.5em;
  margin: 1.5em 0;
}

.shader-scene-title {
  color: #fbbf24;
  font-weight: 600;
  margin-bottom: 1em;
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.shader-scene-title::before {
  content: '🎬';
}

.formula-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1em 1.5em;
  margin: 1em 0;
  font-family: 'Space Mono', monospace;
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.9);
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5em;
  margin: 2em 0;
}

.comparison-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5em;
}

.comparison-item.bad {
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.05);
}

.comparison-item.good {
  border-color: rgba(34, 197, 94, 0.2);
  background: rgba(34, 197, 94, 0.05);
}

.comparison-title {
  font-weight: 600;
  margin-bottom: 0.5em;
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.comparison-item.bad .comparison-title::before {
  content: '❌';
}

.comparison-item.good .comparison-title::before {
  content: '✅';
}

.video-link {
  display: inline-flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.75em 1.5em;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  text-decoration: none;
  font-size: 0.9em;
  transition: all 0.3s ease;
  margin: 1em 0;
}

.video-link:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 1em;
  margin: 3em 0 2em;
  color: rgba(255, 255, 255, 0.3);
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

.section-divider svg {
  color: rgba(99, 102, 241, 0.5);
}
</style>

# 使用 Niagara Neighbor Grid 3D 与 HLSL 实现高性能粒子碰撞

<div class="article-banner">
  <div style="display: flex; align-items: center; gap: 0.75em; margin-bottom: 0.5em;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="5 3 19 12 5 21 12"/>
    </svg>
    <span style="font-size: 0.85em; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6);">技术教程</span>
  </div>
  <p style="margin: 0; font-size: 0.95em; color: rgba(255,255,255,0.7);">作者：不想秃头的呱呱 | Unreal Engine | Niagara & HLSL</p>
</div>

<div class="info-card">
  <div class="info-card-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 54.6v-33a2 2 0 0 0-2-2V13a2 2 0 0 0-2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h20z"/>
      <polyline points="7 11 12 16 17"/>
    </svg>
    配套视频演示
  </div>
  <a href="https://www.bilibili.com/video/BV1dr1yBwEnr/" class="video-link" target="_blank" rel="noopener">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22.54 6.42a2.2 2.2 0 0 0-2.02-.59L19 6.02a10 10 0 0 0-7.21-2.15L2 7.79a2 2.2 0 0 0-.59-2.02"/>
      <polygon points="22.54 6.42 2 17.5 12 13.5"/>
    </svg>
    <span>B站视频：BV1dr1yBwEnr</span>
  </a>
</div>

---

## 目录

1. [原理概述](#原理概述)
2. [系统设置与参数化](#系统设置与参数化)
3. [可视化调试发射器](#可视化调试发射器)
4. [主粒子系统架构](#主粒子系统架构)
5. [注入粒子阶段优化](#注入粒子阶段优化)
6. [HLSL 碰撞算法详解](#hlsl-碰撞算法详解)
7. [核心要点总结](#核心要点总结)

---

## 原理概述

<div class="key-concept">
  <div class="key-concept-title">核心目标</div>
  <p>搭建一个<strong>灵活、可控、可调试</strong>的网格粒子碰撞系统，利用 Niagara Neighbor Grid 3D 接口在 GPU 上实现高性能粒子碰撞检测。</p>
</div>

<div class="info-card">
  <div class="info-card-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 12"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
    </svg>
    适用场景
  </div>
  <ul style="margin: 0; padding-left: 1.5em; font-size: 0.95em; color: rgba(255,255,255,0.8);">
    <li>大量粒子碰撞检测（1000+ 粒子）</li>
    <li>GPU 并行计算加速</li>
    <li>可参数化的网格系统</li>
    <li>实时预览与调试</li>
  </ul>
</div>

---

<div class="section-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke="width="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <path d="M9 3v18"/>
    <path d="M15 3v18"/>
  </svg>
</div>

## 系统设置与参数化

### 用户参数设计

作为 TA（技术美术），我们希望所有关键属性都是"可调的"。在 Niagara 系统层面创建以下用户参数：

<div class="comparison-grid">
  <div class="comparison-item">
    <div class="comparison-title">cells x/y/z</div>
    <p style="margin: 0; font-size: 0.9em; color: rgba(255,255,255,0.7);">X/Y/Z 轴的单元格数量（控制网格密度）</p>
  </div>
  <div class="comparison-item">
    <div class="comparison-title">max particles per cell</div>
    <p style="margin: 0; font-size: 0.9em; color: rgba(255,255,255,255,255,0.7);">每个单元格的最大粒子数（性能/精度平衡点）</p>
  </div>
  <div class="comparison-item">
    <div class="comparison-title">Grid Size</div>
    <p style="margin: 0; font-size: 0.9em; color: rgba(255,255,255,255,255,0.7);">整个 3D 网格的物理范围/大小</p>
  </div>
</div>

### 在 System Spawn 中初始化

<div class="key-concept">
  <div class="key-concept-title">为什么选择 System Spawn？</div>
  <p>System Spawn 在整个 Niagara 系统被创建时只运行一次，定义了 neighborGrid 的<strong>作用域</strong>和<strong>生命周期</strong>。</p>
</div>

<div class="ta-takeaway">
  <div class="ta-takeaway-title">TA Takeaway</div>
  <p>这样可以让系统内的多个发射器共享同一个网格实例——一个发射器负责"写入"网格，另一个发射器负责"查询"网格。</p>
</ta>

### 2D/3D 转换技巧

通过设置 <code>cells z = 1</code>，我们虽然使用 Neighbor Grid 3D 接口，但实际创建了一个 2D 的相邻网格。这证明了该接口的灵活性。

---

## 可视化调试发射器

<div class="key-concept">
  <div class="key-concept-title">数据层 vs 表现层</div>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1em; margin-top: 1em;">
    <div>
      <strong>数据层</strong>
      <p style="margin: 0.5em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">System Spawn 中的 neighborGrid 接口，存储所有粒子数据（不可见）</p>
    </div>
    <div>
      <strong>表现层</strong>
      <p style="margin: 0.5em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">grid_001 发射器，读取数据并可视化（可见）</p>
    </div>
  </div>
</div>

### 网格缩放计算

<div class="formula-box">
<strong>核心公式：</strong>
MeshScale = (GridSize / CellCount) / SourceSize
</div>

<p style="margin: 0.5em 0 1em; font-size: 0.9em; color: rgba(255,255,255,0.6);">其中 SourceSize 是模型的原始尺寸（如 Control Rig Box = 100 单位）</p>

---

<div class="section-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2v20M2 12h20"/>
  </svg>
</div>

## 主粒子系统架构

### 发射器初始化关键步骤

<div class="key-concept">
  <div class="key-concept-title">共享网格机制</div>
  <p>通过 <code>Emitter Spawn</code> 绑定全局 <code>neighborGrid</code>，确保可视化发射器和主粒子系统操作同一个数据实例。</p>
</div>

### 参数化的物理半径

<div class="ta-takeaway">
  <div class="ta-takeaway-title">逻辑与表现分离</div>
  <p><code>Particle.Radius</code> 驱动逻辑碰撞，<code>MeshScale = Radius / 50.0</code> 控制视觉表现。这样无论使用什么模型，碰撞算法始终是"物理正确"的。</p>
</ta-takeaway>

### 模拟阶段顺序

<div class="info-card">
  <div class="info-card-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h17a2 2 0 0 0 2-2V4"/>
      <polyline points="22 6 12 11 19 12"/>
    </svg>
    必须遵循的顺序
  </div>
  <div style="display: flex; flex-direction: column; gap: 0.75em;">
    <div style="display: flex; align-items: center; gap: 0.5em;">
      <span class="phase-badge" style="background: rgba(34, 197, 94, 0.2); border-color: rgba(34, 197, 94, 0.3); color: #86efac;">1</span>
      <strong>Inject Particles</strong>
      <span style="font-size: 0.9em; color: rgba(255,255,255,0.6);">注入粒子位置到网格</span>
    </div>
    <div style="display: flex; align-items: center; gap: 0.5em;">
      <span class="phase-badge" style="background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.3); color: #a5b4fc;">2</span>
      <strong>Collisions</strong>
      <span style="font-size: 0.9em; color: rgba(255,255,255,0.6);">读取网格计算碰撞</span>
    </div>
  </div>
  <p style="margin: 0.5em 0 0; font-size: 0.85em; color: rgba(239, 68, 68, 0.8);">⚠️ 禁止同阶段读写，避免竞态条件</p>
</div>

---

## 注入粒子阶段优化

### 坐标转换流程

<div class="code-flow">
<pre style="font-family: 'Space Mono', 'Fira Code', monospace; font-size: 0.85em; line-height: 1.6; color: rgba(255,255,255,0.8);">
World Position (世界坐标)
         ↓
   SimulationToUnit (变换矩阵)
         ↓
   Unit Space [0,1] (单位空间)
         ↓
   UnitToIndex (转换函数)
         ↓
   Cell Index (单元格索引)
</pre>
</div>

### 性能优化：预计算变换矩阵

<div class="comparison-grid">
  <div class="comparison-item bad">
    <div class="comparison-title">❌ 性能差</div>
    <p style="margin: 0; font-size: 0.9em;">在 Inject Particles 模块中为每个粒子计算一次变换矩阵</p>
    <div class="formula-box" style="margin-top: 0.5em;">1000 粒子 × 1 次计算 = 每帧 1000 次计算</div>
  </div>
  <div class="comparison-item good">
    <div class="comparison-title">✅ 优化方案</div>
    <p style="margin: 0; font-size: 0.9em;">在 Emitter Spawn 阶段预计算一次，所有粒子共享</p>
    <div class="formula-box" style="margin-top: 0.5em;">每帧 1 次计算</div>
  </div>
</div>

### simulation_to_units 矩阵

<div class="key-concept">
  <div class="key-concept-title">目标</div>
  <p>将世界坐标 [-GridSize/2, +GridSize/2] 映射到单位空间 [0, 1]</p>
</div>

<div class="formula-box" style="margin: 2em 0;">
M = S × T

S (缩放矩阵) = MakeScaleMatrix(1.0 / GridSize)
T (平移矩阵) = MakeTranslationMatrix(0.5, 0.5, 0.5)
</div>

---

<div class="section-divider">
  <svg width="20" height="20" viewBox="0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
</div>

## HLSL 碰撞算法详解

### 完整算法流程

这是整个系统的核心——在 HLSL 中实现 GPU 粒子碰撞检测：

<div class="shader-scene">
  <div class="shader-scene-title">🎨 第一幕：准备工作 & 自我定位</div>
  <div class="code-flow">
<pre style="font-family: 'Space Mono', 'Fira Code', monospace; font-size: 0.85em; line-height: 1.6; color: rgba(255,255,255,0.8);">
// 默认输出为输入位置
Result = Position;

#if GPU_SIMULATION
// === 网格信息获取 ===
int3 NumCells;
Grid.GetNumCells(NumCells.x, NumCells.y, NumCells.z);

int MaxNeighborsPerCell;
Grid.MaxNeighborsPerCell(MaxNeighborsPerCell);

// === 坐标转换 ===
float3 Unit;
Grid.SimulationToUnit(Position, SimulationToUnit, Unit);

int3 Index;
Grid.UnitToIndex(Unit, Index.x, Index.y, Index.z);

// === 邻居检测变量初始化 ===
float3 PositionSum = 0.0;  // 位置修正累加和
int Count = 0;             // 有效邻居计数器
#endif
</pre>
  </div>
</div>

<div class="shader-scene">
  <div class="shader-scene-title">🎭 第二幕：邻域大搜索 (3x3x3 循环)</div>
  <div class="code-flow">
<pre style="font-family: 'Space Mono', 'Fira Code', monospace; font-size: 0.85em; line-height: 1.6; color: rgba(255,255,255,255,0.8);">
for(int x = -1; x <= 1; x++)
{
    for(int y = -1; y <= 1; y++)
    {
        for(int z = -1; z <= 1; z++)
        {
            int3 CellIndex = Index + int3(x,y,z);
            // ... 继续处理
        }
    }
}
</pre>
  </div>
</div>

<div class="shader-scene">
  <div class="shader-scene-title">📦 第三幕：开箱与检查</div>
  <div class="code-flow">
<pre style="font-family: 'Space Mono', 'Fira Code', monospace; font-size: 0.85em; line-height: 1.6; color: rgba(255,255,255,255,255,0.8);">
// 边界安全检查
if( CellIndex.x >= 0 && CellIndex.x < NumCells.x && ... )
{
    // 转换为 1D 线性索引
    int LinearIndex;
    Grid.IndexToLinear(CellIndex, LinearIndex);

    // 获取该单元格中的邻居粒子数量
    int NeighborCount;
    Grid.GetParticleNeighborCount(LinearIndex, NeighborCount);

    // 遍历该单元格中的所有邻居粒子
    for(int i = 0; i < NeighborCount; i++)
    {
        // ... 获取邻居索引并处理
    }
}
</pre>
  </div>
</div>

<div class="shader-scene">
  <div class="shader-scene-title">🏀 第五幕：物理计算 & 累加</div>
  <div class="code-flow">
<pre style="font-family: 'Space Mono', 'Fira Code', monospace; font-size: 0.85em; line-height: 1.6; color: rgba(255,255,255,255,255,0,255);">
// === 碰撞检测与处理 ===
float3 RayToNeighbor = NeighborPosition - Position;
float Distance = length(RayToNeighbor);
float k = Radius + NeighborRadius;

if(Distance < k)
{
    // 计算排斥向量：反方向 * 重叠深度
    PositionSum += normalize(-RayToNeighbor) * (k - Distance);
    Count++;
}
</pre>
  </div>
</div>

<div class="shader-scene">
  <div class="shader-scene-title">🏁 第六幕：最终修正 (应用平均值)</div>
  <div class="code-flow">
<pre style="font-family: 'Space Mono', 'Fira Code', monospace; font-size: 0.85em; line-height: 1.6; color: rgba(255,255,255,255,255,255,255,0,255);">
// === 位置修正应用 ===
if(Count > 0)
{
    float3 Offset = PositionSum / Count;  // 平均排斥向量
    Result += Offset;                  // 应用位置修正
}
#endif
</pre>
  </div>
</div>

---

<div class="section-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
</div>

## 核心要点总结

### 一、系统设置与参数化

- **网格维度**：cells x/y/z（默认 32×32×1，实现 2D/3D 转换）
- **性能控制**：max particles per cell（精度与性能平衡）
- **物理范围**：Grid Size（链接可视化与实际模拟范围）
- ⭐ **默认 Z=1 技巧**：通过 3D 接口实现 2D 网格

### 二、可视化调试发射器构建

- **数据层与表现层分离**：neighborGrid vs grid_001
- **参数联动**：表现层 100% 由数据层参数驱动
- **缩放公式**：`(GridSize / 单元格数量) / 原始模型尺寸`

### 三、性能优化技巧

<div class="ta-takeaway">
  <div class="ta-takeaway-title">预计算优化</div>
  <p>在 <code>Emitter Spawn</code> 阶段计算 <code>simulation_to_units</code> 矩阵，所有粒子共享同一矩阵（减少千倍计算量）</p>
</div-takeaway>

### 四、调试与修复

- **红/绿粒子反馈**：AddParticle 的 Success 状态映射颜色
- **边界闪烁问题**：浮点数精度导致索引越界，修复：缩小生成范围（如 BoxSize 从 1000→999）

### 五、数学公式速查表

<div class="info-card">
  <div class="info-card-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
    </svg>
    常用公式
  </div>
  <div style="display: grid; gap: 0.75em; font-family: 'Space Mono', monospace; font-size: 0.85em;">
    <div class="formula-box" style="margin: 0;">网格缩放：(GridSize / cells) / 模型原始尺寸</div>
    <div class="formula-box" style="margin: 0;">世界→单位空间：M = 平移(0.5) × 缩放(1/GridSize)</div>
    <div class="formula-box" style="margin: 0;">碰撞阈值：k = 自身半径 + 邻居半径</div>
    <div class="formula-box" style="margin: 0;">排斥向量：normalize(-方向) × (k - 实际距离)</div>
  </div>
</div>

---

<div style="text-align: center; padding: 3em 0; margin-top: 3em;">
  <p style="font-size: 0.9em; color: rgba(255,255,255,0.4); margin: 0;">
    感谢阅读 · 使用 Niagara Neighbor Grid 3D 与 HLSL 实现高性能粒子碰撞
  </p>
  <div style="display: flex; align-items: center; justify-content: center; gap: 1em; margin-top: 1em;">
    <span style="width: 40px; height: 1px; background: rgba(99, 102, 241, 0.3);"></span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(99, 102, 241, 0.5)" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      <path d="M2 12h20"/>
    </svg>
    <span style="width: 40px; height: 1px; background: rgba(99, 102, 241, 0.3);"></span>
  </div>
</div>

---

<div class="info-card" style="margin-top: 3em;">
  <div class="info-card-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    </svg>
    原文链接
  </div>
  <p style="margin: 0;">
    <a href="https://zhuanlan.zhihu.com/p/1970321928876196440" target="_blank" rel="noopener" style="color: rgba(99, 102, 241, 0.8);">知乎专栏：使用 Niagara Neighbor Grid 3D 与 HLSL 实现高性能粒子碰撞</a>
  </p>
  <p style="margin: 0.5em 0 0; font-size: 0.85em; color: rgba(255,255,255,0.4);">
    作者：不想秃头的呱呱 | 视频：B站 BV1dr1yBwEnr
  </p>
</div>
