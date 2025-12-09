import React, { useEffect, useRef, useState, useMemo } from "react";

const tileSize = 24;

const GameCanvas: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gridSize, setGridSize] = useState<{ cols: number; rows: number }>({
    cols: 17,
    rows: 17,
  });
  const [character, setCharacter] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState("RIGHT");
  const [score, setScore] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [foodEatenAnimation, setFoodEatenAnimation] = useState<null | {
    x: number;
    y: number;
  }>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );

  // Memoize character frames and eth image
  const characterFrames = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const img = new window.Image();
        img.src = `/images/character/frame${i + 1}.svg`;
        return img;
      }),
    [],
  );
  const ethImage = useMemo(() => {
    const img = new window.Image();
    img.src = "/images/character/token.svg";
    return img;
  }, []);

  // Size canvas to full width and 40vh height and derive grid dynamically from tile size
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parentWidth =
        canvas.parentElement?.clientWidth || window.innerWidth;
      const targetHeight = Math.max(window.innerHeight * 0.4, 240);
      const rawWidth = Math.max(parentWidth, tileSize * 5); // guard tiny widths
      const rawHeight = Math.max(targetHeight, tileSize * 5);

      // Snap canvas to whole tiles so there is no invisible wall gap
      const cols = Math.max(5, Math.floor(rawWidth / tileSize));
      const rows = Math.max(5, Math.floor(rawHeight / tileSize));
      const snappedWidth = cols * tileSize;
      const snappedHeight = rows * tileSize;

      canvas.width = snappedWidth;
      canvas.height = snappedHeight;

      setGridSize({ cols, rows });

      // Keep character/food inside bounds after resize
      setCharacter((prev) =>
        prev.map((seg) => ({
          x: Math.min(seg.x, cols - 1),
          y: Math.min(seg.y, rows - 1),
        })),
      );
      setFood((prev) => ({
        x: Math.min(prev.x, cols - 1),
        y: Math.min(prev.y, rows - 1),
      }));
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, string> = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
      };
      if (keyMap[e.key] && !gameOver) {
        setDirection(keyMap[e.key]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver, gameStarted]);

  // Game logic
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const moveCharacter = () => {
      if (!gameStarted || gameOver) return;
      setCharacter((prevCharacter) => {
        const newCharacter = [...prevCharacter];
        const head = { ...newCharacter[0] };
        switch (direction) {
          case "UP":
            head.y -= 1;
            break;
          case "DOWN":
            head.y += 1;
            break;
          case "LEFT":
            head.x -= 1;
            break;
          case "RIGHT":
            head.x += 1;
            break;
          default:
            break;
        }
        // Check if character hits the boundary
        if (
          head.x < 0 ||
          head.x >= gridSize.cols ||
          head.y < 0 ||
          head.y >= gridSize.rows
        ) {
          setGameOver(true);
          return prevCharacter;
        }
        newCharacter.unshift(head);
        // Check for food collision
        if (head.x === food.x && head.y === food.y) {
          setScore((prev) => prev + 0.5);
          setFood({
            x: Math.floor(Math.random() * gridSize.cols),
            y: Math.floor(Math.random() * gridSize.rows),
          });
          setFoodEatenAnimation({ x: food.x, y: food.y });
          setTimeout(() => setFoodEatenAnimation(null), 500);
        } else {
          newCharacter.pop();
        }
        return newCharacter;
      });
      setFrameIndex((prev) => (prev + 1) % 10);
    };
    const gameLoop = setInterval(moveCharacter, 200);
    return () => clearInterval(gameLoop);
  }, [direction, food, gameOver, gameStarted, gridSize.cols, gridSize.rows]);

  // Drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw boundary to make walls obvious
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    // Draw Character and food only during active play (hide when showing text overlays)
    if (gameStarted && !gameOver) {
      const currentFrame = characterFrames[frameIndex];
      character.forEach((segment) => {
        ctx.save();
        ctx.translate(
          segment.x * tileSize + tileSize / 2,
          segment.y * tileSize + tileSize / 2,
        );
        if (direction === "LEFT") ctx.scale(-1, 1);
        ctx.drawImage(
          currentFrame,
          direction === "LEFT" ? -tileSize / 2 : -tileSize / 2,
          -tileSize / 2,
          tileSize,
          tileSize,
        );
        ctx.restore();
      });
      // Draw Ethereum token
      ctx.drawImage(
        ethImage,
        food.x * tileSize,
        food.y * tileSize,
        tileSize,
        tileSize,
      );
      // Draw "+1" animation
      if (foodEatenAnimation) {
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.fillText(
          "+1",
          foodEatenAnimation.x * tileSize + tileSize / 4,
          foodEatenAnimation.y * tileSize + tileSize / 1.5,
        );
      }
    }
    if (!gameStarted) {
      ctx.fillStyle = "yellow";
      ctx.font = "12px Arial";
      ctx.fillText(
        "Fee-ding time! Tap to start the token tango",
        canvas.width / 5 - 7,
        canvas.height / 3 + 10,
      );
      ctx.fillText(
        "while we calculate your job fees.",
        canvas.width / 5 + 20,
        canvas.height / 3 + 30,
      );
      ctx.fillText(
        "Use arrow keys to feast!🍀",
        canvas.width / 5 + 30,
        canvas.height / 3 + 100,
      );
    }
    if (gameOver) {
      ctx.fillStyle = "yellow";
      ctx.font = "12px Arial";
      ctx.fillText(
        "Fee-ding frenzy finished!",
        canvas.width / 5 + 40,
        canvas.height / 3,
      );
      ctx.fillText(
        "Still brewing up your job fees... almost there!🍀⌛",
        canvas.width / 10 + 20,
        canvas.height / 3 + 30,
      );
      ctx.fillText(
        `Score: ${score}`,
        canvas.width / 3 + 30,
        canvas.height / 2 + 20,
      );
      ctx.fillStyle = "#82fbd0";
      ctx.font = "14px Arial";
      ctx.fillText(
        "Tap to Restart",
        canvas.width / 3 + 20,
        canvas.height / 2 + 80,
      );
    }
  }, [
    character,
    food,
    gameOver,
    gameStarted,
    score,
    frameIndex,
    direction,
    foodEatenAnimation,
    characterFrames,
    ethImage,
  ]);

  // Reset on open/close
  useEffect(() => {
    setGameStarted(false);
    setGameOver(false);
    const startX = Math.max(2, Math.floor(gridSize.cols / 2));
    const startY = Math.max(2, Math.floor(gridSize.rows / 2));
    setCharacter([{ x: startX, y: startY }]);
    setFood({
      x: Math.max(1, Math.min(gridSize.cols - 2, startX + 2)),
      y: Math.max(1, Math.min(gridSize.rows - 2, startY)),
    });
    setDirection("RIGHT");
    setScore(0);
    setFrameIndex(0);
    setFoodEatenAnimation(null);
  }, [gridSize]);

  const handleCanvasClick = () => {
    if (!gameStarted || gameOver) {
      setGameStarted(true);
      const startX = Math.max(2, Math.floor(gridSize.cols / 2));
      const startY = Math.max(2, Math.floor(gridSize.rows / 2));
      setCharacter([{ x: startX, y: startY }]);
      setFood({
        x: Math.max(1, Math.min(gridSize.cols - 2, startX + 2)),
        y: Math.max(1, Math.min(gridSize.rows - 2, startY)),
      });
      setDirection("RIGHT");
      setGameOver(false);
      setScore(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) setDirection("RIGHT");
      else if (dx < -30) setDirection("LEFT");
    } else {
      if (dy > 30) setDirection("DOWN");
      else if (dy < -30) setDirection("UP");
    }
    setTouchStart(null);
  };

  return (
    <>
      <div className="w-full h-max mx-auto bg-black rounded-xl flex flex-col gap-2 shadow-lg border border-gray-600 overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-[40vh]"
        />
      </div>
      {/* Mobile Controls */}
      <div
        className="flex flex-col items-center justify-center mt-4 md:hidden gap-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {!gameStarted && (
          <span className="text-xs text-gray-400 italic select-none">
            Swipe to move
          </span>
        )}
      </div>
      <div className="text-white text-center py-1 text-sm">Score: {score}</div>
    </>
  );
};

export default GameCanvas;
