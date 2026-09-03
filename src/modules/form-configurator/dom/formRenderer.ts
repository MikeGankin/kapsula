import {summarizeFieldValue} from "../core/fieldTypes.ts";
import type {CapsuleConfig,FieldConfig,FormValues,ValidationIssue} from "../core/types.ts";
import type {FieldRenderHandle,UpdateFormState} from "./renderer.ts";
import type {FieldRendererRegistry} from "./rendererRegistry.ts";

type Entry={field:FieldConfig;node:HTMLElement;handle:FieldRenderHandle};
const make=(tag:string,className="",text?:string)=>{const n=document.createElement(tag);n.className=className;if(text!==undefined)n.textContent=text;return n;};
function chevron(){const p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d","M12.4258 6.59961L6.42578 0.599609L0.42578 6.59961");p.setAttribute("stroke","#262626");p.setAttribute("stroke-width","1.2");p.setAttribute("stroke-linejoin","round");const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");Object.entries({width:"13",height:"8",viewBox:"0 0 13 8",fill:"none"}).forEach(([k,v])=>svg.setAttribute(k,v));svg.append(p);const n=make("span","kapsula-form-section__chevron");n.setAttribute("aria-hidden","true");n.append(svg);return n;}
function summary(value:string){const n=make("span","kapsula-form-section__summary",value);n.dataset.kapsulaSectionSummary="";return n;}
function error(){const n=make("span","kapsula-form-section__error");n.dataset.kapsulaSectionError="";n.setAttribute("role","alert");n.hidden=true;return n;}
function createSection(
  field:FieldConfig,
  index:number,
  value:FormValues[string]|undefined,
  values:Readonly<FormValues>,
  expanded:boolean,
  registry:FieldRendererRegistry,
  updateState?:UpdateFormState,
):Entry{
  const handle=registry.get(field.type).render(field,value,{values,updateState});
  const triggerId=`kapsula-section-trigger-${field.id}`;
  const panelId=`kapsula-section-panel-${field.id}`;
  const trigger=make("button","kapsula-form-section__trigger");trigger.id=triggerId;trigger.setAttribute("type","button");trigger.setAttribute("aria-expanded",String(expanded));trigger.setAttribute("aria-controls",panelId);trigger.dataset.kapsulaSectionTrigger="";trigger.dataset.sectionId=field.id;
  const heading=make("span","kapsula-form-section__heading");heading.append(make("span","kapsula-form-section__index",`${index+1}.`),make("span","kapsula-form-section__title",field.title));if(field.required){const m=make("span","kapsula-form-section__required-marker","*");m.setAttribute("aria-hidden","true");heading.append(m);}
  const meta=make("span","kapsula-form-section__meta");meta.dataset.kapsulaSectionMeta="";const valueSummary=summarizeFieldValue(field,value,values);if(valueSummary)meta.append(summary(valueSummary));meta.append(chevron(),error());trigger.append(heading,meta);
  const panel=make("div","kapsula-form-section__panel");panel.id=panelId;panel.setAttribute("role","region");panel.setAttribute("aria-labelledby",triggerId);const inner=make("div","kapsula-form-section__panel-inner");inner.append(handle.node);panel.append(inner);
  const section=make("section",`kapsula-form-section${expanded?" is-expanded":""}`);section.dataset.kapsulaRenderedSection=field.id;section.append(trigger,panel);return {field,node:section,handle};
}
export function createFormRendererController(formNode:HTMLElement,registry:FieldRendererRegistry){
  const entries=new Map<string,Entry>();let destroyed=false;
  const clear=()=>{entries.forEach(({handle})=>handle.destroy());entries.clear();};
  return {render(
    schema:CapsuleConfig,
    values:Readonly<FormValues>,
    expanded:Record<string,boolean>,
    options:{forceFull?:boolean;updateState?:UpdateFormState}={},
  ){
    if(destroyed)return;
    const full=options.forceFull||!formNode.querySelector("[data-kapsula-form-sections]")||entries.size!==schema.sections.length||schema.sections.some((field)=>entries.get(field.id)?.field.type!==field.type);
    if(full){schema.sections.forEach((field)=>registry.get(field.type));const next=schema.sections.map((field,index)=>createSection(field,index,values[field.id],values,Boolean(expanded[field.id]),registry,options.updateState));clear();const container=make("div","kapsula-form__sections");container.dataset.kapsulaFormSections="";next.forEach((entry)=>{entries.set(entry.field.id,entry);container.append(entry.node);});formNode.replaceChildren(container);return;}
    schema.sections.forEach((field)=>{const entry=entries.get(field.id);if(!entry)return;entry.node.classList.toggle("is-expanded",Boolean(expanded[field.id]));entry.node.querySelector("[data-kapsula-section-trigger]")?.setAttribute("aria-expanded",String(Boolean(expanded[field.id])));const meta=entry.node.querySelector<HTMLElement>("[data-kapsula-section-meta]");const current=meta?.querySelector<HTMLElement>("[data-kapsula-section-summary]");const valueSummary=summarizeFieldValue(field,values[field.id],values);if(!valueSummary)current?.remove();else if(!current)meta?.prepend(summary(valueSummary));else if(current.textContent!==valueSummary)current.textContent=valueSummary;entry.handle.sync(values[field.id],{values,updateState:options.updateState});});
  },renderValidationErrors(schema:CapsuleConfig,issues:readonly ValidationIssue[]=[]){const invalid=new Set(issues.map((issue)=>issue.path?.[0]).filter((id)=>typeof id==="string"));schema.sections.forEach((field)=>{const n=entries.get(field.id)?.node.querySelector<HTMLElement>("[data-kapsula-section-error]");if(!n)return;n.textContent=invalid.has(field.id)?`Заполните раздел «${field.title}» — без него мы не сможем сформировать капсулу.`:"";n.hidden=!invalid.has(field.id);});},destroy(){if(destroyed)return;destroyed=true;clear();}};
}
