// @vitest-environment jsdom
import {createCalendarContentHandle} from "../../../src/scripts/kapsula/features/form/createCalendarContent.ts";

const calendar = vi.hoisted(() => ({destroy: vi.fn(), options: null}));

vi.mock("flatpickr", () => ({
  default: vi.fn((_, options) => {
    calendar.options = options;
    return {destroy: calendar.destroy};
  }),
}));

describe("createCalendarContentHandle", () => {
  it("делегирует onChange и уничтожает Flatpickr ровно один раз", () => {
    const updateState = vi.fn();
    const handle = createCalendarContentHandle(
      {id: "dates", type: "calendar", calendar: {mode: "range"}},
      {from: "2026-09-10", to: "2026-09-12"},
      {},
      updateState,
    );

    calendar.options.onChange([new Date("2026-10-01"), new Date("2026-10-04")]);
    expect(updateState).toHaveBeenCalledOnce();
    handle.destroy();
    handle.destroy();
    expect(calendar.destroy).toHaveBeenCalledOnce();
    expect(handle.node.querySelector('[data-field="dates"]')).not.toBeNull();
  });
});
