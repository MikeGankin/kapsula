import type {CalendarFieldConfig} from "../../../../modules/form-configurator/core/types.ts";
import {createBasicFieldRenderers} from "../../../../modules/form-configurator/dom/fieldRenderers.ts";
import type {FieldRenderer} from "../../../../modules/form-configurator/dom/renderer.ts";
import {createFieldRendererRegistry} from "../../../../modules/form-configurator/dom/rendererRegistry.ts";
import {createCalendarContentHandle} from "./createCalendarContent.ts";
import {sanitizeRichText} from "./sanitizeRichText.js";

const calendar:FieldRenderer<CalendarFieldConfig>={type:"calendar",render(field,value,context){return createCalendarContentHandle(field,value,context.values,context.updateState);}};
export function createKapsulaFieldRendererRegistry(){
  return createFieldRendererRegistry([
    ...createBasicFieldRenderers(sanitizeRichText),
    calendar,
  ]);
}
