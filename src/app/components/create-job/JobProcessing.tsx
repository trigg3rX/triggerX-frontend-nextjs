import React, { useEffect, useRef, useState, useMemo } from "react";

const steps = [
  { id: 1, text: "Preparing data...", status: "pending" },
  { id: 2, text: "Estimating fees...", status: "pending" },
  { id: 3, text: "Submitting to blockchain...", status: "pending" },
  { id: 4, text: "Finalizing...", status: "pending" },
];

const gridSize = 17;
const tileSize = 24;

// Public domain/free sound URLs
// const eatSoundUrl = "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae7c7.mp3";
// const gameOverSoundUrl = "https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b4bfa.mp3";

const JobProcessing: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
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

  // Sound effects
  //   const eatSound = useMemo(() => (typeof window !== "undefined" ? new window.Audio(eatSoundUrl) : null), []);
  //   const gameOverSound = useMemo(() => (typeof window !== "undefined" ? new window.Audio(gameOverSoundUrl) : null), []);

  // Progress logic
  useEffect(() => {
    if (
      currentStep < steps.length &&
      steps[currentStep].status === "completed"
    ) {
      setTimeout(() => setCurrentStep((prev) => prev + 1), 10000);
    }
  }, [currentStep]);

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
          head.x >= gridSize ||
          head.y < 0 ||
          head.y >= gridSize
        ) {
          setGameOver(true);
          //   if (gameOverSound) { gameOverSound.currentTime = 0; gameOverSound.play(); }
          return prevCharacter;
        }
        newCharacter.unshift(head);
        // Check for food collision
        if (head.x === food.x && head.y === food.y) {
          setScore((prev) => prev + 0.5);
          setFood({
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize),
          });
          setFoodEatenAnimation({ x: food.x, y: food.y });
          setTimeout(() => setFoodEatenAnimation(null), 500);
          //   if (eatSound) { eatSound.currentTime = 0; eatSound.play(); }
        } else {
          newCharacter.pop();
        }
        return newCharacter;
      });
      setFrameIndex((prev) => (prev + 1) % 10);
    };
    const gameLoop = setInterval(moveCharacter, 200);
    return () => clearInterval(gameLoop);
  }, [direction, food, gameOver, gameStarted]);

  // Drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw Character
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
    if (!gameStarted) {
      ctx.fillStyle = "yellow";
      ctx.font = "14px Arial";
      ctx.fillText(
        "Fee-ding time! Tap to start the token tango",
        canvas.width / 5 - 7,
        canvas.height / 3 + 30,
      );
      ctx.fillText(
        "while we calculate your job fees.",
        canvas.width / 5 + 30,
        canvas.height / 3 + 60,
      );
      ctx.fillText(
        "Use arrow keys to feast!🍀",
        canvas.width / 5 + 50,
        canvas.height / 3 + 100,
      );
    }
    if (gameOver) {
      ctx.fillStyle = "yellow";
      ctx.font = "14px Arial";
      ctx.fillText(
        "Fee-ding frenzy finished!",
        canvas.width / 4 + 30,
        canvas.height / 3 + 30,
      );
      ctx.fillText(
        "Still brewing up your job fees... almost there!🍀⌛",
        canvas.width / 10,
        canvas.height / 3 + 60,
      );
      ctx.fillText(
        `Score: ${score}`,
        canvas.width / 3 + 50,
        canvas.height / 2 + 30,
      );
      ctx.fillStyle = "#82fbd0";
      ctx.font = "16px Arial";
      ctx.fillText(
        "Tap to Restart",
        canvas.width / 3 + 29,
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
    setCurrentStep(0);
    setGameStarted(false);
    setGameOver(false);
    setCharacter([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection("RIGHT");
    setScore(0);
    setFrameIndex(0);
    setFoodEatenAnimation(null);
  }, []);

  const handleCanvasClick = () => {
    if (!gameStarted || gameOver) {
      setGameStarted(true);
      setCharacter([{ x: 10, y: 10 }]);
      setFood({ x: 15, y: 15 });
      setDirection("RIGHT");
      setGameOver(false);
      setScore(0);
    }
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <h3 className="text-white text-lg sm:text-xl text-center">
          Creating Job
        </h3>
        <div className="w-full sm:w-auto">
          {currentStep < steps.length && (
            <div
              key={steps[currentStep].id}
              className="transition-all duration-700 ease-in-out animate-pulse"
            >
              <h4 className="text-sm sm:text-md">{steps[currentStep].text}</h4>
            </div>
          )}
          {currentStep >= steps.length && (
            <div
              key={steps[steps.length - 1].id}
              className="transition-all duration-700 ease-in-out animate-pulse"
            >
              <h4 className="text-sm sm:text-md">
                {steps[steps.length - 1].text}
              </h4>
            </div>
          )}
          <div className="h-1.5 bg-gray-500 opacity-50 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-[#F8FF7C] transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      <div className="w-full bg-black rounded-xl flex flex-col gap-2 shadow-lg border border-gray-600 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={gridSize * tileSize}
          height={gridSize * tileSize}
          onClick={handleCanvasClick}
          className="w-full h-auto"
        />
      </div>
      {/* Mobile Controls */}
      <div className="flex justify-center mt-2 gap-2 sm:hidden">
        <button
          onClick={() => setDirection("UP")}
          className="p-1 bg-gray-300 rounded text-white text-lg"
        >
          ↑
        </button>
        <button
          onClick={() => setDirection("LEFT")}
          className="p-1 bg-gray-300 rounded text-white text-lg"
        >
          ←
        </button>
        <button
          onClick={() => setDirection("DOWN")}
          className="p-1 bg-gray-300 rounded text-white text-lg"
        >
          ↓
        </button>
        <button
          onClick={() => setDirection("RIGHT")}
          className="p-1 bg-gray-300 rounded text-white text-lg"
        >
          →
        </button>
      </div>
      <div className="text-white text-center py-2 text-sm sm:text-base">
        Score: {score}
      </div>
    </>
  );
};

export default JobProcessing;
