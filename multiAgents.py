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


    def __init__(self, evalFn = 'betterEvaluationFunction', depth = '2'):
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
    Your minimax agent with alpha-beta pruning (question 3)
    """

    def getAction(self, gameState):
        """
        Returns the minimax action using self.depth and self.evaluationFunction
        """
        "*** YOUR CODE HERE ***"


        def alphabeta(state, depth, agentIndex, alpha, beta):
            if depth == self.depth or state.isWin() or state.isLose():
                return self.evaluationFunction(state)

            numAgents = state.getNumAgents()

            # ---------- MAX (Pacman) ----------
            if agentIndex == 0:
                value = float('-inf')
                actions = state.getLegalActions(0)

                # ---- Move Ordering：优先探索更有希望的动作 ----
                actions = sorted(actions, key=lambda a: self.evaluationFunction(state.generateSuccessor(0, a)), reverse=True)

                for action in actions:
                    successor = state.generateSuccessor(0, action)
                    value = max(value, alphabeta(successor, depth, 1, alpha, beta))
                    alpha = max(alpha, value)
                    if value >= beta:
                        return value
                return value

            # ---------- MIN (Ghosts) ----------
            else:
                value = float('inf')
                actions = state.getLegalActions(agentIndex)

                nextAgent = agentIndex + 1
                nextDepth = depth
                if nextAgent == numAgents:
                    nextAgent = 0
                    nextDepth += 1

                for action in actions:
                    successor = state.generateSuccessor(agentIndex, action)
                    value = min(value, alphabeta(successor, nextDepth, nextAgent, alpha, beta))
                    beta = min(beta, value)
                    if value <= alpha:
                        return value
                return value

        # ===== ROOT SEARCH WITH STOP PENALTY =====
        bestAction = None
        bestValue = float('-inf')
        alpha, beta = float('-inf'), float('inf')

        for action in gameState.getLegalActions(0):

            # 🚫强制降低 STOP 和反复横跳的优先级
            if action == "STOP":
                continue

            successor = gameState.generateSuccessor(0, action)
            value = alphabeta(successor, 0, 1, alpha, beta)

            # —— Corner Avoidance：远离死角 —— 
            x, y = successor.getPacmanPosition()
            width, height = gameState.getWalls().width, gameState.getWalls().height

            # 如果靠墙 → 轻微扣分（但不强制禁止）
            if x == 1 or y == 1 or x == width - 2 or y == height - 2:
                value -= 3  

            if value > bestValue:
                bestValue = value
                bestAction = action

            alpha = max(alpha, bestValue)

        return bestAction


def betterEvaluationFunction(currentGameState):
    """
    Your extreme ghost-hunting, pellet-nabbing, food-gobbling, unstoppable
    evaluation function (question 4).

    DESCRIPTION: <write something here so we know what you did>
    """
    "*** YOUR CODE HERE ***"
    from util import manhattanDistance

    pacmanPos = currentGameState.getPacmanPosition()
    food = currentGameState.getFood().asList()
    ghosts = currentGameState.getGhostStates()
    capsules = currentGameState.getCapsules()

    score = currentGameState.getScore()

    # ---------- FEATURE 1: Distance to closest food ----------
    if food:
        closestFoodDist = min(manhattanDistance(pacmanPos, f) for f in food)
        score += 15 / (closestFoodDist + 1)

    # ---------- FEATURE 2: Total remaining food penalty ----------
    score -= 4 * len(food)  # 越剩越扣分 = 催他吃

    # ---------- FEATURE 3: Capsule priority ----------
    if capsules:
        closestCap = min(manhattanDistance(pacmanPos, c) for c in capsules)
        score += 40 / (closestCap + 1)
        score -= 20 * len(capsules)  # 越多越扣，逼他吃掉

    # ---------- FEATURE 4: Ghost awareness ----------
    for ghost in ghosts:
        ghostDist = manhattanDistance(pacmanPos, ghost.getPosition())
        scaredTime = ghost.scaredTimer

        if scaredTime > 0:  
            # ---- Ghost edible: CHASE IT ----
            score += 100 / (ghostDist + 1)
        else:
            # ---- Ghost active: avoid ----
            if ghostDist == 0:
                score -= 999999  # 死局
            else:
                score -= 40 / (ghostDist + 1)
    # ---------- EXTRA: Avoid corridor trap ----------
    # x, y = pacmanPos
    # walls = currentGameState.getWalls()
    # # 检查左右是否封闭，鬼是否在左右
    # leftBlocked = walls[x-1][y] or any(g.getPosition() == (x-1, y) for g in ghosts)
    # rightBlocked = walls[x+1][y] or any(g.getPosition() == (x+1, y) for g in ghosts)

    # 如果左右都堵了 → 高风险
    # if leftBlocked and rightBlocked:
    #     score -= 300  # 惩罚走入夹击区

    # ---------- FEATURE 5: Avoid dead corners ----------
    walls = currentGameState.getWalls()
    x, y = pacmanPos
    nearbyWalls = (
        walls[x+1][y] + walls[x-1][y] + walls[x][y+1] + walls[x][y-1]
    )
    if nearbyWalls >= 3:
        score -= 200  # 不要卡死自己

    # ---------- FEATURE 6: Encourage smooth motion ----------
    # 吃豆人如果停着不动 or 来回横跳 → 扣分（行为收敛）
    score -= 20  

    return score


# Abbreviation
better = betterEvaluationFunction
