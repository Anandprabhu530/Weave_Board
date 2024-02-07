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
  return elements
    .map((element) => ({
      ...element,
      position: lieswithinmouse(x, y, element),
    }))
    .find((element) => element.position !== null);
};

const nearpoint = (x, y, x1, y1, name) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};

const lieswithinmouse = (x, y, element) => {
  const { type, x1, x2, y1, y2 } = element;
  if (type === "Rectangle") {
    const topleft = nearpoint(x, y, x1, y1, "tl");
    const topright = nearpoint(x, y, x2, y1, "tr");
    const bottomleft = nearpoint(x, y, x1, y2, "bl");
    const bottomright = nearpoint(x, y, x2, y2, "br");
    const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
    return topleft || topright || bottomleft || bottomright || inside;
  } else {
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };
    const c = { x, y };
    const top = nearpoint(x, y, x1, y1, "top");
    const bottom = nearpoint(x, y, x2, y2, "bottom");
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));
    const inside = Math.abs(offset) < 1 ? "inside" : null;
    return top || bottom || inside;
  }
};

const distance = (a, b) =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const changeCoordinates = (element) => {
  const { x1, y1, x2, y2, type } = element;
  if (type === "Rectangle") {
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const maxX = Math.max(x1, x2);
    const maxY = Math.max(y1, y2);
    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  } else if (x1 < x2 || (x1 === x2 && y1 < y2)) {
    return { x1, x2, y1, y2 };
  } else {
    return { x1: x2, x2: x1, y1: y2, y2: y1 };
  }
};

const rezisefn = (clientX, clientY, position, coordinates) => {
  const { x1, y1, x2, y2 } = coordinates;
  switch (position) {
    case "tl":
    case "top":
      return { x1: clientX, y1: clientY, x2, y2 };
    case "tr":
      return { x1, y1: clientY, x2: clientX, y2 };
    case "bl":
      return { x1: clientX, x2, y1, y2: clientY };
    case "br":
    case "bottom":
      return { x1, y1, x2: clientX, y2: clientY };
    default:
      return null;
  }
};

const cursorposition = (position) => {
  switch (position) {
    case "tl":
    case "br":
    case "top":
    case "bottom":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    default:
      return "move";
  }
};

const useHistory = (initialState) => {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([initialState]);
  const setstate = (action, payload: false) => {
    const newstate =
      typeof action === "function" ? action(history[index]) : action;
    if (payload) {
      const copy_of_History = [...history];
      copy_of_History[index] = newstate;
      setHistory(copy_of_History);
    } else {
      const updatedstate = [...history].slice(0, index + 1);
      setHistory([...updatedstate, newstate]);
      setIndex((prev) => prev + 1);
    }
  };

  const undo = () => index > 0 && setIndex((prev) => prev - 1);
  const redo = () => index < history.length - 1 && setIndex((prev) => prev + 1);
  return [history[index], setstate, undo, redo];
};

const App = () => {
  const [elements, setElements, undo, redo] = useHistory([]);
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
    setElements(copy_ofelements, true);
  };

  const handle_mouse_down = (event: MouseEvent) => {
    const { clientX, clientY } = event;
    if (tool === "select") {
      const data = getElementPosition(clientX, clientY, elements);
      if (data) {
        const offsetx = clientX - data.x1;
        const offsety = clientY - data.y1;
        setSelected({ ...data, offsetx, offsety });
        setElements((prev) => prev);
        if (data.position === "inside") {
          setClicked("moving");
        } else {
          setClicked("resize");
        }
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
      setSelected(element);
      setClicked("draw");
    }
  };

  const handle_mouse_move = (event: MouseEvent) => {
    const { clientX, clientY } = event;
    if (tool === "select") {
      const element = getElementPosition(clientX, clientY, elements);
      event.target.style.cursor = element
        ? cursorposition(element.position)
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
    } else if (clicked === "resize") {
      const { id, type, position, ...coordinates } = selected;
      const { x1, y1, x2, y2 } = rezisefn(
        clientX,
        clientY,
        position,
        coordinates
      );
      updateelement(id, x1, y1, x2, y2, type);
    }
  };

  const handle_mouse_up = () => {
    if (selected) {
      const { id, type } = selected;
      if (clicked === "draw" || clicked === "resize") {
        const { x1, y1, x2, y2 } = changeCoordinates(
          elements[elements.length - 1]
        );
        updateelement(id, x1, y1, x2, y2, type);
      }
      setClicked("none");
      setSelected(null);
    }
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            onClick={undo}
            className="w-6 h-6 cursor-pointer"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            onClick={redo}
            className="w-6 h-6 cursor-pointer"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5"
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
