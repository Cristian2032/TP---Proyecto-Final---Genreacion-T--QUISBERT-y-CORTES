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
    this.weaponUpgrade = false;
    this.weaponUpgradeTimer = 0;
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
    ctx.fillStyle = this.weaponUpgrade ? '#a855f7' : '#60a5fa';
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.closePath();
    ctx.fill();

    // Cabina
    ctx.fillStyle = this.weaponUpgrade ? '#7c3aed' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + 20, 8, 0, Math.PI * 2);
    ctx.fill();

    // Motor
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(this.x + 10, this.y + this.height, 15, 8);
    ctx.fillRect(this.x + this.width - 25, this.y + this.height, 15, 8);
    
    // Indicador de mejora de arma
    if (this.weaponUpgrade) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(this.x + 5, this.y + 30, 3, 10);
      ctx.fillRect(this.x + this.width - 8, this.y + 30, 3, 10);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.active = false;
    }
  }
  
  heal(amount) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }
  
  upgradeWeapon() {
    this.weaponUpgrade = true;
    this.weaponUpgradeTimer = 600; // 10 segundos a 60 FPS
  }
  
  updateWeaponUpgrade() {
    if (this.weaponUpgrade) {
      this.weaponUpgradeTimer--;
      if (this.weaponUpgradeTimer <= 0) {
        this.weaponUpgrade = false;
      }
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
      this.y += this.speed;
      if (this.y > 600) this.active = false;
    } else {
      this.y -= this.speed;
      if (this.y < -this.height) this.active = false;
    }
  }

  draw(ctx) {
    if (this.isEnemy) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(this.x + 1, this.y, 2, this.height / 2);
    } else {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(this.x, this.y, this.width, this.height);
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
  constructor(x, y, isBoss = false) {
    super(x, y, isBoss ? 80 : 50, isBoss ? 80 : 50);
    this.speed = isBoss ? 1 : 1.5;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.shootTimer = 0;
    this.shootInterval = isBoss ? 40 : 60 + Math.random() * 60;
    this.health = isBoss ? 10 : 2;
    this.maxHealth = this.health;
    this.isBoss = isBoss;
  }

  update(canvasWidth) {
    this.x += this.speed * this.direction;
    if (this.x <= 0 || this.x + this.width >= canvasWidth) {
      this.direction *= -1;
    }
    this.y += this.isBoss ? 0.2 : 0.3;
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
    if (this.isBoss) {
      return [
        new Projectile(this.x + this.width / 3 - 2, this.y + this.height, true),
        new Projectile(this.x + (this.width * 2/3) - 2, this.y + this.height, true)
      ];
    }
    return new Projectile(this.x + this.width / 2 - 2, this.y + this.height, true);
  }

  draw(ctx) {
    if (this.isBoss) {
      // Nave Jefe - Más grande y amenazante
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y + this.height);
      ctx.lineTo(this.x, this.y + 20);
      ctx.lineTo(this.x + this.width, this.y + 20);
      ctx.closePath();
      ctx.fill();
      
      // Alas extendidas
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(this.x - 10, this.y + 30, 20, 30);
      ctx.fillRect(this.x + this.width - 10, this.y + 30, 20, 30);
      
      // Cabina del jefe
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + 30, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Motores del jefe
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(this.x + 10, this.y - 10, 18, 12);
      ctx.fillRect(this.x + this.width - 28, this.y - 10, 18, 12);
      
      // Barra de vida del jefe
      const healthBarWidth = this.width;
      const healthBarHeight = 6;
      const healthPercent = this.health / this.maxHealth;
      
      ctx.fillStyle = '#374151';
      ctx.fillRect(this.x, this.y - 15, healthBarWidth, healthBarHeight);
      
      ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(this.x, this.y - 15, healthBarWidth * healthPercent, healthBarHeight);
      
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.x, this.y - 15, healthBarWidth, healthBarHeight);
      
      // Texto "JEFE"
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px Arial';
      ctx.fillText('JEFE', this.x + this.width / 2 - 15, this.y - 18);
    } else {
      // Nave enemiga normal
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y + this.height);
      ctx.lineTo(this.x, this.y);
      ctx.lineTo(this.x + this.width, this.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + 15, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(this.x + 5, this.y - 5, 12, 6);
      ctx.fillRect(this.x + this.width - 17, this.y - 5, 12, 6);
    }
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      this.active = false;
    }
  }
}

// Clase Item de poder (hereda de GameObject)
class PowerUp extends GameObject {
  constructor(x, y, type) {
    super(x, y, 25, 25);
    this.speed = 2;
    this.type = type; // 'health' o 'weapon'
    this.rotation = 0;
  }

  update() {
    this.y += this.speed;
    this.rotation += 0.05;
    if (this.y > 600) this.active = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);
    
    if (this.type === 'health') {
      // Cruz de vida (verde)
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-3, -10, 6, 20);
      ctx.fillRect(-10, -3, 20, 6);
      
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.strokeRect(-3, -10, 6, 20);
      ctx.strokeRect(-10, -3, 20, 6);
    } else if (this.type === 'weapon') {
      // Estrella de poder (amarillo/naranja)
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = Math.cos(angle) * 12;
        const y = Math.sin(angle) * 12;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.restore();
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
    this.powerUps = [];
    this.stars = this.initStars();
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.asteroidSpawnTimer = 0;
    this.asteroidSpawnInterval = 60;
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 300;
    this.powerUpSpawnTimer = 0;
    this.powerUpSpawnInterval = 600; // Cada 10 segundos
    this.bossActive = false;
    this.bossDefeated = false;
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
    if (this.ship.weaponUpgrade) {
      // Disparo doble
      this.projectiles.push(
        new Projectile(this.ship.x + 15, this.ship.y),
        new Projectile(this.ship.x + this.ship.width - 15, this.ship.y)
      );
    } else {
      // Disparo simple
      this.projectiles.push(
        new Projectile(this.ship.x + this.ship.width / 2 - 2, this.ship.y)
      );
    }
  }

  spawnAsteroid() {
    const size = 30 + Math.random() * 40;
    const x = Math.random() * (this.width - size);
    this.asteroids.push(new Asteroid(x, -size, size));
  }

  spawnEnemyShip() {
    const x = Math.random() * (this.width - 50);
    this.enemyShips.push(new EnemyShip(x, -50, false));
  }
  
  spawnBoss() {
    const x = this.width / 2 - 40;
    this.enemyShips.push(new EnemyShip(x, -80, true));
    this.bossActive = true;
  }
  
  spawnPowerUp(x, y, type) {
    this.powerUps.push(new PowerUp(x, y, type));
  }

  update() {
    if (this.gameOver) return;
    this.stars.forEach(star => star.update(this.height));
    
    // Actualizar mejora de arma
    this.ship.updateWeaponUpgrade();
    
    if (this.keys['ArrowLeft'] || this.keys['a']) this.ship.moveLeft();
    if (this.keys['ArrowRight'] || this.keys['d']) this.ship.moveRight(this.width);
    if (this.keys['ArrowUp'] || this.keys['w']) this.ship.moveUp();
    if (this.keys['ArrowDown'] || this.keys['s']) this.ship.moveDown(this.height);
    
    this.projectiles = this.projectiles.filter(p => {
      p.update();
      return p.active;
    });
    
    // Actualizar power-ups
    this.powerUps = this.powerUps.filter(pu => {
      pu.update();
      
      // Colisión con nave
      if (pu.collidesWith(this.ship)) {
        if (pu.type === 'health') {
          this.ship.heal(30);
        } else if (pu.type === 'weapon') {
          this.ship.upgradeWeapon();
        }
        return false;
      }
      
      return pu.active;
    });
    
    if (this.level >= 6) {
      // Verificar si es nivel de jefe (6, 11, 16, 21, etc.)
      const shouldSpawnBoss = (this.level - 6) % 5 === 0 && !this.bossActive && !this.bossDefeated;
      
      if (shouldSpawnBoss) {
        this.spawnBoss();
      }
      
      this.enemyShips = this.enemyShips.filter(enemy => {
        enemy.update(this.width);
        
        if (enemy.shouldShoot()) {
          const projectiles = enemy.shoot();
          if (Array.isArray(projectiles)) {
            this.projectiles.push(...projectiles);
          } else {
            this.projectiles.push(projectiles);
          }
        }
        
        if (enemy.collidesWith(this.ship)) {
          this.ship.takeDamage(enemy.isBoss ? 50 : 30);
          return false;
        }
        
        if (enemy.y > this.height) return false;
        
        // Si el jefe es derrotado
        if (enemy.isBoss && !enemy.active) {
          this.bossActive = false;
          this.bossDefeated = true;
          // Soltar item de vida donde murió el jefe
          this.spawnPowerUp(enemy.x + enemy.width / 2 - 12, enemy.y, 'health');
        }
        
        return enemy.active;
      });
    }
    
    this.asteroids = this.asteroids.filter(a => {
      a.update();
      if (a.collidesWith(this.ship)) {
        this.ship.takeDamage(20);
        return false;
      }
      if (a.y > this.height) return false;
      return a.active;
    });
    
    this.projectiles.forEach(proj => {
      if (!proj.isEnemy) {
        this.asteroids.forEach(ast => {
          if (proj.active && ast.active && proj.collidesWith(ast)) {
            proj.active = false;
            ast.active = false;
            this.score += Math.floor(ast.width);
          }
        });
        this.enemyShips.forEach(enemy => {
          if (proj.active && enemy.active && proj.collidesWith(enemy)) {
            proj.active = false;
            enemy.takeDamage();
            if (!enemy.active) {
              this.score += enemy.isBoss ? 500 : 100;
            }
          }
        });
      } else {
        if (proj.active && proj.collidesWith(this.ship)) {
          proj.active = false;
          this.ship.takeDamage(10);
        }
      }
    });
    
    this.asteroids = this.asteroids.filter(a => a.active);
    this.projectiles = this.projectiles.filter(p => p.active);
    this.enemyShips = this.enemyShips.filter(e => e.active);
    
    this.asteroidSpawnTimer++;
    if (this.asteroidSpawnTimer >= this.asteroidSpawnInterval) {
      this.spawnAsteroid();
      this.asteroidSpawnTimer = 0;
    }
    
    if (this.level >= 6 && !this.bossActive) {
      this.enemySpawnTimer++;
      if (this.enemySpawnTimer >= this.enemySpawnInterval) {
        this.spawnEnemyShip();
        this.enemySpawnTimer = 0;
      }
    }
    
    // Spawn de power-ups de arma
    this.powerUpSpawnTimer++;
    if (this.powerUpSpawnTimer >= this.powerUpSpawnInterval) {
      const x = Math.random() * (this.width - 30);
      this.spawnPowerUp(x, -30, 'weapon');
      this.powerUpSpawnTimer = 0;
    }
    
    const prevLevel = this.level;
    this.level = Math.floor(this.score / 500) + 1;
    
    // Resetear flag de jefe derrotado cuando cambia de nivel
    if (this.level !== prevLevel) {
      this.bossDefeated = false;
    }
    
    this.asteroidSpawnInterval = Math.max(20, 60 - this.level * 5);
    
    if (!this.ship.active) {
      this.gameOver = true;
    }
  }

  draw() {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.stars.forEach(star => star.draw(this.ctx));
    this.asteroids.forEach(a => a.draw(this.ctx));
    this.powerUps.forEach(pu => pu.draw(this.ctx));
    this.enemyShips.forEach(e => e.draw(this.ctx));
    this.projectiles.forEach(p => p.draw(this.ctx));
    this.ship.draw(this.ctx);
    this.drawHUD();
  }

  drawHUD() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(`Puntos: ${this.score}`, 20, 30);
    this.ctx.fillText(`Nivel: ${this.level}`, 20, 60);
    
    if (this.level >= 6) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText('¡NAVES ENEMIGAS ACTIVAS!', 20, 90);
    }
    
    if (this.bossActive) {
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.font = 'bold 20px Arial';
      this.ctx.fillText('⚠️ ¡JEFE APARECIÓ! ⚠️', this.width / 2 - 100, 50);
    }
    
    if (this.ship.weaponUpgrade) {
      this.ctx.fillStyle = '#a855f7';
      this.ctx.font = 'bold 14px Arial';
      const timeLeft = Math.ceil(this.ship.weaponUpgradeTimer / 60);
      this.ctx.fillText(`⚡ ARMA DOBLE: ${timeLeft}s`, 20, 120);
    }
    
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
    this.enemyShips = [];
    this.powerUps = [];
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.asteroidSpawnTimer = 0;
    this.asteroidSpawnInterval = 60;
    this.enemySpawnTimer = 0;
    this.powerUpSpawnTimer = 0;
    this.bossActive = false;
    this.bossDefeated = false;
  }
}

export default function SpaceDefenseGame() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animationRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

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
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setIsPaused(prev => !prev);
        return;
      }
      gameRef.current.keys[e.key] = true;
      if (e.key === ' ' && isPlaying && !isPaused) {
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
  }, [isPlaying, isPaused]);

  useEffect(() => {
    if (!isPlaying || isPaused) return;
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
  }, [isPlaying, isPaused]);

  const startGame = () => {
    if (gameRef.current) {
      gameRef.current.reset();
      setGameOver(false);
      setIsPlaying(true);
      setShowInstructions(false);
      setIsPaused(false);
    }
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)',display:'flex',alignItems:'center',justifyContent:'center',padding:'32px'}}>
      <div style={{maxWidth:'896px',width:'100%'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',marginBottom:'16px'}}>
            <svg style={{width:'48px',height:'48px',color:'#60a5fa'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <h1 style={{fontSize:'48px',fontWeight:'bold',color:'white',margin:0}}>Defensa Espacial</h1>
            <svg style={{width:'48px',height:'48px',color:'#fbbf24'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p style={{color:'#d1d5db',fontSize:'18px',margin:0}}>Protege tu nave de los asteroides</p>
        </div>
        <div style={{position:'relative',backgroundColor:'#1e293b',borderRadius:'12px',overflow:'hidden',border:'4px solid #334155',boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)'}}>
          <canvas ref={canvasRef} style={{width:'100%',height:'auto',display:'block'}} />
          {showInstructions && !isPlaying && (
            <div style={{position:'absolute',inset:0,backgroundColor:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{backgroundColor:'#1e293b',padding:'32px',borderRadius:'12px',border:'2px solid #a855f7',maxWidth:'448px'}}>
                <h2 style={{fontSize:'30px',fontWeight:'bold',color:'white',marginBottom:'24px',textAlign:'center'}}>¿Cómo Jugar?</h2>
                <div style={{display:'flex',flexDirection:'column',gap:'16px',marginBottom:'32px'}}>
                  <div style={{display:'flex',gap:'12px',color:'#e5e7eb'}}>
                    <svg style={{width:'24px',height:'24px',flexShrink:0,marginTop:'4px',color:'#fbbf24'}} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div>
                      <p style={{margin:0,fontWeight:'600'}}>Movimiento</p>
                      <p style={{margin:0,fontSize:'14px',color:'#9ca3af'}}>Usa ← → ↑ ↓ o WASD para mover la nave</p>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'12px',color:'#e5e7eb'}}>
                    <svg style={{width:'24px',height:'24px',flexShrink:0,marginTop:'4px',color:'#fbbf24'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <p style={{margin:0,fontWeight:'600'}}>Disparar</p>
                      <p style={{margin:0,fontSize:'14px',color:'#9ca3af'}}>Presiona ESPACIO para disparar</p>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'12px',color:'#e5e7eb'}}>
                    <svg style={{width:'24px',height:'24px',flexShrink:0,marginTop:'4px',color:'#60a5fa'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <div>
                      <p style={{margin:0,fontWeight:'600'}}>Objetivo</p>
                      <p style={{margin:0,fontSize:'14px',color:'#9ca3af'}}>Destruye asteroides y evita colisiones</p>
                    </div>
                  </div>
                </div>
                <button onClick={startGame} style={{width:'100%',background:'linear-gradient(to right, #9333ea, #2563eb)',color:'white',fontWeight:'bold',padding:'16px 24px',borderRadius:'8px',fontSize:'20px',border:'none',cursor:'pointer',transition:'transform 0.2s'}} onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                  ¡Comenzar Juego!
                </button>
              </div>
            </div>
          )}
          {isPaused && isPlaying && (
            <div style={{position:'absolute',inset:0,backgroundColor:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{backgroundColor:'#1e293b',padding:'32px',borderRadius:'12px',border:'2px solid #fbbf24',textAlign:'center'}}>
                <h2 style={{fontSize:'36px',fontWeight:'bold',color:'#fbbf24',marginBottom:'16px'}}>⏸️ PAUSA</h2>
                <p style={{color:'#d1d5db',fontSize:'18px',marginBottom:'24px'}}>Presiona P o ESC para continuar</p>
                <button onClick={() => setIsPaused(false)} style={{background:'linear-gradient(to right, #9333ea, #2563eb)',color:'white',fontWeight:'bold',padding:'12px 32px',borderRadius:'8px',fontSize:'20px',border:'none',cursor:'pointer',transition:'transform 0.2s'}} onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                  Continuar
                </button>
              </div>
            </div>
          )}
          {gameOver && (
            <div style={{position:'absolute',inset:0,backgroundColor:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{backgroundColor:'#1e293b',padding:'32px',borderRadius:'12px',border:'2px solid #ef4444',textAlign:'center'}}>
                <h2 style={{fontSize:'36px',fontWeight:'bold',color:'#ef4444',marginBottom:'16px'}}>¡Game Over!</h2>
                <p style={{color:'white',fontSize:'24px',marginBottom:'8px'}}>Puntuación Final</p>
                <p style={{color:'#fbbf24',fontSize:'48px',fontWeight:'bold',marginBottom:'24px'}}>{finalScore}</p>
                <button onClick={startGame} style={{background:'linear-gradient(to right, #16a34a, #2563eb)',color:'white',fontWeight:'bold',padding:'12px 32px',borderRadius:'8px',fontSize:'20px',border:'none',cursor:'pointer',transition:'transform 0.2s'}} onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                  Jugar de Nuevo
                </button>
              </div>
            </div>
          )}
        </div>
        <div style={{marginTop:'24px',backgroundColor:'#1e293b',borderRadius:'8px',padding:'24px',border:'2px solid #334155'}}>
          <h3 style={{fontSize:'20px',fontWeight:'bold',color:'white',marginBottom:'16px'}}>📖 Acerca del Juego</h3>
          <p style={{color:'#d1d5db',fontSize:'14px',lineHeight:'1.6',marginBottom:'20px'}}>
            Defensa Espacial es un juego arcade de acción donde controlas una nave espacial que debe sobrevivir 
            en un campo de asteroides. Destruye asteroides para ganar puntos, evita las colisiones y mantén tu 
            nave intacta. A medida que avanzas de nivel, la dificultad aumenta con más asteroides y, a partir del 
            nivel 6, ¡naves enemigas que disparan!
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:'16px',marginBottom:'20px'}}>
            <div style={{backgroundColor:'#0f172a',padding:'16px',borderRadius:'8px',border:'1px solid #334155'}}>
              <h4 style={{color:'#fbbf24',fontSize:'16px',fontWeight:'bold',marginBottom:'8px'}}>🎮 Controles</h4>
              <div style={{color:'#d1d5db',fontSize:'13px',lineHeight:'1.8'}}>
                <p style={{margin:'4px 0'}}>⬅️ ⬆️ ➡️ ⬇️ o <strong>WASD</strong> - Mover nave</p>
                <p style={{margin:'4px 0'}}>🚀 <strong>ESPACIO</strong> - Disparar</p>
                <p style={{margin:'4px 0'}}>⏸️ <strong>P</strong> o <strong>ESC</strong> - Pausar</p>
              </div>
            </div>
            <div style={{backgroundColor:'#0f172a',padding:'16px',borderRadius:'8px',border:'1px solid #334155'}}>
              <h4 style={{color:'#60a5fa',fontSize:'16px',fontWeight:'bold',marginBottom:'8px'}}>🎯 Objetivos</h4>
              <div style={{color:'#d1d5db',fontSize:'13px',lineHeight:'1.8'}}>
                <p style={{margin:'4px 0'}}>💎 Destruye asteroides para ganar puntos</p>
                <p style={{margin:'4px 0'}}>💚 Mantén tu salud al máximo</p>
                <p style={{margin:'4px 0'}}>🚨 Desde nivel 6: Destruye naves enemigas</p>
                <p style={{margin:'4px 0'}}>👹 Niveles 6, 11, 16...: ¡Derrota al JEFE!</p>
              </div>
            </div>
            <div style={{backgroundColor:'#0f172a',padding:'16px',borderRadius:'8px',border:'1px solid #334155'}}>
              <h4 style={{color:'#fbbf24',fontSize:'16px',fontWeight:'bold',marginBottom:'8px'}}>⭐ Power-Ups</h4>
              <div style={{color:'#d1d5db',fontSize:'13px',lineHeight:'1.8'}}>
                <p style={{margin:'4px 0'}}>💚 <strong>Cruz Verde</strong> - Recupera +30 vida</p>
                <p style={{margin:'4px 0'}}>⚡ <strong>Estrella</strong> - Disparo doble (10s)</p>
                <p style={{margin:'4px 0'}}>🎁 Jefes sueltan cruz de vida al morir</p>
              </div>
            </div>
          </div>
        </div>
        <div style={{marginTop:'16px',backgroundColor:'#1e293b',borderRadius:'8px',padding:'24px',border:'2px solid #334155'}}>
          <h3 style={{fontSize:'20px',fontWeight:'bold',color:'white',marginBottom:'12px'}}>⚙️ Características del Proyecto</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:'16px',color:'#d1d5db',fontSize:'14px'}}>
            <div>
              <p style={{margin:0,color:'#a855f7',fontWeight:'600'}}>✓ Programación Orientada a Objetos</p>
              <p style={{fontSize:'12px',color:'#9ca3af'}}>Clases: GameObject, Ship, Projectile, Asteroid, Star, Game</p>
            </div>
            <div>
              <p style={{margin:0,color:'#60a5fa',fontWeight:'600'}}>✓ React + Hooks</p>
              <p style={{fontSize:'12px',color:'#9ca3af'}}>useState, useEffect, useRef</p>
            </div>
            <div>
              <p style={{margin:0,color:'#22c55e',fontWeight:'600'}}>✓ Canvas API</p>
              <p style={{fontSize:'12px',color:'#9ca3af'}}>Renderizado 2D en tiempo real</p>
            </div>
            <div>
              <p style={{margin:0,color:'#fbbf24',fontWeight:'600'}}>✓ Game Loop</p>
              <p style={{fontSize:'12px',color:'#9ca3af'}}>Actualización y dibujado por frames</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}