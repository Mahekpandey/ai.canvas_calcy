import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

// Typing animation component
const TypingIndicator = () => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '6px',
      padding: '12px',
      alignItems: 'center'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        backgroundColor: '#fff',
        borderRadius: '50%',
        animation: 'typingAnimation 1s infinite ease-in-out',
        animationDelay: '0s'
      }} />
      <div style={{
        width: '8px',
        height: '8px',
        backgroundColor: '#fff',
        borderRadius: '50%',
        animation: 'typingAnimation 1s infinite ease-in-out',
        animationDelay: '0.2s'
      }} />
      <div style={{
        width: '8px',
        height: '8px',
        backgroundColor: '#fff',
        borderRadius: '50%',
        animation: 'typingAnimation 1s infinite ease-in-out',
        animationDelay: '0.4s'
      }} />
      <style>
        {`
          @keyframes typingAnimation {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

const App = () => {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [tool, setTool] = useState("pen");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const colors = ["#ffffff", "#ff0000", "#00ff00", "#0000ff"];

  // Initialize Socket.IO connection
  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on('room-created', (newRoomId) => {
      setRoomId(newRoomId);
    });

    socketRef.current.on('room-joined', (joinedRoomId) => {
      setRoomId(joinedRoomId);
      setShowJoinDialog(false);
    });

    socketRef.current.on('draw', (drawData) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0);
      };
      image.src = drawData;
    });

    socketRef.current.on('canvas-state', (canvasState) => {
      if (canvasState) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const image = new Image();
        image.onload = () => {
          ctx.drawImage(image, 0, 0);
        };
        image.src = canvasState;
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Canvas initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Room management functions
  const createRoom = () => {
    socketRef.current.emit('create-room');
  };

  const joinRoom = () => {
    if (joinRoomId) {
      socketRef.current.emit('join-room', joinRoomId);
    }
  };

  // Drawing functions
  const emitDrawing = () => {
    if (roomId) {
      const canvas = canvasRef.current;
      const drawData = canvas.toDataURL();
      socketRef.current.emit('draw', { roomId, drawData });
    }
  };

  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    saveStateToUndo();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = tool === "eraser" ? "#000000" : color;
    ctx.lineWidth = tool === "eraser" ? 20 : 3;
    ctx.lineCap = "round";
    ctx.stroke();
    emitDrawing();
  };

  const stopDrawing = () => setIsDrawing(false);

  // Canvas state management
  const resetCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setResponse("");
    setShowResponse(false);
    setUndoStack([]);
    setRedoStack([]);
    emitDrawing();
  };

  const captureCanvasState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const saveStateToUndo = () => {
    const newState = captureCanvasState();
    setUndoStack((prev) => [...prev, newState]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1];
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.putImageData(lastState, 0, 0);
      setRedoStack((prev) => [lastState, ...prev]);
      setUndoStack((prev) => prev.slice(0, -1));
      emitDrawing();
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const lastState = redoStack[0];
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.putImageData(lastState, 0, 0);
      setUndoStack((prev) => [...prev, lastState]);
      setRedoStack((prev) => prev.slice(1));
      emitDrawing();
    }
  };

  // API interaction
  const calculateResult = async () => {
    setLoading(true);
    setShowResponse(true);
    setResponse("Processing...");
    
    try {
      const canvas = canvasRef.current;
      
      // Ensure we're getting a proper PNG image
      const imageData = canvas.toDataURL('image/png', 1.0);
      console.log('Image data length:', imageData.length);
      console.log('Image data format check:', imageData.startsWith('data:image/png;base64,'));
  
      const response = await fetch("http://localhost:3000/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageData }),
      });
  
      // Log the response status
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || errorData.details || 'Server error');
      }
      
      const data = await response.json();
      if (!data.result) {
        throw new Error('No result in response');
      }
      
      setResponse(data.result);
    } catch (error) {
      console.error("Error details:", error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  // Styles
  const containerStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'black',
  };

  const controlsStyle = {
    position: 'fixed',
    top: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '1rem',
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    padding: '1rem',
    borderRadius: '0.5rem',
    zIndex: 10,
    backdropFilter: 'blur(8px)',
  };

  const buttonStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const responseContainerStyle = {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    maxWidth: '500px',
    width: '90%',
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    borderRadius: '1rem',
    color: 'white',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(8px)',
    animation: 'slideIn 0.3s ease-out',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxHeight: '500px',
    overflowY: 'scroll',
  };

  return (
    <div style={containerStyle}>
      {/* Collaboration Controls */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 10,
        display: 'flex',
        gap: '1rem'
      }}>
        {!roomId ? (
          <>
            <button
              onClick={createRoom}
              style={{
                ...buttonStyle,
                backgroundColor: '#3B82F6'
              }}
            >
              Create Room
            </button>
            <button
              onClick={() => setShowJoinDialog(true)}
              style={{
                ...buttonStyle,
                backgroundColor: '#10B981'
              }}
            >
              Join Room
            </button>
          </>
        ) : (
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            borderRadius: '0.5rem',
            color: 'white'
          }}>
            Room ID: {roomId}
          </div>
        )}
      </div>

      {/* Join Room Dialog */}
      {showJoinDialog && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(31, 41, 55, 0.95)',
          padding: '2rem',
          borderRadius: '1rem',
          zIndex: 20
        }}>
          <input
            type="text"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            placeholder="Enter Room ID"
            style={{
              padding: '0.5rem',
              marginRight: '1rem',
              borderRadius: '0.25rem'
            }}
          />
          <button
            onClick={joinRoom}
            style={{
              ...buttonStyle,
              backgroundColor: '#3B82F6'
            }}
          >
            Join
          </button>
          <button
            onClick={() => setShowJoinDialog(false)}
            style={{
              ...buttonStyle,
              backgroundColor: '#EF4444',
              marginLeft: '0.5rem'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />

      {/* Drawing Controls */}
      <div style={controlsStyle}>
        <button onClick={resetCanvas} style={{ ...buttonStyle, backgroundColor: '#EF4444' }}>
          Reset
        </button>
        <button onClick={undo} style={{ ...buttonStyle, backgroundColor: '#F59E0B' }}>
          Undo
        </button>
        <button onClick={redo} style={{ ...buttonStyle, backgroundColor: '#10B981' }}>
          Redo
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {colors.map((clr) => (
            <button
              key={clr}
              onClick={() => setColor(clr)}
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: clr,
                border: color === clr ? '3px solid #3B82F6' : '2px solid white',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => setTool("pen")}
          style={{
            ...buttonStyle,
            backgroundColor: tool === "pen" ? '#3B82F6' : '#4B5563',
          }}
        >
          Pen
        </button>

        <button
          onClick={() => setTool("eraser")}
          style={{
            ...buttonStyle,
            backgroundColor: tool === "eraser" ? '#3B82F6' : '#4B5563',
          }}
        >
          Eraser
        </button>

        <button
          onClick={calculateResult}
          disabled={loading}
          style={{
            ...buttonStyle,
            backgroundColor: '#10B981',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Processing..." : "Calculate"}
        </button>
      </div>

      {/* Enhanced Response UI */}
      {showResponse && (
        <div style={responseContainerStyle}>
          <div style={{
            padding: '1.5rem',
            borderRadius: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              }}>
                A
              </div>
              <span style={{ fontWeight: '500' }}>Assistant</span>
            </div>

            {loading ? (
              <TypingIndicator />
            ) : (
              <div
                style={{
                  lineHeight: '1.6',
                  fontSize: '1rem',
                  color: '#E5E7EB',
                  fontWeight: '400',
                  whiteSpace: 'pre-wrap',
                }}
                dangerouslySetInnerHTML={{ __html: response || "I'm analyzing your drawing..." }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;