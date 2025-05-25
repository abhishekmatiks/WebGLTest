// three js experimental
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const puzzleLayout = [
  ['4', '+', '', '+', '', '=', '15'],
  ['+', 'z', '×', 'z', '÷', 'z', 'z'],
  ['', '+', '', '×', '', '=', '24'],
  ['−', 'z', '−', 'z', '÷', 'z', 'z'],
  ['', '+', '', '−', '', '=', '14'],
  ['=', 'z', '=', 'z', '=', 'z', 'z'],
  ['3', 'z', '12', 'z', '4', 'z', 'z'],
];

const baseTiles = [
  { id: 0, number: '3', color: '#FF595E' },
  { id: 1, number: '8', color: '#FFCA3A' },
  { id: 2, number: '5', color: '#8AC926' },
  { id: 3, number: '7', color: '#1982C4' },
  { id: 4, number: '3', color: '#6A4C93' },
  { id: 5, number: '6', color: '#FF006E' },
  { id: 6, number: '9', color: '#FB5607' },
  { id: 7, number: '1', color: '#00BBF9' },
  { id: 8, number: '3', color: '#9B5DE5' },
  { id: 9, number: '12', color: '#F15BB5' },
  { id: 10, number: '4', color: '#00F5D4' },
];

export default function PuzzleGrid() {
  const mountRef = useRef(null);
  const placedTilesRef = useRef({});
  const sceneRef = useRef(null);
  const tilesRef = useRef([]);
  const spritesRef = useRef([]);
  const droppableCellsRef = useRef([]);
  const clockRef = useRef(new THREE.Clock());
  const particleSystemRef = useRef(null);
  const animationsRef = useRef([]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x1a0a2e);
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    
    scene.fog = new THREE.Fog(0x1a0a2e, 50, 200);

    const camera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      0.1,
      1000
    );
    camera.position.z = 10;

    
    const createParticleSystem = () => {
      const particleCount = 100;
      const particles = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * width * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * height * 2;
        positions[i * 3 + 2] = Math.random() * 20 - 10;

        const color = new THREE.Color();
        color.setHSL(Math.random() * 0.2 + 0.7, 0.7, 0.5);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        sizes[i] = Math.random() * 3 + 1;
      }

      particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const particleMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: false
      });

      const particleSystem = new THREE.Points(particles, particleMaterial);
      particleSystemRef.current = particleSystem;
      scene.add(particleSystem);
    };

    createParticleSystem();

    const GRID_COLUMNS = 7;
    const GRID_ROWS = 7;
    const BOX_SIZE = 80;
    const GAP = 8;
    const GRID_ORIGIN_X = -((GRID_COLUMNS * (BOX_SIZE + GAP)) / 2) + BOX_SIZE / 2;
    const GRID_ORIGIN_Y = ((GRID_ROWS * (BOX_SIZE + GAP)) / 2) - BOX_SIZE / 2;

    const gridGroup = new THREE.Group();
    const droppableCells = [];
    droppableCellsRef.current = droppableCells;

    const createLabelSprite = (text, fontSize = 64, color = 'white') => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      
      
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(40, 40, 1);
      return sprite;
    };

    
    const createPulseAnimation = (object, intensity = 0.1, speed = 2) => {
      return {
        object,
        originalScale: object.scale.clone(),
        intensity,
        speed,
        time: Math.random() * Math.PI * 2,
        update: function(deltaTime) {
          this.time += deltaTime * this.speed;
          const scale = 1 + Math.sin(this.time) * this.intensity;
          this.object.scale.copy(this.originalScale).multiplyScalar(scale);
        }
      };
    };

    const createFloatAnimation = (object, amplitude = 5, speed = 1) => {
      return {
        object,
        originalY: object.position.y,
        amplitude,
        speed,
        time: Math.random() * Math.PI * 2,
        update: function(deltaTime) {
          this.time += deltaTime * this.speed;
          this.object.position.y = this.originalY + Math.sin(this.time) * this.amplitude;
        }
      };
    };

    const createRotationAnimation = (object, speed = 0.5) => {
      return {
        object,
        speed,
        update: function(deltaTime) {
          this.object.rotation.z += deltaTime * this.speed;
        }
      };
    };

    
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLUMNS; col++) {
        const value = puzzleLayout[row][col];
        const x = GRID_ORIGIN_X + col * (BOX_SIZE + GAP);
        const y = GRID_ORIGIN_Y - row * (BOX_SIZE + GAP);

        if (value === '') {
          const geometry = new THREE.PlaneGeometry(BOX_SIZE, BOX_SIZE);
          const material = new THREE.MeshBasicMaterial({
            color: 0x4a90ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.2,
          });
          const cell = new THREE.Mesh(geometry, material);
          cell.position.set(x, y, 0);
          cell.userData = { 
            row, 
            col, 
            type: 'dropZone',
            isEmpty: true 
          };
          
          
          animationsRef.current.push(createPulseAnimation(cell, 0.05, 1.5));
          
          gridGroup.add(cell);
          droppableCells.push(cell);
        } else if (value !== 'z') {
          const sprite = createLabelSprite(value, 64, '#ffffff');
          sprite.position.set(x, y, 1);
          
          
          animationsRef.current.push(createFloatAnimation(sprite, 2, 0.8));
          
          gridGroup.add(sprite);
        }
      }
    }

    scene.add(gridGroup);

    const tiles = [];
    const sprites = [];
    tilesRef.current = tiles;
    spritesRef.current = sprites;
    
    const TILE_COLS = 6;
    const tileAreaY = -height / 2 + BOX_SIZE * 2;
    
    baseTiles.forEach((tileData, index) => {
      const geometry = new THREE.PlaneGeometry(BOX_SIZE, BOX_SIZE);
      const material = new THREE.MeshBasicMaterial({ 
        color: tileData.color,
        transparent: true,
        opacity: 0.9
      });
      const tile = new THREE.Mesh(geometry, material);

      const col = index % TILE_COLS;
      const row = Math.floor(index / TILE_COLS);

      const initX = -width / 2 + 100 + col * (BOX_SIZE + 15);
      const initY = tileAreaY + row * (BOX_SIZE + 20);

      tile.position.set(initX, initY, 1);
      tile.userData = { 
        id: tileData.id,
        originalX: initX,
        originalY: initY,
        type: 'draggable',
        number: tileData.number,
        originalColor: tileData.color
      };
      
      
      tile.userData.originalOpacity = 0.9;
      
      
      animationsRef.current.push(createRotationAnimation(tile, 0.2));
      
      scene.add(tile);
      tiles.push(tile);

      const label = createLabelSprite(tileData.number, 64, 'white');
      label.position.set(initX, initY, 2);
      label.userData = { 
        tileId: tileData.id,
        type: 'label'
      };
      
      
      animationsRef.current.push(createPulseAnimation(label, 0.08, 1.2));
      
      scene.add(label);
      sprites.push(label);
    });

    
    tiles.forEach((tile, index) => {
      tile.scale.set(0, 0, 0);
      tile.rotation.z = Math.PI * 2;
      
      setTimeout(() => {
        const startTime = performance.now();
        const duration = 800;
        
        const animateEntrance = () => {
          const elapsed = performance.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          tile.scale.setScalar(easeOut);
          tile.rotation.z = (1 - easeOut) * Math.PI * 2;
          
          if (progress < 1) {
            requestAnimationFrame(animateEntrance);
          }
        };
        animateEntrance();
      }, index * 100);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let draggingTile = null;
    let draggingLabel = null;
    let dragOffset = new THREE.Vector3();
    let hoveredTile = null;

    const updateMousePosition = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const findNearestDropZone = (position) => {
      let minDistance = Infinity;
      let nearestCell = null;
      
      droppableCells.forEach(cell => {
        const distance = position.distanceTo(cell.position);
        if (distance < minDistance && distance < BOX_SIZE * 0.8) {
          minDistance = distance;
          nearestCell = cell;
        }
      });
      
      return nearestCell;
    };

    const isCellOccupied = (row, col) => {
      return Object.values(placedTilesRef.current).some(tile => 
        tile.row === row && tile.col === col
      );
    };

    
    const animateTileToPosition = (tile, label, targetPos, duration = 300) => {
      const startPos = tile.position.clone();
      const startTime = performance.now();
      
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        tile.position.lerpVectors(startPos, targetPos, easeOut);
        if (label) {
          label.position.copy(tile.position);
          label.position.z = tile.position.z + 1;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    };

    
    const createSuccessParticles = (position) => {
      const particleCount = 20;
      const particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
          transparent: true,
          opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          Math.random() * 50
        );
        
        particle.userData = { velocity, life: 1 };
        scene.add(particle);
        particles.push(particle);
      }
      
      
      const animateParticles = () => {
        particles.forEach((particle, index) => {
          particle.userData.life -= 0.02;
          particle.userData.velocity.y -= 2; 
          
          particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
          particle.material.opacity = particle.userData.life;
          particle.scale.setScalar(particle.userData.life);
          
          if (particle.userData.life <= 0) {
            scene.remove(particle);
            particles.splice(index, 1);
          }
        });
        
        if (particles.length > 0) {
          requestAnimationFrame(animateParticles);
        }
      };
      animateParticles();
    };

    const onMouseDown = (event) => {
      try {
        updateMousePosition(event);
        raycaster.setFromCamera(mouse, camera);
        
        const intersects = raycaster.intersectObjects(tiles);
        
        if (intersects.length > 0) {
          draggingTile = intersects[0].object;
          const tileIndex = tiles.indexOf(draggingTile);
          
          if (tileIndex !== -1) {
            draggingLabel = sprites[tileIndex];
            isDragging = true;
            dragOffset.copy(intersects[0].point).sub(draggingTile.position);
            
            
            draggingTile.scale.setScalar(1.2);
            draggingTile.position.z = 3;
            draggingTile.material.opacity = 0.8;
            
            if (draggingLabel) {
              draggingLabel.position.z = 4;
              draggingLabel.scale.setScalar(1.2);
            }
          }
        }
      } catch (error) {
        console.error('Mouse down error:', error);
        isDragging = false;
        draggingTile = null;
        draggingLabel = null;
      }
    };

    const onMouseMove = (event) => {
      updateMousePosition(event);
      
      if (!isDragging) {
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(tiles);
        
        
        if (hoveredTile && hoveredTile !== draggingTile) {
          hoveredTile.scale.setScalar(1);
          hoveredTile.material.opacity = hoveredTile.userData.originalOpacity;
        }
        
        
        if (intersects.length > 0 && intersects[0].object !== draggingTile) {
          hoveredTile = intersects[0].object;
          hoveredTile.scale.setScalar(1.1);
          hoveredTile.material.opacity = 1;
        } else {
          hoveredTile = null;
        }
      }
      
      if (!isDragging || !draggingTile) return;
      
      try {
        raycaster.setFromCamera(mouse, camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const worldPosition = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(plane, worldPosition)) {
          const newPosition = worldPosition.sub(dragOffset);
          
          draggingTile.position.x = newPosition.x;
          draggingTile.position.y = newPosition.y;
          
          if (draggingLabel) {
            draggingLabel.position.x = newPosition.x;
            draggingLabel.position.y = newPosition.y;
          }
          
          
          const nearestCell = findNearestDropZone(draggingTile.position);
          droppableCells.forEach(cell => {
            if (cell === nearestCell && !isCellOccupied(cell.userData.row, cell.userData.col)) {
              cell.material.opacity = 0.6;
              cell.material.color.setHex(0x00ff00);
            } else {
              cell.material.opacity = 0.2;
              cell.material.color.setHex(0x4a90ff);
            }
          });
        }
      } catch (error) {
        console.error('Mouse move error:', error);
      }
    };

    const onMouseUp = () => {
      if (!isDragging || !draggingTile) return;

      try {
        const nearestCell = findNearestDropZone(draggingTile.position);
        
        
        droppableCells.forEach(cell => {
          cell.material.opacity = 0.2;
          cell.material.color.setHex(0x4a90ff);
        });
        
        if (nearestCell && !isCellOccupied(nearestCell.userData.row, nearestCell.userData.col)) {
          
          createSuccessParticles(nearestCell.position);
          
          
          const targetPos = new THREE.Vector3(nearestCell.position.x, nearestCell.position.y, 1);
          animateTileToPosition(draggingTile, draggingLabel, targetPos);
          
          placedTilesRef.current = {
            ...placedTilesRef.current,
            [draggingTile.userData.id]: {
              row: nearestCell.userData.row,
              col: nearestCell.userData.col
            }
          };
        } else {
          
          const originalPos = new THREE.Vector3(
            draggingTile.userData.originalX, 
            draggingTile.userData.originalY, 
            1
          );
          animateTileToPosition(draggingTile, draggingLabel, originalPos, 500);
          
          const newPlaced = { ...placedTilesRef.current };
          delete newPlaced[draggingTile.userData.id];
          placedTilesRef.current = newPlaced;
        }
        
        
        setTimeout(() => {
          if (draggingTile) {
            draggingTile.scale.setScalar(1);
            draggingTile.material.opacity = draggingTile.userData.originalOpacity;
          }
          if (draggingLabel) {
            draggingLabel.scale.setScalar(1);
          }
        }, 300);
        
      } catch (error) {
        console.error('Mouse up error:', error);
      }

      isDragging = false;
      draggingTile = null;
      draggingLabel = null;
    };

    const resetTiles = () => {
      placedTilesRef.current = {};
      tiles.forEach((tile, index) => {
        if (tile.userData) {
          const originalPos = new THREE.Vector3(
            tile.userData.originalX, 
            tile.userData.originalY, 
            1
          );
          animateTileToPosition(tile, sprites[index], originalPos, 400);
        }
      });
    };
    
    window.resetPuzzle = resetTiles;

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    const animate = () => {
      requestAnimationFrame(animate);
      
      const deltaTime = clockRef.current.getDelta();
      
      
      animationsRef.current.forEach(animation => {
        animation.update(deltaTime);
      });
      
      
      if (particleSystemRef.current) {
        particleSystemRef.current.rotation.y += deltaTime * 0.1;
        const positions = particleSystemRef.current.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += Math.sin(performance.now() * 0.001 + i) * 0.1;
        }
        particleSystemRef.current.geometry.attributes.position.needsUpdate = true;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
      
      if (mountRef.current && canvas.parentNode) {
        mountRef.current.removeChild(canvas);
      }
      scene.clear();
      renderer.dispose();
    };
  }, []);

  const handleReset = () => {
    if (window.resetPuzzle) {
      window.resetPuzzle();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={mountRef} />
      <button
        onClick={handleReset}
        className="reset-button"
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(45deg, #FF006E, #FB5607)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          padding: '12px 24px',
          borderRadius: '25px',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 8px 20px rgba(255, 0, 110, 0.4)',
          transition: 'all 0.3s ease',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateX(-50%) translateY(-5px) scale(1.05)';
          e.target.style.boxShadow = '0 12px 30px rgba(255, 0, 110, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateX(-50%) translateY(0px) scale(1)';
          e.target.style.boxShadow = '0 8px 20px rgba(255, 0, 110, 0.4)';
        }}
      >
         Reset
      </button>
    </div>
  );
}
