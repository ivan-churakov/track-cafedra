import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { Track } from "../Components/SVGTrack/Track";
import { Track as EditableTrack } from "../Components/SVGTrack/NewTrack";

describe("Track component", () => {
  test("renders without crashing", () => {
    const emptyTopics = { red: [], green: [], blue: [], orange: [] };
    render(<Track topics={emptyTopics} variant="1" />);
  });
});

describe.each(['public', 'editor'])('%s track viewport', variant => {
  function setup() {
    const result = render(variant === 'public'
      ? <Track topics={{ red: [], green: [], blue: [], orange: [] }} variant="1" />
      : <EditableTrack entries={[]} variant="1" />);
    const viewport = result.container.querySelector('[data-track-viewport]') as HTMLDivElement;
    const svg = viewport.querySelector('svg')!;
    jest.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, top: 0, left: 0, right: 400, bottom: 300, width: 400, height: 300,
      toJSON: () => ({}),
    });
    const scale = () => Number(svg.style.transform.match(/scale\(([^)]+)\)/)![1]);
    return { ...result, viewport, svg, scale };
  }

  test('wheel zooms without Ctrl and cancels page scrolling', () => {
    const { viewport, scale, getByLabelText } = setup();
    const wheel = new WheelEvent('wheel', { deltaY: -120, clientX: 200, clientY: 150, bubbles: true, cancelable: true });
    fireEvent(viewport, wheel);
    expect(wheel.defaultPrevented).toBe(true);
    expect(scale()).toBeGreaterThan(1);
    fireEvent.wheel(viewport, { deltaY: 120, clientX: 200, clientY: 150 });
    expect(scale()).toBeCloseTo(1);
    fireEvent.wheel(viewport, { deltaY: -100000 });
    expect(scale()).toBe(3);
    fireEvent.wheel(viewport, { deltaY: 100000 });
    expect(scale()).toBe(0.5);
    fireEvent.click(getByLabelText('Показать весь трек'));
    expect(scale()).toBe(1);
  });

  test('two-finger pinch zooms both ways and one finger can continue panning', () => {
    const { viewport, svg, scale } = setup();
    fireEvent.touchStart(viewport, { touches: [{ clientX: 100, clientY: 100 }, { clientX: 200, clientY: 100 }] });
    fireEvent.touchMove(viewport, { touches: [{ clientX: 50, clientY: 100 }, { clientX: 250, clientY: 100 }] });
    expect(scale()).toBe(2);
    fireEvent.touchMove(viewport, { touches: [{ clientX: 100, clientY: 100 }, { clientX: 200, clientY: 100 }] });
    expect(scale()).toBe(1);
    fireEvent.touchEnd(viewport, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchMove(viewport, { touches: [{ clientX: 110, clientY: 120 }] });
    expect(svg.style.transform).toBe('translate(10px, 20px) scale(1)');
    fireEvent.touchCancel(viewport);
    fireEvent.touchMove(viewport, { touches: [{ clientX: 210, clientY: 220 }] });
    expect(svg.style.transform).toBe('translate(10px, 20px) scale(1)');
    expect(svg.style.cursor).toBe('grab');
  });
});
