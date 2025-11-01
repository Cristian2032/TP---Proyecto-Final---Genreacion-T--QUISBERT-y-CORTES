import React, { useState, useEffect, useRef } from 'react';

// ============= PROGRAMACIÓN ORIENTADA A OBJETOS =============

// Clase base para objetos del juego
class GameObject {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.active = true;
  }

  update() {
    // Método a sobrescribir
  }

  draw(ctx) {
    // Método a sobrescribir
  }

  collidesWith(other) {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }
}

// Clase Nave (hereda de GameObject)
class Ship extends GameObject {
  constructor(x, y) {
    super(x, y, 60, 60);
    this.speed = 8;
    this.health = 100;
    this.maxHealth = 100;
  }

  moveLeft() {
    if (this.x > 0) this.x -= this.speed;
  }

  moveRight(canvasWidth) {
    if (this.x + this.width < canvasWidth) this.x += this.speed;
  }

  moveUp() {
    if (this.y > 0) this.y -= this.speed;
  }

  moveDown(canvasHeight) {
    if (this.y + this.height + 10 < canvasHeight) this.y += this.speed;
  }

  draw(ctx) {
    // Cuerpo de la nave
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.closePath();
    ctx.fill();

    // Cabina
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + 20, 8, 0, Math.PI * 2);
    ctx.fill();

    // Motor
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(this.x + 10, this.y + this.height, 15, 8);
    ctx.fillRect(this.x + this.width - 25, this.y + this.height, 15, 8);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.active = false;
    }
  }
}

// Clase Proyectil (hereda de GameObject)
class Projectile extends GameObject {
  constructor(x, y, isEnemy = false) {
    super(x, y, 4, 15);
    this.speed = 10;
    this.isEnemy = isEnemy;
  }

  update() {
    if (this.isEnemy) {
      this.y += this.speed; // Proyectiles enemigos van hacia abajo
      if (this.y > 600) this.active = false;
    } else {
      this.y -= this.speed; // Proyectiles del jugador van hacia arriba
      if (this.y < -this.height) this.active = false;
    }
  }

  draw(ctx) {
    if (this.isEnemy) {
      // Proyectil enemigo (rojo)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      
      // Efecto de brillo
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(this.x + 1, this.y, 2, this.height / 2);
    } else {
      // Proyectil del jugador (amarillo)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      
      // Efecto de brillo
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(this.x + 1, this.y, 2, this.height / 2);
    }
  }
}

// Clase Asteroide (hereda de GameObject)
class Asteroid extends GameObject {
  constructor(x, y, size) {
    super(x, y, size, size);
    this.speed = 2 + Math.random() * 3;
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.points = this.generatePoints();
  }

  generatePoints() {
    const points = [];
    const numPoints = 8;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = this.width / 2 * (0.8 + Math.random() * 0.4);
      points.push({ angle, radius });
    }
    return points;
  }

  update() {
    this.y += this.speed;
    this.rotation += this.rotationSpeed;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);

    ctx.fillStyle = '#78716c';
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    this.points.forEach((point, i) => {
      const x = Math.cos(point.angle) * point.radius;
      const y = Math.sin(point.angle) * point.radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// Clase Nave Enemiga (hereda de GameObject)
class EnemyShip extends GameObject {
  constructor(x, y) {
    super(x, y, 50, 50);
    this.speed = 1.5;
    this.direction = Math.random() > 0.5 ? 1 : -1; // -1 izquierda, 1 derecha
    this.shootTimer = 0;
    this.shootInterval = 60 + Math.random() * 60; // Dispara cada 1-2 segundos
    this.health = 2;
  }

  update(canvasWidth) {
    // Movimiento horizontal
    this.x += this.speed * this.direction;
    
    // Cambiar dirección en los bordes
    if (this.x <= 0 || this.x + this.width >= canvasWidth) {
      this.direction *= -1;
    }

    // Moverse lentamente hacia abajo
    this.y += 0.3;

    // Timer de disparo
    this.shootTimer++;
  }

  shouldShoot() {
    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0;
      return true;
    }
    return false;
  }

  shoot() {
    return new Projectile(this.x + this.width / 2 - 2, this.y + this.height, true);
  }

  draw(ctx) {
    // Cuerpo de la nave enemiga (invertida)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y + this.height); // Punta abajo
    ctx.lineTo(this.x, this.y);
    ctx.lineTo(this.x + this.width, this.y);
    ctx.closePath();
    ctx.fill();

    // Cabina
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + 15, 7, 0, Math.PI * 2);
    ctx.fill();

    // Alas/motores
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(this.x + 5, this.y - 5, 12, 6);
    ctx.fillRect(this.x + this.width - 17, this.y - 5, 12, 6);
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      this.active = false;
    }
  }
}

// Clase Estrella para el fondo
class BackgroundStar {
  constructor(x, y, size, speed) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
  }

  update(canvasHeight) {
    this.y += this.speed;
    if (this.y > canvasHeight) {
      this.y = 0;
      this.x = Math.random() * 800;
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Clase Game (gestiona toda la lógica del juego)
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.ship = new Ship(this.width / 2 - 30, this.height - 80);
    this.projectiles = [];
    this.asteroids = [];
    this.enemyShips = [];
    this.stars = this.initStars();
    
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.asteroidSpawnTimer = 0;
    this.asteroidSpawnInterval = 60;
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 300; // Spawn cada 5 segundos
    
    this.keys = {};
  }

  initStars() {
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push(new BackgroundStar(
        Math.random() * this.width,
        Math.random() * this.height,
        Math.random() * 2 + 0.5,
        Math.random() * 2 + 0.5
      ));
    }
    return stars;
  }

  shoot() {
    this.projectiles.push(
      new Projectile(this.ship.x + this.ship.width / 2 - 2, this.ship.y)
    );
  }

  spawnAsteroid() {
    const size = 30 + Math.random() * 40;
    const x = Math.random() * (this.width - size);
    this.asteroids.push(new Asteroid(x, -size, size));
  }

  spawnEnemyShip() {
    const x = Math.random() * (this.width - 50);
    this.enemyShips.push(new EnemyShip(x, -50));
  }

  update() {
    if (this.gameOver) return;

    // Actualizar estrellas
    this.stars.forEach(star => star.update(this.height));

    // Mover nave
    if (this.keys['ArrowLeft'] || this.keys['a']) {
      this.ship.moveLeft();
    }
    if (this.keys['ArrowRight'] || this.keys['d']) {
      this.ship.moveRight(this.width);
    }
    if (this.keys['ArrowUp'] || this.keys['w']) {
      this.ship.moveUp();
    }
    if (this.keys['ArrowDown'] || this.keys['s']) {
      this.ship.moveDown(this.height);
    }

    // Actualizar proyectiles
    this.projectiles = this.projectiles.filter(p => {
      p.update();
      return p.active;
    });

    // Actualizar naves enemigas (solo desde nivel 6)
    if (this.level >= 6) {
      this.enemyShips = this.enemyShips.filter(enemy => {
        enemy.update(this.width);
        
        // Nave enemiga dispara
        if (enemy.shouldShoot()) {
          this.projectiles.push(enemy.shoot());
        }
        
        // Colisión con nave del jugador
        if (enemy.collidesWith(this.ship)) {
          this.ship.takeDamage(30);
          return false;
        }
        
        // Si sale de la pantalla por abajo
        if (enemy.y > this.height) {
          return false;
        }
        
        return enemy.active;
      });
    }

    // Actualizar asteroides
    this.asteroids = this.asteroids.filter(a => {
      a.update();
      
      // Colisión con nave
      if (a.collidesWith(this.ship)) {
        this.ship.takeDamage(20);
        return false;
      }
      
      // Si sale de la pantalla
      if (a.y > this.height) {
        return false;
      }
      
      return a.active;
    });

    // Colisiones proyectil-asteroide
    this.projectiles.forEach(proj => {
      // Proyectiles del jugador vs asteroides
      if (!proj.isEnemy) {
        this.asteroids.forEach(ast => {
          if (proj.active && ast.active && proj.collidesWith(ast)) {
            proj.active = false;
            ast.active = false;
            this.score += Math.floor(ast.width);
          }
        });
        
        // Proyectiles del jugador vs naves enemigas
        this.enemyShips.forEach(enemy => {
          if (proj.active && enemy.active && proj.collidesWith(enemy)) {
            proj.active = false;
            enemy.takeDamage();
            if (!enemy.active) {
              this.score += 100; // Bonus por destruir nave enemiga
            }
          }
        });
      } else {
        // Proyectiles enemigos vs nave del jugador
        if (proj.active && proj.collidesWith(this.ship)) {
          proj.active = false;
          this.ship.takeDamage(10);
        }
      }
    });

    // Filtrar objetos inactivos
    this.asteroids = this.asteroids.filter(a => a.active);
    this.projectiles = this.projectiles.filter(p => p.active);
    this.enemyShips = this.enemyShips.filter(e => e.active);

    // Spawn asteroides
    this.asteroidSpawnTimer++;
    if (this.asteroidSpawnTimer >= this.asteroidSpawnInterval) {
      this.spawnAsteroid();
      this.asteroidSpawnTimer = 0;
    }

    // Spawn naves enemigas (solo desde nivel 6)
    if (this.level >= 6) {
      this.enemySpawnTimer++;
      if (this.enemySpawnTimer >= this.enemySpawnInterval) {
        this.spawnEnemyShip();
        this.enemySpawnTimer = 0;
      }
    }

    // Incrementar dificultad
    this.level = Math.floor(this.score / 500) + 1;
    this.asteroidSpawnInterval = Math.max(20, 60 - this.level * 5);

    // Game Over
    if (!this.ship.active) {
      this.gameOver = true;
    }
  }

  draw() {
    // Limpiar canvas
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Dibujar estrellas
    this.stars.forEach(star => star.draw(this.ctx));

    // Dibujar objetos
    this.asteroids.forEach(a => a.draw(this.ctx));
    this.enemyShips.forEach(e => e.draw(this.ctx));
    this.projectiles.forEach(p => p.draw(this.ctx));
    this.ship.draw(this.ctx);

    // Dibujar HUD
    this.drawHUD();
  }

  drawHUD() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(`Puntos: ${this.score}`, 20, 30);
    this.ctx.fillText(`Nivel: ${this.level}`, 20, 60);
    
    // Mensaje de naves enemigas
    if (this.level >= 6) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText('¡NAVES ENEMIGAS ACTIVAS!', 20, 90);
    }

    // Barra de vida
    const barWidth = 200;
    const barHeight = 20;
    const barX = this.width - barWidth - 20;
    const barY = 20;

    this.ctx.fillStyle = '#374151';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercent = this.ship.health / this.ship.maxHealth;
    const healthColor = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
    this.ctx.fillStyle = healthColor;
    this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    this.ctx.strokeStyle = '#9ca3af';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`${Math.floor(this.ship.health)}%`, barX + barWidth / 2 - 20, barY + 15);
  }

  reset() {
    this.ship = new Ship(this.width / 2 - 30, this.height - 80);
    this.projectiles = [];
    this.asteroids = [];
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.asteroidSpawnTimer = 0;
    this.asteroidSpawnInterval = 60;
  }
}

// ============= COMPONENTE REACT =============

export default function SpaceDefenseGame() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animationRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;

    gameRef.current = new Game(canvas);

    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      gameRef.current.keys[e.key] = true;
      
      if (e.key === ' ' && isPlaying) {
        gameRef.current.shoot();
      }
    };

    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = () => {
      const game = gameRef.current;
      
      game.update();
      game.draw();

      if (game.gameOver) {
        setGameOver(true);
        setFinalScore(game.score);
        setIsPlaying(false);
        return;
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const startGame = () => {
    if (gameRef.current) {
      gameRef.current.reset();
      setGameOver(false);
      setIsPlaying(true);
      setShowInstructions(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
    },
    wrapper: {
      maxWidth: '896px',
      width: '100%',
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px',
    },
    titleContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '16px',
    },
    icon: {
      width: '48px',
      height: '48px',
    },
    title: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: 'white',
      margin: 0,
    },
    subtitle: {
      color: '#d1d5db',
      fontSize: '18px',
      margin: 0,
    },
    gameContainer: {
      position: 'relative',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '4px solid #334155',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    canvas: {
      width: '100%',
      height: 'auto',
      display: 'block',
    },
    overlay: {
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    instructionsBox: {
      backgroundColor: '#1e293b',
      padding: '32px',
      borderRadius: '12px',
      border: '2px solid #a855f7',
      maxWidth: '448px',
    },
    instructionsTitle: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '24px',
      textAlign: 'center',
    },
    instructionsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '32px',
    },
    instructionItem: {
      display: 'flex',
      gap: '12px',
      color: '#e5e7eb',
    },
    instructionIcon: {
      width: '24px',
      height: '24px',
      flexShrink: 0,
      marginTop: '4px',
    },
    instructionText: {
      margin: 0,
      fontWeight: '600',
    },
    instructionSubtext: {
      margin: 0,
      fontSize: '14px',
      color: '#9ca3af',
    },
    button: {
      width: '100%',
      background: 'linear-gradient(to right, #9333ea, #2563eb)',
      color: 'white',
      fontWeight: 'bold',
      padding: '16px 24px',
      borderRadius: '8px',
      fontSize: '20px',
      border: 'none',
      cursor: 'pointer',
      transition: 'transform 0.2s',
    },
    gameOverBox: {
      backgroundColor: '#1e293b',
      padding: '32px',
      borderRadius: '12px',
      border: '2px solid #ef4444',
      textAlign: 'center',
    },
    gameOverTitle: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#ef4444',
      marginBottom: '16px',
    },
    finalScoreLabel: {
      color: 'white',
      fontSize: '24px',
      marginBottom: '8px',
    },
    finalScoreValue: {
      color: '#fbbf24',
      fontSize: '48px',
      fontWeight: 'bold',
      marginBottom: '24px',
    },
    playAgainButton: {
      background: 'linear-gradient(to right, #16a34a, #2563eb)',
      color: 'white',
      fontWeight: 'bold',
      padding: '12px 32px',
      borderRadius: '8px',
      fontSize: '20px',
      border: 'none',
      cursor: 'pointer',
      transition: 'transform 0.2s',
    },
    infoBox: {
      marginTop: '24px',
      backgroundColor: '#1e293b',
      borderRadius: '8px',
      padding: '24px',
      border: '2px solid #334155',
    },
    infoTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '12px',
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      color: '#d1d5db',
      fontSize: '14px',
    },
    infoItem: {
      margin: 0,
    },
    infoItemTitle: {
      fontWeight: '600',
    },
    infoItemSubtext: {
      fontSize: '12px',
      color: '#9ca3af',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <svg style={{...styles.icon, color: '#60a5fa'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <h1 style={styles.title}>Defensa Espacial</h1>
            <svg style={{...styles.icon, color: '#fbbf24'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p style={styles.subtitle}>Protege tu nave de los asteroides</p>
        </div>

        <div style={styles.gameContainer}>
          <canvas ref={canvasRef} style={styles.canvas} />

          {showInstructions && !isPlaying && (
            <div style={styles.overlay}>
              <div style={styles.instructionsBox}>
                <h2 style={styles.instructionsTitle}>¿Cómo Jugar?</h2>
                <div style={styles.instructionsList}>
                  <div style={styles.instructionItem}>
                    <svg style={{...styles.instructionIcon, color: '#fbbf24'}} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div>
                      <p style={styles.instructionText}>Movimiento</p>
                      <p style={styles.instructionSubtext}>Usa ← → ↑ ↓ o WASD para mover la nave</p>
                    </div>
                  </div>
                  <div style={styles.instructionItem}>
                    <svg style={{...styles.instructionIcon, color: '#fbbf24'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <p style={styles.instructionText}>Disparar</p>
                      <p style={styles.instructionSubtext}>Presiona ESPACIO para disparar</p>
                    </div>
                  </div>
                  <div style={styles.instructionItem}>
                    <svg style={{...styles.instructionIcon, color: '#60a5fa'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <div>
                      <p style={styles.instructionText}>Objetivo</p>
                      <p style={styles.instructionSubtext}>Destruye asteroides y evita colisiones</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={startGame} 
                  style={styles.button}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  ¡Comenzar Juego!
                </button>
              </div>
            </div>
          )}

          {gameOver && (
            <div style={styles.overlay}>
              <div style={styles.gameOverBox}>
                <h2 style={styles.gameOverTitle}>¡Game Over!</h2>
                <p style={styles.finalScoreLabel}>Puntuación Final</p>
                <p style={styles.finalScoreValue}>{finalScore}</p>
                <button 
                  onClick={startGame} 
                  style={styles.playAgainButton}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  Jugar de Nuevo
                </button>
              </div>
            </div>
          )}

          {!isPlaying && !gameOver && !showInstructions && (
            <div style={styles.overlay}>
              <button 
                onClick={startGame} 
                style={styles.button}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                Iniciar
              </button>
            </div>
          )}
        </div>

        <div style={styles.infoBox}>
          <h3 style={styles.infoTitle}>Características del Proyecto</h3>
          <div style={styles.infoGrid}>
            <div>
              <p style={{...styles.infoItem, color: '#a855f7'}}>
                <span style={styles.infoItemTitle}>✓ Programación Orientada a Objetos</span>
              </p>
              <p style={styles.infoItemSubtext}>Clases: GameObject, Ship, Projectile, Asteroid, Star, Game</p>
            </div>
            <div>
              <p style={{...styles.infoItem, color: '#60a5fa'}}>
                <span style={styles.infoItemTitle}>✓ React + Hooks</span>
              </p>
              <p style={styles.infoItemSubtext}>useState, useEffect, useRef</p>
            </div>
            <div>
              <p style={{...styles.infoItem, color: '#22c55e'}}>
                <span style={styles.infoItemTitle}>✓ Canvas API</span>
              </p>
              <p style={styles.infoItemSubtext}>Renderizado 2D en tiempo real</p>
            </div>
            <div>
              <p style={{...styles.infoItem, color: '#fbbf24'}}>
                <span style={styles.infoItemTitle}>✓ Game Loop</span>
              </p>
              <p style={styles.infoItemSubtext}>Actualización y dibujado por frames</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}