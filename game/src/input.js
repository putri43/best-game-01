// Keyboard + mouse input. Movement is WASD or arrows; the mouse aims, click
// or Space fires, Shift dashes, P pauses, Enter/Space confirms, R restarts.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let mouseX = 640; let mouseY = 360; let mouseDown = false;
  let firing = false;

  function key(e) { return e.key.length === 1 ? e.key.toLowerCase() : e.key; }
  function onKeyDown(e) {
    const k = key(e);
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    if (!e.repeat) {
      if (k === ' ' || k === 'Enter') actions |= ACTION_CONFIRM;
      if (k === 'p' || k === 'Escape') actions |= ACTION_PAUSE;
      if (k === 'r') actions |= ACTION_RESTART;
    }
    keys.add(k);
    if (k === ' ') firing = true;
  }
  function onKeyUp(e) { keys.delete(key(e)); if (key(e) === ' ') firing = false; }
  function onMouseMove(e) {
    const r = canvas.getBoundingClientRect();
    mouseX = (e.clientX - r.left) * (canvas.width / r.width);
    mouseY = (e.clientY - r.top) * (canvas.height / r.height);
  }
  function onMouseDown(e) { onMouseMove(e); mouseDown = true; firing = true; if (e.button === 0) actions |= ACTION_CONFIRM; }
  function onMouseUp() { mouseDown = false; firing = false; }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  function move() {
    let x = 0; let y = 0;
    if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('d') || keys.has('ArrowRight')) x += 1;
    if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('s') || keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  }
  return {
    move,
    aim: () => ({ x: mouseX, y: mouseY }),
    firing: () => firing || mouseDown,
    dash: () => keys.has('Shift'),
    takeActions: () => { const a = actions; actions = 0; return a; },
  };
}
