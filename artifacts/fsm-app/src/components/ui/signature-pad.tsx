import React, { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface SignaturePadRef {
  clear: () => void;
  toDataURL: () => string | null;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  className?: string;
  onEnd?: () => void;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ className, onEnd }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [empty, setEmpty] = useState(true);

    const getCoordinates = (event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let clientX = 0;
      let clientY = 0;

      if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = (event as React.MouseEvent).clientX;
        clientY = (event as React.MouseEvent).clientY;
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      const { x, y } = getCoordinates(event);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          setIsDrawing(true);
          setEmpty(false);
        }
      }
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      if (!isDrawing) return;
      const { x, y } = getCoordinates(event);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    };

    const stopDrawing = () => {
      if (isDrawing) {
        setIsDrawing(false);
        if (onEnd) onEnd();
      }
    };

    // Setup canvas
    const initCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
      if (canvas) {
        canvasRef.current = canvas;
        // Handle responsive canvas sizing
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
        } else {
          canvas.width = 400;
          canvas.height = 200;
        }
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'hsl(var(--foreground))';
        }
      }
    }, []);

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setEmpty(true);
          }
        }
      },
      toDataURL: () => {
        if (empty) return null;
        const canvas = canvasRef.current;
        return canvas ? canvas.toDataURL('image/png') : null;
      },
      isEmpty: () => empty,
    }));

    return (
      <div className={`relative w-full h-full border border-input rounded-md bg-background overflow-hidden ${className}`}>
        <canvas
          ref={initCanvas}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full touch-none cursor-crosshair"
        />
        {empty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground">
            Sign here
          </div>
        )}
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
