import { iconIndex } from './gelicons_index.js';

// gelicons 0.1.1

const iconBank =  { 
 
   availableIcons: Object.keys(iconIndex) ,  

   iconExists: iName => iName == 'spacer' || iconBank.availableIcons.includes(iName),

   icons: makeEl('template', { contents :
      Object.entries(iconIndex).map( ([key,def]) => {
         const dashSepName = camelCaseToDashSep(key)
         return makeEl('template', { 
            id: dashSepName+'-template',
            'class': dashSepName + ' svg-template',
            contents: makeEl('svg', {
               contents: def.contents, 
               viewBox:  def.viewBox,
               class: `gel-${dashSepName}-icon icon` 
            })
         })
      }) }
   ),  

   getNames: function(el, attr) {   
      if (el.hasAttribute('all'))
         return iconBank.availableIcons; 
      return (el.hasAttribute(attr) ?
                  el.getAttribute(attr).split(/[\,\s]/g)
                  : el.getAttributeNames()
            ).filter( name => name.includes(':') ?
               !( name.split(':').map(iconBank.iconExists).includes(false) )
               : iconBank.iconExists(name)
            ) 
   }, 

   getIcon: function(name) { 
      const findTmpl = n => iconBank.icons.content.querySelector(`template.${n}.svg-template`),
            icon = [ name, ...(camelCaseToDashSep(name).split('-').filter( n => n.length > 0)) ]
                     .find(findTmpl); 
         return  findTmpl(icon)?.content.cloneNode(true) ?? null 
   }, 
  
   makeButton: (name, opts, stack = [].concat(name.includes(':') ? name.split(':') : name)) =>
      name == 'spacer' ?
         makeEl('span', { class: `gel-strip-spacer`, style: 'margin: 0 0 0 -.5rem; pointer-events: none; user-select: none;'}) 
         :
         makeEl('button', { 
         contents: stack.map( n =>
            [  makeEl('span', { class: 'button-description', contents: n }),
               iconBank.getIcon(n).children[0] 
            ]).flat(),
         class: `gel-button ` + stack.join(' '),   
         title: stack.join(' & ') + ' button', 
         type: 'button',
         listeners: (opts && opts.noListeners ? undefined :
         ({ 
               dblclick:    function(e) { e.stopPropagation() },
               pointerdown: function(e) { e.stopPropagation() }, 
               click: function(e) {    
                  this.dispatchEvent(
                     new CustomEvent(
                        opts?.eventName ?? 'gel-button-command',
                        {
                           bubbles: true,
                           composed: true,
                           detail : { name }
                        }
                     )
                  )}
               }
            ))   
         }) 
   }
 
 
Object.entries({
   'gel-icon': function() {  
      if (this.name.length)  
         this.replaceChildren(iconBank.getIcon(this.name))    
   },
   'gel-btn': function(opts) {  
      this.replaceChildren(iconBank.makeButton(camelCaseToDashSep(this.name), opts))
   },
   'gel-strip': function(opts) {   
      this.replaceChildren( makeEl('template', {
         contents: [].concat(this.name).map( name => 
            iconBank.makeButton(camelCaseToDashSep(name), opts))  
      }).content )
   }
}).forEach( ([elTag, initFunc]) => {
   if (customElements.get(elTag) === undefined) {
      const nameAttr = {
         'gel-icon'  : 'icon',
         'gel-btn'   : 'button',
         'gel-strip' : 'buttons'
      }[elTag]; 
      customElements.define(elTag, class extends HTMLElement{
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
            let names = iconBank.getNames(this, nameAttr)  
            if (names.length === 1) { names = names[0] } 
            if (!this.name || (this.name && this.name !== names)){
               this.name = names;
               initFunc.call(this, this.opts )
            } 
         } 
      }) 
   }
}) 

export const availableIcons = iconBank.availableIcons
 



   
 ///////////////////////////////////
function camelCaseToDashSep(str) {  
   return str.toLowerCase() !== str ?
      str.replace(/[A-Z]/g, match => ("-"+match.toLowerCase()))
      : str
} 

function isElemOrWindow(obj) {
   return (obj instanceof HTMLElement
        || obj instanceof DocumentFragment
        || obj instanceof SVGElement
        || obj instanceof Window)
} 

function makeEl(tagName, elDef = {}) {    
 
   const el =  ['svg','circle','circ','text','path','g','rect','ellipse'].includes(tagName) ?
         document.createElementNS('http://www.w3.org/2000/svg', tagName) :
         document.createElement(tagName);
  
   if (tagName == 'svg') {
      if (elDef && !elDef.xmlns) elDef['xmlns'] = 'http://www.w3.org/2000/svg';
      if (elDef && !elDef.preserveAspectRatio) elDef['preserveAspectRatio'] = 'xMidYMid meet' 
   }  

   if (elDef?.contents) {
      [].concat(elDef.contents).forEach( content => { 
         if (typeof content === 'function') {
            content = content.bind ? content.call(el) : content();
            if (Array.isArray(content))
               return fill(el, content) 
         } 
         else if (isElemOrWindow(content)) 
            (el.content ?? el).appendChild(content) 
         else if (!Array.isArray(content) && content?.length)   
            el.innerHTML = content;      
      })
   }

   if (elDef && isElemOrWindow(el)) { 
      Object.entries(elDef).forEach( ([prop, val]) => {
         if (prop !== 'contents' && prop !== 'listeners' && !['false', 'undefined', 'null', '!'].includes(val+'')) 
            el.setAttribute(prop,  val)   
      })  
      if (elDef?.listeners) {
         Object.entries(elDef.listeners).forEach( ([eventType, func]) => {  
            el.addEventListener(eventType, func)      
         })
      }
   }     
   return el
} 
////////////////////////////////////////////////////