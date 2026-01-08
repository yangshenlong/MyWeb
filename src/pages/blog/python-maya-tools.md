---
title: 'Python + Maya：自动化工具开发实践'
description: '分享使用 Python 和 Maya API 开发自动化工具的经验，包括 UI 设计、性能优化和工作流改进。'
date: 2024-01-05
category: '工具开发'
tags: ['Python', 'Maya API', 'PyQt', '工具开发', '工作流']
---

# Python + Maya：自动化工具开发实践

作为一名技术美术，开发自动化工具是提升团队效率的重要手段。本文分享我在 Maya 工具开发中的一些实践经验。

## 开发环境搭建

### 基础配置

```python
# Maya Python 路径配置
import sys
import os

# 添加工具路径
tool_path = os.path.join(os.path.dirname(__file__), 'tools')
if tool_path not in sys.path:
    sys.path.append(tool_path)

# 导入 Maya API
import maya.cmds as cmds
import maya.api.OpenMaya as om
```

### PyQt 界面框架

```python
from PySide2 import QtWidgets, QtCore, QtGui

class BaseToolWindow(QtWidgets.QMainWindow):
    """基础工具窗口类"""

    def __init__(self, parent=None):
        super(BaseToolWindow, self).__init__(parent)
        self.setup_ui()
        self.setup_connections()

    def setup_ui(self):
        """设置 UI"""
        self.setWindowTitle('My Tool')
        self.setMinimumSize(400, 300)

        # 创建中央部件
        central_widget = QtWidgets.QWidget()
        self.setCentralWidget(central_widget)

        # 主布局
        main_layout = QtWidgets.QVBoxLayout(central_widget)

        # 添加控件
        self.create_widgets(main_layout)

    def setup_connections(self):
        """设置信号连接"""
        pass

    def create_widgets(self, layout):
        """创建控件"""
        pass
```

## 常用功能实现

### 1. 选择集管理

```python
class SelectionManager:
    """选择集管理器"""

    @staticmethod
    def get_selected_objects():
        """获取当前选中的对象"""
        selection = cmds.ls(selection=True, long=True)
        return selection

    @staticmethod
    def filter_by_type(obj_type):
        """按类型过滤选择"""
        return cmds.ls(selection=True, type=obj_type)

    @staticmethod
    def save_selection(name):
        """保存选择集"""
        selection = cmds.ls(selection=True)
        if selection:
            cmds.sets(selection, name=name)
            print(f'Saved selection: {name}')

    @staticmethod
    def load_selection(name):
        """加载选择集"""
        if cmds.objExists(name):
            cmds.select(name)
        else:
            cmds.warning(f'Selection set "{name}" not found')
```

### 2. 批量重命名

```python
class BatchRenamer:
    """批量重命名工具"""

    def __init__(self):
        self.pattern = '{prefix}_{index:03d}_{suffix}'
        self.start_index = 1

    def rename_objects(self, objects, prefix, suffix=''):
        """批量重命名对象"""
        for i, obj in enumerate(objects, start=self.start_index):
            new_name = self.pattern.format(
                prefix=prefix,
                index=i,
                suffix=suffix
            )
            cmds.rename(obj, new_name)
            print(f'Renamed: {obj} -> {new_name}')

    def rename_hierarchy(self, root_object, prefix):
        """重命名层级结构"""
        all_children = cmds.listRelatives(
            root_object,
            allDescendents=True,
            fullPath=True
        ) or []

        # 按层级排序
        sorted_children = sorted(
            all_children,
            key=lambda x: x.count('|')
        )

        self.rename_objects(sorted_children, prefix)
```

### 3. UV 自动展开

```python
import maya.cmds as cmds

class AutoUVTool:
    """自动 UV 展开工具"""

    def __init__(self):
        self.shell_padding = 0.02
        self.island_padding = 0.02

    def unfold_selected(self):
        """展开选中对象的 UV"""
        selection = cmds.ls(selection=True)

        if not selection:
            cmds.warning('请先选择对象')
            return

        # 转换到多边形
        cmds.polyMultiPlaneUV(
            selection,
            projectionType=1,  # Planar
            insertBeforeDeformers=True
        )

        # 自动布局
        cmds.u3dLayout(
            selection,
            scale=self.shell_padding,
            spacing=self.island_padding
        )

        # 优化 UV
        cmds.u3dOptimize(
            selection,
            borderIntersection=True
        )

    def organize_uv_islands(self):
        """组织 UV 岛屿"""
        selection = cmds.ls(selection=True)

        # 检测 UV 岛屿
        uv_islands = cmds.polyEvaluate(
            selection,
            uvShellIds=True
        )

        # 按面积排序
        island_areas = []
        for island in uv_islands:
            area = cmds.polyEvaluate(
                selection,
                uvArea=island
            )
            island_areas.append((island, area))

        # 从大到小排列
        island_areas.sort(key=lambda x: x[1], reverse=True)
```

## 性能优化技巧

### 1. 使用 Maya API 2.0

```python
# 旧 API（较慢）
import maya.cmds as cmds
vertices = cmds.ls('*.vtx[*]', flatten=True)

# 新 API（更快）
import maya.api.OpenMaya as om
sel = om.MSelectionList()
sel.add('pCube1')
dag_path = sel.getDagPath(0)
mesh_fn = om.MFnMesh(dag_path)
vertices = mesh_fn.getPoints(om.MSpace.kObject)
```

### 2. 批量操作

```python
# 不好的做法：逐个操作
for obj in objects:
    cmds.setAttr(f'{obj}.visibility', False)

# 好的做法：批量操作
cmds.setAttr(
    [f'{obj}.visibility' for obj in objects],
    *[False] * len(objects)
)
```

### 3. 撤销状态控制

```python
# 暂停撤销记录以提升性能
cmds.undoInfo(openChunk=True)
try:
    # 执行大量操作
    for i in range(1000):
        create_cube()
finally:
    cmds.undoInfo(closeChunk=True)
```

## 工具打包与分发

### 创建 Shelf 按钮

```python
def add_to_shelf():
    """添加到工具架"""
    shelf_name = 'CustomTools'

    # 创建工具架
    if not cmds.shelfLayout(shelf_name, exists=True):
        cmds.shelfLayout(shelf_name, p='ShelfLayout')

    # 添加按钮
    cmds.shelfButton(
        parent=shelf_name,
        label='Auto UV',
        image='UV_icon.png',
        command='import my_tools; my_tools.AutoUVTool().unfold_selected()',
        annotation='自动展开 UV'
    )
```

### 插件注册

```python
# Maya 启动时自动加载
def initialize_plugin(plugin):
    """插件初始化"""
    vendor = 'YourName'
    version = '1.0.0'

    cmds.loadPlugin(
        plugin,
        displayDependencies=True
    )

    # 注册菜单
    cmds.menuItem(
        parent='MayaWindow',
        label='My Tools',
        subMenu=True,
        tearOff=True
    )

def uninitialize_plugin(plugin):
    """插件卸载"""
    # 清理资源
    pass
```

## 最佳实践

1. **错误处理**
   - 使用 try-except 捕获异常
   - 提供清晰的错误信息
   - 记录操作日志

2. **用户反馈**
   - 使用进度条显示长时间操作
   - 提供操作确认对话框
   - 实现撤销功能

3. **代码组织**
   - 模块化设计
   - 遵循 PEP 8 编码规范
   - 编写文档字符串

4. **性能意识**
   - 减少 Maya 命令调用
   - 使用合适的数据结构
   - 避免不必要的 UI 更新

通过这些实践，可以开发出高效、稳定的 Maya 自动化工具，大幅提升团队工作效率。
