// gelicons 0.1.1 by diopside
import { iconIndex } from './gelicons_index.js'; 
 






const geliconCssReset = new CSSStyleSheet(); 
export const buttonStyleText = `
   span.gel-button-description {
      position: absolute; visibility: hidden; 
      opacity: 0; line-height: 0; 
   }  
   .gel-strip-spacer {
      margin: 0 0 0 -.5rem; pointer-events: none; user-select: none;
   }
   button.gel-button  {
      width: 100%; height: 100%;   
      color: inherit; fill: inherit;
      padding: 0; margin: 0; stroke-opacity: 0;
      position: relative; cursor: pointer;  
      background-color: transparent; overflow: visible; 
      border: none; outline: none; appearance: none; 
   } 
   svg.gelicon ~ svg.gelicon {
      position: absolute; top: 0; left: 0;
   }`
geliconCssReset.replaceSync(buttonStyleText);
document.adoptedStyleSheets = [ geliconCssReset, ...document.adoptedStyleSheets ]
 
  
 









const iconBank =  { 
  
   availableIcons: Object.keys(iconIndex),   

   iconExists: (iconName) => (iconName == 'spacer' || iconBank.availableIcons.includes(iconName)),

   getTemplate: (iconName) => iconBank.icons.querySelector(`template.${iconName}.svg-template`),

   getIcon: (name) => iconBank.getTemplate(name)?.content.cloneNode(true) ?? null, 
  
   icons: makeEl('template', {
      id: 'gelicon-templates-container',
      contents: Object.entries(iconIndex) 
      .map(([name, def]) => makeEl('template', { 
         id: `gelicon-${name}-template`,
         class: name + ' svg-template',
         contents: makeEl('svg', {
            contents: def.contents, 
            viewBox: def.viewBox,
            class: `gel-${name}-icon gelicon icon` 
         })
      }))
   }).content,   
 
   parseNames: function(el, attr) {     
      
      if (el.hasAttribute('all'))
         return iconBank.availableIcons; 

      const nameSource = el.hasAttribute(attr) ?
         el.getAttribute(attr).split(/[\,\s]/g)
         : el.getAttributeNames()

      return nameSource.filter( name => name.includes(':') ?
         !(name.split(':').map(iconBank.iconExists).includes(false))
         : iconBank.iconExists(name)) 
   }, 
 
   makeButton: (name, opts, ) => {

      const names = [].concat(name.includes(':') ? name.split(':') : name),
            stopProp = e => e.stopPropagation();

      if (name == 'spacer')
         return makeEl('span', { class: `gel-strip-spacer` });

      return makeEl('button', { 
         contents: names.map( _name => [
            makeEl('span', { class: 'gel-button-description', contents: _name }),
            iconBank.getIcon(_name).children[0]
         ]).flat(),
         class: `gel-button ${names.join(' ')}`,   
         title: `${names.join(' & ')} button`, 
         type: 'button',
         listeners: (opts && opts.noListeners ? undefined : ({ 
            dblclick: stopProp, pointerdown: stopProp, 
            click: function(e) { this.dispatchEvent(
               new CustomEvent(
                  opts?.eventName ?? 'gel-button-command',
                  { bubbles: true, composed: true, detail : { name } }
               ))}
         }))   
      }) 
   }
}








 
Object.entries({

   'gel-icon': function(opts) {  
      if (this.name.length)  
         this.replaceChildren(iconBank.getIcon(this.name))    
   },

   'gel-btn': function(opts) {  
      this.replaceChildren(iconBank.makeButton(this.name, opts))
   },

   'gel-strip': function(opts) {   
      this.replaceChildren( makeEl('template', {
         contents: [].concat(this.name).map( name => 
            iconBank.makeButton(name, opts))  
      }).content )
   }

}).forEach( ([elTag, initFunc]) => {

   if (customElements.get(elTag) === undefined) {

      const nameAttr = {
         'gel-icon'  : 'icon',
         'gel-btn'   : 'button',
         'gel-strip' : 'buttons' }[elTag]; 

      customElements.define(elTag, class extends HTMLElement {

         static get observedAttributes() { return [ nameAttr ] }

         constructor() { super() }

         attributeChangedCallback(prop, oldVal, newVal) { this.connectedCallback() }

         connectedCallback(){
            this.classList.add('gel');
            this.opts = {}
            if (this.hasAttribute('no-listeners'))  
               this.opts['noListeners'] = true  
            if (this.hasAttribute('event-name'))
               this.opts['eventName'] = this.getAttribute('event-name') 
            this.initialize() 
         } 

         initialize() {
            let names = iconBank.parseNames(this, nameAttr)  
            if (names.length === 1) { names = names[0] } 
            if (!this.name || (this.name && this.name !== names)){
               this.name = names;
               initFunc.call(this, this.opts )
            } 
         }   
      })  
   }
}) 





 
 



   
 
function makeEl(tagName, elDef = {}) {    
 
   const el =  ['svg','circle','circ','text','path','g','rect','ellipse'].includes(tagName) ?
         document.createElementNS('http://www.w3.org/2000/svg', tagName) :
         document.createElement(tagName);
  
   if (tagName == 'svg') {
      if (elDef && !elDef.xmlns)
         elDef['xmlns'] = 'http://www.w3.org/2000/svg';
      if (elDef && !elDef.preserveAspectRatio)
         elDef['preserveAspectRatio'] = 'xMidYMid meet' 
   }  

   if (elDef?.contents) {
      const fill = (stuff) => [].concat(stuff).forEach( content => { 
         if (typeof content === 'function') {
            content = content.bind ? content.call(el) : content();
            if (Array.isArray(content)) return fill(content) 
         } 
         else if (content instanceof Element || content instanceof DocumentFragment) 
            (el.content ?? el).appendChild(content) 
         else if (!Array.isArray(content) && content?.length)   
            el.innerHTML = content;      
      })
      fill(elDef.contents)
   }

   if (elDef && (el instanceof Element || el instanceof DocumentFragment)) { 
      Object.entries(elDef).forEach( ([prop, val]) => {
         if ((prop !== 'contents' && prop !== 'listeners') && !['false', 'undefined', 'null', '!'].includes(val+'')) 
            el.setAttribute(prop,  val)   
      })  
      if (elDef?.listeners)  
         Object.entries(elDef.listeners).forEach(
            ([eventType, func]) => el.addEventListener(eventType, func)) 
   }     
   return el
} 
 






export default {
   availableIcons: iconBank.availableIcons,
   iconExists:     iconBank.iconExists,
   getIcon:        iconBank.getIcon,
   makeButton:     iconBank.makeButton
}