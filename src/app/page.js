"use client";
import { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text,
  Line,
  Transformer,
} from "react-konva";
import useImage from "use-image";

export default function Home() {
  const [imageSrc, setImageSrc] = useState(null); // Uploaded image source
  const [tool, setTool] = useState("none"); // Current tool selection
  const [lines, setLines] = useState([]); // Freehand drawing
  const [textBoxes, setTextBoxes] = useState([]); // Text boxes
  const [selectedTextId, setSelectedTextId] = useState(null); // Selected text for editing
  const [isTransformerEnabled, setIsTransformerEnabled] = useState(false); // Transformer toggle
  const [isDraggable, setIsDraggable] = useState(true); // Toggle draggable state
  const [history, setHistory] = useState([
    { lines: [], textBoxes: [], imagePosition: { x: 100, y: 50 } },
  ]);
  const [historyStep, setHistoryStep] = useState(0); // Current step in history
  const stageRef = useRef(null); // Reference to Konva stage
  const transformerRef = useRef(null); // Reference to Transformer for resizing
  const [image] = useImage(imageSrc); // Load image using useImage hook
  const imageRef = useRef(null); // Reference for image node

  const isDrawing = useRef(false); // Track drawing state

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result); // Set image source
      reader.readAsDataURL(file);
    }
  };

  // Ensure canvas updates when the image is loaded
  useEffect(() => {
    if (imageRef.current && image) {
      imageRef.current.getLayer().batchDraw();
    }
  }, [image]); // Dependency on `image` ensures this runs only when the image changes

  // Manage transformer toggle for resizing
  useEffect(() => {
    if (transformerRef.current && isTransformerEnabled && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isTransformerEnabled]); // Dependency on `isTransformerEnabled`

  // Save current state to history
  const saveHistory = (updatedImagePosition = null) => {
    const newHistory = history.slice(0, historyStep + 1);
    const newEntry = {
      lines,
      textBoxes,
      imagePosition:
        updatedImagePosition ||
        (imageRef.current
          ? { x: imageRef.current.x(), y: imageRef.current.y() }
          : { x: 100, y: 50 }),
    };
    setHistory([...newHistory, newEntry]);
    setHistoryStep(newHistory.length);
  };

  // Undo functionality
  const handleUndo = () => {
    if (historyStep === 0) return;
    const previousStep = history[historyStep - 1];
    setLines(previousStep.lines);
    setTextBoxes(previousStep.textBoxes);
    if (imageRef.current && previousStep.imagePosition) {
      imageRef.current.position(previousStep.imagePosition);
      imageRef.current.getLayer().batchDraw();
    }
    setHistoryStep(historyStep - 1);
  };

  // Redo functionality
  const handleRedo = () => {
    if (historyStep === history.length - 1) return;
    const nextStep = history[historyStep + 1];
    setLines(nextStep.lines);
    setTextBoxes(nextStep.textBoxes);
    if (imageRef.current && nextStep.imagePosition) {
      imageRef.current.position(nextStep.imagePosition);
      imageRef.current.getLayer().batchDraw();
    }
    setHistoryStep(historyStep + 1);
  };

  // Handle mouse events for pencil tool
  const handleMouseDown = (e) => {
    if (tool !== "pencil") return;
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || tool !== "pencil") return;
    const pos = e.target.getStage().getPointerPosition();
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([pos.x, pos.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines([...lines]);
  };

  const handleMouseUp = () => {
    if (isDrawing.current) saveHistory();
    isDrawing.current = false;
  };

  const addTextBox = () => {
    const newTextBox = {
      id: textBoxes.length,
      x: 350,
      y: 100,
      text: "Double-click to edit",
    };
    setTextBoxes([...textBoxes, newTextBox]);
    saveHistory();
  };

  const handleTextEdit = (id) => {
    const text = textBoxes.find((box) => box.id === id);
    const newText = prompt("Edit text:", text.text);
    if (newText) {
      const updatedTextBoxes = textBoxes.map((box) =>
        box.id === id ? { ...box, text: newText } : box
      );
      setTextBoxes(updatedTextBoxes);
      saveHistory();
    }
  };

  const saveCanvas = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = "design.png";
    link.href = uri;
    link.click();
  };

  const toggleTransformer = () => {
    setIsTransformerEnabled(!isTransformerEnabled);
  };

  return (
    <div>
      <h1 className="font-bold">Design Page</h1>

      {/* Toolbar */}
      <div className="flex gap-2 items-center	justify-center mt-6 mb-4">
        <button onClick={handleUndo}>
          <img src="images/undo.png" style={{ height: "20px" }} alt="" />
        </button>
        <button onClick={handleRedo}>
          <img src="images/redo.png" style={{ height: "20px" }} alt="" />
        </button>
        <div>
          <button
            onClick={() => setTool(tool === "pencil" ? "none" : "pencil")}
            className="p-3"
            style={{
              backgroundColor: tool === "pencil" ? "#646cff" : "#1a1a1a",
            }}
          >
            <img
              src="images/pencil.png"
              style={{
                height: "20px",
                transform: tool === "pencil" ? "scale(1.5)" : "scale(1)",
                transition: "transform 0.2s ease",
              }}
              alt="Pencil Tool"
            />
          </button>
        </div>

        {/* <input type="file" accept="image/*" onChange={handleImageUpload} /> */}
        <button className="file-input-container">
          <input
            type="file"
            accept="image/*"
            id="file-upload"
            className="file-input"
            onChange={handleImageUpload}
          />
          <label for="file-upload" className="file-label">
            Upload Image
          </label>
        </button>
        <button onClick={addTextBox}>Add Text</button>
        <button
          onClick={toggleTransformer}
          style={{
            backgroundColor: isTransformerEnabled ? "#646cff" : "#1a1a1a",
          }}
        >
          {isTransformerEnabled ? "Disable Resize" : "Enable Resize"}
        </button>
        <button onClick={saveCanvas}>Download Design</button>
      </div>

      <Stage
        width={800}
        height={450}
        style={{ border: "1px solid #fff", backgroundColor: "#121212" }}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              draggable={isDraggable}
              ref={imageRef}
              onDragEnd={(e) =>
                saveHistory({ x: e.target.x(), y: e.target.y() })
              }
              x={history[historyStep]?.imagePosition?.x || 100}
              y={history[historyStep]?.imagePosition?.y || 50}
              height={400}
              width={(image.width / image.height) * 400}
            />
          )}
          <Transformer ref={transformerRef} />
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="red"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
            />
          ))}
          {textBoxes.map((box) => (
            <Text
              key={box.id}
              text={box.text}
              x={box.x}
              y={box.y}
              draggable={isDraggable}
              fontSize={20}
              onDragEnd={(e) => handleTextEdit(box.id)}
              onDblClick={() => handleTextEdit(box.id)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
