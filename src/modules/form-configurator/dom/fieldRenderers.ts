import {getVisibleOptions} from "../core/conditions.ts";
import type {
  CardsFieldConfig,
  FieldOption,
  FieldValue,
  FormValues,
  TextareaFieldConfig,
  TextFieldConfig,
} from "../core/types.ts";
import type {FieldRenderHandle, FieldRenderer} from "./renderer.ts";

type Sanitizer = (value: string) => readonly Node[];
function node(
  tag: string,
  o: {className?: string; text?: unknown; attrs?: Record<string, unknown>;
    data?: Record<string,string>; children?: readonly (Node|null)[]; rich?: string} = {},
  sanitizer?: Sanitizer,
): HTMLElement {
  const result = document.createElement(tag);
  if (o.className) result.className = o.className;
  if (o.text !== undefined) result.textContent = String(o.text);
  if (o.rich && sanitizer) result.append(...sanitizer(o.rich));
  Object.entries(o.attrs ?? {}).forEach(([key,value]) => {
    if (value !== null && value !== undefined && value !== false) result.setAttribute(key, value === true ? "" : String(value));
  });
  Object.assign(result.dataset, o.data);
  result.append(...(o.children ?? []).filter((item): item is Node => Boolean(item)));
  return result;
}
function subtitle(
  field: CardsFieldConfig|TextareaFieldConfig|TextFieldConfig,
  sanitizer: Sanitizer,
) {
  return field.subtitle ? node("p", {className:"kapsula-form-section__subtitle", attrs:{id:`kapsula-section-subtitle-${field.id}`}, rich:field.subtitle}, sanitizer) : null;
}
function selected(field: CardsFieldConfig, value: FieldValue|undefined, option: string) {
  return field.multiple ? Array.isArray(value) && value.includes(option) : value === option;
}
function optionNode(field: CardsFieldConfig, option: FieldOption, checked: boolean) {
  const input = node("input", {className:"kapsula-form-option__input", attrs:{type:field.multiple?"checkbox":"radio",name:field.id,value:option.value}, data:{kapsulaChoice:"",sectionId:field.id}}) as HTMLInputElement;
  input.checked = checked;
  return node("label", {className:`kapsula-option-card kapsula-form-option${checked?" is-selected":""}`, data:{kapsulaOption:"",sectionId:field.id,optionValue:option.value}, children:[
    input, node("span",{className:"kapsula-option-card__marker",attrs:{"aria-hidden":true}}),
    node("span",{className:"kapsula-option-card__content",children:[node("span",{className:"kapsula-option-card__title",text:option.label}),option.description?node("span",{className:"kapsula-option-card__text",text:option.description}):null]}),
  ]});
}
function syncCards(
  container: HTMLElement,
  field: CardsFieldConfig,
  value: FieldValue|undefined,
  values: Readonly<FormValues>,
) {
  const existing = new Map(Array.from(container.querySelectorAll<HTMLElement>("[data-kapsula-option]")).map((item) => [item.dataset.optionValue,item]));
  getVisibleOptions(field, values).forEach((option,index) => {
    const checked = selected(field,value,option.value);
    const item = existing.get(option.value) ?? optionNode(field,option,checked);
    item.classList.toggle("is-selected",checked);
    const input = item.querySelector<HTMLInputElement>("[data-kapsula-choice]");
    if (input) { input.name=field.id; input.value=option.value; input.checked=checked; }
    if (container.children[index] !== item) {
      container.insertBefore(item,container.children[index]??null);
    }
    existing.delete(option.value);
  });
  existing.forEach((item)=>item.remove());
}
function stringRenderer<T extends TextareaFieldConfig|TextFieldConfig>(type:T["type"], sanitizer:Sanitizer):FieldRenderer<T> {
  return {type,render(field,value) {
    const id=`kapsula-field-${field.id}`;
    const common={id,name:field.id,placeholder:field.placeholder??"","aria-describedby":field.subtitle?`kapsula-section-subtitle-${field.id}`:null};
    const input=(type==="textarea"?node("textarea",{className:"kapsula-form-textarea",attrs:common,data:{kapsulaTextarea:"",sectionId:field.id}}):node("input",{attrs:{...common,type:"text"},data:{field:field.id}})) as HTMLInputElement|HTMLTextAreaElement;
    input.value=typeof value==="string"?value:"";
    const content=node("div",{className:"kapsula-form-section__content",children:[subtitle(field,sanitizer),node("label",{className:"kapsula-form-section__label sr-only",attrs:{for:id},text:field.title}),input]});
    return {node:content,sync(next){const v=typeof next==="string"?next:"";if(input.value!==v)input.value=v;},destroy(){}} satisfies FieldRenderHandle;
  }};
}
export function createBasicFieldRenderers(sanitizer:Sanitizer):FieldRenderer[] {
  const cards:FieldRenderer<CardsFieldConfig>={type:"cards",render(field,value,context){
    const options=node("div",{className:"kapsula-card-grid kapsula-form-options",data:{kapsulaFormOptions:""}});
    syncCards(options,field,value,context.values);
    const content=node("fieldset",{className:"kapsula-form-section__content kapsula-form-section__fieldset",children:[node("legend",{className:"kapsula-form-section__legend",text:field.title}),subtitle(field,sanitizer),options]});
    return {
      node:content,
      sync(next,nextContext){syncCards(options,field,next,nextContext.values);},
      destroy(){},
    };
  }};
  return [cards,stringRenderer<TextareaFieldConfig>("textarea",sanitizer),stringRenderer<TextFieldConfig>("text",sanitizer)];
}
