
# Pacman AI Project

本项目基于 UC Berkeley 的 Pacman AI 教学项目，旨在实现智能体（Agent）在迷宫中吃豆、避鬼和追捕幽灵的能力。

## 1. 项目内容

* 实现了 **ReflexAgent**、**MinimaxAgent**、**AlphaBetaAgent** 等多种智能体。
* 升级了评价函数 `betterEvaluationFunction`，考虑食物、胶囊、鬼状态、安全路径、左右夹击、死角及平稳移动。
* 支持命令行运行指定局数、地图布局、智能体类型、鬼数量及各种参数。

---

## 2. 智能体与评价函数

### AlphaBetaAgent 特性

* 使用 **Alpha-Beta 剪枝**，提高搜索效率。
* 结合 `betterEvaluationFunction` 评估状态。
* 避免走入死路、两侧被鬼夹击的危险区域。
* 鼓励顺畅移动，降低横跳或停滞行为。

### betterEvaluationFunction 功能

* 考虑最近食物距离和剩余食物数。
* 考虑胶囊距离和剩余数量。
* 考虑鬼的位置及其 `scaredTimer`。
* 判断左右方向是否被鬼堵住。
* BFS 计算安全路径长度，避免死路。
* 鼓励平稳移动，避免横跳。

---

## 3. 测试方法

可以使用命令行参数运行多局测试，例如运行 50 局：

```bash
python pacman.py -p AlphaBetaAgent -l mediumClassic -n 50 --textGraphics
```

示例输出（部分）：

```
Pacman died! Score: 611
Pacman emerges victorious! Score: 1419
...
Average Score: 1328.84
Win Rate:      41/50 (0.82)
```

> 测试结果说明：
>
> * 在 50 局测试中，平均得分约 1328.84
> * 胜率约 82%

你可以将这些结果保存到 `test_results.txt`，便于记录和分析。

---

## 4. 可调参数说明

| 参数         | 选项                          | 变量名               | 类型    | 默认值             | 说明                                           |
| ---------- | --------------------------- | ----------------- | ----- | --------------- | -------------------------------------------- |
| 游戏局数       | `-n`, `--numGames`          | `numGames`        | int   | 1               | 设置要运行的游戏局数                                   |
| 布局文件       | `-l`, `--layout`            | `layout`          | str   | `mediumClassic` | 选择地图布局文件                                     |
| Pacman 智能体 | `-p`, `--pacman`            | `pacman`          | str   | `KeyboardAgent` | 选择使用的 Pacman Agent 类型                        |
| 文本输出       | `-t`, `--textGraphics`      | `textGraphics`    | bool  | False           | 以文本方式显示游戏输出                                  |
| 安静模式       | `-q`, `--quietTextGraphics` | `quietGraphics`   | bool  | False           | 生成最小输出且不显示图形界面                               |
| 鬼智能体       | `-g`, `--ghosts`            | `ghost`           | str   | `RandomGhost`   | 选择 Ghost Agent 类型                            |
| 鬼数量        | `-k`, `--numghosts`         | `numGhosts`       | int   | 4               | 设置最多鬼的数量                                     |
| 图形缩放       | `-z`, `--zoom`              | `zoom`            | float | 1.0             | 缩放图形窗口大小                                     |
| 固定随机种子     | `-f`, `--fixRandomSeed`     | `fixRandomSeed`   | bool  | False           | 固定随机种子，每次运行相同游戏                              |
| 记录动作       | `-r`, `--recordActions`     | `record`          | bool  | False           | 将游戏历史写入文件（按时间命名）                             |
| 回放游戏       | `--replay`                  | `gameToReplay`    | str   | None            | 回放已记录的游戏文件（pickle）                           |
| 智能体参数      | `-a`, `--agentArgs`         | `agentArgs`       | str   | None            | 传入 Agent 的参数，例如 `"opt1=val1,opt2,opt3=val3"` |
| 训练局数       | `-x`, `--numTraining`       | `numTraining`     | int   | 0               | 训练回合数（抑制输出）                                  |
| 帧间隔时间      | `--frameTime`               | `frameTime`       | float | 0.1             | 帧之间延迟时间；<0 表示键盘控制                            |
| 异常捕获       | `-c`, `--catchExceptions`   | `catchExceptions` | bool  | False           | 打开异常处理和超时检测                                  |
| 超时时间       | `--timeout`                 | `timeout`         | int   | 30              | 单局游戏中智能体最大计算时间（秒）                            |

---

## 5. 示例命令

* 运行 50 局 `AlphaBetaAgent`，文本模式：

```bash
python pacman.py -p AlphaBetaAgent -l mediumClassic -n 50 --textGraphics
```

* 固定随机种子，回放游戏：

```bash
python pacman.py -p MinimaxAgent -l smallClassic -n 1 -f --replay game_20251122.pkl
```

* 训练模式 10 局，安静模式：

```bash
python pacman.py -p ReflexAgent -n 10 -x 10 --quietTextGraphics
```

---

## 6. 结果记录

建议将 50 局测试的结果保存到 `test_results.txt`：

```
Pacman died! Score: 611
Pacman emerges victorious! Score: 1419
...
Average Score: 1328.84
Win Rate: 41/50 (0.82)
```

这些数据可用于后续分析和评价函数优化。

