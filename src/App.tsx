import rough from "roughjs";
import { useLayoutEffect, useState } from "react";

const generator = rough.generator();

const createDrawing = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  shapes: string
) => {
  const roughelement =
    shapes === "Line"
      ? generator.line(x1, y1, x2, y2)
      : generator.rectangle(x1, y1, x2 - x1, y2 - y1);
  return { x1, y1, x2, y2, roughelement };
};
const App = () => {
  const [elements, setElements] = useState([]);
  const [clicked, setClicked] = useState(false);
  const [shapes, setShapes] = useState("Line");

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const context = canvas?.getContext("2d");
    context.clearRect(0, 0, canvas?.clientWidth, canvas?.height);

    const tempdata = rough.canvas(canvas);
    elements.forEach(({ roughelement }) => tempdata.draw(roughelement));
  }, [elements]);

  const handle_mouse_down = (event: MouseEvent) => {
    setClicked(true);
    const { clientX, clientY } = event;
    const element = createDrawing(clientX, clientY, clientX, clientY, shapes);
    setElements((prevstate) => [...prevstate, element]);
  };

  const handle_mouse_move = (event: MouseEvent) => {
    if (!clicked) return;

    const { x1, y1 } = elements[elements.length - 1];
    const { clientX, clientY } = event;
    const updateelement = createDrawing(x1, y1, clientX, clientY, shapes);
    const copy_ofelements = [...elements];
    copy_ofelements[elements.length - 1] = updateelement;
    setElements(copy_ofelements);
  };

  const handle_mouse_up = () => {
    setClicked(false);
  };

  return (
    <div>
      <div className="fixed flex gap-10 p-6">
        <svg
          onClick={() => setShapes("Line")}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 cursor-pointer"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
        <svg
          onClick={() => setShapes("Rectangle")}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 cursor-pointer"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6"
          />
        </svg>
      </div>
      <canvas
        id="canvas"
        onMouseDown={handle_mouse_down}
        onMouseUp={handle_mouse_up}
        onMouseMove={handle_mouse_move}
        width={window.innerWidth}
        height={window.innerHeight}
      >
        Canvas
      </canvas>
    </div>
  );
};

export default App;
