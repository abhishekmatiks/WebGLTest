import React, { useEffect, useState } from 'react';

const CANVASKIT_URL = "https://unpkg.com/canvaskit-wasm@0.37.0/bin/full/canvaskit.js";

export default function App() {
  const [CanvasKit, setCanvasKit] = useState(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = CANVASKIT_URL;
    script.async = true;
    script.onload = () => {
      window.CanvasKitInit().then(setCanvasKit);
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  if (!CanvasKit) return <div>Loading...</div>;

  return <CanvasKitDemo CanvasKit={CanvasKit} />;
}

function CanvasKitDemo({ CanvasKit }) {
  useEffect(() => {
    const canvas = document.getElementById("ck-canvas");
    const surface = CanvasKit.MakeCanvasSurface(canvas);
    if (!surface) return;

    const ctx = surface.getCanvas();
    const paint = new CanvasKit.Paint();
    paint.setColor(CanvasKit.Color4f(1, 0, 0, 1));
    ctx.drawRect(CanvasKit.XYWHRect(10, 10, 100, 100), paint);
    surface.flush();
    paint.delete();
  }, [CanvasKit]);

  return <canvas id="ck-canvas" width={300} height={300} />;
}
