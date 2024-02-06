// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import rough from "roughjs";
import { useLayoutEffect, useState } from "react";

const generator = rough.generator();

const createDrawing = (
  id: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  type: string
) => {
  const roughelement =
    type === "Line"
      ? generator.line(x1, y1, x2, y2)
      : generator.rectangle(x1, y1, x2 - x1, y2 - y1);
  return { id, x1, y1, x2, y2, roughelement, type };
};

const getElementPosition = (x, y, elements) => {
  return elements.find((element) => lieswithinmouse(x, y, element));
};

const lieswithinmouse = (x, y, element) => {
  const { type, x1, x2, y1, y2 } = element;
  if (type === "Rectangle") {
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const maxX = Math.max(x1, x2);
    const maxY = Math.max(y1, y2);
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  } else {
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };
    const c = { x, y };
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));
    return Math.abs(offset) < 1;
  }
};

const distance = (a, b) =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const App = () => {
  const [elements, setElements] = useState([]);
  const [clicked, setClicked] = useState("none");
  const [tool, setTool] = useState("Line");
  const [selected, setSelected] = useState(null);

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const context = canvas?.getContext("2d");
    context.clearRect(0, 0, canvas?.clientWidth, canvas?.height);
    const tempdata = rough.canvas(canvas);
    elements.forEach(({ roughelement }) => tempdata.draw(roughelement));
  }, [elements]);

  const updateelement = (id, x1, y1, x2, y2, type) => {
    const updatedelement = createDrawing(id, x1, y1, x2, y2, type);
    const copy_ofelements = [...elements];
    copy_ofelements[id] = updatedelement;
    setElements(copy_ofelements);
  };

  const handle_mouse_down = (event: MouseEvent) => {
    const { clientX, clientY } = event;

    if (tool === "select") {
      const data = getElementPosition(clientX, clientY, elements);
      if (data) {
        const offsetx = clientX - data.x1;
        const offsety = clientY - data.y1;
        setSelected({ ...data, offsetx, offsety });
        setClicked("moving");
      }
    } else {
      const id = elements.length;

      const element = createDrawing(
        id,
        clientX,
        clientY,
        clientX,
        clientY,
        tool
      );
      setElements((prevstate) => [...prevstate, element]);
      setClicked("draw");
    }
  };

  const handle_mouse_move = (event: MouseEvent) => {
    const { clientX, clientY } = event;
    if (tool === "select") {
      event.target.style.cursor = getElementPosition(clientX, clientY, elements)
        ? "move"
        : "default";
    }
    if (clicked === "draw") {
      const { x1, y1 } = elements[elements.length - 1];
      updateelement(elements.length - 1, x1, y1, clientX, clientY, tool);
    } else if (clicked === "moving") {
      const { id, x1, y1, x2, y2, type, offsetx, offsety } = selected;
      const width = x2 - x1;
      const height = y2 - y1;
      const newx1 = clientX - offsetx;
      const newy1 = clientY - offsety;
      updateelement(id, newx1, newy1, newx1 + width, newy1 + height, type);
    }
  };

  const handle_mouse_up = () => {
    setClicked("none");
    setSelected(null);
  };

  return (
    <div>
      <div className="fixed flex  w-full pt-6 justify-center">
        <div className="flex gap-10 p-4 border border-black rounded-xl">
          <svg
            onClick={() => setTool("select")}
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
              d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59"
            />
          </svg>
          <svg
            onClick={() => setTool("Line")}
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
            onClick={() => setTool("Rectangle")}
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
