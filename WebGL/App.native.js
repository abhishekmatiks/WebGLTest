import React, { useState, useEffect } from 'react';
import { View, Dimensions, TouchableOpacity, Text as RNText } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Canvas, Rect, Text as SkiaText, useFont } from '@shopify/react-native-skia';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const GRID_COLUMNS = 7;
const PADDING_HORIZONTAL = 20;
const GAP_RATIO = 0.05;

const totalGapWidth = (GRID_COLUMNS - 1) * GAP_RATIO;
const BOX_SIZE = (width - 2 * PADDING_HORIZONTAL) / (GRID_COLUMNS + totalGapWidth);
const GAP = BOX_SIZE * GAP_RATIO;
const FONT_SIZE = BOX_SIZE * 0.6;
const GRID_ORIGIN = { x: PADDING_HORIZONTAL, y: 30 };
const PURPLE_BG = '#6A0DAD';

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

export default function App() {
  const font = useFont(require('./assets/font.ttf'), FONT_SIZE);
  const [placedTiles, setPlacedTiles] = useState({});

  const emptyCells = [];
  puzzleLayout.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell === '') {
        emptyCells.push({
          row: r,
          col: c,
          x: GRID_ORIGIN.x + c * (BOX_SIZE + GAP),
          y: GRID_ORIGIN.y + r * (BOX_SIZE + GAP),
        });
      }
    });
  });

  const createDraggableTile = (tile, index) => {
    const initX = 20 + (index % 6) * 60;
    const initY = height - BOX_SIZE * 3 + Math.floor(index / 6) * 80;

    const x = useSharedValue(initX);
    const y = useSharedValue(initY);

    const handleTileEnd = (finalX, finalY) => {
      let closestCell = null;
      let minDist = Infinity;
      
      emptyCells.forEach(cell => {
        const dx = finalX - cell.x;
        const dy = finalY - cell.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closestCell = cell;
        }
      });

      const SNAP_THRESHOLD = BOX_SIZE;
      if (closestCell && minDist < SNAP_THRESHOLD) {
        const occupied = Object.values(placedTiles).some(pos => 
          pos.row === closestCell.row && pos.col === closestCell.col
        );
        
        if (!occupied) {
          x.value = withSpring(closestCell.x);
          y.value = withSpring(closestCell.y);
          
          setPlacedTiles(prev => ({
            ...prev,
            [tile.id]: { row: closestCell.row, col: closestCell.col },
          }));
          return;
        }
      }

      x.value = withSpring(initX);
      y.value = withSpring(initY);

      setPlacedTiles(prev => {
        if (prev[tile.id]) {
          const newPlaced = { ...prev };
          delete newPlaced[tile.id];
          return newPlaced;
        }
        return prev;
      });
    };

    const pan = Gesture.Pan()
      .onChange((e) => {
        x.value += e.changeX;
        y.value += e.changeY;
      })
      .onEnd(() => {
        runOnJS(handleTileEnd)(x.value, y.value);
      });

    const style = useAnimatedStyle(() => ({
      position: 'absolute',
      left: x.value,
      top: y.value,
      width: BOX_SIZE,
      height: BOX_SIZE,
    }));

    return { ...tile, gesture: pan, style, x, y, initX, initY };
  };

  const draggableTiles = baseTiles.map(createDraggableTile);

  useEffect(() => {
    draggableTiles.forEach(tile => {
      if (placedTiles[tile.id]) {
        const pos = placedTiles[tile.id];
        const targetX = GRID_ORIGIN.x + pos.col * (BOX_SIZE + GAP);
        const targetY = GRID_ORIGIN.y + pos.row * (BOX_SIZE + GAP);
        tile.x.value = withSpring(targetX);
        tile.y.value = withSpring(targetY);
      } else {
        tile.x.value = withSpring(tile.initX);
        tile.y.value = withSpring(tile.initY);
      }
    });
  }, [placedTiles]);

  const resetTiles = () => {
    setPlacedTiles({});
  };

  if (!font) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: PURPLE_BG }}>
        <Canvas style={{ flex: 1 }}>
          {/* Grid */}
          {puzzleLayout.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;
              const x = GRID_ORIGIN.x + colIdx * (BOX_SIZE + GAP);
              const y = GRID_ORIGIN.y + rowIdx * (BOX_SIZE + GAP);

              if (cell === '') {
                return (
                  <Rect
                    key={key}
                    x={x}
                    y={y}
                    width={BOX_SIZE}
                    height={BOX_SIZE}
                    color="white"
                    style="stroke"
                    strokeWidth={2}
                    rx={6}
                  />
                );
              } else if (cell === 'z') {
                return (
                  <Rect
                    key={key}
                    x={x}
                    y={y}
                    width={BOX_SIZE}
                    height={BOX_SIZE}
                    color={PURPLE_BG}
                  />
                );
              } else {
                return (
                  <SkiaText
                    key={key}
                    x={x + (BOX_SIZE - font.getTextWidth(cell)) / 2}
                    y={y + BOX_SIZE / 2 + FONT_SIZE / 3}
                    text={cell}
                    font={font}
                    color="white"
                  />
                );
              }
            })
          )}
        </Canvas>

        {draggableTiles.map(tile => (
          <GestureDetector key={tile.id} gesture={tile.gesture}>
            <Animated.View style={tile.style}>
              <View
                style={{
                  backgroundColor: tile.color,
                  width: '100%',
                  height: '100%',
                  borderRadius: 6,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <RNText style={{ color: 'white', fontWeight: 'bold', fontSize: FONT_SIZE }}>
                  {tile.number}
                </RNText>
              </View>
            </Animated.View>
          </GestureDetector>
        ))}

        <TouchableOpacity
          onPress={resetTiles}
          style={{
            position: 'absolute',
            bottom: 20,
            alignSelf: 'center',
            backgroundColor: '#FF006E',
            paddingVertical: BOX_SIZE * 0.3,
            paddingHorizontal: BOX_SIZE * 0.7,
            borderRadius: 10,
          }}
        >
          <RNText style={{ color: 'white', fontWeight: 'bold', fontSize: FONT_SIZE * 0.65 }}>
            Reset
          </RNText>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}