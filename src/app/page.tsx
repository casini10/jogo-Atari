'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface GameState {
  ball: {
    x: number
    y: number
    dx: number
    dy: number
  }
  leftPaddle: {
    y: number
  }
  rightPaddle: {
    y: number
  }
  score: {
    left: number
    right: number
  }
  gameRunning: boolean
}

const GAME_WIDTH = 1000
const GAME_HEIGHT = 600
const PADDLE_HEIGHT = 120
const PADDLE_WIDTH = 15
const BALL_SIZE = 15
const PADDLE_SPEED = 8
const BALL_SPEED = 3

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const keysRef = useRef<Set<string>>(new Set())

  const [gameState, setGameState] = useState<GameState>({
    ball: {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      dx: BALL_SPEED,
      dy: BALL_SPEED
    },
    leftPaddle: {
      y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2
    },
    rightPaddle: {
      y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2
    },
    score: {
      left: 0,
      right: 0
    },
    gameRunning: false
  })

  const resetBall = useCallback(() => {
    return {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      dx: Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED,
      dy: (Math.random() - 0.5) * BALL_SPEED
    }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Limpar canvas completamente
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Fundo preto sólido
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // CORREÇÃO CRÍTICA: RAQUETE ESQUERDA (JOGADOR) - AZUL ULTRA VISÍVEL
    ctx.save()
    
    // Primeiro: desenhar um retângulo azul sólido e bem visível
    ctx.fillStyle = '#0066FF' // Azul mais escuro e visível
    ctx.fillRect(10, gameState.leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)
    
    // Segundo: adicionar borda branca espessa para contraste
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 3
    ctx.strokeRect(10, gameState.leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)
    
    // Terceiro: adicionar um brilho interno azul claro
    ctx.fillStyle = '#3399FF'
    ctx.fillRect(12, gameState.leftPaddle.y + 2, PADDLE_WIDTH - 4, PADDLE_HEIGHT - 4)
    
    // Quarto: forçar um segundo desenho para garantir visibilidade
    ctx.fillStyle = '#0080FF'
    ctx.fillRect(10, gameState.leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)
    
    ctx.restore()

    // RAQUETE DIREITA (COMPUTADOR) - VERMELHA BRILHANTE
    ctx.save()
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(GAME_WIDTH - PADDLE_WIDTH - 10, gameState.rightPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 3
    ctx.strokeRect(GAME_WIDTH - PADDLE_WIDTH - 10, gameState.rightPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)
    ctx.restore()

    // Linha central pontilhada
    ctx.save()
    ctx.setLineDash([15, 15])
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(GAME_WIDTH / 2, 0)
    ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT)
    ctx.stroke()
    ctx.restore()

    // Bola - BRANCA BRILHANTE
    ctx.save()
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(gameState.ball.x, gameState.ball.y, BALL_SIZE, BALL_SIZE)
    ctx.strokeStyle = '#CCCCCC'
    ctx.lineWidth = 2
    ctx.strokeRect(gameState.ball.x, gameState.ball.y, BALL_SIZE, BALL_SIZE)
    ctx.restore()

    // Borda do campo
    ctx.save()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, GAME_WIDTH - 4, GAME_HEIGHT - 4)
    ctx.restore()

    // TESTE DE VISIBILIDADE: Desenhar um retângulo azul fixo no canto para teste
    ctx.save()
    ctx.fillStyle = '#0080FF'
    ctx.fillRect(50, 50, 30, 80)
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.strokeRect(50, 50, 30, 80)
    ctx.restore()

  }, [gameState])

  const updateGame = useCallback(() => {
    setGameState(prevState => {
      if (!prevState.gameRunning) return prevState

      const newState = { ...prevState }

      // JOGADOR (raquete esquerda) - controles W e S
      if (keysRef.current.has('w') || keysRef.current.has('W')) {
        if (newState.leftPaddle.y > 0) {
          newState.leftPaddle.y -= PADDLE_SPEED
        }
      }
      if (keysRef.current.has('s') || keysRef.current.has('S')) {
        if (newState.leftPaddle.y < GAME_HEIGHT - PADDLE_HEIGHT) {
          newState.leftPaddle.y += PADDLE_SPEED
        }
      }

      // COMPUTADOR (raquete direita) - IA melhorada
      const ballCenterY = newState.ball.y + BALL_SIZE / 2
      const paddleCenterY = newState.rightPaddle.y + PADDLE_HEIGHT / 2
      const aiSpeed = PADDLE_SPEED * 0.8 // IA um pouco mais lenta que o jogador
      const tolerance = 30 // Zona morta para tornar a IA menos perfeita

      // IA só reage quando a bola está vindo na direção dela
      if (newState.ball.dx > 0 && newState.ball.x > GAME_WIDTH / 2) {
        if (ballCenterY < paddleCenterY - tolerance && newState.rightPaddle.y > 0) {
          newState.rightPaddle.y -= aiSpeed
        } else if (ballCenterY > paddleCenterY + tolerance && newState.rightPaddle.y < GAME_HEIGHT - PADDLE_HEIGHT) {
          newState.rightPaddle.y += aiSpeed
        }
      }

      // Movimento da bola
      newState.ball.x += newState.ball.dx
      newState.ball.y += newState.ball.dy

      // Colisão com paredes superior e inferior
      if (newState.ball.y <= 0 || newState.ball.y >= GAME_HEIGHT - BALL_SIZE) {
        newState.ball.dy = -newState.ball.dy
      }

      // Colisão com raquete esquerda (JOGADOR)
      if (
        newState.ball.x <= PADDLE_WIDTH + 10 &&
        newState.ball.y + BALL_SIZE >= newState.leftPaddle.y &&
        newState.ball.y <= newState.leftPaddle.y + PADDLE_HEIGHT &&
        newState.ball.dx < 0
      ) {
        newState.ball.dx = Math.abs(newState.ball.dx)
        // Efeito baseado na posição de impacto
        const hitPos = (newState.ball.y + BALL_SIZE/2 - newState.leftPaddle.y) / PADDLE_HEIGHT
        newState.ball.dy = (hitPos - 0.5) * BALL_SPEED * 1.5
      }

      // Colisão com raquete direita (COMPUTADOR)
      if (
        newState.ball.x + BALL_SIZE >= GAME_WIDTH - PADDLE_WIDTH - 10 &&
        newState.ball.y + BALL_SIZE >= newState.rightPaddle.y &&
        newState.ball.y <= newState.rightPaddle.y + PADDLE_HEIGHT &&
        newState.ball.dx > 0
      ) {
        newState.ball.dx = -Math.abs(newState.ball.dx)
        // Efeito baseado na posição de impacto
        const hitPos = (newState.ball.y + BALL_SIZE/2 - newState.rightPaddle.y) / PADDLE_HEIGHT
        newState.ball.dy = (hitPos - 0.5) * BALL_SPEED * 1.5
      }

      // Sistema de pontuação
      if (newState.ball.x < -BALL_SIZE) {
        // Computador marcou ponto
        newState.score.right += 1
        newState.ball = resetBall()
      } else if (newState.ball.x > GAME_WIDTH + BALL_SIZE) {
        // Jogador marcou ponto
        newState.score.left += 1
        newState.ball = resetBall()
      }

      return newState
    })
  }, [resetBall])

  const gameLoop = useCallback(() => {
    updateGame()
    draw()
    if (gameState.gameRunning) {
      animationRef.current = requestAnimationFrame(gameLoop)
    }
  }, [updateGame, draw, gameState.gameRunning])

  const startGame = () => {
    setGameState(prev => ({ ...prev, gameRunning: true }))
  }

  const pauseGame = () => {
    setGameState(prev => ({ ...prev, gameRunning: false }))
  }

  const resetGame = () => {
    setGameState({
      ball: resetBall(),
      leftPaddle: { y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
      rightPaddle: { y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
      score: { left: 0, right: 0 },
      gameRunning: false
    })
  }

  // Controles do teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
      e.preventDefault()
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
      e.preventDefault()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState.gameRunning) {
      animationRef.current = requestAnimationFrame(gameLoop)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState.gameRunning, gameLoop])

  // CORREÇÃO CRÍTICA: Forçar redesenho sempre que o estado mudar
  useEffect(() => {
    draw()
  }, [draw, gameState])

  // CORREÇÃO CRÍTICA: Garantir que o canvas seja inicializado corretamente
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      // Forçar redimensionamento do canvas
      canvas.width = GAME_WIDTH
      canvas.height = GAME_HEIGHT
      
      // Desenhar imediatamente após inicialização
      setTimeout(() => {
        draw()
      }, 100)
    }
  }, [draw])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-white mb-2">🏓 PONG</h1>
        <p className="text-xl text-green-400 mb-4 font-semibold">VOCÊ vs COMPUTADOR</p>
        
        {/* Placar */}
        <div className="flex items-center justify-center gap-12 mb-6 bg-gray-800 p-6 rounded-xl">
          <div className="text-center">
            <div className="text-5xl font-mono text-blue-400 font-bold">{gameState.score.left}</div>
            <div className="text-lg text-blue-300 font-semibold">VOCÊ (AZUL)</div>
          </div>
          <div className="text-4xl text-white font-bold">×</div>
          <div className="text-center">
            <div className="text-5xl font-mono text-red-400 font-bold">{gameState.score.right}</div>
            <div className="text-lg text-red-300 font-semibold">COMPUTADOR (VERMELHO)</div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={startGame}
            disabled={gameState.gameRunning}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105"
          >
            ▶️ INICIAR
          </button>
          <button
            onClick={pauseGame}
            disabled={!gameState.gameRunning}
            className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105"
          >
            ⏸️ PAUSAR
          </button>
          <button
            onClick={resetGame}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105"
          >
            🔄 REINICIAR
          </button>
        </div>
      </div>

      {/* Canvas do jogo */}
      <div className="border-4 border-white rounded-2xl overflow-hidden shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="block"
          style={{ 
            imageRendering: 'pixelated',
            width: `${GAME_WIDTH}px`,
            height: `${GAME_HEIGHT}px`,
            backgroundColor: '#000000'
          }}
        />
      </div>

      {/* Instruções */}
      <div className="mt-8 text-center text-gray-300 max-w-2xl">
        <div className="bg-gray-800 p-6 rounded-xl">
          <h3 className="text-2xl font-bold mb-4 text-white">🎮 COMO JOGAR</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-900/30 p-4 rounded-lg">
              <div className="font-bold text-blue-400 mb-2 text-lg">SEUS CONTROLES</div>
              <div className="text-lg">⬆️ Tecla W - Subir</div>
              <div className="text-lg">⬇️ Tecla S - Descer</div>
              <div className="text-sm text-blue-300 mt-2">Sua raquete é AZUL (esquerda)</div>
            </div>
            <div className="bg-red-900/30 p-4 rounded-lg">
              <div className="font-bold text-red-400 mb-2 text-lg">COMPUTADOR</div>
              <div className="text-lg">🤖 IA Controlada</div>
              <div className="text-lg">🎯 Tenta defender automaticamente</div>
              <div className="text-sm text-red-300 mt-2">Raquete VERMELHA (direita)</div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-green-900/30 rounded-lg">
            <div className="font-bold text-green-400 mb-2 text-lg">🏆 OBJETIVO</div>
            <p className="text-lg">
              Rebate a bola e tenta fazer ela passar pela raquete do computador para marcar pontos!
            </p>
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div className="mt-4 text-xs text-gray-500">
        Debug: Raquete azul posição Y: {gameState.leftPaddle.y} | Jogo rodando: {gameState.gameRunning ? 'Sim' : 'Não'}
      </div>
    </div>
  )
}