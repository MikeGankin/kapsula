import flatpickr from "flatpickr";
import {Russian} from "flatpickr/dist/l10n/ru.js";
import {logWarning} from "../../shared/logger.js";
import {setFieldValue} from "../../../../modules/form-configurator/core/state.ts";
import type {
  CalendarFieldConfig,
  FieldValue,
  FormValues,
} from "../../../../modules/form-configurator/core/types.ts";
import type {
  FieldRenderHandle,
  UpdateFormState,
} from "../../../../modules/form-configurator/dom/renderer.ts";

function normalizeCalendarValue(value: FieldValue | undefined): string | string[] | null {
  if (!value) {
    return null;
  }

  if (!Array.isArray(value) && typeof value === 'object') {
    return value.from ? [value.from, value.to].filter(Boolean) : null;
  }


  return value;
}

export function createCalendarContent(
  section: CalendarFieldConfig,
  value: FieldValue | undefined,
  _values: Readonly<FormValues>,
  updateState?: UpdateFormState,
): HTMLElement {
  const wrapper = document.createElement('div');

  wrapper.className = 'calendar-field';

  if (typeof updateState !== 'function') {
    logWarning("Calendar updateState is missing");
    return wrapper;
  }

  const input = document.createElement('input');

  input.type = 'hidden';
  input.style.display = 'none';
  input.dataset.field = section.id;

  wrapper.appendChild(input);


  const formatDate = (date?: Date) => {
    if (!date) {
      return '';
    }

    return date.toISOString().slice(0, 10);
  };


  flatpickr(input, {
    inline: true,

    mode: section.calendar?.mode || 'single',

    locale: Russian,

    minDate: section.calendar?.minDate,

    defaultDate: normalizeCalendarValue(value) ?? undefined,


    onChange(selectedDates) {

      const calendarValue = {
        from: formatDate(selectedDates[0]),
        to: formatDate(selectedDates[1]),
      };

      updateState((state) => setFieldValue(state, section.id, calendarValue));
    },


    onDayCreate(_, __, ___, dayElem) {

      const date = dayElem.dateObj;

      if (!date) {
        return;
      }


      if (date.getDate() === 12) {
        dayElem.classList.add('is-flexible');
      }
    },

  });


  return wrapper;
}

export function createCalendarContentHandle(
  section: CalendarFieldConfig,
  value: FieldValue | undefined,
  _values: Readonly<FormValues>,
  updateState?: UpdateFormState,
): FieldRenderHandle {
  const wrapper = document.createElement('div');
  wrapper.className = 'calendar-field';

  if (typeof updateState !== 'function') {
    logWarning("Calendar updateState is missing");
    return {node: wrapper, sync() {}, destroy() {}};
  }

  const input = document.createElement('input');
  input.type = 'hidden';
  input.style.display = 'none';
  input.dataset.field = section.id;
  wrapper.appendChild(input);

  const formatDate = (date?: Date) => date ? date.toISOString().slice(0, 10) : '';
  const instance = flatpickr(input, {
    inline: true,
    mode: section.calendar?.mode || 'single',
    locale: Russian,
    minDate: section.calendar?.minDate,
    defaultDate: normalizeCalendarValue(value) ?? undefined,
    onChange(selectedDates) {
      updateState((state) => setFieldValue(state, section.id, {
        from: formatDate(selectedDates[0]),
        to: formatDate(selectedDates[1]),
      }));
    },
    onDayCreate(_, __, ___, dayElem) {
      if (dayElem.dateObj?.getDate() === 12) dayElem.classList.add('is-flexible');
    },
  });
  let destroyed = false;

  return {
    node: wrapper,
    sync() {},
    destroy() {
      if (destroyed) return;
      destroyed = true;
      instance.destroy();
    },
  };
}
