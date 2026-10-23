import * as T from 'three';
import {PARTS} from '../parts-kit/catalog.ts';
import {createPart} from '../parts-kit/models.ts';
import {disposeObject} from '../world-kit/geometry.ts';
export type RegisteredComponent={id:string;version:string;families:readonly string[];source:string;factory:()=>T.Group};
/** Each project owns its registry. Extensions never mutate the shared catalogue. Factories return new rigs. */
export class ComponentRegistry{
 private entries=new Map<string,RegisteredComponent>();
 constructor(){for(const part of PARTS)this.entries.set(part.id,{id:part.id,version:'1.0.0',families:[],source:`src/yunex/parts-kit/${part.family}`,factory:()=>createPart({variant:part.id,cutaway:true})});}
 register(component:RegisteredComponent){if(this.entries.has(component.id))throw Error(`Component exists: ${component.id}`);if(!/^[a-z][a-z0-9-]+$/.test(component.id)||!component.version||!component.source||!Array.isArray(component.families)||typeof component.factory!=='function')throw Error('Invalid component contract');this.entries.set(component.id,{...component,families:[...component.families]});return this;}
 search(query=''){return [...this.entries.values()].filter(e=>`${e.id} ${e.families.join(' ')}`.includes(query.toLowerCase())).map(({factory,...metadata})=>({...metadata,families:[...metadata.families]}));}
 create(id:string,family?:string){const e=this.entries.get(id);if(!e)throw Error(`Unknown registered component: ${id}`);if(family&&e.families.length&&!e.families.includes(family))throw Error(`Unsupported vehicle family: ${family}`);const root=e.factory();if(!(root instanceof T.Group))throw Error('Component factory must return a fresh Group');root.userData.component={id:e.id,version:e.version,source:e.source,families:[...e.families]};return root;}
 describe(id:string){const root=this.create(id);try{root.updateMatrixWorld(true);const mounts:{name:string;position:number[];direction:number[]}[]=[];root.traverse(o=>{if(o.userData.mount)mounts.push({name:o.userData.mountName,position:root.worldToLocal(o.getWorldPosition(new T.Vector3())).toArray(),direction:o.userData.direction});});const {factory,...metadata}=this.entries.get(id)!;return {...metadata,families:[...metadata.families],dimensions:new T.Box3().setFromObject(root).getSize(new T.Vector3()).toArray(),mounts};}finally{disposeObject(root);}}
}
