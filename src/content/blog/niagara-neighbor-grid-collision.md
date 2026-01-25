---
title: "使用 Niagara Neighbor Grid 3D 与 HLSL 实现高性能粒子碰撞"
description: "深入解析如何使用 Niagara Neighbor Grid 3D 接口与 HLSL 自定义节点实现 GPU 粒子碰撞检测系统，包含完整的实现流程与性能优化技巧"
pubDate: "2025-01-25"
tags: ["Unreal Engine", "Niagara", "HLSL", "GPU Compute", "粒子系统", "碰撞检测"]
category: "游戏开发"
author: "不想秃头的呱呱"
---

<style>
/* ============================================
   Niagara 粒子碰撞 - 文章专属样式系统
   ============================================ */

/* --- 全局色彩变量 --- */
:root {
  --niagara-primary: #6366f1;
  --niagara-secondary: #a855f7;
  --niagara-accent: #22c55e;
  --niagara-warning: #f59e0b;
  --niagara-danger: #ef4444;
  --niagrid-bg-subtle: rgba(255, 255, 255, 0.02);
  --niagrid-bg-hover: rgba(255, 255, 255, 0.05);
  --niagrid-border: rgba(255, 255, 255, 0.08);
  --niagrid-border-hover: rgba(99, 102, 241, 0.3);
}

/* --- Hero Banner --- */
.niagara-hero {
  background: linear-gradient(135deg,
    rgba(99, 102, 241, 0.15) 0%,
    rgba(168, 85, 247, 0.1) 50%,
    rgba(34, 197, 94, 0.05) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 16px;
  padding: 2.5em 2em;
  margin: 2em 0 3em;
  position: relative;
  overflow: hidden;
}

.niagara-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg,
    var(--niagara-primary),
    var(--niagara-secondary),
    var(--niagara-accent),
    var(--niagara-secondary),
    var(--niagara-primary));
  background-size: 300% 100%;
  animation: heroGradient 4s ease infinite;
}

@keyframes heroGradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.niagara-hero-meta {
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 1em;
}

.niagara-hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.4em 1em;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 20px;
  font-size: 0.75em;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(167, 139, 250, 0.9);
}

/* --- Info Card --- */
.niagara-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--niagrid-border);
  border-radius: 12px;
  padding: 1.5em;
  margin: 1.5em 0;
  transition: all 0.3s ease;
}

.niagara-card:hover {
  border-color: var(--niagrid-border-hover);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
}

.niagara-card-header {
  display: flex;
  align-items: center;
  gap: 0.6em;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 1em;
}

.niagara-card-header svg {
  color: var(--niagara-primary);
  flex-shrink: 0;
}

/* --- Key Concept Box --- */
.niagara-concept {
  background: linear-gradient(135deg,
    rgba(99, 102, 241, 0.12) 0%,
    rgba(99, 102, 241, 0.04) 100%);
  border-left: 3px solid rgba(99, 102, 241, 0.6);
  border-radius: 0 12px 12px 0;
  padding: 1.25em 1.5em;
  margin: 2em 0;
}

.niagara-concept-title {
  font-weight: 600;
  color: rgba(167, 139, 250, 0.95);
  margin-bottom: 0.75em;
  display: flex;
  align-items: center;
  gap: 0.5em;
  font-size: 0.95em;
}

.niagara-concept-title::before {
  content: '💡';
  font-size: 1.1em;
}

/* --- TA Takeaway --- */
.niagara-takeaway {
  background: linear-gradient(135deg,
    rgba(34, 197, 94, 0.1) 0%,
    rgba(34, 197, 94, 0.03) 100%);
  border-left: 3px solid var(--niagara-accent);
  border-radius: 0 12px 12px 0;
  padding: 1.25em 1.5em;
  margin: 2em 0;
}

.niagara-takeaway-title {
  font-weight: 600;
  color: #86efac;
  margin-bottom: 0.75em;
  display: flex;
  align-items: center;
  gap: 0.5em;
  font-size: 0.95em;
}

.niagara-takeaway-title::before {
  content: '🎯';
  font-size: 1em;
}

/* --- Shader Scene --- */
.niagara-scene {
  background: linear-gradient(135deg,
    rgba(251, 146, 60, 0.1) 0%,
    rgba(251, 146, 60, 0.03) 100%);
  border: 1px solid rgba(251, 146, 60, 0.2);
  border-radius: 12px;
  padding: 1.5em;
  margin: 2em 0;
}

.niagara-scene-title {
  color: #fbbf24;
  font-weight: 600;
  margin-bottom: 1em;
  display: flex;
  align-items: center;
  gap: 0.5em;
  font-size: 0.95em;
}

/* --- Formula Box --- */
.niagara-formula {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 8px;
  padding: 1em 1.25em;
  margin: 1.5em 0;
  font-family: 'Space Mono', 'Fira Code', monospace;
  font-size: 0.85em;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
}

/* --- Comparison Grid --- */
.niagara-compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5em;
  margin: 2em 0;
}

.niagara-compare-item {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--niagrid-border);
  border-radius: 12px;
  padding: 1.5em;
  transition: all 0.3s ease;
}

.niagara-compare-item:hover {
  transform: translateY(-2px);
}

.niagara-compare-item.bad {
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.04);
}

.niagara-compare-item.good {
  border-color: rgba(34, 197, 94, 0.2);
  background: rgba(34, 197, 94, 0.04);
}

.niagara-compare-title {
  font-weight: 600;
  margin-bottom: 0.75em;
  display: flex;
  align-items: center;
  gap: 0.5em;
  font-size: 0.9em;
}

.niagara-compare-item.bad .niagara-compare-title {
  color: #fca5a5;
}

.niagara-compare-item.good .niagara-compare-title {
  color: #86efac;
}

.niagara-compare-item.bad .niagara-compare-title::before {
  content: '❌';
}

.niagara-compare-item.good .niagara-compare-title::before {
  content: '✅';
}

/* --- Code Flow --- */
.niagara-codeflow {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 12px;
  padding: 1.5em;
  margin: 1.5em 0;
  overflow-x: auto;
}

.niagara-codeflow pre {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  font-family: 'Space Mono', 'Fira Code', monospace;
  font-size: 0.82em;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
}

/* --- Video Link --- */
.niagara-video-link {
  display: inline-flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.85em 1.5em;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #fca5a5;
  text-decoration: none;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.3s ease;
  margin: 0.5em 0;
}

.niagara-video-link:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
}

/* --- Section Divider --- */
.niagara-divider {
  display: flex;
  align-items: center;
  gap: 1.5em;
  margin: 4em 0 3em;
  color: rgba(255, 255, 255, 0.25);
}

.niagara-divider::before,
.niagara-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(99, 102, 241, 0.2),
    transparent);
}

.niagara-divider svg {
  color: var(--niagara-primary);
  opacity: 0.6;
}

/* --- Phase Badge --- */
.niagara-phase {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 0.6em;
  border-radius: 8px;
  font-size: 0.8em;
  font-weight: 600;
  font-family: 'Space Mono', monospace;
}

.niagara-phase.primary {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.niagara-phase.secondary {
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

/* --- Parameter Grid --- */
.niagara-param-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1em;
  margin: 1.5em 0;
}

.niagara-param-item {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--niagrid-border);
  border-radius: 10px;
  padding: 1.25em;
  transition: all 0.3s ease;
}

.niagara-param-item:hover {
  border-color: rgba(99, 102, 241, 0.25);
  background: rgba(255, 255, 255, 0.04);
}

.niagara-param-name {
  font-weight: 600;
  color: var(--niagara-primary);
  margin-bottom: 0.5em;
  font-size: 0.9em;
}

.niagara-param-desc {
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.5;
}

/* --- Data/Performance Split --- */
.niagara-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5em;
  margin: 1.5em 0;
}

.niagara-split-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--niagrid-border);
  border-radius: 10px;
  padding: 1.25em;
}

.niagara-split-title {
  font-weight: 600;
  color: var(--niagara-secondary);
  margin-bottom: 0.5em;
  font-size: 0.9em;
}

.niagara-split-desc {
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.5;
}

/* --- Warning Box --- */
.niagara-warning {
  background: rgba(245, 158, 11, 0.08);
  border-left: 3px solid var(--niagara-warning);
  border-radius: 0 10px 10px 0;
  padding: 1em 1.25em;
  margin: 1em 0 0;
  font-size: 0.85em;
  color: rgba(251, 191, 36, 0.9);
}

/* --- Footer --- */
.niagara-footer {
  text-align: center;
  padding: 3em 0;
  margin-top: 4em;
}

.niagara-footer-text {
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
}

.niagara-footer-deco {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1em;
  margin-top: 1em;
}

.niagara-footer-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(99, 102, 241, 0.4),
    transparent);
}

/* --- Responsive --- */
@media (max-width: 768px) {
  .niagara-split {
    grid-template-columns: 1fr;
  }

  .niagara-compare-grid,
  .niagara-param-grid {
    grid-template-columns: 1fr;
  }
}
</style>

# 使用 Niagara Neighbor Grid 3D 与 HLSL 实现高性能粒子碰撞

<div class="niagara-hero">
  <div class="niagara-hero-meta">
    <span class="niagara-hero-tag">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 12"/>
      </svg>
      技术教程
    </span>
  </div>
  <p style="margin: 0; font-size: 0.95em; color: rgba(255,255,255,0.65); line-height: 1.6;">
    深入解析如何使用 Niagara Neighbor Grid 3D 接口与 HLSL 自定义节点实现 GPU 粒子碰撞检测系统
  </p>
  <p style="margin: 0.5em 0 0; font-size: 0.85em; color: rgba(255,255,255,0.4);">
    作者：不想秃头的呱呱 | Unreal Engine | Niagara & HLSL
  </p>
</div>

<div class="niagara-card">
  <div class="niagara-card-header">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 54.6v-33a2 2 0 0 0-2-2V13a2 2 0 0 0-2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h20z"/>
      <polyline points="7 11 12 16 17"/>
    </svg>
    配套视频演示
  </div>
  <a href="https://www.bilibili.com/video/BV1dr1yBwEnr/" class="niagara-video-link" target="_blank" rel="noopener">
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

<div class="niagara-concept">
  <div class="niagara-concept-title">核心目标</div>
  <p>搭建一个<strong>灵活、可控、可调试</strong>的网格粒子碰撞系统，利用 Niagara Neighbor Grid 3D 接口在 GPU 上实现高性能粒子碰撞检测。</p>
</div>

<div class="niagara-card">
  <div class="niagara-card-header">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 12"/>
    </svg>
    适用场景
  </div>
  <ul style="margin: 0; padding-left: 1.5em; font-size: 0.9em; color: rgba(255,255,255,0.7);">
    <li>大量粒子碰撞检测（1000+ 粒子）</li>
    <li>GPU 并行计算加速</li>
    <li>可参数化的网格系统</li>
    <li>实时预览与调试</li>
  </ul>
</div>

<div class="niagara-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <path d="M9 3v18"/>
    <path d="M15 3v18"/>
  </svg>
</div>

## 系统设置与参数化

### 用户参数设计

作为 TA（技术美术），我们希望所有关键属性都是"可调的"。在 Niagara 系统层面创建以下用户参数：

<div class="niagara-param-grid">
  <div class="niagara-param-item">
    <div class="niagara-param-name">cells x/y/z</div>
    <p class="niagara-param-desc">X/Y/Z 轴的单元格数量（控制网格密度）</p>
  </div>
  <div class="niagara-param-item">
    <div class="niagara-param-name">max particles per cell</div>
    <p class="niagara-param-desc">每个单元格的最大粒子数（性能/精度平衡点）</p>
  </div>
  <div class="niagara-param-item">
    <div class="niagara-param-name">Grid Size</div>
    <p class="niagara-param-desc">整个 3D 网格的物理范围/大小</p>
  </div>
</div>

### 在 System Spawn 中初始化

<div class="niagara-concept">
  <div class="niagara-concept-title">为什么选择 System Spawn？</div>
  <p>System Spawn 在整个 Niagara 系统被创建时只运行一次，定义了 neighborGrid 的<strong>作用域</strong>和<strong>生命周期</strong>。</p>
</div>

<div class="niagara-takeaway">
  <div class="niagara-takeaway-title">TA Takeaway</div>
  <p>这样可以让系统内的多个发射器共享同一个网格实例——一个发射器负责"写入"网格，另一个发射器负责"查询"网格。</p>
</div>

### 2D/3D 转换技巧

通过设置 <code>cells z = 1</code>，我们虽然使用 Neighbor Grid 3D 接口，但实际创建了一个 2D 的相邻网格。这证明了该接口的灵活性。

---

<div class="niagara-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
</div>

## 可视化调试发射器

<div class="niagara-concept">
  <div class="niagara-concept-title">数据层 vs 表现层</div>
  <div class="niagara-split">
    <div class="niagara-split-item">
      <div class="niagara-split-title">数据层</div>
      <p class="niagara-split-desc">System Spawn 中的 neighborGrid 接口，存储所有粒子数据（不可见）</p>
    </div>
    <div class="niagara-split-item">
      <div class="niagara-split-title">表现层</div>
      <p class="niagara-split-desc">grid_001 发射器，读取数据并可视化（可见）</p>
    </div>
  </div>
</div>

### 网格缩放计算

<div class="niagara-formula">
<strong>核心公式：</strong>
MeshScale = (GridSize / CellCount) / SourceSize
</div>

<p style="margin: 0.5em 0 1em; font-size: 0.85em; color: rgba(255,255,255,0.5);">其中 SourceSize 是模型的原始尺寸（如 Control Rig Box = 100 单位）</p>

<div class="niagara-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2v20M2 12h20"/>
  </svg>
</div>

## 主粒子系统架构

### 发射器初始化关键步骤

<div class="niagara-concept">
  <div class="niagara-concept-title">共享网格机制</div>
  <p>通过 <code>Emitter Spawn</code> 绑定全局 <code>neighborGrid</code>，确保可视化发射器和主粒子系统操作同一个数据实例。</p>
</div>

### 参数化的物理半径

<div class="niagara-takeaway">
  <div class="niagara-takeaway-title">逻辑与表现分离</div>
  <p><code>Particle.Radius</code> 驱动逻辑碰撞，<code>MeshScale = Radius / 50.0</code> 控制视觉表现。这样无论使用什么模型，碰撞算法始终是"物理正确"的。</p>
</div>

### 模拟阶段顺序

<div class="niagara-card">
  <div class="niagara-card-header">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h17a2 2 0 0 0 2-2V4"/>
      <polyline points="22 6 12 11 19 12"/>
    </svg>
    必须遵循的顺序
  </div>
  <div style="display: flex; flex-direction: column; gap: 0.75em;">
    <div style="display: flex; align-items: center; gap: 0.6em;">
      <span class="niagara-phase primary">1</span>
      <strong>Inject Particles</strong>
      <span style="font-size: 0.85em; color: rgba(255,255,255,0.5);">注入粒子位置到网格</span>
    </div>
    <div style="display: flex; align-items: center; gap: 0.6em;">
      <span class="niagara-phase secondary">2</span>
      <strong>Collisions</strong>
      <span style="font-size: 0.85em; color: rgba(255,255,255,0.5);">读取网格计算碰撞</span>
    </div>
  </div>
  <div class="niagara-warning">⚠️ 禁止同阶段读写，避免竞态条件</div>
</div>

---

<div class="niagara-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
  </svg>
</div>

## 注入粒子阶段优化

### 坐标转换流程

<div class="niagara-codeflow">
<pre>
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

<div class="niagara-compare-grid">
  <div class="niagara-compare-item bad">
    <div class="niagara-compare-title">性能差</div>
    <p style="margin: 0; font-size: 0.85em; color: rgba(255,255,255,0.7);">在 Inject Particles 模块中为每个粒子计算一次变换矩阵</p>
    <div class="niagara-formula" style="margin-top: 1em; font-size: 0.8em;">1000 粒子 × 1 次计算 = 每帧 1000 次计算</div>
  </div>
  <div class="niagara-compare-item good">
    <div class="niagara-compare-title">优化方案</div>
    <p style="margin: 0; font-size: 0.85em; color: rgba(255,255,255,0.7);">在 Emitter Spawn 阶段预计算一次，所有粒子共享</p>
    <div class="niagara-formula" style="margin-top: 1em; font-size: 0.8em;">每帧 1 次计算</div>
  </div>
</div>

### simulation_to_units 矩阵

<div class="niagara-concept">
  <div class="niagara-concept-title">目标</div>
  <p>将世界坐标 [-GridSize/2, +GridSize/2] 映射到单位空间 [0, 1]</p>
</div>

<div class="niagara-formula" style="margin: 2em 0;">
M = S × T

S (缩放矩阵) = MakeScaleMatrix(1.0 / GridSize)
T (平移矩阵) = MakeTranslationMatrix(0.5, 0.5, 0.5)

</div>

<div class="niagara-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
</div>

## HLSL 碰撞算法详解

### 完整算法流程

这是整个系统的核心——在 HLSL 中实现 GPU 粒子碰撞检测：

<div class="niagara-scene">
  <div class="niagara-scene-title">🎨 第一幕：准备工作 & 自我定位</div>
  <div class="niagara-codeflow">
<pre>
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
float3 PositionSum = 0.0; // 位置修正累加和
int Count = 0; // 有效邻居计数器
#endif

</pre>
  </div>
</div>

<div class="niagara-scene">
  <div class="niagara-scene-title">🎭 第二幕：邻域大搜索 (3x3x3 循环)</div>
  <div class="niagara-codeflow">
<pre>
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

<div class="niagara-scene">
  <div class="niagara-scene-title">📦 第三幕：开箱与检查</div>
  <div class="niagara-codeflow">
<pre>
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

<div class="niagara-scene">
  <div class="niagara-scene-title">🏀 第四幕：物理计算 & 累加</div>
  <div class="niagara-codeflow">
<pre>
// === 碰撞检测与处理 ===
float3 RayToNeighbor = NeighborPosition - Position;
float Distance = length(RayToNeighbor);
float k = Radius + NeighborRadius;

if(Distance < k)
{
// 计算排斥向量：反方向 × 重叠深度
PositionSum += normalize(-RayToNeighbor) \* (k - Distance);
Count++;
}

</pre>
  </div>
</div>

<div class="niagara-scene">
  <div class="niagara-scene-title">🏁 第五幕：最终修正 (应用平均值)</div>
  <div class="niagara-codeflow">
<pre>
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

<div class="niagara-divider">
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

<div class="niagara-takeaway">
  <div class="niagara-takeaway-title">预计算优化</div>
  <p>在 <code>Emitter Spawn</code> 阶段计算 <code>simulation_to_units</code> 矩阵，所有粒子共享同一矩阵（减少千倍计算量）</p>
</div>

### 四、调试与修复

- **红/绿粒子反馈**：AddParticle 的 Success 状态映射颜色
- **边界闪烁问题**：浮点数精度导致索引越界，修复：缩小生成范围（如 BoxSize 从 1000→999）

### 五、数学公式速查表

<div class="niagara-card">
  <div class="niagara-card-header">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
    </svg>
    常用公式
  </div>
  <div style="display: grid; gap: 0.75em;">
    <div class="niagara-formula" style="margin: 0;">网格缩放：(GridSize / cells) / 模型原始尺寸</div>
    <div class="niagara-formula" style="margin: 0;">世界→单位空间：M = 平移(0.5) × 缩放(1/GridSize)</div>
    <div class="niagara-formula" style="margin: 0;">碰撞阈值：k = 自身半径 + 邻居半径</div>
    <div class="niagara-formula" style="margin: 0;">排斥向量：normalize(-方向) × (k - 实际距离)</div>
  </div>
</div>

<div class="niagara-footer">
  <p class="niagara-footer-text">
    感谢阅读 · 使用 Niagara Neighbor Grid 3D 与 HLSL 实现高性能粒子碰撞
  </p>
  <div class="niagara-footer-deco">
    <span class="niagara-footer-line"></span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(99, 102, 241, 0.5)" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      <path d="M2 12h20"/>
    </svg>
    <span class="niagara-footer-line"></span>
  </div>
</div>

<div class="niagara-card" style="margin-top: 3em;">
  <div class="niagara-card-header">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    </svg>
    原文链接
  </div>
  <p style="margin: 0;">
    <a href="https://zhuanlan.zhihu.com/p/1970321928876196440" target="_blank" rel="noopener" style="color: var(--niagara-primary);">知乎专栏：使用 Niagara Neighbor Grid 3D 与 HLSL 实现高性能粒子碰撞</a>
  </p>
  <p style="margin: 0.5em 0 0; font-size: 0.85em; color: rgba(255,255,255,0.35);">
    作者：不想秃头的呱呱 | 视频：B站 BV1dr1yBwEnr
  </p>
</div>
