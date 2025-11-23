# multiAgents.py
# --------------
# Licensing Information:  You are free to use or extend these projects for
# educational purposes provided that (1) you do not distribute or publish
# solutions, (2) you retain this notice, and (3) you provide clear
# attribution to UC Berkeley, including a link to http://ai.berkeley.edu.
# 
# Attribution Information: The Pacman AI projects were developed at UC Berkeley.
# The core projects and autograders were primarily created by John DeNero
# (denero@cs.berkeley.edu) and Dan Klein (klein@cs.berkeley.edu).
# Student side autograding was added by Brad Miller, Nick Hay, and
# Pieter Abbeel (pabbeel@cs.berkeley.edu).


from util import manhattanDistance
from game import Directions
import random, util
from game import Agent


class ReflexAgent(Agent):
    """
    A reflex agent chooses an action at each choice point by examining
    its alternatives via a state evaluation function.

    The code below is provided as a guide.  You are welcome to change
    it in any way you see fit, so long as you don't touch our method
    headers.
    """

    def getAction(self, gameState):
        """
        You do not need to change this method, but you're welcome to.

        getAction chooses among the best options according to the evaluation function.

        getAction takes a GameState and returns some Directions.X for some X in the set {NORTH, SOUTH, WEST, EAST, STOP}
        """
        # Collect legal moves and successor states
        legalMoves = gameState.getLegalActions()

        # Choose one of the best actions
        scores = [self.evaluationFunction(gameState, action) for action in legalMoves]
        bestScore = max(scores)
        bestIndices = [index for index in range(len(scores)) if scores[index] == bestScore]
        chosenIndex = random.choice(bestIndices)  # Pick randomly among the best

        "Add more of your code here if you want to"

        return legalMoves[chosenIndex]

    def evaluationFunction(self, currentGameState, action):
        """
        Design a better evaluation function here.

        The evaluation function takes in the current and proposed successor
        GameStates (pacman.py) and returns a number, where higher numbers are better.

        The code below extracts some useful information from the state, like the
        remaining food (newFood) and Pacman position after moving (newPos).
        newScaredTimes holds the number of moves that each ghost will remain
        scared because of Pacman having eaten a power pellet.

        Print out these variables to see what you're getting, then combine them
        to create a masterful evaluation function.
        """
        # Useful information you can extract from a GameState (pacman.py)
        successorGameState = currentGameState.generatePacmanSuccessor(action)
        newPos = successorGameState.getPacmanPosition()
        newFood = successorGameState.getFood()
        newGhostStates = successorGameState.getGhostStates()
        newScaredTimes = [ghostState.scaredTimer for ghostState in newGhostStates]

        "*** YOUR CODE HERE ***"
        # print(successorGameState,"\n",newFood,"\n",newPos,"\n",newGhostStates,"\n",newScaredTimes,"\n,\n,\n")
        score = successorGameState.getScore()


        # ---------- 1. 普通豆吸引力 ----------
        foodPositions = newFood.asList()
        if len(foodPositions) > 0:
            # 越近越好（高权重）
            distToClosestFood = min([util.manhattanDistance(newPos, food) for food in foodPositions])
            score += 10 / (distToClosestFood + 1)

        # ---------- 2. 超级豆（直接通过 currentState 获取 capsules，而不是 food 识别） ----------
        capsules = currentGameState.getCapsules()
        if len(capsules) > 0:
            distToClosestCapsule = min([util.manhattanDistance(newPos, cap) for cap in capsules])
            # 比普通食物低一点，但不是无视
            score += 6 / (distToClosestCapsule + 1)

        # ---------- 3. 鬼逻辑 ----------
        for i, ghostState in enumerate(newGhostStates):
            ghostPos = ghostState.getPosition()
            dist = util.manhattanDistance(newPos, ghostPos)

            if newScaredTimes[i] > 0:
                # 如果鬼已经害怕 → 有机会吃就加分（但不是盲目冲）
                if dist <= 5:
                    score += 2000 / (dist + 1)
            else:
                # 鬼没害怕 → 要避开（保持安全）
                if dist < 2:
                    score -= 200   # 避免死亡
                else:
                    score -= 2 / (dist + 1)


        # ---------- 左侧偏好 ----------
        # x 坐标越小越优先（左边）
        leftBias = -newPos[0] * 0.5   # 0.5 可以调节权重
        score += leftBias

        return score
        # return successorGameState.getScore()


def scoreEvaluationFunction(currentGameState):
    """
    This default evaluation function just returns the score of the state.
    The score is the same one displayed in the Pacman GUI.

    This evaluation function is meant for use with adversarial search agents
    (not reflex agents).
    """
    return currentGameState.getScore()


class MultiAgentSearchAgent(Agent):
    """
    This class provides some common elements to all of your
    multi-agent searchers.  Any methods defined here will be available
    to the MinimaxPacmanAgent, AlphaBetaPacmanAgent & ExpectimaxPacmanAgent.

    You *do not* need to make any changes here, but you can if you want to
    add functionality to all your adversarial search agents.  Please do not
    remove anything, however.

    Note: this is an abstract class: one that should not be instantiated.  It's
    only partially specified, and designed to be extended.  Agent (game.py)
    is another abstract class.
    """


#########################
### 更改评价函数在这里 ###
########################


    def __init__(self, evalFn = 'scoreEvaluationFunction', depth = '2'):
        #两个可选参数，scoreEvaluationFunction和betterEva
        self.index = 0 # Pacman is always agent index 0
        self.evaluationFunction = util.lookup(evalFn, globals())
        self.depth = int(depth)


class MinimaxAgent(MultiAgentSearchAgent):
    """
    Your minimax agent (question 2)
    """

    def getAction(self, gameState):
        """
        Returns the minimax action from the current gameState using self.depth
        and self.evaluationFunction.

        Here are some method calls that might be useful when implementing minimax.

        gameState.getLegalActions(agentIndex):
        Returns a list of legal actions for an agent
        agentIndex=0 means Pacman, ghosts are >= 1

        gameState.generateSuccessor(agentIndex, action):
        Returns the successor game state after an agent takes an action

        gameState.getNumAgents():
        Returns the total number of agents in the game

        gameState.isWin():
        Returns whether or not the game state is a winning state

        gameState.isLose():
        Returns whether or not the game state is a losing state
        """
        "*** YOUR CODE HERE ***"
        
        def minimax(state, agentIndex, depth):
            # Terminal Case: Win/Lose or depth reached (depth counts by Pacman moves)
            if state.isWin() or state.isLose() or depth == self.depth:
                return self.evaluationFunction(state), None

            actions = state.getLegalActions(agentIndex)
            if not actions:
                return self.evaluationFunction(state), None

            numAgents = state.getNumAgents()

            # Pacman → MAX player (agentIndex == 0)
            if agentIndex == 0:
                bestValue = float('-inf')
                bestAction = None
                for action in actions:
                    successor = state.generateSuccessor(agentIndex, action)
                    value, _ = minimax(successor, 1, depth)  # next is ghost, depth stays same
                    if value > bestValue:
                        bestValue = value
                        bestAction = action
                return bestValue, bestAction

            # Ghost(s) → MIN player
            else:
                bestValue = float('inf')
                bestAction = None
                nextAgent = (agentIndex + 1) % numAgents

                for action in actions:
                    successor = state.generateSuccessor(agentIndex, action)

                    # If next agent is Pacman, depth increases (one "ply" completed)
                    if nextAgent == 0:
                        value, _ = minimax(successor, nextAgent, depth + 1)
                    else:
                        value, _ = minimax(successor, nextAgent, depth)

                    if value < bestValue:
                        bestValue = value
                        bestAction = action

                return bestValue, bestAction

        # Start from Pacman (agentIndex = 0), at depth 0
        _, action = minimax(gameState, 0, 0)
        return action

class AlphaBetaAgent(MultiAgentSearchAgent):
    """
    AlphaBeta 优化版：
    - 使用 betterEvaluationFunction
    - 优先安全路径
    - 避免两侧被鬼夹击
    """

    def getAction(self, gameState):
        numAgents = gameState.getNumAgents()
        alpha, beta = float('-inf'), float('inf')
        bestAction = None
        bestValue = float('-inf')

        for action in gameState.getLegalActions(0):
            if action == "STOP":
                continue  # 不停留
            successor = gameState.generateSuccessor(0, action)
            value = self.alphabeta(successor, 0, 1, alpha, beta)
            if value > bestValue:
                bestValue = value
                bestAction = action
            alpha = max(alpha, bestValue)

        return bestAction

    def alphabeta(self, state, depth, agentIndex, alpha, beta):
        numAgents = state.getNumAgents()
        isPacman = (agentIndex == 0)

        if state.isWin() or state.isLose() or depth == self.depth:
            return self.evaluationFunction(state)

        actions = state.getLegalActions(agentIndex)
        if not actions:
            return self.evaluationFunction(state)

        if isPacman:
            value = float('-inf')
            # 优先按安全路径评分排序
            actions = sorted(actions, key=lambda a: self.safeScore(state.generateSuccessor(0, a)), reverse=True)
            for action in actions:
                successor = state.generateSuccessor(agentIndex, action)
                value = max(value, self.alphabeta(successor, depth, 1, alpha, beta))
                alpha = max(alpha, value)
                if value >= beta:
                    break  # 剪枝
            return value
        else:
            value = float('inf')
            nextAgent = agentIndex + 1
            nextDepth = depth
            if nextAgent == numAgents:
                nextAgent = 0
                nextDepth += 1
            for action in actions:
                successor = state.generateSuccessor(agentIndex, action)
                value = min(value, self.alphabeta(successor, nextDepth, nextAgent, alpha, beta))
                beta = min(beta, value)
                if value <= alpha:
                    break
            return value

    def safeScore(self, state):
        """
        对动作后的状态额外评估安全性
        """
        pacmanPos = state.getPacmanPosition()
        ghosts = state.getGhostStates()
        walls = state.getWalls()
        from util import manhattanDistance

        # 检查左右是否有鬼堵住
        x, y = pacmanPos
        leftDanger = sum(1 for g in ghosts if g.getPosition() == (x-1, y))
        rightDanger = sum(1 for g in ghosts if g.getPosition() == (x+1, y))
        dangerScore = 0
        if leftDanger >= 2 and rightDanger >= 2:
            dangerScore -= 200  # 左右都被鬼堵，危险

        # BFS 安全路径长度
        import queue
        visited = set()
        q = queue.Queue()
        q.put((pacmanPos, 0))
        visited.add(pacmanPos)
        safe_count = 0
        while not q.empty() and safe_count < 50:
            current, dist = q.get()
            cx, cy = current
            if walls[cx][cy]:
                continue
            safe_count += 1
            for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
                nx, ny = cx+dx, cy+dy
                if (nx, ny) not in visited and not walls[nx][ny]:
                    if all(manhattanDistance((nx, ny), g.getPosition()) > 1 for g in ghosts):
                        visited.add((nx, ny))
                        q.put(((nx, ny), dist+1))
        if safe_count < 3:
            dangerScore -= 300  # 死路

        return self.evaluationFunction(state) + dangerScore


def betterEvaluationFunction(currentGameState):
    """
    Your extreme ghost-hunting, pellet-nabbing, food-gobbling, unstoppable
    evaluation function (question 4).

    DESCRIPTION: <write something here so we know what you did>
    """
    "*** YOUR CODE HERE ***"
    """
    升级版吃豆人评价函数：
    1. 考虑食物和胶囊距离
    2. 考虑鬼距离与状态
    3. 考虑左右方向是否被鬼堵住
    4. 计算安全路径长度，避免进入死路
    5. 鼓励顺畅移动，不横跳
    """
    from util import manhattanDistance
    from game import Directions
    import util
    import queue

    pacmanPos = currentGameState.getPacmanPosition()
    foodList = currentGameState.getFood().asList()
    ghosts = currentGameState.getGhostStates()
    capsules = currentGameState.getCapsules()
    walls = currentGameState.getWalls()

    score = currentGameState.getScore()

    # ---------- FEATURE 1: 食物距离 ----------
    if foodList:
        closestFoodDist = min(manhattanDistance(pacmanPos, f) for f in foodList)
        score += 10 / (closestFoodDist + 1)

    # ---------- FEATURE 2: 剩余食物惩罚 ----------
    score -= 2 * len(foodList)

    # ---------- FEATURE 3: 胶囊奖励 ----------
    if capsules:
        closestCap = min(manhattanDistance(pacmanPos, c) for c in capsules)
        score += 40 / (closestCap + 1)
        score -= 10 * len(capsules)

    # ---------- FEATURE 4: 鬼距离和状态 ----------
    for ghost in ghosts:
        ghostDist = manhattanDistance(pacmanPos, ghost.getPosition())
        scaredTime = ghost.scaredTimer
        if scaredTime > 0:
            score += 50 / (ghostDist + 1)
        else:
            if ghostDist == 0:
                score -= 999999
            else:
                score -= 50 / (ghostDist + 1)

    # ---------- FEATURE 5: 检查左右方向鬼扎堆 ----------
    leftPos = (pacmanPos[0]-1, pacmanPos[1])
    rightPos = (pacmanPos[0]+1, pacmanPos[1])
    leftDanger = sum(1 for g in ghosts if g.getPosition() == leftPos)
    rightDanger = sum(1 for g in ghosts if g.getPosition() == rightPos)
    if leftDanger >= 2 and rightDanger >= 2:
        score -= 200  # 两边鬼扎堆，危险

    # ---------- FEATURE 6: 安全路径长度（BFS） ----------
    def bfs_safe_length(pos):
        visited = set()
        q = queue.Queue()
        q.put((pos, 0))
        visited.add(pos)
        safe_count = 0
        while not q.empty() and safe_count < 50:
            current, dist = q.get()
            x, y = current
            if walls[x][y]:
                continue
            safe_count += 1
            for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
                nx, ny = x+dx, y+dy
                if (nx,ny) not in visited and not walls[nx][ny]:
                    if all(manhattanDistance((nx,ny), g.getPosition()) > 1 for g in ghosts):
                        visited.add((nx,ny))
                        q.put(((nx,ny), dist+1))
        return safe_count

    safeLen = bfs_safe_length(pacmanPos)
    if safeLen < 3:  # 死路或走廊
        score -= 300

    # ---------- FEATURE 7: 避免卡死 ----------
    x, y = pacmanPos
    nearbyWalls = walls[x+1][y] + walls[x-1][y] + walls[x][y+1] + walls[x][y-1]
    if nearbyWalls >= 3:
        score -= 200

    # ---------- FEATURE 8: 鼓励平稳移动 ----------
    score -= 20

    return score


# Abbreviation
better = betterEvaluationFunction
