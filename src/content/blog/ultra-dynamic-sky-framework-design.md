---
title: "UE || Ultra Dynamic Sky 源码拆解（一）：框架设计与更新机制"
description: "深入解析 Ultra Dynamic Sky 插件的框架设计、Sequence 并行执行架构、懒加载机制、优先级系统以及编辑器中的 Tick 模拟机制"
pubDate: "2026-01-25"
tags: ["Unreal Engine", "天空系统", "蓝图", "源码分析", "UDS", "插件"]
category: "游戏开发"
---

<style>
/* 文章专属样式 */
.uds-hero-banner {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 16px;
  padding: 2em;
  margin: 2em 0;
  position: relative;
  overflow: hidden;
}

.uds-hero-banner::before {
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

.info-box {
  background: rgba(99, 102, 241, 0.08);
  border-left: 4px solid #6366f1;
  border-radius: 8px;
  padding: 1.5em;
  margin: 1.5em 0;
}

.info-box.tip {
  background: rgba(34, 197, 94, 0.08);
  border-left-color: #22c55e;
}

.info-box.warning {
  background: rgba(251, 191, 36, 0.08);
  border-left-color: #fbbf24;
}

.info-box-title {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5em;
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.architecture-diagram {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 2em;
  margin: 2em 0;
  overflow-x: auto;
}

.architecture-diagram pre {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

.architecture-diagram pre::before,
.architecture-diagram pre::after {
  display: none !important;
}

.phase-badge {
  display: inline-block;
  padding: 0.25em 0.75em;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
  color: #a5b4fc;
  margin: 0 0.25em;
}

.priority-high {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.priority-low {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.data-flow {
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 1em;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  margin: 1em 0;
  flex-wrap: wrap;
}

.data-flow-arrow {
  color: rgba(99, 102, 241, 0.6);
  font-size: 1.2em;
}

.data-flow-item {
  padding: 0.5em 1em;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 6px;
  font-size: 0.9em;
  white-space: nowrap;
}

.comparison-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 2em 0;
  border-radius: 12px;
  overflow: hidden;
}

.comparison-table thead {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.15));
}

.comparison-table th {
  padding: 1em;
  text-align: left;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(99, 102, 241, 0.3);
}

.comparison-table td {
  padding: 1em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.comparison-table tbody tr:hover {
  background: rgba(99, 102, 241, 0.05);
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

.key-point {
  display: flex;
  align-items: flex-start;
  gap: 1em;
  padding: 1em;
  margin: 1em 0;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.key-point-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  font-weight: bold;
}

.code-comment {
  color: #6b7280;
  font-style: italic;
}
</style>

# UE || Ultra Dynamic Sky 源码拆解（一）：框架设计与更新机制

<div class="uds-hero-banner">
  <div style="display: flex; align-items: center; gap: 1em; margin-bottom: 1em;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #6366f1;">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      <path d="M2 12h20"/>
    </svg>
    <span style="font-size: 0.85em; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6);">源码分析系列</span>
  </div>
  <p style="margin: 0; font-size: 0.95em; color: rgba(255,255,255,0.7);">作者分析 | UE 5.x | Ultra Dynamic Sky</p>
</div>

---

## 目录

1. [引言](#引言)
2. [Construction Script 整体结构](#construction-script-整体结构)
3. [Sequence 并行执行架构](#sequence-并行执行架构)
4. [懒加载机制与资源管理](#懒加载机制与资源管理)
5. [优先级系统设计](#优先级系统设计)
6. [编辑器中的 Tick 模拟机制](#编辑器中的-tick-模拟机制)
7. [完整案例解析 - 2D Dynamic Clouds](#完整案例解析---2d-dynamic-clouds)
8. [总结与设计模式提炼](#总结与设计模式提炼)

---

## 引言

<div class="info-box">
  <div class="info-box-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
    关于本文
  </div>
  <p>Ultra Dynamic Sky (UDS) 是 Unreal Engine 中一款功能强大的天空系统插件。本文基于对 UDS 蓝图的反向工程，用 Python 伪代码还原其核心逻辑。</p>
</div>

现有的 UDS 教程大多停留在"参数调节"层面——告诉开发者这个滑块控制什么、那个开关有什么效果。但很少有人深入探讨：

**这些参数是如何组织和更新的？为什么插件能同时管理这么多参数而不卡顿？在编辑器中如何实现实时预览？**

本文重点讲解以下三个核心主题：

<div class="key-point">
  <div class="key-point-icon">1</div>
  <div>
    <strong>Sequence 并行组织</strong>
    <p style="margin: 0.25em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">如何组织复杂的初始化流程</p>
  </div>
</div>

<div class="key-point">
  <div class="key-point-icon">2</div>
  <div>
    <strong>懒加载机制</strong>
    <p style="margin: 0.25em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">如何优化资源管理</p>
  </div>
</div>

<div class="key-point">
  <div class="key-point-icon">3</div>
  <div>
    <strong>优先级系统</strong>
    <p style="margin: 0.25em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">如何在性能和效果之间取得平衡</p>
  </div>
</div>

同时，我们也会讲解 UDS 如何在编辑器中通过接口模拟 Tick——这是编写编辑器扩展的实用技巧。

<div class="section-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <path d="M9 3v18"/>
    <path d="M15 3v18"/>
  </svg>
</div>

## Construction Script 整体结构

### 什么是 Construction Script？

<div class="info-box">
  <div class="info-box-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
    Construction Script 执行时机
  </div>
  <ul style="margin: 0; padding-left: 1.5em;">
    <li>在编辑器中放置 Actor 时</li>
    <li>在编辑器中移动、修改 Actor 时</li>
    <li>游戏启动时（Actor 生成之前）</li>
  </ul>
</div>

UDS 的所有初始化工作都在 Construction Script 中完成。这意味着当你把 UDS Actor 拖进关卡的那一刻，所有的组件创建、资源加载、参数设置就已经完成了。

### UDS 的初始化流程

UDS 的 `Construction Script` 按顺序执行 <span class="phase-badge">Phase 1</span> 到 <span class="phase-badge">Phase 6</span>：

```python
def construction_script_function(self) -> None:
    """UDS 构造脚本主入口"""

    # ============================================================
    # Phase 1: 上下文和资源加载
    # ============================================================
    # 首先设置一个标记，告诉系统"需要刷新设置"
    self.refresh_settings = True

    # 然后加载所有必要的资源（材质、贴图、粒子系统等）
    # 这里使用了"懒加载"机制，后面会详细讲解
    self.load_required_assets()

    # ============================================================
    # Phase 2: 后处理组件创建
    # ============================================================
    # 后处理（Post Process）负责画面特效，如景深、光晕等
    # UDS 支持多个后处理 Stage，可以根据时间/天气动态启用
    self.create_post_process_components()

    # ============================================================
    # Phase 3: 天空球体和材质构造
    # ============================================================
    # 天空球体（Sky Sphere）是一个巨大的网格，包裹整个场景
    # 它的材质（Material Instance Dynamic）存储了天空的所有视觉参数
    self.construct_sky_sphere_and_material()

    # ============================================================
    # Phase 4: 雾和光照组件配置
    # ============================================================
    # 高度雾（Height Fog）：模拟雾气随高度的变化
    self.configure_height_fog_with_feature_toggle()

    # 太阳方向光（Directional Light）：模拟太阳光照
    self.configure_directional_light_with_feature_toggle(
        toggle=self.render_sun_directional_light,
        component_var=self.sun_light,
        atmospheric_index=0,  # 太阳使用索引 0
        parent=self.sun_parent
    )

    # 月亮方向光
    self.configure_directional_light_with_feature_toggle(
        toggle=self.render_moon_directional_light,
        component_var=self.moon_light,
        atmospheric_index=1,  # 月亮使用索引 1
        parent=self.moon_parent
    )

    # 天空光（Sky Light）：模拟环境光照
    self.configure_sky_light_with_feature_toggle()

    # ============================================================
    # Phase 5: 天气系统连接（UDW 联动）
    # ============================================================
    # UDS 可以与 Ultra Dynamic Weather（UDW）插件联动
    # 这里查找场景中的 UDW Actor 并建立连接
    self.get_udw_reference()

    # ============================================================
    # Phase 6: 更新流程初始化
    # ============================================================
    # 下面这些函数负责设置初始参数值和建立更新系统

    # 静态变量：不常变化的参数（如颜色配置）
    self.update_static_variables()

    # 公共导数：从基础参数派生的中间值（如太阳高度角）
    self.update_common_derivatives()

    # 缓存系统：用于检测参数变化的机制
    self.cache_properties()

    # 活动变量：需要每帧更新的参数
    self.update_active_variables()
```

### 关键设计思想

<div class="key-point">
  <div class="key-point-icon">1</div>
  <div>
    <strong>一次性设置</strong>
    <p style="margin: 0.25em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">所有初始化工作在构造时完成，避免运行时重复计算</p>
  </div>
</div>

<div class="key-point">
  <div class="key-point-icon">2</div>
  <div>
    <strong>Feature Toggle</strong>
    <p style="margin: 0.25em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">每个组件都支持开关控制，可以灵活启用/禁用</p>
  </div>
</div>

<div class="key-point">
  <div class="key-point-icon">3</div>
  <div>
    <strong>分层初始化</strong>
    <p style="margin: 0.25em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">从资源加载 → 组件创建 → 参数设置，层次清晰</p>
  </div>
</div>

---

<div class="section-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="8 3 4 8 8 13"/>
    <polyline points="16 3 20 8 16 13"/>
    <line x1="12" y1="3" x2="12" y2="13"/>
  </svg>
</div>

## Sequence 并行执行架构

### 什么是 Sequence？

<div class="info-box tip">
  <div class="info-box-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
    Sequence 两种用法
  </div>
  <div style="display: flex; gap: 2em; flex-wrap: wrap;">
    <div style="flex: 1; min-width: 200px;">
      <strong style="color: #a5b4fc;">顺序执行</strong>
      <p style="margin: 0.5em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">Then 0 → Then 1 → Then 2<br>（线性执行，有依赖）</p>
    </div>
    <div style="flex: 1; min-width: 200px;">
      <strong style="color: #86efac;">并行执行</strong>
      <p style="margin: 0.5em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">Then 0 和 Then 1 同时开始<br>（无依赖时）</p>
    </div>
  </div>
</div>

### UDS 中的两种 Sequence 模式

**模式 1：Construction Script 中的顺序 Phase**

在 Construction Script 中，Sequence 用于组织逻辑分块。每个 Phase 必须在前一个完成后才能开始，因为它们之间存在数据依赖。

**模式 2：Update Static Variables 中的并行分支**

<div class="architecture-diagram">
<pre style="font-family: 'Space Mono', 'Fira Code', monospace; font-size: 0.85em; line-height: 1.5; color: rgba(255,255,255,0.8);">
┌─────────────────────────────────────────────────────────────────┐
│                    update_static_variables()                     │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌─────────────────┐           ┌─────────────────┐
    │  Sequence.Then 0│           │  Sequence.Then 1│
    │   (粒子相关)     │           │   (渲染相关)     │
    └────────┬────────┘           └────────┬────────┘
             │                              │
    ┌────────┴────────┐           ┌────────┴────────┐
    │                 │           │                 │
    ▼                 ▼           ▼                 ▼
┌─────────┐    ┌─────────┐   ┌──────────┐    ┌─────────────┐
│  Rain   │    │  Snow   │   │Post-Proc │    │Material FX  │
│ (50+参数)│    │         │   │          │    │             │
└─────────┘    └─────────┘   └──────────┘    └─────────────┘
    │                 │               │
    ▼                 ▼               │
┌─────────┐    ┌─────────┐            │
│Lightning│    │Occlusion│            │
└─────────┘    └─────────┘            │
    │                                   │
    ▼                                   ▼
┌─────────┐                    ┌──────────────┐
│  Sound  │                    │     DLWE     │
└─────────┘                    └──────────────┘
</pre>
</div>

在 `update_static_variables()` 函数中，使用 Sequence 创建了两个并行的执行分支。

```python
def update_static_variables(self) -> None:
    """
    静态属性更新 - 展示 Sequence 并行执行

    这个函数设置所有天气系统的静态参数
    "静态"意味着这些参数不常变化，不需要每帧更新
    """

    # ============================================================
    # Sequence.Then 0: 分支 0 - 粒子相关
    # ============================================================
    # 这一条分支负责所有粒子系统的参数设置

    self.static_properties_shared_particles()  # 共享粒子参数
    # ↓
    self.static_properties_rain()              # 雨参数（50+ 个参数设置）
    # ↓
    self.static_properties_snow()              # 雪参数
    # ↓
    self.static_properties_lightning()         # 闪电参数
    # ↓
    self.static_properties_occlusion()         # 遮挡参数
    # ↓
    self.static_properties_sound_effects()     # 音效参数

    # ============================================================
    # Sequence.Then 1: 分支 1 - 渲染相关（与分支 0 并行）
    # ============================================================
    # 这一条分支负责渲染相关的参数设置
    # 它与分支 0 之间没有数据依赖，可以"并行"执行

    self.static_properties_post_processing()   # 后处理参数
    # ↓
    self.static_properties_material_effects()  # 材质效果参数
    # ↓
    self.static_properties_dlwe()              # DLWE 参数
```

### 为什么要这样设计？

<div class="key-point">
  <div class="key-point-icon">1</div>
  <div>
    <strong>无依赖任务可以并行</strong>
    <p style="margin: 0.25em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">后处理和雨粒子之间没有数据依赖，可同时执行</p>
  </div>
</div>

<div class="key-point">
  <div class="key-point-icon">2</div>
  <div>
    <strong>代码组织更清晰</strong>
    <p style="margin: 0.25em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">分支 0：粒子相关 | 分支 1：渲染相关</p>
  </div>
</div>

<div class="key-point">
  <div class="key-point-icon">3</div>
  <div>
    <strong>为未来优化预留空间</strong>
    <p style="margin: 0.25em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">未来可利用多线程蓝图执行</p>
  </div>
</div>

---

<div class="section-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
</div>

## 懒加载机制与资源管理

### 什么是懒加载？

<div class="info-box">
  <div class="info-box-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
    Lazy Loading（懒加载）
  </div>
  <p style="margin: 0;">一种设计模式：<strong>推迟资源的加载时机，直到真正需要时才加载</strong>。</p>
</div>

UDS 使用 Unreal Engine 的 **SoftObject** 类型来实现懒加载。

<div class="architecture-diagram" style="padding: 1.5em;">
<pre style="font-family: 'Space Mono', 'Fira Code', monospace; font-size: 0.8em; line-height: 1.6; color: rgba(255,255,255,0.8);">
┌─────────────────────────────────────────────────────────────────┐
│                      SoftObject 工作原理                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ SoftObject   │         │  实际资源     │                     │
│  │  (轻量引用)   │   ───▶  │  (重量资源)   │                     │
│  │              │         │              │                     │
│  │  只存储路径   │         │  完整资源数据  │                     │
│  │  不占用内存   │         │  占用大量内存  │                     │
│  │  可序列化     │         │  需要时加载   │                     │
│  └──────────────┘         └──────────────┘                     │
│                                                                 │
│  优势：                                                          │
│  • 启动快速 - 只加载路径字符串                                   │
│  • 内存友好 - 按需加载资源                                       │
│  • 灵活配置 - 可在编辑器中更改引用                                │
└─────────────────────────────────────────────────────────────────┘
</pre>
</div>

```python
class UltraDynamicSky:
    def __init__(self):
        # ============================================================
        # 存储 SoftObject 引用，不立即加载实际资源
        # ============================================================

        # 天空材质相关
        self.custom_sky_sphere_material: SoftObject = None
        self.sky_mid_parent_instances: dict = {}

        # 星星纹理
        self.real_stars_texture: SoftObject = None
        self.tiling_stars_texture: SoftObject = None

        # 体积云相关（多个质量等级的纹理）
        self.epic_quality_volume_texture: SoftObject = None
        self.high_quality_volume_texture: SoftObject = None
        self.low_quality_volume_texture: SoftObject = None

        # ... 更多资源引用（100+ 个）

        # ============================================================
        # 在 Construction Script 中统一触发加载
        # ============================================================
        self.load_required_assets()
```

### Sky MID Parent 的智能选择

`get_sky_mid_parent_material_instance()` 是懒加载的精彩应用。

```python
def get_sky_mid_parent_material_instance(self) -> Optional[object]:
    """
    获取天空材质父本 - 展示条件化的懒加载选择

    核心思想：
    1. 预先存储所有可能的材质父本引用（SoftObject）
    2. 根据当前配置拼接一个 key
    3. 从映射表中查找对应的材质
    """

    # ============================================================
    # 优先级 1: 用户自定义材质
    # ============================================================
    if self._is_valid(self.custom_sky_sphere_material):
        return self.custom_sky_sphere_material

    # ============================================================
    # 优先级 2: 从映射表查找
    # ============================================================
    key = self._build_sky_mid_key()

    # Key 示例：
    # - "VolumetricClouds_False_False_SkyAtmosphere"
    #   （体积云，不使用极光，多层云，天空大气颜色模式）
    # - "StaticClouds_True_True_SimplifiedColor"
    #   （静态云，使用极光，单层云，简化颜色模式）

    return self.sky_mid_parent_instances.get(key)
```

---

<div class="section-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2v20M2 12h20"/>
    <path d="m12 2 4 4M12 2 8 4M12 22l-4-4M12 22l4-4M2 12l4-4M2 12l4 4M22 12l-4-4M22 12l4 4"/>
  </svg>
</div>

## 优先级系统设计

### 问题的提出

<div class="info-box warning">
  <div class="info-box-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    性能挑战
  </div>
  <p style="margin: 0;">UDS 需要管理<strong>数百个参数</strong>，如果每帧都更新所有参数，CPU 开销会非常大。</p>
</div>

### 核心思想：不是所有参数都同等重要

UDS 的设计基于一个观察：<strong>人对某些视觉变化更敏感，对某些变化不那么敏感</strong>。

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5em; margin: 2em 0;">
  <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 1.5em;">
    <div style="display: flex; align-items: center; gap: 0.75em; margin-bottom: 1em;">
      <span class="phase-badge priority-high">高优先级</span>
      <span style="font-size: 0.85em; color: rgba(255,255,255,0.6);">人眼敏感</span>
    </div>
    <ul style="margin: 0; padding-left: 1.5em; font-size: 0.9em; color: rgba(255,255,255,0.8);">
      <li>太阳/月亮位置</li>
      <li>光照强度</li>
      <li>云密度</li>
      <li>雾的颜色和密度</li>
    </ul>
  </div>

  <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; padding: 1.5em;">
    <div style="display: flex; align-items: center; gap: 0.75em; margin-bottom: 1em;">
      <span class="phase-badge priority-low">低优先级</span>
      <span style="font-size: 0.85em; color: rgba(255,255,255,0.6);">人眼不敏感</span>
    </div>
    <ul style="margin: 0; padding-left: 1.5em; font-size: 0.9em; color: rgba(255,255,255,0.8);">
      <li>月亮纹理细节</li>
      <li>星星方向</li>
      <li>雾的高度衰减</li>
      <li>太阳光源角度</li>
    </ul>
  </div>
</div>

### Active_Update_Speed：更新速度控制器

UDS 提供了一个全局控制器 `Active_Update_Speed`（0-4），让用户或系统动态调整更新频率。

<table class="comparison-table">
<thead>
<tr>
<th>Speed</th>
<th>含义</th>
<th>高优先级更新</th>
<th>低优先级更新</th>
<th>适用场景</th>
</tr>
</thead>
<tbody>
<tr>
<td><span class="phase-badge">0</span></td>
<td>最低</td>
<td>每 4 帧更新 1 步</td>
<td>每 9 帧更新 1 步</td>
<td>静态场景、截图</td>
</tr>
<tr>
<td><span class="phase-badge">1</span></td>
<td>低</td>
<td>每 4 帧更新 1 步</td>
<td>每 9 帧更新 1 步</td>
<td>低端设备</td>
</tr>
<tr>
<td><span class="phase-badge">2</span></td>
<td>中</td>
<td>每 2 帧更新 2 步</td>
<td>每 9 帧更新 2 步</td>
<td>正常游戏</td>
</tr>
<tr>
<td><span class="phase-badge">3</span></td>
<td>高</td>
<td>每 1 帧更新 4 步</td>
<td>每 9 帧更新 3 步</td>
<td>快速时间流逝</td>
</tr>
<tr>
<td><span class="phase-badge priority-high">4</span></td>
<td>最高</td>
<td>每 1 帧更新 4 步</td>
<td>每 1 帧更新全部 9 步</td>
<td>影片级质量</td>
</tr>
</tbody>
</table>

### 高优先级：Step Dispatcher

<div class="architecture-diagram" style="padding: 1.5em;">
<pre style="font-family: 'Space Mono', 'Fira Code', monospace; font-size: 0.8em; line-height: 1.6; color: rgba(255,255,255,0.8);">
┌─────────────────────────────────────────────────────────────────┐
│                  高优先级 Step Dispatcher                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Active_Update_Speed (0-4)                                     │
│         │                                                       │
│         ▼                                                       │
│   ┌─────────────────┐                                          │
│   │  Step Dispatcher │                                          │
│   │   (步骤分发器)    │                                          │
│   └────────┬────────┘                                          │
│            │                                                   │
│     ┌──────┴──────┬──────────────┬──────────────┐              │
│     │             │              │              │              │
│     ▼             ▼              ▼              ▼              │
│  ┌─────┐      ┌─────┐       ┌─────┐       ┌─────┐            │
│  │Step0│      │Step1│       │Step2│       │Step3│            │
│  │天体 │      │光束 │       │雾   │       │云   │            │
│  │位置 │      │强度 │       │参数 │       │密度 │            │
│  └─────┘      └─────┘       └─────┘       └─────┘            │
│                                                                 │
│   Speed 0-1: 每帧执行 1 步 (轮流)                                │
│   Speed 2:   每帧执行 1-2 步                                    │
│   Speed 3-4: 每帧执行全部 4 步                                   │
└─────────────────────────────────────────────────────────────────┘
</pre>
</div>

高优先级更新使用了一个巧妙的"步骤分发器"（Step Dispatcher）：

```python
def _update_hp_step_dispatcher(uds) -> None:
    """
    高优先级步骤分发器

    核心思想：将高优先级参数分为 4 个步骤（Step 0-3）
    每次更新执行其中的 1-4 步，由 Active_Update_Speed 决定
    """

    speed = int(uds.Active_Update_Speed)
    step = int(uds.high_priority_update_step) % 4  # 当前步骤

    # ============================================================
    # Speed 0-1：最低优先级
    # ============================================================
    # 每帧只执行 1 步，轮流执行 Step 0 → 1 → 2 → 3 → 0 ...
    if speed in (0, 1):
        run_step(step)
        uds.high_priority_update_step = (step + 1) % 4

    # ============================================================
    # Speed 3-4：最高优先级
    # ============================================================
    # 每帧执行全部 4 步
    elif speed in (3, 4):
        for i in range(4):
            run_step(i)
        uds.high_priority_update_step = 0
```

**4 个高优先级步骤的内容**：

| Step | 内容                      | 说明                              |
| ---- | ------------------------- | --------------------------------- |
| 0    | 天体位置                  | 太阳/月亮位置、光源方向、星星轨道 |
| 1    | 体积云光束 + 天空材质强度 | 光束效果、整体亮度                |
| 2    | 雾参数                    | 雾颜色、密度、不透明度            |
| 3    | 云覆盖                    | 云密度、双层云                    |

### 低优先级：9 步轮转系统

低优先级更新使用了一个"9 步轮转"系统：

| Step | 内容                         | 为什么低优先级 |
| ---- | ---------------------------- | -------------- |
| 0    | 云阴影取消、星星方向         | 视觉变化缓慢   |
| 1    | 月亮 Scale、Phase、Intensity | 月亮移动慢     |
| 2    | 路径追踪雾、空间层亮度       | 次要效果       |
| 3    | 天空材质参数                 | 视觉不敏感     |
| 4    | 雾参数（高度衰减）           | 次要雾参数     |
| 5    | 太阳光源角度、阴影开关       | 光源角度变化慢 |
| 6    | 月亮光阴影、光源角度         | 月亮移动慢     |
| 7    | 颜色模式切换                 | 不常切换       |
| 8    | Sky Mode 相关更新            | 模式特定更新   |

---

<div class="section-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
</div>

## 编辑器中的 Tick 模拟机制

### 问题的提出

<div class="info-box warning">
  <div class="info-box-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    编辑器 Tick 限制
  </div>
  <p style="margin: 0;">Unreal Engine 的 Actor Tick 函数<strong>只在游戏运行时工作</strong>，编辑器中不会自动调用。</p>
</div>

在编辑器环境中：

- ❌ 放置 Actor 时不会调用 Tick
- ❌ 移动 Actor 时不会调用 Tick
- ❌ 修改参数时不会调用 Tick

这对 UDS 来说是个问题，因为用户希望**实时预览**参数调整的效果。

<div class="data-flow">
  <span class="data-flow-item">问题</span>
  <span class="data-flow-arrow">→</span>
  <span class="data-flow-item">Tick 不工作</span>
  <span class="data-flow-arrow">→</span>
  <span class="data-flow-item">无法实时预览</span>
  <span class="data-flow-arrow">→</span>
  <span class="data-flow-item" style="background: rgba(34, 197, 94, 0.2); border-color: rgba(34, 197, 94, 0.3);">Timer 模拟方案</span>
</div>

### 解决方案：接口 + Timer

UDS 使用了一个巧妙的设计：创建一个独立的 Handler 对象，用 UE 的 Timer 系统模拟 Tick。

```python
# ============================================================
# 接口定义 - 解耦 Handler 和 UDS
# ============================================================
class UDSEditorTickInterface:
    """UDS Editor Tick 接口"""
    def start_tick_timer(self, uds: "UltraDynamicSky") -> None:
        """启动 Tick 定时器"""
        raise NotImplementedError

# ============================================================
# 实现类 - 编辑器 Tick 处理器
# ============================================================
class UDSEditorTickHandler(UDSEditorTickInterface):
    """编辑器 Tick 处理器"""
    def __init__(self):
        self.UDS: Optional["UltraDynamicSky"] = None
        self.Ticks: int = 0
```

### Handler 的核心：Tick 模拟

```python
def set_timer(self) -> None:
    """
    设置 Timer - 模拟 Tick 的核心

    关键设计: 防止重复挂载 Timer
    """
    # 先清除已有的 Timer（防止重复）
    clear_timer_by_function_name(obj=self, function_name="Tick")

    # 设置下一帧的 Timer
    set_timer_by_function_name(
        obj=self,
        function_name="Tick",
        delay=0.0  # 下一帧立即执行
    )

def tick(self) -> None:
    """Tick - 编辑器中每帧调用"""
    uds = self.UDS
    if uds is None:
        return

    # ============================================================
    # 关键机制：续命
    # ============================================================
    # 只有当前 Handler 仍然是 UDS 的活跃 Handler 时，
    # 才设置下一帧的 Timer（续命）
    if uds.editor_tick_handler == self:
        self.set_timer()  # 续命：设置下一帧的 Tick
    else:
        return  # 已被替换，停止 Tick

    # 调用 UDS 的编辑器更新
    uds.editor_tick(...)
```

### 完整的数据流

<div class="architecture-diagram" style="padding: 1.5em;">
<pre style="font-family: 'Space Mono', 'Fira Code', monospace; font-size: 0.75em; line-height: 1.5; color: rgba(255,255,255,0.8);">
┌─────────────────────────────────────────────────────────────────┐
│                  编辑器 Tick 模拟完整流程                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                          │
│  │ Construction Script│                                         │
│  └────────┬─────────┘                                          │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────────┐                                      │
│  │ start_editor_tick    │                                      │
│  │   _handler()         │                                      │
│  └────────┬─────────────┘                                      │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────────┐     ┌──────────────────┐            │
│  │   检查编辑器条件       │ ──▶ │  创建/复用 Handler │            │
│  └──────────────────────┘     └────────┬─────────┘            │
│                                          │                     │
│                                          ▼                     │
│                                   ┌──────────────┐             │
│                                   │ handler.start │             │
│                                   │ _tick_timer() │             │
│                                   └──────┬───────┘             │
│                                          │                     │
│           ┌──────────────────────────────┼────────────┐       │
│           │                              │            │       │
│           ▼                              ▼            ▼       │
│    ┌──────────┐                  ┌──────────┐  ┌──────────┐  │
│    │set_timer │                  │   下一帧  │  │ tick()   │  │
│    │          │                  │  被调用   │  │          │  │
│    └────┬─────┘                  └─────┬────┘  └────┬─────┘  │
│         │                              │              │        │
│         │                              ▼              │        │
│         │                       ┌──────────────┐      │        │
│         │                       │ 续命检查     │      │        │
│         │                       │仍是活跃?     │      │        │
│         │                       └──────┬───────┘      │        │
│         │                              │              │        │
│         │                    ┌─────────┴─────────┐  │        │
│         │                    │                   │  │        │
│         │                  Yes                  No  │        │
│         │                    │                   │  │        │
│         │                    ▼                   ▼  │        │
│         │              ┌──────────┐         ┌────────┐ │        │
│         │              │set_timer │         │ 停止   │ │        │
│         │              │(续命)    │         │ Tick   │ │        │
│         │              └─────┬────┘         └────────┘ │        │
│         │                    │                          │        │
│         └────────────────────┼──────────────────────────┘        │
│                              │                                   │
│                              ▼                                   │
│                       ┌──────────────┐                          │
│                       │ uds.editor   │                          │
│                       │    _tick()   │                          │
│                       └──────────────┘                          │
│                              │                                   │
│                              ▼                                   │
│                       ┌──────────────┐                          │
│                       │  循环继续...  │                          │
│                       └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
</pre>
</div>

### 关键机制：续命

<div class="info-box tip">
  <div class="info-box-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
    续命机制
  </div>
  <p style="margin: 0;">每次 Tick 时检查自己是否还是"当前"的 Handler，如果是则设置下一帧的 Timer（续命），否则停止 Tick。</p>
</div>

---

<div class="section-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
</div>

## 完整案例解析 - 2D Dynamic Clouds

<div class="info-box">
  <div class="info-box-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
    2D Dynamic Clouds
  </div>
  <p style="margin: 0;">以 <strong>2D Dynamic Clouds</strong> 为例，完整展示一个 Sky Mode 的更新流程。</p>
</div>

### 2D Dynamic Clouds 在更新系统中的位置

2D Dynamic Clouds 的更新在**低优先级 Step 8** 中执行：

```python
def _update_lp_step_8(uds) -> None:
    """低优先级 Step 8 - Sky Mode Switch"""
    sky_mode = getattr(uds, "Sky_Mode", None)

    if sky_mode == "2D Dynamic Clouds":
        _update_lp_step_8_2d_dynamic_clouds(uds)
```

### 2D Dynamic Clouds 的参数体系

```python
def _update_lp_step_8_2d_dynamic_clouds(uds) -> None:
    """低优先级 Step 8 - 2D Dynamic Clouds 分支"""
    sky_mid = getattr(uds, "Sky_Sphere_MID", None)
    if sky_mid is None:
        return

    # ============================================================
    # Part 1: 2D Cloud Tint（条件更新）
    # ============================================================
    local_cov_changed = _is_cached_value_changing(uds, "Local Cloud Coverage")

    if local_cov_changed:
        tint = _current_2d_cloud_tint(uds)
        sky_mid.set_vector_parameter_value("2D Cloud Tint", tint)

    # ============================================================
    # Part 2: Cloud Light Color Multiplier
    # ============================================================
    cloud_coverage = float(getattr(uds, "Cloud_Coverage_0_3", 0.0))

    # 云量越大，光照乘数越高
    cloud_light_mul = _map_range_clamped(
        cloud_coverage,  # 输入: 云量 0-3
        1.75, 2.5,       # 输入范围
        1.0, 3.0         # 输出范围: 光照乘数
    )
    sky_mid.set_scalar_parameter_value(
        "Cloud Light Color Multiplier",
        cloud_light_mul
    )

    # ============================================================
    # Part 3: Cache Group Gate
    # ============================================================
    if not _cache_group_gate(uds, "2D Clouds"):
        return  # 跳过剩余更新

    # ============================================================
    # Part 4: 核心参数更新（通过缓存门控）
    # ============================================================
    shine_intensity = float(_get_cached_float(uds, "Shine Intensity"))
    sky_mid.set_scalar_parameter_value("Shine Intensity", shine_intensity)

    sun_highlight_radius = float(_get_cached_float(uds, "Sun Highlight Radius"))
    sky_mid.set_scalar_parameter_value("Sun Highlight Radius", sun_highlight_radius)
```

### 2D Dynamic Clouds 的完整参数列表

| 参数                           | 类型    | 来源     | 说明                           |
| ------------------------------ | ------- | -------- | ------------------------------ |
| `2D Cloud Tint`                | Vector3 | 条件计算 | 云的颜色，根据天气条件动态计算 |
| `Cloud Light Color Multiplier` | Float   | 云量映射 | 云量越大，光照越强 (1.0-3.0)   |
| `Shine Intensity`              | Float   | 缓存     | 云的高光强度                   |
| `Sun Highlight Radius`         | Float   | 缓存     | 太阳高光在云上的扩散半径       |
| `Sun Highlight Intensity`      | Float   | 缓存     | 太阳高光的亮度                 |
| `Shading Offset Vector`        | Vector3 | 缓存     | 阴影偏移，用于云的立体感       |

---

<div class="section-divider">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
</div>

## 总结与设计模式提炼

### 三大核心机制回顾

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5em; margin: 2em 0;">
  <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05)); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 1.5em;">
    <div style="display: flex; align-items: center; gap: 0.75em; margin-bottom: 1em;">
      <span style="font-size: 1.5em;">🔗</span>
      <strong style="color: var(--color-text-primary);">Sequence 并行组织</strong>
    </div>
    <ul style="margin: 0; padding-left: 1.5em; font-size: 0.9em; color: rgba(255,255,255,0.8);">
      <li>无依赖任务可并行</li>
      <li>代码结构清晰</li>
      <li>为未来优化预留空间</li>
    </ul>
  </div>

  <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05)); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 12px; padding: 1.5em;">
    <div style="display: flex; align-items: center; gap: 0.75em; margin-bottom: 1em;">
      <span style="font-size: 1.5em;">⏳</span>
      <strong style="color: var(--color-text-primary);">懒加载机制</strong>
    </div>
    <ul style="margin: 0; padding-left: 1.5em; font-size: 0.9em; color: rgba(255,255,255,0.8);">
      <li>启动只加载路径</li>
      <li>按需选择资源</li>
      <li>编辑器灵活配置</li>
    </ul>
  </div>

  <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05)); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; padding: 1.5em;">
    <div style="display: flex; align-items: center; gap: 0.75em; margin-bottom: 1em;">
      <span style="font-size: 1.5em;">⚡</span>
      <strong style="color: var(--color-text-primary);">优先级系统</strong>
    </div>
    <ul style="margin: 0; padding-left: 1.5em; font-size: 0.9em; color: rgba(255,255,255,0.8);">
      <li>CPU 分配给关键参数</li>
      <li>性能效果平衡</li>
      <li>动态调整能力</li>
    </ul>
  </div>
</div>

### 可复用的设计模式

<div class="key-point">
  <div class="key-point-icon">1</div>
  <div>
    <strong>Feature Toggle（功能开关）</strong>
    <p style="margin: 0.25em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">支持内置组件 / 自定义 Actor / 完全禁用</p>
  </div>
</div>

<div class="key-point">
  <div class="key-point-icon">2</div>
  <div>
    <strong>缓存 + 变化检测</strong>
    <p style="margin: 0.25em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">减少 GPU 通信，只在变化时更新</p>
  </div>
</div>

<div class="key-point">
  <div class="key-point-icon">3</div>
  <div>
    <strong>步骤轮转（Step Rotation）</strong>
    <p style="margin: 0.25em 0 0; font-size: 0.9em; color: rgba(255,255,255,0.6);">将次要参数分散，平滑分布 CPU 负载</p>
  </div>
</div>

### 设计权衡

<table class="comparison-table">
<thead>
<tr>
<th>设计选择</th>
<th>优势</th>
<th>代价</th>
</tr>
</thead>
<tbody>
<tr>
<td>蓝图实现</td>
<td>易于扩展、编辑器友好</td>
<td>性能不如 C++</td>
</tr>
<tr>
<td>缓存系统</td>
<td>减少 GPU 通信</td>
<td>内存开销</td>
</tr>
<tr>
<td>优先级更新</td>
<td>平衡性能效果</td>
<td>实现复杂度高</td>
</tr>
<tr>
<td>SoftObject 引用</td>
<td>灵活配置</td>
<td>需要加载管理</td>
</tr>
<tr>
<td>Timer 模拟 Tick</td>
<td>编辑器可用</td>
<td>需要手动管理</td>
</tr>
</tbody>
</table>

### 给读者的启示

<div class="data-flow" style="flex-wrap: wrap;">
  <span class="data-flow-item">🏗️ 架构先行</span>
  <span class="data-flow-item">⚡ 性能意识</span>
  <span class="data-flow-item">📝 可维护性</span>
  <span class="data-flow-item">⚖️ 灵活性 vs 简单性</span>
</div>

### 后续探索方向

<div class="info-box">
  <div class="info-box-title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
    </svg>
    下一期预告
  </div>
  <ul style="margin: 0.5em 0 0; padding-left: 1.5em;">
    <li>Sky Atmosphere 的物理计算</li>
    <li>Volumetric Clouds 的体积渲染</li>
    <li>时间系统的实现</li>
    <li>与天气系统的联动</li>
  </ul>
</div>

---

<div style="text-align: center; padding: 3em 0; margin-top: 3em;">
  <p style="font-size: 0.9em; color: rgba(255,255,255,0.4); margin: 0;">
    感谢阅读 · UE || Ultra Dynamic Sky 源码拆解（一）
  </p>
  <div style="display: flex; align-items: center; justify-content: center; gap: 1em; margin-top: 1em;">
    <span style="width: 40px; height: 1px; background: rgba(99, 102, 241, 0.3);"></span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(99, 102, 241, 0.5)" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      <path d="M2 12h20"/>
    </svg>
    <span style="width: 40px; height: 1px; background: rgba(99, 102, 241, 0.3);"></span>
  </div>
</div>
